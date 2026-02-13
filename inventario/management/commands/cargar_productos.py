"""
Comando para cargar productos de prueba en el inventario.
Uso: python manage.py cargar_productos
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from inventario.models import Producto
from decimal import Decimal


class Command(BaseCommand):
    help = 'Carga productos de indumentaria de prueba para TINCHO'
    
    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🛍️ Cargando productos de indumentaria...'))
        
        productos_data = [
            # Remeras
            {
                'nombre': 'Remera Oversize Negra TINCHO',
                'talles': ['S', 'M', 'L', 'XL', 'XXL'],
                'precio_costo': Decimal('3500.00'),
                'precio_venta': Decimal('7000.00'),
                'stock_inicial': 10
            },
            {
                'nombre': 'Remera Oversize Blanca TINCHO',
                'talles': ['S', 'M', 'L', 'XL', 'XXL'],
                'precio_costo': Decimal('3500.00'),
                'precio_venta': Decimal('7000.00'),
                'stock_inicial': 8
            },
            {
                'nombre': 'Remera Básica Gris',
                'talles': ['M', 'L', 'XL'],
                'precio_costo': Decimal('2500.00'),
                'precio_venta': Decimal('5000.00'),
                'stock_inicial': 15
            },
            # Buzos
            {
                'nombre': 'Buzo con Capucha Negro TINCHO',
                'talles': ['M', 'L', 'XL', 'XXL'],
                'precio_costo': Decimal('6000.00'),
                'precio_venta': Decimal('12000.00'),
                'stock_inicial': 6
            },
            {
                'nombre': 'Buzo Clásico Gris',
                'talles': ['M', 'L', 'XL'],
                'precio_costo': Decimal('5000.00'),
                'precio_venta': Decimal('10000.00'),
                'stock_inicial': 5
            },
            # Accesorios
            {
                'nombre': 'Gorra TINCHO Logo Dorado',
                'talles': ['L'],  # Talle único
                'precio_costo': Decimal('2000.00'),
                'precio_venta': Decimal('4500.00'),
                'stock_inicial': 20
            },
            {
                'nombre': 'Medias TINCHO Pack x3',
                'talles': ['M', 'L'],
                'precio_costo': Decimal('1500.00'),
                'precio_venta': Decimal('3000.00'),
                'stock_inicial': 30
            },
        ]
        
        creados = 0
        actualizados = 0
        
        for producto_base in productos_data:
            for talle in producto_base['talles']:
                producto, created = Producto.objects.get_or_create(
                    nombre=producto_base['nombre'],
                    talle=talle,
                    defaults={
                        'precio_costo': producto_base['precio_costo'],
                        'precio_venta': producto_base['precio_venta'],
                        'stock_actual': producto_base['stock_inicial'],
                        'is_active': True
                    }
                )
                
                if created:
                    creados += 1
                    self.stdout.write(
                        f"  ✓ Creado: {producto.nombre} - Talle {talle} "
                        f"(${producto.precio_venta}, Stock: {producto.stock_actual})"
                    )
                else:
                    actualizados += 1
                    self.stdout.write(
                        f"  → Ya existe: {producto.nombre} - Talle {talle}"
                    )
        
        # Resumen
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('📊 RESUMEN'))
        self.stdout.write('='*70)
        self.stdout.write(f"  • Productos creados: {creados}")
        self.stdout.write(f"  • Productos existentes: {actualizados}")
        self.stdout.write(f"  • Total en inventario: {Producto.objects.count()}")
        self.stdout.write('='*70)
        
        self.stdout.write(self.style.SUCCESS('\n✅ ¡Productos cargados exitosamente!'))
        self.stdout.write('🌐 Accede al admin de productos en: http://localhost:8000/admin/inventario/producto/')
