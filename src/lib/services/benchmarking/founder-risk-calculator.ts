// Founder Risk Calculator
// Calculates founder risk score based on HVA (Hidden Value Audit) data

export interface FounderRiskResult {
  score: number;        // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  valuationImpact: string;
}

export function calculateFounderRisk(hvaData: any): FounderRiskResult {
  let score = 0;
  const factors: string[] = [];
  
  // Extract responses if nested
  const responses = hvaData?.responses || hvaData || {};
  
  // Succession signals (highest weight)
  if (responses?.succession_your_role === 'Nobody') {
    score += 25;
    factors.push('No successor identified for founder role');
  } else if (responses?.succession_your_role === 'Need 6 months') {
    score += 15;
    factors.push('Successor needs 6 months to be ready');
  } else if (responses?.succession_your_role === 'Need 1 month') {
    score += 8;
    factors.push('Successor needs 1 month to be ready');
  }
  
  // Autonomy signals
  if (responses?.autonomy_finance === 'Would fail') {
    score += 15;
    factors.push('Finance function dependent on founder');
  } else if (responses?.autonomy_finance === 'Needs oversight') {
    score += 8;
  }
  
  if (responses?.autonomy_strategy === 'Would fail') {
    score += 12;
    factors.push('Strategy decisions require founder');
  } else if (responses?.autonomy_strategy === 'Needs oversight') {
    score += 6;
  }
  
  if (responses?.autonomy_sales === 'Would fail') {
    score += 12;
    factors.push('Sales process not delegated');
  } else if (responses?.autonomy_sales === 'Needs oversight') {
    score += 6;
    factors.push('Sales needs founder oversight');
  }
  
  // Key person risk signals
  if (responses?.risk_tech_lead === 'Crisis situation') {
    score += 12;
    factors.push('Technical capability at crisis risk');
  } else if (responses?.risk_tech_lead === 'Disrupted for weeks') {
    score += 7;
  }
  
  if (responses?.risk_sales_lead === 'Crisis situation') {
    score += 10;
  } else if (responses?.risk_sales_lead === 'Disrupted for weeks') {
    score += 6;
  }
  
  if (responses?.risk_finance_lead === 'Crisis situation') {
    score += 10;
  } else if (responses?.risk_finance_lead === 'Disrupted for weeks') {
    score += 6;
  }
  
  if (responses?.risk_operations_lead === 'Crisis situation') {
    score += 8;
  } else if (responses?.risk_operations_lead === 'Disrupted for weeks') {
    score += 5;
  }
  
  // Percentage-based factors
  const knowledgeDep = responses?.knowledge_dependency_percentage;
  if (knowledgeDep != null) {
    const dep = typeof knowledgeDep === 'string' ? parseFloat(knowledgeDep) : knowledgeDep;
    if (dep >= 80) {
      score += 15;
      factors.push(`${dep}% knowledge concentration (critical)`);
    } else if (dep >= 60) {
      score += 10;
      factors.push(`${dep}% knowledge concentrated in key person`);
    } else if (dep >= 40) {
      score += 5;
    }
  }
  
  const personalBrand = responses?.personal_brand_percentage;
  if (personalBrand != null) {
    const brand = typeof personalBrand === 'string' ? parseFloat(personalBrand) : personalBrand;
    if (brand >= 85) {
      score += 12;
      factors.push(`${brand}% brand tied to founder`);
    } else if (brand >= 70) {
      score += 8;
      factors.push(`${brand}% personal brand dependency`);
    } else if (brand >= 50) {
      score += 4;
    }
  }
  
  // Determine level and valuation impact
  let level: 'low' | 'medium' | 'high' | 'critical';
  let valuationImpact: string;
  
  if (score >= 60) {
    level = 'critical';
    valuationImpact = '30-50% valuation discount';
  } else if (score >= 40) {
    level = 'high';
    valuationImpact = '20-30% valuation discount';
  } else if (score >= 20) {
    level = 'medium';
    valuationImpact = '10-20% valuation discount';
  } else {
    level = 'low';
    valuationImpact = 'Minimal valuation impact';
  }
  
  return {
    score: Math.min(100, score),
    level,
    factors,
    valuationImpact
  };
}


