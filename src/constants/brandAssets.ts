// RPGCC Brand Assets
// Logo files should be placed in /public/logos/

export const RPGCC_LOGO_LIGHT = '/logos/rpgcc-logo-light.png'; // White text, for dark backgrounds
export const RPGCC_LOGO_DARK = '/logos/rpgcc-logo-dark.png';   // Dark text, for light backgrounds

export const RPGCC_COLORS = {
  navyDark: '#0f2744',
  navy: '#1e3a5f',
  blueLight: '#5bc0eb',
  teal: '#0d9488',
  orange: '#f5a623',
  red: '#e94f4f',
  textPrimary: '#1f2937',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  bgLight: '#f8fafc'
} as const;

export type RPGCCColor = keyof typeof RPGCC_COLORS;


