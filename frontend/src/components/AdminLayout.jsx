import PropTypes from 'prop-types';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'agenda', label: 'Agenda', icon: '📅', path: '/admin-dashboard' },
    { id: 'barberos', label: 'Equipo', icon: '💈', path: '/admin-barberos' },
    { id: 'servicios', label: 'Servicios', icon: '✂️', path: '/admin-servicios' },
    { id: 'stock', label: 'Stock', icon: '👕', path: '/admin-stock' },
    { id: 'caja', label: 'Caja', icon: '💰', path: '/admin-caja' },
  ];

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      logout();
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-tincho-dark flex">
      {/* SIDEBAR */}
      <aside 
        className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 
                    ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}
      >
        {/* Logo Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <h2 className="text-2xl font-bold text-tincho-gold">TINCHO</h2>
            ) : (
              <div className="text-2xl">✂️</div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-tincho-gold transition-colors"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          {sidebarOpen && (
            <p className="text-xs text-gray-500 mt-1">Panel Admin</p>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-all
                       ${isActive(item.path)
                         ? 'bg-tincho-gold text-tincho-dark font-bold'
                         : 'text-gray-400 hover:bg-gray-800 hover:text-tincho-gold'
                       }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="text-2xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-800">
          {sidebarOpen ? (
            <>
              <div className="mb-3">
                <p className="text-xs text-gray-500">Conectado como:</p>
                <p className="text-sm text-gray-300 font-semibold">
                  {user?.username}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-gray-800 hover:bg-red-600 
                         text-gray-300 hover:text-white rounded-lg transition-all
                         text-sm font-semibold"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors text-2xl"
              title="Cerrar Sesión"
            >
              🚪
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-tincho-gold">
                {menuItems.find(item => isActive(item.path))?.label || 'Panel'}
              </h1>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Usuario</p>
                <p className="text-sm text-gray-300 font-semibold">
                  👤 {user?.username}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node,
};

export default AdminLayout;
