/**
 * HVA (Hidden Value Audit) Data Extraction Utilities
 * 
 * Extracts and structures Hidden Value Audit responses into usable formats
 * for the benchmarking report components.
 */

export interface HvaQuotes {
  moat: {
    factors: string[];
    uniqueMethods: string | null;
  };
  strengths: {
    reputationTime: string | null;
    certifications: string[];
    customerAdvocates: number | null;
  };
  risks: {
    knowledgeDependency: number | null;
    personalBrand: number | null;
    undocumentedProcesses: string[];
    lastPriceIncrease: string | null;
    ownerHoursWeekly: number | null;
  };
  operational: {
    hasManagementAccounts: boolean;
    currentSystems: string[];
    painPoints: string[];
  };
}

export interface CompetitiveMoatData {
  factors: string[];
  uniqueMethods: string | null;
  reputationTime: string | null;
}

export interface FounderRiskData {
  knowledgeDependency: number | null;
  personalBrandDependency: number | null;
  successionReadiness: string | null;
  keyPersonInsurance: boolean;
  documentedProcesses: boolean;
}

/**
 * Extract structured HVA quotes from raw HVA responses
 */
export function extractHvaQuotes(hvaResponses: Record<string, any> | null | undefined): HvaQuotes | null {
  if (!hvaResponses) return null;
  
  return {
    moat: {
      factors: extractArray(hvaResponses.competitive_moat),
      uniqueMethods: extractString(hvaResponses.unique_methods),
    },
    strengths: {
      reputationTime: extractString(hvaResponses.reputation_build_time),
      certifications: extractArray(hvaResponses.certifications),
      customerAdvocates: extractNumber(hvaResponses.active_customer_advocates),
    },
    risks: {
      knowledgeDependency: extractPercentage(hvaResponses.knowledge_dependency_percentage),
      personalBrand: extractPercentage(hvaResponses.personal_brand_percentage),
      undocumentedProcesses: extractArray(hvaResponses.critical_processes_undocumented),
      lastPriceIncrease: extractString(hvaResponses.last_price_increase),
      ownerHoursWeekly: extractNumber(hvaResponses.owner_hours_weekly),
    },
    operational: {
      hasManagementAccounts: extractBoolean(hvaResponses.has_management_accounts),
      currentSystems: extractArray(hvaResponses.current_systems),
      painPoints: extractArray(hvaResponses.operational_pain_points),
    },
  };
}

/**
 * Extract competitive moat data for display in client report
 */
export function extractCompetitiveMoat(hvaResponses: Record<string, any> | null | undefined): CompetitiveMoatData | null {
  if (!hvaResponses) return null;
  
  const factors = extractArray(hvaResponses.competitive_moat);
  const uniqueMethods = extractString(hvaResponses.unique_methods);
  const reputationTime = extractString(hvaResponses.reputation_build_time);
  
  // Only return if we have meaningful data
  if (factors.length === 0 && !uniqueMethods && !reputationTime) {
    return null;
  }
  
  return {
    factors,
    uniqueMethods,
    reputationTime,
  };
}

/**
 * Extract founder risk data for calculations
 */
export function extractFounderRiskData(hvaResponses: Record<string, any> | null | undefined): FounderRiskData | null {
  if (!hvaResponses) return null;
  
  return {
    knowledgeDependency: extractPercentage(hvaResponses.knowledge_dependency_percentage),
    personalBrandDependency: extractPercentage(hvaResponses.personal_brand_percentage),
    successionReadiness: extractString(hvaResponses.succession_readiness),
    keyPersonInsurance: extractBoolean(hvaResponses.key_person_insurance),
    documentedProcesses: extractBoolean(hvaResponses.documented_processes),
  };
}

/**
 * Get service recommendation triggers from HVA data
 * Returns metrics that can trigger service recommendations
 */
export function getServiceTriggerMetrics(hvaResponses: Record<string, any> | null | undefined): Record<string, any> {
  if (!hvaResponses) return {};
  
  return {
    // Operational metrics
    owner_hours_weekly: extractNumber(hvaResponses.owner_hours_weekly),
    has_management_accounts: extractBoolean(hvaResponses.has_management_accounts),
    last_price_increase: extractString(hvaResponses.last_price_increase),
    
    // Risk metrics  
    knowledge_dependency_percentage: extractPercentage(hvaResponses.knowledge_dependency_percentage),
    personal_brand_percentage: extractPercentage(hvaResponses.personal_brand_percentage),
    succession_readiness: extractString(hvaResponses.succession_readiness),
    
    // Business metrics
    client_concentration: extractPercentage(hvaResponses.client_concentration_top3),
    hourly_rate: extractNumber(hvaResponses.hourly_rate),
    utilisation_rate: extractPercentage(hvaResponses.utilisation_rate),
  };
}

/**
 * Check if HVA data has meaningful content
 */
export function hasHvaData(hvaResponses: Record<string, any> | null | undefined): boolean {
  if (!hvaResponses) return false;
  
  // Check for at least one meaningful field
  const meaningfulFields = [
    'competitive_moat',
    'unique_methods',
    'knowledge_dependency_percentage',
    'personal_brand_percentage',
    'succession_readiness',
    'last_price_increase',
  ];
  
  return meaningfulFields.some(field => {
    const value = hvaResponses[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    return false;
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function extractArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) {
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string');
      }
    } catch {
      // If not JSON, treat as comma-separated list
      return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
  }
  return [];
}

function extractString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function extractNumber(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function extractPercentage(value: unknown): number | null {
  const num = extractNumber(value);
  if (num === null) return null;
  
  // If value is > 1, assume it's already a percentage
  // If value is <= 1, assume it's a decimal and convert
  if (num > 0 && num <= 1) {
    return num * 100;
  }
  return num;
}

function extractBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  if (typeof value === 'number') return value === 1;
  return false;
}

// =============================================================================
// DISPLAY FORMATTERS
// =============================================================================

/**
 * Format competitive moat factors for display
 */
export function formatMoatFactors(factors: string[]): string[] {
  const moatDisplayNames: Record<string, string> = {
    'relationships': 'Long-term Client Relationships',
    'reputation': 'Industry Reputation',
    'expertise': 'Specialized Expertise',
    'certifications': 'Certifications & Accreditations',
    'patents': 'Patents / IP',
    'data': 'Proprietary Data / Systems',
    'network': 'Network Effects',
    'switching_costs': 'High Switching Costs',
    'brand': 'Brand Recognition',
    'location': 'Geographic Advantage',
    'contracts': 'Long-term Contracts',
    'scale': 'Scale Advantages',
  };
  
  return factors.map(f => moatDisplayNames[f.toLowerCase()] || f);
}

/**
 * Get risk level from knowledge dependency percentage
 */
export function getKnowledgeRiskLevel(percentage: number | null): 'low' | 'medium' | 'high' | 'critical' | null {
  if (percentage === null) return null;
  if (percentage >= 80) return 'critical';
  if (percentage >= 60) return 'high';
  if (percentage >= 40) return 'medium';
  return 'low';
}

/**
 * Format price increase status for display
 */
export function formatPriceIncreaseStatus(lastIncrease: string | null): { 
  status: 'healthy' | 'warning' | 'critical'; 
  message: string;
} {
  if (!lastIncrease) {
    return { status: 'warning', message: 'Unknown' };
  }
  
  const lower = lastIncrease.toLowerCase();
  
  if (lower.includes('never') || lower.includes('more than 3') || lower.includes('3+ years')) {
    return { status: 'critical', message: 'Over 3 years ago' };
  }
  if (lower.includes('more than 2') || lower.includes('2-3 years') || lower.includes('2 years')) {
    return { status: 'critical', message: '2+ years ago' };
  }
  if (lower.includes('1-2 years') || lower.includes('last year')) {
    return { status: 'warning', message: '1-2 years ago' };
  }
  if (lower.includes('this year') || lower.includes('6 months') || lower.includes('recently')) {
    return { status: 'healthy', message: 'Within the last year' };
  }
  
  return { status: 'warning', message: lastIncrease };
}

