from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from decimal import Decimal


class TalleChoices(models.TextChoices):
    """Opciones de talles disponibles"""
    S = 'S', 'Small (S)'
    M = 'M', 'Medium (M)'
    L = 'L', 'Large (L)'
    XL = 'XL', 'Extra Large (XL)'
    XXL = 'XXL', 'Double XL (XXL)'


class MetodoPagoChoices(models.TextChoices):
    """Métodos de pago disponibles"""
    EFECTIVO = 'EFECTIVO', 'Efectivo'
    TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia'
    TARJETA = 'TARJETA', 'Tarjeta'


class Producto(models.Model):
    """
    Modelo para productos de indumentaria (remeras, buzos, accesorios).
    """
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Producto',
        help_text='Ej: Remera Oversize Negra, Buzo con Capucha, Gorra TINCHO'
    )
    
    talle = models.CharField(
        max_length=3,
        choices=TalleChoices.choices,
        verbose_name='Talle',
        help_text='Talle del producto'
    )
    
    precio_costo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Precio de Costo',
        help_text='Cuánto nos costó el producto'
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
        ordering = ['nombre', 'talle']
        unique_together = ['nombre', 'talle']  # No duplicar mismo producto y talle
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['is_active', 'stock_actual']),
        ]
    
    def __str__(self):
        return f"{self.nombre} - Talle {self.talle} (Stock: {self.stock_actual})"
    
    @property
    def margen_ganancia(self):
        """Calcula el margen de ganancia"""
        if self.precio_costo > 0:
            return self.precio_venta - self.precio_costo
        return Decimal('0')
    
    @property
    def porcentaje_ganancia(self):
        """Calcula el porcentaje de ganancia"""
        if self.precio_costo > 0:
            return ((self.precio_venta - self.precio_costo) / self.precio_costo) * 100
        return Decimal('0')
    
    def hay_stock(self, cantidad=1):
        """Verifica si hay suficiente stock"""
        return self.stock_actual >= cantidad
    
    def clean(self):
        """Validaciones personalizadas"""
        if self.precio_venta < self.precio_costo:
            raise ValidationError({
                'precio_venta': 'El precio de venta no puede ser menor al precio de costo.'
            })


class Venta(models.Model):
    """
    Modelo para registrar ventas de productos de indumentaria.
    Al guardar una venta, descuenta automáticamente el stock.
    """
    fecha = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y Hora de Venta'
    )
    
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,  # No permitir eliminar productos con ventas
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
        editable=False  # Se calcula automáticamente
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
        return f"Venta #{self.id} - {self.producto.nombre} x{self.cantidad} (${self.total})"
    
    def clean(self):
        """Validaciones antes de guardar"""
        if self.producto and self.cantidad:
            # Verificar que haya suficiente stock
            if not self.producto.hay_stock(self.cantidad):
                raise ValidationError({
                    'cantidad': f'Stock insuficiente. Solo hay {self.producto.stock_actual} unidades disponibles.'
                })
            
            # Verificar que el producto esté activo
            if not self.producto.is_active:
                raise ValidationError({
                    'producto': 'No se puede vender un producto inactivo.'
                })
    
    def save(self, *args, **kwargs):
        """
        Lógica automática al guardar una venta:
        1. Calcula el total (precio_unitario * cantidad)
        2. Descuenta el stock del producto
        3. Guarda la venta
        """
        # Si es una venta nueva (no tiene ID)
        es_nueva = self.pk is None
        
        if es_nueva:
            # Ejecutar validaciones
            self.full_clean()
            
            # Si no se especificó precio unitario, tomar el precio de venta actual del producto
            if not self.precio_unitario:
                self.precio_unitario = self.producto.precio_venta
            
            # Calcular total automáticamente
            self.total = self.precio_unitario * self.cantidad
            
            # Descontar stock del producto
            self.producto.stock_actual -= self.cantidad
            
            # Validar que no quede en negativo (doble verificación)
            if self.producto.stock_actual < 0:
                raise ValidationError(f'Error: El stock no puede quedar en negativo.')
            
            # Guardar el producto con el nuevo stock
            self.producto.save()
        
        # Guardar la venta
        super().save(*args, **kwargs)
    
    @property
    def ganancia(self):
        """Calcula la ganancia de esta venta"""
        if self.producto:
            margen = self.precio_unitario - self.producto.precio_costo
            return margen * self.cantidad
        return Decimal('0')

