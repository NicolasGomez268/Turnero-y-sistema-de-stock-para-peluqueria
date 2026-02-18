import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Layout principal de la aplicación TINCHO Barbería
 * Incluye header impactante con título dorado y línea decorativa tricolor
 */
const Layout = ({ children }) => {
  const navigate = useNavigate();
  
  // Efecto de typing para el título
  const textoCompleto = "Reserva tu turno online";
  const [textoMostrado, setTextoMostrado] = useState("");
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (indice < textoCompleto.length) {
      const timeout = setTimeout(() => {
        setTextoMostrado(textoCompleto.slice(0, indice + 1));
        setIndice(indice + 1);
      }, 100); // 100ms por carácter
      return () => clearTimeout(timeout);
    }
  }, [indice]);

  return (
    <div className="min-h-screen bg-black">
      {/* HEADER */}
      <header className="bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 py-10">
          {/* Logo Principal */}
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <img 
                src="/logotincho.png" 
                alt="TINCHO Barbería" 
                className="w-36 h-36 md:w-48 md:h-48 mix-blend-lighten opacity-95"
              />
            </div>
            
            {/* Título */}
            <div className="text-center space-y-2 max-w-full px-2">
              <h2 className="text-lg sm:text-2xl md:text-4xl font-bold tracking-tight sm:tracking-wide md:tracking-[0.2em] uppercase text-gray-200 break-words min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem]" style={{ textShadow: '3px 3px 10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 215, 0, 0.4)' }}>
                {textoMostrado}
                <span className="animate-pulse">|</span>
              </h2>
              
              {/* Línea decorativa debajo del título */}
              <div className="flex justify-center items-center gap-3 pt-2">
                <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-tincho-gold to-transparent"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-tincho-gold animate-pulse"></div>
                <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-tincho-gold to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* LÍNEA DECORATIVA TRICOLOR - Poste de Barbero */}
        <div className="h-3 flex">
          <div className="flex-1 bg-barber-red"></div>
          <div className="flex-1 bg-barber-white"></div>
          <div className="flex-1 bg-barber-blue"></div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main>
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-black border-t border-gray-800">
        {/* Línea decorativa superior */}
        <div className="h-3 flex">
          <div className="flex-1 bg-barber-red"></div>
          <div className="flex-1 bg-barber-white"></div>
          <div className="flex-1 bg-barber-blue"></div>
        </div>
        
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400">
            <p className="text-sm">
              © 2026 <span className="text-tincho-gold font-bold">TINCHO</span> Barbería & Indumentaria
            </p>
            
            {/* Botón discreto de acceso al admin */}
            <button
              onClick={() => navigate('/admin-login')}
              className="mt-4 text-xs text-gray-600 hover:text-tincho-gold 
                       transition-all duration-300 inline-flex items-center gap-1
                       opacity-50 hover:opacity-100"
              title="Acceso Administrador"
            >
              <span>🔒</span>
              <span>Admin</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
