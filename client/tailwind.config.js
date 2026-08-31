/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        solar: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          900: '#064e3b',
        },
        zeno: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#0ea5e9',
          accent: '#f59e0b',
          success: '#10b981'
        }
      }
    },
  },
  plugins: [],
}
