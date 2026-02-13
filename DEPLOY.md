# 🚀 Guía de Despliegue - TINCHO Barbería & Indumentaria

## 📋 Checklist Pre-Despliegue

### 1. Variables de Entorno

#### Backend (.env)
Copia `.env.example` a `.env` y configura:

```bash
# Django Settings - ⚠️ CRÍTICO
SECRET_KEY=genera-una-clave-secreta-super-larga-y-aleatoria-aqui
DEBUG=False
ALLOWED_HOSTS=tudominio.com,www.tudominio.com,api.tudominio.com

# Database - PostgreSQL en Producción
DB_ENGINE=django.db.backends.postgresql
DB_NAME=tincho_barberia_prod
DB_USER=tincho_user
DB_PASSWORD=tu_password_super_seguro
DB_HOST=localhost
DB_PORT=5432

# CORS - Tus dominios reales
CORS_ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Servicio por defecto (verificar ID en tu base de datos)
DEFAULT_SERVICE_ID=1

TIME_ZONE=America/Argentina/Buenos_Aires
```

**Generar SECRET_KEY seguro:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### Frontend (.env.production)
Crea `frontend/.env.production`:

```bash
# URL completa de tu backend API
VITE_API_BASE_URL=https://api.tudominio.com/api

# ID del servicio por defecto (verificar en tu BD de producción)
VITE_DEFAULT_SERVICE_ID=1

VITE_ENV=production
```

---

### 2. Base de Datos PostgreSQL

#### Instalar PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Windows
# Descargar instalador desde https://www.postgresql.org/download/windows/
```

#### Crear Base de Datos
```bash
sudo -u postgres psql

postgres=# CREATE DATABASE tincho_barberia_prod;
postgres=# CREATE USER tincho_user WITH PASSWORD 'tu_password_super_seguro';
postgres=# ALTER ROLE tincho_user SET client_encoding TO 'utf8';
postgres=# ALTER ROLE tincho_user SET default_transaction_isolation TO 'read committed';
postgres=# ALTER ROLE tincho_user SET timezone TO 'America/Argentina/Buenos_Aires';
postgres=# GRANT ALL PRIVILEGES ON DATABASE tincho_barberia_prod TO tincho_user;
postgres=# \q
```

#### Instalar Driver PostgreSQL
```bash
pip install psycopg2-binary
```

#### Migrar Datos de SQLite a PostgreSQL
```bash
# 1. Exportar datos desde SQLite
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 > datos_backup.json

# 2. Cambiar a PostgreSQL en .env
# DB_ENGINE=django.db.backends.postgresql

# 3. Crear tablas en PostgreSQL
python manage.py migrate

# 4. Importar datos
python manage.py loaddata datos_backup.json
```

---

### 3. Configuración del Servidor

#### Instalar Dependencias
```bash
# Backend
cd Peluqueria
pip install -r requirements.txt
pip install gunicorn  # Servidor WSGI para producción

# Frontend
cd frontend
npm install
npm run build  # Genera carpeta 'dist' con archivos estáticos
```

#### Archivos Estáticos de Django
```bash
# En settings.py ya tienes configurado:
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Recolectar archivos estáticos
python manage.py collectstatic --noinput
```

---

### 4. Nginx (Servidor Web)

#### Instalar Nginx
```bash
sudo apt-get install nginx
```

#### Configuración Nginx (`/etc/nginx/sites-available/tincho`)
```nginx
# Backend API
server {
    listen 80;
    server_name api.tudominio.com;

    client_max_body_size 5M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /ruta/completa/a/Peluqueria/staticfiles/;
    }

    location /media/ {
        alias /ruta/completa/a/Peluqueria/media/;
    }
}

# Frontend
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /ruta/completa/a/Peluqueria/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cachear archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Activar configuración
```bash
sudo ln -s /etc/nginx/sites-available/tincho /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar configuración
sudo systemctl restart nginx
```

---

### 5. Gunicorn (Servidor WSGI)

#### Archivo de Servicio Systemd (`/etc/systemd/system/tincho.service`)
```ini
[Unit]
Description=TINCHO Barberia Gunicorn
After=network.target

[Service]
User=tu_usuario
Group=www-data
WorkingDirectory=/ruta/completa/a/Peluqueria
Environment="PATH=/ruta/completa/a/venv/bin"
ExecStart=/ruta/completa/a/venv/bin/gunicorn \
          --workers 3 \
          --bind 127.0.0.1:8000 \
          tincho_barberia.wsgi:application

[Install]
WantedBy=multi-user.target
```

#### Iniciar servicio
```bash
sudo systemctl start tincho
sudo systemctl enable tincho  # Auto-iniciar en boot
sudo systemctl status tincho  # Verificar estado
```

---

### 6. SSL/HTTPS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificados
sudo certbot --nginx -d tudominio.com -d www.tudominio.com -d api.tudominio.com

# Renovación automática (ya configurado por certbot)
sudo certbot renew --dry-run
```

---

### 7. Verificar ID de Servicio en Producción

**⚠️ IMPORTANTE**: El ID del servicio puede ser diferente en producción.

```bash
# Conectar a Django shell en producción
python manage.py shell

# Verificar ID del servicio
from turnos.models import Servicio
servicios = Servicio.objects.all()
for s in servicios:
    print(f"ID: {s.id} - {s.nombre} - ${s.precio}")

# Tomar nota del ID correcto y actualizar variables de entorno
```

Actualizar en:
- `.env` → `DEFAULT_SERVICE_ID=X`
- `frontend/.env.production` → `VITE_DEFAULT_SERVICE_ID=X`

---

### 8. Cargar Datos Iniciales

```bash
# Crear superusuario
python manage.py createsuperuser

# Cargar productos (opcional)
python manage.py cargar_productos

# O cargar tus propios datos desde el admin:
# https://api.tudominio.com/admin
```

---

## 🔍 Verificación Post-Despliegue

### Backend API
```bash
# Probar endpoints
curl https://api.tudominio.com/api/barberos/
curl https://api.tudominio.com/api/servicios/
```

### Frontend
- Abrir https://tudominio.com
- Probar flujo completo de reserva
- Verificar que no hay errores en la consola del navegador (F12)

### Admin
- Acceder a https://api.tudominio.com/admin
- Verificar que carga correctamente
- Probar liquidación semanal
- Probar módulo de inventario

---

## 📊 Monitoreo y Logs

### Ver logs de Gunicorn
```bash
sudo journalctl -u tincho -f
```

### Ver logs de Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Ver logs de Django
Configurar logging en `settings.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

---

## ⚠️ Problemas Comunes

### 1. Error 502 Bad Gateway
- Verificar que Gunicorn está corriendo: `sudo systemctl status tincho`
- Verificar logs: `sudo journalctl -u tincho -n 50`

### 2. CORS Errors
- Verificar `CORS_ALLOWED_ORIGINS` en `.env`
- Debe incluir tu dominio completo con https://

### 3. Static Files no cargan
- Ejecutar `python manage.py collectstatic`
- Verificar permisos: `sudo chown -R tu_usuario:www-data staticfiles/`
- Verificar configuración de Nginx

### 4. Error en Frontend (API no responde)
- Verificar `VITE_API_BASE_URL` en `frontend/.env.production`
- Debe apuntar a tu backend real, no a localhost

### 5. ID de Servicio no existe
- Verificar ID correcto en base de datos de producción
- Actualizar `VITE_DEFAULT_SERVICE_ID` en ambos .env

---

## 🔐 Seguridad Post-Despliegue

✅ **Checklist de seguridad:**
- [ ] `DEBUG=False` en producción
- [ ] `SECRET_KEY` único y seguro (50+ caracteres)
- [ ] HTTPS habilitado (certificado SSL)
- [ ] `ALLOWED_HOSTS` correctamente configurado
- [ ] Credenciales de base de datos seguras
- [ ] Firewall configurado (solo puertos 80, 443, 22)
- [ ] Backups automáticos de base de datos
- [ ] Usuario sin privilegios de root para correr Django

---

## 📦 Backup de Base de Datos

```bash
# Backup automático diario (crontab)
0 2 * * * pg_dump tincho_barberia_prod > /backups/tincho_$(date +\%Y\%m\%d).sql

# Restaurar backup
psql tincho_barberia_prod < /backups/tincho_20260213.sql
```

---

## 🎯 Resumen Rápido

```bash
# 1. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con valores de producción

# 2. Instalar PostgreSQL y crear BD
sudo apt-get install postgresql
# Crear base de datos y usuario

# 3. Migrar datos
python manage.py migrate
python manage.py loaddata datos_backup.json

# 4. Compilar frontend
cd frontend
npm run build

# 5. Configurar Nginx + Gunicorn
sudo systemctl start tincho
sudo systemctl start nginx

# 6. Obtener SSL
sudo certbot --nginx -d tudominio.com

# 7. ¡Listo! 🎉
```

---

**Soporte:** Si tienes problemas, revisa los logs y la sección de "Problemas Comunes".
