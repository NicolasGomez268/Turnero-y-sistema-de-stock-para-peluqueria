import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const menuItems = [
  { id: 'agenda',    label: 'Agenda',       path: '/admin-dashboard' },
  { id: 'barberos',  label: 'Equipo',        path: '/admin-barberos' },
  { id: 'servicios', label: 'Servicios',     path: '/admin-servicios' },
  { id: 'stock',     label: 'Stock',         path: '/admin-stock' },
  { id: 'caja',      label: 'Caja',          path: '/admin-caja' },
  { id: 'logout',    label: 'Cerrar Sesión', action: 'logout' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const notification = useNotification();

  // Desktop sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mobile top nav
  const [menuOpen, setMenuOpen]   = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const mainRef    = useRef(null);
  const lastScrollY = useRef(0);

  /* ── Nombre de la sección activa para mostrar en la barra ── */
  const activeLabel = menuItems.find(
    (item) => item.path && location.pathname === item.path
  )?.label ?? 'Admin';

  const handleLogout = async () => {
    const confirmed = await notification.confirm('¿Deseas cerrar sesión?', 'Confirmar cierre de sesión');
    if (confirmed) {
      logout();
      navigate('/');
    }
  };

  const handleNavClick = (item) => {
    setMenuOpen(false);
    if (item.action === 'logout') {
      handleLogout();
    } else {
      navigate(item.path);
    }
  };

  const isActive = (path) => location.pathname === path;

  /* ── Scroll: ocultar al bajar, mostrar al subir ── */
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const onScroll = () => {
      const y = el.scrollTop;
      if (y > lastScrollY.current && y > 60) {
        setNavHidden(true);
        setMenuOpen(false);
      } else {
        setNavHidden(false);
      }
      lastScrollY.current = y;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Al cambiar de ruta: mostrar nav y volver al tope ── */
  useEffect(() => {
    setNavHidden(false);
    setMenuOpen(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black flex">

      {/* ══════════════════════════════════════════════════
          TOP NAV MOBILE  —  visible solo en pantallas < md
      ══════════════════════════════════════════════════ */}
      <div
        className={`
          md:hidden fixed top-0 left-0 right-0 z-50
          transition-transform duration-300 ease-in-out
          ${navHidden ? '-translate-y-full' : 'translate-y-0'}
        `}
      >
        {/* Barra principal */}
        <div className="bg-gray-900 border-b border-gray-800 shadow-lg flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="/logotincho.png"
              alt="TINCHO"
              className="w-8 h-8 mix-blend-lighten opacity-95"
            />
            <span className="text-white font-bold text-base">{activeLabel}</span>
          </div>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-gray-300 hover:text-white transition-colors p-1"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? (
              /* ✕ */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* ☰ */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Dropdown */}
        {menuOpen && (
          <>
            {/* Overlay para cerrar al tocar afuera */}
            <div
              className="fixed inset-0 z-[-1]"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="bg-gray-900 border-b border-gray-800 shadow-xl">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`
                    w-full text-left px-6 py-4 text-base font-semibold
                    border-b border-gray-800 last:border-b-0
                    transition-colors
                    ${item.action === 'logout'
                      ? 'text-gray-400 hover:bg-red-900/40 hover:text-red-300'
                      : isActive(item.path)
                      ? 'bg-oro-base text-tincho-dark'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          SIDEBAR DESKTOP  —  visible solo en md+
      ══════════════════════════════════════════════════ */}
      <aside
        className={`
          hidden md:flex bg-gray-900 border-r border-gray-800
          transition-all duration-300 flex-col
          ${sidebarOpen ? 'w-48' : 'w-20'}
        `}
      >
        {/* Logo Header */}
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <img src="/logotincho.png" alt="TINCHO" className="w-8 h-8 mix-blend-lighten opacity-95" />
                <p className="text-xs text-gray-400">Panel Admin</p>
              </div>
            ) : (
              <img src="/logotincho.png" alt="TINCHO" className="w-10 h-10 mix-blend-lighten opacity-95" />
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
              className={`
                w-full px-3 py-2.5 flex items-center justify-start
                transition-all duration-300
                ${item.action === 'logout'
                  ? 'text-gray-400 hover:bg-red-900 hover:text-white'
                  : isActive(item.path)
                  ? 'bg-oro-base text-tincho-dark font-bold shadow-lg shadow-oro-base/50 border-l-4 border-black scale-105'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-oro-base hover:border-l-2 hover:border-black'
                }
              `}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ══════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ══════════════════════════════════════════════════ */}
      <main
        ref={mainRef}
        className="flex-1 h-screen overflow-y-auto pt-14 md:pt-0"
      >
        <Outlet />
      </main>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node,
};

export default AdminLayout;
