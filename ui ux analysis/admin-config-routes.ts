// ============================================================================
// ADMIN ROUTE CONFIGURATION
// ============================================================================
// Single source of truth for all admin URL paths.
// Used by Navigation.tsx for active state detection and by App.tsx for route definitions.
// ============================================================================

export const ADMIN_ROUTES = {
  clients: '/clients',
  'ga-dashboard': '/goal-alignment',
  'ma-portal': '/bi-portal',
  delivery: '/delivery',
  heatmap: '/skills/heatmap',
  management: '/skills/management',
  analytics: '/team/analytics',
  cpd: '/team/cpd',
  training: '/team/training',
  readiness: '/practice/readiness',
  assessments: '/practice/assessments',
  config: '/config/services',
  'service-builder': '/config/service-builder',
  'tech-database': '/config/tech-database',
  knowledge: '/config/knowledge-base',
} as const;

export type PageId = keyof typeof ADMIN_ROUTES;

/** Reverse lookup: path → pageId */
export function getPageIdFromPath(pathname: string): PageId | null {
  for (const [key, path] of Object.entries(ADMIN_ROUTES)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return key as PageId;
    }
  }
  return null;
}
