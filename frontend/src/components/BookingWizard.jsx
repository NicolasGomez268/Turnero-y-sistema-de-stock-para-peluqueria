import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * BookingWizard - Componente de reserva de turnos en 5 pasos
 * 
 * PASO 1: Selección de fecha
 * PASO 2: Selección de servicio
 * PASO 3: Selección de barbero
 * PASO 4: Selección de horario disponible
 * PASO 5: Datos del cliente y confirmación
 */
const BookingWizard = () => {
  // Estado del paso actual (1-5)
  const [paso, setPaso] = useState(1);
  
  // Datos de la reserva
  const [reserva, setReserva] = useState({
    fecha: '',
    servicioId: null,
    servicioNombre: '',
    barberoId: null,
    barberoNombre: '',
    horario: '',
    clienteNombre: '',
    clienteTelefono: '',
  });

  // Datos cargados desde la API
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  
  // Estados de carga y error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // **PASO 2**: Cargar servicios cuando llega a ese paso
  useEffect(() => {
    if (paso === 2) {
      cargarServicios();
    }
  }, [paso]);

  // **PASO 3**: Cargar barberos cuando llega a ese paso
  useEffect(() => {
    if (paso === 3) {
      cargarBarberos();
    }
  }, [paso]);

  // **PASO 4**: Cargar horarios disponibles cuando selecciona barbero y servicio
  useEffect(() => {
    if (paso === 4 && reserva.fecha && reserva.barberoId && reserva.servicioId) {
      cargarDisponibilidad();
    }
  }, [paso, reserva.fecha, reserva.barberoId, reserva.servicioId]);

  /**
   * Cargar servicios activos desde la API
   */
  const cargarServicios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getServicios();
      setServicios(data.filter(servicio => servicio.is_active));
    } catch (err) {
      setError('Error al cargar los servicios. Por favor, intenta nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      const data = await api.getDisponibilidad(reserva.fecha, reserva.barberoId, reserva.servicioId);
      
      // La API devuelve un array de objetos {hora, disponible}
      if (data.horarios && data.horarios.length > 0) {
        // Filtrar solo los horarios disponibles y mantener el formato completo
        const horariosLibres = data.horarios
          .filter(slot => slot.disponible)
          .map(slot => slot.hora); // Mantener formato "HH:MM:SS"
        
        if (horariosLibres.length > 0) {
          setHorariosDisponibles(horariosLibres);
        } else {
          setHorariosDisponibles([]);
          setError('No hay horarios disponibles para esta fecha, barbero y servicio.');
        }
      } else {
        setHorariosDisponibles([]);
        setError('No hay horarios disponibles para esta fecha, barbero y servicio.');
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
      const payload = {
        fecha: reserva.fecha, // 'YYYY-MM-DD'
        hora: reserva.horario, // Ya viene en formato 'HH:MM:SS' desde la API
        barbero: reserva.barberoId, // Solo el ID numérico
        servicio: reserva.servicioId, // ID del servicio seleccionado
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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          Selecciona una Fecha
        </h2>
        <p className="text-sm text-gray-400">Paso 1 de 5</p>
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-medium text-gray-300 mb-2 block">
            Fecha del turno
          </span>
          <input
            type="date"
            min={obtenerFechaMinima()}
            value={reserva.fecha}
            onChange={(e) => setReserva({ ...reserva, fecha: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg 
                       text-white focus:border-oro-brillo focus:ring-1 
                       focus:ring-oro-brillo focus:outline-none transition-all"
          />
        </label>
      </div>

      <button
        onClick={siguientePaso}
        disabled={!reserva.fecha}
        className="w-full py-3 text-base font-medium rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-oro-base hover:bg-oro-brillo text-black font-bold
                   transition-all duration-200 shadow-sm"
      >
        Continuar
      </button>
    </div>
  );

  /**
   * PASO 2: Selección de Servicio
   */
  const renderPaso2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          Elegí tu Servicio
        </h2>
        <p className="text-sm text-gray-400">Paso 2 de 5</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 
                          border-t-oro-brillo mx-auto"></div>
          <p className="mt-4 text-sm text-gray-400">Cargando servicios...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {servicios.map((servicio) => (
            <button
              key={servicio.id}
              onClick={() => {
                setReserva({
                  ...reserva,
                  servicioId: servicio.id,
                  servicioNombre: servicio.nombre
                });
                siguientePaso();
              }}
              className="bg-gray-900 border border-gray-700 hover:border-oro-brillo p-5 
                         transition-all duration-200 text-left cursor-pointer w-full rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">
                    {servicio.nombre}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {servicio.descripcion}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {servicio.duracion_minutos} min
                  </p>
                </div>

                <div className="text-right ml-4">
                  <p className="text-lg font-semibold text-oro-brillo">
                    ${servicio.precio?.toLocaleString()}
                  </p>
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
   * PASO 3: Selección de Barbero
   */
  const renderPaso3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          Elegí tu Barbero
        </h2>
        <p className="text-sm text-gray-400">Paso 3 de 5</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 
                          border-t-oro-brillo mx-auto"></div>
          <p className="mt-4 text-sm text-gray-400">Cargando barberos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
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
              className="bg-gray-900 border border-gray-700 hover:border-oro-brillo p-5 
                         transition-all duration-200 text-left cursor-pointer rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg 
                                font-semibold text-oro-brillo">
                  {barbero.nombre.charAt(0)}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">
                    {barbero.nombre}
                  </h3>
                  {barbero.especialidad && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {barbero.especialidad}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={pasoAnterior}
        className="w-full py-3 text-base font-medium rounded-lg
                   bg-gray-800 hover:bg-gray-700 text-white
                   transition-all duration-200 border border-gray-700"
      >
        Volver
      </button>
    </div>
  );

  /**
   * PASO 4: Selección de Horario
   */
  const renderPaso4 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          Elegí el Horario
        </h2>
        <p className="text-sm text-gray-400">Paso 4 de 5</p>
        <div className="text-sm text-gray-400 mt-3 space-y-1">
          <p>Fecha: <span className="text-white font-semibold">{reserva.fecha}</span></p>
          <p>Servicio: <span className="text-white font-semibold">{reserva.servicioNombre}</span></p>
          <p>Barbero: <span className="text-white font-semibold">{reserva.barberoNombre}</span></p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 
                          border-t-oro-brillo mx-auto"></div>
          <p className="mt-4 text-sm text-gray-400">Cargando horarios disponibles...</p>
        </div>
      ) : horariosDisponibles.length > 0 ? (
        <div>
          <p className="text-center text-sm text-gray-400 mb-6">
            {horariosDisponibles.length} horarios disponibles
          </p>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {horariosDisponibles.map((horario) => (
              <button
                key={horario}
                onClick={() => {
                  setReserva({ ...reserva, horario });
                  siguientePaso();
                }}
                className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg 
                           text-white text-sm font-medium hover:border-oro-brillo 
                           hover:bg-gray-800 transition-all duration-200"
              >
                {horario.substring(0, 5)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-base text-gray-400">No hay horarios disponibles</p>
          <p className="text-sm text-gray-500 mt-2">
            Intenta con otro barbero o fecha
          </p>
        </div>
      )}

      <button
        onClick={pasoAnterior}
        className="w-full py-3 text-base font-medium rounded-lg
                   bg-gray-800 hover:bg-gray-700 text-white
                   transition-all duration-200 border border-gray-700"
      >
        Volver
      </button>
    </div>
  );

  /**
   * PASO 5: Confirmación y Datos del Cliente
   */
  const renderPaso5 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          Confirmá tus Datos
        </h2>
        <p className="text-sm text-gray-400">Paso 5 de 5</p>
      </div>

      {/* Resumen de la reserva */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <h3 className="text-base font-semibold text-white mb-4">
          Resumen del turno
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Fecha</span>
            <span className="font-medium text-white">{reserva.fecha}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Horario</span>
            <span className="font-medium text-white">{reserva.horario?.substring(0, 5)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Servicio</span>
            <span className="font-medium text-white">{reserva.servicioNombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Barbero</span>
            <span className="font-medium text-white">{reserva.barberoNombre}</span>
          </div>
        </div>
      </div>

      {/* Formulario de datos del cliente */}
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-300 mb-2 block">
            Nombre completo
          </span>
          <input
            type="text"
            value={reserva.clienteNombre}
            onChange={(e) => setReserva({ ...reserva, clienteNombre: e.target.value })}
            placeholder="Juan Pérez"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg 
                       text-white focus:border-oro-brillo focus:ring-1 
                       focus:ring-oro-brillo focus:outline-none transition-all placeholder-gray-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-300 mb-2 block">
            Teléfono
          </span>
          <input
            type="tel"
            value={reserva.clienteTelefono}
            onChange={(e) => setReserva({ ...reserva, clienteTelefono: e.target.value })}
            placeholder="11 2345-6789"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg 
                       text-white focus:border-oro-brillo focus:ring-1 
                       focus:ring-oro-brillo focus:outline-none transition-all placeholder-gray-500"
          />
        </label>
      </div>

      {/* Botones */}
      <div className="space-y-3">
        <button
          onClick={confirmarReserva}
          disabled={!reserva.clienteNombre || !reserva.clienteTelefono || loading}
          className="w-full py-3 text-base font-medium rounded-lg transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed 
                     bg-oro-base hover:bg-oro-brillo text-black font-bold shadow-sm"
        >
          {loading ? 'Confirmando...' : 'Confirmar Reserva'}
        </button>

        <button
          onClick={pasoAnterior}
          disabled={loading}
          className="w-full py-3 text-base font-medium rounded-lg
                     bg-gray-800 hover:bg-gray-700 text-white
                     transition-all duration-200 border border-gray-700"
        >
          Volver
        </button>
      </div>
    </div>
  );

  /**
   * Pantalla de éxito
   */
  const renderSuccess = () => (
    <div className="text-center py-12 space-y-6">
      <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          Reserva Confirmada
        </h2>
        <p className="text-gray-400">
          Tu turno ha sido registrado exitosamente
        </p>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 max-w-md mx-auto">
        <div className="space-y-2 text-sm text-left">
          <div className="flex justify-between">
            <span className="text-gray-400">Fecha</span>
            <span className="font-medium text-white">{reserva.fecha}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Hora</span>
            <span className="font-medium text-white">{reserva.horario}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Barbero</span>
            <span className="font-medium text-white">{reserva.barberoNombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Cliente</span>
            <span className="font-medium text-white">{reserva.clienteNombre}</span>
          </div>
        </div>
      </div>

      <button
        onClick={resetearWizard}
        className="bg-oro-base hover:bg-oro-brillo text-black font-bold px-6 py-3 rounded-lg
                   transition-all duration-200 shadow-sm"
      >
        Hacer otra reserva
      </button>
    </div>
  );

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================

  return (
    <div className="py-8 bg-black">
      <div className="container mx-auto px-6 sm:px-6 max-w-2xl">
        <div className="bg-black rounded-2xl shadow-2xl border-2 border-oro-base border-shine-effect p-8 sm:p-10">
          
          {/* Mensaje de error global */}
          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Mostrar pantalla según estado */}
          {success ? renderSuccess() : (
            <>
              {paso === 1 && renderPaso1()}
              {paso === 2 && renderPaso2()}
              {paso === 3 && renderPaso3()}
              {paso === 4 && renderPaso4()}
              {paso === 5 && renderPaso5()}
            </>
          )}
        </div>

        {/* Indicador de progreso minimalista */}
        {!success && (
          <div className="mt-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                    num <= paso ? 'bg-oro-brillo' : 'bg-gray-800'
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
