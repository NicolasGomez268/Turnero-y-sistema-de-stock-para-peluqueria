from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q
from datetime import datetime, time, timedelta
from .models import Barbero, Servicio, Turno, EstadoTurno
from .disponibilidad_serializers import (
    DisponibilidadRequestSerializer,
    DisponibilidadResponseSerializer
)


class DisponibilidadView(APIView):
    """
    Vista para calcular la disponibilidad de horarios de un barbero en una fecha específica.
    PÚBLICO: Cualquier persona puede consultar disponibilidad
    
    GET /api/disponibilidad/?fecha=2026-02-15&barbero_id=1&servicio_id=1
    """
    permission_classes = [AllowAny]
    
    # Configuración de horarios de atención
    HORARIO_MANANA_INICIO = time(9, 0)   # 09:00
    HORARIO_MANANA_FIN = time(13, 0)     # 13:00
    HORARIO_TARDE_INICIO = time(16, 0)   # 16:00
    HORARIO_TARDE_FIN = time(21, 0)      # 21:00
    
    # Duración por defecto si no se especifica servicio
    DURACION_DEFAULT = 30  # minutos
    
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
        
        # Obtener duración del servicio
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
        
        # Generar todos los slots posibles
        slots = self._generar_slots(duracion_minutos)
        
        # Obtener turnos ocupados para ese barbero en esa fecha
        turnos_ocupados = Turno.objects.filter(
            barbero_id=barbero_id,
            fecha=fecha,
            estado__in=[EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO]
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
    
    def _generar_slots(self, duracion_minutos):
        """
        Genera todos los slots de tiempo posibles según el horario de atención.
        
        Args:
            duracion_minutos (int): Duración del servicio en minutos
            
        Returns:
            list: Lista de diccionarios con 'hora' y 'hora_fin'
        """
        slots = []
        
        # Generar slots de la mañana (09:00 - 13:00)
        slots.extend(
            self._generar_slots_rango(
                self.HORARIO_MANANA_INICIO,
                self.HORARIO_MANANA_FIN,
                duracion_minutos
            )
        )
        
        # Generar slots de la tarde (16:00 - 21:00)
        slots.extend(
            self._generar_slots_rango(
                self.HORARIO_TARDE_INICIO,
                self.HORARIO_TARDE_FIN,
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
