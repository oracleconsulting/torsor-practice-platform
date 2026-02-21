/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          'navy-dark': '#1a2332',
          navy: '#243044',
          blue: '#4a90d9',
          'blue-light': '#6bb3f0',
          teal: '#2dd4bf',
          orange: '#f59e0b',
          red: '#ef4444',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
        dropdown: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}

