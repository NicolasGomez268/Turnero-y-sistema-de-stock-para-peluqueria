# 🗂️ DIAGRAMA DE BASE DE DATOS - TINCHO Barbería

## Modelo Entidad-Relación

```
┌─────────────────────────────────────┐
│           BARBERO                   │
│─────────────────────────────────────│
│ 🔑 id (PK)                          │
│ 📝 nombre                           │
│ 📷 foto                             │
│ 📞 telefono                         │
│ ✅ is_active                        │
│ 🎨 color_hex                        │
│ 📅 fecha_ingreso                    │
└─────────────────────────────────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────────────────────┐
│            TURNO                    │
│─────────────────────────────────────│
│ 🔑 id (PK)                          │
│ 📅 fecha                            │
│ 🕐 hora                             │
│ 🔗 barbero_id (FK) ────────────────┐│
│ 🔗 servicio_id (FK) ───────┐       ││
│ 👤 cliente_nombre          │       ││
│ 📞 cliente_telefono        │       ││
│ 📊 estado (Enum)           │       ││
│ 📝 notas                   │       ││
│ 📅 creado_en               │       ││
│ 📅 actualizado_en          │       ││
└────────────────────────────┼───────┼┘
                             │       │
                             │ N:1   │ N:1
                             │       │
                             ▼       │
┌─────────────────────────────────────┐│
│           SERVICIO                  ││
│─────────────────────────────────────┤│
│ 🔑 id (PK)                          ││
│ 📝 nombre                           ││
│ 📄 descripcion                      ││
│ 💰 precio                           ││
│ ⏱️ duracion_minutos                 ││
│ ✅ is_active                        ││
│ 📅 creado_en                        ││
└─────────────────────────────────────┘│
                                       │
                                       │
                                       └────────────────┘
```

## 📋 Estados del Turno (Enum)

```
┌────────────────────────────────────────────────┐
│         EstadoTurno (TextChoices)              │
├────────────────────────────────────────────────┤
│  🟡 PENDIENTE   → Turno creado, sin confirmar  │
│  🔵 CONFIRMADO  → Cliente confirmó asistencia  │
│  🔴 CANCELADO   → Turno cancelado              │
│  🟢 REALIZADO   → Servicio completado ⭐       │
└────────────────────────────────────────────────┘

⭐ REALIZADO es esencial para liquidación de sueldos
```

## 🔗 Relaciones

### 1. Barbero → Turno (1:N)
- **Tipo:** ForeignKey
- **Campo:** `turnos.barbero`
- **on_delete:** `PROTECT` (no se puede eliminar un barbero con turnos)
- **Acceso inverso:** `barbero.turnos.all()`

### 2. Servicio → Turno (1:N)
- **Tipo:** ForeignKey
- **Campo:** `turnos.servicio`
- **on_delete:** `PROTECT` (no se puede eliminar un servicio con turnos)
- **Acceso inverso:** `servicio.turnos.all()`

## 🔒 Restricciones e Índices

### Unique Together
```sql
UNIQUE (fecha, hora, barbero)
```
→ Un barbero no puede tener dos turnos en el mismo horario

### Índices
```sql
INDEX idx_turno_fecha_barbero ON turno (fecha, barbero)
INDEX idx_turno_estado ON turno (estado)
```
→ Optimización para consultas frecuentes

## 📊 Propiedades Calculadas

### Turno
```python
@property
def duracion_total(self):
    return self.servicio.duracion_minutos

@property
def precio_total(self):
    return self.servicio.precio
```

## 🎯 Ejemplos de Consultas

### 1. Obtener todos los turnos de un barbero en una fecha
```python
turnos = Turno.objects.filter(
    barbero=barbero,
    fecha=date(2026, 2, 10)
).order_by('hora')
```

### 2. Calcular ingresos de un barbero en una semana
```python
ingresos = Turno.objects.filter(
    barbero=barbero,
    fecha__range=[inicio_semana, fin_semana],
    estado=EstadoTurno.REALIZADO
).aggregate(
    total=Sum('servicio__precio')
)
```

### 3. Turnos disponibles (slots libres)
```python
turnos_ocupados = Turno.objects.filter(
    barbero=barbero,
    fecha=fecha,
    estado__in=[EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO]
).values_list('hora', flat=True)
```

### 4. Listar barberos activos con su cantidad de turnos
```python
from django.db.models import Count

barberos = Barbero.objects.filter(
    is_active=True
).annotate(
    total_turnos=Count('turnos', filter=Q(turnos__estado=EstadoTurno.REALIZADO))
).order_by('-total_turnos')
```

## 📈 Análisis de Datos

### Métricas Clave

1. **Turnos por Estado:**
   ```python
   Turno.objects.values('estado').annotate(cantidad=Count('id'))
   ```

2. **Servicio más solicitado:**
   ```python
   Servicio.objects.annotate(
       total=Count('turnos')
   ).order_by('-total').first()
   ```

3. **Barbero con más turnos realizados:**
   ```python
   Barbero.objects.annotate(
       realizados=Count('turnos', filter=Q(turnos__estado=EstadoTurno.REALIZADO))
   ).order_by('-realizados').first()
   ```

4. **Ingresos totales del mes:**
   ```python
   from django.db.models import Sum
   
   Turno.objects.filter(
       fecha__year=2026,
       fecha__month=2,
       estado=EstadoTurno.REALIZADO
   ).aggregate(
       total=Sum('servicio__precio')
   )
   ```

## 🎨 Colores Sugeridos para Barberos

```
Barbero 1: #3B82F6 (Azul)
Barbero 2: #10B981 (Verde)
Barbero 3: #F59E0B (Naranja/Ámbar)
Barbero 4: #8B5CF6 (Púrpura)
Barbero 5: #EF4444 (Rojo)
Barbero 6: #14B8A6 (Teal)
```

---

## 💾 Script SQL de Creación (Referencia)

```sql
-- Tabla Barbero
CREATE TABLE turnos_barbero (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    foto VARCHAR(100) NULL,
    telefono VARCHAR(17) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    fecha_ingreso DATE NOT NULL
);

-- Tabla Servicio
CREATE TABLE turnos_servicio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    creado_en DATETIME NOT NULL
);

-- Tabla Turno
CREATE TABLE turnos_turno (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    barbero_id INTEGER NOT NULL,
    servicio_id INTEGER NOT NULL,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(17) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    notas TEXT NULL,
    creado_en DATETIME NOT NULL,
    actualizado_en DATETIME NOT NULL,
    FOREIGN KEY (barbero_id) REFERENCES turnos_barbero(id) ON DELETE PROTECT,
    FOREIGN KEY (servicio_id) REFERENCES turnos_servicio(id) ON DELETE PROTECT,
    UNIQUE (fecha, hora, barbero_id)
);

-- Índices
CREATE INDEX idx_turno_fecha_barbero ON turnos_turno (fecha, barbero_id);
CREATE INDEX idx_turno_estado ON turnos_turno (estado);
```

---

**Nota:** Este diagrama representa el esquema de base de datos implementado en Django ORM.  
Los tipos de datos y constraints son manejados automáticamente por Django.
