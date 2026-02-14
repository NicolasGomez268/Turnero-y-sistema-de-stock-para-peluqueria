import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import api from '../services/api';

const AdminBarberos = () => {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingHorarios, setEditingHorarios] = useState(null);
  const [showNewBarberoForm, setShowNewBarberoForm] = useState(false);

  useEffect(() => {
    cargarBarberos();
  }, []);

  const cargarBarberos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAllBarberos();
      setBarberos(data);
    } catch (err) {
      setError('Error al cargar barberos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (barberoId, isActive) => {
    try {
      await api.updateBarbero(barberoId, { is_active: !isActive });
      await cargarBarberos();
    } catch (err) {
      alert('Error al actualizar barbero: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header con botón Nuevo Barbero */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-tincho-gold mb-2">
            Gestión de Equipo
          </h2>
          <p className="text-gray-400">
            Administra tu equipo de barberos y sus horarios
          </p>
        </div>
        
        <button
          onClick={() => setShowNewBarberoForm(true)}
          className="px-6 py-3 bg-tincho-gold text-tincho-dark font-bold 
                   rounded-lg hover:bg-yellow-500 transition-all duration-200
                   flex items-center gap-2"
        >
          <span>➕</span>
          <span>Nuevo Barbero</span>
        </button>
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
          <div className="text-tincho-gold text-xl">Cargando equipo...</div>
        </div>
      ) : (
        /* Lista de Barberos */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barberos.map((barbero) => (
            <BarberoCard
              key={barbero.id}
              barbero={barbero}
              onToggleActivo={toggleActivo}
              onEditHorarios={(b) => setEditingHorarios(b)}
              onRefresh={cargarBarberos}
            />
          ))}
        </div>
      )}

      {/* Modal de Horarios */}
      {editingHorarios && (
        <HorariosModal
          barbero={editingHorarios}
          onClose={() => setEditingHorarios(null)}
          onSave={cargarBarberos}
        />
      )}

      {/* Modal Nuevo Barbero */}
      {showNewBarberoForm && (
        <NuevoBarberoModal
          onClose={() => setShowNewBarberoForm(false)}
          onSave={cargarBarberos}
        />
      )}
    </div>
  );
};

/* ========================================
   COMPONENTE: BarberoCard
======================================== */
const BarberoCard = ({ barbero, onToggleActivo, onEditHorarios, onRefresh }) => {
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUpdatingPhoto(true);
    try {
      await api.uploadBarberoPhoto(barbero.id, file);
      await onRefresh();
    } catch (err) {
      alert('Error al subir foto: ' + err.message);
    } finally {
      setUpdatingPhoto(false);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border-2 transition-all duration-200
                    ${barbero.is_active 
                      ? 'border-tincho-gold shadow-lg shadow-tincho-gold/20' 
                      : 'border-gray-700 opacity-60'}`}>
      {/* Foto */}
      <div className="relative mb-4">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-700 
                      border-4 border-tincho-gold">
          {barbero.foto ? (
            <img 
              src={barbero.foto} 
              alt={barbero.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              💈
            </div>
          )}
        </div>
        
        {/* Botón cambiar foto */}
        <label className="absolute bottom-0 right-1/2 transform translate-x-16 
                        bg-tincho-gold text-tincho-dark rounded-full p-2 cursor-pointer
                        hover:bg-yellow-500 transition-all">
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            disabled={updatingPhoto}
          />
          📷
        </label>
      </div>

      {/* Info */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-tincho-gold mb-1">
          {barbero.nombre}
        </h3>
        {barbero.especialidad && (
          <p className="text-sm text-gray-400">{barbero.especialidad}</p>
        )}
      </div>

      {/* Estado y Switch */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-900 rounded-lg">
        <span className="text-sm text-gray-400">Estado</span>
        <button
          onClick={() => onToggleActivo(barbero.id, barbero.is_active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full 
                     transition-colors duration-200 focus:outline-none
                     ${barbero.is_active ? 'bg-green-600' : 'bg-gray-600'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white 
                       transition-transform duration-200
                       ${barbero.is_active ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
        <span className={`text-sm font-semibold ${barbero.is_active ? 'text-green-400' : 'text-gray-500'}`}>
          {barbero.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Botón Editar Horarios */}
      <button
        onClick={() => onEditHorarios(barbero)}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white 
                 font-semibold rounded-lg transition-all duration-200
                 flex items-center justify-center gap-2"
      >
        <span>🕐</span>
        <span>Editar Horarios</span>
      </button>
    </div>
  );
};

BarberoCard.propTypes = {
  barbero: PropTypes.object.isRequired,
  onToggleActivo: PropTypes.func.isRequired,
  onEditHorarios: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

/* ========================================
   MODAL: Horarios
======================================== */
const HorariosModal = ({ barbero, onClose, onSave }) => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const diasSemana = [
    { id: 0, label: 'Lunes' },
    { id: 1, label: 'Martes' },
    { id: 2, label: 'Miércoles' },
    { id: 3, label: 'Jueves' },
    { id: 4, label: 'Viernes' },
    { id: 5, label: 'Sábado' },
    { id: 6, label: 'Domingo' },
  ];

  useEffect(() => {
    cargarHorarios();
  }, []);

  const cargarHorarios = async () => {
    setLoading(true);
    try {
      const data = await api.getBarberoHorarios(barbero.id);
      
      // Crear array completo con 7 días, marcando como activos los que vienen del backend
      const horariosCompletos = diasSemana.map(dia => {
        const horarioExistente = data.find(h => h.dia_semana === dia.id);
        
        if (horarioExistente) {
          return {
            ...horarioExistente,
            activo: true
          };
        } else {
          return {
            dia_semana: dia.id,
            hora_inicio: '09:00',
            hora_fin: '18:00',
            descanso_inicio: null,
            descanso_fin: null,
            activo: false
          };
        }
      });
      
      setHorarios(horariosCompletos);
    } catch (err) {
      console.error('Error al cargar horarios:', err);
      // Inicializar con horarios vacíos
      setHorarios(diasSemana.map(dia => ({
        dia_semana: dia.id,
        hora_inicio: '09:00',
        hora_fin: '18:00',
        descanso_inicio: null,
        descanso_fin: null,
        activo: dia.id !== 6, // Domingo inactivo por defecto
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (diaId, field, value) => {
    setHorarios(prev => prev.map(h => 
      h.dia_semana === diaId ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateBarberoHorarios(barbero.id, horarios);
      await onSave();
      onClose();
    } catch (err) {
      alert('Error al guardar horarios: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto 
                    border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex 
                      items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-tincho-gold">
              Horarios de {barbero.nombre}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Configura los días y horarios de trabajo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Cargando...</div>
          ) : (
            <div className="space-y-4">
              {diasSemana.map((dia) => {
                const horario = horarios.find(h => h.dia_semana === dia.id) || {
                  dia_semana: dia.id,
                  activo: false,
                  hora_inicio: '09:00',
                  hora_fin: '18:00',
                };

                return (
                  <div key={dia.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Día y Switch */}
                      <div className="w-32">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={horario.activo}
                            onChange={(e) => handleUpdate(dia.id, 'activo', e.target.checked)}
                            className="w-5 h-5"
                          />
                          <span className="text-gray-300 font-semibold">
                            {dia.label}
                          </span>
                        </label>
                      </div>

                      {horario.activo && (
                        <>
                          {/* Horarios */}
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={horario.hora_inicio || '09:00'}
                              onChange={(e) => handleUpdate(dia.id, 'hora_inicio', e.target.value)}
                              className="px-3 py-2 bg-gray-900 border border-gray-600 
                                       rounded text-gray-300 focus:border-tincho-gold"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                              type="time"
                              value={horario.hora_fin || '18:00'}
                              onChange={(e) => handleUpdate(dia.id, 'hora_fin', e.target.value)}
                              className="px-3 py-2 bg-gray-900 border border-gray-600 
                                       rounded text-gray-300 focus:border-tincho-gold"
                            />
                          </div>

                          {/* Descanso (opcional) */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Descanso:</span>
                            <input
                              type="time"
                              value={horario.descanso_inicio || ''}
                              onChange={(e) => handleUpdate(dia.id, 'descanso_inicio', e.target.value)}
                              placeholder="Inicio"
                              className="px-2 py-1 bg-gray-900 border border-gray-600 
                                       rounded text-gray-300 text-sm focus:border-tincho-gold"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                              type="time"
                              value={horario.descanso_fin || ''}
                              onChange={(e) => handleUpdate(dia.id, 'descanso_fin', e.target.value)}
                              placeholder="Fin"
                              className="px-2 py-1 bg-gray-900 border border-gray-600 
                                       rounded text-gray-300 text-sm focus:border-tincho-gold"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 
                      flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 
                     rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-tincho-gold hover:bg-yellow-500 text-tincho-dark 
                     font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

HorariosModal.propTypes = {
  barbero: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

/* ========================================
   MODAL: Nuevo Barbero
======================================== */
const NuevoBarberoModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createBarbero(formData);
      await onSave();
      onClose();
    } catch (err) {
      alert('Error al crear barbero: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-tincho-gold">Nuevo Barbero</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 font-semibold">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                       text-gray-300 focus:border-tincho-gold focus:outline-none"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-semibold">
              Especialidad (Opcional)
            </label>
            <input
              type="text"
              value={formData.especialidad}
              onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                       text-gray-300 focus:border-tincho-gold focus:outline-none"
              placeholder="Ej: Cortes clásicos, Fade, Barba"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="w-5 h-5"
            />
            <label htmlFor="is_active" className="text-gray-300">
              Activar inmediatamente
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 
                       rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-tincho-gold hover:bg-yellow-500 
                       text-tincho-dark font-bold rounded-lg transition-colors 
                       disabled:opacity-50"
            >
              {saving ? 'Creando...' : 'Crear Barbero'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

NuevoBarberoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default AdminBarberos;
