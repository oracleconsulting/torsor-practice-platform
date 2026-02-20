// ============================================================================
// ADMIN NAVIGATION TYPES
// ============================================================================

import type { ComponentType } from 'react';

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
  | 'service-builder'
  | 'tech-database';

export interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export interface PageProps extends NavigationProps {}

export interface NavItem {
  id: Page;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}
