
/**
 * Layout principal de la aplicación TINCHO Barbería
 * Incluye header impactante con título dorado y línea decorativa tricolor
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-tincho-dark">
      {/* HEADER IMPACTANTE */}
      <header className="bg-gradient-to-b from-black to-tincho-dark shadow-2xl">
        <div className="container mx-auto px-4 py-8">
          {/* Título Principal */}
          <h1 className="text-center text-7xl md:text-8xl font-extrabold text-tincho-gold uppercase tracking-wider font-barber">
            TINCHO
          </h1>
          
          {/* Subtítulo */}
          <p className="text-center text-xl md:text-2xl text-gray-300 mt-2 tracking-widest">
            BARBERÍA & INDUMENTARIA
          </p>
        </div>
        
        {/* LÍNEA DECORATIVA TRICOLOR - Poste de Barbero */}
        <div className="h-3 flex">
          <div className="flex-1 bg-barber-red"></div>
          <div className="flex-1 bg-barber-white"></div>
          <div className="flex-1 bg-barber-blue"></div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="min-h-[calc(100vh-200px)]">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-black border-t border-gray-800 mt-12">
        {/* Línea decorativa superior */}
        <div className="h-2 flex">
          <div className="flex-1 bg-barber-red"></div>
          <div className="flex-1 bg-barber-white"></div>
          <div className="flex-1 bg-barber-blue"></div>
        </div>
        
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400">
            <p className="text-sm">
              © 2026 <span className="text-tincho-gold font-bold">TINCHO</span> Barbería & Indumentaria
            </p>
            <p className="text-xs mt-2">
              Sistema de Gestión de Turnos · Hecho con ❤️ en Argentina
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
