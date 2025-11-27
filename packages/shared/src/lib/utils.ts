// Utility Functions

/**
 * Calculate assessment completion percentage
 */
export function calculateAssessmentProgress(
  answeredQuestions: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((answeredQuestions / totalQuestions) * 100);
}

/**
 * Get current week number in the 13-week program
 */
export function getCurrentProgramWeek(enrolledAt: Date | string): number {
  const start = new Date(enrolledAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  return Math.min(Math.max(diffWeeks + 1, 1), 13);
}

/**
 * Format currency for UK pounds
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Calculate engagement score from activity metrics
 */
export function calculateEngagementScore(metrics: {
  lastLogin: Date | string | null;
  activities30d: number;
  tasksCompleted30d: number;
}): number {
  let score = 0;

  // Login recency (max 40 points)
  if (metrics.lastLogin) {
    const daysSinceLogin = Math.floor(
      (Date.now() - new Date(metrics.lastLogin).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLogin <= 7) score += 40;
    else if (daysSinceLogin <= 14) score += 30;
    else if (daysSinceLogin <= 30) score += 20;
    else score += 10;
  }

  // Activity level (max 30 points)
  if (metrics.activities30d >= 20) score += 30;
  else if (metrics.activities30d >= 10) score += 20;
  else if (metrics.activities30d >= 5) score += 10;

  // Task completion (max 30 points)
  if (metrics.tasksCompleted30d >= 8) score += 30;
  else if (metrics.tasksCompleted30d >= 4) score += 20;
  else if (metrics.tasksCompleted30d >= 1) score += 10;

  return score;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      
      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}

