// ============================================================================
// DESTINATION-FIRST SERVICE RECOMMENDATION ENGINE
// ============================================================================
// Analyzes discovery responses and generates personalized service recommendations
// with value propositions that use the CLIENT'S OWN WORDS
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// SERVICE LINE DEFINITIONS
// ============================================================================

interface ServiceLine {
  code: string;
  name: string;
  shortDescription: string;
  transformationPromise: string;
  typicalMonthly: string;
  prerequisites: string[];
  complementaryServices: string[];
}

const SERVICE_LINES: Record<string, ServiceLine> = {
  '365_method': {
    code: '365_method',
    name: '365 Alignment Programme',
    shortDescription: 'Life-first business transformation',
    transformationPromise: 'From drifting to deliberate. From hoping to planning.',
    typicalMonthly: '£5,000',
    prerequisites: [],
    complementaryServices: ['fractional_coo', 'systems_audit']
  },
  'fractional_cfo': {
    code: 'fractional_cfo',
    name: 'Fractional CFO Services',
    shortDescription: 'Strategic financial leadership',
    transformationPromise: 'From guessing to knowing. From anxiety to confidence.',
    typicalMonthly: '£3,500 - £12,000',
    prerequisites: [],
    complementaryServices: ['management_accounts', 'benchmarking']
  },
  'systems_audit': {
    code: 'systems_audit',
    name: 'Systems Audit',
    shortDescription: 'Fix operational bottlenecks',
    transformationPromise: 'From firefighting to flowing. From chaos to control.',
    typicalMonthly: '£3,000 retainer',
    prerequisites: [],
    complementaryServices: ['automation', 'fractional_coo']
  },
  'management_accounts': {
    code: 'management_accounts',
    name: 'Management Accounts',
    shortDescription: 'Monthly financial visibility',
    transformationPromise: 'From blind to informed. From surprises to certainty.',
    typicalMonthly: '£650',
    prerequisites: [],
    complementaryServices: ['fractional_cfo', 'benchmarking']
  },
  'combined_advisory': {
    code: 'combined_advisory',
    name: 'Combined CFO/COO Advisory',
    shortDescription: 'Executive partnership',
    transformationPromise: 'Board-level thinking without board-level cost.',
    typicalMonthly: '£8,000 - £15,000',
    prerequisites: [],
    complementaryServices: ['systems_audit', 'benchmarking']
  },
  'fractional_coo': {
    code: 'fractional_coo',
    name: 'Fractional COO Services',
    shortDescription: 'Operational leadership',
    transformationPromise: 'From essential to optional. From trapped to free.',
    typicalMonthly: '£3,000 - £10,000',
    prerequisites: [],
    complementaryServices: ['systems_audit', 'automation']
  },
  'business_advisory': {
    code: 'business_advisory',
    name: 'Business Advisory & Exit Planning',
    shortDescription: 'Protect and maximize value',
    transformationPromise: 'From vulnerable to secure. From undervalued to optimised.',
    typicalMonthly: '£9,000',
    prerequisites: [],
    complementaryServices: ['fractional_cfo', 'systems_audit']
  },
  'automation': {
    code: 'automation',
    name: 'Automation Services',
    shortDescription: 'Eliminate manual work',
    transformationPromise: 'From manual to magical. More output, less effort.',
    typicalMonthly: '£1,500',
    prerequisites: ['systems_audit'],
    complementaryServices: ['systems_audit', 'fractional_coo']
  },
  'benchmarking': {
    code: 'benchmarking',
    name: 'Benchmarking Services',
    shortDescription: 'Know where you stand',
    transformationPromise: 'From guessing to knowing exactly where you compare.',
    typicalMonthly: '£2,000',
    prerequisites: [],
    complementaryServices: ['management_accounts', 'fractional_cfo']
  }
};

// ============================================================================
// SCORING ENGINE
// ============================================================================

interface ScoringWeight {
  question_id: string;
  response_value: string;
  service_code: string;
  weight: number;
}

async function calculateServiceScores(
  discoveryResponses: Record<string, any>,
  diagnosticResponses: Record<string, any>,
  supabase: any
): Promise<Record<string, number>> {
  // Fetch scoring weights from database
  const { data: weights, error } = await supabase
    .from('service_scoring_weights')
    .select('*');
  
  if (error) {
    console.error('Error fetching weights:', error);
    return {};
  }

  const scores: Record<string, number> = {};
  
  // Initialize all services to 0
  Object.keys(SERVICE_LINES).forEach(code => {
    scores[code] = 0;
  });

  // Score based on diagnostic responses
  for (const [questionId, response] of Object.entries(diagnosticResponses)) {
    const matchingWeights = weights.filter(
      (w: ScoringWeight) => w.question_id === questionId && w.response_value === response
    );
    
    for (const weight of matchingWeights) {
      scores[weight.service_code] = (scores[weight.service_code] || 0) + weight.weight;
    }
  }

  // Boost scores based on destination discovery responses
  const honestPriority = discoveryResponses.dd_honest_priority || discoveryResponses.dd_priority_focus;
  const priorityBoosts: Record<string, string[]> = {
    // Existing priority mappings
    'Financial clarity and control': ['management_accounts', 'fractional_cfo', 'benchmarking'],
    'My business running without me': ['systems_audit', 'fractional_coo', 'automation'],
    'Strategic direction and accountability': ['365_method', 'combined_advisory'],
    'Growing without growing problems': ['systems_audit', 'fractional_coo', 'fractional_cfo'],
    'Protecting what Ive built': ['business_advisory', 'fractional_cfo'],
    'Better work-life balance': ['365_method', 'systems_audit', 'fractional_coo'],
    
    // NEW: Enhanced priority mappings from dd_priority_focus
    'Getting real financial visibility and control': ['management_accounts', 'fractional_cfo', 'benchmarking'],
    'Building a business that runs without me': ['systems_audit', 'fractional_coo', '365_method'],
    'Having strategic direction and accountability': ['365_method', 'combined_advisory', 'fractional_cfo'],
    'Scaling without scaling the chaos': ['systems_audit', 'fractional_coo', 'automation'],
    'Protecting the value Ive built': ['business_advisory', 'fractional_cfo', 'benchmarking'],
    'Getting my time and energy back': ['365_method', 'systems_audit', 'fractional_coo']
  };

  if (honestPriority && priorityBoosts[honestPriority]) {
    priorityBoosts[honestPriority].forEach((code, index) => {
      scores[code] += 5 - index; // Primary gets +5, secondary +4, tertiary +3
    });
  }

  // ========================================================================
  // CAPITAL RAISING DETECTION
  // ========================================================================
  const capitalRaisingDetected = detectCapitalRaisingIntent(discoveryResponses, diagnosticResponses);
  if (capitalRaisingDetected) {
    console.log('Capital raising intent detected - boosting investment readiness services');
    scores['fractional_cfo'] = (scores['fractional_cfo'] || 0) * 1.5;
    scores['management_accounts'] = (scores['management_accounts'] || 0) * 1.3;
    scores['business_advisory'] = (scores['business_advisory'] || 0) * 1.3;
    scores['systems_audit'] = (scores['systems_audit'] || 0) * 1.2; // Investors want to see operational maturity
  }

  // ========================================================================
  // LIFESTYLE TRANSFORMATION DETECTION
  // ========================================================================
  const lifestyleTransformationDetected = detectLifestyleTransformation(discoveryResponses);
  if (lifestyleTransformationDetected) {
    console.log('Lifestyle transformation detected - boosting 365 Method and operational services');
    scores['365_method'] = (scores['365_method'] || 0) * 1.5;
    scores['fractional_coo'] = (scores['fractional_coo'] || 0) * 1.3;
    scores['systems_audit'] = (scores['systems_audit'] || 0) * 1.2;
  }

  // ========================================================================
  // BURNOUT INDICATORS
  // ========================================================================
  const burnoutDetected = detectBurnoutIndicators(discoveryResponses);
  if (burnoutDetected) {
    console.log('Burnout indicators detected - prioritizing 365 Method');
    scores['365_method'] = (scores['365_method'] || 0) * 1.4;
  }

  // Urgency multiplier
  const urgency = discoveryResponses.dd_timeline_urgency || discoveryResponses.dd_change_readiness;
  const urgencyMultiplier = {
    'Critical - I cant continue like this': 1.5,
    'Important - within the next 3 months': 1.3,
    'Significant - within the next 6 months': 1.1,
    'Moderate - sometime this year': 1.0,
    'Low - whenever the time is right': 0.8,
    'Completely ready - Ill do whatever it takes': 1.3,
    'Ready - as long as I understand the why': 1.2,
    'Open - but Ill need convincing': 1.0,
    'Hesitant - change feels risky': 0.9,
    'Resistant - I prefer how things are': 0.7
  }[urgency] || 1.0;

  // Apply multiplier to all scores
  Object.keys(scores).forEach(code => {
    scores[code] = Math.round(scores[code] * urgencyMultiplier);
  });

  return scores;
}

// ============================================================================
// CAPITAL RAISING DETECTION
// ============================================================================
function detectCapitalRaisingIntent(
  discoveryResponses: Record<string, any>,
  diagnosticResponses: Record<string, any>
): boolean {
  const signals: boolean[] = [
    // Explicit growth blocker = capital
    diagnosticResponses.sd_growth_blocker === "Dont have the capital",
    diagnosticResponses.sd_growth_blocker === "Don't have the capital",
    
    // Mentions of capital/raising in open-ended responses
    discoveryResponses.dd_if_i_knew?.toLowerCase().includes('capital'),
    discoveryResponses.dd_if_i_knew?.toLowerCase().includes('raise'),
    discoveryResponses.dd_if_i_knew?.toLowerCase().includes('invest'),
    discoveryResponses.dd_if_i_knew?.toLowerCase().includes('funding'),
    discoveryResponses.dd_what_would_change?.toLowerCase().includes('capital'),
    discoveryResponses.dd_what_would_change?.toLowerCase().includes('invest'),
    
    // Investment ready signals
    diagnosticResponses.sd_exit_readiness?.includes('investment-ready'),
    diagnosticResponses.sd_valuation_clarity?.includes('professional valuation'),
    
    // Exit timeline signals (near-term)
    diagnosticResponses.sd_exit_timeline === 'Already exploring options',
    diagnosticResponses.sd_exit_timeline === '1-3 years - actively preparing'
  ];
  
  // Need at least 2 signals to confirm capital raising intent
  return signals.filter(Boolean).length >= 2;
}

// ============================================================================
// LIFESTYLE TRANSFORMATION DETECTION
// ============================================================================
function detectLifestyleTransformation(responses: Record<string, any>): boolean {
  const visionText = (responses.dd_five_year_picture || responses.dd_five_year_story || '').toLowerCase();
  
  const signals: boolean[] = [
    // Vision describes different role
    visionText.includes('invest'),
    visionText.includes('portfolio'),
    visionText.includes('ceo'),
    visionText.includes('advisory'),
    visionText.includes('board'),
    visionText.includes('chairman'),
    visionText.includes('non-executive'),
    
    // Vision describes lifestyle change (not just business growth)
    visionText.includes('family'),
    visionText.includes('children') || visionText.includes('kids') || visionText.includes('boys') || visionText.includes('girls'),
    visionText.includes('wife') || visionText.includes('husband') || visionText.includes('spouse'),
    visionText.includes('holiday') || visionText.includes('travel'),
    visionText.includes('health') || visionText.includes('run') || visionText.includes('exercise') || visionText.includes('gym'),
    
    // Success definition indicates transition
    responses.dd_success_definition === "Creating a business that runs profitably without me",
    responses.dd_success_definition === "Building a legacy that outlasts me",
    responses.dd_success_definition === "Having complete control over my time and income"
  ];
  
  return signals.filter(Boolean).length >= 3;
}

// ============================================================================
// BURNOUT DETECTION
// ============================================================================
function detectBurnoutIndicators(responses: Record<string, any>): boolean {
  const signals: boolean[] = [
    // Excessive hours
    responses.dd_owner_hours === '60-70 hours',
    responses.dd_owner_hours === '70+ hours',
    
    // No breaks
    responses.dd_holiday_reality === 'Ive never done that',
    responses.dd_holiday_reality === "I've never done that",
    responses.dd_holiday_reality === 'I honestly cant remember',
    responses.dd_holiday_reality === "I honestly can't remember",
    
    // Relationship strain
    responses.dd_external_view === 'Its a significant source of tension',
    responses.dd_external_view === "It's a significant source of tension",
    responses.dd_external_view === 'Theyd say Im married to my business',
    responses.dd_external_view === "They'd say I'm married to my business",
    
    // High firefighting
    responses.dd_time_breakdown === '90% firefighting / 10% strategic',
    responses.dd_time_breakdown === '70% firefighting / 30% strategic',
    
    // Sleep issues
    responses.dd_sleep_thief && !responses.dd_sleep_thief.includes('Nothing - I sleep fine')
  ];
  
  // Need at least 3 signals for burnout
  return signals.filter(Boolean).length >= 3;
}

// ============================================================================
// EMOTIONAL ANCHOR EXTRACTION
// ============================================================================

function extractEmotionalAnchors(responses: Record<string, any>): Record<string, string> {
  return {
    // Core destination anchors
    fiveYearVision: responses.dd_five_year_picture || responses.dd_five_year_story || '',
    biggestChange: responses.dd_what_would_change || responses.dd_biggest_change || '',
    identityAspiration: responses.dd_destination_words || '',
    freedTimeVision: responses.dd_freed_time || '',
    coreFeelingDesired: responses.dd_success_feeling || responses.dd_success_definition || '',
    
    // Gap analysis anchors
    currentGap: responses.dd_current_reality || responses.dd_honest_assessment || '',
    primaryObstacle: responses.dd_main_obstacle || responses.sd_growth_blocker || '',
    failureInsight: responses.dd_why_not_worked || '',
    costOfInaction: responses.dd_cost_of_staying || '',
    
    // Tuesday test anchors
    tuesdayFrustration: responses.dd_tuesday_frustration || responses.dd_biggest_frustration || '',
    tuesdayMagicWand: responses.dd_tuesday_magic || '',
    tuesdayEndState: responses.dd_tuesday_energy || '',
    operationalFrustration: responses.sd_operational_frustration || '',
    
    // NEW: Enhanced anchors for deeper analysis
    capitalIntent: responses.dd_if_i_knew || '',
    hiddenTruth: responses.dd_hard_truth || '',
    teamSecret: responses.dd_team_secret || '',
    avoidedConversation: responses.dd_avoided_conversation || '',
    externalPerspective: responses.dd_external_view || '',
    
    // Team and delegation anchors
    teamConfidence: responses.dd_team_confidence || '',
    keyPersonRisk: responses.dd_key_person_risk || '',
    delegationHonesty: responses.dd_delegation_honest || '',
    
    // Exit and timeline anchors
    exitThoughts: responses.dd_exit_thoughts || '',
    exitTimeline: responses.sd_exit_timeline || '',
    changeReadiness: responses.dd_change_readiness || '',
    
    // Lifestyle anchors
    ownerHours: responses.dd_owner_hours || '',
    holidayReality: responses.dd_holiday_reality || '',
    sleepThieves: Array.isArray(responses.dd_sleep_thief) 
      ? responses.dd_sleep_thief.join(', ') 
      : (responses.dd_sleep_thief || ''),
    
    // Final message
    finalMessage: responses.dd_final_message || responses.dd_anything_else || ''
  };
}

// ============================================================================
// VALUE PROPOSITION GENERATOR
// ============================================================================

async function generateValueProposition(
  serviceCode: string,
  anchors: Record<string, string>,
  score: number
): Promise<{
  headline: string;
  destination: string;
  gap: string;
  transformation: string;
  investment: string;
  firstStep: string;
}> {
  const service = SERVICE_LINES[serviceCode];
  if (!service) return getDefaultVP(serviceCode);

  // Create personalized VP using their words
  const vp = {
    headline: '',
    destination: '',
    gap: '',
    transformation: '',
    investment: '',
    firstStep: ''
  };

  // Build destination using their 5-year vision
  if (anchors.fiveYearVision) {
    const visionSnippet = anchors.fiveYearVision.substring(0, 150);
    vp.destination = `You painted a picture: "${visionSnippet}..."`;
  } else {
    vp.destination = `You're chasing ${anchors.coreFeelingDesired?.toLowerCase() || 'something more'}.`;
  }

  // Build gap using their frustrations
  if (anchors.tuesdayFrustration) {
    vp.gap = `But right now, you're dealing with: "${anchors.tuesdayFrustration}"`;
  } else if (anchors.primaryObstacle) {
    vp.gap = `The thing in your way: ${anchors.primaryObstacle}`;
  }

  // Build transformation based on service
  switch (serviceCode) {
    case '365_method':
      vp.headline = 'From drifting to deliberate';
      vp.transformation = `Within 12 weeks, you'll have a clear roadmap to that vision. No more "${anchors.failureInsight || 'spinning wheels'}". Every week, you'll know exactly what to focus on.`;
      vp.investment = `The cost of NOT doing this? You told us: "${anchors.costOfInaction?.substring(0, 100) || 'more of the same'}"`;
      vp.firstStep = 'A 90-minute strategy session to map your destination and identify the gaps.';
      break;

    case 'fractional_cfo':
      vp.headline = 'From guessing to knowing';
      vp.transformation = `Imagine waking up KNOWING your numbers. No more "${anchors.tuesdayFrustration || 'uncertainty'}". Every decision backed by data you trust.`;
      vp.investment = 'Strategic financial leadership for a fraction of the full-time cost.';
      vp.firstStep = 'A financial health check to see exactly where you stand.';
      break;

    case 'systems_audit':
      vp.headline = 'From firefighting to flowing';
      if (anchors.tuesdayMagicWand) {
        vp.transformation = `You said you would magic away: "${anchors.tuesdayMagicWand}". Let us make that disappear - permanently.`;
      } else {
        vp.transformation = 'We will find every bottleneck, every workaround, every data silo - and give you a clear roadmap to fix them.';
      }
      vp.investment = 'One-time investment that pays dividends in time saved forever.';
      vp.firstStep = 'A 2-hour discovery call to map your current systems landscape.';
      break;

    case 'management_accounts':
      vp.headline = 'From blind to informed';
      vp.transformation = 'By the 5th of every month, you\'ll have a clear picture of exactly where you stand. P&L, cash flow, KPIs - all with commentary that actually helps.';
      vp.investment = 'Less than the cost of one bad decision made without the data.';
      vp.firstStep = 'A review of your current reporting to identify the gaps.';
      break;

    case 'combined_advisory':
      vp.headline = 'Board-level thinking, on-demand';
      vp.transformation = `You said you figure things out yourself. "${anchors.operationalFrustration || 'Complex decisions'}" do not have to be solo anymore.`;
      vp.investment = 'Executive partnership for both financial AND operational strategy.';
      vp.firstStep = 'A strategic review to understand where advisory would add most value.';
      break;

    case 'fractional_coo':
      vp.headline = 'From essential to optional';
      vp.transformation = `That ${anchors.primaryObstacle === 'Time - I dont have enough hours' ? 'time problem' : 'operational chaos'}? It ends when you have someone building systems that run without you.`;
      vp.investment = 'Senior operational leadership without the £150k+ salary.';
      vp.firstStep = 'An operational assessment to identify the highest-impact areas.';
      break;

    case 'business_advisory':
      vp.headline = 'Protect what you\'ve built';
      vp.transformation = 'Whether you\'re exiting in 2 years or 20, you\'ll know exactly what your business is worth and how to maximize that value.';
      vp.investment = 'The value of your business is too important to leave to chance.';
      vp.firstStep = 'A preliminary valuation and exit-readiness assessment.';
      break;

    case 'automation':
      vp.headline = 'From manual to magical';
      vp.transformation = 'That repetitive work eating your team\'s time? Gone. More output, less effort, happier people.';
      vp.investment = 'Typically pays for itself within 3-6 months in time saved.';
      vp.firstStep = 'An automation opportunity assessment to find the quick wins.';
      break;

    case 'benchmarking':
      vp.headline = 'Know exactly where you stand';
      vp.transformation = 'You\'ll know how your margins, growth rate, and efficiency compare to similar businesses. No more wondering if you\'re ahead or behind.';
      vp.investment = 'Knowledge is power. This gives you the context to make better decisions.';
      vp.firstStep = 'A benchmarking report comparing you to relevant industry peers.';
      break;

    default:
      return getDefaultVP(serviceCode);
  }

  return vp;
}

function getDefaultVP(serviceCode: string): any {
  return {
    headline: SERVICE_LINES[serviceCode]?.name || 'Our Services',
    destination: 'Where do you want to be?',
    gap: 'What\'s in your way?',
    transformation: 'Here\'s how we help.',
    investment: 'Investment tailored to your needs.',
    firstStep: 'Let\'s talk about what you need.'
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, clientId, discoveryResponses, diagnosticResponses } = await req.json();

    if (action === 'calculate-recommendations') {
      // Calculate service scores
      const scores = await calculateServiceScores(
        discoveryResponses || {},
        diagnosticResponses || {},
        supabase
      );

      // Sort services by score
      const sortedServices = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .map(([code, score]) => ({ code, score, ...SERVICE_LINES[code] }));

      // Extract emotional anchors
      const anchors = extractEmotionalAnchors(discoveryResponses || {});

      // Generate VPs for top 3 services
      const recommendations = [];
      for (let i = 0; i < Math.min(3, sortedServices.length); i++) {
        const service = sortedServices[i];
        if (service.score > 0) {
          const vp = await generateValueProposition(service.code, anchors, service.score);
          recommendations.push({
            rank: i + 1,
            service: service,
            valueProposition: vp,
            score: service.score,
            isFoundational: service.code === '365_method' && service.score >= 10
          });
        }
      }

      // Check for combined CFO/COO recommendation
      const cfoScore = scores['fractional_cfo'] || 0;
      const cooScore = scores['fractional_coo'] || 0;
      if (cfoScore >= 8 && cooScore >= 8) {
        // Suggest combined service
        const combinedVP = await generateValueProposition('combined_advisory', anchors, cfoScore + cooScore);
        recommendations.unshift({
          rank: 0,
          service: SERVICE_LINES['combined_advisory'],
          valueProposition: combinedVP,
          score: cfoScore + cooScore,
          isBundled: true,
          bundledFrom: ['fractional_cfo', 'fractional_coo']
        });
      }

      // Store discovery results
      if (clientId) {
        // CRITICAL: Validate that clientId exists in practice_members before saving
        const { data: clientCheck, error: clientError } = await supabase
          .from('practice_members')
          .select('id, user_id, email, member_type')
          .eq('id', clientId)
          .eq('member_type', 'client')
          .maybeSingle();
        
        if (clientError) {
          console.error('Error validating client_id:', clientError);
          throw new Error(`Invalid client_id: ${clientId}`);
        }
        
        if (!clientCheck) {
          console.error(`CRITICAL: client_id ${clientId} does not exist in practice_members!`);
          // Try to find the correct client_id by user_id if we have auth context
          // This is a fallback for cases where clientSession.clientId is wrong
          throw new Error(`Client ID ${clientId} not found. This may indicate a data integrity issue.`);
        }
        
        console.log(`Saving discovery assessment for client_id: ${clientId}, email: ${clientCheck.email}`);
        
        await supabase.from('destination_discovery').upsert({
          client_id: clientId,
          practice_id: clientCheck.practice_id || null, // Ensure practice_id is set
          responses: { ...discoveryResponses, ...diagnosticResponses },
          extracted_anchors: anchors,
          destination_clarity_score: calculateClarityScore(discoveryResponses),
          gap_score: calculateGapScore(discoveryResponses),
          recommended_services: recommendations,
          value_propositions: recommendations.map(r => r.valueProposition),
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'client_id' // Update if exists, insert if not
        });
      }

      return new Response(JSON.stringify({
        success: true,
        scores,
        recommendations,
        anchors,
        summary: {
          primaryRecommendation: recommendations[0]?.service?.name,
          secondaryRecommendation: recommendations[1]?.service?.name,
          totalServicesScored: Object.keys(scores).filter(k => scores[k] > 0).length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get-discovery-questions') {
      // Return discovery questions from database
      const { data: discoveryQuestions } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('service_line_code', 'destination_discovery')
        .eq('is_active', true)
        .order('display_order');

      const { data: diagnosticQuestions } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('service_line_code', 'service_diagnostic')
        .eq('is_active', true)
        .order('display_order');

      return new Response(JSON.stringify({
        success: true,
        discoveryQuestions: groupBySection(discoveryQuestions || []),
        diagnosticQuestions: groupBySection(diagnosticQuestions || []),
        totalQuestions: (discoveryQuestions?.length || 0) + (diagnosticQuestions?.length || 0)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function groupBySection(questions: any[]): Record<string, any[]> {
  return questions.reduce((acc, q) => {
    const section = q.section || 'Other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(q);
    return acc;
  }, {});
}

function calculateClarityScore(responses: Record<string, any>): number {
  let score = 0;
  
  // Has clear 5-year vision
  if (responses.dd_five_year_story?.length > 100) score += 2;
  
  // Knows what needs to change
  if (responses.dd_biggest_change?.length > 50) score += 2;
  
  // Clear identity aspiration
  if (responses.dd_destination_words?.length > 20) score += 1;
  
  // Knows current gap
  if (responses.dd_current_reality && !responses.dd_current_reality.includes('Lost')) score += 2;
  
  // Clear priority
  if (responses.dd_honest_priority && !responses.dd_honest_priority.includes('Something else')) score += 2;
  
  // Urgency clarity
  if (responses.dd_timeline_urgency && !responses.dd_timeline_urgency.includes('Low')) score += 1;
  
  return Math.min(10, score);
}

function calculateGapScore(responses: Record<string, any>): number {
  let score = 0;
  
  const gapMapping: Record<string, number> = {
    'Close - I can see the path clearly': 2,
    'Halfway - making progress but its slow': 4,
    'Far away - I know where I want to go but not how': 6,
    'Lost - I dont even know what I want anymore': 8,
    'Stuck - I keep trying but nothing changes': 9
  };
  
  score = gapMapping[responses.dd_current_reality] || 5;
  
  // Increase if they've tried and failed
  if (responses.dd_tried_before?.includes('Nothing - I havent known where to start')) score += 1;
  if (responses.dd_tried_before?.includes('Given up and accepted the status quo')) score += 2;
  
  return Math.min(10, score);
}

