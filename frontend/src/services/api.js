import axios from 'axios';

// Base URL de la API Django (desde variable de entorno)
// En desarrollo usa '/api' (proxy de Vite)
// En producción usa la URL completa del backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Servicios de la API para TINCHO Barbería
 */
const api = {
  /**
   * Obtener todos los barberos activos
   * GET /api/barberos/
   */
  getBarberos: async () => {
    try {
      const response = await apiClient.get('/barberos/');
      // Manejar respuesta paginada o array directo
      const barberos = response.data.results || response.data;
      // Filtrar solo barberos activos
      return Array.isArray(barberos) 
        ? barberos.filter(barbero => barbero.is_active)
        : [];
    } catch (error) {
      console.error('Error al obtener barberos:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los servicios
   * GET /api/servicios/
   */
  getServicios: async () => {
    try {
      const response = await apiClient.get('/servicios/');
      // Manejar respuesta paginada o array directo
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      throw error;
    }
  },

  /**
   * Obtener disponibilidad de horarios
   * GET /api/disponibilidad/
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {number} barberoId - ID del barbero
   * @param {number} servicioId - ID del servicio (opcional)
   */
  getDisponibilidad: async (fecha, barberoId, servicioId = null) => {
    try {
      const params = {
        fecha,
        barbero_id: barberoId,
      };
      
      if (servicioId) {
        params.servicio_id = servicioId;
      }

      const response = await apiClient.get('/disponibilidad/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
      throw error;
    }
  },

  /**
   * Reservar un turno
   * POST /api/reservar/
   * @param {Object} reservaData - Datos de la reserva
   */
  reservarTurno: async (reservaData) => {
    try {
      const response = await apiClient.post('/reservar/', reservaData);
      return response.data;
    } catch (error) {
      console.error('Error al reservar turno:', error);
      // Lanzar el error con los detalles del backend
      throw error.response?.data || error;
    }
  },

  // ===================================
  // ADMIN ENDPOINTS
  // ===================================

  /**
   * Login de administrador
   * POST /api/admin/login/
   * @param {Object} credentials - { username, password }
   */
  adminLogin: async (credentials) => {
    try {
      const response = await apiClient.post('/admin/login/', credentials);
      return response.data;
    } catch (error) {
      console.error('Error en login:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Credenciales inválidas';
      throw { message: errorMsg };
    }
  },

  /**
   * Obtener turnos de una fecha específica
   * GET /api/admin/turnos/?fecha=YYYY-MM-DD
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   */
  getTurnosPorFecha: async (fecha) => {
    try {
      const response = await apiClient.get('/admin/turnos/', {
        params: { fecha }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener turnos:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener turnos de los últimos 7 días (para métricas)
   * GET /api/admin/turnos/semanales/
   */
  getTurnosSemanales: async () => {
    try {
      const response = await apiClient.get('/admin/turnos/semanales/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener turnos semanales:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Marcar turno como REALIZADO
   * PATCH /api/admin/turnos/{id}/marcar-realizado/
   * @param {number} turnoId - ID del turno
   */
  marcarTurnoRealizado: async (turnoId, metodoPago = 'EFECTIVO') => {
    try {
      const response = await apiClient.patch(`/admin/turnos/${turnoId}/marcar-realizado/`, {
        metodo_pago: metodoPago,
      });
      return response.data;
    } catch (error) {
      console.error('Error al marcar turno realizado:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Cancelar turno
   * PATCH /api/admin/turnos/{id}/cancelar/
   * @param {number} turnoId - ID del turno
   */
  cancelarTurno: async (turnoId) => {
    try {
      const response = await apiClient.patch(`/admin/turnos/${turnoId}/cancelar/`);
      return response.data;
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Crear turno manualmente (para walk-ins)
   * POST /api/admin/turnos/manual/
   * @param {Object} data - Datos del turno (barbero_id, servicio_id, fecha, hora, cliente_nombre, cliente_telefono, notas)
   */
  createTurnoManual: async (data) => {
    try {
      const response = await apiClient.post('/admin/turnos/manual/', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear turno manual:', error);
      throw error.response?.data || error;
    }
  },

  // ===================================
  // GESTIÓN DE SERVICIOS (CRUD)
  // ===================================

  /**
   * Crear un nuevo servicio
   * POST /api/servicios/
   */
  createServicio: async (data) => {
    try {
      const response = await apiClient.post('/servicios/', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear servicio:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Actualizar un servicio existente
   * PUT /api/servicios/{id}/
   */
  updateServicio: async (id, data) => {
    try {
      const response = await apiClient.put(`/servicios/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar servicio:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Eliminar un servicio
   * DELETE /api/servicios/{id}/
   */
  deleteServicio: async (id) => {
    try {
      const response = await apiClient.delete(`/servicios/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      throw error.response?.data || error;
    }
  },

  // ===================================
  // GESTIÓN DE BARBEROS
  // ===================================

  /**
   * Obtener todos los barberos (incluidos inactivos)
   * GET /api/barberos/
   */
  getAllBarberos: async () => {
    try {
      const response = await apiClient.get('/barberos/');
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error al obtener todos los barberos:', error);
      throw error;
    }
  },

  /**
   * Actualizar barbero
   * PUT /api/barberos/{id}/
   * @param {number} barberoId - ID del barbero
   * @param {Object} data - Datos a actualizar (is_active, nombre, especialidad, etc.)
   */
  updateBarbero: async (barberoId, data) => {
    try {
      const response = await apiClient.put(`/barberos/${barberoId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar barbero:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Crear nuevo barbero
   * POST /api/barberos/
   * @param {Object} data - Datos del nuevo barbero
   */
  createBarbero: async (data) => {
    try {
      const response = await apiClient.post('/barberos/', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear barbero:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Subir foto de barbero
   * PATCH /api/barberos/{id}/foto/
   * @param {number} barberoId - ID del barbero
   * @param {File} file - Archivo de imagen
   */
  uploadBarberoPhoto: async (barberoId, file) => {
    try {
      const formData = new FormData();
      formData.append('foto', file);
      const response = await apiClient.patch(`/barberos/${barberoId}/foto/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al subir foto:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener horarios de un barbero
   * GET /api/barberos/{id}/horarios/
   * @param {number} barberoId - ID del barbero
   */
  getBarberoHorarios: async (barberoId) => {
    try {
      const response = await apiClient.get(`/barberos/${barberoId}/horarios/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener horarios:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Actualizar horarios de un barbero
   * PUT /api/barberos/{id}/horarios/
   * @param {number} barberoId - ID del barbero
   * @param {Array} horarios - Array de horarios
   */
  updateBarberoHorarios: async (barberoId, horarios) => {
    try {
      const response = await apiClient.put(`/barberos/${barberoId}/horarios/`, { horarios });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar horarios:', error);
      throw error.response?.data || error;
    }
  },


  // ===================================
  // LIQUIDACIÓN Y CAJA
  // ===================================

  /**
   * Obtener liquidación semanal de barberos
   * GET /api/admin/liquidacion/?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
   * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   */
  getLiquidacion: async (fechaInicio, fechaFin) => {
    try {
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      
      const response = await apiClient.get('/admin/liquidacion/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener liquidación:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener caja diaria
   * GET /api/admin/caja-diaria/?fecha=YYYY-MM-DD
   * @param {string} fecha - Fecha (YYYY-MM-DD), default: hoy
   */
  getCajaDiaria: async (fecha) => {
    try {
      const params = {};
      if (fecha) params.fecha = fecha;
      
      const response = await apiClient.get('/admin/caja-diaria/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener caja diaria:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener métricas mensuales
   * GET /api/admin/metricas-mensuales/?mes=2&anio=2026
   * @param {number} mes - Número del mes (1-12)
   * @param {number} anio - Año
   */
  getMetricasMensuales: async (mes, anio) => {
    try {
      const params = {};
      if (mes) params.mes = mes;
      if (anio) params.anio = anio;
      
      const response = await apiClient.get('/admin/metricas-mensuales/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener métricas mensuales:', error);
      throw error.response?.data || error;
    }
  },


  // ===================================
  // INVENTARIO — PRODUCTOS
  // ===================================

  /**
   * Listar productos
   * GET /api/inventario/productos/
   * @param {Object} filtros - { activo, categoria, con_stock }
   */
  getProductos: async (filtros = {}) => {
    try {
      const response = await apiClient.get('/inventario/productos/', { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Crear producto
   * POST /api/inventario/productos/
   */
  createProducto: async (data) => {
    try {
      const response = await apiClient.post('/inventario/productos/', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Actualizar producto
   * PUT /api/inventario/productos/{id}/
   */
  updateProducto: async (id, data) => {
    try {
      const response = await apiClient.put(`/inventario/productos/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Eliminar producto
   * DELETE /api/inventario/productos/{id}/
   */
  deleteProducto: async (id) => {
    try {
      const response = await apiClient.delete(`/inventario/productos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Ajustar stock de un producto
   * PATCH /api/inventario/productos/{id}/stock/
   * @param {number} id - ID del producto
   * @param {number} cantidad - Cantidad a ajustar
   * @param {string} operacion - "agregar" | "restar" | "establecer"
   */
  ajustarStock: async (id, cantidad, operacion = 'agregar') => {
    try {
      const response = await apiClient.patch(`/inventario/productos/${id}/stock/`, { cantidad, operacion });
      return response.data;
    } catch (error) {
      console.error('Error al ajustar stock:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener categorías únicas
   * GET /api/inventario/categorias/
   */
  getCategorias: async () => {
    try {
      const response = await apiClient.get('/inventario/categorias/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error.response?.data || error;
    }
  },

  // ===================================
  // INVENTARIO — VENTAS
  // ===================================

  /**
   * Listar ventas con resumen
   * GET /api/inventario/ventas/
   * @param {Object} filtros - { fecha, fecha_inicio, fecha_fin, producto_id }
   */
  getVentas: async (filtros = {}) => {
    try {
      const response = await apiClient.get('/inventario/ventas/', { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Registrar una venta (descuenta stock automáticamente)
   * POST /api/inventario/ventas/
   * @param {Object} data - { producto, cantidad, precio_unitario, metodo_pago, vendedor, notas }
   */
  registrarVenta: async (data) => {
    try {
      const response = await apiClient.post('/inventario/ventas/', data);
      return response.data;
    } catch (error) {
      console.error('Error al registrar venta:', error);
      throw error.response?.data || error;
    }
  },

};
export default api;
