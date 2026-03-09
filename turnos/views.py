from django.shortcuts import render
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authentication import TokenAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from .models import Barbero, Servicio, Turno
from .serializers import BarberoSerializer, ServicioSerializer, TurnoSerializer
from .permissions import IsAdminOrReadOnly


class BarberoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gestionar barberos.
    PÚBLICO: GET (listar barberos activos)
    PRIVADO: POST, PUT, DELETE (solo admin)
    """
    queryset = Barbero.objects.all()
    serializer_class = BarberoSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'telefono']
    ordering_fields = ['nombre', 'fecha_ingreso']
    ordering = ['nombre']
    pagination_class = None  # Sin paginación para barberos

    def get_queryset(self):
        """Filtrar solo barberos activos si se pasa el parámetro ?active=true"""
        queryset = super().get_queryset()
        active = self.request.query_params.get('active', None)
        if active and active.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset


class ServicioViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gestionar servicios.
    PÚBLICO: GET (listar servicios)
    PRIVADO: POST, PUT, DELETE (solo admin)
    """
    queryset = Servicio.objects.all()
    serializer_class = ServicioSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'precio', 'duracion_minutos']
    ordering = ['nombre']
    pagination_class = None  # Sin paginación para servicios

    def get_queryset(self):
        """Filtrar solo servicios activos si se pasa el parámetro ?active=true"""
        queryset = super().get_queryset()
        active = self.request.query_params.get('active', None)
        if active and active.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        """
        Eliminar servicio verificando que no tenga turnos asociados.
        Si tiene turnos, devuelve error 400 con mensaje descriptivo.
        """
        servicio = self.get_object()
        turnos_count = servicio.turnos.count()
        
        if turnos_count > 0:
            return Response(
                {
                    'error': 'No se puede eliminar el servicio',
                    'mensaje': f'El servicio "{servicio.nombre}" tiene {turnos_count} turno(s) asociado(s).',
                    'sugerencia': 'Desactiva el servicio en lugar de eliminarlo para mantener el historial de turnos.',
                    'turnos_count': turnos_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)


class TurnoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gestionar turnos.
    PRIVADO: Solo admin puede ver/modificar todos los turnos
    """
    queryset = Turno.objects.select_related('barbero', 'servicio').all()
    serializer_class = TurnoSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'barbero', 'servicio', 'fecha']
    search_fields = ['cliente_nombre', 'cliente_telefono']
    ordering_fields = ['fecha', 'hora', 'creado_en']
    ordering = ['-fecha', '-hora']
    pagination_class = None  # Sin paginación - el frontend no maneja navegación entre páginas

