#!/usr/bin/env python
"""Script temporal para corregir precios de servicios"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tincho_barberia.settings')
django.setup()

from turnos.models import Servicio, Turno
from decimal import Decimal
from datetime import date, timedelta

print('=== ACTUALIZANDO PRECIOS ===')
servicios = Servicio.objects.all()
for s in servicios:
    if s.id == 13:  # Combo
        s.precio = Decimal('15000.00')
        s.save()
    elif s.id == 16:  # Corte
        s.precio = Decimal('10000.00')
        s.save()
    print(f'{s.id} | {s.nombre} | ${s.precio}')

print('\n=== TURNOS REALIZADOS ===')
turnos_realizados = Turno.objects.filter(estado='REALIZADO')
for t in turnos_realizados:
    print(f'{t.fecha} | {t.hora} | {t.cliente_nombre} | {t.servicio.nombre} | ${t.servicio.precio}')

ganancia = sum([float(t.servicio.precio) for t in turnos_realizados if t.servicio.precio])
print(f'\nGanancia total de turnos REALIZADOS: ${ganancia}')
