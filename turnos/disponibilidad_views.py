from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, time, timedelta
from .models import Barbero, Servicio, Turno, EstadoTurno, HorarioAtencion
from .disponibilidad_serializers import (
    DisponibilidadRequestSerializer,
    DisponibilidadResponseSerializer
)


class DisponibilidadView(APIView):
    """
    Vista para calcular la disponibilidad de horarios de un barbero en una fecha específica.
    PÚBLICO: Cualquier persona puede consultar disponibilidad
    
    GET /api/disponibilidad/?fecha=2026-02-15&barbero_id=1&servicio_id=1
    
    Ahora usa horarios personalizados por barbero configurados en HorarioAtencion.
    """
    permission_classes = [AllowAny]
    
    # Duración por defecto si no se especifica servicio
    DURACION_DEFAULT = 60  # minutos (cada 1 hora)
    
    def get(self, request):
        """
        Obtiene los horarios disponibles para un barbero en una fecha específica.
        """
        # Validar parámetros de entrada
        serializer = DisponibilidadRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(
                {'error': 'Parámetros inválidos', 'detalles': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        fecha = serializer.validated_data['fecha']
        barbero_id = serializer.validated_data['barbero_id']
        servicio_id = serializer.validated_data.get('servicio_id')
        
        # Obtener barbero
        try:
            barbero = Barbero.objects.get(id=barbero_id)
        except Barbero.DoesNotExist:
            return Response(
                {'error': 'Barbero no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener duración del servicio (para info, no afecta slots)
        duracion_minutos = self.DURACION_DEFAULT
        servicio_nombre = None
        
        if servicio_id:
            try:
                servicio = Servicio.objects.get(id=servicio_id)
                duracion_minutos = servicio.duracion_minutos
                servicio_nombre = servicio.nombre
            except Servicio.DoesNotExist:
                return Response(
                    {'error': 'Servicio no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Obtener el día de la semana de la fecha (0=Lunes, 6=Domingo)
        dia_semana = fecha.weekday()
        
        # Buscar el horario de atención del barbero para ese día
        try:
            horario = HorarioAtencion.objects.get(
                barbero_id=barbero_id,
                dia_semana=dia_semana
            )
        except HorarioAtencion.DoesNotExist:
            # El barbero no trabaja ese día (franco)
            return Response(
                {
                    'fecha': fecha,
                    'barbero': barbero.nombre,
                    'barbero_id': barbero.id,
                    'servicio': servicio_nombre,
                    'duracion_servicio': duracion_minutos,
                    'total_slots': 0,
                    'slots_disponibles': 0,
                    'slots_ocupados': 0,
                    'horarios': [],
                    'mensaje': f'{barbero.nombre} no tiene horario configurado para este día'
                },
                status=status.HTTP_200_OK
            )
        
        # Generar todos los slots posibles según el horario del barbero
        slots = self._generar_slots_horario_personalizado(horario)
        
        # FILTRAR SLOTS PASADOS SI LA FECHA ES HOY
        fecha_actual = timezone.now().date()
        hora_actual = timezone.now().time()
        
        if fecha == fecha_actual:
            # Filtrar slots cuya hora de inicio ya pasó
            slots = [slot for slot in slots if slot['hora'] > hora_actual]
        
        # Obtener los turnos ya ocupados para ese día y barbero
        # Solo contamos PENDIENTE porque REALIZADO ya pasó y no afecta disponibilidad
        turnos_ocupados = Turno.objects.filter(
            barbero_id=barbero_id,
            fecha=fecha,
            estado=EstadoTurno.PENDIENTE
        ).select_related('servicio')
        
        # Marcar slots ocupados
        slots_con_disponibilidad = self._marcar_slots_ocupados(
            slots, 
            turnos_ocupados
        )
        
        # Calcular estadísticas
        total_slots = len(slots_con_disponibilidad)
        slots_disponibles = sum(1 for s in slots_con_disponibilidad if s['disponible'])
        slots_ocupados = total_slots - slots_disponibles
        
        # Preparar respuesta
        response_data = {
            'fecha': fecha,
            'barbero': barbero.nombre,
            'barbero_id': barbero.id,
            'servicio': servicio_nombre,
            'duracion_servicio': duracion_minutos,
            'total_slots': total_slots,
            'slots_disponibles': slots_disponibles,
            'slots_ocupados': slots_ocupados,
            'horarios': slots_con_disponibilidad
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def _generar_slots_horario_personalizado(self, horario):
        """
        Genera slots de tiempo basados en el horario personalizado del barbero.
        Soporta horarios con descanso intermedio (ej: 9-13 y 16-21).
        
        Args:
            horario (HorarioAtencion): Horario configurado para el barbero
            
        Returns:
            list: Lista de diccionarios con 'hora' y 'hora_fin' (slots de 60 minutos)
        """
        slots = []
        duracion_minutos = 60  # Siempre 60 minutos (1 hora)
        
        # Si hay descanso, generar slots en dos rangos
        if horario.descanso_inicio and horario.descanso_fin:
            # Rango 1: desde inicio hasta descanso
            slots.extend(
                self._generar_slots_rango(
                    horario.hora_inicio,
                    horario.descanso_inicio,
                    duracion_minutos
                )
            )
            
            # Rango 2: desde fin de descanso hasta fin de jornada
            slots.extend(
                self._generar_slots_rango(
                    horario.descanso_fin,
                    horario.hora_fin,
                    duracion_minutos
                )
            )
        else:
            # Sin descanso: generar slots en un solo rango continuo
            slots.extend(
                self._generar_slots_rango(
                    horario.hora_inicio,
                    horario.hora_fin,
                    duracion_minutos
                )
            )
        
        return slots
    
    def _generar_slots_rango(self, hora_inicio, hora_fin, duracion_minutos):
        """
        Genera slots de tiempo para un rango específico.
        
        Args:
            hora_inicio (time): Hora de inicio del rango
            hora_fin (time): Hora de fin del rango
            duracion_minutos (int): Duración de cada slot
            
        Returns:
            list: Lista de slots
        """
        slots = []
        
        # Convertir times a datetime para hacer aritmética
        fecha_base = datetime(2000, 1, 1)
        hora_actual = datetime.combine(fecha_base, hora_inicio)
        hora_limite = datetime.combine(fecha_base, hora_fin)
        delta = timedelta(minutes=duracion_minutos)
        
        while hora_actual + delta <= hora_limite:
            slots.append({
                'hora': hora_actual.time(),
                'hora_fin': (hora_actual + delta).time(),
                'disponible': True  # Por defecto disponible
            })
            hora_actual += delta
        
        return slots
    
    def _marcar_slots_ocupados(self, slots, turnos_ocupados):
        """
        Marca los slots que están ocupados por turnos existentes.
        
        Args:
            slots (list): Lista de slots generados
            turnos_ocupados (QuerySet): Turnos que ocupan tiempo
            
        Returns:
            list: Slots con disponibilidad actualizada
        """
        # Convertir turnos a rangos de tiempo ocupados
        rangos_ocupados = []
        
        for turno in turnos_ocupados:
            hora_inicio = turno.hora
            duracion_servicio = turno.servicio.duracion_minutos
            
            # Calcular hora de fin del turno
            fecha_base = datetime(2000, 1, 1)
            hora_inicio_dt = datetime.combine(fecha_base, hora_inicio)
            hora_fin_dt = hora_inicio_dt + timedelta(minutes=duracion_servicio)
            
            rangos_ocupados.append({
                'inicio': hora_inicio,
                'fin': hora_fin_dt.time()
            })
        
        # Marcar slots que se superponen con rangos ocupados
        for slot in slots:
            for rango in rangos_ocupados:
                # Verificar si hay superposición
                if self._hay_superposicion(
                    slot['hora'], 
                    slot['hora_fin'],
                    rango['inicio'],
                    rango['fin']
                ):
                    slot['disponible'] = False
                    break
        
        return slots
    
    def _hay_superposicion(self, slot_inicio, slot_fin, turno_inicio, turno_fin):
        """
        Verifica si dos rangos de tiempo se superponen.
        
        Args:
            slot_inicio (time): Hora de inicio del slot
            slot_fin (time): Hora de fin del slot
            turno_inicio (time): Hora de inicio del turno
            turno_fin (time): Hora de fin del turno
            
        Returns:
            bool: True si hay superposición
        """
        # Convertir a datetime para comparación
        fecha_base = datetime(2000, 1, 1)
        
        slot_ini = datetime.combine(fecha_base, slot_inicio)
        slot_end = datetime.combine(fecha_base, slot_fin)
        turno_ini = datetime.combine(fecha_base, turno_inicio)
        turno_end = datetime.combine(fecha_base, turno_fin)
        
        # Hay superposición si:
        # - El slot comienza antes de que termine el turno
        # - El slot termina después de que comience el turno
        return slot_ini < turno_end and slot_end > turno_ini
