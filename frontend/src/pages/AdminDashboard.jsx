import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TurnoAdminCard from '../components/TurnoAdminCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [turnos, setTurnos] = useState([]);
  const [metricas, setMetricas] = useState({
    gananciasSemanal: 0,
    turnosHoy: 0,
    proximoCliente: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [modalNuevoTurno, setModalNuevoTurno] = useState(false);

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
    const hoy = new Date().toISOString().split('T')[0];
    const turnosHoy = turnosData.filter(t => t.fecha === hoy);
    
    // Ganancia semanal (últimos 7 días)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    
    api.getTurnosSemanales().then(turnosSemanales => {
      const ganancia = turnosSemanales
        .filter(t => t.estado === 'REALIZADO')
        .reduce((sum, t) => sum + (parseFloat(t.servicio_precio) || 0), 0);
      
      setMetricas(prev => ({ ...prev, gananciasSemanal: ganancia }));
    });

    // Turnos de hoy
    setMetricas(prev => ({ ...prev, turnosHoy: turnosHoy.length }));

    // Próximo cliente
    const ahora = new Date();
    const horaActual = ahora.toTimeString().split(':').slice(0, 2).join(':');
    
    const proximoTurno = turnosHoy
      .filter(t => t.estado === 'PENDIENTE' && t.hora >= horaActual)
      .sort((a, b) => a.hora.localeCompare(b.hora))[0];

    setMetricas(prev => ({ 
      ...prev, 
      proximoCliente: proximoTurno 
        ? { hora: proximoTurno.hora, nombre: proximoTurno.cliente_nombre }
        : null 
    }));
  };

  const handleMarcarAsistio = async (turnoId) => {
    if (!confirm('¿Confirmar que el cliente asistió?')) return;

    setActionLoading(true);
    try {
      await api.marcarTurnoRealizado(turnoId);
      await cargarDatos();
    } catch (err) {
      alert('Error al marcar turno: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = async (turnoId) => {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;

    setActionLoading(true);
    try {
      await api.cancelarTurno(turnoId);
      await cargarDatos();
    } catch (err) {
      alert('Error al cancelar turno: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-tincho-dark">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-tincho-gold">TINCHO</h1>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">Panel Admin</span>
            </div>

            {/* Usuario y acciones */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">
                👤 {user?.username}
              </span>
              
              <button
                onClick={() => navigate('/admin-stock')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                         rounded-lg transition-all duration-200"
              >
                📦 Stock
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 
                         rounded-lg transition-all duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Ganancia Semanal */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 
                        shadow-lg border border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-semibold mb-1">
                  Ganancia Semanal
                </p>
                <p className="text-3xl font-bold text-white">
                  ${metricas.gananciasSemanal.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="text-5xl opacity-20">💰</div>
            </div>
          </div>

          {/* Turnos de Hoy */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 
                        shadow-lg border border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold mb-1">
                  Turnos de Hoy
                </p>
                <p className="text-3xl font-bold text-white">
                  {metricas.turnosHoy}
                </p>
              </div>
              <div className="text-5xl opacity-20">📅</div>
            </div>
          </div>

          {/* Próximo Cliente */}
          <div className="bg-gradient-to-br from-tincho-gold to-yellow-600 rounded-lg p-6 
                        shadow-lg border border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-900 text-sm font-semibold mb-1">
                  Próximo Cliente
                </p>
                {metricas.proximoCliente ? (
                  <>
                    <p className="text-2xl font-bold text-yellow-900">
                      {metricas.proximoCliente.hora}
                    </p>
                    <p className="text-sm text-yellow-800 truncate">
                      {metricas.proximoCliente.nombre}
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-yellow-900">
                    Sin turnos pendientes
                  </p>
                )}
              </div>
              <div className="text-5xl opacity-20">⏰</div>
            </div>
          </div>
        </div>

        {/* Selector de Fecha */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-tincho-gold">
            Agenda del Día
          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setModalNuevoTurno(true)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white 
                       font-bold rounded-lg transition-all duration-200 
                       flex items-center gap-2 shadow-lg"
            >
              ➕ Nueva Reserva
            </button>
            
            <label className="text-gray-400">Fecha:</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                       text-gray-200 focus:outline-none focus:border-tincho-gold
                       focus:ring-2 focus:ring-tincho-gold/50"
            />
            
            <button
              onClick={cargarDatos}
              className="px-4 py-2 bg-tincho-gold text-tincho-dark font-bold 
                       rounded-lg hover:bg-yellow-500 transition-all duration-200"
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
            <div className="text-tincho-gold text-xl">Cargando turnos...</div>
          </div>
        ) : turnos.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-xl">
              No hay turnos para esta fecha
            </p>
          </div>
        ) : (
          /* Lista de Turnos */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {turnos.map((turno) => (
              <TurnoAdminCard
                key={turno.id}
                turno={turno}
                onMarcarAsistio={handleMarcarAsistio}
                onCancelar={handleCancelar}
                loading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

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
      alert('Error al cargar barberos');
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
      alert('Error al cargar servicios');
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
      
      alert('✅ Turno creado exitosamente');
      onSuccess();
    } catch (error) {
      alert('Error al crear turno: ' + (error.error || 'Error desconocido'));
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-tincho-gold">Nueva Reserva Manual</h3>
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
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {['Barbero', 'Servicio', 'Fecha/Hora', 'Cliente'].map((label, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full 
                              ${paso > index + 1 ? 'bg-green-600' : paso === index + 1 ? 'bg-tincho-gold' : 'bg-gray-700'}
                              ${paso >= index + 1 ? 'text-white' : 'text-gray-500'} font-bold`}>
                  {paso > index + 1 ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm ${paso >= index + 1 ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
                {index <3 && <div className="w-12 h-0.5 bg-gray-700 mx-4" />}
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
              <div className="grid grid-cols-2 gap-4">
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
                      <p className="text-xl font-bold text-tincho-gold">
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
                  <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
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
                    <span className="text-tincho-gold text-lg font-bold">
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
              className="px-6 py-2 bg-tincho-gold hover:bg-yellow-500 text-tincho-dark 
                       font-bold rounded-lg transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!puedeAvanzar() || loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white 
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
