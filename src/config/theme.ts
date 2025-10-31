/**
 * Modern SaaS Theme - Single Source of Truth
 * Clean, modern theme configuration for IVC Accounting Dashboard
 * Based on contemporary SaaS design principles
 */

export const theme = {
  // ===== CORE COLOR PALETTE =====
  colors: {
    // PRIMARY PALETTE
    primary: {
      blue: '#3B82F6',     // Primary Blue
      coral: '#EF4444',    // Accent Coral
      gold: '#F59E0B',     // Accent Gold
    },
    
    // BACKGROUND PALETTE
    background: {
      main: '#F8F9FC',     // Light gray background
      card: '#FFFFFF',     // White card background
      hover: '#F1F5F9',    // Hover background
      sidebar: '#FFFFFF',  // White sidebar
    },
    
    // TEXT PALETTE
    text: {
      primary: '#1E293B',   // Dark primary text
      secondary: '#64748B', // Medium secondary text
      tertiary: '#94A3B8',  // Light tertiary text
      white: '#FFFFFF',     // White text for contrast
    },
    
    // BORDER PALETTE
    border: {
      light: '#E2E8F0',    // Light borders
      medium: '#CBD5E1',   // Medium borders
      dark: '#94A3B8',     // Dark borders
    },
    
    // GRADIENT DEFINITIONS
    gradients: {
      primary: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', // Blue to purple
      hover: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',   // Darker for hover
      card: 'linear-gradient(145deg, #FFFFFF 0%, #F8F9FC 100%)',    // Subtle card gradient
    },
    
    // SEMANTIC COLORS
    semantic: {
      success: '#10B981',     // Green for success
      warning: '#F59E0B',     // Gold for warnings
      error: '#EF4444',       // Red for errors
      info: '#3B82F6',        // Blue for information
    },
    
    // SHADOW DEFINITIONS
    shadows: {
      card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      hover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
  
  // ===== TYPOGRAPHY =====
  typography: {
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.8125rem',  // 13px - Labels (was 12px)
      sm: '0.9375rem',  // 15px - Body text (was 14px)
      base: '1.0625rem', // 17px - Default (was 16px)
      lg: '1.1875rem',  // 19px - Large body (was 18px)
      xl: '1.3125rem',  // 21px - Small headers (was 20px)
      '2xl': '1.625rem', // 26px - Medium headers (was 24px)
      '3xl': '2rem',    // 32px - Large headers (was 30px)
      '4xl': '2.5rem',  // 40px - Extra large headers (was 36px)
    },
    fontWeight: {
      normal: '400',    // Body text
      medium: '500',    // Labels
      semibold: '600',  // Headers
      bold: '700',      // Strong emphasis
    },
    lineHeight: {
      tight: '1.3',     // Headers (slightly more breathing room)
      normal: '1.6',    // Body text (improved readability)
      relaxed: '1.8',   // Comfortable reading (more space)
    },
  },
  
  // ===== SPACING (8px base unit) =====
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '2.5rem',    // 40px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // ===== BORDER RADIUS =====
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // ===== LAYOUT =====
  layout: {
    sidebar: {
      width: '260px',
      widthCollapsed: '80px',
      widthTablet: '220px',
    },
    header: {
      height: '64px',
    },
    content: {
      padding: '2.5rem', // 40px
      paddingMobile: '1rem', // 16px
    },
  },
  
  // ===== ANIMATION =====
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',    // Standard transitions
      slow: '300ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // ===== BREAKPOINTS =====
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // ===== Z-INDEX =====
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

// ===== CSS VARIABLE MAPPING =====
export const cssVariables = {
  '--theme-primary-blue': theme.colors.primary.blue,
  '--theme-primary-coral': theme.colors.primary.coral,
  '--theme-primary-gold': theme.colors.primary.gold,
  '--theme-bg-main': theme.colors.background.main,
  '--theme-bg-card': theme.colors.background.card,
  '--theme-bg-hover': theme.colors.background.hover,
  '--theme-bg-sidebar': theme.colors.background.sidebar,
  '--theme-text-primary': theme.colors.text.primary,
  '--theme-text-secondary': theme.colors.text.secondary,
  '--theme-text-tertiary': theme.colors.text.tertiary,
  '--theme-text-white': theme.colors.text.white,
  '--theme-border-light': theme.colors.border.light,
  '--theme-border-medium': theme.colors.border.medium,
  '--theme-border-dark': theme.colors.border.dark,
  '--theme-gradient-primary': theme.colors.gradients.primary,
  '--theme-gradient-hover': theme.colors.gradients.hover,
  '--theme-gradient-card': theme.colors.gradients.card,
  '--theme-shadow-card': theme.colors.shadows.card,
  '--theme-shadow-elevated': theme.colors.shadows.elevated,
  '--theme-shadow-hover': theme.colors.shadows.hover,
} as const;

// ===== UTILITY FUNCTIONS =====
export const getThemeColor = (path: string) => {
  const keys = path.split('.');
  let value: any = theme;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }
  
  return value;
};

export const getCSSVariable = (name: keyof typeof cssVariables) => {
  return cssVariables[name];
};

// ===== TAILWIND CONFIG MAPPING =====
export const tailwindConfig = {
  colors: {
    primary: {
      blue: theme.colors.primary.blue,
      coral: theme.colors.primary.coral,
      gold: theme.colors.primary.gold,
    },
    background: {
      main: theme.colors.background.main,
      card: theme.colors.background.card,
      hover: theme.colors.background.hover,
      sidebar: theme.colors.background.sidebar,
    },
    text: {
      primary: theme.colors.text.primary,
      secondary: theme.colors.text.secondary,
      tertiary: theme.colors.text.tertiary,
      white: theme.colors.text.white,
    },
    border: {
      light: theme.colors.border.light,
      medium: theme.colors.border.medium,
      dark: theme.colors.border.dark,
    },
    semantic: {
      success: theme.colors.semantic.success,
      warning: theme.colors.semantic.warning,
      error: theme.colors.semantic.error,
      info: theme.colors.semantic.info,
    },
  },
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSize,
  fontWeight: theme.typography.fontWeight,
  lineHeight: theme.typography.lineHeight,
  spacing: theme.spacing,
  borderRadius: theme.borderRadius,
  boxShadow: {
    card: theme.colors.shadows.card,
    elevated: theme.colors.shadows.elevated,
    hover: theme.colors.shadows.hover,
  },
  screens: theme.breakpoints,
  zIndex: theme.zIndex,
  animation: {
    duration: theme.animation.duration,
    easing: theme.animation.easing,
  },
} as const;

export default theme;