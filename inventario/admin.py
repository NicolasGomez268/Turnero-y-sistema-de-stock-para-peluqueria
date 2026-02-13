from django.contrib import admin
from django.utils.html import format_html
from .models import Producto, Venta


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    """
    Administración de Productos de Indumentaria.
    """
    list_display = [
        'nombre',
        'talle',
        'precio_costo_display',
        'precio_venta_display',
        'stock_display',
        'margen_display',
        'is_active',
        'creado_en'
    ]
    
    list_filter = [
        'is_active',
        'talle',
        'creado_en'
    ]
    
    search_fields = [
        'nombre',
        'descripcion'
    ]
    
    readonly_fields = [
        'creado_en',
        'actualizado_en',
        'margen_ganancia',
        'porcentaje_ganancia'
    ]
    
    list_editable = ['is_active']
    
    fieldsets = (
        ('Información del Producto', {
            'fields': ('nombre', 'talle', 'descripcion', 'is_active')
        }),
        ('Precios', {
            'fields': ('precio_costo', 'precio_venta', 'margen_ganancia', 'porcentaje_ganancia')
        }),
        ('Inventario', {
            'fields': ('stock_actual',)
        }),
        ('Fechas', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )
    
    def precio_costo_display(self, obj):
        """Formatea el precio de costo"""
        return f"${obj.precio_costo:,.2f}"
    precio_costo_display.short_description = 'Precio Costo'
    precio_costo_display.admin_order_field = 'precio_costo'
    
    def precio_venta_display(self, obj):
        """Formatea el precio de venta"""
        return f"${obj.precio_venta:,.2f}"
    precio_venta_display.short_description = 'Precio Venta'
    precio_venta_display.admin_order_field = 'precio_venta'
    
    def stock_display(self, obj):
        """Muestra el stock con color según disponibilidad"""
        if obj.stock_actual == 0:
            color = '#DC143C'  # Rojo
            icon = '❌'
        elif obj.stock_actual <= 5:
            color = '#FFA500'  # Naranja
            icon = '⚠️'
        else:
            color = '#32CD32'  # Verde
            icon = '✅'
        
        return format_html(
            '<span style="color:{}; font-weight:bold;">{} {} unidades</span>',
            color, icon, obj.stock_actual
        )
    stock_display.short_description = 'Stock'
    stock_display.admin_order_field = 'stock_actual'
    
    def margen_display(self, obj):
        """Muestra el margen de ganancia"""
        margen = obj.margen_ganancia
        porcentaje = obj.porcentaje_ganancia
        return format_html(
            '<span style="color:#32CD32; font-weight:bold;">${:,.2f} ({}%)</span>',
            margen, int(porcentaje)
        )
    margen_display.short_description = 'Margen'
    
    # Acciones personalizadas
    actions = ['marcar_sin_stock', 'marcar_activo', 'marcar_inactivo']
    
    def marcar_sin_stock(self, request, queryset):
        """Marca productos como sin stock"""
        updated = queryset.update(stock_actual=0)
        self.message_user(request, f'{updated} producto(s) marcado(s) sin stock.')
    marcar_sin_stock.short_description = 'Marcar como SIN STOCK'
    
    def marcar_activo(self, request, queryset):
        """Activa productos seleccionados"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} producto(s) activado(s).')
    marcar_activo.short_description = '✓ Activar productos'
    
    def marcar_inactivo(self, request, queryset):
        """Desactiva productos seleccionados"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} producto(s) desactivado(s).')
    marcar_inactivo.short_description = '✗ Desactivar productos'


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    """
    Administración de Ventas de Indumentaria.
    Permite registrar ventas manualmente desde el admin.
    """
    list_display = [
        'id',
        'fecha',
        'producto',
        'cantidad',
        'precio_unitario_display',
        'total_display',
        'metodo_pago',
        'vendedor',
        'ganancia_display'
    ]
    
    list_filter = [
        'metodo_pago',
        'fecha',
        'producto__nombre'
    ]
    
    search_fields = [
        'producto__nombre',
        'vendedor',
        'notas'
    ]
    
    readonly_fields = [
        'fecha',
        'total',
        'ganancia_calculada'
    ]
    
    date_hierarchy = 'fecha'
    
    autocomplete_fields = ['producto']  # Autocompletado para buscar productos
    
    fieldsets = (
        ('Información de la Venta', {
            'fields': ('producto', 'cantidad', 'precio_unitario', 'total')
        }),
        ('Detalles de Pago', {
            'fields': ('metodo_pago', 'vendedor')
        }),
        ('Información Adicional', {
            'fields': ('notas', 'fecha', 'ganancia_calculada'),
            'classes': ('collapse',)
        }),
    )
    
    def precio_unitario_display(self, obj):
        """Formatea el precio unitario"""
        return f"${obj.precio_unitario:,.2f}"
    precio_unitario_display.short_description = 'Precio Unit.'
    precio_unitario_display.admin_order_field = 'precio_unitario'
    
    def total_display(self, obj):
        """Formatea el total con estilo"""
        return format_html(
            '<span style="color:#32CD32; font-weight:bold; font-size:14px;">${:,.2f}</span>',
            obj.total
        )
    total_display.short_description = 'Total'
    total_display.admin_order_field = 'total'
    
    def ganancia_display(self, obj):
        """Muestra la ganancia de la venta"""
        ganancia = obj.ganancia
        return format_html(
            '<span style="color:#FFD700; font-weight:bold;">+${:,.2f}</span>',
            ganancia
        )
    ganancia_display.short_description = 'Ganancia'
    
    def ganancia_calculada(self, obj):
        """Muestra la ganancia calculada en el detail"""
        if obj.id:
            return f"${obj.ganancia:,.2f}"
        return "-"
    ganancia_calculada.short_description = 'Ganancia Calculada'
    
    def get_readonly_fields(self, request, obj=None):
        """Si la venta ya existe, no permitir modificarla"""
        if obj:  # Editando venta existente
            return self.readonly_fields + ['producto', 'cantidad', 'precio_unitario', 
                                          'metodo_pago', 'vendedor', 'notas']
        return self.readonly_fields
    
    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar ventas (preservar historial)"""
        return False


# Configuración adicional del sitio
admin.site.site_header = 'TINCHO Barbería & Indumentaria'
