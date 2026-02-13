from django.contrib import admin
from django.shortcuts import render
from django.urls import path
from django.db.models import Sum, Count, Q
from django.utils.html import format_html
from datetime import datetime, timedelta
from decimal import Decimal
from .models import Barbero, Servicio, Turno, EstadoTurno, HorarioAtencion, DiaSemana


class HorarioAtencionInline(admin.TabularInline):
    """
    Inline para editar horarios de atención directamente desde el Barbero.
    """
    model = HorarioAtencion
    extra = 1
    fields = ['dia_semana', 'hora_inicio', 'hora_fin', 'descanso_inicio', 'descanso_fin']
    verbose_name = 'Horario de atención'
    verbose_name_plural = 'Horarios de atención'


@admin.register(Barbero)
class BarberoAdmin(admin.ModelAdmin):
    """
    Administración de Barberos en el panel de Django Admin.
    """
    list_display = [
        'nombre',
        'telefono',
        'is_active',
        'color_display',
        'fecha_ingreso',
        'cantidad_turnos'
    ]
    list_filter = ['is_active', 'fecha_ingreso']
    search_fields = ['nombre', 'telefono']
    readonly_fields = ['fecha_ingreso']
    inlines = [HorarioAtencionInline]
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('nombre', 'foto', 'telefono')
        }),
        ('Configuración', {
            'fields': ('is_active', 'color_hex')
        }),
        ('Fechas', {
            'fields': ('fecha_ingreso',),
            'classes': ('collapse',)
        }),
    )

    def color_display(self, obj):
        """Muestra una vista previa del color"""
        return f'<div style="width:30px; height:20px; background-color:{obj.color_hex}; border:1px solid #ccc; border-radius:3px;"></div>'
    color_display.short_description = 'Color'
    color_display.allow_tags = True

    def cantidad_turnos(self, obj):
        """Muestra la cantidad de turnos realizados"""
        return obj.turnos.filter(estado=EstadoTurno.REALIZADO).count()
    cantidad_turnos.short_description = 'Turnos realizados'


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    """
    Administración de Servicios en el panel de Django Admin.
    """
    list_display = [
        'nombre',
        'precio_display',
        'duracion_minutos',
        'is_active',
        'cantidad_turnos',
        'creado_en'
    ]
    list_filter = ['is_active', 'creado_en']
    search_fields = ['nombre', 'descripcion']
    readonly_fields = ['creado_en']
    
    fieldsets = (
        ('Información del Servicio', {
            'fields': ('nombre', 'descripcion')
        }),
        ('Detalles Comerciales', {
            'fields': ('precio', 'duracion_minutos', 'is_active')
        }),
        ('Fechas', {
            'fields': ('creado_en',),
            'classes': ('collapse',)
        }),
    )

    def precio_display(self, obj):
        """Formatea el precio con símbolo de moneda"""
        return f"${obj.precio:,.2f}"
    precio_display.short_description = 'Precio'
    precio_display.admin_order_field = 'precio'

    def cantidad_turnos(self, obj):
        """Muestra la cantidad de turnos con este servicio"""
        return obj.turnos.count()
    cantidad_turnos.short_description = 'Total turnos'


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    """
    Administración de Turnos en el panel de Django Admin.
    """
    list_display = [
        'id',
        'fecha',
        'hora',
        'cliente_nombre',
        'barbero',
        'servicio',
        'estado_badge',
        'precio_total',
        'creado_en'
    ]
    list_filter = [
        'estado',
        'fecha',
        'barbero',
        'servicio',
        'creado_en'
    ]
    search_fields = [
        'cliente_nombre',
        'cliente_telefono',
        'barbero__nombre',
        'servicio__nombre'
    ]
    readonly_fields = ['creado_en', 'actualizado_en', 'precio_total', 'duracion_total']
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Información del Turno', {
            'fields': ('fecha', 'hora', 'estado')
        }),
        ('Asignación', {
            'fields': ('barbero', 'servicio')
        }),
        ('Datos del Cliente', {
            'fields': ('cliente_nombre', 'cliente_telefono')
        }),
        ('Detalles', {
            'fields': ('notas', 'precio_total', 'duracion_total')
        }),
        ('Registro de Cambios', {
            'fields': ('creado_en', 'actualizado_en'),
            'classes': ('collapse',)
        }),
    )

    def estado_badge(self, obj):
        """Muestra el estado con un badge de color"""
        colors = {
            EstadoTurno.PENDIENTE: '#FFA500',
            EstadoTurno.CONFIRMADO: '#4169E1',
            EstadoTurno.CANCELADO: '#DC143C',
            EstadoTurno.REALIZADO: '#32CD32',
        }
        color = colors.get(obj.estado, '#808080')
        return f'<span style="background-color:{color}; color:white; padding:3px 10px; border-radius:3px; font-weight:bold;">{obj.get_estado_display()}</span>'
    estado_badge.short_description = 'Estado'
    estado_badge.allow_tags = True

    # Acciones personalizadas
    actions = ['marcar_confirmado', 'marcar_realizado', 'marcar_cancelado']

    def marcar_confirmado(self, request, queryset):
        """Marca los turnos seleccionados como confirmados"""
        updated = queryset.update(estado=EstadoTurno.CONFIRMADO)
        self.message_user(request, f'{updated} turno(s) marcado(s) como CONFIRMADO.')
    marcar_confirmado.short_description = '✓ Marcar como CONFIRMADO'

    def marcar_realizado(self, request, queryset):
        """Marca los turnos seleccionados como realizados"""
        updated = queryset.update(estado=EstadoTurno.REALIZADO)
        self.message_user(request, f'{updated} turno(s) marcado(s) como REALIZADO.')
    marcar_realizado.short_description = '✓ Marcar como REALIZADO'

    def marcar_cancelado(self, request, queryset):
        """Marca los turnos seleccionados como cancelados"""
        updated = queryset.update(estado=EstadoTurno.CANCELADO)
        self.message_user(request, f'{updated} turno(s) marcado(s) como CANCELADO.')
    marcar_cancelado.short_description = '✗ Marcar como CANCELADO'


# ==================================================================================
# VISTA PERSONALIZADA: REPORTE DE LIQUIDACIÓN SEMANAL
# ==================================================================================

class LiquidacionAdminView:
    """
    Vista personalizada para generar reportes de liquidación de barberos.
    Permite seleccionar rango de fechas y calcular pagos.
    """
    
    def get_urls(self):
        """Agrega URL personalizada al admin"""
        urls = super().get_urls()
        custom_urls = [
            path('liquidacion/', self.admin_site.admin_view(self.reporte_liquidacion), name='turnos_liquidacion'),
        ]
        return custom_urls + urls
    
    def reporte_liquidacion(self, request):
        """Vista del reporte de liquidación"""
        # Obtener parámetros de fecha del request
        fecha_inicio_str = request.GET.get('fecha_inicio')
        fecha_fin_str = request.GET.get('fecha_fin')
        
        # Valores por defecto: última semana
        if not fecha_inicio_str or not fecha_fin_str:
            hoy = datetime.now().date()
            # Lunes de la semana actual
            dias_desde_lunes = hoy.weekday()
            fecha_inicio = hoy - timedelta(days=dias_desde_lunes + 7)  # Lunes semana pasada
            fecha_fin = fecha_inicio + timedelta(days=6)  # Domingo semana pasada
        else:
            fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        
        # Obtener todos los barberos activos
        barberos = Barbero.objects.filter(is_active=True)
        
        # Calcular liquidación para cada barbero
        reporte = []
        total_general = Decimal('0')
        total_turnos = 0
        total_a_pagar = Decimal('0')
        
        for barbero in barberos:
            # Filtrar turnos REALIZADOS en el rango de fechas
            turnos = Turno.objects.filter(
                barbero=barbero,
                fecha__gte=fecha_inicio,
                fecha__lte=fecha_fin,
                estado=EstadoTurno.REALIZADO
            ).select_related('servicio')
            
            # Calcular totales
            cantidad_turnos = turnos.count()
            total_bruto = sum(turno.precio_total for turno in turnos) if cantidad_turnos > 0 else Decimal('0')
            
            # Calcular comisión (60% para el barbero, 40% para la casa)
            comision_barbero = total_bruto * Decimal('0.60')
            comision_casa = total_bruto * Decimal('0.40')
            
            reporte.append({
                'barbero': barbero,
                'cantidad_turnos': cantidad_turnos,
                'total_bruto': total_bruto,
                'comision_barbero': comision_barbero,
                'comision_casa': comision_casa,
                'turnos_detalle': turnos
            })
            
            total_general += total_bruto
            total_turnos += cantidad_turnos
            total_a_pagar += comision_barbero
        
        context = {
            'title': 'Reporte de Liquidación Semanal',
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'reporte': reporte,
            'total_general': total_general,
            'total_turnos': total_turnos,
            'total_a_pagar': total_a_pagar,
            'total_para_casa': total_general - total_a_pagar,
            'opts': Turno._meta,
            'has_view_permission': True,
        }
        
        return render(request, 'admin/turnos/liquidacion.html', context)


# Extender TurnoAdmin con la vista de liquidación
class TurnoAdminExtended(TurnoAdmin, LiquidacionAdminView):
    pass

# Re-registrar Turno con la clase extendida
admin.site.unregister(Turno)
admin.site.register(Turno, TurnoAdminExtended)


# Configuración del sitio de administración
admin.site.site_header = 'TINCHO Barbería & Indumentaria'
admin.site.site_title = 'Admin TINCHO'
admin.site.index_title = 'Panel de Administración'
