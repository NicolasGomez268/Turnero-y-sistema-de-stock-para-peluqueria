# ⚡ INICIO RÁPIDO - TINCHO Barbería

## 🚀 Opción 1: Instalación Automática (Windows)

### Ejecutar el script automático:
```powershell
# Doble click en:
run.bat

# O desde PowerShell/CMD:
cd "c:\Users\Usuario\Documents\Proyectos2026\Peluqueria"
.\run.bat
```

**El script mostrará un menú con opciones:**
1. Instalación completa (primera vez) ← Usa esta opción
2. Iniciar servidor de desarrollo
3. Crear superusuario
4. Cargar datos de prueba
5. Realizar migraciones
6. Ejecutar tests
7. Salir

---

## 🛠️ Opción 2: Instalación Manual

### Paso 1: Crear entorno virtual
```powershell
cd "c:\Users\Usuario\Documents\Proyectos2026\Peluqueria"
python -m venv venv
```

### Paso 2: Activar entorno virtual
```powershell
.\venv\Scripts\activate
```

**Nota:** Si tienes problemas de permisos en PowerShell:
```powershell
# Ejecutar como Administrador:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Paso 3: Instalar dependencias
```powershell
pip install -r requirements.txt
```

### Paso 4: Crear base de datos
```powershell
python manage.py makemigrations
python manage.py migrate
```

### Paso 5: Crear superusuario
```powershell
python manage.py createsuperuser
```
- Username: `admin` (o el que prefieras)
- Email: (opcional, presiona Enter)
- Password: `admin123` (o una contraseña segura)

### Paso 6: (Opcional) Cargar datos de prueba
```powershell
python manage.py load_data
```

Esto creará:
- 3 Barberos (Tincho, Lucas, Sebastián)
- 5 Servicios (Corte, Barba, Combo, etc.)
- 10 Turnos de ejemplo

### Paso 7: Iniciar servidor
```powershell
python manage.py runserver
```

---

## 🌐 Acceder a la Aplicación

### Panel de Administración Django
🔗 http://localhost:8000/admin/

**Login:**
- Usuario: `admin` (el que creaste)
- Contraseña: (la que configuraste)

### API REST Endpoints

#### Barberos
- 📋 Listar todos: http://localhost:8000/api/barberos/
- 📋 Solo activos: http://localhost:8000/api/barberos/?active=true
- 🔍 Ver uno: http://localhost:8000/api/barberos/1/

#### Servicios
- 📋 Listar todos: http://localhost:8000/api/servicios/
- 📋 Solo activos: http://localhost:8000/api/servicios/?active=true
- 🔍 Ver uno: http://localhost:8000/api/servicios/1/

#### Turnos
- 📋 Listar todos: http://localhost:8000/api/turnos/
- 📋 Por estado: http://localhost:8000/api/turnos/?estado=PENDIENTE
- 📋 Por barbero: http://localhost:8000/api/turnos/?barbero=1
- 📋 Por fecha: http://localhost:8000/api/turnos/?fecha=2026-02-10
- 🔍 Ver uno: http://localhost:8000/api/turnos/1/

---

## 🧪 Probar la API con cURL (Ejemplos)

### Listar barberos activos
```powershell
curl http://localhost:8000/api/barberos/?active=true
```

### Crear un nuevo turno
```powershell
curl -X POST http://localhost:8000/api/turnos/ `
  -H "Content-Type: application/json" `
  -d '{
    "fecha": "2026-02-15",
    "hora": "10:00",
    "barbero": 1,
    "servicio": 1,
    "cliente_nombre": "Juan Prueba",
    "cliente_telefono": "+541199887766",
    "estado": "PENDIENTE"
  }'
```

### Actualizar estado de un turno
```powershell
curl -X PATCH http://localhost:8000/api/turnos/1/ `
  -H "Content-Type: application/json" `
  -d '{"estado": "CONFIRMADO"}'
```

---

## 📱 Gestión desde el Admin Panel

### 1. Crear Barberos
1. Ir a http://localhost:8000/admin/turnos/barbero/
2. Click en "Agregar Barbero"
3. Completar:
   - Nombre: "Juan Pérez"
   - Teléfono: "+541112345678"
   - Color: "#3B82F6" (azul)
   - Marcar "Activo"
4. Guardar

### 2. Crear Servicios
1. Ir a http://localhost:8000/admin/turnos/servicio/
2. Click en "Agregar Servicio"
3. Completar:
   - Nombre: "Corte de Cabello"
   - Precio: 5000.00
   - Duración: 30 minutos
   - Marcar "Activo"
4. Guardar

### 3. Crear Turnos
1. Ir a http://localhost:8000/admin/turnos/turno/
2. Click en "Agregar Turno"
3. Completar:
   - Fecha: 2026-02-15
   - Hora: 10:00
   - Barbero: Seleccionar de la lista
   - Servicio: Seleccionar de la lista
   - Cliente: Nombre y teléfono
   - Estado: PENDIENTE
4. Guardar

### 4. Acciones Masivas
1. En la lista de turnos, seleccionar varios turnos
2. En el dropdown "Acción", elegir:
   - "Marcar como CONFIRMADO"
   - "Marcar como REALIZADO"
   - "Marcar como CANCELADO"
3. Click en "Ir"

---

## 🎯 Verificar que Todo Funciona

### Test 1: Admin Panel
✅ Acceder a http://localhost:8000/admin/ con el superusuario  
✅ Ver las 3 secciones: Barberos, Servicios, Turnos  
✅ Crear al menos 1 barbero y 1 servicio  

### Test 2: API REST
✅ Abrir http://localhost:8000/api/barberos/ en el navegador  
✅ Ver respuesta JSON con lista de barberos  
✅ Probar filtros: `?active=true`  

### Test 3: Datos de Prueba
✅ Ejecutar: `python manage.py load_data`  
✅ Verificar en el admin que se crearon 3 barberos, 5 servicios y 10 turnos  
✅ Para limpiar y recargar: `python manage.py load_data --clear`  

### Test 4: Validaciones
✅ Intentar crear dos turnos para el mismo barbero en el mismo horario  
✅ Debe mostrar error de validación  

---

## 🐛 Solución de Problemas Comunes

### Error: "python no se reconoce"
**Solución:** Instalar Python desde https://www.python.org/downloads/

### Error: "No module named 'django'"
**Solución:**
```powershell
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Error: PowerShell no permite ejecutar scripts
**Solución:**
```powershell
# Como Administrador:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: Puerto 8000 ocupado
**Solución:**
```powershell
# Usar otro puerto:
python manage.py runserver 8080
```

### Error: "Table doesn't exist"
**Solución:**
```powershell
python manage.py makemigrations
python manage.py migrate
```

---

## 📚 Comandos Útiles

```powershell
# Detener servidor: Ctrl+C

# Crear respaldo de la BD
copy db.sqlite3 db_backup.sqlite3

# Ver estructura de la BD
python manage.py dbshell
# (luego escribir: .schema)

# Limpiar datos de una tabla
python manage.py shell
>>> from turnos.models import Turno
>>> Turno.objects.all().delete()

# Ejecutar tests
python manage.py test turnos

# Ver todas las URLs disponibles
python manage.py show_urls
# (requiere django-extensions)
```

---

## ✅ Checklist de Inicio

- [ ] Entorno virtual creado y activado
- [ ] Dependencias instaladas
- [ ] Migraciones aplicadas
- [ ] Superusuario creado
- [ ] Datos de prueba cargados (opcional)
- [ ] Servidor corriendo en http://localhost:8000
- [ ] Admin panel accesible con login
- [ ] API REST funcionando

---

## 🎉 ¡Listo!

Ahora tienes el backend completamente funcional de **TINCHO Barbería**.

**Próximo paso:** Crear el frontend con React + Vite + Tailwind (FASE 2)

---

**¿Necesitas ayuda?** Revisa la documentación completa en:
- [INSTALACION.md](INSTALACION.md) - Guía detallada
- [ESTRUCTURA.md](ESTRUCTURA.md) - Estructura del proyecto
- [DIAGRAMA_DB.md](DIAGRAMA_DB.md) - Diagrama de base de datos
- [CHECKLIST.md](CHECKLIST.md) - Estado del proyecto
