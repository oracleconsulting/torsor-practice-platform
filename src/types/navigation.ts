// ============================================================================
// SHARED NAVIGATION TYPES
// ============================================================================
// Single source of truth for navigation types
// ============================================================================

export type Page = 
  | 'heatmap' 
  | 'management' 
  | 'readiness' 
  | 'analytics' 
  | 'clients' 
  | 'ga-dashboard'
  | 'assessments' 
  | 'delivery' 
  | 'config' 
  | 'cpd' 
  | 'training' 
  | 'knowledge'
  | 'ma-portal'
  | 'service-builder';

export interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export interface PageProps extends NavigationProps {}

