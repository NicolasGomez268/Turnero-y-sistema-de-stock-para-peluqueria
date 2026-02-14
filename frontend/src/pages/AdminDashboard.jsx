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
    </div>
  );
};

export default AdminDashboard;
