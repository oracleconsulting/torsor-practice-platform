/* COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md */
// ============================================================================
// PATTERN DETECTION EDGE FUNCTION
// ============================================================================
// Stage 2 of the Discovery Analysis Pipeline
// Performs deep pattern detection on discovery assessments to identify:
// - Destination clarity (qualitative assessment)
// - Contradictions between responses
// - Hidden signals (what they're NOT saying)
// - Emotional state mapping
// - True priority identification
// - Capital raising signals
// - Lifestyle transformation signals
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// INLINE COST TRACKING (to avoid module import issues)
// ============================================================================

interface LLMUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  executionTimeMs: number;
}

const PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'anthropic/claude-opus-4.5': { inputPer1M: 15.00, outputPer1M: 75.00 },
  'anthropic/claude-sonnet-4-20250514': { inputPer1M: 3.00, outputPer1M: 15.00 },
  'anthropic/claude-3.5-haiku-20241022': { inputPer1M: 0.80, outputPer1M: 4.00 },
};

function calculateCost(usage: LLMUsage): number {
  const pricing = PRICING[usage.model];
  if (!pricing) return 0;
  return (usage.inputTokens / 1_000_000) * pricing.inputPer1M + 
         (usage.outputTokens / 1_000_000) * pricing.outputPer1M;
}

function extractUsageFromResponse(response: any): { inputTokens: number; outputTokens: number } {
  const usage = response?.usage || {};
  return {
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0
  };
}

async function trackLLMExecution(supabase: any, record: any): Promise<void> {
  const cost = calculateCost(record);
  try {
    await supabase.from('llm_execution_history').insert({
      function_name: record.functionName,
      model: record.model,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      cost_usd: cost,
      execution_time_ms: record.executionTimeMs,
      entity_type: record.entityType,
      entity_id: record.entityId,
      success: record.success,
      error_message: record.error,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Error tracking LLM execution:', e);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Use Claude Sonnet 4.5 for pattern detection (standard tier)
const MODEL = 'anthropic/claude-sonnet-4-20250514';

// ============================================================================
// PATTERN DETECTION PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert business psychologist analyzing a discovery assessment. Your task is to identify patterns, contradictions, and hidden insights that surface-level analysis would miss.

You have deep expertise in:
- Business owner psychology and stress indicators
- Identifying disconnects between stated and actual priorities
- Detecting burnout, imposter syndrome, and relationship strain signals
- Understanding capital raising and investment readiness signals
- Recognizing identity transformation desires (e.g., operator to investor)

Your analysis must be:
- Evidence-based: Quote specific responses to support every finding
- Nuanced: Look for what they're NOT saying as much as what they ARE
- Psychologically informed: Read between the lines
- Commercially relevant: Identify signals that indicate service opportunities`;

function buildUserPrompt(responses: Record<string, any>, clientName: string): string {
  return `Analyze this discovery assessment for ${clientName} and identify patterns, contradictions, and hidden signals.

## ASSESSMENT RESPONSES
${JSON.stringify(responses, null, 2)}

## ANALYSIS REQUIREMENTS

### 1. DESTINATION CLARITY ASSESSMENT
Score 1-10 based on the QUALITATIVE richness of their vision, not just whether they answered:
- 9-10: Vivid, specific, time-anchored vision with emotional detail (e.g., specific wake time, named activities, described feelings)
- 7-8: Clear direction with some specificity
- 5-6: General goals but lacking specificity  
- 3-4: Vague aspirations
- 1-2: No clear vision or contradictory signals

IMPORTANT: A detailed, time-anchored description of a future day is a 9-10 score.
Evaluate the dd_five_year_picture and dd_five_year_story responses specifically.

### 2. CONTRADICTION DETECTION
Identify contradictions between responses. Examples:
- High team confidence BUT key person risk = "disaster"
- Claims to sleep fine BUT works 60-70 hours
- "Completely ready" for change BUT multiple blockers identified
- Strong delegation BUT "I sometimes take things back"

### 3. HIDDEN SIGNALS
What are they NOT saying that's significant?
- Topics avoided or deflected
- Defensive language patterns
- Unusually short or long responses
- Topics they circle back to repeatedly

### 4. EMOTIONAL STATE MAPPING
Assess their current emotional state:

**Stress Indicators:**
- Hours worked (50+ = elevated, 60+ = high, 70+ = very high)
- Time since real break
- Firefighting vs strategic time ratio
- Sleep disruptions mentioned

**Burnout Risk:**
- Working hours + no breaks + high stress topics = high risk
- "I've never done that" for breaks = red flag
- Spouse tension mentioned = relationship strain

**Imposter Syndrome:**
- Look for: "huge amounts of imposter syndrome" or similar
- Self-doubt indicators
- Gap between achievement and self-perception

**Relationship Strain:**
- External view questions about spouse/partner
- Tension mentions
- Work-life balance struggles

### 5. TRUE PRIORITY IDENTIFICATION
Compare stated priority (dd_priority_focus, dd_honest_priority) with:
- Where they spent the most words/emotion
- What they keep circling back to
- The underlying need behind stated goals

### 6. CAPITAL RAISING DETECTION
Look for investment/capital signals:
- Explicit mentions: "raise capital", "investors", "funding"
- Growth blocker = "Don't have the capital"
- Exit readiness = "investment-ready"
- Had professional valuation
- Mentions of scaling faster, going faster

### 7. LIFESTYLE TRANSFORMATION DETECTION
Look for identity transition desires:
- Five-year vision describes different ROLE (investor, board member, advisor)
- Mentions of "investment CEOs", portfolio management
- Desire to step back from operations
- Success definition = business running without them

## OUTPUT FORMAT
Return a valid JSON object with this exact structure:

{
  "destinationClarity": {
    "score": <number 1-10>,
    "rationale": "<detailed explanation with quotes>",
    "visionStrengths": ["<specific strength with evidence>"],
    "visionGaps": ["<specific gap>"]
  },
  "contradictions": [
    {
      "responses": ["<response field 1>", "<response field 2>"],
      "nature": "<what the contradiction reveals>",
      "significance": "high|medium|low"
    }
  ],
  "hiddenSignals": [
    {
      "signal": "<what's being signaled>",
      "evidence": "<quote or pattern that shows this>",
      "implication": "<what this means for service recommendations>"
    }
  ],
  "emotionalState": {
    "stressLevel": "high|medium|low",
    "burnoutRisk": "high|medium|low",
    "imposterSyndrome": <boolean>,
    "relationshipStrain": <boolean>,
    "evidence": ["<specific quote or indicator>"]
  },
  "truePriority": {
    "stated": "<what they said their priority is>",
    "actual": "<what their responses actually suggest>",
    "gap": "<explanation of the disconnect, if any>"
  },
  "capitalRaisingSignals": {
    "detected": <boolean>,
    "evidence": ["<specific quote or indicator>"],
    "urgency": "high|medium|low|null"
  },
  "lifestyleTransformation": {
    "detected": <boolean>,
    "currentIdentity": "<who they are now>",
    "desiredIdentity": "<who they want to become>",
    "transformationType": "<e.g., operator_to_investor, founder_to_chairperson>",
    "evidence": ["<specific quote>"]
  }
}

CRITICAL: Return ONLY the JSON object, no additional text or markdown formatting.`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const { assessmentId, clientId } = await req.json();

    if (!assessmentId && !clientId) {
      throw new Error('Either assessmentId or clientId is required');
    }

    // ========================================================================
    // 1. FETCH ASSESSMENT DATA
    // ========================================================================

    let discovery;
    if (assessmentId) {
      const { data, error } = await supabase
        .from('destination_discovery')
        .select('*, practice_members(name, client_company)')
        .eq('id', assessmentId)
        .single();
      
      if (error || !data) {
        throw new Error(`Assessment not found: ${assessmentId}`);
      }
      discovery = data;
    } else {
      const { data, error } = await supabase
        .from('destination_discovery')
        .select('*, practice_members(name, client_company)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        throw new Error(`No discovery assessment found for client: ${clientId}`);
      }
      discovery = data;
    }

    const responses = discovery.responses || {};
    const clientName = discovery.practice_members?.name || 'the client';
    const clientCompany = discovery.practice_members?.client_company || '';

    console.log(`Analyzing patterns for ${clientName} (${clientCompany}), ${Object.keys(responses).length} responses`);

    // ========================================================================
    // 2. CALL AI FOR PATTERN DETECTION
    // ========================================================================

    const userPrompt = buildUserPrompt(responses, clientName);

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Pattern Detection'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.3, // Lower temperature for more consistent analysis
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`AI analysis failed: ${openrouterResponse.status}`);
    }

    const openrouterData = await openrouterResponse.json();
    const usage = extractUsageFromResponse(openrouterData);
    inputTokens = usage.inputTokens;
    outputTokens = usage.outputTokens;
    
    const analysisText = openrouterData.choices?.[0]?.message?.content || '';
    if (!analysisText) {
      throw new Error('Empty response from AI');
    }

    console.log('Pattern analysis response length:', analysisText.length);

    // ========================================================================
    // 3. PARSE RESPONSE
    // ========================================================================

    let patterns;
    try {
      // Remove any markdown code blocks if present
      let jsonString = analysisText;
      const codeBlockMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      }
      
      // Find JSON object
      if (!jsonString.startsWith('{')) {
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        }
      }
      
      patterns = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse pattern analysis:', parseError);
      console.log('Raw response:', analysisText.substring(0, 1000));
      throw new Error('Failed to parse AI pattern analysis response');
    }

    // ========================================================================
    // 4. SAVE TO DATABASE
    // ========================================================================

    const executionTimeMs = Date.now() - startTime;
    const costUsd = calculateCost({ model: MODEL, inputTokens, outputTokens, executionTimeMs });

    const patternRecord = {
      assessment_id: discovery.id,
      client_id: discovery.client_id,
      practice_id: discovery.practice_id,
      
      // Destination clarity
      destination_clarity_score: patterns.destinationClarity?.score || 5,
      destination_clarity_rationale: patterns.destinationClarity?.rationale || '',
      vision_strengths: patterns.destinationClarity?.visionStrengths || [],
      vision_gaps: patterns.destinationClarity?.visionGaps || [],
      
      // Contradictions
      contradictions: patterns.contradictions || [],
      
      // Hidden signals
      hidden_signals: patterns.hiddenSignals || [],
      
      // Emotional state
      stress_level: patterns.emotionalState?.stressLevel || 'medium',
      burnout_risk: patterns.emotionalState?.burnoutRisk || 'medium',
      imposter_syndrome: patterns.emotionalState?.imposterSyndrome || false,
      relationship_strain: patterns.emotionalState?.relationshipStrain || false,
      emotional_evidence: patterns.emotionalState?.evidence || [],
      
      // True priority
      stated_priority: patterns.truePriority?.stated || '',
      actual_priority: patterns.truePriority?.actual || '',
      priority_gap: patterns.truePriority?.gap || '',
      
      // Capital raising
      capital_raising_detected: patterns.capitalRaisingSignals?.detected || false,
      capital_raising_evidence: patterns.capitalRaisingSignals?.evidence || [],
      capital_raising_urgency: patterns.capitalRaisingSignals?.urgency || null,
      
      // Lifestyle transformation
      lifestyle_transformation_detected: patterns.lifestyleTransformation?.detected || false,
      transformation_type: patterns.lifestyleTransformation?.transformationType || null,
      identity_transition: patterns.lifestyleTransformation ? {
        currentIdentity: patterns.lifestyleTransformation.currentIdentity,
        desiredIdentity: patterns.lifestyleTransformation.desiredIdentity,
        gapAnalysis: patterns.lifestyleTransformation.evidence?.join('; ')
      } : {},
      
      // Metadata
      model_used: MODEL,
      tokens_used: inputTokens + outputTokens,
      cost_usd: costUsd,
      execution_time_ms: executionTimeMs
    };

    // Upsert - update if exists, insert if not
    const { data: savedPattern, error: saveError } = await supabase
      .from('assessment_patterns')
      .upsert(patternRecord, {
        onConflict: 'assessment_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving pattern analysis:', saveError);
      // Try insert if upsert fails
      const { data: insertedPattern, error: insertError } = await supabase
        .from('assessment_patterns')
        .insert(patternRecord)
        .select()
        .single();
      
      if (insertError) {
        console.error('Insert also failed:', insertError);
      }
    }

    // Track LLM execution
    await trackLLMExecution(supabase, {
      functionName: 'detect-assessment-patterns',
      model: MODEL,
      inputTokens,
      outputTokens,
      executionTimeMs,
      entityType: 'discovery_assessment',
      entityId: discovery.id,
      success: true
    });

    console.log(`Pattern analysis complete: Clarity ${patterns.destinationClarity?.score}/10, ` +
      `${patterns.contradictions?.length || 0} contradictions, ` +
      `Capital raising: ${patterns.capitalRaisingSignals?.detected}, ` +
      `Cost: $${costUsd.toFixed(4)}`);

    // ========================================================================
    // 5. RETURN RESULTS
    // ========================================================================

    return new Response(JSON.stringify({
      success: true,
      assessmentId: discovery.id,
      clientId: discovery.client_id,
      patterns: {
        destinationClarity: patterns.destinationClarity,
        contradictions: patterns.contradictions,
        hiddenSignals: patterns.hiddenSignals,
        emotionalState: patterns.emotionalState,
        truePriority: patterns.truePriority,
        capitalRaisingSignals: patterns.capitalRaisingSignals,
        lifestyleTransformation: patterns.lifestyleTransformation
      },
      metadata: {
        model: MODEL,
        tokensUsed: inputTokens + outputTokens,
        costUsd: costUsd,
        executionTimeMs
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    console.error('Error detecting patterns:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
