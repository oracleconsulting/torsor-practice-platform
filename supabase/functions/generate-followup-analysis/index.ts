// ============================================================================
// EDGE FUNCTION: generate-followup-analysis
// ============================================================================
// Triggered: After Parts 1 & 2 complete AND initial roadmap generated
// Purpose: Detect gaps in responses and generate targeted follow-up questions
// to enrich the roadmap with specifics (hourly rates, hours breakdown, etc.)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// GAP DETECTION RULES
// ============================================================================

interface DetectedGap {
  field: string;
  currentValue: any;
  gapType: 'missing' | 'vague' | 'needs_breakdown' | 'needs_quantification' | 'inconsistency';
  priority: 'critical' | 'high' | 'medium' | 'low';
  question: {
    id: string;
    text: string;
    type: 'text' | 'number' | 'radio' | 'slider' | 'checkbox' | 'time_breakdown';
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    insight?: string;
  };
  context: string;
  impactOnRoadmap: string;
}

function detectGaps(part1: Record<string, any>, part2: Record<string, any>): DetectedGap[] {
  const gaps: DetectedGap[] = [];

  // ============================================
  // WORKING HOURS ANALYSIS
  // ============================================
  
  const currentHours = parseInt(part2.current_working_hours) || 0;
  const targetHours = parseInt(part2.target_working_hours) || 0;
  
  // Missing or vague working hours
  if (!currentHours || currentHours === 0) {
    gaps.push({
      field: 'current_working_hours',
      currentValue: part2.current_working_hours,
      gapType: 'missing',
      priority: 'critical',
      question: {
        id: 'fu_current_hours_detailed',
        text: 'How many hours do you actually work each week? Be honest - include checking emails, thinking about work, etc.',
        type: 'slider',
        min: 20,
        max: 100,
        step: 5,
        insight: 'Most founders underestimate by 10-15 hours'
      },
      context: 'We need accurate working hours to calculate your effective hourly rate and efficiency gains',
      impactOnRoadmap: 'Cannot calculate ROI or time-based goals without this'
    });
  } else if (currentHours > 0) {
    // Hours breakdown needed
    gaps.push({
      field: 'hours_breakdown',
      currentValue: null,
      gapType: 'needs_breakdown',
      priority: 'high',
      question: {
        id: 'fu_hours_breakdown',
        text: `You mentioned working ${currentHours} hours/week. How does that break down?`,
        type: 'time_breakdown',
        options: [
          'Client delivery/billable work',
          'Sales & business development',
          'Admin & operations',
          'Marketing & content',
          'Team management',
          'Strategic thinking/planning',
          'Email & communication',
          'Firefighting & emergencies'
        ],
        insight: 'Where your time goes reveals your biggest opportunities'
      },
      context: `Breaking down your ${currentHours} hours helps identify what to delegate or eliminate first`,
      impactOnRoadmap: 'Enables specific task prioritization in your 12-week sprint'
    });
  }

  // Hours reduction seems too aggressive
  if (currentHours && targetHours && (currentHours - targetHours > 25)) {
    gaps.push({
      field: 'hours_reduction_plan',
      currentValue: { current: currentHours, target: targetHours },
      gapType: 'needs_quantification',
      priority: 'medium',
      question: {
        id: 'fu_hours_reduction_path',
        text: `You want to go from ${currentHours} to ${targetHours} hours/week (a ${currentHours - targetHours} hour reduction). What would you stop doing first?`,
        type: 'checkbox',
        options: [
          'Hands-on delivery (hire/outsource)',
          'Admin tasks (automate/delegate)',
          'Sales calls (hire sales help)',
          'Customer service (systems/team)',
          'Marketing (agency/contractor)',
          'Meetings (reduce/batch)',
          'Email (boundaries/VA)',
          'Not sure yet'
        ]
      },
      context: 'A 25+ hour reduction requires specific changes, not just "working smarter"',
      impactOnRoadmap: 'Informs which systems and hires to prioritize'
    });
  }

  // ============================================
  // INCOME & HOURLY RATE ANALYSIS
  // ============================================

  const currentIncome = parseIncomeString(part1.current_income);
  const desiredIncome = parseIncomeString(part1.desired_income);
  const revenue = parseRevenueString(part2.annual_turnover);

  // Missing or vague income
  if (!currentIncome || currentIncome === 0) {
    gaps.push({
      field: 'current_income',
      currentValue: part1.current_income,
      gapType: 'missing',
      priority: 'critical',
      question: {
        id: 'fu_current_income',
        text: 'What do you currently take home from the business each month (after tax)?',
        type: 'number',
        placeholder: '£',
        insight: 'We use this to calculate your effective hourly rate'
      },
      context: 'Your current income vs hours worked reveals your true hourly rate',
      impactOnRoadmap: 'Essential for ROI calculations and income targets'
    });
  }

  // Calculate effective hourly rate if we have data
  if (currentIncome > 0 && currentHours > 0) {
    const annualIncome = currentIncome * 12;
    const annualHours = currentHours * 48; // Assuming 48 working weeks
    const effectiveHourlyRate = Math.round(annualIncome / annualHours);
    
    // If hourly rate seems low for their industry
    const industryMinRates: Record<string, number> = {
      consulting: 75, technology: 60, agency: 50, 
      fitness_equipment: 30, trades: 35, general_business: 40
    };
    
    const allText = JSON.stringify({ ...part1, ...part2 }).toLowerCase();
    let industry = 'general_business';
    if (allText.includes('consult')) industry = 'consulting';
    else if (allText.includes('software') || allText.includes('tech')) industry = 'technology';
    else if (allText.includes('agency')) industry = 'agency';
    else if (allText.includes('rowing') || allText.includes('fitness')) industry = 'fitness_equipment';
    else if (allText.includes('trade') || allText.includes('construction')) industry = 'trades';

    const minRate = industryMinRates[industry] || 40;

    if (effectiveHourlyRate < minRate) {
      gaps.push({
        field: 'hourly_rate_awareness',
        currentValue: { effectiveHourlyRate, industry },
        gapType: 'needs_quantification',
        priority: 'high',
        question: {
          id: 'fu_hourly_rate_reaction',
          text: `Your effective hourly rate is £${effectiveHourlyRate}/hour (£${currentIncome}/month ÷ ${currentHours}hrs/week). The ${industry} average is £${minRate * 1.5}/hour. What's your reaction?`,
          type: 'radio',
          options: [
            "That's lower than I thought - I need to change this",
            "I knew it was low but felt stuck",
            "I'm okay with it for now while building",
            "I'm investing in growth, profit comes later",
            "I hadn't calculated this before"
          ],
          insight: 'Awareness is the first step to change'
        },
        context: `At £${effectiveHourlyRate}/hour, you'd earn more as an employee. This affects how we prioritize your roadmap.`,
        impactOnRoadmap: 'May shift focus from growth to profitability first'
      });
    }

    // Billable vs total hours
    gaps.push({
      field: 'billable_hours',
      currentValue: null,
      gapType: 'needs_quantification',
      priority: 'medium',
      question: {
        id: 'fu_billable_percentage',
        text: `Of your ${currentHours} hours/week, how many are directly billable to clients?`,
        type: 'slider',
        min: 0,
        max: currentHours,
        step: 5,
        insight: 'Most founders have <40% billable time'
      },
      context: 'Non-billable hours are your biggest opportunity for efficiency gains',
      impactOnRoadmap: 'Identifies specific hours to reclaim or monetize'
    });
  }

  // Income gap analysis
  if (currentIncome > 0 && desiredIncome > 0 && desiredIncome > currentIncome) {
    const gap = desiredIncome - currentIncome;
    const percentIncrease = Math.round((gap / currentIncome) * 100);
    
    if (percentIncrease > 50) {
      gaps.push({
        field: 'income_gap_path',
        currentValue: { current: currentIncome, desired: desiredIncome, gap, percentIncrease },
        gapType: 'needs_quantification',
        priority: 'high',
        question: {
          id: 'fu_income_increase_path',
          text: `You want to increase income from £${currentIncome.toLocaleString()} to £${desiredIncome.toLocaleString()}/month (+${percentIncrease}%). How do you see this happening?`,
          type: 'checkbox',
          options: [
            'Raise prices to existing customers',
            'Get more customers (same prices)',
            'Sell higher-value services/products',
            'Reduce costs/increase efficiency',
            'Work more hours (short term)',
            'Add new revenue streams',
            'Productize services for scale',
            "Not sure - that's what I need help with"
          ]
        },
        context: `A ${percentIncrease}% income increase requires strategic changes, not just "more of the same"`,
        impactOnRoadmap: 'Determines whether to focus on pricing, volume, or new offerings'
      });
    }
  }

  // ============================================
  // TEAM & DELEGATION ANALYSIS
  // ============================================

  const teamSize = part2.team_size || 'Just me';
  
  if (teamSize === 'Just me' || teamSize.includes('solo') || teamSize === '0') {
    // Solo founder - explore hiring readiness
    gaps.push({
      field: 'first_hire_readiness',
      currentValue: teamSize,
      gapType: 'needs_quantification',
      priority: 'medium',
      question: {
        id: 'fu_first_hire_budget',
        text: 'What could you afford to pay for help right now? (Even part-time/freelance)',
        type: 'radio',
        options: [
          'Nothing - every penny goes back into the business',
          'Up to £500/month for a few hours/week',
          '£500-1000/month for part-time help',
          '£1000-2000/month for significant support',
          '£2000+/month for a real hire',
          "I haven't thought about it in £ terms"
        ],
        insight: 'Most founders can afford more help than they think'
      },
      context: 'Even £500/month could buy 10-20 hours of VA support',
      impactOnRoadmap: 'Enables specific delegation recommendations in sprint'
    });

    // What would they delegate
    if (currentHours > 40) {
      gaps.push({
        field: 'delegation_blockers',
        currentValue: null,
        gapType: 'needs_quantification',
        priority: 'high',
        question: {
          id: 'fu_delegation_fear',
          text: "What's really stopping you from getting help? (Be honest)",
          type: 'checkbox',
          options: [
            "Can't afford it",
            "Don't know what to delegate",
            "No time to train someone",
            "Fear of losing quality/control",
            "Bad experience with help before",
            "Don't know how to find good help",
            "Secretly enjoy doing everything",
            "Feel like I should be able to handle it"
          ],
          insight: 'Most blockers are psychological, not financial'
        },
        context: 'Understanding your real blockers helps us address them in the roadmap',
        impactOnRoadmap: 'Shapes how we approach delegation in your sprint'
      });
    }
  } else {
    // Has team - explore delegation effectiveness
    gaps.push({
      field: 'delegation_effectiveness',
      currentValue: teamSize,
      gapType: 'needs_quantification',
      priority: 'medium',
      question: {
        id: 'fu_team_utilization',
        text: 'How well utilized is your team? (% of time on productive work)',
        type: 'slider',
        min: 0,
        max: 100,
        step: 10,
        insight: 'Most teams are 50-70% utilized due to unclear priorities'
      },
      context: 'Low utilization means you could get more output without hiring',
      impactOnRoadmap: 'May focus on team effectiveness before scaling'
    });
  }

  // ============================================
  // BUSINESS MODEL CLARITY
  // ============================================

  // Revenue per customer/client
  if (revenue > 0) {
    gaps.push({
      field: 'average_customer_value',
      currentValue: revenue,
      gapType: 'needs_quantification',
      priority: 'medium',
      question: {
        id: 'fu_average_sale',
        text: 'What does your average customer/client spend with you annually?',
        type: 'radio',
        options: [
          'Under £500',
          '£500 - £2,000',
          '£2,000 - £5,000',
          '£5,000 - £15,000',
          '£15,000 - £50,000',
          '£50,000+',
          'Varies too much to say'
        ],
        insight: 'Average customer value determines your growth strategy'
      },
      context: 'High-value vs high-volume businesses need very different roadmaps',
      impactOnRoadmap: 'Shapes acquisition strategy and pricing focus'
    });

    // Customer acquisition
    gaps.push({
      field: 'customer_acquisition_time',
      currentValue: null,
      gapType: 'needs_quantification',
      priority: 'medium',
      question: {
        id: 'fu_sales_cycle',
        text: 'How long from first contact to signed customer, typically?',
        type: 'radio',
        options: [
          'Same day/instant',
          'Days (1-7)',
          '2-4 weeks',
          '1-3 months',
          '3-6 months',
          '6+ months',
          "Very inconsistent/don't track"
        ]
      },
      context: 'Sales cycle length affects cash flow planning and growth projections',
      impactOnRoadmap: 'Determines sales pipeline requirements'
    });
  }

  // ============================================
  // FINANCIAL CLARITY
  // ============================================

  // Profit margin
  if (revenue > 0) {
    gaps.push({
      field: 'profit_margin',
      currentValue: null,
      gapType: 'needs_quantification',
      priority: 'high',
      question: {
        id: 'fu_profit_margin',
        text: 'What percentage of revenue do you keep as profit (after all costs)?',
        type: 'slider',
        min: 0,
        max: 80,
        step: 5,
        insight: 'UK SME average is 15-20%. Service businesses should target 30%+'
      },
      context: 'Profit margin determines whether growth creates value or just more work',
      impactOnRoadmap: 'May shift focus from revenue growth to margin improvement'
    });
  }

  // Cash reserves
  gaps.push({
    field: 'cash_runway',
    currentValue: null,
    gapType: 'needs_quantification',
    priority: 'medium',
    question: {
      id: 'fu_cash_months',
      text: 'If revenue stopped tomorrow, how many months could you pay yourself and all costs?',
      type: 'radio',
      options: [
        'Less than 1 month',
        '1-2 months',
        '3-4 months',
        '5-6 months',
        '6+ months'
      ],
      insight: '3 months is minimum recommended; 6 months gives real freedom'
    },
    context: 'Cash runway affects how aggressive we can be with changes',
    impactOnRoadmap: 'Influences risk tolerance in recommendations'
  });

  // ============================================
  // VAGUE ANSWER DETECTION
  // ============================================

  // Check for short/vague answers in key fields
  const keyFields = [
    { field: 'tuesday_test', name: 'Tuesday Test', minLength: 50 },
    { field: 'growth_bottleneck', name: 'Biggest Challenge', minLength: 20 },
    { field: 'ten_year_vision', name: '10-Year Vision', minLength: 30 },
    { field: 'winning_2030', name: 'Winning by 2030', minLength: 20 }
  ];

  keyFields.forEach(({ field, name, minLength }) => {
    const value = part1[field] || part2[field] || '';
    if (value && value.length < minLength && value.length > 0) {
      gaps.push({
        field,
        currentValue: value,
        gapType: 'vague',
        priority: 'low',
        question: {
          id: `fu_expand_${field}`,
          text: `You mentioned "${value}" for ${name}. Can you tell us more? What would that actually look like day-to-day?`,
          type: 'text',
          placeholder: 'Give us the full picture...'
        },
        context: 'More detail helps us personalize your roadmap',
        impactOnRoadmap: 'Enables more specific, actionable tasks'
      });
    }
  });

  // ============================================
  // INCONSISTENCY DETECTION
  // ============================================

  // Wants to work less but has no team
  if (targetHours && currentHours && (currentHours - targetHours > 15) && 
      (teamSize === 'Just me' || teamSize.includes('solo'))) {
    gaps.push({
      field: 'hours_team_inconsistency',
      currentValue: { currentHours, targetHours, teamSize },
      gapType: 'inconsistency',
      priority: 'high',
      question: {
        id: 'fu_hours_reduction_method',
        text: `You want to reduce hours by ${currentHours - targetHours}/week but currently work alone. How do you see that happening?`,
        type: 'radio',
        options: [
          'Hiring or outsourcing (ready to invest)',
          'Automating processes (tech solutions)',
          'Dropping services/customers (simplifying)',
          'Saying no more (boundaries)',
          "Honestly hadn't thought through how",
          'Need help figuring this out'
        ]
      },
      context: 'Significant hour reductions require structural changes',
      impactOnRoadmap: 'Critical for realistic sprint planning'
    });
  }

  // High income target but no pricing strategy
  if (desiredIncome > currentIncome * 1.5 && !part2.pricing_model) {
    gaps.push({
      field: 'pricing_strategy',
      currentValue: null,
      gapType: 'needs_quantification',
      priority: 'high',
      question: {
        id: 'fu_pricing_approach',
        text: 'How do you currently price your services/products?',
        type: 'radio',
        options: [
          'Hourly/daily rate',
          'Per project (fixed quotes)',
          'Monthly retainer',
          'Product pricing (fixed)',
          'Value-based (tied to outcomes)',
          'Whatever feels right in the moment',
          'Match competitors'
        ],
        insight: 'Pricing model determines scalability'
      },
      context: 'Your pricing model affects how you can grow income',
      impactOnRoadmap: 'May focus on pricing strategy before volume'
    });
  }

  // Return sorted by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseIncomeString(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = str.replace(/[£,\s]/g, '').replace(/k$/i, '000');
  return parseInt(cleaned) || 0;
}

function parseRevenueString(str: string | undefined): number {
  if (!str) return 0;
  if (str.includes('Under £100k')) return 50000;
  if (str.includes('£100k-£250k')) return 175000;
  if (str.includes('£250k-£500k')) return 375000;
  if (str.includes('£500k-£1m')) return 750000;
  if (str.includes('£1m-£2.5m')) return 1750000;
  if (str.includes('£2.5m')) return 3500000;
  return 0;
}

function generateEnrichmentSummary(gaps: DetectedGap[], part1: any, part2: any): any {
  const criticalGaps = gaps.filter(g => g.priority === 'critical');
  const highGaps = gaps.filter(g => g.priority === 'high');
  
  const currentHours = parseInt(part2.current_working_hours) || 0;
  const currentIncome = parseIncomeString(part1.current_income);
  const revenue = parseRevenueString(part2.annual_turnover);
  
  let effectiveHourlyRate = 0;
  if (currentIncome > 0 && currentHours > 0) {
    effectiveHourlyRate = Math.round((currentIncome * 12) / (currentHours * 48));
  }

  return {
    totalGapsDetected: gaps.length,
    criticalGaps: criticalGaps.length,
    highPriorityGaps: highGaps.length,
    currentMetrics: {
      workingHours: currentHours || 'Unknown',
      monthlyIncome: currentIncome ? `£${currentIncome.toLocaleString()}` : 'Unknown',
      annualRevenue: revenue ? `£${revenue.toLocaleString()}` : 'Unknown',
      effectiveHourlyRate: effectiveHourlyRate ? `£${effectiveHourlyRate}/hour` : 'Needs data',
      teamSize: part2.team_size || 'Unknown'
    },
    keyInsights: [
      criticalGaps.length > 0 ? `${criticalGaps.length} critical data points missing` : null,
      effectiveHourlyRate > 0 && effectiveHourlyRate < 50 ? `Your effective hourly rate (£${effectiveHourlyRate}) is below industry average` : null,
      currentHours > 50 ? `Working ${currentHours} hours/week is unsustainable long-term` : null,
      part2.team_size === 'Just me' && currentHours > 45 ? 'Solo operation at high hours suggests delegation opportunity' : null
    ].filter(Boolean),
    recommendedAction: criticalGaps.length > 0 
      ? 'Complete the follow-up questions to unlock a more accurate roadmap'
      : highGaps.length > 2
      ? 'Answer a few more questions to fine-tune your roadmap'
      : 'Your roadmap is well-informed, but additional details would help'
  };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { action, clientId, practiceId, followupResponses } = await req.json();

    // ACTION 1: Analyze gaps and return follow-up questions
    if (action === 'analyze' || !action) {
      console.log(`Analyzing gaps for client ${clientId}...`);

      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('assessment_type, responses')
        .eq('client_id', clientId)
        .in('assessment_type', ['part1', 'part2']);

      const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
      const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};

      const gaps = detectGaps(part1, part2);
      const summary = generateEnrichmentSummary(gaps, part1, part2);

      // Group questions by priority for progressive disclosure
      const questionGroups = {
        critical: gaps.filter(g => g.priority === 'critical').map(g => ({
          ...g.question,
          context: g.context,
          impactOnRoadmap: g.impactOnRoadmap
        })),
        high: gaps.filter(g => g.priority === 'high').map(g => ({
          ...g.question,
          context: g.context,
          impactOnRoadmap: g.impactOnRoadmap
        })),
        medium: gaps.filter(g => g.priority === 'medium').map(g => ({
          ...g.question,
          context: g.context,
          impactOnRoadmap: g.impactOnRoadmap
        })),
        low: gaps.filter(g => g.priority === 'low').map(g => ({
          ...g.question,
          context: g.context,
          impactOnRoadmap: g.impactOnRoadmap
        }))
      };

      console.log(`Found ${gaps.length} gaps: ${summary.criticalGaps} critical, ${summary.highPriorityGaps} high`);

      return new Response(JSON.stringify({
        success: true,
        summary,
        questionGroups,
        allQuestions: gaps.map(g => ({
          ...g.question,
          priority: g.priority,
          context: g.context,
          impactOnRoadmap: g.impactOnRoadmap,
          field: g.field,
          gapType: g.gapType
        })),
        totalQuestions: gaps.length,
        estimatedTime: `${Math.ceil(gaps.length * 0.5)} minutes`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ACTION 2: Save follow-up responses and recalculate
    if (action === 'save-responses') {
      if (!followupResponses) {
        return new Response(JSON.stringify({ error: 'Missing followupResponses' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log(`Saving follow-up responses for client ${clientId}...`);

      // Get existing assessments
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('assessment_type, responses')
        .eq('client_id', clientId)
        .in('assessment_type', ['part1', 'part2', 'followup']);

      const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
      const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
      const existingFollowup = assessments?.find(a => a.assessment_type === 'followup')?.responses || {};

      // Merge new responses with existing
      const mergedFollowup = { ...existingFollowup, ...followupResponses };

      // Calculate enriched metrics
      const enrichedMetrics = calculateEnrichedMetrics(part1, part2, mergedFollowup);

      // Save follow-up as new assessment type
      await supabase.from('client_assessments').upsert({
        practice_id: practiceId,
        client_id: clientId,
        assessment_type: 'followup',
        responses: mergedFollowup,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, { onConflict: 'client_id,assessment_type' });

      // Update roadmap with enriched context
      const { data: roadmap } = await supabase
        .from('client_roadmaps')
        .select('id, roadmap_data')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (roadmap) {
        const updatedRoadmapData = {
          ...roadmap.roadmap_data,
          enrichedMetrics,
          followupCompleted: true,
          lastEnriched: new Date().toISOString()
        };

        await supabase
          .from('client_roadmaps')
          .update({ roadmap_data: updatedRoadmapData })
          .eq('id', roadmap.id);
      }

      // Check if there are remaining gaps
      const remainingGaps = detectGaps(part1, part2);
      const answeredFields = Object.keys(mergedFollowup);
      const unansweredGaps = remainingGaps.filter(g => !answeredFields.includes(g.question.id));

      console.log(`Saved ${Object.keys(followupResponses).length} responses. ${unansweredGaps.length} gaps remaining.`);

      return new Response(JSON.stringify({
        success: true,
        enrichedMetrics,
        responsesStored: Object.keys(mergedFollowup).length,
        remainingGaps: unansweredGaps.length,
        roadmapUpdated: !!roadmap,
        message: unansweredGaps.length === 0 
          ? 'All follow-up questions answered! Your roadmap is now fully enriched.'
          : `${unansweredGaps.length} optional questions remaining for additional insight.`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "analyze" or "save-responses"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// ============================================
// ENRICHED METRICS CALCULATION
// ============================================

function calculateEnrichedMetrics(part1: any, part2: any, followup: any): any {
  const currentHours = parseInt(followup.fu_current_hours_detailed) || parseInt(part2.current_working_hours) || 0;
  const targetHours = parseInt(part2.target_working_hours) || 0;
  const currentIncome = parseIncomeString(followup.fu_current_income) || parseIncomeString(part1.current_income);
  const desiredIncome = parseIncomeString(part1.desired_income);
  const revenue = parseRevenueString(part2.annual_turnover);
  const billableHours = parseInt(followup.fu_billable_percentage) || 0;

  // Calculate effective hourly rate
  const annualIncome = currentIncome * 12;
  const annualHours = currentHours * 48;
  const effectiveHourlyRate = annualHours > 0 ? Math.round(annualIncome / annualHours) : 0;

  // Calculate billable hourly rate
  const billableAnnualHours = billableHours * 48;
  const billableHourlyRate = billableAnnualHours > 0 ? Math.round(annualIncome / billableAnnualHours) : 0;

  // Profit margin
  const profitMargin = parseInt(followup.fu_profit_margin) || 0;
  const estimatedProfit = revenue * (profitMargin / 100);

  // Time breakdown if provided
  const hoursBreakdown = followup.fu_hours_breakdown || null;

  // Income gap analysis
  const incomeGap = desiredIncome - currentIncome;
  const incomeGapPercentage = currentIncome > 0 ? Math.round((incomeGap / currentIncome) * 100) : 0;

  // Hours gap analysis
  const hoursGap = currentHours - targetHours;
  const hoursGapPercentage = currentHours > 0 ? Math.round((hoursGap / currentHours) * 100) : 0;

  return {
    workingHours: {
      current: currentHours,
      target: targetHours,
      gap: hoursGap,
      gapPercentage: hoursGapPercentage,
      breakdown: hoursBreakdown
    },
    income: {
      current: currentIncome,
      desired: desiredIncome,
      gap: incomeGap,
      gapPercentage: incomeGapPercentage
    },
    hourlyRates: {
      effective: effectiveHourlyRate,
      billable: billableHourlyRate,
      target: targetHours > 0 && desiredIncome > 0 
        ? Math.round((desiredIncome * 12) / (targetHours * 48))
        : 0
    },
    profitability: {
      margin: profitMargin,
      estimatedProfit,
      revenue
    },
    cashRunway: followup.fu_cash_months || 'Unknown',
    teamContext: {
      size: part2.team_size,
      firstHireBudget: followup.fu_first_hire_budget,
      delegationBlockers: followup.fu_delegation_fear,
      utilization: followup.fu_team_utilization
    },
    businessModel: {
      averageCustomerValue: followup.fu_average_sale,
      salesCycle: followup.fu_sales_cycle,
      pricingModel: followup.fu_pricing_approach || part2.pricing_model
    },
    insights: generateInsights({
      effectiveHourlyRate,
      hoursGap,
      incomeGapPercentage,
      profitMargin,
      currentHours,
      billableHours,
      teamSize: part2.team_size
    })
  };
}

function generateInsights(metrics: any): string[] {
  const insights: string[] = [];

  if (metrics.effectiveHourlyRate > 0 && metrics.effectiveHourlyRate < 30) {
    insights.push(`⚠️ Your effective hourly rate (£${metrics.effectiveHourlyRate}) is below minimum wage equivalent when adjusted for unpaid hours`);
  } else if (metrics.effectiveHourlyRate > 0 && metrics.effectiveHourlyRate < 50) {
    insights.push(`Your effective hourly rate (£${metrics.effectiveHourlyRate}) suggests pricing or efficiency opportunities`);
  }

  if (metrics.currentHours > 50) {
    insights.push(`Working ${metrics.currentHours}+ hours/week is unsustainable - burnout risk is high`);
  }

  if (metrics.hoursGap > 20 && metrics.teamSize === 'Just me') {
    insights.push(`Reducing hours by ${metrics.hoursGap}/week while solo will require structural changes`);
  }

  if (metrics.incomeGapPercentage > 100) {
    insights.push(`Doubling+ income requires strategy changes, not just "working harder"`);
  }

  if (metrics.profitMargin > 0 && metrics.profitMargin < 15) {
    insights.push(`${metrics.profitMargin}% profit margin is thin - consider pricing before growth`);
  }

  if (metrics.billableHours > 0 && metrics.currentHours > 0) {
    const billablePercentage = Math.round((metrics.billableHours / metrics.currentHours) * 100);
    if (billablePercentage < 50) {
      insights.push(`Only ${billablePercentage}% of your time is billable - ${100 - billablePercentage}% is overhead to optimize`);
    }
  }

  return insights;
}

