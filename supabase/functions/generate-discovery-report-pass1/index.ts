// ============================================================================
// DISCOVERY REPORT - PASS 1: EXTRACTION & SCORING + 7-DIMENSION ANALYSIS
// ============================================================================
// Analyzes discovery responses, calculates service scores, extracts emotional
// anchors, detects special patterns, AND runs comprehensive 7-dimension
// financial analysis (valuation, trajectory, payroll, productivity, working
// capital, exit readiness, cost of inaction)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// 7-DIMENSION ANALYSIS TYPES
// ============================================================================

interface PayrollBenchmark {
  typical: number;
  good: number;
  concern: number;
  notes: string;
}

interface PayrollAnalysis {
  isOverstaffed: boolean;
  excessPercentage: number;
  annualExcess: number;
  benchmark: PayrollBenchmark;
  assessment: 'efficient' | 'typical' | 'elevated' | 'concerning';
  calculation: string;
  staffCosts: number;
  turnover: number;
  staffCostsPct: number;
  isValidated: boolean;
  validationErrors: string[];
}

interface ValuationAdjustment {
  factor: string;
  impact: number;
  reason: string;
  source: 'accounts' | 'assessment' | 'calculated';
}

interface HiddenAsset {
  type: 'property' | 'cash' | 'ip' | 'contracts' | 'other';
  value: number | null;
  description: string;
}

interface ValuationAnalysis {
  hasData: boolean;
  operatingProfit: number | null;
  netAssets: number | null;
  baseMultipleLow: number;
  baseMultipleHigh: number;
  adjustments: ValuationAdjustment[];
  adjustedMultipleLow: number;
  adjustedMultipleHigh: number;
  conservativeValue: number | null;
  midRangeValue: number | null;
  optimisticValue: number | null;
  hiddenAssets: HiddenAsset[];
  narrative: string;
}

interface TrajectoryAnalysis {
  hasData: boolean;
  currentRevenue: number | null;
  priorRevenue: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  trend: 'growing' | 'stable' | 'declining';
  concernLevel: 'none' | 'monitor' | 'urgent';
  ownerPerception: string | null;
  marketContext: string | null;
  narrative: string;
}

interface ProductivityAnalysis {
  hasData: boolean;
  revenue: number | null;
  employeeCount: number | null;
  revenuePerHead: number | null;
  benchmarkLow: number;
  benchmarkHigh: number;
  gap: number | null;
  impliedHeadcount: number | null;
  excessHeadcount: number | null;
  narrative: string;
}

interface WorkingCapitalConcern {
  metric: string;
  value: number;
  benchmark: number;
  concern: string;
  tiedUpCapital?: number;
}

interface WorkingCapitalAnalysis {
  hasData: boolean;
  debtorDays: number | null;
  stockDays: number | null;
  creditorDays: number | null;
  cashConversionCycle: number | null;
  cashPosition: number | null;
  cashAsMonthsRunway: number | null;
  concerns: WorkingCapitalConcern[];
  narrative: string;
}

interface ExitReadinessFactor {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  status: 'green' | 'amber' | 'red';
  evidence: string;
}

interface ExitReadinessAnalysis {
  score: number;
  maxScore: number;
  readiness: 'ready' | 'nearly' | 'not_ready';
  factors: ExitReadinessFactor[];
  strengths: string[];
  blockers: string[];
  narrative: string;
}

interface CostComponent {
  category: string;
  annualCost: number | null;
  costOverHorizon: number | null;
  calculation: string;
  confidence: 'calculated' | 'estimated' | 'indicative';
}

interface CostOfInactionAnalysis {
  hasData: boolean;
  timeHorizon: number;
  components: CostComponent[];
  totalAnnual: number;
  totalOverHorizon: number;
  narrative: string;
}

interface ComprehensiveAnalysis {
  dataQuality: 'comprehensive' | 'partial' | 'limited';
  availableMetrics: string[];
  missingMetrics: string[];
  valuation: ValuationAnalysis | null;
  trajectory: TrajectoryAnalysis | null;
  payroll: PayrollAnalysis | null;
  productivity: ProductivityAnalysis | null;
  workingCapital: WorkingCapitalAnalysis | null;
  exitReadiness: ExitReadinessAnalysis | null;
  costOfInaction: CostOfInactionAnalysis | null;
}

interface ExtractedFinancials {
  hasAccounts: boolean;
  source?: string;
  turnover?: number;
  turnoverPriorYear?: number;
  turnoverGrowth?: number;
  totalStaffCosts?: number;
  staffCostsPercentOfRevenue?: number;
  operatingProfit?: number;
  ebitda?: number;
  netAssets?: number;
  employeeCount?: number;
  grossProfit?: number;
  grossMarginPct?: number;
  cash?: number;
  debtors?: number;
  creditors?: number;
  stock?: number;
  fixedAssets?: number;
  freeholdProperty?: number;
  costOfSales?: number;
  revenuePerEmployee?: number;
}

interface DestinationClarityAnalysis {
  score: number;
  reasoning: string;
  factors: string[];
}

interface ValuationSignals {
  marketPosition: 'leader' | 'niche' | 'competitor';
  founderDependency: 'optional' | 'moderate' | 'critical';
  hasDocumentation: boolean;
  hasUnresolvedIssues: boolean;
  coreBusinessDeclining: boolean;
  exitTimeline: string;
  avoidedConversation: string;
}

// ============================================================================
// INDUSTRY PAYROLL BENCHMARKS (UK SME)
// ============================================================================

const PAYROLL_BENCHMARKS: Record<string, PayrollBenchmark> = {
  // Distribution & Wholesale (28-32% is healthy range)
  'wholesale_distribution': { typical: 30, good: 28, concern: 32, notes: 'Wholesale/distribution - 28-32% healthy' },
  'distribution': { typical: 30, good: 28, concern: 32, notes: 'Distribution' },
  'wholesale': { typical: 30, good: 28, concern: 32, notes: 'Wholesale' },
  'keys_lockers': { typical: 30, good: 28, concern: 32, notes: 'Keys/lockers wholesale' },
  
  // Professional Services (45-60% typical)
  'professional_services': { typical: 52, good: 45, concern: 60, notes: 'People are the product' },
  'consulting': { typical: 52, good: 45, concern: 60, notes: 'Consulting' },
  'accountancy': { typical: 50, good: 45, concern: 55, notes: 'Accountancy' },
  'legal': { typical: 52, good: 45, concern: 60, notes: 'Legal' },
  
  // Technology (35-50% typical)
  'technology': { typical: 42, good: 35, concern: 50, notes: 'Technology' },
  'saas': { typical: 38, good: 30, concern: 45, notes: 'SaaS' },
  'software': { typical: 42, good: 35, concern: 50, notes: 'Software' },
  
  // Construction (30-40% typical)
  'construction': { typical: 35, good: 30, concern: 40, notes: 'Construction' },
  'trades': { typical: 35, good: 30, concern: 40, notes: 'Trades' },
  
  // Retail (15-25% typical)
  'retail': { typical: 20, good: 15, concern: 25, notes: 'Retail' },
  
  // Manufacturing (25-35% typical)
  'manufacturing': { typical: 30, good: 25, concern: 35, notes: 'Manufacturing' },
  
  // Default
  'general_business': { typical: 35, good: 30, concern: 40, notes: 'UK SME average' }
};

function getPayrollBenchmark(industry: string): PayrollBenchmark {
  const lower = (industry || '').toLowerCase();
  
  // Exact match
  if (PAYROLL_BENCHMARKS[lower]) return PAYROLL_BENCHMARKS[lower];
  
  // Keys/lockers detection
  if (lower.includes('key') || lower.includes('lock') || lower.includes('locker') || lower.includes('security hardware')) {
    console.log('[Pass1] Detected keys/lockers -> wholesale_distribution');
    return PAYROLL_BENCHMARKS['wholesale_distribution'];
  }
  
  // Distribution
  if (lower.includes('distrib') || lower.includes('wholesale') || lower.includes('supply')) {
    return PAYROLL_BENCHMARKS['wholesale_distribution'];
  }
  
  // Technology
  if (lower.includes('tech') || lower.includes('software') || lower.includes('saas')) {
    return PAYROLL_BENCHMARKS['technology'];
  }
  
  // Professional services
  if (lower.includes('consult') || lower.includes('advisory')) {
    return PAYROLL_BENCHMARKS['professional_services'];
  }
  
  // Accountancy
  if (lower.includes('account') || lower.includes('bookkeep')) {
    return PAYROLL_BENCHMARKS['accountancy'];
  }
  
  return PAYROLL_BENCHMARKS['general_business'];
}

// ============================================================================
// INDUSTRY DETECTION
// ============================================================================

function detectIndustry(responses: Record<string, any>, companyName?: string): string {
  const allText = JSON.stringify({ ...responses, companyName }).toLowerCase();
  
  if (allText.includes('key') || allText.includes('locker') || allText.includes('lock') || 
      allText.includes('security hardware') || allText.includes('office furniture')) {
    return 'keys_lockers';
  }
  if (allText.includes('distribut') || allText.includes('wholesale') || allText.includes('supply chain')) {
    return 'wholesale_distribution';
  }
  if (allText.includes('saas') || allText.includes('software') || allText.includes('platform') || allText.includes('app')) {
    return 'saas';
  }
  if (allText.includes('consult') || allText.includes('advisory')) {
    return 'professional_services';
  }
  if (allText.includes('accountan') || allText.includes('bookkeep')) {
    return 'accountancy';
  }
  if (allText.includes('construction') || allText.includes('building') || allText.includes('trade')) {
    return 'construction';
  }
  if (allText.includes('retail') || allText.includes('shop') || allText.includes('ecommerce')) {
    return 'retail';
  }
  if (allText.includes('manufactur') || allText.includes('factory')) {
    return 'manufacturing';
  }
  
  return 'general_business';
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
// 7-DIMENSION ANALYSIS FUNCTIONS
// ============================================================================

// Extract valuation signals from assessment responses
function extractValuationSignals(responses: Record<string, any>): ValuationSignals {
  const allText = JSON.stringify(responses).toLowerCase();
  
  // Market position
  let marketPosition: 'leader' | 'niche' | 'competitor' = 'competitor';
  if (allText.includes('market leader') || allText.includes('clear leader') || allText.includes('dominant')) {
    marketPosition = 'leader';
  } else if (allText.includes('niche') || allText.includes('specialist')) {
    marketPosition = 'niche';
  }
  
  // Founder dependency
  const depResponse = (responses.sd_day_without_you || responses.dd_day_without_you || 
                       responses.sd_founder_dependency || '').toLowerCase();
  let founderDependency: 'optional' | 'moderate' | 'critical' = 'moderate';
  if (depResponse.includes('runs fine') || depResponse.includes('ticks along') || 
      depResponse.includes('optional') || depResponse.includes('without me')) {
    founderDependency = 'optional';
  } else if (depResponse.includes('critical') || depResponse.includes('falls apart') || 
             depResponse.includes('need me') || depResponse.includes('rely on me')) {
    founderDependency = 'critical';
  }
  
  // Documentation
  const hasDocumentation = allText.includes('documented') || allText.includes('procedures') || 
                           allText.includes('sops') || allText.includes('processes written');
  
  // Unresolved issues
  const avoidedConversation = responses.sd_avoided_conversation || responses.dd_avoided_conversation || '';
  const hasUnresolvedIssues = avoidedConversation.length > 10;
  
  // Core business declining
  const coreBusinessDeclining = allText.includes('decline') || allText.includes('shrinking') || 
                                 allText.includes('slow decline') || allText.includes('dying');
  
  // Exit timeline
  const exitTimeline = responses.sd_exit_timeline || responses.dd_exit_mindset || '';
  
  return {
    marketPosition, founderDependency, hasDocumentation, hasUnresolvedIssues,
    coreBusinessDeclining, exitTimeline, avoidedConversation
  };
}

// 1. PAYROLL EFFICIENCY ANALYSIS
function analysePayrollEfficiency(financials: ExtractedFinancials, industry: string): PayrollAnalysis | null {
  if (!financials.turnover || !financials.totalStaffCosts) {
    return null;
  }
  
  const turnover = financials.turnover;
  const staffCosts = financials.totalStaffCosts;
  const staffCostsPct = (staffCosts / turnover) * 100;
  const benchmark = getPayrollBenchmark(industry);
  
  const excessPercentage = Math.max(0, staffCostsPct - benchmark.good);
  const annualExcess = Math.round((excessPercentage / 100) * turnover);
  const isOverstaffed = staffCostsPct > benchmark.concern;
  
  let assessment: 'efficient' | 'typical' | 'elevated' | 'concerning' = 'typical';
  if (staffCostsPct <= benchmark.good) assessment = 'efficient';
  else if (staffCostsPct <= benchmark.typical) assessment = 'typical';
  else if (staffCostsPct <= benchmark.concern) assessment = 'elevated';
  else assessment = 'concerning';
  
  const calculation = `£${staffCosts.toLocaleString()} ÷ £${turnover.toLocaleString()} = ${staffCostsPct.toFixed(1)}%. ` +
    `Benchmark ${benchmark.good}-${benchmark.typical}%. Excess ${excessPercentage.toFixed(1)}% = £${annualExcess.toLocaleString()}/year`;
  
  return {
    isOverstaffed, excessPercentage, annualExcess, benchmark, assessment, calculation,
    staffCosts, turnover, staffCostsPct, isValidated: true, validationErrors: []
  };
}

// 2. VALUATION ANALYSIS
function analyseValuation(financials: ExtractedFinancials, valuationSignals: ValuationSignals, industry: string): ValuationAnalysis | null {
  if (!financials.operatingProfit && !financials.ebitda && !financials.netAssets) {
    return null;
  }
  
  // Industry-specific base multiples
  const industryMultiples: Record<string, { low: number; high: number }> = {
    'wholesale_distribution': { low: 3.0, high: 5.0 },
    'keys_lockers': { low: 3.0, high: 5.0 },
    'professional_services': { low: 4.0, high: 8.0 },
    'accountancy': { low: 4.0, high: 7.0 },
    'construction': { low: 2.5, high: 4.5 },
    'manufacturing': { low: 3.0, high: 5.0 },
    'retail': { low: 2.0, high: 4.0 },
    'technology': { low: 5.0, high: 10.0 },
    'saas': { low: 6.0, high: 12.0 },
    'general_business': { low: 3.0, high: 5.0 }
  };
  
  const industryLower = industry.toLowerCase();
  let selectedIndustry = 'general_business';
  for (const key of Object.keys(industryMultiples)) {
    if (industryLower.includes(key)) { selectedIndustry = key; break; }
  }
  
  const baseMultiples = industryMultiples[selectedIndustry];
  const adjustments: ValuationAdjustment[] = [];
  
  // Adjustment factors
  if (valuationSignals.marketPosition === 'leader') {
    adjustments.push({ factor: 'Market Leader', impact: 0.5, reason: 'Premium for dominant market position', source: 'assessment' });
  }
  if (valuationSignals.founderDependency === 'optional') {
    adjustments.push({ factor: 'Low Founder Dependency', impact: 0.5, reason: 'Business runs without owner', source: 'assessment' });
  } else if (valuationSignals.founderDependency === 'critical') {
    adjustments.push({ factor: 'High Founder Dependency', impact: -0.5, reason: 'Business relies heavily on owner', source: 'assessment' });
  }
  if (valuationSignals.hasDocumentation) {
    adjustments.push({ factor: 'Documented Processes', impact: 0.25, reason: 'Easier transition for buyers', source: 'assessment' });
  }
  if (financials.turnoverGrowth !== undefined) {
    if (financials.turnoverGrowth > 5) {
      adjustments.push({ factor: 'Growing Revenue', impact: 0.5, reason: `Revenue up ${financials.turnoverGrowth.toFixed(1)}% YoY`, source: 'accounts' });
    } else if (financials.turnoverGrowth < -2) {
      adjustments.push({ factor: 'Declining Revenue', impact: -0.5, reason: `Revenue down ${Math.abs(financials.turnoverGrowth).toFixed(1)}% YoY`, source: 'accounts' });
    }
  }
  if (valuationSignals.hasUnresolvedIssues) {
    adjustments.push({ factor: 'Unresolved Issues', impact: -0.25, reason: 'Avoided conversations or known problems', source: 'assessment' });
  }
  if (valuationSignals.coreBusinessDeclining) {
    adjustments.push({ factor: 'Core Business Declining', impact: -0.5, reason: 'Structural decline in primary market', source: 'assessment' });
  }
  
  const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.impact, 0);
  const adjustedLow = Math.max(baseMultiples.low + totalAdjustment, 1.5);
  const adjustedHigh = Math.max(baseMultiples.high + totalAdjustment, 2.0);
  
  const earningsBase = financials.operatingProfit || financials.ebitda || 0;
  const conservativeValue = earningsBase > 0 ? Math.round(earningsBase * adjustedLow) : null;
  const midRangeValue = earningsBase > 0 ? Math.round(earningsBase * ((adjustedLow + adjustedHigh) / 2)) : null;
  const optimisticValue = earningsBase > 0 ? Math.round(earningsBase * adjustedHigh) : null;
  
  // Identify hidden assets
  const hiddenAssets: HiddenAsset[] = [];
  if (financials.freeholdProperty && financials.freeholdProperty > 50000) {
    hiddenAssets.push({ type: 'property', value: financials.freeholdProperty, description: 'Freehold property on balance sheet' });
  }
  if (financials.cash && financials.turnover && financials.cash > financials.turnover * 0.15) {
    const excessCash = financials.cash - (financials.turnover * 0.1);
    hiddenAssets.push({ type: 'cash', value: excessCash, description: 'Excess cash above working capital needs' });
  }
  
  // Build narrative
  let narrative = '';
  if (conservativeValue && optimisticValue) {
    if (conservativeValue >= 1000000) {
      narrative = `Indicative valuation range £${(conservativeValue/1000000).toFixed(1)}M-£${(optimisticValue/1000000).toFixed(1)}M `;
    } else {
      narrative = `Indicative valuation range £${(conservativeValue/1000).toFixed(0)}k-£${(optimisticValue/1000).toFixed(0)}k `;
    }
    narrative += `based on ${adjustedLow.toFixed(1)}-${adjustedHigh.toFixed(1)}x operating profit.`;
    if (hiddenAssets.length > 0) {
      const totalHidden = hiddenAssets.reduce((sum, a) => sum + (a.value || 0), 0);
      narrative += ` Plus £${(totalHidden/1000).toFixed(0)}k in additional assets.`;
    }
  }
  
  return {
    hasData: true, operatingProfit: financials.operatingProfit || null, netAssets: financials.netAssets || null,
    baseMultipleLow: baseMultiples.low, baseMultipleHigh: baseMultiples.high, adjustments,
    adjustedMultipleLow: adjustedLow, adjustedMultipleHigh: adjustedHigh,
    conservativeValue, midRangeValue, optimisticValue, hiddenAssets, narrative
  };
}

// 3. TRAJECTORY ANALYSIS
function analyseTrajectory(financials: ExtractedFinancials, responses: Record<string, any>): TrajectoryAnalysis | null {
  const currentRevenue = financials.turnover || null;
  const priorRevenue = financials.turnoverPriorYear || null;
  
  const ownerPerception = responses.sd_challenges_facing || responses.dd_challenges_facing || null;
  const marketContext = responses.sd_market_position || responses.dd_market_position || null;
  
  if (!currentRevenue) {
    const allResponses = JSON.stringify(responses).toLowerCase();
    if (allResponses.includes('decline') || allResponses.includes('shrinking') || allResponses.includes('falling')) {
      return {
        hasData: false, currentRevenue: null, priorRevenue: null, absoluteChange: null, percentageChange: null,
        trend: 'declining', concernLevel: 'monitor', ownerPerception: 'Owner indicates business may be declining',
        marketContext, narrative: 'No revenue data available, but assessment responses suggest declining trajectory.'
      };
    }
    return null;
  }
  
  let absoluteChange: number | null = null;
  let percentageChange: number | null = null;
  let trend: 'growing' | 'stable' | 'declining' = 'stable';
  let concernLevel: 'none' | 'monitor' | 'urgent' = 'none';
  
  if (priorRevenue && priorRevenue > 0) {
    absoluteChange = currentRevenue - priorRevenue;
    percentageChange = ((currentRevenue - priorRevenue) / priorRevenue) * 100;
    
    if (percentageChange > 5) { trend = 'growing'; concernLevel = 'none'; }
    else if (percentageChange < -5) { trend = 'declining'; concernLevel = 'urgent'; }
    else if (percentageChange < -2) { trend = 'declining'; concernLevel = 'monitor'; }
    else if (percentageChange < 2) { trend = 'stable'; concernLevel = 'none'; }
    else { trend = 'growing'; concernLevel = 'none'; }
  }
  
  let narrative = '';
  if (percentageChange !== null) {
    if (trend === 'declining') {
      narrative = `Revenue ${percentageChange > -1 ? 'flat' : `down ${Math.abs(percentageChange).toFixed(1)}%`} year-on-year (£${Math.abs(absoluteChange!/1000).toFixed(0)}k).`;
    } else if (trend === 'growing') {
      narrative = `Revenue up ${percentageChange.toFixed(1)}% year-on-year (£${(absoluteChange!/1000).toFixed(0)}k). Positive momentum.`;
    } else {
      narrative = `Revenue stable year-on-year.`;
    }
  } else {
    narrative = `Revenue £${(currentRevenue/1000000).toFixed(2)}M. No prior year comparison available.`;
  }
  
  return {
    hasData: true, currentRevenue, priorRevenue, absoluteChange, percentageChange,
    trend, concernLevel, ownerPerception, marketContext, narrative
  };
}

// 4. PRODUCTIVITY ANALYSIS
function analyseProductivity(financials: ExtractedFinancials, industry: string): ProductivityAnalysis | null {
  if (!financials.turnover || !financials.employeeCount) return null;
  
  const revenue = financials.turnover;
  const employeeCount = financials.employeeCount;
  const revenuePerHead = revenue / employeeCount;
  
  const industryBenchmarks: Record<string, { low: number; high: number }> = {
    'wholesale_distribution': { low: 120000, high: 180000 },
    'keys_lockers': { low: 120000, high: 180000 },
    'professional_services': { low: 80000, high: 150000 },
    'accountancy': { low: 80000, high: 150000 },
    'construction': { low: 100000, high: 150000 },
    'manufacturing': { low: 80000, high: 120000 },
    'retail': { low: 60000, high: 100000 },
    'technology': { low: 100000, high: 200000 },
    'saas': { low: 150000, high: 300000 },
    'general_business': { low: 80000, high: 130000 }
  };
  
  const industryLower = industry.toLowerCase();
  let selectedIndustry = 'general_business';
  for (const key of Object.keys(industryBenchmarks)) {
    if (industryLower.includes(key)) { selectedIndustry = key; break; }
  }
  
  const benchmark = industryBenchmarks[selectedIndustry];
  const gap = benchmark.low - revenuePerHead;
  const impliedHeadcount = Math.round(revenue / benchmark.low);
  const excessHeadcount = employeeCount - impliedHeadcount;
  
  let narrative = `Revenue per head £${(revenuePerHead/1000).toFixed(0)}k vs industry benchmark £${(benchmark.low/1000).toFixed(0)}k-£${(benchmark.high/1000).toFixed(0)}k. `;
  if (revenuePerHead < benchmark.low) {
    narrative += `Below benchmark suggests ${excessHeadcount > 0 ? `${excessHeadcount} potential excess employees` : 'productivity improvement opportunity'}.`;
  } else if (revenuePerHead > benchmark.high) {
    narrative += `Above benchmark - team is highly productive, but watch for burnout.`;
  } else {
    narrative += `Within healthy range.`;
  }
  
  return {
    hasData: true, revenue, employeeCount, revenuePerHead,
    benchmarkLow: benchmark.low, benchmarkHigh: benchmark.high,
    gap: gap > 0 ? gap : null, impliedHeadcount, excessHeadcount: excessHeadcount > 0 ? excessHeadcount : null, narrative
  };
}

// 5. WORKING CAPITAL ANALYSIS
function analyseWorkingCapital(financials: ExtractedFinancials): WorkingCapitalAnalysis | null {
  if (!financials.turnover) return null;
  
  const turnover = financials.turnover;
  const costOfSales = financials.costOfSales || turnover * 0.5;
  
  const debtorDays = financials.debtors ? Math.round((financials.debtors / turnover) * 365) : null;
  const stockDays = financials.stock ? Math.round((financials.stock / costOfSales) * 365) : null;
  const creditorDays = financials.creditors ? Math.round((financials.creditors / costOfSales) * 365) : null;
  const cashConversionCycle = (debtorDays !== null && stockDays !== null && creditorDays !== null)
    ? debtorDays + stockDays - creditorDays : null;
  
  const monthlyOverheads = (financials.totalStaffCosts || 0) / 12;
  const cashAsMonthsRunway = (financials.cash && monthlyOverheads > 0) ? financials.cash / monthlyOverheads : null;
  
  const concerns: WorkingCapitalConcern[] = [];
  if (debtorDays && debtorDays > 60) {
    concerns.push({ metric: 'Debtor Days', value: debtorDays, benchmark: 45, concern: 'Slow collection of receivables', tiedUpCapital: financials.debtors });
  }
  if (stockDays && stockDays > 90) {
    concerns.push({ metric: 'Stock Days', value: stockDays, benchmark: 60, concern: 'High inventory levels tying up working capital', tiedUpCapital: financials.stock });
  }
  if (cashConversionCycle && cashConversionCycle > 90) {
    concerns.push({ metric: 'Cash Conversion Cycle', value: cashConversionCycle, benchmark: 60, concern: 'Long cycle from spend to cash collection' });
  }
  
  let narrative = '';
  if (debtorDays !== null || stockDays !== null) {
    const parts: string[] = [];
    if (debtorDays) parts.push(`Debtor days: ${debtorDays}`);
    if (stockDays) parts.push(`Stock days: ${stockDays}`);
    if (creditorDays) parts.push(`Creditor days: ${creditorDays}`);
    narrative = parts.join(', ') + '. ';
  }
  if (concerns.length > 0) {
    const totalTiedUp = concerns.reduce((sum, c) => sum + (c.tiedUpCapital || 0), 0);
    if (totalTiedUp > 0) narrative += `£${(totalTiedUp/1000).toFixed(0)}k tied up in working capital. `;
    narrative += concerns.map(c => c.concern).join('. ') + '.';
  } else if (narrative) {
    narrative += 'Working capital efficiency appears healthy.';
  }
  if (cashAsMonthsRunway !== null) {
    narrative += ` Cash runway: ${cashAsMonthsRunway.toFixed(1)} months.`;
  }
  
  return {
    hasData: debtorDays !== null || stockDays !== null || financials.cash !== undefined,
    debtorDays, stockDays, creditorDays, cashConversionCycle,
    cashPosition: financials.cash || null, cashAsMonthsRunway, concerns,
    narrative: narrative || 'Insufficient data for working capital analysis.'
  };
}

// 6. EXIT READINESS ANALYSIS
function analyseExitReadiness(responses: Record<string, any>, financials: ExtractedFinancials): ExitReadinessAnalysis | null {
  const factors: ExitReadinessFactor[] = [];
  const allText = JSON.stringify(responses).toLowerCase();
  
  // 1. FOUNDER DEPENDENCY (20 points)
  const dependencyResponse = responses.sd_day_without_you || responses.dd_day_without_you || responses.sd_founder_dependency || '';
  const dependencyLower = dependencyResponse.toLowerCase();
  let dependencyScore = 10, dependencyStatus: 'green' | 'amber' | 'red' = 'amber';
  if (dependencyLower.includes('runs fine') || dependencyLower.includes('optional') || dependencyLower.includes('ticks along')) {
    dependencyScore = 20; dependencyStatus = 'green';
  } else if (dependencyLower.includes('critical') || dependencyLower.includes('falls apart')) {
    dependencyScore = 0; dependencyStatus = 'red';
  }
  factors.push({ name: 'Founder Dependency', weight: 20, score: dependencyScore, maxScore: 20, status: dependencyStatus, evidence: dependencyResponse.substring(0, 100) || 'No data' });
  
  // 2. DOCUMENTATION (15 points)
  let docScore = 8, docStatus: 'green' | 'amber' | 'red' = 'amber';
  if (allText.includes('fully documented') || allText.includes('documented')) { docScore = 15; docStatus = 'green'; }
  else if (allText.includes('nothing documented') || allText.includes('all in my head')) { docScore = 0; docStatus = 'red'; }
  factors.push({ name: 'Documentation', weight: 15, score: docScore, maxScore: 15, status: docStatus, evidence: 'Based on assessment' });
  
  // 3. FINANCIAL CLARITY (15 points)
  const financeResponse = responses.sd_financial_confidence || responses.dd_financial_confidence || '';
  const financeLower = financeResponse.toLowerCase();
  let financeScore = 8, financeStatus: 'green' | 'amber' | 'red' = 'amber';
  if (financeLower.includes('completely on top') || financeLower.includes('weekly') || allText.includes('completely on top')) {
    financeScore = 15; financeStatus = 'green';
  } else if (financeLower.includes("don't know") || financeLower.includes('no idea')) {
    financeScore = 0; financeStatus = 'red';
  }
  factors.push({ name: 'Financial Clarity', weight: 15, score: financeScore, maxScore: 15, status: financeStatus, evidence: financeResponse.substring(0, 100) || 'No data' });
  
  // 4. REVENUE TRAJECTORY (20 points)
  let trajectoryScore = 10, trajectoryStatus: 'green' | 'amber' | 'red' = 'amber', trajectoryEvidence = 'No comparison data';
  if (financials.turnoverGrowth !== undefined) {
    if (financials.turnoverGrowth > 5) { trajectoryScore = 20; trajectoryStatus = 'green'; trajectoryEvidence = `Revenue up ${financials.turnoverGrowth.toFixed(1)}%`; }
    else if (financials.turnoverGrowth > 0) { trajectoryScore = 15; trajectoryStatus = 'green'; trajectoryEvidence = `Revenue up ${financials.turnoverGrowth.toFixed(1)}%`; }
    else if (financials.turnoverGrowth > -2) { trajectoryScore = 10; trajectoryStatus = 'amber'; trajectoryEvidence = `Revenue flat (${financials.turnoverGrowth.toFixed(1)}%)`; }
    else { trajectoryScore = 0; trajectoryStatus = 'red'; trajectoryEvidence = `Revenue down ${Math.abs(financials.turnoverGrowth).toFixed(1)}%`; }
  }
  factors.push({ name: 'Revenue Trajectory', weight: 20, score: trajectoryScore, maxScore: 20, status: trajectoryStatus, evidence: trajectoryEvidence });
  
  // 5. TEAM ISSUES RESOLVED (15 points)
  const avoidedResponse = responses.sd_avoided_conversation || responses.dd_avoided_conversation || '';
  let teamScore = 15, teamStatus: 'green' | 'amber' | 'red' = 'green';
  if (avoidedResponse && avoidedResponse.length > 10) { teamScore = 0; teamStatus = 'red'; }
  factors.push({ name: 'Team Issues Resolved', weight: 15, score: teamScore, maxScore: 15, status: teamStatus, evidence: avoidedResponse ? `Avoiding: ${avoidedResponse.substring(0, 80)}` : 'No unresolved issues' });
  
  // 6. VALUATION BASELINE (15 points)
  const hasValuation = allText.includes('valuation') || allText.includes('worth') || allText.includes('valued');
  let valuationScore = 0, valuationStatus: 'green' | 'amber' | 'red' = 'red';
  if (hasValuation) { valuationScore = 15; valuationStatus = 'green'; }
  factors.push({ name: 'Valuation Baseline', weight: 15, score: valuationScore, maxScore: 15, status: valuationStatus, evidence: hasValuation ? 'Has considered valuation' : 'No formal valuation' });
  
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0);
  const strengths = factors.filter(f => f.status === 'green').map(f => f.name);
  const blockers = factors.filter(f => f.status === 'red').map(f => f.name);
  const readiness = totalScore >= 70 ? 'ready' : totalScore >= 50 ? 'nearly' : 'not_ready';
  
  let narrative = `Exit readiness score: ${totalScore}/${maxScore} (${Math.round(totalScore/maxScore*100)}%). `;
  if (strengths.length > 0) narrative += `Strengths: ${strengths.join(', ').toLowerCase()}. `;
  if (blockers.length > 0) narrative += `Blockers: ${blockers.join(', ').toLowerCase()}.`;
  
  return { score: totalScore, maxScore, readiness, factors, strengths, blockers, narrative };
}

// 7. COST OF INACTION ANALYSIS
function calculateCostOfInaction(
  payrollAnalysis: PayrollAnalysis | null,
  trajectoryAnalysis: TrajectoryAnalysis | null,
  valuationAnalysis: ValuationAnalysis | null,
  responses: Record<string, any>
): CostOfInactionAnalysis {
  const components: CostComponent[] = [];
  
  // Determine time horizon from exit timeline
  let timeHorizon = 3;
  const exitResponse = responses.sd_exit_timeline || responses.dd_exit_mindset || '';
  if (exitResponse.includes('1-3') || exitResponse.includes('actively preparing')) timeHorizon = 2;
  else if (exitResponse.includes('3-5')) timeHorizon = 4;
  else if (exitResponse.includes('5+')) timeHorizon = 5;
  
  // 1. Payroll excess
  if (payrollAnalysis?.annualExcess && payrollAnalysis.annualExcess > 0) {
    components.push({
      category: 'Payroll Excess', annualCost: payrollAnalysis.annualExcess,
      costOverHorizon: payrollAnalysis.annualExcess * timeHorizon,
      calculation: `£${(payrollAnalysis.annualExcess/1000).toFixed(0)}k/year × ${timeHorizon} years`,
      confidence: 'calculated'
    });
  }
  
  // 2. Revenue decline
  if (trajectoryAnalysis?.trend === 'declining' && trajectoryAnalysis.absoluteChange) {
    const annualDecline = Math.abs(trajectoryAnalysis.absoluteChange);
    let totalDecline = annualDecline;
    for (let i = 1; i < timeHorizon; i++) totalDecline += annualDecline * Math.pow(1.5, i);
    components.push({
      category: 'Revenue Decline', annualCost: annualDecline,
      costOverHorizon: Math.round(totalDecline),
      calculation: `£${(annualDecline/1000).toFixed(0)}k decline, compounding over ${timeHorizon} years`,
      confidence: 'estimated'
    });
  }
  
  // 3. Exit value suppression
  if (valuationAnalysis?.adjustments) {
    const negativeAdjustments = valuationAnalysis.adjustments.filter(a => a.impact < 0);
    if (negativeAdjustments.length > 0 && valuationAnalysis.midRangeValue) {
      const valueLost = Math.round(valuationAnalysis.midRangeValue * 0.1 * negativeAdjustments.length);
      components.push({
        category: 'Exit Value Suppression', annualCost: null,
        costOverHorizon: valueLost,
        calculation: `${negativeAdjustments.length} value-suppressing factor(s) on £${(valuationAnalysis.midRangeValue/1000000).toFixed(1)}M`,
        confidence: 'indicative'
      });
    }
  }
  
  const totalAnnual = components.filter(c => c.annualCost !== null).reduce((sum, c) => sum + (c.annualCost || 0), 0);
  const totalOverHorizon = components.filter(c => c.costOverHorizon !== null).reduce((sum, c) => sum + (c.costOverHorizon || 0), 0);
  
  let narrative = '';
  if (totalOverHorizon > 0) {
    narrative = `Cost of inaction over ${timeHorizon}-year horizon: £${(totalOverHorizon/1000).toFixed(0)}k+. `;
    const componentDescriptions = components.filter(c => c.costOverHorizon && c.costOverHorizon > 0)
      .map(c => `${c.category}: £${(c.costOverHorizon!/1000).toFixed(0)}k`).join(', ');
    narrative += `Breakdown: ${componentDescriptions}.`;
  } else {
    narrative = 'Insufficient data to calculate cost of inaction.';
  }
  
  return { hasData: components.length > 0, timeHorizon, components, totalAnnual, totalOverHorizon, narrative };
}

// 8. DESTINATION CLARITY
function calculateDestinationClarity(responses: Record<string, any>): DestinationClarityAnalysis {
  const factors: string[] = [];
  let score = 0;
  const allResponses = JSON.stringify(responses).toLowerCase();
  
  // OUTCOME SPECIFICITY (0-3 points)
  const outcomes = ['sold', 'sell', 'exit', 'retire', 'looked after', 'taken care', 'moved on', 'done'];
  const outcomeCount = outcomes.filter(o => allResponses.includes(o)).length;
  if (outcomeCount >= 3) { score += 3; factors.push(`${outcomeCount} specific outcomes mentioned`); }
  else if (outcomeCount >= 1) { score += 2; factors.push(`${outcomeCount} outcome(s) mentioned`); }
  
  // EMOTIONAL CLARITY (0-2 points)
  const emotionalTerms = ['stress', 'peace', 'freedom', 'security', 'done', 'moved on', 'worry', 'relief', 'weight'];
  const emotionalCount = emotionalTerms.filter(t => allResponses.includes(t)).length;
  if (emotionalCount >= 2) { score += 2; factors.push(`${emotionalCount} emotional terms detected`); }
  else if (emotionalCount >= 1) { score += 1; factors.push(`${emotionalCount} emotional term detected`); }
  
  // TIMELINE CLARITY (0-2 points)
  if (allResponses.includes('1-3 year') || allResponses.includes('1 to 3') || allResponses.includes('within 3') || allResponses.includes('next 2-3')) {
    score += 2; factors.push('Specific timeline (1-3 years)');
  } else if (allResponses.includes('few years') || allResponses.includes('soon') || allResponses.includes('ready to')) {
    score += 1; factors.push('General timeline intent');
  }
  
  // STAKEHOLDER AWARENESS (0-2 points)
  if (allResponses.includes('colleagues') || allResponses.includes('team') || allResponses.includes('staff') || allResponses.includes('loyal')) {
    score += 2; factors.push('Stakeholder awareness present');
  }
  
  // CONVICTION (0-1 point)
  if (allResponses.includes('time to move on') || allResponses.includes('ready to') || allResponses.includes('need to')) {
    score += 1; factors.push('Strong conviction detected');
  }
  
  score = Math.min(10, score);
  
  let reasoning = '';
  if (score >= 8) reasoning = 'Crystal clear on the destination - specific outcome, timeline, and stakeholder considerations defined.';
  else if (score >= 6) reasoning = 'Good clarity on direction with some specific elements defined.';
  else if (score >= 4) reasoning = 'General sense of direction but lacking specific details.';
  else reasoning = 'Destination unclear - needs discovery work to define outcomes.';
  
  return { score: Math.max(score, 1), reasoning, factors };
}

// ============================================================================
// MASTER ORCHESTRATOR
// ============================================================================

function performComprehensiveAnalysis(
  financials: ExtractedFinancials,
  responses: Record<string, any>,
  industry: string
): ComprehensiveAnalysis {
  const valuationSignals = extractValuationSignals(responses);
  
  const payroll = analysePayrollEfficiency(financials, industry);
  const valuation = analyseValuation(financials, valuationSignals, industry);
  const trajectory = analyseTrajectory(financials, responses);
  const productivity = analyseProductivity(financials, industry);
  const workingCapital = analyseWorkingCapital(financials);
  const exitReadiness = analyseExitReadiness(responses, financials);
  const costOfInaction = calculateCostOfInaction(payroll, trajectory, valuation, responses);
  
  const availableMetrics: string[] = [];
  const missingMetrics: string[] = [];
  
  if (valuation?.hasData) availableMetrics.push('valuation'); else missingMetrics.push('valuation');
  if (trajectory?.hasData) availableMetrics.push('trajectory'); else missingMetrics.push('trajectory');
  if (payroll) availableMetrics.push('payroll'); else missingMetrics.push('payroll');
  if (productivity?.hasData) availableMetrics.push('productivity'); else missingMetrics.push('productivity');
  if (workingCapital?.hasData) availableMetrics.push('workingCapital'); else missingMetrics.push('workingCapital');
  if (exitReadiness) availableMetrics.push('exitReadiness');
  
  const dataQuality = availableMetrics.length >= 5 ? 'comprehensive' :
                      availableMetrics.length >= 3 ? 'partial' : 'limited';
  
  console.log('[Pass1] Comprehensive Analysis complete:', { dataQuality, availableMetrics });
  
  return {
    dataQuality, availableMetrics, missingMetrics,
    valuation, trajectory, payroll, productivity, workingCapital, exitReadiness, costOfInaction
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

    // ========================================================================
    // FETCH FINANCIAL DATA FOR 7-DIMENSION ANALYSIS
    // ========================================================================
    
    let extractedFinancials: ExtractedFinancials = { hasAccounts: false };
    
    const { data: financialContext } = await supabase
      .from('client_financial_context')
      .select('*')
      .eq('client_id', engagement.client_id)
      .order('period_end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (financialContext) {
      const turnover = financialContext.turnover || financialContext.revenue;
      const staffCosts = financialContext.staff_cost || financialContext.total_staff_costs;
      const insights = financialContext.extracted_insights || {};
      
      if (turnover && staffCosts) {
        extractedFinancials = {
          hasAccounts: true,
          source: 'client_financial_context',
          turnover,
          turnoverPriorYear: insights.turnover_prior_year || financialContext.turnover_prior_year,
          turnoverGrowth: financialContext.revenue_growth_pct,
          totalStaffCosts: staffCosts,
          staffCostsPercentOfRevenue: (staffCosts / turnover) * 100,
          operatingProfit: financialContext.operating_profit || insights.operating_profit,
          ebitda: financialContext.ebitda || insights.ebitda,
          netAssets: financialContext.net_assets || insights.net_assets,
          employeeCount: financialContext.staff_count,
          grossProfit: financialContext.gross_profit || insights.gross_profit,
          grossMarginPct: financialContext.gross_margin_pct,
          cash: financialContext.cash_position || insights.cash,
          debtors: insights.debtors,
          creditors: insights.creditors,
          stock: insights.stock,
          fixedAssets: insights.fixed_assets,
          freeholdProperty: insights.freehold_property,
          costOfSales: insights.cost_of_sales,
        };
        console.log('[Pass1] ✅ Loaded financials:', { 
          turnover, staffCosts, 
          operatingProfit: extractedFinancials.operatingProfit,
          employeeCount: extractedFinancials.employeeCount
        });
      }
    }
    
    // ========================================================================
    // RUN 7-DIMENSION COMPREHENSIVE ANALYSIS
    // ========================================================================
    
    const industry = detectIndustry(discoveryResponses, engagement.client?.client_company);
    console.log('[Pass1] Detected industry:', industry);
    
    const comprehensiveAnalysis = performComprehensiveAnalysis(extractedFinancials, discoveryResponses, industry);
    const destinationClarity = calculateDestinationClarity(discoveryResponses);
    
    console.log('[Pass1] Results:', {
      dataQuality: comprehensiveAnalysis.dataQuality,
      payrollExcess: comprehensiveAnalysis.payroll?.annualExcess,
      exitReadiness: comprehensiveAnalysis.exitReadiness?.score,
      destinationClarity: destinationClarity.score
    });

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
      
      // NEW: 7-Dimension Analysis Results
      comprehensive_analysis: comprehensiveAnalysis,
      destination_clarity: destinationClarity,
      detected_industry: industry,
      
      // NEW: Pre-calculated values for Pass 2 injection
      page4_numbers: {
        payrollAnalysis: comprehensiveAnalysis.payroll ? {
          turnover: comprehensiveAnalysis.payroll.turnover,
          staffCosts: comprehensiveAnalysis.payroll.staffCosts,
          staffCostsPct: comprehensiveAnalysis.payroll.staffCostsPct,
          benchmarkPct: comprehensiveAnalysis.payroll.benchmark.typical,
          excessPct: comprehensiveAnalysis.payroll.excessPercentage,
          annualExcess: comprehensiveAnalysis.payroll.annualExcess,
          calculation: comprehensiveAnalysis.payroll.calculation,
          assessment: comprehensiveAnalysis.payroll.assessment
        } : null,
        valuationAnalysis: comprehensiveAnalysis.valuation,
        trajectoryAnalysis: comprehensiveAnalysis.trajectory,
        productivityAnalysis: comprehensiveAnalysis.productivity,
        exitReadiness: comprehensiveAnalysis.exitReadiness ? {
          score: comprehensiveAnalysis.exitReadiness.score,
          maxScore: comprehensiveAnalysis.exitReadiness.maxScore,
          percentage: Math.round(comprehensiveAnalysis.exitReadiness.score / comprehensiveAnalysis.exitReadiness.maxScore * 100),
          strengths: comprehensiveAnalysis.exitReadiness.strengths,
          blockers: comprehensiveAnalysis.exitReadiness.blockers
        } : null,
        costOfInaction: comprehensiveAnalysis.costOfInaction
      },
      
      pass1_completed_at: new Date().toISOString(),
      prompt_version: 'v2.0-pass1-7dim',
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
        
        // NEW: 7-Dimension Analysis Results
        comprehensiveAnalysis: {
          dataQuality: comprehensiveAnalysis.dataQuality,
          availableMetrics: comprehensiveAnalysis.availableMetrics,
          missingMetrics: comprehensiveAnalysis.missingMetrics,
          payroll: comprehensiveAnalysis.payroll ? {
            excess: comprehensiveAnalysis.payroll.annualExcess,
            staffCostsPct: comprehensiveAnalysis.payroll.staffCostsPct,
            assessment: comprehensiveAnalysis.payroll.assessment
          } : null,
          valuation: comprehensiveAnalysis.valuation ? {
            conservativeValue: comprehensiveAnalysis.valuation.conservativeValue,
            optimisticValue: comprehensiveAnalysis.valuation.optimisticValue
          } : null,
          trajectory: comprehensiveAnalysis.trajectory ? {
            trend: comprehensiveAnalysis.trajectory.trend,
            percentageChange: comprehensiveAnalysis.trajectory.percentageChange
          } : null,
          exitReadiness: comprehensiveAnalysis.exitReadiness ? {
            score: comprehensiveAnalysis.exitReadiness.score,
            maxScore: comprehensiveAnalysis.exitReadiness.maxScore
          } : null,
          costOfInaction: comprehensiveAnalysis.costOfInaction?.totalOverHorizon || null
        },
        destinationClarity: {
          score: destinationClarity.score,
          reasoning: destinationClarity.reasoning
        },
        industry,
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

