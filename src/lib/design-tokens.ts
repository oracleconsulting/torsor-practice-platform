/**
 * Design Tokens for Advisory Skills Interface
 * Provides consistent spacing, colors, transitions, and breakpoints
 */

// 8px Grid System
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '1rem',     // 16px
  md: '1.5rem',   // 24px
  lg: '2rem',     // 32px
  xl: '3rem',     // 48px
  '2xl': '4rem',  // 64px
  '3xl': '6rem',  // 96px
} as const;

// Status Colors - Semantic meaning
export const statusColors = {
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    hover: 'hover:bg-red-100',
    badge: 'bg-red-100 text-red-800 border-red-300',
    icon: 'text-red-500',
  },
  attention: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    hover: 'hover:bg-amber-100',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: 'text-amber-500',
  },
  good: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    hover: 'hover:bg-green-100',
    badge: 'bg-green-100 text-green-800 border-green-300',
    icon: 'text-green-500',
  },
  opportunity: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: 'text-blue-500',
  },
  neutral: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-100',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: 'text-gray-500',
  },
} as const;

// Skill Level Colors (0-5 scale)
export const skillLevelColors = {
  0: { bg: 'bg-slate-800', text: 'text-white', label: 'No Experience' },
  1: { bg: 'bg-red-500', text: 'text-white', label: 'Beginner' },
  2: { bg: 'bg-red-400', text: 'text-white', label: 'Basic' },
  3: { bg: 'bg-amber-500', text: 'text-white', label: 'Competent' },
  4: { bg: 'bg-emerald-500', text: 'text-white', label: 'Proficient' },
  5: { bg: 'bg-emerald-400', text: 'text-white', label: 'Expert' },
} as const;

// Transitions
export const transitions = {
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-300 ease-out',
  slow: 'transition-all duration-500 ease-out',
  spring: 'transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// Responsive Breakpoints
export const breakpoints = {
  mobile: '640px',   // sm: 1 column
  tablet: '768px',   // md: 4 columns
  desktop: '1024px', // lg: 12 columns
  wide: '1280px',    // xl
  ultrawide: '1536px', // 2xl
} as const;

// Grid System
export const grid = {
  mobile: 'grid-cols-1',
  tablet: 'grid-cols-4',
  desktop: 'grid-cols-12',
  gap: {
    sm: 'gap-4',   // 16px
    md: 'gap-6',   // 24px
    lg: 'gap-8',   // 32px
  },
} as const;

// Card Styles
export const card = {
  base: 'bg-white rounded-lg shadow-sm border border-gray-200',
  hover: 'hover:shadow-md hover:border-gray-300',
  interactive: 'cursor-pointer transition-all duration-200',
  elevated: 'shadow-lg',
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
} as const;

// Z-Index Layers
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  fab: 70,
} as const;

// Animation Presets
export const animations = {
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  slideOut: 'animate-out slide-out-to-bottom-4 duration-200',
} as const;

// Keyboard Shortcuts
export const keyboardShortcuts = {
  overview: { key: 'g+o', description: 'Go to Overview' },
  matrix: { key: 'g+m', description: 'Go to Skills Matrix' },
  assessment: { key: 'g+a', description: 'Go to Assessment' },
  gaps: { key: 'g+g', description: 'Go to Gap Analysis' },
  planning: { key: 'g+p', description: 'Go to Development Planning' },
  analysis: { key: 'g+s', description: 'Go to Skills Analysis' },
  metrics: { key: 'g+t', description: 'Go to Team Metrics' },
  export: { key: 'e', description: 'Export Data' },
  help: { key: '?', description: 'Show Help' },
  search: { key: '/', description: 'Search' },
} as const;

// Helper Functions
export const getStatusColor = (type: keyof typeof statusColors) => statusColors[type];
export const getSkillLevelColor = (level: number) => skillLevelColors[level as keyof typeof skillLevelColors] || skillLevelColors[0];

export const getStatusFromGap = (gap: number): keyof typeof statusColors => {
  if (gap >= 2) return 'critical';
  if (gap >= 1) return 'attention';
  if (gap === 0) return 'good';
  return 'neutral';
};

export const getStatusFromInterest = (interest: number): keyof typeof statusColors => {
  if (interest >= 4) return 'opportunity';
  if (interest >= 3) return 'good';
  if (interest >= 2) return 'attention';
  return 'neutral';
};

// Priority Score Calculation
export const calculatePriority = (gap: number, interest: number, memberCount: number = 1): number => {
  return gap * interest * memberCount;
};

export const getPriorityStatus = (priority: number): keyof typeof statusColors => {
  if (priority >= 10) return 'critical';
  if (priority >= 5) return 'attention';
  if (priority >= 2) return 'opportunity';
  return 'neutral';
};

