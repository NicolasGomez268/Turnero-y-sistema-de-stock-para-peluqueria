# 🚀 Configuración Backend DEMO en PythonAnywhere

## Paso 1: Crear Cuenta Nueva en PythonAnywhere

1. Ve a: https://www.pythonanywhere.com/registration/register/beginner/
2. Datos sugeridos:
   - **Username:** `tinchobarberdemo` (o el que prefieras)
   - **Email:** Tu email
   - **Password:** Guarda la contraseña
3. Confirma el email
4. Login en: https://www.pythonanywhere.com

## Paso 2: Clonar el Repositorio

Abre una **Bash console** en PythonAnywhere y ejecuta:

```bash
git clone https://github.com/NicolasGomez268/Turnero-y-sistema-de-stock-para-peluqueria.git
cd Turnero-y-sistema-de-stock-para-peluqueria
git checkout demo
```

## Paso 3: Crear Entorno Virtual

```bash
mkvirtualenv --python=/usr/bin/python3.10 tinchobarberdemo
workon tinchobarberdemo
pip install -r requirements.txt
```

## Paso 4: Configurar Variables de Entorno

```bash
nano .env
```

Pega este contenido:

```env
SECRET_KEY=demo-secret-key-change-in-production-xyz789
DEBUG=False
ALLOWED_HOSTS=tinchobarberdemo.pythonanywhere.com
CORS_ALLOWED_ORIGINS=https://tincho-barberia-git-demo-nicolas-projects-962652f9.vercel.app
DATABASE_URL=sqlite:///db.sqlite3
```

Guarda con: `Ctrl+O`, `Enter`, `Ctrl+X`

## Paso 5: Configurar Base de Datos

```bash
python manage.py migrate
python manage.py createsuperuser
# Usuario sugerido: demo
# Email: demo@tinchobarberia.com
# Password: Demo2026!
```

## Paso 6: Cargar Datos Ficticios

```bash
python manage.py shell < load_demo_data.py
```

## Paso 7: Configurar Web App

1. Ve a la pestaña **Web**
2. Click en **Add a new web app**
3. Selecciona **Manual configuration**
4. Python version: **3.10**
5. Click **Next**

### Configurar Paths:

**Source code:**
```
/home/tinchobarberdemo/Turnero-y-sistema-de-stock-para-peluqueria
```

**Working directory:**
```
/home/tinchobarberdemo/Turnero-y-sistema-de-stock-para-peluqueria
```

**Virtualenv:**
```
/home/tinchobarberdemo/.virtualenvs/tinchobarberdemo
```

### Editar WSGI file:

Click en el link del **WSGI configuration file** y reemplaza TODO el contenido con:

```python
import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
project_folder = '/home/tinchobarberdemo/Turnero-y-sistema-de-stock-para-peluqueria'
load_dotenv(os.path.join(project_folder, '.env'))

# Add project to path
path = project_folder
if path not in sys.path:
    sys.path.insert(0, path)

# Django setup
os.environ['DJANGO_SETTINGS_MODULE'] = 'tincho_barberia.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

Guarda el archivo.

## Paso 8: Configurar Archivos Estáticos

En la pestaña **Web**, sección **Static files**:

| URL | Directory |
|-----|-----------|
| /static/ | /home/tinchobarberdemo/Turnero-y-sistema-de-stock-para-peluqueria/staticfiles |
| /media/ | /home/tinchobarberdemo/Turnero-y-sistema-de-stock-para-peluqueria/media |

Luego en Bash console:

```bash
python manage.py collectstatic --no-input
```

## Paso 9: Recargar Web App

En la pestaña **Web**, click en el botón verde **Reload tinchobarberdemo.pythonanywhere.com**

## Paso 10: Verificar

Prueba estos URLs:
- Backend: https://tinchobarberdemo.pythonanywhere.com/admin
- API: https://tinchobarberdemo.pythonanywhere.com/api/barberos/

---

## 🎭 Datos Demo Creados

- **Usuario Admin:** demo / Demo2026!
- **3 Barberos:** Juan, Carlos, Diego
- **5 Servicios:** Corte, Barba, Corte + Barba, Cejas, Depilación facial
- **Turnos de muestra:** Varios turnos de ejemplo

---

## ✅ URLs Finales

- **Frontend Demo:** https://tincho-barberia-git-demo-nicolas-projects-962652f9.vercel.app
- **Backend Demo:** https://tinchobarberdemo.pythonanywhere.com
- **Admin Panel:** https://tinchobarberdemo.pythonanywhere.com/admin

---

**IMPORTANTE:** Esta configuración es totalmente independiente de tu producción actual.
