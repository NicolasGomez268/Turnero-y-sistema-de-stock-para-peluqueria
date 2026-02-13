# 🔧 Configuración con Variables de Entorno

## ❌ Problema: Valores Hardcodeados

La versión anterior del proyecto tenía valores hardcodeados que causarían problemas en producción:

1. **Frontend**: ID de servicio hardcodeado (`servicio: 11`)
2. **Backend**: 
   - `SECRET_KEY` inseguro
   - `DEBUG=True` 
   - `ALLOWED_HOSTS=[]`
   - URLs localhost en CORS
3. **Base de datos**: SQLite (no escalable para producción)

## ✅ Solución: Variables de Entorno

El proyecto ahora usa **variables de entorno** para todos los valores de configuración, permitiendo diferentes configuraciones para desarrollo y producción sin cambiar código.

---

## 📁 Archivos de Configuración

### Backend (Django)

| Archivo | Propósito |
|---------|-----------|
| `.env.example` | Plantilla con todas las variables disponibles |
| `.env.development` | Configuración para desarrollo local (localhost, SQLite) |
| `.env.production` | Plantilla para producción (PostgreSQL, HTTPS) |
| `.env` | **TU archivo local** (no commitear a Git) |

### Frontend (React/Vite)

| Archivo | Propósito |
|---------|-----------|
| `frontend/.env.example` | Plantilla para el frontend |
| `frontend/.env.development` | Desarrollo local (usa proxy de Vite) |
| `frontend/.env.production` | Producción (URL completa del backend) |

---

## 🚀 Configuración Rápida

### 1. Desarrollo Local

```bash
# Backend: Copiar archivo de desarrollo
cp .env.development .env

# Frontend: Copiar archivo de desarrollo
cp frontend/.env.development frontend/.env

# Ya está listo para usar con:
# - Django en localhost:8000
# - React en localhost:5173
# - SQLite
```

### 2. Producción

```bash
# Backend: Copiar plantilla y editar
cp .env.production .env
nano .env  # Editar con valores reales

# Frontend: Crear configuración de producción
nano frontend/.env.production

# Configurar:
# - SECRET_KEY único
# - DEBUG=False
# - Dominio real
# - PostgreSQL
# - ID de servicio correcto
```

Ver [DEPLOY.md](DEPLOY.md) para guía completa de despliegue.

---

## 🔑 Variables Disponibles

### Backend (.env)

```bash
# Seguridad
SECRET_KEY=                    # Clave secreta de Django (50+ caracteres)
DEBUG=                         # True/False - SIEMPRE False en producción
ALLOWED_HOSTS=                 # Dominios separados por comas

# Base de datos
DB_ENGINE=                     # django.db.backends.sqlite3 o postgresql
DB_NAME=                       # Nombre de la base de datos
DB_USER=                       # Usuario de PostgreSQL
DB_PASSWORD=                   # Contraseña
DB_HOST=                       # localhost o IP del servidor
DB_PORT=                       # 5432 (PostgreSQL)

# CORS
CORS_ALLOWED_ORIGINS=          # URLs del frontend separadas por comas

# Aplicación
DEFAULT_SERVICE_ID=            # ID del servicio por defecto en la BD
TIME_ZONE=                     # America/Argentina/Buenos_Aires
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=             # URL del backend API
VITE_DEFAULT_SERVICE_ID=       # ID del servicio por defecto
VITE_ENV=                      # development/production
```

---

## 📝 Cómo Funciona

### Backend (settings.py)

Antes ❌:
```python
SECRET_KEY = 'django-insecure-hardcoded'
DEBUG = True
ALLOWED_HOSTS = []
```

Ahora ✅:
```python
from decouple import config, Csv

SECRET_KEY = config('SECRET_KEY', default='...')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost', cast=Csv())
```

### Frontend (BookingWizard.jsx)

Antes ❌:
```javascript
servicio: 11  // ID hardcodeado
```

Ahora ✅:
```javascript
const servicioId = import.meta.env.VITE_DEFAULT_SERVICE_ID || 11;
servicio: parseInt(servicioId)
```

### Frontend (api.js)

Antes ❌:
```javascript
const API_BASE_URL = '/api';
```

Ahora ✅:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

---

## ⚠️ Importante para Producción

### 1. ID de Servicio

El **ID puede ser diferente** en producción. Verificar:

```bash
python manage.py shell
```

```python
from turnos.models import Servicio
for s in Servicio.objects.all():
    print(f"ID: {s.id} - {s.nombre}")
```

Actualizar en:
- `.env` → `DEFAULT_SERVICE_ID=X`
- `frontend/.env.production` → `VITE_DEFAULT_SERVICE_ID=X`

### 2. SECRET_KEY Único

Generar una clave segura:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Nunca Commitear .env

El archivo `.env` ya está en `.gitignore`. Solo commitear `.env.example`.

---

## 🏗️ Diferencias Desarrollo vs Producción

| Aspecto | Desarrollo | Producción |
|---------|------------|------------|
| **DEBUG** | `True` | `False` ⚠️ |
| **SECRET_KEY** | Inseguro (OK) | Único de 50+ caracteres ⚠️ |
| **Base de datos** | SQLite | PostgreSQL |
| **ALLOWED_HOSTS** | localhost | tudominio.com |
| **CORS** | http://localhost:5173 | https://tudominio.com |
| **API_BASE_URL** | `/api` (proxy) | `https://api.tudominio.com/api` |
| **Servidor Web** | runserver | Nginx + Gunicorn |
| **HTTPS** | No | Sí (Let's Encrypt) ⚠️ |

---

## 🐛 Troubleshooting

### "Error: servicio no existe"

El ID del servicio en `.env` no corresponde a la base de datos.

**Solución:**
```bash
# Verificar IDs disponibles
python manage.py shell
from turnos.models import Servicio
Servicio.objects.values('id', 'nombre')

# Actualizar .env con el ID correcto
DEFAULT_SERVICE_ID=1
```

### "CORS Error" en producción

`CORS_ALLOWED_ORIGINS` no incluye tu dominio.

**Solución:**
```bash
# En .env
CORS_ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com
```

### "502 Bad Gateway"

Variables de entorno no configuradas correctamente.

**Solución:**
```bash
# Verificar que .env existe en el servidor
ls -la .env

# Verificar que Gunicorn lee las variables
sudo systemctl status tincho
sudo journalctl -u tincho -n 50
```

---

## 📚 Referencias

- [python-decouple](https://github.com/HBNetwork/python-decouple) - Gestión de variables de entorno
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html) - Variables en Vite
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/) - Checklist de despliegue
- [DEPLOY.md](DEPLOY.md) - Guía completa de despliegue

---

**Resumen:** Ahora el proyecto está preparado para producción con configuración flexible mediante variables de entorno. No más valores hardcodeados que causen problemas al desplegar. 🎉
