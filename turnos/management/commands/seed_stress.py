"""
Comando para poblar la base de datos con muchos registros y testear
paginacion, rendimiento y UI en todas las vistas del admin.

Uso:
    python manage.py seed_stress            # carga todo
    python manage.py seed_stress --clear    # limpia y vuelve a cargar
"""
import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.timezone import make_aware
from datetime import date, time, timedelta, datetime
from decimal import Decimal
from turnos.models import Barbero, Servicio, Turno, EstadoTurno, HorarioAtencion
from inventario.models import Producto, Venta


# ── Parametros de volumen ──────────────────────────────────────
DIAS_HISTORIAL    = 60   # dias hacia atras con turnos realizados
TURNOS_POR_DIA    = 6    # turnos REALIZADO por dia (aprox)
TURNOS_PENDIENTES = 15   # turnos PENDIENTE para los proximos dias
TURNOS_CANCELADOS = 20   # turnos CANCELADO en el historial
CANT_PRODUCTOS    = 35   # fichas de productos distintos
VENTAS_HISTORIAL  = 80   # ventas de productos en el historial
# ────────────────────────────────────────────────────────────────

METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']

NOMBRES_CLIENTES = [
    'Matias Romero', 'Lucas Gonzalez', 'Santiago Lopez', 'Facundo Martinez',
    'Nicolas Garcia', 'Agustin Diaz', 'Federico Torres', 'Tomas Ruiz',
    'Joaquin Flores', 'Ignacio Perez', 'Rodrigo Sanchez', 'Ezequiel Castro',
    'Marcos Ortiz', 'Pablo Herrera', 'Sebastian Morales', 'Cristian Nunez',
    'Andres Vargas', 'Diego Suarez', 'Leandro Ramos', 'Gustavo Medina',
    'Hernan Silva', 'Ramiro Fernandez', 'Walter Rojas', 'Emilio Mendoza',
    'Claudio Paredes', 'Ariel Reyes', 'Damian Espinoza', 'Esteban Vera',
]

TELEFONOS = [
    '+5491112345678', '+5491123456789', '+5491134567890', '+5491145678901',
    '+5491156789012', '+5491167890123', '+5491178901234', '+5491189012345',
]

SERVICIOS_DATA = [
    ('Corte clasico',       30, 3500),
    ('Corte + barba',       50, 5500),
    ('Arreglo de barba',    25, 2500),
    ('Diseno de barba',     40, 3800),
    ('Degradado',           35, 4000),
    ('Corte infantil',      25, 2800),
    ('Alisado temporal',    60, 6500),
    ('Coloracion',          90, 9000),
    ('Tratamiento capilar', 45, 5000),
    ('Combo VIP',           90, 12000),
]

PRODUCTOS_DATA = [
    # (nombre, variante, categoria, precio, stock)
    # Stock alto (999) para que el seed no falle por validacion de stock insuficiente
    ('Remera Tincho Barberia', 'Blanca S',  'Ropa',            4500, 999),
    ('Remera Tincho Barberia', 'Blanca M',  'Ropa',            4500, 999),
    ('Remera Tincho Barberia', 'Blanca L',  'Ropa',            4500, 999),
    ('Remera Tincho Barberia', 'Negra S',   'Ropa',            4500, 999),
    ('Remera Tincho Barberia', 'Negra M',   'Ropa',            4500, 999),
    ('Remera Tincho Barberia', 'Negra XL',  'Ropa',            4500, 999),
    ('Buzo con capucha',       'Gris M',    'Ropa',            9500, 999),
    ('Buzo con capucha',       'Gris L',    'Ropa',            9500, 999),
    ('Gorra con visera',       'Negra',     'Accesorios',      3200, 999),
    ('Gorra con visera',       'Blanca',    'Accesorios',      3200, 999),
    ('Pomada fuerte',          '100g',      'Cuidado capilar', 2800, 999),
    ('Pomada mate',            '100g',      'Cuidado capilar', 2800, 999),
    ('Cera capilar',           '150ml',     'Cuidado capilar', 3100, 999),
    ('Spray fijador',          '200ml',     'Cuidado capilar', 2200, 999),
    ('Shampoo anticaspa',      '400ml',     'Cuidado capilar', 1800, 999),
    ('Shampoo para barba',     '250ml',     'Cuidado capilar', 2100, 999),
    ('Acondicionador',         '400ml',     'Cuidado capilar', 1700, 999),
    ('Aceite para barba',      '30ml',      'Cuidado capilar', 3500, 999),
    ('Balsamo para barba',     '50ml',      'Cuidado capilar', 2900, 999),
    ('Peine de madera',        'Grande',    'Accesorios',       850, 999),
    ('Peine de madera',        'Chico',     'Accesorios',       650, 999),
    ('Cepillo de barba',       'Natural',   'Accesorios',      1900, 999),
    ('Navaja clasica',         'Plateada',  'Accesorios',      5500, 999),
    ('Set regalo barba',       'Completo',  'Varios',          8900, 999),
    ('Afeitadora electrica',   'Basica',    'Varios',         15000, 999),
    ('Aftershave locion',      '100ml',     'Higiene',         1600, 999),
    ('Espuma de afeitar',      '200ml',     'Higiene',         1200, 999),
    ('Crema hidratante',       '75ml',      'Higiene',         2400, 999),
    ('Desodorante',            'Sport',     'Higiene',          900, 999),
    ('Talco corporal',         '150g',      'Higiene',          750, 999),
    ('Toalla microfibra',      'Negra M',   'Varios',          2200, 999),
    ('Bolsa tela Tincho',      'Unica',     'Varios',          1500, 999),
    ('Agenda de bolsillo',     '2026',      'Varios',          1100, 999),
    ('Sticker pack Tincho',    'x5',        'Varios',           400, 999),
    ('Voucher regalo',         '$5000',     'Varios',          5000, 999),
]


class Command(BaseCommand):
    help = 'Pobla la DB con muchos registros para testear UI, paginacion y rendimiento'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Elimina turnos, ventas y productos antes de crear los nuevos',
        )

    def handle(self, *args, **options):
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('  SEED STRESS - Cargando datos de prueba')
        self.stdout.write('=' * 60 + '\n')

        if options['clear']:
            self._limpiar_datos()

        with transaction.atomic():
            barberos  = self._obtener_barberos()
            servicios = self._crear_servicios()
            self._crear_horarios(barberos)
            productos = self._crear_productos()
            self._crear_turnos(barberos, servicios)
            self._crear_ventas(productos, barberos)

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('  RESUMEN FINAL'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'  Barberos       : {Barbero.objects.count():>5}')
        self.stdout.write(f'  Servicios      : {Servicio.objects.count():>5}')
        self.stdout.write(f'  Productos      : {Producto.objects.count():>5}')
        self.stdout.write(f'  Ventas         : {Venta.objects.count():>5}')
        t_total = Turno.objects.count()
        t_real  = Turno.objects.filter(estado=EstadoTurno.REALIZADO).count()
        t_pend  = Turno.objects.filter(estado=EstadoTurno.PENDIENTE).count()
        t_canc  = Turno.objects.filter(estado=EstadoTurno.CANCELADO).count()
        self.stdout.write(f'  Turnos total   : {t_total:>5}')
        self.stdout.write(f'    REALIZADO    : {t_real:>5}')
        self.stdout.write(f'    PENDIENTE    : {t_pend:>5}')
        self.stdout.write(f'    CANCELADO    : {t_canc:>5}')
        self.stdout.write('=' * 60 + '\n')

    # ── Helpers ──────────────────────────────────────────────────

    def _limpiar_datos(self):
        self.stdout.write('!! Limpiando turnos, ventas y productos...')
        Venta.objects.all().delete()
        Producto.objects.all().delete()
        Turno.objects.all().delete()
        self.stdout.write('   Listo.\n')

    def _obtener_barberos(self):
        barberos = list(Barbero.objects.filter(is_active=True))
        if not barberos:
            self.stdout.write(self.style.ERROR(
                '  ERROR: No hay barberos activos. Crealos desde el panel admin primero.'
            ))
            raise SystemExit(1)
        self.stdout.write(f'  Barberos  -> {len(barberos)} encontrados')
        return barberos

    def _crear_servicios(self):
        creados = 0
        servicios = []
        for nombre, duracion, precio in SERVICIOS_DATA:
            s, created = Servicio.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'descripcion': f'Servicio: {nombre}',
                    'duracion_minutos': duracion,
                    'precio': Decimal(str(precio)),
                    'is_active': True,
                }
            )
            servicios.append(s)
            if created:
                creados += 1
        self.stdout.write(f'  Servicios -> {creados} nuevos / {len(servicios)} total')
        return servicios

    def _crear_horarios(self, barberos):
        creados = 0
        for barbero in barberos:
            for dia in range(6):  # Lun a Sab
                _, created = HorarioAtencion.objects.get_or_create(
                    barbero=barbero,
                    dia_semana=dia,
                    defaults={
                        'hora_inicio': time(9, 0),
                        'hora_fin':    time(20, 0),
                    }
                )
                if created:
                    creados += 1
        self.stdout.write(f'  Horarios  -> {creados} nuevos configurados')

    def _crear_productos(self):
        creados = 0
        productos = []
        for nombre, variante, categoria, precio_venta, stock in PRODUCTOS_DATA:
            precio_costo = Decimal(str(int(precio_venta * 0.6)))  # costo = 60% del precio de venta
            p, created = Producto.objects.get_or_create(
                nombre=nombre,
                variante=variante,
                defaults={
                    'categoria': categoria,
                    'precio_costo': precio_costo,
                    'precio_venta': Decimal(str(precio_venta)),
                    'stock_actual': stock,
                    'is_active': True,
                }
            )
            productos.append(p)
            if created:
                creados += 1
        self.stdout.write(f'  Productos -> {creados} nuevos / {len(productos)} total')
        return productos

    def _crear_turnos(self, barberos, servicios):
        hoy = timezone.localdate()
        horas = [time(h, 0) for h in range(9, 20)]
        creados = 0

        # 1. Turnos REALIZADO en el historial
        for dias_atras in range(1, DIAS_HISTORIAL + 1):
            fecha = hoy - timedelta(days=dias_atras)
            if fecha.weekday() == 6:  # domingo
                continue
            ocupados = set()
            for _ in range(TURNOS_POR_DIA):
                barbero  = random.choice(barberos)
                servicio = random.choice(servicios)
                hora     = random.choice(horas)
                if (barbero.id, hora) in ocupados:
                    continue
                ocupados.add((barbero.id, hora))
                if not Turno.objects.filter(barbero=barbero, fecha=fecha, hora=hora).exists():
                    Turno.objects.create(
                        fecha=fecha,
                        hora=hora,
                        barbero=barbero,
                        servicio=servicio,
                        cliente_nombre=random.choice(NOMBRES_CLIENTES),
                        cliente_telefono=random.choice(TELEFONOS),
                        estado=EstadoTurno.REALIZADO,
                        metodo_pago=random.choice(METODOS_PAGO),
                    )
                    creados += 1

        # 2. Turnos PENDIENTE futuros
        for _ in range(TURNOS_PENDIENTES):
            fecha    = hoy + timedelta(days=random.randint(1, 14))
            barbero  = random.choice(barberos)
            hora     = random.choice(horas)
            servicio = random.choice(servicios)
            if not Turno.objects.filter(barbero=barbero, fecha=fecha, hora=hora).exists():
                Turno.objects.create(
                    fecha=fecha,
                    hora=hora,
                    barbero=barbero,
                    servicio=servicio,
                    cliente_nombre=random.choice(NOMBRES_CLIENTES),
                    cliente_telefono=random.choice(TELEFONOS),
                    estado=EstadoTurno.PENDIENTE,
                )
                creados += 1

        # 3. Turnos CANCELADO en el historial (usan :30 para no chocar con los :00)
        for _ in range(TURNOS_CANCELADOS):
            fecha    = hoy - timedelta(days=random.randint(1, DIAS_HISTORIAL))
            barbero  = random.choice(barberos)
            hora     = time(random.randint(9, 19), 30)
            servicio = random.choice(servicios)
            if not Turno.objects.filter(barbero=barbero, fecha=fecha, hora=hora).exists():
                Turno.objects.create(
                    fecha=fecha,
                    hora=hora,
                    barbero=barbero,
                    servicio=servicio,
                    cliente_nombre=random.choice(NOMBRES_CLIENTES),
                    cliente_telefono=random.choice(TELEFONOS),
                    estado=EstadoTurno.CANCELADO,
                )
                creados += 1

        self.stdout.write(f'  Turnos    -> {creados} nuevos creados')

    def _crear_ventas(self, productos, barberos):
        hoy = timezone.localdate()
        creados = 0
        nombres_barberos = [b.nombre for b in barberos]

        for _ in range(VENTAS_HISTORIAL):
            dias_atras = random.randint(0, DIAS_HISTORIAL)
            fecha_v    = hoy - timedelta(days=dias_atras)
            prod       = random.choice(productos)
            cantidad   = random.randint(1, 2)
            total      = prod.precio_venta * cantidad

            venta = Venta.objects.create(
                producto=prod,
                cantidad=cantidad,
                precio_unitario=prod.precio_venta,
                total=total,
                metodo_pago=random.choice(METODOS_PAGO),
                vendedor=random.choice(nombres_barberos),
            )

            # Sobreescribir fecha para simular historial real
            dt = datetime(
                fecha_v.year, fecha_v.month, fecha_v.day,
                random.randint(9, 20), random.randint(0, 59),
            )
            Venta.objects.filter(pk=venta.pk).update(fecha=make_aware(dt))
            creados += 1

        self.stdout.write(f'  Ventas    -> {creados} nuevas creadas')
