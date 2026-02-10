"""
Script para cargar datos iniciales de prueba en TINCHO Barbería.
Ejecutar: python manage.py shell < load_initial_data.py
O bien: python manage.py runscript load_initial_data (si tiene django-extensions)
"""
from turnos.models import Barbero, Servicio, Turno, EstadoTurno
from datetime import date, time, timedelta

def crear_datos_iniciales():
    """Crea datos de prueba para el sistema"""
    
    print("🚀 Creando datos iniciales de TINCHO Barbería...")
    
    # Limpiar datos existentes (solo en desarrollo)
    print("🧹 Limpiando datos anteriores...")
    Turno.objects.all().delete()
    Barbero.objects.all().delete()
    Servicio.objects.all().delete()
    
    # CREAR BARBEROS
    print("\n✂️ Creando barberos...")
    barbero1 = Barbero.objects.create(
        nombre="Martín 'Tincho' González",
        telefono="+541112345678",
        color_hex="#3B82F6",  # Azul
        is_active=True
    )
    print(f"  ✓ {barbero1.nombre}")
    
    barbero2 = Barbero.objects.create(
        nombre="Lucas Fernández",
        telefono="+541123456789",
        color_hex="#10B981",  # Verde
        is_active=True
    )
    print(f"  ✓ {barbero2.nombre}")
    
    barbero3 = Barbero.objects.create(
        nombre="Sebastián Rodríguez",
        telefono="+541134567890",
        color_hex="#F59E0B",  # Naranja
        is_active=True
    )
    print(f"  ✓ {barbero3.nombre}")
    
    # CREAR SERVICIOS
    print("\n💈 Creando servicios...")
    servicio_corte = Servicio.objects.create(
        nombre="Corte de Cabello",
        descripcion="Corte clásico o moderno según preferencia del cliente",
        precio=5000.00,
        duracion_minutos=30,
        is_active=True
    )
    print(f"  ✓ {servicio_corte.nombre} - ${servicio_corte.precio}")
    
    servicio_barba = Servicio.objects.create(
        nombre="Arreglo de Barba",
        descripcion="Perfilado, recorte y acabado profesional de barba",
        precio=3500.00,
        duracion_minutos=20,
        is_active=True
    )
    print(f"  ✓ {servicio_barba.nombre} - ${servicio_barba.precio}")
    
    servicio_combo = Servicio.objects.create(
        nombre="Combo Corte + Barba",
        descripcion="Servicio completo: corte de cabello y arreglo de barba",
        precio=7500.00,
        duracion_minutos=45,
        is_active=True
    )
    print(f"  ✓ {servicio_combo.nombre} - ${servicio_combo.precio}")
    
    servicio_infantil = Servicio.objects.create(
        nombre="Corte Infantil",
        descripcion="Corte especial para niños",
        precio=4000.00,
        duracion_minutos=25,
        is_active=True
    )
    print(f"  ✓ {servicio_infantil.nombre} - ${servicio_infantil.precio}")
    
    servicio_afeitado = Servicio.objects.create(
        nombre="Afeitado Completo",
        descripcion="Afeitado tradicional con toalla caliente",
        precio=4500.00,
        duracion_minutos=30,
        is_active=True
    )
    print(f"  ✓ {servicio_afeitado.nombre} - ${servicio_afeitado.precio}")
    
    # CREAR TURNOS DE EJEMPLO
    print("\n📅 Creando turnos de ejemplo...")
    hoy = date.today()
    manana = hoy + timedelta(days=1)
    
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
    ]
    
    for turno_data in turnos_data:
        turno = Turno.objects.create(**turno_data)
        print(f"  ✓ {turno.fecha} {turno.hora} - {turno.cliente_nombre} ({turno.get_estado_display()})")
    
    # Crear algunos turnos realizados (para estadísticas)
    ayer = hoy - timedelta(days=1)
    turnos_realizados = [
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
    
    for turno_data in turnos_realizados:
        Turno.objects.create(**turno_data)
    
    print("\n📊 Resumen de datos creados:")
    print(f"  • Barberos: {Barbero.objects.count()}")
    print(f"  • Servicios: {Servicio.objects.count()}")
    print(f"  • Turnos totales: {Turno.objects.count()}")
    print(f"  • Turnos pendientes: {Turno.objects.filter(estado=EstadoTurno.PENDIENTE).count()}")
    print(f"  • Turnos confirmados: {Turno.objects.filter(estado=EstadoTurno.CONFIRMADO).count()}")
    print(f"  • Turnos realizados: {Turno.objects.filter(estado=EstadoTurno.REALIZADO).count()}")
    
    print("\n✅ ¡Datos iniciales cargados correctamente!")
    print("🌐 Accede al admin en: http://localhost:8000/admin/")
    print("🔌 API REST disponible en: http://localhost:8000/api/")

if __name__ == "__main__":
    crear_datos_iniciales()
