import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScenarioInput {
  type: 'hire' | 'price_increase' | 'collection_improvement' | 'lost_client' | 'new_client' | 'cost_reduction';
  assumptions: any;
}

interface ScenarioOutput {
  monthlyRevenueImpact: number;
  monthlyCostImpact: number;
  monthlyProfitImpact: number;
  cashImpactMonth1: number;
  cashImpactMonth3: number;
  breakevenMonth: number;
  yearOneImpact: number;
}

function calculateHireScenario(assumptions: any, currentRevenue: number, currentCosts: number): ScenarioOutput {
  const salary = parseFloat(assumptions.salary || 0);
  const monthlySalary = salary / 12;
  const oncosts = monthlySalary * 0.15; // 15% for NI, pension, etc.
  const monthlyCost = monthlySalary + oncosts;
  
  const utilization = parseFloat(assumptions.target_utilization || 0) / 100;
  const dayRate = parseFloat(assumptions.billable_rate || 0);
  const workingDaysPerMonth = 20;
  const monthlyRevenuePotential = (dayRate * workingDaysPerMonth * utilization);
  
  const rampUpMonths = parseInt(assumptions.ramp_up_months || 2);
  const rampUpFactor = (month: number) => {
    if (month <= rampUpMonths) {
      return month / rampUpMonths;
    }
    return 1;
  };
  
  const monthlyRevenueImpact = monthlyRevenuePotential;
  const monthlyCostImpact = monthlyCost;
  const monthlyProfitImpact = monthlyRevenueImpact - monthlyCostImpact;
  
  // Calculate breakeven
  let cumulativeProfit = 0;
  let breakevenMonth = 0;
  for (let month = 1; month <= 12; month++) {
    const monthRevenue = monthlyRevenuePotential * rampUpFactor(month);
    const monthProfit = monthRevenue - monthlyCost;
    cumulativeProfit += monthProfit;
    if (cumulativeProfit > 0 && breakevenMonth === 0) {
      breakevenMonth = month;
    }
  }
  
  // Cash impact (negative in early months, positive later)
  const cashImpactMonth1 = -monthlyCost;
  const cashImpactMonth3 = (monthlyRevenuePotential * rampUpFactor(3)) - monthlyCost;
  
  // Year 1 cumulative impact
  let yearOneImpact = 0;
  for (let month = 1; month <= 12; month++) {
    const monthRevenue = monthlyRevenuePotential * rampUpFactor(month);
    yearOneImpact += (monthRevenue - monthlyCost);
  }
  
  return {
    monthlyRevenueImpact,
    monthlyCostImpact,
    monthlyProfitImpact,
    cashImpactMonth1,
    cashImpactMonth3,
    breakevenMonth,
    yearOneImpact
  };
}

function calculatePriceIncreaseScenario(assumptions: any, currentRevenue: number): ScenarioOutput {
  const priceIncrease = parseFloat(assumptions.price_increase || 0) / 100;
  const expectedChurn = parseFloat(assumptions.expected_churn || 0) / 100;
  
  const grossRevenueIncrease = currentRevenue * priceIncrease;
  const churnLoss = currentRevenue * expectedChurn;
  const netRevenueChange = grossRevenueIncrease - churnLoss;
  
  // Assume 100% margin on price increase (no cost increase)
  const monthlyRevenueImpact = netRevenueChange;
  const monthlyCostImpact = 0;
  const monthlyProfitImpact = netRevenueChange;
  
  return {
    monthlyRevenueImpact,
    monthlyCostImpact,
    monthlyProfitImpact,
    cashImpactMonth1: netRevenueChange,
    cashImpactMonth3: netRevenueChange * 3,
    breakevenMonth: 0, // Immediate
    yearOneImpact: netRevenueChange * 12
  };
}

function calculateCollectionImprovementScenario(assumptions: any, currentDebtors: number, currentDebtorDays: number): ScenarioOutput {
  const targetDebtorDays = parseFloat(assumptions.target_debtor_days || 30);
  const daysImprovement = currentDebtorDays - targetDebtorDays;
  const cashReleased = currentDebtors * (daysImprovement / currentDebtorDays);
  
  // One-time cash release, no ongoing P&L impact
  return {
    monthlyRevenueImpact: 0,
    monthlyCostImpact: 0,
    monthlyProfitImpact: 0,
    cashImpactMonth1: cashReleased,
    cashImpactMonth3: cashReleased, // One-time
    breakevenMonth: 0,
    yearOneImpact: 0 // Cash release, not profit
  };
}

function determineRelevantScenarios(context: any): string[] {
  const scenarios: string[] = [];
  
  // Check assessment for hiring mentions
  const assessment = context.assessment || {};
  if (assessment.upcoming_decisions?.includes('Hiring decisions') ||
      assessment.decision_making_story?.toLowerCase().includes('hire')) {
    scenarios.push('hire');
  }
  
  // Check margins
  const currentMargin = parseFloat(context.currentPeriod?.operating_margin_pct || 0);
  if (currentMargin < 12) {
    scenarios.push('price_increase');
  }
  
  // Check debtor days
  const debtorDays = parseFloat(context.currentPeriod?.debtors_days || 0);
  if (debtorDays > 45) {
    scenarios.push('collection_improvement');
  }
  
  // Check customer concentration
  if (assessment.customer_concentration === 'Over 50% - we\'re heavily concentrated') {
    scenarios.push('lost_client');
  }
  
  // Default: always show price increase if not already included
  if (!scenarios.includes('price_increase')) {
    scenarios.push('price_increase');
  }
  
  return scenarios.slice(0, 3); // Max 3 scenarios
}

function generateScenarioVerdict(
  scenarioType: string,
  output: ScenarioOutput,
  assumptions: any,
  context: any
): { verdict: string; verdictSummary: string; conditions: string[]; risks: string[]; alternative?: string } {
  if (scenarioType === 'hire') {
    const utilization = parseFloat(assumptions.target_utilization || 0);
    if (output.breakevenMonth <= 3 && utilization >= 65) {
      return {
        verdict: 'recommended',
        verdictSummary: 'Yes, hire if they can hit 65%+ utilization',
        conditions: [
          `Pipeline supports £${Math.round(output.monthlyRevenueImpact).toLocaleString()}/month billings within 90 days`,
          'You have capacity to manage/train them'
        ],
        risks: [
          `If utilization only reaches 50%, breakeven pushes to month ${output.breakevenMonth + 2}`,
          `Cash dips to £${Math.round((context.currentPeriod?.true_cash || 0) + output.cashImpactMonth1).toLocaleString()} in month 2 before recovering`
        ],
        alternative: 'Collect the debtors first—that gives you a buffer regardless of utilization'
      };
    } else if (output.breakevenMonth <= 6) {
      return {
        verdict: 'yes_if',
        verdictSummary: 'Yes, hire if utilization exceeds 60%',
        conditions: [
          'Pipeline supports consistent billings',
          'You can afford 3-6 month cash dip'
        ],
        risks: [
          `Breakeven at month ${output.breakevenMonth}—longer than ideal`,
          'Cash pressure in months 2-3'
        ]
      };
    } else {
      return {
        verdict: 'risky',
        verdictSummary: 'Risky—breakeven too long',
        conditions: [],
        risks: [
          `Breakeven at month ${output.breakevenMonth}—too long for current cash position`,
          'Consider waiting until cash position improves'
        ]
      };
    }
  } else if (scenarioType === 'price_increase') {
    if (output.monthlyProfitImpact > 0) {
      return {
        verdict: 'recommended',
        verdictSummary: 'Yes—lower risk than hiring, higher return',
        conditions: [
          'Test with 3-5 clients first to gauge reaction',
          'Position as annual adjustment, not emergency measure'
        ],
        risks: [
          'Churn could exceed expectations if competitors are aggressive',
          'Key account concentration means losing one big client hurts'
        ],
        alternative: `4x more profitable than hiring, with lower cash risk`
      };
    } else {
      return {
        verdict: 'not_recommended',
        verdictSummary: 'Not recommended—churn would exceed benefit',
        conditions: [],
        risks: ['Net revenue would decrease']
      };
    }
  } else if (scenarioType === 'collection_improvement') {
    return {
      verdict: 'recommended',
      verdictSummary: 'Yes—quick win with immediate cash benefit',
      conditions: [
        'Send statements to all accounts over target days',
        'Call top 5 debtors this week'
      ],
      risks: [
        'Some clients may push back on faster payment',
        'May need to offer early payment discount'
      ]
    };
  }
  
  return {
    verdict: 'viable',
    verdictSummary: 'Scenario is viable',
    conditions: [],
    risks: []
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId, periodId, scenarioTypes } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[MA Scenarios] Generating scenarios for engagement:', engagementId);
    
    // Fetch current period and context
    const { data: period, error: periodError } = await supabaseClient
      .from('ma_periods')
      .select('*, ma_extracted_financials(*)')
      .eq('id', periodId)
      .single();
    
    if (periodError || !period) {
      throw new Error(`Failed to fetch period: ${periodError?.message || 'Not found'}`);
    }
    
    const currentPeriod = period.ma_extracted_financials;
    if (!currentPeriod) {
      throw new Error('No extracted financials found');
    }
    
    // Fetch engagement and assessment data
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('ma_engagements')
      .select('*, ma_assessment_responses(*)')
      .eq('id', engagementId)
      .single();
    
    if (engagementError) {
      console.warn('[MA Scenarios] Error fetching engagement:', engagementError);
    }
    
    // Determine which scenarios to generate
    const scenariosToGenerate = scenarioTypes || determineRelevantScenarios({
      assessment: engagement?.ma_assessment_responses?.[0] || {},
      currentPeriod
    });
    
    const generatedScenarios = [];
    
    for (const scenarioType of scenariosToGenerate) {
      let assumptions: any = {};
      let output: ScenarioOutput;
      
      if (scenarioType === 'hire') {
        assumptions = {
          salary: 55000,
          start_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ramp_up_months: 2,
          target_utilization: 75,
          billable_rate: 650
        };
        output = calculateHireScenario(
          assumptions,
          parseFloat(currentPeriod.revenue?.toString() || '0'),
          parseFloat(currentPeriod.overheads?.toString() || '0')
        );
      } else if (scenarioType === 'price_increase') {
        assumptions = {
          price_increase: 10,
          expected_churn: 5
        };
        output = calculatePriceIncreaseScenario(
          assumptions,
          parseFloat(currentPeriod.revenue?.toString() || '0')
        );
      } else if (scenarioType === 'collection_improvement') {
        assumptions = {
          target_debtor_days: 30
        };
        output = calculateCollectionImprovementScenario(
          assumptions,
          parseFloat(currentPeriod.debtors_total?.toString() || '0'),
          parseFloat(currentPeriod.debtors_days?.toString() || '50')
        );
      } else {
        continue; // Skip unsupported types for now
      }
      
      const verdict = generateScenarioVerdict(scenarioType, output, assumptions, {
        assessment: engagement?.ma_assessment_responses?.[0] || {},
        currentPeriod
      });
      
      // Save scenario
      const { data: savedScenario, error: saveError } = await supabaseClient
        .from('ma_scenarios')
        .insert({
          engagement_id: engagementId,
          period_id: periodId,
          scenario_type: scenarioType,
          scenario_name: scenarioType === 'hire' ? 'Hire Delivery Consultant at £55k' :
                         scenarioType === 'price_increase' ? 'Raise Prices 10%' :
                         'Reduce Debtor Days to 30',
          is_active: true,
          assumptions,
          impact_summary: {
            monthly_revenue_impact: output.monthlyRevenueImpact,
            monthly_cost_impact: output.monthlyCostImpact,
            monthly_profit_impact: output.monthlyProfitImpact,
            cash_impact_month_1: output.cashImpactMonth1,
            cash_impact_month_3: output.cashImpactMonth3,
            breakeven_month: output.breakevenMonth,
            year_one_impact: output.yearOneImpact
          },
          verdict: verdict.verdict,
          verdict_summary: verdict.verdictSummary,
          risks: verdict.risks,
          conditions: verdict.conditions
        })
        .select()
        .single();
      
      if (saveError) {
        console.error(`[MA Scenarios] Error saving ${scenarioType} scenario:`, saveError);
      } else {
        generatedScenarios.push({
          id: savedScenario.id,
          type: scenarioType,
          name: savedScenario.scenario_name,
          impact: output,
          verdict
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        scenariosGenerated: generatedScenarios.length,
        scenarios: generatedScenarios
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[MA Scenarios] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});



