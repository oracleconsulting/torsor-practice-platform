/**
 * Business Intelligence Insight Generation
 * Theme-based deduplication: ONE insight per theme, maximum 7 insights
 * 
 * Uses OpenRouter with claude-sonnet-4
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// TYPES
// ============================================

type InsightTheme = 
  | 'tuesday_question'
  | 'cash_runway'
  | 'debtor_opportunity'
  | 'cost_structure'
  | 'tax_obligations'
  | 'profitability'
  | 'client_health'
  | 'pricing_power';

type InsightPriority = 'critical' | 'warning' | 'opportunity' | 'positive';

type VisualizationType = 'none' | 'comparison' | 'timeline' | 'progress' | 'bar' | 'waterfall' | 'table';

interface GeneratedInsight {
  theme: InsightTheme;
  priority: InsightPriority;
  title: string;
  summary: string;
  detail?: string;
  client_quote?: string;
  emotional_anchor?: string;
  recommendation?: string;
  scenario_teaser?: string;
  visualization_type: VisualizationType;
  visualization_data?: Record<string, unknown>;
}

interface FinancialData {
  revenue?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  overheads?: number;
  operating_profit?: number;
  net_profit?: number;
  cash_at_bank?: number;
  trade_debtors?: number;
  trade_creditors?: number;
  vat_liability?: number;
  paye_liability?: number;
  corporation_tax_liability?: number;
  committed_payments?: number;
  confirmed_receivables?: number;
  monthly_operating_costs?: number;
  monthly_payroll_costs?: number;
  fte_count?: number;
}

interface DiscoveryData {
  sleep_better?: string;
  worst_cash_moment?: string;
  expensive_blindspot?: string;
  transformation?: string;
  key_quotes?: string[];
}

interface KPIResult {
  code: string;
  name: string;
  value: number;
  formatted_value: string;
  rag_status: string;
}

interface RequestBody {
  periodId: string;
  engagementId: string;
  tier: 'clarity' | 'foresight' | 'strategic';
  clientName: string;
  tuesdayQuestion: string;
  discoveryData?: DiscoveryData;
  financialData: FinancialData;
  kpiResults: KPIResult[];
}

// ============================================
// CONSTANTS
// ============================================

const VALID_THEMES: InsightTheme[] = [
  'tuesday_question',
  'cash_runway',
  'debtor_opportunity',
  'cost_structure',
  'tax_obligations',
  'profitability',
  'client_health',
  'pricing_power'
];

const MAX_INSIGHTS = 7;

const BANNED_PHRASES = [
  'masks a dangerous reality',
  'crystallize over the next',
  'it is important to note',
  'it should be noted',
  'comprehensive analysis reveals',
  'strategic implications',
  'holistic view',
  'synergies',
  'leverage',
  'paradigm',
  'deep dive',
  'unpack',
  'at the end of the day',
  'moving forward',
  'in terms of',
  'best practices'
];

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[generate-bi-insights] Starting insight generation...");
    
    // Get API keys
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request
    const body: RequestBody = await req.json();
    console.log("[generate-bi-insights] Request for period:", body.periodId);
    
    const {
      periodId,
      tier,
      clientName,
      tuesdayQuestion,
      discoveryData,
      financialData,
      kpiResults
    } = body;
    
    // Delete existing insights for this period (clean slate)
    console.log("[generate-bi-insights] Clearing existing insights for period...");
    const { error: deleteError } = await supabase
      .from('bi_insights')
      .delete()
      .eq('period_id', periodId);
    
    if (deleteError) {
      console.error("[generate-bi-insights] Error deleting existing insights:", deleteError);
    }
    
    // Build the prompt
    const prompt = buildInsightPrompt({
      tier,
      clientName,
      tuesdayQuestion,
      discoveryData,
      financialData,
      kpiResults
    });
    
    console.log("[generate-bi-insights] Calling OpenRouter API...");
    
    // Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "https://torsor.io",
        "X-Title": "Torsor Business Intelligence",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [
          {
            role: "system",
            content: "You are a trusted financial advisor writing insights for business owners. Be direct, use specific numbers, and speak like a knowledgeable friend. Never use corporate jargon or AI-speak."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-bi-insights] OpenRouter API error:", errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }
    
    console.log("[generate-bi-insights] Parsing AI response...");
    
    // Parse the JSON from the response
    let insights: GeneratedInsight[];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      insights = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("[generate-bi-insights] Failed to parse AI response:", parseError);
      console.error("[generate-bi-insights] Raw content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }
    
    // Validate and deduplicate insights
    const validatedInsights = validateAndDeduplicateInsights(insights, tier);
    
    console.log(`[generate-bi-insights] Generated ${validatedInsights.length} unique insights`);
    
    // Save to database
    const insightsToInsert = validatedInsights.map((insight, index) => ({
      period_id: periodId,
      theme: insight.theme,
      priority: insight.priority,
      title: insight.title,
      summary: insight.summary,
      detail: insight.detail || null,
      client_quote: insight.client_quote || null,
      emotional_anchor: insight.emotional_anchor || null,
      recommendation: tier !== 'clarity' ? (insight.recommendation || null) : null,
      scenario_teaser: tier !== 'clarity' ? (insight.scenario_teaser || null) : null,
      visualization_type: insight.visualization_type || 'none',
      visualization_data: insight.visualization_data || null,
      is_tuesday_answer: insight.theme === 'tuesday_question',
      is_active: true,
      display_order: index + 1
    }));
    
    const { data: savedInsights, error: saveError } = await supabase
      .from('bi_insights')
      .insert(insightsToInsert)
      .select();
    
    if (saveError) {
      console.error("[generate-bi-insights] Failed to save insights:", saveError);
      throw new Error(`Failed to save insights: ${saveError.message}`);
    }
    
    console.log(`[generate-bi-insights] Saved ${savedInsights?.length || 0} insights`);
    
    // Update period status
    await supabase
      .from('bi_periods')
      .update({ status: 'insights_generated', updated_at: new Date().toISOString() })
      .eq('id', periodId);
    
    return new Response(
      JSON.stringify({
        success: true,
        insights: savedInsights,
        count: savedInsights?.length || 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
    
  } catch (error) {
    console.error("[generate-bi-insights] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

// ============================================
// PROMPT BUILDER
// ============================================

function buildInsightPrompt(params: {
  tier: string;
  clientName: string;
  tuesdayQuestion: string;
  discoveryData?: DiscoveryData;
  financialData: FinancialData;
  kpiResults: KPIResult[];
}): string {
  const { tier, clientName, tuesdayQuestion, discoveryData, financialData, kpiResults } = params;
  
  // Calculate True Cash for the prompt
  const trueCash = (financialData.cash_at_bank || 0) 
    - (financialData.vat_liability || 0)
    - (financialData.paye_liability || 0)
    - (financialData.corporation_tax_liability || 0)
    - (financialData.committed_payments || 0)
    + (financialData.confirmed_receivables || 0);
  
  const runway = (financialData.monthly_operating_costs || 1) > 0
    ? trueCash / (financialData.monthly_operating_costs || 1)
    : 0;
  
  const totalTaxLiabilities = (financialData.vat_liability || 0) 
    + (financialData.paye_liability || 0) 
    + (financialData.corporation_tax_liability || 0);
  
  return `
You are writing Business Intelligence insights for ${clientName}.

## HARD RULES (MUST FOLLOW)

1. **EXACTLY ${MAX_INSIGHTS} INSIGHTS MAXIMUM** - No exceptions. Quality over quantity.

2. **ONE INSIGHT PER THEME** - Pick the most important point per category:
   - tuesday_question (MANDATORY, ALWAYS FIRST)
   - cash_runway
   - debtor_opportunity
   - cost_structure
   - tax_obligations
   - profitability
   - client_health (or pricing_power)

3. **TUESDAY QUESTION IS #1** - ALWAYS INCLUDE
   - Start with YES / NO / NOT YET / YES, BUT / NO, UNLESS
   - Then explain briefly
   - Connect to a scenario if relevant

4. **USE THEIR EXACT WORDS** (if discovery data provided)
   - Quote them back to themselves
   - "You said you never want February to happen again..."

5. **BANNED PHRASES** - Never use these:
   ${BANNED_PHRASES.map(p => `- "${p}"`).join('\n   ')}

6. **INCLUDE SPECIFIC NUMBERS** - Always!
   - "£32k True Cash" not "a concerning cash position"
   - "21 days runway" not "limited runway"

## CLIENT CONTEXT

Name: ${clientName}
Tier: ${tier}
Tuesday Question: "${tuesdayQuestion}"

${discoveryData ? `
Discovery Data (USE THEIR WORDS):
- Sleep better: "${discoveryData.sleep_better || 'Not provided'}"
- Worst cash moment: "${discoveryData.worst_cash_moment || 'Not provided'}"
- Expensive blindspot: "${discoveryData.expensive_blindspot || 'Not provided'}"
- Transformation: "${discoveryData.transformation || 'Not provided'}"
` : ''}

## FINANCIAL DATA

Cash Position:
- Bank Balance: £${(financialData.cash_at_bank || 0).toLocaleString()}
- True Cash: £${trueCash.toLocaleString()} (after liabilities)
- Cash Runway: ${runway.toFixed(1)} months

Tax Liabilities:
- VAT: £${(financialData.vat_liability || 0).toLocaleString()}
- PAYE: £${(financialData.paye_liability || 0).toLocaleString()}
- Corporation Tax: £${(financialData.corporation_tax_liability || 0).toLocaleString()}
- Total: £${totalTaxLiabilities.toLocaleString()}

Working Capital:
- Trade Debtors: £${(financialData.trade_debtors || 0).toLocaleString()}
- Trade Creditors: £${(financialData.trade_creditors || 0).toLocaleString()}

P&L:
- Revenue: £${(financialData.revenue || 0).toLocaleString()}
- Gross Profit: £${(financialData.gross_profit || 0).toLocaleString()}
- Operating Profit: £${(financialData.operating_profit || 0).toLocaleString()}
- Overheads: £${(financialData.overheads || 0).toLocaleString()}
- Payroll: £${(financialData.monthly_payroll_costs || 0).toLocaleString()}/month

## KPI RESULTS

${kpiResults.map(kpi => `- ${kpi.name}: ${kpi.formatted_value} (${kpi.rag_status.toUpperCase()})`).join('\n')}

## OUTPUT FORMAT

Return a JSON array of EXACTLY ${MAX_INSIGHTS} or fewer insights:

\`\`\`json
[
  {
    "theme": "tuesday_question",
    "priority": "critical",
    "title": "Short punchy title with key number",
    "summary": "1-2 sentences using their words if available",
    "detail": "Expanded explanation",
    "client_quote": "Their exact words if relevant",
    "recommendation": "What to do${tier === 'clarity' ? ' (leave empty for Clarity tier)' : ''}",
    "scenario_teaser": "See what happens if...${tier === 'clarity' ? ' (leave empty for Clarity tier)' : ''}",
    "visualization_type": "waterfall"
  }
]
\`\`\`

REMEMBER:
- EXACTLY ONE insight per theme
- Tuesday Question MUST be first
- Use SPECIFIC NUMBERS in every insight
- Be direct, like a trusted friend
- Maximum ${MAX_INSIGHTS} insights total
`;
}

// ============================================
// VALIDATION & DEDUPLICATION
// ============================================

function validateAndDeduplicateInsights(
  insights: GeneratedInsight[],
  tier: string
): GeneratedInsight[] {
  const seenThemes = new Set<InsightTheme>();
  const validated: GeneratedInsight[] = [];
  
  // Ensure Tuesday Question is first if present
  const tuesdayInsight = insights.find(i => i.theme === 'tuesday_question');
  if (tuesdayInsight && isValidInsight(tuesdayInsight)) {
    validated.push(cleanInsight(tuesdayInsight, tier));
    seenThemes.add('tuesday_question');
  }
  
  // Process remaining insights by priority
  const priorityOrder = ['critical', 'warning', 'opportunity', 'positive'];
  
  for (const priority of priorityOrder) {
    for (const insight of insights) {
      if (validated.length >= MAX_INSIGHTS) break;
      
      // Skip if already seen this theme
      if (seenThemes.has(insight.theme)) continue;
      
      // Skip if not valid theme
      if (!VALID_THEMES.includes(insight.theme)) continue;
      
      // Skip if not this priority
      if (insight.priority !== priority) continue;
      
      // Validate and add
      if (isValidInsight(insight)) {
        validated.push(cleanInsight(insight, tier));
        seenThemes.add(insight.theme);
      }
    }
    
    if (validated.length >= MAX_INSIGHTS) break;
  }
  
  return validated;
}

function isValidInsight(insight: GeneratedInsight): boolean {
  // Must have required fields
  if (!insight.theme || !insight.priority || !insight.title || !insight.summary) {
    return false;
  }
  
  // Check for banned phrases
  const fullText = `${insight.title} ${insight.summary} ${insight.detail || ''}`.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (fullText.includes(phrase.toLowerCase())) {
      console.log(`[generate-bi-insights] Rejecting insight with banned phrase: "${phrase}"`);
      return false;
    }
  }
  
  return true;
}

function cleanInsight(insight: GeneratedInsight, tier: string): GeneratedInsight {
  return {
    theme: insight.theme,
    priority: insight.priority,
    title: insight.title.trim(),
    summary: insight.summary.trim(),
    detail: insight.detail?.trim(),
    client_quote: insight.client_quote?.trim(),
    emotional_anchor: insight.emotional_anchor?.trim(),
    // Only include recommendations for Foresight+
    recommendation: tier !== 'clarity' ? insight.recommendation?.trim() : undefined,
    scenario_teaser: tier !== 'clarity' ? insight.scenario_teaser?.trim() : undefined,
    visualization_type: insight.visualization_type || 'none',
    visualization_data: insight.visualization_data
  };
}

