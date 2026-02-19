#!/usr/bin/env python
"""
Script para cargar datos de demostración en la base de datos
Uso: python manage.py shell < load_demo_data.py
"""

import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tincho_barberia.settings')
django.setup()

from turnos.models import Barbero, Servicio, Turno
from inventario.models import Producto
from django.contrib.auth.models import User

print("🎭 Cargando datos de demostración...")

# Limpiar datos existentes (excepto superuser)
print("Limpiando datos anteriores...")
Turno.objects.all().delete()
Servicio.objects.all().delete()
Producto.objects.all().delete()
Barbero.objects.filter(is_owner=False).delete()

# Crear barberos demo
print("Creando barberos...")
barberos_data = [
    {
        "nombre": "Juan Pérez",
        "telefono": "+5491112345678",
        "color_hex": "#3B82F6",
        "is_owner": False,
        "is_active": True,
    },
    {
        "nombre": "Carlos Gómez",
        "telefono": "+5491187654321",
        "color_hex": "#EF4444",
        "is_owner": False,
        "is_active": True,
    },
    {
        "nombre": "Diego Martínez",
        "telefono": "+5491198765432",
        "color_hex": "#10B981",
        "is_owner": False,
        "is_active": True,
    },
]

barberos = []
for data in barberos_data:
    barbero = Barbero.objects.create(**data)
    barberos.append(barbero)
    print(f"  ✓ Barbero creado: {barbero.nombre}")

# Crear servicios demo
print("\nCreando servicios...")
servicios_data = [
    {
        "nombre": "Corte de Cabello",
        "descripcion": "Corte clásico con máquina y tijera",
        "precio": 8000.00,
        "duracion_minutos": 30,
        "is_active": True,
    },
    {
        "nombre": "Arreglo de Barba",
        "descripcion": "Perfilado y arreglo completo de barba",
        "precio": 5000.00,
        "duracion_minutos": 20,
        "is_active": True,
    },
    {
        "nombre": "Corte + Barba",
        "descripcion": "Combo completo: corte de cabello y arreglo de barba",
        "precio": 12000.00,
        "duracion_minutos": 45,
        "is_active": True,
    },
    {
        "nombre": "Depilación de Cejas",
        "descripcion": "Perfilado y limpieza de cejas",
        "precio": 3000.00,
        "duracion_minutos": 15,
        "is_active": True,
    },
    {
        "nombre": "Depilación Facial",
        "descripcion": "Depilación completa de rostro",
        "precio": 4500.00,
        "duracion_minutos": 25,
        "is_active": True,
    },
]

servicios = []
for data in servicios_data:
    servicio = Servicio.objects.create(**data)
    servicios.append(servicio)
    print(f"  ✓ Servicio creado: {servicio.nombre} - ${servicio.precio}")

# Crear productos demo
print("\nCreando productos de inventario...")
productos_data = [
    # Productos capilares
    {
        "nombre": "Pomada Mate",
        "variante": "100g",
        "categoria": "Capilar",
        "precio_costo": 3500.00,
        "precio_venta": 6500.00,
        "stock_actual": 15,
        "descripcion": "Pomada de fijación fuerte con acabado mate",
        "is_active": True,
    },
    {
        "nombre": "Shampoo Anticaspa",
        "variante": "250ml",
        "categoria": "Capilar",
        "precio_costo": 2800.00,
        "precio_venta": 5200.00,
        "stock_actual": 20,
        "descripcion": "Shampoo medicado anticaspa",
        "is_active": True,
    },
    {
        "nombre": "Cera para Bigote",
        "variante": "30g",
        "categoria": "Capilar",
        "precio_costo": 2000.00,
        "precio_venta": 4000.00,
        "stock_actual": 10,
        "descripcion": "Cera modeladora para bigote",
        "is_active": True,
    },
    {
        "nombre": "Aceite para Barba",
        "variante": "50ml",
        "categoria": "Capilar",
        "precio_costo": 3200.00,
        "precio_venta": 6000.00,
        "stock_actual": 12,
        "descripcion": "Aceite hidratante con aroma a madera",
        "is_active": True,
    },
    # Ropa
    {
        "nombre": "Remera Barbería",
        "variante": "M",
        "categoria": "Ropa",
        "precio_costo": 5000.00,
        "precio_venta": 9500.00,
        "stock_actual": 8,
        "descripcion": "Remera negra con logo de barbería",
        "is_active": True,
    },
    {
        "nombre": "Remera Barbería",
        "variante": "L",
        "categoria": "Ropa",
        "precio_costo": 5000.00,
        "precio_venta": 9500.00,
        "stock_actual": 5,
        "descripcion": "Remera negra con logo de barbería",
        "is_active": True,
    },
    {
        "nombre": "Buzo Oversize",
        "variante": "XL",
        "categoria": "Ropa",
        "precio_costo": 12000.00,
        "precio_venta": 22000.00,
        "stock_actual": 3,
        "descripcion": "Buzo oversize negro premium",
        "is_active": True,
    },
    # Accesorios
    {
        "nombre": "Peine de Madera",
        "variante": None,
        "categoria": "Accesorios",
        "precio_costo": 1500.00,
        "precio_venta": 3000.00,
        "stock_actual": 25,
        "descripcion": "Peine de madera natural para barba",
        "is_active": True,
    },
    {
        "nombre": "Tijeras Profesionales",
        "variante": "6 pulgadas",
        "categoria": "Accesorios",
        "precio_costo": 8000.00,
        "precio_venta": 15000.00,
        "stock_actual": 4,
        "descripcion": "Tijeras de acero inoxidable para barberos",
        "is_active": True,
    },
    {
        "nombre": "Navaja de Afeitar",
        "variante": None,
        "categoria": "Accesorios",
        "precio_costo": 6500.00,
        "precio_venta": 12000.00,
        "stock_actual": 6,
        "descripcion": "Navaja clásica con mango de madera",
        "is_active": True,
    },
]

productos = []
for data in productos_data:
    producto = Producto.objects.create(**data)
    productos.append(producto)
    variante_str = f" ({producto.variante})" if producto.variante else ""
    print(f"  ✓ Producto creado: {producto.nombre}{variante_str} - ${producto.precio_venta} - Stock: {producto.stock_actual}")

# Crear turnos demo (próxima semana)
print("\nCreando turnos de ejemplo...")
hoy = timezone.now().date()
proxima_semana = hoy + timedelta(days=7)

turnos_data = [
    {
        "barbero": barberos[0],
        "cliente_nombre": "Roberto Fernández",
        "cliente_telefono": "+5491155555555",
        "servicio": servicios[0],  # Corte
        "fecha": proxima_semana,
        "hora": "10:00",
        "estado": "confirmado",
        "notas": "Cliente regular, prefiere corte corto",
    },
    {
        "barbero": barberos[0],
        "cliente_nombre": "Martín López",
        "cliente_telefono": "+5491166666666",
        "servicio": servicios[2],  # Corte + Barba
        "fecha": proxima_semana,
        "hora": "11:00",
        "estado": "confirmado",
        "notas": "Primera vez",
    },
    {
        "barbero": barberos[1],
        "cliente_nombre": "Facundo Silva",
        "cliente_telefono": "+5491177777777",
        "servicio": servicios[1],  # Barba
        "fecha": proxima_semana,
        "hora": "10:30",
        "estado": "confirmado",
        "notas": "",
    },
    {
        "barbero": barberos[1],
        "cliente_nombre": "Gastón Romero",
        "cliente_telefono": "+5491188888888",
        "servicio": servicios[0],  # Corte
        "fecha": proxima_semana + timedelta(days=1),
        "hora": "15:00",
        "estado": "pendiente",
        "notas": "Confirmado por WhatsApp",
    },
    {
        "barbero": barberos[2],
        "cliente_nombre": "Roberto Fernández",
        "cliente_telefono": "+5491155555555",
        "servicio": servicios[3],  # Cejas
        "fecha": proxima_semana + timedelta(days=2),
        "hora": "16:00",
        "estado": "confirmado",
        "notas": "",
    },
]

for data in turnos_data:
    turno = Turno.objects.create(**data)
    print(f"  ✓ Turno creado: {turno.cliente_nombre} - {turno.servicio.nombre} - {turno.fecha}")

# Resumen
print("\n" + "="*60)
print("✅ DATOS DE DEMOSTRACIÓN CARGADOS EXITOSAMENTE")
print("="*60)
print(f"📊 Barberos creados: {Barbero.objects.count()}")
print(f"💈 Servicios creados: {Servicio.objects.count()}")print(f"📦 Productos creados: {Producto.objects.count()}")print(f"� Turnos creados: {Turno.objects.count()}")
print("="*60)
print("\n🎉 ¡Listo! Tu base de datos demo está configurada.")
print("\n📋 Usuarios de prueba:")
print("   Admin: BarberDemo / (tu contraseña)")
print("\n🌐 Accede al admin en: https://barberdemo.pythonanywhere.com/admin")
