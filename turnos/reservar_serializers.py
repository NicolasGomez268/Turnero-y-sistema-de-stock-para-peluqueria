from rest_framework import serializers
from .models import Turno, Barbero, Servicio
from datetime import datetime


class ReservarTurnoSerializer(serializers.ModelSerializer):
    """
    Serializer para que los clientes puedan reservar turnos (público).
    """
    class Meta:
        model = Turno
        fields = [
            'fecha',
            'hora',
            'barbero',
            'servicio',
            'cliente_nombre',
            'cliente_telefono',
            'notas'
        ]
        
    def validate_fecha(self, value):
        """Validar que la fecha no sea en el pasado"""
        if value < datetime.now().date():
            raise serializers.ValidationError("No se pueden reservar turnos en fechas pasadas")
        return value
    
    def validate_barbero(self, value):
        """Validar que el barbero esté activo"""
        if not value.is_active:
            raise serializers.ValidationError("El barbero seleccionado no está disponible")
        return value
    
    def validate_servicio(self, value):
        """Validar que el servicio esté activo"""
        if not value.is_active:
            raise serializers.ValidationError("El servicio seleccionado no está disponible")
        return value
    
    def validate(self, data):
        """Validar que el horario esté disponible"""
        from datetime import datetime
        
        fecha = data.get('fecha')
        hora = data.get('hora')
        barbero = data.get('barbero')
        
        # Convertir hora string a objeto time si es necesario
        if isinstance(hora, str):
            hora_obj = datetime.strptime(hora, '%H:%M:%S').time()
        else:
            hora_obj = hora
        
        # Verificar si ya existe un turno en ese horario
        conflicto = Turno.objects.filter(
            fecha=fecha,
            hora=hora_obj,
            barbero=barbero,
            estado__in=['PENDIENTE', 'CONFIRMADO']
        ).exists()
        
        if conflicto:
            raise serializers.ValidationError(
                "El horario seleccionado ya no está disponible. Por favor, elija otro horario."
            )
        
        return data


class TurnoReservadoResponseSerializer(serializers.ModelSerializer):
    """Serializer para la respuesta después de reservar"""
    barbero_nombre = serializers.CharField(source='barbero.nombre', read_only=True)
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)
    precio_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Turno
        fields = [
            'id',
            'fecha',
            'hora',
            'barbero_nombre',
            'servicio_nombre',
            'cliente_nombre',
            'cliente_telefono',
            'precio_total',
            'estado',
            'estado_display',
            'notas',
            'creado_en'
        ]
