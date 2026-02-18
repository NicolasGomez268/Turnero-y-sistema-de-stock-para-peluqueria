"""
Views para liquidación de barberos y caja diaria
"""
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from datetime import datetime, timedelta, date
from decimal import Decimal
from .models import Turno, Barbero, EstadoTurno
from inventario.models import Venta


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def liquidacion_semanal(request):
    """
    GET /api/admin/liquidacion/?fecha_inicio=2026-02-10&fecha_fin=2026-02-16
    
    Calcula la liquidación de cada barbero en un rango de fechas.
    - Dueño (is_owner=True): recibe 100% de sus turnos
    - Empleados (is_owner=False): reciben 60%, casa recibe 40%
    """
    # Obtener parámetros de fecha
    fecha_inicio_str = request.query_params.get('fecha_inicio')
    fecha_fin_str = request.query_params.get('fecha_fin')
    
    # Si no se especifican, usar la semana actual (lunes a domingo)
    if not fecha_inicio_str or not fecha_fin_str:
        hoy = date.today()
        dias_desde_lunes = hoy.weekday()  # 0=Lunes, 6=Domingo
        fecha_inicio = hoy - timedelta(days=dias_desde_lunes)
        fecha_fin = fecha_inicio + timedelta(days=6)
    else:
        try:
            fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Usar YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Obtener todos los barberos activos
    barberos = Barbero.objects.filter(is_active=True).order_by('id')
    
    liquidaciones = []
    total_ingresos_brutos = Decimal('0')
    total_para_barberos = Decimal('0')
    total_para_casa = Decimal('0')
    
    for barbero in barberos:
        # Filtrar turnos REALIZADOS del barbero en el rango de fechas
        turnos = Turno.objects.filter(
            barbero=barbero,
            fecha__gte=fecha_inicio,
            fecha__lte=fecha_fin,
            estado=EstadoTurno.REALIZADO
        ).select_related('servicio')
        
        cantidad_turnos = turnos.count()
        
        if cantidad_turnos == 0:
            continue  # Saltar barberos sin turnos
        
        # Calcular total bruto (suma de precios de servicios)
        total_bruto = sum(turno.servicio.precio for turno in turnos)
        
         # Determinar si es el dueño usando el campo del modelo
        es_dueno = barbero.is_owner
        
        if es_dueno:
            # Dueño: 100% para él, 0% para la casa
            porcentaje_barbero = 100
            comision_barbero = total_bruto
            comision_casa = Decimal('0')
        else:
            # Empleado: usa el porcentaje configurado
            porcentaje_casa = Decimal(str(barbero.porcentaje_casa))
            porcentaje_barbero = 100 - porcentaje_casa
            comision_casa = total_bruto * (porcentaje_casa / 100)
            comision_barbero = total_bruto - comision_casa
            
        liquidaciones.append({
            'barbero_id': barbero.id,
            'barbero_nombre': barbero.nombre,
            'es_dueno': es_dueno,
            'cantidad_turnos': cantidad_turnos,
            'total_bruto': float(total_bruto),
            'porcentaje_barbero': porcentaje_barbero,
            'comision_barbero': float(comision_barbero),
            'comision_casa': float(comision_casa)
        })
        
        total_ingresos_brutos += total_bruto
        total_para_barberos += comision_barbero
        total_para_casa += comision_casa
    
    return Response({
        'periodo': {
            'fecha_inicio': str(fecha_inicio),
            'fecha_fin': str(fecha_fin)
        },
        'resumen_general': {
            'total_ingresos_brutos': float(total_ingresos_brutos),
            'total_para_barberos': float(total_para_barberos),
            'total_para_casa': float(total_para_casa)
        },
        'liquidaciones': liquidaciones
    })


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def caja_diaria(request):
    """
    GET /api/admin/caja-diaria/?fecha=2026-02-14
    
    Muestra el resumen de caja del día:
    - Total de turnos realizados
    - Total de ventas de productos
    - Desglose por método de pago
    """
    # Obtener parámetro de fecha
    fecha_str = request.query_params.get('fecha')
    
    if not fecha_str:
        fecha = date.today()
    else:
        try:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Usar YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # 1. TURNOS DEL DÍA
    turnos_realizados = Turno.objects.filter(
        fecha=fecha,
        estado=EstadoTurno.REALIZADO
    ).select_related('servicio')
    
    cantidad_turnos = turnos_realizados.count()
    total_ingresos_turnos = sum(
        turno.servicio.precio for turno in turnos_realizados
    ) if cantidad_turnos > 0 else Decimal('0')
    
    # 2. VENTAS DE PRODUCTOS DEL DÍA
    ventas = Venta.objects.filter(fecha__date=fecha)
    
    cantidad_ventas = ventas.count()
    total_ventas_productos = ventas.aggregate(
        total=Sum('total')
    )['total'] or Decimal('0')
    
    # 3. DESGLOSE POR MÉTODO DE PAGO — Ventas de productos
    desglose_metodos = {}
    for metodo_choice in ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']:
        total_metodo = ventas.filter(metodo_pago=metodo_choice).aggregate(
            total=Sum('total')
        )['total'] or Decimal('0')
        desglose_metodos[metodo_choice] = float(total_metodo)

    # 4. DESGLOSE POR MÉTODO DE PAGO — Turnos realizados
    desglose_turnos_metodos = {}
    for metodo_choice in ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']:
        total_metodo = turnos_realizados.filter(metodo_pago=metodo_choice).aggregate(
            total=Sum('servicio__precio')
        )['total'] or Decimal('0')
        desglose_turnos_metodos[metodo_choice] = float(total_metodo)

    # 5. TOTAL GENERAL
    total_general = total_ingresos_turnos + total_ventas_productos

    return Response({
        'fecha': str(fecha),
        'turnos': {
            'cantidad': cantidad_turnos,
            'total': float(total_ingresos_turnos)
        },
        'ventas_productos': {
            'cantidad': cantidad_ventas,
            'total': float(total_ventas_productos)
        },
        'total_general': float(total_general),
        'desglose_metodos_pago': desglose_metodos,
        'desglose_turnos_metodos_pago': desglose_turnos_metodos,
    })


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def metricas_mensuales(request):
    """
    GET /api/admin/metricas-mensuales/?mes=2&anio=2026
    
    Retorna métricas del mes:
    - Total de turnos realizados
    - Total de ventas de productos
    - Ganancia total
    - Mejor barbero (más turnos)
    - Servicio más solicitado
    """
    # Obtener parámetros
    mes_str = request.query_params.get('mes')
    anio_str = request.query_params.get('anio')
    
    # Valores por defecto: mes actual
    if not mes_str or not anio_str:
        hoy = date.today()
        mes = hoy.month
        anio = hoy.year
    else:
        try:
            mes = int(mes_str)
            anio = int(anio_str)
        except ValueError:
            return Response(
                {'error': 'Mes y año deben ser números'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Validar mes
    if mes < 1 or mes > 12:
        return Response(
            {'error': 'Mes inválido (debe ser entre 1 y 12)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calcular primer y último día del mes
    fecha_inicio = date(anio, mes, 1)
    if mes == 12:
        fecha_fin = date(anio, 12, 31)
    else:
        fecha_fin = date(anio, mes + 1, 1) - timedelta(days=1)
    
    # 1. TURNOS DEL MES
    turnos = Turno.objects.filter(
        fecha__gte=fecha_inicio,
        fecha__lte=fecha_fin,
        estado=EstadoTurno.REALIZADO
    ).select_related('barbero', 'servicio')
    
    total_turnos = turnos.count()
    ingresos_turnos = sum(turno.servicio.precio for turno in turnos) if total_turnos > 0 else Decimal('0')
    
    # 2. VENTAS DEL MES
    ventas = Venta.objects.filter(
        fecha__date__gte=fecha_inicio,
        fecha__date__lte=fecha_fin
    )
    
    total_ventas = ventas.aggregate(total_sum=Sum('total'))['total_sum'] or Decimal('0')
    
    # 3. GANANCIA TOTAL
    ganancia_total = ingresos_turnos + total_ventas
    
    # 4. MEJOR BARBERO
    barberos_stats = turnos.values('barbero__id', 'barbero__nombre').annotate(
        cantidad=Count('id')
    ).order_by('-cantidad')
    
    mejor_barbero = barberos_stats.first() if barberos_stats else None
    
    # 5. SERVICIO MÁS SOLICITADO
    servicios_stats = turnos.values('servicio__nombre').annotate(
        cantidad=Count('id')
    ).order_by('-cantidad')
    
    servicio_popular = servicios_stats.first() if servicios_stats else None
    
    return Response({
        'periodo': {
            'mes': mes,
            'anio': anio,
            'fecha_inicio': str(fecha_inicio),
            'fecha_fin': str(fecha_fin)
        },
        'resumen': {
            'total_turnos_realizados': total_turnos,
            'ingresos_turnos': float(ingresos_turnos),
            'total_ventas_productos': float(total_ventas),
            'ganancia_total': float(ganancia_total)
        },
        'mejor_barbero': {
            'nombre': mejor_barbero['barbero__nombre'] if mejor_barbero else 'N/A',
            'cantidad_turnos': mejor_barbero['cantidad'] if mejor_barbero else 0
        },
        'servicio_mas_solicitado': {
            'nombre': servicio_popular['servicio__nombre'] if servicio_popular else 'N/A',
            'cantidad': servicio_popular['cantidad'] if servicio_popular else 0
        }
    })