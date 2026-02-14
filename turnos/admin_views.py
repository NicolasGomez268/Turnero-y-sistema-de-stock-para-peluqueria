"""
Views de administración para el panel React Admin
Maneja la autenticación y gestión de turnos desde el frontend
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from rest_framework.authtoken.models import Token
from .models import Turno
from .serializers import TurnoSerializer


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Endpoint de autenticación para el panel admin
    POST /api/admin/login/
    Body: { "username": "...", "password": "..." }
    Return: { "token": "...", "user": { "username": "...", "is_staff": true } }
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Usuario y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_staff:
        return Response(
            {'error': 'Acceso denegado. Solo administradores.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Crear o recuperar token
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_turnos_fecha(request):
    """
    Obtener turnos de una fecha específica
    GET /api/admin/turnos/?fecha=YYYY-MM-DD
    """
    fecha_str = request.query_params.get('fecha')
    
    if not fecha_str:
        # Si no se especifica fecha, usar hoy
        fecha = timezone.now().date()
    else:
        try:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Usar YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Obtener turnos de la fecha
    turnos = Turno.objects.filter(fecha=fecha).select_related(
        'barbero', 'servicio'
    ).order_by('hora')
    
    # Serializar y agregar nombres
    turnos_data = []
    for turno in turnos:
        data = TurnoSerializer(turno).data
        data['barbero_nombre'] = turno.barbero.nombre
        data['servicio_nombre'] = turno.servicio.nombre
        data['servicio_precio'] = str(turno.servicio.precio)
        turnos_data.append(data)
    
    return Response(turnos_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_turnos_semanales(request):
    """
    Obtener turnos de los últimos 7 días (para métricas)
    GET /api/admin/turnos/semanales/
    """
    fecha_inicio = timezone.now().date() - timedelta(days=7)
    fecha_fin = timezone.now().date()
    
    turnos = Turno.objects.filter(
        fecha__gte=fecha_inicio,
        fecha__lte=fecha_fin
    ).select_related('barbero', 'servicio').order_by('-fecha', 'hora')
    
    # Serializar
    turnos_data = []
    for turno in turnos:
        data = TurnoSerializer(turno).data
        data['barbero_nombre'] = turno.barbero.nombre
        data['servicio_nombre'] = turno.servicio.nombre
        data['servicio_precio'] = str(turno.servicio.precio)
        turnos_data.append(data)
    
    return Response(turnos_data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def marcar_turno_realizado(request, turno_id):
    """
    Marcar un turno como REALIZADO
    PATCH /api/admin/turnos/{id}/marcar-realizado/
    """
    try:
        turno = Turno.objects.get(id=turno_id)
    except Turno.DoesNotExist:
        return Response(
            {'error': 'Turno no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if turno.estado != 'PENDIENTE':
        return Response(
            {'error': f'El turno ya está en estado: {turno.estado}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    turno.estado = 'REALIZADO'
    turno.save()
    
    data = TurnoSerializer(turno).data
    data['barbero_nombre'] = turno.barbero.nombre
    data['servicio_nombre'] = turno.servicio.nombre
    
    return Response({
        'message': 'Turno marcado como REALIZADO',
        'turno': data
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cancelar_turno(request, turno_id):
    """
    Cancelar un turno
    PATCH /api/admin/turnos/{id}/cancelar/
    """
    try:
        turno = Turno.objects.get(id=turno_id)
    except Turno.DoesNotExist:
        return Response(
            {'error': 'Turno no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if turno.estado == 'CANCELADO':
        return Response(
            {'error': 'El turno ya está cancelado'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    turno.estado = 'CANCELADO'
    turno.save()
    
    data = TurnoSerializer(turno).data
    data['barbero_nombre'] = turno.barbero.nombre
    data['servicio_nombre'] = turno.servicio.nombre
    
    return Response({
        'message': 'Turno cancelado exitosamente',
        'turno': data
    })
