# 📊 ESTRUCTURA DEL PROYECTO - TINCHO Barbería

## 🏗️ Arquitectura del Sistema

```
Peluqueria/
│
├── 📁 tincho_barberia/          # Configuración del proyecto Django
│   ├── __init__.py
│   ├── settings.py              # Configuración principal (DB, apps, middleware)
│   ├── urls.py                  # Rutas principales del proyecto
│   ├── wsgi.py                  # WSGI para producción
│   └── asgi.py                  # ASGI para producción
│
├── 📁 turnos/                   # App principal de gestión de turnos
│   ├── migrations/              # Migraciones de base de datos
│   │   └── __init__.py
│   ├── __init__.py
│   ├── models.py                # ⭐ MODELOS: Barbero, Servicio, Turno
│   ├── admin.py                 # ⭐ ADMIN: Configuración del panel Django Admin
│   ├── views.py                 # ViewSets para API REST
│   ├── serializers.py           # Serializers de Django REST Framework
│   ├── urls.py                  # Rutas de la API
│   ├── apps.py                  # Configuración de la app
│   └── tests.py                 # Tests unitarios
│
├── 📁 venv/                     # Entorno virtual (creado al instalar)
├── 📁 media/                    # Archivos subidos (fotos de barberos)
│   └── barberos/
├── 📄 manage.py                 # Comando principal de Django
├── 📄 requirements.txt          # Dependencias de Python
├── 📄 load_initial_data.py      # Script para cargar datos de prueba
├── 📄 run.bat                   # Script de instalación/ejecución (Windows)
├── 📄 .gitignore                # Archivos ignorados por Git
├── 📄 .env.example              # Ejemplo de variables de entorno
├── 📄 README.md                 # Documentación principal
├── 📄 INSTALACION.md            # Guía de instalación detallada
└── 📄 ESTRUCTURA.md             # Este archivo
```

## 🗄️ Modelos de Base de Datos

### 1️⃣ **Barbero** (Staff)
```python
- id (AutoField)
- nombre (CharField)
- foto (ImageField) - upload_to='barberos/'
- telefono (CharField) - validado con regex
- is_active (BooleanField) - para ocultar sin borrar
- color_hex (CharField) - color para calendario (#3B82F6)
- fecha_ingreso (DateField) - auto_now_add
```

**Relaciones:**
- `turnos` (reverse ForeignKey desde Turno)

---

### 2️⃣ **Servicio**
```python
- id (AutoField)
- nombre (CharField)
- descripcion (TextField) - opcional
- precio (DecimalField)
- duracion_minutos (PositiveIntegerField)
- is_active (BooleanField)
- creado_en (DateTimeField) - auto_now_add
```

**Relaciones:**
- `turnos` (reverse ForeignKey desde Turno)

---

### 3️⃣ **Turno**
```python
- id (AutoField)
- fecha (DateField)
- hora (TimeField)
- barbero (ForeignKey) → Barbero
- servicio (ForeignKey) → Servicio
- cliente_nombre (CharField)
- cliente_telefono (CharField) - validado
- estado (CharField) - Enum: PENDIENTE, CONFIRMADO, CANCELADO, REALIZADO
- notas (TextField) - opcional
- creado_en (DateTimeField) - auto_now_add
- actualizado_en (DateTimeField) - auto_now
```

**Restricciones:**
- `unique_together = ['fecha', 'hora', 'barbero']` - No dos turnos simultáneos

**Propiedades calculadas:**
- `duracion_total` → servicio.duracion_minutos
- `precio_total` → servicio.precio

---

## 🎯 Estados del Turno (Enum)

```python
class EstadoTurno(models.TextChoices):
    PENDIENTE = 'PENDIENTE'      # 🟡 Turno creado, no confirmado
    CONFIRMADO = 'CONFIRMADO'    # 🔵 Cliente confirmó asistencia
    CANCELADO = 'CANCELADO'      # 🔴 Turno cancelado
    REALIZADO = 'REALIZADO'      # 🟢 Turno completado (VITAL para liquidación)
```

---

## 🔌 API REST Endpoints

### Barberos
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/barberos/` | Listar todos |
| GET | `/api/barberos/?active=true` | Solo activos |
| GET | `/api/barberos/{id}/` | Detalle |
| POST | `/api/barberos/` | Crear |
| PUT/PATCH | `/api/barberos/{id}/` | Actualizar |
| DELETE | `/api/barberos/{id}/` | Eliminar |

### Servicios
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/servicios/` | Listar todos |
| GET | `/api/servicios/?active=true` | Solo activos |
| GET | `/api/servicios/{id}/` | Detalle |
| POST | `/api/servicios/` | Crear |
| PUT/PATCH | `/api/servicios/{id}/` | Actualizar |
| DELETE | `/api/servicios/{id}/` | Eliminar |

### Turnos
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/turnos/` | Listar todos |
| GET | `/api/turnos/?estado=PENDIENTE` | Filtrar por estado |
| GET | `/api/turnos/?barbero={id}` | Filtrar por barbero |
| GET | `/api/turnos/?fecha=2026-02-10` | Filtrar por fecha |
| GET | `/api/turnos/{id}/` | Detalle |
| POST | `/api/turnos/` | Crear |
| PUT/PATCH | `/api/turnos/{id}/` | Actualizar |
| DELETE | `/api/turnos/{id}/` | Eliminar |

---

## 🎨 Características del Admin Panel

### Barbero Admin
- ✅ Vista previa del color identificativo
- ✅ Contador de turnos realizados
- ✅ Filtros por estado activo y fecha de ingreso
- ✅ Búsqueda por nombre y teléfono

### Servicio Admin
- ✅ Formato de precio con símbolo $
- ✅ Contador de turnos asociados
- ✅ Filtros por estado activo
- ✅ Búsqueda por nombre y descripción

### Turno Admin
- ✅ Badge de color según estado del turno
- ✅ Acciones masivas: Confirmar, Realizar, Cancelar
- ✅ Filtros por: estado, fecha, barbero, servicio
- ✅ Búsqueda por: cliente, teléfono, barbero, servicio
- ✅ Orden jerárquico por fecha (date_hierarchy)
- ✅ Validación: no permitir turnos duplicados

---

## 🔒 Validaciones Implementadas

1. **Teléfono:** Regex `^\+?1?\d{9,15}$`
2. **Color Hex:** Formato `#RRGGBB` (7 caracteres)
3. **Turnos únicos:** Un barbero no puede tener dos turnos en el mismo horario
4. **Precios:** Decimales con 2 lugares (max 10 dígitos)
5. **Duración:** Solo enteros positivos (minutos)

---

## 📦 Dependencias Principales

```
Django==5.0                      # Framework principal
djangorestframework==3.14.0      # API REST
django-cors-headers==4.3.1       # CORS para React
django-filter==24.1              # Filtrado avanzado
Pillow==10.2.0                   # Manejo de imágenes
python-decouple==3.8             # Variables de entorno
```

---

## 🚀 Comandos Útiles

```powershell
# Activar entorno virtual
.\venv\Scripts\activate

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver

# Cargar datos de prueba
python manage.py shell < load_initial_data.py

# Ejecutar tests
python manage.py test turnos

# Crear respaldo de base de datos (SQLite)
copy db.sqlite3 db_backup.sqlite3
```

---

## 📱 Próximas Fases

### FASE 2: Frontend React + Vite
- [ ] Calendario interactivo (vista diaria/semanal/mensual)
- [ ] Reserva de turnos por clientes
- [ ] Dashboard con estadísticas
- [ ] Sistema de notificaciones

### FASE 3: Funcionalidades Avanzadas
- [ ] Integración con WhatsApp Business API
- [ ] Sistema de liquidación de sueldos automático
- [ ] Reportes de facturación
- [ ] Gestión de inventario (indumentaria)
- [ ] Historial de clientes y preferencias

---

## 📞 Información de Contacto

**Proyecto:** TINCHO Barbería & Indumentaria  
**Stack:** Django REST Framework + React + Vite + Tailwind  
**Base de Datos:** SQLite (desarrollo) / PostgreSQL (producción)  
**Año:** 2026

---

**Documentación generada por:** GitHub Copilot  
**Fecha:** Febrero 2026
