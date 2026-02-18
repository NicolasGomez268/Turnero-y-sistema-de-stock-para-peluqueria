#!/usr/bin/env python
"""
Script para poblar la base de datos con datos de prueba
Simula una semana muy ocupada en la barbería
"""
import os
import django
import random
from datetime import date, timedelta, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tincho_barberia.settings')
django.setup()

from turnos.models import Turno, Barbero, Servicio, EstadoTurno

# Listas de nombres ficticios
nombres = [
    "Juan Pérez", "María González", "Carlos Rodríguez", "Ana Martínez",
    "Luis López", "Laura Sánchez", "Diego Fernández", "Sofía Torres",
    "Mateo Ramírez", "Valentina Castro", "Santiago Flores", "Camila Ruiz",
    "Nicolás Morales", "Isabella Reyes", "Benjamín Medina", "Martina Ortiz",
    "Lucas Silva", "Emma Gutiérrez", "Thiago Vargas", "Mía Herrera",
    "Matías Romero", "Olivia Jiménez", "Sebastián Díaz", "Catalina Alvarez",
    "Joaquín Mendoza", "Julieta Rojas", "Felipe Castro", "Victoria Núñez",
    "Tomás Sosa", "Renata Paz", "Agustín Luna", "Delfina Vega",
    "Dante Ríos", "Luciana Cruz", "Facundo Molina", "Antonella Moreno",
    "Lautaro Domínguez", "Guadalupe Acosta", "Francisco Suárez", "Abril Cabrera",
    "Bautista Gil", "Milagros Ibáñez", "Ignacio Navarro", "Jazmín Márquez",
    "Gabriel Ramos", "Emilia Carrasco", "Manuel Fuentes", "Bianca Espinoza",
    "Pedro Cortés", "Zoe Campos", "Adrián Aguilar", "Luna Guerrero"
]

# Horarios disponibles (de 9:00 a 19:00, cada 30 min)
def generar_horarios():
    horarios = []
    for hora in range(9, 20):
        for minuto in [0, 30]:
            if hora == 19 and minuto == 30:
                break  # No generar turnos después de 19:00
            horarios.append(time(hora, minuto))
    return horarios

def generar_telefono():
    """Genera un teléfono argentino ficticio"""
    return f"3731{random.randint(100000, 999999)}"

def poblar_turnos():
    # Obtener todos los barberos y servicios
    barberos = list(Barbero.objects.filter(is_active=True))
    servicios = list(Servicio.objects.filter(is_active=True))
    
    if not barberos:
        print("❌ No hay barberos activos en la base de datos")
        return
    
    if not servicios:
        print("❌ No hay servicios activos en la base de datos")
        return
    
    print(f"📊 Barberos disponibles: {len(barberos)}")
    print(f"📊 Servicios disponibles: {len(servicios)}")
    for b in barberos:
        print(f"   - {b.nombre}")
    
    # Limpiar turnos existentes (opcional)
    confirmar = input("\n⚠️  ¿Deseas eliminar todos los turnos existentes? (s/n): ")
    if confirmar.lower() == 's':
        Turno.objects.all().delete()
        print("✅ Turnos anteriores eliminados")
    
    horarios = generar_horarios()
    turnos_creados = 0
    
    # Generar turnos para los próximos 7 días
    fecha_inicio = date.today()
    
    print(f"\n🚀 Generando turnos desde {fecha_inicio}...")
    
    for dia in range(7):  # 7 días
        fecha_actual = fecha_inicio + timedelta(days=dia)
        
        # Para cada barbero
        for barbero in barberos:
            # Determinar cuántos turnos tendrá este barbero este día (entre 8 y 15)
            cantidad_turnos = random.randint(8, 15)
            
            # Seleccionar horarios aleatorios sin repetir
            horarios_dia = random.sample(horarios, cantidad_turnos)
            horarios_dia.sort()
            
            for hora in horarios_dia:
                # Seleccionar servicio aleatorio
                servicio = random.choice(servicios)
                
                # Seleccionar cliente aleatorio
                cliente = random.choice(nombres)
                telefono = generar_telefono()
                
                # Determinar estado del turno
                # Si es pasado o presente: mayor probabilidad de REALIZADO
                # Si es futuro: PENDIENTE
                if fecha_actual < date.today():
                    # Turnos pasados: 80% REALIZADO, 15% CANCELADO, 5% PENDIENTE
                    estados = [EstadoTurno.REALIZADO] * 16 + [EstadoTurno.CANCELADO] * 3 + [EstadoTurno.PENDIENTE]
                    estado = random.choice(estados)
                elif fecha_actual == date.today():
                    # Turnos de hoy: 60% PENDIENTE, 30% REALIZADO, 10% CANCELADO
                    hora_actual = time(12, 0)  # Punto de referencia: mediodía
                    if hora < hora_actual:
                        # Turnos de la mañana: más probabilidad de REALIZADO
                        estados = [EstadoTurno.REALIZADO] * 7 + [EstadoTurno.PENDIENTE] * 2 + [EstadoTurno.CANCELADO]
                    else:
                        # Turnos de la tarde: más PENDIENTE
                        estados = [EstadoTurno.PENDIENTE] * 6 + [EstadoTurno.REALIZADO] * 3 + [EstadoTurno.CANCELADO]
                    estado = random.choice(estados)
                else:
                    # Turnos futuros: 90% PENDIENTE, 10% CANCELADO
                    estados = [EstadoTurno.PENDIENTE] * 9 + [EstadoTurno.CANCELADO]
                    estado = random.choice(estados)
                
                # Crear el turno
                try:
                    Turno.objects.create(
                        barbero=barbero,
                        servicio=servicio,
                        fecha=fecha_actual,
                        hora=hora,
                        cliente_nombre=cliente,
                        cliente_telefono=telefono,
                        estado=estado,
                        notas="" if random.random() > 0.2 else "Cliente frecuente"
                    )
                    turnos_creados += 1
                except Exception as e:
                    print(f"⚠️  Error al crear turno: {e}")
        
        print(f"✅ Día {dia + 1} ({fecha_actual}): Turnos generados")
    
    print(f"\n🎉 ¡Proceso completado!")
    print(f"📊 Total de turnos creados: {turnos_creados}")
    
    # Estadísticas finales
    print("\n📈 Estadísticas:")
    print(f"   - Turnos PENDIENTES: {Turno.objects.filter(estado=EstadoTurno.PENDIENTE).count()}")
    print(f"   - Turnos REALIZADOS: {Turno.objects.filter(estado=EstadoTurno.REALIZADO).count()}")
    print(f"   - Turnos CANCELADOS: {Turno.objects.filter(estado=EstadoTurno.CANCELADO).count()}")
    
    # Ingresos estimados
    turnos_realizados = Turno.objects.filter(estado=EstadoTurno.REALIZADO)
    total_ingresos = sum([float(t.servicio.precio) for t in turnos_realizados if t.servicio.precio])
    print(f"\n💰 Ingresos totales (turnos realizados): ${total_ingresos:,.2f}")

if __name__ == '__main__':
    print("=" * 60)
    print("  🔥 GENERADOR DE DATOS DE PRUEBA - TINCHO BARBERÍA 🔥")
    print("=" * 60)
    poblar_turnos()
