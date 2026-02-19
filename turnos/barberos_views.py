"""
Views para gestión de barberos desde el panel de administración
"""
from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from turnos.models import Barbero, HorarioAtencion
from turnos.serializers import BarberoSerializer, HorarioAtencionSerializer
import json


@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])  # Permite GET sin auth, POST requiere staff
def manage_barberos_list(request):
    """
    Gestionar lista de barberos
    GET /api/barberos/ - Obtener todos los barberos (admin ve todos, público solo activos)
    POST /api/barberos/ - Crear nuevo barbero (solo admin)
    """
    if request.method == 'GET':
        # Si es admin con token, ver todos; si no, solo activos
        if request.user.is_authenticated and request.user.is_staff:
            barberos = Barbero.objects.all().order_by('nombre')
        else:
            barberos = Barbero.objects.filter(is_active=True).order_by('nombre')
        
        serializer = BarberoSerializer(barberos, many=True, context={'request': request})
        return JsonResponse(serializer.data, safe=False)
    
    elif request.method == 'POST':
        # Solo admin puede crear
        if not request.user.is_authenticated or not request.user.is_staff:
            return JsonResponse({'error': 'Sin permisos'}, status=403)
        
        try:
            data = json.loads(request.body)
            
            if not data.get('nombre'):
                return JsonResponse({'error': 'El nombre es requerido'}, status=400)
            
            barbero = Barbero.objects.create(
            nombre=data['nombre'],
            especialidad=data.get('especialidad', ''),
            is_active=data.get('is_active', True),
            is_owner=data.get('is_owner', False),
            porcentaje_casa=data.get('porcentaje_casa', 40.00)
        )
            
            serializer = BarberoSerializer(barbero, context={'request': request})
            return JsonResponse(serializer.data, status=201)
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_barbero(request, barbero_id):
    """
    Actualizar información de un barbero
    PUT /api/barberos/{id}/
    Body: { "is_active": true/false, "nombre": "...", "especialidad": "..." }
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'Sin permisos'}, status=403)
    
    try:
        barbero = Barbero.objects.get(id=barbero_id)
    except Barbero.DoesNotExist:
        return JsonResponse({'error': 'Barbero no encontrado'}, status=404)
    
    try:
        data = json.loads(request.body)
        
        # Actualizar campos permitidos
        if 'is_active' in data:
            barbero.is_active = data['is_active']
        if 'nombre' in data:
            barbero.nombre = data['nombre']
        if 'especialidad' in data:
            barbero.especialidad = data['especialidad']
        
        barbero.save()
        
        serializer = BarberoSerializer(barbero, context={'request': request})
        return JsonResponse(serializer.data)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_barbero(request):
    """
    DEPRECATED: Usar POST /api/barberos/ en su lugar
    Esta función se mantiene para compatibilidad
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'Sin permisos'}, status=403)
    
    try:
        data = json.loads(request.body)
        
        if not data.get('nombre'):
            return JsonResponse({'error': 'El nombre es requerido'}, status=400)
        
        barbero = Barbero.objects.create(
            nombre=data['nombre'],
            especialidad=data.get('especialidad', ''),
            is_active=data.get('is_active', True)
        )
        
        serializer = BarberoSerializer(barbero, context={'request': request})
        return JsonResponse(serializer.data, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def upload_barbero_photo(request, barbero_id):
    """
    Subir foto de barbero
    PATCH /api/barberos/{id}/foto/
    Form-data: foto (file)
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'Sin permisos'}, status=403)
    
    try:
        barbero = Barbero.objects.get(id=barbero_id)
    except Barbero.DoesNotExist:
        return JsonResponse({'error': 'Barbero no encontrado'}, status=404)
    
    if 'foto' not in request.FILES:
        return JsonResponse({'error': 'No se envió ninguna foto'}, status=400)
    
    barbero.foto = request.FILES['foto']
    barbero.save()
    
    serializer = BarberoSerializer(barbero, context={'request': request})
    return JsonResponse(serializer.data)


@api_view(['GET', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manage_barbero_horarios(request, barbero_id):
    """
    Gestionar horarios de un barbero (GET y PUT)
    GET /api/barberos/{id}/horarios/ - Obtener horarios
    PUT /api/barberos/{id}/horarios/ - Actualizar horarios
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'Sin permisos'}, status=403)
    
    try:
        barbero = Barbero.objects.get(id=barbero_id)
    except Barbero.DoesNotExist:
        return JsonResponse({'error': 'Barbero no encontrado'}, status=404)
    
    if request.method == 'GET':
        # Obtener horarios existentes
        horarios = HorarioAtencion.objects.filter(barbero=barbero).order_by('dia_semana')
        serializer = HorarioAtencionSerializer(horarios, many=True)
        return JsonResponse(serializer.data, safe=False)
    
    elif request.method == 'PUT':
        # Actualizar horarios
        try:
            data = json.loads(request.body)
            horarios_data = data.get('horarios', [])
            
            # Eliminar horarios existentes
            HorarioAtencion.objects.filter(barbero=barbero).delete()
            
            # Crear nuevos horarios
            for horario_data in horarios_data:
                if horario_data.get('activo'):  # Solo crear si está activo
                    HorarioAtencion.objects.create(
                        barbero=barbero,
                        dia_semana=horario_data['dia_semana'],
                        hora_inicio=horario_data.get('hora_inicio', '09:00'),
                        hora_fin=horario_data.get('hora_fin', '18:00'),
                        descanso_inicio=horario_data.get('descanso_inicio'),
                        descanso_fin=horario_data.get('descanso_fin'),
                    )
            
            # Retornar horarios actualizados
            horarios = HorarioAtencion.objects.filter(barbero=barbero).order_by('dia_semana')
            serializer = HorarioAtencionSerializer(horarios, many=True)
            return JsonResponse(serializer.data, safe=False)
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
