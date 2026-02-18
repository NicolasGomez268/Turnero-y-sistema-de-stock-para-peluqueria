/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tincho-dark': '#333333',      // Gris Cemento/Industrial para fondos generales
        'tincho-gold': '#F2E387',      // Oro Brillo - coincide con el logo
        'oro-brillo': '#F2E387',       // Oro más claro
        'oro-base': '#D4B34F',         // Oro medio
        'oro-sombra': '#8C6A1D',       // Oro oscuro
        'barber-red': '#EF4444',       // Rojo Barbero
        'barber-blue': '#3B82F6',      // Azul Barbero
        'barber-white': '#FFFFFF',     // Blanco puro
      },
      fontFamily: {
        'barber': ['Impact', 'Haettenschweiler', 'Arial Narrow Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
