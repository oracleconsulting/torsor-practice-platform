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

    console.log(`[generate-ma-insights] Generated ${insights.length} insights`);

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

  return `You are an elite management accountant preparing monthly insights for a client. Your insights must be:
- SPECIFIC with exact numbers (never "approximately" or "around")
- ACTIONABLE with clear next steps
- CONNECTED to business implications
- PRIORITIZED by business impact
- FORWARD-LOOKING with predictions and warnings

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

Generate ${getInsightCountByTier(tier)} insights that demonstrate exceptional financial analysis. Each insight should:

1. **Lead with impact** - Start with the business implication, not the number
2. **Show your working** - Include the specific calculations that support your conclusion
3. **Connect dots** - Show how this metric relates to other aspects of their business
4. **Be prescriptive** - Don't just observe, recommend specific actions
5. **Quantify the upside/downside** - What's the financial impact of action/inaction?

### INSIGHT CATEGORIES TO COVER:
1. **Cash & Liquidity** (MANDATORY) - True cash position, runway, upcoming pinch points
2. **Profitability** - Margin analysis, overhead absorption, break-even implications
3. **Working Capital** - Debtor/creditor management, cash conversion cycle
4. **Revenue & Growth** - Momentum, concentration, sustainability
5. **Strategic Alerts** - Risks, opportunities, decision support

### INSIGHT TYPES:
- **action_required**: Urgent - needs immediate attention (e.g., cash crisis imminent)
- **warning**: Concerning trend that needs monitoring (e.g., margin erosion)
- **opportunity**: Positive finding with upside potential (e.g., pricing power)
- **recommendation**: Specific advice for improvement (e.g., collection focus)
- **observation**: Neutral finding of note (e.g., seasonal pattern)

### PRIORITY LEVELS:
- **critical**: Threatens business viability or represents major opportunity
- **high**: Significant financial impact, action needed this period
- **medium**: Important but not urgent
- **low**: Nice to know, minor optimization

${tuesdayQuestion ? `
### MANDATORY: ANSWER THEIR TUESDAY QUESTION
One of your insights MUST directly answer: "${tuesdayQuestion}"
This should be one of your highest priority insights.
` : ''}

## OUTPUT FORMAT

Return a JSON array of insights. Each insight object must have:
{
  "insight_type": "action_required" | "warning" | "opportunity" | "recommendation" | "observation",
  "category": "Cash & Liquidity" | "Profitability" | "Working Capital" | "Revenue & Growth" | "Strategic",
  "headline": "Punchy, specific headline with key number (max 80 chars)",
  "description": "Detailed analysis paragraph explaining the insight, showing your working, and connecting to business impact. Use specific numbers. 2-4 sentences.",
  "data_points": ["£X revenue", "Y% margin", "Z days runway"], // 2-4 specific data points
  "implications": "What this means for the business in plain English. One clear sentence.",
  "recommended_action": "Specific action to take. Start with a verb. One sentence.", // Optional for observations
  "priority": "critical" | "high" | "medium" | "low",
  "show_to_client": true | false // false for sensitive internal notes
}

## EXAMPLES OF EXCELLENT INSIGHTS

**GOOD - Specific and actionable:**
{
  "insight_type": "action_required",
  "category": "Cash & Liquidity",
  "headline": "True cash runway down to 4.2 months – below safety threshold",
  "description": "Your bank shows £205,000 but after deducting £22,150 VAT due, £8,800 PAYE, and £15,000 corp tax provision, true cash is only £159,050. At your £38,000 monthly burn rate, this gives 4.2 months runway. The safe minimum for a business your size is 6 months.",
  "data_points": ["£205,000 bank balance", "£45,950 liabilities", "£159,050 true cash", "4.2 months runway"],
  "implications": "You have 8 weeks to either reduce burn or secure additional funding before hitting critical territory.",
  "recommended_action": "Schedule a cash strategy session this week to model scenarios for extending runway to 6+ months.",
  "priority": "critical",
  "show_to_client": true
}

**BAD - Vague and passive:**
{
  "headline": "Cash position needs attention",
  "description": "Your cash position has decreased. You should monitor this closely."
}

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
