// ============================================================================
// DISCOVERY REPORT - PASS 1: EXTRACTION & SCORING
// ============================================================================
// Analyzes discovery responses, calculates service scores, extracts emotional
// anchors, and detects special patterns (burnout, capital raising, lifestyle)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// SCORING ENGINE (Inlined from service-scorer-v2)
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

  // Q1.1 - Vision
  const vision = getLower(responses.dd_five_year_vision);
  if (vision) {
    if (containsAny(vision, KEYWORD_SETS.lifestyle_role)) addPoints('365_method', 20, 'Vision: operator-to-investor');
    if (containsAny(vision, ['sell', 'exit', 'legacy', 'succession'])) addPoints('business_advisory', 15, 'Vision: exit/legacy');
    if (containsAny(vision, KEYWORD_SETS.lifestyle_personal)) addPoints('365_method', 10, 'Vision: lifestyle');
    if (containsAny(vision, ['team runs', 'without me', 'optional', 'freedom'])) addPoints('systems_audit', 15, 'Vision: business without founder');
    if (containsAny(vision, ['ceo', 'strategic', 'growth', 'expand'])) addPoints('fractional_cfo', 10, 'Vision: growth');
  }

  // Q1.2 - Success Definition
  const successDef = responses.dd_success_definition;
  if (successDef === 'Building something I can sell for a life-changing amount') addPoints('business_advisory', 25, 'Success: sellable business');
  else if (successDef === 'Creating a business that runs profitably without me') { addPoints('systems_audit', 20, 'Success: autonomous business'); addPoints('fractional_coo', 15, 'Success: autonomous business'); }
  else if (successDef === 'Growing to dominate my market/niche') addPoints('benchmarking', 15, 'Success: market dominance');
  else if (successDef === 'Having complete control over my time and income') addPoints('365_method', 20, 'Success: time control');
  else if (successDef === 'Building a legacy that outlasts me') addPoints('business_advisory', 20, 'Success: legacy');

  // Q1.3 - Non-Negotiables
  const nonNegs = responses.dd_non_negotiables || [];
  const nonNegArray = Array.isArray(nonNegs) ? nonNegs : [nonNegs];
  nonNegArray.forEach((item: string) => {
    if (['More time with family/loved ones', 'Better health and energy', 'Doing work that excites me'].includes(item)) addPoints('365_method', 10, `Non-neg: "${item}"`);
    if (item === 'Less day-to-day stress' || item === 'Geographic freedom / work from anywhere') addPoints('systems_audit', 10, `Non-neg: "${item}"`);
    if (item === 'Financial security for retirement') addPoints('business_advisory', 10, 'Non-neg: retirement');
    if (item === 'Building wealth beyond the business') { addPoints('fractional_cfo', 10, 'Non-neg: wealth'); addPoints('business_advisory', 10, 'Non-neg: wealth'); }
  });

  // Q1.4 - Unlimited Change
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
  if (exitMindset === 'I think about it but haven\'t planned') addPoints('business_advisory', 15, 'Exit: thinking');
  else if (exitMindset === 'I\'d love to but can\'t see how') { addPoints('business_advisory', 20, 'Exit: wants but blocked'); addPoints('365_method', 10, 'Exit: wants clarity'); }
  else if (exitMindset === 'The thought terrifies me') { addPoints('business_advisory', 25, 'Exit: terrified'); addPoints('365_method', 15, 'Exit: fear'); }

  // Q2.1 - Hours
  const hours = responses.dd_weekly_hours;
  if (hours === '50-60 hours') addPoints('365_method', 5, 'Hours: 50-60');
  else if (hours === '60-70 hours') { addPoints('365_method', 15, 'Hours: 60-70'); addPoints('systems_audit', 10, 'Hours: 60-70'); }
  else if (hours === '70+ hours') { addPoints('365_method', 20, 'Hours: 70+'); addPoints('systems_audit', 15, 'Hours: 70+'); }
  else if (hours === 'I\'ve stopped counting') { addPoints('365_method', 25, 'Hours: lost count'); addPoints('systems_audit', 15, 'Hours: lost count'); }

  // Q2.2 - Firefighting
  const timeAlloc = responses.dd_time_allocation;
  if (timeAlloc === '90% firefighting / 10% strategic') { addPoints('systems_audit', 25, 'Firefighting: 90%'); addPoints('365_method', 20, 'Firefighting: 90%'); }
  else if (timeAlloc === '70% firefighting / 30% strategic') { addPoints('systems_audit', 20, 'Firefighting: 70%'); addPoints('365_method', 15, 'Firefighting: 70%'); }
  else if (timeAlloc === '50% firefighting / 50% strategic') addPoints('systems_audit', 10, 'Firefighting: 50%');

  // Q2.3 - Last Break
  const lastBreak = responses.dd_last_real_break;
  if (lastBreak === '1-2 years ago') addPoints('365_method', 10, 'Break: 1-2 years');
  else if (lastBreak === 'More than 2 years ago') { addPoints('365_method', 15, 'Break: 2+ years'); addPoints('systems_audit', 10, 'Break: 2+ years'); }
  else if (lastBreak === 'I honestly can\'t remember') { addPoints('365_method', 20, 'Break: can\'t remember'); addPoints('systems_audit', 15, 'Break: can\'t remember'); }
  else if (lastBreak === 'I\'ve never done that') { addPoints('365_method', 25, 'Break: never'); addPoints('systems_audit', 20, 'Break: never'); }

  // Q2.4 - Emergency Log
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
  else if (sleepThief === 'Fear of something going wrong that I can\'t see coming') addPoints('systems_audit', 20, 'Sleep: fear');
  else if (sleepThief === 'Competition or market changes') addPoints('benchmarking', 20, 'Sleep: competition');
  else if (sleepThief === 'My own health or burnout') addPoints('365_method', 25, 'Sleep: burnout');

  // Q2.7 - Core Frustration
  const coreFrustration = getLower(responses.dd_core_frustration);
  if (coreFrustration) {
    if (containsAny(coreFrustration, KEYWORD_SETS.team)) addPoints('fractional_coo', 15, 'Frustration: people');
    if (containsAny(coreFrustration, KEYWORD_SETS.systems)) { addPoints('systems_audit', 15, 'Frustration: systems'); addPoints('automation', 10, 'Frustration: manual'); }
    if (containsAny(coreFrustration, KEYWORD_SETS.financial)) addPoints('management_accounts', 15, 'Frustration: financial');
    if (containsAny(coreFrustration, KEYWORD_SETS.burnout)) addPoints('365_method', 15, 'Frustration: burnout');
    if (containsAny(coreFrustration, ['grow', 'scale', 'stuck', 'plateau'])) { addPoints('365_method', 10, 'Frustration: plateau'); addPoints('benchmarking', 10, 'Frustration: plateau'); }
    if (containsAny(coreFrustration, KEYWORD_SETS.competition)) addPoints('benchmarking', 15, 'Frustration: competition');
  }

  // Q3.1-Q3.5 Team questions
  const keyPerson = responses.dd_key_person_dependency;
  if (keyPerson === 'Disaster - the business would struggle badly') { addPoints('systems_audit', 25, 'Key person: disaster'); addPoints('fractional_coo', 20, 'Key person: disaster'); }
  else if (keyPerson === 'Major disruption for 6+ months') { addPoints('systems_audit', 20, 'Key person: major'); addPoints('fractional_coo', 15, 'Key person: major'); }
  else if (keyPerson === 'N/A - it\'s just me') { addPoints('fractional_coo', 15, 'Key person: solo'); addPoints('systems_audit', 15, 'Key person: solo'); }

  const peopleChallenge = responses.dd_people_challenge;
  if (['Finding good people to hire', 'Getting the best from current team', 'Developing future leaders', 'Managing performance consistently'].includes(peopleChallenge)) addPoints('fractional_coo', 20, `People: "${peopleChallenge}"`);
  else if (peopleChallenge === 'Letting go of the wrong people') addPoints('fractional_coo', 25, 'People: letting go');

  const delegation = responses.dd_delegation_ability;
  if (delegation === 'Average - I delegate but then micromanage') { addPoints('systems_audit', 15, 'Delegation: avg'); addPoints('fractional_coo', 10, 'Delegation: avg'); }
  else if (delegation === 'Poor - I struggle to let go') { addPoints('systems_audit', 20, 'Delegation: poor'); addPoints('fractional_coo', 15, 'Delegation: poor'); }
  else if (delegation === 'Terrible - I end up doing everything myself') { addPoints('systems_audit', 25, 'Delegation: terrible'); addPoints('fractional_coo', 20, 'Delegation: terrible'); }

  const hiddenFromTeam = getLower(responses.dd_hidden_from_team);
  if (hiddenFromTeam) {
    if (containsAny(hiddenFromTeam, ['profit', 'loss', 'margin', 'losing money'])) addPoints('management_accounts', 20, 'Hidden: profitability');
    if (containsAny(hiddenFromTeam, ['cash', 'runway', 'debt', 'owe'])) { addPoints('management_accounts', 20, 'Hidden: cash'); addPoints('fractional_cfo', 15, 'Hidden: financial stress'); }
    if (containsAny(hiddenFromTeam, ['sell', 'exit', 'close', 'quit'])) addPoints('business_advisory', 20, 'Hidden: exit');
    if (containsAny(hiddenFromTeam, ['stress', 'burnout', 'overwhelm', 'worried'])) addPoints('365_method', 15, 'Hidden: personal');
  }

  const externalView = responses.dd_external_perspective;
  if (externalView === 'They worry about me sometimes') addPoints('365_method', 10, 'External: worry');
  else if (externalView === 'They\'ve given up complaining') addPoints('365_method', 15, 'External: given up');
  else if (externalView === 'It\'s a significant source of tension') addPoints('365_method', 20, 'External: tension');
  else if (externalView === 'They\'d say I\'m married to my business') addPoints('365_method', 25, 'External: married');

  // Q4.1-Q4.5 Blind Spots
  const avoided = getLower(responses.dd_avoided_conversation);
  if (avoided) {
    if (containsAny(avoided, ['team', 'employee', 'fire', 'performance'])) addPoints('fractional_coo', 15, 'Avoided: people');
    if (containsAny(avoided, ['partner', 'shareholder', 'split', 'buyout'])) addPoints('business_advisory', 15, 'Avoided: partnership');
    if (containsAny(avoided, ['exit', 'sell', 'future', 'retire'])) addPoints('business_advisory', 15, 'Avoided: exit');
    if (containsAny(avoided, ['myself', 'burnout', 'health'])) addPoints('365_method', 15, 'Avoided: personal');
  }

  const hardTruth = getLower(responses.dd_hard_truth);
  if (hardTruth) {
    if (containsAny(hardTruth, ['profitable', 'margin', 'losing', 'money'])) addPoints('management_accounts', 20, 'Hard truth: profit');
    if (containsAny(hardTruth, ['scale', 'grow', 'stuck', 'plateau'])) { addPoints('365_method', 15, 'Hard truth: plateau'); addPoints('systems_audit', 10, 'Hard truth: scaling'); }
    if (containsAny(hardTruth, ['me', 'founder', 'dependent', 'essential'])) { addPoints('systems_audit', 20, 'Hard truth: founder dep'); addPoints('fractional_coo', 15, 'Hard truth: founder dep'); }
    if (containsAny(hardTruth, ['team', 'people', 'wrong', 'hire', 'fire'])) addPoints('fractional_coo', 20, 'Hard truth: team');
    if (containsAny(hardTruth, ['worth', 'value', 'sellable'])) addPoints('business_advisory', 20, 'Hard truth: value');
  }

  const relationship = getLower(responses.dd_relationship_mirror);
  if (relationship) {
    if (containsAny(relationship, KEYWORD_SETS.trapped)) { addPoints('365_method', 25, 'Relationship: trapped'); addPoints('business_advisory', 15, 'Relationship: exit consideration'); }
    if (containsAny(relationship, KEYWORD_SETS.exhausted)) { addPoints('365_method', 20, 'Relationship: exhausted'); addPoints('systems_audit', 15, 'Relationship: demanding'); }
    if (containsAny(relationship, ['love affair gone stale', 'lost spark', 'bored'])) addPoints('365_method', 15, 'Relationship: disengaged');
  }

  const sacrifice = getLower(responses.dd_sacrifice_list);
  if (sacrifice) {
    if (containsAny(sacrifice, ['family', 'children', 'kids', 'wife', 'husband'])) addPoints('365_method', 20, 'Sacrificed: family');
    if (containsAny(sacrifice, ['health', 'fitness', 'weight', 'sleep', 'exercise'])) addPoints('365_method', 20, 'Sacrificed: health');
    if (containsAny(sacrifice, ['holiday', 'vacation', 'travel', 'break'])) { addPoints('365_method', 15, 'Sacrificed: breaks'); addPoints('systems_audit', 10, 'Sacrificed: can\'t step away'); }
    if (containsAny(sacrifice, ['everything', 'all of it', 'too much'])) addPoints('365_method', 25, 'Sacrificed: everything');
    if (sacrifice.length > 100) addPoints('365_method', 10, 'Sacrificed: significant');
  }

  const suspected = getLower(responses.dd_suspected_truth);
  if (suspected) {
    if (containsAny(suspected, ['margin', 'profit', 'losing', 'cost', 'pricing'])) addPoints('management_accounts', 25, 'Suspects: margin');
    if (containsAny(suspected, ['underperform', 'behind', 'compared', 'competitor'])) addPoints('benchmarking', 20, 'Suspects: underperformance');
    if (containsAny(suspected, ['waste', 'inefficient', 'time', 'money', 'leak'])) addPoints('systems_audit', 15, 'Suspects: inefficiency');
    if (containsAny(suspected, ['worth', 'value', 'sell'])) addPoints('business_advisory', 15, 'Suspects: value');
  }

  // Q5.1-Q5.3 Moving Forward
  const magicFix = getLower(responses.dd_magic_fix);
  if (magicFix) {
    if (containsAny(magicFix, ['numbers', 'accounts', 'financial', 'visibility'])) addPoints('management_accounts', 25, 'Magic: financial');
    if (containsAny(magicFix, ['team', 'hire', 'people', 'manager'])) addPoints('fractional_coo', 25, 'Magic: team');
    if (containsAny(magicFix, ['systems', 'process', 'automate', 'efficient'])) { addPoints('systems_audit', 25, 'Magic: systems'); addPoints('automation', 20, 'Magic: automation'); }
    if (containsAny(magicFix, ['plan', 'strategy', 'direction', 'clarity'])) addPoints('365_method', 25, 'Magic: clarity');
    if (containsAny(magicFix, ['sell', 'exit', 'value', 'buyer'])) addPoints('business_advisory', 25, 'Magic: exit');
    if (containsAny(magicFix, ['time', 'freedom', 'step back', 'holiday'])) { addPoints('365_method', 20, 'Magic: freedom'); addPoints('systems_audit', 15, 'Magic: step back'); }
  }

  // Service Diagnostics (abbreviated for brevity - key questions)
  const finConfidence = responses.sd_financial_confidence;
  if (finConfidence === 'Uncertain - I\'m often surprised') addPoints('management_accounts', 25, 'Financial: uncertain');
  else if (finConfidence === 'Not confident - I mostly guess') addPoints('management_accounts', 30, 'Financial: guess');
  else if (finConfidence === 'I avoid financial decisions because I don\'t trust the data') { addPoints('management_accounts', 30, 'Financial: avoid'); addPoints('fractional_cfo', 15, 'Financial: avoid'); }

  const founderDep = responses.sd_founder_dependency;
  if (founderDep === 'Chaos - I\'m essential to everything') { addPoints('systems_audit', 30, 'Founder dep: chaos'); addPoints('fractional_coo', 20, 'Founder dep: chaos'); }
  else if (founderDep === 'I honestly don\'t know - never tested it') addPoints('systems_audit', 20, 'Founder dep: unknown');

  const manualWork = responses.sd_manual_work_percentage;
  if (manualWork === 'Significant - probably 30-50%') { addPoints('systems_audit', 20, 'Manual: 30-50%'); addPoints('automation', 30, 'Manual: 30-50%'); }
  else if (manualWork === 'Too much - over half our effort is manual') { addPoints('systems_audit', 25, 'Manual: 50%+'); addPoints('automation', 35, 'Manual: 50%+'); }

  const growthBlocker = responses.sd_growth_blocker;
  if (growthBlocker === 'Lack of clarity on where to focus') addPoints('365_method', 25, 'Growth: clarity');
  else if (growthBlocker === 'Can\'t deliver more without breaking things') { addPoints('systems_audit', 25, 'Growth: delivery'); addPoints('automation', 15, 'Growth: delivery'); }
  else if (growthBlocker === 'Don\'t have the right people') addPoints('fractional_coo', 25, 'Growth: people');
  else if (growthBlocker === 'Don\'t have the capital') addPoints('fractional_cfo', 25, 'Growth: capital');

  const exitTimeline = responses.sd_exit_timeline;
  if (exitTimeline === 'Already exploring options') addPoints('business_advisory', 35, 'Exit: exploring');
  else if (exitTimeline === '1-3 years - actively preparing') addPoints('business_advisory', 30, 'Exit: 1-3 years');
  else if (exitTimeline === '3-5 years - need to start thinking') addPoints('business_advisory', 20, 'Exit: 3-5 years');

  const opsFrustration = getLower(responses.sd_operational_frustration);
  if (opsFrustration) {
    if (containsAny(opsFrustration, ['manual', 'repetitive', 'data entry'])) addPoints('automation', 25, 'Ops: manual');
    if (containsAny(opsFrustration, ['systems', 'process', 'broken', 'inefficient'])) addPoints('systems_audit', 20, 'Ops: systems');
    if (containsAny(opsFrustration, ['team', 'people', 'staff'])) addPoints('fractional_coo', 15, 'Ops: people');
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
  if (containsAny(unlimited, KEYWORD_SETS.capital)) patterns.capitalSignals.push('Unlimited change: capital');
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

  // Extract emotional anchors - with fallbacks for legacy question IDs
  const emotionalAnchors: Record<string, string> = {
    // Primary field || Legacy fallback
    tuesdayTest: responses.dd_five_year_vision || responses.dd_five_year_picture || '',
    unlimitedChange: responses.dd_unlimited_change || responses.dd_what_would_change || '',
    emergencyLog: responses.dd_emergency_log || '',
    coreFrustration: responses.dd_core_frustration || responses.dd_biggest_frustration || '',
    hiddenFromTeam: responses.dd_hidden_from_team || responses.dd_team_secret || '',
    avoidedConversation: responses.dd_avoided_conversation || '',
    hardTruth: responses.dd_hard_truth || '',
    relationshipMirror: responses.dd_relationship_mirror || responses.dd_external_view || '',
    sacrificeList: responses.dd_sacrifice_list || '',
    suspectedTruth: responses.dd_suspected_truth || '',
    magicFix: responses.dd_magic_fix || '',
    operationalFrustration: responses.sd_operational_frustration || '',
    finalInsight: responses.dd_final_insight || responses.dd_final_message || '',
    // Additional legacy fields that provide value
    ownerHours: responses.dd_owner_hours || '',
    timeBreakdown: responses.dd_time_breakdown || '',
    founderDependency: responses.sd_founder_dependency || '',
    keyPersonRisk: responses.dd_key_person_risk || '',
    manualWork: responses.sd_manual_work || '',
    numbersAction: responses.sd_numbers_action || '',
    holidayReality: responses.dd_holiday_reality || '',
    changeReadiness: responses.dd_change_readiness || '',
    successDefinition: responses.dd_success_definition || '',
    nonNegotiables: Array.isArray(responses.dd_non_negotiables) 
      ? responses.dd_non_negotiables.join(', ') 
      : responses.dd_non_negotiables || '',
  };

  return { scores, patterns, emotionalAnchors, recommendations };
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startTime = Date.now();

    // Update engagement status
    await supabase
      .from('discovery_engagements')
      .update({ 
        status: 'pass1_processing', 
        pass1_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', engagementId);

    // Fetch engagement with discovery data
    const { data: engagement, error: engError } = await supabase
      .from('discovery_engagements')
      .select(`
        *,
        client:practice_members!discovery_engagements_client_id_fkey(id, name, client_company, email),
        discovery:destination_discovery(*)
      `)
      .eq('id', engagementId)
      .single();

    if (engError || !engagement) {
      throw new Error(`Engagement not found: ${engError?.message}`);
    }

    if (!engagement.discovery) {
      throw new Error('No discovery responses found for this engagement');
    }

    // Get responses from the JSONB column (not individual columns)
    const discoveryResponses = engagement.discovery.responses || engagement.discovery;
    console.log('[Pass 1] Discovery responses keys:', Object.keys(discoveryResponses || {}));

    // Fetch any additional context notes
    const { data: contextNotes } = await supabase
      .from('discovery_context_notes')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('is_for_ai_analysis', true);

    // Fetch any uploaded documents (get summaries if available)
    const { data: documents } = await supabase
      .from('discovery_uploaded_documents')
      .select('*')
      .eq('engagement_id', engagementId)
      .eq('is_for_ai_analysis', true);

    // Run scoring algorithm - pass the responses (from JSONB column or direct)
    const scoringResult = scoreServicesFromDiscovery(discoveryResponses);

    // Split recommendations into primary (top 3 with score >= 50) and secondary
    const primaryRecommendations = scoringResult.recommendations
      .filter(r => r.recommended)
      .slice(0, 3);
    
    const secondaryRecommendations = scoringResult.recommendations
      .filter(r => r.recommended)
      .slice(3);

    const processingTime = Date.now() - startTime;

    // Create or update report with Pass 1 results
    const { data: existingReport } = await supabase
      .from('discovery_reports')
      .select('id')
      .eq('engagement_id', engagementId)
      .single();

    const reportData = {
      engagement_id: engagementId,
      status: 'pass1_complete',
      service_scores: scoringResult.scores,
      detection_patterns: scoringResult.patterns,
      emotional_anchors: scoringResult.emotionalAnchors,
      urgency_multiplier: scoringResult.patterns.urgencyMultiplier,
      change_readiness: discoveryResponses.dd_change_readiness || engagement.discovery.dd_change_readiness,
      primary_recommendations: primaryRecommendations,
      secondary_recommendations: secondaryRecommendations,
      pass1_completed_at: new Date().toISOString(),
      prompt_version: 'v2.0-pass1',
      generation_time_ms: processingTime,
      updated_at: new Date().toISOString(),
    };

    if (existingReport) {
      await supabase
        .from('discovery_reports')
        .update(reportData)
        .eq('id', existingReport.id);
    } else {
      await supabase
        .from('discovery_reports')
        .insert(reportData);
    }

    // Update engagement status
    await supabase
      .from('discovery_engagements')
      .update({ 
        status: 'pass1_complete', 
        pass1_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', engagementId);

    // Store individual triggers for audit trail
    const triggerInserts = [];
    for (const [serviceCode, scoreData] of Object.entries(scoringResult.scores)) {
      for (const trigger of scoreData.triggers) {
        triggerInserts.push({
          discovery_id: engagement.discovery.id,
          service_code: serviceCode,
          trigger_source: serviceCode,
          trigger_description: trigger,
          points_added: 0, // Could calculate this more precisely
        });
      }
    }

    if (triggerInserts.length > 0) {
      await supabase
        .from('discovery_service_triggers')
        .insert(triggerInserts);
    }

    // Store detection patterns
    await supabase
      .from('discovery_patterns')
      .upsert({
        discovery_id: engagement.discovery.id,
        client_id: engagement.client_id,
        burnout_detected: scoringResult.patterns.burnoutDetected,
        burnout_flags: scoringResult.patterns.burnoutFlags,
        burnout_indicators: scoringResult.patterns.burnoutIndicators,
        capital_raising_detected: scoringResult.patterns.capitalRaisingDetected,
        capital_signals: scoringResult.patterns.capitalSignals,
        lifestyle_transformation_detected: scoringResult.patterns.lifestyleTransformationDetected,
        lifestyle_signals: scoringResult.patterns.lifestyleSignals,
        urgency_multiplier: scoringResult.patterns.urgencyMultiplier,
        change_readiness: discoveryResponses.dd_change_readiness || engagement.discovery.dd_change_readiness,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'discovery_id' });

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        scores: scoringResult.scores,
        patterns: scoringResult.patterns,
        primaryRecommendations,
        secondaryRecommendations,
        emotionalAnchors: scoringResult.emotionalAnchors,
        contextNotesCount: contextNotes?.length || 0,
        documentsCount: documents?.length || 0,
        processingTimeMs: processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pass 1 error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

