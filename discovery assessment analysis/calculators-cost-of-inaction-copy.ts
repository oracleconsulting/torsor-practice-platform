/* COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md */
// ============================================================================
// COST OF INACTION CALCULATOR
// ============================================================================
// Calculates the cost of doing nothing with pre-built phrases for Pass 2
// ============================================================================

import { 
  CostOfInactionMetrics, 
  CostComponent,
  formatCurrency
} from '../types/pass1-output.ts';

import { PayrollMetrics } from './payroll.ts';
import { TrajectoryMetrics } from './trajectory.ts';
import { ValuationMetrics } from './valuation.ts';

export interface CostOfInactionInputs {
  payroll?: PayrollMetrics | null;
  trajectory?: TrajectoryMetrics | null;
  valuation?: ValuationMetrics | null;
  exitTimeline?: string;  // "1-3 years", "3-5 years", etc.
  turnover?: number;
  responses?: Record<string, any>;  // Discovery responses for founder time analysis
  adminFlags?: Record<string, any>;  // Admin flags for urgent decisions
  clientRevenueConcentration?: Record<string, any>;  // Client revenue concentration data
}

/**
 * Calculate comprehensive cost of inaction metrics with pre-built phrases
 */
export function calculateCostOfInactionMetrics(
  inputs: CostOfInactionInputs
): CostOfInactionMetrics {
  const { payroll, trajectory, valuation, exitTimeline, turnover, responses, adminFlags, clientRevenueConcentration } = inputs;
  
  // Determine time horizon based on exit timeline
  const timeHorizon = determineTimeHorizon(exitTimeline);
  
  let totalMonthly = 0;
  let totalAnnual = 0;
  let totalOverHorizon = 0;
  const breakdownParts: string[] = [];
  
  // Calculate payroll excess cost
  let payrollExcessComponent: CostComponent | null = null;
  if (payroll && payroll.summary.isOverstaffed) {
    const annual = payroll.annualExcess.value || 0;
    const monthly = Math.round(annual / 12);
    const overHorizon = annual * timeHorizon;
    
    payrollExcessComponent = {
      category: 'Payroll Excess',
      monthly,
      annual,
      overHorizon,
      formatted: {
        monthly: formatCurrency(monthly),
        annual: formatCurrency(annual),
        overHorizon: formatCurrency(overHorizon)
      },
      phrases: {
        monthly: `${formatCurrency(monthly)}/month in excess payroll`,
        annual: payroll.annualExcess.phrases.impact,
        overHorizon: `${formatCurrency(overHorizon)} over ${timeHorizon} years`
      },
      confidence: 'calculated'
    };
    
    totalMonthly += monthly;
    totalAnnual += annual;
    totalOverHorizon += overHorizon;
    breakdownParts.push(`Payroll Excess: ${formatCurrency(overHorizon)}`);
  }
  
  // Calculate margin leakage (trajectory impact)
  let marginLeakageComponent: CostComponent | null = null;
  if (trajectory && trajectory.trend.classification === 'declining' && turnover) {
    const declineRate = Math.abs(trajectory.revenueGrowthYoY.value || 0);
    // Assume 20% of revenue decline flows through to profit
    const annualImpact = Math.round((declineRate / 100) * turnover * 0.2);
    const monthly = Math.round(annualImpact / 12);
    const overHorizon = annualImpact * timeHorizon;
    
    marginLeakageComponent = {
      category: 'Revenue Decline Impact',
      monthly,
      annual: annualImpact,
      overHorizon,
      formatted: {
        monthly: formatCurrency(monthly),
        annual: formatCurrency(annualImpact),
        overHorizon: formatCurrency(overHorizon)
      },
      phrases: {
        monthly: `${formatCurrency(monthly)}/month from declining revenue`,
        annual: `${formatCurrency(annualImpact)}/year profit impact from ${declineRate.toFixed(1)}% decline`,
        overHorizon: `${formatCurrency(overHorizon)} cumulative impact over ${timeHorizon} years`
      },
      confidence: 'estimated'
    };
    
    totalMonthly += monthly;
    totalAnnual += annualImpact;
    totalOverHorizon += overHorizon;
    breakdownParts.push(`Revenue Decline: ${formatCurrency(overHorizon)}`);
  }
  
  // Calculate valuation impact (if declining trajectory)
  let valuationImpactComponent: CostComponent | null = null;
  if (valuation && trajectory && trajectory.trend.classification === 'declining') {
    // Declining businesses get 0.5-1.0x lower multiple
    const ebitda = valuation.adjustedEbitda.value || 0;
    const multipleImpact = 0.5; // Conservative estimate
    const valuationLoss = Math.round(ebitda * multipleImpact);
    
    // This is a one-time impact, not annual, so we show it differently
    valuationImpactComponent = {
      category: 'Valuation Multiple Impact',
      monthly: 0,
      annual: valuationLoss,  // Show as the total impact
      overHorizon: valuationLoss,
      formatted: {
        monthly: '—',
        annual: formatCurrency(valuationLoss),
        overHorizon: formatCurrency(valuationLoss)
      },
      phrases: {
        monthly: 'One-time impact on sale price',
        annual: `${formatCurrency(valuationLoss)} lower sale price due to declining trajectory`,
        overHorizon: `Exit at ${trajectory.trend.classification} trajectory costs ~0.5x multiple (${formatCurrency(valuationLoss)})`
      },
      confidence: 'inferred'
    };
    
    // Don't add to monthly, but do add to total
    totalOverHorizon += valuationLoss;
    breakdownParts.push(`Valuation Impact: ${formatCurrency(valuationLoss)}`);
  }
  
  // ========================================================================
  // FIX 2: ADD REAL OPPORTUNITY COSTS
  // ========================================================================
  
  // 1. Founder time opportunity cost
  let founderTimeComponent: CostComponent | null = null;
  if (responses) {
    const weeklyHours = responses.dd_weekly_hours || responses.rl_weekly_hours || '';
    const timeAllocation = responses.dd_time_allocation || responses.rl_time_allocation || '';
    
    // Check if founder works 50+ hours and spends 50%+ firefighting
    const hoursMatch = String(weeklyHours).match(/(\d+)/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const isFirefighting = String(timeAllocation).toLowerCase().includes('70%') || 
                          String(timeAllocation).toLowerCase().includes('90%') ||
                          String(timeAllocation).toLowerCase().includes('firefighting');
    
    if (hours >= 50 && isFirefighting) {
      // Conservative: 10 hours/week × 48 weeks × £50/hour = £24,000/year
      const strategicHoursPerWeek = 10;
      const weeksPerYear = 48;
      const hourlyRate = 50;
      const annualOpportunityCost = strategicHoursPerWeek * weeksPerYear * hourlyRate;
      const monthly = Math.round(annualOpportunityCost / 12);
      const overHorizon = annualOpportunityCost * timeHorizon;
      
      founderTimeComponent = {
        category: 'Founder Time Opportunity Cost',
        monthly,
        annual: annualOpportunityCost,
        overHorizon,
        formatted: {
          monthly: formatCurrency(monthly),
          annual: formatCurrency(annualOpportunityCost),
          overHorizon: formatCurrency(overHorizon)
        },
        phrases: {
          monthly: `${formatCurrency(monthly)}/month in lost strategic time`,
          annual: `${formatCurrency(annualOpportunityCost)}/year - value of strategic time lost to firefighting`,
          overHorizon: `${formatCurrency(overHorizon)} over ${timeHorizon} years - strategic time that could drive growth`
        },
        confidence: 'estimated'
      };
      
      totalMonthly += monthly;
      totalAnnual += annualOpportunityCost;
      totalOverHorizon += overHorizon;
      breakdownParts.push(`Founder Time: ${formatCurrency(overHorizon)}`);
    }
  }
  
  // 2. Client concentration risk
  let concentrationRiskComponent: CostComponent | null = null;
  if (clientRevenueConcentration && turnover) {
    // Find any client >40% of revenue
    for (const [clientName, details] of Object.entries(clientRevenueConcentration)) {
      const d = details as any;
      const revenue = d.revenue || 0;
      const pct = d.pct_of_total || (revenue / turnover * 100);
      
      if (pct > 40) {
        // Annual revenue at risk if client relationship is lost
        const annualRisk = revenue;
        const monthly = Math.round(annualRisk / 12);
        const overHorizon = annualRisk * timeHorizon;
        
        concentrationRiskComponent = {
          category: `Client Concentration Risk (${clientName})`,
          monthly,
          annual: annualRisk,
          overHorizon,
          formatted: {
            monthly: formatCurrency(monthly),
            annual: formatCurrency(annualRisk),
            overHorizon: formatCurrency(overHorizon)
          },
          phrases: {
            monthly: `${formatCurrency(monthly)}/month at risk from single client dependency`,
            annual: `${formatCurrency(annualRisk)}/year (${pct.toFixed(0)}% of revenue) dependent on ${clientName}`,
            overHorizon: `${formatCurrency(overHorizon)} at risk over ${timeHorizon} years if ${clientName} relationship is lost`
          },
          confidence: 'estimated'
        };
        
        totalMonthly += monthly;
        totalAnnual += annualRisk;
        totalOverHorizon += overHorizon;
        breakdownParts.push(`Concentration Risk: ${formatCurrency(overHorizon)}`);
        break; // Only flag the largest concentration
      }
    }
  }
  
  // 3. Decision delay cost (from admin flags)
  let decisionDelayComponent: CostComponent | null = null;
  if (adminFlags?.urgent_decision) {
    const delayDetail = adminFlags.urgent_decision_detail || '';
    // Estimate cost based on decision type
    let monthlyCost = 0;
    let decisionType = 'urgent decision';
    
    if (delayDetail.toLowerCase().includes('hire') || delayDetail.toLowerCase().includes('lead')) {
      // Senior hire delay: ~£5k/month if not embedded on billable work
      monthlyCost = 5000;
      decisionType = 'senior hire delay';
    } else if (delayDetail.toLowerCase().includes('client') || delayDetail.toLowerCase().includes('contract')) {
      // Client/contract delay: estimate based on typical contract value
      monthlyCost = turnover ? Math.round(turnover * 0.05 / 12) : 3000; // 5% of revenue / 12
      decisionType = 'client/contract delay';
    } else {
      // Generic urgent decision: £3k/month
      monthlyCost = 3000;
    }
    
    if (monthlyCost > 0) {
      const annual = monthlyCost * 12;
      const overHorizon = annual * timeHorizon;
      
      decisionDelayComponent = {
        category: `Decision Delay (${decisionType})`,
        monthly: monthlyCost,
        annual,
        overHorizon,
        formatted: {
          monthly: formatCurrency(monthlyCost),
          annual: formatCurrency(annual),
          overHorizon: formatCurrency(overHorizon)
        },
        phrases: {
          monthly: `${formatCurrency(monthlyCost)}/month cost of delayed ${decisionType}`,
          annual: `${formatCurrency(annual)}/year - cost of not making the ${decisionType}`,
          overHorizon: `${formatCurrency(overHorizon)} over ${timeHorizon} years from delayed ${decisionType}`
        },
        confidence: 'estimated'
      };
      
      totalMonthly += monthlyCost;
      totalAnnual += annual;
      totalOverHorizon += overHorizon;
      breakdownParts.push(`Decision Delay: ${formatCurrency(overHorizon)}`);
    }
  }
  
  // Build total cost of inaction
  const totalCostOfInaction = {
    monthly: totalMonthly,
    annual: totalAnnual,
    overHorizon: totalOverHorizon,
    timeHorizon,
    formatted: {
      monthly: formatCurrency(totalMonthly),
      annual: formatCurrency(totalAnnual),
      overHorizon: formatCurrency(totalOverHorizon)
    },
    phrases: buildTotalPhrases(totalMonthly, totalAnnual, totalOverHorizon, timeHorizon, breakdownParts)
  };
  
  return {
    status: 'calculated',
    hasData: true,
    payrollExcess: payrollExcessComponent,
    marginLeakage: marginLeakageComponent,
    efficiencyLoss: null, // Could add productivity-based calculation
    valuationImpact: valuationImpactComponent,
    founderTimeOpportunity: founderTimeComponent,
    concentrationRisk: concentrationRiskComponent,
    decisionDelay: decisionDelayComponent,
    totalCostOfInaction
  };
}

/**
 * Determine time horizon from exit timeline string
 */
function determineTimeHorizon(exitTimeline?: string): number {
  if (!exitTimeline) return 2; // Default 2 years
  
  const lower = exitTimeline.toLowerCase();
  
  if (lower.includes('1-3') || lower.includes('1 to 3') || lower.includes('actively')) {
    return 2;
  }
  if (lower.includes('3-5') || lower.includes('3 to 5')) {
    return 4;
  }
  if (lower.includes('5+') || lower.includes('5 years') || lower.includes('not yet')) {
    return 5;
  }
  
  return 2; // Default to 2 years
}

/**
 * Build total cost of inaction phrases
 */
function buildTotalPhrases(
  monthly: number,
  annual: number,
  overHorizon: number,
  timeHorizon: number,
  breakdownParts: string[]
): {
  headline: string;
  breakdown: string;
  urgency: string;
} {
  const overHorizonK = Math.round(overHorizon / 1000);
  const monthlyK = Math.round(monthly / 1000);
  
  return {
    headline: `Cost of inaction: £${overHorizonK}k+ over ${timeHorizon} years`,
    breakdown: breakdownParts.length > 0 ? breakdownParts.join('. ') : 'Components not calculable',
    urgency: monthly > 0 
      ? `Every month you wait is another £${monthlyK}k gone`
      : `Waiting costs opportunity - act before exit window`
  };
}

/**
 * Build cost of inaction gap phrase for narrative blocks
 */
export function buildCostOfInactionPhrase(
  costOfInaction: CostOfInactionMetrics,
  payroll: PayrollMetrics | null
): string {
  const total = costOfInaction.totalCostOfInaction;
  const totalK = Math.round(total.overHorizon / 1000);
  
  // If payroll is the main driver, emphasize that
  if (payroll?.summary.isOverstaffed && costOfInaction.payrollExcess) {
    const payrollK = Math.round(costOfInaction.payrollExcess.overHorizon / 1000);
    const payrollPct = Math.round((costOfInaction.payrollExcess.overHorizon / total.overHorizon) * 100);
    
    if (payrollPct > 70) {
      return `The cost of waiting: £${totalK}k+ over ${total.timeHorizon} years - ${payrollPct}% of that is the payroll excess (£${payrollK}k).`;
    }
  }
  
  return `The cost of inaction: £${totalK}k+ over ${total.timeHorizon} years. ${total.phrases.breakdown}`;
}
