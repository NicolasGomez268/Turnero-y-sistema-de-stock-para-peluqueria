import PropTypes from 'prop-types';

const TurnoAdminCard = ({ turno, onMarcarAsistio, onCancelar, loading }) => {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'REALIZADO':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'CANCELADO':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const isPendiente = turno.estado === 'PENDIENTE';

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-tincho-gold 
                    transition-all duration-200">
      {/* Header con hora y estado */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-2xl font-bold text-tincho-gold">
          {turno.hora}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoColor(turno.estado)}`}>
          {turno.estado}
        </span>
      </div>

      {/* Info del turno */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-300">
          <span className="text-gray-500 mr-2">👤</span>
          <span className="font-semibold">{turno.cliente_nombre}</span>
        </div>
        
        <div className="flex items-center text-gray-300">
          <span className="text-gray-500 mr-2">✂️</span>
          <span>{turno.barbero_nombre}</span>
        </div>

        <div className="flex items-center text-gray-300">
          <span className="text-gray-500 mr-2">📋</span>
          <span>{turno.servicio_nombre}</span>
        </div>

        {turno.cliente_telefono && (
          <div className="flex items-center text-gray-300">
            <span className="text-gray-500 mr-2">📞</span>
            <span className="text-sm">{turno.cliente_telefono}</span>
          </div>
        )}

        {turno.notas && (
          <div className="flex items-start text-gray-400 text-sm mt-2">
            <span className="text-gray-500 mr-2">📝</span>
            <span className="italic">{turno.notas}</span>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      {isPendiente && (
        <div className="flex gap-2">
          <button
            onClick={() => onMarcarAsistio(turno.id)}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 
                     text-white font-bold rounded-lg transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            <span>✓</span>
            <span>Asistió</span>
          </button>

          <button
            onClick={() => onCancelar(turno.id)}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 
                     text-white font-bold rounded-lg transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            <span>✕</span>
            <span>Cancelar</span>
          </button>
        </div>
      )}
    </div>
  );
};

TurnoAdminCard.propTypes = {
  turno: PropTypes.shape({
    id: PropTypes.number.isRequired,
    fecha: PropTypes.string.isRequired,
    hora: PropTypes.string.isRequired,
    cliente_nombre: PropTypes.string.isRequired,
    cliente_telefono: PropTypes.string,
    barbero_nombre: PropTypes.string.isRequired,
    servicio_nombre: PropTypes.string.isRequired,
    estado: PropTypes.string.isRequired,
    notas: PropTypes.string,
  }).isRequired,
  onMarcarAsistio: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default TurnoAdminCard;
