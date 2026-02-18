import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.adminLogin(credentials);
      
      // Guardar usuario y token
      login(
        { 
          username: credentials.username,
          ...response.user 
        },
        response.token
      );
      
      // Redirigir al dashboard
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas. Intenta nuevamente.');
      console.error('Error de login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <img 
              src="/logotincho.png" 
              alt="TINCHO" 
              className="w-32 h-32 sm:w-40 sm:h-40 mix-blend-lighten opacity-95"
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-gray-700"></div>
            <p className="text-gray-300 text-sm sm:text-base md:text-lg font-semibold tracking-wide">
              Panel de Administración
            </p>
            <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-gray-700"></div>
          </div>
        </div>

        {/* Formulario */}
        <div className="admin-modal-gold rounded-2xl shadow-xl
                      p-6 sm:p-8 transition-all">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Usuario */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-oro-base font-semibold mb-2"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleChange}
                className="w-full px-4 py-3 admin-input-gold rounded-lg 
                         text-gray-200 placeholder-gray-500
                         transition-all"
                placeholder="Ingresa tu usuario"
                autoComplete="username"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-oro-base font-semibold mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="w-full px-4 py-3 admin-input-gold rounded-lg 
                         text-gray-200 placeholder-gray-500
                         transition-all"
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-oro-base text-tincho-dark font-bold 
                       rounded-lg hover:bg-oro-brillo transition-all duration-200 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transform hover:scale-105 active:scale-95"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Volver */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-tincho-gold transition-colors"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Acceso exclusivo para administradores</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
