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
    companyName
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

═══════════════════════════════════════════════════════════════════════════════
TRUE CASH CALCULATION (this is critical - they asked about this)
═══════════════════════════════════════════════════════════════════════════════

Bank Balance:           ${formatCurrency(trueCash.bank_balance || trueCash.bankBalance)}
Less: VAT Payable:     (${formatCurrency(trueCash.less_vat_payable || trueCash.lessVatPayable)})
Less: PAYE/NIC:        (${formatCurrency(trueCash.less_paye_nic || trueCash.lessPayeNic)})
Less: Director Loan:   (${formatCurrency(trueCash.less_director_loan || trueCash.lessDirectorLoan)})
───────────────────────────────────────
TRUE CASH AVAILABLE:   ${formatCurrency(trueCash.true_cash_available || trueCash.trueCashAvailable)} ${(trueCash.true_cash_available || trueCash.trueCashAvailable || 0) < 0 ? '⚠️ NEGATIVE' : ''}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Generate a JSON response with this exact structure:

{
  "headline": {
    "text": "One quotable sentence capturing the key insight. Use specific numbers. Under 30 words. This should be something they'd text to their partner.",
    "sentiment": "positive|neutral|warning|critical"
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
      "recommendation": "Clear recommendation: Do it / Don't do it / Wait",
      "supportingData": ["Data point 1", "Data point 2", "Data point 3"],
      "consideration": "One thing to keep in mind (optional)",
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
      const { data: assessment } = await supabase
        .from('ma_assessment_responses')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!assessment) {
        throw new Error('No assessment found for this engagement. Please complete the assessment first.');
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
        .single();
      
      if (trueCashError || !trueCash) {
        throw new Error('True cash calculation not found. Please ensure financials have been extracted.');
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
      if (!regenerate) {
        const { data: existing } = await supabase
          .from('ma_monthly_insights')
          .select('id, status')
          .eq('engagement_id', engagementId)
          .eq('period_end_date', currentPeriod.period_end_date)
          .maybeSingle();
        
        if (existing && existing.status !== 'generating') {
          console.log(`[MA Insights] Existing insight found: ${existing.id}`);
          return new Response(
            JSON.stringify({ success: true, insightId: existing.id, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Build context and prompt
      const context = {
        clientName: client?.name || 'Client',
        companyName: client?.client_company || 'Company',
        assessment,
        currentPeriod,
        priorPeriod,
        comparison,
        trueCash
      };
      
      const prompt = buildV2Prompt(context);
      console.log(`[MA Insights] Calling LLM with v2 prompt...`);
      
      const { response: llmResponse, usage } = await callLLM(prompt);
      console.log(`[MA Insights] LLM response received in ${usage.timeMs}ms`);
      
      // Prepare insight data
      const insightData = {
        engagement_id: engagementId,
        extracted_financials_id: currentPeriod.id,
        assessment_id: assessment.id,
        period_end_date: currentPeriod.period_end_date,
        
        headline_text: llmResponse.headline.text,
        headline_sentiment: llmResponse.headline.sentiment,
        
        true_cash_narrative: llmResponse.trueCashSection?.narrative,
        true_cash_calculation_id: trueCash.id,
        
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
        
        llm_model: 'anthropic/claude-sonnet-4.5',
        llm_tokens_used: usage.totalTokens,
        llm_cost: usage.cost,
        generation_time_ms: usage.timeMs,
        prompt_version: 'v2',
        
        status: 'generated'
      };
      
      // Upsert the insight
      const { data: insight, error: insertError } = await supabase
        .from('ma_monthly_insights')
        .upsert(insightData, { 
          onConflict: 'engagement_id,period_end_date',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();
      
      if (insertError) {
        throw new Error(`Failed to save insight: ${insertError.message}`);
      }
      
      console.log(`[MA Insights] Saved v2 insight: ${insight.id}`);
      
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
    
    console.log(`[MA Insights] Client ID: ${snapshotClientId}, Engagement ID: ${engagementId}`);
    
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
      .eq('engagement_id', engagementId)
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

