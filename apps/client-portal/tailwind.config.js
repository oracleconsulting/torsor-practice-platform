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
        // Custom palette for 365 Client Portal
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
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

