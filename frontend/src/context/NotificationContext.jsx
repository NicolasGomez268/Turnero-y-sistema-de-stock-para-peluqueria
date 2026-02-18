import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Mostrar notificación toast
  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  // Atajos para tipos específicos
  const success = useCallback((message, duration) => showNotification(message, 'success', duration), [showNotification]);
  const error = useCallback((message, duration) => showNotification(message, 'error', duration), [showNotification]);
  const warning = useCallback((message, duration) => showNotification(message, 'warning', duration), [showNotification]);
  const info = useCallback((message, duration) => showNotification(message, 'info', duration), [showNotification]);

  // Remover notificación
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mostrar diálogo de confirmación
  const confirm = useCallback((message, title = '¿Estás seguro?') => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        title,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  const value = {
    showNotification,
    success,
    error,
    warning,
    info,
    confirm,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </NotificationContext.Provider>
  );
};

// Contenedor de notificaciones
const NotificationContainer = ({ notifications, onRemove }) => {
  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      {notifications.map(notification => (
        <NotificationToast 
          key={notification.id} 
          {...notification} 
          onClose={() => onRemove(notification.id)} 
        />
      ))}
    </div>,
    document.body
  );
};

// Toast individual
const NotificationToast = ({ message, type, onClose }) => {
  const styles = {
    success: {
      bg: 'bg-green-600',
      border: 'border-green-500',
      icon: '✅',
      shadow: 'shadow-green-900/50'
    },
    error: {
      bg: 'bg-red-600',
      border: 'border-red-500',
      icon: '❌',
      shadow: 'shadow-red-900/50'
    },
    warning: {
      bg: 'bg-oro-base',
      border: 'border-oro-brillo',
      icon: '⚠️',
      shadow: 'shadow-oro-sombra/50'
    },
    info: {
      bg: 'bg-blue-600',
      border: 'border-blue-500',
      icon: 'ℹ️',
      shadow: 'shadow-blue-900/50'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div 
      className={`${style.bg} ${style.border} ${style.shadow} border-2 rounded-lg p-4 
                 shadow-2xl backdrop-blur-sm animate-slide-in-right flex items-start gap-3
                 min-w-[300px] max-w-md`}
    >
      <span className="text-2xl shrink-0">{style.icon}</span>
      <div className="flex-1">
        <p className="text-white font-medium text-sm leading-relaxed whitespace-pre-line">
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white shrink-0 text-xl leading-none
                   transition-colors ml-2"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
};

// Diálogo de confirmación
const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-gray-900 border-2 border-gray-700 rounded-xl shadow-2xl 
                    max-w-md w-full p-6 animate-scale-in">
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-oro-base/20 border-2 border-oro-base
                        flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-white text-center mb-3">
          {title}
        </h3>

        {/* Mensaje */}
        <p className="text-gray-300 text-center mb-6 whitespace-pre-line leading-relaxed">
          {message}
        </p>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white 
                     font-semibold rounded-lg transition-all duration-200 
                     border border-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white 
                     font-semibold rounded-lg transition-all duration-200
                     border border-red-500 shadow-lg shadow-red-900/50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
