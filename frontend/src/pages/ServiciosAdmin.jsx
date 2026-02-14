import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ServiciosAdmin() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicioEditando, setServicioEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_minutos: 30,
    is_active: true
  });

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const data = await api.getServicios();
      setServicios(data);
    } catch (error) {
      alert('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setServicioEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      duracion_minutos: 30,
      is_active: true
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (servicio) => {
    setServicioEditando(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      precio: servicio.precio,
      duracion_minutos: servicio.duracion_minutos,
      is_active: servicio.is_active
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio || !formData.duracion_minutos) {
      alert('Por favor completá todos los campos obligatorios');
      return;
    }

    try {
      if (servicioEditando) {
        await api.updateServicio(servicioEditando.id, formData);
      } else {
        await api.createServicio(formData);
      }
      setModalAbierto(false);
      cargarServicios();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      alert('Error al guardar servicio: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEliminar = async (id) => {
    const servicio = servicios.find(s => s.id === id);
    
    if (!confirm(`¿Estás seguro de eliminar "${servicio?.nombre}"?\n\n⚠️ Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.deleteServicio(id);
      cargarServicios();
      alert('✅ Servicio eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      
      // Si el backend devuelve un mensaje estructurado
      if (error.response?.data?.mensaje) {
        const data = error.response.data;
        alert(`❌ ${data.error}\n\n${data.mensaje}\n\n💡 ${data.sugerencia}`);
      } else {
        // Mensaje genérico
        alert('❌ Error al eliminar el servicio. Puede que tenga turnos asociados.\n\n💡 Intenta desactivarlo en lugar de eliminarlo.');
      }
    }
  };

  const toggleActivo = async (servicio) => {
    try {
      await api.updateServicio(servicio.id, {
        ...servicio,
        is_active: !servicio.is_active
      });
      cargarServicios();
    } catch (error) {
      alert('Error al cambiar estado del servicio');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tincho-dark flex items-center justify-center">
        <div className="text-white text-xl">Cargando servicios...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tincho-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Servicios</h1>
            <p className="text-gray-400">Administrá los servicios que ofrece la barbería</p>
          </div>
          <button
            onClick={abrirModalNuevo}
            className="px-6 py-3 bg-tincho-gold text-tincho-dark font-bold rounded-lg
                     hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            Nuevo Servicio
          </button>
        </div>

        {/* Lista de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicios.map(servicio => (
            <div
              key={servicio.id}
              className={`bg-gray-900 rounded-lg p-6 border-2 transition-all
                        ${servicio.is_active ? 'border-gray-700' : 'border-red-900 opacity-60'}`}
            >
              {/* Badge de estado */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold
                               ${servicio.is_active 
                                 ? 'bg-green-900/50 text-green-400' 
                                 : 'bg-red-900/50 text-red-400'}`}>
                  {servicio.is_active ? '✓ Activo' : '✕ Inactivo'}
                </span>
                <button
                  onClick={() => toggleActivo(servicio)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title={servicio.is_active ? 'Desactivar' : 'Activar'}
                >
                  {servicio.is_active ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {/* Nombre y descripción */}
              <h3 className="text-xl font-bold text-white mb-2">{servicio.nombre}</h3>
              {servicio.descripcion && (
                <p className="text-gray-400 text-sm mb-4">{servicio.descripcion}</p>
              )}

              {/* Precio y duración */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-tincho-gold">
                    ${Number(servicio.precio).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Duración</p>
                  <p className="text-white font-bold">{servicio.duracion_minutos} min</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <button
                  onClick={() => abrirModalEditar(servicio)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 transition-colors font-bold"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleEliminar(servicio.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg
                           hover:bg-red-700 transition-colors font-bold"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {servicios.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No hay servicios creados</p>
            <button
              onClick={abrirModalNuevo}
              className="px-6 py-3 bg-tincho-gold text-tincho-dark font-bold rounded-lg
                       hover:bg-yellow-400 transition-colors"
            >
              Crear Primer Servicio
            </button>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative">
            {/* Botón cerrar */}
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>

            {/* Título */}
            <h2 className="text-2xl font-bold text-white mb-6">
              {servicioEditando ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-white font-bold mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border-2 border-gray-700
                           focus:border-tincho-gold focus:outline-none"
                  placeholder="Ej: Corte de Cabello"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-white font-bold mb-2">Descripción (opcional)</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border-2 border-gray-700
                           focus:border-tincho-gold focus:outline-none resize-none"
                  rows={3}
                  placeholder="Descripción del servicio..."
                />
              </div>

              {/* Precio y Duración */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">
                    Precio ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border-2 border-gray-700
                             focus:border-tincho-gold focus:outline-none"
                    placeholder="5000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-2">
                    Duración (min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={formData.duracion_minutos}
                    onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border-2 border-gray-700
                             focus:border-tincho-gold focus:outline-none"
                    placeholder="30"
                    required
                  />
                </div>
              </div>

              {/* Estado Activo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-tincho-gold
                           focus:ring-2 focus:ring-tincho-gold"
                />
                <label htmlFor="is_active" className="text-white font-bold cursor-pointer">
                  Servicio activo (visible para clientes)
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg
                           hover:bg-gray-600 transition-colors font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-tincho-gold text-tincho-dark rounded-lg
                           hover:bg-yellow-400 transition-colors font-bold"
                >
                  {servicioEditando ? 'Guardar Cambios' : 'Crear Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
