# GUÍA DE INSTALACIÓN Y USO - TINCHO Barbería

## 📋 Prerrequisitos

- Python 3.10 o superior
- pip (gestor de paquetes de Python)

## 🚀 Instalación Paso a Paso

### 1. Crear y activar entorno virtual

```powershell
# Navegar a la carpeta del proyecto
cd "c:\Users\Usuario\Documents\Proyectos2026\Peluqueria"

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
.\venv\Scripts\activate

# Si tienes problemas de permisos, ejecuta esto primero en PowerShell como Administrador:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Instalar dependencias

```powershell
pip install -r requirements.txt
```

### 3. Crear las migraciones y la base de datos

```powershell
# Crear las migraciones de la app turnos
python manage.py makemigrations

# Aplicar las migraciones
python manage.py migrate
```

### 4. Crear superusuario para el admin

```powershell
python manage.py createsuperuser
```

Te pedirá:
- Username (nombre de usuario)
- Email (opcional, puedes dejarlo en blanco)
- Password (contraseña - mínimo 8 caracteres)

### 5. (Opcional) Cargar datos de prueba

```powershell
python manage.py load_data
```

Esto creará automáticamente 3 barberos, 5 servicios y 10 turnos de ejemplo.

### 6. Iniciar el servidor de desarrollo

```powershell
python manage.py runserver
```

El servidor estará disponible en: **http://localhost:8000**

## 🎯 Acceso al Panel de Administración

1. Abrir navegador en: **http://localhost:8000/admin/**
2. Ingresar con el usuario y contraseña del superusuario
3. ¡Listo! Ya puedes gestionar Barberos, Servicios y Turnos

## 📊 Modelos Creados

### **Barbero**
- ✅ Nombre completo
- ✅ Foto de perfil
- ✅ Teléfono
- ✅ Estado activo/inactivo (para ocultar sin borrar historial)
- ✅ Color identificativo (hex) para calendario

### **Servicio**
- ✅ Nombre del servicio
- ✅ Descripción
- ✅ Precio
- ✅ Duración en minutos

### **Turno**
- ✅ Fecha y hora
- ✅ Cliente (nombre y teléfono)
- ✅ Barbero asignado
- ✅ Servicio solicitado
- ✅ Estado: PENDIENTE, CONFIRMADO, CANCELADO, REALIZADO
- ✅ Notas adicionales

## 🔌 Endpoints de la API REST

### Barberos
- `GET /api/barberos/` - Listar todos los barberos
- `GET /api/barberos/?active=true` - Solo barberos activos
- `GET /api/barberos/{id}/` - Detalle de un barbero
- `POST /api/barberos/` - Crear nuevo barbero
- `PUT /api/barberos/{id}/` - Actualizar barbero
- `DELETE /api/barberos/{id}/` - Eliminar barbero

### Servicios
- `GET /api/servicios/` - Listar todos los servicios
- `GET /api/servicios/?active=true` - Solo servicios activos
- `GET /api/servicios/{id}/` - Detalle de un servicio
- `POST /api/servicios/` - Crear nuevo servicio
- `PUT /api/servicios/{id}/` - Actualizar servicio
- `DELETE /api/servicios/{id}/` - Eliminar servicio

### Turnos
- `GET /api/turnos/` - Listar todos los turnos
- `GET /api/turnos/?estado=PENDIENTE` - Filtrar por estado
- `GET /api/turnos/?barbero={id}` - Filtrar por barbero
- `GET /api/turnos/?fecha=2026-02-10` - Filtrar por fecha
- `POST /api/turnos/` - Crear nuevo turno
- `PUT /api/turnos/{id}/` - Actualizar turno
- `DELETE /api/turnos/{id}/` - Eliminar turno

## 📦 Próximos Pasos (FASE 2)

1. **Crear serializers avanzados** con validaciones
2. **Endpoints personalizados** para calendario
3. **Sistema de notificaciones** por WhatsApp
4. **Dashboard de estadísticas** y reportes
5. **Frontend React** con Vite y Tailwind

## 🆘 Solución de Problemas

### Error: "No module named 'django'"
```powershell
# Asegúrate de tener el entorno virtual activado
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Error de permisos en PowerShell
```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Puerto 8000 ocupado
```powershell
# Usar otro puerto
python manage.py runserver 8080
```

## 📝 Notas Importantes

- **Estado REALIZADO**: Es fundamental para el cálculo de liquidación de sueldos semanal
- **Campo is_active**: Permite ocultar barberos/servicios sin perder el historial
- **Validación de turnos**: No se pueden asignar dos turnos al mismo barbero en el mismo horario
- **Colores**: Cada barbero tiene un color único para visualización en calendario

---

**Desarrollado con ❤️ para TINCHO Barbería & Indumentaria**
