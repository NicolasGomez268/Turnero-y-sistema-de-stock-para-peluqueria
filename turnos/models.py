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
