// ============================================================================
// DISCOVERY REPORT - PASS 2: DESTINATION-FOCUSED NARRATIVE GENERATION
// ============================================================================
// "We're travel agents selling holidays, not airlines selling seats."
// The client doesn't buy "Management Accounts" - they buy knowing which 
// customers are profitable. They don't buy "Systems Audit" - they buy a 
// week without being the only one who can fix things.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// SERVICE PRICING AND OUTCOMES (Services as footnotes)
// Defaults used if database fetch fails - canonical source is service_line_metadata
// ============================================================================

interface ServiceDetail {
  name: string;
  price: string;
  priceType: 'monthly' | 'one-time' | 'annual';
  outcome: string;  // The destination, not the service
}

const DEFAULT_SERVICE_DETAILS: Record<string, ServiceDetail> = {
  'management_accounts': {
    name: 'Management Accounts',
    price: '£650',
    priceType: 'monthly',
    outcome: "You'll Know Your Numbers"
  },
  'systems_audit': {
    name: 'Systems Audit',
    price: '£4,000',
    priceType: 'one-time',
    outcome: "You'll See Where The Time Goes"
  },
  '365_method': {
    name: 'Goal Alignment Programme',
    price: '£1,500',
    priceType: 'monthly',
    outcome: "You'll Have Someone In Your Corner"
  },
  'automation': {
    name: 'Automation Services',
    price: '£5,000',
    priceType: 'one-time',
    outcome: "The Manual Work Disappears"
  },
  'fractional_cfo': {
    name: 'Fractional CFO Services',
    price: '£4,000',
    priceType: 'monthly',
    outcome: "You'll Have Strategic Financial Leadership"
  },
  'fractional_coo': {
    name: 'Fractional COO Services',
    price: '£3,750',
    priceType: 'monthly',
    outcome: "Someone Else Carries The Load"
  },
  'combined_advisory': {
    name: 'Combined CFO/COO Advisory',
    price: '£6,000',
    priceType: 'monthly',
    outcome: "Complete Business Transformation"
  },
  'business_advisory': {
    name: 'Business Advisory & Exit Planning',
    price: '£4,000',
    priceType: 'one-time',
    outcome: "You'll Know What It's Worth"
  },
  'benchmarking': {
    name: 'Benchmarking & Hidden Value Analysis',
    price: '£3,500',
    priceType: 'one-time',
    outcome: "You'll Know Where You Stand"
  },
  'hidden_value': {
    name: 'Hidden Value Audit',
    price: '£2,500',
    priceType: 'one-time',
    outcome: "You'll Know Your True Value"
  }
};

// Outcome mappings (destination-focused language)
const SERVICE_OUTCOMES: Record<string, string> = {
  'management_accounts': "You'll Know Your Numbers",
  'systems_audit': "You'll See Where The Time Goes",
  '365_method': "You'll Have Someone In Your Corner",
  'automation': "The Manual Work Disappears",
  'fractional_cfo': "You'll Have Strategic Financial Leadership",
  'fractional_coo': "Someone Else Carries The Load",
  'combined_advisory': "Complete Business Transformation",
  'business_advisory': "You'll Know What It's Worth",
  'benchmarking': "You'll Know Where You Stand",
  'hidden_value': "You'll Know Your True Value",
};

// Fetch service details from database, falling back to defaults
async function fetchServiceDetails(supabase: any, practiceId?: string): Promise<Record<string, ServiceDetail>> {
  try {
    // First try the new service_pricing table if we have a practice ID
    if (practiceId) {
      const { data: pricingData, error: pricingError } = await supabase
        .rpc('get_service_pricing', { p_practice_id: practiceId });
      
      if (!pricingError && pricingData && Object.keys(pricingData).length > 0) {
        console.log('Using service pricing from database for practice:', practiceId);
        
        const serviceDetails: Record<string, ServiceDetail> = {};
        
        for (const [code, service] of Object.entries(pricingData as Record<string, any>)) {
          const primaryTier = service.tiers?.[0];
          if (primaryTier) {
            const priceType = primaryTier.frequency === 'monthly' ? 'monthly' 
              : primaryTier.frequency === 'annual' ? 'annual' 
              : 'one-time';
            
            serviceDetails[code] = {
              name: service.name,
              price: `£${primaryTier.price.toLocaleString()}`,
              priceType,
              outcome: SERVICE_OUTCOMES[code] || DEFAULT_SERVICE_DETAILS[code]?.outcome || 'Business Transformation'
            };
          }
        }
        
        // Merge with defaults for any missing services
        return { ...DEFAULT_SERVICE_DETAILS, ...serviceDetails };
      }
    }
    
    // Fallback to service_line_metadata table
    const { data, error } = await supabase
      .from('service_line_metadata')
      .select('code, display_name, name, pricing')
      .eq('status', 'ready');
    
    if (error || !data) {
      console.log('Using default service details (DB fetch failed):', error?.message);
      return DEFAULT_SERVICE_DETAILS;
    }
    
    const serviceDetails: Record<string, ServiceDetail> = {};
    
    for (const service of data) {
      const code = service.code;
      const pricing = service.pricing?.[0]; // Get primary pricing tier
      
      if (pricing) {
        const priceType = pricing.frequency === 'monthly' ? 'monthly' 
          : pricing.frequency === 'annual' ? 'annual' 
          : 'one-time';
        
        serviceDetails[code] = {
          name: service.display_name || service.name,
          price: `£${pricing.amount.toLocaleString()}`,
          priceType,
          outcome: SERVICE_OUTCOMES[code] || DEFAULT_SERVICE_DETAILS[code]?.outcome || 'Business Transformation'
        };
      } else if (DEFAULT_SERVICE_DETAILS[code]) {
        serviceDetails[code] = DEFAULT_SERVICE_DETAILS[code];
      }
    }
    
    // Merge with defaults for any missing services
    return { ...DEFAULT_SERVICE_DETAILS, ...serviceDetails };
  } catch (err) {
    console.error('Error fetching service details:', err);
    return DEFAULT_SERVICE_DETAILS;
  }
}

// ============================================================================
// DATA COMPLETENESS CHECKER
// ============================================================================

interface DataCompleteness {
  score: number;            // 0-100
  status: 'complete' | 'partial' | 'insufficient';
  missingCritical: string[];
  missingImportant: string[];
  missingNiceToHave: string[];
  canGenerateClientReport: boolean;
  adminActionRequired: string[];
}

function assessDataCompleteness(emotionalAnchors: Record<string, string>): DataCompleteness {
  const critical = [
    { key: 'tuesdayTest', label: 'Tuesday Vision (5-year picture)' },
    { key: 'coreFrustration', label: 'Core Frustration' },
  ];
  
  const important = [
    { key: 'emergencyLog', label: 'Emergency Log (recent disruptions)' },
    { key: 'relationshipMirror', label: 'Business Relationship Metaphor' },
    { key: 'sacrificeList', label: 'Sacrifice List (what they\'ve given up)' },
    { key: 'suspectedTruth', label: 'Suspected Truth (financial gut feeling)' },
  ];
  
  const niceToHave = [
    { key: 'magicFix', label: 'Magic Fix (first change)' },
    { key: 'hardTruth', label: 'Hard Truth (avoided conversation)' },
    { key: 'operationalFrustration', label: 'Operational Frustration' },
    { key: 'finalInsight', label: 'Final Insight' },
    { key: 'hiddenFromTeam', label: 'Hidden From Team' },
    { key: 'avoidedConversation', label: 'Avoided Conversation' },
    { key: 'unlimitedChange', label: 'If Unlimited Funds' },
  ];
  
  const isProvided = (val: string | undefined) => 
    val && val.trim() !== '' && val.toLowerCase() !== 'not provided' && val.length > 10;
  
  const missingCritical = critical.filter(f => !isProvided(emotionalAnchors[f.key])).map(f => f.label);
  const missingImportant = important.filter(f => !isProvided(emotionalAnchors[f.key])).map(f => f.label);
  const missingNiceToHave = niceToHave.filter(f => !isProvided(emotionalAnchors[f.key])).map(f => f.label);
  
  const criticalScore = ((critical.length - missingCritical.length) / critical.length) * 50;
  const importantScore = ((important.length - missingImportant.length) / important.length) * 30;
  const niceScore = ((niceToHave.length - missingNiceToHave.length) / niceToHave.length) * 20;
  
  const score = Math.round(criticalScore + importantScore + niceScore);
  
  let status: 'complete' | 'partial' | 'insufficient' = 'complete';
  if (missingCritical.length > 0) status = 'insufficient';
  else if (missingImportant.length > 2) status = 'partial';
  else if (score < 70) status = 'partial';
  
  const adminActionRequired: string[] = [];
  if (missingCritical.length > 0) {
    adminActionRequired.push(`Schedule discovery call to gather: ${missingCritical.join(', ')}`);
  }
  if (missingImportant.length > 2) {
    adminActionRequired.push(`Follow up to understand: ${missingImportant.join(', ')}`);
  }
  
  return {
    score,
    status,
    missingCritical,
    missingImportant,
    missingNiceToHave,
    canGenerateClientReport: missingCritical.length === 0 && score >= 50,
    adminActionRequired
  };
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
      return new Response(
        JSON.stringify({ error: 'engagementId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startTime = Date.now();

    // Update status
    await supabase
      .from('discovery_engagements')
      .update({ 
        status: 'pass2_processing', 
        pass2_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', engagementId);

    await supabase
      .from('discovery_reports')
      .update({ status: 'pass2_processing', updated_at: new Date().toISOString() })
      .eq('engagement_id', engagementId);

    // Fetch engagement with all related data
    const { data: engagement, error: engError } = await supabase
      .from('discovery_engagements')
      .select(`
        *,
        client:practice_members!discovery_engagements_client_id_fkey(
          id, name, email, client_company
        ),
        discovery:destination_discovery(*)
      `)
      .eq('id', engagementId)
      .single();

    if (engError || !engagement) {
      throw new Error('Engagement not found');
    }

    // Fetch service pricing from database (single source of truth)
    // Pass practice_id to use practice-specific pricing if available
    const SERVICE_DETAILS = await fetchServiceDetails(supabase, engagement.practice_id);
    console.log('Loaded service details for', Object.keys(SERVICE_DETAILS).length, 'services');

    // Fetch Pass 1 results
    const { data: report, error: reportError } = await supabase
      .from('discovery_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();

    if (reportError || !report) {
      throw new Error('Pass 1 must be completed first');
    }

    // Fetch context notes
    const { data: contextNotes } = await supabase
      .from('discovery_context_notes')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('is_for_ai_analysis', true)
      .order('created_at', { ascending: true });

    // Fetch document summaries
    const { data: documents } = await supabase
      .from('discovery_uploaded_documents')
      .select('filename, document_type, description, ai_summary')
      .eq('engagement_id', engagementId)
      .eq('is_for_ai_analysis', true);

    // Build the prompt
    const clientName = engagement.client?.name?.split(' ')[0] || 'they'; // First name only
    const fullName = engagement.client?.name || 'Client';
    const companyName = engagement.client?.client_company || 'their business';
    const emotionalAnchors = report.emotional_anchors || {};
    const patterns = report.detection_patterns || {};
    const primaryRecs = report.primary_recommendations || [];
    const secondaryRecs = report.secondary_recommendations || [];

    // Assess data completeness
    const dataCompleteness = assessDataCompleteness(emotionalAnchors);
    console.log(`[Pass 2] Data completeness: ${dataCompleteness.score}% (${dataCompleteness.status})`);
    console.log(`[Pass 2] Missing critical: ${dataCompleteness.missingCritical.join(', ') || 'None'}`);

    // ========================================================================
    // COO APPROPRIATENESS CHECK - Block COO when not appropriate
    // ========================================================================
    const discoveryResponses = engagement.discovery?.responses || {};
    
    // Check conditions that make COO NOT appropriate
    const founderDependency = (discoveryResponses.sd_founder_dependency || '').toLowerCase();
    const ownerHours = (discoveryResponses.dd_owner_hours || discoveryResponses.dd_weekly_hours || '').toLowerCase();
    const externalView = (discoveryResponses.dd_external_view || discoveryResponses.dd_work_life_balance || '').toLowerCase();
    const avoidedConversation = (discoveryResponses.dd_avoided_conversation || '').toLowerCase();
    const hardTruth = (discoveryResponses.dd_hard_truth || '').toLowerCase();
    
    // Business runs fine without founder - doesn't need ongoing COO
    const businessRunsFine = founderDependency.includes('run fine') || 
                             founderDependency.includes('tick') ||
                             founderDependency.includes('optional') ||
                             founderDependency.includes('minor issues') ||
                             founderDependency.includes('team would cope') ||
                             founderDependency.includes('runs smoothly');
    
    // Owner works reasonable hours - doesn't need COO
    const reasonableHours = ownerHours.includes('under 30') || 
                            ownerHours.includes('30-40') ||
                            ownerHours.includes('less than') ||
                            ownerHours.includes('<30') ||
                            ownerHours.includes('<40');
    
    // Good work/life balance - doesn't need COO
    const hasGoodWorkLifeBalance = externalView.includes('well') ||
                                   externalView.includes('good') ||
                                   externalView.includes('healthy') ||
                                   externalView.includes('balance');
    
    // One-time restructuring need (redundancies) - needs HR consultant, not ongoing COO
    const isOneTimeRestructuring = avoidedConversation.includes('redundan') ||
                                   avoidedConversation.includes('let go') ||
                                   avoidedConversation.includes('fire') ||
                                   hardTruth.includes('overstaffed') ||
                                   hardTruth.includes('too many') ||
                                   hardTruth.includes('payroll');
    
    // Exit-focused client - adding £45k/year COO costs reduces sale value
    const tuesdayVision = (emotionalAnchors.tuesdayTest || emotionalAnchors.tuesdayVision || '').toLowerCase();
    const fiveYearVision = (discoveryResponses.dd_five_year_vision || '').toLowerCase();
    
    const isExitFocused = fiveYearVision.includes('exit') ||
                          fiveYearVision.includes('sell') ||
                          fiveYearVision.includes('sold') ||
                          tuesdayVision.includes('sold') ||
                          tuesdayVision.includes('sell') ||
                          tuesdayVision.includes('exit') ||
                          tuesdayVision.includes('moved on') ||
                          tuesdayVision.includes('move on');
    
    const shouldBlockCOO = businessRunsFine || reasonableHours || hasGoodWorkLifeBalance || isOneTimeRestructuring || (isExitFocused && businessRunsFine);
    
    // For exit-focused clients, we enforce a specific service ordering
    console.log(`[Pass 2] Exit-focused client detection: ${isExitFocused}`);
    if (isExitFocused) {
      console.log(`[Pass 2] 🎯 EXIT CLIENT DETECTED - Enforcing: Benchmarking FIRST, then improvements, then Goal Alignment`);
    }
    
    let cooBlockReason = '';
    if (shouldBlockCOO) {
      if (businessRunsFine) cooBlockReason = 'Business runs fine without founder - no ongoing COO needed';
      else if (reasonableHours) cooBlockReason = 'Owner works reasonable hours - no COO needed';
      else if (hasGoodWorkLifeBalance) cooBlockReason = 'Good work/life balance indicates operations are manageable';
      else if (isOneTimeRestructuring) cooBlockReason = 'Redundancy/restructuring is one-time - use HR consultant, not ongoing COO';
      else if (isExitFocused) cooBlockReason = 'Exit-focused client with stable operations - COO costs reduce sale value';
      
      console.log(`[Pass 2] 🚫 BLOCKING COO: ${cooBlockReason}`);
    } else {
      console.log(`[Pass 2] ✓ COO may be appropriate`);
    }

    // Build recommended services with pricing, filtering out blocked services
    const blockedServices = shouldBlockCOO ? ['fractional_coo', 'combined_advisory'] : [];
    
    let recommendedServices = [...primaryRecs, ...secondaryRecs]
      .filter(r => r.recommended)
      .filter(r => !blockedServices.includes(r.code)) // Filter out blocked services
      .map(r => ({
        code: r.code,
        ...SERVICE_DETAILS[r.code],
        score: r.score,
        triggers: r.triggers
      }));
    
    // ========================================================================
    // FOR EXIT-FOCUSED CLIENTS: Force correct service ordering
    // ========================================================================
    if (isExitFocused) {
      console.log(`[Pass 2] 🎯 EXIT CLIENT: Forcing Benchmarking FIRST ordering`);
      
      // Build the correct exit-focused service order
      const exitOrderedServices = [];
      
      // PHASE 1: Benchmarking & Hidden Value MUST be first
      const benchmarking = {
        code: 'benchmarking',
        ...SERVICE_DETAILS['benchmarking'],
        score: 95,
        triggers: ['exit_focused', 'value_baseline'],
        exitPhase: 1,
        exitRationale: 'Establish baseline value before anything else'
      };
      exitOrderedServices.push(benchmarking);
      
      // PHASE 2: Business Advisory for restructuring (if needed)
      const businessAdvisory = recommendedServices.find(s => s.code === 'business_advisory');
      if (businessAdvisory) {
        exitOrderedServices.push({
          ...businessAdvisory,
          exitPhase: 2,
          exitRationale: 'Address value gap identified by benchmarking'
        });
      }
      
      // PHASE 3: Goal Alignment for ongoing exit support
      const goalAlignment = {
        code: '365_method',
        ...SERVICE_DETAILS['365_method'],
        score: 90,
        triggers: ['exit_focused', 'accountability'],
        exitPhase: 3,
        exitRationale: '3-year exit plan with ongoing accountability'
      };
      exitOrderedServices.push(goalAlignment);
      
      // Use the forced ordering
      recommendedServices = exitOrderedServices;
      console.log(`[Pass 2] EXIT SERVICE ORDER: ${recommendedServices.map(s => `${s.exitPhase}. ${s.code}`).join(', ')}`);
    }
    
    console.log(`[Pass 2] Recommended services after filtering:`, recommendedServices.map(s => s.code));

    // Build context from notes
    const contextSection = contextNotes?.length 
      ? `\n\nADDITIONAL CONTEXT FROM ADVISOR (from follow-up calls/notes):\n${contextNotes.map(n => `[${n.note_type}] ${n.title}:\n${n.content}`).join('\n\n')}`
      : '';

    // Build document context
    const docSection = documents?.length
      ? `\n\nRELEVANT DOCUMENTS:\n${documents.map(d => `- ${d.filename} (${d.document_type}): ${d.ai_summary || d.description || 'No summary'}`).join('\n')}`
      : '';

    // ========================================================================
    // FETCH ADVISOR FEEDBACK COMMENTS - These override default recommendations
    // ========================================================================
    const { data: feedbackComments } = await supabase
      .from('discovery_analysis_comments')
      .select('*')
      .eq('engagement_id', engagementId)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: true });

    console.log(`[Pass 2] Found ${feedbackComments?.length || 0} feedback comments to apply`);

    // Build feedback section for the prompt
    let feedbackSection = '';
    if (feedbackComments && feedbackComments.length > 0) {
      feedbackSection = `

============================================================================
🚨 MANDATORY ADVISOR FEEDBACK - MUST BE APPLIED
============================================================================
The following feedback has been provided by the advisor and MUST be incorporated
into this regeneration. These override any default recommendations or patterns.

`;
      for (const comment of feedbackComments) {
        feedbackSection += `
---
SECTION: ${comment.section_type}
TYPE: ${comment.comment_type} (${comment.comment_type === 'correction' ? 'MUST FIX' : comment.comment_type === 'suggestion' ? 'SHOULD INCORPORATE' : 'FOR LEARNING'})
FEEDBACK: ${comment.comment_text}
${comment.suggested_learning ? `LEARNING TO APPLY: ${comment.suggested_learning}` : ''}
---
`;
      }

      feedbackSection += `
IMPORTANT: When generating pages 1-5, you MUST:
1. Address EVERY correction marked "MUST FIX"
2. Incorporate EVERY suggestion marked "SHOULD INCORPORATE"
3. Apply the learnings to guide service recommendations and narrative tone
4. If feedback mentions specific services should be prioritized (e.g., "benchmarking first"), 
   you MUST reorder the journey phases to reflect this guidance
5. If feedback says a service should NOT be recommended, remove it from the journey
`;
    }

    // Log what feedback will be applied
    if (feedbackComments && feedbackComments.length > 0) {
      console.log('[Pass 2] Applying feedback:');
      feedbackComments.forEach(f => {
        console.log(`  - [${f.section_type}] ${f.comment_type}: ${f.comment_text.substring(0, 50)}...`);
      });
    }

    // ============================================================================
    // THE MASTER PROMPT - Destination-Focused Discovery Report
    // ============================================================================

    const prompt = `You are writing a Destination-Focused Discovery Report for ${clientName} from ${companyName}.

============================================================================
THE FUNDAMENTAL PRINCIPLE
============================================================================
We're travel agents selling holidays, not airlines selling seats.

${clientName} doesn't buy "Management Accounts" - they buy knowing which customers are profitable.
They don't buy "Systems Audit" - they buy a week without being the only one who can fix things.
They don't buy "365 Programme" - they buy leaving at 4pm to pick up the kids.

HEADLINE the destination. Service is just how they get there.

============================================================================
WRITING RULES - CRITICAL
============================================================================

BANNED VOCABULARY (never use):
- Additionally, Furthermore, Moreover (just continue)
- Delve, delving (say: look at, dig into)
- Crucial, pivotal, vital, key (show why it matters)
- Leverage (say: use)
- Streamline (say: simplify, speed up)
- Optimize (say: improve)
- Landscape (say: market, situation)
- Ecosystem (say: system)
- Synergy (describe the actual benefit)
- Holistic (say: complete, whole)
- Robust (say: strong, reliable)
- Cutting-edge, state-of-the-art (describe what's new)
- Innovative, innovation (show it, don't label it)
- Journey (say: process, path, route)
- Unlock potential (say: enable, allow)
- Empower (say: enable, help)
- "We recommend..." (say the outcome instead)
- "Our services include..." (never headline services)
- "The solution is..." (describe what changes)

BANNED SENTENCE STRUCTURES:
- "Not only X but also Y" parallelisms
- "It's important to note that..."
- "In today's business environment..."
- "At its core..."
- "At the end of the day..."
- Starting with "Importantly," or "Notably,"

WRITING STYLE:
1. Write like you're writing to a friend going through a hard time
2. Use their EXACT words - quote them liberally (8+ times minimum)
3. Short paragraphs (2-3 sentences max)
4. Be specific - use their numbers, their examples, their situations
5. Sound human - contractions, imperfect grammar, conversational
6. Empathy before solutions - name their pain before offering hope
7. Personal anchors - reference spouse names, kids' ages, specific details
8. Services as footnotes - headline the OUTCOME, service is just how

============================================================================
DATA COMPLETENESS STATUS
============================================================================
Score: ${dataCompleteness.score}/100 (${dataCompleteness.status})
${dataCompleteness.missingCritical.length > 0 ? `⚠️ MISSING CRITICAL DATA: ${dataCompleteness.missingCritical.join(', ')}` : '✅ All critical data present'}
${dataCompleteness.missingImportant.length > 0 ? `⚠️ MISSING IMPORTANT DATA: ${dataCompleteness.missingImportant.join(', ')}` : '✅ All important data present'}

HANDLING MISSING DATA:
- If tuesdayVision is missing: Acknowledge it warmly, position the discovery call as the first step
- If emergencyLog is missing: Note we don't know what pulls them away yet
- If suspectedTruth is missing: Note we haven't heard their gut feeling on the numbers
- NEVER fabricate quotes or details
- ALWAYS acknowledge gaps honestly but warmly
- Adjust confidence scores downward for missing data
- Remove specific ROI calculations if no supporting data

============================================================================
CLIENT'S OWN WORDS (Use these VERBATIM - these are gold)
============================================================================

THEIR VISION (The Tuesday Test - what their ideal future looks like):
"${emotionalAnchors.tuesdayTest || 'Not provided'}"

THEIR MAGIC FIX (What they'd change first if they could):
"${emotionalAnchors.magicFix || 'Not provided'}"

THEIR CORE FRUSTRATION (What frustrates them most):
"${emotionalAnchors.coreFrustration || 'Not provided'}"

THEIR EMERGENCY LOG (What pulled them away recently):
"${emotionalAnchors.emergencyLog || 'Not provided'}"

HOW THE BUSINESS RELATIONSHIP FEELS (Their metaphor):
"${emotionalAnchors.relationshipMirror || 'Not provided'}"

WHAT THEY'VE SACRIFICED (Personal cost):
"${emotionalAnchors.sacrificeList || 'Not provided'}"

THEIR HARD TRUTH (What they've been avoiding):
"${emotionalAnchors.hardTruth || 'Not provided'}"

WHAT THEY SUSPECT ABOUT THE NUMBERS (Financial gut feeling):
"${emotionalAnchors.suspectedTruth || 'Not provided'}"

WHAT'S HIDDEN FROM TEAM (Worries they don't share):
"${emotionalAnchors.hiddenFromTeam || 'Not provided'}"

THE AVOIDED CONVERSATION (Who they need to talk to):
"${emotionalAnchors.avoidedConversation || 'Not provided'}"

OPERATIONAL FRUSTRATION (Day-to-day friction):
"${emotionalAnchors.operationalFrustration || 'Not provided'}"

ANYTHING ELSE THEY SHARED:
"${emotionalAnchors.finalInsight || 'Not provided'}"
${contextSection}
${docSection}
${feedbackSection}

============================================================================
DETECTED PATTERNS
============================================================================
${patterns.burnoutDetected ? `⚠️ BURNOUT DETECTED (${patterns.burnoutFlags} indicators): ${patterns.burnoutIndicators?.join(', ')}` : 'No burnout pattern detected'}
${patterns.capitalRaisingDetected ? `💰 CAPITAL RAISING INTENT: ${patterns.capitalSignals?.join(', ')}` : 'No capital raising pattern'}
${patterns.lifestyleTransformationDetected ? `🔄 LIFESTYLE TRANSFORMATION: ${patterns.lifestyleSignals?.join(', ')}` : 'No lifestyle pattern'}

Urgency Multiplier: ${patterns.urgencyMultiplier || 1}x
Change Readiness: ${report.change_readiness || 'Unknown'}

============================================================================
RECOMMENDED SERVICES (write these as FOOTNOTES only, not headlines)
============================================================================
${JSON.stringify(recommendedServices, null, 2)}

${shouldBlockCOO ? `
============================================================================
⚠️ CRITICAL: BLOCKED SERVICES - DO NOT RECOMMEND THESE
============================================================================
The following services have been determined to be NOT APPROPRIATE for this client:
- Fractional COO Services (£3,750/month)
- Combined CFO/COO Advisory

REASON: ${cooBlockReason}

DO NOT include these services in any phase of the journey. 
DO NOT mention COO as an enabler.
If the client needs help with redundancies/restructuring, suggest a one-time HR consultant or business advisory support instead.
The client's issues can be addressed through the OTHER services listed above.
` : ''}

${isExitFocused ? `
============================================================================
🎯🎯🎯 EXIT-FOCUSED CLIENT - YOU MUST USE THIS EXACT ORDER 🎯🎯🎯
============================================================================
This client wants to EXIT/SELL. The services have been PRE-ORDERED for you.
DO NOT REORDER THEM. Use them in the exact order provided below.

THE SERVICES ABOVE ARE ALREADY IN THE CORRECT ORDER. JUST USE THEM AS-IS:

PHASE 1 (Month 1-3): "${SERVICE_DETAILS['benchmarking'].outcome}"
   Service: ${SERVICE_DETAILS['benchmarking'].name} (${SERVICE_DETAILS['benchmarking'].price})
   Why first: They need to know their value TODAY before planning anything

PHASE 2 (Month 3-6): "Closing the Value Gap" 
   Service: Business Advisory (if needed based on Phase 1 findings)
   Why: Only recommend IF benchmarking reveals a gap to close

PHASE 3 (Month 6-12): "${SERVICE_DETAILS['365_method'].outcome}"
   Service: ${SERVICE_DETAILS['365_method'].name} (${SERVICE_DETAILS['365_method'].price}/year - recommend mid-to-top tier)
   Why: 3-year exit plan with ongoing accountability

I REPEAT: The RECOMMENDED SERVICES list above is ALREADY in the correct order.
Phase 1 = First service listed (Benchmarking)
Phase 2 = Second service listed (Business Advisory) 
Phase 3 = Third service listed (Goal Alignment)

DO NOT put Business Advisory first. That is WRONG for exit clients.
` : ''}

============================================================================
🚨 CRITICAL: ADVISOR THINKING PATTERNS - MUST FOLLOW THIS ORDER
============================================================================

FOR EXIT-FOCUSED CLIENTS (someone saying "exit", "sell", "sold", "move on"):

THE CORRECT ORDER IS:

PHASE 1 (Month 1-3): BENCHMARKING & HIDDEN VALUE ANALYSIS - ALWAYS FIRST
   - "You'll Know Where You Stand Today"
   - What's the business worth RIGHT NOW before we do ANYTHING else?
   - Where are the hidden value detractors?
   - What's the gap between current value and their exit goal?
   - This is ONE combined service: Benchmarking & Hidden Value Analysis (£3,500)
   - DO NOT split these into separate phases

PHASE 2 (Month 3-6): BASED ON THE GAP
   - IF the value is below expectations: Discuss what we can do to increase it
   - This might be Business Advisory support with HR/restructuring
   - Or operational improvements identified by the benchmarking

PHASE 3 (Month 6-12+): GOAL ALIGNMENT - The 3-Year Exit Plan
   - "You'll Have Someone In Your Corner"  
   - Get under the hood of what life outside work looks like
   - Create a plan that makes exit exceed all expectations
   - USE MID-TO-TOP TIER Goal Alignment (£1,500-£2,500/month) NOT the basic tier

⛔ WRONG: Leading with "Business Advisory & Exit Planning" for exit clients
⛔ WRONG: Putting Benchmarking after other services
⛔ WRONG: Splitting Benchmarking and Hidden Value into separate phases

✅ RIGHT: Benchmarking FIRST to establish the baseline
✅ RIGHT: Then discuss improvements based on the gap
✅ RIGHT: Goal Alignment as ongoing support, not the first recommendation

============================================================================
YOUR TASK - Generate a 5-page Destination-Focused Report
============================================================================

Return a JSON object with this exact structure:

{
  "page1_destination": {
    "headerLine": "The Tuesday You're Building Towards",
    "visionProvided": true/false,
    "visionVerbatim": "IF PROVIDED: Their Tuesday Test answer, edited slightly for flow but keeping their exact words. Include specific details like leaving times, activities, family names. IF NOT PROVIDED: A warm acknowledgment that they haven't painted the picture yet, with an invitation to have that conversation.",
    "whatTheyWontBeDoing": ["List of things they specifically said they want to stop doing"],
    "destinationClarityScore": 1-10,
    "clarityExplanation": "One sentence about how clear their vision is. Be honest if data is missing."
  },
  
  "page2_gaps": {
    "headerLine": "The Gap Between Here and There",
    "dataProvided": true/false,
    "openingLine": "A punchy one-liner capturing their core tension. Use their metaphor from relationshipMirror if powerful. e.g. 'You're building for freedom but operating in a prison of your own making.'",
    "gapScore": 1-10,
    "gaps": [
      {
        "category": "operational|financial|strategic|people",
        "priority": "critical|high|medium",
        "title": "Outcome-focused title like 'You Can't Leave' not 'Founder Dependency'",
        "pattern": "Their exact words showing this pattern - DIRECT QUOTES",
        "timeImpact": "Specific hours or pattern",
        "financialImpact": "Specific amount or 'Unknown - you suspect significant'",
        "emotionalImpact": "The personal/relationship/health cost",
        "shiftRequired": "One sentence describing what needs to change"
      }
    ]
  },
  
  "page3_journey": {
    "headerLine": "From Here to [Their Specific Goal]",
    "timelineLabel": {
      "now": "Starting state word like 'Prison' or 'Blind'",
      "month3": "Month 3 state like 'Clarity' or 'Visible'",
      "month6": "Month 6 state like 'Control' or 'Understood'",
      "month12": "Month 12 state like 'Freedom' or 'Designed'"
    },
    "phases": [
      {
        "timeframe": "Month 1-3",
        "headline": "OUTCOME headline like 'You'll Know Your Numbers' NOT service name",
        "whatChanges": [
          "Specific tangible outcome 1",
          "Specific tangible outcome 2",
          "Specific tangible outcome 3"
        ],
        "feelsLike": "Emotional description using their language and metaphors. What the transformation FEELS like.",
        "outcome": "Single sentence: the tangible result they can point to",
        "enabledBy": "Service Name (footnote only)",
        "price": "£X/month or £X one-time"
      }
    ]
  },
  
  "page4_numbers": {
    "headerLine": "The Investment in Your [Their Specific Goal]",
    "dataProvided": true/false,
    "costOfStaying": {
      "labourInefficiency": "£X - £Y or 'Unknown - we need to assess this'",
      "marginLeakage": "£X or 'Unknown - you suspect significant'",
      "yourTimeWasted": "X hours/year or 'Unknown'",
      "businessValueImpact": "Description of impact"
    },
    "personalCost": "SPECIFIC personal cost using their words. Kids ages, spouse name, health mentions, sacrifices. If not provided, acknowledge we don't know what they've sacrificed yet.",
    "investment": [
      {
        "phase": "Months 1-3",
        "amount": "£X",
        "whatYouGet": "OUTCOME in 5 words, not service name"
      }
    ],
    "totalYear1": "£X",
    "totalYear1Label": "Brief outcome description",
    "returns": {
      "canCalculate": true/false,
      "conservative": {
        "labourGains": "£X or null",
        "marginRecovery": "£X or null",
        "timeReclaimed": "£X or null",
        "total": "£X"
      },
      "realistic": {
        "labourGains": "£X or null",
        "marginRecovery": "£X or null",
        "timeReclaimed": "£X or null",
        "total": "£X"
      }
    },
    "paybackPeriod": "X-Y months",
    "realReturn": "Their specific goal in their words - the emotional return"
  },
  
  "page5_nextSteps": {
    "headerLine": "Starting The Journey",
    "thisWeek": {
      "action": "30-minute call to [specific purpose]",
      "tone": "Reassurance this isn't a sales pitch. What will actually happen in the call."
    },
    "firstStep": {
      "headline": "OUTCOME headline, not service name",
      "recommendation": "What to start with and why",
      "theirWordsEcho": "A quote from their assessment that ties to this",
      "simpleCta": "£X to [outcome verb]"
    },
    "theAsk": "2-3 sentences referencing their finalInsight or desire for action. Acknowledge past failures. Offer the practical path.",
    "closingLine": "Let's talk this week.",
    "urgencyAnchor": "Personal anchor with time-based urgency. Kids ages. Health. Marriage. Whatever they mentioned."
  },
  
  "meta": {
    "quotesUsed": ["Array of 8-10 direct quotes used throughout"],
    "personalAnchors": ["Kids ages", "Spouse name", "Health mentions", "Hobby mentions"],
    "urgencyLevel": "high|medium|low",
    "dataCompleteness": ${dataCompleteness.score},
    "readyForClient": ${dataCompleteness.canGenerateClientReport},
    "adminActionsNeeded": ${JSON.stringify(dataCompleteness.adminActionRequired)}
  }
}

============================================================================
PHASE/GAP TITLE TRANSLATIONS
============================================================================

GAPS - Use outcome-focused titles:
| BAD (Problem-Focused) | GOOD (Outcome-Focused) |
|-----------------------|------------------------|
| "Founder Dependency" | "You Can't Leave" |
| "Financial Blindness" | "You're Flying Blind" |
| "Manual Processes" | "Everything Takes Too Long" |
| "No Accountability" | "You Keep Trying Alone" |
| "Key Person Risk" | "It All Sits With You" |

PHASES - Headlines are outcomes:
| SERVICE | BAD HEADLINE | GOOD HEADLINE |
|---------|--------------|---------------|
| Management Accounts | "Financial Reporting" | "You'll Know Your Numbers" |
| Systems Audit | "Operational Assessment" | "You'll See Where The Time Goes" |
| Automation | "Process Automation" | "The Manual Work Disappears" |
| Fractional COO | "Operations Support" | "Someone Else Carries The Load" |
| 365 Programme | "Strategic Coaching" | "You'll Have Someone In Your Corner" |
| Business Advisory | "Exit Planning" | "You'll Know What It's Worth" |

============================================================================
VALIDATION BEFORE OUTPUT
============================================================================

Before returning, verify:
- [ ] Client first name used throughout (not "the client")
- [ ] 8+ direct quotes from their responses
- [ ] Personal anchors appear 3+ times if available
- [ ] NO service names as headlines
- [ ] ALL services appear only in footnotes ("Enabled by:")
- [ ] Cost of waiting includes emotional cost
- [ ] Journey phases are outcomes, not services
- [ ] Missing data acknowledged honestly, not fabricated
- [ ] UK English throughout
- [ ] No banned phrases used
- [ ] meta.readyForClient correctly reflects data completeness`;

    // Call Claude via OpenRouter
    console.log('[Discovery Pass 2] Calling Claude Sonnet via OpenRouter...');
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Discovery Pass 2'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 12000  // Increased to ensure all 5 pages get full content
      })
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      throw new Error(`OpenRouter API error: ${errText}`);
    }

    const llmData = await llmResponse.json();
    let responseText = llmData.choices[0].message.content.trim();
    
    // Remove markdown code fences if present
    responseText = responseText.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();

    // Extract JSON from response
    let narratives;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        narratives = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text (first 2000 chars):', responseText.substring(0, 2000));
      throw new Error(`Failed to parse LLM response: ${parseError.message}`);
    }

    // Log what pages have content
    const pageStatus = {
      page1: !!narratives.page1_destination?.visionVerbatim,
      page2: !!narratives.page2_gaps?.gaps?.length,
      page3: !!narratives.page3_journey?.phases?.length,
      page4: !!narratives.page4_numbers?.investment?.length,
      page5: !!narratives.page5_nextSteps?.thisWeek
    };
    console.log(`[Pass 2] Page content status:`, pageStatus);
    
    // Warn if any pages are empty
    const emptyPages = Object.entries(pageStatus).filter(([_, hasContent]) => !hasContent).map(([page]) => page);
    if (emptyPages.length > 0) {
      console.warn(`[Pass 2] ⚠️ Pages with missing content: ${emptyPages.join(', ')}`);
      console.log(`[Pass 2] Response length: ${responseText.length} chars`);
    }

    const processingTime = Date.now() - startTime;
    const tokensUsed = llmData.usage?.total_tokens || 0;
    const estimatedCost = (tokensUsed / 1000000) * 3; // Claude Sonnet pricing via OpenRouter

    // Determine status based on data completeness
    // If data is incomplete, set to 'admin_review' - admin must review before publishing to client
    const reportStatus = dataCompleteness.canGenerateClientReport ? 'generated' : 'admin_review';
    const engagementStatus = dataCompleteness.canGenerateClientReport ? 'pass2_complete' : 'awaiting_admin_review';

    console.log(`[Pass 2] Setting status to: ${reportStatus} (data completeness: ${dataCompleteness.score}%)`);

    // Update report with Pass 2 results - new destination-focused structure
    await supabase
      .from('discovery_reports')
      .update({
        status: reportStatus,
        // New destination-focused structure
        destination_report: narratives,
        page1_destination: narratives.page1_destination,
        page2_gaps: narratives.page2_gaps,
        page3_journey: narratives.page3_journey,
        page4_numbers: narratives.page4_numbers,
        page5_next_steps: narratives.page5_nextSteps,
        quotes_used: narratives.meta?.quotesUsed || [],
        personal_anchors: narratives.meta?.personalAnchors || [],
        urgency_level: narratives.meta?.urgencyLevel || 'medium',
        // Data completeness tracking
        data_completeness_score: dataCompleteness.score,
        data_completeness_status: dataCompleteness.status,
        missing_critical_data: dataCompleteness.missingCritical,
        missing_important_data: dataCompleteness.missingImportant,
        admin_actions_needed: dataCompleteness.adminActionRequired,
        ready_for_client: dataCompleteness.canGenerateClientReport,
        // Metadata
        llm_model: 'claude-sonnet-4-20250514',
        llm_tokens_used: tokensUsed,
        llm_cost: estimatedCost,
        generation_time_ms: processingTime,
        prompt_version: 'v4.0-admin-first',
        pass2_completed_at: new Date().toISOString(),
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('engagement_id', engagementId);

    // Update engagement status
    await supabase
      .from('discovery_engagements')
      .update({ 
        status: engagementStatus, 
        pass2_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', engagementId);

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        destinationReport: narratives,
        dataCompleteness: {
          score: dataCompleteness.score,
          status: dataCompleteness.status,
          missingCritical: dataCompleteness.missingCritical,
          missingImportant: dataCompleteness.missingImportant,
          canGenerateClientReport: dataCompleteness.canGenerateClientReport,
          adminActionsNeeded: dataCompleteness.adminActionRequired
        },
        reportStatus,
        processingTimeMs: processingTime,
        tokensUsed,
        estimatedCost: estimatedCost.toFixed(4),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pass 2 error:', error);
    
    // Update status to indicate failure
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      const { engagementId } = await req.json();
      if (engagementId) {
        await supabase
          .from('discovery_engagements')
          .update({ 
            status: 'pass1_complete',
            updated_at: new Date().toISOString()
          })
          .eq('id', engagementId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
