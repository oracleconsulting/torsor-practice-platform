/**
 * Generate Benchmarking Opportunities (Pass 3)
 * 
 * Uses Claude Opus 4.5 to analyse all client data and identify opportunities.
 * Maps to existing services or surfaces new service concepts.
 * 
 * Part of the Service Intelligence System - learns from every client.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model configuration for Opus 4.5
const MODEL_CONFIG = {
  model: 'anthropic/claude-opus-4-20250514',
  max_tokens: 12000,
  temperature: 0.3,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Pass 3] Starting opportunity analysis for engagement: ${engagementId}`);

    // 1. Gather all client data
    const clientData = await gatherAllClientData(supabase, engagementId);
    console.log(`[Pass 3] Gathered data for client: ${clientData.clientName}`);

    // 2. Get active service catalogue
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active');
    
    console.log(`[Pass 3] Loaded ${services?.length || 0} active services`);

    // 3. Get existing concepts (to avoid duplicates)
    const { data: existingConcepts } = await supabase
      .from('service_concepts')
      .select('id, suggested_name, problem_it_solves, times_identified')
      .in('review_status', ['pending', 'under_review']);
    
    console.log(`[Pass 3] Found ${existingConcepts?.length || 0} existing concepts`);

    // 4. Build and call LLM for analysis
    const startTime = Date.now();
    const analysis = await analyseWithLLM(clientData, services || [], existingConcepts || []);
    const analysisTime = Date.now() - startTime;
    
    console.log(`[Pass 3] Opus 4.5 identified ${analysis.opportunities?.length || 0} opportunities in ${analysisTime}ms`);

    // 5. Store results
    await storeOpportunities(supabase, engagementId, clientData.clientId, analysis);
    
    // 6. Update report with assessment
    await supabase
      .from('bm_reports')
      .update({
        opportunity_assessment: analysis.overallAssessment,
        scenario_suggestions: analysis.scenarioSuggestions,
        opportunities_generated_at: new Date().toISOString(),
      })
      .eq('engagement_id', engagementId);

    const newConceptCount = (analysis.opportunities || []).filter(
      (o: any) => o.serviceMapping?.newConceptNeeded
    ).length;

    console.log(`[Pass 3] Complete. ${analysis.opportunities?.length || 0} opportunities, ${newConceptCount} new concepts`);

    return new Response(JSON.stringify({ 
      success: true, 
      opportunityCount: analysis.opportunities?.length || 0,
      newConcepts: newConceptCount,
      assessment: analysis.overallAssessment,
      analysisTimeMs: analysisTime,
      model: MODEL_CONFIG.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Pass 3] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// DATA GATHERING
// ============================================================================

interface ClientData {
  engagementId: string;
  clientId: string;
  clientName: string;
  industryCode: string | null;
  pass1Data: any;
  pass2Narratives: any;
  assessment: any;
  hva: any;
  metrics: any[];
  founderRisk: any;
  supplementary: any;
}

async function gatherAllClientData(supabase: any, engagementId: string): Promise<ClientData> {
  // Get engagement with client info
  const { data: engagement, error: engError } = await supabase
    .from('bm_engagements')
    .select('*')
    .eq('id', engagementId)
    .single();
  
  if (engError) {
    console.error('[Pass 3] Error fetching engagement:', engError);
  }
  
  // Get client_id - try multiple sources
  let clientId = engagement?.client_id || '';
  let clientName = 'Client';
  
  // If we have a client_id, try to get the client name
  if (clientId) {
    const { data: client } = await supabase
      .from('practice_members')
      .select('id, name')
      .eq('id', clientId)
      .single();
    
    if (client) {
      clientName = client.name || 'Client';
    }
  }
  
  console.log(`[Pass 3] Engagement data: client_id=${clientId}, clientName=${clientName}`);
  
  // Get report (Pass 1 & 2 data)
  const { data: report } = await supabase
    .from('bm_reports')
    .select('*')
    .eq('engagement_id', engagementId)
    .single();
  
  // Get assessment responses
  const { data: assessment } = await supabase
    .from('bm_assessment_responses')
    .select('*')
    .eq('engagement_id', engagementId)
    .single();
  
  // Get HVA Part 3 if exists
  const { data: hva } = await supabase
    .from('client_assessments')
    .select('responses')
    .eq('client_id', clientId)
    .eq('assessment_type', 'part3')
    .maybeSingle();
  
  // Get metrics comparison
  const { data: metrics } = await supabase
    .from('bm_metric_comparisons')
    .select('*')
    .eq('engagement_id', engagementId);

  // Parse pass1_data
  let pass1Data = {};
  try {
    pass1Data = typeof report?.pass1_data === 'string' 
      ? JSON.parse(report.pass1_data) 
      : (report?.pass1_data || {});
  } catch (e) {
    console.log('[Pass 3] Could not parse pass1_data');
  }

  return {
    engagementId,
    clientId,
    clientName,
    industryCode: report?.industry_code,
    pass1Data,
    pass2Narratives: {
      headline: report?.headline,
      executiveSummary: report?.executive_summary,
      strengthNarrative: report?.strength_narrative,
      gapNarrative: report?.gap_narrative,
      opportunityNarrative: report?.opportunity_narrative,
    },
    assessment: assessment?.responses || assessment || {},
    hva: hva?.responses || {},
    metrics: metrics || [],
    founderRisk: {
      level: report?.founder_risk_level,
      score: report?.founder_risk_score,
      factors: report?.founder_risk_factors || [],
      valuationImpact: report?.valuation_impact,
    },
    supplementary: report?.supplementary_data || assessment?.responses || {},
  };
}

// ============================================================================
// LLM ANALYSIS WITH OPUS 4.5
// ============================================================================

async function analyseWithLLM(
  clientData: ClientData, 
  services: any[], 
  existingConcepts: any[]
): Promise<any> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(clientData, services, existingConcepts);
  
  console.log(`[Pass 3] Calling ${MODEL_CONFIG.model}...`);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co',
    },
    body: JSON.stringify({
      model: MODEL_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: MODEL_CONFIG.max_tokens,
      temperature: MODEL_CONFIG.temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Log usage for cost tracking
  const usage = data.usage;
  if (usage) {
    console.log(`[Pass 3] Token usage: ${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion`);
  }
  
  // Parse JSON response
  try {
    const jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('[Pass 3] Failed to parse LLM response:', content.substring(0, 1000));
    throw new Error('Invalid JSON response from LLM');
  }
}

// ============================================================================
// ENHANCED SYSTEM PROMPT FOR OPUS 4.5
// ============================================================================

function buildSystemPrompt(): string {
  return `You are a senior adviser at RPGCC, a UK accountancy practice. You work in the Business Services Group (BSG), a 17-person team that helps SME owners transform their businesses from things that consume their lives into assets that serve their goals.

## YOUR PHILOSOPHY

We sell destinations, not services. Like an estate agent shows you the life you could have in a new home, we show business owners the life they could have with a better-run business. Every recommendation must connect to what the owner actually wants: more time with family, financial security, the ability to step back, a business worth selling.

When you identify an opportunity, don't just cite the metric. Ask yourself: "What does this mean for this person's life?"

## WHAT MAKES A GOOD OPPORTUNITY ANALYSIS

**Grounded in specifics.** Never say "revenue is below benchmark" when you can say "£63M puts you 8% below the £68.5M median for telecom infrastructure contractors your size." Numbers create credibility.

**Honest about confidence.** If the data is thin, say so. If you're estimating, show your working. Clients respect "based on the limited data, roughly £X" more than false precision.

**Prioritised ruthlessly.** A client with 99% customer concentration doesn't need to hear about their slightly-below-median gross margin first. Lead with what could kill the business, then what could transform it, then optimisations.

**Connected to action.** Every opportunity should have a clear "so what" - either a service we offer that addresses it, or a gap we should consider filling.

**Written for a conversation, not a report.** The adviser will use your talking points in a face-to-face meeting. They should sound like something a knowledgeable colleague would say, not a consulting deck.

## WHAT TO LOOK FOR

Think like a business doctor doing a full examination. Consider:

**Existential risks** - What could kill this business? Customer concentration above 40% is dangerous. Above 60% is critical. Above 80% is an emergency. Key person dependency that would crater the business if someone got hit by a bus. Revenue trends that suggest the market is moving away from them.

**Hidden value** - What assets are they sitting on that they might not see? Surplus cash that could be deployed. Freehold property that's hidden in the balance sheet. Intellectual property or processes that could be packaged. Relationships or market positions that have value beyond the P&L.

**Operational friction** - Where is the machine grinding? Poor cash collection (debtor days above 45 is a warning, above 60 is a problem). Low utilisation rates. Margin compression that suggests pricing hasn't kept pace with costs. Systems that create work instead of eliminating it.

**Growth constraints** - What's stopping them scaling? Founder bottleneck where everything flows through one person. Capacity constraints. Market positioning that limits their addressable market. Lack of recurring revenue creating feast-or-famine cycles.

**Exit readiness** - If they wanted to sell in 3-5 years, what would a buyer worry about? Founder dependency, customer concentration, undocumented processes, key person risk - these all create valuation discounts of 20-40%.

**Personal goals gap** - What did the client say they want? If they mentioned wanting to "step back" and they have 80% founder dependency, that's a direct contradiction worth highlighting.

## SERVICE MATCHING

When you identify an opportunity, decide:

1. **Strong match to existing service** - We have something that directly addresses this. Recommend it with confidence, explain specifically how it helps this client's situation.

2. **Partial match** - We have something adjacent but not perfect. Recommend it but note the limitation. This is valuable intelligence for our service development.

3. **Gap identified** - Nothing we offer really fits. Describe what would help this client. Be specific: name it, describe deliverables, estimate pricing, identify skills needed. These gaps, aggregated across clients, tell us what services to build.

Don't force a match. A weak recommendation damages trust more than saying "this is a gap in our offering."

## OUTPUT QUALITY

**Talking points should sound human.** Not: "Based on our analysis, your customer concentration metric indicates elevated risk exposure." Yes: "You've got 99% of your revenue coming from three relationships. That's not a customer base - it's a dependency. If Boldyn changes procurement strategy tomorrow, you're having a very different conversation."

**Quantify everything possible.** Impact isn't "significant" - it's "£2.3M annually" or "20-30% valuation discount."

**Be direct about severity.** If something is critical, say it's critical. Don't soften it to spare feelings. The client paid for honest assessment.

**Avoid:** Corporate buzzwords. Americanisms (it's "turnover" not "sales", "profit" not "earnings"). Therapy-speak. Anything that sounds like it came from a consulting framework. Generic advice that could apply to any business.

**Embrace:** Plain English. Specific numbers. Direct statements. Practical next steps. The voice of a trusted adviser who's seen hundreds of businesses.

## JSON OUTPUT FORMAT

Respond with valid JSON only. No markdown code blocks, no explanations outside the JSON structure.`;
}

// ============================================================================
// ENHANCED USER PROMPT FOR OPUS 4.5
// ============================================================================

function buildUserPrompt(clientData: ClientData, services: any[], existingConcepts: any[]): string {
  const { clientName, industryCode, pass1Data, pass2Narratives, assessment, hva, metrics, founderRisk, supplementary } = clientData;
  
  // Extract enriched data with fallbacks
  const enriched = pass1Data?.enrichedData || pass1Data?._enriched || {};
  const revenue = enriched.revenue || pass1Data?.revenue || 0;
  const grossMargin = enriched.grossMargin || enriched.gross_margin || pass1Data?.grossMargin || 0;
  const netMargin = enriched.netMargin || enriched.net_margin || pass1Data?.netMargin || 0;
  const ebitdaMargin = enriched.ebitdaMargin || enriched.ebitda_margin || pass1Data?.ebitdaMargin || 0;
  const employeeCount = enriched.employeeCount || enriched.employee_count || pass1Data?.employeeCount || 0;
  const revenuePerEmployee = enriched.revenuePerEmployee || enriched.revenue_per_employee || pass1Data?.revenuePerEmployee || 0;
  const debtorDays = enriched.debtorDays || enriched.debtor_days || pass1Data?.debtorDays || 0;
  const creditorDays = enriched.creditorDays || enriched.creditor_days || pass1Data?.creditorDays || 0;
  const revenueGrowth = enriched.revenueGrowth || enriched.revenue_growth || pass1Data?.revenueGrowth || 0;
  
  // Balance sheet data
  const surplusCash = pass1Data?.surplusCash?.surplusCash || 0;
  const supplierFunding = pass1Data?.surplusCash?.supplierFundedWorkingCapital || 0;
  const cash = pass1Data?.balanceSheet?.cash || pass1Data?.balance_sheet?.cash || 0;
  const netAssets = pass1Data?.balanceSheet?.netAssets || pass1Data?.balance_sheet?.net_assets || 0;
  const freeholdProperty = pass1Data?.balanceSheet?.freeholdProperty || pass1Data?.balance_sheet?.freehold_property || 0;
  
  // Concentration data from multiple sources
  const concentration = supplementary?.client_concentration_top3 || 
                        supplementary?.bm_supp_client_concentration_top3 ||
                        assessment?.client_concentration_top3 ||
                        pass1Data?.supplementary?.client_concentration_top3;
  
  const topCustomers = supplementary?.top_customers || 
                       supplementary?.bm_supp_top_customers ||
                       assessment?.top_customers ||
                       pass1Data?.supplementary?.top_customers;

  // Build metrics text with percentile context
  const metricsText = (metrics || [])
    .filter((m: any) => m.percentile !== null && m.percentile !== undefined && m.client_value !== null)
    .map((m: any) => {
      const percentile = m.percentile;
      const position = percentile < 25 ? 'bottom quartile' :
                       percentile < 50 ? 'below median' :
                       percentile < 75 ? 'above median' : 'top quartile';
      const gapText = m.annual_impact ? ` (£${Math.abs(m.annual_impact).toLocaleString()} annual gap)` : '';
      return `- ${m.metric_name || m.metricName}: ${m.client_value || m.clientValue} — ${percentile}th percentile (${position})${gapText}`;
    })
    .join('\n') || 'Benchmark data not available';

  // Build services text with context
  const servicesText = services.map(s => {
    const deliverables = Array.isArray(s.deliverables) ? s.deliverables.slice(0, 3).join(', ') : '';
    return `**${s.code}**: ${s.name}
   ${s.headline}
   £${s.price_from}${s.price_to !== s.price_from ? `-${s.price_to}` : ''}${s.price_unit} | ${s.typical_duration}
   ${deliverables ? `Includes: ${deliverables}` : ''}`;
  }).join('\n\n');

  // Financial trends
  const trendsText = (pass1Data?.financialTrends || [])
    .map((t: any) => `- ${t.metric}: ${t.direction}${t.isRecovering ? ' (recovering from trough)' : ''}`)
    .join('\n') || 'Trend data not available';

  // Format helpers
  const formatNum = (n: number) => n ? n.toLocaleString() : '0';
  const formatPct = (n: number) => n ? n.toFixed(1) : '0';

  return `## THE CLIENT

**${clientName}**
Industry: ${industryCode || 'Not classified'}

## FINANCIAL PICTURE

| Metric | Value | Context |
|--------|-------|---------|
| Revenue | £${formatNum(revenue)} | ${revenueGrowth > 0 ? '+' : ''}${formatPct(revenueGrowth)}% YoY |
| Gross Margin | ${formatPct(grossMargin)}% | ${grossMargin < 15 ? 'Low for most sectors' : grossMargin > 40 ? 'Healthy' : 'Moderate'} |
| Net Margin | ${formatPct(netMargin)}% | ${netMargin < 5 ? 'Thin' : netMargin > 10 ? 'Strong' : 'Reasonable'} |
| EBITDA Margin | ${formatPct(ebitdaMargin)}% | Key valuation driver |
| Employees | ${employeeCount} | |
| Revenue/Employee | £${formatNum(Math.round(revenuePerEmployee))} | Productivity measure |
| Debtor Days | ${Math.round(debtorDays)} | ${debtorDays > 60 ? 'Cash trapped in debtors' : debtorDays < 30 ? 'Excellent collection' : 'Acceptable'} |
| Creditor Days | ${Math.round(creditorDays)} | ${creditorDays > debtorDays ? 'Suppliers funding operations (good)' : 'Paying faster than collecting'} |

## BALANCE SHEET HIGHLIGHTS

- Cash: £${formatNum(cash)}
- Net Assets: £${formatNum(netAssets)}
${surplusCash > 0 ? `- **Surplus Cash**: £${formatNum(surplusCash)} (above operating requirements)` : ''}
${supplierFunding > 0 ? `- Supplier-funded working capital: £${formatNum(supplierFunding)}` : ''}
${freeholdProperty > 0 ? `- Freehold Property: £${formatNum(freeholdProperty)} (hidden asset)` : ''}

## TRENDS
${trendsText}

## FOUNDER & KEY PERSON RISK

| Factor | Assessment |
|--------|------------|
| Risk Level | ${founderRisk?.level || 'Not assessed'} |
| Risk Score | ${founderRisk?.score || 'N/A'}/100 |
| Valuation Impact | ${founderRisk?.valuationImpact || 'Not calculated'} |
| Key Factors | ${founderRisk?.factors?.length ? founderRisk.factors.join('; ') : 'None identified'} |

${hva?.knowledge_dependency_percentage !== undefined ? `Knowledge concentrated in founder: ${hva.knowledge_dependency_percentage}%` : ''}
${hva?.personal_brand_percentage !== undefined ? `Revenue tied to founder's personal brand: ${hva.personal_brand_percentage}%` : ''}
${hva?.succession_your_role ? `Succession plan for founder role: "${hva.succession_your_role}"` : ''}

## CUSTOMER CONCENTRATION

${concentration ? `**Top 3 clients represent ${concentration}% of revenue**` : 'Concentration data not collected'}
${concentration >= 80 ? '\n⚠️ CRITICAL: Single client loss could be existential' : 
  concentration >= 60 ? '\n⚠️ HIGH: Dangerous dependency on key relationships' : 
  concentration >= 40 ? '\nModerate concentration - worth addressing' : ''}

${topCustomers?.length ? `
Named relationships:
${topCustomers.map((c: any) => `- ${c.name}: ${c.percentage}% of revenue${c.since ? ` (client since ${c.since})` : ''}`).join('\n')}
` : ''}

## BENCHMARK POSITION (vs UK ${industryCode || 'sector'} peers)

${metricsText}

## WHAT THE CLIENT TOLD US (their own words)

${assessment?.suspected_underperformance || assessment?.benchmark_suspected_underperformance ? 
  `**Where they suspect underperformance:** "${assessment?.suspected_underperformance || assessment?.benchmark_suspected_underperformance}"` : ''}

${assessment?.leaving_money || assessment?.benchmark_leaving_money ? 
  `**Where they think money is being left on the table:** "${assessment?.leaving_money || assessment?.benchmark_leaving_money}"` : ''}

${assessment?.benchmark_magic_fix || assessment?.magic_fix ? 
  `**If they could fix one thing:** "${assessment?.benchmark_magic_fix || assessment?.magic_fix}"` : ''}

${assessment?.blind_spot_fear || assessment?.benchmark_blind_spot_fear ? 
  `**What keeps them up at night:** "${assessment?.blind_spot_fear || assessment?.benchmark_blind_spot_fear}"` : ''}

${assessment?.benchmark_top_quartile_ambition?.length ? 
  `**Where they want to be top quartile:** ${assessment.benchmark_top_quartile_ambition.join(', ')}` : ''}

## HVA INSIGHTS (if available)

${hva?.last_price_increase ? `Last price increase: ${hva.last_price_increase}` : ''}
${hva?.recurring_revenue_percentage !== undefined ? `Recurring revenue: ${hva.recurring_revenue_percentage}%` : ''}
${hva?.tech_stack_health_percentage !== undefined ? `Tech/systems health: ${hva.tech_stack_health_percentage}%` : ''}
${hva?.team_advocacy_percentage !== undefined ? `Team advocacy (internal NPS proxy): ${hva.team_advocacy_percentage}%` : ''}
${hva?.competitive_moat?.length ? `Competitive advantages: ${hva.competitive_moat.join(', ')}` : ''}
${hva?.unique_methods ? `Unique methods/IP: "${hva.unique_methods}"` : ''}

## EXISTING ANALYSIS (from earlier passes)

${pass2Narratives?.executiveSummary || 'Not yet generated'}

---

## OUR SERVICE CATALOGUE

${servicesText}

## SERVICE CONCEPTS ALREADY IN OUR PIPELINE

${existingConcepts.length > 0 
  ? existingConcepts.map(c => `- **${c.suggested_name}** (identified ${c.times_identified}x): ${c.problem_it_solves}`).join('\n')
  : 'No concepts currently in development pipeline'}

---

## YOUR TASK

Analyse this client thoroughly. Identify every opportunity where we could help them - whether through existing services or new ones we should consider building.

For each opportunity:
1. What's the issue? (grounded in specific data above)
2. Why does it matter? (business impact AND life impact for the owner)
3. What's the financial scale? (quantified where possible)
4. What should we recommend? (existing service with fit rationale, OR new concept)
5. What should the adviser say? (natural, conversational talking point)

Prioritise by severity: existential risks first, then transformational opportunities, then optimisations.

Remember: this person paid £2,000 for an honest, thorough analysis. Don't pad, don't hedge, don't be generic. Be the senior adviser they're paying for.

## REQUIRED JSON OUTPUT STRUCTURE

{
  "opportunities": [
    {
      "code": "unique_code",
      "title": "Human Readable Title",
      "category": "risk|efficiency|growth|value|governance",
      "severity": "critical|high|medium|low|opportunity",
      "dataEvidence": "Specific numbers from the data",
      "dataValues": {"key": 123},
      "benchmarkComparison": "How they compare to peers",
      "financialImpact": {
        "type": "risk|upside|cost_saving|value_creation",
        "amount": 1000000,
        "confidence": "high|medium|low",
        "calculation": "Show your working"
      },
      "lifeImpact": "What this means for the owner personally",
      "serviceMapping": {
        "existingService": {
          "code": "SERVICE_CODE",
          "fitScore": 85,
          "rationale": "Why this service specifically helps",
          "limitation": "What it won't fully solve (if any)"
        },
        "newConceptNeeded": null
      },
      "adviserTools": {
        "talkingPoint": "Natural, conversational - what to say",
        "questionToAsk": "Follow-up discovery question",
        "quickWin": "Something they can do this week"
      }
    }
  ],
  "scenarioSuggestions": [
    {
      "title": "Scenario name",
      "metric": "gross_margin",
      "currentValue": 16.3,
      "targetValue": 20,
      "targetRationale": "Why this target makes sense",
      "projectedImpact": 2340000,
      "impactCalculation": "Revenue × margin improvement"
    }
  ],
  "overallAssessment": {
    "clientHealth": "strong|stable|recovering|concerning|critical",
    "headline": "One sentence summary of this client's situation",
    "topPriority": "The single most important thing to address",
    "quickWins": ["Action 1 for this week", "Action 2"],
    "totalOpportunityValue": 5000000,
    "watchOuts": ["Things to monitor going forward"]
  }
}

For newConceptNeeded (when no existing service fits well):
{
  "suggestedName": "New Service Name",
  "problemItSolves": "What problem this solves",
  "suggestedDeliverables": ["deliverable1", "deliverable2"],
  "suggestedPricing": "£X-£Y",
  "suggestedDuration": "timeframe",
  "skillsRequired": ["skill1", "skill2"],
  "gapVsExisting": "Why existing services don't cut it",
  "marketSize": "niche|moderate|broad"
}

Important notes:
- Each opportunity must have EITHER existingService OR newConceptNeeded (not both)
- For partial fits, use existingService with a limitation noted
- Be specific with numbers - ground everything in the data above
- Talking points should sound like a human colleague, not a report
- Show your calculation working for financial impacts`;
}

// ============================================================================
// STORAGE
// ============================================================================

async function storeOpportunities(
  supabase: any,
  engagementId: string,
  clientId: string,
  analysis: any
): Promise<void> {
  const opportunities = analysis.opportunities || [];
  
  // Validate clientId - must be a valid UUID or we use null
  const isValidUUID = clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId);
  const safeClientId = isValidUUID ? clientId : null;
  
  if (!safeClientId) {
    console.warn('[Pass 3] Warning: No valid client_id found, opportunities will have null client_id');
  }
  
  for (const opp of opportunities) {
    let serviceId: string | null = null;
    let conceptId: string | null = null;
    
    // Handle existing service match
    if (opp.serviceMapping?.existingService?.code) {
      const { data: service } = await supabase
        .from('services')
        .select('id, times_recommended')
        .eq('code', opp.serviceMapping.existingService.code)
        .single();
      
      if (service) {
        serviceId = service.id;
        
        // Increment recommendation count
        await supabase
          .from('services')
          .update({ 
            times_recommended: (service.times_recommended || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', service.id);
      }
    }
    
    // Handle new concept needed
    if (opp.serviceMapping?.newConceptNeeded) {
      const concept = opp.serviceMapping.newConceptNeeded;
      
      // Check for existing similar concept (fuzzy match)
      const searchTerms = concept.suggestedName.split(' ').slice(0, 2).join('%');
      const { data: existing } = await supabase
        .from('service_concepts')
        .select('*')
        .or(`suggested_name.ilike.%${searchTerms}%`)
        .in('review_status', ['pending', 'under_review'])
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        // Update existing concept - increment frequency
        const newClientIds = safeClientId 
          ? [...new Set([...(existing.client_ids || []), safeClientId])]
          : (existing.client_ids || []);
        
        await supabase
          .from('service_concepts')
          .update({
            times_identified: (existing.times_identified || 1) + 1,
            client_ids: newClientIds,
            total_opportunity_value: (parseFloat(existing.total_opportunity_value) || 0) + (opp.financialImpact?.amount || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        conceptId = existing.id;
        console.log(`[Pass 3] Updated existing concept: ${existing.suggested_name} (now seen ${existing.times_identified + 1}x)`);
      } else {
        // Create new concept
        const { data: newConcept, error } = await supabase
          .from('service_concepts')
          .insert({
            suggested_name: concept.suggestedName,
            suggested_category: opp.category,
            description: concept.problemItSolves,
            problem_it_solves: concept.problemItSolves,
            suggested_deliverables: concept.suggestedDeliverables || [],
            suggested_pricing: concept.suggestedPricing,
            suggested_duration: concept.suggestedDuration,
            first_client_id: safeClientId,
            first_engagement_id: engagementId,
            client_ids: safeClientId ? [safeClientId] : [],
            total_opportunity_value: opp.financialImpact?.amount || 0,
            market_size_estimate: concept.marketSize,
            skills_likely_required: concept.skillsRequired || [],
            gap_vs_existing: concept.gapVsExisting,
            development_priority: concept.developmentPriority || 'medium_term',
          })
          .select('id')
          .single();
        
        if (error) {
          console.error(`[Pass 3] Failed to create concept: ${error.message}`);
        } else {
          conceptId = newConcept?.id;
          console.log(`[Pass 3] Created new concept: ${concept.suggestedName}`);
        }
      }
    }
    
    // Build the limitation string if present
    const serviceFitRationale = opp.serviceMapping?.existingService?.rationale;
    const serviceLimitation = opp.serviceMapping?.existingService?.limitation;
    const fullRationale = serviceLimitation 
      ? `${serviceFitRationale}. Note: ${serviceLimitation}`
      : serviceFitRationale;
    
    // Insert/update the client opportunity (requires valid client_id)
    if (!safeClientId) {
      console.warn(`[Pass 3] Skipping opportunity ${opp.code} - no valid client_id`);
      continue;
    }
    
    const { error: oppError } = await supabase
      .from('client_opportunities')
      .upsert({
        engagement_id: engagementId,
        client_id: safeClientId,
        opportunity_code: opp.code,
        title: opp.title,
        category: opp.category,
        severity: opp.severity,
        data_evidence: opp.dataEvidence,
        data_values: opp.dataValues || {},
        benchmark_comparison: opp.benchmarkComparison,
        financial_impact_type: opp.financialImpact?.type,
        financial_impact_amount: opp.financialImpact?.amount,
        financial_impact_confidence: opp.financialImpact?.confidence,
        impact_calculation: opp.financialImpact?.calculation,
        recommended_service_id: serviceId,
        service_fit_score: opp.serviceMapping?.existingService?.fitScore,
        service_fit_rationale: fullRationale,
        suggested_concept_id: conceptId,
        talking_point: opp.adviserTools?.talkingPoint,
        question_to_ask: opp.adviserTools?.questionToAsk,
        quick_win: opp.adviserTools?.quickWin,
        life_impact: opp.lifeImpact,
        llm_model: MODEL_CONFIG.model,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'engagement_id,opportunity_code'
      });
    
    if (oppError) {
      console.error(`[Pass 3] Failed to store opportunity ${opp.code}: ${oppError.message}`);
    }
  }
  
  console.log(`[Pass 3] Stored ${opportunities.length} opportunities`);
}
