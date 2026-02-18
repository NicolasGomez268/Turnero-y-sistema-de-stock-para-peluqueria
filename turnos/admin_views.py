"""
Views de administración para el panel React Admin
Maneja la autenticación y gestión de turnos desde el frontend
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from rest_framework.authtoken.models import Token
from .models import Turno, Barbero, Servicio, EstadoTurno
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
@authentication_classes([TokenAuthentication])
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

    hoy = timezone.localdate()
    if turno.fecha > hoy:
        return Response(
            {'error': f'No se puede marcar un turno futuro como realizado. El turno es el {turno.fecha.strftime("%d/%m/%Y")}.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')
    turno.estado = 'REALIZADO'
    turno.metodo_pago = metodo_pago
    turno.save()
    
    data = TurnoSerializer(turno).data
    data['barbero_nombre'] = turno.barbero.nombre
    data['servicio_nombre'] = turno.servicio.nombre
    
    return Response({
        'message': 'Turno marcado como REALIZADO',
        'turno': data
    })


@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
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


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def crear_turno_manual(request):
    """
    Crear un turno manualmente desde el panel admin
    POST /api/admin/turnos/manual/
    Body: {
        "barbero_id": 1,
        "servicio_id": 2,
        "fecha": "2026-02-14",
        "hora": "14:30",
        "cliente_nombre": "Juan Pérez",
        "cliente_telefono": "+5493515551234",
        "notas": "Walk-in sin reserva previa"
    }
    """
    # Debug: Log datos recibidos
    print("DEBUG - Crear turno manual - Datos recibidos:")
    print(f"request.data: {request.data}")
    print(f"user: {request.user}")
    print(f"is_staff: {request.user.is_staff if hasattr(request.user, 'is_staff') else 'N/A'}")
    
    # Validar usuario staff
    if not request.user.is_staff:
        return Response(
            {'error': 'Solo administradores pueden crear turnos manuales'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Obtener datos del request
    barbero_id = request.data.get('barbero_id')
    servicio_id = request.data.get('servicio_id')
    fecha_str = request.data.get('fecha')
    hora_str = request.data.get('hora')
    cliente_nombre = request.data.get('cliente_nombre')
    cliente_telefono = request.data.get('cliente_telefono')
    notas = request.data.get('notas', '')
    
    # Debug: Log campos extraídos
    print(f"DEBUG - Campos extraídos:")
    print(f"  barbero_id: {barbero_id} (tipo: {type(barbero_id)})")
    print(f"  servicio_id: {servicio_id} (tipo: {type(servicio_id)})")
    print(f"  fecha_str: {fecha_str} (tipo: {type(fecha_str)})")
    print(f"  hora_str: '{hora_str}' (tipo: {type(hora_str)})")
    print(f"  cliente_nombre: '{cliente_nombre}' (tipo: {type(cliente_nombre)})")
    print(f"  cliente_telefono: '{cliente_telefono}' (tipo: {type(cliente_telefono)})")
    
    # Validar campos requeridos
    if not all([barbero_id, servicio_id, fecha_str, hora_str, cliente_nombre, cliente_telefono]):
        campos_vacios = []
        if not barbero_id: campos_vacios.append('barbero_id')
        if not servicio_id: campos_vacios.append('servicio_id')
        if not fecha_str: campos_vacios.append('fecha')
        if not hora_str: campos_vacios.append('hora')
        if not cliente_nombre: campos_vacios.append('cliente_nombre')
        if not cliente_telefono: campos_vacios.append('cliente_telefono')
        print(f"DEBUG - Campos vacíos: {campos_vacios}")
        return Response(
            {'error': f'Campos requeridos faltantes: {", ".join(campos_vacios)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validar y obtener barbero
    try:
        barbero = Barbero.objects.get(id=barbero_id, is_active=True)
    except Barbero.DoesNotExist:
        return Response(
            {'error': 'Barbero no encontrado o inactivo'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validar y obtener servicio
    try:
        servicio = Servicio.objects.get(id=servicio_id, is_active=True)
    except Servicio.DoesNotExist:
        return Response(
            {'error': 'Servicio no encontrado o inactivo'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Parsear fecha y hora
    try:
        print(f"DEBUG - Parseando fecha: '{fecha_str}' y hora: '{hora_str}'")
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        
        # Intentar primero con segundos (HH:MM:SS), luego sin segundos (HH:MM)
        try:
            hora = datetime.strptime(hora_str, '%H:%M:%S').time()
        except ValueError:
            hora = datetime.strptime(hora_str, '%H:%M').time()
            
        print(f"DEBUG - Fecha parseada: {fecha}, Hora parseada: {hora}")
    except ValueError as e:
        print(f"DEBUG - Error al parsear fecha/hora: {e}")
        return Response(
            {'error': f'Formato de fecha u hora inválido (use YYYY-MM-DD y HH:MM o HH:MM:SS). Error: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar si el slot está disponible (opcional, puede omitirse para walk-ins)
    turno_existente = Turno.objects.filter(
        barbero=barbero,
        fecha=fecha,
        hora=hora,
        estado=EstadoTurno.PENDIENTE
    ).exists()
    
    if turno_existente:
        return Response(
            {'error': 'Ya existe un turno para este barbero en ese horario. ¿Desea crearlo de todas formas?'},
            status=status.HTTP_409_CONFLICT
        )
    
    # Crear el turno con estado PENDIENTE
    try:
        turno = Turno.objects.create(
            barbero=barbero,
            servicio=servicio,
            fecha=fecha,
            hora=hora,
            cliente_nombre=cliente_nombre,
            cliente_telefono=cliente_telefono,
            notas=notas,
            estado=EstadoTurno.PENDIENTE  # Pendiente para poder marcarlo como realizado después
        )
        
        serializer = TurnoSerializer(turno)
        
        return Response({
            'message': 'Turno creado exitosamente',
            'turno': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': f'Error al crear turno: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
