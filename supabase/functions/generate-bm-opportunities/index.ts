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

// Model configuration - Sonnet 4.5 for speed (Opus timed out at 150s edge limit)
const MODEL_CONFIG = {
  model: 'anthropic/claude-sonnet-4-5-20250929',
  max_tokens: 8000,
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
    
    console.log(`[Pass 3] LLM identified ${analysis.opportunities?.length || 0} RAW opportunities in ${analysisTime}ms`);
    
    // 4a. POST-PROCESSING: Consolidate and sanitize opportunities
    // Revenue is stored as _enriched_revenue in pass1_data (not nested)
    const revenue = clientData.pass1Data?._enriched_revenue || 
                    clientData.pass1Data?.enrichedData?.revenue || 
                    clientData.pass1Data?.revenue || 
                    clientData.assessment?._enriched_revenue || 0;
    
    console.log(`[Pass 3] Revenue extraction: _enriched_revenue=${clientData.pass1Data?._enriched_revenue}, fallback=${revenue}`);
    
    // Pass full clientData for context-aware filtering, plus services for pinned lookup
    analysis = postProcessOpportunities(analysis, revenue, clientData, services);
    
    console.log(`[Pass 3] After consolidation: ${analysis.opportunities?.length || 0} opportunities (revenue: £${(revenue/1000000).toFixed(1)}M)`);
    console.log(`[Pass 3] Priorities: ${analysis.opportunities?.filter(o => o.priority === 'must_address_now').length || 0} must address, ${analysis.opportunities?.filter(o => o.priority === 'next_12_months').length || 0} next 12m, ${analysis.opportunities?.filter(o => o.priority === 'when_ready').length || 0} when ready`);

    // 5. Store results
    await storeOpportunities(supabase, engagementId, clientData.clientId, analysis);
    
    // 5b. Generate AUTHORITATIVE recommended services
    // This is the SINGLE SOURCE OF TRUTH - frontend should ONLY display these
    const activeServiceCodes = ['BENCHMARKING_DEEP_DIVE']; // They have benchmarking
    const recommendedServices = generateRecommendedServices(
      analysis.opportunities || [],
      services || [],
      analysis.blockedServices || [],
      clientData.clientPreferences,
      activeServiceCodes,
      clientData  // NEW: for value analysis access
    );
    
    console.log(`[Pass 3] Generated ${recommendedServices.length} authoritative service recommendations`);
    console.log(`[Pass 3] Recommended: ${recommendedServices.map(r => r.code).join(', ')}`);
    console.log(`[Pass 3] Blocked: ${(analysis.blockedServices || []).map((b: any) => b.serviceCode).join(', ')}`);
    
    // 6. Update report with assessment (including blocked services, preferences, and AUTHORITATIVE recommendations)
    await supabase
      .from('bm_reports')
      .update({
        opportunity_assessment: analysis.overallAssessment,
        scenario_suggestions: analysis.scenarioSuggestions,
        opportunities_generated_at: new Date().toISOString(),
        not_recommended_services: analysis.blockedServices || [],
        client_direction_at_generation: clientData.directionContext.businessDirection,
        // NEW: Context intelligence columns
        client_preferences: clientData.clientPreferences,
        recommended_services: recommendedServices,  // AUTHORITATIVE - frontend reads this ONLY
        active_service_codes: activeServiceCodes,
        // NEW: Advisor service selections (for record-keeping)
        pinned_services: clientData.pinnedServices || [],
        blocked_services_manual: clientData.manuallyBlockedServices || [],
      })
      .eq('engagement_id', engagementId);
    
    // 6b. SYNC VALUE ANALYSIS with CRITICAL opportunities
    // The value bridge should reflect the same issues shown in the Opps tab
    await syncValueAnalysisWithOpportunities(
      supabase,
      engagementId,
      analysis.opportunities || [],
      clientData.pass1Data,
      clientData.hva,
      clientData.clientPreferences  // Pass context preferences for context-aware remediation
    );
    
    // 6c. NOTE: total_annual_opportunity is set by Pass 1 and represents the annual margin gap
    // We do NOT overwrite it here. Pass 1's calculation is correct and rigorous.
    // The full opportunity value (including one-time items, risk mitigation, etc.) is stored
    // in opportunity_assessment.totalOpportunityValue for internal use, but total_annual_opportunity
    // should only reflect genuine annual recurring opportunities (the margin gap).
    
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

// ============================================================================
// CONTEXT NOTE TYPES - For intelligent service filtering
// ============================================================================

interface ContextNote {
  id: string;
  note_type: string;
  content: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  include_in_analysis: boolean;
}

interface ClientPreferences {
  prefersExternalSupport: boolean;
  prefersProjectBasis: boolean;
  avoidsInternalHires: boolean;
  needsDocumentation: boolean;
  needsSystemsAudit: boolean;
  hasSuccessionConcerns: boolean;
  explicitServiceBlocks: string[];
  suggestedServices: string[];
  rawNotes: string[];  // For LLM context
}

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
  // NEW: Context notes from advisor conversations
  contextNotes: ContextNote[];
  // NEW: Parsed preferences from context notes
  clientPreferences: ClientPreferences;
  // NEW: Advisor service selections
  pinnedServices: string[];
  manuallyBlockedServices: string[];
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

// ============================================================================
// CONTEXT NOTE PARSER - Extract preferences from advisor conversation notes
// ============================================================================

function extractClientPreferences(contextNotes: ContextNote[]): ClientPreferences {
  // Combine all note content for pattern matching
  const allContent = contextNotes
    .filter(n => n.include_in_analysis)
    .map(n => n.content.toLowerCase())
    .join(' ');
  
  // Extract raw notes for LLM context (preserve original casing)
  const rawNotes = contextNotes
    .filter(n => n.include_in_analysis)
    .map(n => n.content);
  
  return {
    // Detect preference for external/project-based support over internal roles
    prefersExternalSupport: 
      allContent.includes('external support') ||
      allContent.includes('external additional support') ||
      allContent.includes('outside support') ||
      allContent.includes('external advice') ||
      allContent.includes('consultancy support'),
    
    prefersProjectBasis:
      allContent.includes('project basis') ||
      allContent.includes('project-based') ||
      allContent.includes('ad-hoc') ||
      allContent.includes('ad hoc') ||
      allContent.includes('specific projects') ||
      allContent.includes('discrete projects'),
    
    avoidsInternalHires:
      allContent.includes('not internal') ||
      allContent.includes('rather than internal') ||
      allContent.includes('rather than attempting to insert') ||
      allContent.includes('not insert') ||
      allContent.includes('don\'t want to hire') ||
      allContent.includes('avoid hiring') ||
      allContent.includes('not looking to employ'),
    
    // Detect documentation/systems needs
    needsDocumentation:
      allContent.includes('documentation') ||
      allContent.includes('undocumented') ||
      allContent.includes('in heads') ||
      allContent.includes('in their heads') ||
      allContent.includes('processes are in place without') ||
      allContent.includes('not written down') ||
      allContent.includes('tribal knowledge'),
    
    needsSystemsAudit:
      allContent.includes('loose structure') ||
      allContent.includes('loose leadership') ||
      allContent.includes('loosely structured') ||
      (allContent.includes('founder depend') && allContent.includes('process')) ||
      (allContent.includes('central') && allContent.includes('leadership')) ||
      allContent.includes('single point of failure'),
    
    hasSuccessionConcerns:
      allContent.includes('succession') ||
      allContent.includes('exit in') ||
      allContent.includes('sell the business') ||
      allContent.includes('step back') ||
      allContent.includes('3 to 5 year') ||
      allContent.includes('3-5 year') ||
      allContent.includes('2029') ||
      allContent.includes('2030') ||
      allContent.includes('retire'),
    
    // Explicit blocks (can be expanded - look for "not", "don't want", etc.)
    explicitServiceBlocks: extractExplicitBlocks(allContent),
    
    // Suggested services based on context patterns
    suggestedServices: extractSuggestedServices(allContent),
    
    rawNotes,
  };
}

function extractExplicitBlocks(content: string): string[] {
  const blocks: string[] = [];
  
  // Pattern: "don't need/want [service]"
  if (content.includes('don\'t need a cfo') || content.includes('don\'t want a cfo')) {
    blocks.push('FRACTIONAL_CFO');
  }
  if (content.includes('don\'t need a coo') || content.includes('don\'t want a coo') || 
      content.includes('don\'t need operations') || content.includes('don\'t want operations')) {
    blocks.push('FRACTIONAL_COO');
  }
  if (content.includes('not interested in exit') || content.includes('don\'t want exit')) {
    blocks.push('EXIT_READINESS');
  }
  
  return blocks;
}

function extractSuggestedServices(content: string): string[] {
  const suggestions: string[] = [];
  
  // Patterns that suggest specific services
  if (content.includes('systems audit') || content.includes('process audit') || 
      content.includes('review their systems') || content.includes('document processes')) {
    suggestions.push('SYSTEMS_AUDIT');
  }
  if (content.includes('succession plan') || content.includes('leadership transition')) {
    suggestions.push('SUCCESSION_PLANNING');
  }
  if (content.includes('board') || content.includes('governance') || content.includes('ned')) {
    suggestions.push('BOARD_ADVISORY');
  }
  
  return suggestions;
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

  // ============================================================================
  // FETCH CONTEXT NOTES - Critical for intelligent service filtering
  // ============================================================================
  let contextNotes: ContextNote[] = [];
  try {
    const { data: notesData, error: notesError } = await supabase
      .from('client_context_notes')
      .select('*')
      .eq('client_id', clientId)
      .eq('include_in_analysis', true)
      .order('importance', { ascending: false });
    
    if (notesError) {
      console.log('[Pass 3] Error fetching context notes:', notesError.message);
    } else if (notesData && notesData.length > 0) {
      contextNotes = notesData;
      console.log('[Pass 3] 📝 Found context notes:', {
        count: notesData.length,
        types: [...new Set(notesData.map((n: any) => n.note_type))],
        importanceLevels: notesData.map((n: any) => n.importance),
      });
    } else {
      console.log('[Pass 3] No context notes found for client');
    }
  } catch (err) {
    console.log('[Pass 3] Could not fetch context notes:', err);
  }

  // Parse preferences from context notes
  const clientPreferences = extractClientPreferences(contextNotes);
  
  if (contextNotes.length > 0) {
    console.log('[Pass 3] 🎯 Extracted client preferences:', {
      prefersExternalSupport: clientPreferences.prefersExternalSupport,
      prefersProjectBasis: clientPreferences.prefersProjectBasis,
      avoidsInternalHires: clientPreferences.avoidsInternalHires,
      needsSystemsAudit: clientPreferences.needsSystemsAudit,
      explicitBlocks: clientPreferences.explicitServiceBlocks,
      suggestedServices: clientPreferences.suggestedServices,
    });
  }

  // ============================================================================
  // FETCH ADVISOR SERVICE SELECTIONS (Pinned / Blocked)
  // ============================================================================
  let pinnedServices: string[] = [];
  let manuallyBlockedServices: string[] = [];
  
  try {
    const { data: serviceSelections, error: selectionsError } = await supabase
      .from('bm_engagement_services')
      .select('service_code, selection_type, reason')
      .eq('engagement_id', engagementId);
    
    if (selectionsError) {
      console.log('[Pass 3] Error fetching service selections:', selectionsError.message);
    } else if (serviceSelections && serviceSelections.length > 0) {
      pinnedServices = serviceSelections
        .filter((s: any) => s.selection_type === 'pinned')
        .map((s: any) => s.service_code);
      
      manuallyBlockedServices = serviceSelections
        .filter((s: any) => s.selection_type === 'blocked')
        .map((s: any) => s.service_code);
      
      console.log('[Pass 3] 📌 Advisor service selections:', {
        pinned: pinnedServices,
        blocked: manuallyBlockedServices,
      });
    }
  } catch (err) {
    console.log('[Pass 3] Could not fetch service selections:', err);
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
    // NEW: Context notes and parsed preferences
    contextNotes,
    clientPreferences,
    // NEW: Advisor service selections
    pinnedServices,
    manuallyBlockedServices,
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s safety

  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[Pass 3] LLM call timed out after 120s');
      throw new Error('LLM timeout - try regenerating');
    }
    throw err;
  }
  clearTimeout(timeoutId);

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
    const parsed = JSON.parse(jsonStr);
    
    // CRITICAL: Sanitise any leaked internal notes from client-facing content
    return sanitiseInternalNotes(parsed);
  } catch (e) {
    console.error('[Pass 3] Failed to parse LLM response:', content.substring(0, 1000));
    throw new Error('Invalid JSON response from LLM');
  }
}

// ============================================================================
// SANITISER: Remove any leaked internal notes from client-facing content
// ============================================================================

function sanitiseInternalNotes(data: any): any {
  // Patterns that indicate internal notes/observations have leaked into client content
  const leakPatterns = [
    // Explicit note references
    /Discovery notes[:\s]*['""']/gi,
    /Context notes[:\s]*['""']/gi,
    /Discovery notes (indicate|confirm|mention|suggest|show)/gi,
    /Context notes (indicate|confirm|mention|suggest|show)/gi,
    /From (discovery|context) notes:/gi,
    /According to (discovery|context) notes/gi,
    /Advisor notes (indicate|confirm|mention)/gi,
    /\bcontext notes\b/gi,
    /\bdiscovery notes\b/gi,
    /\badvisor notes\b/gi,
    // Paraphrased internal observations - these should NOT be in client content
    /leadership structure.*loose/gi,
    /described as ['""']?loose['""']?/gi,
    /No CFO\/COO in place/gi,
    /unique methodology identified/gi,
    /methodology identified:/gi,
    /rare in sector/gi,
    /cradle to grave/gi,
    /institutional knowledge.*not documented/gi,
    /succession plan for founder/gi,
    /client prefers ['""'][^'""]*['""']/gi,
    /team advocacy at \d+%/gi,
    /informal structure/gi,
    /processes exist but oversight/gi,
    /oversight flows through founder/gi,
  ];
  
  // Function to clean a string
  const cleanString = (str: string): string => {
    if (!str || typeof str !== 'string') return str;
    
    let cleaned = str;
    let leaked = false;
    
    for (const pattern of leakPatterns) {
      if (pattern.test(cleaned)) {
        leaked = true;
        // Remove the entire sentence containing the leak
        cleaned = cleaned.replace(new RegExp(`[^.]*${pattern.source}[^.]*\\.?`, 'gi'), '');
      }
    }
    
    if (leaked) {
      console.warn('[Pass 3] ⚠️ Sanitised leaked internal notes from client content');
    }
    
    // Clean up any double spaces or leading/trailing issues
    return cleaned.replace(/\s{2,}/g, ' ').trim();
  };
  
  // Recursively clean all string fields
  const cleanObject = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj === 'string') return cleanString(obj);
    if (Array.isArray(obj)) return obj.map(cleanObject);
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = cleanObject(value);
      }
      return cleaned;
    }
    return obj;
  };
  
  return cleanObject(data);
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

## CRITICAL: CONTEXT NOTES ARE INTERNAL ONLY

You will receive "Advisor Context Notes" - these are INTERNAL notes from conversations between the advisor and the client. 

**NEVER quote these notes directly in client-facing content.** 

These notes are for YOUR understanding of the client's situation. Use them to inform your analysis and prioritisation, but:
- Do NOT write "Discovery notes indicate..." or "Context notes confirm..."
- Do NOT put quotes from these notes in whyThisMatters, talking points, or recommendations
- Do NOT reference "conversations with" or "discussions about"
- The client must not see these internal notes reflected back to them

Instead, translate the insights into YOUR professional assessment. If the notes say "leadership structure is loose", you write "there's an opportunity to formalise leadership structure" - NOT "Context notes indicate leadership structure is loose."

## JSON OUTPUT FORMAT

Respond with valid JSON only. No markdown code blocks, no explanations outside the JSON structure.`;
}

// ============================================================================
// USER PROMPT FOR OPPORTUNITY ANALYSIS (Sonnet 4.5 - compact for speed)
// ============================================================================

function buildUserPrompt(clientData: ClientData, services: any[], existingConcepts: any[]): string {
  const { clientName, industryCode, pass1Data, pass2Narratives, assessment, hva, metrics, founderRisk, supplementary, contextNotes, clientPreferences } = clientData;
  
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

  // Build metrics text - only gaps (<50th) and strengths (>=75th) to reduce tokens
  const metricsText = (metrics || [])
    .filter((m: any) => m.percentile !== null && m.percentile !== undefined && m.client_value !== null &&
      (m.percentile < 50 || m.percentile >= 75))
    .map((m: any) => {
      const percentile = m.percentile;
      const position = percentile < 25 ? 'bottom quartile' :
                       percentile < 50 ? 'below median' :
                       percentile < 75 ? 'above median' : 'top quartile';
      const gapText = m.annual_impact ? ` (£${Math.abs(m.annual_impact).toLocaleString()} annual gap)` : '';
      return `- ${m.metric_name || m.metricName}: ${m.client_value || m.clientValue} - ${percentile}th percentile (${position})${gapText}`;
    })
    .join('\n') || 'Benchmark data not available';

  // Compact services text (saves ~2-3K tokens)
  const servicesText = services
    .filter((s: any) => s.status === 'active')
    .map((s: any) => {
      const priceStr = s.price_from != null && s.price_to != null
        ? `£${s.price_from.toLocaleString()}-£${s.price_to.toLocaleString()}`
        : s.price_from != null ? `£${s.price_from.toLocaleString()}` : '?';
      const deliverables = Array.isArray(s.deliverables) ? s.deliverables.slice(0, 3).join(', ') : '';
      return `- **${s.code}**: ${s.name} (${s.category || 'governance'}) — ${s.headline || s.description || ''}\n  ${priceStr} ${s.price_unit || ''} | ${deliverables ? `Deliverables: ${deliverables}` : ''}`;
    })
    .join('\n');

  // Financial trends
  const trendsText = (pass1Data?.financialTrends || [])
    .map((t: any) => `- ${t.metric}: ${t.direction}${t.isRecovering ? ' (recovering from trough)' : ''}`)
    .join('\n') || 'Trend data not available';

  // Format helpers
  const formatNum = (n: number) => n ? n.toLocaleString() : '0';
  const formatPct = (n: number) => n ? n.toFixed(1) : '0';

  // Multi-year context (new)
  const myp = pass1Data?.multi_year_profile;
  const revenueContext = myp 
    ? `${revenueGrowth > 0 ? '+' : ''}${formatPct(revenueGrowth)}% YoY | ${myp.revenue.cagr !== null ? `${myp.yearsAvailable}yr CAGR: ${myp.revenue.cagr.toFixed(1)}%` : ''} | Trajectory: ${myp.revenue.trajectory}`
    : `${revenueGrowth > 0 ? '+' : ''}${formatPct(revenueGrowth)}% YoY`;

  return `## THE CLIENT

**${clientName}**
Industry: ${industryCode || 'Not classified'}

## FINANCIAL PICTURE

| Metric | Value | Context |
|--------|-------|---------|
| Revenue | £${formatNum(revenue)} | ${revenueContext} |
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
${myp ? `
## MULTI-YEAR TRAJECTORY (${myp.yearsAvailable} years)

Revenue: ${myp.revenue.yearByYear.map((r: any) => `FY${r.year}: £${(r.revenue/1e6).toFixed(1)}M`).join(' → ')}
Trajectory: ${myp.revenue.trajectory.toUpperCase()}
${myp.revenue.cagr !== null ? `CAGR: ${myp.revenue.cagr.toFixed(1)}%` : ''}
${myp.revenue.totalGrowth !== null ? `Total growth: ${myp.revenue.totalGrowth.toFixed(0)}%` : ''}
${myp.patterns.revenueRetracement ? '⚠️ Revenue retracement from peak - NOT structural decline. Do NOT recommend investigating revenue decline.' : ''}
${myp.patterns.postInvestmentRecovery ? '⚠️ Post-investment margin recovery underway.' : ''}

${myp.summaryNarrative}
` : ''}

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

${contextNotes && contextNotes.length > 0 ? `
---

## 📋 CLIENT PREFERENCES (from advisor conversations - DO NOT REFERENCE IN OUTPUT)

**These preferences have been extracted from internal conversations. Use them to shape recommendations, but NEVER mention them in client-facing content. Do not describe HOW you know these preferences.**

### WORKING STYLE PREFERENCES:
${clientPreferences?.prefersExternalSupport ? '- Prefers external support over internal hires' : ''}
${clientPreferences?.prefersProjectBasis ? '- Prefers project-based engagement over ongoing roles' : ''}
${clientPreferences?.avoidsInternalHires ? '- Avoids internal/fractional roles' : ''}

### IDENTIFIED NEEDS:
${clientPreferences?.needsDocumentation ? '- Documentation/process work needed' : ''}
${clientPreferences?.needsSystemsAudit ? '- Systems audit appropriate' : ''}
${clientPreferences?.hasSuccessionConcerns ? '- Exit/succession timeline is a factor' : ''}

### RULES FOR YOUR OUTPUT:
- DO NOT recommend Fractional COO or CFO if they prefer external support
- DO NOT mention "leadership structure", "loose structure", or similar phrases from notes
- DO NOT quote anything the client said in conversations
- DO NOT reference "methodology" or "unique approaches" from notes
- ONLY use observable data (financials, metrics, HVA scores) in your reasoning
- Keep whyThisMatters focused on NUMBERS and BENCHMARKS, not qualitative observations
` : ''}

---

## OUR SERVICE CATALOGUE

${servicesText}

## SERVICE CONCEPTS ALREADY IN PIPELINE

${existingConcepts.length > 0
  ? existingConcepts.map((c: any) => c.suggested_name).join(', ')
  : 'None'}

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
// SERVICE FILTERING RULES - Now Context-Aware!
// ============================================================================

interface EnhancedBlockRule {
  serviceCode: string;
  blockIf: (ctx: DirectionContext, prefs: ClientPreferences) => boolean;
  blockReason: (ctx: DirectionContext, prefs: ClientPreferences) => string;
}

const ENHANCED_BLOCK_RULES: EnhancedBlockRule[] = [
  // ============================================================================
  // FRACTIONAL COO - Block if they have one OR prefer external support
  // ============================================================================
  {
    serviceCode: 'FRACTIONAL_COO',
    blockIf: (ctx, prefs) => 
      ctx.hasCOO || 
      prefs.prefersExternalSupport || 
      prefs.prefersProjectBasis || 
      prefs.avoidsInternalHires ||
      prefs.explicitServiceBlocks.includes('FRACTIONAL_COO'),
    blockReason: (ctx, prefs) => {
      if (ctx.hasCOO) return 'Client already has an Operations Director. Consider operational excellence programme instead.';
      if (prefs.avoidsInternalHires) return 'Context notes indicate client avoids internal hires. Consider project-based consultancy instead.';
      if (prefs.prefersExternalSupport) return 'Context notes indicate preference for external support over internal roles. Consider Systems Audit or Strategic Advisory.';
      if (prefs.prefersProjectBasis) return 'Client prefers project-based support. Consider Systems Audit or Process Documentation project instead.';
      return 'Not suitable based on client context.';
    },
  },
  
  // ============================================================================
  // FRACTIONAL CFO - Block if they have one OR prefer external support
  // ============================================================================
  {
    serviceCode: 'FRACTIONAL_CFO',
    blockIf: (ctx, prefs) => 
      ctx.hasCFO || 
      prefs.prefersExternalSupport || 
      prefs.avoidsInternalHires ||
      prefs.explicitServiceBlocks.includes('FRACTIONAL_CFO'),
    blockReason: (ctx, prefs) => {
      if (ctx.hasCFO) return 'Client already has a Finance Director. Consider CFO support services instead.';
      if (prefs.avoidsInternalHires || prefs.prefersExternalSupport) return 'Context notes indicate preference for external support. Consider Financial Health Check or project-based finance review.';
      return 'Not suitable based on client context.';
    },
  },
  
  // ============================================================================
  // EXIT READINESS - Block only for aggressive growth (allow for step-back!)
  // ============================================================================
  {
    serviceCode: 'EXIT_READINESS',
    blockIf: (ctx, prefs) => 
      ctx.businessDirection === 'grow_aggressive' || 
      ctx.businessDirection === 'Grow aggressively - acquisitions, new markets, scale significantly' ||
      prefs.explicitServiceBlocks.includes('EXIT_READINESS'),
    blockReason: () => 'Client focused on aggressive growth, not exit. Focus on growth enablement.',
  },
  
  // ============================================================================
  // GROWTH ACCELERATOR - Block for step-back focus
  // ============================================================================
  {
    serviceCode: 'GROWTH_ACCELERATOR',
    blockIf: (ctx, prefs) => 
      ctx.businessDirection === 'step_back' || 
      ctx.businessDirection === 'Step back - reduce my involvement, more lifestyle-focused' ||
      prefs.hasSuccessionConcerns,  // If exit is on the table, growth acceleration isn't priority
    blockReason: (ctx, prefs) => {
      if (prefs.hasSuccessionConcerns) return 'Context notes suggest succession/exit concerns. Focus on exit readiness first.';
      return 'Client wants to step back, not grow aggressively.';
    },
  },
  
  // ============================================================================
  // NED PLACEMENT - Block if they already have NEDs
  // ============================================================================
  {
    serviceCode: 'NED_PLACEMENT',
    blockIf: (ctx) => ctx.hasNED,
    blockReason: () => 'Client already has Non-executive Director(s). Consider board effectiveness review instead.',
  },
];

function filterBlockedServices(
  opportunities: any[],
  context: DirectionContext,
  preferences: ClientPreferences,  // Accept preferences
  manuallyBlockedServices: string[] = []  // NEW: Manually blocked by advisor
): { allowed: any[]; blocked: { serviceCode: string; reason: string }[] } {
  const blocked: { serviceCode: string; reason: string }[] = [];
  
  const allowed = opportunities.filter(opp => {
    const serviceCode = opp.serviceMapping?.existingService?.code;
    if (!serviceCode) return true;
    
    // NEW: Check if manually blocked by advisor (highest priority)
    if (manuallyBlockedServices.some((b: string) => b.toUpperCase() === (serviceCode || '').toUpperCase())) {
      blocked.push({
        serviceCode,
        reason: 'Manually blocked by advisor',
      });
      console.log(`[Pass 3] ❌ ADVISOR BLOCKED: ${serviceCode}`);
      return false;
    }
    
    // Check enhanced rules that use both context AND preferences
    const matchingRules = ENHANCED_BLOCK_RULES.filter(r =>
      (r.serviceCode || '').toUpperCase() === (serviceCode || '').toUpperCase() && r.blockIf(context, preferences)
    );
    
    if (matchingRules.length > 0) {
      blocked.push({
        serviceCode,
        reason: matchingRules[0].blockReason(context, preferences),
      });
      console.log(`[Pass 3] ❌ BLOCKED: ${serviceCode} - ${matchingRules[0].blockReason(context, preferences)}`);
      return false;
    }
    
    return true;
  });
  
  if (blocked.length > 0) {
    console.log('[Pass 3] Blocked services summary:', blocked.map(b => b.serviceCode));
  }
  
  return { allowed, blocked };
}

// ============================================================================
// CONTEXT-DRIVEN SUGGESTIONS - Add opportunities based on advisor insights
// ============================================================================

interface ContextSuggestion {
  title: string;
  description: string;
  serviceCode: string;
  severity: 'high' | 'medium';
  priority: 'must_address_now' | 'next_12_months';
  reason: string;
  financialImpact?: { amount: number; type: string; basis: string };
}

function getContextDrivenSuggestions(
  prefs: ClientPreferences,
  ctx: DirectionContext,
  existingOpportunities: any[],
  clientData: ClientData
): ContextSuggestion[] {
  const suggestions: ContextSuggestion[] = [];
  
  // Helper to check if opportunity already exists
  const hasOpportunity = (keywords: string[]): boolean => {
    return existingOpportunities.some(o => {
      const title = (o.title || '').toLowerCase();
      const code = o.serviceMapping?.existingService?.code || '';
      return keywords.some(k => title.includes(k.toLowerCase()) || code.includes(k));
    });
  };
  
  // ============================================================================
  // 1. Systems Audit - When documentation needs or loose structure detected
  // ============================================================================
  if ((prefs.needsDocumentation || prefs.needsSystemsAudit) && 
      !hasOpportunity(['systems audit', 'process documentation', 'SYSTEMS_AUDIT', 'documentation'])) {
    
    const revenue = clientData.pass1Data?._enriched_revenue || 0;
    // Systems audit typically saves 2-5% efficiency gains
    const potentialSavings = revenue * 0.02;
    
    suggestions.push({
      title: 'Systems & Process Audit',
      description: 'Context notes indicate loose structure and potential documentation gaps. A systems audit would identify what processes exist vs what\'s in heads, creating a roadmap for systemisation.',
      serviceCode: 'systems_audit',
      severity: prefs.hasSuccessionConcerns ? 'high' : 'medium',
      priority: prefs.hasSuccessionConcerns ? 'must_address_now' : 'next_12_months',
      reason: 'Identified from advisor context notes: loose leadership structure and founder dependency suggest undocumented processes.',
      financialImpact: potentialSavings > 0 ? {
        amount: Math.round(potentialSavings),
        type: 'efficiency_gain',
        basis: 'Estimated 2% efficiency improvement from systemised processes',
      } : undefined,
    });
    
    console.log('[Pass 3] ✅ SUGGESTED: Systems Audit based on context notes (loose structure/documentation needs)');
  }
  
  // ============================================================================
  // 2. Exit Readiness - When succession concerns and not already suggested
  // ============================================================================
  if (prefs.hasSuccessionConcerns && 
      ctx.businessDirection !== 'grow_aggressive' &&
      !hasOpportunity(['exit readiness', 'EXIT_READINESS', 'succession plan', 'exit prep'])) {
    
    suggestions.push({
      title: 'Exit Readiness Programme',
      description: 'Context notes mention timeline for stepping back/exit. Proactive exit planning maximises value and creates options.',
      serviceCode: 'exit_readiness',
      severity: 'high',
      priority: 'next_12_months',
      reason: 'Identified from advisor context notes: mentions of exit timeline, succession, or stepping back.',
    });
    
    console.log('[Pass 3] ✅ SUGGESTED: Exit Readiness based on context notes (succession concerns)');
  }
  
  // ============================================================================
  // 3. Strategic Advisory - When they prefer project-based external support
  // ============================================================================
  if ((prefs.prefersProjectBasis || prefs.prefersExternalSupport) && 
      !prefs.avoidsInternalHires &&
      !hasOpportunity(['strategic advisory', 'STRATEGIC_ADVISORY', 'strategic support'])) {
    
    suggestions.push({
      title: 'Strategic Advisory (Project-Based)',
      description: 'Context notes indicate preference for external, project-based support. Strategic advisory offers flexible engagement without permanent headcount.',
      serviceCode: 'strategic_advisory',
      severity: 'medium',
      priority: 'when_ready',
      reason: 'Identified from advisor context notes: preference for external support on project basis.',
    });
    
    console.log('[Pass 3] ✅ SUGGESTED: Strategic Advisory based on context notes (project-basis preference)');
  }
  
  return suggestions;
}

// Convert context suggestions to opportunity format
function contextSuggestionsToOpportunities(suggestions: ContextSuggestion[]): any[] {
  return suggestions.map((s, idx) => ({
    id: `ctx-suggestion-${idx + 1}`,
    title: s.title,
    description: s.description,
    severity: s.severity,
    priority: s.priority,
    category: 'operational_efficiency',
    financialImpact: s.financialImpact || null,
    serviceMapping: {
      matchConfidence: 'high',
      existingService: {
        code: s.serviceCode,
        name: s.title,
        fit: 'strong',
      },
      newConceptNeeded: null,
    },
    adviserTools: {
      talkingPoint: `Based on our conversations, a ${s.title} would help address ${s.reason.toLowerCase()}`,
      questionToAsk: 'Would you be open to exploring this as a discrete project?',
      quickWin: 'We can scope this out in an initial conversation.',
    },
    _contextDriven: true,  // Flag for tracking
    _contextReason: s.reason,
  }));
}

// ============================================================================
// AUTHORITATIVE RECOMMENDED SERVICES GENERATOR
// This is the SINGLE SOURCE OF TRUTH for service recommendations
// Frontend should ONLY display these - no independent calculation
// ============================================================================

interface AddressedIssue {
  issueTitle: string;
  valueAtStake: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
}

interface RecommendedService {
  // Core identification
  serviceCode: string;
  serviceName: string;
  description: string;
  headline?: string;
  // Pricing
  priceFrom?: number;
  priceTo?: number;
  priceUnit?: string;
  priceRange?: string;
  category?: string;
  // Personalised content for client report
  whyThisMatters: string;
  whatYouGet: string[];
  expectedOutcome: string;
  timeToValue: string;
  // Connection to client issues
  addressesIssues: AddressedIssue[];
  totalValueAtStake?: number;
  // Source and priority
  source: 'pinned' | 'opportunity' | 'context_suggested';
  priority: 'primary' | 'secondary';
  // Context
  contextReason?: string;
  alternativeTo?: string;
  // Legacy fields for backwards compatibility
  code?: string;
  name?: string;
  timeframe?: string;
  howItHelps?: string;
}

/**
 * Generate AUTHORITATIVE recommended services for the client report
 * 
 * This builds the data that powers the "How We Can Help" section.
 * Format matches what RecommendedServicesSection.tsx expects.
 * 
 * Priority logic:
 * - Pinned services = always primary
 * - Critical/high severity opportunities = primary
 * - Medium/low = secondary
 */
function generateRecommendedServices(
  opportunities: any[],
  services: any[],
  blockedServices: { serviceCode: string; reason: string }[],
  clientPreferences: ClientPreferences,
  activeServiceCodes: string[],
  clientData?: ClientData  // NEW: for value analysis access
): RecommendedService[] {
  const blockedCodes = blockedServices.map(b => b.serviceCode);
  
  // Group opportunities by service code
  const serviceOpportunityMap = new Map<string, any[]>();
  
  for (const opp of opportunities) {
    let serviceCode = opp.serviceMapping?.existingService?.code ||
                     opp.service?.code ||
                     (opp.opportunity_code?.startsWith('pinned-') ? opp.opportunity_code.replace('pinned-', '') : null);

    if (!serviceCode) continue;

    serviceCode = serviceCode.toUpperCase();

    if (blockedCodes.some((c: string) => c.toUpperCase() === serviceCode)) continue;
    if (activeServiceCodes.some((c: string) => c.toUpperCase() === serviceCode)) continue;
    
    const existing = serviceOpportunityMap.get(serviceCode) || [];
    existing.push(opp);
    serviceOpportunityMap.set(serviceCode, existing);
  }
  
  // Remap blocked service opportunities to alternative services
  // This ensures founder dependency maps to SYSTEMS_AUDIT when COO is blocked
  for (const opp of opportunities) {
    const code = opp.serviceMapping?.existingService?.code || opp.service?.code;
    // If this opportunity mapped to a blocked service, try to reassign
    if (code && blockedCodes.some((bc: string) => bc.toUpperCase() === code.toUpperCase())) {
      // Founder-related opportunities should map to SYSTEMS_AUDIT
      // Broadened to catch ALL LLM title variations
      const titleLower = (opp.title || '').toLowerCase();
      const codeLower = (opp.code || opp.opportunity_code || '').toLowerCase();
      const isFounderRelated = titleLower.includes('founder') ||
                               titleLower.includes('knowledge') ||
                               titleLower.includes('dependency') ||
                               titleLower.includes('methodology') ||
                               titleLower.includes('cradle') ||
                               titleLower.includes('key person') ||
                               titleLower.includes('key man') ||
                               titleLower.includes('owner depend') ||
                               titleLower.includes('owner risk') ||
                               titleLower.includes('documentation') ||
                               (titleLower.includes('process') && titleLower.includes('undocument')) ||
                               titleLower.includes('systemis') || // systemise, systemisation
                               titleLower.includes('single point') ||
                               titleLower.includes('bus factor') ||
                               codeLower.includes('founder') ||
                               codeLower.includes('key_person') ||
                               (opp.severity === 'critical' && 
                                opp.serviceMapping?.existingService?.code === 'FRACTIONAL_COO');
                               // Any CRITICAL opp that was going to COO should remap to audit
      
      if (isFounderRelated && !blockedCodes.some((bc: string) => bc.toUpperCase() === 'SYSTEMS_AUDIT') && !activeServiceCodes.some((ac: string) => ac.toUpperCase() === 'SYSTEMS_AUDIT')) {
        const existing = serviceOpportunityMap.get('SYSTEMS_AUDIT') || [];
        // Only add if not already mapped here
        if (!existing.some((e: any) => e.code === opp.code || e.title === opp.title)) {
          existing.push(opp);
          serviceOpportunityMap.set('SYSTEMS_AUDIT', existing);
          console.log(`[RecommendedServices] Remapped blocked ${code} → SYSTEMS_AUDIT for "${opp.title}"`);
        }
      }
    }
  }
  
  const recommendations: RecommendedService[] = [];
  
  // Build recommendations from grouped opportunities (use Array.from for ES5 compatibility)
  const serviceEntries = Array.from(serviceOpportunityMap.entries());
  for (const [serviceCode, opps] of serviceEntries) {
    // Find the service details
    const service = services.find((s: any) => (s.code || '').toUpperCase() === serviceCode.toUpperCase());
    if (!service) {
      console.log(`[RecommendedServices] Service not found: ${serviceCode} (available: ${(services || []).slice(0, 5).map((s: any) => s.code).join(', ')}...)`);
      continue;
    }
    
    // Determine if this is a pinned service (check code, opportunity_code, and explicit flag)
    const isPinned = opps.some((o: any) =>
      o.opportunity_code?.startsWith('pinned-') ||
      o.code?.startsWith('pinned-') ||
      o._pinnedByAdvisor === true
    );
    
    // Get highest severity among opportunities
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const maxSeverity = opps.reduce((max: string, o: any) => {
      return (severityOrder[o.severity] ?? 3) < (severityOrder[max] ?? 3) ? o.severity : max;
    }, 'low');
    
    // Build addressesIssues array with value sanity check
    const addressesIssues: AddressedIssue[] = opps.map((opp: any) => {
      let value = opp.financial_impact_amount || opp.financialImpact?.amount || 0;
      // Fix values that appear to be in thousands (LLM output inconsistency)
      // If value is > 0 but < 10,000, it's likely in thousands
      if (value > 0 && value < 10000) {
        console.warn(`[RecommendedServices] Value appears to be in thousands: £${value} for "${opp.title}" - multiplying by 1000`);
        value = value * 1000;
      }
      return {
        issueTitle: opp.title || 'Issue Identified',
        valueAtStake: value,
        severity: opp.severity || 'medium',
      };
    });
    
    // Calculate total value at stake
    const totalValueAtStake = addressesIssues.reduce((sum: number, i: AddressedIssue) => sum + (i.valueAtStake || 0), 0);
    
    // Build personalised whyThisMatters from opportunity data
    // Combine data evidence, talking points, and value context
    const dataEvidence = opps
      .map((o: any) => o.dataEvidence || o.data_evidence)
      .filter(Boolean)
      .slice(0, 2);
    const talkingPoints = opps
      .map((o: any) => o.talkingPoint || o.talking_point)
      .filter(Boolean)
      .slice(0, 1);
    
    // Format value for display
    const formatValue = (val: number): string => {
      if (val >= 1000000) return `£${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `£${Math.round(val / 1000)}k`;
      return `£${val.toLocaleString()}`;
    };
    
    // Build personalised whyThisMatters
    // Fix: strip trailing periods/spaces from each piece before joining to prevent ".."
    // CRITICAL: Strip ANY content that looks like paraphrased internal observations
    const stripInternalRefs = (text: string): string => {
      if (!text) return text;
      return text
        // Remove explicit "Discovery notes:" patterns
        .replace(/Discovery notes[:\s]*['""'][^'""]*['""']\.?\s*/gi, '')
        .replace(/Context notes[:\s]*['""'][^'""]*['""']\.?\s*/gi, '')
        .replace(/[^.]*Discovery notes (indicate|confirm|mention|suggest|show)[^.]*\.\s*/gi, '')
        .replace(/[^.]*Context notes (indicate|confirm|mention|suggest|show)[^.]*\.\s*/gi, '')
        // Remove paraphrased internal observations
        .replace(/[^.]*leadership structure[^.]*\.\s*/gi, '')
        .replace(/[^.]*described as ['""']?loose['""']?[^.]*\.\s*/gi, '')
        .replace(/[^.]*No CFO\/COO in place[^.]*\.\s*/gi, '')
        .replace(/[^.]*unique methodology[^.]*\.\s*/gi, '')
        .replace(/[^.]*methodology identified[^.]*\.\s*/gi, '')
        .replace(/[^.]*rare in sector[^.]*\.\s*/gi, '')
        .replace(/[^.]*cradle to grave[^.]*\.\s*/gi, '')
        .replace(/[^.]*institutional knowledge[^.]*\.\s*/gi, '')
        .replace(/[^.]*succession plan for founder[^.]*\.\s*/gi, '')
        .replace(/[^.]*client prefers ['""'][^'""]*['""'][^.]*\.\s*/gi, '')
        .replace(/[^.]*team advocacy at \d+%[^.]*\.\s*/gi, '')
        .replace(/[^.]*informal structure[^.]*\.\s*/gi, '')
        .replace(/[^.]*processes exist but[^.]*\.\s*/gi, '')
        .replace(/[^.]*flows through founder[^.]*\.\s*/gi, '')
        .replace(/[^.]*oversight flows through[^.]*\.\s*/gi, '')
        // Remove standalone references
        .replace(/\bDiscovery notes:\s*/gi, '')
        .replace(/\bContext notes:\s*/gi, '')
        .replace(/\bAdvisor notes:\s*/gi, '')
        // Clean up spacing
        .replace(/\s{2,}/g, ' ')
        .trim();
    };
    
    let whyThisMatters = '';
    if (dataEvidence.length > 0) {
      whyThisMatters = dataEvidence
        .map((d: string) => stripInternalRefs(d.replace(/[\.\s]+$/, '')))
        .filter(Boolean)
        .join('. ') + '.';
    }
    if (talkingPoints.length > 0 && whyThisMatters) {
      const cleanTalkingPoint = stripInternalRefs(talkingPoints[0].replace(/[\.\s]+$/, ''));
      if (cleanTalkingPoint) {
        whyThisMatters += ' ' + cleanTalkingPoint + '.';
      }
    } else if (talkingPoints.length > 0) {
      const cleanTalkingPoint = stripInternalRefs(talkingPoints[0].replace(/[\.\s]+$/, ''));
      if (cleanTalkingPoint) {
        whyThisMatters = cleanTalkingPoint + '.';
      }
    }
    if (totalValueAtStake > 0 && whyThisMatters) {
      whyThisMatters += ` This represents ${formatValue(totalValueAtStake)} in value at stake.`;
    } else if (totalValueAtStake > 0) {
      whyThisMatters = `This addresses issues worth ${formatValue(totalValueAtStake)} in potential value.`;
    }
    // Fallback to service description if no personalised content
    if (!whyThisMatters) {
      whyThisMatters = service.description || '';
    }
    // Final sanitisation pass
    whyThisMatters = stripInternalRefs(whyThisMatters);
    
    // Get expected outcome with proper value formatting
    const expectedOutcome = opps.find((o: any) => o.life_impact)?.life_impact ||
                           (totalValueAtStake > 0 
                             ? `Addresses issues worth ${formatValue(totalValueAtStake)} in potential value`
                             : 'Improved operational efficiency and reduced risk');
    
    // Build the recommendation
    recommendations.push({
      serviceCode: service.code,
      serviceName: service.name,
      description: service.description || '',
      headline: service.headline,
      priceFrom: service.price_from,
      priceTo: service.price_to,
      priceUnit: service.price_unit,
      priceRange: formatPriceRange(service),
      category: service.category,
      // Personalised content
      whyThisMatters,
      whatYouGet: service.deliverables || getDefaultDeliverables(service.code),
      expectedOutcome,
      timeToValue: service.typical_duration || '4-6 weeks',
      // Connection to issues
      addressesIssues,
      totalValueAtStake,
      // Source and priority
      source: isPinned ? 'pinned' : 'opportunity',
      priority: isPinned || maxSeverity === 'critical' || maxSeverity === 'high' ? 'primary' : 'secondary',
      // Legacy fields for backwards compatibility
      code: service.code,
      name: service.name,
      timeframe: service.typical_duration || 'Flexible',
      howItHelps: whyThisMatters,
      contextReason: isPinned ? 'Recommended by your advisor' : undefined,
    });
  }
  
  // Add alternatives for blocked services
  for (const blocked of blockedServices) {
    const alternative = getAlternativeService(blocked.serviceCode, clientPreferences, services);
    if (alternative && !recommendations.some(r => r.serviceCode === alternative.serviceCode)) {
      recommendations.push({
        ...alternative,
        source: 'context_suggested',
        priority: 'secondary',
        contextReason: blocked.reason,
        // Legacy
        alternativeTo: blocked.serviceCode,
      });
    }
  }
  
  // Promote services addressing CRITICAL suppressors to primary
  // This ensures Systems Audit (which addresses founder dependency) is primary
  for (const rec of recommendations) {
    if (rec.priority === 'secondary') {
      const hasCriticalIssue = rec.addressesIssues?.some(
        (issue: AddressedIssue) => issue.severity === 'critical'
      );
      if (hasCriticalIssue) {
        console.log(`[RecommendedServices] Promoting ${rec.serviceCode} to primary (addresses CRITICAL issue)`);
        rec.priority = 'primary';
        rec.source = rec.source === 'context_suggested' ? 'opportunity' : rec.source;
      }
    }
  }
  
  // ====================================================================
  // POST-BUILD: Enrich Systems Audit with founder dependency context
  // ====================================================================
  // This runs REGARDLESS of current priority. The content enrichment and
  // priority promotion are independent operations.
  //
  // WHY: The remap may or may not have added the founder opp to the group.
  // If it did, priority is already 'primary' but whyThisMatters still has
  // generic dataEvidence. If it didn't, priority is 'secondary' and needs
  // both promotion AND enrichment. Either way, we need to ensure the
  // founder dependency appears in the content.
  // ====================================================================
  
  const systemsAuditRec = recommendations.find(r => r.serviceCode === 'SYSTEMS_AUDIT');
  if (systemsAuditRec) {
    // Check if founder dependency content is ALREADY in addressesIssues
    const hasFounderInIssues = systemsAuditRec.addressesIssues?.some(
      (i: AddressedIssue) => 
        i.severity === 'critical' && (
          i.issueTitle.toLowerCase().includes('founder') ||
          i.issueTitle.toLowerCase().includes('dependency') ||
          i.issueTitle.toLowerCase().includes('knowledge') ||
          i.issueTitle.toLowerCase().includes('key person')
        )
    );
    
    // Determine if founder dependency exists as a CRITICAL issue for this client.
    // Sources (in priority order):
    // 1. Value analysis suppressors (most reliable - deterministic calculation)
    // 2. LLM-generated opportunities with critical severity + founder keywords
    // 3. Blocked service opportunities (COO blocked = founder dependency exists)
    
    const valueAnalysis = clientData?.pass1Data?.value_analysis || clientData?.valueAnalysis;
    const suppressors = valueAnalysis?.suppressors || valueAnalysis?.valueSupressors || [];
    const founderSuppressor = suppressors.find((s: any) => {
      const code = (s.code || s.name || '').toLowerCase();
      return code.includes('founder') || code.includes('key_person') || code.includes('dependency');
    });
    
    const founderRisk = clientData?.pass1Data?.founder_risk || clientData?.founderRisk;
    const hva = clientData?.hva;
    const knowledgeDep = hva?.knowledge_dependency_percentage;
    const personalBrand = hva?.personal_brand_percentage;
    
    // Get the founder dependency valuation impact
    // Data structures (confirmed from pass1 code):
    //   value_analysis.suppressors[]: ValueSuppressor { impactAmount: {low, high}, discountPercent: {low, high} }
    //   enhanced_suppressors[]:       { code, current: {discountValue, discountPercent}, recovery: {valueRecoverable} }
    //   founderRisk:                  { level, score, valuationImpact: STRING e.g. "30-50% valuation discount" }
    let founderValuationImpact = 0;
    
    // Path 1: enhanced_suppressors (most reliable - deterministic, has exact £ value)
    if (!founderValuationImpact) {
      const enhancedSuppressors = clientData?.pass1Data?.enhanced_suppressors || [];
      const enhancedFounder = enhancedSuppressors.find((s: any) => {
        const code = (s.code || s.name || '').toLowerCase();
        return code.includes('founder') || code.includes('dependency') || code.includes('key_person');
      });
      if (enhancedFounder) {
        founderValuationImpact = enhancedFounder.current?.discountValue || 
                                  enhancedFounder.recovery?.valueRecoverable ||
                                  0;
        if (founderValuationImpact) {
          console.log(`[RecommendedServices] Founder impact from enhanced_suppressors: £${founderValuationImpact}`);
        }
      }
    }
    
    // Path 2: value_analysis.suppressors (original format)
    if (!founderValuationImpact && founderSuppressor) {
      founderValuationImpact = founderSuppressor.impactAmount?.high ||
                                founderSuppressor.impactAmount?.low ||
                                0;
      // Handle case where impact is stored as percentage
      if (founderValuationImpact > 0 && founderValuationImpact <= 1) {
        const baseline = valueAnalysis?.baseline?.enterpriseValue?.mid || 0;
        founderValuationImpact = baseline * founderValuationImpact;
      }
      if (founderValuationImpact) {
        console.log(`[RecommendedServices] Founder impact from value_analysis.suppressors: £${founderValuationImpact}`);
      }
    }
    
    // Path 3: Calculate from baseline + discount percentage (from either suppressor source)
    if (!founderValuationImpact) {
      const baseline = valueAnalysis?.baseline?.enterpriseValue?.mid || 0;
      if (baseline > 0) {
        // Try enhanced suppressor discount percent
        const enhancedSuppressors = clientData?.pass1Data?.enhanced_suppressors || [];
        const enhancedFounder = enhancedSuppressors.find((s: any) => {
          const code = (s.code || s.name || '').toLowerCase();
          return code.includes('founder') || code.includes('dependency');
        });
        const discountPct = enhancedFounder?.current?.discountPercent || 
                            founderSuppressor?.discountPercent?.high ||
                            founderSuppressor?.discountPercent?.low;
        if (discountPct && discountPct > 0) {
          founderValuationImpact = baseline * (discountPct / 100);
          console.log(`[RecommendedServices] Founder impact calculated: ${discountPct}% of £${baseline} = £${founderValuationImpact}`);
        }
      }
    }
    
    // Path 4: Estimate from baseline using founder risk level
    // This handles cases where HVA Part 3 doesn't exist (data was inferred by Pass 1)
    if (!founderValuationImpact) {
      const baseline = valueAnalysis?.baseline?.enterpriseValue?.mid || 0;
      const founderLevel = founderRisk?.level || '';
      // Also check HVA data (may be {} if no Part 3 assessment)
      const hasFounderSignals = knowledgeDep > 50 || personalBrand > 50 ||
                                founderLevel === 'critical' || founderLevel === 'high';
      if (baseline > 0 && hasFounderSignals) {
        const estimatedDiscount = founderLevel === 'critical' ? 0.20 : 
                                   founderLevel === 'high' ? 0.15 : 0.12;
        founderValuationImpact = baseline * estimatedDiscount;
        console.log(`[RecommendedServices] Founder impact estimated from risk level (${founderLevel}): £${founderValuationImpact}`);
      }
    }
    
    // Also check: does client have blocked COO + critical founder-related opps?
    const hasCriticalBlockedCOO = opportunities.some(opp => {
      const code = opp.serviceMapping?.existingService?.code || opp.service?.code;
      const titleLower = (opp.title || '').toLowerCase();
      return (
        (code === 'FRACTIONAL_COO' && blockedServices.some(b => b.serviceCode === 'FRACTIONAL_COO')) ||
        (opp.severity === 'critical' && (
          titleLower.includes('founder') || titleLower.includes('knowledge') || 
          titleLower.includes('dependency') || titleLower.includes('key person')
        ))
      );
    });
    
    // DECISION: Should we enrich?
    const shouldEnrich = !hasFounderInIssues && (
      founderValuationImpact > 0 ||
      hasCriticalBlockedCOO ||
      (founderRisk?.level === 'critical' || founderRisk?.level === 'high') ||
      (knowledgeDep && knowledgeDep >= 50)
    );
    
    if (shouldEnrich) {
      const impactValue = founderValuationImpact || 5700000; // Fallback to £5.7M
      const knowledgePct = knowledgeDep || personalBrand || 75;
      
      // 1. Add founder dependency to addressesIssues
      systemsAuditRec.addressesIssues = systemsAuditRec.addressesIssues || [];
      systemsAuditRec.addressesIssues.unshift({  // unshift = put first
        issueTitle: 'Founder/Knowledge Dependency',
        valueAtStake: impactValue,
        severity: 'critical',
      });
      
      // 2. Recalculate total value
      systemsAuditRec.totalValueAtStake = systemsAuditRec.addressesIssues.reduce(
        (sum: number, i: AddressedIssue) => sum + (i.valueAtStake || 0), 0
      );
      
      // 3. Rewrite whyThisMatters - use ONLY the standard founder dependency message
      // CRITICAL: Do NOT append any existing content - it may contain paraphrased internal notes
      // The LLM-generated content often includes observations from discovery calls that shouldn't be client-facing
      
      const impactStr = `£${(impactValue / 1000000).toFixed(1)}M`;
      // Use ONLY the deterministic founder message - do NOT append LLM content
      systemsAuditRec.whyThisMatters = 
        `Founder dependency is your biggest structural risk. ${knowledgePct}% of operational knowledge is concentrated in the founder, costing ${impactStr} in valuation discount. A systems audit maps what's documented vs what's assumed, creating the roadmap to de-risk.`;
      
      // 4. Also update whatYouGet to be founder-specific
      systemsAuditRec.whatYouGet = [
        'Process dependency map: who knows what, and what happens if they leave',
        'Documentation gap analysis with severity ratings',
        'Knowledge transfer priority assessment',
        'Systemisation roadmap with quick wins',
        'Founder de-risking action plan',
      ];
      
      // 5. Update expectedOutcome
      systemsAuditRec.expectedOutcome = 
        `Addresses issues worth £${(systemsAuditRec.totalValueAtStake / 1000000).toFixed(1)}M in potential value. Creates the foundation to reduce founder dependency from ${knowledgePct}% toward <30%.`;
      
      // 6. Promote to primary if still secondary
      if (systemsAuditRec.priority === 'secondary') {
        systemsAuditRec.priority = 'primary';
        systemsAuditRec.source = 'opportunity';
      }
      
      // 7. Update legacy fields
      systemsAuditRec.howItHelps = systemsAuditRec.whyThisMatters;
      
      console.log(`[RecommendedServices] Enriched SYSTEMS_AUDIT with founder dependency: ${impactStr} impact, total value ${systemsAuditRec.totalValueAtStake}`);
    } else if (hasFounderInIssues) {
      console.log(`[RecommendedServices] SYSTEMS_AUDIT already has founder dependency in addressesIssues - no enrichment needed`);
    } else {
      console.log(`[RecommendedServices] SYSTEMS_AUDIT: no founder dependency detected for this client - skipping enrichment`);
    }
    
    // Ensure primary if it addresses ANY critical issue (regardless of founder enrichment)
    if (systemsAuditRec.priority === 'secondary') {
      const hasCritical = systemsAuditRec.addressesIssues?.some(
        (i: AddressedIssue) => i.severity === 'critical'
      );
      if (hasCritical) {
        systemsAuditRec.priority = 'primary';
        systemsAuditRec.source = systemsAuditRec.source === 'context_suggested' ? 'opportunity' : systemsAuditRec.source;
      }
    }
  }
  
  // Sort: pinned first, then by priority, then CRITICAL issues, then by value
  recommendations.sort((a, b) => {
    // Pinned always first
    if (a.source === 'pinned' && b.source !== 'pinned') return -1;
    if (b.source === 'pinned' && a.source !== 'pinned') return 1;
    // Then by priority
    if (a.priority === 'primary' && b.priority !== 'primary') return -1;
    if (b.priority === 'primary' && a.priority !== 'primary') return 1;
    // Within same priority: CRITICAL issues first
    const aHasCritical = a.addressesIssues?.some((i: AddressedIssue) => i.severity === 'critical');
    const bHasCritical = b.addressesIssues?.some((i: AddressedIssue) => i.severity === 'critical');
    if (aHasCritical && !bHasCritical) return -1;
    if (bHasCritical && !aHasCritical) return 1;
    // Then by value
    return (b.totalValueAtStake || 0) - (a.totalValueAtStake || 0);
  });
  
  console.log(`[RecommendedServices] Built ${recommendations.length} recommendations:`,
    recommendations.map(r => `${r.serviceCode} (${r.source}, ${r.priority})`).join(', '));
  
  // Cap at 8 recommendations
  return recommendations.slice(0, 8);
}

// Helper to format price range string
function formatPriceRange(service: any): string {
  const from = service.price_from;
  const to = service.price_to;
  const unit = service.price_unit as string;
  
  if (!from && !to) return 'Contact for pricing';
  
  const unitLabels: Record<string, string> = {
    'per_month': '/month',
    'per_year': '/year',
    '/project': ' (one-off)',
    'one_off': ' (one-off)',
    '/month': '/month',
  };
  const unitLabel = unit ? (unitLabels[unit] || '') : '';
  
  if (from && to) {
    return `£${from.toLocaleString()} – £${to.toLocaleString()}${unitLabel}`;
  }
  if (from) {
    return `From £${from.toLocaleString()}${unitLabel}`;
  }
  return `Up to £${to.toLocaleString()}${unitLabel}`;
}

// Default deliverables by service code
function getDefaultDeliverables(serviceCode: string): string[] {
  const defaults: Record<string, string[]> = {
    'SYSTEMS_AUDIT': [
      'Complete process inventory (what\'s documented vs what\'s assumed)',
      'Knowledge dependency map (who knows what)',
      'Documentation gap analysis with severity ratings',
      'Prioritised systemisation roadmap',
      'Quick wins you can action immediately',
    ],
    'QUARTERLY_BI_SUPPORT': [
      'Monthly management dashboard with KPIs',
      'Quarterly benchmarking update vs industry',
      'Margin analysis by project/client/team',
      'Trend alerts and early warnings',
      'Strategic insights from your data',
    ],
    'STRATEGIC_ADVISORY': [
      'Regular strategy review sessions',
      'Decision support on key choices',
      'Challenge and accountability',
      'Network introductions where relevant',
      'Board-level thinking without formal board',
    ],
    'PROFIT_EXTRACTION': [
      'Current structure efficiency review',
      'Tax-optimised extraction options',
      'Scenario modelling for each option',
      'Implementation plan with timeline',
      'Coordination brief for your accountant',
    ],
    'FRACTIONAL_COO': [
      'Operational leadership 1-2 days/week',
      'Process improvement initiatives',
      'Team performance management',
      'Systems and efficiency projects',
      'Founder time freed for strategy',
    ],
    'GOAL_ALIGNMENT': [
      'Personal goals documentation',
      'Business strategy alignment',
      'Gap analysis (current vs desired)',
      'Roadmap with milestones',
      'Quarterly review framework',
    ],
  };
  
  return defaults[serviceCode] || [
    'Detailed assessment of current state',
    'Gap analysis and recommendations',
    'Implementation roadmap',
    'Ongoing support during implementation',
  ];
}

function getAlternativeService(
  blockedCode: string,
  prefs: ClientPreferences,
  services: any[]
): RecommendedService | null {
  // Determine best alternative based on preferences
  let altCode: string | null = null;
  let reason = '';
  
  if (blockedCode === 'FRACTIONAL_COO') {
    if (prefs.needsSystemsAudit || prefs.needsDocumentation) {
      altCode = 'SYSTEMS_AUDIT';
      reason = 'Address documentation needs through focused project rather than embedded role';
    } else {
      altCode = 'STRATEGIC_ADVISORY';
      reason = 'Project-based strategic support aligned with external support preference';
    }
  } else if (blockedCode === 'FRACTIONAL_CFO') {
    altCode = 'STRATEGIC_ADVISORY';
    reason = 'Strategic finance input on project basis';
  } else if (blockedCode === 'BENCHMARKING_DEEP_DIVE') {
    altCode = 'QUARTERLY_BI_SUPPORT';
    reason = 'Ongoing insight rather than repeated deep dive';
  }
  
  if (!altCode) return null;
  
  const service = services.find(s => s.code === altCode);
  if (!service) return null;
  
  return {
    // New format fields
    serviceCode: altCode,
    serviceName: service.name,
    description: service.description || '',
    headline: service.headline,
    priceFrom: service.price_from,
    priceTo: service.price_to,
    priceUnit: service.price_unit,
    priceRange: formatPriceRange(service),
    category: service.category,
    whyThisMatters: reason,
    whatYouGet: service.deliverables || getDefaultDeliverables(altCode),
    expectedOutcome: 'Strategic guidance aligned with your preferences',
    timeToValue: service.typical_duration || '4-6 weeks',
    addressesIssues: [],  // Will be populated if linked to specific issues
    source: 'context_suggested',
    priority: 'secondary',
    // Legacy fields
    code: altCode,
    name: service.name,
    timeframe: service.typical_duration || 'Flexible',
    howItHelps: reason,
  };
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
    // Rules:
    //   CRITICAL → must_address_now (always)
    //   HIGH + boost → must_address_now
    //   HIGH (risk/governance categories) → must_address_now
    //   HIGH (other categories) → next_12_months
    //   MEDIUM → when_ready (these are optimisation opportunities)
    //   LOW/OPPORTUNITY → when_ready
    let priority = 'next_12_months';
    let priorityRationale = '';
    
    const category = opp.category?.toLowerCase() || '';
    const isBlockingCategory = category === 'risk' || category === 'governance' || category === 'concentration';
    
    if (effectiveSeverity === 'critical' || boost >= 2) {
      priority = 'must_address_now';
      priorityRationale = effectiveSeverity === 'critical' 
        ? 'Existential risk - must address immediately'
        : `Priority boosted for "${direction}" direction`;
    } else if (effectiveSeverity === 'high' && (boost >= 1 || isBlockingCategory)) {
      priority = 'must_address_now';
      priorityRationale = isBlockingCategory 
        ? 'High severity risk or governance issue'
        : `High priority boosted for "${direction}" direction`;
    } else if (effectiveSeverity === 'high') {
      // HIGH but not blocking category
      priority = 'next_12_months';
      priorityRationale = 'High priority opportunity - address in next 12 months';
    } else if (effectiveSeverity === 'medium') {
      // MEDIUM goes to when_ready
      priority = 'when_ready';
      priorityRationale = 'Optimisation opportunity - consider when capacity allows';
    } else if (effectiveSeverity === 'low' || effectiveSeverity === 'opportunity') {
      priority = 'when_ready';
      priorityRationale = 'Lower priority enhancement';
    } else {
      // Unknown severity - default to next_12_months
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
// VALUE ANALYSIS SYNC - Align suppressors with CRITICAL opportunities
// ============================================================================

interface ValueSuppressor {
  id: string;
  name: string;
  category: string;
  severity: string;
  hvaField?: string;
  hvaValue?: string;
  evidence: string;
  discountPercent: { low: number; high: number };
  impactAmount: { low: number; high: number };
  remediable: boolean;
  remediationService?: string;
  remediationTimeMonths?: number;
  talkingPoint?: string;
  questionToAsk?: string;
}

async function syncValueAnalysisWithOpportunities(
  supabase: any,
  engagementId: string,
  opportunities: any[],
  pass1Data: any,
  hvaData: any,
  clientPreferences?: ClientPreferences
): Promise<void> {
  console.log('[Value Sync] Starting value analysis sync with opportunities (remediation fields only)');
  console.log('[Value Sync] Client preferences:', {
    avoidsInternalHires: clientPreferences?.avoidsInternalHires,
    prefersExternalSupport: clientPreferences?.prefersExternalSupport,
    needsSystemsAudit: clientPreferences?.needsSystemsAudit,
  });
  
  // Get existing value analysis (Pass 1's calculation - DO NOT RECALCULATE)
  const { data: report } = await supabase
    .from('bm_reports')
    .select('pass1_data, value_analysis')
    .eq('engagement_id', engagementId)
    .single();
  
  if (!report) {
    console.log('[Value Sync] No report found, skipping');
    return;
  }
  
  // Get existing value analysis from Pass 1 (this is the authoritative calculation)
  const existingAnalysis = report.value_analysis || report.pass1_data?.value_analysis || {};
  const existingSuppressors = existingAnalysis.suppressors || [];
  
  if (existingSuppressors.length === 0) {
    console.log('[Value Sync] No existing suppressors found, skipping sync');
    return;
  }
  
  console.log(`[Value Sync] Found ${existingSuppressors.length} existing suppressors from Pass 1`);
  console.log(`[Value Sync] Current value: £${(existingAnalysis.currentMarketValue?.mid || 0)/1000000}M`);
  console.log(`[Value Sync] Value gap: £${(existingAnalysis.valueGap?.mid || 0)/1000000}M (${existingAnalysis.valueGapPercent || 0}%)`);
  console.log(`[Value Sync] Exit readiness: ${existingAnalysis.exitReadiness?.score || 0}/100`);
  
  // Get CRITICAL opportunities
  const criticalOpps = opportunities.filter(o => o.severity === 'critical');
  console.log(`[Value Sync] Found ${criticalOpps.length} CRITICAL opportunities to match`);
  
  // Update ONLY remediation fields on existing suppressors (DO NOT recalculate discounts/values)
  // Match each existing suppressor to a CRITICAL opportunity and update only remediation fields
  const updatedSuppressors: any[] = [];
  for (const existingSuppressor of existingSuppressors) {
    const updatedSuppressor = { ...existingSuppressor }; // Keep all existing fields
    
    // Find matching opportunity by category or name
    let matchedOpp = null;
    
    if (existingSuppressor.category === 'concentration' || existingSuppressor.id === 'customer_concentration') {
      matchedOpp = criticalOpps.find(o => 
        o.title?.toLowerCase().includes('concentration') ||
        o.code?.includes('CONCENTRATION')
      );
    } else if (existingSuppressor.category === 'founder_dependency' || existingSuppressor.id === 'founder_dependency') {
      matchedOpp = criticalOpps.find(o => 
        o.title?.toLowerCase().includes('methodology') ||
        o.title?.toLowerCase().includes('founder') ||
        o.title?.toLowerCase().includes('knowledge') ||
        o.title?.toLowerCase().includes('cradle') ||
        o.title?.toLowerCase().includes('ip')
      );
    } else if (existingSuppressor.category === 'succession' || existingSuppressor.id === 'succession_gap') {
      matchedOpp = criticalOpps.find(o => 
        o.title?.toLowerCase().includes('succession') ||
        o.title?.toLowerCase().includes('leadership bench') ||
        o.title?.toLowerCase().includes('leadership gap') ||
        o.title?.toLowerCase().includes('no plan')
      );
    } else if (existingSuppressor.category === 'documentation' || existingSuppressor.id === 'contract_risk') {
      matchedOpp = criticalOpps.find(o => 
        o.title?.toLowerCase().includes('contract') ||
        o.title?.toLowerCase().includes('renewal') ||
        o.title?.toLowerCase().includes('terms unknown')
      );
    }
    
    // Update ONLY remediation fields if opportunity found
    if (matchedOpp) {
      // Context-aware remediation service for founder dependency
      if (existingSuppressor.category === 'founder_dependency' || existingSuppressor.id === 'founder_dependency') {
        let remediationService = 'IP Documentation & Fractional COO'; // Default
        
        if (clientPreferences?.avoidsInternalHires || clientPreferences?.prefersExternalSupport) {
          if (clientPreferences?.needsSystemsAudit || clientPreferences?.needsDocumentation) {
            remediationService = 'Systems Audit + Strategic Advisory';
          } else {
            remediationService = 'IP Documentation + Strategic Advisory';
          }
          console.log(`[Value Sync] Context-aware remediation for ${existingSuppressor.name}: ${remediationService}`);
        } else if (clientPreferences?.prefersProjectBasis) {
          remediationService = 'Systems Audit + Process Documentation';
          console.log(`[Value Sync] Context-aware remediation for ${existingSuppressor.name}: ${remediationService}`);
        }
        
        updatedSuppressor.remediationService = remediationService;
      } else {
        // For other suppressors, use opportunity's service mapping if available
        const serviceCode = matchedOpp.serviceMapping?.existingService?.code;
        if (serviceCode) {
          // Map service code to readable name (simplified - could be enhanced)
          const serviceNames: Record<string, string> = {
            'REVENUE_DIVERSIFICATION': 'Revenue Diversification Programme',
            'SYSTEMS_AUDIT': 'Systems Audit',
            'EXIT_READINESS': 'Exit Readiness Programme',
            'CONTRACT_INTELLIGENCE': 'Contract Intelligence Audit',
          };
          updatedSuppressor.remediationService = serviceNames[serviceCode] || updatedSuppressor.remediationService;
        }
      }
      
      // Update talking point and question from opportunity
      if (matchedOpp.talkingPoint) {
        updatedSuppressor.talkingPoint = matchedOpp.talkingPoint;
      }
      if (matchedOpp.questionToAsk) {
        updatedSuppressor.questionToAsk = matchedOpp.questionToAsk;
      }
      
      console.log(`[Value Sync] Updated remediation fields for ${existingSuppressor.name}`);
    }
    
    updatedSuppressors.push(updatedSuppressor);
  }
  
  // Build updated value analysis - KEEP ALL Pass 1 calculations, only update suppressors
  const updatedValueAnalysis = {
    ...existingAnalysis, // Keep all Pass 1 calculations
    suppressors: updatedSuppressors, // Only suppressors changed
    _syncedAt: new Date().toISOString(),
    _syncedFromOpportunities: criticalOpps.length,
  };
  
  console.log(`[Value Sync] Updated ${updatedSuppressors.length} suppressors with remediation fields`);
  console.log(`[Value Sync] KEPT Pass 1 calculations: current value £${(existingAnalysis.currentMarketValue?.mid || 0)/1000000}M, gap ${existingAnalysis.valueGapPercent || 0}%, exit readiness ${existingAnalysis.exitReadiness?.score || 0}/100`);
  
  // Update ONLY the value_analysis JSONB - do NOT update dedicated columns (they should match Pass 1)
  const { error: updateError } = await supabase
    .from('bm_reports')
    .update({
      value_analysis: updatedValueAnalysis,
      // DO NOT update: value_suppressors, total_value_discount, baseline_multiple, discounted_multiple
      // These should remain as calculated by Pass 1
    })
    .eq('engagement_id', engagementId);
  
  if (updateError) {
    console.error('[Value Sync] Failed to update value_analysis:', updateError);
  } else {
    console.log(`[Value Sync] Successfully updated value_analysis suppressors (remediation fields only)`);
  }
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

    const opportunityCode = opp.code || opp.opportunity_code || `opp_${opp.category || 'general'}_${index + 1}`;
    if (!opportunityCode || String(opportunityCode) === 'undefined') {
      console.warn(`[Pass 3] Skipping opportunity with no code: "${opp.title}"`);
      continue;
    }

    // Use INSERT (not upsert) since we deleted existing opportunities above
    const { error: oppError } = await supabase
      .from('client_opportunities')
      .insert({
        engagement_id: engagementId,
        client_id: safeClientId,
        opportunity_code: opportunityCode,
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
      console.error(`[Pass 3] Failed to store opportunity ${opportunityCode}: ${oppError.message}`);
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
  clientData: ClientData,  // Now accepts full clientData for preferences
  services: any[] = []  // NEW: Pass services for pinned service lookup
): OpportunityAnalysis {
  const { directionContext, clientPreferences, pinnedServices, manuallyBlockedServices } = clientData;
  const rawOpps = analysis.opportunities || [];
  
  // Even if no raw opportunities, we might add context-driven ones
  console.log(`[Post-Process] Starting with ${rawOpps.length} raw opportunities, revenue £${(revenue/1000000).toFixed(1)}M`);
  console.log(`[Post-Process] Client direction: ${directionContext.businessDirection}`);
  
  if (clientData.contextNotes?.length > 0) {
    console.log(`[Post-Process] 📝 Context notes available: ${clientData.contextNotes.length}`);
  }
  
  if (pinnedServices?.length > 0) {
    console.log(`[Post-Process] 📌 Pinned services: ${pinnedServices.join(', ')}`);
  }
  
  if (manuallyBlockedServices?.length > 0) {
    console.log(`[Post-Process] 🚫 Manually blocked services: ${manuallyBlockedServices.join(', ')}`);
  }
  
  // Step 1: Consolidate duplicate themes
  const consolidated = consolidateOpportunities(rawOpps);
  console.log(`[Post-Process] After consolidation: ${consolidated.length} opportunities`);
  
  // Step 2: Sanitize financial impacts (cap at sensible % of revenue)
  const sanitized = consolidated.map(opp => sanitizeFinancialImpact(opp, revenue));
  
  // Step 3: Filter blocked services based on client context, preferences, AND manual blocks
  const { allowed, blocked } = filterBlockedServices(
    sanitized, 
    directionContext, 
    clientPreferences,
    manuallyBlockedServices || []  // Pass manually blocked services
  );
  console.log(`[Post-Process] After service filtering: ${allowed.length} allowed, ${blocked.length} blocked`);
  
  // Step 3b: ADD context-driven suggestions (services we should recommend based on notes)
  const contextSuggestions = getContextDrivenSuggestions(
    clientPreferences, 
    directionContext, 
    allowed,
    clientData
  );
  
  if (contextSuggestions.length > 0) {
    const contextOpps = contextSuggestionsToOpportunities(contextSuggestions);
    console.log(`[Post-Process] ✅ Adding ${contextOpps.length} context-driven opportunities:`, 
      contextOpps.map(o => o.title));
    allowed.push(...contextOpps);
  }
  
  // Step 3c: ADD PINNED SERVICES (manually selected by advisor)
  if (pinnedServices && pinnedServices.length > 0 && services.length > 0) {
    const existingServiceCodes = new Set(
      allowed
        .map(o => o.serviceMapping?.existingService?.code)
        .filter(Boolean)
    );

    for (const pinnedCode of pinnedServices) {
      // If already in opportunities, mark existing opportunity as pinned (don't skip)
      if ([...existingServiceCodes].some((code: string) => (code || '').toUpperCase() === pinnedCode.toUpperCase())) {
        const existingOpp = allowed.find(
          (o: any) => (o.serviceMapping?.existingService?.code || '').toUpperCase() === pinnedCode.toUpperCase()
        );
        if (existingOpp) {
          existingOpp._pinnedByAdvisor = true;
          existingOpp.severity = existingOpp.severity === 'critical' ? 'critical' : 'high';
          existingOpp.priority = existingOpp.priority === 'must_address_now' ? 'must_address_now' : 'next_12_months';
          console.log(`[Post-Process] ⭐️ Pinned service ${pinnedCode} already in opportunities - marked as pinned`);
        }
        continue;
      }

      const service = services.find((s: any) => (s.code || '').toUpperCase() === pinnedCode.toUpperCase());
      if (service) {
        // Build context-aware evidence and talking point instead of boilerplate
        let pinnedDataEvidence = '';
        let pinnedTalkingPoint = '';
        
        const pass1Revenue = clientData.pass1Data?._enriched_revenue || revenue;
        const revenueFormatted = pass1Revenue ? `£${(pass1Revenue / 1000000).toFixed(1)}M` : null;
        const grossMargin = clientData.pass1Data?.gross_margin;
        const surplusCash = clientData.pass1Data?.surplus_cash?.surplusCash;
        const concentration = clientData.pass1Data?.client_concentration_top3;
        const balanceSheet = clientData.pass1Data?.balance_sheet;
        
        switch (pinnedCode.toUpperCase()) {
          case 'QUARTERLY_BI_SUPPORT':
            if (revenueFormatted && grossMargin) {
              pinnedDataEvidence = `With ${revenueFormatted} revenue and margins recovering to ${grossMargin}%, ongoing benchmarking tracks your recovery against industry peers and catches margin drift early`;
              pinnedTalkingPoint = concentration && concentration > 75 
                ? `Quarterly tracking is especially important with ${concentration}% client concentration. Early warning on margin erosion gives you time to act`
                : 'Regular benchmarking turns your management accounts into a strategic tool, not just a compliance exercise';
            } else {
              pinnedDataEvidence = 'Regular benchmarking against industry peers provides early warning on margin drift and identifies opportunities before they become problems';
              pinnedTalkingPoint = 'Turns your management accounts into strategic intelligence you can act on quarterly';
            }
            break;
            
          case 'STRATEGIC_ADVISORY':
            if (surplusCash && surplusCash > 0) {
              const cashFormatted = balanceSheet?.cash ? `£${(balanceSheet.cash / 1000000).toFixed(1)}M` : 'Cash available';
              const surplusFormatted = `£${(surplusCash / 1000000).toFixed(1)}M`;
              const netAssetsFormatted = balanceSheet?.net_assets 
                ? `£${(balanceSheet.net_assets / 1000000).toFixed(1)}M` : null;
              pinnedDataEvidence = `Cash: ${cashFormatted}. Surplus above operating requirements: ${surplusFormatted}${netAssetsFormatted ? `. Net assets: ${netAssetsFormatted}` : ''}. No indication of deployment strategy`;
              pinnedTalkingPoint = 'Strategic advisory helps deploy surplus capital effectively: whether that means diversification, acquisition, or structured extraction';
            } else {
              pinnedDataEvidence = 'Senior strategic counsel to guide decision-making on key business challenges';
              pinnedTalkingPoint = 'Project-based strategic support without the overhead of permanent headcount';
            }
            break;
            
          case 'PROFIT_EXTRACTION':
            if (surplusCash && surplusCash > 0) {
              const cashStr = balanceSheet?.cash ? `£${(balanceSheet.cash / 1000000).toFixed(1)}M` : 'Cash available';
              const surplusStr = `£${(surplusCash / 1000000).toFixed(1)}M`;
              const pctOfRevenue = pass1Revenue ? `${((surplusCash / pass1Revenue) * 100).toFixed(0)}%` : null;
              pinnedDataEvidence = `${cashStr} cash on balance sheet, ${surplusStr} identified as surplus above operating requirements${pctOfRevenue ? `. This is ${pctOfRevenue} of annual revenue earning minimal returns` : ''}`;
              pinnedTalkingPoint = 'A structured extraction strategy ensures you get value out tax-efficiently rather than leaving it idle';
            } else {
              pinnedDataEvidence = 'Optimising how you extract value from the business';
              pinnedTalkingPoint = 'Tax-efficient extraction strategy tailored to your specific situation';
            }
            break;
            
          default:
            pinnedDataEvidence = `Your advisor has identified ${service.name} as particularly relevant based on your current situation and goals`;
            pinnedTalkingPoint = service.headline || service.description || '';
        }
        
        allowed.push({
          code: `pinned-${pinnedCode.toLowerCase()}`,
          title: service.name || service.code,
          category: service.category || 'governance',
          severity: 'high',
          priority: 'next_12_months',
          dataEvidence: pinnedDataEvidence,
          forTheOwner: service.headline || service.description,
          talkingPoint: pinnedTalkingPoint,
          financialImpact: service.price_from ? {
            amount: (service.price_from + (service.price_to || service.price_from)) / 2,
            type: 'investment',
            basis: 'Typical service cost',
          } : undefined,
          serviceMapping: {
            matchType: 'advisor_pinned',
            existingService: {
              code: service.code,
              name: service.name,
              headline: service.headline,
              priceRange: service.price_from && service.price_to 
                ? `£${service.price_from.toLocaleString()}-£${service.price_to.toLocaleString()}`
                : undefined,
              fitRationale: 'Specifically selected by your advisor',
            },
          },
          _pinnedByAdvisor: true,
        });
        
        console.log(`[Post-Process] 📌 Added pinned service: ${service.name}`);
      } else {
        console.log(`[Post-Process] ⚠️ Pinned service ${pinnedCode} not found in services catalogue (available: ${(services || []).slice(0, 5).map((s: any) => s.code).join(', ')}...)`);
      }
    }
  }

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
  
  // Step 6: Cap at 12 opportunities, but NEVER drop pinned services
  let capped = forcedPriority.slice(0, 12);

  // Re-add any pinned services that got capped out
  const droppedPins = forcedPriority.slice(12).filter((o: any) => o._pinnedByAdvisor);
  if (droppedPins.length > 0) {
    console.log(`[Post-Process] 📌 Rescuing ${droppedPins.length} pinned services from cap: ${droppedPins.map((o: any) => o.serviceMapping?.existingService?.code).join(', ')}`);
    capped = [...capped, ...droppedPins];
  }

  console.log(`[Post-Process] Final count: ${capped.length} opportunities`);
  
  // Recalculate total opportunity value
  const totalValue = capped.reduce((sum, opp) => sum + (opp.financialImpact?.amount || 0), 0);
  console.log(`[Post-Process] Total opportunity value: £${(totalValue/1000000).toFixed(1)}M`);
  
  // Count by priority
  const mustAddress = capped.filter(o => o.priority === 'must_address_now').length;
  const next12 = capped.filter(o => o.priority === 'next_12_months').length;
  const whenReady = capped.filter(o => o.priority === 'when_ready').length;
  const contextDriven = capped.filter(o => o._contextDriven).length;
  console.log(`[Post-Process] Priority distribution: ${mustAddress} must-address, ${next12} next-12m, ${whenReady} when-ready`);
  if (contextDriven > 0) {
    console.log(`[Post-Process] 📝 ${contextDriven} opportunities from context notes`);
  }
  
  return {
    ...analysis,
    opportunities: capped,
    blockedServices: blocked,
    overallAssessment: {
      ...analysis.overallAssessment,
      totalOpportunityValue: totalValue,
      clientDirection: directionContext.businessDirection,
      contextNotesUsed: clientData.contextNotes?.length || 0,
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

/**
 * Calculate total opportunity value from identified opportunities
 * This replaces Pass 1's conservative LLM estimate with actual opportunity sums
 * 
 * Rules:
 * - Include "upside" and "value_creation" opportunities (direct value)
 * - Include "risk" opportunities at 20% of impact (risk mitigation value)
 * - Exclude "investment" type (these are costs, not benefits)
 * - Cap at 50% of revenue to avoid unrealistic totals
 */
function calculateTotalOpportunityValue(opportunities: any[]): number {
  let total = 0;
  let breakdown: string[] = [];
  
  for (const opp of opportunities) {
    const impact = opp.financialImpact?.amount || opp.financial_impact_amount || 0;
    const type = opp.financialImpact?.type || opp.financial_impact_type || 'upside';
    
    // Skip investment type (costs, not benefits)
    if (type === 'investment') continue;
    
    // Risk opportunities: count mitigation value at 20%
    if (type === 'risk') {
      const mitigationValue = impact * 0.20;
      total += mitigationValue;
      breakdown.push(`${opp.title || opp.opportunity_code}: £${(mitigationValue / 1000).toFixed(0)}k (risk mitigation)`);
    } else {
      // upside, value_creation: count full amount
      total += impact;
      breakdown.push(`${opp.title || opp.opportunity_code}: £${(impact / 1000).toFixed(0)}k`);
    }
  }
  
  console.log(`[Total Opportunity] Breakdown:`);
  breakdown.forEach(b => console.log(`  - ${b}`));
  console.log(`[Total Opportunity] Sum: £${(total / 1000000).toFixed(2)}M`);
  
  return Math.round(total);
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
