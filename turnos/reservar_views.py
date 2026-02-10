from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Turno, EstadoTurno
from .reservar_serializers import ReservarTurnoSerializer, TurnoReservadoResponseSerializer


class ReservarTurnoView(APIView):
    """
    Vista PÚBLICA para que los clientes reserven turnos.
    No requiere autenticación.
    
    POST /api/reservar/
    Body: {
        "fecha": "2026-02-15",
        "hora": "10:00",
        "barbero": 1,
        "servicio": 1,
        "cliente_nombre": "Juan Pérez",
        "cliente_telefono": "+541112345678",
        "notas": "Opcional"
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Crear una nueva reserva de turno"""
        serializer = ReservarTurnoSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Datos inválidos',
                    'detalles': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear el turno con estado PENDIENTE
        turno = serializer.save(estado=EstadoTurno.PENDIENTE)
        
        # Preparar respuesta
        response_serializer = TurnoReservadoResponseSerializer(turno)
        
        return Response(
            {
                'mensaje': '¡Turno reservado exitosamente!',
                'turno': response_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
