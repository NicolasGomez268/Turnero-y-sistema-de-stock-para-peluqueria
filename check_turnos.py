#!/usr/bin/env python
"""Script para verificar estados de turnos"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tincho_barberia.settings')
django.setup()

from turnos.models import Turno

print('=== TODOS LOS TURNOS ===')
turnos = Turno.objects.all().order_by('-fecha', 'hora')
for t in turnos:
    print(f'ID: {t.id} | {t.fecha} {t.hora} | {t.cliente_nombre} | {t.servicio.nombre} | Estado: {t.estado}')
    print(f'  Creado: {t.created_at if hasattr(t, "created_at") else "N/A"}')
    print()
