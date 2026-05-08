/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        'primary-light': '#dbeafe',
        accent: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bg: '#f8fafc',
        card: '#ffffff',
        text: '#0f172a',
        'text-secondary': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
