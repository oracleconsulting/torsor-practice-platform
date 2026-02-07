/**
 * Generate Discovery Opportunities (Pass 3)
 * 
 * Uses Claude Sonnet 4 to analyse discovery data and identify opportunities.
 * Maps to existing services or surfaces new service concepts.
 * Respects client type classification from Pass 1.
 * 
 * Part of the Service Intelligence System - learns from every client.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model configuration — Sonnet for speed (20-30s); Opus would be 150+ and risk timeout
const MODEL_CONFIG = {
  model: 'anthropic/claude-sonnet-4.5',
  max_tokens: 12000,
  temperature: 0.3,
};

// ============================================================================
// CLIENT TYPE DEFINITIONS (mirror from Pass 1)
// ============================================================================

type ClientBusinessType = 
  | 'trading_product'        
  | 'trading_agency'         
  | 'professional_practice'  
  | 'investment_vehicle'     
  | 'funded_startup'         
  | 'lifestyle_business';

interface FrameworkOverrides {
  useEarningsValuation: boolean;
  useAssetValuation: boolean;
  benchmarkAgainst: string | null;
  exitReadinessRelevant: boolean;
  payrollBenchmarkRelevant: boolean;
  appropriateServices: string[];
  inappropriateServices: string[];
  reportFraming: 'transformation' | 'wealth_protection' | 'foundations' | 'optimisation';
  maxRecommendedInvestment: number | null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

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

    console.log(`[Discovery Pass 3] Starting opportunity analysis for engagement: ${engagementId}`);

    // 1. Gather all client data
    const clientData = await gatherAllClientData(supabase, engagementId);
    console.log(`[Discovery Pass 3] Gathered data for client: ${clientData.clientName} (${clientData.clientType})`);

    // 2. Get active service catalogue
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active');
    
    console.log(`[Discovery Pass 3] Loaded ${services?.length || 0} active services`);
    
    // 2a. Load service pricing for correct display
    const servicePricing = await loadServicePricing(supabase);

    // 3. Get existing concepts (to avoid duplicates)
    const { data: existingConcepts } = await supabase
      .from('service_concepts')
      .select('id, suggested_name, problem_it_solves, times_identified')
      .in('review_status', ['pending', 'under_review']);
    
    console.log(`[Discovery Pass 3] Found ${existingConcepts?.length || 0} existing concepts`);

    // 4. Build and call LLM for analysis
    const startTime = Date.now();
    let analysis = await analyseWithLLM(clientData, services || [], existingConcepts || [], servicePricing);
    const analysisTime = Date.now() - startTime;
    
    console.log(`[Discovery Pass 3] LLM identified ${analysis.opportunities?.length || 0} RAW opportunities in ${analysisTime}ms`);
    
    // 4a. POST-PROCESSING: Filter inappropriate services, deduplicate, apply pin/block, and correct pricing
    analysis = postProcessOpportunities(analysis, clientData, servicePricing, services || []);
    
    console.log(`[Discovery Pass 3] After post-processing: ${analysis.opportunities?.length || 0} opportunities (deduplicated)`);

    // 5. Store results
    await storeOpportunities(supabase, engagementId, clientData.clientId, analysis);
    
    // 5b. PHASE 3e: Generate AUTHORITATIVE recommended services
    // This is the SINGLE SOURCE OF TRUTH - frontend should ONLY display these
    const recommendedServices = generateRecommendedServices(
      analysis.opportunities || [],
      services || [],
      analysis.blockedServices || [],
      clientData
    );
    
    console.log(`[Discovery Pass 3] Generated ${recommendedServices.length} authoritative service recommendations`);
    console.log(`[Discovery Pass 3] Recommended: ${recommendedServices.map((r: any) => r.serviceCode).join(', ')}`);
    
    // 6. Update report with opportunity assessment AND recommended services
    await supabase
      .from('discovery_reports')
      .update({
        opportunity_assessment: analysis.overallAssessment,
        recommended_services: recommendedServices,
        not_recommended_services: analysis.blockedServices || [],
        opportunities_generated_at: new Date().toISOString(),
        opportunity_count: analysis.opportunities?.length || 0,
      })
      .eq('engagement_id', engagementId);

    const newConceptCount = (analysis.opportunities || []).filter(
      (o: any) => o.serviceMapping?.newConceptNeeded
    ).length;

    console.log(`[Discovery Pass 3] Complete. ${analysis.opportunities?.length || 0} opportunities, ${newConceptCount} new concepts`);

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
    console.error('[Discovery Pass 3] Error:', error);
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
  companyName: string;
  clientType: ClientBusinessType;
  clientTypeConfidence: number;
  clientTypeSignals: string[];
  frameworkOverrides: FrameworkOverrides | null;
  discoveryResponses: Record<string, any>;
  comprehensiveAnalysis: any;
  destinationClarity: any;
  assetValuation: any;
  emotionalAnchors: any;
  detectedIndustry: string;
  contextNotes: any[];
  financials: any;
  pinnedServices: string[];
  blockedServices: string[];
}

async function gatherAllClientData(supabase: any, engagementId: string): Promise<ClientData> {
  // Get engagement with client info
  const { data: engagement, error: engError } = await supabase
    .from('discovery_engagements')
    .select(`
      *,
      client:practice_members(id, name, email)
    `)
    .eq('id', engagementId)
    .single();
  
  if (engError) {
    console.error('[Discovery Pass 3] Error fetching engagement:', engError);
    throw new Error('Failed to fetch engagement');
  }
  
  const clientId = engagement?.client_id || engagement?.client?.id || '';
  const clientName = engagement?.client?.name || 'Client';
  
  console.log(`[Discovery Pass 3] Engagement data: client_id=${clientId}, clientName=${clientName}`);
  
  // Get discovery report (Pass 1 & 2 data)
  const { data: report } = await supabase
    .from('discovery_reports')
    .select('*')
    .eq('engagement_id', engagementId)
    .single();
  
  // Get discovery responses
  const { data: discoveryData } = await supabase
    .from('destination_discovery')
    .select('responses, company_name')
    .eq('engagement_id', engagementId)
    .single();

  // Get context notes
  const { data: contextNotes } = await supabase
    .from('client_context')
    .select('notes')
    .eq('client_id', clientId);

  // Get financial context
  const { data: financialContext } = await supabase
    .from('client_financial_context')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  // Extract client type from Pass 1
  const clientType = (report?.client_type || 'trading_product') as ClientBusinessType;
  const clientTypeConfidence = report?.client_type_confidence || 50;
  const clientTypeSignals = report?.client_type_signals || [];
  const frameworkOverrides = report?.framework_overrides as FrameworkOverrides | null;

  return {
    engagementId,
    clientId,
    clientName,
    companyName: discoveryData?.company_name || engagement?.client?.client_company || 'Business',
    clientType,
    clientTypeConfidence,
    clientTypeSignals,
    frameworkOverrides,
    discoveryResponses: discoveryData?.responses || {},
    comprehensiveAnalysis: report?.comprehensive_analysis || {},
    destinationClarity: report?.destination_clarity || {},
    assetValuation: report?.asset_valuation || null,
    emotionalAnchors: report?.emotional_anchors || {},
    detectedIndustry: report?.detected_industry || 'general_business',
    contextNotes: contextNotes?.map((n: any) => n.notes) || [],
    financials: financialContext?.extracted_insights || {},
    // Pin/block preferences (normalise to lowercase to match services table)
    pinnedServices: (engagement.pinned_services || []).map((s: string) => (s || '').toLowerCase()),
    blockedServices: (engagement.blocked_services || []).map((s: string) => (s || '').toLowerCase()),
  };
}

// ============================================================================
// LLM ANALYSIS WITH OPUS 4.5
// ============================================================================

async function analyseWithLLM(
  clientData: ClientData, 
  services: any[], 
  existingConcepts: any[],
  servicePricing: Map<string, ServicePricing>
): Promise<any> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(clientData, services, existingConcepts, servicePricing);
  
  console.log(`[Discovery Pass 3] Calling ${MODEL_CONFIG.model}...`);
  
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
  const content = data.choices?.[0]?.message?.content || '{}';
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildSystemPrompt(): string {
  return `You are a senior business advisor analysing Discovery Assessment data to identify opportunities for client improvement.

Your role is to:
1. Identify EVERY opportunity where we could help the client
2. Map opportunities to existing services OR suggest new service concepts
3. Provide adviser talking points for the discovery call
4. Respect client type constraints - don't recommend inappropriate services

You output valid JSON only. Be specific about financial impact where possible.
Use UK English. Ground every insight in the client's actual data and words.`;
}

function buildUserPrompt(
  clientData: ClientData,
  services: any[],
  existingConcepts: any[],
  servicePricing: Map<string, ServicePricing>
): string {
  const responses = clientData.discoveryResponses;
  const analysis = clientData.comprehensiveAnalysis;
  
  // Format services with correct pricing
  const formattedServices = services.map(s => {
    const pricing = servicePricing.get(s.code);
    const priceDisplay = pricing?.displayPrice || `£${s.price_amount || 'varies'}`;
    const model = pricing?.pricingModel || 'fixed';
    return `- **${s.code}**: ${s.name} - ${s.short_description || s.description?.substring(0, 100) || 'No description'} (${priceDisplay}, ${model})`;
  }).join('\n');
  
  return `
## DISCOVERY OPPORTUNITY ANALYSIS

Analyse this client's Discovery Assessment and identify all opportunities.

## CLIENT PROFILE

**Name:** ${clientData.clientName}
**Company:** ${clientData.companyName}
**Client Type:** ${clientData.clientType} (${clientData.clientTypeConfidence}% confidence)
**Type Signals:** ${clientData.clientTypeSignals.join(', ') || 'None'}
**Industry:** ${clientData.detectedIndustry}

${getClientTypeRules(clientData.clientType, clientData.frameworkOverrides)}

## THEIR VISION & EMOTIONAL ANCHORS

**Tuesday Test (Ideal Future):**
"${responses.dd_five_year_vision || responses.dd_tuesday_test || 'Not provided'}"

**Magic Fix (What they'd change first):**
"${responses.dd_magic_fix || 'Not provided'}"

**Core Frustration:**
"${responses.dd_core_frustration || 'Not provided'}"

**What Keeps Them Awake:**
"${responses.dd_sleep_thief || 'Not provided'}"

**Avoided Conversation:**
"${responses.dd_avoided_conversation || 'Not provided'}"

**Hard Truth They Suspect:**
"${responses.dd_hard_truth || responses.dd_suspected_truth || 'Not provided'}"

**Business Relationship Metaphor:**
"${responses.dd_relationship_mirror || 'Not provided'}"

**What They've Sacrificed:**
"${responses.dd_sacrifice_list || 'Not provided'}"

**Last Real Break:**
"${responses.dd_last_real_break || 'Not provided'}"

## OPERATIONAL CONTEXT

**Weekly Hours:** ${responses.dd_weekly_hours || 'Unknown'}
**Delegation Ability:** "${responses.dd_delegation_ability || 'Not provided'}"
**Key Person Dependency:** "${responses.dd_key_person_dependency || 'Not provided'}"
**Exit Timeline:** ${responses.sd_exit_timeline || 'Not specified'}
**Change Readiness:** ${responses.dd_change_readiness || 'Unknown'}

## DESTINATION CLARITY

**Score:** ${clientData.destinationClarity?.score || 'N/A'}/10
**Reasoning:** ${clientData.destinationClarity?.reasoning || 'Not analysed'}

## FINANCIAL SNAPSHOT (from Pass 1 Analysis)

${formatFinancials(analysis, clientData.financials, clientData.assetValuation)}

## BENCHMARK COMPARISONS (for grounded ROI calculations)

${formatBenchmarkData(analysis?.lightweightBenchmark)}

## COMPREHENSIVE ANALYSIS (from Pass 1)

${formatAnalysis(analysis)}

## CONTEXT NOTES (from adviser)

${clientData.contextNotes.length > 0 ? clientData.contextNotes.join('\n\n') : 'No adviser notes'}

## ADVISOR SERVICE PREFERENCES

${clientData.pinnedServices.length > 0 
  ? `⭐ MUST INCLUDE these services (advisor has specifically requested them):
${clientData.pinnedServices.map(s => `- ${s}`).join('\n')}

Create an opportunity for each pinned service even if the data doesn't strongly support it. The advisor has context we don't.`
  : 'No pinned services.'}

${clientData.blockedServices.length > 0 
  ? `🚫 DO NOT RECOMMEND these services (advisor has specifically excluded them):
${clientData.blockedServices.map(s => `- ${s}`).join('\n')}

If the data suggests these services, create the opportunity but map it to an alternative service or flag as a new concept.`
  : 'No blocked services.'}

## OUR EXISTING SERVICES (with correct pricing)

${formattedServices}

## SERVICE CONCEPTS IN PIPELINE

${existingConcepts.length > 0 
  ? existingConcepts.map(c => `- **${c.suggested_name}** (seen ${c.times_identified}x): ${c.problem_it_solves}`).join('\n')
  : 'No concepts currently in development'}

---

## YOUR TASK

Identify 6-12 opportunities. For EACH opportunity:

1. **What's the issue?** - Ground in their SPECIFIC words and data
2. **Why does it matter?** - Business impact AND personal/life impact
3. **What should we recommend?** - Existing service OR new concept
4. **What should the adviser say?** - Natural talking point

⚠️ CRITICAL RULES:
- Respect client type constraints (don't recommend inappropriate services)
- If cash-strapped (mentioned in signals), start small (max £${clientData.frameworkOverrides?.maxRecommendedInvestment || 5000})
- If urgent decision pending, address it FIRST with priority "must_address_now"
- We WANT new service concepts - don't force-fit to existing services
- Use their EXACT words where possible

⚠️ SERVICE DEDUPLICATION RULE - CRITICAL:

Each service can only be recommended ONCE, even if it solves multiple problems.

If multiple opportunities would be solved by the same service:
- Pick the PRIMARY opportunity for that service
- List other solved problems in the "alsoAddresses" array
- Combine the financial impact

Example:
- "Founder Dependency" recommends Fractional COO
- "Team Readiness Unknown" also fits Fractional COO
→ Recommend Fractional COO ONCE for "Founder Dependency", note it "alsoAddresses: ['Team Readiness']"

⛔ NEVER output the same service code twice in recommendations

⚠️ PRICING RULES:

Use the EXACT pricing shown above. Note the pricing model:
- "monthly" = recurring monthly fee (show as £X/mo)  
- "annual" = one-time annual engagement (show as £X)
- "fixed" = one-time project fee (show as £X)

Do NOT convert annual prices to monthly or vice versa.

## OUTPUT FORMAT (JSON)

{
  "opportunities": [
    {
      "code": "unique_snake_case_code",
      "title": "Human-Readable Headline (Not service name)",
      "category": "financial|operational|strategic|personal|wealth",
      "severity": "critical|high|medium|opportunity",
      "priority": "must_address_now|next_3_months|next_12_months|when_ready",
      "priorityRationale": "Why this priority",
      "dataEvidence": "Their exact words or specific numbers",
      "financialImpact": {
        "type": "risk|upside|cost_saving|value_creation|unknown",
        "amount": 50000,
        "confidence": "high|medium|low",
        "calculation": "REQUIRED: Show working using benchmark data. Format: 'X% gap on £Yk revenue = £Zk. Conservative (30%): £Ak'"
      },
      "lifeImpact": "What this means for them personally",
      "serviceMapping": {
        "existingService": {
          "code": "SERVICE_CODE",
          "name": "Service Name",
          "displayPrice": "£X/mo or £X",
          "pricingModel": "monthly|annual|fixed",
          "fitScore": 85,
          "rationale": "Why this service helps",
          "limitation": "What it won't fully solve",
          "alsoAddresses": ["Other opportunity title if this service solves multiple problems"]
        },
        "newConceptNeeded": null
      },
      "adviserTools": {
        "talkingPoint": "Natural conversation starter",
        "questionToAsk": "Discovery question to dig deeper",
        "quickWin": "Something they can do this week"
      }
    }
  ],
  "newServiceConcepts": [
    {
      "suggestedName": "Service Name",
      "category": "financial|operational|strategic|wealth",
      "problemItSolves": "Specific problem",
      "suggestedDeliverables": ["deliverable1", "deliverable2"],
      "suggestedPricing": "£X-£Y",
      "triggeredBy": "What in this client's situation revealed the gap",
      "marketSize": "niche|moderate|broad"
    }
  ],
  "overallAssessment": {
    "clientHealth": "emerging|building|stable|thriving|at_risk",
    "headline": "One sentence summary",
    "topPriority": "Single most important thing to address",
    "totalOpportunityValue": 150000,
    "readinessForEngagement": "high|medium|low",
    "appropriatenessCheck": {
      "clientTypeRespected": true,
      "investmentCapRespected": true,
      "urgentIssuesAddressed": true
    }
  },
  "blockedServices": [
    {
      "code": "SERVICE_CODE",
      "reason": "Why this service is inappropriate for this client"
    }
  ]
}
`;
}

function getClientTypeRules(type: ClientBusinessType, overrides: FrameworkOverrides | null): string {
  const rules: Record<ClientBusinessType, string> = {
    'investment_vehicle': `
## ⚠️ CLIENT TYPE RULES: INVESTMENT VEHICLE

⛔ DO NOT recommend: benchmarking, systems_audit, management_accounts, 365_method
✅ FOCUS ON: IHT planning, succession, property management, wealth transfer
✅ This client KNOWS their value (asset-based: £${overrides?.maxRecommendedInvestment ? 'N/A' : 'see asset valuation'}). Don't say "you don't know what you're worth".
✅ Frame as "wealth protection" not "transformation"`,

    'funded_startup': `
## ⚠️ CLIENT TYPE RULES: FUNDED STARTUP

⛔ DO NOT recommend: benchmarking, 365_method, fractional_cfo, business_advisory
⛔ Maximum investment: £${overrides?.maxRecommendedInvestment || 15000}
✅ FOCUS ON: runway management, board reporting, foundations
✅ Frame as "building foundations" not "transformation"
✅ They have a 5+ year horizon - no exit planning`,

    'trading_agency': `
## ⚠️ CLIENT TYPE RULES: CREATIVE/DIGITAL AGENCY

⛔ DO NOT use standard payroll benchmarks (contractors break this)
⛔ DO NOT recommend generic benchmarking
⛔ Maximum initial investment: £${overrides?.maxRecommendedInvestment || 5000} (if cash-strapped)
✅ FOCUS ON: cash flow, utilisation, contractor analysis, project profitability
✅ If urgent decision (senior hire), address FIRST`,

    'trading_product': `Standard trading business - all services available.`,
    
    'professional_practice': `Professional services - most services apply. Focus on partner dynamics, succession, goodwill.`,
    
    'lifestyle_business': `
## CLIENT TYPE RULES: LIFESTYLE BUSINESS

⛔ DO NOT push transformation if they're content
⛔ DO NOT recommend 365_method, business_advisory, fractional_coo
✅ Focus on efficiency gains, not growth
✅ Respect their work-life balance choices`
  };
  
  return rules[type] || rules['trading_product'];
}

function formatFinancials(analysis: any, financials: any, assetValuation: any): string {
  const lines: string[] = [];
  
  // Asset valuation for investment vehicles
  if (assetValuation?.hasData) {
    lines.push(`**Asset-Based Valuation:** £${((assetValuation.totalAssetValue || 0)/1000000).toFixed(1)}M`);
    if (assetValuation.investmentProperty) {
      lines.push(`- Investment Property: £${(assetValuation.investmentProperty/1000000).toFixed(1)}M`);
    }
    if (assetValuation.netAssets) {
      lines.push(`- Net Assets: £${(assetValuation.netAssets/1000000).toFixed(1)}M`);
    }
    lines.push('');
  }
  
  // Valuation
  if (analysis?.valuation?.hasData) {
    const v = analysis.valuation;
    lines.push(`**Earnings-Based Valuation:** £${((v.conservativeValue || 0)/1000000).toFixed(1)}M - £${((v.optimisticValue || 0)/1000000).toFixed(1)}M`);
    lines.push(`- Operating Profit: £${((v.operatingProfit || 0)/1000).toFixed(0)}k`);
    lines.push(`- Multiple: ${v.adjustedMultipleLow?.toFixed(1) || '?'}-${v.adjustedMultipleHigh?.toFixed(1) || '?'}x`);
    lines.push('');
  }
  
  // Payroll
  if (analysis?.payroll?.hasData) {
    const p = analysis.payroll;
    lines.push(`**Payroll Analysis:** ${p.staffCostsPct?.toFixed(1) || '?'}% of revenue (${p.assessment})`);
    if (p.annualExcess && p.annualExcess > 0) {
      lines.push(`- Annual Excess: £${(p.annualExcess/1000).toFixed(0)}k`);
    }
    lines.push('');
  }
  
  // Hidden Assets
  if (analysis?.hiddenAssets?.totalHiddenAssets > 50000) {
    const h = analysis.hiddenAssets;
    lines.push(`**Hidden Assets:** £${(h.totalHiddenAssets/1000).toFixed(0)}k`);
    h.assets?.forEach((a: any) => {
      lines.push(`- ${a.description}: £${(a.value/1000).toFixed(0)}k`);
    });
    lines.push('');
  }
  
  // Gross Margin
  if (analysis?.grossMargin?.hasData) {
    lines.push(`**Gross Margin:** ${analysis.grossMargin.grossMarginPct?.toFixed(1)}% (${analysis.grossMargin.assessment})`);
    lines.push('');
  }
  
  // Exit Readiness
  if (analysis?.exitReadiness?.score) {
    lines.push(`**Exit Readiness:** ${analysis.exitReadiness.score}/${analysis.exitReadiness.maxScore} (${analysis.exitReadiness.readiness})`);
    lines.push('');
  }
  
  // Cost of Inaction
  if (analysis?.costOfInaction?.totalCost) {
    lines.push(`**Cost of Inaction:** £${(analysis.costOfInaction.totalCost/1000).toFixed(0)}k over ${analysis.costOfInaction.horizonYears} years`);
    lines.push('');
  }
  
  return lines.length > 0 ? lines.join('\n') : 'Limited financial data available';
}

function formatBenchmarkData(benchmark: any): string {
  if (!benchmark?.hasData) {
    return 'No benchmark data available - use qualitative impact only.';
  }
  
  const lines: string[] = [];
  lines.push(`**Industry:** ${benchmark.industry}`);
  lines.push(`**Total Quantified Opportunity:** £${((benchmark.totalOpportunityValue || 0)/1000).toFixed(0)}k/year`);
  lines.push(`**Summary:** ${benchmark.summaryNarrative}`);
  lines.push('');
  lines.push('**Metric Comparisons:**');
  
  for (const comp of (benchmark.comparisons || [])) {
    const status = comp.gapType === 'above' ? '✓ ABOVE' : 
                   comp.gapType === 'below' ? '⚠️ BELOW' : '≈ AT';
    lines.push(`- **${comp.metric}**: Client ${comp.clientValue?.toFixed(1)} vs Median ${comp.benchmarkMedian?.toFixed(1)} (${status} benchmark)`);
    if (comp.annualImpact && comp.calculation) {
      lines.push(`  → Opportunity: £${(comp.annualImpact/1000).toFixed(0)}k/year (${comp.calculation})`);
    }
  }
  
  lines.push('');
  lines.push('⚠️ CRITICAL: Use these benchmark figures to ground your "financialImpact" calculations.');
  lines.push('Apply conservative factor (30-50% achievable) to raw opportunity values.');
  lines.push('If client is ABOVE benchmarks, focus on scaling/founder dependency, not efficiency.');
  
  return lines.join('\n');
}

function formatAnalysis(analysis: any): string {
  if (!analysis || Object.keys(analysis).length === 0) {
    return 'No comprehensive analysis available';
  }
  
  const sections: string[] = [];
  
  sections.push(`**Data Quality:** ${analysis.dataQuality || 'unknown'}`);
  sections.push(`**Available Metrics:** ${(analysis.availableMetrics || []).join(', ') || 'None'}`);
  
  if (analysis.achievements?.achievements?.length > 0) {
    sections.push(`\n**Achievements Identified:**`);
    analysis.achievements.achievements.slice(0, 5).forEach((a: any) => {
      sections.push(`- ${a.title}`);
    });
  }
  
  return sections.join('\n');
}

// ============================================================================
// SERVICE PRICING TYPES
// ============================================================================

interface ServicePricing {
  code: string;
  name: string;
  pricingModel: 'monthly' | 'annual' | 'fixed' | 'project';
  price: number;
  displayPrice: string;
}

// ============================================================================
// SERVICE DEDUPLICATION
// ============================================================================

function deduplicateServiceRecommendations(opportunities: any[], servicePricing: Map<string, ServicePricing>): any[] {
  const seenServices = new Map<string, any>();
  const seenServiceNames = new Map<string, any>(); // FIX 4: Track by name as fallback
  const deduplicated: any[] = [];
  
  for (const opp of opportunities) {
    const serviceCode = opp.serviceMapping?.existingService?.code;
    const serviceName = opp.serviceMapping?.existingService?.name || 
                       opp.serviceMapping?.newConceptNeeded?.suggestedName ||
                       '';
    
    if (!serviceCode && !serviceName) {
      // No service mapped - keep the opportunity
      deduplicated.push(opp);
      continue;
    }
    
    // FIX 4: Check for duplicates by code first, then by name (case-insensitive)
    let existing: any = null;
    let matchType = '';
    
    if (serviceCode && seenServices.has(serviceCode)) {
      existing = seenServices.get(serviceCode);
      matchType = 'code';
    } else if (serviceName) {
      // Try matching by name (case-insensitive)
      const nameLower = serviceName.toLowerCase();
      for (const [key, value] of seenServiceNames.entries()) {
        if (key.toLowerCase() === nameLower) {
          existing = value;
          matchType = 'name';
          break;
        }
      }
      
      // Also check if name contains same root (e.g., both contain "Management Accounts")
      if (!existing && serviceName) {
        const nameWords = nameLower.split(/\s+/).filter(w => w.length > 3); // Words longer than 3 chars
        for (const [key, value] of seenServiceNames.entries()) {
          const keyWords = key.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          // Check if they share significant words
          const sharedWords = nameWords.filter(w => keyWords.includes(w));
          if (sharedWords.length >= 2) { // At least 2 significant words match
            existing = value;
            matchType = 'name-root';
            console.log(`[Opportunities] Matched by name root: "${serviceName}" matches "${key}" (shared: ${sharedWords.join(', ')})`);
            break;
          }
        }
      }
    }
    
    if (existing) {
      // Service already recommended - merge the opportunities
      
      // Combine the rationales
      if (existing.serviceMapping?.existingService) {
        existing.serviceMapping.existingService.rationale = 
          `${existing.serviceMapping.existingService.rationale}\n\nAlso addresses: ${opp.title}`;
        
        // Track merged opportunities
        existing.serviceMapping.existingService.alsoAddresses = 
          existing.serviceMapping.existingService.alsoAddresses || [];
        existing.serviceMapping.existingService.alsoAddresses.push(opp.title);
      }
      
      // Keep the higher severity
      const severityOrder: Record<string, number> = { 'critical': 0, 'high': 1, 'medium': 2, 'opportunity': 3 };
      if ((severityOrder[opp.severity] || 4) < (severityOrder[existing.severity] || 4)) {
        existing.severity = opp.severity;
      }
      
      // Keep the higher priority
      const priorityOrder: Record<string, number> = { 'must_address_now': 0, 'next_3_months': 1, 'next_12_months': 2, 'when_ready': 3 };
      if ((priorityOrder[opp.priority] || 4) < (priorityOrder[existing.priority] || 4)) {
        existing.priority = opp.priority;
        existing.priorityRationale = opp.priorityRationale;
      }
      
      // Combine financial impacts if both exist
      if (opp.financialImpact?.amount && existing.financialImpact?.amount) {
        existing.financialImpact.amount += opp.financialImpact.amount;
        existing.financialImpact.calculation = `${existing.financialImpact.calculation || ''}\n+ ${opp.title}: £${opp.financialImpact.amount.toLocaleString()}`;
      } else if (opp.financialImpact?.amount && !existing.financialImpact?.amount) {
        existing.financialImpact = opp.financialImpact;
      }
      
      console.log(`[Opportunities] Merged duplicate service (matched by ${matchType}): ${serviceCode || serviceName} (${opp.title} into ${existing.title})`);
    } else {
      // First time seeing this service - apply correct pricing
      const pricing = servicePricing.get(serviceCode || '');
      if (pricing && opp.serviceMapping?.existingService) {
        opp.serviceMapping.existingService.name = pricing.name;
        opp.serviceMapping.existingService.price = pricing.price;
        opp.serviceMapping.existingService.displayPrice = pricing.displayPrice;
        opp.serviceMapping.existingService.pricingModel = pricing.pricingModel;
      }
      
      // Track by both code and name
      if (serviceCode) {
        seenServices.set(serviceCode, opp);
      }
      if (serviceName) {
        seenServiceNames.set(serviceName, opp);
      }
      
      deduplicated.push(opp);
    }
  }
  
  console.log(`[Opportunities] Deduplication: ${opportunities.length} → ${deduplicated.length} opportunities`);
  return deduplicated;
}

// ============================================================================
// SERVICE PRICING LOADER
// ============================================================================

async function loadServicePricing(supabase: any): Promise<Map<string, ServicePricing>> {
  const { data: services } = await supabase
    .from('services')
    .select('code, name, pricing_model, price_amount, price_display')
    .eq('status', 'active');
  
  const pricingMap = new Map<string, ServicePricing>();
  
  for (const s of services || []) {
    const isMonthly = s.pricing_model === 'monthly' || s.pricing_model === 'retainer';
    const price = s.price_amount || 0;
    
    // Use price_display if set, otherwise format based on model
    let displayPrice = s.price_display;
    if (!displayPrice) {
      displayPrice = isMonthly 
        ? `£${price.toLocaleString()}/mo` 
        : `£${price.toLocaleString()}`;
    }
    
    pricingMap.set(s.code, {
      code: s.code,
      name: s.name,
      pricingModel: s.pricing_model || 'fixed',
      price: price,
      displayPrice: displayPrice
    });
  }
  
  console.log(`[Opportunities] Loaded pricing for ${pricingMap.size} services`);
  return pricingMap;
}

// ============================================================================
// POST-PROCESSING
// ============================================================================

function postProcessOpportunities(analysis: any, clientData: ClientData, servicePricing: Map<string, ServicePricing>, services: any[] = []): any {
  const inappropriateServices = clientData.frameworkOverrides?.inappropriateServices || [];
  const maxInvestment = clientData.frameworkOverrides?.maxRecommendedInvestment;
  
  // Filter out opportunities that recommend inappropriate services
  let opportunities = analysis.opportunities || [];
  const blockedServices: any[] = analysis.blockedServices || [];
  
  // PHASE 3d: Remove manually blocked services
  if (clientData.blockedServices.length > 0) {
    for (const opp of opportunities) {
      const serviceCode = (opp.serviceMapping?.existingService?.code || '').toLowerCase();
      if (serviceCode && clientData.blockedServices.includes(serviceCode)) {
        console.log(`[Pass 3] Blocked service ${serviceCode} from opportunity: ${opp.title}`);
        blockedServices.push({
          code: serviceCode,
          reason: 'Manually blocked by advisor',
          opportunityCode: opp.code
        });
        // Remap to new concept instead
        opp.serviceMapping.newConceptNeeded = {
          suggestedName: opp.serviceMapping.existingService.name + ' (Alternative)',
          problemItSolves: opp.title,
          suggestedDeliverables: [],
          suggestedPricing: opp.serviceMapping.existingService.displayPrice,
          marketSize: 'moderate',
          triggeredBy: 'Service blocked by advisor'
        };
        opp.serviceMapping.existingService = null;
      }
    }
  }
  
  opportunities = opportunities.filter((opp: any) => {
    const serviceCode = (opp.serviceMapping?.existingService?.code || '').toLowerCase();
    if (serviceCode && inappropriateServices.some((s: string) => s.toLowerCase() === serviceCode)) {
      blockedServices.push({
        code: serviceCode,
        reason: `Inappropriate for ${clientData.clientType} client type`,
        opportunityCode: opp.code
      });
      // Don't filter out - just remove the service mapping
      opp.serviceMapping.existingService = null;
      opp.serviceMapping.newConceptNeeded = {
        suggestedName: `${clientData.clientType}-specific alternative`,
        problemItSolves: opp.title,
        triggeredBy: 'Existing service inappropriate for client type'
      };
    }
    return true;
  });
  
  // CRITICAL: Deduplicate services (same service shouldn't appear twice)
  opportunities = deduplicateServiceRecommendations(opportunities, servicePricing);
  
  // Sort by priority
  const priorityOrder: Record<string, number> = {
    'must_address_now': 0,
    'next_3_months': 1,
    'next_12_months': 2,
    'when_ready': 3
  };
  
  const severityOrder: Record<string, number> = {
    'critical': 0,
    'high': 1,
    'medium': 2,
    'opportunity': 3
  };
  
  opportunities.sort((a: any, b: any) => {
    const prioA = priorityOrder[a.priority] ?? 4;
    const prioB = priorityOrder[b.priority] ?? 4;
    if (prioA !== prioB) return prioA - prioB;
    
    const sevA = severityOrder[a.severity] ?? 4;
    const sevB = severityOrder[b.severity] ?? 4;
    return sevA - sevB;
  });
  
  // PHASE 3d: Ensure pinned services appear
  if (clientData.pinnedServices.length > 0 && services.length > 0) {
    for (const pinnedCode of clientData.pinnedServices) {
      const alreadyPresent = opportunities.some(
        (o: any) => (o.serviceMapping?.existingService?.code || '').toLowerCase() === pinnedCode
      );
      
      if (!alreadyPresent) {
        console.log(`[Pass 3] Adding pinned service: ${pinnedCode}`);
        // Look up service details from the catalogue (codes are lowercase)
        const serviceInfo = services.find((s: any) => (s.code || '').toLowerCase() === pinnedCode);
        if (serviceInfo) {
          const pricing = servicePricing.get(pinnedCode);
          opportunities.push({
            code: `pinned_${pinnedCode}`,
            title: `${serviceInfo.name} — Advisor Recommended`,
            category: 'strategic',
            severity: 'high',
            priority: 'next_3_months',
            priorityRationale: 'Specifically recommended by advisor based on conversation context',
            dataEvidence: 'Advisor recommendation based on discovery conversation',
            financialImpact: { type: 'unknown', amount: 0, confidence: 'low', calculation: 'To be determined during engagement' },
            lifeImpact: 'Identified by your advisor as relevant to your situation',
            serviceMapping: {
              existingService: {
                code: pinnedCode,
                name: serviceInfo.name,
                displayPrice: pricing?.displayPrice || `£${serviceInfo.price_amount || 'varies'}`,
                pricingModel: pricing?.pricingModel || 'fixed',
                fitScore: 70,
                rationale: 'Advisor recommendation',
                limitation: null,
                alsoAddresses: []
              },
              newConceptNeeded: null
            },
            adviserTools: {
              talkingPoint: `We think ${serviceInfo.name} could help here based on our conversation.`,
              questionToAsk: 'Would this kind of support be useful?',
              quickWin: null
            },
            show_in_client_view: true // Pinned = advisor wants client to see it
          });
        }
      }
    }
  }
  
  return {
    ...analysis,
    opportunities,
    blockedServices
  };
}

// ============================================================================
// RECOMMENDED SERVICES SYNTHESIS
// ============================================================================

function generateRecommendedServices(
  opportunities: any[],
  services: any[],
  blockedServices: any[],
  clientData: ClientData
): any[] {
  const blockedCodes = blockedServices.map((b: any) => b.code || b.serviceCode);
  
  // Group opportunities by service code
  const serviceGroups = new Map<string, any[]>();
  
  for (const opp of opportunities) {
    const serviceCode = opp.serviceMapping?.existingService?.code;
    if (serviceCode && !blockedCodes.includes(serviceCode)) {
      if (!serviceGroups.has(serviceCode)) {
        serviceGroups.set(serviceCode, []);
      }
      serviceGroups.get(serviceCode)!.push(opp);
    }
  }
  
  // Build recommended services array
  const recommended: any[] = [];
  
  for (const [serviceCode, opps] of serviceGroups) {
    const primaryOpp = opps[0]; // Highest severity (already sorted)
    const service = services.find((s: any) => s.code === serviceCode);
    
    if (!service) {
      console.log(`[GenerateRecommendedServices] Service not found: ${serviceCode}`);
      continue;
    }
    
    // Calculate total value at stake
    const totalValue = opps.reduce((sum: number, o: any) => {
      const amount = o.financialImpact?.amount || o.financial_impact_amount || 0;
      return sum + amount;
    }, 0);
    
    // Build "Why This Matters" from life impacts and data evidence
    const lifeImpacts = opps
      .map((o: any) => o.lifeImpact || o.life_impact)
      .filter(Boolean);
    
    const dataEvidence = opps
      .map((o: any) => o.dataEvidence || o.data_evidence)
      .filter(Boolean);
    
    const whyThisMatters = lifeImpacts.length > 0 
      ? lifeImpacts[0]  // Use primary life impact
      : dataEvidence.length > 0 
        ? dataEvidence.join(' ')
        : 'Addresses key challenges identified in your assessment';
    
    // Build "What It Addresses" from opportunity titles
    const addresses = opps.map((o: any) => o.title);
    
    // Get display price
    const displayPrice = primaryOpp.serviceMapping?.existingService?.displayPrice || 
                        `£${service.price_amount?.toLocaleString() || 'varies'}`;
    
    const pricingModel = primaryOpp.serviceMapping?.existingService?.pricingModel || 
                         service.price_period || 'fixed';
    
    recommended.push({
      serviceCode,
      serviceName: service.name,
      displayPrice,
      pricingModel,
      totalValueAtStake: totalValue,
      whyThisMatters,
      addresses,
      primaryOpportunityTitle: primaryOpp.title,
      severity: primaryOpp.severity,
      priority: primaryOpp.priority,
      fitScore: primaryOpp.serviceMapping?.existingService?.fitScore || 50,
      opportunityIds: opps.map((o: any) => o.id || o.code)
    });
  }
  
  // Sort by priority, then total value
  const priorityOrder: Record<string, number> = { 
    'must_address_now': 0, 'next_3_months': 1, 'next_12_months': 2, 'when_ready': 3 
  };
  
  recommended.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    if (pDiff !== 0) return pDiff;
    return b.totalValueAtStake - a.totalValueAtStake;
  });
  
  console.log(`[GenerateRecommendedServices] Created ${recommended.length} synthesised recommendations`);
  return recommended;
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
  
  console.log(`[Discovery Pass 3] Storing ${opportunities.length} opportunities...`);
  
  // CRITICAL: Clear stale opportunities before inserting new ones
  // This prevents duplicates across regenerations (Opus generates different codes each run)
  const { error: deleteError } = await supabase
    .from('discovery_opportunities')
    .delete()
    .eq('engagement_id', engagementId);
  
  if (deleteError) {
    console.error('[Discovery Pass 3] Error clearing stale opportunities:', deleteError);
    // Continue anyway — insert will still work for new codes
  } else {
    console.log('[Discovery Pass 3] Cleared existing opportunities for engagement');
  }
  
  for (const opp of opportunities) {
    // Check if it maps to existing service
    let serviceId: string | null = null;
    if (opp.serviceMapping?.existingService?.code) {
      const { data: service } = await supabase
        .from('services')
        .select('id')
        .eq('code', opp.serviceMapping.existingService.code)
        .maybeSingle();
      serviceId = service?.id || null;
    }
    
    // Check if it needs a new concept
    let conceptId: string | null = null;
    if (opp.serviceMapping?.newConceptNeeded) {
      const concept = opp.serviceMapping.newConceptNeeded;
      
      // Check for similar existing concept
      const { data: existing } = await supabase
        .from('service_concepts')
        .select('*')
        .ilike('suggested_name', `%${concept.suggestedName?.split(' ')[0] || 'unknown'}%`)
        .maybeSingle();
      
      if (existing) {
        // Increment times_identified
        await supabase
          .from('service_concepts')
          .update({
            times_identified: (existing.times_identified || 1) + 1,
            client_ids: [...(existing.client_ids || []), clientId].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        conceptId = existing.id;
        console.log(`[Discovery Pass 3] Updated existing concept: ${existing.suggested_name} (now ${existing.times_identified + 1}x)`);
      } else if (concept.suggestedName && concept.problemItSolves) {
        // Create new concept
        const { data: newConcept, error: conceptError } = await supabase
          .from('service_concepts')
          .insert({
            suggested_name: concept.suggestedName,
            suggested_category: opp.category,
            problem_it_solves: concept.problemItSolves,
            suggested_deliverables: concept.suggestedDeliverables || [],
            suggested_pricing: concept.suggestedPricing || null,
            first_client_id: clientId,
            first_engagement_id: engagementId,
            client_ids: [clientId],
            market_size_estimate: concept.marketSize || 'moderate',
            triggered_by: concept.triggeredBy || `Discovery for ${clientId}`,
            source_type: 'discovery',
            review_status: 'pending'
          })
          .select('id')
          .single();
        
        if (!conceptError && newConcept) {
          conceptId = newConcept.id;
          console.log(`[Discovery Pass 3] Created new concept: ${concept.suggestedName}`);
        }
      }
    }
    
    // Store opportunity (plain insert — stale opportunities already deleted above)
    const { error: oppError } = await supabase
      .from('discovery_opportunities')
      .insert({
        engagement_id: engagementId,
        client_id: clientId,
        opportunity_code: opp.code,
        title: opp.title,
        category: opp.category,
        severity: opp.severity,
        data_evidence: opp.dataEvidence,
        data_values: {
          priority: opp.priority,
          priorityRationale: opp.priorityRationale
        },
        financial_impact_type: opp.financialImpact?.type,
        financial_impact_amount: opp.financialImpact?.amount,
        financial_impact_confidence: opp.financialImpact?.confidence,
        impact_calculation: opp.financialImpact?.calculation,
        life_impact: opp.lifeImpact,
        recommended_service_id: serviceId,
        service_fit_score: opp.serviceMapping?.existingService?.fitScore,
        service_fit_rationale: opp.serviceMapping?.existingService?.rationale,
        service_fit_limitation: opp.serviceMapping?.existingService?.limitation,
        suggested_concept_id: conceptId,
        talking_point: opp.adviserTools?.talkingPoint,
        question_to_ask: opp.adviserTools?.questionToAsk,
        quick_win: opp.adviserTools?.quickWin,
        show_in_client_view: opp.show_in_client_view || false,
        generated_at: new Date().toISOString()
      });
    
    if (oppError) {
      console.error(`[Discovery Pass 3] Error storing opportunity ${opp.code}:`, oppError);
    }
  }
  
  // Store new service concepts from dedicated array
  for (const concept of (analysis.newServiceConcepts || [])) {
    if (!concept.suggestedName || !concept.problemItSolves) continue;
    
    const { data: existing } = await supabase
      .from('service_concepts')
      .select('*')
      .ilike('suggested_name', `%${concept.suggestedName.split(' ')[0]}%`)
      .maybeSingle();
    
    if (!existing) {
      await supabase
        .from('service_concepts')
        .insert({
          suggested_name: concept.suggestedName,
          suggested_category: concept.category,
          problem_it_solves: concept.problemItSolves,
          suggested_deliverables: concept.suggestedDeliverables || [],
          suggested_pricing: concept.suggestedPricing,
          first_client_id: clientId,
          first_engagement_id: engagementId,
          client_ids: [clientId],
          market_size_estimate: concept.marketSize || 'moderate',
          triggered_by: concept.triggeredBy,
          source_type: 'discovery',
          review_status: 'pending'
        });
      console.log(`[Discovery Pass 3] Created new concept from dedicated array: ${concept.suggestedName}`);
    }
  }
  
  console.log(`[Discovery Pass 3] Storage complete`);
}
