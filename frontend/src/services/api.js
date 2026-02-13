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
};

export default api;
