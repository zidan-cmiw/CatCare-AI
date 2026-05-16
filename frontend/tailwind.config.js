/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Add this line manually trigger dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f8fafc',
          dark: '#0f172a',
        },
        surface: {
          light: '#ffffff',
          dark: '#1e293b',
        },
        border: {
          light: '#e2e8f0',
          dark: '#334155',
        },
        text: {
          primary: {
            light: '#1e293b',
            dark: '#f8fafc',
          },
          secondary: {
            light: '#64748b',
            dark: '#94a3b8',
          }
        },
        darkBg: '#0f172a',
        darkCard: '#1e293b',
        brand: '#00f6ff',
        secondary: '#0ea5e9'
      },
      animation: {
      },
    },
  },
  plugins: [],
}

