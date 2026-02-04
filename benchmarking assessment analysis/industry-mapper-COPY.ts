// Industry Code Mapper
// Maps SIC codes to internal industry codes for benchmarking

const SIC_TO_INDUSTRY: Record<string, { code: string; name: string }> = {
  // Technology
  '62011': { code: 'SAAS', name: 'SaaS / Software Products' },
  '62012': { code: 'SOFTWARE_AGENCY', name: 'Software Development Agency' },
  '62020': { code: 'SOFTWARE_AGENCY', name: 'Software Development Agency' },
  '62030': { code: 'MSP', name: 'IT Services / MSP' },
  // Note: 62090 is "Other IT service activities" - too ambiguous to map directly
  // Backend uses business description analysis for 62090; frontend falls back to ITSERV
  '62090': { code: 'ITSERV', name: 'IT Services' },
  
  // Professional Services
  '69201': { code: 'ACCT', name: 'Accountancy' },
  '69202': { code: 'ACCT', name: 'Accountancy' },
  '70210': { code: 'CONSULT', name: 'Management Consultancy' },
  '73110': { code: 'MARKET', name: 'Marketing Agencies' },
  '74100': { code: 'DESIGN_AGENCY', name: 'Design Agencies' },
  
  // Creative
  '70221': { code: 'CREATIVE', name: 'Creative Agencies' },
  '70229': { code: 'CREATIVE', name: 'Creative Agencies' },
  
  // Manufacturing
  '25110': { code: 'MANUF', name: 'Manufacturing' },
  '25120': { code: 'MANUF', name: 'Manufacturing' },
  
  // Retail
  '47110': { code: 'RETAIL', name: 'Retail' },
  '47190': { code: 'RETAIL', name: 'Retail' },
  
  // Wholesale
  '46420': { code: 'WHOLESALE', name: 'Wholesale' },
  '46430': { code: 'WHOLESALE', name: 'Wholesale' },
  
  // Financial Services
  '64190': { code: 'FIN_SERV', name: 'Financial Services' },
  '64999': { code: 'FIN_SERV', name: 'Financial Services' },
  
  // Charities & Education
  '85590': { code: 'CHARITY', name: 'Charities' },
  '85200': { code: 'EDUCATION', name: 'Education' },
};

export interface IndustryMapping {
  code: string;
  name: string;
  confidence: number;
}

export function resolveIndustryCode(sicCode: string | null | undefined, subSector?: string): IndustryMapping {
  if (!sicCode) {
    // Fallback to sub-sector hint
    if (subSector) {
      const lowerHint = subSector.toLowerCase();
      if (lowerHint.includes('software') || lowerHint.includes('digital') || lowerHint.includes('development')) {
        return { code: 'SOFTWARE_AGENCY', name: 'Software Development Agency', confidence: 85 };
      }
      if (lowerHint.includes('marketing') || lowerHint.includes('pr')) {
        return { code: 'MARKET', name: 'Marketing Agencies', confidence: 85 };
      }
    }
    return { code: 'CONSULT', name: 'General Consultancy', confidence: 50 };
  }
  
  // Direct SIC lookup
  const mapping = SIC_TO_INDUSTRY[sicCode];
  if (mapping) {
    return { ...mapping, confidence: 95 };
  }
  
  // Fallback to sub-sector hint
  if (subSector) {
    const lowerHint = subSector.toLowerCase();
    if (lowerHint.includes('software') || lowerHint.includes('digital') || lowerHint.includes('development')) {
      return { code: 'SOFTWARE_AGENCY', name: 'Software Development Agency', confidence: 85 };
    }
    if (lowerHint.includes('marketing') || lowerHint.includes('pr')) {
      return { code: 'MARKET', name: 'Marketing Agencies', confidence: 85 };
    }
  }
  
  // Default fallback
  return { code: 'CONSULT', name: 'General Consultancy', confidence: 50 };
}



