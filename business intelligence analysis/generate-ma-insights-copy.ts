import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface FinancialData {
  revenue?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  overheads?: number;
  operating_profit?: number;
  net_profit?: number;
  cash_at_bank?: number;
  true_cash?: number;
  true_cash_runway_months?: number;
  vat_liability?: number;
  paye_liability?: number;
  corporation_tax_liability?: number;
  trade_debtors?: number;
  trade_creditors?: number;
  monthly_operating_costs?: number;
  payroll_costs?: number;
}

interface KPIData {
  kpi_code: string;
  value: number;
  target_value?: number;
  previous_value?: number;
  rag_status?: string;
}

interface PreviousPeriodData {
  period_label: string;
  financial_data?: FinancialData;
  kpis?: KPIData[];
}

interface GenerateInsightsRequest {
  engagementId: string;
  periodId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  clientName: string;
  clientContext?: string; // From assessment - their goals, pain points, industry
  financialData: FinancialData;
  kpis: KPIData[];
  previousPeriod?: PreviousPeriodData;
  tuesdayQuestion?: string;
}

interface GeneratedInsight {
  insight_type: 'observation' | 'warning' | 'opportunity' | 'recommendation' | 'action_required';
  category: string;
  headline: string;
  description: string;
  data_points: string[]; // Specific numbers backing this insight
  implications: string; // What this means for the business
  recommended_action?: string; // What to do about it
  priority: 'critical' | 'high' | 'medium' | 'low';
  show_to_client: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: GenerateInsightsRequest = await req.json();
    const {
      engagementId,
      periodId,
      tier,
      clientName,
      clientContext,
      financialData,
      kpis,
      previousPeriod,
      tuesdayQuestion,
    } = request;

    console.log(`[generate-ma-insights] Generating insights for ${clientName}, tier: ${tier}`);

    // FIRST: Delete existing AI-generated draft insights for this period
    // This prevents duplicate insights from accumulating
    const { data: deletedInsights, error: deleteError } = await supabase
      .from('ma_insights')
      .delete()
      .eq('period_id', periodId)
      .eq('is_auto_generated', true)
      .eq('status', 'draft')
      .select('id');

    if (deleteError) {
      console.error("[generate-ma-insights] Error deleting old drafts:", deleteError);
      // Continue anyway - not critical
    } else {
      console.log(`[generate-ma-insights] Cleared ${deletedInsights?.length || 0} existing AI draft insights`);
    }

    // Build the comprehensive prompt
    const prompt = buildInsightPrompt({
      clientName,
      tier,
      clientContext,
      financialData,
      kpis,
      previousPeriod,
      tuesdayQuestion,
    });

    // Call OpenRouter API with Claude Sonnet 4.5
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://torsor.co.uk",
        "X-Title": "Torsor MA Insights",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-ma-insights] OpenRouter API error:", errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("[generate-ma-insights] No content in response:", aiResponse);
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let insights: GeneratedInsight[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }
      insights = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("[generate-ma-insights] Failed to parse response:", content);
      throw new Error("Failed to parse insights from AI response");
    }

    console.log(`[generate-ma-insights] Raw insights from AI: ${insights.length}`);

    // Deduplicate insights based on similarity
    insights = deduplicateInsights(insights);
    
    // Enforce tier limits
    const maxInsights = getExactInsightCount(tier);
    if (insights.length > maxInsights) {
      console.log(`[generate-ma-insights] Trimming from ${insights.length} to ${maxInsights} insights`);
      // Keep highest priority insights, ensuring category diversity
      insights = enforceInsightLimits(insights, maxInsights);
    }

    console.log(`[generate-ma-insights] Final insight count: ${insights.length}`);

    // Get engagement_id from period
    const { data: periodData } = await supabase
      .from('ma_periods')
      .select('engagement_id')
      .eq('id', periodId)
      .single();

    if (!periodData) {
      throw new Error('Period not found');
    }

    // Save insights to database with 'draft' status for review
    const insightsToInsert = insights.map((insight, index) => ({
      period_id: periodId,
      engagement_id: periodData.engagement_id,
      insight_type: insight.insight_type,
      category: mapCategory(insight.category),
      title: insight.headline,
      description: insight.description + (insight.implications ? `\n\n**Impact:** ${insight.implications}` : ''),
      recommendation: insight.recommended_action,
      recommendation_priority: insight.priority,
      data_points: insight.data_points,
      implications: insight.implications,
      priority: insight.priority,
      show_to_client: insight.show_to_client,
      display_order: index + 1,
      status: 'draft',
      is_auto_generated: true,
      original_content: insight, // Store original AI content for reference
    }));

    const { data: savedInsights, error: insertError } = await supabase
      .from('ma_insights')
      .insert(insightsToInsert)
      .select();

    if (insertError) {
      console.error("[generate-ma-insights] Failed to save insights:", insertError);
      throw new Error("Failed to save insights: " + insertError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        insights: savedInsights,
        count: insights.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[generate-ma-insights] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildInsightPrompt(data: {
  clientName: string;
  tier: string;
  clientContext?: string;
  financialData: FinancialData;
  kpis: KPIData[];
  previousPeriod?: PreviousPeriodData;
  tuesdayQuestion?: string;
}): string {
  const { clientName, tier, clientContext, financialData, kpis, previousPeriod, tuesdayQuestion } = data;

  // Calculate key metrics
  const metrics = calculateMetrics(financialData, previousPeriod?.financial_data);
  const exactCount = getExactInsightCount(tier);

  return `You are an elite management accountant preparing monthly insights for a client.

## CRITICAL RULES - READ CAREFULLY

**EXACT COUNT: Generate EXACTLY ${exactCount} insights. Not more, not less.**

**ZERO DUPLICATION**: Each insight MUST cover a DIFFERENT topic. Do NOT:
- Say the same thing in different words
- Cover the same metric multiple times with different angles
- Repeat findings about cash runway, debtors, margins, etc.
- Create variations of the same insight

**QUALITY OVER QUANTITY**: ${exactCount} excellent, diverse insights beat 15 repetitive ones.

**ONE INSIGHT PER TOPIC**: You may only have ONE insight about each of:
- Cash runway / true cash position
- Debtor collection opportunity
- Tax liabilities
- Gross margin
- Payroll costs
- Creditor management
- Revenue growth needs

## CLIENT CONTEXT
**Client:** ${clientName}
**Service Tier:** ${tier.toUpperCase()}
${clientContext ? `**Background:** ${clientContext}` : ''}
${tuesdayQuestion ? `**Their Key Question This Period:** "${tuesdayQuestion}"` : ''}

## THIS PERIOD'S FINANCIAL DATA
${formatFinancialData(financialData)}

## KEY PERFORMANCE INDICATORS
${formatKPIs(kpis)}

## CALCULATED METRICS
${formatCalculatedMetrics(metrics)}

${previousPeriod ? `
## PREVIOUS PERIOD COMPARISON
**Period:** ${previousPeriod.period_label}
${previousPeriod.financial_data ? formatFinancialData(previousPeriod.financial_data) : 'No financial data available'}
` : ''}

## YOUR TASK

Generate EXACTLY ${exactCount} UNIQUE insights covering DIFFERENT aspects of this business.

### REQUIRED DIVERSITY - Cover these ${exactCount} DIFFERENT topics:
${generateTopicList(tier, !!tuesdayQuestion)}

### INSIGHT REQUIREMENTS:
1. **Lead with impact** - Start with the business implication, not the number
2. **Show your working** - Include the specific calculations
3. **Be prescriptive** - Recommend specific actions
4. **No duplication** - Each insight must be about a DIFFERENT aspect

### INSIGHT TYPES:
- **action_required**: Urgent - needs immediate attention
- **warning**: Concerning trend that needs monitoring
- **opportunity**: Positive finding with upside potential
- **recommendation**: Specific advice for improvement
- **observation**: Neutral finding of note

### PRIORITY LEVELS:
- **critical**: Threatens business viability
- **high**: Significant financial impact, action needed this period
- **medium**: Important but not urgent
- **low**: Minor optimization

${tuesdayQuestion ? `
### MANDATORY: ANSWER THEIR TUESDAY QUESTION
One of your ${exactCount} insights MUST directly answer: "${tuesdayQuestion}"
` : ''}

## OUTPUT FORMAT

Return a JSON array of EXACTLY ${exactCount} insights:
[
  {
    "insight_type": "action_required" | "warning" | "opportunity" | "recommendation" | "observation",
    "category": "Cash & Liquidity" | "Profitability" | "Working Capital" | "Revenue & Growth" | "Strategic",
    "headline": "Punchy headline with key number (max 80 chars)",
    "description": "2-4 sentences with specific numbers and analysis.",
    "data_points": ["£X value", "Y% metric"], // 2-4 specific data points
    "implications": "One clear sentence on business impact.",
    "recommended_action": "Action starting with a verb.",
    "priority": "critical" | "high" | "medium" | "low",
    "show_to_client": true
  }
]

## BEFORE YOU RESPOND - CHECKLIST:
✓ Exactly ${exactCount} insights?
✓ Each insight covers a DIFFERENT topic?
✓ No two insights about the same metric/finding?
✓ Mix of categories (Cash, Profitability, Working Capital, Growth, Strategic)?
${tuesdayQuestion ? '✓ One insight answers the Tuesday Question?' : ''}

Return ONLY the JSON array, no other text.`;
}

function calculateMetrics(current: FinancialData, previous?: FinancialData): Record<string, any> {
  const metrics: Record<string, any> = {};

  // Gross margin
  if (current.revenue && current.gross_profit) {
    metrics.grossMarginPct = ((current.gross_profit / current.revenue) * 100).toFixed(1);
  }

  // Net margin
  if (current.revenue && current.net_profit) {
    metrics.netMarginPct = ((current.net_profit / current.revenue) * 100).toFixed(1);
  }

  // Operating margin
  if (current.revenue && current.operating_profit) {
    metrics.operatingMarginPct = ((current.operating_profit / current.revenue) * 100).toFixed(1);
  }

  // True cash vs bank
  if (current.cash_at_bank && current.true_cash) {
    metrics.cashDifference = current.cash_at_bank - current.true_cash;
    metrics.cashDifferencePct = (((current.cash_at_bank - current.true_cash) / current.cash_at_bank) * 100).toFixed(1);
  }

  // Runway
  if (current.true_cash && current.monthly_operating_costs) {
    metrics.runwayMonths = (current.true_cash / current.monthly_operating_costs).toFixed(1);
  }

  // Period-over-period changes
  if (previous) {
    if (current.revenue && previous.revenue) {
      const change = current.revenue - previous.revenue;
      metrics.revenueChange = change;
      metrics.revenueChangePct = ((change / previous.revenue) * 100).toFixed(1);
    }
    if (current.gross_profit && previous.gross_profit) {
      const change = current.gross_profit - previous.gross_profit;
      metrics.grossProfitChange = change;
      metrics.grossProfitChangePct = ((change / previous.gross_profit) * 100).toFixed(1);
    }
    if (current.net_profit && previous.net_profit) {
      const change = current.net_profit - previous.net_profit;
      metrics.netProfitChange = change;
      metrics.netProfitChangePct = ((change / previous.net_profit) * 100).toFixed(1);
    }
  }

  return metrics;
}

function formatFinancialData(data: FinancialData): string {
  const lines: string[] = [];
  
  if (data.revenue !== undefined) lines.push(`- Revenue: £${data.revenue.toLocaleString()}`);
  if (data.cost_of_sales !== undefined) lines.push(`- Cost of Sales: £${data.cost_of_sales.toLocaleString()}`);
  if (data.gross_profit !== undefined) lines.push(`- Gross Profit: £${data.gross_profit.toLocaleString()}`);
  if (data.overheads !== undefined) lines.push(`- Overheads: £${data.overheads.toLocaleString()}`);
  if (data.operating_profit !== undefined) lines.push(`- Operating Profit: £${data.operating_profit.toLocaleString()}`);
  if (data.net_profit !== undefined) lines.push(`- Net Profit: £${data.net_profit.toLocaleString()}`);
  if (data.cash_at_bank !== undefined) lines.push(`- Cash at Bank: £${data.cash_at_bank.toLocaleString()}`);
  if (data.true_cash !== undefined) lines.push(`- True Cash (after liabilities): £${data.true_cash.toLocaleString()}`);
  if (data.true_cash_runway_months !== undefined) lines.push(`- True Cash Runway: ${data.true_cash_runway_months} months`);
  if (data.vat_liability !== undefined) lines.push(`- VAT Liability: £${data.vat_liability.toLocaleString()}`);
  if (data.paye_liability !== undefined) lines.push(`- PAYE/NI Liability: £${data.paye_liability.toLocaleString()}`);
  if (data.corporation_tax_liability !== undefined) lines.push(`- Corporation Tax Provision: £${data.corporation_tax_liability.toLocaleString()}`);
  if (data.trade_debtors !== undefined) lines.push(`- Trade Debtors: £${data.trade_debtors.toLocaleString()}`);
  if (data.trade_creditors !== undefined) lines.push(`- Trade Creditors: £${data.trade_creditors.toLocaleString()}`);
  if (data.monthly_operating_costs !== undefined) lines.push(`- Monthly Operating Costs (Burn Rate): £${data.monthly_operating_costs.toLocaleString()}`);
  if (data.payroll_costs !== undefined) lines.push(`- Monthly Payroll: £${data.payroll_costs.toLocaleString()}`);

  return lines.length > 0 ? lines.join('\n') : 'No financial data provided';
}

function formatKPIs(kpis: KPIData[]): string {
  if (!kpis || kpis.length === 0) return 'No KPIs tracked this period';
  
  return kpis.map(kpi => {
    let line = `- ${kpi.kpi_code}: ${kpi.value}`;
    if (kpi.target_value) line += ` (target: ${kpi.target_value})`;
    if (kpi.previous_value) line += ` (prev: ${kpi.previous_value})`;
    if (kpi.rag_status) line += ` [${kpi.rag_status.toUpperCase()}]`;
    return line;
  }).join('\n');
}

function formatCalculatedMetrics(metrics: Record<string, any>): string {
  const lines: string[] = [];
  
  if (metrics.grossMarginPct) lines.push(`- Gross Margin: ${metrics.grossMarginPct}%`);
  if (metrics.operatingMarginPct) lines.push(`- Operating Margin: ${metrics.operatingMarginPct}%`);
  if (metrics.netMarginPct) lines.push(`- Net Margin: ${metrics.netMarginPct}%`);
  if (metrics.runwayMonths) lines.push(`- Cash Runway: ${metrics.runwayMonths} months`);
  if (metrics.cashDifference) lines.push(`- Hidden Liabilities (Bank vs True Cash): £${metrics.cashDifference.toLocaleString()} (${metrics.cashDifferencePct}%)`);
  if (metrics.revenueChangePct) lines.push(`- Revenue vs Previous Period: ${metrics.revenueChangePct > 0 ? '+' : ''}${metrics.revenueChangePct}%`);
  if (metrics.grossProfitChangePct) lines.push(`- Gross Profit vs Previous Period: ${metrics.grossProfitChangePct > 0 ? '+' : ''}${metrics.grossProfitChangePct}%`);

  return lines.length > 0 ? lines.join('\n') : 'Insufficient data to calculate additional metrics';
}

function getInsightCountByTier(tier: string): string {
  switch (tier) {
    case 'bronze': return '3-4';
    case 'silver': return '5-6';
    case 'gold': return '7-8';
    case 'platinum': return '10-12';
    default: return '5';
  }
}

function getExactInsightCount(tier: string): number {
  switch (tier) {
    case 'bronze': return 4;
    case 'silver': return 5;
    case 'gold': return 7;
    case 'platinum': return 10;
    default: return 5;
  }
}

function generateTopicList(tier: string, hasTuesdayQuestion: boolean): string {
  const bronzeTopics = [
    '1. Cash position / runway (combine all cash-related findings into ONE insight)',
    '2. Key profitability metric (margin or break-even)',
    '3. Most important working capital issue (debtors OR creditors, not both)',
    '4. One strategic recommendation or opportunity',
  ];

  const silverTopics = [
    '1. True cash position and runway (ONE comprehensive cash insight)',
    '2. Profitability analysis (gross OR net margin)',
    '3. Working capital efficiency (debtor collection opportunity)',
    '4. Cost structure finding (payroll OR overhead)',
    '5. Growth or strategic recommendation',
  ];

  const goldTopics = [
    '1. True cash position and runway (ONE comprehensive insight)',
    '2. Profitability and margin analysis',
    '3. Debtor management opportunity',
    '4. Tax or liability management',
    '5. Cost structure or payroll insight',
    '6. Revenue or growth strategy',
    '7. Strategic recommendation or opportunity',
  ];

  const platinumTopics = [
    '1. True cash position and runway',
    '2. Profitability deep-dive',
    '3. Debtor/receivables strategy',
    '4. Tax planning opportunity',
    '5. Cost optimization insight',
    '6. Payroll/staffing analysis',
    '7. Revenue growth strategy',
    '8. Working capital efficiency',
    '9. Strategic risk or opportunity',
    '10. Forward-looking prediction',
  ];

  let topics: string[];
  switch (tier) {
    case 'bronze': topics = bronzeTopics; break;
    case 'silver': topics = silverTopics; break;
    case 'gold': topics = goldTopics; break;
    case 'platinum': topics = platinumTopics; break;
    default: topics = silverTopics;
  }

  if (hasTuesdayQuestion) {
    // Replace last topic with Tuesday Question
    topics[topics.length - 1] = `${topics.length}. Answer to their Tuesday Question`;
  }

  return topics.join('\n');
}

// Deduplicate insights that are too similar
function deduplicateInsights(insights: GeneratedInsight[]): GeneratedInsight[] {
  const seen = new Map<string, GeneratedInsight>();
  const keywords: Map<string, Set<string>> = new Map();

  // Define topic keywords for grouping
  const topicPatterns: Record<string, RegExp[]> = {
    'cash_runway': [/runway/i, /true cash/i, /cash crisis/i, /liquidity/i, /months? (of )?cash/i],
    'debtors': [/debtor/i, /receivable/i, /collection/i, /owed to you/i, /£\d+.*debtors/i],
    'creditors': [/creditor/i, /payable/i, /supplier/i, /payment term/i],
    'tax': [/vat/i, /paye/i, /corporation tax/i, /tax liab/i, /hmrc/i],
    'payroll': [/payroll/i, /staff cost/i, /salary/i, /wage/i, /headcount/i],
    'margin': [/gross margin/i, /net margin/i, /profit margin/i, /pricing power/i],
    'revenue': [/revenue growth/i, /revenue increase/i, /sales target/i],
    'overhead': [/overhead/i, /fixed cost/i, /operating cost/i, /burn rate/i],
  };

  for (const insight of insights) {
    const text = `${insight.headline} ${insight.description}`.toLowerCase();
    
    // Find which topic this insight belongs to
    let matchedTopic: string | null = null;
    for (const [topic, patterns] of Object.entries(topicPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matchedTopic = topic;
          break;
        }
      }
      if (matchedTopic) break;
    }

    // If we haven't seen this topic, add it
    if (matchedTopic) {
      if (!seen.has(matchedTopic)) {
        seen.set(matchedTopic, insight);
      } else {
        // Keep the higher priority one
        const existing = seen.get(matchedTopic)!;
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[insight.priority] < priorityOrder[existing.priority]) {
          seen.set(matchedTopic, insight);
        }
      }
    } else {
      // No topic match - check for headline similarity
      const simpleKey = insight.headline.toLowerCase().replace(/[^a-z]/g, '').slice(0, 30);
      if (!keywords.has(simpleKey)) {
        keywords.set(simpleKey, new Set());
        seen.set(`other_${seen.size}`, insight);
      }
    }
  }

  return Array.from(seen.values());
}

// Enforce maximum insight count while maintaining category diversity
function enforceInsightLimits(insights: GeneratedInsight[], maxCount: number): GeneratedInsight[] {
  if (insights.length <= maxCount) return insights;

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  
  // Sort by priority (critical first)
  const sorted = [...insights].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  // Ensure category diversity - take at most 2 from each category
  const byCat: Record<string, GeneratedInsight[]> = {};
  for (const insight of sorted) {
    const cat = insight.category;
    if (!byCat[cat]) byCat[cat] = [];
    if (byCat[cat].length < 2) {
      byCat[cat].push(insight);
    }
  }

  // Flatten and take top maxCount
  const diverse = Object.values(byCat).flat();
  
  // If we still have too many, sort by priority and take top
  if (diverse.length > maxCount) {
    diverse.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return diverse.slice(0, maxCount);
  }

  // If we need more, add remaining sorted insights
  if (diverse.length < maxCount) {
    const diverseIds = new Set(diverse.map(i => i.headline));
    for (const insight of sorted) {
      if (!diverseIds.has(insight.headline)) {
        diverse.push(insight);
        if (diverse.length >= maxCount) break;
      }
    }
  }

  return diverse.slice(0, maxCount);
}

// Map AI category names to database constraint values
function mapCategory(category: string): string {
  const mapping: Record<string, string> = {
    'Cash & Liquidity': 'cash',
    'Profitability': 'profitability',
    'Working Capital': 'operations',
    'Revenue & Growth': 'growth',
    'Strategic': 'risk',
    'Efficiency': 'efficiency',
    'Client Health': 'clients',
    'Compliance': 'compliance',
    'Tax': 'tax',
  };
  return mapping[category] || 'operations';
}
