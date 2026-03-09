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
        
        # Obtener los turnos ya ocupados para ese día y barbero
        # Solo contamos PENDIENTE porque REALIZADO ya pasó y no afecta disponibilidad
        turnos_ocupados = Turno.objects.filter(
            barbero_id=barbero_id,
            fecha=fecha,
            estado=EstadoTurno.PENDIENTE
        ).select_related('servicio')
        
        # FILTRAR SLOTS PASADOS SI LA FECHA ES HOY
        ahora_local = timezone.localtime()
        fecha_actual = ahora_local.date()
        hora_minima = ahora_local.time() if fecha == fecha_actual else None
        
        # Generar slots dinámicos aprovechando espacios libres
        slots_con_disponibilidad = self._generar_slots_dinamicos(
            horario, 
            duracion_minutos, 
            turnos_ocupados,
            hora_minima
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
    
    def _generar_slots_dinamicos(self, horario, duracion_servicio, turnos_ocupados, hora_minima=None):
        """
        Genera slots cada 1 hora, ajustándose dinámicamente cuando encuentra turnos ocupados.
        
        Lógica:
        - Empieza generando slots cada hora desde el inicio (9:00, 10:00, 11:00...)
        - Si un slot cae en un horario ocupado, se mueve al final de ese turno
        - Los slots siguientes se generan cada hora desde ese nuevo punto
        
        Ejemplo:
        - Sin turnos: 9:00, 10:00, 11:00, 12:00...
        - Turno en 10:00-10:20 → Slots: 9:00, 10:20, 11:20, 12:20...
        - Turno en 10:20-11:05 → Slots: 9:00, 11:05, 12:05, 13:05...
        
        Args:
            horario (HorarioAtencion): Horario configurado para el barbero
            duracion_servicio (int): Duración del servicio en minutos
            turnos_ocupados (QuerySet): Turnos ya reservados
            hora_minima (time): Hora mínima para filtrar (si es hoy)
            
        Returns:
            list: Slots disponibles con ajuste dinámico
        """
        fecha_base = datetime(2000, 1, 1)
        
        # 1. Construir rangos ocupados ordenados
        rangos_ocupados = []
        for turno in turnos_ocupados:
            hora_inicio_dt = datetime.combine(fecha_base, turno.hora)
            duracion_turno = turno.servicio.duracion_minutos
            hora_fin_dt = hora_inicio_dt + timedelta(minutes=duracion_turno)
            rangos_ocupados.append({
                'inicio': hora_inicio_dt,
                'fin': hora_fin_dt
            })
        rangos_ocupados.sort(key=lambda x: x['inicio'])
        
        # 2. Obtener rangos de trabajo del barbero
        rangos_trabajo = []
        if horario.descanso_inicio and horario.descanso_fin:
            rangos_trabajo.append({
                'inicio': datetime.combine(fecha_base, horario.hora_inicio),
                'fin': datetime.combine(fecha_base, horario.descanso_inicio)
            })
            rangos_trabajo.append({
                'inicio': datetime.combine(fecha_base, horario.descanso_fin),
                'fin': datetime.combine(fecha_base, horario.hora_fin)
            })
        else:
            rangos_trabajo.append({
                'inicio': datetime.combine(fecha_base, horario.hora_inicio),
                'fin': datetime.combine(fecha_base, horario.hora_fin)
            })
        
        # 3. Generar slots con ajuste dinámico
        slots = []
        
        for rango_trabajo in rangos_trabajo:
            hora_actual = rango_trabajo['inicio']
            
            while hora_actual < rango_trabajo['fin']:
                hora_fin_slot = hora_actual + timedelta(minutes=duracion_servicio)
                
                # Verificar que el slot completo cabe en el rango de trabajo
                if hora_fin_slot > rango_trabajo['fin']:
                    break  # No cabe, salir del loop
                
                # Verificar si hay conflicto con algún turno ocupado
                conflicto_rango = None
                for rango in rangos_ocupados:
                    if hora_actual < rango['fin'] and hora_fin_slot > rango['inicio']:
                        conflicto_rango = rango
                        break
                
                if conflicto_rango:
                    # HAY CONFLICTO: saltar al final del turno ocupado
                    hora_actual = conflicto_rango['fin']
                    # No agregar este slot, continuar con el siguiente
                else:
                    # NO HAY CONFLICTO: agregar el slot como disponible
                    disponible = True
                    
                    # Filtrar por hora mínima si aplica
                    if hora_minima and hora_actual.time() <= hora_minima:
                        disponible = False
                    
                    slots.append({
                        'hora': hora_actual.time(),
                        'hora_fin': hora_fin_slot.time(),
                        'disponible': disponible
                    })
                    
                    # Avanzar 1 hora para el próximo slot
                    hora_actual += timedelta(hours=1)
        
        return slots
    
    def _hay_conflicto_con_rangos(self, slot_inicio, slot_fin, rangos_ocupados):
        """
        Verifica si un slot se superpone con algún rango ocupado.
        
        Args:
            slot_inicio (datetime): Inicio del slot
            slot_fin (datetime): Fin del slot
            rangos_ocupados (list): Lista de rangos ocupados
            
        Returns:
            bool: True si hay conflicto
        """
        for rango in rangos_ocupados:
            # Hay superposición si:
            # - El slot comienza antes de que termine el turno ocupado
            # - El slot termina después de que comience el turno ocupado
            if slot_inicio < rango['fin'] and slot_fin > rango['inicio']:
                return True
        
        return False
    
    def _generar_slots_horario_personalizado(self, horario, duracion_minutos):
        """
        Genera slots de tiempo basados en el horario personalizado del barbero.
        Soporta horarios con descanso intermedio (ej: 9-13 y 16-21).
        
        Args:
            horario (HorarioAtencion): Horario configurado para el barbero
            duracion_minutos (int): Duración del servicio en minutos
            
        Returns:
            list: Lista de diccionarios con 'hora' y 'hora_fin'
        """
        slots = []
        
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
