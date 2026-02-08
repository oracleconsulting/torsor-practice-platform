/* COPY - Do not edit. Source: supabase/functions/_shared/service-scorer-v2.ts */
/**
 * Service Scoring Engine v2.0
 * ============================================================================
 * Comprehensive scoring engine for Discovery Assessment
 * Implements full 40-question scoring with:
 * - Choice-based triggers
 * - Keyword analysis for free text
 * - Special detection patterns (burnout, capital raising, lifestyle transformation)
 * - Urgency multiplier
 * ============================================================================
 */

export interface ServiceScore {
  code: string;
  name: string;
  score: number;
  confidence: number;
  triggers: string[];
  priority: number;
  recommended: boolean;
}

export interface DetectionPatterns {
  burnoutDetected: boolean;
  burnoutFlags: number;
  burnoutIndicators: string[];
  capitalRaisingDetected: boolean;
  capitalSignals: string[];
  lifestyleTransformationDetected: boolean;
  lifestyleSignals: string[];
  urgencyMultiplier: number;
}

export interface ScoringResult {
  scores: Record<string, ServiceScore>;
  patterns: DetectionPatterns;
  emotionalAnchors: Record<string, string>;
  recommendations: ServiceScore[];
}

// Service definitions
const SERVICES = [
  { code: '365_method', name: 'Goal Alignment Programme' },
  { code: 'management_accounts', name: 'Management Accounts' },
  { code: 'systems_audit', name: 'Systems Audit' },
  { code: 'automation', name: 'Automation Services' },
  { code: 'fractional_cfo', name: 'Fractional CFO' },
  { code: 'fractional_coo', name: 'Fractional COO' },
  { code: 'combined_advisory', name: 'Combined CFO/COO Advisory' },
  { code: 'business_advisory', name: 'Business Advisory & Exit Planning' },
  { code: 'benchmarking', name: 'Benchmarking Services' },
];

// Helper to safely get lowercase string
function getLower(value: any): string {
  if (!value) return '';
  return String(value).toLowerCase();
}

// Helper to check if text contains any keywords
function containsAny(text: string, keywords: string[]): boolean {
  const lower = getLower(text);
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// Keyword sets for text analysis
const KEYWORD_SETS = {
  team: ['team', 'people', 'staff', 'hire', 'employee', 'manager', 'delegate'],
  systems: ['systems', 'process', 'automate', 'efficient', 'streamline', 'manual', 'broken'],
  financial: ['numbers', 'finance', 'cash', 'profit', 'margin', 'accounts', 'money'],
  strategy: ['strategy', 'direction', 'plan', 'focus', 'clarity', 'goals'],
  exit: ['sell', 'exit', 'value', 'worth', 'buyer', 'succession', 'legacy'],
  burnout: ['tired', 'exhaust', 'burn', 'stress', 'overwhelm', 'breaking'],
  competition: ['compete', 'competitor', 'market', 'behind', 'losing ground'],
  capital: ['capital', 'raise', 'invest', 'funding', 'investor'],
  lifestyle_role: ['invest', 'portfolio', 'ceo', 'advisory', 'board', 'chairman', 'non-exec', 'step back'],
  lifestyle_personal: ['family', 'children', 'wife', 'husband', 'holiday', 'travel', 'health'],
  trapped: ['bad marriage', 'can\'t leave', 'trapped', 'divorce', 'ball and chain', 'prison', 'stuck'],
  exhausted: ['needy child', 'exhausting', 'demanding', 'draining'],
};

/**
 * Main scoring function
 */
export function scoreServicesFromDiscovery(responses: Record<string, any>): ScoringResult {
  // Initialize scores
  const scores: Record<string, ServiceScore> = {};
  for (const service of SERVICES) {
    scores[service.code] = {
      code: service.code,
      name: service.name,
      score: 0,
      confidence: 0,
      triggers: [],
      priority: 5,
      recommended: false,
    };
  }

  // Helper to add points
  const addPoints = (serviceCode: string, points: number, trigger: string) => {
    if (scores[serviceCode]) {
      scores[serviceCode].score += points;
      scores[serviceCode].triggers.push(trigger);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: DESTINATION DISCOVERY
  // ═══════════════════════════════════════════════════════════════════════════

  // Q1.1 - Five Year Vision (Keyword Analysis)
  const vision = getLower(responses.dd_five_year_vision);
  if (vision) {
    if (containsAny(vision, KEYWORD_SETS.lifestyle_role)) {
      addPoints('365_method', 20, 'Vision: operator-to-investor language');
    }
    if (containsAny(vision, ['sell', 'exit', 'legacy', 'succession', 'sold'])) {
      addPoints('business_advisory', 15, 'Vision: exit/legacy language');
    }
    if (containsAny(vision, KEYWORD_SETS.lifestyle_personal)) {
      addPoints('365_method', 10, 'Vision: lifestyle priorities');
    }
    if (containsAny(vision, ['team runs', 'without me', 'optional', 'freedom', 'don\'t need to'])) {
      addPoints('systems_audit', 15, 'Vision: business running without founder');
    }
    if (containsAny(vision, ['ceo', 'strategic', 'growth', 'expand'])) {
      addPoints('fractional_cfo', 10, 'Vision: growth leadership');
    }
  }

  // Q1.2 - Success Definition
  const successDef = responses.dd_success_definition;
  const successTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Building something I can sell for a life-changing amount': { services: ['business_advisory'], points: [25] },
    'Creating a business that runs profitably without me': { services: ['systems_audit', 'fractional_coo'], points: [20, 15] },
    'Growing to dominate my market/niche': { services: ['benchmarking'], points: [15] },
    'Having complete control over my time and income': { services: ['365_method'], points: [20] },
    'Building a legacy that outlasts me': { services: ['business_advisory'], points: [20] },
  };
  if (successDef && successTriggers[successDef]) {
    const t = successTriggers[successDef];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Success: "${successDef}"`));
  }

  // Q1.3 - Non-Negotiables (Multi-select)
  const nonNegs = responses.dd_non_negotiables || [];
  const nonNegArray = Array.isArray(nonNegs) ? nonNegs : [nonNegs];
  nonNegArray.forEach((item: string) => {
    if (['More time with family/loved ones', 'Better health and energy', 'Doing work that excites me', 'Making a real difference / impact'].includes(item)) {
      addPoints('365_method', 10, `Non-negotiable: "${item}"`);
    }
    if (item === 'Less day-to-day stress' || item === 'Geographic freedom / work from anywhere') {
      addPoints('systems_audit', 10, `Non-negotiable: "${item}"`);
    }
    if (item === 'Financial security for retirement') {
      addPoints('business_advisory', 10, `Non-negotiable: "${item}"`);
    }
    if (item === 'Building wealth beyond the business') {
      addPoints('fractional_cfo', 10, `Non-negotiable: wealth building`);
      addPoints('business_advisory', 10, `Non-negotiable: wealth building`);
    }
  });

  // Q1.4 - Unlimited Change (Keyword Analysis)
  const unlimited = getLower(responses.dd_unlimited_change);
  if (unlimited) {
    if (containsAny(unlimited, KEYWORD_SETS.team)) {
      addPoints('fractional_coo', 15, 'Unlimited change: team/people focus');
    }
    if (containsAny(unlimited, KEYWORD_SETS.systems)) {
      addPoints('systems_audit', 15, 'Unlimited change: systems/process focus');
      addPoints('automation', 15, 'Unlimited change: automation opportunity');
    }
    if (containsAny(unlimited, KEYWORD_SETS.financial)) {
      addPoints('management_accounts', 15, 'Unlimited change: financial focus');
    }
    if (containsAny(unlimited, KEYWORD_SETS.strategy)) {
      addPoints('365_method', 15, 'Unlimited change: strategy/clarity focus');
    }
    if (containsAny(unlimited, KEYWORD_SETS.exit)) {
      addPoints('business_advisory', 15, 'Unlimited change: exit/value focus');
    }
  }

  // Q1.5 - Exit Mindset
  const exitMindset = responses.dd_exit_mindset;
  const exitMindsetTriggers: Record<string, { services: string[]; points: number[] }> = {
    'I think about it but haven\'t planned': { services: ['business_advisory'], points: [15] },
    'I\'d love to but can\'t see how': { services: ['business_advisory', '365_method'], points: [20, 10] },
    'The thought terrifies me': { services: ['business_advisory', '365_method'], points: [25, 15] },
    'I\'ve never really considered it': { services: ['business_advisory'], points: [10] },
  };
  if (exitMindset && exitMindsetTriggers[exitMindset]) {
    const t = exitMindsetTriggers[exitMindset];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Exit mindset: "${exitMindset}"`));
  }

  // Q2.1 - Weekly Hours
  const hours = responses.dd_weekly_hours;
  const hoursTriggers: Record<string, { services: string[]; points: number[] }> = {
    '50-60 hours': { services: ['365_method'], points: [5] },
    '60-70 hours': { services: ['365_method', 'systems_audit'], points: [15, 10] },
    '70+ hours': { services: ['365_method', 'systems_audit'], points: [20, 15] },
    'I\'ve stopped counting': { services: ['365_method', 'systems_audit'], points: [25, 15] },
  };
  if (hours && hoursTriggers[hours]) {
    const t = hoursTriggers[hours];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Hours: "${hours}"`));
  }

  // Q2.2 - Firefighting Ratio
  const timeAlloc = responses.dd_time_allocation;
  const timeAllocTriggers: Record<string, { services: string[]; points: number[] }> = {
    '90% firefighting / 10% strategic': { services: ['systems_audit', '365_method'], points: [25, 20] },
    '70% firefighting / 30% strategic': { services: ['systems_audit', '365_method'], points: [20, 15] },
    '50% firefighting / 50% strategic': { services: ['systems_audit'], points: [10] },
  };
  if (timeAlloc && timeAllocTriggers[timeAlloc]) {
    const t = timeAllocTriggers[timeAlloc];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Firefighting: "${timeAlloc}"`));
  }

  // Q2.3 - Last Real Break
  const lastBreak = responses.dd_last_real_break;
  const lastBreakTriggers: Record<string, { services: string[]; points: number[] }> = {
    '1-2 years ago': { services: ['365_method'], points: [10] },
    'More than 2 years ago': { services: ['365_method', 'systems_audit'], points: [15, 10] },
    'I honestly can\'t remember': { services: ['365_method', 'systems_audit'], points: [20, 15] },
    'I\'ve never done that': { services: ['365_method', 'systems_audit'], points: [25, 20] },
  };
  if (lastBreak && lastBreakTriggers[lastBreak]) {
    const t = lastBreakTriggers[lastBreak];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Last break: "${lastBreak}"`));
  }

  // Q2.4 - Emergency Log (Keyword Analysis)
  const emergencyLog = getLower(responses.dd_emergency_log);
  if (emergencyLog) {
    if (containsAny(emergencyLog, ['call', 'phone', 'night', 'weekend', '2am', 'emergency'])) {
      addPoints('systems_audit', 20, 'Emergency log: after-hours emergencies');
    }
    if (containsAny(emergencyLog, ['only i', 'only me', 'no one else', 'had to'])) {
      addPoints('systems_audit', 20, 'Emergency log: founder dependency');
      addPoints('fractional_coo', 15, 'Emergency log: founder dependency');
    }
    if (containsAny(emergencyLog, ['client', 'customer', 'complaint'])) {
      addPoints('systems_audit', 10, 'Emergency log: client issues');
    }
    if (containsAny(emergencyLog, ['staff', 'team', 'employee', 'called in sick'])) {
      addPoints('fractional_coo', 15, 'Emergency log: people issues');
    }
    if (containsAny(emergencyLog, ['broke', 'failed', 'crashed', 'stopped working'])) {
      addPoints('systems_audit', 15, 'Emergency log: system failures');
      addPoints('automation', 10, 'Emergency log: system failures');
    }
    if (containsAny(emergencyLog, ['cash', 'payment', 'invoice', 'bank'])) {
      addPoints('management_accounts', 15, 'Emergency log: financial emergencies');
    }
    // Substantial response bonus
    if (emergencyLog.length > 50) {
      addPoints('systems_audit', 10, 'Emergency log: significant chaos indicated');
    }
  }

  // Q2.5 - Scaling Constraint
  const scalingConstraint = responses.dd_scaling_constraint;
  const scalingTriggers: Record<string, { services: string[]; points: number[] }> = {
    'My personal capacity - I\'m already maxed': { services: ['fractional_coo', 'systems_audit'], points: [20, 15] },
    'My team - we\'re stretched thin': { services: ['fractional_coo'], points: [25] },
    'Our systems and processes': { services: ['systems_audit', 'automation'], points: [25, 20] },
    'Quality would suffer': { services: ['systems_audit'], points: [15] },
    'Cash flow would be squeezed': { services: ['fractional_cfo', 'management_accounts'], points: [25, 20] },
  };
  if (scalingConstraint && scalingTriggers[scalingConstraint]) {
    const t = scalingTriggers[scalingConstraint];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Scaling constraint: "${scalingConstraint}"`));
  }

  // Q2.6 - Sleep Thief
  const sleepThief = responses.dd_sleep_thief;
  const sleepTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Cash flow and paying bills': { services: ['management_accounts', 'fractional_cfo'], points: [25, 15] },
    'A specific client or project problem': { services: ['systems_audit'], points: [10] },
    'A team member situation': { services: ['fractional_coo'], points: [25] },
    'Not knowing my numbers': { services: ['management_accounts'], points: [30] },
    'Fear of something going wrong that I can\'t see coming': { services: ['systems_audit'], points: [20] },
    'Competition or market changes': { services: ['benchmarking'], points: [20] },
    'My own health or burnout': { services: ['365_method'], points: [25] },
  };
  if (sleepThief && sleepTriggers[sleepThief]) {
    const t = sleepTriggers[sleepThief];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Sleep thief: "${sleepThief}"`));
  }

  // Q2.7 - Core Frustration (Keyword Analysis)
  const coreFrustration = getLower(responses.dd_core_frustration);
  if (coreFrustration) {
    if (containsAny(coreFrustration, KEYWORD_SETS.team)) {
      addPoints('fractional_coo', 15, 'Core frustration: people issues');
    }
    if (containsAny(coreFrustration, KEYWORD_SETS.systems)) {
      addPoints('systems_audit', 15, 'Core frustration: systems/process issues');
      addPoints('automation', 10, 'Core frustration: manual work');
    }
    if (containsAny(coreFrustration, KEYWORD_SETS.financial)) {
      addPoints('management_accounts', 15, 'Core frustration: financial issues');
    }
    if (containsAny(coreFrustration, KEYWORD_SETS.burnout)) {
      addPoints('365_method', 15, 'Core frustration: burnout indicators');
    }
    if (containsAny(coreFrustration, ['grow', 'scale', 'stuck', 'plateau', 'stagnant'])) {
      addPoints('365_method', 10, 'Core frustration: growth plateau');
      addPoints('benchmarking', 10, 'Core frustration: growth plateau');
    }
    if (containsAny(coreFrustration, KEYWORD_SETS.competition)) {
      addPoints('benchmarking', 15, 'Core frustration: competitive concerns');
    }
  }

  // Q3.1 - Key Person Dependency
  const keyPerson = responses.dd_key_person_dependency;
  const keyPersonTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Disaster - the business would struggle badly': { services: ['systems_audit', 'fractional_coo'], points: [25, 20] },
    'Major disruption for 6+ months': { services: ['systems_audit', 'fractional_coo'], points: [20, 15] },
    'Significant pain but we\'d cope': { services: ['systems_audit'], points: [10] },
    'N/A - it\'s just me': { services: ['fractional_coo', 'systems_audit'], points: [15, 15] },
  };
  if (keyPerson && keyPersonTriggers[keyPerson]) {
    const t = keyPersonTriggers[keyPerson];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Key person risk: "${keyPerson}"`));
  }

  // Q3.2 - People Challenge
  const peopleChallenge = responses.dd_people_challenge;
  const peopleTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Finding good people to hire': { services: ['fractional_coo'], points: [20] },
    'Getting the best from current team': { services: ['fractional_coo'], points: [20] },
    'Letting go of the wrong people': { services: ['fractional_coo'], points: [25] },
    'Developing future leaders': { services: ['fractional_coo'], points: [20] },
    'Managing performance consistently': { services: ['fractional_coo'], points: [20] },
    'Team culture and morale': { services: ['fractional_coo'], points: [15] },
  };
  if (peopleChallenge && peopleTriggers[peopleChallenge]) {
    const t = peopleTriggers[peopleChallenge];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `People challenge: "${peopleChallenge}"`));
  }

  // Q3.3 - Delegation Ability
  const delegation = responses.dd_delegation_ability;
  const delegationTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Good - but I sometimes take things back': { services: ['systems_audit'], points: [5] },
    'Average - I delegate but then micromanage': { services: ['systems_audit', 'fractional_coo'], points: [15, 10] },
    'Poor - I struggle to let go': { services: ['systems_audit', 'fractional_coo'], points: [20, 15] },
    'Terrible - I end up doing everything myself': { services: ['systems_audit', 'fractional_coo'], points: [25, 20] },
  };
  if (delegation && delegationTriggers[delegation]) {
    const t = delegationTriggers[delegation];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Delegation: "${delegation}"`));
  }

  // Q3.4 - Hidden From Team (Keyword Analysis)
  const hiddenFromTeam = getLower(responses.dd_hidden_from_team);
  if (hiddenFromTeam) {
    if (containsAny(hiddenFromTeam, ['profit', 'loss', 'margin', 'losing money', 'not profitable'])) {
      addPoints('management_accounts', 20, 'Hidden: profitability concerns');
    }
    if (containsAny(hiddenFromTeam, ['cash', 'runway', 'debt', 'owe', 'overdraft', 'loan'])) {
      addPoints('management_accounts', 20, 'Hidden: cash/debt concerns');
      addPoints('fractional_cfo', 15, 'Hidden: financial stress');
    }
    if (containsAny(hiddenFromTeam, ['sell', 'exit', 'close', 'quit', 'give up'])) {
      addPoints('business_advisory', 20, 'Hidden: exit thoughts');
    }
    if (containsAny(hiddenFromTeam, ['stress', 'burnout', 'overwhelm', 'struggle', 'breaking'])) {
      addPoints('365_method', 15, 'Hidden: personal struggles');
    }
    if (containsAny(hiddenFromTeam, ['worried', 'scared', 'afraid', 'terrified'])) {
      addPoints('365_method', 15, 'Hidden: fear/worry');
    }
  }

  // Q3.5 - External Perspective
  const externalView = responses.dd_external_perspective;
  const externalTriggers: Record<string, { services: string[]; points: number[] }> = {
    'They worry about me sometimes': { services: ['365_method'], points: [10] },
    'They\'ve given up complaining': { services: ['365_method'], points: [15] },
    'It\'s a significant source of tension': { services: ['365_method'], points: [20] },
    'They\'d say I\'m married to my business': { services: ['365_method'], points: [25] },
  };
  if (externalView && externalTriggers[externalView]) {
    const t = externalTriggers[externalView];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `External view: "${externalView}"`));
  }

  // Q4.1 - Avoided Conversation (Keyword Analysis)
  const avoided = getLower(responses.dd_avoided_conversation);
  if (avoided) {
    if (containsAny(avoided, ['team', 'employee', 'fire', 'performance', 'let go'])) {
      addPoints('fractional_coo', 15, 'Avoided: people conversation');
    }
    if (containsAny(avoided, ['partner', 'shareholder', 'split', 'buyout'])) {
      addPoints('business_advisory', 15, 'Avoided: partnership conversation');
    }
    if (containsAny(avoided, ['money', 'price', 'raise', 'fees', 'charge'])) {
      addPoints('management_accounts', 10, 'Avoided: pricing conversation');
    }
    if (containsAny(avoided, ['exit', 'sell', 'future', 'retire'])) {
      addPoints('business_advisory', 15, 'Avoided: exit conversation');
    }
    if (containsAny(avoided, ['myself', 'burnout', 'health', 'stop'])) {
      addPoints('365_method', 15, 'Avoided: personal conversation');
    }
  }

  // Q4.2 - Hard Truth (Keyword Analysis)
  const hardTruth = getLower(responses.dd_hard_truth);
  if (hardTruth) {
    if (containsAny(hardTruth, ['profitable', 'margin', 'losing', 'money', 'bleeding'])) {
      addPoints('management_accounts', 20, 'Hard truth: profitability');
    }
    if (containsAny(hardTruth, ['scale', 'grow', 'stuck', 'plateau', 'ceiling'])) {
      addPoints('365_method', 15, 'Hard truth: growth plateau');
      addPoints('systems_audit', 10, 'Hard truth: scaling issues');
    }
    if (containsAny(hardTruth, ['me', 'founder', 'dependent', 'essential', 'can\'t leave'])) {
      addPoints('systems_audit', 20, 'Hard truth: founder dependency');
      addPoints('fractional_coo', 15, 'Hard truth: founder dependency');
    }
    if (containsAny(hardTruth, ['team', 'people', 'wrong', 'hire', 'fire'])) {
      addPoints('fractional_coo', 20, 'Hard truth: team issues');
    }
    if (containsAny(hardTruth, ['worth', 'value', 'sellable', 'buyer'])) {
      addPoints('business_advisory', 20, 'Hard truth: business value');
    }
  }

  // Q4.3 - Relationship Mirror (Sentiment Analysis)
  const relationship = getLower(responses.dd_relationship_mirror);
  if (relationship) {
    if (containsAny(relationship, KEYWORD_SETS.trapped)) {
      addPoints('365_method', 25, 'Relationship: feels trapped');
      addPoints('business_advisory', 15, 'Relationship: trapped/exit consideration');
    }
    if (containsAny(relationship, KEYWORD_SETS.exhausted)) {
      addPoints('365_method', 20, 'Relationship: exhausted');
      addPoints('systems_audit', 15, 'Relationship: demanding systems');
    }
    if (containsAny(relationship, ['love affair gone stale', 'lost spark', 'bored'])) {
      addPoints('365_method', 15, 'Relationship: disengaged');
    }
  }

  // Q4.4 - Sacrifice List (Keyword Analysis)
  const sacrifice = getLower(responses.dd_sacrifice_list);
  if (sacrifice) {
    if (containsAny(sacrifice, ['family', 'children', 'kids', 'wife', 'husband', 'marriage'])) {
      addPoints('365_method', 20, 'Sacrificed: family time');
    }
    if (containsAny(sacrifice, ['health', 'fitness', 'weight', 'sleep', 'exercise'])) {
      addPoints('365_method', 20, 'Sacrificed: health');
    }
    if (containsAny(sacrifice, ['holiday', 'vacation', 'travel', 'break', 'time off'])) {
      addPoints('365_method', 15, 'Sacrificed: breaks');
      addPoints('systems_audit', 10, 'Sacrificed: unable to step away');
    }
    if (containsAny(sacrifice, ['friends', 'social', 'relationships', 'hobbies'])) {
      addPoints('365_method', 15, 'Sacrificed: social life');
    }
    if (containsAny(sacrifice, ['money', 'savings', 'pension', 'security'])) {
      addPoints('fractional_cfo', 15, 'Sacrificed: financial security');
    }
    if (containsAny(sacrifice, ['everything', 'all of it', 'too much'])) {
      addPoints('365_method', 25, 'Sacrificed: everything');
    }
    // Substantial sacrifice bonus
    if (sacrifice.length > 100) {
      addPoints('365_method', 10, 'Sacrificed: significant personal cost');
    }
  }

  // Q4.5 - Suspected Truth (Keyword Analysis)
  const suspected = getLower(responses.dd_suspected_truth);
  if (suspected) {
    if (containsAny(suspected, ['margin', 'profit', 'losing', 'cost', 'pricing', 'undercharging'])) {
      addPoints('management_accounts', 25, 'Suspects: margin/profit issues');
    }
    if (containsAny(suspected, ['underperform', 'behind', 'compared', 'competitor', 'industry'])) {
      addPoints('benchmarking', 20, 'Suspects: underperformance');
    }
    if (containsAny(suspected, ['waste', 'inefficient', 'time', 'money', 'leak'])) {
      addPoints('systems_audit', 15, 'Suspects: inefficiency');
    }
    if (containsAny(suspected, ['worth', 'value', 'sell', 'less than'])) {
      addPoints('business_advisory', 15, 'Suspects: value concerns');
    }
    if (containsAny(suspected, ['staff', 'team', 'productivity', 'carrying'])) {
      addPoints('fractional_coo', 15, 'Suspects: team productivity');
    }
  }

  // Q5.1 - Magic Fix (Keyword Analysis)
  const magicFix = getLower(responses.dd_magic_fix);
  if (magicFix) {
    if (containsAny(magicFix, ['numbers', 'accounts', 'financial', 'visibility', 'dashboard'])) {
      addPoints('management_accounts', 25, 'Magic fix: financial visibility');
    }
    if (containsAny(magicFix, ['team', 'hire', 'people', 'manager', 'delegate'])) {
      addPoints('fractional_coo', 25, 'Magic fix: team/people');
    }
    if (containsAny(magicFix, ['systems', 'process', 'automate', 'efficient'])) {
      addPoints('systems_audit', 25, 'Magic fix: systems/processes');
      addPoints('automation', 20, 'Magic fix: automation');
    }
    if (containsAny(magicFix, ['plan', 'strategy', 'direction', 'clarity', 'focus'])) {
      addPoints('365_method', 25, 'Magic fix: clarity/strategy');
    }
    if (containsAny(magicFix, ['sell', 'exit', 'value', 'buyer'])) {
      addPoints('business_advisory', 25, 'Magic fix: exit/sale');
    }
    if (containsAny(magicFix, ['grow', 'scale', 'revenue', 'clients'])) {
      addPoints('benchmarking', 15, 'Magic fix: growth');
    }
    if (containsAny(magicFix, ['time', 'freedom', 'step back', 'holiday'])) {
      addPoints('365_method', 20, 'Magic fix: freedom');
      addPoints('systems_audit', 15, 'Magic fix: ability to step back');
    }
  }

  // Q5.3 - Final Insight (general keyword scan)
  const finalInsight = getLower(responses.dd_final_insight);
  if (finalInsight && finalInsight.length > 20) {
    // Scan for any service-related keywords and add small bonus
    if (containsAny(finalInsight, KEYWORD_SETS.financial)) addPoints('management_accounts', 10, 'Final insight: financial focus');
    if (containsAny(finalInsight, KEYWORD_SETS.team)) addPoints('fractional_coo', 10, 'Final insight: team focus');
    if (containsAny(finalInsight, KEYWORD_SETS.systems)) addPoints('systems_audit', 10, 'Final insight: systems focus');
    if (containsAny(finalInsight, KEYWORD_SETS.strategy)) addPoints('365_method', 10, 'Final insight: strategy focus');
    if (containsAny(finalInsight, KEYWORD_SETS.exit)) addPoints('business_advisory', 10, 'Final insight: exit focus');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: SERVICE DIAGNOSTICS
  // ═══════════════════════════════════════════════════════════════════════════

  // SD Q1.1 - Financial Confidence
  const finConfidence = responses.sd_financial_confidence;
  const finConfTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Uncertain - I\'m often surprised': { services: ['management_accounts'], points: [25] },
    'Not confident - I mostly guess': { services: ['management_accounts'], points: [30] },
    'I avoid financial decisions because I don\'t trust the data': { services: ['management_accounts', 'fractional_cfo'], points: [30, 15] },
  };
  if (finConfidence && finConfTriggers[finConfidence]) {
    const t = finConfTriggers[finConfidence];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Financial confidence: "${finConfidence}"`));
  }

  // SD Q1.2 - Numbers Into Action
  const numbersAction = responses.sd_numbers_action_frequency;
  const numbersActionTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Quarterly - when accounts come through': { services: ['management_accounts'], points: [20] },
    'Rarely - I don\'t find them useful': { services: ['management_accounts'], points: [25] },
    'Never - I don\'t get meaningful management information': { services: ['management_accounts'], points: [30] },
  };
  if (numbersAction && numbersActionTriggers[numbersAction]) {
    const t = numbersActionTriggers[numbersAction];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Numbers action: "${numbersAction}"`));
  }

  // SD Q1.3 - Benchmark Awareness
  const benchmarkAware = responses.sd_benchmark_awareness;
  const benchmarkTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Roughly - I have a general sense': { services: ['benchmarking'], points: [15] },
    'No - I\'d love to know but don\'t have access': { services: ['benchmarking'], points: [30] },
    'Never considered it': { services: ['benchmarking'], points: [25] },
  };
  if (benchmarkAware && benchmarkTriggers[benchmarkAware]) {
    const t = benchmarkTriggers[benchmarkAware];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Benchmark awareness: "${benchmarkAware}"`));
  }

  // SD Q2.1 - Founder Dependency
  const founderDep = responses.sd_founder_dependency;
  const founderDepTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Significant problems - but wouldn\'t collapse': { services: ['systems_audit'], points: [15] },
    'Chaos - I\'m essential to everything': { services: ['systems_audit', 'fractional_coo'], points: [30, 20] },
    'I honestly don\'t know - never tested it': { services: ['systems_audit'], points: [20] },
  };
  if (founderDep && founderDepTriggers[founderDep]) {
    const t = founderDepTriggers[founderDep];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Founder dependency: "${founderDep}"`));
  }

  // SD Q2.2 - Manual Work Percentage
  const manualWork = responses.sd_manual_work_percentage;
  const manualWorkTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Some - maybe 10-20%': { services: ['automation'], points: [10] },
    'Significant - probably 30-50%': { services: ['systems_audit', 'automation'], points: [20, 30] },
    'Too much - over half our effort is manual': { services: ['systems_audit', 'automation'], points: [25, 35] },
    'I don\'t know - never measured it': { services: ['systems_audit'], points: [15] },
  };
  if (manualWork && manualWorkTriggers[manualWork]) {
    const t = manualWorkTriggers[manualWork];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Manual work: "${manualWork}"`));
  }

  // SD Q2.3 - Manual Tasks (Multi-select) - cumulative points
  const manualTasks = responses.sd_manual_tasks || [];
  const manualTasksArray = Array.isArray(manualTasks) ? manualTasks : [manualTasks];
  manualTasksArray.forEach((task: string) => {
    if (task === 'Data entry between systems') {
      addPoints('automation', 20, 'Manual task: data entry');
    }
    if (task === 'Generating reports manually') {
      addPoints('automation', 15, 'Manual task: report generation');
      addPoints('management_accounts', 10, 'Manual task: report generation');
    }
    if (task === 'Processing invoices') {
      addPoints('automation', 20, 'Manual task: invoice processing');
    }
    if (task === 'Chasing people (emails, follow-ups)') {
      addPoints('automation', 15, 'Manual task: follow-ups');
    }
    if (task === 'Creating documents from scratch') {
      addPoints('automation', 15, 'Manual task: document creation');
    }
    if (task === 'Approval workflows (getting sign-offs)') {
      addPoints('automation', 15, 'Manual task: approvals');
      addPoints('systems_audit', 10, 'Manual task: approvals');
    }
    if (task === 'Reconciling data between systems') {
      addPoints('automation', 20, 'Manual task: reconciliation');
      addPoints('management_accounts', 15, 'Manual task: reconciliation');
    }
  });

  // SD Q2.4 - Problem Awareness
  const problemSpeed = responses.sd_problem_awareness_speed;
  const problemSpeedTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Days later - when problems compound': { services: ['systems_audit'], points: [20] },
    'Often too late - when customers complain': { services: ['systems_audit'], points: [25] },
    'We\'re often blindsided': { services: ['systems_audit', 'management_accounts'], points: [30, 15] },
  };
  if (problemSpeed && problemSpeedTriggers[problemSpeed]) {
    const t = problemSpeedTriggers[problemSpeed];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Problem awareness: "${problemSpeed}"`));
  }

  // SD Q3.1 - Plan Clarity
  const planClarity = responses.sd_plan_clarity;
  const planClarityTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Sort of - I know what I want to achieve': { services: ['365_method'], points: [10] },
    'I have goals but not a real plan': { services: ['365_method'], points: [20] },
    'I\'m too busy to plan': { services: ['365_method'], points: [25] },
    'I\'ve given up on planning - things always change': { services: ['365_method'], points: [25] },
  };
  if (planClarity && planClarityTriggers[planClarity]) {
    const t = planClarityTriggers[planClarity];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Plan clarity: "${planClarity}"`));
  }

  // SD Q3.2 - Accountability Source
  const accountability = responses.sd_accountability_source;
  const accountabilityTriggers: Record<string, { services: string[]; points: number[] }> = {
    'My spouse/family (informally)': { services: ['365_method'], points: [15] },
    'No one - just me': { services: ['365_method'], points: [20] },
  };
  if (accountability && accountabilityTriggers[accountability]) {
    const t = accountabilityTriggers[accountability];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Accountability: "${accountability}"`));
  }

  // SD Q3.3 - Growth Blocker
  const growthBlocker = responses.sd_growth_blocker;
  const growthBlockerTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Lack of clarity on where to focus': { services: ['365_method'], points: [25] },
    'Not enough leads or customers': { services: ['benchmarking'], points: [10] },
    'Can\'t deliver more without breaking things': { services: ['systems_audit', 'automation'], points: [25, 15] },
    'Don\'t have the right people': { services: ['fractional_coo'], points: [25] },
    'Don\'t have the capital': { services: ['fractional_cfo'], points: [25] },
    'Market conditions / external factors': { services: ['benchmarking'], points: [15] },
  };
  if (growthBlocker && growthBlockerTriggers[growthBlocker]) {
    const t = growthBlockerTriggers[growthBlocker];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Growth blocker: "${growthBlocker}"`));
  }

  // SD Q4.1 - Documentation Readiness
  const docReadiness = responses.sd_documentation_readiness;
  const docReadinessTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Probably - most things are documented': { services: ['business_advisory'], points: [10] },
    'It would take weeks to pull together': { services: ['business_advisory'], points: [20] },
    'Months - things are scattered everywhere': { services: ['business_advisory'], points: [25] },
    'I don\'t know where I\'d even start': { services: ['business_advisory'], points: [30] },
  };
  if (docReadiness && docReadinessTriggers[docReadiness]) {
    const t = docReadinessTriggers[docReadiness];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Documentation: "${docReadiness}"`));
  }

  // SD Q4.2 - Valuation Understanding
  const valuation = responses.sd_valuation_understanding;
  const valuationTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Roughly - I have a sense of the multiple': { services: ['benchmarking'], points: [10] },
    'No idea - it\'s never come up': { services: ['benchmarking', 'business_advisory'], points: [20, 15] },
    'I try not to think about it': { services: ['benchmarking', 'business_advisory'], points: [25, 20] },
  };
  if (valuation && valuationTriggers[valuation]) {
    const t = valuationTriggers[valuation];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Valuation: "${valuation}"`));
  }

  // SD Q4.3 - Exit Timeline
  const exitTimeline = responses.sd_exit_timeline;
  const exitTimelineTriggers: Record<string, { services: string[]; points: number[] }> = {
    'Already exploring options': { services: ['business_advisory'], points: [35] },
    '1-3 years - actively preparing': { services: ['business_advisory'], points: [30] },
    '3-5 years - need to start thinking': { services: ['business_advisory'], points: [20] },
    '5-10 years - distant horizon': { services: ['business_advisory'], points: [10] },
    'No exit plan - haven\'t thought about it': { services: ['business_advisory'], points: [15] },
  };
  if (exitTimeline && exitTimelineTriggers[exitTimeline]) {
    const t = exitTimelineTriggers[exitTimeline];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Exit timeline: "${exitTimeline}"`));
  }

  // SD Q5.1 - Competitive Position
  const compPosition = responses.sd_competitive_position;
  const compPositionTriggers: Record<string, { services: string[]; points: number[] }> = {
    'We\'re competitive - holding our own': { services: ['benchmarking'], points: [10] },
    'We\'re losing ground to competitors': { services: ['benchmarking'], points: [30] },
    'I don\'t really know how we compare': { services: ['benchmarking'], points: [25] },
  };
  if (compPosition && compPositionTriggers[compPosition]) {
    const t = compPositionTriggers[compPosition];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Competitive position: "${compPosition}"`));
  }

  // SD Q5.2 - Operational Frustration (Keyword Analysis)
  const opsFrustration = getLower(responses.sd_operational_frustration);
  if (opsFrustration) {
    if (containsAny(opsFrustration, ['manual', 'repetitive', 'data entry', 'copy', 'paste'])) {
      addPoints('automation', 25, 'Operational frustration: manual work');
    }
    if (containsAny(opsFrustration, ['systems', 'process', 'broken', 'inefficient', 'clunky'])) {
      addPoints('systems_audit', 20, 'Operational frustration: systems issues');
    }
    if (containsAny(opsFrustration, ['team', 'people', 'staff', 'hire', 'training'])) {
      addPoints('fractional_coo', 15, 'Operational frustration: people issues');
    }
    if (containsAny(opsFrustration, ['time', 'hours', 'slow', 'waiting', 'bottleneck'])) {
      addPoints('automation', 15, 'Operational frustration: time/bottlenecks');
      addPoints('systems_audit', 15, 'Operational frustration: time/bottlenecks');
    }
    if (containsAny(opsFrustration, ['reports', 'numbers', 'data', 'spreadsheet'])) {
      addPoints('management_accounts', 15, 'Operational frustration: reporting');
      addPoints('automation', 10, 'Operational frustration: reporting');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL DETECTION PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  const patterns: DetectionPatterns = {
    burnoutDetected: false,
    burnoutFlags: 0,
    burnoutIndicators: [],
    capitalRaisingDetected: false,
    capitalSignals: [],
    lifestyleTransformationDetected: false,
    lifestyleSignals: [],
    urgencyMultiplier: 1.0,
  };

  // Burnout Detection
  const burnoutHours = ['60-70 hours', '70+ hours', 'I\'ve stopped counting'];
  const burnoutBreaks = ['More than 2 years ago', 'I honestly can\'t remember', 'I\'ve never done that'];
  const burnoutExternal = ['They\'ve given up complaining', 'It\'s a significant source of tension', 'They\'d say I\'m married to my business'];
  const burnoutFirefighting = ['90% firefighting / 10% strategic', '70% firefighting / 30% strategic'];

  if (burnoutHours.includes(hours)) {
    patterns.burnoutFlags++;
    patterns.burnoutIndicators.push('Excessive hours');
  }
  if (burnoutBreaks.includes(lastBreak)) {
    patterns.burnoutFlags++;
    patterns.burnoutIndicators.push('No real breaks');
  }
  if (burnoutExternal.includes(externalView)) {
    patterns.burnoutFlags++;
    patterns.burnoutIndicators.push('Relationship strain');
  }
  if (burnoutFirefighting.includes(timeAlloc)) {
    patterns.burnoutFlags++;
    patterns.burnoutIndicators.push('High firefighting');
  }
  if (sleepThief === 'My own health or burnout') {
    patterns.burnoutFlags++;
    patterns.burnoutIndicators.push('Health/burnout concerns');
  }

  if (patterns.burnoutFlags >= 3) {
    patterns.burnoutDetected = true;
    scores['365_method'].score = Math.round(scores['365_method'].score * 1.4);
    scores['365_method'].triggers.push('Burnout pattern detected (3+ indicators)');
  }

  // Capital Raising Detection
  if (growthBlocker === 'Don\'t have the capital') {
    patterns.capitalSignals.push('Growth blocker: capital');
  }
  if (containsAny(getLower(responses.dd_unlimited_change), KEYWORD_SETS.capital)) {
    patterns.capitalSignals.push('Unlimited change: capital mention');
  }
  if (['Already exploring options', '1-3 years - actively preparing'].includes(exitTimeline)) {
    patterns.capitalSignals.push('Exit timeline: near-term');
  }
  if (containsAny(vision, KEYWORD_SETS.capital)) {
    patterns.capitalSignals.push('Vision: capital/investment');
  }

  if (patterns.capitalSignals.length >= 2) {
    patterns.capitalRaisingDetected = true;
    scores['fractional_cfo'].score = Math.round(scores['fractional_cfo'].score * 1.5);
    scores['fractional_cfo'].triggers.push('Capital raising pattern detected');
    scores['management_accounts'].score = Math.round(scores['management_accounts'].score * 1.3);
    scores['business_advisory'].score = Math.round(scores['business_advisory'].score * 1.3);
  }

  // Lifestyle Transformation Detection
  if (containsAny(vision, KEYWORD_SETS.lifestyle_role)) {
    patterns.lifestyleSignals.push('Vision: role change');
  }
  if (containsAny(vision, KEYWORD_SETS.lifestyle_personal)) {
    patterns.lifestyleSignals.push('Vision: lifestyle priorities');
  }
  const lifestyleSuccessOptions = [
    'Creating a business that runs profitably without me',
    'Building a legacy that outlasts me',
    'Having complete control over my time and income'
  ];
  if (lifestyleSuccessOptions.includes(successDef)) {
    patterns.lifestyleSignals.push('Success: lifestyle-focused');
  }
  if (containsAny(relationship, KEYWORD_SETS.trapped) || containsAny(relationship, KEYWORD_SETS.exhausted)) {
    patterns.lifestyleSignals.push('Relationship: negative sentiment');
  }

  if (patterns.lifestyleSignals.length >= 3) {
    patterns.lifestyleTransformationDetected = true;
    scores['365_method'].score = Math.round(scores['365_method'].score * 1.5);
    scores['365_method'].triggers.push('Lifestyle transformation pattern detected');
    scores['fractional_coo'].score = Math.round(scores['fractional_coo'].score * 1.3);
    scores['systems_audit'].score = Math.round(scores['systems_audit'].score * 1.2);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // URGENCY MULTIPLIER
  // ═══════════════════════════════════════════════════════════════════════════

  const changeReadiness = responses.dd_change_readiness;
  const urgencyMultipliers: Record<string, number> = {
    'Completely ready - I\'ll do whatever it takes': 1.3,
    'Ready - as long as I understand the why': 1.2,
    'Open - but I\'ll need convincing': 1.0,
    'Hesitant - change feels risky': 0.9,
    'Resistant - I prefer how things are': 0.7,
  };
  patterns.urgencyMultiplier = urgencyMultipliers[changeReadiness] || 1.0;

  // Apply urgency multiplier to all scores
  for (const code of Object.keys(scores)) {
    scores[code].score = Math.round(scores[code].score * patterns.urgencyMultiplier);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINED ADVISORY CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  if (scores['fractional_cfo'].score >= 40 && scores['fractional_coo'].score >= 40) {
    scores['combined_advisory'].score = Math.round(
      (scores['fractional_cfo'].score + scores['fractional_coo'].score) / 2
    );
    scores['combined_advisory'].triggers = [
      ...scores['fractional_cfo'].triggers.slice(0, 3),
      ...scores['fractional_coo'].triggers.slice(0, 3),
      'Combined: Both CFO and COO needs detected',
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FINALIZE SCORES
  // ═══════════════════════════════════════════════════════════════════════════

  // Cap at 100, calculate confidence, assign priority
  for (const code of Object.keys(scores)) {
    scores[code].score = Math.min(100, scores[code].score);
    scores[code].confidence = Math.min(100, scores[code].triggers.length * 20);
    
    if (scores[code].score >= 70) {
      scores[code].priority = 1;
      scores[code].recommended = true;
    } else if (scores[code].score >= 50) {
      scores[code].priority = 2;
      scores[code].recommended = true;
    } else if (scores[code].score >= 30) {
      scores[code].priority = 3;
      scores[code].recommended = false;
    } else {
      scores[code].priority = 4;
      scores[code].recommended = false;
    }
  }

  // Build recommendations list (sorted by score)
  const recommendations = Object.values(scores)
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Re-assign priorities based on sorted order
  let priorityCounter = 1;
  for (const rec of recommendations) {
    if (rec.score >= 50) {
      rec.priority = priorityCounter++;
    }
  }

  // Extract emotional anchors for report generation
  const emotionalAnchors: Record<string, string> = {
    tuesdayTest: responses.dd_five_year_vision || '',
    unlimitedChange: responses.dd_unlimited_change || '',
    emergencyLog: responses.dd_emergency_log || '',
    coreFrustration: responses.dd_core_frustration || '',
    hiddenFromTeam: responses.dd_hidden_from_team || '',
    avoidedConversation: responses.dd_avoided_conversation || '',
    hardTruth: responses.dd_hard_truth || '',
    relationshipMirror: responses.dd_relationship_mirror || '',
    sacrificeList: responses.dd_sacrifice_list || '',
    suspectedTruth: responses.dd_suspected_truth || '',
    magicFix: responses.dd_magic_fix || '',
    operationalFrustration: responses.sd_operational_frustration || '',
    finalInsight: responses.dd_final_insight || '',
  };

  return {
    scores,
    patterns,
    emotionalAnchors,
    recommendations,
  };
}

