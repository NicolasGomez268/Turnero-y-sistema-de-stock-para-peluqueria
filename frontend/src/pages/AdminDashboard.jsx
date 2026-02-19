import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import TurnoAdminCard from '../components/TurnoAdminCard';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import pushNotifications from '../services/pushNotifications';

const TURNOS_POR_PAGINA = 10;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notification = useNotification();
  
  const [turnos, setTurnos] = useState([]);
  const [metricas, setMetricas] = useState({
    turnosHoy: 0,
    proximoCliente: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // TODOS, PENDIENTE, REALIZADO
  const [modalNuevoTurno, setModalNuevoTurno] = useState(false);
  const [paginaTurnos, setPaginaTurnos] = useState(1);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [fechaSeleccionada]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar turnos del día
      const turnosData = await api.getTurnosPorFecha(fechaSeleccionada);
      setTurnos(turnosData);

      // Calcular métricas
      calcularMetricas(turnosData);
    } catch (err) {
      setError('Error al cargar los datos: ' + (err.message || 'Error desconocido'));
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calcularMetricas = (turnosData) => {
    // Usar la fecha seleccionada en lugar de siempre "hoy"
    const turnosDia = turnosData.filter(t => t.fecha === fechaSeleccionada);
    
    // Turnos del día seleccionado
    setMetricas(prev => ({ ...prev, turnosHoy: turnosDia.length }));

    // Próximo cliente (solo si es hoy o futuro)
    const hoy = new Date().toISOString().split('T')[0];
    const ahora = new Date();
    const horaActual = ahora.toTimeString().split(':').slice(0, 2).join(':');
    
    let proximoTurno = null;
    
    // Si la fecha seleccionada es hoy, buscar próximo turno pendiente
    if (fechaSeleccionada === hoy) {
      proximoTurno = turnosDia
        .filter(t => t.estado === 'PENDIENTE' && t.hora >= horaActual)
        .sort((a, b) => a.hora.localeCompare(b.hora))[0];
    } 
    // Si es una fecha futura, mostrar el primer turno pendiente del día
    else if (fechaSeleccionada > hoy) {
      proximoTurno = turnosDia
        .filter(t => t.estado === 'PENDIENTE')
        .sort((a, b) => a.hora.localeCompare(b.hora))[0];
    }

    setMetricas(prev => ({ 
      ...prev, 
      proximoCliente: proximoTurno 
        ? { hora: proximoTurno.hora, nombre: proximoTurno.cliente_nombre }
        : null 
    }));
  };

  const handleMarcarAsistio = async (turnoId, metodoPago) => {
    setActionLoading(true);
    try {
      await api.marcarTurnoRealizado(turnoId, metodoPago);
      await cargarDatos();
      notification.success('✅ Turno marcado como realizado');
    } catch (err) {
      notification.error('Error al marcar turno: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = async (turnoId) => {
    // Encontrar el turno para obtener datos del cliente
    const turno = turnos.find(t => t.id === turnoId);
    
    const confirmed = await notification.confirm('¿Estás seguro de cancelar este turno?');
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await api.cancelarTurno(turnoId);
      await cargarDatos();
      notification.success('Turno cancelado correctamente');
      
      // Intentar enviar notificación push (si el cliente dio permiso)
      if (pushNotifications.getPermissionStatus() === 'granted') {
        await pushNotifications.notificarCancelacion({
          id: turno.id,
          cliente_nombre: turno.cliente_nombre,
          fecha: formatearFecha(turno.fecha),
          hora: turno.hora,
          barbero_nombre: turno.barbero_nombre
        });
      }
      
      // Si el turno tiene teléfono, preguntar si quiere avisar por WhatsApp
      if (turno?.cliente_telefono) {
        setTimeout(async () => {
          const avisarWhatsApp = await notification.confirm(
            `¿Deseas avisar a ${turno.cliente_nombre} por WhatsApp?`,
            'Notificar cancelación'
          );
          
          if (avisarWhatsApp) {
            // Formatear teléfono (quitar espacios, guiones, etc)
            const telefono = turno.cliente_telefono.replace(/\D/g, '');
            
            // Mensaje pre-escrito
            const mensaje = encodeURIComponent(
              `Hola ${turno.cliente_nombre}! Lamentamos informarte que tu turno del ${formatearFecha(turno.fecha)} a las ${turno.hora} con ${turno.barbero_nombre} ha sido cancelado. Por favor contactanos para reagendar. Disculpa las molestias.`
            );
            
            // Abrir WhatsApp
            window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
          }
        }, 500);
      }
    } catch (err) {
      notification.error('Error al cancelar turno: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Función auxiliar para formatear fecha
  const formatearFecha = (fecha) => {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleLogout = async () => {
    const confirmed = await notification.confirm('¿Deseas cerrar sesión?', 'Confirmar cierre de sesión');
    if (confirmed) {
      logout();
      notification.info('Sesión cerrada correctamente');
      navigate('/');
    }
  };

  // Helper para obtener el label de la fecha seleccionada
  const obtenerLabelFecha = () => {
    const hoy = new Date().toISOString().split('T')[0];
    if (fechaSeleccionada === hoy) return 'Turnos de Hoy';
    
    const fechaSel = new Date(fechaSeleccionada + 'T00:00:00');
    const fechaHoy = new Date(hoy + 'T00:00:00');
    const diffDias = Math.round((fechaSel - fechaHoy) / (1000 * 60 * 60 * 24));
    
    if (diffDias === 1) return 'Turnos de Mañana';
    if (diffDias === -1) return 'Turnos de Ayer';
    if (diffDias > 1) return `Turnos del ${fechaSeleccionada}`;
    if (diffDias < -1) return `Turnos del ${fechaSeleccionada}`;
    return 'Turnos del Día';
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Turnos del Día */}
          <div className="bg-gray-800 border-l-4 border-blue-500 rounded-lg p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-semibold mb-1">
                  {obtenerLabelFecha()}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {metricas.turnosHoy}
                </p>
              </div>
              <div className="text-4xl sm:text-5xl opacity-20">📅</div>
            </div>
          </div>

          {/* Próximo Cliente */}
          <div className="admin-metric-gold rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-black text-sm font-semibold mb-1">
                  Próximo Cliente
                </p>
                {metricas.proximoCliente ? (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {metricas.proximoCliente.hora}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {metricas.proximoCliente.nombre}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Sin turnos pendientes
                  </p>
                )}
              </div>
              <div className="text-4xl text-gray-300">⏰</div>
            </div>
          </div>
        </div>

        {/* Selector de Fecha */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Agenda del Día
          </h2>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setModalNuevoTurno(true)}
              className="px-4 sm:px-6 py-2 bg-oro-base hover:bg-oro-brillo text-tincho-dark
                       font-bold rounded-lg transition-all duration-200 
                       flex items-center gap-2 shadow-lg"
            >
              ➕ Nueva Reserva
            </button>
            
            <label className="text-gray-400 text-sm">Estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value); setPaginaTurnos(1); }}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                       text-gray-200 cursor-pointer text-sm focus:outline-none
                       focus:border-tincho-gold focus:ring-2 focus:ring-tincho-gold/50"
            >
              <option value="TODOS" className="bg-gray-800 text-gray-200">Todos</option>
              <option value="PENDIENTE" className="bg-gray-800 text-gray-200">Pendientes</option>
              <option value="REALIZADO" className="bg-gray-800 text-gray-200">Realizados</option>
              <option value="CANCELADO" className="bg-gray-800 text-gray-200">Cancelados</option>
            </select>
            
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                       text-gray-200 focus:outline-none focus:border-tincho-gold
                       focus:ring-2 focus:ring-tincho-gold/50 text-sm"
            />
            
            <button
              onClick={cargarDatos}
              className="px-3 py-2 bg-oro-base text-tincho-dark font-bold 
                       rounded-lg hover:bg-oro-brillo transition-all duration-200 text-sm"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500 text-red-400 
                        px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">Cargando turnos...</div>
          </div>
        ) : turnos.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-xl">
              No hay turnos para esta fecha
            </p>
          </div>
        ) : (
          /* Lista de Turnos */
          (() => {
            const turnosFiltrados = filtroEstado === 'TODOS'
              ? turnos
              : turnos.filter(t => t.estado === filtroEstado);

            const turnosPaginados = turnosFiltrados.slice(
              (paginaTurnos - 1) * TURNOS_POR_PAGINA,
              paginaTurnos * TURNOS_POR_PAGINA,
            );

            return turnosFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-xl">
                  No hay turnos {filtroEstado.toLowerCase()}s para esta fecha
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {turnosPaginados.map((turno) => (
                    <TurnoAdminCard
                      key={turno.id}
                      turno={turno}
                      onMarcarAsistio={handleMarcarAsistio}
                      onCancelar={handleCancelar}
                      loading={actionLoading}
                    />
                  ))}
                </div>
                <Pagination
                  paginaActual={paginaTurnos}
                  totalItems={turnosFiltrados.length}
                  itemsPorPagina={TURNOS_POR_PAGINA}
                  onCambiarPagina={setPaginaTurnos}
                />
              </div>
            );
          })()
        )}

      {/* Modal Nuevo Turno */}
      {modalNuevoTurno && (
        <NuevoTurnoModal
          onClose={() => setModalNuevoTurno(false)}
          onSuccess={() => {
            setModalNuevoTurno(false);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
};

// ===================================
// COMPONENTE: NuevoTurnoModal
// ===================================
const NuevoTurnoModal = ({ onClose, onSuccess }) => {
  const notification = useNotification();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState({
    barbero: null,
    servicio: null,
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    cliente_nombre: '',
    cliente_telefono: '',
    notas: ''
  });

  // Estados para opciones
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);

  // Cargar barberos al abrir
  useEffect(() => {
    cargarBarberos();
  }, []);

  const cargarBarberos = async () => {
    try {
      const data = await api.getBarberos();
      setBarberos(data.filter(b => b.is_active));
    } catch (error) {
      notification.error('Error al cargar barberos');
    }
  };

  // Cargar servicios cuando se selecciona barbero
  useEffect(() => {
    if (datos.barbero && paso === 2) {
      cargarServicios();
    }
  }, [datos.barbero, paso]);

  const cargarServicios = async () => {
    try {
      const data = await api.getServicios();
      setServicios(data.filter(s => s.is_active));
    } catch (error) {
      notification.error('Error al cargar servicios');
    }
  };

  // Cargar slots cuando se selecciona fecha
  useEffect(() => {
    if (datos.barbero && datos.servicio && datos.fecha && paso === 3) {
      cargarSlots();
    }
  }, [datos.fecha, datos.barbero, datos.servicio, paso]);

  const cargarSlots = async () => {
    setSlotsDisponibles([]); // Reset slots antes de cargar
    try {
      console.log('Cargando slots con:', {
        fecha: datos.fecha,
        barbero_id: datos.barbero?.id,
        servicio_id: datos.servicio?.id
      });
      
      const response = await api.getDisponibilidad(
        datos.fecha,
        datos.barbero.id,
        datos.servicio.id
      );
      
      // El backend devuelve "horarios" (array de slots), no "slots_disponibles" (que es un contador)
      const slots = response?.horarios;
      console.log('Slots recibidos:', slots);
      setSlotsDisponibles(Array.isArray(slots) ? slots : []);
    } catch (error) {
      console.error('Error al cargar slots:', error);
      setSlotsDisponibles([]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.createTurnoManual({
        barbero_id: datos.barbero.id,
        servicio_id: datos.servicio.id,
        fecha: datos.fecha,
        hora: datos.hora,
        cliente_nombre: datos.cliente_nombre,
        cliente_telefono: datos.cliente_telefono,
        notas: datos.notas
      });
      
      notification.success('✅ Turno creado exitosamente');
      onSuccess();
    } catch (error) {
      notification.error('Error al crear turno: ' + (error.error || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const puedeAvanzar = () => {
    switch (paso) {
      case 1: return datos.barbero !== null;
      case 2: return datos.servicio !== null;
      case 3: return datos.hora !== '';
      case 4: return datos.cliente_nombre && datos.cliente_telefono;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 admin-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="admin-modal-gold rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-black/80 to-transparent border-b border-oro-fuerte/30 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Nueva Reserva Manual</h3>
            <p className="text-sm text-gray-400 mt-1">Para clientes walk-in sin turno previo</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {['Barbero', 'Servicio', 'Fecha/Hora', 'Cliente'].map((label, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base
                              ${paso > index + 1 ? 'bg-green-600' : paso === index + 1 ? 'bg-tincho-gold' : 'bg-gray-700'}
                              ${paso >= index + 1 ? 'text-white' : 'text-gray-500'} font-bold`}>
                  {paso > index + 1 ? '✓' : index + 1}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm hidden xs:block ${paso >= index + 1 ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
                {index < 3 && <div className="w-4 sm:w-12 h-0.5 bg-gray-700 mx-1 sm:mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 min-h-[300px]">
          {/* PASO 1: Seleccionar Barbero */}
          {paso === 1 && (
            <div>
              <h4 className="text-lg font-bold text-white mb-4">Seleccione el Barbero</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {barberos.map(barbero => (
                  <div
                    key={barbero.id}
                    onClick={() => setDatos({ ...datos, barbero })}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                              ${datos.barbero?.id === barbero.id 
                                ? 'border-tincho-gold bg-tincho-gold/10' 
                                : 'border-gray-700 hover:border-gray-600 bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      {barbero.foto ? (
                        <img src={barbero.foto} alt={barbero.nombre} 
                             className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
                          💈
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white">{barbero.nombre}</p>
                        {barbero.especialidad && (
                          <p className="text-xs text-gray-400">{barbero.especialidad}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2: Seleccionar Servicio */}
          {paso === 2 && (
            <div>
              <h4 className="text-lg font-bold text-white mb-4">Seleccione el Servicio</h4>
              <div className="space-y-3">
                {servicios.map(servicio => (
                  <div
                    key={servicio.id}
                    onClick={() => setDatos({ ...datos, servicio })}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                              ${datos.servicio?.id === servicio.id 
                                ? 'border-tincho-gold bg-tincho-gold/10' 
                                : 'border-gray-700 hover:border-gray-600 bg-gray-800'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{servicio.nombre}</p>
                        <p className="text-sm text-gray-400">{servicio.duracion_minutos} min</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        ${servicio.precio.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 3: Seleccionar Fecha y Hora */}
          {paso === 3 && (
            <div>
              <h4 className="text-lg font-bold text-white mb-4">Seleccione Fecha y Hora</h4>
              
              {/* Selector de Fecha */}
              <div className="mb-6">
                <label className="block text-gray-400 mb-2">Fecha</label>
                <input
                  type="date"
                  value={datos.fecha}
                  onChange={(e) => setDatos({ ...datos, fecha: e.target.value, hora: '' })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                           text-gray-200 focus:border-tincho-gold focus:ring-2 focus:ring-tincho-gold/50"
                />
              </div>

              {/* Slots Disponibles */}
              <div>
                <label className="block text-gray-400 mb-2">Hora disponible</label>
                {!Array.isArray(slotsDisponibles) || slotsDisponibles.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay horarios disponibles para esta fecha
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                    {slotsDisponibles.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setDatos({ ...datos, hora: slot.hora })}
                        disabled={!slot.disponible}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all
                                  ${datos.hora === slot.hora 
                                    ? 'bg-tincho-gold text-tincho-dark' 
                                    : slot.disponible
                                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                                      : 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed'}`}
                      >
                        {slot.hora ? String(slot.hora).slice(0, 5) : 'N/A'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: Datos del Cliente */}
          {paso === 4 && (
            <div>
              <h4 className="text-lg font-bold text-white mb-4">Datos del Cliente</h4>
              
              {/* Resumen */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                <h5 className="text-sm font-semibold text-gray-400 mb-3">Resumen de la Reserva</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Barbero:</span>
                    <span className="text-white font-semibold">{datos.barbero?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Servicio:</span>
                    <span className="text-white font-semibold">{datos.servicio?.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha:</span>
                    <span className="text-white font-semibold">{datos.fecha}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hora:</span>
                    <span className="text-white font-semibold">{datos.hora}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white text-lg font-bold">
                      ${datos.servicio?.precio.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario Cliente */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Nombre del Cliente *</label>
                  <input
                    type="text"
                    value={datos.cliente_nombre}
                    onChange={(e) => setDatos({ ...datos, cliente_nombre: e.target.value })}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                             text-gray-200 focus:border-tincho-gold focus:ring-2 focus:ring-tincho-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Teléfono *</label>
                  <input
                    type="tel"
                    value={datos.cliente_telefono}
                    onChange={(e) => setDatos({ ...datos, cliente_telefono: e.target.value })}
                    placeholder="+549 351 555 1234"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                             text-gray-200 focus:border-tincho-gold focus:ring-2 focus:ring-tincho-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Notas (opcional)</label>
                  <textarea
                    value={datos.notas}
                    onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
                    placeholder="Walk-in sin reserva..."
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                             text-gray-200 focus:border-tincho-gold focus:ring-2 focus:ring-tincho-gold/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex justify-between">
          <button
            onClick={() => paso === 1 ? onClose() : setPaso(paso - 1)}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 
                     rounded-lg transition-colors"
          >
            {paso === 1 ? 'Cancelar' : 'Atrás'}
          </button>

          {paso < 4 ? (
            <button
              onClick={() => setPaso(paso + 1)}
              disabled={!puedeAvanzar()}
              className="px-6 py-2 bg-oro-base hover:bg-oro-brillo text-tincho-dark 
                       font-bold rounded-lg transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!puedeAvanzar() || loading}
              className="px-6 py-2 bg-oro-base hover:bg-oro-brillo text-tincho-dark 
                       font-bold rounded-lg transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Confirmar Reserva'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
