# 📝 COMANDOS DE DJANGO - TINCHO Barbería

## Comandos Estándar de Django

### Gestión del Proyecto

```powershell
# Iniciar servidor de desarrollo
python manage.py runserver

# Iniciar servidor en puerto diferente
python manage.py runserver 8080

# Iniciar servidor accesible desde la red
python manage.py runserver 0.0.0.0:8000
```

### Base de Datos

```powershell
# Crear migraciones (detecta cambios en modelos)
python manage.py makemigrations

# Aplicar migraciones a la base de datos
python manage.py migrate

# Ver SQL de las migraciones sin aplicarlas
python manage.py sqlmigrate turnos 0001

# Mostrar estado de migraciones
python manage.py showmigrations

# Abrir shell de base de datos
python manage.py dbshell
```

### Usuarios y Autenticación

```powershell
# Crear superusuario para el admin
python manage.py createsuperuser

# Cambiar contraseña de un usuario
python manage.py changepassword admin
```

### Shell de Django

```powershell
# Abrir shell interactivo de Django
python manage.py shell

# Ejemplo de uso del shell:
# >>> from turnos.models import Barbero, Servicio, Turno
# >>> Barbero.objects.all()
# >>> Turno.objects.filter(estado='PENDIENTE').count()
```

---

## ⭐ Comandos Personalizados de TINCHO Barbería

### Cargar Datos de Prueba

```powershell
# Cargar datos de ejemplo (3 barberos, 5 servicios, 10 turnos)
python manage.py load_data

# Limpiar todos los datos y cargar nuevos
python manage.py load_data --clear
```

**¿Qué crea este comando?**
- **3 Barberos:** Martín "Tincho" González, Lucas Fernández, Sebastián Rodríguez
- **5 Servicios:** Corte de Cabello, Arreglo de Barba, Combo, Corte Infantil, Afeitado
- **10 Turnos:** Distribuidos en ayer (realizados), hoy (confirmados/pendientes) y mañana

---

## 🧪 Testing

```powershell
# Ejecutar todos los tests
python manage.py test

# Ejecutar tests de una app específica
python manage.py test turnos

# Ejecutar un test específico
python manage.py test turnos.tests.TurnoModelTest

# Ejecutar tests con más detalles
python manage.py test --verbosity=2

# Mantener la base de datos de tests (útil para debugging)
python manage.py test --keepdb
```

---

## 📦 Archivos Estáticos y Media

```powershell
# Recolectar archivos estáticos para producción
python manage.py collectstatic

# Sin confirmación
python manage.py collectstatic --noinput

# Limpiar archivos estáticos antiguos
python manage.py collectstatic --clear
```

---

## 🔍 Utilidades de Desarrollo

```powershell
# Ver todas las URLs configuradas (requiere django-extensions)
python manage.py show_urls

# Limpiar sesiones expiradas
python manage.py clearsessions

# Verificar problemas en el proyecto
python manage.py check

# Verificar problemas específicos de deployment
python manage.py check --deploy
```

---

## 🗄️ Gestión de la Base de Datos

### Backup y Restore (SQLite)

```powershell
# Crear respaldo de la base de datos
copy db.sqlite3 backups\db_backup_20260210.sqlite3

# Restaurar desde respaldo
copy backups\db_backup_20260210.sqlite3 db.sqlite3

# Exportar datos a JSON
python manage.py dumpdata turnos --indent 2 -o backup_turnos.json

# Importar datos desde JSON
python manage.py loaddata backup_turnos.json
```

### Inspeccionar la Base de Datos

```powershell
# Abrir shell SQLite
python manage.py dbshell

# Comandos útiles dentro del dbshell:
# .tables                    - Ver todas las tablas
# .schema turnos_turno       - Ver estructura de una tabla
# .mode column               - Formato de columnas
# .headers on                - Mostrar encabezados
# SELECT * FROM turnos_barbero;
# .quit                      - Salir
```

---

## 🔧 Gestión de Datos (Shell)

### Ejemplos de Consultas en el Shell

```powershell
# Abrir shell de Django
python manage.py shell
```

```python
# Importar modelos
from turnos.models import Barbero, Servicio, Turno, EstadoTurno
from datetime import date, time

# === BARBEROS ===

# Listar todos los barberos
Barbero.objects.all()

# Buscar barbero por nombre
barbero = Barbero.objects.get(nombre__icontains="Tincho")

# Barberos activos
Barbero.objects.filter(is_active=True)

# Contar turnos de un barbero
barbero.turnos.count()
barbero.turnos.filter(estado=EstadoTurno.REALIZADO).count()


# === SERVICIOS ===

# Listar servicios ordenados por precio
Servicio.objects.order_by('-precio')

# Servicios de menos de 5000 pesos
Servicio.objects.filter(precio__lt=5000)


# === TURNOS ===

# Turnos de hoy
hoy = date.today()
Turno.objects.filter(fecha=hoy)

# Turnos pendientes
Turno.objects.filter(estado=EstadoTurno.PENDIENTE)

# Turnos de un barbero específico
Turno.objects.filter(barbero__nombre__icontains="Tincho")

# Cambiar estado de un turno
turno = Turno.objects.get(id=1)
turno.estado = EstadoTurno.REALIZADO
turno.save()

# Turnos de la semana
from datetime import timedelta
inicio_semana = hoy - timedelta(days=hoy.weekday())
fin_semana = inicio_semana + timedelta(days=6)
Turno.objects.filter(fecha__range=[inicio_semana, fin_semana])


# === ESTADÍSTICAS ===

from django.db.models import Count, Sum, Avg

# Total de turnos por estado
Turno.objects.values('estado').annotate(total=Count('id'))

# Ingresos totales (solo turnos realizados)
Turno.objects.filter(estado=EstadoTurno.REALIZADO).aggregate(
    total=Sum('servicio__precio')
)

# Barbero con más turnos
Barbero.objects.annotate(
    total_turnos=Count('turnos')
).order_by('-total_turnos').first()

# Servicio más solicitado
Servicio.objects.annotate(
    total=Count('turnos')
).order_by('-total').first()


# === OPERACIONES MASIVAS ===

# Marcar todos los turnos de ayer como realizados
ayer = hoy - timedelta(days=1)
Turno.objects.filter(fecha=ayer).update(estado=EstadoTurno.REALIZADO)

# Cancelar todos los turnos pendientes de un cliente
Turno.objects.filter(
    cliente_telefono="+541198765432",
    estado=EstadoTurno.PENDIENTE
).update(estado=EstadoTurno.CANCELADO)

# Eliminar turnos cancelados antiguos (más de 30 días)
from datetime import timedelta
fecha_limite = hoy - timedelta(days=30)
Turno.objects.filter(
    fecha__lt=fecha_limite,
    estado=EstadoTurno.CANCELADO
).delete()


# Salir del shell
exit()
```

---

## 🚀 Comandos de Producción

```powershell
# Verificar configuración para producción
python manage.py check --deploy

# Crear datos iniciales en producción (sin limpiar)
python manage.py load_data

# Recolectar archivos estáticos
python manage.py collectstatic --noinput

# Migrar base de datos
python manage.py migrate --noinput

# Crear superusuario de forma no interactiva
python manage.py createsuperuser --noinput --username admin --email admin@tincho.com
```

---

## 📊 Comandos de Mantenimiento

```powershell
# Limpiar sesiones antiguas
python manage.py clearsessions

# Optimizar base de datos SQLite
python manage.py dbshell
# Dentro del shell: VACUUM;

# Ver tamaño de la base de datos
# Windows:
dir db.sqlite3
# Linux/Mac:
ls -lh db.sqlite3
```

---

## 🔄 Flujo de Trabajo Típico

### Desarrollo Diario

```powershell
# 1. Activar entorno virtual
.\venv\Scripts\activate

# 2. Actualizar dependencias (si es necesario)
pip install -r requirements.txt

# 3. Aplicar migraciones
python manage.py migrate

# 4. Iniciar servidor
python manage.py runserver

# 5. Ejecutar tests al finalizar
python manage.py test turnos
```

### Después de Cambiar Modelos

```powershell
# 1. Crear migraciones
python manage.py makemigrations

# 2. Revisar el archivo de migración en turnos/migrations/

# 3. Aplicar migraciones
python manage.py migrate

# 4. Verificar cambios
python manage.py shell
>>> from turnos.models import Turno
>>> Turno.objects.first()
```

### Backup Regular

```powershell
# Crear carpeta de backups
mkdir backups

# Backup de la base de datos
copy db.sqlite3 "backups\db_$(Get-Date -Format 'yyyyMMdd_HHmmss').sqlite3"

# Backup de datos en JSON
python manage.py dumpdata turnos --indent 2 -o "backups\datos_$(Get-Date -Format 'yyyyMMdd').json"

# Backup de archivos media
xcopy media backups\media_backup /E /I /Y
```

---

## ⚠️ Solución de Problemas

```powershell
# Error: "No changes detected"
# Solución: Asegurar que la app esté en INSTALLED_APPS
python manage.py makemigrations turnos

# Error: "Table already exists"
# Solución: Marcar migraciones como aplicadas sin ejecutarlas
python manage.py migrate --fake turnos 0001_initial

# Error: "Database is locked"
# Solución: Cerrar todas las conexiones y reintentar
# O borrar el archivo db.sqlite3-journal

# Ver migraciones aplicadas
python manage.py showmigrations

# Revertir una migración
python manage.py migrate turnos 0001_initial

# Revertir todas las migraciones de una app
python manage.py migrate turnos zero
```

---

## 📖 Ayuda de Comandos

```powershell
# Ver lista completa de comandos disponibles
python manage.py help

# Ver ayuda de un comando específico
python manage.py help load_data
python manage.py help migrate
python manage.py help test
```

---

**💡 Tip:** Guarda este archivo como referencia rápida durante el desarrollo.

**Documentación oficial de Django:** https://docs.djangoproject.com/en/5.0/ref/django-admin/
