from django.db import models
from django.core.validators import RegexValidator


class EstadoTurno(models.TextChoices):
    """
    Estados posibles de un turno.
    REALIZADO es vital para calcular la liquidación de sueldos semanal.
    """
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    CONFIRMADO = 'CONFIRMADO', 'Confirmado'
    CANCELADO = 'CANCELADO', 'Cancelado'
    REALIZADO = 'REALIZADO', 'Realizado'


class MetodoPagoTurno(models.TextChoices):
    EFECTIVO      = 'EFECTIVO',      'Efectivo'
    TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia'
    TARJETA       = 'TARJETA',       'Tarjeta'


class Barbero(models.Model):
    """
    Modelo para gestionar el staff de la barbería.
    Incluye is_active para ocultar barberos sin eliminar su historial.
    """
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre completo'
    )
    foto = models.ImageField(
        upload_to='barberos/',
        null=True,
        blank=True,
        verbose_name='Foto de perfil'
    )
    telefono_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="El teléfono debe tener el formato: '+999999999'. Hasta 15 dígitos."
    )
    telefono = models.CharField(
        validators=[telefono_regex],
        max_length=17,
        verbose_name='Teléfono'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Desmarcar para ocultar al barbero sin eliminar su historial'
    )
    is_owner = models.BooleanField(
        default=False,
        verbose_name='Es el dueño',
        help_text='Marcar si este barbero es el dueño del negocio (recibe 100% de sus cortes)'
    )
    porcentaje_casa = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=40.00,
        verbose_name='Porcentaje para la Casa (%)',
        help_text='Porcentaje que se queda la casa por cada corte (ej: 40.00 significa 40%)'
    )
    color_hex = models.CharField(
        max_length=7,
        default='#3B82F6',
        verbose_name='Color identificativo',
        help_text='Color en formato hexadecimal (ej: #3B82F6) para diferenciar turnos en calendario'
    )
    fecha_ingreso = models.DateField(
        auto_now_add=True,
        verbose_name='Fecha de ingreso'
    )

    class Meta:
        verbose_name = 'Barbero'
        verbose_name_plural = 'Barberos'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} {'✓' if self.is_active else '✗'}"


class DiaSemana(models.IntegerChoices):
    """
    Días de la semana.
    """
    LUNES = 0, 'Lunes'
    MARTES = 1, 'Martes'
    MIERCOLES = 2, 'Miércoles'
    JUEVES = 3, 'Jueves'
    VIERNES = 4, 'Viernes'
    SABADO = 5, 'Sábado'
    DOMINGO = 6, 'Domingo'


class HorarioAtencion(models.Model):
    """
    Horarios de atención personalizados por barbero.
    Permite configurar horarios específicos para cada día de la semana,
    incluyendo períodos de descanso (almuerzo).
    """
    barbero = models.ForeignKey(
        Barbero,
        on_delete=models.CASCADE,
        related_name='horarios',
        verbose_name='Barbero'
    )
    dia_semana = models.IntegerField(
        choices=DiaSemana.choices,
        verbose_name='Día de la semana'
    )
    hora_inicio = models.TimeField(
        verbose_name='Hora de inicio',
        help_text='Hora en que comienza a atender'
    )
    hora_fin = models.TimeField(
        verbose_name='Hora de fin',
        help_text='Hora en que termina de atender'
    )
    descanso_inicio = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Inicio de descanso',
        help_text='Opcional: Hora de inicio del almuerzo/descanso'
    )
    descanso_fin = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Fin de descanso',
        help_text='Opcional: Hora de fin del almuerzo/descanso'
    )

    class Meta:
        verbose_name = 'Horario de atención'
        verbose_name_plural = 'Horarios de atención'
        ordering = ['barbero', 'dia_semana', 'hora_inicio']
        unique_together = ['barbero', 'dia_semana']
        indexes = [
            models.Index(fields=['barbero', 'dia_semana']),
        ]

    def __str__(self):
        descanso_text = ''
        if self.descanso_inicio and self.descanso_fin:
            descanso_text = f" (descanso: {self.descanso_inicio.strftime('%H:%M')}-{self.descanso_fin.strftime('%H:%M')})"
        return f"{self.barbero.nombre} - {self.get_dia_semana_display()}: {self.hora_inicio.strftime('%H:%M')}-{self.hora_fin.strftime('%H:%M')}{descanso_text}"

    def clean(self):
        """Validar que los horarios sean coherentes"""
        from django.core.exceptions import ValidationError
        
        if self.hora_inicio >= self.hora_fin:
            raise ValidationError("La hora de inicio debe ser anterior a la hora de fin")
        
        if self.descanso_inicio and self.descanso_fin:
            if self.descanso_inicio >= self.descanso_fin:
                raise ValidationError("El inicio del descanso debe ser anterior al fin del descanso")
            
            if self.descanso_inicio < self.hora_inicio or self.descanso_fin > self.hora_fin:
                raise ValidationError("El descanso debe estar dentro del horario de atención")


class Servicio(models.Model):
    """
    Catálogo de servicios ofrecidos en la barbería.
    """
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del servicio'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio ($)'
    )
    duracion_minutos = models.PositiveIntegerField(
        verbose_name='Duración (minutos)',
        help_text='Tiempo estimado del servicio en minutos'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Desmarcar para ocultar el servicio sin eliminarlo'
    )
    creado_en = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} (${self.precio} - {self.duracion_minutos}min)"


class Turno(models.Model):
    """
    Modelo para gestionar los turnos de la barbería.
    Estado REALIZADO es fundamental para liquidación de sueldos.
    """
    # Datos del turno
    fecha = models.DateField(
        verbose_name='Fecha del turno'
    )
    hora = models.TimeField(
        verbose_name='Hora del turno'
    )
    
    # Relaciones
    barbero = models.ForeignKey(
        Barbero,
        on_delete=models.PROTECT,
        related_name='turnos',
        verbose_name='Barbero asignado'
    )
    servicio = models.ForeignKey(
        Servicio,
        on_delete=models.PROTECT,
        related_name='turnos',
        verbose_name='Servicio solicitado'
    )
    
    # Datos del cliente
    cliente_nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del cliente'
    )
    telefono_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="El teléfono debe tener el formato: '+999999999'. Hasta 15 dígitos."
    )
    cliente_telefono = models.CharField(
        validators=[telefono_regex],
        max_length=17,
        verbose_name='Teléfono del cliente'
    )
    
    # Estado del turno
    estado = models.CharField(
        max_length=20,
        choices=EstadoTurno.choices,
        default=EstadoTurno.PENDIENTE,
        verbose_name='Estado'
    )
    
    # Método de pago (se registra al marcar como REALIZADO)
    metodo_pago = models.CharField(
        max_length=20,
        choices=MetodoPagoTurno.choices,
        null=True,
        blank=True,
        verbose_name='Método de pago'
    )

    # Notas adicionales
    notas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas adicionales'
    )
    
    # Timestamps
    creado_en = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    actualizado_en = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    class Meta:
        verbose_name = 'Turno'
        verbose_name_plural = 'Turnos'
        ordering = ['-fecha', '-hora']
        unique_together = ['fecha', 'hora', 'barbero']
        indexes = [
            models.Index(fields=['fecha', 'barbero']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"{self.cliente_nombre} - {self.fecha} {self.hora} ({self.get_estado_display()})"

    @property
    def duracion_total(self):
        """Retorna la duración del servicio en minutos"""
        return self.servicio.duracion_minutos

    @property
    def precio_total(self):
        """Retorna el precio del servicio"""
        return self.servicio.precio
