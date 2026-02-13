# 🔴⚪🔵 TINCHO Barbería - Frontend

Frontend de la aplicación web de gestión de turnos para **TINCHO Barbería & Indumentaria**.

## 🎨 Identidad Visual

La paleta de colores refleja la estética del local físico:

- **`tincho-dark`** (`#333333`): Gris cemento/industrial para fondos
- **`tincho-gold`** (`#FFD700`): Amarillo dorado brillante para títulos y CTAs
- **`barber-red`** (`#EF4444`): Rojo barbero (poste)
- **`barber-blue`** (`#3B82F6`): Azul barbero (poste)
- **`barber-white`** (`#FFFFFF`): Blanco puro

## 🚀 Tecnologías

- **React 18**: Library UI
- **Vite 5**: Build tool ultra rápido
- **Tailwind CSS 3**: Utility-first CSS framework
- **React Router**: Navegación SPA
- **Axios**: HTTP client para API REST

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🏗️ Estructura

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   └── Layout.jsx       # Layout principal con header y footer
│   ├── App.jsx              # Componente raíz
│   ├── main.jsx             # Entry point
│   └── index.css            # Estilos globales + Tailwind
├── public/                  # Archivos estáticos
├── index.html
├── vite.config.js           # Configuración Vite + proxy API
├── tailwind.config.js       # Colores personalizados TINCHO
└── package.json
```

## 🎯 Características del Layout

✅ **Header impactante** con título "TINCHO" en dorado  
✅ **Línea decorativa tricolor** simulando poste de barbero  
✅ **Footer** con branding y info de copyright  
✅ **Responsive design** adaptado a mobile y desktop  
✅ **Clases CSS reutilizables**: `.btn-primary`, `.btn-secondary`, `.card`

## 🔌 Conexión con Backend

El proyecto está configurado con proxy para conectar con el backend Django:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:8000'
  }
}
```

**Importante**: Asegúrate de que el backend esté corriendo en `http://localhost:8000`

## 📝 Próximos Pasos (FASE 4)

- [ ] Página de reserva de turnos
- [ ] Selección de barbero y servicio
- [ ] Calendario de disponibilidad
- [ ] Formulario de datos del cliente
- [ ] Confirmación de turno

---

**Desarrollado con 💛 siguiendo la estética de TINCHO Barbería**
