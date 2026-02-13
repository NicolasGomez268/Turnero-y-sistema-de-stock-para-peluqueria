"""
Comando de administración para cargar datos iniciales de prueba.
Uso: python manage.py load_data
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from turnos.models import Barbero, Servicio, Turno, EstadoTurno, HorarioAtencion
from datetime import date, time, timedelta


class Command(BaseCommand):
    help = 'Carga datos iniciales de prueba para TINCHO Barbería'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Elimina todos los datos existentes antes de cargar los nuevos',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Creando datos iniciales de TINCHO Barbería...'))
        
        # Limpiar datos existentes si se especifica el flag
        if options['clear']:
            self.stdout.write('🧹 Limpiando datos anteriores...')
            Turno.objects.all().delete()
            Barbero.objects.all().delete()
            Servicio.objects.all().delete()
            self.stdout.write(self.style.WARNING('  ✓ Datos anteriores eliminados'))
        
        # CREAR BARBEROS
        self.stdout.write('\n✂️ Creando barberos...')
        barbero1, created = Barbero.objects.get_or_create(
            nombre="Martín 'Tincho' González",
            defaults={
                'telefono': "+541112345678",
                'color_hex': "#3B82F6",  # Azul
                'is_active': True
            }
        )
        self.stdout.write(f"  {'✓ Creado' if created else '→ Ya existe'}: {barbero1.nombre}")
        
        barbero2, created = Barbero.objects.get_or_create(
            nombre="Lucas Fernández",
            defaults={
                'telefono': "+541123456789",
                'color_hex': "#10B981",  # Verde
                'is_active': True
            }
        )
        self.stdout.write(f"  {'✓ Creado' if created else '→ Ya existe'}: {barbero2.nombre}")
        
        barbero3, created = Barbero.objects.get_or_create(
            nombre="Sebastián Rodríguez",
            defaults={
                'telefono': "+541134567890",
                'color_hex': "#F59E0B",  # Naranja
                'is_active': True
            }
        )
        self.stdout.write(f"  {'✓ Creado' if created else '→ Ya existe'}: {barbero3.nombre}")
        
        # CREAR HORARIOS DE ATENCIÓN
        self.stdout.write('\n🕐 Creando horarios de atención...')
        
        # Horarios para cada barbero (Lunes a Viernes: 9-13 y 16-21, Sábado: 9-15)
        barberos = [barbero1, barbero2, barbero3]
        horarios_creados = 0
        
        for barbero in barberos:
            # Lunes a Viernes (0-4): 09:00-21:00 con descanso 13:00-16:00
            for dia in range(5):  # 0=Lunes, 4=Viernes
                horario, created = HorarioAtencion.objects.get_or_create(
                    barbero=barbero,
                    dia_semana=dia,
                    defaults={
                        'hora_inicio': time(9, 0),
                        'hora_fin': time(21, 0),
                        'descanso_inicio': time(13, 0),
                        'descanso_fin': time(16, 0)
                    }
                )
                if created:
                    horarios_creados += 1
                    self.stdout.write(f"  ✓ {barbero.nombre.split()[0]} - {horario.get_dia_semana_display()}: 09:00-13:00 y 16:00-21:00")
            
            # Sábado (5): 09:00-15:00 sin descanso
            horario, created = HorarioAtencion.objects.get_or_create(
                barbero=barbero,
                dia_semana=5,
                defaults={
                    'hora_inicio': time(9, 0),
                    'hora_fin': time(15, 0),
                    'descanso_inicio': None,
                    'descanso_fin': None
                }
            )
            if created:
                horarios_creados += 1
                self.stdout.write(f"  ✓ {barbero.nombre.split()[0]} - Sábado: 09:00-15:00")
            
            # Domingo (6): Franco (no se crea horario)
        
        self.stdout.write(f"  → Total horarios creados: {horarios_creados}")
        
        # CREAR SERVICIOS
        self.stdout.write('\n💈 Creando servicios...')
        
        servicio_corte, created = Servicio.objects.get_or_create(
            nombre="Corte de Cabello",
            defaults={
                'descripcion': "Corte clásico o moderno según preferencia del cliente",
                'precio': 5000.00,
                'duracion_minutos': 30,
                'is_active': True
            }
        )
        self.stdout.write(f"  {'✓ Creado' if created else '→ Ya existe'}: {servicio_corte.nombre} - ${servicio_corte.precio}")
        
        servicio_barba, created = Servicio.objects.get_or_create(
            nombre="Arreglo de Barba",
            defaults={
                'descripcion': "Perfilado, recorte y acabado profesional de barba",
                'precio': 3500.00,
                'duracion_minutos': 20,
                'is_active': True
            }
        )
        self.stdout.write(f"  {'✓ Creado' if created else '→ Ya existe'}: {servicio_barba.nombre} - ${servicio_barba.precio}")
        
        servicio_combo, created = Servicio.objects.get_or_create(
            nombre="Combo Corte + Barba",
            defaults={
                'descripcion': "Servicio completo: corte de cabello y arreglo de barba",
                'precio': 7500.00,
                'duracion_minutos': 45,
                'is_active': True
            }
        )
        self.stdout.write(f"  {'✓ Creado' if created else '→ Ya existe'}: {servicio_combo.nombre} - ${servicio_combo.precio}")
        
        servicio_infantil, created = Servicio.objects.get_or_create(
            nombre="Corte Infantil",
            defaults={
                'descripcion': "Corte especial para niños",
                'precio': 4000.00,
                'duracion_minutos': 25,
                'is_active': True
            }
        )
        self.stdout.write(f"  {'✓ Creado' if created else '→ Ya existe'}: {servicio_infantil.nombre} - ${servicio_infantil.precio}")
        
        servicio_afeitado, created = Servicio.objects.get_or_create(
            nombre="Afeitado Completo",
            defaults={
                'descripcion': "Afeitado tradicional con toalla caliente",
                'precio': 4500.00,
                'duracion_minutos': 30,
                'is_active': True
            }
        )
        self.stdout.write(f"  {'✓ Creado' if created else '→ Ya existe'}: {servicio_afeitado.nombre} - ${servicio_afeitado.precio}")
        
        # CREAR TURNOS DE EJEMPLO
        self.stdout.write('\n📅 Creando turnos de ejemplo...')
        hoy = date.today()
        manana = hoy + timedelta(days=1)
        ayer = hoy - timedelta(days=1)
        
        turnos_data = [
            # Hoy
            {
                "fecha": hoy,
                "hora": time(9, 0),
                "barbero": barbero1,
                "servicio": servicio_corte,
                "cliente_nombre": "Juan Pérez",
                "cliente_telefono": "+541198765432",
                "estado": EstadoTurno.CONFIRMADO,
                "notas": "Prefiere corte corto en los costados"
            },
            {
                "fecha": hoy,
                "hora": time(10, 0),
                "barbero": barbero2,
                "servicio": servicio_combo,
                "cliente_nombre": "Carlos López",
                "cliente_telefono": "+541187654321",
                "estado": EstadoTurno.CONFIRMADO,
                "notas": ""
            },
            {
                "fecha": hoy,
                "hora": time(11, 30),
                "barbero": barbero1,
                "servicio": servicio_barba,
                "cliente_nombre": "Diego Martínez",
                "cliente_telefono": "+541176543210",
                "estado": EstadoTurno.PENDIENTE,
                "notas": "Cliente nuevo"
            },
            {
                "fecha": hoy,
                "hora": time(14, 0),
                "barbero": barbero3,
                "servicio": servicio_infantil,
                "cliente_nombre": "Mateo García (niño)",
                "cliente_telefono": "+541165432109",
                "estado": EstadoTurno.CONFIRMADO,
                "notas": "Tiene 5 años, primer corte"
            },
            # Mañana
            {
                "fecha": manana,
                "hora": time(10, 0),
                "barbero": barbero1,
                "servicio": servicio_corte,
                "cliente_nombre": "Roberto Fernández",
                "cliente_telefono": "+541154321098",
                "estado": EstadoTurno.PENDIENTE,
                "notas": ""
            },
            {
                "fecha": manana,
                "hora": time(11, 0),
                "barbero": barbero2,
                "servicio": servicio_afeitado,
                "cliente_nombre": "Pablo Ramírez",
                "cliente_telefono": "+541143210987",
                "estado": EstadoTurno.PENDIENTE,
                "notas": "Piel sensible"
            },
            {
                "fecha": manana,
                "hora": time(15, 30),
                "barbero": barbero1,
                "servicio": servicio_combo,
                "cliente_nombre": "Andrés Sánchez",
                "cliente_telefono": "+541132109876",
                "estado": EstadoTurno.CONFIRMADO,
                "notas": ""
            },
            # Ayer (realizados para estadísticas)
            {
                "fecha": ayer,
                "hora": time(9, 0),
                "barbero": barbero1,
                "servicio": servicio_corte,
                "cliente_nombre": "Cliente Anterior 1",
                "cliente_telefono": "+541121098765",
                "estado": EstadoTurno.REALIZADO,
                "notas": ""
            },
            {
                "fecha": ayer,
                "hora": time(10, 30),
                "barbero": barbero2,
                "servicio": servicio_combo,
                "cliente_nombre": "Cliente Anterior 2",
                "cliente_telefono": "+541110987654",
                "estado": EstadoTurno.REALIZADO,
                "notas": ""
            },
            {
                "fecha": ayer,
                "hora": time(14, 0),
                "barbero": barbero3,
                "servicio": servicio_barba,
                "cliente_nombre": "Cliente Anterior 3",
                "cliente_telefono": "+541109876543",
                "estado": EstadoTurno.REALIZADO,
                "notas": ""
            },
        ]
        
        turnos_creados = 0
        for turno_data in turnos_data:
            turno, created = Turno.objects.get_or_create(
                fecha=turno_data['fecha'],
                hora=turno_data['hora'],
                barbero=turno_data['barbero'],
                defaults={
                    'servicio': turno_data['servicio'],
                    'cliente_nombre': turno_data['cliente_nombre'],
                    'cliente_telefono': turno_data['cliente_telefono'],
                    'estado': turno_data['estado'],
                    'notas': turno_data['notas']
                }
            )
            if created:
                turnos_creados += 1
                self.stdout.write(f"  ✓ {turno.fecha} {turno.hora} - {turno.cliente_nombre} ({turno.get_estado_display()})")
            else:
                self.stdout.write(f"  → Ya existe: {turno.fecha} {turno.hora} - {turno.cliente_nombre}")
        
        # Resumen
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('📊 RESUMEN DE DATOS'))
        self.stdout.write('='*60)
        self.stdout.write(f"  • Barberos: {Barbero.objects.count()}")
        self.stdout.write(f"  • Horarios de atención: {HorarioAtencion.objects.count()}")
        self.stdout.write(f"  • Servicios: {Servicio.objects.count()}")
        self.stdout.write(f"  • Turnos totales: {Turno.objects.count()}")
        self.stdout.write(f"  • Turnos pendientes: {Turno.objects.filter(estado=EstadoTurno.PENDIENTE).count()}")
        self.stdout.write(f"  • Turnos confirmados: {Turno.objects.filter(estado=EstadoTurno.CONFIRMADO).count()}")
        self.stdout.write(f"  • Turnos realizados: {Turno.objects.filter(estado=EstadoTurno.REALIZADO).count()}")
        self.stdout.write('='*60)
        
        self.stdout.write(self.style.SUCCESS('\n✅ ¡Datos cargados correctamente!'))
        self.stdout.write('\n🌐 Accede al admin en: ' + self.style.HTTP_INFO('http://localhost:8000/admin/'))
        self.stdout.write('🔌 API REST disponible en: ' + self.style.HTTP_INFO('http://localhost:8000/api/'))
