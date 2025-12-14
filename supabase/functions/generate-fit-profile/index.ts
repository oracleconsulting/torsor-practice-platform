// ============================================================================
// EDGE FUNCTION: generate-fit-profile
// ============================================================================
// Triggered: Immediately after Part 1 (Life Design) is completed
// Purpose: Analyze responses to determine fit and create personalized message
// Output: Fit assessment, journey recommendation, personalized insights
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// FIT ANALYSIS
// ============================================================================

interface FitSignals {
  readinessScore: number;
  commitmentScore: number;
  clarityScore: number;
  urgencyScore: number;
  coachabilityScore: number;
  overallFit: 'excellent' | 'good' | 'needs_discussion' | 'not_ready';
}

function analyzeFitSignals(part1: Record<string, any>): FitSignals {
  let readinessScore = 50;
  let commitmentScore = 50;
  let clarityScore = 50;
  let urgencyScore = 50;
  let coachabilityScore = 50;

  // ---- READINESS SIGNALS ----
  
  // Tuesday test length and detail (longer = more thought = more ready)
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  if (tuesdayTest.length > 200) readinessScore += 20;
  else if (tuesdayTest.length > 100) readinessScore += 10;
  else if (tuesdayTest.length < 30) readinessScore -= 15;

  // Specific time mentions in tuesday test (concrete thinking)
  if (/\d{1,2}(?::\d{2})?\s*(?:am|pm)/i.test(tuesdayTest)) readinessScore += 10;

  // Emergency log mentions (awareness of problems)
  const emergencyLog = part1.emergency_log || '';
  if (emergencyLog.length > 50) readinessScore += 10;

  // ---- COMMITMENT SIGNALS ----

  // Time commitment
  const commitment = part1.commitment_hours || '';
  if (commitment.includes('20+') || commitment.includes('20 hours')) commitmentScore += 25;
  else if (commitment.includes('15-20') || commitment.includes('15 hours')) commitmentScore += 15;
  else if (commitment.includes('10-15')) commitmentScore += 5;
  else if (commitment.includes('5-10') || commitment.includes('less')) commitmentScore -= 15;

  // Sacrifices acknowledged (realistic expectations)
  const sacrifices = part1.sacrifices || [];
  if (sacrifices.length >= 3) commitmentScore += 15;
  else if (sacrifices.length >= 1) commitmentScore += 5;
  else commitmentScore -= 10;

  // Income investment willingness (implied by desired vs current gap)
  const currentIncome = parseIncome(part1.current_income);
  const desiredIncome = parseIncome(part1.desired_income);
  if (desiredIncome > currentIncome * 2) commitmentScore += 10; // Ambitious
  if (desiredIncome > 0 && currentIncome > 0) commitmentScore += 5; // Both specified

  // ---- CLARITY SIGNALS ----

  // 10-year vision clarity
  const tenYearVision = part1.ten_year_vision || '';
  if (tenYearVision.length > 100) clarityScore += 20;
  else if (tenYearVision.length > 50) clarityScore += 10;
  else if (tenYearVision.length < 20 && tenYearVision.length > 0) clarityScore -= 10;

  // Relationship mirror depth (self-awareness)
  const relationshipMirror = part1.relationship_mirror || '';
  if (relationshipMirror.length > 75) clarityScore += 15;
  if (relationshipMirror.toLowerCase().includes('feel')) clarityScore += 5;

  // Danger zone awareness
  const dangerZone = part1.danger_zone || '';
  if (dangerZone.length > 30) clarityScore += 10;

  // ---- URGENCY SIGNALS ----

  // Family feedback (external pressure)
  const familyFeedback = part1.family_feedback || '';
  if (familyFeedback.length > 50) urgencyScore += 15;
  if (familyFeedback.toLowerCase().includes('worried') || 
      familyFeedback.toLowerCase().includes('concern') ||
      familyFeedback.toLowerCase().includes('never see')) urgencyScore += 10;

  // Money worry intensity
  const moneyWorry = part1.money_worry || '';
  if (moneyWorry.length > 50) urgencyScore += 10;
  if (moneyWorry.toLowerCase().includes('keep me up') ||
      moneyWorry.toLowerCase().includes('cant sleep') ||
      moneyWorry.toLowerCase().includes("can't sleep")) urgencyScore += 15;

  // Two week break impact (business dependency)
  const twoWeekBreak = part1.two_week_break_impact || '';
  if (twoWeekBreak.toLowerCase().includes('disaster') ||
      twoWeekBreak.toLowerCase().includes('collapse') ||
      twoWeekBreak.toLowerCase().includes('stop')) urgencyScore += 15;

  // ---- COACHABILITY SIGNALS ----

  // Help fears (willingness to be vulnerable)
  const helpFears = part1.help_fears || '';
  if (helpFears.length > 30) coachabilityScore += 15; // Acknowledged fears = self-aware
  if (helpFears.toLowerCase().includes('control') ||
      helpFears.toLowerCase().includes('trust')) coachabilityScore += 5; // Knows their blockers

  // Last excitement (still has passion)
  const lastExcitement = part1.last_excitement || '';
  if (lastExcitement.length > 30) coachabilityScore += 10;

  // Secret pride (has strengths to build on)
  const secretPride = part1.secret_pride || '';
  if (secretPride.length > 30) coachabilityScore += 10;

  // Magic away task (problem-focused vs victim)
  const magicAway = part1.magic_away_task || '';
  if (magicAway.length > 20) coachabilityScore += 5;

  // Normalize scores to 0-100
  readinessScore = Math.max(0, Math.min(100, readinessScore));
  commitmentScore = Math.max(0, Math.min(100, commitmentScore));
  clarityScore = Math.max(0, Math.min(100, clarityScore));
  urgencyScore = Math.max(0, Math.min(100, urgencyScore));
  coachabilityScore = Math.max(0, Math.min(100, coachabilityScore));

  // Calculate overall fit
  const avgScore = (readinessScore + commitmentScore + clarityScore + urgencyScore + coachabilityScore) / 5;
  
  let overallFit: FitSignals['overallFit'];
  if (avgScore >= 70 && commitmentScore >= 60) overallFit = 'excellent';
  else if (avgScore >= 55 && commitmentScore >= 50) overallFit = 'good';
  else if (avgScore >= 40 || (urgencyScore >= 70 && coachabilityScore >= 60)) overallFit = 'needs_discussion';
  else overallFit = 'not_ready';

  return {
    readinessScore,
    commitmentScore,
    clarityScore,
    urgencyScore,
    coachabilityScore,
    overallFit
  };
}

function parseIncome(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = str.replace(/[£,\s]/g, '').replace(/k$/i, '000');
  return parseInt(cleaned) || 0;
}

// ============================================================================
// FIT MESSAGE GENERATION
// ============================================================================

async function generateFitMessage(part1: Record<string, any>, signals: FitSignals): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  
  const userName = part1.full_name || 'there';
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  const relationshipMirror = part1.relationship_mirror || '';
  const familyFeedback = part1.family_feedback || '';
  const dangerZone = part1.danger_zone || '';
  const secretPride = part1.secret_pride || '';
  const helpFears = part1.help_fears || '';
  const commitment = part1.commitment_hours || '';

  // If no OpenRouter key, use template-based generation
  if (!openRouterKey) {
    return generateTemplateFitMessage(part1, signals);
  }

  const prompt = `You are James, a warm but direct business advisor who has just received Part 1 (Life Design) responses from ${userName}. You need to write a personalized fit message that makes them feel understood and excited about the next step.

THEIR RESPONSES:
- Tuesday Test/90-Day Fantasy: "${tuesdayTest}"
- How business feels: "${relationshipMirror}"
- Family feedback: "${familyFeedback}"
- Danger zone: "${dangerZone}"
- Secret pride: "${secretPride}"
- Help fears: "${helpFears}"
- Time commitment: "${commitment}"

FIT ANALYSIS:
- Readiness: ${signals.readinessScore}/100
- Commitment: ${signals.commitmentScore}/100
- Clarity: ${signals.clarityScore}/100
- Urgency: ${signals.urgencyScore}/100
- Coachability: ${signals.coachabilityScore}/100
- Overall: ${signals.overallFit}

Write a message that:
1. Opens by reflecting back something specific they said that shows you GET them
2. Acknowledges where they are without judgment
3. Shows you understand their fears about getting help
4. Builds confidence by referencing their secret pride
5. Creates clarity about what comes next
6. Ends with energy and forward momentum

Keep it warm, personal, and under 400 words. Use their exact words where impactful.

Return JSON:
{
  "headline": "Short, punchy headline for their journey",
  "openingReflection": "2-3 sentences showing you understood their Tuesday Test/relationship with business",
  "acknowledgment": "2-3 sentences validating where they are",
  "strengthSpotlight": "1-2 sentences highlighting their secret pride or what you see in them",
  "fearAddress": "1-2 sentences addressing their help fears directly",
  "nextStepClarity": "2-3 sentences explaining Part 2 and what happens after",
  "closingEnergy": "1-2 sentences of momentum and encouragement",
  "callToAction": "Clear, specific next step"
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor 365 Fit Profile'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 2000,
        temperature: 0.8,
        messages: [
          { 
            role: 'system', 
            content: 'You write warm, personal messages that make founders feel truly understood. Use their exact words. Be encouraging but honest.' 
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      console.error('OpenRouter error, using template');
      return generateTemplateFitMessage(part1, signals);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return generateTemplateFitMessage(part1, signals);
    }
    
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch (e) {
    console.error('LLM error:', e);
    return generateTemplateFitMessage(part1, signals);
  }
}

function generateTemplateFitMessage(part1: Record<string, any>, signals: FitSignals): any {
  const userName = part1.full_name?.split(' ')[0] || 'there';
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  const secretPride = part1.secret_pride || '';
  const helpFears = part1.help_fears || '';
  const commitment = part1.commitment_hours || '';

  const fitMessages = {
    excellent: {
      headline: `${userName}, You're Ready for This`,
      openingReflection: `I read your Tuesday Test carefully. ${tuesdayTest.length > 50 ? `"${tuesdayTest.substring(0, 100)}..." - that's not just a dream, that's a clear picture of what you want.` : "The clarity in your vision is striking."}`,
      acknowledgment: "You've done the hard work of being honest about where you are. That takes courage, and it's exactly why this will work for you.",
      strengthSpotlight: secretPride ? `And when you mentioned "${secretPride.substring(0, 80)}" - that's a real strength we'll build on.` : "Your self-awareness is a genuine asset.",
      fearAddress: helpFears ? `I hear your concern about ${helpFears.toLowerCase().includes('control') ? 'losing control' : helpFears.toLowerCase().includes('trust') ? 'trusting someone' : 'getting help'}. We'll move at your pace, always.` : "Taking this step takes courage. We'll make it worth it.",
      nextStepClarity: `Part 2 dives into the business specifics - numbers, team, bottlenecks. With ${commitment || 'the time you can commit'}, we'll build something sustainable.`,
      closingEnergy: "Let's turn that Tuesday vision into your reality.",
      callToAction: "Start Part 2 when you're ready →"
    },
    good: {
      headline: `${userName}, Let's Build Your Path`,
      openingReflection: tuesdayTest ? `Your Tuesday Test shows someone who knows what they want - "${tuesdayTest.substring(0, 80)}..."` : "You've got a vision. Now let's make it real.",
      acknowledgment: "You're in a good place to make changes. Not perfect - nobody is - but ready enough to take action.",
      strengthSpotlight: secretPride ? `Don't underestimate your strengths - "${secretPride.substring(0, 60)}" matters more than you think.` : "You've got more going for you than you might realize.",
      fearAddress: "Whatever's held you back from getting help before - we'll address it head on.",
      nextStepClarity: "Part 2 gets specific about your business. The clearer picture we have, the more targeted your roadmap will be.",
      closingEnergy: "You've started something. Let's keep the momentum going.",
      callToAction: "Continue to Part 2 →"
    },
    needs_discussion: {
      headline: `${userName}, Let's Talk First`,
      openingReflection: "I appreciate you sharing where you are. There's a lot going on, and that's okay.",
      acknowledgment: "Being honest about challenges is the first step. You've done that.",
      strengthSpotlight: secretPride ? `I see your strength in "${secretPride.substring(0, 50)}" - we'll build from there.` : "Everyone has strengths to build on. We'll find yours.",
      fearAddress: "Before diving deeper, it might help to have a quick chat to make sure this is the right fit and timing for you.",
      nextStepClarity: "Part 2 is ready when you are, but you might benefit from a 15-minute call first to align expectations.",
      closingEnergy: "No pressure. The right time is when you're ready.",
      callToAction: "Book a quick fit call or continue to Part 2 →"
    },
    not_ready: {
      headline: `${userName}, Let's Be Honest`,
      openingReflection: "Thank you for taking the time to complete Part 1. Your honesty is appreciated.",
      acknowledgment: "From what you've shared, it sounds like there might be some things to sort out first before diving into a structured program.",
      strengthSpotlight: "That's not a judgment - it's just about timing.",
      fearAddress: "Sometimes the best thing is to focus on stabilising before optimising.",
      nextStepClarity: "You're welcome to continue to Part 2, or take some time and come back when the timing feels right.",
      closingEnergy: "Either way, you've taken a step by reflecting on these questions.",
      callToAction: "Continue when ready or book a call to discuss →"
    }
  };

  return fitMessages[signals.overallFit];
}

// ============================================================================
// JOURNEY RECOMMENDATIONS
// ============================================================================

function generateJourneyRecommendation(signals: FitSignals, part1: Record<string, any>): any {
  const commitment = part1.commitment_hours || '';
  const currentIncome = parseIncome(part1.current_income);
  const desiredIncome = parseIncome(part1.desired_income);

  // Determine recommended pace
  let pace: 'intensive' | 'steady' | 'gradual' = 'steady';
  if (signals.urgencyScore >= 70 && signals.commitmentScore >= 70) pace = 'intensive';
  else if (signals.commitmentScore < 50 || commitment.includes('5-10')) pace = 'gradual';

  // Determine focus areas based on responses
  const focusAreas: string[] = [];
  
  if (part1.two_week_break_impact?.toLowerCase().includes('disaster') || 
      part1.two_week_break_impact?.toLowerCase().includes('stop')) {
    focusAreas.push('Systems & Delegation');
  }
  
  if (part1.money_worry?.length > 50) {
    focusAreas.push('Financial Stability');
  }
  
  if (part1.family_feedback?.toLowerCase().includes('never see') ||
      part1.family_feedback?.toLowerCase().includes('worried')) {
    focusAreas.push('Work-Life Balance');
  }

  if (desiredIncome > currentIncome * 1.5) {
    focusAreas.push('Growth Strategy');
  }

  if (focusAreas.length === 0) {
    focusAreas.push('Sustainable Growth', 'Time Freedom');
  }

  return {
    recommendedPace: pace,
    paceDescription: {
      intensive: '12-week sprint with weekly check-ins',
      steady: '12-week program with bi-weekly milestones',
      gradual: 'Flexible pace over 16-20 weeks'
    }[pace],
    primaryFocus: focusAreas.slice(0, 2),
    expectedTimeline: {
      intensive: '3 months to transformation',
      steady: '3-4 months to significant progress',
      gradual: '4-5 months for sustainable change'
    }[pace],
    weeklyCommitment: commitment || '10-15 hours',
    keyMilestones: [
      'Part 2: Business Deep Dive (next step)',
      'Roadmap Generation (after Part 2)',
      'Week 4: First major wins',
      'Week 8: Momentum locked in',
      'Week 12: Transformation complete'
    ]
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { clientId, practiceId } = await req.json();

    if (!clientId || !practiceId) {
      return new Response(JSON.stringify({ error: 'Missing clientId or practiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Generating fit profile for client ${clientId}...`);

    // Check for existing stage record to determine version
    const { data: existingStages, error: queryError } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'fit_assessment')
      .order('version', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('Error querying existing stages:', queryError);
    }

    const maxVersion = existingStages && existingStages.length > 0 
      ? existingStages[0].version 
      : 0;

    let nextVersion = maxVersion + 1;
    let stage = null;
    let stageError = null;
    let attempts = 0;
    const maxAttempts = 5;

    // Retry logic to handle race conditions
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}: Creating fit_assessment stage with version ${nextVersion} (max found: ${maxVersion})`);

      const { data, error } = await supabase
        .from('roadmap_stages')
        .insert({
          practice_id: practiceId,
          client_id: clientId,
          stage_type: 'fit_assessment',
          version: nextVersion,
          status: 'generating',
          generation_started_at: new Date().toISOString(),
          model_used: 'anthropic/claude-3.5-sonnet'
        })
        .select()
        .single();

      if (!error) {
        stage = data;
        stageError = null;
        break;
      }

      // If it's a unique constraint violation, try next version
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        console.log(`Version ${nextVersion} already exists, trying ${nextVersion + 1}`);
        nextVersion++;
        continue;
      }

      // Other errors, throw immediately
      stageError = error;
      break;
    }

    if (stageError || !stage) {
      throw stageError || new Error(`Failed to create stage after ${attempts} attempts`);
    }

    // Fetch Part 1 responses
    const { data: assessment, error: fetchError } = await supabase
      .from('client_assessments')
      .select('responses')
      .eq('client_id', clientId)
      .eq('assessment_type', 'part1')
      .single();

    if (fetchError || !assessment) {
      throw new Error('Part 1 not found');
    }

    const part1 = assessment.responses;

    // Analyze fit signals
    const signals = analyzeFitSignals(part1);
    console.log(`Fit signals: ${signals.overallFit} (avg: ${Math.round((signals.readinessScore + signals.commitmentScore + signals.clarityScore + signals.urgencyScore + signals.coachabilityScore) / 5)})`);

    // Generate personalized fit message
    const fitMessage = await generateFitMessage(part1, signals);
    console.log('Fit message generated');

    // Generate journey recommendation
    const journeyRecommendation = generateJourneyRecommendation(signals, part1);

    // Build fit profile
    const fitProfile = {
      signals,
      message: fitMessage,
      journeyRecommendation,
      generatedAt: new Date().toISOString(),
      unlocksPartTwo: signals.overallFit !== 'not_ready'
    };

    // Calculate duration
    const duration = Date.now() - startTime;

    // Update stage record
    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: fitProfile,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration
      })
      .eq('id', stage.id);

    // Also store fit profile with Part 1 assessment (backward compatibility)
    await supabase
      .from('client_assessments')
      .update({ 
        fit_profile: fitProfile,
        status: 'completed'
      })
      .eq('client_id', clientId)
      .eq('assessment_type', 'part1');

    console.log('Fit profile complete!');

    return new Response(JSON.stringify({
      success: true,
      stageId: stage.id,
      fitProfile,
      unlocksPartTwo: fitProfile.unlocksPartTwo,
      duration,
      summary: {
        overallFit: signals.overallFit,
        headline: fitMessage.headline,
        scores: {
          readiness: signals.readinessScore,
          commitment: signals.commitmentScore,
          clarity: signals.clarityScore,
          urgency: signals.urgencyScore,
          coachability: signals.coachabilityScore
        },
        recommendedPace: journeyRecommendation.recommendedPace,
        primaryFocus: journeyRecommendation.primaryFocus
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

