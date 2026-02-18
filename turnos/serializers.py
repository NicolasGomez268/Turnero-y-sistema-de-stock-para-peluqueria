from rest_framework import serializers
from .models import Barbero, Servicio, Turno, EstadoTurno, HorarioAtencion


class BarberoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Barbero"""
    cantidad_turnos_realizados = serializers.SerializerMethodField()
    
    class Meta:
        model = Barbero
        fields = [
            'id',
            'nombre',
            'foto',
            'telefono',
            'is_active',
            'is_owner',
            'porcentaje_casa',
            'color_hex',
            'fecha_ingreso',
            'cantidad_turnos_realizados'
        ]
        read_only_fields = ['fecha_ingreso']

    def get_cantidad_turnos_realizados(self, obj):
        """Retorna la cantidad de turnos realizados por este barbero"""
        return obj.turnos.filter(estado=EstadoTurno.REALIZADO).count()


class HorarioAtencionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo HorarioAtencion"""
    barbero_nombre = serializers.CharField(source='barbero.nombre', read_only=True)
    dia_semana_display = serializers.CharField(source='get_dia_semana_display', read_only=True)
    
    class Meta:
        model = HorarioAtencion
        fields = [
            'id',
            'barbero',
            'barbero_nombre',
            'dia_semana',
            'dia_semana_display',
            'hora_inicio',
            'hora_fin',
            'descanso_inicio',
            'descanso_fin',
        ]


class ServicioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Servicio"""
    precio_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Servicio
        fields = [
            'id',
            'nombre',
            'descripcion',
            'precio',
            'precio_display',
            'duracion_minutos',
            'is_active',
            'creado_en'
        ]
        read_only_fields = ['creado_en']

    def get_precio_display(self, obj):
        """Retorna el precio formateado"""
        return f"${obj.precio:,.2f}"


class TurnoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Turno"""
    barbero_nombre = serializers.CharField(source='barbero.nombre', read_only=True)
    barbero_color = serializers.CharField(source='barbero.color_hex', read_only=True)
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    precio_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    duracion_total = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Turno
        fields = [
            'id',
            'fecha',
            'hora',
            'barbero',
            'barbero_nombre',
            'barbero_color',
            'servicio',
            'servicio_nombre',
            'cliente_nombre',
            'cliente_telefono',
            'estado',
            'estado_display',
            'notas',
            'precio_total',
            'duracion_total',
            'creado_en',
            'actualizado_en'
        ]
        read_only_fields = ['creado_en', 'actualizado_en', 'precio_total', 'duracion_total']

    def validate(self, data):
        """
        Validación personalizada para evitar que un barbero tenga dos turnos
        en el mismo horario
        """
        fecha = data.get('fecha')
        hora = data.get('hora')
        barbero = data.get('barbero')
        
        # Si estamos actualizando, excluir el turno actual
        turno_id = self.instance.id if self.instance else None
        
        # Verificar si ya existe un turno para ese barbero en esa fecha/hora
        conflicto = Turno.objects.filter(
            fecha=fecha,
            hora=hora,
            barbero=barbero
        ).exclude(id=turno_id).exists()
        
        if conflicto:
            raise serializers.ValidationError(
                f"El barbero {barbero.nombre} ya tiene un turno asignado para {fecha} a las {hora}"
            )
        
        return data


class TurnoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar turnos (más rápido)"""
    barbero_nombre = serializers.CharField(source='barbero.nombre', read_only=True)
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)
    
    class Meta:
        model = Turno
        fields = [
            'id',
            'fecha',
            'hora',
            'barbero_nombre',
            'servicio_nombre',
            'cliente_nombre',
            'estado'
        ]


class TurnoAdminSerializer(serializers.ModelSerializer):
    """Serializer para el panel de administración con todos los datos necesarios"""
    barbero_nombre = serializers.CharField(source='barbero.nombre', read_only=True)
    servicio_nombre = serializers.CharField(source='servicio.nombre', read_only=True)
    servicio_precio = serializers.DecimalField(
        source='servicio.precio', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = Turno
        fields = [
            'id',
            'fecha',
            'hora',
            'barbero',
            'barbero_nombre',
            'servicio',
            'servicio_nombre',
            'servicio_precio',
            'cliente_nombre',
            'cliente_telefono',
            'estado',
            'notas',
            'creado_en',
        ]
        read_only_fields = ['creado_en']


class LiquidacionBarberoSerializer(serializers.Serializer):
    """Serializer para liquidación individual de barbero"""
    barbero_id = serializers.IntegerField()
    barbero_nombre = serializers.CharField()
    es_dueno = serializers.BooleanField()
    cantidad_turnos = serializers.IntegerField()
    total_bruto = serializers.DecimalField(max_digits=10, decimal_places=2)
    porcentaje_barbero = serializers.DecimalField(max_digits=5, decimal_places=2)
    comision_barbero = serializers.DecimalField(max_digits=10, decimal_places=2)
    comision_casa = serializers.DecimalField(max_digits=10, decimal_places=2)


class ResumenCajaDiariaSerializer(serializers.Serializer):
    """Serializer para resumen de caja del día"""
    fecha = serializers.DateField()
    total_turnos_realizados = serializers.IntegerField()
    total_ingresos_turnos = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_ventas_productos = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_general = serializers.DecimalField(max_digits=10, decimal_places=2)
    desglose_metodos_pago = serializers.DictField()
