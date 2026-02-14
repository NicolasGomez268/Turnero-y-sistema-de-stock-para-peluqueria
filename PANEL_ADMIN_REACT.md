# 🔐 Panel de Administración React - TINCHO Barbería

## 📱 Acceso al Panel

### 1. **Botón de Acceso**
En la página principal (Home), baja hasta el footer. Verás un botón discreto que dice:
```
🔒 Admin
```

Haz clic para ir al login.

### 2. **Login de Administrador**
**URL:** `http://localhost:5174/admin-login`

**Credenciales:**
- Usuario: `tincho` (o tu usuario de superadmin)
- Contraseña: La que configuraste al crear el superusuario

**Características:**
- Formulario elegante con identidad visual TINCHO
- Solo usuarios `is_staff=True` pueden acceder
- Token de autenticación guardado en localStorage

---

## 🎛️ Dashboard Principal

**URL:** `http://localhost:5174/admin-dashboard`

### 📊 Métricas Rápidas (3 Tarjetas Superiores)

#### 1️⃣ **Ganancia Semanal** (Verde)
- Muestra el total recaudado de los últimos 7 días
- Solo cuenta turnos con estado **REALIZADO**
- Se actualiza en tiempo real

#### 2️⃣ **Turnos de Hoy** (Azul)
- Cantidad de turnos agendados para hoy
- Incluye pendientes, realizados y cancelados

#### 3️⃣ **Próximo Cliente** (Dorado)
- Muestra la hora y nombre del próximo cliente
- Solo turnos con estado **PENDIENTE**
- Si no hay turnos pendientes: "Sin turnos pendientes"

---

### 📅 Agenda Visual

**Características:**
- Muestra todos los turnos del día seleccionado
- Ordenados por hora (de menor a mayor)
- Vista en tarjetas con colores por estado

**Tarjetas de Turno:**

Cada tarjeta muestra:
- ⏰ **Hora** (grande, en dorado)
- 👤 **Cliente** (nombre y teléfono)
- ✂️ **Barbero** asignado
- 📋 **Servicio** y precio
- 📝 **Notas** (si las hay)
- ⚡ **Estado** (ver abajo)

**Estados de Turno:**

| Estado | Color | Badge |
|--------|-------|-------|
| **PENDIENTE** | Azul | `PENDIENTE` |
| **REALIZADO** | Verde | `REALIZADO` |
| **CANCELADO** | Rojo | `CANCELADO` |

---

### ⚡ Acciones Rápidas

Solo disponibles para turnos **PENDIENTES**:

#### ✅ **Marcar Asistió**
- Botón verde con ✓
- Cambia el estado a **REALIZADO**
- Confirma con popup
- Se actualiza la lista automáticamente

#### ❌ **Cancelar Turno**
- Botón rojo con ✕
- Cambia el estado a **CANCELADO**
- Confirma con popup
- Se actualiza la lista automáticamente

---

### 📆 Selector de Fecha

**Ubicación:** Arriba a la derecha de "Agenda del Día"

**Uso:**
1. Clic en el input de fecha
2. Seleccionar fecha en el calendario
3. La lista de turnos se actualiza automáticamente

**Botón Actualizar:**
- Recarga manualmente los turnos
- Útil para ver cambios en tiempo real

---

## 🗂️ Funcionalidades Extras

### **Botón Stock 📦**
- Ubicado en el header (arriba a la derecha)
- Lleva a `/admin-stock` (módulo en desarrollo)
- Por ahora muestra: "Módulo de Stock - Próximamente"

### **Cerrar Sesión**
- Botón gris en el header
- Elimina el token y redirige al home
- Confirma con popup

---

## 🔒 Rutas Protegidas

Estas rutas requieren autenticación:

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin-login` | AdminLogin | Login público |
| `/admin-dashboard` | AdminDashboard | Dashboard protegido |
| `/admin-stock` | (Futuro) | Gestión de inventario |

**Si no estás logueado:** Redirige automáticamente a `/admin-login`

---

## 🎨 Identidad Visual

El panel mantiene la identidad TINCHO:

- **Fondo:** `bg-tincho-dark` (#333333)
- **Textos destacados:** `text-tincho-gold` (#FFD700)
- **Tarjetas:** Gris oscuro con bordes gold al hover
- **Botones:**
  - Verde: Acciones positivas (Asistió)
  - Rojo: Acciones negativas (Cancelar)
  - Dorado: Acciones principales (Actualizar)

---

## 🔧 API Endpoints Usados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/login/` | POST | Autenticación admin |
| `/api/admin/turnos/?fecha=YYYY-MM-DD` | GET | Turnos por fecha |
| `/api/admin/turnos/semanales/` | GET | Turnos últimos 7 días |
| `/api/admin/turnos/{id}/marcar-realizado/` | PATCH | Marcar REALIZADO |
| `/api/admin/turnos/{id}/cancelar/` | PATCH | Marcar CANCELADO |

**Autenticación:**
- Header: `Authorization: Bearer {token}`
- Token guardado en `localStorage` después del login

---

## 🚀 Flujo de Uso Típico

### **Escenario 1: Ver Turnos del Día**
1. Iniciar sesión con credenciales
2. Dashboard muestra automáticamente turnos de hoy
3. Ver métricas en las 3 tarjetas superiores
4. Revisar lista de turnos ordenada por hora

### **Escenario 2: Cliente Llega a su Turno**
1. Buscar tarjeta del cliente en la agenda
2. Verificar datos (hora, servicio, barbero)
3. Clic en **✓ Asistió**
4. Confirmar popup
5. Tarjeta cambia a verde con estado "REALIZADO"
6. Métricas se actualizan automáticamente

### **Escenario 3: Cliente Cancela por Teléfono**
1. Buscar turno del cliente
2. Clic en **✕ Cancelar**
3. Confirmar popup
4. Tarjeta cambia a rojo con estado "CANCELADO"

### **Escenario 4: Ver Turnos de Otra Fecha**
1. Clic en selector de fecha
2. Elegir fecha del calendario
3. Turnos se cargan automáticamente
4. Si no hay turnos: "No hay turnos para esta fecha"

---

## ⚠️ Notas Importantes

### **Permisos**
- Solo usuarios con `is_staff=True` pueden loguearse
- El token NO expira automáticamente (permanece hasta logout manual)
- Si el backend se reinicia, el token sigue siendo válido

### **Estados de Turno**
- **PENDIENTE → REALIZADO:** ✅ Permitido
- **PENDIENTE → CANCELADO:** ✅ Permitido
- **REALIZADO → CANCELADO:** ❌ No permitido (botones ocultos)
- **CANCELADO → Cualquier estado:** ❌ No permitido (botones ocultos)

### **Actualización Automática**
- Las métricas se recalculan cada vez que cargas turnos
- La lista de turnos NO se actualiza sola (debes hacer clic en "Actualizar")
- Las acciones (Asistió/Cancelar) recargan automáticamente

---

## 🐛 Solución de Problemas

### "Credenciales inválidas"
- Verifica usuario y contraseña
- Asegúrate de que el usuario tiene `is_staff=True`
- Prueba con el usuario `tincho` creado anteriormente

### "Error al cargar los datos"
- Verifica que el backend esté corriendo (localhost:8000)
- Revisa la consola del navegador (F12)
- Verifica que el token esté en localStorage

### Panel muestra "Cargando..."
- Verifica conexión con el backend
- Revisa errores en la consola del frontend
- Asegúrate de tener turnos en la BD

### Botones no funcionan
- Verifica estado del backend
- Revisa la consola web (F12)
- Asegúrate de que el turno esté en estado PENDIENTE

---

## 🔄 Diferencias con Django Admin

| Aspecto | Django Admin | Panel React |
|---------|--------------|-------------|
| **Interfaz** | Genérica de Django | Personalizada TINCHO |
| **Acciones** | Editar formularios | Botones rápidos |
| **Métricas** | No integradas | 3 métricas en tiempo real |
| **Vista** | Lista con paginación | Tarjetas visuales |
| **Uso** | Escritorio completo | Tablet/Mobile friendly |
| **Velocidad** | Carga páginas completas | Actualizaciones rápidas |

---

## 📱 Acceso Rápido

**Desarrollo:**
- Home: http://localhost:5174/
- Login Admin: http://localhost:5174/admin-login
- Dashboard: http://localhost:5174/admin-dashboard

**Producción:**
- Home: https://tudominio.com/
- Login Admin: https://tudominio.com/admin-login
- Dashboard: https://tudominio.com/admin-dashboard

---

## ✨ Próximas Funcionalidades

- [ ] Módulo de Stock/Inventario (`/admin-stock`)
- [ ] Editar turnos desde el panel
- [ ] Agregar turnos manualmente
- [ ] Ver historial de clientes
- [ ] Estadísticas avanzadas (gráficos)
- [ ] Notificaciones push
- [ ] Exportar reportes PDF/Excel

---

**¡El Panel de Administración está listo para usar!** 🎉

Para comenzar, abre: http://localhost:5174/ y haz clic en "🔒 Admin" en el footer.
