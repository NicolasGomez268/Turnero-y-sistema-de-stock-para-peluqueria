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

from turnos.models import Barbero, Servicio, Turno, Cliente
from django.contrib.auth.models import User

print("🎭 Cargando datos de demostración...")

# Limpiar datos existentes (excepto superuser)
print("Limpiando datos anteriores...")
Turno.objects.all().delete()
Cliente.objects.all().delete()
Servicio.objects.all().delete()
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

# Crear clientes demo
print("\nCreando clientes...")
clientes_data = [
    {
        "nombre": "Roberto Fernández",
        "email": "roberto@example.com",
        "telefono": "+5491155555555",
    },
    {
        "nombre": "Martín López",
        "email": "martin@example.com",
        "telefono": "+5491166666666",
    },
    {
        "nombre": "Facundo Silva",
        "email": "facundo@example.com",
        "telefono": "+5491177777777",
    },
    {
        "nombre": "Gastón Romero",
        "email": "gaston@example.com",
        "telefono": "+5491188888888",
    },
]

clientes = []
for data in clientes_data:
    cliente = Cliente.objects.create(**data)
    clientes.append(cliente)
    print(f"  ✓ Cliente creado: {cliente.nombre}")

# Crear turnos demo (próxima semana)
print("\nCreando turnos de ejemplo...")
hoy = timezone.now().date()
proxima_semana = hoy + timedelta(days=7)

turnos_data = [
    {
        "barbero": barberos[0],
        "cliente": clientes[0],
        "servicio": servicios[0],  # Corte
        "fecha": proxima_semana,
        "hora_inicio": "10:00",
        "estado": "confirmado",
        "notas": "Cliente regular, prefiere corte corto",
    },
    {
        "barbero": barberos[0],
        "cliente": clientes[1],
        "servicio": servicios[2],  # Corte + Barba
        "fecha": proxima_semana,
        "hora_inicio": "11:00",
        "estado": "confirmado",
        "notas": "Primera vez",
    },
    {
        "barbero": barberos[1],
        "cliente": clientes[2],
        "servicio": servicios[1],  # Barba
        "fecha": proxima_semana,
        "hora_inicio": "10:30",
        "estado": "confirmado",
        "notas": "",
    },
    {
        "barbero": barberos[1],
        "cliente": clientes[3],
        "servicio": servicios[0],  # Corte
        "fecha": proxima_semana + timedelta(days=1),
        "hora_inicio": "15:00",
        "estado": "pendiente",
        "notas": "Confirmado por WhatsApp",
    },
    {
        "barbero": barberos[2],
        "cliente": clientes[0],
        "servicio": servicios[3],  # Cejas
        "fecha": proxima_semana + timedelta(days=2),
        "hora_inicio": "16:00",
        "estado": "confirmado",
        "notas": "",
    },
]

for data in turnos_data:
    turno = Turno.objects.create(**data)
    print(f"  ✓ Turno creado: {turno.cliente.nombre} - {turno.servicio.nombre} - {turno.fecha}")

# Resumen
print("\n" + "="*60)
print("✅ DATOS DE DEMOSTRACIÓN CARGADOS EXITOSAMENTE")
print("="*60)
print(f"📊 Barberos creados: {Barbero.objects.count()}")
print(f"💈 Servicios creados: {Servicio.objects.count()}")
print(f"👤 Clientes creados: {Cliente.objects.count()}")
print(f"📅 Turnos creados: {Turno.objects.count()}")
print("="*60)
print("\n🎉 ¡Listo! Tu base de datos demo está configurada.")
print("\n📋 Usuarios de prueba:")
print("   Admin: demo / Demo2026!")
print("\n🌐 Accede al admin en: https://barberdemo.pythonanywhere.com/admin")
