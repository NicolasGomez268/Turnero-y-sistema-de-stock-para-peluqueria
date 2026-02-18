# TINCHO Barbería & Indumentaria

Sistema de gestión de turnos y administración para barbería.

## 🚀 Deploy en Producción

- **Backend**: PythonAnywhere
- **Frontend**: Vercel
- **Branch de producción**: `develop`

Ver guías detalladas:
- [Deploy Backend (PythonAnywhere)](./DEPLOY_PYTHONANYWHERE.md)
- [Deploy Frontend (Vercel)](./DEPLOY_VERCEL.md)
- [Checklist de Deploy](./DEPLOY_CHECKLIST.md)

## Stack Tecnológico

- **Backend:** Django REST Framework
- **Frontend:** React + Vite + Tailwind CSS
- **Base de Datos:** SQLite (desarrollo)

## Instalación

### Backend

```bash
# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Cargar datos de prueba (opcional)
python manage.py load_data

# Correr servidor
python manage.py runserver
```

## Modelos de Datos

- **Barbero:** Gestión de staff con foto, teléfono y estado activo
- **Servicio:** Catálogo de servicios con precio y duración
- **Turno:** Reservas con estados (PENDIENTE, CONFIRMADO, CANCELADO, REALIZADO)

## Acceso al Admin

http://localhost:8000/admin/
