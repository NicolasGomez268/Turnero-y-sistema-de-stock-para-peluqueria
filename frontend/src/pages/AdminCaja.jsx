import { useEffect, useState } from 'react';
import api from '../services/api';

const AdminCaja = () => {
  const [pestanaActiva, setPestanaActiva] = useState('caja'); // caja, liquidacion, metricas

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Caja y Liquidación
        </h2>
        <p className="text-gray-400">
          Gestiona los ingresos diarios, liquidaciones semanales y métricas del negocio
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-4 mb-6 border-b border-gray-700 overflow-x-auto">
        <button
          onClick={() => setPestanaActiva('caja')}
          className={`px-4 sm:px-6 py-3 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap text-sm sm:text-base shrink-0
                     ${pestanaActiva === 'caja'
                       ? 'text-white border-white'
                       : 'text-gray-400 border-transparent hover:text-gray-300'}`}
        >
          Caja Diaria
        </button>
        <button
          onClick={() => setPestanaActiva('liquidacion')}
          className={`px-4 sm:px-6 py-3 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap text-sm sm:text-base shrink-0
                     ${pestanaActiva === 'liquidacion'
                       ? 'text-white border-white'
                       : 'text-gray-400 border-transparent hover:text-gray-300'}`}
        >
          Liquidación Semanal
        </button>
        <button
          onClick={() => setPestanaActiva('metricas')}
          className={`px-4 sm:px-6 py-3 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap text-sm sm:text-base shrink-0
                     ${pestanaActiva === 'metricas'
                       ? 'text-white border-white'
                       : 'text-gray-400 border-transparent hover:text-gray-300'}`}
        >
          Métricas Mensuales
        </button>
      </div>

      {/* Contenido */}
      {pestanaActiva === 'caja' && <CajaDiariaTab />}
      {pestanaActiva === 'liquidacion' && <LiquidacionTab />}
      {pestanaActiva === 'metricas' && <MetricasTab />}
    </div>
  );
};

/* ========================================
   TAB 1: CAJA DIARIA
======================================== */
const CajaDiariaTab = () => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [fecha]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCajaDiaria(fecha);
      setDatos(data);
    } catch (err) {
      setError('Error al cargar caja: ' + (err.error || err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">{error}</div>;
  }

  if (!datos) return null;

  return (
    <div className="space-y-6">
      {/* Selector de Fecha */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-800 p-4 rounded-lg">
        <label className="text-gray-300 font-semibold">Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="px-4 py-2 admin-input-gold rounded-lg text-gray-300"
        />
        <button
          onClick={cargarDatos}
          className="px-4 py-2 bg-oro-base text-tincho-dark font-bold rounded-lg
                   hover:bg-oro-brillo transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Turnos */}
        <div className="bg-gray-800 border-l-4 border-blue-500 rounded-lg p-4 sm:p-6 shadow-lg">
          <p className="text-gray-400 text-sm font-semibold mb-1">Turnos Realizados</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{datos.turnos.cantidad}</p>
          <p className="text-gray-500 text-sm mt-2">
            ${datos.turnos.total.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Total Ventas Productos */}
        <div className="bg-gray-800 border-l-4 border-purple-500 rounded-lg p-4 sm:p-6 shadow-lg">
          <p className="text-gray-400 text-sm font-semibold mb-1">Ventas de Productos</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{datos.ventas_productos.cantidad}</p>
          <p className="text-gray-500 text-sm mt-2">
            ${datos.ventas_productos.total.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Total General */}
        <div className="admin-metric-gold rounded-lg p-6 shadow-lg">
          <p className="text-black/70 text-sm font-semibold mb-1">Total del Día</p>
          <p className="text-3xl sm:text-4xl font-bold text-black">
            ${datos.total_general.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Desglose por método de pago — Turnos */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-1">Desglose por Método de Pago</h3>
        <p className="text-gray-400 text-sm mb-4">Turnos / Servicios</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gray-900 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Efectivo</p>
            <p className="text-2xl font-bold text-white">
              ${(datos.desglose_turnos_metodos_pago?.EFECTIVO ?? 0).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="bg-gray-900 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Transferencia</p>
            <p className="text-2xl font-bold text-white">
              ${(datos.desglose_turnos_metodos_pago?.TRANSFERENCIA ?? 0).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="bg-gray-900 border-l-4 border-purple-500 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Tarjeta</p>
            <p className="text-2xl font-bold text-white">
              ${(datos.desglose_turnos_metodos_pago?.TARJETA ?? 0).toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      {/* Desglose por método de pago — Productos */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-1">Desglose por Método de Pago</h3>
        <p className="text-gray-400 text-sm mb-4">Ventas de Productos</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gray-900 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Efectivo</p>
            <p className="text-2xl font-bold text-white">
              ${datos.desglose_metodos_pago.EFECTIVO.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="bg-gray-900 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Transferencia</p>
            <p className="text-2xl font-bold text-white">
              ${datos.desglose_metodos_pago.TRANSFERENCIA.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="bg-gray-900 border-l-4 border-purple-500 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Tarjeta</p>
            <p className="text-2xl font-bold text-white">
              ${datos.desglose_metodos_pago.TARJETA.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================
   TAB 2: LIQUIDACIÓN SEMANAL
======================================== */
const LiquidacionTab = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Calcular semana actual por defecto
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0=Domingo, 1=Lunes, ...
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1; // Ajustar para que lunes=0
    
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diasDesdeLunes);
    
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    
    setFechaInicio(lunes.toISOString().split('T')[0]);
    setFechaFin(domingo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      cargarDatos();
    }
  }, [fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getLiquidacion(fechaInicio, fechaFin);
      setDatos(data);
    } catch (err) {
      setError('Error al cargar liquidación: ' + (err.error || err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const setSemanaActual = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diasDesdeLunes);
    
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    
    setFechaInicio(lunes.toISOString().split('T')[0]);
    setFechaFin(domingo.toISOString().split('T')[0]);
  };

  const setSemanaPasada = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diasDesdeLunes - 7); // Semana pasada
    
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    
    setFechaInicio(lunes.toISOString().split('T')[0]);
    setFechaFin(domingo.toISOString().split('T')[0]);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">{error}</div>;
  }

  if (!datos) return null;

  return (
    <div className="space-y-6">
      {/* Selector de rango */}
      <div className="bg-gray-800 p-4 rounded-lg space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-gray-300 font-semibold">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-300
                       focus:border-tincho-gold focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-300 font-semibold">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-300
                       focus:border-tincho-gold focus:outline-none"
            />
          </div>
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-oro-base text-tincho-dark font-bold rounded-lg
                     hover:bg-oro-brillo transition-colors"
          >
            Consultar
          </button>
        </div>

        {/* Botones rápidos */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={setSemanaActual}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     transition-colors text-sm"
          >
            Semana Actual
          </button>
          <button
            onClick={setSemanaPasada}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg
                     transition-colors text-sm"
          >
            Semana Pasada
          </button>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-800 border-l-4 border-gray-600 rounded-lg p-4 sm:p-6">
          <p className="text-gray-400 text-sm mb-1">Ingresos Brutos</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            ${datos.resumen_general.total_ingresos_brutos.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-gray-800 border-l-4 border-green-500 rounded-lg p-4 sm:p-6">
          <p className="text-gray-400 text-sm mb-1">Total para Barberos</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            ${datos.resumen_general.total_para_barberos.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="admin-metric-gold rounded-lg p-6">
          <p className="text-black text-sm mb-1">Total para la Casa</p>
          <p className="text-2xl sm:text-3xl font-bold text-black">
            ${datos.resumen_general.total_para_casa.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Tabla de liquidaciones */}
      <div className="bg-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[540px]">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white font-bold text-sm">Barbero</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-white font-bold text-sm">Turnos</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-white font-bold text-sm">Total Bruto</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-white font-bold text-sm">% Barbero</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-white font-bold text-sm">A Pagar</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-white font-bold text-sm">Para la Casa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {datos.liquidaciones.map((liq) => (
              <tr key={liq.barbero_id} className="hover:bg-gray-750 transition-colors">
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-white font-semibold text-sm">
                  {liq.barbero_nombre}
                  {liq.es_dueno && (
                    <span className="ml-2 text-xs bg-tincho-gold text-tincho-dark px-2 py-1 rounded">
                      DUEÑO
                    </span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-gray-300 text-sm">{liq.cantidad_turnos}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-300 text-sm">
                  ${liq.total_bruto.toLocaleString('es-AR')}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-gray-300 text-sm">{liq.porcentaje_barbero}%</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-green-400 font-bold text-sm">
                  ${liq.comision_barbero.toLocaleString('es-AR')}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-white font-bold text-sm">
                  ${liq.comision_casa.toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ========================================
   TAB 3: MÉTRICAS MENSUALES
======================================== */
const MetricasTab = () => {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [mes, anio]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMetricasMensuales(mes, anio);
      setDatos(data);
    } catch (err) {
      setError('Error al cargar métricas: ' + (err.error || err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">{error}</div>;
  }

  if (!datos) return null;

  return (
    <div className="space-y-6">
      {/* Selector de mes/año */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-800 p-4 rounded-lg">
        <label className="text-gray-300 font-semibold">Mes:</label>
        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-300
                   focus:border-tincho-gold focus:outline-none"
        >
          {nombresMeses.map((nombre, idx) => (
            <option key={idx} value={idx + 1}>{nombre}</option>
          ))}
        </select>
        <label className="text-gray-300 font-semibold">Año:</label>
        <input
          type="number"
          value={anio}
          onChange={(e) => setAnio(parseInt(e.target.value))}
          className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-300
                   w-24 focus:border-tincho-gold focus:outline-none"
        />
        <button
          onClick={cargarDatos}
          className="px-4 py-2 bg-oro-base text-tincho-dark font-bold rounded-lg
                   hover:bg-oro-brillo transition-colors"
        >
          Consultar
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Turnos */}
        <div className="bg-gray-800 border-l-4 border-blue-500 rounded-lg p-4 sm:p-6">
          <p className="text-gray-400 text-sm font-semibold mb-1">Total de Turnos</p>
          <p className="text-3xl sm:text-4xl font-bold text-white">{datos.resumen.total_turnos_realizados}</p>
          <p className="text-gray-500 text-sm mt-2">
            ${datos.resumen.ingresos_turnos.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Total Ventas Productos */}
        <div className="bg-gray-800 border-l-4 border-purple-500 rounded-lg p-4 sm:p-6">
          <p className="text-gray-400 text-sm font-semibold mb-1">Ventas de Productos</p>
          <p className="text-3xl sm:text-4xl font-bold text-white">
            ${datos.resumen.total_ventas_productos.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Ganancia Total */}
        <div className="admin-metric-gold rounded-lg p-6">
          <p className="text-black/70 text-sm font-semibold mb-1">Ganancia Total</p>
          <p className="text-3xl sm:text-4xl font-bold text-black">
            ${datos.resumen.ganancia_total.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Mejor Barbero */}
        <div className="admin-metric-gold rounded-lg p-6">
          <p className="text-black text-sm font-semibold mb-1">Mejor Barbero</p>
          <p className="text-2xl font-bold text-black">{datos.mejor_barbero.nombre}</p>
          <p className="text-gray-800 text-sm mt-1">
            {datos.mejor_barbero.cantidad_turnos} turnos
          </p>
        </div>

        {/* Servicio Más Solicitado */}
        <div className="bg-gray-800 border-l-4 border-orange-500 rounded-lg p-4 sm:p-6 col-span-2 lg:col-span-2">
          <p className="text-gray-400 text-sm font-semibold mb-1">Servicio Más Solicitado</p>
          <p className="text-2xl font-bold text-white">{datos.servicio_mas_solicitado.nombre}</p>
          <p className="text-gray-500 text-sm mt-1">
            {datos.servicio_mas_solicitado.cantidad} veces
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminCaja;