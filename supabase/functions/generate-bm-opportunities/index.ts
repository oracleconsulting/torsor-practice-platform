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
    let analysis = await analyseWithLLM(clientData, services || [], existingConcepts || []);
    const analysisTime = Date.now() - startTime;
    
    console.log(`[Pass 3] Opus 4.5 identified ${analysis.opportunities?.length || 0} RAW opportunities in ${analysisTime}ms`);
    
    // 4a. POST-PROCESSING: Consolidate and sanitize opportunities
    // Revenue is stored as _enriched_revenue in pass1_data (not nested)
    const revenue = clientData.pass1Data?._enriched_revenue || 
                    clientData.pass1Data?.enrichedData?.revenue || 
                    clientData.pass1Data?.revenue || 
                    clientData.assessment?._enriched_revenue || 0;
    
    console.log(`[Pass 3] Revenue extraction: _enriched_revenue=${clientData.pass1Data?._enriched_revenue}, fallback=${revenue}`);
    
    analysis = postProcessOpportunities(analysis, revenue, clientData.directionContext);
    
    console.log(`[Pass 3] After consolidation: ${analysis.opportunities?.length || 0} opportunities (revenue: £${(revenue/1000000).toFixed(1)}M)`);
    console.log(`[Pass 3] Priorities: ${analysis.opportunities?.filter(o => o.priority === 'must_address_now').length || 0} must address, ${analysis.opportunities?.filter(o => o.priority === 'next_12_months').length || 0} next 12m, ${analysis.opportunities?.filter(o => o.priority === 'when_ready').length || 0} when ready`);

    // 5. Store results
    await storeOpportunities(supabase, engagementId, clientData.clientId, analysis);
    
    // 6. Update report with assessment (including blocked services and synthesis)
    await supabase
      .from('bm_reports')
      .update({
        opportunity_assessment: analysis.overallAssessment,
        scenario_suggestions: analysis.scenarioSuggestions,
        opportunities_generated_at: new Date().toISOString(),
        not_recommended_services: analysis.blockedServices || [],
        client_direction_at_generation: clientData.directionContext.businessDirection,
      })
      .eq('engagement_id', engagementId);
    
    // 7. Update engagement with direction context (for filtering/queries)
    await supabase
      .from('bm_engagements')
      .update({
        client_direction: clientData.directionContext.businessDirection,
        leadership_structure: clientData.directionContext.leadershipStructure,
        has_cfo: clientData.directionContext.hasCFO,
        has_coo: clientData.directionContext.hasCOO,
        client_exit_timeline: clientData.directionContext.exitTimeline,
        existing_roles: clientData.directionContext.existingRoles,
      })
      .eq('id', engagementId);

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
  // Direction context for smart prioritisation
  directionContext: DirectionContext;
}

interface DirectionContext {
  leadershipStructure: string;
  existingRoles: string[];
  hasCFO: boolean;
  hasCOO: boolean;
  hasNED: boolean;
  businessDirection: string;
  exitTimeline: string | null;
  investmentPlans: string[];
  lastPriceIncrease: string;
  pricingConfidence: string | null;
  leadershipEffectiveness: string;
  recentConversations: string[];
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

  // Extract direction context from assessment responses
  const responses = assessment?.responses || assessment || {};
  const existingRoles = responses.bm_existing_roles || [];
  
  const directionContext: DirectionContext = {
    leadershipStructure: responses.bm_leadership_structure || 'solo',
    existingRoles: existingRoles,
    hasCFO: existingRoles.includes('Finance Director / CFO') || existingRoles.includes('fd_cfo'),
    hasCOO: existingRoles.includes('Operations Director / COO') || existingRoles.includes('od_coo'),
    hasNED: existingRoles.includes('Non-executive Director(s)') || existingRoles.includes('ned'),
    businessDirection: responses.bm_business_direction || 'unsure',
    exitTimeline: responses.bm_exit_timeline || null,
    investmentPlans: responses.bm_investment_plans || [],
    lastPriceIncrease: responses.bm_last_price_increase || 'unknown',
    pricingConfidence: responses.bm_pricing_confidence || null,
    leadershipEffectiveness: responses.bm_leadership_effectiveness || 'unknown',
    recentConversations: responses.bm_recent_conversations || [],
  };
  
  console.log('[Pass 3] Direction context:', {
    direction: directionContext.businessDirection,
    hasCFO: directionContext.hasCFO,
    hasCOO: directionContext.hasCOO,
    lastPriceIncrease: directionContext.lastPriceIncrease,
  });

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
    assessment: responses,
    hva: hva?.responses || {},
    metrics: metrics || [],
    founderRisk: {
      level: report?.founder_risk_level,
      score: report?.founder_risk_score,
      factors: report?.founder_risk_factors || [],
      valuationImpact: report?.valuation_impact,
    },
    supplementary: report?.supplementary_data || responses || {},
    directionContext,
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

**Don't force a match.** A weak recommendation damages trust more than saying "this is a gap in our offering."

**We WANT new service concepts.** The goal is not to sell existing services - it's to identify what this client actually needs. If that's something we don't offer yet, that's valuable intelligence. Aim to identify at least 3-5 new service concepts per client.

## LOOK BEYOND THE OBVIOUS

Don't just analyse the summary metrics. Dig into:

**Second-order effects:**
- If revenue dropped 25%, WHY? What does that tell us about market position, sales capability, or operational issues?
- If margin crashed then recovered, what happened? Is the cause fixed or could it recur?
- If subcontractor costs are 50%+ of revenue, that's a strategic dependency worth examining.

**The cost structure:**
- Where does the money actually go? 
- What's changed year-on-year and why?
- Are there cost lines that seem unusual?

**Contract and relationship intelligence:**
- Long-term relationships are great, but when do they renew?
- What's the actual contractual exposure?
- What upsell or cross-sell opportunities exist?

**Pipeline and growth capacity:**
- For project businesses: bid pipeline, win rate?
- What's constraining growth - capacity, sales, market?

**What would a buyer ask?**
- If someone wanted to acquire this business, what would concern them?
- What due diligence questions would be hard to answer?
- What's NOT documented that should be?

## NEW SERVICE CONCEPTS TO CONSIDER

When you identify gaps, think creatively. Some patterns:

- **Diagnostic/Audit services:** Intensive review of contracts, suppliers, systems, pipeline
- **Accelerator programmes:** 90-day focused sprints on a specific outcome
- **Workshop formats:** Half-day or full-day intensive for specific decisions
- **Monitoring services:** Ongoing tracking of key risks or metrics
- **Implementation support:** Helping them DO something, not just plan it
- **Fractional expertise:** Beyond CFO/COO - Commercial Director? HR Director? 

Name them specifically. "Revenue Diversification Programme" beats "business development support".

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
  
  // Extract enriched data with fallbacks - pass1_data stores flat fields with _enriched_ prefix
  const enriched = pass1Data?.enrichedData || pass1Data?._enriched || {};
  const revenue = pass1Data?._enriched_revenue || enriched.revenue || pass1Data?.revenue || 0;
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

**CRITICAL: 8-12 opportunities MAXIMUM.** Quality over quantity. One concentrated, impactful opportunity is better than three variations of the same theme.

**CONSOLIDATION RULES - FOLLOW STRICTLY:**
- ONE opportunity for customer concentration (even if it affects multiple things)
- ONE opportunity for founder dependency (knowledge AND personal brand combined)
- ONE opportunity for succession gap
- ONE opportunity for pricing/margin
- ONE opportunity for working capital
- Do NOT create separate opportunities for the same issue viewed from different angles

**FINANCIAL IMPACT RULES:**
- Do NOT conflate "revenue at risk" with "opportunity value"
- If 99% concentration puts £63M at risk, the OPPORTUNITY is NOT £63M
- The opportunity value is the cost of ADDRESSING it, typically 10-20% of the risk
- Example: "99% Concentration" opportunity value = diversification investment + consulting = £500k-£2M, NOT £63M
- Cap individual opportunities at 30% of revenue maximum for critical issues, 15% for high, 10% for medium

**Aim for 3-5 new service concepts.** We WANT these. Don't force-fit every opportunity to existing services. If something needs a new approach, describe it specifically.

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
// SERVICE FILTERING RULES
// ============================================================================

interface ServiceBlockRule {
  serviceCode: string;
  blockIf: (ctx: DirectionContext) => boolean;
  blockReason: (ctx: DirectionContext) => string;
}

const SERVICE_BLOCK_RULES: ServiceBlockRule[] = [
  // Don't recommend Fractional CFO if they have one
  {
    serviceCode: 'FRACTIONAL_CFO',
    blockIf: (ctx) => ctx.hasCFO,
    blockReason: () => 'Client already has a Finance Director. Consider CFO support services instead.',
  },
  // Don't recommend Fractional COO if they have one
  {
    serviceCode: 'FRACTIONAL_COO',
    blockIf: (ctx) => ctx.hasCOO,
    blockReason: () => 'Client already has an Operations Director. Consider operational excellence programme instead.',
  },
  // Don't recommend exit services for aggressive growth focus
  {
    serviceCode: 'EXIT_READINESS',
    blockIf: (ctx) => ctx.businessDirection === 'grow_aggressive' || ctx.businessDirection === 'Grow aggressively - acquisitions, new markets, scale significantly',
    blockReason: () => 'Client focused on aggressive growth, not exit. Focus on growth enablement.',
  },
  // Don't recommend aggressive growth for step-back focus
  {
    serviceCode: 'GROWTH_ACCELERATOR',
    blockIf: (ctx) => ctx.businessDirection === 'step_back' || ctx.businessDirection === 'Step back - reduce my involvement, more lifestyle-focused',
    blockReason: () => 'Client wants to step back, not grow aggressively.',
  },
];

function filterBlockedServices(
  opportunities: any[],
  context: DirectionContext
): { allowed: any[]; blocked: { serviceCode: string; reason: string }[] } {
  const blocked: { serviceCode: string; reason: string }[] = [];
  
  const allowed = opportunities.filter(opp => {
    const serviceCode = opp.serviceMapping?.existingService?.code;
    if (!serviceCode) return true;
    
    const matchingRules = SERVICE_BLOCK_RULES.filter(r => 
      r.serviceCode === serviceCode && r.blockIf(context)
    );
    
    if (matchingRules.length > 0) {
      blocked.push({
        serviceCode,
        reason: matchingRules[0].blockReason(context),
      });
      return false;
    }
    
    return true;
  });
  
  if (blocked.length > 0) {
    console.log('[Pass 3] Blocked services:', blocked);
  }
  
  return { allowed, blocked };
}

// ============================================================================
// DIRECTION-AWARE PRIORITY ADJUSTMENT
// ============================================================================

const PRIORITY_BOOSTS: Record<string, Record<string, number>> = {
  'prepare_exit': {
    'concentration': 2,      // Must fix for exit
    'founder': 2,            // Must fix for exit
    'succession': 2,         // Must fix for exit
    'documentation': 1,      // Important for exit
    'valuation': 1,          // Important for exit
    'growth': -1,            // Less urgent for exit
  },
  'Prepare for exit - sale, succession, retirement': {
    'concentration': 2,
    'founder': 2,
    'succession': 2,
    'documentation': 1,
    'valuation': 1,
    'growth': -1,
  },
  'grow_aggressive': {
    'growth': 2,             // Core focus
    'systems': 1,            // Need to scale
    'hiring': 1,             // Need to grow team
    'concentration': 0,      // Still matters but less urgent
    'succession': -1,        // Not priority
    'exit': -2,              // Not relevant
  },
  'Grow aggressively - acquisitions, new markets, scale significantly': {
    'growth': 2,
    'systems': 1,
    'hiring': 1,
    'concentration': 0,
    'succession': -1,
    'exit': -2,
  },
  'step_back': {
    'succession': 2,         // Core focus
    'founder': 2,            // Core focus
    'documentation': 1,      // Need to hand over
    'systems': 1,            // Need to run without you
    'growth': -1,            // Not priority
  },
  'Step back - reduce my involvement, more lifestyle-focused': {
    'succession': 2,
    'founder': 2,
    'documentation': 1,
    'systems': 1,
    'growth': -1,
  },
  'maintain_optimise': {
    'efficiency': 2,         // Core focus
    'margin': 2,             // Core focus
    'pricing': 1,            // Quick wins
    'cash': 1,               // Optimisation
    'growth': -1,            // Not priority
  },
  'Maintain and optimise - protect position, improve margins': {
    'efficiency': 2,
    'margin': 2,
    'pricing': 1,
    'cash': 1,
    'growth': -1,
  },
};

function adjustPrioritiesForDirection(
  opportunities: any[],
  direction: string
): any[] {
  const boosts = PRIORITY_BOOSTS[direction] || {};
  
  return opportunities.map(opp => {
    // Find matching boost
    let boost = 0;
    const oppText = `${opp.code || ''} ${opp.title || ''} ${opp.category || ''} ${opp.talkingPoint || ''}`.toLowerCase();
    // Include ALL possible fields where percentage data might appear
    const fullDataText = JSON.stringify({
      dataEvidence: opp.dataEvidence,
      dataValues: opp.dataValues,
      talkingPoint: opp.talkingPoint,
      financialImpact: opp.financialImpact,
      watchOuts: opp.watchOuts,
      drivers: opp.financialImpact?.drivers,
      context: opp.context,
      limitation: opp.limitation,
    }).toLowerCase();
    
    for (const [keyword, value] of Object.entries(boosts)) {
      if (oppText.includes(keyword)) {
        boost = Math.max(boost, value);
      }
    }
    
    // =======================================================================
    // FORCE CRITICAL SEVERITY for existential risks
    // Override LLM classification if the data shows extreme risk
    // =======================================================================
    let effectiveSeverity = opp.severity;
    let severityOverridden = false;
    
    // If already critical from LLM, keep it critical
    if (effectiveSeverity === 'critical') {
      // No override needed, already critical
      console.log(`[Priority] Keeping CRITICAL severity for: ${opp.title}`);
    }
    
    // Check for extreme concentration keywords + high percentages
    const isConcentrationRelated = oppText.includes('concentration') || 
                                    oppText.includes('customer') || 
                                    oppText.includes('client') ||
                                    oppText.includes('single point') ||
                                    oppText.includes('dependency') ||
                                    oppText.includes('one client') ||
                                    oppText.includes('top 3');
    
    if (isConcentrationRelated) {
      // Look for percentages anywhere in the opportunity data
      const percentMatches = fullDataText.match(/(\d{2,3})%/g) || [];
      const highPercentage = percentMatches.find(p => parseInt(p) >= 75);
      if (highPercentage) {
        effectiveSeverity = 'critical';
        severityOverridden = true;
        console.log(`[Priority] Overriding severity to CRITICAL for concentration ${highPercentage} in "${opp.title}"`);
      }
    }
    
    // Check for founder/key person dependency
    const isFounderRelated = oppText.includes('founder') || 
                              oppText.includes('key person') || 
                              oppText.includes('owner') ||
                              oppText.includes('succession') ||
                              oppText.includes('knowledge dependency') ||
                              oppText.includes('personal brand');
    
    if (isFounderRelated) {
      const percentMatches = fullDataText.match(/(\d{2,3})%/g) || [];
      const highPercentage = percentMatches.find(p => parseInt(p) >= 60);
      if (highPercentage) {
        effectiveSeverity = 'critical';
        severityOverridden = true;
        console.log(`[Priority] Overriding severity to CRITICAL for founder dependency ${highPercentage} in "${opp.title}"`);
      }
    }
    
    // Check for exit blockers explicitly mentioned
    if (oppText.includes('exit blocker') || oppText.includes('valuation discount') || oppText.includes('existential')) {
      effectiveSeverity = 'critical';
      severityOverridden = true;
      console.log(`[Priority] Overriding severity to CRITICAL for exit blocker: "${opp.title}"`);
    }
    
    // Determine priority based on severity and boost
    let priority = 'next_12_months';
    let priorityRationale = '';
    
    if (effectiveSeverity === 'critical' || boost >= 2) {
      priority = 'must_address_now';
      priorityRationale = effectiveSeverity === 'critical' 
        ? 'Existential risk - must address immediately'
        : `Priority boosted for "${direction}" direction`;
    } else if (effectiveSeverity === 'high' && boost >= 1) {
      priority = 'must_address_now';
      priorityRationale = `High priority boosted for "${direction}" direction`;
    } else if (effectiveSeverity === 'low' || boost <= -1) {
      priority = 'when_ready';
      priorityRationale = 'Lower priority - address when ready';
    } else if (effectiveSeverity === 'opportunity' || boost <= -2) {
      priority = 'when_ready';
      priorityRationale = 'Optimisation opportunity';
    } else {
      priorityRationale = `Standard priority for ${effectiveSeverity} severity`;
    }
    
    return {
      ...opp,
      severity: effectiveSeverity,  // Update severity if overridden
      priority,
      priorityRationale,
      priorityAdjusted: boost !== 0 || severityOverridden,
    };
  });
}

// ============================================================================
// FORCE MUST ADDRESS NOW FOR EXISTENTIAL RISKS
// ============================================================================

function forceMustAddressNow(opportunities: any[]): any[] {
  // Patterns that indicate existential risk - ALWAYS must_address_now
  const existentialPatterns = [
    // Concentration
    '99%', '99 percent', '90%', 'existential risk', 'catastrophic',
    'one contract loss', 'single client loss', 'three clients', '3 clients',
    // Founder dependency  
    '80% founder', '80% knowledge', '70% knowledge', 'exit blocker', 
    'unsellable', 'would fail', 'hit by a bus',
    // Succession
    'no succession', 'need to hire', 'trapped', 'leadership vacuum',
  ];
  
  return opportunities.map(opp => {
    // Already must_address_now? Keep it
    if (opp.priority === 'must_address_now') {
      return opp;
    }
    
    // Check if this is an existential risk
    const combinedText = `${opp.title || ''} ${opp.dataEvidence || ''} ${opp.talkingPoint || ''} ${opp.forTheOwner || ''}`.toLowerCase();
    const isExistential = existentialPatterns.some(pattern => 
      combinedText.includes(pattern.toLowerCase())
    );
    
    // Check if severity is critical
    const isCritical = opp.severity === 'critical';
    
    // Check if it's a protected theme (set during consolidation)
    const isProtected = opp._isProtectedTheme === true;
    
    // Force must_address_now if any of these conditions are met
    if (isExistential || isCritical || isProtected) {
      console.log(`[Force Priority] Forcing must_address_now for: ${opp.title} (existential=${isExistential}, critical=${isCritical}, protected=${isProtected})`);
      return {
        ...opp,
        severity: 'critical',
        priority: 'must_address_now',
        priorityRationale: opp.priorityRationale || 'Existential risk requiring immediate strategic attention',
        _forcedPriority: true,
      };
    }
    
    return opp;
  });
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
  
  // =========================================================================
  // CRITICAL: Delete existing opportunities for this engagement FIRST
  // This prevents accumulation of old opportunities on each regeneration
  // =========================================================================
  const { error: deleteError, count: deletedCount } = await supabase
    .from('client_opportunities')
    .delete()
    .eq('engagement_id', engagementId)
    .select('id', { count: 'exact' });
  
  if (deleteError) {
    console.error(`[Pass 3] Failed to delete old opportunities: ${deleteError.message}`);
  } else {
    console.log(`[Pass 3] Deleted ${deletedCount || 0} existing opportunities for engagement ${engagementId}`);
  }
  
  for (let index = 0; index < opportunities.length; index++) {
    const opp = opportunities[index];
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
    
    // Use INSERT (not upsert) since we deleted existing opportunities above
    const { error: oppError } = await supabase
      .from('client_opportunities')
      .insert({
        engagement_id: engagementId,
        client_id: safeClientId,
        opportunity_code: opp.code,
        title: opp.title,
        category: opp.category,
        severity: opp.severity,
        // NEW: Priority fields from direction-aware processing
        priority: opp.priority || 'next_12_months',
        priority_rationale: opp.priorityRationale,
        priority_adjusted: opp.priorityAdjusted || false,
        consolidated_from: opp.consolidatedFrom,
        for_the_owner: opp.forTheOwner,
        display_order: index,
        // End new fields
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
      });
    
    if (oppError) {
      console.error(`[Pass 3] Failed to store opportunity ${opp.code}: ${oppError.message}`);
    }
  }
  
  console.log(`[Pass 3] Stored ${opportunities.length} opportunities`);
}

// ============================================================================
// POST-PROCESSING: Consolidate and Sanitize Opportunities
// ============================================================================

interface OpportunityAnalysis {
  opportunities: any[];
  scenarioSuggestions: any[];
  overallAssessment: any;
  blockedServices?: { serviceCode: string; reason: string }[];
}

function postProcessOpportunities(
  analysis: OpportunityAnalysis, 
  revenue: number,
  directionContext: DirectionContext
): OpportunityAnalysis {
  const rawOpps = analysis.opportunities || [];
  
  if (rawOpps.length === 0) {
    return analysis;
  }
  
  console.log(`[Post-Process] Starting with ${rawOpps.length} raw opportunities, revenue £${(revenue/1000000).toFixed(1)}M`);
  console.log(`[Post-Process] Client direction: ${directionContext.businessDirection}`);
  
  // Step 1: Consolidate duplicate themes
  const consolidated = consolidateOpportunities(rawOpps);
  console.log(`[Post-Process] After consolidation: ${consolidated.length} opportunities`);
  
  // Step 2: Sanitize financial impacts (cap at sensible % of revenue)
  const sanitized = consolidated.map(opp => sanitizeFinancialImpact(opp, revenue));
  
  // Step 3: Filter blocked services based on client context
  const { allowed, blocked } = filterBlockedServices(sanitized, directionContext);
  console.log(`[Post-Process] After service filtering: ${allowed.length} allowed, ${blocked.length} blocked`);
  
  // Step 4: Apply direction-aware priority adjustment
  const prioritised = adjustPrioritiesForDirection(allowed, directionContext.businessDirection);
  
  // Step 4b: FORCE must_address_now for existential risks
  const forcedPriority = forceMustAddressNow(prioritised);
  
  // Step 5: Sort by priority, then severity, then impact
  const priorityOrder: Record<string, number> = { must_address_now: 0, next_12_months: 1, when_ready: 2 };
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, opportunity: 4 };
  forcedPriority.sort((a, b) => {
    const priDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    if (priDiff !== 0) return priDiff;
    const sevDiff = (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5);
    if (sevDiff !== 0) return sevDiff;
    return (b.financialImpact?.amount || 0) - (a.financialImpact?.amount || 0);
  });
  
  // Step 6: Cap at 12 opportunities
  const capped = forcedPriority.slice(0, 12);
  console.log(`[Post-Process] Final count: ${capped.length} opportunities`);
  
  // Recalculate total opportunity value
  const totalValue = capped.reduce((sum, opp) => sum + (opp.financialImpact?.amount || 0), 0);
  console.log(`[Post-Process] Total opportunity value: £${(totalValue/1000000).toFixed(1)}M`);
  
  // Count by priority
  const mustAddress = capped.filter(o => o.priority === 'must_address_now').length;
  const next12 = capped.filter(o => o.priority === 'next_12_months').length;
  const whenReady = capped.filter(o => o.priority === 'when_ready').length;
  console.log(`[Post-Process] Priority distribution: ${mustAddress} must-address, ${next12} next-12m, ${whenReady} when-ready`);
  
  return {
    ...analysis,
    opportunities: capped,
    blockedServices: blocked,
    overallAssessment: {
      ...analysis.overallAssessment,
      totalOpportunityValue: totalValue,
      clientDirection: directionContext.businessDirection,
    }
  };
}

// =============================================================================
// THEME CONFIGURATION - With protected themes that never get merged
// =============================================================================

interface ThemeConfig {
  keywords: string[];
  excludeKeywords: string[];  // If these appear, don't match this theme
  protected: boolean;         // Protected themes never get merged
  forceSeverity?: 'critical' | 'high';  // Force this severity for protected themes
  forcePriority?: 'must_address_now';   // Force this priority for protected themes
}

const THEME_CONFIG: Record<string, ThemeConfig> = {
  // ==========================================================================
  // PROTECTED THEMES - These are existential and should NEVER be merged
  // ==========================================================================
  'concentration_risk': {
    keywords: [
      'customer concentration', 'client concentration', 'revenue concentration',
      'top 3 clients', 'top three clients', '99%', '99% of revenue', '90%+ revenue',
      'single point of failure', 'existential risk', 'one contract loss',
      'client diversification', 'revenue from 3', 'three clients'
    ],
    excludeKeywords: ['contract terms', 'renewal date', 'notice period', 'contract intelligence', 'contract blind'],
    protected: true,
    forceSeverity: 'critical',
    forcePriority: 'must_address_now',
  },
  'founder_dependency': {
    keywords: [
      'founder dependency', 'founder revenue', 'personal brand revenue',
      'knowledge dependency', 'key person risk', 'owner dependency',
      'founder knowledge', 'hit by a bus', 'unsellable', 'exit blocker',
      '80% knowledge', '70% knowledge', 'owner trapped'
    ],
    excludeKeywords: ['succession plan', 'hire successor'],
    protected: true,
    forceSeverity: 'critical',
    forcePriority: 'must_address_now',
  },
  'succession_gap': {
    keywords: [
      'succession plan', 'no succession', 'leadership gap', 'leadership vacuum',
      'need to hire successor', 'would fail without owner', 'exit readiness',
      'successor identified', 'no one to take over'
    ],
    excludeKeywords: [],
    protected: true,  // Protected but not always critical
  },

  // ==========================================================================
  // NON-PROTECTED THEMES - These CAN be merged
  // ==========================================================================
  'contract_visibility': {
    keywords: [
      'contract terms', 'renewal dates', 'notice period', 'termination clause',
      'contract intelligence', 'contract blind spot', 'contract visibility',
      'contract expiry', 'renewal risk', 'contract audit'
    ],
    excludeKeywords: ['concentration'],
    protected: false,
  },
  'documentation_ip': {
    keywords: [
      'undocumented', 'intellectual property', 'ip protection', 'processes not documented',
      'cradle to grave', 'methodology', 'not protected', 'documentation gap'
    ],
    excludeKeywords: [],
    protected: false,
  },
  'pricing_margin': {
    keywords: [
      'price increase', 'pricing power', 'underpriced', 'margin improvement',
      'margin recovery', 'margin erosion', 'rate card', 'charge rate',
      'no price increase', '2 years without'
    ],
    excludeKeywords: [],
    protected: false,
  },
  'surplus_cash': {
    keywords: [
      'surplus cash', 'cash sitting', 'idle cash', 'excess cash',
      'underdeployed capital', 'cash drag', 'opportunity cost', '£7.7m', '£7.7M'
    ],
    excludeKeywords: [],
    protected: false,
  },
  'revenue_model': {
    keywords: [
      'recurring revenue', 'predictability', 'revenue model', 'retainer',
      'contract backlog', 'one-time revenue', 'project-based', '0% recurring'
    ],
    excludeKeywords: [],
    protected: false,
  },
  'working_capital': {
    keywords: [
      'debtor days', 'creditor days', 'cash collection', 'working capital',
      'cash conversion', 'payment terms'
    ],
    excludeKeywords: [],
    protected: false,
  },
  'operational_efficiency': {
    keywords: [
      'utilisation', 'productivity', 'efficiency', 'revenue per employee',
      'capacity', 'overhead', 'team advocacy'
    ],
    excludeKeywords: [],
    protected: false,
  },
  'valuation_readiness': {
    keywords: [
      'valuation discount', 'sale ready', 'exit value', 'acquisition target'
    ],
    excludeKeywords: [],
    protected: false,
  },
};

// =============================================================================
// IMPROVED THEME ASSIGNMENT - With exclusion keywords
// =============================================================================

function assignTheme(opp: any): { theme: string; score: number } {
  const textToMatch = `${opp.title || ''} ${opp.code || ''} ${opp.dataEvidence || ''} ${opp.talkingPoint || ''}`.toLowerCase();
  
  let bestTheme = 'other';
  let bestScore = 0;
  
  for (const [themeName, config] of Object.entries(THEME_CONFIG)) {
    // Check if any exclude keywords match - if so, skip this theme
    const hasExclude = config.excludeKeywords.some(kw => textToMatch.includes(kw.toLowerCase()));
    if (hasExclude) continue;
    
    // Score based on keyword matches
    const score = config.keywords.filter(kw => textToMatch.includes(kw.toLowerCase())).length;
    
    if (score > bestScore) {
      bestScore = score;
      bestTheme = themeName;
    }
  }
  
  return { theme: bestTheme, score: bestScore };
}

// =============================================================================
// IMPROVED CONSOLIDATION - Respects protected themes
// =============================================================================

function consolidateOpportunities(opportunities: any[]): any[] {
  console.log(`[Consolidation] Starting with ${opportunities.length} opportunities`);
  
  // Step 1: Assign themes
  const withThemes = opportunities.map(opp => {
    const { theme, score } = assignTheme(opp);
    return { ...opp, _theme: theme, _themeScore: score };
  });
  
  // Step 2: Group by theme
  const byTheme: Record<string, any[]> = {};
  for (const opp of withThemes) {
    if (!byTheme[opp._theme]) byTheme[opp._theme] = [];
    byTheme[opp._theme].push(opp);
  }
  
  console.log(`[Consolidation] Theme distribution:`, Object.entries(byTheme).map(([k, v]) => `${k}:${v.length}`).join(', '));
  
  // Step 3: Process each theme
  const consolidated: any[] = [];
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, opportunity: 4 };
  
  for (const [theme, opps] of Object.entries(byTheme)) {
    const config = THEME_CONFIG[theme];
    const isProtected = config?.protected || false;
    
    if (isProtected) {
      // =======================================================================
      // PROTECTED THEME: Keep the best representative, don't merge
      // =======================================================================
      opps.sort((a, b) => {
        const sevDiff = (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5);
        if (sevDiff !== 0) return sevDiff;
        return (b.financialImpact?.amount || 0) - (a.financialImpact?.amount || 0);
      });
      
      const { _theme, _themeScore, ...best } = opps[0];
      
      // Force severity and priority for protected themes
      if (config.forceSeverity) {
        best.severity = config.forceSeverity;
      }
      if (config.forcePriority) {
        best.priority = config.forcePriority;
        best.priorityRationale = 'Existential risk requiring immediate strategic attention';
      }
      
      best._isProtectedTheme = true;
      best._consolidatedCount = opps.length;
      
      consolidated.push(best);
      console.log(`[Consolidation] Protected theme "${theme}": kept as separate ${best.severity} item`);
      
    } else {
      // =======================================================================
      // NON-PROTECTED THEME: Merge if multiple items
      // =======================================================================
      if (opps.length === 1) {
        const { _theme, _themeScore, ...cleanOpp } = opps[0];
        consolidated.push(cleanOpp);
      } else {
        // Sort by severity then impact
        opps.sort((a, b) => {
          const sevDiff = (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5);
          if (sevDiff !== 0) return sevDiff;
          return (b.financialImpact?.amount || 0) - (a.financialImpact?.amount || 0);
        });
        
        const { _theme, _themeScore, ...best } = opps[0];
        
        // Keep the highest financial impact
        const maxImpact = Math.max(...opps.map(o => o.financialImpact?.amount || 0));
        best.financialImpact = {
          ...best.financialImpact,
          amount: maxImpact,
          _consolidatedFrom: opps.length,
        };
        
        // Note consolidation in title if significantly merged
        if (opps.length >= 3) {
          best.title = `${best.title} (${opps.length} related issues)`;
        }
        
        best._consolidatedCount = opps.length;
        consolidated.push(best);
        console.log(`[Consolidation] Theme "${theme}": merged ${opps.length} items → "${best.title}"`);
      }
    }
  }
  
  // Step 4: Log final distribution
  console.log(`[Consolidation] Final: ${consolidated.length} opportunities`);
  const protectedCount = consolidated.filter(o => o._isProtectedTheme).length;
  console.log(`[Consolidation] Protected themes: ${protectedCount}`);
  
  return consolidated;
}

function sanitizeFinancialImpact(opp: any, revenue: number): any {
  const impact = opp.financialImpact?.amount || 0;
  const category = opp.category || 'other';
  const type = opp.financialImpact?.type || 'risk';
  
  // If revenue is 0 or missing, DON'T cap impacts - keep the LLM's estimates
  // This preserves meaningful financial impact even when revenue extraction failed
  if (!revenue || revenue <= 0) {
    console.log(`[Post-Process] Revenue unknown, keeping LLM impact for "${opp.title}": £${(impact/1000000).toFixed(1)}M`);
    return {
      ...opp,
      financialImpact: {
        ...opp.financialImpact,
        amount: Math.round(impact),
        _revenueUnknown: true,
      },
    };
  }
  
  // Maximum impact by category as % of revenue
  const MAX_IMPACT_PERCENT: Record<string, number> = {
    'risk': 0.30,        // Risk mitigation value capped at 30% of revenue
    'efficiency': 0.15,   // Efficiency gains capped at 15% of revenue
    'growth': 0.25,       // Growth opportunity capped at 25% of revenue
    'value': 0.40,        // Value creation capped at 40% of revenue
    'governance': 0.15,   // Governance issues capped at 15%
    'other': 0.20,        // Default cap at 20%
  };

  // Additional cap based on severity
  const SEVERITY_CAP: Record<string, number> = {
    'critical': 0.30,
    'high': 0.20,
    'medium': 0.12,
    'low': 0.08,
    'opportunity': 0.15,
  };

  const categoryCap = MAX_IMPACT_PERCENT[category] || 0.20;
  const severityCap = SEVERITY_CAP[opp.severity] || 0.15;
  
  // Use the lower of the two caps
  const effectiveCap = Math.min(categoryCap, severityCap);
  const maxImpact = revenue * effectiveCap;
  
  // For "risk" type, the opportunity is the value of MITIGATING the risk, not the risk itself
  let adjustedImpact = impact;
  if (type === 'risk' && impact > maxImpact) {
    // Risk mitigation value is typically 15-25% of the risk exposure
    adjustedImpact = Math.min(impact * 0.20, maxImpact);
  } else {
    adjustedImpact = Math.min(impact, maxImpact);
  }
  
  const wasCapped = adjustedImpact < impact;
  
  if (wasCapped) {
    console.log(`[Post-Process] Capped "${opp.title}" impact: £${(impact/1000000).toFixed(1)}M → £${(adjustedImpact/1000000).toFixed(1)}M (${(effectiveCap*100).toFixed(0)}% of revenue)`);
  }
  
  return {
    ...opp,
    financialImpact: {
      ...opp.financialImpact,
      amount: Math.round(adjustedImpact),
      _originalAmount: wasCapped ? impact : undefined,
      _wasCapped: wasCapped,
    },
  };
}
