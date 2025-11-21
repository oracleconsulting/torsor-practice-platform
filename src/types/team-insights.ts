/**
 * Shared TypeScript interfaces for Team Assessment Insights
 */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface AssessmentCompletion {
  memberId: string;
  name: string;
  vark: boolean;
  ocean: boolean;
  workingPrefs: boolean;
  belbin: boolean;
  motivational: boolean;
  eq: boolean;
  conflict: boolean;
  completionRate: number;
}

export interface TeamComposition {
  // Working Preferences Distribution
  communicationStyles: { style: string; count: number }[];
  workStyles: { style: string; count: number }[];
  environments: { env: string; count: number }[];
  
  // Belbin Roles
  belbinRoles: { role: string; count: number; members: string[] }[];
  roleBalance: string;
  
  // Motivational Drivers
  motivationalDrivers: { driver: string; count: number }[];
  
  // EQ Levels
  eqDistribution: { level: string; count: number }[];
  avgEQ: number;
  
  // Conflict Styles
  conflictStyles: { style: string; count: number }[];
  
  // VARK Learning Styles
  varkStyles: { style: string; count: number }[];
  
  // OCEAN Personality (team averages)
  avgPersonality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

export interface TeamDynamics {
  communicationCompatibility: number;
  workStyleFlexibility: number;
  roleCompletion: number;
  motivationalAlignment: number;
  conflictResolutionCapacity: number;
}

export interface DevelopmentPriorities {
  skillGaps: { area: string; severity: 'high' | 'medium' | 'low'; affectedMembers: number }[];
  roleGaps: { role: string; current: number; ideal: number }[];
  teamHealthScore: number;
  recommendations: string[];
}

