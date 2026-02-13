import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * BookingWizard - Componente de reserva de turnos en 4 pasos
 * 
 * PASO 1: Selección de fecha
 * PASO 2: Selección de barbero
 * PASO 3: Selección de horario disponible
 * PASO 4: Datos del cliente y confirmación
 */
const BookingWizard = () => {
  // Estado del paso actual (1-4)
  const [paso, setPaso] = useState(1);
  
  // Datos de la reserva
  const [reserva, setReserva] = useState({
    fecha: '',
    barberoId: null,
    barberoNombre: '',
    horario: '',
    clienteNombre: '',
    clienteTelefono: '',
  });

  // Datos cargados desde la API
  const [barberos, setBarberos] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  
  // Estados de carga y error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // **PASO 2**: Cargar barberos cuando llega a ese paso
  useEffect(() => {
    if (paso === 2) {
      cargarBarberos();
    }
  }, [paso]);

  // **PASO 3**: Cargar horarios disponibles cuando selecciona barbero
  useEffect(() => {
    if (paso === 3 && reserva.fecha && reserva.barberoId) {
      cargarDisponibilidad();
    }
  }, [paso, reserva.fecha, reserva.barberoId]);

  /**
   * Cargar barberos activos desde la API
   */
  const cargarBarberos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBarberos();
      setBarberos(data);
    } catch (err) {
      setError('Error al cargar los barberos. Por favor, intenta nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar horarios disponibles desde la API
   */
  const cargarDisponibilidad = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDisponibilidad(reserva.fecha, reserva.barberoId);
      
      // La API devuelve un array de objetos {hora, disponible}
      if (data.horarios && data.horarios.length > 0) {
        // Filtrar solo los horarios disponibles y extraer las horas
        const horariosLibres = data.horarios
          .filter(slot => slot.disponible)
          .map(slot => slot.hora.substring(0, 5)); // "09:00:00" -> "09:00"
        
        if (horariosLibres.length > 0) {
          setHorariosDisponibles(horariosLibres);
        } else {
          setHorariosDisponibles([]);
          setError('No hay horarios disponibles para esta fecha y barbero.');
        }
      } else {
        setHorariosDisponibles([]);
        setError('No hay horarios disponibles para esta fecha y barbero.');
      }
    } catch (err) {
      setError('Error al cargar los horarios disponibles.');
      console.error(err);
      setHorariosDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirmar y enviar la reserva
   */
  const confirmarReserva = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Crear payload limpio con los datos correctos
      // Obtener ID de servicio desde variable de entorno (o usar 11 como fallback)
      const servicioId = import.meta.env.VITE_DEFAULT_SERVICE_ID || 11;
      
      const payload = {
        fecha: reserva.fecha, // 'YYYY-MM-DD'
        hora: reserva.horario + ':00', // Convertir 'HH:MM' a 'HH:MM:SS'
        barbero: reserva.barberoId, // Solo el ID numérico
        servicio: parseInt(servicioId), // ID del servicio desde env
        cliente_nombre: reserva.clienteNombre,
        cliente_telefono: reserva.clienteTelefono,
        notas: ''
      };

      console.log('Payload enviado:', payload);

      await api.reservarTurno(payload);
      setSuccess(true);
      
      // No auto-resetear, esperar a que el usuario haga click en "Hacer otra reserva"
    } catch (err) {
      const errorMsg = err.error || err.message || 'Error al confirmar la reserva';
      setError(errorMsg);
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetear wizard al estado inicial
   */
  const resetearWizard = () => {
    setPaso(1);
    setReserva({
      fecha: '',
      barberoId: null,
      barberoNombre: '',
      horario: '',
      clienteNombre: '',
      clienteTelefono: '',
    });
    setSuccess(false);
    setError(null);
  };

  /**
   * Avanzar al siguiente paso
   */
  const siguientePaso = () => {
    setError(null);
    setPaso(paso + 1);
  };

  /**
   * Volver al paso anterior
   */
  const pasoAnterior = () => {
    setError(null);
    setPaso(paso - 1);
  };

  /**
   * Validar fecha mínima (hoy)
   */
  const obtenerFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  // ==========================================
  // RENDERIZADO DE PASOS
  // ==========================================

  /**
   * PASO 1: Selección de Fecha
   */
  const renderPaso1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-tincho-gold mb-2">
          Selecciona una Fecha
        </h2>
        <p className="text-gray-400">Paso 1 de 4</p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-lg font-semibold text-gray-200 mb-2 block">
            ¿Cuándo querés tu turno?
          </span>
          <input
            type="date"
            min={obtenerFechaMinima()}
            value={reserva.fecha}
            onChange={(e) => setReserva({ ...reserva, fecha: e.target.value })}
            className="w-full px-4 py-4 bg-gray-800 border border-gray-600 rounded-lg 
                       text-white text-lg focus:border-tincho-gold focus:ring-2 
                       focus:ring-tincho-gold focus:outline-none transition-all"
          />
        </label>
      </div>

      <button
        onClick={siguientePaso}
        disabled={!reserva.fecha}
        className="btn-primary w-full py-4 text-lg disabled:opacity-50 
                   disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Continuar →
      </button>
    </div>
  );

  /**
   * PASO 2: Selección de Barbero
   */
  const renderPaso2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-tincho-gold mb-2">
          Elegí tu Barbero
        </h2>
        <p className="text-gray-400">Paso 2 de 4</p>
        <p className="text-sm text-gray-500 mt-2">
          Fecha seleccionada: <span className="text-tincho-gold font-semibold">
            {new Date(reserva.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-tincho-gold 
                          border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400">Cargando barberos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {barberos.map((barbero) => (
            <button
              key={barbero.id}
              onClick={() => {
                setReserva({
                  ...reserva,
                  barberoId: barbero.id,
                  barberoNombre: barbero.nombre
                });
                siguientePaso();
              }}
              className="card p-6 hover:border-tincho-gold hover:scale-105 transform 
                         transition-all duration-300 text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                {/* Avatar círculo con iniciales */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tincho-gold 
                                to-yellow-600 flex items-center justify-center text-2xl 
                                font-bold text-tincho-dark">
                  {barbero.nombre.charAt(0)}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-tincho-gold 
                                 transition-colors">
                    {barbero.nombre}
                  </h3>
                  {barbero.especialidad && (
                    <p className="text-sm text-gray-400 mt-1">
                      {barbero.especialidad}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    📞 {barbero.telefono}
                  </p>
                </div>

                <div className="text-tincho-gold text-2xl group-hover:translate-x-2 
                                transition-transform">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={pasoAnterior}
        className="btn-secondary w-full py-3"
      >
        ← Volver
      </button>
    </div>
  );

  /**
   * PASO 3: Selección de Horario
   */
  const renderPaso3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-tincho-gold mb-2">
          Elegí el Horario
        </h2>
        <p className="text-gray-400">Paso 3 de 4</p>
        <div className="text-sm text-gray-500 mt-2 space-y-1">
          <p>Fecha: <span className="text-white font-semibold">{reserva.fecha}</span></p>
          <p>Barbero: <span className="text-white font-semibold">{reserva.barberoNombre}</span></p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-tincho-gold 
                          border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-400">Cargando horarios disponibles...</p>
        </div>
      ) : horariosDisponibles.length > 0 ? (
        <div>
          <p className="text-center text-gray-400 mb-6">
            ✅ {horariosDisponibles.length} horarios disponibles
          </p>
          
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {horariosDisponibles.map((horario) => (
              <button
                key={horario}
                onClick={() => {
                  setReserva({ ...reserva, horario });
                  siguientePaso();
                }}
                className="px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg 
                           text-white font-semibold hover:border-tincho-gold 
                           hover:bg-gray-700 hover:scale-110 transform transition-all 
                           duration-200 active:scale-95"
              >
                {horario}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 card">
          <p className="text-xl text-gray-400">😔 No hay horarios disponibles</p>
          <p className="text-sm text-gray-500 mt-2">
            Intenta con otro barbero o fecha
          </p>
        </div>
      )}

      <button
        onClick={pasoAnterior}
        className="btn-secondary w-full py-3"
      >
        ← Volver
      </button>
    </div>
  );

  /**
   * PASO 4: Confirmación y Datos del Cliente
   */
  const renderPaso4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-tincho-gold mb-2">
          Confirmá tus Datos
        </h2>
        <p className="text-gray-400">Paso 4 de 4</p>
      </div>

      {/* Resumen de la reserva */}
      <div className="card bg-gray-900 border-tincho-gold">
        <h3 className="text-xl font-bold text-tincho-gold mb-4">
          📋 Resumen de tu Turno
        </h3>
        <div className="space-y-3 text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-400">Fecha:</span>
            <span className="font-semibold text-white">{reserva.fecha}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Horario:</span>
            <span className="font-semibold text-white">{reserva.horario}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Barbero:</span>
            <span className="font-semibold text-white">{reserva.barberoNombre}</span>
          </div>
        </div>
      </div>

      {/* Formulario de datos del cliente */}
      <div className="space-y-4">
        <label className="block">
          <span className="text-lg font-semibold text-gray-200 mb-2 block">
            Tu Nombre <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={reserva.clienteNombre}
            onChange={(e) => setReserva({ ...reserva, clienteNombre: e.target.value })}
            placeholder="Nombre y Apellido"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                       text-white focus:border-tincho-gold focus:ring-2 
                       focus:ring-tincho-gold focus:outline-none transition-all"
          />
        </label>

        <label className="block">
          <span className="text-lg font-semibold text-gray-200 mb-2 block">
            Teléfono <span className="text-red-500">*</span>
          </span>
          <input
            type="tel"
            value={reserva.clienteTelefono}
            onChange={(e) => setReserva({ ...reserva, clienteTelefono: e.target.value })}
            placeholder="Ej: 11 2345-6789"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                       text-white focus:border-tincho-gold focus:ring-2 
                       focus:ring-tincho-gold focus:outline-none transition-all"
          />
        </label>
      </div>

      {/* Botones */}
      <div className="space-y-3">
        <button
          onClick={confirmarReserva}
          disabled={!reserva.clienteNombre || !reserva.clienteTelefono || loading}
          className="btn-primary w-full py-4 text-lg font-bold disabled:opacity-50 
                     disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? '⏳ Confirmando...' : '✅ Confirmar Reserva'}
        </button>

        <button
          onClick={pasoAnterior}
          disabled={loading}
          className="btn-secondary w-full py-3"
        >
          ← Volver
        </button>
      </div>
    </div>
  );

  /**
   * Pantalla de éxito
   */
  const renderSuccess = () => (
    <div className="text-center py-12 space-y-6">
      <div className="text-8xl">🎉</div>
      <h2 className="text-4xl font-bold text-tincho-gold">
        ¡Reserva Confirmada!
      </h2>
      <p className="text-xl text-gray-300">
        Tu turno ha sido reservado exitosamente
      </p>
      
      <div className="card bg-gray-900 border-tincho-gold max-w-md mx-auto">
        <div className="space-y-2 text-left">
          <p className="text-gray-400">📅 Fecha: <span className="text-white font-semibold">{reserva.fecha}</span></p>
          <p className="text-gray-400">🕐 Hora: <span className="text-white font-semibold">{reserva.horario}</span></p>
          <p className="text-gray-400">✂️ Barbero: <span className="text-white font-semibold">{reserva.barberoNombre}</span></p>
          <p className="text-gray-400">👤 Cliente: <span className="text-white font-semibold">{reserva.clienteNombre}</span></p>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Te enviaremos un recordatorio por WhatsApp
      </p>

      <button
        onClick={resetearWizard}
        className="btn-primary"
      >
        Hacer otra reserva
      </button>
    </div>
  );

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="card">
          {/* Mensaje de error global */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg 
                          text-red-200 flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Mostrar pantalla según estado */}
          {success ? renderSuccess() : (
            <>
              {paso === 1 && renderPaso1()}
              {paso === 2 && renderPaso2()}
              {paso === 3 && renderPaso3()}
              {paso === 4 && renderPaso4()}
            </>
          )}
        </div>

        {/* Indicador de progreso */}
        {!success && (
          <div className="mt-8">
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`h-2 w-12 rounded-full transition-all duration-300 ${
                    num <= paso ? 'bg-tincho-gold' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;
