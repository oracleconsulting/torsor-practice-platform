import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// PASS 1: EXTRACTION & ANALYSIS (Sonnet)
// Compares client metrics to industry benchmarks
// Calculates percentile positions and annual £ impact
// Saves to bm_reports with status 'pass1_complete'
// Triggers Pass 2 automatically
// =============================================================================

function buildPass1Prompt(
  assessment: any,
  benchmarks: any[],
  maData: any | null,
  hvaData: any,
  clientName: string,
  industry: any
): string {
  // Format benchmarks for prompt
  const benchmarkDetails = benchmarks.map(b => {
    const metric = b.benchmark_metrics;
    return `
${metric?.name || b.metric_code} (${b.metric_code}):
  - P25: ${b.p25 ?? 'N/A'}
  - P50 (Median): ${b.p50 ?? 'N/A'}
  - P75: ${b.p75 ?? 'N/A'}
  - Sample: ${b.sample_size ?? 'Unknown'} businesses
  - Source: ${b.data_source || 'Unknown'}
`;
  }).join('\n');

  // Extract HVA (Hidden Value Audit) metrics - ALL clients have this
  const hvaMetricsText = hvaData ? `
HIDDEN VALUE AUDIT DATA (All clients complete this):
- Recurring Revenue %: ${hvaData.recurringRevenuePercent || 'N/A'}%
- Top 3 Customer Concentration: ${hvaData.customerConcentration || 'N/A'}%
- Knowledge Dependency: ${hvaData.knowledgeDependency || 'N/A'}%
- Personal vs Business Brand: ${hvaData.personalBrandPercent || 'N/A'}%
- Competitive Moat: ${hvaData.competitiveMoat || 'N/A'}
- Vacation Test: ${hvaData.vacationTest || 'N/A'}
- Succession Depth: ${hvaData.successionDepth || 'N/A'}
- Financial Documentation Quality: ${hvaData.financialDocumentation || 'N/A'}
- Exit Timeline: ${hvaData.exitTimeline || 'N/A'}
- IP Assets: ${hvaData.ipAssets || 'N/A'}
` : 'No HVA data available (unexpected - all clients should have this).';

  // Extract MA metrics if available
  const maMetricsText = maData ? `
FINANCIAL METRICS FROM MANAGEMENT ACCOUNTS:
- Revenue: £${maData.revenue?.toLocaleString() || 'N/A'}
- Gross Profit: £${maData.gross_profit?.toLocaleString() || 'N/A'} (${((maData.gross_profit / maData.revenue) * 100).toFixed(1)}%)
- Net Profit: £${maData.net_profit?.toLocaleString() || 'N/A'} (${((maData.net_profit / maData.revenue) * 100).toFixed(1)}%)
- Revenue per Employee: £${maData.revenue_per_employee?.toLocaleString() || 'N/A'}
- Debtor Days: ${maData.debtor_days || 'N/A'}
- Creditor Days: ${maData.creditor_days || 'N/A'}
` : 'No Management Accounts data available.';

  // Show enriched/derived metrics
  const enrichedMetricsText = assessment.derived_fields && assessment.derived_fields.length > 0 ? `
DERIVED METRICS (Calculated from available data):
${assessment.revenue_per_employee ? `- Revenue per Employee: £${assessment.revenue_per_employee.toLocaleString()} (calculated from revenue ÷ employees)` : ''}
${assessment.gross_margin ? `- Gross Margin: ${assessment.gross_margin}% (calculated from gross profit ÷ revenue)` : ''}
${assessment.net_margin ? `- Net Margin: ${assessment.net_margin}% (calculated from net profit ÷ revenue)` : ''}
${assessment.client_concentration_top3 ? `- Client Concentration (Top 3): ${assessment.client_concentration_top3}% (from HVA)` : ''}
${assessment._enriched_revenue ? `- Revenue: £${assessment._enriched_revenue.toLocaleString()} (extracted from assessment)` : ''}
${assessment._enriched_employee_count ? `- Employee Count: ${assessment._enriched_employee_count} (extracted from assessment)` : ''}
` : '';

  return `
You are a financial analyst preparing a benchmarking report for a UK business.

═══════════════════════════════════════════════════════════════════════════════
CLIENT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

BUSINESS: ${clientName}
INDUSTRY: ${industry?.name || assessment.industry_code} (${assessment.industry_code})
REVENUE BAND: ${assessment.revenue_band}
EMPLOYEES: ${assessment.employee_count}
LOCATION: ${assessment.location_type}

THEIR DESCRIPTION:
"${assessment.business_description}"

═══════════════════════════════════════════════════════════════════════════════
THEIR ASSESSMENT RESPONSES
═══════════════════════════════════════════════════════════════════════════════

PERFORMANCE PERCEPTION: ${assessment.performance_perception}
METRICS THEY TRACK: ${(assessment.current_tracking || []).join(', ')}
CURRENT COMPARISON METHOD: "${assessment.comparison_method}"

SUSPECTED UNDERPERFORMANCE: "${assessment.suspected_underperformance}"
WHERE THEY'RE LEAVING MONEY: "${assessment.leaving_money}"
TOP QUARTILE AMBITIONS: ${(assessment.top_quartile_ambition || []).join(', ')}
COMPETITOR ENVY: "${assessment.competitor_envy || 'Not specified'}"

MAGIC FIX: "${assessment.benchmark_magic_fix}"
ACTION READINESS: ${assessment.action_readiness}
BLIND SPOT FEAR: "${assessment.blind_spot_fear || 'Not specified'}"

═══════════════════════════════════════════════════════════════════════════════
HIDDEN VALUE AUDIT DATA (Standard metrics for all clients)
═══════════════════════════════════════════════════════════════════════════════

${hvaMetricsText || 'HVA data will be provided in context section below'}

═══════════════════════════════════════════════════════════════════════════════
CLIENT'S ACTUAL METRICS (from MA data if available)
═══════════════════════════════════════════════════════════════════════════════

${maMetricsText}

${enrichedMetricsText}

═══════════════════════════════════════════════════════════════════════════════
INDUSTRY BENCHMARKS
═══════════════════════════════════════════════════════════════════════════════

${benchmarkDetails}

${hvaContextSection}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Analyze this client against the benchmarks and produce a structured JSON output.

RULES:
1. Compare EVERY available metric (including derived/calculated metrics shown above)
2. Calculate percentile position for each (where client value falls between p25/p50/p75)
3. Quantify the annual £ impact of gaps (difference vs median × revenue)
4. Use their EXACT WORDS when referencing their concerns
5. Generate actionable admin guidance
6. Flag any data gaps that need collection

═══════════════════════════════════════════════════════════════════════════════
MINIMUM VIABLE ANALYSIS RULES - CRITICAL
═══════════════════════════════════════════════════════════════════════════════

You MUST produce quantified analysis if ANY of these conditions are met:

### Condition 1: Revenue + Headcount Available
If you have:
- Revenue (from any source: assessment, MA data, or derived)
- Employee count (from any source)

Then you MUST calculate:
- Revenue per employee = revenue ÷ employees (if not already provided)
- Compare to benchmark median
- Calculate gap: (benchmark_median - client_value) × employees = annual opportunity
- NEVER return £0 opportunity when revenue and headcount are available

### Condition 2: Revenue + Any Margin Available
If you have:
- Revenue
- Gross margin OR net margin (as % or absolute)

Then you MUST:
- Calculate margin % if given absolutes
- Compare to benchmark median
- Calculate gap: revenue × (benchmark_margin - client_margin) = annual opportunity

### Condition 3: Client Concentration Available
If you have:
- Top 3 customer % (from HVA: top3_customer_revenue_percentage or derived)

Then you MUST:
- Compare to benchmark median
- Assess concentration risk
- Note in narrative

### NEVER RETURN £0 OPPORTUNITY WHEN:
- Revenue data exists (derive what you can)
- At least 2 data points are available
- HVA provides supplementary metrics

### ALWAYS ACKNOWLEDGE LIMITATIONS:
If data is partial, clearly state:
- Which metrics were calculated vs. provided
- Which metrics could not be assessed
- What additional data would enable fuller analysis

Example partial analysis output:
"Based on available data (revenue £750,000, 8 employees), your revenue per 
head of £93,750 sits 35% below the industry median of £145,000. This 
suggests a potential £410,000 annual opportunity if efficiency reaches 
median levels. However, without utilisation rate and project margin data, 
we cannot pinpoint whether the gap stems from pricing, capacity, or 
project profitability issues."

OUTPUT FORMAT (JSON):
{
  "classification": {
    "industryCode": "${assessment.industry_code}",
    "industryConfidence": number,
    "revenueBand": "${assessment.revenue_band}",
    "employeeBand": "calculated_from_employee_count"
  },
  
  "metricsComparison": [
    {
      "metricCode": "string",
      "metricName": "string",
      "clientValue": number | null,
      "clientValueSource": "ma_data" | "assessment" | "calculated" | "missing",
      "p25": number,
      "p50": number,
      "p75": number,
      "percentile": number,
      "assessment": "top_10" | "top_quartile" | "above_median" | "below_median" | "bottom_quartile" | "bottom_10",
      "vsMedian": number,
      "vsTopQuartile": number,
      "annualImpact": number,
      "impactCalculation": "string explaining the calculation",
      "isPrimary": boolean
    }
  ],
  
  "overallPosition": {
    "percentile": number,
    "summary": "string",
    "strengthCount": number,
    "gapCount": number
  },
  
  "topStrengths": [
    {
      "metric": "string",
      "position": "string",
      "clientQuoteRelevant": "string or null",
      "implication": "string"
    }
  ],
  
  "topGaps": [
    {
      "metric": "string",
      "position": "string",
      "annualImpact": number,
      "clientQuoteRelevant": "string or null",
      "rootCauseHypothesis": "string"
    }
  ],
  
  "opportunitySizing": {
    "totalAnnualOpportunity": number,
    "breakdown": [
      {
        "metric": "string",
        "currentValue": number,
        "targetValue": number,
        "annualImpact": number,
        "difficulty": "easy" | "medium" | "hard",
        "timeframe": "string"
      }
    ]
  },
  
  "recommendations": [
    {
      "priority": number,
      "title": "string",
      "description": "string",
      "metricImpacted": "string",
      "expectedImprovement": number,
      "annualValue": number,
      "difficulty": "easy" | "medium" | "hard",
      "timeframe": "string",
      "linkedService": "string or null"
    }
  ],
  
  "adminGuidance": {
    "talkingPoints": [
      {
        "topic": "string",
        "point": "string",
        "clientQuoteToReference": "string",
        "dataPoint": "string",
        "importance": "critical" | "high" | "medium"
      }
    ],
    "questionsToAsk": [
      {
        "question": "string",
        "purpose": "string",
        "expectedInsight": "string",
        "followUp": "string"
      }
    ],
    "nextSteps": [
      {
        "action": "string",
        "owner": "practice" | "client" | "joint",
        "timing": "string",
        "outcome": "string",
        "priority": number
      }
    ],
    "tasks": [
      {
        "task": "string",
        "assignTo": "string",
        "dueDate": "string",
        "deliverable": "string"
      }
    ],
    "riskFlags": [
      {
        "flag": "string",
        "mitigation": "string",
        "severity": "high" | "medium" | "low"
      }
    ]
  },
  
  "dataGaps": [
    {
      "metric": "string",
      "needed": "string",
      "source": "string",
      "critical": boolean
    }
  ],
  
  "clientQuotes": {
    "suspectedUnderperformance": "${assessment.suspected_underperformance}",
    "leavingMoney": "${assessment.leaving_money}",
    "competitorEnvy": "${assessment.competitor_envy || ''}",
    "magicFix": "${assessment.benchmark_magic_fix}",
    "blindSpotFear": "${assessment.blind_spot_fear || ''}"
  }
}

IMPORTANT:
- Every gap must have a calculated £ annual impact
- Reference their exact words in talking points
- Recommendations must link to specific metrics
- Flag gaps in their data that would improve the analysis
- Percentile calculation: Use linear interpolation between percentiles if client value falls between p25/p50/p75

Return ONLY valid JSON.
`;
}

function calculateEmployeeBand(employeeCount: number): string {
  if (employeeCount <= 5) return '1_5';
  if (employeeCount <= 10) return '6_10';
  if (employeeCount <= 25) return '11_25';
  if (employeeCount <= 50) return '26_50';
  if (employeeCount <= 100) return '51_100';
  return '100_plus';
}

/**
 * Extract benchmarkable metrics from HVA data
 */
function extractHVAMetrics(hvaData: any): Record<string, number> {
  const metrics: Record<string, number> = {};
  const hva = hvaData?.responses || {};
  
  // Client concentration (Top 3 customers as % of revenue)
  if (hva.top3_customer_revenue_percentage != null) {
    metrics.client_concentration_top3 = parseFloat(hva.top3_customer_revenue_percentage);
  }
  
  // Knowledge dependency
  if (hva.knowledge_dependency_percentage != null) {
    metrics.knowledge_concentration = parseFloat(hva.knowledge_dependency_percentage);
  }
  
  // Personal brand dependency
  if (hva.personal_brand_percentage != null) {
    metrics.founder_brand_dependency = parseFloat(hva.personal_brand_percentage);
  }
  
  // Team advocacy
  if (hva.team_advocacy_percentage != null) {
    metrics.team_advocacy_score = parseFloat(hva.team_advocacy_percentage);
  }
  
  // Tech stack health
  if (hva.tech_stack_health_percentage != null) {
    metrics.tech_health_score = parseFloat(hva.tech_stack_health_percentage);
  }
  
  return metrics;
}

/**
 * Calculate founder risk score from HVA data
 */
function calculateFounderRisk(hvaData: any): any {
  const hva = hvaData?.responses || {};
  const riskFactors: any[] = [];
  let totalPoints = 0;
  
  // Succession signals (highest weight)
  const successionWeights: Record<string, Record<string, { points: number; severity: string }>> = {
    succession_your_role: {
      'Nobody': { points: 25, severity: 'critical' },
      'Need 6 months': { points: 15, severity: 'high' },
      'Need 1 month': { points: 8, severity: 'medium' },
      'Ready now': { points: 0, severity: 'low' }
    },
    succession_sales: {
      'Nobody': { points: 10, severity: 'high' },
      'Need 6 months': { points: 6, severity: 'medium' },
      'Need 1 month': { points: 3, severity: 'low' },
      'Ready now': { points: 0, severity: 'low' }
    },
    succession_technical: {
      'Nobody': { points: 12, severity: 'critical' },
      'Need 6 months': { points: 7, severity: 'high' },
      'Need 1 month': { points: 4, severity: 'medium' },
      'Ready now': { points: 0, severity: 'low' }
    },
    succession_operations: {
      'Nobody': { points: 8, severity: 'high' },
      'Need 6 months': { points: 5, severity: 'medium' },
      'Need 1 month': { points: 2, severity: 'low' },
      'Ready now': { points: 0, severity: 'low' }
    },
    succession_customer: {
      'Nobody': { points: 8, severity: 'high' },
      'Need 6 months': { points: 5, severity: 'medium' },
      'Need 1 month': { points: 2, severity: 'low' },
      'Ready now': { points: 0, severity: 'low' }
    }
  };
  
  // Autonomy signals
  const autonomyWeights: Record<string, Record<string, { points: number; severity: string }>> = {
    autonomy_finance: {
      'Would fail': { points: 15, severity: 'critical' },
      'Needs oversight': { points: 8, severity: 'medium' },
      'Runs independently': { points: 0, severity: 'low' }
    },
    autonomy_strategy: {
      'Would fail': { points: 12, severity: 'high' },
      'Needs oversight': { points: 6, severity: 'medium' },
      'Runs independently': { points: 0, severity: 'low' }
    },
    autonomy_sales: {
      'Would fail': { points: 12, severity: 'high' },
      'Needs oversight': { points: 6, severity: 'medium' },
      'Runs independently': { points: 0, severity: 'low' }
    },
    autonomy_delivery: {
      'Would fail': { points: 10, severity: 'high' },
      'Needs oversight': { points: 5, severity: 'medium' },
      'Runs independently': { points: 0, severity: 'low' }
    }
  };
  
  // Key person risk signals
  const riskWeights: Record<string, Record<string, { points: number; severity: string }>> = {
    risk_sales_lead: {
      'Crisis situation': { points: 10, severity: 'high' },
      'Disrupted for weeks': { points: 6, severity: 'medium' },
      'Disrupted for days': { points: 3, severity: 'low' },
      'Business fine': { points: 0, severity: 'low' }
    },
    risk_finance_lead: {
      'Crisis situation': { points: 10, severity: 'high' },
      'Disrupted for weeks': { points: 6, severity: 'medium' },
      'Disrupted for days': { points: 3, severity: 'low' },
      'Business fine': { points: 0, severity: 'low' }
    },
    risk_tech_lead: {
      'Crisis situation': { points: 12, severity: 'critical' },
      'Disrupted for weeks': { points: 7, severity: 'medium' },
      'Disrupted for days': { points: 3, severity: 'low' },
      'Business fine': { points: 0, severity: 'low' }
    }
  };
  
  // Check succession signals
  for (const [field, weights] of Object.entries(successionWeights)) {
    const value = hva[field];
    if (value && weights[value]) {
      const { points, severity } = weights[value];
      if (points > 0) {
        totalPoints += points;
        riskFactors.push({
          category: 'Succession Planning',
          signal: `${field.replace('succession_', '').replace('_', ' ')}: ${value}`,
          severity,
          points,
          hvaField: field,
          hvaValue: value
        });
      }
    }
  }
  
  // Check autonomy signals
  for (const [field, weights] of Object.entries(autonomyWeights)) {
    const value = hva[field];
    if (value && weights[value]) {
      const { points, severity } = weights[value];
      if (points > 0) {
        totalPoints += points;
        riskFactors.push({
          category: 'Operational Autonomy',
          signal: `${field.replace('autonomy_', '').replace('_', ' ')}: ${value}`,
          severity,
          points,
          hvaField: field,
          hvaValue: value
        });
      }
    }
  }
  
  // Check key person risk signals
  for (const [field, weights] of Object.entries(riskWeights)) {
    const value = hva[field];
    if (value && weights[value]) {
      const { points, severity } = weights[value];
      if (points > 0) {
        totalPoints += points;
        riskFactors.push({
          category: 'Key Person Risk',
          signal: `${field.replace('risk_', '').replace('_', ' ')}: ${value}`,
          severity,
          points,
          hvaField: field,
          hvaValue: value
        });
      }
    }
  }
  
  // Percentage-based risk factors
  const kd = hva.knowledge_dependency_percentage;
  if (kd != null) {
    if (kd >= 80) {
      totalPoints += 15;
      riskFactors.push({
        category: 'Knowledge Concentration',
        signal: `${kd}% of critical knowledge held by founder/key person`,
        severity: 'critical',
        points: 15,
        hvaField: 'knowledge_dependency_percentage',
        hvaValue: `${kd}%`
      });
    } else if (kd >= 60) {
      totalPoints += 10;
      riskFactors.push({
        category: 'Knowledge Concentration',
        signal: `${kd}% of critical knowledge concentrated`,
        severity: 'high',
        points: 10,
        hvaField: 'knowledge_dependency_percentage',
        hvaValue: `${kd}%`
      });
    } else if (kd >= 40) {
      totalPoints += 5;
      riskFactors.push({
        category: 'Knowledge Concentration',
        signal: `${kd}% knowledge dependency`,
        severity: 'medium',
        points: 5,
        hvaField: 'knowledge_dependency_percentage',
        hvaValue: `${kd}%`
      });
    }
  }
  
  const pb = hva.personal_brand_percentage;
  if (pb != null) {
    if (pb >= 85) {
      totalPoints += 12;
      riskFactors.push({
        category: 'Brand Dependency',
        signal: `${pb}% of brand value tied to founder personally`,
        severity: 'critical',
        points: 12,
        hvaField: 'personal_brand_percentage',
        hvaValue: `${pb}%`
      });
    } else if (pb >= 70) {
      totalPoints += 8;
      riskFactors.push({
        category: 'Brand Dependency',
        signal: `${pb}% personal brand dependency`,
        severity: 'high',
        points: 8,
        hvaField: 'personal_brand_percentage',
        hvaValue: `${pb}%`
      });
    } else if (pb >= 50) {
      totalPoints += 4;
      riskFactors.push({
        category: 'Brand Dependency',
        signal: `${pb}% brand tied to individual`,
        severity: 'medium',
        points: 4,
        hvaField: 'personal_brand_percentage',
        hvaValue: `${pb}%`
      });
    }
  }
  
  // Determine risk level
  let riskLevel: string;
  let valuationImpact: string;
  
  if (totalPoints >= 60) {
    riskLevel = 'critical';
    valuationImpact = '30-50% valuation discount';
  } else if (totalPoints >= 40) {
    riskLevel = 'high';
    valuationImpact = '20-30% valuation discount';
  } else if (totalPoints >= 20) {
    riskLevel = 'medium';
    valuationImpact = '10-20% valuation discount';
  } else {
    riskLevel = 'low';
    valuationImpact = 'Minimal valuation impact';
  }
  
  // Assess succession readiness
  const successionFields = [
    { field: 'succession_sales', role: 'Sales' },
    { field: 'succession_technical', role: 'Technical' },
    { field: 'succession_operations', role: 'Operations' },
    { field: 'succession_customer', role: 'Customer' },
    { field: 'succession_your_role', role: 'Founder/CEO' }
  ];
  
  const roleGaps: string[] = [];
  const readyRoles: string[] = [];
  
  for (const { field, role } of successionFields) {
    const value = hva[field];
    if (value === 'Ready now') {
      readyRoles.push(role);
    } else if (value === 'Nobody' || value === 'Need 6 months' || !value) {
      roleGaps.push(`${role}: ${value || 'Not assessed'}`);
    }
  }
  
  let successionReadiness: string = 'partial';
  let timeToReady = '3-6 months';
  
  if (roleGaps.length === 0 && readyRoles.length >= 4) {
    successionReadiness = 'ready';
    timeToReady = 'Ready now';
  } else if (roleGaps.length >= 4 || hva.succession_your_role === 'Nobody') {
    successionReadiness = 'none';
    timeToReady = '12-24 months';
  } else if (roleGaps.length >= 2) {
    timeToReady = '6-12 months';
  }
  
  // Sort risk factors by severity
  riskFactors.sort((a, b) => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  return {
    overallScore: Math.min(100, totalPoints),
    riskLevel,
    riskFactors: riskFactors.slice(0, 10), // Top 10 risk factors
    successionReadiness: {
      overallReadiness: successionReadiness,
      roleGaps,
      readyRoles,
      timeToReady
    },
    valuationImpact
  };
}

/**
 * Extract narrative quotes from HVA data
 */
function extractNarrativeQuotes(hvaData: any): any[] {
  const quotes: any[] = [];
  const hva = hvaData?.responses || {};
  
  // Context quotes
  if (hva.bm_business_description || hva.business_description) {
    quotes.push({
      category: 'context',
      field: 'Business Description',
      value: hva.bm_business_description || hva.business_description,
      useCase: 'Opening paragraph - establish what the business does',
      priority: 1
    });
  }
  
  // Strength quotes
  if (hva.unique_methods) {
    quotes.push({
      category: 'strength',
      field: 'Unique Methods',
      value: hva.unique_methods,
      useCase: 'Strength narrative - competitive differentiation',
      priority: 2
    });
  }
  
  if (hva.competitive_moat) {
    quotes.push({
      category: 'strength',
      field: 'Competitive Moat',
      value: hva.competitive_moat,
      useCase: 'Strength narrative - defensibility factors',
      priority: 2
    });
  }
  
  // Gap quotes
  if (hva.bm_leaving_money) {
    quotes.push({
      category: 'gap',
      field: 'Leaving Money',
      value: hva.bm_leaving_money,
      useCase: 'Gap narrative - self-identified revenue leakage',
      priority: 1
    });
  }
  
  if (hva.bm_suspected_underperformance) {
    quotes.push({
      category: 'gap',
      field: 'Suspected Underperformance',
      value: hva.bm_suspected_underperformance,
      useCase: 'Gap narrative - performance concerns',
      priority: 1
    });
  }
  
  if (hva.critical_processes_undocumented) {
    quotes.push({
      category: 'gap',
      field: 'Undocumented Processes',
      value: hva.critical_processes_undocumented,
      useCase: 'Gap narrative - knowledge capture risk',
      priority: 2
    });
  }
  
  // Fear quotes
  if (hva.bm_blind_spot_fear) {
    quotes.push({
      category: 'fear',
      field: 'Blind Spot Fear',
      value: hva.bm_blind_spot_fear,
      useCase: 'Executive summary - address core anxiety',
      priority: 1
    });
  }
  
  // Aspiration quotes
  if (hva.bm_top_quartile_ambition) {
    quotes.push({
      category: 'aspiration',
      field: 'Top Quartile Ambition',
      value: Array.isArray(hva.bm_top_quartile_ambition) 
        ? hva.bm_top_quartile_ambition.join(', ')
        : hva.bm_top_quartile_ambition,
      useCase: 'Recommendation framing - align to stated goals',
      priority: 2
    });
  }
  
  if (hva.bm_benchmark_magic_fix) {
    quotes.push({
      category: 'aspiration',
      field: 'Magic Fix',
      value: hva.bm_benchmark_magic_fix,
      useCase: 'Recommendation prioritization - address stated priority',
      priority: 1
    });
  }
  
  quotes.sort((a, b) => a.priority - b.priority);
  return quotes;
}

/**
 * Format quotes for AI prompt
 */
function formatQuotesForPrompt(quotes: any[]): string {
  const sections: Record<string, any[]> = {
    context: [],
    strength: [],
    gap: [],
    fear: [],
    aspiration: []
  };
  
  for (const quote of quotes) {
    if (sections[quote.category]) {
      sections[quote.category].push(quote);
    }
  }
  
  let output = '## CLIENT QUOTES FOR NARRATIVE (use verbatim where appropriate)\n\n';
  
  if (sections.context.length > 0) {
    output += '### Business Context\n';
    for (const q of sections.context) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  if (sections.fear.length > 0) {
    output += '### Client Fears/Concerns (address these directly)\n';
    for (const q of sections.fear) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  if (sections.gap.length > 0) {
    output += '### Self-Identified Gaps (validate with benchmarks)\n';
    for (const q of sections.gap) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  if (sections.strength.length > 0) {
    output += '### Strengths/Differentiation (acknowledge in narrative)\n';
    for (const q of sections.strength) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  if (sections.aspiration.length > 0) {
    output += '### Goals/Aspirations (frame recommendations against)\n';
    for (const q of sections.aspiration) {
      output += `- **${q.field}**: "${q.value}"\n`;
    }
    output += '\n';
  }
  
  return output;
}

/**
 * Enrich benchmark data by calculating derived metrics from available raw data
 */
function enrichBenchmarkData(assessmentData: any, hvaData: any): any {
  const enriched = { ...assessmentData };
  const derivedFields: string[] = [];
  
  // Extract revenue from multiple possible field names
  const revenue = 
    parseFloat(assessmentData.responses?.bm_revenue_exact) ||
    parseFloat(assessmentData.responses?.revenue) ||
    parseFloat(assessmentData.responses?.annual_revenue) ||
    parseFloat(assessmentData.responses?.turnover) ||
    assessmentData.revenue;
  
  // Extract employee count from multiple possible field names
  const employeeCount = 
    parseFloat(assessmentData.responses?.bm_employee_count) ||
    parseFloat(assessmentData.responses?.employee_count) ||
    parseFloat(assessmentData.responses?.headcount) ||
    parseFloat(assessmentData.responses?.team_size) ||
    assessmentData.employee_count;
  
  // Calculate Revenue per Employee
  if (revenue && employeeCount && !enriched.revenue_per_employee) {
    enriched.revenue_per_employee = Math.round(revenue / employeeCount);
    derivedFields.push('revenue_per_employee');
    console.log(`[BM Pass 1] Calculated revenue_per_employee: £${enriched.revenue_per_employee} (from £${revenue} ÷ ${employeeCount})`);
  }
  
  // Extract gross profit and calculate gross margin
  const grossProfit = 
    parseFloat(assessmentData.responses?.gross_profit) ||
    assessmentData.gross_profit;
  
  if (revenue && grossProfit && !enriched.gross_margin) {
    enriched.gross_margin = Number(((grossProfit / revenue) * 100).toFixed(1));
    derivedFields.push('gross_margin');
    console.log(`[BM Pass 1] Calculated gross_margin: ${enriched.gross_margin}%`);
  }
  
  // Extract net profit and calculate net margin
  const netProfit = 
    parseFloat(assessmentData.responses?.net_profit) ||
    assessmentData.net_profit;
  
  if (revenue && netProfit && !enriched.net_margin) {
    enriched.net_margin = Number(((netProfit / revenue) * 100).toFixed(1));
    derivedFields.push('net_margin');
    console.log(`[BM Pass 1] Calculated net_margin: ${enriched.net_margin}%`);
  }
  
  // Pull client concentration from HVA (will be merged with other HVA metrics later)
  if (hvaData?.responses?.top3_customer_revenue_percentage != null) {
    enriched.client_concentration_top3 = parseFloat(hvaData.responses.top3_customer_revenue_percentage);
    derivedFields.push('client_concentration_top3 (from HVA)');
    console.log(`[BM Pass 1] Extracted client_concentration_top3 from HVA: ${enriched.client_concentration_top3}%`);
  }
  
  enriched.derived_fields = derivedFields;
  enriched._enriched_revenue = revenue;
  enriched._enriched_employee_count = employeeCount;
  
  return enriched;
}

/**
 * Map SIC code to industry code with fallbacks
 */
function resolveIndustryFromSIC(sicCode: string, subSectorHint?: string, businessDescription?: string): string | null {
  const sicMap: Record<string, string> = {
    // Technology - CRITICAL FIX (SIC 62020 = IT consultancy = Software Development Agency)
    '62020': 'AGENCY_DEV', // IT consultancy activities - maps to Software Development Agency (AGENCY_DEV in database)
    '62012': 'AGENCY_DEV', // Business software development
    '62011': 'SAAS', // Ready-made software (SaaS products)
    '62090': 'AGENCY_DEV', // Other IT service activities
    '62030': 'ITSERV', // Computer facilities management
    
    // Professional Services
    '69201': 'ACCT',
    '69202': 'ACCT',
    '69101': 'LEGAL',
    '69102': 'LEGAL',
    '69109': 'LEGAL',
    '70229': 'CONSULT',
    '70210': 'CONSULT',
    '78109': 'RECRUIT',
    '78200': 'RECRUIT',
    '78300': 'RECRUIT',
    '73110': 'MARKET',
    '73120': 'MARKET',
    
    // Healthcare
    '86230': 'DENTAL',
    '75000': 'VET',
    '86210': 'PRIVATE_HEALTH',
    '86220': 'PRIVATE_HEALTH',
    '87100': 'CARE',
    '87200': 'CARE',
    '87300': 'CARE',
    '47730': 'PHARMA',
    '93130': 'FITNESS',
    
    // Hospitality
    '56101': 'RESTAURANT',
    '56102': 'RESTAURANT',
    '56210': 'CATERING',
    '56301': 'PUB',
    '55100': 'HOTEL',
    
    // Construction
    '41100': 'CONST_MAIN',
    '41201': 'CONST_MAIN',
    '41202': 'CONST_MAIN',
    '43210': 'TRADES',
    '43220': 'TRADES',
    '43310': 'CONST_SPEC',
    '68310': 'ESTATE',
    '68320': 'PROP_MGMT',
    
    // Retail
    '47110': 'RETAIL_FOOD',
    '47190': 'RETAIL_GEN',
    '45111': 'AUTO_RETAIL',
    '45112': 'AUTO_RETAIL',
    
    // Manufacturing
    '18110': 'PRINT',
    '25620': 'MFG_PREC',
    
    // Wholesale
    '49410': 'LOGISTICS',
    '52290': 'LOGISTICS',
    
    // Financial
    '66190': 'IFA',
    '66220': 'INSURANCE',
    
    // Creative
    '74100': 'DESIGN',
    '74201': 'PHOTO',
    
    // Other
    '79110': 'TRAVEL_AGENT',
    '80100': 'SECURITY',
    '81210': 'CLEANING',
    '96020': 'PERSONAL',
  };
  
  // Direct SIC lookup
  if (sicCode && sicMap[sicCode]) {
    console.log(`[BM Pass 1] Mapped SIC ${sicCode} to industry: ${sicMap[sicCode]}`);
    return sicMap[sicCode];
  }
  
  // Fallback: Check sub-sector hint
  if (subSectorHint) {
    const lowerHint = subSectorHint.toLowerCase();
    if (lowerHint.includes('software') || lowerHint.includes('development') || lowerHint.includes('digital agency')) {
      return 'AGENCY_DEV';
    }
    if (lowerHint.includes('marketing') || lowerHint.includes('pr ') || lowerHint.includes('advertising')) {
      return 'MARKET';
    }
    if (lowerHint.includes('design') || lowerHint.includes('creative')) {
      return 'DESIGN';
    }
  }
  
  // Fallback: Check business description
  if (businessDescription) {
    const lowerDesc = businessDescription.toLowerCase();
    if ((lowerDesc.includes('web') || lowerDesc.includes('digital')) && 
        (lowerDesc.includes('agency') || lowerDesc.includes('consultancy'))) {
      return 'AGENCY_DEV';
    }
  }
  
  return null;
}

/**
 * Dynamically determine industry code from SIC codes and business description
 * Returns industry code if found, null otherwise
 */
async function detectIndustryFromContext(
  supabaseClient: any,
  sicCodes: string[] | null | undefined,
  businessDescription: string | null | undefined
): Promise<string | null> {
  // First try: Match SIC codes to industries
  if (sicCodes && sicCodes.length > 0) {
    // Clean SIC codes (remove any formatting)
    const cleanSicCodes = sicCodes.map(code => code.trim().replace(/[^0-9]/g, ''));
    
    // Query all active industries first (more efficient than multiple queries)
    const { data: allIndustries, error: industriesError } = await supabaseClient
      .from('industries')
      .select('code, name, sic_codes')
      .eq('is_active', true);
    
    if (industriesError || !allIndustries) {
      console.warn('[BM Pass 1] Could not fetch industries for SIC code matching');
      return null;
    }
    
    // Match SIC codes to industries
    for (const sicCode of cleanSicCodes) {
      if (!sicCode || sicCode.length < 5) continue; // Skip invalid SIC codes
      
      // Find industry where sic_codes array contains this SIC code
      const matchedIndustry = allIndustries.find((ind: any) => 
        ind.sic_codes && Array.isArray(ind.sic_codes) && ind.sic_codes.includes(sicCode)
      );
      
      if (matchedIndustry) {
        console.log(`[BM Pass 1] Matched SIC code ${sicCode} to industry: ${matchedIndustry.code} (${matchedIndustry.name})`);
        return matchedIndustry.code;
      }
    }
  }
  
  // Second try: Use AI to classify business description
  if (businessDescription && businessDescription.trim().length > 20) {
    try {
      console.log('[BM Pass 1] Attempting AI classification from business description...');
      
      // Get all active industries with their keywords for context
      const { data: allIndustries, error: industriesError } = await supabaseClient
        .from('industries')
        .select('code, name, category, keywords')
        .eq('is_active', true);
      
      if (industriesError || !allIndustries || allIndustries.length === 0) {
        console.warn('[BM Pass 1] Could not fetch industries for AI classification');
        return null;
      }
      
      // Create a simple mapping of industries for the AI
      const industryList = allIndustries.map((ind: any) => ({
        code: ind.code,
        name: ind.name,
        category: ind.category,
        keywords: ind.keywords || []
      }));
      
      // Use OpenRouter to classify
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
          'HTTP-Referer': Deno.env.get('OPENROUTER_REFERRER_URL') || '',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4-20250514',
          messages: [{
            role: 'user',
            content: `Based on this business description, determine the most appropriate industry code from the list below.

Business Description:
"${businessDescription}"

Available Industries:
${industryList.map((ind: any) => `- ${ind.code}: ${ind.name} (Category: ${ind.category})${ind.keywords.length > 0 ? ` [Keywords: ${ind.keywords.join(', ')}]` : ''}`).join('\n')}

Respond with ONLY the industry code (e.g., "AGENCY_DEV" or "CONSULT"). Do not include any explanation or formatting.`
          }],
          temperature: 0.3,
          max_tokens: 20,
        }),
      });
      
      if (!response.ok) {
        console.warn('[BM Pass 1] AI classification request failed:', response.status);
        return null;
      }
      
      const result = await response.json();
      const classifiedCode = result.choices?.[0]?.message?.content?.trim().toUpperCase();
      
      if (classifiedCode) {
        // Verify the code exists in our industries
        const { data: verifiedIndustry } = await supabaseClient
          .from('industries')
          .select('code, name')
          .eq('code', classifiedCode)
          .eq('is_active', true)
          .maybeSingle();
        
        if (verifiedIndustry) {
          console.log(`[BM Pass 1] AI classified business description to industry: ${classifiedCode} (${verifiedIndustry.name})`);
          return classifiedCode;
        } else {
          console.warn(`[BM Pass 1] AI returned invalid industry code: ${classifiedCode}`);
        }
      }
    } catch (error) {
      console.warn('[BM Pass 1] Error in AI classification:', error);
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[BM Pass 1] Starting extraction for:', engagementId);
    
    // Fetch engagement and assessment first (they can be done in parallel)
    const [
      { data: engagement, error: engagementError },
      { data: assessment, error: assessmentError }
    ] = await Promise.all([
      supabaseClient.from('bm_engagements').select('*, clients:client_id(*)').eq('id', engagementId).single(),
      supabaseClient.from('bm_assessment_responses').select('*').eq('engagement_id', engagementId).single()
    ]);
    
    if (engagementError || !engagement) {
      throw new Error(`Failed to fetch engagement: ${engagementError?.message || 'Not found'}`);
    }
    
    if (assessmentError || !assessment) {
      throw new Error(`Failed to fetch assessment: ${assessmentError?.message || 'Not found'}`);
    }
    
    // Extract industry_code from assessment responses (could be in responses JSONB or individual column)
    let industryCode = assessment.industry_code || assessment.responses?.industry_code;
    
    console.log('[BM Pass 1] Extracted industry_code from assessment:', industryCode);
    console.log('[BM Pass 1] Assessment structure:', {
      has_industry_code: !!assessment.industry_code,
      has_responses: !!assessment.responses,
      responses_industry_code: assessment.responses?.industry_code,
      responses_keys: assessment.responses ? Object.keys(assessment.responses) : []
    });
    
    // If industry_code is missing, try to detect it from SIC codes and business description
    if (!industryCode || industryCode === 'undefined' || industryCode === 'null') {
      console.log('[BM Pass 1] Industry code not found in assessment. Attempting dynamic detection from context...');
      
      // Get business description - check both top level and responses with bm_ prefix
      const businessDescription = 
        assessment.business_description || 
        assessment.responses?.business_description ||
        assessment.responses?.bm_business_description;
      
      console.log('[BM Pass 1] Business description found:', !!businessDescription);
      
      // Get SIC codes - check multiple locations
      let sicCodes: string[] | null = null;
      
      // First check assessment responses (with bm_ prefix)
      const sicCodeFromAssessment = assessment.responses?.bm_sic_code || assessment.responses?.sic_code;
      const subSectorHint = assessment.responses?.bm_sub_sector;
      
      // Try SIC code mapping first (faster and more accurate)
      if (sicCodeFromAssessment) {
        const mappedIndustry = resolveIndustryFromSIC(
          sicCodeFromAssessment,
          subSectorHint,
          businessDescription
        );
        
        if (mappedIndustry) {
          // Verify the industry exists in database
          const { data: verifiedIndustry } = await supabaseClient
            .from('industries')
            .select('code, name')
            .eq('code', mappedIndustry)
            .eq('is_active', true)
            .maybeSingle();
          
          if (verifiedIndustry) {
            console.log(`[BM Pass 1] Mapped SIC ${sicCodeFromAssessment} to industry: ${mappedIndustry} (${verifiedIndustry.name})`);
            industryCode = mappedIndustry;
          }
        }
      }
      
      // If SIC mapping didn't work, try full context detection
      if (!industryCode || industryCode === 'undefined' || industryCode === 'null') {
        let sicCodes: string[] | null = null;
        
        if (sicCodeFromAssessment) {
          sicCodes = Array.isArray(sicCodeFromAssessment) ? sicCodeFromAssessment : [sicCodeFromAssessment];
          console.log('[BM Pass 1] SIC mapping failed, trying full context detection with SIC:', sicCodes);
        }
        
        // If not in assessment, try client data
        if (!sicCodes && engagement.client_id) {
          const { data: client } = await supabaseClient
            .from('practice_members')
            .select('sic_codes, metadata')
            .eq('id', engagement.client_id)
            .maybeSingle();
          
          // SIC codes might be in sic_codes column or metadata JSONB
          const clientSicCodes = client?.sic_codes || client?.metadata?.sic_codes;
          if (clientSicCodes) {
            sicCodes = Array.isArray(clientSicCodes) ? clientSicCodes : [clientSicCodes];
            console.log('[BM Pass 1] Found SIC codes from client:', sicCodes);
          }
        }
        
        // Attempt dynamic detection
        const detectedIndustryCode = await detectIndustryFromContext(
          supabaseClient,
          sicCodes,
          businessDescription
        );
        
        if (detectedIndustryCode) {
          console.log(`[BM Pass 1] Successfully detected industry code: ${detectedIndustryCode}`);
          industryCode = detectedIndustryCode;
        } else {
          console.error('[BM Pass 1] Could not detect industry code from context. Full assessment:', JSON.stringify(assessment, null, 2));
          throw new Error(`Industry code is required but not found in assessment and could not be determined from SIC codes or business description. engagementId: ${engagementId}. SIC code: ${sicCodes?.join(', ') || 'none'}, Business description: ${businessDescription ? 'present' : 'missing'}. Please ensure the assessment has an industry selected or the client has SIC codes/business description.`);
        }
      }
    }
    
    // Now fetch industry using the industry_code from assessment
    const { data: industry, error: industryError } = await supabaseClient
      .from('industries')
      .select('*')
      .eq('code', industryCode)
      .maybeSingle();
    
    if (industryError) {
      console.warn('[BM Pass 1] Warning: Failed to fetch industry:', industryError.message);
    }
    
    if (!industry) {
      console.warn('[BM Pass 1] Warning: Industry not found for code:', industryCode);
    }
    
    // Get client name
    let clientName = 'the business';
    if (engagement.client_id) {
      const { data: client } = await supabaseClient
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || client?.name || 'the business';
    }
    
    // Extract assessment fields - they might be in responses JSONB or individual columns
    // Note: responses use bm_ prefix (e.g., bm_revenue_band, bm_employee_count)
    // Use industryCode we already validated above
    const rawAssessmentData = {
      industry_code: industryCode,
      revenue_band: assessment.revenue_band || assessment.responses?.revenue_band || assessment.responses?.bm_revenue_band,
      employee_count: assessment.employee_count || assessment.responses?.employee_count || assessment.responses?.bm_employee_count,
      location_type: assessment.location_type || assessment.responses?.location_type || assessment.responses?.bm_location_type,
      business_description: assessment.business_description || assessment.responses?.business_description || assessment.responses?.bm_business_description,
      performance_perception: assessment.performance_perception || assessment.responses?.performance_perception,
      current_tracking: assessment.current_tracking || assessment.responses?.current_tracking,
      comparison_method: assessment.comparison_method || assessment.responses?.comparison_method,
      suspected_underperformance: assessment.suspected_underperformance || assessment.responses?.suspected_underperformance,
      leaving_money: assessment.leaving_money || assessment.responses?.leaving_money,
      top_quartile_ambition: assessment.top_quartile_ambition || assessment.responses?.top_quartile_ambition,
      competitor_envy: assessment.competitor_envy || assessment.responses?.competitor_envy,
      benchmark_magic_fix: assessment.benchmark_magic_fix || assessment.responses?.benchmark_magic_fix,
      action_readiness: assessment.action_readiness || assessment.responses?.action_readiness,
      blind_spot_fear: assessment.blind_spot_fear || assessment.responses?.blind_spot_fear,
      responses: assessment.responses, // Keep full responses for enrichment
    };
    
    // Get HVA data first (needed for enrichment)
    const { data: hvaData } = await supabaseClient
      .from('client_assessments')
      .select('responses, value_analysis_data')
      .eq('client_id', engagement.client_id)
      .eq('assessment_type', 'part3')
      .maybeSingle();
    
    // ENRICH DATA: Calculate derived metrics
    const assessmentData = enrichBenchmarkData(rawAssessmentData, hvaData);
    
    console.log('[BM Pass 1] Data enrichment complete:', {
      derived_fields: assessmentData.derived_fields,
      revenue: assessmentData._enriched_revenue,
      employee_count: assessmentData._enriched_employee_count,
      revenue_per_employee: assessmentData.revenue_per_employee,
      gross_margin: assessmentData.gross_margin,
      client_concentration: assessmentData.client_concentration_top3
    });
    
    // Get benchmarks for this industry/size
    const employeeBand = calculateEmployeeBand(assessmentData._enriched_employee_count || assessmentData.employee_count || 0);
    const { data: benchmarks } = await supabaseClient
      .from('benchmark_data')
      .select(`
        *,
        benchmark_metrics (*)
      `)
      .eq('industry_code', assessmentData.industry_code)
      .or(`revenue_band.eq.${assessmentData.revenue_band},revenue_band.eq.all`)
      .or(`employee_band.eq.${employeeBand},employee_band.eq.all`)
      .eq('is_current', true);
    
    // ═══════════════════════════════════════════════════════════════
    // HVA INTEGRATION: Extract metrics, calculate risk, extract quotes
    // ═══════════════════════════════════════════════════════════════
    
    let hvaMetricsForBenchmarking: Record<string, number> = {};
    let founderRisk: any = null;
    let hvaQuotes: any[] = [];
    let hvaContextSection = '';
    
    if (hvaData) {
      // Extract benchmarkable metrics from HVA
      hvaMetricsForBenchmarking = extractHVAMetrics(hvaData);
      console.log('[BM Pass 1] Extracted HVA metrics:', Object.keys(hvaMetricsForBenchmarking));
      
      // Calculate founder risk score
      founderRisk = calculateFounderRisk(hvaData);
      console.log('[BM Pass 1] Founder risk calculated:', {
        score: founderRisk.overallScore,
        level: founderRisk.riskLevel,
        valuationImpact: founderRisk.valuationImpact
      });
      
      // Extract narrative quotes
      hvaQuotes = extractNarrativeQuotes(hvaData);
      console.log('[BM Pass 1] Extracted narrative quotes:', hvaQuotes.length);
      
      // Build HVA context section for prompt
      const founderRiskSection = `
**Overall Risk Level**: ${founderRisk.riskLevel.toUpperCase()} (Score: ${founderRisk.overallScore}/100)
**Valuation Impact**: ${founderRisk.valuationImpact}

**Key Risk Factors**:
${founderRisk.riskFactors.slice(0, 5).map((f: any) => 
  `- [${f.severity.toUpperCase()}] ${f.signal}`
).join('\n')}
`;

      const successionSection = `
**Readiness**: ${founderRisk.successionReadiness.overallReadiness}
**Time to Ready**: ${founderRisk.successionReadiness.timeToReady}
**Role Gaps**: ${founderRisk.successionReadiness.roleGaps.join(', ') || 'None identified'}
**Ready Roles**: ${founderRisk.successionReadiness.readyRoles.join(', ') || 'None ready'}
`;

      const quotesSection = formatQuotesForPrompt(hvaQuotes);
      
      const hvaMetricsText = Object.entries(hvaMetricsForBenchmarking)
        .map(([code, value]) => `- ${code}: ${value}%`)
        .join('\n');
      
      hvaContextSection = `
## HVA CONTEXT DATA

The client has completed a Hidden Value Audit which provides rich qualitative context. 
Use this data to:
1. Ground your narrative in their specific situation
2. Validate/challenge their self-perceptions with benchmark data
3. Quote their exact words when describing concerns or goals
4. Address their stated fears directly in the executive summary

### Founder Risk Assessment
${founderRiskSection}

### Succession Readiness
${successionSection}

### Client Quotes
${quotesSection}

### Additional HVA Metrics
${hvaMetricsText || 'No additional metrics available'}

## NARRATIVE REQUIREMENTS

When writing narratives:
1. If client stated a fear (e.g., "we're busy but not efficient"), ADDRESS IT DIRECTLY with benchmark evidence
2. If client identified a gap (e.g., "we undercharge"), VALIDATE OR CHALLENGE with data
3. Reference specific HVA percentages (e.g., "with ${founderRisk.riskFactors.find((f: any) => f.hvaField === 'knowledge_dependency_percentage')?.hvaValue || 'X'}% of knowledge concentrated in the founder...")
4. Use verbatim quotes where they add authenticity (e.g., "As you noted, 'we still rely on founder-led sales'")
5. Connect benchmark gaps to founder risk factors where relevant
`;
    }
    
    // Merge HVA metrics into enriched data
    Object.assign(assessmentData, hvaMetricsForBenchmarking);
    if (Object.keys(hvaMetricsForBenchmarking).length > 0) {
      console.log('[BM Pass 1] Merged HVA metrics into assessment data');
    }
    
    // Get MA data if available
    const { data: maData } = await supabaseClient
      .from('ma_reports')
      .select('*')
      .eq('client_id', engagement.client_id)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    // Build and send prompt
    console.log('[BM Pass 1] Calling Sonnet for extraction...');
    const startTime = Date.now();
    
    const prompt = buildPass1Prompt(
      assessmentData,
      benchmarks || [],
      maData,
      hvaContextSection,
      clientName,
      industry || {}
    );
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    let content = result.choices[0].message.content;
    
    // Strip markdown code blocks if present (```json ... ```)
    content = content.trim();
    if (content.startsWith('```')) {
      // Remove opening ```json or ```
      content = content.replace(/^```(?:json)?\n?/i, '');
      // Remove closing ```
      content = content.replace(/\n?```$/i, '');
      content = content.trim();
    }
    
    const pass1Data = JSON.parse(content);
    const tokensUsed = result.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.003; // Approximate cost for Sonnet 4
    const generationTime = Date.now() - startTime;
    
    console.log('[BM Pass 1] Extraction complete. Tokens:', tokensUsed, 'Cost: £', cost.toFixed(4));
    
    // Calculate employee band
    const calculatedEmployeeBand = calculateEmployeeBand(assessmentData.employee_count || 0);
    
    // Use the validated industry_code from assessment (we've already validated it exists above)
    // The LLM shouldn't change the industry code - it's determined by the assessment
    const finalIndustryCode = assessmentData.industry_code;
    
    console.log('[BM Pass 1] Using industry_code for report:', finalIndustryCode);
    
    // Double-check it's valid (should never happen given validation above, but safety check)
    if (!finalIndustryCode || typeof finalIndustryCode !== 'string' || finalIndustryCode.trim() === '') {
      throw new Error(`Invalid industry_code: ${finalIndustryCode}. This should have been caught earlier.`);
    }
    
    // Save to database (including founder risk data if available)
    const reportData: any = {
      engagement_id: engagementId,
      industry_code: finalIndustryCode,
      status: 'pass1_complete',
      revenue_band: pass1Data.classification?.revenueBand || assessmentData.revenue_band,
      employee_band: calculatedEmployeeBand,
      metrics_comparison: pass1Data.metricsComparison,
      overall_percentile: pass1Data.overallPosition.percentile,
      strength_count: pass1Data.overallPosition.strengthCount,
      gap_count: pass1Data.overallPosition.gapCount,
      top_strengths: pass1Data.topStrengths,
      top_gaps: pass1Data.topGaps,
      total_annual_opportunity: pass1Data.opportunitySizing.totalAnnualOpportunity,
      opportunity_breakdown: pass1Data.opportunitySizing.breakdown,
      recommendations: pass1Data.recommendations,
      admin_talking_points: pass1Data.adminGuidance.talkingPoints,
      admin_questions_to_ask: pass1Data.adminGuidance.questionsToAsk,
      admin_next_steps: pass1Data.adminGuidance.nextSteps,
      admin_tasks: pass1Data.adminGuidance.tasks,
      admin_risk_flags: pass1Data.adminGuidance.riskFlags,
      pass1_data: pass1Data,
      llm_model: 'claude-sonnet-4',
      llm_tokens_used: tokensUsed,
      llm_cost: cost,
      generation_time_ms: generationTime,
      benchmark_data_as_of: new Date().toISOString().split('T')[0],
      data_sources: benchmarks?.map((b: any) => b.data_source).filter(Boolean) || []
    };
    
    // Add founder risk data if available
    if (founderRisk) {
      reportData.founder_risk_level = founderRisk.riskLevel;
      reportData.founder_risk_score = founderRisk.overallScore;
      reportData.valuation_impact = founderRisk.valuationImpact;
      reportData.founder_risk_factors = founderRisk.riskFactors;
      reportData.succession_readiness = founderRisk.successionReadiness;
      console.log('[BM Pass 1] Added founder risk data to report');
    }
    
    const { data: report, error: saveError } = await supabaseClient
      .from('bm_reports')
      .upsert(reportData, { onConflict: 'engagement_id' })
      .select()
      .single();
    
    if (saveError || !report) {
      throw saveError || new Error('Failed to save report');
    }
    
    // Save individual metric comparisons
    await supabaseClient.from('bm_metric_comparisons').delete().eq('engagement_id', engagementId);
    
    for (const [index, metric] of pass1Data.metricsComparison.entries()) {
      await supabaseClient.from('bm_metric_comparisons').insert({
        engagement_id: engagementId,
        metric_code: metric.metricCode,
        metric_name: metric.metricName,
        client_value: metric.clientValue,
        client_value_source: metric.clientValueSource,
        p25: metric.p25,
        p50: metric.p50,
        p75: metric.p75,
        percentile: metric.percentile,
        assessment: metric.assessment,
        vs_median: metric.vsMedian,
        vs_top_quartile: metric.vsTopQuartile,
        annual_impact: metric.annualImpact,
        impact_calculation: metric.impactCalculation,
        is_primary: metric.isPrimary,
        display_order: index
      });
    }
    
    // Update engagement status
    await supabaseClient
      .from('bm_engagements')
      .update({ status: 'pass1_complete' })
      .eq('id', engagementId);
    
    console.log('[BM Pass 1] Saved. Triggering Pass 2...');
    
    // Trigger Pass 2 asynchronously
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && serviceRoleKey) {
      setTimeout(async () => {
        try {
          console.log('[BM Pass 1] Calling Pass 2 function...');
          const pass2Response = await fetch(`${supabaseUrl}/functions/v1/generate-bm-report-pass2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ engagementId })
          });
          
          if (!pass2Response.ok) {
            const errorText = await pass2Response.text();
            console.error('[BM Pass 1] Pass 2 trigger failed:', pass2Response.status, errorText);
          } else {
            console.log('[BM Pass 1] Pass 2 triggered successfully');
          }
        } catch (err) {
          console.error('[BM Pass 1] Failed to trigger Pass 2:', err);
        }
      }, 2000);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        engagementId,
        status: 'pass1_complete',
        overallPercentile: pass1Data.overallPosition.percentile,
        totalOpportunity: pass1Data.opportunitySizing.totalAnnualOpportunity,
        strengthsCount: pass1Data.overallPosition.strengthCount,
        gapsCount: pass1Data.overallPosition.gapCount,
        tokensUsed,
        cost: `£${cost.toFixed(4)}`,
        generationTimeMs: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BM Pass 1] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

