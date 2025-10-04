import React from 'react';
import { HealthScoreWidget } from '../components/accountancy/dashboard/HealthScoreWidget';
import { AdvisoryProgressWidget } from '../components/accountancy/dashboard/AdvisoryProgressWidget';
import { QuickActionsWidget } from '../components/accountancy/dashboard/QuickActionsWidget';
import { ActiveRescuesWidget } from '../components/accountancy/dashboard/ActiveRescuesWidget';
import { TeamCPDWidget } from '../components/accountancy/dashboard/TeamCPDWidget';
import { HandoverComplaintsWidget } from '../components/accountancy/dashboard/HandoverComplaintsWidget';
import { AlternateAuditorWidget } from '../components/accountancy/dashboard/AlternateAuditorWidget';
import { MTDCapacityWidget } from '../components/accountancy/dashboard/MTDCapacityWidget';
import { ESGReportingWidget } from '../components/accountancy/dashboard/ESGReportingWidget';
import { ContinuityPlanWidget } from '../components/accountancy/dashboard/ContinuityPlanWidget';
import { CyberSecurityWidget } from '../components/accountancy/dashboard/CyberSecurityWidget';
import { TeamWellnessWidget } from '@/components/accountancy/dashboard/wellness/TeamWellnessWidget';
import { ESGLiteWidget } from '../components/accountancy/dashboard/ESGLiteWidget';
import { ContinuityScorecardWidget } from '../components/accountancy/dashboard/ContinuityScorecardWidget';
import { CyberShieldWidget } from '../components/accountancy/dashboard/CyberShieldWidget';

// Placeholder imports for new widgets (will be created)
// import { MTDCockpitWidget } from '../components/accountancy/dashboard/MTDCockpitWidget';
// import { ESGLiteWidget } from '../components/accountancy/dashboard/ESGLiteWidget';
// import { ContinuityScorecardWidget } from '../components/accountancy/dashboard/ContinuityScorecardWidget';
// import { CyberShieldWidget } from '../components/accountancy/dashboard/CyberShieldWidget';
// import { TeamWellnessWidget } from '../components/accountancy/dashboard/TeamWellnessWidget';

export interface WidgetConfig {
  id: string;
  name: string;
  component: React.ComponentType;
  defaultSize: 'small' | 'medium' | 'large' | 'full';
  category: 'compliance' | 'optimization' | 'monitoring' | 'planning' | 'core' | 'business-intelligence';
  requiredPermissions?: string[];
  description: string;
  priority: number; // 1 = highest priority
  isNew?: boolean; // For highlighting new widgets
  beta?: boolean; // For beta features
  tags?: string[];
  icon?: string;
  color?: string;
}

export const widgetRegistry: WidgetConfig[] = [
  // Existing Core Widgets
  {
    id: 'health-score',
    name: 'Health Score',
    component: HealthScoreWidget,
    defaultSize: 'medium',
    category: 'core',
    description: 'Overall practice health assessment',
    priority: 1
  },
  {
    id: 'advisory-progress',
    name: 'Advisory Progress',
    component: AdvisoryProgressWidget,
    defaultSize: 'medium',
    category: 'core',
    description: 'Track advisory revenue and project progress',
    priority: 2
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    component: QuickActionsWidget,
    defaultSize: 'full',
    category: 'core',
    description: 'Common actions and shortcuts',
    priority: 3
  },
  {
    id: 'active-rescues',
    name: 'Active Rescues',
    component: ActiveRescuesWidget,
    defaultSize: 'large',
    category: 'monitoring',
    requiredPermissions: ['professional'],
    description: 'Track client rescue projects',
    priority: 4
  },
  {
    id: 'team-cpd',
    name: 'Team CPD',
    component: TeamCPDWidget,
    defaultSize: 'large',
    category: 'monitoring',
    requiredPermissions: ['professional'],
    description: 'Team continuing professional development',
    priority: 5
  },
  {
    id: 'handover-complaints',
    name: 'Handover Complaints',
    component: HandoverComplaintsWidget,
    defaultSize: 'large',
    category: 'compliance',
    requiredPermissions: ['professional'],
    description: 'Manage regulatory complaints',
    priority: 6
  },

  // New Widgets
  {
    id: 'alternate-auditor',
    name: 'Alternate Auditor Register',
    component: AlternateAuditorWidget,
    defaultSize: 'large',
    category: 'compliance',
    requiredPermissions: ['professional'],
    description: 'Manage alternate auditor registrations and compliance',
    priority: 7,
    isNew: true,
    beta: false
  },
  {
    id: 'mtd-capacity',
    name: 'MTD Capacity',
    component: MTDCapacityWidget,
    defaultSize: 'large',
    category: 'compliance',
    requiredPermissions: ['professional'],
    description: 'Monitor MTD ITSA capacity and readiness',
    priority: 8,
    isNew: true,
    beta: false
  },
  {
    id: 'esg-reporting',
    name: 'ESG Reporting',
    component: ESGReportingWidget,
    defaultSize: 'medium',
    category: 'compliance',
    requiredPermissions: ['excellence'],
    description: 'Environmental, Social, and Governance reporting',
    priority: 9,
    isNew: true,
    beta: true
  },
  {
    id: 'esg-lite',
    name: 'ESG Lite',
    component: ESGLiteWidget,
    defaultSize: 'medium',
    category: 'compliance',
    requiredPermissions: ['professional'],
    description: 'Sustainability reporting for SME clients',
    priority: 10,
    isNew: true,
    beta: false
  },
  {
    id: 'continuity-plan',
    name: 'Continuity Plan',
    component: ContinuityPlanWidget,
    defaultSize: 'large',
    category: 'planning',
    requiredPermissions: ['excellence'],
    description: 'Business continuity planning and assessment',
    priority: 11,
    isNew: true,
    beta: true
  },
  {
    id: 'cyber-security',
    name: 'Cyber Security',
    component: CyberSecurityWidget,
    defaultSize: 'medium',
    category: 'compliance',
    requiredPermissions: ['professional'],
    description: 'Cybersecurity monitoring and compliance',
    priority: 12,
    isNew: true,
    beta: false
  },
  {
    id: 'team-wellness',
    name: 'Team Wellness',
    component: TeamWellnessWidget,
    defaultSize: 'medium',
    category: 'optimization',
    requiredPermissions: ['professional'],
    description: 'Monitor team wellbeing and prevent burnout',
    priority: 13,
    isNew: true,
    beta: false
  },
  {
    id: 'continuity-scorecard',
    name: 'Practice Continuity',
    description: 'Track practice value, plan succession, and maintain business continuity',
    component: ContinuityScorecardWidget,
    defaultSize: 'large',
    category: 'business-intelligence',
    requiredPermissions: ['accountancy'],
    priority: 14,
    isNew: true,
    beta: false,
    tags: ['succession', 'valuation', 'continuity', 'planning'],
    icon: 'briefcase',
    color: 'purple'
  },
  {
    id: 'cyber-shield',
    name: 'Cyber Shield',
    component: CyberShieldWidget,
    defaultSize: 'medium',
    category: 'monitoring',
    requiredPermissions: ['accountancy:read', 'accountancy:write', 'security:read'],
    description: 'Real-time cyber security monitoring, incident response, and partner integration',
    priority: 15,
    isNew: true,
    beta: false
  }
];

// Helper functions
export const getWidgetById = (id: string): WidgetConfig | undefined => {
  return widgetRegistry.find(widget => widget.id === id);
};

export const getWidgetsByCategory = (category: WidgetConfig['category']): WidgetConfig[] => {
  return widgetRegistry.filter(widget => widget.category === category);
};

export const getWidgetsByPermission = (userPermissions: string[]): WidgetConfig[] => {
  return widgetRegistry.filter(widget => {
    if (!widget.requiredPermissions) return true;
    return widget.requiredPermissions.some(permission => userPermissions.includes(permission));
  });
};

export const getNewWidgets = (): WidgetConfig[] => {
  return widgetRegistry.filter(widget => widget.isNew);
};

export const getBetaWidgets = (): WidgetConfig[] => {
  return widgetRegistry.filter(widget => widget.beta);
}; 