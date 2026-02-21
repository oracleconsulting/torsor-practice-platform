/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Include shared platform components (imported via @torsor/platform alias)
    "../../src/**/*.{js,ts,jsx,tsx}",
    "../../src/components/**/*.{js,ts,jsx,tsx}",
  ],
  // Safelist classes that are dynamically constructed and might be missed by JIT
  safelist: [
    // Metric card indicators
    'bg-rose-500',
    'bg-rose-600',
    'text-rose-600',
    'bg-emerald-500',
    'bg-emerald-600', 
    'text-emerald-600',
    'border-rose-200',
    'border-emerald-200',
    // Value analysis gradients
    'bg-gradient-to-br',
    'bg-gradient-to-r',
    'from-slate-900',
    'via-slate-800',
    'to-blue-900',
    'from-blue-50',
    'via-indigo-50',
    'to-purple-50',
    'from-green-50',
    'to-emerald-50',
    // Severity colors for suppressors
    'bg-red-50',
    'border-red-300',
    'text-red-800',
    'bg-red-500',
    'bg-red-600',
    'text-red-400',
    'text-red-600',
    'bg-amber-50',
    'border-amber-300',
    'text-amber-800',
    'bg-amber-500',
    'text-amber-400',
    'bg-orange-50',
    'border-orange-300',
    'text-orange-500',
    'bg-orange-500',
    'bg-yellow-50',
    'border-yellow-300',
    'text-yellow-500',
    'bg-yellow-500',
    'bg-blue-50',
    'border-blue-300',
    'text-blue-800',
    'bg-blue-400',
    'text-blue-400',
    'bg-blue-600',
    // Additional colors used in shared components
    'bg-slate-100',
    'bg-slate-200',
    'border-slate-700',
    'text-slate-300',
    'text-slate-400',
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
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

