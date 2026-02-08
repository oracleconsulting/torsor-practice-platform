/* COPY - Do not edit. Reference only. Source: see DISCOVERY_SYSTEM_LIVE_SUMMARY.md */
/**
 * Service scoring utility for discovery assessments
 * Handles flexible field names for backwards compatibility
 */

export interface ServiceScore {
  code: string;
  name: string;
  score: number;        // 0-100
  confidence: number;   // 0-100
  triggers: string[];   // Which questions triggered this
  priority: number;     // 1-5, 1 = highest
}

const SERVICES = [
  { code: '365_method', name: 'Goal Alignment Programme' },
  { code: 'management_accounts', name: 'Management Accounts' },
  { code: 'benchmarking', name: 'Benchmarking' },
  { code: 'systems_audit', name: 'Systems Audit' },
  { code: 'fractional_cfo', name: 'Fractional CFO' },
  { code: 'fractional_coo', name: 'Fractional COO' },
  { code: 'business_advisory', name: 'Business Advisory' },
  { code: 'automation', name: 'Automation' },
];

// Helper to get field value with multiple possible names
function getField(responses: Record<string, any>, ...keys: string[]): any {
  for (const key of keys) {
    if (responses[key] !== undefined && responses[key] !== null && responses[key] !== '') {
      return responses[key];
    }
  }
  return undefined;
}

export function scoreServicesFromDiscovery(
  responses: Record<string, any>
): ServiceScore[] {
  const scores: Record<string, ServiceScore> = {};
  
  // Initialize all services
  for (const service of SERVICES) {
    scores[service.code] = {
      code: service.code,
      name: service.name,
      score: 0,
      confidence: 0,
      triggers: [],
      priority: 5,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // EXTRACT RESPONSES WITH FALLBACKS
  // ═══════════════════════════════════════════════════════════════
  
  // Destination Discovery
  const vision = (getField(responses, 'dd_five_year_vision', 'dd_five_year_picture', 'five_year_vision') || '').toLowerCase();
  const successDef = getField(responses, 'dd_success_definition', 'success_definition') || '';
  const nonNegotiables = getField(responses, 'dd_non_negotiables', 'non_negotiables') || [];
  const exitMindset = getField(responses, 'dd_exit_mindset', 'exit_mindset') || '';
  const realityAssessment = getField(responses, 'dd_reality_assessment', 'reality_assessment') || '';
  const weeklyHours = getField(responses, 'dd_weekly_hours', 'dd_owner_hours', 'weekly_hours') || '';
  const timeAllocation = getField(responses, 'dd_time_allocation', 'time_allocation') || '';
  const scalingConstraint = getField(responses, 'dd_scaling_constraint', 'scaling_constraint') || '';
  const sleepThieves = getField(responses, 'dd_sleep_thieves', 'dd_sleep_thief', 'sleep_thieves') || [];
  const coreFrustration = (getField(responses, 'dd_core_frustration', 'core_frustration') || '').toLowerCase();
  const teamConfidence = getField(responses, 'dd_team_confidence', 'team_confidence') || '';
  const keyPersonDep = getField(responses, 'dd_key_person_dependency', 'key_person_dependency') || '';
  const peopleChallenge = getField(responses, 'dd_people_challenge', 'people_challenge') || '';
  const delegationAbility = getField(responses, 'dd_delegation_ability', 'delegation_ability') || '';
  const externalPerspective = getField(responses, 'dd_external_perspective', 'dd_external_view', 'external_perspective') || '';
  const suspectedTruth = (getField(responses, 'dd_suspected_truth', 'dd_if_i_knew', 'suspected_truth') || '').toLowerCase();
  const priorityArea = getField(responses, 'dd_priority_area', 'priority_area') || '';
  const changeReadiness = getField(responses, 'dd_change_readiness', 'change_readiness') || '';
  
  // Service Diagnostics
  const financialConfidence = getField(responses, 'sd_financial_confidence', 'financial_confidence') || '';
  const numbersFreq = getField(responses, 'sd_numbers_action_frequency', 'numbers_action_frequency') || '';
  const benchmarkAwareness = getField(responses, 'sd_benchmark_awareness', 'benchmark_awareness') || '';
  const founderDep = getField(responses, 'sd_founder_dependency', 'founder_dependency') || '';
  const manualWork = getField(responses, 'sd_manual_work_percentage', 'manual_work_percentage') || '';
  const problemSpeed = getField(responses, 'sd_problem_awareness_speed', 'problem_awareness_speed') || '';
  const planClarity = getField(responses, 'sd_plan_clarity', 'plan_clarity') || '';
  const accountability = getField(responses, 'sd_accountability_source', 'accountability_source') || '';
  const decisionSupport = getField(responses, 'sd_decision_support', 'decision_support') || '';
  const growthBlocker = getField(responses, 'sd_growth_blocker', 'growth_blocker') || '';
  const scalingVuln = getField(responses, 'sd_scaling_vulnerability', 'scaling_vulnerability') || '';
  const operationalFrustration = (getField(responses, 'sd_operational_frustration', 'operational_frustration') || '').toLowerCase();
  const docReadiness = getField(responses, 'sd_documentation_readiness', 'documentation_readiness') || '';
  const valuationUnderstanding = getField(responses, 'sd_valuation_understanding', 'valuation_understanding') || '';
  const exitTimeline = getField(responses, 'sd_exit_timeline', 'exit_timeline') || '';
  
  // ═══════════════════════════════════════════════════════════════
  // GOAL ALIGNMENT SCORING
  // ═══════════════════════════════════════════════════════════════
  
  // Success definition triggers
  if (['Creating a business that runs profitably without me',
       'Building a legacy that outlasts me',
       'Building something I can sell for a life-changing amount'].includes(successDef)) {
    scores['365_method'].score += 25;
    scores['365_method'].triggers.push(`Success: "${successDef}"`);
  }
  
  // Vision contains transformation keywords
  if (vision.includes('invest') || vision.includes('portfolio') || 
      vision.includes('advisory') || vision.includes('board') ||
      vision.includes('step back') || vision.includes('chairman')) {
    scores['365_method'].score += 20;
    scores['365_method'].triggers.push('Vision: operator-to-investor transition');
  }
  
  // Burnout with high readiness
  if (['60-70 hours', '70+ hours'].includes(weeklyHours) && 
      changeReadiness === "Completely ready - I'll do whatever it takes") {
    scores['365_method'].score += 15;
    scores['365_method'].triggers.push('Burnout with high readiness');
  }
  
  // Plan clarity gap
  if (['I have goals but not a real plan', 
       "I'm too busy to plan",
       "I've given up on planning - things always change"].includes(planClarity)) {
    scores['365_method'].score += 15;
    scores['365_method'].triggers.push(`Plan clarity: "${planClarity}"`);
  }
  
  // No accountability
  if (['My spouse/family (informally)', 'No one - just me'].includes(accountability)) {
    scores['365_method'].score += 10;
    scores['365_method'].triggers.push('No formal accountability');
  }
  
  // Exit mindset without plan
  if (['I think about it but haven\'t planned', 
       'I\'d love to but can\'t see how'].includes(exitMindset)) {
    scores['365_method'].score += 10;
    scores['365_method'].triggers.push(`Exit desire without plan`);
  }
  
  // Work-life balance strain
  if (['It\'s a significant source of tension',
       'They\'ve given up complaining',
       'They worry about me sometimes'].includes(externalPerspective)) {
    scores['365_method'].score += 10;
    scores['365_method'].triggers.push('Work-life balance strain');
  }

  // ═══════════════════════════════════════════════════════════════
  // MANAGEMENT ACCOUNTS SCORING
  // ═══════════════════════════════════════════════════════════════
  
  // Financial confidence
  if (['Uncertain - Im often surprised', 
       'Not confident - I mostly guess',
       'I avoid financial decisions because I dont trust the data'].includes(financialConfidence)) {
    scores['management_accounts'].score += 30;
    scores['management_accounts'].triggers.push(`Financial confidence: "${financialConfidence}"`);
  }
  
  // Numbers action frequency
  if (['Quarterly - when accounts come through',
       'Rarely - I dont find them useful',
       'Never - I dont get meaningful management information'].includes(numbersFreq)) {
    scores['management_accounts'].score += 25;
    scores['management_accounts'].triggers.push(`Numbers frequency: "${numbersFreq}"`);
  }
  
  // "If I knew my numbers" suspicion
  if (suspectedTruth.includes('margin') || suspectedTruth.includes('profit') ||
      suspectedTruth.includes('losing') || suspectedTruth.includes('cost') ||
      suspectedTruth.includes('pricing') || suspectedTruth.includes('money')) {
    scores['management_accounts'].score += 20;
    scores['management_accounts'].triggers.push('Suspects financial issues');
  }
  
  // Sleep thieves include cash/numbers
  const sleepArray = Array.isArray(sleepThieves) ? sleepThieves : [sleepThieves];
  if (sleepArray.some((s: string) => s && (s.includes('Cash flow') || s.includes('numbers') || s.includes('Cash flow and paying bills')))) {
    scores['management_accounts'].score += 15;
    scores['management_accounts'].triggers.push('Financial worries keeping awake');
  }
  
  // Priority area explicit
  if (priorityArea === 'Getting real financial visibility and control') {
    scores['management_accounts'].score += 30;
    scores['management_accounts'].triggers.push('Priority: financial visibility');
  }
  
  // ═══════════════════════════════════════════════════════════════
  // BENCHMARKING SCORING
  // ═══════════════════════════════════════════════════════════════
  
  // Direct benchmark awareness question - THIS IS THE PRIMARY TRIGGER
  if (benchmarkAwareness === 'No - Id love to know but dont have access') {
    scores['benchmarking'].score += 40;
    scores['benchmarking'].triggers.push('Wants benchmarking but lacks access');
  } else if (benchmarkAwareness === 'Never considered it') {
    scores['benchmarking'].score += 25;
    scores['benchmarking'].triggers.push('Never considered benchmarking');
  } else if (benchmarkAwareness === 'Roughly - I have a general sense') {
    scores['benchmarking'].score += 15;
    scores['benchmarking'].triggers.push('Only rough sense of market position');
  }
  
  // Suspected underperformance
  if (suspectedTruth.includes('underperform') || suspectedTruth.includes('behind') ||
      suspectedTruth.includes('compared') || suspectedTruth.includes('competitor') ||
      suspectedTruth.includes('industry') || suspectedTruth.includes('average')) {
    scores['benchmarking'].score += 20;
    scores['benchmarking'].triggers.push('Suspects market underperformance');
  }
  
  // Valuation understanding gap
  if (['No idea - its never come up', 
       'I try not to think about it'].includes(valuationUnderstanding)) {
    scores['benchmarking'].score += 15;
    scores['benchmarking'].triggers.push('No valuation understanding');
  }
  
  // Frustration mentions competition/pricing
  if (coreFrustration.includes('price') || coreFrustration.includes('compet') ||
      coreFrustration.includes('market') || coreFrustration.includes('rate')) {
    scores['benchmarking'].score += 15;
    scores['benchmarking'].triggers.push('Frustration with competitive positioning');
  }

  // ═══════════════════════════════════════════════════════════════
  // SYSTEMS AUDIT SCORING
  // ═══════════════════════════════════════════════════════════════
  
  // Founder dependency
  if (['Chaos - Im essential to everything',
       'Significant problems - but wouldnt collapse'].includes(founderDep)) {
    scores['systems_audit'].score += 25;
    scores['systems_audit'].triggers.push(`Founder dependency: "${founderDep}"`);
  }
  
  // Manual work percentage - ALSO TRIGGERS AUTOMATION
  if (['Significant - probably 30-50%', 
       'Too much - over half our effort is manual'].includes(manualWork)) {
    scores['systems_audit'].score += 25;
    scores['systems_audit'].triggers.push(`Manual work: "${manualWork}"`);
    // Boost automation too
    scores['automation'].score += 30;
    scores['automation'].triggers.push(`High manual work: "${manualWork}"`);
  } else if (manualWork === 'I dont know - never measured it') {
    scores['systems_audit'].score += 15;
    scores['systems_audit'].triggers.push('Unknown manual work level');
  }
  
  // Problem awareness speed
  if (['Days later - when problems compound',
       'Often too late - when customers complain',
       'Were often blindsided'].includes(problemSpeed)) {
    scores['systems_audit'].score += 20;
    scores['systems_audit'].triggers.push(`Slow problem detection: "${problemSpeed}"`);
  }
  
  // Key person dependency
  if (['Disaster - the business would struggle badly',
       'Major disruption for 6+ months'].includes(keyPersonDep)) {
    scores['systems_audit'].score += 20;
    scores['systems_audit'].triggers.push(`Key person risk: "${keyPersonDep}"`);
  }
  
  // Time allocation (firefighting)
  if (['90% firefighting / 10% strategic',
       '70% firefighting / 30% strategic'].includes(timeAllocation)) {
    scores['systems_audit'].score += 15;
    scores['systems_audit'].triggers.push(`Firefighting: "${timeAllocation}"`);
  }
  
  // Scaling vulnerability = operations
  if (scalingVuln === 'Operational processes') {
    scores['systems_audit'].score += 20;
    scores['systems_audit'].triggers.push('Operations would break on scaling');
  }
  
  // Delegation ability poor
  if (['Poor - I struggle to let go',
       'Terrible - I end up doing everything myself'].includes(delegationAbility)) {
    scores['systems_audit'].score += 15;
    scores['systems_audit'].triggers.push(`Delegation issues: "${delegationAbility}"`);
  }
  
  // Priority area explicit
  if (priorityArea === 'Building a business that runs without me' ||
      priorityArea === 'Scaling without scaling the chaos') {
    scores['systems_audit'].score += 25;
    scores['systems_audit'].triggers.push(`Priority: "${priorityArea}"`);
  }
  
  // Operational frustration keywords
  if (operationalFrustration.includes('manual') || operationalFrustration.includes('process') ||
      operationalFrustration.includes('system') || operationalFrustration.includes('repeat')) {
    scores['systems_audit'].score += 15;
    scores['automation'].score += 15;
    scores['systems_audit'].triggers.push('Operational frustration with processes');
    scores['automation'].triggers.push('Frustration suggests automation opportunity');
  }

  // ═══════════════════════════════════════════════════════════════
  // FRACTIONAL CFO SCORING
  // ═══════════════════════════════════════════════════════════════
  
  // Scaling vulnerability = financial
  if (scalingVuln === 'Financial systems and controls') {
    scores['fractional_cfo'].score += 30;
    scores['fractional_cfo'].triggers.push('Financial systems would break on scaling');
  }
  
  // Growth blocker = capital
  if (growthBlocker === 'Dont have the capital') {
    scores['fractional_cfo'].score += 20;
    scores['fractional_cfo'].triggers.push('Capital constraint');
  }
  
  // Low financial confidence AND scaling business
  if (['Uncertain - Im often surprised', 
       'Not confident - I mostly guess'].includes(financialConfidence) &&
      ['50-60 hours', '60-70 hours', '70+ hours'].includes(weeklyHours)) {
    scores['fractional_cfo'].score += 15;
    scores['fractional_cfo'].triggers.push('Founder stretched with financial uncertainty');
  }
  
  // Decision support lacking
  if (['Friends or family (not business experts)',
       'I figure it out myself',
       'I avoid major decisions'].includes(decisionSupport)) {
    scores['fractional_cfo'].score += 15;
    scores['fractional_cfo'].triggers.push('Lacks strategic financial advice');
  }

  // ═══════════════════════════════════════════════════════════════
  // FRACTIONAL COO SCORING
  // ═══════════════════════════════════════════════════════════════
  
  // Team stretched
  if (scalingConstraint === 'My team - were stretched thin') {
    scores['fractional_coo'].score += 25;
    scores['fractional_coo'].triggers.push('Team stretched thin');
  }
  
  // Personal capacity maxed
  if (scalingConstraint === 'My personal capacity - Im already maxed') {
    scores['fractional_coo'].score += 20;
    scores['365_method'].score += 10; // Also boost 365
    scores['fractional_coo'].triggers.push('Personal capacity maxed');
  }
  
  // People challenge
  if (['Finding good people to hire',
       'Developing future leaders',
       'Managing performance',
       'Getting the best from current team'].includes(peopleChallenge)) {
    scores['fractional_coo'].score += 20;
    scores['fractional_coo'].triggers.push(`People challenge: "${peopleChallenge}"`);
  }
  
  // Scaling vulnerability = team
  if (scalingVuln === 'Team capacity' || scalingVuln === 'My personal capacity') {
    scores['fractional_coo'].score += 20;
    scores['fractional_coo'].triggers.push('Team/capacity would break on scaling');
  }
  
  // Low team confidence
  if (['1-3: Major concerns', '4-5: Some good people but significant gaps'].includes(teamConfidence)) {
    scores['fractional_coo'].score += 15;
    scores['fractional_coo'].triggers.push(`Team confidence: "${teamConfidence}"`);
  }

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS ADVISORY SCORING
  // ═══════════════════════════════════════════════════════════════
  
  // Exit timeline
  if (['Already exploring options',
       '1-3 years - actively preparing',
       '3-5 years - need to start thinking'].includes(exitTimeline)) {
    scores['business_advisory'].score += 30;
    scores['business_advisory'].triggers.push(`Exit timeline: "${exitTimeline}"`);
  }
  
  // Documentation readiness
  if (['It would take weeks to pull together',
       'Months - things are scattered',
       'I dont know where to start'].includes(docReadiness)) {
    scores['business_advisory'].score += 20;
    scores['business_advisory'].triggers.push(`Documentation: "${docReadiness}"`);
  }
  
  // Priority area = protecting value
  if (priorityArea === 'Protecting the value Ive built') {
    scores['business_advisory'].score += 30;
    scores['business_advisory'].triggers.push('Priority: value protection');
  }
  
  // Success = exit
  if (successDef === 'Building something I can sell for a life-changing amount') {
    scores['business_advisory'].score += 20;
    scores['business_advisory'].triggers.push('Success defined as exit');
  }
  
  // Exit mindset active
  if (exitMindset === 'Ive already got a clear exit plan') {
    scores['business_advisory'].score += 15;
    scores['business_advisory'].triggers.push('Already has exit plan - needs advisory support');
  }

  // ═══════════════════════════════════════════════════════════════
  // NORMALIZE AND PRIORITIZE
  // ═══════════════════════════════════════════════════════════════
  
  const results = Object.values(scores)
    .map(s => ({
      ...s,
      score: Math.min(100, s.score),
      confidence: Math.min(100, s.triggers.length * 20),
    }))
    .sort((a, b) => b.score - a.score);
  
  let priority = 1;
  for (const service of results) {
    if (service.score >= 50) {
      service.priority = priority++;
    } else if (service.score >= 30) {
      service.priority = Math.max(3, priority++);
    } else {
      service.priority = 5;
    }
  }
  
  return results;
}

