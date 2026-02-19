/**
 * Servicio para manejar notificaciones push web
 */

class PushNotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  /**
   * Verificar si las notificaciones están soportadas
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * Solicitar permiso para notificaciones
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Las notificaciones no están soportadas en este navegador');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  }

  /**
   * Enviar una notificación
   * @param {string} title - Título de la notificación
   * @param {object} options - Opciones de la notificación
   */
  async sendNotification(title, options = {}) {
    if (!this.isSupported) {
      console.warn('Las notificaciones no están soportadas');
      return null;
    }

    if (this.permission !== 'granted') {
      console.warn('No hay permiso para enviar notificaciones');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/logo-tincho.png', // Asegúrate de tener un logo en public/
        badge: '/logo-tincho.png',
        requireInteraction: true, // Mantener visible hasta que el usuario la cierre
        ...options,
      });

      // Auto-cerrar después de 10 segundos si el usuario no interactúa
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      return null;
    }
  }

  /**
   * Notificación de cancelación de turno
   */
  async notificarCancelacion(turnoData) {
    const { cliente_nombre, fecha, hora, barbero_nombre } = turnoData;
    
    return this.sendNotification('❌ Turno Cancelado - TINCHO Barbería', {
      body: `Hola ${cliente_nombre}! Tu turno del ${fecha} a las ${hora} con ${barbero_nombre} ha sido cancelado. Por favor contactanos.`,
      tag: `turno-cancelado-${turnoData.id}`, // Evita duplicados
      vibrate: [200, 100, 200], // Patrón de vibración
    });
  }

  /**
   * Notificación de confirmación de turno
   */
  async notificarConfirmacion(turnoData) {
    const { cliente_nombre, fecha, hora, barbero_nombre } = turnoData;
    
    return this.sendNotification('✅ Turno Confirmado - TINCHO Barbería', {
      body: `¡Listo ${cliente_nombre}! Tu turno con ${barbero_nombre} es el ${fecha} a las ${hora}.`,
      tag: `turno-confirmado-${turnoData.id}`,
    });
  }

  /**
   * Obtener estado actual de permisos
   */
  getPermissionStatus() {
    return this.permission;
  }
}

// Exportar instancia única
const pushNotifications = new PushNotificationService();
export default pushNotifications;
