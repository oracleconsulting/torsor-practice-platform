/**
 * Helper utilities for Team Assessment Insights
 */

// Display name mappings for all assessment types
const displayNames = {
  // Communication Styles
  communication: {
    'high_sync': 'High-Sync Communicator',
    'balanced': 'Balanced Communicator',
    'async_preferred': 'Async-Focused Communicator'
  },
  // Work Styles
  workStyle: {
    'autonomous': 'Autonomous Worker',
    'structured': 'Structured Worker',
    'flexible': 'Flexible Worker'
  },
  // Work Environments
  environment: {
    'quiet_focused': 'Deep Work Specialist',
    'social_collaborative': 'Team Energiser',
    'flexible_adaptive': 'Environment Agnostic'
  },
  // Belbin Roles
  belbin: {
    'plant': 'Innovator',
    'monitor_evaluator': 'Analyst',
    'specialist': 'Expert',
    'coordinator': 'Leader',
    'teamworker': 'Harmoniser',
    'resource_investigator': 'Explorer',
    'shaper': 'Driver',
    'implementer': 'Doer',
    'completer_finisher': 'Perfectionist'
  },
  // Motivational Drivers
  motivation: {
    'achievement': 'Achievement-Driven',
    'autonomy': 'Autonomy-Driven',
    'affiliation': 'Affiliation-Driven',
    'influence': 'Influence-Driven',
    'security': 'Security-Driven',
    'recognition': 'Recognition-Driven'
  },
  // EQ Levels
  eq: {
    'high': 'Strong EQ',
    'moderate': 'Developing EQ',
    'developing': 'Growing EQ',
    'strong': 'Strong EQ' // Alternative naming
  },
  // Conflict Styles
  conflict: {
    'competing': 'Competitor',
    'collaborating': 'Collaborator',
    'compromising': 'Compromiser',
    'avoiding': 'Avoider',
    'accommodating': 'Accommodator'
  },
  // VARK Learning Styles
  vark: {
    'visual': 'Visual Learner',
    'auditory': 'Auditory Learner',
    'reading': 'Reading/Writing Learner',
    'kinesthetic': 'Kinesthetic Learner',
    'multimodal': 'Multimodal Learner'
  }
} as const;

type DisplayNameType = keyof typeof displayNames;

/**
 * Get friendly display name for assessment values
 */
export const getFriendlyName = (type: DisplayNameType, value: string): string => {
  const mapping = displayNames[type];
  if (!mapping) return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  const key = value.toLowerCase() as keyof typeof mapping;
  return (mapping[key] as string) || value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * Get color class based on completion rate
 */
export const getCompletionColor = (rate: number): string => {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Get color class based on dynamics score
 */
export const getDynamicsColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Color palette for charts
 */
export const CHART_COLORS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', 
  '#3b82f6', '#ef4444', '#14b8a6', '#f97316'
];

/**
 * Validate and sanitize chart data
 */
export const validateChartData = <T extends { count?: number; value?: number }>(
  data: T[] | null | undefined
): T[] => {
  if (!Array.isArray(data)) return [];
  
  return data
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      ...item,
      count: Number.isFinite(item.count) && item.count! >= 0 ? Math.floor(item.count!) : 0,
      value: Number.isFinite(item.value) && item.value! >= 0 ? item.value : 0
    }))
    .filter(item => (item.count && item.count > 0) || (item.value && item.value > 0));
};

