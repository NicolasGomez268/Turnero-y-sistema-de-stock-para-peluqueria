from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Count, Sum, Q, Avg
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta, date
from .models import Turno, Barbero, Servicio, EstadoTurno


class MetricasView(APIView):
    """
    Vista PRIVADA para métricas y estadísticas del negocio.
    Solo accesible por usuarios autenticados y administradores.
    
    GET /api/metricas/?fecha_inicio=2026-02-01&fecha_fin=2026-02-28
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Obtener métricas generales del negocio"""
        # Parámetros opcionales de fecha
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        # Si no se especifican fechas, usar el mes actual
        if not fecha_inicio or not fecha_fin:
            hoy = date.today()
            fecha_inicio = hoy.replace(day=1)
            # Último día del mes
            if hoy.month == 12:
                fecha_fin = hoy.replace(day=31)
            else:
                fecha_fin = (hoy.replace(month=hoy.month + 1, day=1) - timedelta(days=1))
        else:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        # Filtrar turnos en el rango de fechas
        turnos = Turno.objects.filter(
            fecha__range=[fecha_inicio, fecha_fin]
        ).select_related('barbero', 'servicio')
        
        # Métricas generales
        total_turnos = turnos.count()
        turnos_realizados = turnos.filter(estado=EstadoTurno.REALIZADO).count()
        turnos_pendientes = turnos.filter(estado=EstadoTurno.PENDIENTE).count()
        turnos_confirmados = turnos.filter(estado=EstadoTurno.CONFIRMADO).count()
        turnos_cancelados = turnos.filter(estado=EstadoTurno.CANCELADO).count()
        
        # Ingresos (solo turnos realizados)
        ingresos_totales = turnos.filter(
            estado=EstadoTurno.REALIZADO
        ).aggregate(
            total=Sum('servicio__precio')
        )['total'] or 0
        
        # Tasa de conversión
        tasa_realizacion = (turnos_realizados / total_turnos * 100) if total_turnos > 0 else 0
        tasa_cancelacion = (turnos_cancelados / total_turnos * 100) if total_turnos > 0 else 0
        
        # Turnos por barbero
        turnos_por_barbero = turnos.filter(
            estado=EstadoTurno.REALIZADO
        ).values(
            'barbero__id',
            'barbero__nombre'
        ).annotate(
            total_turnos=Count('id'),
            ingresos=Sum('servicio__precio')
        ).order_by('-total_turnos')
        
        # Servicios más solicitados
        servicios_populares = turnos.values(
            'servicio__id',
            'servicio__nombre',
            'servicio__precio'
        ).annotate(
            total=Count('id')
        ).order_by('-total')[:5]
        
        # Turnos por día
        turnos_por_dia = turnos.values('fecha').annotate(
            total=Count('id')
        ).order_by('fecha')
        
        # Promedio de turnos por día
        dias_totales = (fecha_fin - fecha_inicio).days + 1
        promedio_turnos_dia = total_turnos / dias_totales if dias_totales > 0 else 0
        
        response_data = {
            'periodo': {
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin,
                'dias_totales': dias_totales
            },
            'resumen': {
                'total_turnos': total_turnos,
                'turnos_realizados': turnos_realizados,
                'turnos_pendientes': turnos_pendientes,
                'turnos_confirmados': turnos_confirmados,
                'turnos_cancelados': turnos_cancelados,
                'tasa_realizacion': round(tasa_realizacion, 2),
                'tasa_cancelacion': round(tasa_cancelacion, 2),
                'promedio_turnos_dia': round(promedio_turnos_dia, 2)
            },
            'ingresos': {
                'total': float(ingresos_totales),
                'promedio_por_turno': float(ingresos_totales / turnos_realizados) if turnos_realizados > 0 else 0,
                'promedio_por_dia': float(ingresos_totales / dias_totales) if dias_totales > 0 else 0
            },
            'barberos': list(turnos_por_barbero),
            'servicios_populares': list(servicios_populares),
            'turnos_por_dia': list(turnos_por_dia)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class LiquidacionView(APIView):
    """
    Vista PRIVADA para calcular la liquidación de sueldos de los barberos.
    Solo accesible por usuarios autenticados y administradores.
    
    GET /api/liquidacion/?fecha_inicio=2026-02-01&fecha_fin=2026-02-07&barbero_id=1
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Calcular liquidación de sueldos"""
        # Parámetros
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        barbero_id = request.query_params.get('barbero_id')
        
        # Validar fechas requeridas
        if not fecha_inicio or not fecha_fin:
            return Response(
                {'error': 'Se requieren fecha_inicio y fecha_fin'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Filtrar turnos REALIZADOS en el rango de fechas
        turnos_query = Turno.objects.filter(
            fecha__range=[fecha_inicio, fecha_fin],
            estado=EstadoTurno.REALIZADO
        ).select_related('barbero', 'servicio')
        
        # Filtrar por barbero específico si se solicita
        if barbero_id:
            turnos_query = turnos_query.filter(barbero_id=barbero_id)
        
        # Calcular liquidación por barbero
        if barbero_id:
            # Liquidación individual
            barbero = Barbero.objects.get(id=barbero_id)
            turnos = turnos_query
            
            total_turnos = turnos.count()
            ingresos_brutos = turnos.aggregate(
                total=Sum('servicio__precio')
            )['total'] or 0
            
            # Calcular comisión (ejemplo: 60% para el barbero, 40% para la casa)
            PORCENTAJE_BARBERO = 0.60
            comision_barbero = float(ingresos_brutos) * PORCENTAJE_BARBERO
            comision_casa = float(ingresos_brutos) * (1 - PORCENTAJE_BARBERO)
            
            # Detalle por servicio
            detalle_servicios = turnos.values(
                'servicio__nombre',
                'servicio__precio'
            ).annotate(
                cantidad=Count('id'),
                subtotal=Sum('servicio__precio')
            ).order_by('-cantidad')
            
            response_data = {
                'periodo': {
                    'fecha_inicio': fecha_inicio,
                    'fecha_fin': fecha_fin
                },
                'barbero': {
                    'id': barbero.id,
                    'nombre': barbero.nombre
                },
                'resumen': {
                    'total_turnos_realizados': total_turnos,
                    'ingresos_brutos': float(ingresos_brutos),
                    'porcentaje_barbero': PORCENTAJE_BARBERO * 100,
                    'comision_barbero': round(comision_barbero, 2),
                    'comision_casa': round(comision_casa, 2)
                },
                'detalle_servicios': list(detalle_servicios)
            }
        else:
            # Liquidación de todos los barberos
            liquidaciones = turnos_query.values(
                'barbero__id',
                'barbero__nombre'
            ).annotate(
                total_turnos=Count('id'),
                ingresos_brutos=Sum('servicio__precio')
            ).order_by('-ingresos_brutos')
            
            # Calcular comisiones
            PORCENTAJE_BARBERO = 0.60
            for liq in liquidaciones:
                ingresos = float(liq['ingresos_brutos'] or 0)
                liq['comision_barbero'] = round(ingresos * PORCENTAJE_BARBERO, 2)
                liq['comision_casa'] = round(ingresos * (1 - PORCENTAJE_BARBERO), 2)
            
            # Totales generales
            total_ingresos = sum(l['ingresos_brutos'] for l in liquidaciones)
            total_comision_barberos = sum(l['comision_barbero'] for l in liquidaciones)
            total_comision_casa = sum(l['comision_casa'] for l in liquidaciones)
            
            response_data = {
                'periodo': {
                    'fecha_inicio': fecha_inicio,
                    'fecha_fin': fecha_fin
                },
                'resumen_general': {
                    'total_ingresos': float(total_ingresos),
                    'total_comision_barberos': round(total_comision_barberos, 2),
                    'total_comision_casa': round(total_comision_casa, 2)
                },
                'liquidaciones': list(liquidaciones)
            }
        
        return Response(response_data, status=status.HTTP_200_OK)
