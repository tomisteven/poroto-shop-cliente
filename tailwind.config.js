/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0c0a08',    // negro cálido principal (sin azul)
        surface: '#171310',       // tarjetas y sidebar (negro cálido)
        primary: '#f97316',       // naranja acento principal
        primaryDark: '#ea580c',   // naranja oscuro
        textLight: '#f7f0e0',     // beige claro (texto principal)
        textMuted: '#b3a488',     // beige apagado (texto secundario)
        beige: '#e9dcbf',         // beige acento
        success: '#10b981',       // bg-emerald-500
        danger: '#ef4444',        // bg-red-500
        warning: '#f59e0b',       // bg-amber-500
      }
    },
  },
  plugins: [],
}
