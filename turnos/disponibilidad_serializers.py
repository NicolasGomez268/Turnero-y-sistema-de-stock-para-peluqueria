from rest_framework import serializers
from datetime import datetime, time, timedelta
from .models import Barbero, Servicio


class DisponibilidadRequestSerializer(serializers.Serializer):
    """Serializer para validar la solicitud de disponibilidad"""
    fecha = serializers.DateField(
        required=True,
        help_text="Fecha en formato YYYY-MM-DD"
    )
    barbero_id = serializers.IntegerField(
        required=True,
        help_text="ID del barbero"
    )
    servicio_id = serializers.IntegerField(
        required=False,
        help_text="ID del servicio (opcional, para calcular slots según duración)"
    )
    
    def validate_fecha(self, value):
        """Validar que la fecha no sea en el pasado"""
        if value < datetime.now().date():
            raise serializers.ValidationError("No se pueden reservar turnos en fechas pasadas")
        return value
    
    def validate_barbero_id(self, value):
        """Validar que el barbero existe y está activo"""
        try:
            barbero = Barbero.objects.get(id=value)
            if not barbero.is_active:
                raise serializers.ValidationError("El barbero no está disponible actualmente")
        except Barbero.DoesNotExist:
            raise serializers.ValidationError("El barbero especificado no existe")
        return value
    
    def validate_servicio_id(self, value):
        """Validar que el servicio existe y está activo"""
        if value:
            try:
                servicio = Servicio.objects.get(id=value)
                if not servicio.is_active:
                    raise serializers.ValidationError("El servicio no está disponible actualmente")
            except Servicio.DoesNotExist:
                raise serializers.ValidationError("El servicio especificado no existe")
        return value


class HorarioDisponibleSerializer(serializers.Serializer):
    """Serializer para cada slot de horario disponible"""
    hora = serializers.TimeField()
    hora_fin = serializers.TimeField()
    disponible = serializers.BooleanField()


class DisponibilidadResponseSerializer(serializers.Serializer):
    """Serializer para la respuesta de disponibilidad"""
    fecha = serializers.DateField()
    barbero = serializers.CharField()
    barbero_id = serializers.IntegerField()
    servicio = serializers.CharField(required=False, allow_null=True)
    duracion_servicio = serializers.IntegerField(help_text="Duración en minutos")
    total_slots = serializers.IntegerField()
    slots_disponibles = serializers.IntegerField()
    slots_ocupados = serializers.IntegerField()
    horarios = HorarioDisponibleSerializer(many=True)
