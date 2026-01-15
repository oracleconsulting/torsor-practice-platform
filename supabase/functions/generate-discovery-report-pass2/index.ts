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
// ============================================================================

const SERVICE_DETAILS: Record<string, {
  name: string;
  price: string;
  priceType: 'monthly' | 'one-time' | 'annual';
  outcome: string;  // The destination, not the service
}> = {
  'management_accounts': {
    name: 'Monthly Management Accounts',
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
    name: '365 Alignment Programme',
    price: '£2,000',
    priceType: 'monthly',
    outcome: "You'll Reclaim Your Purpose"
  },
  'automation': {
    name: 'Automation Services',
    price: '£5,000',
    priceType: 'one-time',
    outcome: "Your Systems Will Talk To Each Other"
  },
  'fractional_cfo': {
    name: 'Fractional CFO',
    price: '£3,000',
    priceType: 'monthly',
    outcome: "You'll Have Strategic Financial Leadership"
  },
  'fractional_coo': {
    name: 'Fractional COO',
    price: '£4,000',
    priceType: 'monthly',
    outcome: "You'll Become Optional"
  },
  'combined_advisory': {
    name: 'Combined CFO/COO Advisory',
    price: '£6,000',
    priceType: 'monthly',
    outcome: "Complete Business Transformation"
  },
  'business_advisory': {
    name: 'Business Advisory & Exit Planning',
    price: '£2,500',
    priceType: 'monthly',
    outcome: "You'll Have A Clear Exit Path"
  },
  'benchmarking': {
    name: 'Benchmarking Services',
    price: '£1,200',
    priceType: 'one-time',
    outcome: "You'll Know Where You Stand"
  }
};

// ============================================================================
// ANTI-AI-SLOP RULES (Critical for authentic output)
// ============================================================================

const ANTI_SLOP_RULES = `
WRITING RULES - CRITICAL:

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
- Paradigm shift (describe the actual change)
- Holistic (say: complete, whole)
- Robust (say: strong, reliable)
- Cutting-edge, state-of-the-art (describe what's new)
- Innovative, innovation (show it, don't label it)
- Best-in-class, world-class (be specific)
- Journey (say: process, path)
- Unlock potential (say: enable, allow)
- Drive results (say: get results)
- Empower (say: enable, help)
- Transform (describe the actual change)
- Navigate (say: work through, handle)
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
- "The reality is that..." (just state it)
- "It goes without saying..." (don't say it)

WRITING STYLE:
1. Write like you're writing to a friend going through a hard time
2. Use their EXACT words - quote them liberally (8+ times minimum)
3. Short paragraphs (2-3 sentences max)
4. Be specific - use their numbers, their examples, their situations
5. Sound human - contractions, imperfect grammar, conversational
6. Empathy before solutions - name their pain before offering hope
7. Personal anchors - reference spouse names, kids' ages, specific details they shared
8. Services as footnotes - always headline the OUTCOME, service is just how they get there
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
    const clientName = engagement.client?.name?.split(' ')[0] || 'they'; // First name only
    const companyName = engagement.client?.company || 'their business';
    const emotionalAnchors = report.emotional_anchors || {};
    const patterns = report.detection_patterns || {};
    const primaryRecs = report.primary_recommendations || [];
    const secondaryRecs = report.secondary_recommendations || [];

    // Build recommended services with pricing
    const recommendedServices = [...primaryRecs, ...secondaryRecs]
      .filter(r => r.recommended)
      .map(r => ({
        code: r.code,
        ...SERVICE_DETAILS[r.code],
        score: r.score,
        triggers: r.triggers
      }));

    // Build context from notes
    const contextSection = contextNotes?.length 
      ? `\n\nADDITIONAL CONTEXT FROM ADVISOR:\n${contextNotes.map(n => `[${n.note_type}] ${n.title}:\n${n.content}`).join('\n\n')}`
      : '';

    // Build document context
    const docSection = documents?.length
      ? `\n\nRELEVANT DOCUMENTS:\n${documents.map(d => `- ${d.filename} (${d.document_type}): ${d.ai_summary || d.description || 'No summary'}`).join('\n')}`
      : '';

    const prompt = `You are writing a Destination-Focused Discovery Report for ${clientName} from ${companyName}.

${ANTI_SLOP_RULES}

============================================================================
THE FUNDAMENTAL PRINCIPLE
============================================================================
We're travel agents selling holidays, not airlines selling seats.

${clientName} doesn't buy "Management Accounts" - they buy knowing which customers are profitable.
They don't buy "Systems Audit" - they buy a week without being the only one who can fix things.
They don't buy "365 Method" - they buy leaving at 4pm to pick up the kids.

HEADLINE the destination. Service is just how they get there.

============================================================================
CLIENT'S OWN WORDS (Use these VERBATIM - these are gold)
============================================================================

THEIR VISION (The Tuesday Test - what their ideal future looks like):
"${emotionalAnchors.tuesdayTest || 'Not provided'}"

THEIR MAGIC FIX (What they'd change first):
"${emotionalAnchors.magicFix || 'Not provided'}"

THEIR CORE FRUSTRATION:
"${emotionalAnchors.coreFrustration || 'Not provided'}"

THEIR EMERGENCY LOG (What pulled them away recently):
"${emotionalAnchors.emergencyLog || 'Not provided'}"

HOW THE BUSINESS RELATIONSHIP FEELS:
"${emotionalAnchors.relationshipMirror || 'Not provided'}"

WHAT THEY'VE SACRIFICED:
"${emotionalAnchors.sacrificeList || 'Not provided'}"

THEIR HARD TRUTH:
"${emotionalAnchors.hardTruth || 'Not provided'}"

WHAT THEY SUSPECT ABOUT THE NUMBERS:
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
${patterns.burnoutDetected ? `⚠️ BURNOUT DETECTED (${patterns.burnoutFlags} indicators): ${patterns.burnoutIndicators?.join(', ')}` : 'No burnout pattern'}
${patterns.capitalRaisingDetected ? `💰 CAPITAL RAISING: ${patterns.capitalSignals?.join(', ')}` : 'No capital raising pattern'}
${patterns.lifestyleTransformationDetected ? `🔄 LIFESTYLE TRANSFORMATION: ${patterns.lifestyleSignals?.join(', ')}` : 'No lifestyle pattern'}

Urgency: ${patterns.urgencyMultiplier}x (Change Readiness: ${report.change_readiness})

============================================================================
RECOMMENDED SERVICES (write these as footnotes, not headlines)
============================================================================
${JSON.stringify(recommendedServices, null, 2)}

============================================================================
YOUR TASK - Generate a 5-page Destination-Focused Report
============================================================================

Return a JSON object with this exact structure:

{
  "page1_destination": {
    "headerLine": "The Tuesday You're Building Towards",
    "visionVerbatim": "Their Tuesday Test answer, edited slightly for flow but keeping their exact words. Multiple paragraphs. Include specific details like 'leaving at 4pm', 'picking kids up from football', spouse names, etc.",
    "destinationClarityScore": 8,
    "clarityExplanation": "One sentence about how clear their vision is"
  },
  
  "page2_gaps": {
    "headerLine": "The Gap Between Here and There",
    "openingLine": "A punchy one-liner that names the tension. e.g. 'You're building for freedom but operating in a prison of your own making.'",
    "gaps": [
      {
        "title": "You Can't Leave",
        "pattern": "Their exact words showing this pattern - quote them directly",
        "costs": [
          "30+ hours a week trapped in operations",
          "No real holidays in years",
          "A business that's unsellable without you"
        ],
        "shiftRequired": "What needs to change - one sentence in plain language"
      }
    ]
  },
  
  "page3_journey": {
    "headerLine": "From Here to the 4pm Pickup",
    "timelineLabel": {
      "now": "Prison",
      "month3": "Clarity",
      "month6": "Handover",
      "month12": "Freedom"
    },
    "phases": [
      {
        "timeframe": "Month 1-3",
        "headline": "You'll Know Your Numbers",
        "whatChanges": [
          "You'll know which jobs make money and which don't",
          "Cash flow stops being a surprise",
          "You stop subsidising customers you shouldn't"
        ],
        "feelsLike": "The fog lifts. You stop guessing whether you're making money or just turning it over. The 3am cash flow anxiety starts to fade.",
        "outcome": "Confident financial decisions based on data, not gut feel.",
        "enabledBy": "Monthly Management Accounts",
        "price": "£650/month"
      }
    ]
  },
  
  "page4_numbers": {
    "headerLine": "The Investment in Your Tuesday",
    "costOfStaying": {
      "labourInefficiency": "£50,000 - £80,000",
      "marginLeakage": "Unknown (you suspect significant)",
      "yourTimeWasted": "1,500+ hours/year",
      "businessValueImpact": "Severely discounted without you"
    },
    "personalCost": "Another year of 70-hour weeks. Another year of missed football practice. Your kids are [X] and [Y]. The window is closing.",
    "investment": [
      {
        "phase": "Months 1-3",
        "amount": "£1,950",
        "whatYouGet": "Numbers you can use"
      }
    ],
    "totalYear1": "£11,800",
    "totalYear1Label": "Foundation for freedom",
    "returns": {
      "conservative": {
        "labourGains": "£25,000",
        "marginRecovery": "£10,000",
        "timeReclaimed": "£15,000",
        "total": "£50,000"
      },
      "realistic": {
        "labourGains": "£40,000",
        "marginRecovery": "£25,000",
        "timeReclaimed": "£30,000",
        "total": "£95,000"
      }
    },
    "paybackPeriod": "3-6 months",
    "realReturn": "The 4pm pickup. The holiday you actually take. The business that runs without you in the middle."
  },
  
  "page5_nextSteps": {
    "headerLine": "Starting The Journey",
    "thisWeek": {
      "action": "30-minute call to talk through this report",
      "tone": "Not a sales pitch. A conversation about what matters most and where to start. If it's not right for you, we'll tell you."
    },
    "firstStep": {
      "recommendation": "Start with the numbers",
      "why": "You can't fix what you can't see. Monthly management accounts give you the visibility to make every other decision with confidence.",
      "theirWordsEcho": "A quote from their assessment that ties to this recommendation",
      "simpleCta": "£650/month to start seeing clearly."
    },
    "theAsk": "A 2-3 sentence closing that references their stated desire for action/momentum, acknowledges past failures, and offers the practical path forward.",
    "closingLine": "Let's talk this week."
  },
  
  "meta": {
    "quotesUsed": ["Array of 8-10 direct quotes used throughout the report"],
    "personalAnchors": ["Kids ages", "Spouse name", "Specific situations mentioned"],
    "urgencyLevel": "high/medium/low based on patterns detected"
  }
}

CRITICAL REQUIREMENTS:
1. Use their EXACT words at least 8 times (direct quotes)
2. Include personal anchors (spouse name, kids ages if mentioned)
3. Services ONLY appear as footnotes in "enabledBy" fields
4. Never headline a service name
5. Timeline phases must FEEL different, not just list features
6. The "personalCost" in page 4 must include specific personal details they shared
7. ROI numbers should be realistic for their business size
8. Close with their words echoed back`;

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

    // Update report with Pass 2 results - new destination-focused structure
    await supabase
      .from('discovery_reports')
      .update({
        status: 'generated',
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
        // Metadata
        llm_model: 'claude-sonnet-4-20250514',
        llm_tokens_used: tokensUsed,
        llm_cost: estimatedCost,
        generation_time_ms: processingTime,
        prompt_version: 'v3.0-destination-focused',
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
        destinationReport: narratives,
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
