from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from decimal import Decimal


class MetodoPagoChoices(models.TextChoices):
    EFECTIVO = 'EFECTIVO', 'Efectivo'
    TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia'
    TARJETA = 'TARJETA', 'Tarjeta'


class Producto(models.Model):
    """
    Modelo genérico para productos del local.
    Puede ser ropa (remeras, buzos), artículos capilares (shampoo, pomada),
    accesorios, o cualquier otro tipo de producto que el negocio comercialice.
    """
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Producto',
        help_text='Ej: Shampoo Keratina, Remera Oversize, Pomada Mate'
    )

    variante = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Variante',
        help_text='Opcional. Ej: "S", "250ml", "Azul", "1kg"'
    )

    categoria = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Categoría',
        help_text='Opcional. Ej: "Ropa", "Capilar", "Accesorios"'
    )

    precio_costo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Precio de Costo',
        help_text='Cuánto costó el producto'
    )

    precio_venta = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Precio de Venta',
        help_text='Precio al que se vende al cliente'
    )

    stock_actual = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Stock Actual',
        help_text='Cantidad disponible en inventario'
    )

    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción adicional del producto'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Si el producto está disponible para la venta'
    )

    creado_en = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )

    actualizado_en = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre', 'variante']
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['categoria']),
            models.Index(fields=['is_active', 'stock_actual']),
        ]

    def __str__(self):
        if self.variante:
            return f"{self.nombre} ({self.variante}) — Stock: {self.stock_actual}"
        return f"{self.nombre} — Stock: {self.stock_actual}"

    @property
    def margen_ganancia(self):
        if self.precio_costo > 0:
            return self.precio_venta - self.precio_costo
        return Decimal('0')

    @property
    def porcentaje_ganancia(self):
        if self.precio_costo > 0:
            return ((self.precio_venta - self.precio_costo) / self.precio_costo) * 100
        return Decimal('0')

    def hay_stock(self, cantidad=1):
        return self.stock_actual >= cantidad

    def clean(self):
        if self.precio_venta and self.precio_costo:
            if self.precio_venta < self.precio_costo:
                raise ValidationError({
                    'precio_venta': 'El precio de venta no puede ser menor al precio de costo.'
                })


class Venta(models.Model):
    """
    Registro de ventas de productos.
    Al guardar, descuenta automáticamente el stock del producto.
    """
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y Hora de Venta'
    )

    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='ventas',
        verbose_name='Producto Vendido'
    )

    cantidad = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Cantidad',
        help_text='Cantidad de unidades vendidas'
    )

    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Precio Unitario',
        help_text='Precio por unidad al momento de la venta'
    )

    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Total',
        help_text='Total de la venta (se calcula automáticamente)',
        editable=False
    )

    metodo_pago = models.CharField(
        max_length=20,
        choices=MetodoPagoChoices.choices,
        default=MetodoPagoChoices.EFECTIVO,
        verbose_name='Método de Pago'
    )

    notas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas',
        help_text='Observaciones adicionales sobre la venta'
    )

    vendedor = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Vendedor',
        help_text='Quién realizó la venta (opcional)'
    )

    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha']),
            models.Index(fields=['producto', '-fecha']),
        ]

    def __str__(self):
        return f"Venta #{self.id} — {self.producto.nombre} x{self.cantidad} (${self.total})"

    def clean(self):
        if self.producto and self.cantidad:
            if not self.producto.hay_stock(self.cantidad):
                raise ValidationError({
                    'cantidad': f'Stock insuficiente. Solo hay {self.producto.stock_actual} unidades disponibles.'
                })
            if not self.producto.is_active:
                raise ValidationError({
                    'producto': 'No se puede vender un producto inactivo.'
                })

    def save(self, *args, **kwargs):
        es_nueva = self.pk is None

        if es_nueva:
            self.full_clean()

            if not self.precio_unitario:
                self.precio_unitario = self.producto.precio_venta

            self.total = self.precio_unitario * self.cantidad

            self.producto.stock_actual -= self.cantidad

            if self.producto.stock_actual < 0:
                raise ValidationError('Error: El stock no puede quedar en negativo.')

            self.producto.save()

        super().save(*args, **kwargs)

    @property
    def ganancia(self):
        if self.producto:
            margen = self.precio_unitario - self.producto.precio_costo
            return margen * self.cantidad
        return Decimal('0')
