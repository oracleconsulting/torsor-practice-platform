/** @type {import('tailwindcss').Config} */
const { tailwindConfig } = require('./src/config/theme');

module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Professional Financial Services Theme - London Skyline
        primary: {
          DEFAULT: tailwindConfig.colors.primary.blue,
          foreground: tailwindConfig.colors.text.primary,
          blue: tailwindConfig.colors.primary.blue,
          coral: tailwindConfig.colors.primary.coral,
          gold: tailwindConfig.colors.primary.gold,
        },
        background: {
          DEFAULT: tailwindConfig.colors.background.main,
          card: tailwindConfig.colors.background.card,
          hover: tailwindConfig.colors.background.hover,
          sidebar: tailwindConfig.colors.background.sidebar,
          main: tailwindConfig.colors.background.main,
        },
        text: {
          primary: tailwindConfig.colors.text.primary,
          secondary: tailwindConfig.colors.text.secondary,
          tertiary: tailwindConfig.colors.text.tertiary,
          white: tailwindConfig.colors.text.white,
        },
        border: {
          light: tailwindConfig.colors.border.light,
          medium: tailwindConfig.colors.border.medium,
          dark: tailwindConfig.colors.border.dark,
        },
        semantic: {
          success: tailwindConfig.colors.semantic.success,
          warning: tailwindConfig.colors.semantic.warning,
          error: tailwindConfig.colors.semantic.error,
          info: tailwindConfig.colors.semantic.info,
        },
        card: {
          DEFAULT: tailwindConfig.colors.background.card,
          foreground: tailwindConfig.colors.text.primary,
        },
        popover: {
          DEFAULT: tailwindConfig.colors.background.card,
          foreground: tailwindConfig.colors.text.primary,
        },
        secondary: {
          DEFAULT: tailwindConfig.colors.background.hover,
          foreground: tailwindConfig.colors.text.primary,
        },
        muted: {
          DEFAULT: tailwindConfig.colors.background.hover,
          foreground: tailwindConfig.colors.text.secondary,
        },
        destructive: {
          DEFAULT: tailwindConfig.colors.semantic.error,
          foreground: tailwindConfig.colors.text.primary,
        },
        border: tailwindConfig.colors.border.light,
        input: tailwindConfig.colors.border.light,
        ring: tailwindConfig.colors.primary.blue,
        chart: {
          '1': tailwindConfig.colors.primary.blue,
          '2': tailwindConfig.colors.primary.coral,
          '3': tailwindConfig.colors.primary.gold,
          '4': tailwindConfig.colors.semantic.success,
          '5': '#8B5CF6',
        }
      },
      fontFamily: tailwindConfig.fontFamily,
      fontSize: tailwindConfig.fontSize,
      fontWeight: tailwindConfig.fontWeight,
      lineHeight: tailwindConfig.lineHeight,
      spacing: tailwindConfig.spacing,
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        ...tailwindConfig.borderRadius,
      },
      boxShadow: tailwindConfig.boxShadow,
      screens: tailwindConfig.screens,
      zIndex: tailwindConfig.zIndex,
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        ...tailwindConfig.animation,
      },
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
};