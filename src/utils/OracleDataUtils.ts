// Utilities for handling Oracle data inconsistencies

/**
 * Safely parse revenue strings to numbers
 * Handles formats like "50000", "£50,000", "50k", etc.
 */
export function parseRevenue(revenueStr: string | number | null): number {
  if (typeof revenueStr === 'number') return revenueStr;
  if (!revenueStr) return 0;
  
  const str = String(revenueStr).toLowerCase();
  
  // Check for pre-revenue indicators
  if (['0', 'zero', 'none', 'pre-revenue', 'no revenue'].some(term => str.includes(term))) {
    return 0;
  }
  
  // Remove currency symbols and commas
  let cleaned = str.replace(/[£$,]/g, '').trim();
  
  // Handle 'k' notation
  if (cleaned.endsWith('k')) {
    cleaned = cleaned.slice(0, -1);
    return parseFloat(cleaned) * 1000;
  }
  
  // Handle 'm' notation
  if (cleaned.endsWith('m')) {
    cleaned = cleaned.slice(0, -1);
    return parseFloat(cleaned) * 1000000;
  }
  
  // Parse the number
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get display-friendly revenue string
 */
export function formatRevenue(amount: number): string {
  if (amount === 0) return '£0';
  if (amount >= 1000000) {
    return `£${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `£${(amount / 1000).toFixed(0)}k`;
  }
  return `£${amount.toLocaleString()}`;
}

/**
 * Validate and fix founder state inconsistencies
 */
export function validateFounderState(revenue: number, founderState: string): string {
  // If revenue is 0 but state isn't pre-revenue, fix it
  if (revenue === 0 && founderState !== 'pre_revenue') {
    console.warn(`Founder state mismatch: £0 revenue but state is '${founderState}'. Correcting to 'pre_revenue'`);
    return 'pre_revenue';
  }
  
  // If revenue exists but state is pre-revenue, fix it
  if (revenue > 0 && founderState === 'pre_revenue') {
    if (revenue < 50000) return 'early';
    if (revenue < 250000) return 'growth';
    return 'scaling';
  }
  
  return founderState;
}

/**
 * Extract business name with fallbacks
 */
export function getBusinessName(responses: any): string {
  return responses?.company_name || 
         responses?.trading_name || 
         responses?.business_name || 
         'Your Business';
}

/**
 * Extract user name with fallbacks
 */
export function getUserName(responses: any): string {
  return responses?.full_name || 
         responses?.name || 
         responses?.first_name || 
         'Founder';
}

/**
 * Reconcile revenue conflicts between Part 1 and roadmap
 */
export function reconcileRevenue(part1Responses: any, roadmapData: any): {
  current: number;
  display: string;
  hasConflict: boolean;
} {
  const part1Revenue = parseRevenue(part1Responses?.business_turnover?.current_turnover);
  const roadmapRevenue = parseRevenue(roadmapData?.summary?.currentRevenue);
  
  // If they don't match, log warning
  const hasConflict = part1Revenue !== roadmapRevenue && part1Revenue > 0;
  if (hasConflict) {
    console.warn(`Revenue mismatch: Part 1 shows £${part1Revenue}, Roadmap shows £${roadmapRevenue}`);
  }
  
  // Prefer Part 1 data as it's directly from user input
  const actualRevenue = part1Revenue || roadmapRevenue;
  
  return {
    current: actualRevenue,
    display: formatRevenue(actualRevenue),
    hasConflict
  };
}

/**
 * Calculate actual weekly hours commitment
 */
export function parseCommitmentHours(commitment: string): {
  min: number;
  max: number;
  display: string;
} {
  const commitmentMap: Record<string, { min: number; max: number }> = {
    'Less than 5 hours': { min: 0, max: 5 },
    '5-10 hours': { min: 5, max: 10 },
    '10-15 hours': { min: 10, max: 15 },
    '15 hours +': { min: 15, max: 20 },
    '15+ hours': { min: 15, max: 20 }
  };
  
  const range = commitmentMap[commitment] || { min: 10, max: 15 };
  
  return {
    ...range,
    display: commitment
  };
}

/**
 * Validate board data structure
 */
export function validateBoardData(configData: any): {
  isValid: boolean;
  board: string[];
  errors: string[];
} {
  const errors: string[] = [];
  let board: string[] = [];
  
  // Check for board array
  if (!configData?.board || !Array.isArray(configData.board)) {
    errors.push('No board array found');
  } else {
    board = configData.board;
  }
  
  // Validate board has members
  if (board.length === 0) {
    errors.push('Board is empty');
  }
  
  // Check for rationale
  if (!configData?.rationale || typeof configData.rationale !== 'object') {
    errors.push('Board rationale missing or invalid');
  }
  
  // Check for scores
  if (!configData?.scores || typeof configData.scores !== 'object') {
    errors.push('Board scores missing or invalid');
  }
  
  return {
    isValid: errors.length === 0,
    board,
    errors
  };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Check if user has completed onboarding
 */
export function checkOnboardingStatus(data: any): {
  part1Complete: boolean;
  part2Complete: boolean;
  boardGenerated: boolean;
  roadmapGenerated: boolean;
  isFullyOnboarded: boolean;
  nextStep: string;
} {
  const status = {
    part1Complete: !!data?.part1Complete,
    part2Complete: !!data?.part2Complete,
    boardGenerated: !!data?.boardGenerated,
    roadmapGenerated: !!data?.roadmapGenerated,
    isFullyOnboarded: false,
    nextStep: ''
  };
  
  // Determine next step
  if (!status.part1Complete) {
    status.nextStep = 'Complete Part 1 Assessment';
  } else if (!status.part2Complete) {
    status.nextStep = 'Complete Part 2 Assessment';
  } else if (!status.boardGenerated) {
    status.nextStep = 'Generate AI Board';
  } else if (!status.roadmapGenerated) {
    status.nextStep = 'Generate Roadmap';
  } else {
    status.isFullyOnboarded = true;
    status.nextStep = 'Start Week 1';
  }
  
  return status;
}