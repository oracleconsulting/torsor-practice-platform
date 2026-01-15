// ============================================================================
// DESTINATION-FIRST SERVICE RECOMMENDATION ENGINE v2.0
// ============================================================================
// Analyzes discovery responses and generates personalized service recommendations
// with value propositions that use the CLIENT'S OWN WORDS
// Updated: January 2026 - 40-question comprehensive scoring
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scoreServicesFromDiscovery, type ScoringResult } from '../_shared/service-scorer-v2.ts'

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
    // Core destination anchors (v2.0 field names)
    fiveYearVision: responses.dd_five_year_vision || responses.dd_five_year_picture || '',
    unlimitedChange: responses.dd_unlimited_change || '',
    successDefinition: responses.dd_success_definition || '',
    nonNegotiables: Array.isArray(responses.dd_non_negotiables) 
      ? responses.dd_non_negotiables.join(', ') 
      : (responses.dd_non_negotiables || ''),
    exitMindset: responses.dd_exit_mindset || '',
    
    // Reality anchors
    weeklyHours: responses.dd_weekly_hours || '',
    timeAllocation: responses.dd_time_allocation || '',
    lastRealBreak: responses.dd_last_real_break || '',
    emergencyLog: responses.dd_emergency_log || '',
    scalingConstraint: responses.dd_scaling_constraint || '',
    sleepThief: responses.dd_sleep_thief || '',
    coreFrustration: responses.dd_core_frustration || '',
    
    // Team anchors
    keyPersonDependency: responses.dd_key_person_dependency || '',
    peopleChallenge: responses.dd_people_challenge || '',
    delegationAbility: responses.dd_delegation_ability || '',
    hiddenFromTeam: responses.dd_hidden_from_team || '',
    externalPerspective: responses.dd_external_perspective || '',
    
    // Blind spot anchors
    avoidedConversation: responses.dd_avoided_conversation || '',
    hardTruth: responses.dd_hard_truth || '',
    relationshipMirror: responses.dd_relationship_mirror || '',
    sacrificeList: responses.dd_sacrifice_list || '',
    suspectedTruth: responses.dd_suspected_truth || '',
    
    // Forward anchors
    magicFix: responses.dd_magic_fix || '',
    changeReadiness: responses.dd_change_readiness || '',
    finalInsight: responses.dd_final_insight || '',
    
    // Service diagnostic anchors
    financialConfidence: responses.sd_financial_confidence || '',
    numbersActionFrequency: responses.sd_numbers_action_frequency || '',
    benchmarkAwareness: responses.sd_benchmark_awareness || '',
    founderDependency: responses.sd_founder_dependency || '',
    manualWorkPercentage: responses.sd_manual_work_percentage || '',
    manualTasks: Array.isArray(responses.sd_manual_tasks) 
      ? responses.sd_manual_tasks.join(', ') 
      : (responses.sd_manual_tasks || ''),
    problemAwarenessSpeed: responses.sd_problem_awareness_speed || '',
    planClarity: responses.sd_plan_clarity || '',
    accountabilitySource: responses.sd_accountability_source || '',
    growthBlocker: responses.sd_growth_blocker || '',
    documentationReadiness: responses.sd_documentation_readiness || '',
    valuationUnderstanding: responses.sd_valuation_understanding || '',
    exitTimeline: responses.sd_exit_timeline || '',
    competitivePosition: responses.sd_competitive_position || '',
    operationalFrustration: responses.sd_operational_frustration || ''
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

  // Create personalized VP using their words (v2.0 anchors)
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
  } else if (anchors.successDefinition) {
    vp.destination = `You're chasing ${anchors.successDefinition.toLowerCase()}.`;
  } else {
    vp.destination = 'You\'re building toward something bigger.';
  }

  // Build gap using their frustrations
  if (anchors.coreFrustration) {
    vp.gap = `But right now: "${anchors.coreFrustration}"`;
  } else if (anchors.emergencyLog) {
    vp.gap = `Last month's reality: "${anchors.emergencyLog.substring(0, 100)}..."`;
  } else if (anchors.sleepThief && anchors.sleepThief !== 'Nothing - I sleep fine') {
    vp.gap = `What keeps you up: ${anchors.sleepThief}`;
  }

  // Build transformation based on service
  switch (serviceCode) {
    case '365_method':
      vp.headline = 'From drifting to deliberate';
      const relationshipFeel = anchors.relationshipMirror ? `"${anchors.relationshipMirror.substring(0, 50)}"` : 'being trapped';
      const sacrificed = anchors.sacrificeList ? ` You've sacrificed ${anchors.sacrificeList.substring(0, 50)}...` : '';
      vp.transformation = `Within 12 weeks, you'll have a clear roadmap to that vision. No more ${relationshipFeel}.${sacrificed} Every week, you'll know exactly what to focus on.`;
      vp.investment = anchors.hardTruth 
        ? `The cost of NOT doing this? You said: "${anchors.hardTruth.substring(0, 80)}..."`
        : 'The cost of staying stuck is measured in years, not months.';
      vp.firstStep = 'A 90-minute strategy session to map your destination and identify the gaps.';
      break;

    case 'fractional_cfo':
      vp.headline = 'From guessing to knowing';
      const finConfidence = anchors.financialConfidence || 'uncertainty';
      vp.transformation = `Imagine waking up KNOWING your numbers. No more "${finConfidence}". Every decision backed by data you trust.`;
      vp.investment = 'Strategic financial leadership for a fraction of the full-time cost.';
      vp.firstStep = 'A financial health check to see exactly where you stand.';
      break;

    case 'systems_audit':
      vp.headline = 'From firefighting to flowing';
      if (anchors.magicFix) {
        vp.transformation = `You said your magic fix would be: "${anchors.magicFix.substring(0, 100)}..." Let us make that happen.`;
      } else if (anchors.emergencyLog) {
        vp.transformation = `Those emergencies - "${anchors.emergencyLog.substring(0, 80)}..." - we eliminate the root causes, not just the symptoms.`;
      } else {
        vp.transformation = 'We find every bottleneck, every workaround, every data silo - and give you a clear roadmap to fix them.';
      }
      vp.investment = 'One-time investment that pays dividends in time saved forever.';
      vp.firstStep = 'A 2-hour discovery call to map your current systems landscape.';
      break;

    case 'management_accounts':
      vp.headline = 'From blind to informed';
      const suspected = anchors.suspectedTruth 
        ? ` You suspect: "${anchors.suspectedTruth.substring(0, 60)}..." Let's find out.`
        : '';
      vp.transformation = `By the 5th of every month, you'll have a clear picture of exactly where you stand. P&L, cash flow, KPIs - all with commentary that actually helps.${suspected}`;
      vp.investment = 'Less than the cost of one bad decision made without the data.';
      vp.firstStep = 'A review of your current reporting to identify the gaps.';
      break;

    case 'combined_advisory':
      vp.headline = 'Board-level thinking, on-demand';
      const accountable = anchors.accountabilitySource === 'No one - just me' 
        ? 'You said no one holds you accountable.' 
        : 'Complex decisions don\'t have to be solo anymore.';
      vp.transformation = `${accountable} Get both financial AND operational strategic support in one relationship.`;
      vp.investment = 'Executive partnership that grows with your ambition.';
      vp.firstStep = 'A strategic review to understand where advisory would add most value.';
      break;

    case 'fractional_coo':
      vp.headline = 'From essential to optional';
      const founderDep = anchors.founderDependency?.includes('Chaos') 
        ? 'Right now you\'re essential to everything.' 
        : 'Your team needs leadership, not just management.';
      vp.transformation = `${founderDep} We build systems and develop people so the business runs without you in the middle of everything.`;
      vp.investment = 'Senior operational leadership without the £150k+ salary.';
      vp.firstStep = 'An operational assessment to identify the highest-impact areas.';
      break;

    case 'business_advisory':
      vp.headline = 'Protect what you\'ve built';
      const exitTime = anchors.exitTimeline || '';
      const exitContext = exitTime.includes('Already') || exitTime.includes('1-3') 
        ? 'With your exit timeline approaching, preparation is everything.'
        : 'Whether you\'re exiting in 2 years or 20, preparation starts now.';
      vp.transformation = `${exitContext} You'll know exactly what your business is worth and how to maximize that value.`;
      vp.investment = 'The value of your business is too important to leave to chance.';
      vp.firstStep = 'A preliminary valuation and exit-readiness assessment.';
      break;

    case 'automation':
      vp.headline = 'From manual to magical';
      const manualTasks = anchors.manualTasks 
        ? `Tasks like ${anchors.manualTasks.substring(0, 50)}... automated.` 
        : 'That repetitive work eating your team\'s time? Gone.';
      vp.transformation = `${manualTasks} More output, less effort, happier people.`;
      vp.investment = 'Typically pays for itself within 3-6 months in time saved.';
      vp.firstStep = 'An automation opportunity assessment to find the quick wins.';
      break;

    case 'benchmarking':
      vp.headline = 'Know exactly where you stand';
      const competitive = anchors.competitivePosition?.includes('don\'t really know') 
        ? 'You said you don\'t know how you compare. Let\'s find out.'
        : 'Know exactly how your margins, growth rate, and efficiency compare.';
      vp.transformation = `${competitive} No more wondering if you\'re ahead or behind - you\'ll have the data.`;
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
      // Combine discovery and diagnostic responses
      const allResponses = {
        ...(discoveryResponses || {}),
        ...(diagnosticResponses || {})
      };

      // Use the new v2 comprehensive scorer
      const scoringResult: ScoringResult = scoreServicesFromDiscovery(allResponses);
      
      console.log('Scoring complete:', {
        burnoutDetected: scoringResult.patterns.burnoutDetected,
        capitalRaisingDetected: scoringResult.patterns.capitalRaisingDetected,
        lifestyleTransformationDetected: scoringResult.patterns.lifestyleTransformationDetected,
        urgencyMultiplier: scoringResult.patterns.urgencyMultiplier,
        topService: scoringResult.recommendations[0]?.name,
        topScore: scoringResult.recommendations[0]?.score,
      });

      // Generate VPs for recommended services (score >= 50)
      const recommendations = [];
      const recommendedServices = scoringResult.recommendations.filter(s => s.recommended);
      
      for (let i = 0; i < Math.min(5, recommendedServices.length); i++) {
        const service = recommendedServices[i];
        const vp = await generateValueProposition(
          service.code, 
          scoringResult.emotionalAnchors, 
          service.score
        );
        recommendations.push({
          rank: i + 1,
          service: {
            code: service.code,
            name: service.name,
            ...SERVICE_LINES[service.code]
          },
          valueProposition: vp,
          score: service.score,
          confidence: service.confidence,
          triggers: service.triggers.slice(0, 5), // Top 5 triggers for context
          priority: service.priority,
          isFoundational: service.code === '365_method' && service.score >= 50
        });
      }

      // Check if combined_advisory is recommended
      const combinedScore = scoringResult.scores['combined_advisory']?.score || 0;
      if (combinedScore >= 50 && !recommendations.find(r => r.service.code === 'combined_advisory')) {
        const combinedVP = await generateValueProposition(
          'combined_advisory', 
          scoringResult.emotionalAnchors, 
          combinedScore
        );
        recommendations.unshift({
          rank: 0,
          service: {
            code: 'combined_advisory',
            ...SERVICE_LINES['combined_advisory']
          },
          valueProposition: combinedVP,
          score: combinedScore,
          confidence: scoringResult.scores['combined_advisory'].confidence,
          triggers: scoringResult.scores['combined_advisory'].triggers.slice(0, 5),
          priority: 1,
          isBundled: true,
          bundledFrom: ['fractional_cfo', 'fractional_coo']
        });
      }

      // Store discovery results
      if (clientId) {
        // CRITICAL: Validate that clientId exists in practice_members before saving
        const { data: clientCheck, error: clientError } = await supabase
          .from('practice_members')
          .select('id, user_id, email, member_type, practice_id')
          .eq('id', clientId)
          .eq('member_type', 'client')
          .maybeSingle();
        
        if (clientError) {
          console.error('Error validating client_id:', clientError);
          throw new Error(`Invalid client_id: ${clientId}`);
        }
        
        if (!clientCheck) {
          console.error(`CRITICAL: client_id ${clientId} does not exist in practice_members!`);
          throw new Error(`Client ID ${clientId} not found. This may indicate a data integrity issue.`);
        }
        
        console.log(`Saving discovery assessment for client_id: ${clientId}, email: ${clientCheck.email}`);
        
        // Find existing incomplete record
        const { data: existingDiscovery } = await supabase
          .from('destination_discovery')
          .select('id')
          .eq('client_id', clientId)
          .is('completed_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const discoveryData = {
          client_id: clientId,
          practice_id: clientCheck.practice_id || null,
          responses: allResponses,
          extracted_anchors: scoringResult.emotionalAnchors,
          destination_clarity_score: calculateClarityScore(allResponses),
          gap_score: calculateGapScore(allResponses),
          recommended_services: recommendations,
          value_propositions: recommendations.map(r => r.valueProposition),
          completed_at: new Date().toISOString()
        };

        if (existingDiscovery?.id) {
          await supabase
            .from('destination_discovery')
            .update(discoveryData)
            .eq('id', existingDiscovery.id)
            .eq('client_id', clientId);
        } else {
          await supabase
            .from('destination_discovery')
            .insert(discoveryData);
        }

        // Store detection patterns
        await supabase
          .from('discovery_patterns')
          .upsert({
            discovery_id: existingDiscovery?.id,
            client_id: clientId,
            burnout_detected: scoringResult.patterns.burnoutDetected,
            burnout_flags: scoringResult.patterns.burnoutFlags,
            burnout_indicators: scoringResult.patterns.burnoutIndicators,
            capital_raising_detected: scoringResult.patterns.capitalRaisingDetected,
            capital_signals: scoringResult.patterns.capitalSignals,
            lifestyle_transformation_detected: scoringResult.patterns.lifestyleTransformationDetected,
            lifestyle_signals: scoringResult.patterns.lifestyleSignals,
            urgency_multiplier: scoringResult.patterns.urgencyMultiplier,
            change_readiness: allResponses.dd_change_readiness
          }, {
            onConflict: 'discovery_id'
          });

        // Store individual service triggers for audit trail
        for (const [code, serviceScore] of Object.entries(scoringResult.scores)) {
          if (serviceScore.score > 0) {
            for (const trigger of serviceScore.triggers) {
              await supabase
                .from('discovery_service_triggers')
                .insert({
                  discovery_id: existingDiscovery?.id,
                  service_code: code,
                  trigger_source: trigger.split(':')[0] || 'unknown',
                  trigger_description: trigger,
                  points_added: 0 // We don't track individual points in v2, just triggers
                });
            }
          }
        }
      }

      // Build score summary for response
      const scoresSummary: Record<string, number> = {};
      for (const [code, data] of Object.entries(scoringResult.scores)) {
        scoresSummary[code] = data.score;
      }

      return new Response(JSON.stringify({
        success: true,
        scores: scoresSummary,
        detailedScores: scoringResult.scores,
        recommendations,
        anchors: scoringResult.emotionalAnchors,
        patterns: scoringResult.patterns,
        summary: {
          primaryRecommendation: recommendations[0]?.service?.name,
          secondaryRecommendation: recommendations[1]?.service?.name,
          totalServicesScored: Object.keys(scoresSummary).filter(k => scoresSummary[k] > 0).length,
          totalRecommended: recommendations.length
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
  const vision = responses.dd_five_year_vision || responses.dd_five_year_story || '';
  if (vision.length > 100) score += 2;
  
  // Has magic fix / unlimited change clarity
  const magicFix = responses.dd_magic_fix || responses.dd_unlimited_change || '';
  if (magicFix.length > 50) score += 2;
  
  // Clear success definition
  if (responses.dd_success_definition && !responses.dd_success_definition.includes('Something else')) score += 2;
  
  // Has identified core frustration
  if (responses.dd_core_frustration?.length > 30) score += 2;
  
  // Clear change readiness
  const readiness = responses.dd_change_readiness || '';
  if (readiness.includes('Completely ready') || readiness.includes('Ready -')) score += 2;
  
  return Math.min(10, score);
}

function calculateGapScore(responses: Record<string, any>): number {
  let score = 0;
  
  // Hours worked indicator
  const hours = responses.dd_weekly_hours || '';
  if (hours.includes('70+') || hours.includes('stopped counting')) score += 3;
  else if (hours.includes('60-70')) score += 2;
  else if (hours.includes('50-60')) score += 1;
  
  // Firefighting ratio
  const firefighting = responses.dd_time_allocation || '';
  if (firefighting.includes('90%')) score += 3;
  else if (firefighting.includes('70%')) score += 2;
  
  // Delegation ability
  const delegation = responses.dd_delegation_ability || '';
  if (delegation.includes('Terrible')) score += 2;
  else if (delegation.includes('Poor')) score += 1;
  
  // Last real break
  const lastBreak = responses.dd_last_real_break || '';
  if (lastBreak.includes('never') || lastBreak.includes('can\'t remember')) score += 2;
  else if (lastBreak.includes('More than 2 years')) score += 1;
  
  return Math.min(10, score);
}

