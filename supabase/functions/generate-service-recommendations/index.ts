// ============================================================================
// DESTINATION-FIRST SERVICE RECOMMENDATION ENGINE v2.0
// ============================================================================
// Analyzes discovery responses and generates personalized service recommendations
// with value propositions that use the CLIENT'S OWN WORDS
// Updated: January 2026 - 40-question comprehensive scoring
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// SERVICE SCORER V2.0 (INLINED)
// ============================================================================

interface ServiceScore {
  code: string;
  name: string;
  score: number;
  confidence: number;
  triggers: string[];
  priority: number;
  recommended: boolean;
}

interface DetectionPatterns {
  burnoutDetected: boolean;
  burnoutFlags: number;
  burnoutIndicators: string[];
  capitalRaisingDetected: boolean;
  capitalSignals: string[];
  lifestyleTransformationDetected: boolean;
  lifestyleSignals: string[];
  urgencyMultiplier: number;
}

interface ScoringResult {
  scores: Record<string, ServiceScore>;
  patterns: DetectionPatterns;
  emotionalAnchors: Record<string, string>;
  recommendations: ServiceScore[];
}

const SCORING_SERVICES = [
  { code: '365_method', name: '365 Alignment Programme' },
  { code: 'management_accounts', name: 'Management Accounts' },
  { code: 'systems_audit', name: 'Systems Audit' },
  { code: 'automation', name: 'Automation Services' },
  { code: 'fractional_cfo', name: 'Fractional CFO' },
  { code: 'fractional_coo', name: 'Fractional COO' },
  { code: 'combined_advisory', name: 'Combined CFO/COO Advisory' },
  { code: 'business_advisory', name: 'Business Advisory & Exit Planning' },
  { code: 'benchmarking', name: 'Benchmarking Services' },
];

function getLower(value: any): string {
  if (!value) return '';
  return String(value).toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = getLower(text);
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

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

function scoreServicesFromDiscovery(responses: Record<string, any>): ScoringResult {
  const scores: Record<string, ServiceScore> = {};
  for (const service of SCORING_SERVICES) {
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

  const addPoints = (serviceCode: string, points: number, trigger: string) => {
    if (scores[serviceCode]) {
      scores[serviceCode].score += points;
      scores[serviceCode].triggers.push(trigger);
    }
  };

  // Q1.1 - Vision (Keyword Analysis)
  const vision = getLower(responses.dd_five_year_vision);
  if (vision) {
    if (containsAny(vision, KEYWORD_SETS.lifestyle_role)) addPoints('365_method', 20, 'Vision: operator-to-investor');
    if (containsAny(vision, ['sell', 'exit', 'legacy', 'succession', 'sold'])) addPoints('business_advisory', 15, 'Vision: exit/legacy');
    if (containsAny(vision, KEYWORD_SETS.lifestyle_personal)) addPoints('365_method', 10, 'Vision: lifestyle');
    if (containsAny(vision, ['team runs', 'without me', 'optional', 'freedom'])) addPoints('systems_audit', 15, 'Vision: business without founder');
    if (containsAny(vision, ['ceo', 'strategic', 'growth', 'expand'])) addPoints('fractional_cfo', 10, 'Vision: growth');
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

  // Q1.3 - Non-Negotiables
  const nonNegs = responses.dd_non_negotiables || [];
  const nonNegArray = Array.isArray(nonNegs) ? nonNegs : [nonNegs];
  nonNegArray.forEach((item: string) => {
    if (['More time with family/loved ones', 'Better health and energy', 'Doing work that excites me'].includes(item)) addPoints('365_method', 10, `Non-neg: "${item}"`);
    if (item === 'Less day-to-day stress' || item === 'Geographic freedom / work from anywhere') addPoints('systems_audit', 10, `Non-neg: "${item}"`);
    if (item === 'Financial security for retirement') addPoints('business_advisory', 10, `Non-neg: retirement`);
    if (item === 'Building wealth beyond the business') { addPoints('fractional_cfo', 10, 'Non-neg: wealth'); addPoints('business_advisory', 10, 'Non-neg: wealth'); }
  });

  // Q1.4 - Unlimited Change (Keywords)
  const unlimited = getLower(responses.dd_unlimited_change);
  if (unlimited) {
    if (containsAny(unlimited, KEYWORD_SETS.team)) addPoints('fractional_coo', 15, 'Unlimited: team');
    if (containsAny(unlimited, KEYWORD_SETS.systems)) { addPoints('systems_audit', 15, 'Unlimited: systems'); addPoints('automation', 15, 'Unlimited: automation'); }
    if (containsAny(unlimited, KEYWORD_SETS.financial)) addPoints('management_accounts', 15, 'Unlimited: financial');
    if (containsAny(unlimited, KEYWORD_SETS.strategy)) addPoints('365_method', 15, 'Unlimited: strategy');
    if (containsAny(unlimited, KEYWORD_SETS.exit)) addPoints('business_advisory', 15, 'Unlimited: exit');
  }

  // Q1.5 - Exit Mindset
  const exitMindset = responses.dd_exit_mindset;
  const exitMindsetTriggers: Record<string, { services: string[]; points: number[] }> = {
    'I think about it but haven\'t planned': { services: ['business_advisory'], points: [15] },
    'I\'d love to but can\'t see how': { services: ['business_advisory', '365_method'], points: [20, 10] },
    'The thought terrifies me': { services: ['business_advisory', '365_method'], points: [25, 15] },
  };
  if (exitMindset && exitMindsetTriggers[exitMindset]) {
    const t = exitMindsetTriggers[exitMindset];
    t.services.forEach((svc, i) => addPoints(svc, t.points[i], `Exit mindset: "${exitMindset}"`));
  }

  // Q2.1 - Hours
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

  // Q2.2 - Firefighting
  const timeAlloc = responses.dd_time_allocation;
  if (timeAlloc === '90% firefighting / 10% strategic') { addPoints('systems_audit', 25, 'Firefighting: 90%'); addPoints('365_method', 20, 'Firefighting: 90%'); }
  else if (timeAlloc === '70% firefighting / 30% strategic') { addPoints('systems_audit', 20, 'Firefighting: 70%'); addPoints('365_method', 15, 'Firefighting: 70%'); }
  else if (timeAlloc === '50% firefighting / 50% strategic') addPoints('systems_audit', 10, 'Firefighting: 50%');

  // Q2.3 - Last Break
  const lastBreak = responses.dd_last_real_break;
  if (lastBreak === '1-2 years ago') addPoints('365_method', 10, 'Last break: 1-2 years');
  else if (lastBreak === 'More than 2 years ago') { addPoints('365_method', 15, 'Last break: 2+ years'); addPoints('systems_audit', 10, 'Last break: 2+ years'); }
  else if (lastBreak === 'I honestly can\'t remember') { addPoints('365_method', 20, 'Last break: can\'t remember'); addPoints('systems_audit', 15, 'Last break: can\'t remember'); }
  else if (lastBreak === 'I\'ve never done that') { addPoints('365_method', 25, 'Last break: never'); addPoints('systems_audit', 20, 'Last break: never'); }

  // Q2.4 - Emergency Log (Keywords)
  const emergencyLog = getLower(responses.dd_emergency_log);
  if (emergencyLog) {
    if (containsAny(emergencyLog, ['call', 'phone', 'night', 'weekend', '2am', 'emergency'])) addPoints('systems_audit', 20, 'Emergency: after-hours');
    if (containsAny(emergencyLog, ['only i', 'only me', 'no one else', 'had to'])) { addPoints('systems_audit', 20, 'Emergency: founder dep'); addPoints('fractional_coo', 15, 'Emergency: founder dep'); }
    if (containsAny(emergencyLog, ['staff', 'team', 'employee'])) addPoints('fractional_coo', 15, 'Emergency: people');
    if (containsAny(emergencyLog, ['broke', 'failed', 'crashed'])) { addPoints('systems_audit', 15, 'Emergency: system failures'); addPoints('automation', 10, 'Emergency: system failures'); }
    if (containsAny(emergencyLog, ['cash', 'payment', 'invoice', 'bank'])) addPoints('management_accounts', 15, 'Emergency: financial');
    if (emergencyLog.length > 50) addPoints('systems_audit', 10, 'Emergency: significant chaos');
  }

  // Q2.5 - Scaling Constraint
  const scalingConstraint = responses.dd_scaling_constraint;
  if (scalingConstraint === 'My personal capacity - I\'m already maxed') { addPoints('fractional_coo', 20, 'Scaling: capacity'); addPoints('systems_audit', 15, 'Scaling: capacity'); }
  else if (scalingConstraint === 'My team - we\'re stretched thin') addPoints('fractional_coo', 25, 'Scaling: team');
  else if (scalingConstraint === 'Our systems and processes') { addPoints('systems_audit', 25, 'Scaling: systems'); addPoints('automation', 20, 'Scaling: systems'); }
  else if (scalingConstraint === 'Quality would suffer') addPoints('systems_audit', 15, 'Scaling: quality');
  else if (scalingConstraint === 'Cash flow would be squeezed') { addPoints('fractional_cfo', 25, 'Scaling: cash'); addPoints('management_accounts', 20, 'Scaling: cash'); }

  // Q2.6 - Sleep Thief
  const sleepThief = responses.dd_sleep_thief;
  if (sleepThief === 'Cash flow and paying bills') { addPoints('management_accounts', 25, 'Sleep: cash'); addPoints('fractional_cfo', 15, 'Sleep: cash'); }
  else if (sleepThief === 'A team member situation') addPoints('fractional_coo', 25, 'Sleep: team');
  else if (sleepThief === 'Not knowing my numbers') addPoints('management_accounts', 30, 'Sleep: numbers');
  else if (sleepThief === 'Fear of something going wrong') addPoints('systems_audit', 20, 'Sleep: fear');
  else if (sleepThief === 'Competition or market changes') addPoints('benchmarking', 20, 'Sleep: competition');
  else if (sleepThief === 'My own health or burnout') addPoints('365_method', 25, 'Sleep: burnout');

  // Q2.7 - Core Frustration (Keywords)
  const coreFrustration = getLower(responses.dd_core_frustration);
  if (coreFrustration) {
    if (containsAny(coreFrustration, KEYWORD_SETS.team)) addPoints('fractional_coo', 15, 'Frustration: people');
    if (containsAny(coreFrustration, KEYWORD_SETS.systems)) { addPoints('systems_audit', 15, 'Frustration: systems'); addPoints('automation', 10, 'Frustration: manual'); }
    if (containsAny(coreFrustration, KEYWORD_SETS.financial)) addPoints('management_accounts', 15, 'Frustration: financial');
    if (containsAny(coreFrustration, KEYWORD_SETS.burnout)) addPoints('365_method', 15, 'Frustration: burnout');
    if (containsAny(coreFrustration, ['grow', 'scale', 'stuck', 'plateau'])) { addPoints('365_method', 10, 'Frustration: plateau'); addPoints('benchmarking', 10, 'Frustration: plateau'); }
    if (containsAny(coreFrustration, KEYWORD_SETS.competition)) addPoints('benchmarking', 15, 'Frustration: competition');
  }

  // Q3.1 - Key Person Dependency
  const keyPerson = responses.dd_key_person_dependency;
  if (keyPerson === 'Disaster - the business would struggle badly') { addPoints('systems_audit', 25, 'Key person: disaster'); addPoints('fractional_coo', 20, 'Key person: disaster'); }
  else if (keyPerson === 'Major disruption for 6+ months') { addPoints('systems_audit', 20, 'Key person: major'); addPoints('fractional_coo', 15, 'Key person: major'); }
  else if (keyPerson === 'N/A - it\'s just me') { addPoints('fractional_coo', 15, 'Key person: solo'); addPoints('systems_audit', 15, 'Key person: solo'); }

  // Q3.2 - People Challenge
  const peopleChallenge = responses.dd_people_challenge;
  if (['Finding good people to hire', 'Getting the best from current team', 'Developing future leaders', 'Managing performance consistently'].includes(peopleChallenge)) addPoints('fractional_coo', 20, `People: "${peopleChallenge}"`);
  else if (peopleChallenge === 'Letting go of the wrong people') addPoints('fractional_coo', 25, 'People: letting go');
  else if (peopleChallenge === 'Team culture and morale') addPoints('fractional_coo', 15, 'People: culture');

  // Q3.3 - Delegation
  const delegation = responses.dd_delegation_ability;
  if (delegation === 'Average - I delegate but then micromanage') { addPoints('systems_audit', 15, 'Delegation: avg'); addPoints('fractional_coo', 10, 'Delegation: avg'); }
  else if (delegation === 'Poor - I struggle to let go') { addPoints('systems_audit', 20, 'Delegation: poor'); addPoints('fractional_coo', 15, 'Delegation: poor'); }
  else if (delegation === 'Terrible - I end up doing everything myself') { addPoints('systems_audit', 25, 'Delegation: terrible'); addPoints('fractional_coo', 20, 'Delegation: terrible'); }

  // Q3.4 - Hidden From Team (Keywords)
  const hiddenFromTeam = getLower(responses.dd_hidden_from_team);
  if (hiddenFromTeam) {
    if (containsAny(hiddenFromTeam, ['profit', 'loss', 'margin', 'losing money'])) addPoints('management_accounts', 20, 'Hidden: profitability');
    if (containsAny(hiddenFromTeam, ['cash', 'runway', 'debt', 'owe'])) { addPoints('management_accounts', 20, 'Hidden: cash'); addPoints('fractional_cfo', 15, 'Hidden: financial stress'); }
    if (containsAny(hiddenFromTeam, ['sell', 'exit', 'close', 'quit'])) addPoints('business_advisory', 20, 'Hidden: exit');
    if (containsAny(hiddenFromTeam, ['stress', 'burnout', 'overwhelm', 'worried'])) addPoints('365_method', 15, 'Hidden: personal');
  }

  // Q3.5 - External Perspective
  const externalView = responses.dd_external_perspective;
  if (externalView === 'They worry about me sometimes') addPoints('365_method', 10, 'External: worry');
  else if (externalView === 'They\'ve given up complaining') addPoints('365_method', 15, 'External: given up');
  else if (externalView === 'It\'s a significant source of tension') addPoints('365_method', 20, 'External: tension');
  else if (externalView === 'They\'d say I\'m married to my business') addPoints('365_method', 25, 'External: married');

  // Q4.1 - Avoided Conversation (Keywords)
  const avoided = getLower(responses.dd_avoided_conversation);
  if (avoided) {
    if (containsAny(avoided, ['team', 'employee', 'fire', 'performance'])) addPoints('fractional_coo', 15, 'Avoided: people');
    if (containsAny(avoided, ['partner', 'shareholder', 'split', 'buyout'])) addPoints('business_advisory', 15, 'Avoided: partnership');
    if (containsAny(avoided, ['exit', 'sell', 'future', 'retire'])) addPoints('business_advisory', 15, 'Avoided: exit');
    if (containsAny(avoided, ['myself', 'burnout', 'health'])) addPoints('365_method', 15, 'Avoided: personal');
  }

  // Q4.2 - Hard Truth (Keywords)
  const hardTruth = getLower(responses.dd_hard_truth);
  if (hardTruth) {
    if (containsAny(hardTruth, ['profitable', 'margin', 'losing', 'money'])) addPoints('management_accounts', 20, 'Hard truth: profit');
    if (containsAny(hardTruth, ['scale', 'grow', 'stuck', 'plateau'])) { addPoints('365_method', 15, 'Hard truth: plateau'); addPoints('systems_audit', 10, 'Hard truth: scaling'); }
    if (containsAny(hardTruth, ['me', 'founder', 'dependent', 'essential'])) { addPoints('systems_audit', 20, 'Hard truth: founder dep'); addPoints('fractional_coo', 15, 'Hard truth: founder dep'); }
    if (containsAny(hardTruth, ['team', 'people', 'wrong', 'hire', 'fire'])) addPoints('fractional_coo', 20, 'Hard truth: team');
    if (containsAny(hardTruth, ['worth', 'value', 'sellable'])) addPoints('business_advisory', 20, 'Hard truth: value');
  }

  // Q4.3 - Relationship Mirror
  const relationship = getLower(responses.dd_relationship_mirror);
  if (relationship) {
    if (containsAny(relationship, KEYWORD_SETS.trapped)) { addPoints('365_method', 25, 'Relationship: trapped'); addPoints('business_advisory', 15, 'Relationship: exit consideration'); }
    if (containsAny(relationship, KEYWORD_SETS.exhausted)) { addPoints('365_method', 20, 'Relationship: exhausted'); addPoints('systems_audit', 15, 'Relationship: demanding'); }
    if (containsAny(relationship, ['love affair gone stale', 'lost spark', 'bored'])) addPoints('365_method', 15, 'Relationship: disengaged');
  }

  // Q4.4 - Sacrifice List (Keywords)
  const sacrifice = getLower(responses.dd_sacrifice_list);
  if (sacrifice) {
    if (containsAny(sacrifice, ['family', 'children', 'kids', 'wife', 'husband'])) addPoints('365_method', 20, 'Sacrificed: family');
    if (containsAny(sacrifice, ['health', 'fitness', 'weight', 'sleep', 'exercise'])) addPoints('365_method', 20, 'Sacrificed: health');
    if (containsAny(sacrifice, ['holiday', 'vacation', 'travel', 'break'])) { addPoints('365_method', 15, 'Sacrificed: breaks'); addPoints('systems_audit', 10, 'Sacrificed: can\'t step away'); }
    if (containsAny(sacrifice, ['friends', 'social', 'hobbies'])) addPoints('365_method', 15, 'Sacrificed: social');
    if (containsAny(sacrifice, ['money', 'savings', 'pension'])) addPoints('fractional_cfo', 15, 'Sacrificed: financial');
    if (containsAny(sacrifice, ['everything', 'all of it', 'too much'])) addPoints('365_method', 25, 'Sacrificed: everything');
    if (sacrifice.length > 100) addPoints('365_method', 10, 'Sacrificed: significant');
  }

  // Q4.5 - Suspected Truth (Keywords)
  const suspected = getLower(responses.dd_suspected_truth);
  if (suspected) {
    if (containsAny(suspected, ['margin', 'profit', 'losing', 'cost', 'pricing'])) addPoints('management_accounts', 25, 'Suspects: margin');
    if (containsAny(suspected, ['underperform', 'behind', 'compared', 'competitor'])) addPoints('benchmarking', 20, 'Suspects: underperformance');
    if (containsAny(suspected, ['waste', 'inefficient', 'time', 'money', 'leak'])) addPoints('systems_audit', 15, 'Suspects: inefficiency');
    if (containsAny(suspected, ['worth', 'value', 'sell'])) addPoints('business_advisory', 15, 'Suspects: value');
    if (containsAny(suspected, ['staff', 'team', 'productivity'])) addPoints('fractional_coo', 15, 'Suspects: team productivity');
  }

  // Q5.1 - Magic Fix (Keywords)
  const magicFix = getLower(responses.dd_magic_fix);
  if (magicFix) {
    if (containsAny(magicFix, ['numbers', 'accounts', 'financial', 'visibility'])) addPoints('management_accounts', 25, 'Magic: financial');
    if (containsAny(magicFix, ['team', 'hire', 'people', 'manager'])) addPoints('fractional_coo', 25, 'Magic: team');
    if (containsAny(magicFix, ['systems', 'process', 'automate', 'efficient'])) { addPoints('systems_audit', 25, 'Magic: systems'); addPoints('automation', 20, 'Magic: automation'); }
    if (containsAny(magicFix, ['plan', 'strategy', 'direction', 'clarity'])) addPoints('365_method', 25, 'Magic: clarity');
    if (containsAny(magicFix, ['sell', 'exit', 'value', 'buyer'])) addPoints('business_advisory', 25, 'Magic: exit');
    if (containsAny(magicFix, ['grow', 'scale', 'revenue', 'clients'])) addPoints('benchmarking', 15, 'Magic: growth');
    if (containsAny(magicFix, ['time', 'freedom', 'step back', 'holiday'])) { addPoints('365_method', 20, 'Magic: freedom'); addPoints('systems_audit', 15, 'Magic: step back'); }
  }

  // Q5.3 - Final Insight (Keywords)
  const finalInsight = getLower(responses.dd_final_insight);
  if (finalInsight && finalInsight.length > 20) {
    if (containsAny(finalInsight, KEYWORD_SETS.financial)) addPoints('management_accounts', 10, 'Final: financial');
    if (containsAny(finalInsight, KEYWORD_SETS.team)) addPoints('fractional_coo', 10, 'Final: team');
    if (containsAny(finalInsight, KEYWORD_SETS.systems)) addPoints('systems_audit', 10, 'Final: systems');
    if (containsAny(finalInsight, KEYWORD_SETS.strategy)) addPoints('365_method', 10, 'Final: strategy');
    if (containsAny(finalInsight, KEYWORD_SETS.exit)) addPoints('business_advisory', 10, 'Final: exit');
  }

  // SERVICE DIAGNOSTICS
  // SD Q1.1 - Financial Confidence
  const finConfidence = responses.sd_financial_confidence;
  if (finConfidence === 'Uncertain - I\'m often surprised') addPoints('management_accounts', 25, 'Financial conf: uncertain');
  else if (finConfidence === 'Not confident - I mostly guess') addPoints('management_accounts', 30, 'Financial conf: guess');
  else if (finConfidence === 'I avoid financial decisions because I don\'t trust the data') { addPoints('management_accounts', 30, 'Financial conf: avoid'); addPoints('fractional_cfo', 15, 'Financial conf: avoid'); }

  // SD Q1.2 - Numbers Action
  const numbersAction = responses.sd_numbers_action_frequency;
  if (numbersAction === 'Quarterly - when accounts come through') addPoints('management_accounts', 20, 'Numbers: quarterly');
  else if (numbersAction === 'Rarely - I don\'t find them useful') addPoints('management_accounts', 25, 'Numbers: rarely');
  else if (numbersAction === 'Never - I don\'t get meaningful management information') addPoints('management_accounts', 30, 'Numbers: never');

  // SD Q1.3 - Benchmark Awareness
  const benchmarkAware = responses.sd_benchmark_awareness;
  if (benchmarkAware === 'Roughly - I have a general sense') addPoints('benchmarking', 15, 'Benchmark: roughly');
  else if (benchmarkAware === 'No - I\'d love to know but don\'t have access') addPoints('benchmarking', 30, 'Benchmark: no access');
  else if (benchmarkAware === 'Never considered it') addPoints('benchmarking', 25, 'Benchmark: never');

  // SD Q2.1 - Founder Dependency
  const founderDep = responses.sd_founder_dependency;
  if (founderDep === 'Significant problems - but wouldn\'t collapse') addPoints('systems_audit', 15, 'Founder dep: significant');
  else if (founderDep === 'Chaos - I\'m essential to everything') { addPoints('systems_audit', 30, 'Founder dep: chaos'); addPoints('fractional_coo', 20, 'Founder dep: chaos'); }
  else if (founderDep === 'I honestly don\'t know - never tested it') addPoints('systems_audit', 20, 'Founder dep: unknown');

  // SD Q2.2 - Manual Work
  const manualWork = responses.sd_manual_work_percentage;
  if (manualWork === 'Some - maybe 10-20%') addPoints('automation', 10, 'Manual: 10-20%');
  else if (manualWork === 'Significant - probably 30-50%') { addPoints('systems_audit', 20, 'Manual: 30-50%'); addPoints('automation', 30, 'Manual: 30-50%'); }
  else if (manualWork === 'Too much - over half our effort is manual') { addPoints('systems_audit', 25, 'Manual: 50%+'); addPoints('automation', 35, 'Manual: 50%+'); }
  else if (manualWork === 'I don\'t know - never measured it') addPoints('systems_audit', 15, 'Manual: unknown');

  // SD Q2.3 - Manual Tasks (Multi-select)
  const manualTasks = responses.sd_manual_tasks || [];
  const manualTasksArray = Array.isArray(manualTasks) ? manualTasks : [manualTasks];
  manualTasksArray.forEach((task: string) => {
    if (task === 'Data entry between systems') addPoints('automation', 20, 'Task: data entry');
    if (task === 'Generating reports manually') { addPoints('automation', 15, 'Task: reports'); addPoints('management_accounts', 10, 'Task: reports'); }
    if (task === 'Processing invoices') addPoints('automation', 20, 'Task: invoices');
    if (task === 'Chasing people (emails, follow-ups)') addPoints('automation', 15, 'Task: follow-ups');
    if (task === 'Creating documents from scratch') addPoints('automation', 15, 'Task: documents');
    if (task === 'Approval workflows (getting sign-offs)') { addPoints('automation', 15, 'Task: approvals'); addPoints('systems_audit', 10, 'Task: approvals'); }
    if (task === 'Reconciling data between systems') { addPoints('automation', 20, 'Task: reconciliation'); addPoints('management_accounts', 15, 'Task: reconciliation'); }
  });

  // SD Q2.4 - Problem Awareness
  const problemSpeed = responses.sd_problem_awareness_speed;
  if (problemSpeed === 'Days later - when problems compound') addPoints('systems_audit', 20, 'Problems: days');
  else if (problemSpeed === 'Often too late - when customers complain') addPoints('systems_audit', 25, 'Problems: too late');
  else if (problemSpeed === 'We\'re often blindsided') { addPoints('systems_audit', 30, 'Problems: blindsided'); addPoints('management_accounts', 15, 'Problems: blindsided'); }

  // SD Q3.1 - Plan Clarity
  const planClarity = responses.sd_plan_clarity;
  if (planClarity === 'Sort of - I know what I want to achieve') addPoints('365_method', 10, 'Plan: sort of');
  else if (planClarity === 'I have goals but not a real plan') addPoints('365_method', 20, 'Plan: no real plan');
  else if (planClarity === 'I\'m too busy to plan') addPoints('365_method', 25, 'Plan: too busy');
  else if (planClarity === 'I\'ve given up on planning - things always change') addPoints('365_method', 25, 'Plan: given up');

  // SD Q3.2 - Accountability
  const accountability = responses.sd_accountability_source;
  if (accountability === 'My spouse/family (informally)') addPoints('365_method', 15, 'Accountability: family');
  else if (accountability === 'No one - just me') addPoints('365_method', 20, 'Accountability: none');

  // SD Q3.3 - Growth Blocker
  const growthBlocker = responses.sd_growth_blocker;
  if (growthBlocker === 'Lack of clarity on where to focus') addPoints('365_method', 25, 'Growth: clarity');
  else if (growthBlocker === 'Not enough leads or customers') addPoints('benchmarking', 10, 'Growth: leads');
  else if (growthBlocker === 'Can\'t deliver more without breaking things') { addPoints('systems_audit', 25, 'Growth: delivery'); addPoints('automation', 15, 'Growth: delivery'); }
  else if (growthBlocker === 'Don\'t have the right people') addPoints('fractional_coo', 25, 'Growth: people');
  else if (growthBlocker === 'Don\'t have the capital') addPoints('fractional_cfo', 25, 'Growth: capital');
  else if (growthBlocker === 'Market conditions / external factors') addPoints('benchmarking', 15, 'Growth: market');

  // SD Q4.1 - Documentation Readiness
  const docReadiness = responses.sd_documentation_readiness;
  if (docReadiness === 'Probably - most things are documented') addPoints('business_advisory', 10, 'Docs: probably');
  else if (docReadiness === 'It would take weeks to pull together') addPoints('business_advisory', 20, 'Docs: weeks');
  else if (docReadiness === 'Months - things are scattered everywhere') addPoints('business_advisory', 25, 'Docs: months');
  else if (docReadiness === 'I don\'t know where I\'d even start') addPoints('business_advisory', 30, 'Docs: unknown');

  // SD Q4.2 - Valuation Understanding
  const valuation = responses.sd_valuation_understanding;
  if (valuation === 'Roughly - I have a sense of the multiple') addPoints('benchmarking', 10, 'Valuation: roughly');
  else if (valuation === 'No idea - it\'s never come up') { addPoints('benchmarking', 20, 'Valuation: no idea'); addPoints('business_advisory', 15, 'Valuation: no idea'); }
  else if (valuation === 'I try not to think about it') { addPoints('benchmarking', 25, 'Valuation: avoid'); addPoints('business_advisory', 20, 'Valuation: avoid'); }

  // SD Q4.3 - Exit Timeline
  const exitTimeline = responses.sd_exit_timeline;
  if (exitTimeline === 'Already exploring options') addPoints('business_advisory', 35, 'Exit: exploring');
  else if (exitTimeline === '1-3 years - actively preparing') addPoints('business_advisory', 30, 'Exit: 1-3 years');
  else if (exitTimeline === '3-5 years - need to start thinking') addPoints('business_advisory', 20, 'Exit: 3-5 years');
  else if (exitTimeline === '5-10 years - distant horizon') addPoints('business_advisory', 10, 'Exit: 5-10 years');
  else if (exitTimeline === 'No exit plan - haven\'t thought about it') addPoints('business_advisory', 15, 'Exit: no plan');

  // SD Q5.1 - Competitive Position
  const compPosition = responses.sd_competitive_position;
  if (compPosition === 'We\'re competitive - holding our own') addPoints('benchmarking', 10, 'Competitive: holding');
  else if (compPosition === 'We\'re losing ground to competitors') addPoints('benchmarking', 30, 'Competitive: losing');
  else if (compPosition === 'I don\'t really know how we compare') addPoints('benchmarking', 25, 'Competitive: unknown');

  // SD Q5.2 - Operational Frustration (Keywords)
  const opsFrustration = getLower(responses.sd_operational_frustration);
  if (opsFrustration) {
    if (containsAny(opsFrustration, ['manual', 'repetitive', 'data entry', 'copy', 'paste'])) addPoints('automation', 25, 'Ops frustration: manual');
    if (containsAny(opsFrustration, ['systems', 'process', 'broken', 'inefficient'])) addPoints('systems_audit', 20, 'Ops frustration: systems');
    if (containsAny(opsFrustration, ['team', 'people', 'staff', 'hire'])) addPoints('fractional_coo', 15, 'Ops frustration: people');
    if (containsAny(opsFrustration, ['time', 'hours', 'slow', 'waiting', 'bottleneck'])) { addPoints('automation', 15, 'Ops frustration: time'); addPoints('systems_audit', 15, 'Ops frustration: time'); }
    if (containsAny(opsFrustration, ['reports', 'numbers', 'data', 'spreadsheet'])) { addPoints('management_accounts', 15, 'Ops frustration: reporting'); addPoints('automation', 10, 'Ops frustration: reporting'); }
  }

  // SPECIAL DETECTION PATTERNS
  const patterns: DetectionPatterns = {
    burnoutDetected: false, burnoutFlags: 0, burnoutIndicators: [],
    capitalRaisingDetected: false, capitalSignals: [],
    lifestyleTransformationDetected: false, lifestyleSignals: [],
    urgencyMultiplier: 1.0,
  };

  // Burnout Detection
  const burnoutHours = ['60-70 hours', '70+ hours', 'I\'ve stopped counting'];
  const burnoutBreaks = ['More than 2 years ago', 'I honestly can\'t remember', 'I\'ve never done that'];
  const burnoutExternal = ['They\'ve given up complaining', 'It\'s a significant source of tension', 'They\'d say I\'m married to my business'];
  const burnoutFirefighting = ['90% firefighting / 10% strategic', '70% firefighting / 30% strategic'];

  if (burnoutHours.includes(hours)) { patterns.burnoutFlags++; patterns.burnoutIndicators.push('Excessive hours'); }
  if (burnoutBreaks.includes(lastBreak)) { patterns.burnoutFlags++; patterns.burnoutIndicators.push('No real breaks'); }
  if (burnoutExternal.includes(externalView)) { patterns.burnoutFlags++; patterns.burnoutIndicators.push('Relationship strain'); }
  if (burnoutFirefighting.includes(timeAlloc)) { patterns.burnoutFlags++; patterns.burnoutIndicators.push('High firefighting'); }
  if (sleepThief === 'My own health or burnout') { patterns.burnoutFlags++; patterns.burnoutIndicators.push('Health/burnout concerns'); }

  if (patterns.burnoutFlags >= 3) {
    patterns.burnoutDetected = true;
    scores['365_method'].score = Math.round(scores['365_method'].score * 1.4);
    scores['365_method'].triggers.push('Burnout pattern detected (3+ indicators)');
  }

  // Capital Raising Detection
  if (growthBlocker === 'Don\'t have the capital') patterns.capitalSignals.push('Growth blocker: capital');
  if (containsAny(getLower(responses.dd_unlimited_change), KEYWORD_SETS.capital)) patterns.capitalSignals.push('Unlimited change: capital');
  if (['Already exploring options', '1-3 years - actively preparing'].includes(exitTimeline)) patterns.capitalSignals.push('Exit timeline: near-term');
  if (containsAny(vision, KEYWORD_SETS.capital)) patterns.capitalSignals.push('Vision: capital/investment');

  if (patterns.capitalSignals.length >= 2) {
    patterns.capitalRaisingDetected = true;
    scores['fractional_cfo'].score = Math.round(scores['fractional_cfo'].score * 1.5);
    scores['fractional_cfo'].triggers.push('Capital raising pattern detected');
    scores['management_accounts'].score = Math.round(scores['management_accounts'].score * 1.3);
    scores['business_advisory'].score = Math.round(scores['business_advisory'].score * 1.3);
  }

  // Lifestyle Transformation Detection
  if (containsAny(vision, KEYWORD_SETS.lifestyle_role)) patterns.lifestyleSignals.push('Vision: role change');
  if (containsAny(vision, KEYWORD_SETS.lifestyle_personal)) patterns.lifestyleSignals.push('Vision: lifestyle');
  const lifestyleSuccess = ['Creating a business that runs profitably without me', 'Building a legacy that outlasts me', 'Having complete control over my time and income'];
  if (lifestyleSuccess.includes(successDef)) patterns.lifestyleSignals.push('Success: lifestyle-focused');
  if (containsAny(relationship, KEYWORD_SETS.trapped) || containsAny(relationship, KEYWORD_SETS.exhausted)) patterns.lifestyleSignals.push('Relationship: negative');

  if (patterns.lifestyleSignals.length >= 3) {
    patterns.lifestyleTransformationDetected = true;
    scores['365_method'].score = Math.round(scores['365_method'].score * 1.5);
    scores['365_method'].triggers.push('Lifestyle transformation pattern detected');
    scores['fractional_coo'].score = Math.round(scores['fractional_coo'].score * 1.3);
    scores['systems_audit'].score = Math.round(scores['systems_audit'].score * 1.2);
  }

  // URGENCY MULTIPLIER
  const changeReadiness = responses.dd_change_readiness;
  const urgencyMultipliers: Record<string, number> = {
    'Completely ready - I\'ll do whatever it takes': 1.3,
    'Ready - as long as I understand the why': 1.2,
    'Open - but I\'ll need convincing': 1.0,
    'Hesitant - change feels risky': 0.9,
    'Resistant - I prefer how things are': 0.7,
  };
  patterns.urgencyMultiplier = urgencyMultipliers[changeReadiness] || 1.0;
  for (const code of Object.keys(scores)) {
    scores[code].score = Math.round(scores[code].score * patterns.urgencyMultiplier);
  }

  // COMBINED ADVISORY CHECK
  if (scores['fractional_cfo'].score >= 40 && scores['fractional_coo'].score >= 40) {
    scores['combined_advisory'].score = Math.round((scores['fractional_cfo'].score + scores['fractional_coo'].score) / 2);
    scores['combined_advisory'].triggers = [...scores['fractional_cfo'].triggers.slice(0, 3), ...scores['fractional_coo'].triggers.slice(0, 3), 'Combined: Both CFO and COO needs'];
  }

  // FINALIZE SCORES
  for (const code of Object.keys(scores)) {
    scores[code].score = Math.min(100, scores[code].score);
    scores[code].confidence = Math.min(100, scores[code].triggers.length * 20);
    if (scores[code].score >= 70) { scores[code].priority = 1; scores[code].recommended = true; }
    else if (scores[code].score >= 50) { scores[code].priority = 2; scores[code].recommended = true; }
    else if (scores[code].score >= 30) { scores[code].priority = 3; scores[code].recommended = false; }
    else { scores[code].priority = 4; scores[code].recommended = false; }
  }

  const recommendations = Object.values(scores).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  let priorityCounter = 1;
  for (const rec of recommendations) { if (rec.score >= 50) rec.priority = priorityCounter++; }

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

  return { scores, patterns, emotionalAnchors, recommendations };
}

// ============================================================================
// END SERVICE SCORER V2.0
// ============================================================================

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

