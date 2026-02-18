import PropTypes from 'prop-types';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const notification = useNotification();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'agenda', label: 'Agenda', path: '/admin-dashboard' },
    { id: 'barberos', label: 'Equipo', path: '/admin-barberos' },
    { id: 'servicios', label: 'Servicios', path: '/admin-servicios' },
    { id: 'stock', label: 'Stock', path: '/admin-stock' },
    { id: 'caja', label: 'Caja', path: '/admin-caja' },
    { id: 'logout', label: 'Cerrar Sesión', action: 'logout' },
  ];

  const handleLogout = async () => {
    const confirmed = await notification.confirm('¿Deseas cerrar sesión?', 'Confirmar cierre de sesión');
    if (confirmed) {
      logout();
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black flex">
      {/* SIDEBAR */}
      <aside 
        className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 
                    ${sidebarOpen ? 'w-48' : 'w-20'} flex flex-col`}
      >
        {/* Logo Header */}
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <img 
                  src="/logotincho.png" 
                  alt="TINCHO" 
                  className="w-8 h-8 mix-blend-lighten opacity-95"
                />
                <div>
                  <p className="text-xs text-gray-400">Panel Admin</p>
                </div>
              </div>
            ) : (
              <img 
                src="/logotincho.png" 
                alt="TINCHO" 
                className="w-10 h-10 mix-blend-lighten opacity-95"
              />
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-tincho-gold transition-colors"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.action === 'logout' ? handleLogout() : navigate(item.path)}
              className={`w-full px-3 py-2.5 flex items-center justify-start transition-all duration-300
                       ${item.action === 'logout'
                         ? 'text-gray-400 hover:bg-red-900 hover:text-white'
                         : isActive(item.path)
                         ? 'bg-oro-base text-tincho-dark font-bold shadow-lg shadow-oro-base/50 border-l-4 border-black scale-105'
                         : 'text-gray-400 hover:bg-gray-800 hover:text-oro-base hover:border-l-2 hover:border-black'
                       }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node,
};

export default AdminLayout;
