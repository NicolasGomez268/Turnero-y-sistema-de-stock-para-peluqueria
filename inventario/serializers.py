from rest_framework import serializers
from .models import Producto, Venta


class ProductoSerializer(serializers.ModelSerializer):
    margen_ganancia = serializers.SerializerMethodField()
    porcentaje_ganancia = serializers.SerializerMethodField()
    display = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'variante', 'categoria',
            'precio_costo', 'precio_venta', 'stock_actual',
            'descripcion', 'is_active',
            'margen_ganancia', 'porcentaje_ganancia', 'display',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en', 'margen_ganancia', 'porcentaje_ganancia', 'display']

    def get_margen_ganancia(self, obj):
        return float(obj.margen_ganancia)

    def get_porcentaje_ganancia(self, obj):
        return round(float(obj.porcentaje_ganancia), 2)

    def get_display(self, obj):
        if obj.variante:
            return f"{obj.nombre} ({obj.variante})"
        return obj.nombre

    def validate(self, data):
        precio_venta = data.get('precio_venta', getattr(self.instance, 'precio_venta', None))
        precio_costo = data.get('precio_costo', getattr(self.instance, 'precio_costo', None))
        if precio_venta and precio_costo and precio_venta < precio_costo:
            raise serializers.ValidationError({
                'precio_venta': 'El precio de venta no puede ser menor al precio de costo.'
            })
        return data


class VentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.SerializerMethodField()
    producto_variante = serializers.SerializerMethodField()
    producto_categoria = serializers.SerializerMethodField()
    metodo_pago_display = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = [
            'id', 'fecha', 'producto', 'producto_nombre', 'producto_variante', 'producto_categoria',
            'cantidad', 'precio_unitario', 'total',
            'metodo_pago', 'metodo_pago_display',
            'notas', 'vendedor',
        ]
        read_only_fields = ['id', 'fecha', 'total', 'producto_nombre', 'producto_variante', 'producto_categoria', 'metodo_pago_display']

    def get_producto_nombre(self, obj):
        return obj.producto.nombre

    def get_producto_variante(self, obj):
        return obj.producto.variante or ''

    def get_producto_categoria(self, obj):
        return obj.producto.categoria or ''

    def get_metodo_pago_display(self, obj):
        return obj.get_metodo_pago_display()

    def validate(self, data):
        producto = data.get('producto')
        cantidad = data.get('cantidad')

        if producto and cantidad:
            if not producto.is_active:
                raise serializers.ValidationError({
                    'producto': 'No se puede vender un producto inactivo.'
                })
            if not producto.hay_stock(cantidad):
                raise serializers.ValidationError({
                    'cantidad': f'Stock insuficiente. Solo hay {producto.stock_actual} unidades disponibles.'
                })
        return data
