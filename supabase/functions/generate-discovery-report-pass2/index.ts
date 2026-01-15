// ============================================================================
// DISCOVERY REPORT - PASS 2: NARRATIVE GENERATION
// ============================================================================
// Takes Pass 1 structured data and generates personalized narratives using
// the client's own words and emotional anchors. Uses Claude for generation.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// SERVICE DEFINITIONS FOR NARRATIVES
// ============================================================================

const SERVICE_DEFINITIONS: Record<string, {
  name: string;
  transformationPromise: string;
  typicalOutcome: string;
}> = {
  '365_method': {
    name: '365 Alignment Programme',
    transformationPromise: 'From drifting to deliberate. From hoping to planning.',
    typicalOutcome: 'Business owners reclaim their time, reconnect with their purpose, and build a business that serves their life - not the other way around.'
  },
  'management_accounts': {
    name: 'Management Accounts',
    transformationPromise: 'From guessing to knowing. From anxiety to confidence.',
    typicalOutcome: 'Monthly clarity that drives decisions, spots problems early, and gives you the confidence to act.'
  },
  'systems_audit': {
    name: 'Systems Audit',
    transformationPromise: 'From chaos to control. From firefighting to focus.',
    typicalOutcome: 'A business that runs without you being the single point of failure. Systems that scale.'
  },
  'automation': {
    name: 'Automation Services',
    transformationPromise: 'From manual grind to automated growth.',
    typicalOutcome: 'Reclaim hours every week. Eliminate errors. Scale without adding headcount.'
  },
  'fractional_cfo': {
    name: 'Fractional CFO',
    transformationPromise: 'From reactive to strategic. From surviving to thriving.',
    typicalOutcome: 'Board-level financial leadership without the full-time cost. Strategic decisions backed by data.'
  },
  'fractional_coo': {
    name: 'Fractional COO',
    transformationPromise: 'From doing everything to leading everything.',
    typicalOutcome: 'An operations leader who gets things done, develops your team, and frees you to work ON the business.'
  },
  'combined_advisory': {
    name: 'Combined CFO/COO Advisory',
    transformationPromise: 'Complete business transformation. Finance and operations aligned.',
    typicalOutcome: 'The full executive support you need without the full executive cost.'
  },
  'business_advisory': {
    name: 'Business Advisory & Exit Planning',
    transformationPromise: 'From building to transitioning. From hoping to planning.',
    typicalOutcome: 'A clear path to exit on your terms, with maximum value and minimum regret.'
  },
  'benchmarking': {
    name: 'Benchmarking Services',
    transformationPromise: 'From wondering to knowing. From assumption to evidence.',
    typicalOutcome: 'Know exactly where you stand vs. your peers. Spot opportunities and threats before your competitors.'
  }
};

// ============================================================================
// ANTI-AI-SLOP RULES
// ============================================================================

const ANTI_SLOP_RULES = `
WRITING RULES - CRITICAL:

BANNED VOCABULARY (never use):
- Additionally, Furthermore, Moreover (just continue the thought)
- Delve, delving (say: look at, examine, dig into)
- Crucial, pivotal, vital, key (say: important, or show why it matters)
- Leverage (say: use)
- Streamline (say: simplify, speed up)
- Optimize (say: improve)
- Landscape (say: market, situation)
- Ecosystem (say: system, network)
- Synergy, synergistic (describe the actual benefit)
- Paradigm shift (describe the actual change)
- Holistic (say: complete, whole)
- Robust (say: strong, reliable)
- Cutting-edge, state-of-the-art (describe what's actually new)
- Innovative, innovation (show the innovation, don't label it)
- Best-in-class, world-class (be specific about quality)
- Journey (say: process, experience, path)
- Unlock potential (say: enable, allow, make possible)
- Drive results (say: get results, achieve)
- Empower (say: enable, let, help)
- Transform, transformation (describe the actual change)
- Navigate (say: work through, handle, manage)

BANNED SENTENCE STRUCTURES:
- "Not only X but also Y" parallelisms (pick X or Y)
- "It's important to note that..." (just say the thing)
- "In today's [adjective] business environment..." (just make your point)
- "At its core..." (just say what it is)
- "At the end of the day..." (just make your point)
- Starting sentences with "Importantly," or "Notably,"
- "The reality is that..." (just state the reality)
- "It goes without saying..." (then don't say it)

WRITING STYLE:
1. Write like a trusted advisor having a conversation - direct, warm, honest
2. Use the client's EXACT words whenever possible - quote them directly
3. Short paragraphs (2-3 sentences max)
4. Be specific - use numbers, examples, their actual situations
5. Sound human - contractions are good, perfect grammar isn't always necessary
6. Empathy before solutions - acknowledge their reality before offering answers
7. No corporate speak - if your grandmother wouldn't say it, neither should you
`;

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
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
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
        client:practice_members!discovery_engagements_client_id_fkey(id, name, company, email),
        discovery:destination_discovery(*)
      `)
      .eq('id', engagementId)
      .single();

    if (engError || !engagement) {
      throw new Error(`Engagement not found: ${engError?.message}`);
    }

    // Fetch Pass 1 report
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
    const clientName = engagement.client?.name || 'the client';
    const companyName = engagement.client?.company || 'their business';
    const emotionalAnchors = report.emotional_anchors || {};
    const patterns = report.detection_patterns || {};
    const primaryRecs = report.primary_recommendations || [];
    const secondaryRecs = report.secondary_recommendations || [];

    // Build context from notes
    const contextSection = contextNotes?.length 
      ? `\n\nADDITIONAL CONTEXT FROM ADVISOR:\n${contextNotes.map(n => `[${n.note_type}] ${n.title}:\n${n.content}`).join('\n\n')}`
      : '';

    // Build document context
    const docSection = documents?.length
      ? `\n\nRELEVANT DOCUMENTS:\n${documents.map(d => `- ${d.filename} (${d.document_type}): ${d.ai_summary || d.description || 'No summary'}`).join('\n')}`
      : '';

    // Build service narratives request
    const servicesForNarratives = [...primaryRecs, ...secondaryRecs.slice(0, 2)]
      .filter(r => r.recommended)
      .map(r => ({
        code: r.code,
        name: SERVICE_DEFINITIONS[r.code]?.name || r.name,
        score: r.score,
        triggers: r.triggers.slice(0, 5),
        transformationPromise: SERVICE_DEFINITIONS[r.code]?.transformationPromise || '',
        typicalOutcome: SERVICE_DEFINITIONS[r.code]?.typicalOutcome || ''
      }));

    const prompt = `You are an expert business advisor writing a deeply personalized Discovery Report for ${clientName} from ${companyName}.

${ANTI_SLOP_RULES}

============================================================================
CLIENT'S OWN WORDS (Use these VERBATIM in the report - these are their emotional anchors)
============================================================================

THEIR VISION (Tuesday Test - what their ideal future looks like):
"${emotionalAnchors.tuesdayTest || 'Not provided'}"

THEIR MAGIC FIX (What they'd change with unlimited resources):
"${emotionalAnchors.magicFix || 'Not provided'}"

THEIR CORE FRUSTRATION (What frustrates them most):
"${emotionalAnchors.coreFrustration || 'Not provided'}"

THEIR EMERGENCY LOG (What pulled them away recently):
"${emotionalAnchors.emergencyLog || 'Not provided'}"

HOW BUSINESS RELATIONSHIP FEELS:
"${emotionalAnchors.relationshipMirror || 'Not provided'}"

WHAT THEY'VE SACRIFICED:
"${emotionalAnchors.sacrificeList || 'Not provided'}"

THEIR HARD TRUTH:
"${emotionalAnchors.hardTruth || 'Not provided'}"

WHAT THEY SUSPECT ABOUT NUMBERS:
"${emotionalAnchors.suspectedTruth || 'Not provided'}"

OPERATIONAL FRUSTRATION:
"${emotionalAnchors.operationalFrustration || 'Not provided'}"

ANYTHING ELSE THEY SHARED:
"${emotionalAnchors.finalInsight || 'Not provided'}"
${contextSection}
${docSection}

============================================================================
DETECTED PATTERNS
============================================================================
${patterns.burnoutDetected ? `⚠️ BURNOUT PATTERN DETECTED (${patterns.burnoutFlags} indicators): ${patterns.burnoutIndicators?.join(', ')}` : 'No burnout pattern'}
${patterns.capitalRaisingDetected ? `💰 CAPITAL RAISING PATTERN: ${patterns.capitalSignals?.join(', ')}` : 'No capital raising pattern'}
${patterns.lifestyleTransformationDetected ? `🔄 LIFESTYLE TRANSFORMATION PATTERN: ${patterns.lifestyleSignals?.join(', ')}` : 'No lifestyle transformation pattern'}

Urgency Multiplier: ${patterns.urgencyMultiplier}x (Change Readiness: ${report.change_readiness})

============================================================================
SERVICE RECOMMENDATIONS (Write narratives for these)
============================================================================
${JSON.stringify(servicesForNarratives, null, 2)}

============================================================================
YOUR TASK
============================================================================

Generate a JSON response with the following structure. Use the client's EXACT words as quotes. Be specific to their situation. Sound like a trusted advisor, not a corporate brochure.

{
  "headline": "A punchy, attention-grabbing headline that speaks to their specific situation (15 words max)",
  
  "executiveSummary": "2-3 paragraphs that capture the essence of what we heard, what it means, and what we recommend. Use their words.",
  
  "visionNarrative": "A narrative about their vision - weave in their Tuesday Test answer. Show we heard their dreams.",
  
  "realityCheckNarrative": "The gap between where they are and where they want to be. Use their frustrations and sacrifices as evidence.",
  
  "blindSpotsNarrative": "What they might not be seeing clearly. Handle sensitively - these are vulnerabilities they shared.",
  
  "transformationPath": "How we bridge the gap. The journey from here to their Tuesday Test vision.",
  
  "whatWeHeard": "A 'We heard you say...' section with 5-7 bullet points of their most powerful quotes/statements",
  
  "whatItMeans": "Our interpretation - what these patterns suggest about their business and life",
  
  "whatChanges": "The transformation promise - what shifts when we work together",
  
  "serviceNarratives": [
    {
      "serviceCode": "service_code_here",
      "serviceName": "Service Name",
      "whyThisMatters": "Why this service specifically addresses their situation - use their words",
      "whatWeDo": "Specific actions/deliverables tailored to their needs",
      "expectedOutcome": "What changes for them - be specific to their stated goals",
      "quoteTieIn": "A direct quote from their responses that this service addresses"
    }
  ],
  
  "nextSteps": "3-5 specific next steps, personalized to their urgency level and readiness",
  
  "conversationStarters": [
    "Question 1 to discuss in discovery call",
    "Question 2 based on their blind spots",
    "Question 3 about their vision"
  ]
}

Remember: This person shared vulnerable truths with us. Honor that with a response that shows we truly listened.`;

    // Call Claude API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;

    // Extract JSON from response
    let narratives;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        narratives = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      throw new Error(`Failed to parse LLM response: ${parseError.message}`);
    }

    const processingTime = Date.now() - startTime;
    const tokensUsed = anthropicData.usage?.input_tokens + anthropicData.usage?.output_tokens || 0;
    const estimatedCost = (anthropicData.usage?.input_tokens || 0) * 0.003 / 1000 + (anthropicData.usage?.output_tokens || 0) * 0.015 / 1000;

    // Update report with Pass 2 results
    await supabase
      .from('discovery_reports')
      .update({
        status: 'generated',
        headline: narratives.headline,
        executive_summary: narratives.executiveSummary,
        vision_narrative: narratives.visionNarrative,
        reality_check_narrative: narratives.realityCheckNarrative,
        blind_spots_narrative: narratives.blindSpotsNarrative,
        transformation_path: narratives.transformationPath,
        service_narratives: narratives.serviceNarratives,
        what_we_heard: narratives.whatWeHeard,
        what_it_means: narratives.whatItMeans,
        what_changes: narratives.whatChanges,
        next_steps: narratives.nextSteps,
        conversation_starters: narratives.conversationStarters,
        llm_model: 'claude-sonnet-4-20250514',
        llm_tokens_used: tokensUsed,
        llm_cost: estimatedCost,
        generation_time_ms: processingTime,
        prompt_version: 'v2.0-pass2',
        pass2_completed_at: new Date().toISOString(),
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('engagement_id', engagementId);

    // Update engagement status
    await supabase
      .from('discovery_engagements')
      .update({ 
        status: 'pass2_complete', 
        pass2_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', engagementId);

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        headline: narratives.headline,
        executiveSummary: narratives.executiveSummary,
        serviceNarrativesCount: narratives.serviceNarratives?.length || 0,
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
            status: 'pass1_complete',  // Revert to pass1_complete on failure
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

