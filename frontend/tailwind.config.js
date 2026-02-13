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
        'tincho-gold': '#FFD700',      // Amarillo Dorado Brillante para títulos y botones de acción
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
