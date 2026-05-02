// =============================================================================
// GA RESEARCH KNOWLEDGE BASE
// Structured citations the GA edge functions can draw on when generating
// client content. Each citation has a precise claim, source, year, and a
// pre-written client-facing version so we never paraphrase wrongly.
//
// Topic tags drive selection: each edge function asks for the tags relevant
// to the section it's generating, and we surface only those citations.
// =============================================================================

export interface ResearchCitation {
  id: string;
  claim: string;
  source: string;
  year: number;
  detail: string;
  confidence: 'peer-reviewed' | 'meta-analysis' | 'practitioner' | 'industry-data';
  topics: string[];
  clientFacingVersion: string;
}

export const GA_RESEARCH_BASE: ResearchCitation[] = [
  // -----------------------------------------------------------------------
  // TIME AND FOCUS
  // -----------------------------------------------------------------------
  {
    id: 'mark-interruptions',
    claim:
      'It takes an average of 23 minutes to recover full focus after an interruption',
    source: 'Gloria Mark, University of California Irvine',
    year: 2008,
    detail:
      'CHI 2008 study. Workers experience interruptions every ~3 minutes on average. Interrupted workers complete tasks faster but at higher stress and effort.',
    confidence: 'peer-reviewed',
    topics: ['time_blocking', 'interruptions', 'deep_work'],
    clientFacingVersion:
      'Research from UC Irvine shows it takes about 23 minutes to get back to full focus after someone interrupts you. If that happens 5 times a day, you are losing nearly 2 hours just getting back to where you were.',
  },
  {
    id: 'leroy-attention-residue',
    claim:
      'Switching tasks leaves cognitive residue that degrades performance on the next task',
    source:
      'Sophie Leroy, University of Washington, Organizational Behavior and Human Decision Processes',
    year: 2009,
    detail:
      'Introduced the construct of attention residue. Effect worse under time pressure and when prior task is unfinished. A ready-to-resume plan reduces residue.',
    confidence: 'peer-reviewed',
    topics: ['time_blocking', 'context_switching', 'deep_work'],
    clientFacingVersion:
      'When you switch from one task to another, part of your brain stays on the old task. University of Washington research calls this attention residue. The practical fix: before you switch, write a 2-line note on where you left off and what to do next.',
  },
  {
    id: 'pencavel-diminishing-returns',
    claim:
      'Productivity drops sharply above 50 hours per week and total output plateaus at approximately 55 hours',
    source: 'John Pencavel, Stanford University / IZA Discussion Paper 8129',
    year: 2014,
    detail:
      'Using British munitions data and US plywood mill data. Working 70 hours produces roughly same output as 55. Won 2018 Richard A. Lester Award.',
    confidence: 'peer-reviewed',
    topics: ['working_hours', 'productivity', 'burnout'],
    clientFacingVersion:
      'Stanford research shows that working 70 hours a week produces roughly the same output as working 55. Above 50 hours, every additional hour delivers less and less. The business does not get more from you by having more of you.',
  },
  {
    id: 'who-ilo-long-hours',
    claim:
      'Working 55+ hours per week is associated with 35% higher risk of stroke and 17% higher risk of dying from heart disease',
    source: 'WHO / ILO Joint Estimates, Pega et al., Environment International',
    year: 2021,
    detail:
      'Long working hours killed estimated 745,000 people in 2016 globally. The single largest occupational disease burden.',
    confidence: 'peer-reviewed',
    topics: ['working_hours', 'health', 'burnout'],
    clientFacingVersion:
      'The WHO and ILO published joint estimates in 2021: working more than 55 hours a week is associated with a 35% higher risk of stroke. This is not a lifestyle choice. It is a health risk.',
  },

  // -----------------------------------------------------------------------
  // HABITS AND GOALS
  // -----------------------------------------------------------------------
  {
    id: 'lally-habit-formation',
    claim:
      'New habits take an average of 66 days to become automatic, with a range of 18 to 254 days',
    source:
      'Phillippa Lally et al., University College London, European Journal of Social Psychology',
    year: 2010,
    detail:
      '96 participants tracked for 84 days. Missing one day did not derail formation; persistent inconsistency did.',
    confidence: 'peer-reviewed',
    topics: ['habit_formation', 'sprint_design', 'behaviour_change'],
    clientFacingVersion:
      'UCL research found that new habits take an average of 66 days to stick. Missing one day does not reset the clock. Persistent inconsistency does. Your 12-week sprint (84 days) slightly exceeds this threshold by design.',
  },
  {
    id: 'locke-latham-goals',
    claim:
      'Specific, difficult goals consistently outperform vague or easy goals, with effect sizes of 0.42 to 0.80',
    source: 'Locke & Latham, American Psychologist',
    year: 2002,
    detail:
      '35-year retrospective summarising hundreds of studies. The single most replicated motivational theory in I/O psychology.',
    confidence: 'meta-analysis',
    topics: ['goal_setting', 'sprint_design', 'accountability'],
    clientFacingVersion:
      'Goal-setting research spanning 35 years and hundreds of studies shows one consistent finding: specific, measurable goals outperform vague ones by a significant margin. "Reduce working hours to 35 per week" works. "Work less" does not.',
  },
  {
    id: 'matthews-accountability',
    claim:
      'Written goals with weekly accountability reports to a friend improved achievement by 33-42 percentage points',
    source: 'Gail Matthews, Dominican University',
    year: 2015,
    detail:
      'Participants who wrote goals, formulated action commitments and sent weekly progress reports outperformed those who merely thought about goals.',
    confidence: 'peer-reviewed',
    topics: ['accountability', 'goal_setting', 'coaching'],
    clientFacingVersion:
      'A Dominican University study found that people who write their goals down and report progress weekly to someone else are 33-42% more likely to achieve them than people who just think about their goals.',
  },

  // -----------------------------------------------------------------------
  // DELEGATION AND VALUATION
  // -----------------------------------------------------------------------
  {
    id: 'key-man-discount',
    claim:
      'Owner-dependent businesses sell at a 30-50% discount compared to owner-independent comparables',
    source: 'Industry M&A data (Calder Capital, ICAEW, Value Builder/Warrillow)',
    year: 2023,
    detail:
      'Frequently expressed as 3-4x EBITDA vs 5-8x. Practitioner consensus, not peer-reviewed. Use directionally.',
    confidence: 'industry-data',
    topics: ['delegation', 'valuation', 'exit_readiness'],
    clientFacingVersion:
      'Industry data from business sales consistently shows that companies where the owner is essential to daily operations sell for 30-50% less than comparable businesses where the owner is not. That discount is the financial cost of not delegating.',
  },

  // -----------------------------------------------------------------------
  // RECOVERY AND DETACHMENT
  // -----------------------------------------------------------------------
  {
    id: 'sonnentag-recovery',
    claim:
      'Psychological detachment from work predicts next-day wellbeing and performance',
    source:
      'Sabine Sonnentag & Charlotte Fritz, Journal of Occupational Health Psychology',
    year: 2007,
    detail:
      'Recovery Experience Questionnaire: detachment, relaxation, mastery, control. On days you most need recovery, you are least likely to detach (recovery paradox).',
    confidence: 'peer-reviewed',
    topics: ['recovery', 'detachment', 'wellbeing', 'time_blocking'],
    clientFacingVersion:
      'Research on recovery from work stress shows that the ability to psychologically switch off in the evening directly predicts how well you perform the next day. Evenings and weekends are not indulgences. They are performance interventions.',
  },

  // -----------------------------------------------------------------------
  // COACHING
  // -----------------------------------------------------------------------
  {
    id: 'coaching-meta-analysis',
    claim:
      'Coaching produces moderate-to-large effects on performance, wellbeing, and goal attainment',
    source:
      'De Haan & Nilsson, Academy of Management Learning & Education (RCT-only meta-analysis)',
    year: 2023,
    detail:
      '37 RCTs, 2,528 participants. Pooled effect g = 0.59. Coach-coachee co-regulation is the active ingredient.',
    confidence: 'meta-analysis',
    topics: ['coaching', 'accountability', 'programme_design'],
    clientFacingVersion:
      'A 2023 meta-analysis of 37 randomised controlled trials found that structured coaching produces measurable improvements in performance and goal attainment. The key ingredient is the relationship between coach and client, not the specific methodology.',
  },

  // -----------------------------------------------------------------------
  // FAMILY BUSINESS
  // -----------------------------------------------------------------------
  {
    id: 'family-succession-stats',
    claim:
      'Approximately 30% of family businesses survive to the second generation, 12-15% to the third',
    source: 'SBA, KPMG, FBN (widely cited industry statistics)',
    year: 2023,
    detail:
      'Original source contested. Numbers may underestimate survival when adjusted for non-family company longevity. Use directionally.',
    confidence: 'industry-data',
    topics: ['family_business', 'succession', 'exit_readiness'],
    clientFacingVersion:
      'Industry statistics suggest roughly 30% of family businesses survive the transition to the second generation. Planned transitions succeed far more often than unplanned ones.',
  },

  // -----------------------------------------------------------------------
  // UK SPECIFIC
  // -----------------------------------------------------------------------
  {
    id: 'uk-sme-mental-health',
    claim:
      'Approximately 50% of UK SME owners report poor mental health in the past 12 months',
    source: 'Simply Business / Mental Health UK (2022-2024 surveys)',
    year: 2024,
    detail:
      '124% uplift on national average. 41% cite financial worries. 33% report burnout. 15% cite lack of time off. Industry survey, not peer-reviewed.',
    confidence: 'industry-data',
    topics: ['mental_health', 'burnout', 'wellbeing', 'uk_context'],
    clientFacingVersion:
      'UK surveys consistently show that around half of SME owners have experienced poor mental health in the past year. The most common driver is financial worry, followed by lack of time off. You are not unusual if you feel this way. You are in the majority.',
  },

  // -----------------------------------------------------------------------
  // INCOME AND WELLBEING
  // -----------------------------------------------------------------------
  {
    id: 'kahneman-killingsworth-income',
    claim:
      'Average happiness rises with income, but for the unhappiest 20%, wellbeing flattens around $100,000',
    source:
      'Killingsworth, Kahneman & Mellers, PNAS (adversarial collaboration)',
    year: 2023,
    detail:
      'Resolved Kahneman-Killingsworth debate. More income helps the already-content modestly. Cannot fix underlying unhappiness.',
    confidence: 'peer-reviewed',
    topics: ['enough_number', 'income', 'wellbeing'],
    clientFacingVersion:
      'Research published in PNAS in 2023 resolved a long-standing debate about income and happiness. The finding: more money continues to add small improvements in wellbeing for people who are already reasonably content. But for the least happy 20%, more income beyond a comfortable threshold makes almost no difference. Scaling the business will not fix how you feel about it.',
  },

  // -----------------------------------------------------------------------
  // PSYCHOLOGICAL SAFETY
  // -----------------------------------------------------------------------
  {
    id: 'edmondson-psych-safety',
    claim:
      'Psychological safety is the strongest predictor of team learning behaviour and performance',
    source: 'Amy Edmondson, Administrative Science Quarterly',
    year: 1999,
    detail:
      'Study of 51 manufacturing teams. Replicated by Google Project Aristotle as #1 predictor of team effectiveness. Safety enables feedback-seeking, experimenting, error discussion.',
    confidence: 'peer-reviewed',
    topics: ['delegation', 'team_building', 'failure_tolerance'],
    clientFacingVersion:
      'Harvard research (later confirmed by Google across hundreds of their own teams) found that the single strongest predictor of team performance is psychological safety. When people feel safe to make mistakes and raise problems, the team performs better. When they fear blame, they hide problems until they become crises.',
  },
];

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------

/** Citations whose topic tags include the given topic. */
export function getCitationsByTopic(topic: string): ResearchCitation[] {
  return GA_RESEARCH_BASE.filter((c) => c.topics.includes(topic));
}

/** A single client-facing citation for a topic, picked at random. Null when none. */
export function getClientCitation(topic: string): string | null {
  const citations = getCitationsByTopic(topic);
  if (citations.length === 0) return null;
  const citation = citations[Math.floor(Math.random() * citations.length)];
  return citation.clientFacingVersion;
}

/**
 * Build a research-context block to append to an LLM user prompt. Returns "" if
 * no citations match. The block is intentionally short and instructs the model
 * to drop in 1-2 references where they help, not to over-cite.
 */
export function buildResearchContext(topics: string[]): string {
  const seen = new Set<string>();
  const relevant: ResearchCitation[] = [];
  for (const c of GA_RESEARCH_BASE) {
    if (seen.has(c.id)) continue;
    if (c.topics.some((t) => topics.includes(t))) {
      relevant.push(c);
      seen.add(c.id);
    }
  }
  if (relevant.length === 0) return '';

  const lines = relevant
    .map((c) => `- ${c.claim} (${c.source}, ${c.year})`)
    .join('\n');

  return `\n\nRELEVANT RESEARCH (use 1-2 of these naturally where they support a point. Do not over-cite. Do not list them. Weave them in.):
${lines}`;
}
