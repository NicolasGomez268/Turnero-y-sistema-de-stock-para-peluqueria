from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BarberoViewSet, ServicioViewSet, TurnoViewSet
from .disponibilidad_views import DisponibilidadView
from .reservar_views import ReservarTurnoView
from .metricas_views import MetricasView, LiquidacionView
from .admin_views import (
    admin_login,
    get_turnos_fecha,
    get_turnos_semanales,
    marcar_turno_realizado,
    cancelar_turno,
)
from .liquidacion_views import (
    liquidacion_semanal,
    caja_diaria,
    metricas_mensuales,
)
from .barberos_views import (
    manage_barberos_list,
    update_barbero,
    upload_barbero_photo,
    manage_barbero_horarios,
)

# Router para las APIs de la app
router = DefaultRouter()
router.register(r'barberos', BarberoViewSet, basename='barbero')
router.register(r'servicios', ServicioViewSet, basename='servicio')
router.register(r'turnos', TurnoViewSet, basename='turno')

urlpatterns = [
    path('', include(router.urls)),
    
    # Endpoints públicos (clientes)
    path('disponibilidad/', DisponibilidadView.as_view(), name='disponibilidad'),
    path('reservar/', ReservarTurnoView.as_view(), name='reservar'),
    
    # Endpoints privados (administradores)
    path('metricas/', MetricasView.as_view(), name='metricas'),
    path('liquidacion/', LiquidacionView.as_view(), name='liquidacion'),
    
    # Panel Admin React
    path('admin/login/', admin_login, name='admin-login'),
    path('admin/turnos/', get_turnos_fecha, name='admin-turnos'),
    path('admin/turnos/manual/', crear_turno_manual, name='admin-crear-turno-manual'),
    path('admin/turnos/semanales/', get_turnos_semanales, name='admin-turnos-semanales'),
    path('admin/turnos/<int:turno_id>/marcar-realizado/', marcar_turno_realizado, name='admin-marcar-realizado'),
    path('admin/turnos/<int:turno_id>/cancelar/', cancelar_turno, name='admin-cancelar-turno'),
        
    # Liquidación y Caja
    path('admin/liquidacion/', liquidacion_semanal, name='admin-liquidacion'),
    path('admin/caja-diaria/', caja_diaria, name='admin-caja-diaria'),
    path('admin/metricas-mensuales/', metricas_mensuales, name='admin-metricas-mensuales'),
    
    # Gestión de Barberos (REST API completo)
    path('barberos/', manage_barberos_list, name='barberos-list'),  # GET (listar) / POST (crear)
    path('barberos/<int:barbero_id>/', update_barbero, name='barbero-detail'),  # PUT (actualizar)
    path('barberos/<int:barbero_id>/foto/', upload_barbero_photo, name='barbero-foto'),  # PATCH (subir foto)
    path('barberos/<int:barbero_id>/horarios/', manage_barbero_horarios, name='barbero-horarios'),  # GET/PUT horarios
]
