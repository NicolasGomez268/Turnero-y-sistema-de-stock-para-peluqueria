from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BarberoViewSet, ServicioViewSet, TurnoViewSet
from .disponibilidad_views import DisponibilidadView
from .reservar_views import ReservarTurnoView
from .metricas_views import MetricasView, LiquidacionView

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
]
