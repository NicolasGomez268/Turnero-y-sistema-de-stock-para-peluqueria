# 📋 TAREAS PENDIENTES - TINCHO Barbería
## Panel de Administración - Trabajo en Equipo

---

## 🎯 CÓMO USAR ESTE DOCUMENTO

### Reglas para trabajar sin conflictos:
1. ✅ **Marcar tarea en progreso:** Editar el checkbox a `[🔄]` antes de empezar
2. ✅ **Completar tarea:** Cambiar a `[✅]` al terminar
3. ⚠️ **Respetar dependencias:** No empezar tareas que dependan de otras incompletas
4. 🔴 **Evitar mismos archivos:** No trabajar dos personas en el mismo archivo simultáneamente
5. 💾 **Commits pequeños:** Hacer commit después de cada tarea completada

### Leyenda:
- `[ ]` - Pendiente
- `[🔄]` - En progreso
- `[✅]` - Completada
- `[⏸️]` - Bloqueada (esperando dependencia)

---

## 🏗️ FEATURE 1: GESTIÓN BÁSICA DE STOCK

### **BACKEND - API de Inventario**

#### [ ] **T1.1 - Crear serializers para Producto y Venta**
- **Archivo:** `inventario/serializers.py` (CREAR NUEVO)
- **Descripción:** 
  - ProductoSerializer con todos los campos
  - VentaSerializer con detalles del producto
  - ProductoListSerializer (versión simplificada para listados)
- **Dependencias:** Ninguna
- **Tiempo estimado:** 30 min
- **Notas:** Los modelos ya existen en `inventario/models.py`

```python
# Estructura esperada:
from rest_framework import serializers
from .models import Producto, Venta

class ProductoSerializer(serializers.ModelSerializer):
    margen_ganancia = serializers.ReadOnlyField()
    porcentaje_ganancia = serializers.ReadOnlyField()
    
    class Meta:
        model = Producto
        fields = '__all__'
```

---

#### [ ] **T1.2 - Crear vistas API para productos**
- **Archivo:** `inventario/views.py` (MODIFICAR)
- **Descripción:**
  - GET/POST `/api/inventario/productos/` - Listar y crear productos
  - GET/PUT/PATCH `/api/inventario/productos/{id}/` - Ver, editar, actualizar stock
  - GET `/api/inventario/productos/bajo-stock/` - Filtrar productos con stock <= 5
- **Dependencias:** T1.1 completada
- **Tiempo estimado:** 45 min

```python
# Endpoints a crear:
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manage_productos_list(request):
    # GET: Listar todos los productos (con filtros opcionales)
    # POST: Crear nuevo producto
    pass

@api_view(['GET', 'PUT', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manage_producto_detail(request, producto_id):
    # GET: Ver detalle
    # PUT: Actualizar completo
    # PATCH: Actualizar stock rápido
    pass
```

---

#### [ ] **T1.3 - Crear vistas API para ventas**
- **Archivo:** `inventario/views.py` (MODIFICAR)
- **Descripción:**
  - POST `/api/inventario/ventas/` - Registrar nueva venta (descuenta stock automáticamente)
  - GET `/api/inventario/ventas/` - Historial de ventas con filtros por fecha
  - GET `/api/inventario/ventas/resumen/` - Resumen de ventas (total, cantidad)
- **Dependencias:** T1.1 completada
- **Tiempo estimado:** 40 min

```python
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manage_ventas(request):
    # GET: Historial con filtros ?fecha_inicio=&fecha_fin=
    # POST: Crear venta (validar stock disponible)
    pass
```

---

#### [ ] **T1.4 - Configurar URLs de inventario**
- **Archivo:** `inventario/urls.py` (CREAR NUEVO)
- **Descripción:** Definir todas las rutas de la API de inventario
- **Dependencias:** T1.2 y T1.3 completadas
- **Tiempo estimado:** 15 min

```python
from django.urls import path
from . import views

urlpatterns = [
    path('productos/', views.manage_productos_list, name='productos-list'),
    path('productos/<int:producto_id>/', views.manage_producto_detail, name='producto-detail'),
    path('productos/bajo-stock/', views.productos_bajo_stock, name='productos-bajo-stock'),
    path('ventas/', views.manage_ventas, name='ventas-list'),
    path('ventas/resumen/', views.ventas_resumen, name='ventas-resumen'),
]
```

---

#### [ ] **T1.5 - Registrar URLs en proyecto principal**
- **Archivo:** `tincho_barberia/urls.py` (MODIFICAR)
- **Descripción:** Incluir `path('api/inventario/', include('inventario.urls'))`
- **Dependencias:** T1.4 completada
- **Tiempo estimado:** 5 min

---

### **FRONTEND - Interfaz de Stock**

#### [ ] **T1.6 - Extender api.js con funciones de inventario**
- **Archivo:** `frontend/src/services/api.js` (MODIFICAR)
- **Descripción:**
  - `getAllProductos()` - Listar productos
  - `getProducto(id)` - Ver detalle
  - `createProducto(data)` - Crear producto
  - `updateProducto(id, data)` - Actualizar producto
  - `updateStock(id, cantidad)` - Actualizar solo stock
  - `registrarVenta(data)` - Crear venta
  - `getVentas(fechaInicio, fechaFin)` - Historial ventas
  - `getProductosBajoStock()` - Productos con poco stock
- **Dependencias:** Backend T1.1-T1.5 completadas
- **Tiempo estimado:** 30 min

```javascript
// Agregar al objeto api:
inventario: {
  getAllProductos: async (activos = null) => {
    const params = activos !== null ? `?is_active=${activos}` : '';
    const response = await apiClient.get(`/inventario/productos/${params}`);
    return response.data;
  },
  
  createProducto: async (data) => {
    const response = await apiClient.post('/inventario/productos/', data);
    return response.data;
  },
  
  // ... resto de funciones
}
```

---

#### [ ] **T1.7 - Crear componente AdminStock.jsx - Vista principal**
- **Archivo:** `frontend/src/pages/AdminStock.jsx` (REEMPLAZAR)
- **Descripción:**
  - Header con título y botón "Agregar Producto"
  - Filtros: Todos / Activos / Inactivos / Bajo Stock
  - Tabla de productos con columnas: Nombre, Talle, Stock, Precio Venta, Margen, Acciones
  - Indicadores visuales: 🔴 Sin stock, 🟠 Bajo stock (<=5), 🟢 Stock OK
- **Dependencias:** T1.6 completada
- **Tiempo estimado:** 1 hora

```jsx
// Estructura esperada:
const AdminStock = () => {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('todos'); // todos, activos, bajo_stock
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalVenta, setModalVenta] = useState(null);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header con filtros y botón agregar */}
      {/* Tabla de productos */}
      {/* Modales */}
    </div>
  );
};
```

---

#### [ ] **T1.8 - Crear modal NuevoProductoModal**
- **Archivo:** `frontend/src/pages/AdminStock.jsx` (AGREGAR componente)
- **Descripción:**
  - Formulario con: nombre, talle (dropdown), precio_costo, precio_venta, stock_actual, descripcion
  - Validación: precio_venta > precio_costo
  - Mostrar margen de ganancia en tiempo real
  - Botón guardar llama a `api.inventario.createProducto()`
- **Dependencias:** T1.7 completada
- **Tiempo estimado:** 45 min

---

#### [ ] **T1.9 - Crear modal EditarProductoModal**
- **Archivo:** `frontend/src/pages/AdminStock.jsx` (AGREGAR componente)
- **Descripción:**
  - Similar a NuevoProductoModal pero carga datos existentes
  - Permite editar todos los campos
  - Botón "Guardar Cambios" llama a `api.inventario.updateProducto()`
  - Toggle is_active (Activo/Inactivo)
- **Dependencias:** T1.7 completada
- **Tiempo estimado:** 40 min

---

#### [ ] **T1.10 - Crear modal RegistrarVentaModal**
- **Archivo:** `frontend/src/pages/AdminStock.jsx` (AGREGAR componente)
- **Descripción:**
  - Selector de producto (dropdown)
  - Input cantidad a vender (validar <= stock_actual)
  - Selector método de pago (Efectivo/Transferencia/Tarjeta)
  - Mostrar total calculado
  - Al guardar llama a `api.inventario.registrarVenta()` y recarga lista
- **Dependencias:** T1.7 completada
- **Tiempo estimado:** 50 min

---

#### [ ] **T1.11 - Crear modal HistorialVentasModal**
- **Archivo:** `frontend/src/pages/AdminStock.jsx` (AGREGAR componente)
- **Descripción:**
  - Filtros por rango de fechas
  - Lista de ventas con: fecha, producto, cantidad, precio, método pago, ganancia
  - Total de ventas en el período
  - Botón "Exportar" (opcional, puede ser texto)
- **Dependencias:** T1.7 completada
- **Tiempo estimado:** 45 min

---

#### [ ] **T1.12 - Agregar ícono de alerta en sidebar para stock bajo**
- **Archivo:** `frontend/src/components/AdminLayout.jsx` (MODIFICAR)
- **Descripción:**
  - Consultar `api.inventario.getProductosBajoStock()` al cargar
  - Si hay productos con stock <= 5, mostrar badge rojo con número en botón Stock
  - Ejemplo: "Stock 👕 (3)" con círculo rojo
- **Dependencias:** T1.6 completada
- **Tiempo estimado:** 25 min

---

## 💰 FEATURE 2: REPORTES FINANCIEROS Y LIQUIDACIÓN

### **BACKEND - API de Liquidación**

#### [ ] **T2.1 - Crear serializer para liquidación**
- **Archivo:** `turnos/serializers.py` (MODIFICAR)
- **Descripción:**
  - LiquidacionBarberoSerializer (barbero, cantidad_turnos, total_bruto, comision_barbero, comision_casa)
  - ResumenCajaDiariaSerializer (fecha, total_turnos, total_productos, total_general, metodos_pago)
- **Dependencias:** Ninguna
- **Tiempo estimado:** 30 min

```python
class LiquidacionBarberoSerializer(serializers.Serializer):
    barbero_id = serializers.IntegerField()
    barbero_nombre = serializers.CharField()
    cantidad_turnos = serializers.IntegerField()
    total_bruto = serializers.DecimalField(max_digits=10, decimal_places=2)
    porcentaje_barbero = serializers.DecimalField(max_digits=5, decimal_places=2)
    comision_barbero = serializers.DecimalField(max_digits=10, decimal_places=2)
    comision_casa = serializers.DecimalField(max_digits=10, decimal_places=2)
```

---

#### [ ] **T2.2 - Crear vista API para liquidación semanal**
- **Archivo:** `turnos/liquidacion_views.py` (CREAR NUEVO)
- **Descripción:**
  - GET `/api/admin/liquidacion/?fecha_inicio=&fecha_fin=`
  - Calcular por cada barbero: turnos realizados, total bruto, 60% barbero, 40% casa
  - Incluir totales generales
  - Por defecto: semana actual (lunes a domingo)
- **Dependencias:** T2.1 completada
- **Tiempo estimado:** 1 hora
- **Nota:** Ya existe lógica en `turnos/admin.py` línea 197, reutilizar

```python
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from decimal import Decimal

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def liquidacion_semanal(request):
    # Obtener parámetros de fecha
    # Calcular liquidación por barbero
    # Retornar JSON con estructura clara
    pass
```

---

#### [ ] **T2.3 - Crear vista API para caja diaria**
- **Archivo:** `turnos/liquidacion_views.py` (MODIFICAR)
- **Descripción:**
  - GET `/api/admin/caja-diaria/?fecha=YYYY-MM-DD`
  - Retornar: total de turnos realizados, total de ventas de productos, total general
  - Desglose por método de pago (de ventas)
  - Por defecto: día actual
- **Dependencias:** T2.1 completada
- **Tiempo estimado:** 45 min

```python
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def caja_diaria(request):
    # Obtener fecha (default=hoy)
    # Total turnos REALIZADOS del día
    # Total ventas del día (consultar inventario)
    # Desglosar por método de pago
    pass
```

---

#### [ ] **T2.4 - Crear vista API para métricas mensuales**
- **Archivo:** `turnos/liquidacion_views.py` (MODIFICAR)
- **Descripción:**
  - GET `/api/admin/metricas-mensuales/?mes=2&anio=2026`
  - Retornar: total turnos, total ventas, ganancia total, mejor barbero, servicio más vendido
  - Por defecto: mes actual
- **Dependencias:** T2.1 completada
- **Tiempo estimado:** 40 min

---

#### [ ] **T2.5 - Configurar URLs de liquidación**
- **Archivo:** `turnos/urls.py` (MODIFICAR)
- **Descripción:** Agregar rutas de liquidación en sección admin
- **Dependencias:** T2.2, T2.3, T2.4 completadas
- **Tiempo estimado:** 10 min

```python
# Agregar a urlpatterns:
path('admin/liquidacion/', liquidacion_views.liquidacion_semanal, name='admin-liquidacion'),
path('admin/caja-diaria/', liquidacion_views.caja_diaria, name='admin-caja'),
path('admin/metricas-mensuales/', liquidacion_views.metricas_mensuales, name='admin-metricas'),
```

---

### **FRONTEND - Interfaz de Caja**

#### [ ] **T2.6 - Extender api.js con funciones financieras**
- **Archivo:** `frontend/src/services/api.js` (MODIFICAR)
- **Descripción:**
  - `getLiquidacion(fechaInicio, fechaFin)` - Liquidación de barberos
  - `getCajaDiaria(fecha)` - Caja del día
  - `getMetricasMensuales(mes, anio)` - Métricas del mes
- **Dependencias:** Backend T2.2-T2.5 completadas
- **Tiempo estimado:** 20 min

---

#### [ ] **T2.7 - Crear componente AdminCaja.jsx - Vista principal**
- **Archivo:** `frontend/src/pages/AdminCaja.jsx` (REEMPLAZAR)
- **Descripción:**
  - 3 pestañas/secciones: "Caja Diaria" | "Liquidación Semanal" | "Métricas Mensuales"
  - Usar useState para controlar pestaña activa
  - Cada pestaña renderiza un componente hijo
- **Dependencias:** T2.6 completada
- **Tiempo estimado:** 30 min

```jsx
const AdminCaja = () => {
  const [pestanaActiva, setPestanaActiva] = useState('caja'); // caja, liquidacion, metricas
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button onClick={() => setPestanaActiva('caja')}>💰 Caja Diaria</button>
        <button onClick={() => setPestanaActiva('liquidacion')}>📊 Liquidación</button>
        <button onClick={() => setPestanaActiva('metricas')}>📈 Métricas</button>
      </div>
      
      {/* Contenido */}
      {pestanaActiva === 'caja' && <CajaDiariaTab />}
      {pestanaActiva === 'liquidacion' && <LiquidacionTab />}
      {pestanaActiva === 'metricas' && <MetricasTab />}
    </div>
  );
};
```

---

#### [ ] **T2.8 - Crear tab CajaDiariaTab**
- **Archivo:** `frontend/src/pages/AdminCaja.jsx` (AGREGAR componente)
- **Descripción:**
  - Selector de fecha (default: hoy)
  - 3 tarjetas métricas: Total Turnos, Total Ventas Productos, Total General
  - Tabla desglose por método de pago
  - Botón "Cerrar Caja" (solo visual, no hace nada por ahora)
- **Dependencias:** T2.7 completada
- **Tiempo estimado:** 50 min

---

#### [ ] **T2.9 - Crear tab LiquidacionTab**
- **Archivo:** `frontend/src/pages/AdminCaja.jsx` (AGREGAR componente)
- **Descripción:**
  - Selector de rango de fechas (default: semana actual)
  - Botones rápidos: "Semana Actual" | "Semana Pasada" | "Mes Actual"
  - Tabla por barbero con columnas: Barbero, Turnos, Total Bruto, 60% Barbero, 40% Casa
  - Fila de totales al final
  - Botón "Exportar a Excel" (solo visual por ahora)
- **Dependencias:** T2.7 completada
- **Tiempo estimado:** 1 hora

---

#### [ ] **T2.10 - Crear tab MetricasTab**
- **Archivo:** `frontend/src/pages/AdminCaja.jsx` (AGREGAR componente)
- **Descripción:**
  - Selector de mes/año
  - 5 tarjetas métricas:
    - Total de Turnos Realizados
    - Total de Ventas de Productos
    - Ganancia Total (turnos + productos)
    - Mejor Barbero del Mes (más turnos)
    - Servicio Más Solicitado
  - Gráfico simple (puede ser texto estilo "barras" ASCII por ahora)
- **Dependencias:** T2.7 completada
- **Tiempo estimado:** 1 hora

---

## 📅 FEATURE 3: CREAR RESERVAS MANUALES EN AGENDA

### **BACKEND - API de Reservas Manuales**

#### [ ] **T3.1 - Crear endpoint para crear turno manual**
- **Archivo:** `turnos/admin_views.py` (MODIFICAR)
- **Descripción:**
  - POST `/api/admin/turnos/manual/`
  - Body: { barbero_id, servicio_id, fecha, hora, cliente_nombre, cliente_telefono, notas }
  - Validar que el slot esté disponible (misma lógica que wizard público)
  - Marcar turno como CONFIRMADO automáticamente
- **Dependencias:** Ninguna (usa código existente)
- **Tiempo estimado:** 40 min

```python
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def crear_turno_manual(request):
    # Validar datos requeridos
    # Validar disponibilidad del slot
    # Crear turno con estado CONFIRMADO
    # Retornar TurnoAdminSerializer
    pass
```

---

#### [ ] **T3.2 - Registrar URL de turno manual**
- **Archivo:** `turnos/urls.py` (MODIFICAR)
- **Descripción:** Agregar `path('admin/turnos/manual/', admin_views.crear_turno_manual)`
- **Dependencias:** T3.1 completada
- **Tiempo estimado:** 5 min

---

### **FRONTEND - Modal de Reserva Manual**

#### [ ] **T3.3 - Extender api.js con función de turno manual**
- **Archivo:** `frontend/src/services/api.js` (MODIFICAR)
- **Descripción:**
  - `createTurnoManual(data)` - Crear turno desde admin
- **Dependencias:** Backend T3.1-T3.2 completadas
- **Tiempo estimado:** 10 min

---

#### [ ] **T3.4 - Agregar botón "Nueva Reserva" en AdminDashboard**
- **Archivo:** `frontend/src/pages/AdminDashboard.jsx` (MODIFICAR)
- **Descripción:**
  - Agregar botón flotante o en header: "➕ Nueva Reserva"
  - Al hacer click abre modal `NuevaReservaModal`
  - Ubicación sugerida: al lado del selector de fecha
- **Dependencias:** Ninguna
- **Tiempo estimado:** 15 min

---

#### [ ] **T3.5 - Crear modal NuevaReservaModal - Paso 1: Seleccionar Barbero**
- **Archivo:** `frontend/src/pages/AdminDashboard.jsx` (AGREGAR componente)
- **Descripción:**
  - Modal con stepper visual (Paso 1/4)
  - Grid de tarjetas de barberos activos
  - Al seleccionar pasa al Paso 2
  - Botón "Cancelar" cierra modal
- **Dependencias:** T3.4 completada
- **Tiempo estimado:** 40 min

```jsx
const NuevaReservaModal = ({ onClose, onSuccess }) => {
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState({
    barbero: null,
    servicio: null,
    fecha: null,
    hora: null,
    cliente_nombre: '',
    cliente_telefono: '',
    notas: ''
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50">
      {/* Stepper: 1. Barbero | 2. Servicio | 3. Fecha/Hora | 4. Cliente */}
      {paso === 1 && <PasoSeleccionarBarbero />}
      {paso === 2 && <PasoSeleccionarServicio />}
      {paso === 3 && <PasoSeleccionarFechaHora />}
      {paso === 4 && <PasoDatosCliente />}
    </div>
  );
};
```

---

#### [ ] **T3.6 - Crear modal NuevaReservaModal - Paso 2: Seleccionar Servicio**
- **Archivo:** `frontend/src/pages/AdminDashboard.jsx` (AGREGAR componente)
- **Descripción:**
  - Lista de servicios activos
  - Mostrar nombre, precio y duración
  - Botón "Atrás" vuelve al Paso 1
  - Botón "Siguiente" va al Paso 3
- **Dependencias:** T3.5 completada
- **Tiempo estimado:** 30 min

---

#### [ ] **T3.7 - Crear modal NuevaReservaModal - Paso 3: Fecha y Hora**
- **Archivo:** `frontend/src/pages/AdminDashboard.jsx` (AGREGAR componente)
- **Descripción:**
  - Selector de fecha (input type="date")
  - Al seleccionar fecha, consultar slots disponibles con `api.getDisponibilidad()`
  - Grid de slots horarios disponibles
  - Mostrar solo slots libres para el barbero seleccionado
  - Botón "Atrás" | "Siguiente"
- **Dependencias:** T3.6 completada
- **Tiempo estimado:** 50 min

---

#### [ ] **T3.8 - Crear modal NuevaReservaModal - Paso 4: Datos del Cliente**
- **Archivo:** `frontend/src/pages/AdminDashboard.jsx` (AGREGAR componente)
- **Descripción:**
  - Formulario: cliente_nombre (requerido), cliente_telefono (requerido), notas (opcional)
  - Resumen de la reserva: Barbero, Servicio, Fecha, Hora, Total
  - Botón "Atrás" | "Confirmar Reserva"
  - Al confirmar llama a `api.createTurnoManual()` y recarga agenda
  - Mostrar mensaje de éxito y cerrar modal
- **Dependencias:** T3.7 completada
- **Tiempo estimado:** 45 min

---

#### [ ] **T3.9 - Agregar validación de duplicados**
- **Archivo:** `frontend/src/pages/AdminDashboard.jsx` (MODIFICAR NuevaReservaModal)
- **Descripción:**
  - Antes de crear turno, validar que no exista otro turno para el mismo barbero/fecha/hora
  - Mostrar alerta si el slot ya está ocupado: "Este horario ya está reservado. Por favor seleccione otro."
- **Dependencias:** T3.8 completada
- **Tiempo estimado:** 20 min

---

## 🎯 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### **SPRINT 1: Stock** (Total: ~8 horas)
Persona A (Backend):
1. T1.1 → T1.2 → T1.3 → T1.4 → T1.5

Persona B (Frontend):
1. Esperar T1.5, luego: T1.6 → T1.7 → T1.8 → T1.9 → T1.10 → T1.11 → T1.12

### **SPRINT 2: Liquidación** (Total: ~7 horas)
Persona A (Backend):
1. T2.1 → T2.2 → T2.3 → T2.4 → T2.5

Persona B (Frontend):
1. Esperar T2.5, luego: T2.6 → T2.7 → T2.8 → T2.9 → T2.10

### **SPRINT 3: Reservas Manuales** (Total: ~4 horas)
Persona A (Backend):
1. T3.1 → T3.2

Persona B (Frontend):
1. Esperar T3.2, luego: T3.3 → T3.4 → T3.5 → T3.6 → T3.7 → T3.8 → T3.9

---

## 📝 TRABAJO EN PARALELO - ESTRATEGIA

### **Opción 1: División por Feature Completa**
- **Persona A:** Hace TODO el Stock (backend + frontend) - Días 1-2
- **Persona B:** Hace TODO la Liquidación (backend + frontend) - Días 3-4
- **Juntos:** Reservas Manuales (Día 5)

### **Opción 2: División Backend/Frontend** (RECOMENDADA)
- **Persona A (Backend):** Hace T1.1-T1.5, luego T2.1-T2.5, luego T3.1-T3.2
- **Persona B (Frontend):** Espera 2 horas, hace T1.6-T1.12, luego T2.6-T2.10, luego T3.3-T3.9

### **Opción 3: Alternada**
- **Día 1 AM:** Persona A → Stock Backend / Persona B → Liquidación Backend
- **Día 1 PM:** Persona A → Stock Frontend / Persona B → Liquidación Frontend
- **Día 2:** Juntos → Reservas Manuales

---

## ✅ CHECKLIST DE FINALIZACIÓN

### Stock
- [ ] Se pueden listar productos con filtros
- [ ] Se puede crear nuevo producto
- [ ] Se puede editar producto existente
- [ ] Se puede registrar una venta (descuenta stock)
- [ ] Aparece alerta en sidebar si hay productos con stock bajo
- [ ] Se puede ver historial de ventas

### Liquidación
- [ ] Se puede ver caja diaria de cualquier fecha
- [ ] Se puede ver liquidación semanal con split 60/40
- [ ] Se pueden ver métricas mensuales
- [ ] Los totales cuadran correctamente

### Reservas Manuales
- [ ] Se puede crear turno desde el panel admin
- [ ] El wizard tiene 4 pasos funcionales
- [ ] Solo muestra slots disponibles
- [ ] Valida duplicados
- [ ] El nuevo turno aparece en la agenda inmediatamente

---

## 🔧 COMANDOS ÚTILES

### Crear nueva migración (si modifican modelos):
```bash
python manage.py makemigrations
python manage.py migrate
```

### Probar endpoints del backend:
```bash
# En Django shell
python manage.py shell
from turnos.models import Turno
from inventario.models import Producto
```

### Reiniciar servidores:
```bash
# Backend
python manage.py runserver

# Frontend (en otra terminal)
cd frontend
npm run dev
```

---

## 📞 COMUNICACIÓN

### Antes de empezar una tarea:
1. Cambiar checkbox a `[🔄]` en este archivo
2. Hacer commit: `git commit -m "🔄 Iniciando T1.3 - API ventas"`
3. Avisar al compañero en chat/presencial

### Al terminar una tarea:
1. Cambiar checkbox a `[✅]`
2. Hacer commit: `git commit -m "✅ T1.3 completada - API ventas funcionando"`
3. Push: `git push origin main`
4. Avisar al compañero que ya puede empezar tareas dependientes

### Si dos personas tocan el mismo archivo:
1. Persona A termina y hace push PRIMERO
2. Persona B hace `git pull` ANTES de empezar su tarea
3. Si hay conflicto: resolverlo juntos

---

## 🎉 ¡ÉXITO!

Con estas tareas completadas, el panel de administración estará 100% funcional para gestionar:
- ✅ Agenda y turnos
- ✅ Barberos y horarios  
- ✅ Stock de indumentaria
- ✅ Reportes financieros
- ✅ Liquidación de barberos
- ✅ Reservas walk-in

**¡A codear! 🚀**
