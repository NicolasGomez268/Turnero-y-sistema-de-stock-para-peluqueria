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
    path('admin/turnos/semanales/', get_turnos_semanales, name='admin-turnos-semanales'),
    path('admin/turnos/<int:turno_id>/marcar-realizado/', marcar_turno_realizado, name='admin-marcar-realizado'),
    path('admin/turnos/<int:turno_id>/cancelar/', cancelar_turno, name='admin-cancelar-turno'),
]
