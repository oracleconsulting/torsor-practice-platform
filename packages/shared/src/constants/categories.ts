// Task and Assessment Categories

export const TASK_CATEGORIES = [
  'Financial',
  'Operations',
  'Team',
  'Marketing',
  'Product',
  'Systems',
  'Personal',
] as const;

export const TASK_PRIORITIES = [
  'critical',
  'high',
  'medium',
  'low',
] as const;

export const TASK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'skipped',
  'deferred',
] as const;

export const PROGRAM_STATUSES = [
  'invited',
  'active',
  'paused',
  'completed',
  'churned',
] as const;

export const CLIENT_STAGES = [
  'startup',
  'growth',
  'mature',
  'exit-planning',
] as const;

export const ASSESSMENT_TYPES = [
  'part1',
  'part2',
  'part3',
] as const;

export const ASSESSMENT_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
  'reviewed',
] as const;

// UI Labels
export const CATEGORY_LABELS: Record<string, string> = {
  Financial: '💰 Financial',
  Operations: '⚙️ Operations',
  Team: '👥 Team',
  Marketing: '📣 Marketing',
  Product: '📦 Product',
  Systems: '🔧 Systems',
  Personal: '🎯 Personal',
};

export const PRIORITY_LABELS: Record<string, string> = {
  critical: '🔴 Critical',
  high: '🟠 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  skipped: 'Skipped',
  deferred: 'Deferred',
};

export const ASSESSMENT_LABELS: Record<string, string> = {
  part1: 'Part 1: Life Design',
  part2: 'Part 2: Business Deep Dive',
  part3: 'Part 3: Hidden Value Audit',
};

