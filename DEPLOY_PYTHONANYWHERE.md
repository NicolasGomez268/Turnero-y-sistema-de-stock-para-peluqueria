# 🚀 Deploy Backend en PythonAnywhere

## Paso 1: Crear cuenta en PythonAnywhere
1. Ir a https://www.pythonanywhere.com/
2. Crear cuenta (el plan gratuito incluye 1 web app)
3. Confirmar email

## Paso 2: Subir código
### Opción A: Desde GitHub (Recomendado)
```bash
# En PythonAnywhere Bash Console:
git clone https://github.com/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria.git
cd Turnero-y-sistema-de-stock-para-peluqueria
git checkout develop
```

### Opción B: Upload manual
- Desde "Files" tab, subir archivos comprimidos
- Descomprimir en `/home/TU_USUARIO/`

## Paso 3: Crear entorno virtual
```bash
# En Bash Console:
cd Turnero-y-sistema-de-stock-para-peluqueria
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Paso 4: Configurar variables de entorno
```bash
# Crear archivo .env:
nano .env
```

Contenido del `.env` (ajustar valores):
```env
SECRET_KEY=tu-secret-key-super-segura-aqui-cambiar
DEBUG=False
ALLOWED_HOSTS=TU_USUARIO.pythonanywhere.com
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
DEFAULT_SERVICE_ID=13
LANGUAGE_CODE=es-ar
TIME_ZONE=America/Argentina/Buenos_Aires
```

## Paso 5: Configurar base de datos
```bash
# Activar entorno virtual si no está activo
source venv/bin/activate

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# (Opcional) Cargar datos iniciales
python manage.py loaddata initial_data.json
```

## Paso 6: Configurar archivos estáticos
```bash
python manage.py collectstatic --noinput
```

## Paso 7: Configurar Web App en PythonAnywhere

### 7.1 Crear Web App
1. Ir a la pestaña "Web"
2. Add a new web app
3. Seleccionar "Manual configuration"
4. Python 3.10

### 7.2 Configurar WSGI
En "Code" section, hacer clic en el archivo WSGI configuration file:

```python
# +++++++++++ DJANGO +++++++++++
import os
import sys

# Ruta a tu proyecto
path = '/home/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria'
if path not in sys.path:
    sys.path.insert(0, path)

# Cargar variables de entorno
from dotenv import load_dotenv
project_folder = os.path.expanduser(path)
load_dotenv(os.path.join(project_folder, '.env'))

# Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'tincho_barberia.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 7.3 Configurar Virtualenv
En "Virtualenv" section:
```
/home/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria/venv
```

### 7.4 Configurar archivos estáticos
En "Static files" section:
- URL: `/static/`
- Directory: `/home/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria/staticfiles/`

- URL: `/media/`
- Directory: `/home/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria/media/`

### 7.5 Configurar CORS
Agregar en la sección "Security":
- Force HTTPS: **Enabled**

## Paso 8: Reload Web App
Click en el botón verde "Reload TU_USUARIO.pythonanywhere.com"

## Paso 9: Verificar deploy
Acceder a:
- API: `https://TU_USUARIO.pythonanywhere.com/api/servicios/`
- Admin: `https://TU_USUARIO.pythonanywhere.com/admin/`

## Troubleshooting

### Error 500:
```bash
# Ver logs en:
# - Error log: Web tab > Log files > Error log
# - Server log: Web tab > Log files > Server log

# Verificar permisos:
chmod 755 /home/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria
chmod 644 /home/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria/db.sqlite3
```

### Problemas con migraciones:
```bash
python manage.py showmigrations
python manage.py migrate --run-syncdb
```

### Actualizar código:
```bash
cd /home/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria
git pull origin develop
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
# Luego hacer Reload desde Web tab
```

## Notas importantes
- **Plan gratuito**: Incluye 512MB storage, 1 web app
- **Dominio**: `TU_USUARIO.pythonanywhere.com`
- **Base de datos**: SQLite (incluido) o MySQL (upgrade a plan pago para PostgreSQL)
- **Always-on**: Solo en planes pagos (free: la app duerme después de inactividad)
- **Custom domain**: Requiere plan pago

## URLs finales
- API Base: `https://TU_USUARIO.pythonanywhere.com`
- Admin Panel: `https://TU_USUARIO.pythonanywhere.com/admin/`
- API Docs: `https://TU_USUARIO.pythonanywhere.com/api/`
