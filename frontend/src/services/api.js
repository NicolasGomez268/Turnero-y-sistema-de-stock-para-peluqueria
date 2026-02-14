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
    config.headers.Authorization = `Bearer ${token}`;
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
  marcarTurnoRealizado: async (turnoId) => {
    try {
      const response = await apiClient.patch(`/admin/turnos/${turnoId}/marcar-realizado/`);
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
};

export default api;
