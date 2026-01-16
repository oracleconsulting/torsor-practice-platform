// ============================================================================
// EDGE FUNCTION: generate-ma-insights
// ============================================================================
// Generates AI-powered narrative insights for Management Accounts
// Triggered when a financial snapshot is created or on manual regeneration
// 
// Philosophy: The AI doesn't produce the accounts—it interprets them.
// Every insight connects to the client's life goal, not just business metrics.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface MAInsight {
  category: string;
  finding: string;
  implication: string;
  action?: string;
  urgency: 'info' | 'consider' | 'action_needed';
}

interface MADecision {
  decision: string;
  supportingData: string[];
  consideration?: string;
}

interface MAWatchItem {
  metric: string;
  currentValue: string;
  threshold: string;
  checkDate: string;
}

interface LLMResponse {
  headline: {
    text: string;
    sentiment: 'positive' | 'neutral' | 'warning' | 'critical';
  };
  insights: MAInsight[];
  decisionsEnabled: MADecision[];
  watchList: MAWatchItem[];
  northStarConnection: {
    narrative: string;
    sentiment: 'closer' | 'stable' | 'further';
  };
  benchmarkHighlights?: {
    strengths: string[];
    concerns: string[];
  };
}

interface ClientContext {
  clientId: string;
  clientName: string;
  companyName: string;
  industry: string;
  industryCode?: string;
  northStar?: string;
  archetype?: string;
  emotionalAnchors: {
    painPhrases: string[];
    desirePhrases: string[];
  };
  knownGoals: string[];
  recentDecisions: string[];
  upcomingEvents: string[];
  advisorNotes: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-GB', { 
    style: 'currency', 
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-GB').format(value);
}

function buildTrendTable(snapshots: any[]): string {
  if (!snapshots.length) return 'No historical data available';
  
  const headers = ['Month', 'Revenue', 'Gross %', 'Net %', 'Cash'];
  const rows = snapshots.slice(0, 12).map(s => {
    const month = new Date(s.period_end_date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    return [
      month,
      formatCurrency(s.revenue),
      s.gross_margin_pct ? `${s.gross_margin_pct}%` : 'N/A',
      s.net_margin_pct ? `${s.net_margin_pct}%` : 'N/A',
      formatCurrency(s.cash_position)
    ].join(' | ');
  });
  
  return `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n${rows.map(r => `| ${r} |`).join('\n')}`;
}

// ============================================================================
// FETCH CLIENT CONTEXT
// ============================================================================

async function fetchClientContext(supabase: any, clientId: string): Promise<ClientContext> {
  console.log(`[MA Insights] Fetching context for client ${clientId}`);
  
  // Get client profile
  const { data: client } = await supabase
    .from('practice_members')
    .select('id, name, client_company')
    .eq('id', clientId)
    .single();
  
  // Get discovery data if available
  const { data: discovery } = await supabase
    .from('destination_discovery')
    .select('responses, extracted_anchors')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  // Get roadmap data if available (for North Star)
  const { data: roadmap } = await supabase
    .from('client_roadmaps')
    .select('roadmap_data')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle();
  
  // Get recent advisor context notes
  const { data: contextNotes } = await supabase
    .from('client_context')
    .select('content, context_type, priority_level')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  // Extract emotional anchors from discovery
  const anchors = discovery?.extracted_anchors || {};
  const responses = discovery?.responses || {};
  
  // Build North Star from various sources
  const northStar = roadmap?.roadmap_data?.fiveYearVision?.northStar 
    || responses?.tuesday_test 
    || responses?.ten_year_vision
    || null;
  
  // Extract pain and desire phrases
  const painPhrases: string[] = [
    ...(anchors?.painPhrases || []),
    ...(responses?.monday_frustration ? [responses.monday_frustration] : []),
    ...(responses?.money_worry ? [responses.money_worry] : []),
    ...(responses?.emergency_log ? [responses.emergency_log] : []),
  ].filter(Boolean).slice(0, 5);
  
  const desirePhrases: string[] = [
    ...(anchors?.desirePhrases || []),
    ...(responses?.magic_away_task ? [responses.magic_away_task] : []),
    ...(responses?.secret_pride ? [responses.secret_pride] : []),
    ...(responses?.winning_definition ? [responses.winning_definition] : []),
  ].filter(Boolean).slice(0, 5);
  
  // Extract known goals from context notes
  const knownGoals = contextNotes
    ?.filter((n: any) => n.context_type === 'note' || n.context_type === 'transcript')
    .map((n: any) => n.content)
    .slice(0, 5) || [];
  
  return {
    clientId,
    clientName: client?.name || 'Client',
    companyName: client?.client_company || 'Company',
    industry: responses?.industry || 'General Business',
    industryCode: responses?.sic_code || null,
    northStar,
    archetype: roadmap?.roadmap_data?.fitProfile?.archetype || null,
    emotionalAnchors: {
      painPhrases,
      desirePhrases,
    },
    knownGoals,
    recentDecisions: [],
    upcomingEvents: [],
    advisorNotes: contextNotes?.map((n: any) => n.content).slice(0, 3) || [],
  };
}

// ============================================================================
// GENERATE OPTIMIZATIONS (Phase 5)
// ============================================================================

function generateOptimizations(currentPeriod: any, assessment: any, comparison: any | null): any[] {
  const optimizations: any[] = [];
  
  // 1. Debtor days high?
  const debtorDays = parseFloat(currentPeriod.debtors_days?.toString() || '0');
  if (debtorDays > 40) {
    const improvement = debtorDays - 30;
    const debtors = parseFloat(currentPeriod.debtors_total?.toString() || '0');
    const cashRelease = debtors * (improvement / debtorDays);
    
    optimizations.push({
      category: 'working_capital',
      title: `Reduce debtor days from ${Math.round(debtorDays)} to 30`,
      description: `You're collecting ${Math.round(improvement)} days slower than best practice. This ties up cash unnecessarily.`,
      potential_impact: {
        type: 'cash_release',
        amount: Math.round(cashRelease),
        timeframe: '30-60 days',
        confidence: 'high',
        calculation: `£${Math.round(debtors).toLocaleString()} × (${Math.round(improvement)}/${Math.round(debtorDays)}) = £${Math.round(cashRelease).toLocaleString()}`
      },
      effort: 'quick_win',
      steps: [
        'Send statement to all accounts over 30 days',
        'Call top 5 debtors this week',
        'Consider offering 2% early payment discount',
        'Review payment terms on new contracts'
      ],
      priority: 1,
      urgency: 'immediate'
    });
  }
  
  // 2. Staff cost ratio high?
  const revenue = parseFloat(currentPeriod.revenue?.toString() || '0');
  const staffCosts = parseFloat(currentPeriod.staff_costs?.toString() || '0');
  const staffCostPct = revenue > 0 ? (staffCosts / revenue) * 100 : 0;
  
  if (staffCostPct > 35) {
    const targetRatio = 32;
    const targetStaffCost = revenue * (targetRatio / 100);
    const gap = staffCosts - targetStaffCost;
    
    optimizations.push({
      category: 'efficiency',
      title: 'Review staff cost ratio',
      description: `Staff costs at ${staffCostPct.toFixed(1)}% of revenue. Industry benchmark for your sector is 28-32%.`,
      potential_impact: {
        type: 'annual_saving',
        amount: Math.round(gap * 12),
        timeframe: '6-12 months',
        confidence: 'medium',
        calculation: `Reducing from ${staffCostPct.toFixed(1)}% to ${targetRatio}% saves £${Math.round(gap).toLocaleString()}/month`
      },
      effort: 'significant',
      steps: [
        'Benchmark salaries against market',
        'Review utilization by team member',
        'Identify automation opportunities',
        'Consider revenue increase strategies first'
      ],
      priority: 3,
      urgency: 'this_quarter'
    });
  }
  
  // 3. Price review needed? (simplified check)
  if (comparison && parseFloat(comparison.revenue_vs_prior_month_pct?.toString() || '0') < 0) {
    const potentialIncrease = revenue * 0.08; // Assume 8% increase possible
    
    optimizations.push({
      category: 'revenue_opportunity',
      title: 'Price review overdue',
      description: `Revenue declining. Prices likely haven't been reviewed recently. Inflation alone justifies 5-8% increase.`,
      potential_impact: {
        type: 'annual_revenue',
        amount: Math.round(potentialIncrease * 12 * 0.95), // Assume 5% churn
        timeframe: 'Immediate on new work, 3-6 months on existing',
        confidence: 'medium',
        calculation: `8% increase on £${Math.round(revenue).toLocaleString()}/month = £${Math.round(potentialIncrease).toLocaleString()}/month (net of 5% churn)`
      },
      effort: 'quick_win',
      steps: [
        'Review competitor pricing',
        'Start with new clients immediately',
        'Phase in for existing clients at contract renewal',
        'Position as annual cost-of-living adjustment'
      ],
      priority: 2,
      urgency: 'immediate'
    });
  }
  
  return optimizations.sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// FETCH BENCHMARK DATA
// ============================================================================

async function fetchBenchmark(
  supabase: any, 
  industryCode: string | null, 
  revenue: number | null
): Promise<any | null> {
  if (!industryCode || !revenue) return null;
  
  // Determine revenue band
  let revenueBand: string;
  if (revenue < 250000) revenueBand = 'under_250k';
  else if (revenue < 500000) revenueBand = '250k_500k';
  else if (revenue < 1000000) revenueBand = '500k_1m';
  else if (revenue < 2000000) revenueBand = '1m_2m';
  else if (revenue < 5000000) revenueBand = '2m_5m';
  else if (revenue < 10000000) revenueBand = '5m_10m';
  else revenueBand = 'over_10m';
  
  const currentYear = new Date().getFullYear();
  
  const { data: benchmark } = await supabase
    .from('ma_industry_benchmarks')
    .select('*')
    .eq('industry_code', industryCode)
    .eq('revenue_band', revenueBand)
    .gte('period_year', currentYear - 2)
    .order('period_year', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  return benchmark;
}

// ============================================================================
// BUILD THE PROMPT
// ============================================================================

function buildPrompt(
  snapshot: any,
  priorSnapshots: any[],
  clientContext: ClientContext,
  benchmark: any | null
): string {
  const periodDate = new Date(snapshot.period_end_date);
  const periodMonth = periodDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  
  return `
You are a senior management accountant preparing narrative insights for a monthly management pack.
Your role is to translate numbers into decisions, connecting financial reality to life goals.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. USE THEIR EXACT WORDS from emotional anchors where possible
2. BE SPECIFIC WITH NUMBERS - no vague statements like "strong performance"
3. THE HEADLINE should be quotable - something they'd text to their partner
4. CONNECT EVERYTHING to their life goal, not just business metrics
5. LIMIT TO 3-5 INSIGHTS MAXIMUM - quality over quantity
6. BE HONEST about bad news but frame constructively
7. DECISIONS ENABLED should answer questions they were probably wondering about

BANNED PHRASES (never use these):
- "Here's the truth:" or "Here's what I see:"
- "In a world where..."
- "I want to be direct with you" (just BE direct)
- "You've done the hard work of..." (patronising)
- "It doesn't mean X. It means Y." (over-explaining)
- "Strong performance" or "solid results" (too vague)
- "Moving forward" or "going forward"

═══════════════════════════════════════════════════════════════════════════════
CLIENT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Company: ${clientContext.companyName}
Industry: ${clientContext.industry}
Client Name: ${clientContext.clientName}

${clientContext.northStar ? `
NORTH STAR (their ultimate life goal):
"${clientContext.northStar}"
` : ''}

${clientContext.archetype ? `Client Archetype: ${clientContext.archetype}` : ''}

${clientContext.emotionalAnchors.desirePhrases.length > 0 ? `
WHAT THEY WANT (use these exact words):
${clientContext.emotionalAnchors.desirePhrases.map((p: string) => `- "${p}"`).join('\n')}
` : ''}

${clientContext.emotionalAnchors.painPhrases.length > 0 ? `
WHAT THEY'RE TRYING TO ESCAPE (use these exact words):
${clientContext.emotionalAnchors.painPhrases.map((p: string) => `- "${p}"`).join('\n')}
` : ''}

${clientContext.knownGoals.length > 0 ? `
KNOWN GOALS/DECISIONS THEY'RE CONSIDERING:
${clientContext.knownGoals.map((g: string) => `- ${g}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
THIS MONTH'S NUMBERS (${periodMonth})
═══════════════════════════════════════════════════════════════════════════════

PROFIT & LOSS
Revenue: ${formatCurrency(snapshot.revenue)}
  vs Prior Month: ${formatPercent(snapshot.revenue_vs_prior_month_pct)}
  vs Prior Year: ${formatPercent(snapshot.revenue_vs_prior_year_pct)}
  vs Budget: ${formatPercent(snapshot.revenue_vs_budget_pct)}

Gross Profit: ${formatCurrency(snapshot.gross_profit)} (${snapshot.gross_margin_pct || 'N/A'}%)
Operating Profit: ${formatCurrency(snapshot.operating_profit)} (${snapshot.operating_margin_pct || 'N/A'}%)
Net Profit: ${formatCurrency(snapshot.net_profit)} (${snapshot.net_margin_pct || 'N/A'}%)

BALANCE SHEET
Cash: ${formatCurrency(snapshot.cash_position)}
  vs Prior Month: ${formatCurrency(snapshot.cash_vs_prior_month)}
Debtors: ${formatCurrency(snapshot.debtors_total)} (${snapshot.debtors_days || 'N/A'} days)
Creditors: ${formatCurrency(snapshot.creditors_total)} (${snapshot.creditors_days || 'N/A'} days)

EFFICIENCY
Headcount: ${snapshot.headcount || 'N/A'}
Revenue per Head: ${formatCurrency(snapshot.revenue_per_head)}
Staff Costs as % Revenue: ${snapshot.staff_cost_pct_revenue || 'N/A'}%

═══════════════════════════════════════════════════════════════════════════════
TREND CONTEXT (12-Month History)
═══════════════════════════════════════════════════════════════════════════════

${buildTrendTable(priorSnapshots)}

${benchmark ? `
═══════════════════════════════════════════════════════════════════════════════
INDUSTRY BENCHMARKS (${benchmark.industry_name})
Revenue Band: ${benchmark.revenue_band.replace(/_/g, ' ')} | Sample: ${benchmark.sample_size || 'N/A'} companies
═══════════════════════════════════════════════════════════════════════════════

Your Position vs Industry:
- Gross Margin: Client ${snapshot.gross_margin_pct || 'N/A'}% vs Median ${benchmark.median_gross_margin_pct || 'N/A'}% (Top quartile: ${benchmark.top_quartile_gross_margin_pct || 'N/A'}%)
- Net Margin: Client ${snapshot.net_margin_pct || 'N/A'}% vs Median ${benchmark.median_net_margin_pct || 'N/A'}% (Top quartile: ${benchmark.top_quartile_net_margin_pct || 'N/A'}%)
- Debtor Days: Client ${snapshot.debtors_days || 'N/A'} vs Median ${benchmark.median_debtor_days || 'N/A'} (Top quartile: ${benchmark.top_quartile_debtor_days || 'N/A'})
- Revenue per Head: Client ${formatCurrency(snapshot.revenue_per_head)} vs Median ${formatCurrency(benchmark.median_revenue_per_head)}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Generate a JSON response with this exact structure:

{
  "headline": {
    "text": "One sentence that captures what the numbers are telling them this month. Make it quotable - something they'd text their partner. Use specific numbers.",
    "sentiment": "positive|neutral|warning|critical"
  },
  
  "insights": [
    {
      "category": "revenue|margin|cash|efficiency|growth|risk",
      "finding": "What the numbers objectively show (include specific figures)",
      "implication": "What this means for their business and LIFE goals",
      "action": "Specific thing they could do about it (optional if just informational)",
      "urgency": "info|consider|action_needed"
    }
  ],
  
  "decisionsEnabled": [
    {
      "decision": "A decision they can now confidently make based on these numbers",
      "supportingData": ["Data point 1", "Data point 2", "Data point 3"],
      "consideration": "One thing to keep in mind before acting (optional)"
    }
  ],
  
  "watchList": [
    {
      "metric": "What to monitor",
      "currentValue": "Where it is now (with units)",
      "threshold": "When it becomes concerning",
      "checkDate": "When to check again"
    }
  ],
  
  "northStarConnection": {
    "narrative": "2-3 sentences connecting this month's results to their North Star / life goal. Use their exact words from the emotional anchors. Be honest about whether this month moved them closer or further.",
    "sentiment": "closer|stable|further"
  }
}

QUALITY RULES:
- Maximum 5 insights (pick the most important)
- Maximum 3 decisions enabled
- Maximum 4 watch list items
- Every insight must have a specific number in the finding
- The headline must be under 25 words
- North star connection must use at least one of their exact phrases
- If data is missing, don't make up numbers - just note it's unavailable

ANTI-AI-SLOP RULES:
BANNED: Additionally, delve, crucial, pivotal, testament, underscores, highlights, showcases, fostering, tapestry, landscape, synergy, leverage, scalable, holistic, impactful, ecosystem
BANNED STRUCTURES: "Not only X but also Y", "It's important to note", "In summary", rule of three lists, "-ing" phrase endings
THE TEST: If it sounds like an annual report, rewrite it. Sound like a smart advisor over coffee.

Return ONLY valid JSON. No markdown, no explanation, just the JSON object.
`;
}

// ============================================================================
// CALL LLM
// ============================================================================

async function callLLM(prompt: string): Promise<{ response: LLMResponse; usage: any }> {
  const startTime = Date.now();
  
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co',
      'X-Title': 'Torsor MA Insights'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are a senior management accountant. You translate financial data into actionable insights that connect to the client\'s life goals. Always return valid JSON. Be specific with numbers. Use the client\'s exact words when available.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${error}`);
  }
  
  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from LLM');
  }
  
  // Parse JSON from response
  let parsed: LLMResponse;
  try {
    // Clean up response - remove markdown code blocks if present
    let jsonString = content.trim();
    
    // Remove markdown code block markers (handle various formats)
    jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/g, '');
    jsonString = jsonString.trim();
    
    // Find JSON object boundaries (handle cases where there's text before/after)
    const start = jsonString.indexOf('{');
    const end = jsonString.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      jsonString = jsonString.substring(start, end + 1);
    } else {
      throw new Error('No valid JSON object found in response');
    }
    
    parsed = JSON.parse(jsonString);
  } catch (e) {
    console.error('[MA Insights] Failed to parse LLM response:', content);
    throw new Error(`Invalid JSON from LLM: ${(e as Error).message}`);
  }
  
  // Validate required fields
  if (!parsed.headline?.text || !parsed.headline?.sentiment) {
    throw new Error('Missing required headline in LLM response');
  }
  if (!Array.isArray(parsed.insights)) {
    parsed.insights = [];
  }
  if (!Array.isArray(parsed.decisionsEnabled)) {
    parsed.decisionsEnabled = [];
  }
  if (!Array.isArray(parsed.watchList)) {
    parsed.watchList = [];
  }
  
  return {
    response: parsed,
    usage: {
      totalTokens: data.usage?.total_tokens || 0,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      cost: (data.usage?.total_tokens || 0) * 0.000003, // Approximate Sonnet cost
      timeMs: Date.now() - startTime
    }
  };
}

// ============================================================================
// V2 PROMPT BUILDER (Enhanced with extracted financials and true cash)
// ============================================================================

function buildV2Prompt(context: any): string {
  const {
    assessment,
    currentPeriod,
    priorPeriod,
    comparison,
    trueCash,
    clientName,
    companyName,
    trends,
    forecast,
    scenarios,
    optimizations
  } = context;
  
  const periodLabel = currentPeriod.period_label || 
    new Date(currentPeriod.period_end_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  
  function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return 'N/A';
    const absAmount = Math.abs(amount || 0);
    const formatted = new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absAmount);
    return amount < 0 ? `-${formatted}` : formatted;
  }
  
  function formatPercent(value: number | null | undefined, includeSign = true): string {
    if (value === null || value === undefined) return 'N/A';
    const sign = includeSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
  
  function formatPp(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}pp`;
  }
  
  return `
You are a senior management accountant preparing narrative insights for ${companyName}.
Your job is to translate their actual financial data into decisions, directly answering their specific questions.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. ANSWER THEIR SPECIFIC QUESTIONS using the financial data provided
2. USE THEIR EXACT WORDS from the assessment where possible (quoted below)
3. BE SPECIFIC WITH NUMBERS from the extracted financials - never estimate
4. THE HEADLINE should be quotable - one sentence with the key insight
5. TRUE CASH CALCULATION is critical - they specifically asked about this
6. DECISIONS ENABLED should directly address their decision_making_story
7. LIMIT TO 3-4 KEY INSIGHTS - quality over quantity

BANNED PHRASES (never use these):
- "Here's the truth:" / "Here's what I see:" / "Here's what's really happening:"
- "In a world where..." / "It's not about X. It's about Y."
- "I want to be direct with you" (just BE direct)
- "You've done the hard work of..." (patronising)
- "Strong performance" / "solid results" (too vague - use numbers)
- "Moving forward" / "going forward"
- "Based on the data..." (just state the finding)

═══════════════════════════════════════════════════════════════════════════════
THEIR ASSESSMENT RESPONSES (use their exact words)
═══════════════════════════════════════════════════════════════════════════════

TUESDAY FINANCIAL QUESTION (they want this answered):
"${assessment.tuesday_financial_question || assessment.tuesdayFinancialQuestion || 'Not provided'}"

MAGIC AWAY ONE FINANCIAL UNCERTAINTY:
"${assessment.magic_away_financial || assessment.magicAwayFinancial || 'Not provided'}"

DECISION-MAKING STORY (a real decision they struggled with):
"${assessment.decision_making_story || assessment.decisionMakingStory || 'Not provided'}"

WHAT KEEPS THEM AWAKE AT NIGHT:
${((assessment.kpi_priorities || assessment.kpiPriorities || [])).map((p: string) => `• "${p}"`).join('\n') || 'Not provided'}

WHAT WOULD CHANGE WITH GOOD MA:
${((assessment.ma_transformation_desires || assessment.maTransformationDesires || [])).map((d: string) => `• "${d}"`).join('\n') || 'Not provided'}

FINANCIAL VISIBILITY VISION:
"${assessment.financial_visibility_vision || assessment.financialVisibilityVision || 'Not provided'}"

═══════════════════════════════════════════════════════════════════════════════
THEIR ACTUAL FINANCIAL DATA (${periodLabel})
═══════════════════════════════════════════════════════════════════════════════

PROFIT & LOSS
Revenue: ${formatCurrency(currentPeriod.revenue || currentPeriod.revenue)}${comparison ? ` (${formatPercent(comparison.revenue_change_pct || comparison.revenueChangePct)} vs prior month)` : ''}
Gross Profit: ${formatCurrency(currentPeriod.gross_profit || currentPeriod.grossProfit)} (${currentPeriod.gross_margin_pct || currentPeriod.grossMarginPct || 'N/A'}%)
Operating Profit: ${formatCurrency(currentPeriod.operating_profit || currentPeriod.operatingProfit)} (${currentPeriod.operating_margin_pct || currentPeriod.operatingMarginPct || 'N/A'}%)${comparison ? ` → margin ${formatPp(comparison.operating_margin_change_pp || comparison.operatingMarginChangePp)}` : ''}
Net Profit: ${formatCurrency(currentPeriod.net_profit || currentPeriod.netProfit)}

COST BREAKDOWN
Staff Costs: ${formatCurrency(currentPeriod.staff_costs || currentPeriod.staffCosts)}${comparison ? ` (${formatPercent(comparison.staff_costs_change_pct || comparison.staffCostsChangePct)} vs prior)` : ''}
Other Overheads: ${formatCurrency(currentPeriod.other_overheads || currentPeriod.otherOverheads)}${comparison ? ` (${formatPercent(comparison.other_overheads_change_pct || comparison.otherOverheadsChangePct)} vs prior)` : ''}
Marketing: ${formatCurrency(currentPeriod.marketing_costs || currentPeriod.marketingCosts)}
Software: ${formatCurrency(currentPeriod.software_costs || currentPeriod.softwareCosts)}
Professional Fees: ${formatCurrency(currentPeriod.professional_fees || currentPeriod.professionalFees)}
Rent & Utilities: ${formatCurrency(currentPeriod.rent_utilities || currentPeriod.rentUtilities)}

BALANCE SHEET
Bank Balance: ${formatCurrency(currentPeriod.bank_balance || currentPeriod.bankBalance)}
Trade Debtors: ${formatCurrency(currentPeriod.trade_debtors || currentPeriod.tradeDebtors)} (${currentPeriod.debtor_days || currentPeriod.debtorDays || 'N/A'} days)
Trade Creditors: ${formatCurrency(currentPeriod.trade_creditors || currentPeriod.tradeCreditors)}
VAT Payable: ${formatCurrency(currentPeriod.vat_payable || currentPeriod.vatPayable)}
PAYE/NIC Payable: ${formatCurrency(currentPeriod.paye_nic_payable || currentPeriod.payeNicPayable)}
Director Loan: ${formatCurrency(currentPeriod.director_loan || currentPeriod.directorLoan)}
Net Assets: ${formatCurrency(currentPeriod.net_assets || currentPeriod.netAssets)}

${priorPeriod ? `
PRIOR PERIOD (${priorPeriod.period_label || priorPeriod.periodLabel || 'Prior Month'})
Revenue: ${formatCurrency(priorPeriod.revenue)}
Operating Profit: ${formatCurrency(priorPeriod.operating_profit || priorPeriod.operatingProfit)} (${priorPeriod.operating_margin_pct || priorPeriod.operatingMarginPct || 'N/A'}%)
Bank Balance: ${formatCurrency(priorPeriod.bank_balance || priorPeriod.bankBalance)}
Other Overheads: ${formatCurrency(priorPeriod.other_overheads || priorPeriod.otherOverheads)}
` : ''}

${trends && trends.trends ? `
═══════════════════════════════════════════════════════════════════════════════
TREND ANALYSIS (${trends.periodCount} periods of data)
═══════════════════════════════════════════════════════════════════════════════

Revenue Trend: ${trends.trends.revenue.direction} (${trends.trends.revenue.avgChange > 0 ? '+' : ''}${trends.trends.revenue.avgChange.toFixed(1)}% avg MoM change)
${trends.trends.revenue.narrative ? `→ ${trends.trends.revenue.narrative}` : ''}

Operating Margin Trend: ${trends.trends.operatingMargin.direction} (${trends.trends.operatingMargin.avgChange > 0 ? '+' : ''}${trends.trends.operatingMargin.avgChange.toFixed(1)}pp avg change)
${trends.trends.operatingMargin.narrative ? `→ ${trends.trends.operatingMargin.narrative}` : ''}

Debtor Days Trend: ${trends.trends.debtorDays.direction} (${trends.trends.debtorDays.avgChange > 0 ? '+' : ''}${trends.trends.debtorDays.avgChange.toFixed(1)} days avg change)
${trends.trends.debtorDays.narrative ? `→ ${trends.trends.debtorDays.narrative}` : ''}

${trends.seasonality && trends.seasonality.detected ? `
Seasonality Detected: ${trends.seasonality.pattern}
Peak months: ${trends.seasonality.peakMonths.join(', ')}
Trough months: ${trends.seasonality.troughMonths.join(', ')}
Peak-trough difference: ${trends.seasonality.peakTroughDelta.toFixed(1)}%
` : ''}
` : ''}

${forecast ? `
═══════════════════════════════════════════════════════════════════════════════
CASH FLOW FORECAST (13 weeks)
═══════════════════════════════════════════════════════════════════════════════

Opening Cash: ${formatCurrency(forecast.opening_cash || forecast.openingCash)}
Lowest Point: ${formatCurrency(forecast.lowestPointAmount)} in week ending ${forecast.lowestPointWeek}
Cash Runway: ${forecast.cashRunwayWeeks} weeks
Overall Sentiment: ${forecast.sentiment || 'comfortable'}

${forecast.criticalDates && forecast.criticalDates.length > 0 ? `
CRITICAL DATES:
${forecast.criticalDates.map((cd: any) => `• ${cd.date}: ${cd.event} (impact: ${formatCurrency(cd.impact)}, resulting balance: ${formatCurrency(cd.resulting_balance)})
  → ${cd.action_needed || cd.actionNeeded}`).join('\n')}
` : ''}

Assumptions: ${forecast.assumptions?.revenue_assumption || 'Based on historical averages'}
` : ''}

${scenarios && scenarios.scenarios && scenarios.scenarios.length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
SCENARIO MODELING (What-if analysis)
═══════════════════════════════════════════════════════════════════════════════

${scenarios.scenarios.map((s: any) => `
${s.name || s.scenario_name}:
Verdict: ${s.verdict?.verdict || s.verdict} - ${s.verdict?.verdictSummary || s.verdict_summary}
${s.impact ? `
  Monthly Revenue Impact: ${formatCurrency(s.impact.monthly_revenue_impact || s.impact.monthlyRevenueImpact)}
  Monthly Cost Impact: ${formatCurrency(s.impact.monthly_cost_impact || s.impact.monthlyCostImpact)}
  Monthly Profit Impact: ${formatCurrency(s.impact.monthly_profit_impact || s.impact.monthlyProfitImpact)}
  Breakeven: Month ${s.impact.breakeven_month || s.impact.breakevenMonth}
  Year 1 Impact: ${formatCurrency(s.impact.year_one_impact || s.impact.yearOneImpact)}
` : ''}
${s.verdict?.conditions && s.verdict.conditions.length > 0 ? `Conditions: ${s.verdict.conditions.join(', ')}` : ''}
${s.verdict?.risks && s.verdict.risks.length > 0 ? `Risks: ${s.verdict.risks.join('; ')}` : ''}
`).join('\n')}
` : ''}

${optimizations && optimizations.length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
OPTIMIZATION OPPORTUNITIES
═══════════════════════════════════════════════════════════════════════════════

${optimizations.map((opt: any) => `
${opt.title} (${opt.category})
Impact: ${opt.potential_impact?.type === 'cash_release' ? `£${opt.potential_impact.amount.toLocaleString()} cash release` :
          opt.potential_impact?.type === 'annual_saving' ? `£${opt.potential_impact.amount.toLocaleString()}/year saving` :
          opt.potential_impact?.type === 'annual_revenue' ? `£${opt.potential_impact.amount.toLocaleString()}/year revenue` :
          'See calculation'}
Timeframe: ${opt.potential_impact?.timeframe || 'TBC'}
Effort: ${opt.effort}
Priority: ${opt.priority}/5
Steps: ${opt.steps?.join('; ') || 'TBC'}
`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
TRUE CASH CALCULATION (this is critical - they asked about this)
═══════════════════════════════════════════════════════════════════════════════

${trueCash ? `
Bank Balance:           ${formatCurrency(trueCash.bank_balance || trueCash.bankBalance)}
Less: VAT Payable:     (${formatCurrency(trueCash.less_vat_payable || trueCash.lessVatPayable)})
Less: PAYE/NIC:        (${formatCurrency(trueCash.less_paye_nic || trueCash.lessPayeNic)})
Less: Director Loan:   (${formatCurrency(trueCash.less_director_loan || trueCash.lessDirectorLoan)})
───────────────────────────────────────
TRUE CASH AVAILABLE:   ${formatCurrency(trueCash.true_cash_available || trueCash.trueCashAvailable)} ${(trueCash.true_cash_available || trueCash.trueCashAvailable || 0) < 0 ? '⚠️ NEGATIVE' : ''}
` : `
TRUE CASH CALCULATION: Not yet calculated. Using bank balance from balance sheet.
BANK BALANCE: ${formatCurrency(currentPeriod.bank_balance || currentPeriod.bankBalance)}
`}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Generate a JSON response with this exact structure:

{
  "headline": {
    "text": "One quotable sentence capturing the key insight. Use specific numbers. Under 30 words. This should be something they'd text to their partner.",
    "sentiment": "positive|neutral|warning|critical - USE THESE CRITERIA:
      - positive: margins improving OR cash healthy OR growth profitable
      - neutral: stable performance, no major changes
      - warning: one concerning trend (margin erosion OR cash tight OR costs rising)
      - critical: multiple concerning trends OR cash negative OR immediate action needed"
  },
  
  "trueCashSection": {
    "narrative": "2-3 sentences explaining what the True Cash calculation means for them. Reference their exact words from 'magic_away_financial' if they asked about cash position. Be direct about whether they're in a healthy position or not.",
    "isHealthy": boolean,
    "implication": "What this means for their immediate decisions"
  },
  
  "tuesdayQuestionAnswer": {
    "originalQuestion": "Copy their exact tuesday_financial_question here",
    "answer": "2-4 sentences directly answering their question using the financial data. Be specific with numbers.",
    "supportingData": [
      "Specific data point 1 (e.g., 'Revenue up 6% but profit down 2%')",
      "Specific data point 2",
      "Specific data point 3"
    ],
    "verdict": "One sentence summary answer"
  },
  
  "keyInsights": [
    {
      "category": "margin|cash|cost|efficiency|growth|risk",
      "finding": "What the numbers objectively show (include specific figures)",
      "implication": "What this means for their business",
      "action": "Specific thing they could do about it",
      "urgency": "info|consider|action_needed|urgent",
      "dataPoints": ["Supporting number 1", "Supporting number 2"]
    }
  ],
  
  "decisionsEnabled": [
    {
      "decisionName": "Name of the decision (e.g., 'The delivery consultant hire')",
      "verdict": "YES|NO|WAIT|YES_IF|NO_UNLESS",
      "verdictSummary": "Lead with the answer: 'Yes, hire now' or 'No, not yet' or 'Wait until [specific trigger]'. Maximum 8 words.",
      "conditions": "The specific condition or caveat (e.g., 'if they can bill £8,000+/month within 90 days'). Leave empty if verdict is unconditional.",
      "fallback": "What to do if conditions aren't met (e.g., 'Collect the £52k in debtors first, then revisit'). Leave empty if not applicable.",
      "supportingData": ["Specific number 1", "Specific number 2", "Specific number 3"],
      "riskIfIgnored": "What happens if they make the wrong choice (e.g., 'Cash runway drops to 2 months')",
      "clientQuoteReferenced": "Their exact words about this decision if they mentioned it"
    }
  ],
  
  "watchList": [
    {
      "metric": "What to monitor",
      "currentValue": "Where it is now (with units)",
      "alertThreshold": "When it becomes concerning",
      "direction": "above|below",
      "checkFrequency": "Daily|Weekly|Monthly",
      "priority": "high|medium|low"
    }
  ],
  
  "clientQuotesUsed": [
    "Exact quote 1 from their assessment that you referenced",
    "Exact quote 2"
  ]
}

QUALITY RULES:
- Maximum 4 key insights (pick the most important)
- Maximum 3 decisions enabled
- Maximum 5 watch list items
- Every insight must reference specific numbers from the financial data
- The headline must be under 30 words with at least one specific number
- Tuesday question answer must directly address what they asked
- True cash section must acknowledge their specific concern if they mentioned cash/VAT/PAYE
- If their decision_making_story mentions a specific decision, address it directly in decisionsEnabled
- Use at least 3 of their exact quotes throughout the response
- Every decision MUST lead with a clear verdict (Yes/No/Wait) before any conditions
- Verdict summary must be 8 words or fewer
- If verdict is conditional (YES_IF, NO_UNLESS), the condition must include a specific number
- Fallback must be actionable, not vague (e.g., "wait until X" not "consider waiting")

ANTI-AI-SLOP RULES:
BANNED: Additionally, delve, crucial, pivotal, testament, underscores, highlights, showcases, fostering, tapestry, landscape, synergy, leverage, scalable, holistic, impactful, ecosystem
BANNED STRUCTURES: "Not only X but also Y", "It's important to note", "In summary", rule of three lists, "-ing" phrase endings
THE TEST: If it sounds like an annual report, rewrite it. Sound like a smart advisor over coffee.

Return ONLY valid JSON. No markdown, no explanation, just the JSON object.
`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    const { snapshotId, clientId, practiceId, regenerate, engagementId, periodEndDate } = body;
    
    console.log(`[MA Insights] Request received - regenerate: ${regenerate}, engagementId: ${engagementId}, clientId: ${clientId}, snapshotId: ${snapshotId}`);
    
    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // =========================================================================
    // MODE 1: Generate from clientId (assessment-based - no financial snapshot)
    // =========================================================================
    if (clientId && !snapshotId) {
      console.log(`[MA Insights] Generating insights from assessment for client ${clientId}`);
      
      // Fetch the service line assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('service_line_assessments')
        .select('*')
        .eq('client_id', clientId)
        .eq('service_line_code', 'management_accounts')
        .single();
      
      if (assessmentError || !assessment) {
        throw new Error(`Assessment not found for client: ${assessmentError?.message || 'No data'}`);
      }
      
      // Fetch client info
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('id, name, email, company, industry')
        .eq('id', clientId)
        .single();
      
      // Fetch any uploaded documents
      const { data: documents } = await supabase
        .from('client_context')
        .select('*')
        .eq('client_id', clientId)
        .eq('data_source_type', 'accounts');
      
      // Build assessment-based prompt
      const responses = assessment.responses || {};
      const insights = assessment.extracted_insights || {};
      
      const assessmentPrompt = `
You are a management accounts advisor generating personalized insights for a client.

## CLIENT INFORMATION
Name: ${clientData?.name || 'Unknown'}
Company: ${clientData?.company || 'Unknown'}
Industry: ${clientData?.industry || 'Unknown'}

## ASSESSMENT RESPONSES
${JSON.stringify(responses, null, 2)}

## EXTRACTED INSIGHTS
${JSON.stringify(insights, null, 2)}

## DOCUMENTS UPLOADED
${documents?.length || 0} documents uploaded

## YOUR TASK
Based on the client's assessment responses, generate:

1. **Headline** (1 sentence): A personalized summary of their financial visibility situation
2. **Key Insights** (3-5): Observations about their relationship with numbers and what they need
3. **Quick Wins** (2-3): Immediate actions that would help them
4. **Recommended Approach**: How we should approach their management accounts engagement
5. **Connection to Goals**: How better financial visibility connects to what they said they want

Use their exact words and phrases where possible. Be specific, not generic.

IMPORTANT: Respond with ONLY valid JSON. Do not wrap in markdown code blocks. Do not include any text before or after the JSON. Start with { and end with }.

Respond in JSON format:
{
  "headline": { "text": "...", "sentiment": "positive|neutral|warning" },
  "keyInsights": [{ "finding": "...", "implication": "...", "action": "..." }],
  "quickWins": [{ "action": "...", "impact": "...", "timeframe": "..." }],
  "recommendedApproach": { "summary": "...", "frequency": "...", "focusAreas": ["..."] },
  "goalsConnection": { "narrative": "...", "theirWords": ["..."] }
}
`;

      // Call LLM
      console.log(`[MA Insights] Calling LLM with assessment-based prompt...`);
      const { response: llmResponse, usage } = await callLLM(assessmentPrompt);
      console.log(`[MA Insights] LLM response received in ${usage.timeMs}ms`);
      
      // Store the insight (not shared by default - admin must approve)
      const { data: storedInsight, error: insertError } = await supabase
        .from('client_context')
        .insert({
          client_id: clientId,
          practice_id: practiceId,
          context_type: 'note',
          content: JSON.stringify(llmResponse),
          data_source_type: 'management_accounts_analysis',
          processed: true,
          is_shared: false // Admin must explicitly mark as available to client
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('[MA Insights] Error storing insight:', insertError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          insight: llmResponse,
          mode: 'assessment-based',
          usage
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // =========================================================================
    // MODE 2: Generate from engagementId (v2 - extracted financials + assessment)
    // =========================================================================
    if (engagementId) {
      console.log(`[MA Insights] Generating v2 insights for engagement ${engagementId}`);
      
      // Get engagement with client info
      const { data: engagement, error: engError } = await supabase
        .from('ma_engagements')
        .select(`
          *,
          practice_members!ma_engagements_client_id_fkey (
            id,
            name,
            client_company
          )
        `)
        .eq('id', engagementId)
        .single();
      
      if (engError || !engagement) {
        throw new Error(`Engagement not found: ${engError?.message}`);
      }
      
      const client = engagement.practice_members;
      
      // Get assessment responses from new table
      let { data: assessment } = await supabase
        .from('ma_assessment_responses')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // If not found in v2 table, try to sync from service_line_assessments
      if (!assessment) {
        console.log(`[MA Insights] No assessment in ma_assessment_responses, checking service_line_assessments...`);
        
        // Get client_id from engagement
        const clientId = engagement.practice_members?.id || engagement.client_id;
        
        // Check if assessment exists in old table
        const { data: oldAssessment } = await supabase
          .from('service_line_assessments')
          .select('*')
          .eq('client_id', clientId)
          .eq('service_line_code', 'management_accounts')
          .maybeSingle();
        
        if (oldAssessment && oldAssessment.completed_at) {
          console.log(`[MA Insights] Found assessment in service_line_assessments, syncing...`);
          
          // Try to sync using the function
          const { data: syncResult, error: syncError } = await supabase.rpc('sync_ma_assessment_for_engagement', {
            p_engagement_id: engagementId
          });
          
          if (syncError) {
            console.error('[MA Insights] Sync error:', syncError);
            // Fall back to manual sync
            const responses = oldAssessment.responses || {};
            const { data: newAssessment, error: insertError } = await supabase
              .from('ma_assessment_responses')
              .insert({
                engagement_id: engagementId,
                client_id: clientId,
                tuesday_financial_question: responses.ma_tuesday_financial_question,
                magic_away_financial: responses.ma_magic_away_financial,
                decision_making_story: responses.ma_decision_making_story,
                kpi_priorities: responses.ma_pain_points ? Array.isArray(responses.ma_pain_points) ? responses.ma_pain_points : [] : null,
                current_reporting_lag: responses.ma_reporting_lag,
                accounting_platform: responses.ma_accounting_platform,
                bookkeeping_currency: responses.ma_bookkeeping_currency,
                bookkeeping_owner: responses.ma_bookkeeping_owner,
                ma_transformation_desires: responses.ma_transformation_desires ? Array.isArray(responses.ma_transformation_desires) ? responses.ma_transformation_desires : [] : null,
                financial_visibility_vision: responses.ma_visibility_vision,
                reporting_frequency_preference: responses.ma_reporting_frequency,
                additional_reporting_needs: responses.ma_additional_reporting ? Array.isArray(responses.ma_additional_reporting) ? responses.ma_additional_reporting : [] : null,
                raw_responses: responses,
                completed_at: oldAssessment.completed_at
              })
              .select('*')
              .single();
            
            if (insertError) {
              throw new Error(`Failed to sync assessment: ${insertError.message}`);
            }
            assessment = newAssessment;
            console.log(`[MA Insights] Assessment synced successfully`);
          } else {
            // Re-fetch the synced assessment
            const { data: syncedAssessment } = await supabase
              .from('ma_assessment_responses')
              .select('*')
              .eq('engagement_id', engagementId)
              .single();
            assessment = syncedAssessment;
          }
        } else {
          throw new Error('No assessment found for this engagement. Please complete the assessment first.');
        }
      }
      
      // Get the most recent extracted financials
      let financialsQuery = supabase
        .from('ma_extracted_financials')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('period_end_date', { ascending: false });
      
      if (periodEndDate) {
        financialsQuery = financialsQuery.eq('period_end_date', periodEndDate);
      }
      
      const { data: financials } = await financialsQuery.limit(2);
      
      if (!financials || financials.length === 0) {
        throw new Error('No extracted financials found. Please upload and process a document first.');
      }
      
      const currentPeriod = financials[0];
      const priorPeriod = financials.length > 1 ? financials[1] : null;
      
      // Get true cash calculation
      const { data: trueCash, error: trueCashError } = await supabase
        .from('ma_true_cash_calculations')
        .select('*')
        .eq('extracted_financials_id', currentPeriod.id)
        .maybeSingle();
      
      if (trueCashError) {
        console.error('[MA Insights] Error fetching true cash:', trueCashError);
        // Continue without true cash - it will be calculated if missing
      }
      
      if (!trueCash) {
        console.warn('[MA Insights] True cash calculation not found, attempting to calculate...');
        // Try to trigger calculation by updating the extracted financials
        // The trigger should automatically calculate true cash
        const { error: updateError } = await supabase
          .from('ma_extracted_financials')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentPeriod.id);
        
        if (updateError) {
          console.error('[MA Insights] Error triggering true cash calculation:', updateError);
        }
        
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: retryTrueCash } = await supabase
          .from('ma_true_cash_calculations')
          .select('*')
          .eq('extracted_financials_id', currentPeriod.id)
          .maybeSingle();
        
        if (!retryTrueCash) {
          console.warn('[MA Insights] True cash still not found, continuing without it');
          // Continue without true cash - buildV2Prompt will handle null
        }
      }
      
      // Get comparison if available
      let comparison = null;
      if (priorPeriod) {
        const { data: comp } = await supabase
          .from('ma_period_comparisons')
          .select('*')
          .eq('current_period_id', currentPeriod.id)
          .eq('prior_period_id', priorPeriod.id)
          .maybeSingle();
        comparison = comp;
      }
      
      // Check for existing insight (unless regenerating)
      console.log(`[MA Insights] Regenerate flag: ${regenerate}`);
      if (!regenerate) {
        const { data: existing } = await supabase
          .from('ma_monthly_insights')
          .select('id, status')
          .eq('engagement_id', engagementId)
          .eq('period_end_date', currentPeriod.period_end_date)
          .maybeSingle();
        
        if (existing && existing.status !== 'generating') {
          console.log(`[MA Insights] Existing insight found: ${existing.id}, returning cached (regenerate=false)`);
          return new Response(
            JSON.stringify({ success: true, insightId: existing.id, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log(`[MA Insights] Regenerate=true, skipping existing insight check`);
      }
      
      // =====================================================================
      // PHASE 2-6: Generate trends, forecast, scenarios, and optimizations
      // =====================================================================
      
      // Create or get period record
      let periodRecord;
      const { data: existingPeriod } = await supabase
        .from('ma_periods')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('period_end', currentPeriod.period_end_date)
        .maybeSingle();
      
      if (existingPeriod) {
        periodRecord = existingPeriod;
      } else {
        // Create new period
        const { data: newPeriod, error: periodError } = await supabase
          .from('ma_periods')
          .insert({
            engagement_id: engagementId,
            period_type: 'month',
            period_start: new Date(new Date(currentPeriod.period_end_date).setDate(1)).toISOString().split('T')[0],
            period_end: currentPeriod.period_end_date,
            period_label: new Date(currentPeriod.period_end_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
            status: 'processing',
            extracted_financials_id: currentPeriod.id,
            data_received_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (periodError) {
          console.error('[MA Insights] Error creating period:', periodError);
        } else {
          periodRecord = newPeriod;
        }
      }
      
      // Save trend data for current period
      if (periodRecord) {
        const { error: trendError } = await supabase
          .from('ma_trend_data')
          .upsert({
            engagement_id: engagementId,
            period_id: periodRecord.id,
            period_end: currentPeriod.period_end_date,
            revenue: currentPeriod.revenue,
            gross_profit: currentPeriod.gross_profit,
            gross_margin_pct: currentPeriod.gross_margin_pct,
            operating_profit: currentPeriod.operating_profit,
            operating_margin_pct: currentPeriod.operating_margin_pct,
            net_profit: currentPeriod.net_profit,
            net_margin_pct: currentPeriod.net_margin_pct,
            bank_balance: currentPeriod.bank_balance,
            true_cash: trueCash?.true_cash_available || null,
            debtors: currentPeriod.debtors_total,
            debtor_days: currentPeriod.debtors_days,
            creditors: currentPeriod.creditors_total,
            creditor_days: currentPeriod.creditors_days,
            headcount: assessment?.ma_employee_count ? parseInt(assessment.ma_employee_count) : null,
            revenue_per_head: assessment?.ma_employee_count ? 
              parseFloat(currentPeriod.revenue?.toString() || '0') / parseInt(assessment.ma_employee_count) : null,
            staff_cost_pct: currentPeriod.staff_costs ? 
              (parseFloat(currentPeriod.staff_costs.toString()) / parseFloat(currentPeriod.revenue?.toString() || '1')) * 100 : null
          }, { onConflict: 'engagement_id,period_end' });
        
        if (trendError) {
          console.error('[MA Insights] Error saving trend data:', trendError);
        }
      }
      
      // Call calculate-ma-trends
      let trends = null;
      if (periodRecord) {
        try {
          const trendsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-ma-trends`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ engagementId, periodId: periodRecord.id })
          });
          
          if (trendsResponse.ok) {
            trends = await trendsResponse.json();
            console.log('[MA Insights] Trends calculated:', trends.periodCount, 'periods');
          }
        } catch (e) {
          console.warn('[MA Insights] Error calling calculate-ma-trends:', e);
        }
      }
      
      // Call generate-ma-forecast
      let forecast = null;
      if (periodRecord) {
        try {
          const forecastResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-ma-forecast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ engagementId, periodId: periodRecord.id })
          });
          
          if (forecastResponse.ok) {
            forecast = await forecastResponse.json();
            console.log('[MA Insights] Forecast generated:', forecast.weeks, 'weeks');
          }
        } catch (e) {
          console.warn('[MA Insights] Error calling generate-ma-forecast:', e);
        }
      }
      
      // Call generate-ma-scenarios
      let scenarios = null;
      if (periodRecord) {
        try {
          const scenariosResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-ma-scenarios`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ engagementId, periodId: periodRecord.id })
          });
          
          if (scenariosResponse.ok) {
            scenarios = await scenariosResponse.json();
            console.log('[MA Insights] Scenarios generated:', scenarios.scenariosGenerated);
          }
        } catch (e) {
          console.warn('[MA Insights] Error calling generate-ma-scenarios:', e);
        }
      }
      
      // Generate optimizations
      const optimizations = generateOptimizations(currentPeriod, assessment, comparison);
      
      // Build context and prompt (now includes trends, forecast, scenarios, optimizations)
      const context = {
        clientName: client?.name || 'Client',
        companyName: client?.client_company || 'Company',
        assessment,
        currentPeriod,
        priorPeriod,
        comparison,
        trueCash,
        trends,
        forecast,
        scenarios,
        optimizations
      };
      
      const prompt = buildV2Prompt(context);
      console.log(`[MA Insights] Calling LLM with v2 prompt (includes trends, forecast, scenarios, optimizations)...`);
      
      const { response: llmResponse, usage } = await callLLM(prompt);
      console.log(`[MA Insights] LLM response received in ${usage.timeMs}ms`);
      
      // Prepare insight data
      const insightData = {
        snapshot_id: null, // v2 mode doesn't use snapshots
        engagement_id: engagementId,
        extracted_financials_id: currentPeriod.id,
        assessment_id: assessment.id,
        period_end_date: currentPeriod.period_end_date,
        
        headline_text: llmResponse.headline.text,
        headline_sentiment: llmResponse.headline.sentiment,
        
        true_cash_narrative: llmResponse.trueCashSection?.narrative,
        true_cash_calculation_id: trueCash?.id || null,
        
        tuesday_question_original: llmResponse.tuesdayQuestionAnswer?.originalQuestion,
        tuesday_question_answer: llmResponse.tuesdayQuestionAnswer?.answer,
        tuesday_question_supporting_data: {
          supportingData: llmResponse.tuesdayQuestionAnswer?.supportingData,
          verdict: llmResponse.tuesdayQuestionAnswer?.verdict
        },
        
        insights: llmResponse.keyInsights,
        decisions_enabled: llmResponse.decisionsEnabled,
        watch_list: llmResponse.watchList,
        
        client_quotes_used: llmResponse.clientQuotesUsed,
        
        // Phase 2-6: Add new data
        trend_analysis: trends?.trends || null,
        cash_forecast: forecast ? {
          forecastId: forecast.forecastId,
          weeks: forecast.weeks,
          lowestPoint: forecast.lowestPoint,
          cashRunwayWeeks: forecast.cashRunwayWeeks,
          criticalDates: forecast.criticalDates,
          sentiment: forecast.sentiment
        } : null,
        scenarios: scenarios?.scenarios || null,
        optimizations: optimizations || null,
        
        llm_model: 'anthropic/claude-sonnet-4.5',
        llm_tokens_used: usage.totalTokens,
        llm_cost: usage.cost,
        generation_time_ms: usage.timeMs,
        prompt_version: 'v2',
        
        status: 'generated'
      };
      
      // Upsert the insight
      // For v2 mode, we use engagement_id + period_end_date as the unique key
      // First check if it exists
      const { data: existing } = await supabase
        .from('ma_monthly_insights')
        .select('id')
        .eq('engagement_id', engagementId)
        .eq('period_end_date', currentPeriod.period_end_date)
        .is('snapshot_id', null) // Only v2 insights
        .maybeSingle();
      
      let insight;
      if (existing) {
        // Update existing
        const { data: updated, error: updateError } = await supabase
          .from('ma_monthly_insights')
          .update(insightData)
          .eq('id', existing.id)
          .select('id')
          .single();
        
        if (updateError) {
          throw new Error(`Failed to update insight: ${updateError.message}`);
        }
        insight = updated;
      } else {
        // Insert new
        const { data: inserted, error: insertError } = await supabase
          .from('ma_monthly_insights')
          .insert(insightData)
          .select('id')
          .single();
        
        if (insertError) {
          throw new Error(`Failed to save insight: ${insertError.message}`);
        }
        insight = inserted;
      }
      
      // Save optimizations to database
      if (optimizations && optimizations.length > 0 && periodRecord) {
        // Delete existing optimizations for this period first (to avoid duplicates on regeneration)
        await supabase
          .from('ma_optimisations')
          .delete()
          .eq('engagement_id', engagementId)
          .eq('period_id', periodRecord.id);
        
        // Insert new optimizations
        const optimizationsToInsert = optimizations.map(opt => ({
          engagement_id: engagementId,
          period_id: periodRecord.id,
          category: opt.category,
          title: opt.title,
          description: opt.description,
          potential_impact: opt.potential_impact,
          effort: opt.effort,
          steps: opt.steps,
          priority: opt.priority,
          urgency: opt.urgency,
          status: 'suggested'
        }));
        
        const { error: optError } = await supabase
          .from('ma_optimisations')
          .insert(optimizationsToInsert);
        
        if (optError) {
          console.error(`[MA Insights] Error saving optimizations:`, optError);
        } else {
          console.log(`[MA Insights] Saved ${optimizations.length} optimizations`);
        }
      }
      
      // Update period status
      if (periodRecord) {
        await supabase
          .from('ma_periods')
          .update({ 
            insight_id: insight.id,
            status: 'review',
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', periodRecord.id);
        console.log(`[MA Insights] Updated period ${periodRecord.id} to 'review' status`);
      }
      
      console.log(`[MA Insights] Saved v2 insight: ${insight.id}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          insightId: insight.id,
          periodId: periodRecord?.id || null,
          trendsGenerated: !!trends,
          forecastGenerated: !!forecast,
          scenariosGenerated: scenarios?.scenariosGenerated || 0,
          optimizationsGenerated: optimizations?.length || 0,
          usage: {
            tokens: usage.totalTokens,
            cost: usage.cost,
            timeMs: usage.timeMs
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // =========================================================================
    // MODE 2: Generate from snapshotId (financial snapshot-based)
    // =========================================================================
    if (!snapshotId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either snapshotId or clientId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[MA Insights] Generating insights for snapshot ${snapshotId}`);
    
    // Fetch the snapshot with engagement data
    const { data: snapshot, error: snapshotError } = await supabase
      .from('ma_financial_snapshots')
      .select(`
        *,
        ma_engagements!inner (
          id,
          client_id,
          practice_id,
          settings
        )
      `)
      .eq('id', snapshotId)
      .single();
    
    if (snapshotError || !snapshot) {
      throw new Error(`Snapshot not found: ${snapshotError?.message || 'No data'}`);
    }
    
    const snapshotClientId = snapshot.ma_engagements.client_id;
    const snapshotEngagementId = snapshot.engagement_id;
    
    console.log(`[MA Insights] Client ID: ${snapshotClientId}, Engagement ID: ${snapshotEngagementId}`);
    
    // Check for existing insight (unless regenerating)
    if (!regenerate) {
      const { data: existingInsight } = await supabase
        .from('ma_monthly_insights')
        .select('id, status')
        .eq('snapshot_id', snapshotId)
        .maybeSingle();
      
      if (existingInsight && existingInsight.status !== 'generating') {
        console.log(`[MA Insights] Insight already exists: ${existingInsight.id}`);
        return new Response(
          JSON.stringify({ success: true, insightId: existingInsight.id, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Fetch prior snapshots for trend analysis
    const { data: priorSnapshots } = await supabase
      .from('ma_financial_snapshots')
      .select('*')
      .eq('engagement_id', snapshotEngagementId)
      .lt('period_end_date', snapshot.period_end_date)
      .order('period_end_date', { ascending: false })
      .limit(12);
    
    // Fetch client context
    const clientContext = await fetchClientContext(supabase, snapshotClientId);
    console.log(`[MA Insights] Client context loaded: ${clientContext.companyName}`);
    console.log(`[MA Insights] North Star: ${clientContext.northStar || 'Not set'}`);
    
    // Fetch benchmark if available
    const annualRevenue = (snapshot.revenue || 0) * (snapshot.period_type === 'quarter' ? 4 : 12);
    const benchmark = await fetchBenchmark(supabase, clientContext.industryCode, annualRevenue);
    if (benchmark) {
      console.log(`[MA Insights] Benchmark loaded: ${benchmark.industry_name}`);
    }
    
    // Build and execute prompt
    const prompt = buildPrompt(snapshot, priorSnapshots || [], clientContext, benchmark);
    console.log(`[MA Insights] Prompt built (${prompt.length} chars), calling LLM...`);
    
    const { response: llmResponse, usage } = await callLLM(prompt);
    console.log(`[MA Insights] LLM response received in ${usage.timeMs}ms`);
    
    // Prepare insight data for upsert
    const insightData = {
      snapshot_id: snapshotId,
      engagement_id: snapshotEngagementId,
      period_end_date: snapshot.period_end_date,
      headline_text: llmResponse.headline.text,
      headline_sentiment: llmResponse.headline.sentiment,
      insights: llmResponse.insights,
      decisions_enabled: llmResponse.decisionsEnabled,
      watch_list: llmResponse.watchList,
      north_star_connection: llmResponse.northStarConnection?.narrative || null,
      north_star_sentiment: llmResponse.northStarConnection?.sentiment || null,
      benchmark_comparison: benchmark ? {
        industryName: benchmark.industry_name,
        revenueBand: benchmark.revenue_band,
        highlights: llmResponse.benchmarkHighlights || null
      } : null,
      llm_model: 'anthropic/claude-sonnet-4.5',
      llm_tokens_used: usage.totalTokens,
      llm_cost: usage.cost,
      generation_time_ms: usage.timeMs,
      generation_prompt_version: 'v1',
      status: 'generated'
    };
    
    // Upsert the insight (update if exists, insert if not)
    const { data: insight, error: insertError } = await supabase
      .from('ma_monthly_insights')
      .upsert(insightData, { 
        onConflict: 'snapshot_id',
        ignoreDuplicates: false 
      })
      .select('id')
      .single();
    
    if (insertError) {
      throw new Error(`Failed to save insight: ${insertError.message}`);
    }
    
    console.log(`[MA Insights] Insight saved: ${insight.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        insightId: insight.id,
        usage: {
          tokens: usage.totalTokens,
          cost: usage.cost,
          timeMs: usage.timeMs
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[MA Insights] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

