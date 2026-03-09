import PropTypes from 'prop-types';
import { useState } from 'react';

const METODOS_PAGO = [
  { value: 'EFECTIVO',      label: 'Efectivo',     icon: '💵', color: 'border-green-500 hover:bg-green-500/20 text-green-400' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: '📲', color: 'border-blue-500 hover:bg-blue-500/20 text-blue-400' },
  { value: 'TARJETA',       label: 'Tarjeta',       icon: '💳', color: 'border-purple-500 hover:bg-purple-500/20 text-purple-400' },
];

const TurnoAdminCard = ({ turno, onMarcarAsistio, onCancelar, onEditar, onEliminar, loading }) => {
  const [seleccionandoPago, setSeleccionandoPago] = useState(false);
  const [mostrandoAcciones, setMostrandoAcciones] = useState(false);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':  return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'REALIZADO':  return 'bg-green-500/20 text-green-400 border-green-500';
      case 'CANCELADO':  return 'bg-red-500/20 text-red-400 border-red-500';
      default:           return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const isPendiente = turno.estado === 'PENDIENTE';

  // Bloquear si el turno todavía no llegó
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaTurno = new Date(turno.fecha + 'T00:00:00');
  const esFuturo = fechaTurno > hoy;

  const handleConfirmarPago = (metodo) => {
    setSeleccionandoPago(false);
    onMarcarAsistio(turno.id, metodo);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-tincho-gold 
                    transition-all duration-200">
      {/* Header con hora y estado */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-2xl font-bold text-white">
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
      {mostrandoAcciones ? (
        // Menú de "Más opciones" - disponible para TODOS los estados
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMostrandoAcciones(false);
                onEditar(turno);
              }}
              disabled={loading}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 
                       text-white font-semibold rounded-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 text-sm"
            >
              <span>✏️</span>
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                setMostrandoAcciones(false);
                onEliminar(turno.id);
              }}
              disabled={loading}
              className="flex-1 py-2 px-3 bg-red-700 hover:bg-red-800 
                       text-white font-semibold rounded-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 text-sm"
            >
              <span>🗑️</span>
              <span>Eliminar</span>
            </button>
          </div>
          <button
            onClick={() => setMostrandoAcciones(false)}
            className="w-full py-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            ← Volver
          </button>
        </div>
      ) : isPendiente ? (
        // Botones para turnos PENDIENTES
        seleccionandoPago ? (
          <div>
            <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wide">
              ¿Método de pago?
            </p>
            <div className="flex flex-col gap-1.5 mb-2">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleConfirmarPago(m.value)}
                  disabled={loading}
                  className={`w-full py-1.5 px-3 rounded-lg border bg-transparent font-semibold text-sm
                              transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                              flex items-center gap-2 ${m.color}`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSeleccionandoPago(false)}
              className="w-full py-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              ← Volver
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {esFuturo && (
              <div className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-center">
                Turno futuro — confirmá asistencia el día del turno
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setSeleccionandoPago(true)}
                disabled={loading || esFuturo}
                className="flex-1 py-2 px-4 bg-oro-base hover:bg-oro-brillo 
                         text-tincho-dark font-bold rounded-lg transition-all duration-200
                         disabled:opacity-30 disabled:cursor-not-allowed
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
            
            {/* Botón de más opciones */}
            <button
              onClick={() => setMostrandoAcciones(true)}
              disabled={loading}
              className="w-full py-1.5 text-gray-400 hover:text-gray-200 text-xs 
                       transition-colors border border-gray-700 hover:border-gray-500 
                       rounded-lg disabled:opacity-50"
            >
              ⚙️ Más opciones
            </button>
          </div>
        )
      ) : (
        // Botones para turnos CANCELADOS o REALIZADOS - solo Editar/Eliminar
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setMostrandoAcciones(true)}
            disabled={loading}
            className="w-full py-2 text-gray-400 hover:text-gray-200 text-sm 
                     transition-colors border border-gray-700 hover:border-gray-500 
                     rounded-lg disabled:opacity-50 font-medium"
          >
            ⚙️ Editar / Eliminar
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
