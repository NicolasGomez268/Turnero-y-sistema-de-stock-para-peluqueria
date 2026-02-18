from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from datetime import datetime, date

from .models import Producto, Venta
from .serializers import ProductoSerializer, VentaSerializer


# ─────────────────────────────────────────────
# PRODUCTOS
# ─────────────────────────────────────────────

@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def productos_list(request):
    """
    GET  /api/inventario/productos/          — Listar productos
         ?activo=true|false                  — Filtrar por estado
         ?categoria=Capilar                  — Filtrar por categoría
         ?con_stock=true                     — Solo productos con stock > 0
    POST /api/inventario/productos/          — Crear producto
    """
    if request.method == 'GET':
        qs = Producto.objects.all()

        activo = request.query_params.get('activo')
        if activo is not None:
            qs = qs.filter(is_active=(activo.lower() == 'true'))

        categoria = request.query_params.get('categoria')
        if categoria:
            qs = qs.filter(categoria__iexact=categoria)

        con_stock = request.query_params.get('con_stock')
        if con_stock and con_stock.lower() == 'true':
            qs = qs.filter(stock_actual__gt=0)

        serializer = ProductoSerializer(qs, many=True)
        return Response(serializer.data)

    # POST
    serializer = ProductoSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def producto_detail(request, producto_id):
    """
    GET    /api/inventario/productos/{id}/   — Obtener producto
    PUT    /api/inventario/productos/{id}/   — Actualizar producto
    DELETE /api/inventario/productos/{id}/   — Eliminar producto (si no tiene ventas)
    """
    try:
        producto = Producto.objects.get(pk=producto_id)
    except Producto.DoesNotExist:
        return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductoSerializer(producto).data)

    if request.method == 'PUT':
        serializer = ProductoSerializer(producto, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    if producto.ventas.exists():
        return Response(
            {'error': 'No se puede eliminar un producto que tiene ventas registradas. Desactivalo en cambio.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    producto.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def ajustar_stock(request, producto_id):
    """
    PATCH /api/inventario/productos/{id}/stock/
    Body: { "cantidad": 10, "operacion": "agregar" | "restar" | "establecer" }
    """
    try:
        producto = Producto.objects.get(pk=producto_id)
    except Producto.DoesNotExist:
        return Response({'error': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    cantidad = request.data.get('cantidad')
    operacion = request.data.get('operacion', 'agregar')

    if cantidad is None:
        return Response({'error': 'Se requiere el campo "cantidad".'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cantidad = int(cantidad)
    except (ValueError, TypeError):
        return Response({'error': '"cantidad" debe ser un número entero.'}, status=status.HTTP_400_BAD_REQUEST)

    if operacion == 'agregar':
        if cantidad <= 0:
            return Response({'error': 'La cantidad a agregar debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
        producto.stock_actual += cantidad
    elif operacion == 'restar':
        if cantidad <= 0:
            return Response({'error': 'La cantidad a restar debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)
        if producto.stock_actual < cantidad:
            return Response(
                {'error': f'Stock insuficiente. Stock actual: {producto.stock_actual}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        producto.stock_actual -= cantidad
    elif operacion == 'establecer':
        if cantidad < 0:
            return Response({'error': 'El stock no puede ser negativo.'}, status=status.HTTP_400_BAD_REQUEST)
        producto.stock_actual = cantidad
    else:
        return Response(
            {'error': 'Operación inválida. Usar: "agregar", "restar" o "establecer".'},
            status=status.HTTP_400_BAD_REQUEST
        )

    producto.save()
    return Response(ProductoSerializer(producto).data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def categorias_list(request):
    """
    GET /api/inventario/categorias/
    Retorna la lista de categorías únicas registradas.
    """
    categorias = (
        Producto.objects
        .exclude(categoria__isnull=True)
        .exclude(categoria='')
        .values_list('categoria', flat=True)
        .distinct()
        .order_by('categoria')
    )
    return Response(list(categorias))


# ─────────────────────────────────────────────
# VENTAS
# ─────────────────────────────────────────────

@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def ventas_list(request):
    """
    GET  /api/inventario/ventas/             — Listar ventas
         ?fecha=YYYY-MM-DD                   — Filtrar por fecha exacta
         ?fecha_inicio=YYYY-MM-DD            — Filtrar desde fecha
         ?fecha_fin=YYYY-MM-DD               — Filtrar hasta fecha
         ?producto_id=N                      — Filtrar por producto
    POST /api/inventario/ventas/             — Registrar venta (descuenta stock automáticamente)
    """
    if request.method == 'GET':
        qs = Venta.objects.select_related('producto').all()

        fecha_str = request.query_params.get('fecha')
        if fecha_str:
            try:
                fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
                qs = qs.filter(fecha__date=fecha)
            except ValueError:
                return Response({'error': 'Formato de fecha inválido. Usar YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        fecha_inicio_str = request.query_params.get('fecha_inicio')
        fecha_fin_str = request.query_params.get('fecha_fin')
        if fecha_inicio_str and fecha_fin_str:
            try:
                fi = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
                ff = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
                qs = qs.filter(fecha__date__gte=fi, fecha__date__lte=ff)
            except ValueError:
                return Response({'error': 'Formato de fecha inválido. Usar YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        producto_id = request.query_params.get('producto_id')
        if producto_id:
            qs = qs.filter(producto_id=producto_id)

        serializer = VentaSerializer(qs, many=True)

        # Totales del conjunto filtrado
        totales = qs.aggregate(total=Sum('total'))
        resumen = {
            'cantidad_ventas': qs.count(),
            'total_vendido': float(totales['total'] or 0),
        }

        return Response({'ventas': serializer.data, 'resumen': resumen})

    # POST — Registrar venta
    serializer = VentaSerializer(data=request.data)
    if serializer.is_valid():
        try:
            venta = serializer.save()
            return Response(VentaSerializer(venta).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
