// ============================================================================
// EDGE FUNCTION: generate-roadmap (COMPREHENSIVE VERSION)
// ============================================================================
// Full Oracle Method implementation with:
// - Sophisticated emotional anchor extraction
// - Industry-specific context and benchmarks
// - ROI calculations by business stage
// - Detailed prompts matching archive quality
// - Fallback generation if LLM fails
// - Week 0 preparation phase
// - Tuesday transformation tracking
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface EmotionalAnchors {
  painPhrases: string[];
  desirePhrases: string[];
  metaphors: string[];
  timePatterns: string[];
  transformationSignals: string[];
  specificQuotes: Record<string, string>;
}

interface RoadmapContext {
  userName: string;
  companyName: string;
  industry: string;
  tuesdayTest: string;
  emergencyLog: string;
  relationshipMirror: string;
  moneyWorry: string;
  sacrifices: string[];
  commitmentHours: string;
  currentIncome: number;
  desiredIncome: number;
  dangerZone: string;
  mondayFrustration: string;
  familyFeedback: string;
  twoWeekBreakImpact: string;
  magicAwayTask: string;
  secretPride: string;
  lastExcitement: string;
  helpFears: string;
  yearsTrading: number;
  tenYearVision: string;
  annualTurnover: string;
  revenueNumeric: number;
  winningBy2030: string;
  teamSize: string;
  growthBottleneck: string;
  ninetyDayPriorities: string[];
  currentWorkingHours: number;
  targetWorkingHours: number;
  toolsUsed: string[];
  isPreRevenue: boolean;
  emotionalAnchors: EmotionalAnchors;
  roiData: any;
  industryContext: string;
}

// ============================================================================
// UK SME BENCHMARKS
// ============================================================================

function getUkSmeBenchmarks(revenue: number, teamSize: string, industry: string) {
  const benchmarks: Record<string, any> = {
    fitness_equipment: {
      avgMargin: 0.35, avgRevenuePerEmployee: 150000, growthRate: 0.12,
      commonChallenges: ['seasonal demand', 'inventory management', 'online competition'],
      quickWins: ['SEO optimization', 'email marketing automation', 'supplier negotiation']
    },
    consulting: {
      avgMargin: 0.55, avgRevenuePerEmployee: 180000, growthRate: 0.15,
      commonChallenges: ['founder dependency', 'scaling delivery', 'pricing confidence'],
      quickWins: ['productized services', 'retainer conversion', 'referral system']
    },
    technology: {
      avgMargin: 0.65, avgRevenuePerEmployee: 200000, growthRate: 0.25,
      commonChallenges: ['technical debt', 'talent acquisition', 'feature creep'],
      quickWins: ['pricing tier optimization', 'onboarding automation', 'churn reduction']
    },
    agency: {
      avgMargin: 0.45, avgRevenuePerEmployee: 120000, growthRate: 0.10,
      commonChallenges: ['scope creep', 'cash flow timing', 'client concentration'],
      quickWins: ['project templates', 'deposit collection', 'retainer model']
    },
    trades: {
      avgMargin: 0.30, avgRevenuePerEmployee: 100000, growthRate: 0.08,
      commonChallenges: ['weather dependency', 'skilled labour', 'cash flow'],
      quickWins: ['quote automation', 'job costing', 'maintenance contracts']
    },
    general_business: {
      avgMargin: 0.40, avgRevenuePerEmployee: 130000, growthRate: 0.10,
      commonChallenges: ['cash flow management', 'time management', 'delegation'],
      quickWins: ['process documentation', 'pricing review', 'payment terms']
    }
  };

  const base = benchmarks[industry] || benchmarks.general_business;
  
  // Adjust for revenue tier
  let tier = 'startup';
  if (revenue > 1000000) tier = 'scale';
  else if (revenue > 250000) tier = 'growth';
  else if (revenue > 50000) tier = 'early';

  return { ...base, tier, revenue, teamSize };
}

function getIndustryHourlyRates(industry: string, yearsExperience: number): number {
  const baseRates: Record<string, number> = {
    fitness_equipment: 45, consulting: 150, technology: 125,
    agency: 85, trades: 55, general_business: 75
  };
  const base = baseRates[industry] || 75;
  const experienceMultiplier = 1 + (Math.min(yearsExperience, 10) * 0.05);
  return Math.round(base * experienceMultiplier);
}

// ============================================================================
// ROI CALCULATIONS BY STAGE
// ============================================================================

function calculateRoiImpact(context: RoadmapContext): any {
  const { revenueNumeric, isPreRevenue, industry, currentWorkingHours, targetWorkingHours } = context;
  
  if (isPreRevenue) return calculatePreRevenueRoi(context);
  if (revenueNumeric < 100000) return calculateEarlyStageRoi(context);
  return calculateRevenueBasedRoi(context);
}

function calculatePreRevenueRoi(context: RoadmapContext): any {
  const { desiredIncome, industry, commitmentHours } = context;
  const hourlyRate = getIndustryHourlyRates(industry, 0);
  const monthsToFirstRevenue = commitmentHours.includes('20+') ? 2 : commitmentHours.includes('15') ? 3 : 4;
  
  return {
    stage: 'pre_revenue',
    timeToRevenue: `${monthsToFirstRevenue} months`,
    yearOneProjection: {
      revenue: desiredIncome * 12 * 0.5,
      profit: desiredIncome * 12 * 0.3,
      hourlyValue: hourlyRate
    },
    keyMetrics: [
      { metric: 'Days to First £1k', target: 30, benchmark: 45 },
      { metric: 'First 10 Customers', target: 60, benchmark: 90 },
      { metric: 'Monthly Recurring Revenue', target: desiredIncome * 0.3, benchmark: desiredIncome * 0.2 }
    ],
    focusAreas: ['Validation', 'First Revenue', 'Positioning'],
    warnings: context.dangerZone ? [`Watch for: ${context.dangerZone}`] : []
  };
}

function calculateEarlyStageRoi(context: RoadmapContext): any {
  const { revenueNumeric, desiredIncome, currentWorkingHours, targetWorkingHours, industry } = context;
  const benchmarks = getUkSmeBenchmarks(revenueNumeric, context.teamSize, industry);
  
  const efficiencyGain = (currentWorkingHours - targetWorkingHours) / currentWorkingHours;
  const revenueGrowthPotential = revenueNumeric * 0.5; // 50% growth potential
  const hoursSaved = currentWorkingHours - targetWorkingHours;
  const hourlyRate = getIndustryHourlyRates(industry, context.yearsTrading);
  const timeValue = hoursSaved * 52 * hourlyRate;

  return {
    stage: 'early_revenue',
    currentRevenue: revenueNumeric,
    projections: {
      year1Revenue: Math.round(revenueNumeric * 1.3),
      year1Profit: Math.round(revenueNumeric * 1.3 * benchmarks.avgMargin),
      year3Revenue: Math.round(revenueNumeric * 2.5),
      efficiencyGain: `${Math.round(efficiencyGain * 100)}%`
    },
    timeValue: {
      hoursSavedPerWeek: hoursSaved,
      annualValue: timeValue,
      hourlyRate
    },
    keyMetrics: [
      { metric: 'Revenue Growth', current: revenueNumeric, target: revenueNumeric * 1.5 },
      { metric: 'Working Hours', current: currentWorkingHours, target: targetWorkingHours },
      { metric: 'Profit Margin', current: benchmarks.avgMargin * 0.8, target: benchmarks.avgMargin }
    ],
    focusAreas: benchmarks.quickWins.slice(0, 3)
  };
}

function calculateRevenueBasedRoi(context: RoadmapContext): any {
  const { revenueNumeric, currentWorkingHours, targetWorkingHours, industry, teamSize } = context;
  const benchmarks = getUkSmeBenchmarks(revenueNumeric, teamSize, industry);
  
  const hoursSaved = currentWorkingHours - targetWorkingHours;
  const hourlyRate = getIndustryHourlyRates(industry, context.yearsTrading);
  const efficiencyValue = hoursSaved * 52 * hourlyRate;
  
  const marginImprovement = benchmarks.avgMargin * 0.1;
  const marginValue = revenueNumeric * marginImprovement;
  
  const growthValue = revenueNumeric * benchmarks.growthRate;
  const totalAnnualValue = efficiencyValue + marginValue + growthValue;

  return {
    stage: 'revenue_generating',
    currentRevenue: revenueNumeric,
    projections: {
      year1Revenue: Math.round(revenueNumeric * (1 + benchmarks.growthRate)),
      year3Revenue: Math.round(revenueNumeric * Math.pow(1 + benchmarks.growthRate, 3)),
      year5Revenue: Math.round(revenueNumeric * Math.pow(1 + benchmarks.growthRate, 5))
    },
    valueBreakdown: {
      efficiencyGains: efficiencyValue,
      marginImprovement: marginValue,
      growthAcceleration: growthValue,
      totalAnnualValue
    },
    keyMetrics: [
      { metric: 'Annual Value Created', value: totalAnnualValue },
      { metric: 'Hours Reclaimed/Year', value: hoursSaved * 52 },
      { metric: 'Margin Improvement', value: `${Math.round(marginImprovement * 100)}%` }
    ],
    industryBenchmarks: benchmarks
  };
}

// ============================================================================
// INDUSTRY CONTEXT BUILDER
// ============================================================================

function buildIndustryContext(industry: string, revenue: number, teamSize: string): string {
  const contexts: Record<string, string> = {
    fitness_equipment: `
INDUSTRY: Fitness Equipment (UK Market)
- Market growing 8% annually, driven by home fitness trend
- Key success factors: Quality imagery, detailed specs, delivery speed
- Margin expectations: 30-40% on equipment, 50%+ on accessories
- Seasonal peaks: January (NY resolutions), September (back to routine)
- Common tools: Shopify/WooCommerce, inventory management, CRM
- Quick wins: SEO for product pages, email sequences, Google Shopping`,

    consulting: `
INDUSTRY: Consulting/Advisory (UK Market)  
- Day rates £500-2000 depending on specialization
- Key success factors: Thought leadership, referral network, case studies
- Typical model: Projects → Retainers → Productized services
- Growth path: Solo → Associates → Agency
- Common tools: Calendly, Notion/Confluence, Zoom, proposal software
- Quick wins: Retainer conversion, referral program, content marketing`,

    technology: `
INDUSTRY: Technology/SaaS (UK Market)
- UK SaaS market £10bn+, growing 20%+ annually
- Key metrics: MRR, churn rate, CAC, LTV
- Pricing: £50-500/month typical for SMB tools
- Growth levers: Product-led growth, content marketing, partnerships
- Common tools: Stripe, Intercom, analytics stack, CI/CD
- Quick wins: Onboarding optimization, pricing tier review, churn analysis`,

    agency: `
INDUSTRY: Agency/Creative Services (UK Market)
- Average project value £5k-50k depending on service
- Key success factors: Portfolio, case studies, process efficiency
- Typical margins: 40-60% on retainers, 20-40% on projects
- Growth path: Generalist → Specialist → Productized
- Common tools: Project management, time tracking, design tools
- Quick wins: Project templates, deposit collection, retainer focus`,

    trades: `
INDUSTRY: Trades/Construction (UK Market)
- Chronic skills shortage = strong demand
- Key success factors: Reliability, quality, communication
- Typical margins: 20-35% after materials
- Growth path: Solo → Small team → Multiple crews
- Common tools: Estimating software, job management, accounting
- Quick wins: Quote templates, maintenance contracts, Google reviews`,

    general_business: `
INDUSTRY: General Business (UK SME)
- 5.5 million SMEs in UK, 99% of businesses
- Key success factors: Cash flow management, customer retention, efficiency
- Typical challenges: Time management, delegation, pricing
- Growth path: Survival → Stability → Growth → Scale
- Common tools: Accounting, CRM, project management
- Quick wins: Process documentation, pricing review, automation`
  };

  return contexts[industry] || contexts.general_business;
}

// ============================================================================
// EMOTIONAL ANCHOR EXTRACTION (COMPREHENSIVE)
// ============================================================================

function extractEmotionalAnchors(part1: Record<string, any>, part2: Record<string, any>): EmotionalAnchors {
  const anchors: EmotionalAnchors = {
    painPhrases: [],
    desirePhrases: [],
    metaphors: [],
    timePatterns: [],
    transformationSignals: [],
    specificQuotes: {}
  };

  const allResponses = { ...part1, ...part2 };

  // Tuesday Test - deep extraction with context windows
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  if (tuesdayTest) {
    anchors.specificQuotes.tuesdayTest = tuesdayTest;
    
    // Time patterns with context
    const timeMatches = tuesdayTest.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\b\d+-\d+\b|\bearly\b|\blate\b|\bmorning\b|\bevening\b|\bafternoon\b|\bnight\b/gi);
    if (timeMatches) anchors.timePatterns = [...new Set(timeMatches.map(t => t.toLowerCase()))];

    // Pain phrases with surrounding context (capture 5 words before/after)
    const painWords = ['not', "don't", "won't", 'stop', 'no more', 'without', 'never', 'tired of', 'sick of', 
                      'hate', 'dread', 'avoid', 'escape', 'cant', "can't", 'unable', 'struggle'];
    painWords.forEach(word => {
      const regex = new RegExp(`(?:\\S+\\s+){0,5}\\b${word}\\b(?:\\s+\\S+){0,5}`, 'gi');
      const matches = tuesdayTest.match(regex);
      if (matches) anchors.painPhrases.push(...matches.map(m => m.trim()));
    });

    // Desire phrases with context
    const desireWords = ['want', 'wish', 'dream', 'love to', 'finally', 'freedom', 'choose', 'able to',
                        'hope', 'imagine', 'picture', 'see myself', 'would be', 'could be'];
    desireWords.forEach(word => {
      const regex = new RegExp(`(?:\\S+\\s+){0,3}\\b${word}\\b(?:\\s+\\S+){0,7}`, 'gi');
      const matches = tuesdayTest.match(regex);
      if (matches) anchors.desirePhrases.push(...matches.map(m => m.trim()));
    });
  }

  // Relationship Mirror - metaphor extraction
  const relationshipMirror = part1.relationship_mirror || '';
  if (relationshipMirror) {
    anchors.specificQuotes.relationshipMirror = relationshipMirror;
    
    // "feels like" patterns
    if (relationshipMirror.toLowerCase().includes('feels like')) {
      const metaphor = relationshipMirror.toLowerCase().split('feels like').pop()?.split(/[.!?,]/)[0]?.trim();
      if (metaphor && metaphor.length > 3) anchors.metaphors.push(metaphor);
    }
    // "like a" patterns
    const likeAMatches = relationshipMirror.match(/like (?:a|an|the) ([^.!?,]+)/gi);
    if (likeAMatches) anchors.metaphors.push(...likeAMatches.map(m => m.trim()));
    // "is/was" metaphors
    const isMatches = relationshipMirror.match(/(?:is|was|feels?) (?:a|an|like) ([^.!?,]+)/gi);
    if (isMatches) anchors.metaphors.push(...isMatches.map(m => m.trim()));
  }

  // Emotion-rich fields - extract and categorize
  const emotionFields = {
    emergency_log: 'stress',
    money_worry: 'financial',
    monday_frustration: 'work',
    family_feedback: 'relationship',
    two_week_break_impact: 'dependency',
    magic_away_task: 'pain',
    secret_pride: 'strength',
    last_excitement: 'passion',
    danger_zone: 'risk',
    help_fears: 'vulnerability',
    growth_bottleneck: 'blocker'
  };

  Object.entries(emotionFields).forEach(([field, category]) => {
    const content = allResponses[field];
    if (content && typeof content === 'string' && content.length > 10) {
      anchors.specificQuotes[field] = content;
      
      // Pain indicators
      const painMatches = content.match(/\b(stress|overwhelm|chaos|struggle|worry|fear|exhaust|frustrat|anxious|trapped|drown|spinning|emergency|constant|always|never|can't|impossible|stuck|lost|confused|desperate)\w*\b/gi);
      if (painMatches) anchors.painPhrases.push(...painMatches);

      // Aspiration indicators  
      const desireMatches = content.match(/\b(freedom|peace|calm|control|balance|growth|success|finally|time|family|enjoy|love|happy|confident|clear|focused|strong|proud)\w*\b/gi);
      if (desireMatches) anchors.desirePhrases.push(...desireMatches);

      // Transformation signals
      const transformMatches = content.match(/\b(change|transform|different|better|improve|grow|build|create|start|stop|more|less|new|begin|shift)\w*\b/gi);
      if (transformMatches) anchors.transformationSignals.push(...transformMatches);
    }
  });

  // Find repeated themes across all responses
  const allText = Object.values(allResponses).filter(v => typeof v === 'string').join(' ').toLowerCase();
  const themeWords = ['time', 'money', 'family', 'freedom', 'stress', 'work', 'team', 'growth', 'control', 'help', 'trust', 'quality'];
  themeWords.forEach(word => {
    const count = (allText.match(new RegExp(`\\b${word}\\w*\\b`, 'g')) || []).length;
    if (count >= 3) anchors.transformationSignals.push(`${word} (mentioned ${count}x)`);
  });

  // Deduplicate and limit
  anchors.painPhrases = [...new Set(anchors.painPhrases.filter(Boolean))].slice(0, 15);
  anchors.desirePhrases = [...new Set(anchors.desirePhrases.filter(Boolean))].slice(0, 15);
  anchors.metaphors = [...new Set(anchors.metaphors.filter(Boolean))].slice(0, 5);
  anchors.timePatterns = [...new Set(anchors.timePatterns.filter(Boolean))].slice(0, 10);
  anchors.transformationSignals = [...new Set(anchors.transformationSignals.filter(Boolean))].slice(0, 10);

  return anchors;
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildContext(part1: Record<string, any>, part2: Record<string, any>): RoadmapContext {
  const emotionalAnchors = extractEmotionalAnchors(part1, part2);
  
  // Parse revenue
  const turnoverStr = part2.annual_turnover || '';
  let revenueNumeric = 0;
  if (turnoverStr.includes('Under £100k')) revenueNumeric = 50000;
  else if (turnoverStr.includes('£100k-£250k')) revenueNumeric = 175000;
  else if (turnoverStr.includes('£250k-£500k')) revenueNumeric = 375000;
  else if (turnoverStr.includes('£500k-£1m')) revenueNumeric = 750000;
  else if (turnoverStr.includes('£1m-£2.5m')) revenueNumeric = 1750000;
  else if (turnoverStr.includes('£2.5m')) revenueNumeric = 3500000;

  // Parse years trading
  const yearsStr = part2.years_trading || '0';
  let yearsTrading = 0;
  if (yearsStr.includes('Less than 1')) yearsTrading = 0.5;
  else if (yearsStr.includes('1-2')) yearsTrading = 1.5;
  else if (yearsStr.includes('3-5')) yearsTrading = 4;
  else if (yearsStr.includes('5+') || yearsStr.includes('5-10')) yearsTrading = 7;
  else if (yearsStr.includes('10+')) yearsTrading = 12;
  else yearsTrading = parseFloat(yearsStr) || 0;

  // Parse income
  const parseIncome = (str: string): number => {
    if (!str) return 0;
    const cleaned = str.replace(/[£,\s]/g, '');
    return parseInt(cleaned) || 0;
  };

  // Detect industry
  const allText = JSON.stringify({ ...part1, ...part2 }).toLowerCase();
  let industry = 'general_business';
  if (allText.includes('rowing') || allText.includes('fitness') || allText.includes('gym') || allText.includes('equipment')) industry = 'fitness_equipment';
  else if (allText.includes('consult') || allText.includes('advisor') || allText.includes('coach')) industry = 'consulting';
  else if (allText.includes('software') || allText.includes('saas') || allText.includes('tech') || allText.includes('app')) industry = 'technology';
  else if (allText.includes('agency') || allText.includes('marketing') || allText.includes('creative') || allText.includes('design')) industry = 'agency';
  else if (allText.includes('trade') || allText.includes('construction') || allText.includes('plumb') || allText.includes('electric')) industry = 'trades';

  const context: RoadmapContext = {
    userName: part1.full_name || 'Founder',
    companyName: part1.company_name || part2.trading_name || 'Your Business',
    industry,
    tuesdayTest: part1.tuesday_test || part1.ninety_day_fantasy || '',
    emergencyLog: part1.emergency_log || '',
    relationshipMirror: part1.relationship_mirror || '',
    moneyWorry: part1.money_worry || '',
    sacrifices: part1.sacrifices || [],
    commitmentHours: part1.commitment_hours || '10-15 hours',
    currentIncome: parseIncome(part1.current_income),
    desiredIncome: parseIncome(part1.desired_income) || 10000,
    dangerZone: part1.danger_zone || '',
    mondayFrustration: part1.monday_frustration || '',
    familyFeedback: part1.family_feedback || '',
    twoWeekBreakImpact: part1.two_week_break_impact || '',
    magicAwayTask: part1.magic_away_task || '',
    secretPride: part1.secret_pride || '',
    lastExcitement: part1.last_excitement || '',
    helpFears: part1.help_fears || '',
    yearsTrading,
    tenYearVision: part2.ten_year_vision || '',
    annualTurnover: part2.annual_turnover || '',
    revenueNumeric,
    winningBy2030: part2.winning_2030 || '',
    teamSize: part2.team_size || 'solo',
    growthBottleneck: part2.growth_bottleneck || '',
    ninetyDayPriorities: part2.ninety_day_priorities || [],
    currentWorkingHours: parseInt(part2.current_working_hours) || 50,
    targetWorkingHours: parseInt(part2.target_working_hours) || 35,
    toolsUsed: part2.current_tools || [],
    isPreRevenue: revenueNumeric === 0,
    emotionalAnchors,
    roiData: null,
    industryContext: ''
  };

  // Add calculated data
  context.roiData = calculateRoiImpact(context);
  context.industryContext = buildIndustryContext(industry, revenueNumeric, context.teamSize);

  return context;
}

// ============================================================================
// PROMPTS (COMPREHENSIVE)
// ============================================================================

function buildVisionPrompt(ctx: RoadmapContext): string {
  return `You are an emotionally intelligent advisor who creates deeply personal transformation narratives. You excel at recognising that true success isn't just financial growth - it's about creating a business that enhances life rather than consuming it. You understand that working fewer hours with slightly less income often creates far more happiness than grinding endless hours for marginally more money.

FOUNDER'S COMPLETE JOURNEY (their exact words - USE THESE THROUGHOUT):

=== IDENTITY ===
Name: ${ctx.userName}
Company: ${ctx.companyName}
Industry: ${ctx.industry}
Years Trading: ${ctx.yearsTrading}

=== PART 1: LIFE DESIGN (The Emotional Truth) ===
Tuesday Test/90-Day Fantasy: "${ctx.tuesdayTest}"
Business Relationship (their metaphor): "${ctx.relationshipMirror}"
Money Worry: "${ctx.moneyWorry}"
What They've Sacrificed: ${JSON.stringify(ctx.sacrifices)}
Emergency Log (their chaos): "${ctx.emergencyLog}"
Danger Zone: "${ctx.dangerZone}"
Monday Frustration: "${ctx.mondayFrustration}"
Family Feedback (the mirror they can't ignore): "${ctx.familyFeedback}"
Two Week Break Impact: "${ctx.twoWeekBreakImpact}"
What They'd Magic Away: "${ctx.magicAwayTask}"
Secret Pride: "${ctx.secretPride}"
Last Excitement: "${ctx.lastExcitement}"
Help Fears: "${ctx.helpFears}"

=== PART 2: BUSINESS REALITY ===
Current Personal Income: £${ctx.currentIncome}/month
Desired Personal Income: £${ctx.desiredIncome}/month
Business Turnover: ${ctx.annualTurnover} (£${ctx.revenueNumeric})
Current Working Hours: ${ctx.currentWorkingHours} hours/week
Target Working Hours: ${ctx.targetWorkingHours} hours/week
Team Size: ${ctx.teamSize}
10-Year Vision: "${ctx.tenYearVision}"
Winning by 2030: "${ctx.winningBy2030}"
Biggest Challenge: "${ctx.growthBottleneck}"
Time Commitment Available: ${ctx.commitmentHours}
90-Day Priorities: ${JSON.stringify(ctx.ninetyDayPriorities)}
Current Tools: ${JSON.stringify(ctx.toolsUsed)}

=== EMOTIONAL PATTERNS DETECTED (USE THESE EXACT WORDS NATURALLY) ===
Pain phrases (their actual words): ${JSON.stringify(ctx.emotionalAnchors.painPhrases)}
Desire phrases (their actual words): ${JSON.stringify(ctx.emotionalAnchors.desirePhrases)}
Metaphors they use: ${JSON.stringify(ctx.emotionalAnchors.metaphors)}
Time references: ${JSON.stringify(ctx.emotionalAnchors.timePatterns)}
Transformation signals: ${JSON.stringify(ctx.emotionalAnchors.transformationSignals)}

=== ROI ANALYSIS ===
${JSON.stringify(ctx.roiData, null, 2)}

=== INDUSTRY CONTEXT ===
${ctx.industryContext}

THE CORE INSIGHT TO REMEMBER:
This founder isn't just seeking more money or growth. They're seeking a specific quality of life. Look at the gap between their current (${ctx.currentWorkingHours} hours) and target (${ctx.targetWorkingHours} hours) working hours as much as the revenue gap. Notice what they say when asked about a two-week break - that reveals their true relationship with their business. Their family feedback tells you the real cost of their current approach. Their "magic away task" is their biggest pain point.

CRITICAL INSTRUCTIONS:
1. Write in SECOND PERSON - speak directly to them ("You" not "They")
2. Identify the LIFE they want, not just the business they want
3. Notice if they're sacrificing happiness for marginal gains  
4. Use their EXACT emotional phrases naturally throughout - weave their actual quotes into the narrative
5. Mirror their communication style and energy
6. Show them a path where success means LESS stress, not more
7. Make them feel truly understood - "How did you know that about me?"
8. Focus on sustainable growth that enhances life, not endless scaling
9. Reference specific details from their responses (their sacrifices, family feedback, danger zone)

Create a comprehensive 5-year vision that shows them how to build a business that serves their life, not the other way around.

Return as JSON with this EXACT structure:

{
  "tagline": "A powerful, personalized tagline for their transformation (e.g., 'Britain's Leading Rowing Machine Specialist - On Your Terms')",
  
  "transformationStory": {
    "currentReality": {
      "title": "Your Current Reality: [use their exact phrase from tuesday_test or relationship_mirror]",
      "narrative": "3-4 paragraphs (400+ words) describing where they are now. Weave in their EXACT quotes naturally - their Tuesday test description, their relationship metaphor ('${ctx.relationshipMirror}'), what they've sacrificed (${JSON.stringify(ctx.sacrifices)}), their family feedback ('${ctx.familyFeedback}'), their emergency log entries ('${ctx.emergencyLog}'). Reference their ${ctx.currentWorkingHours}-hour weeks, the gap to their £${ctx.desiredIncome} goal. Make them feel DEEPLY understood. This should read like you've been watching their life unfold."
    },
    "turningPoint": {
      "title": "Your Turning Point: [the insight that changes everything]",
      "narrative": "2-3 paragraphs (250+ words) about the breakthrough moment. What needs to change in their thinking? Reference their specific fears ('${ctx.helpFears}'), their danger zone ('${ctx.dangerZone}'), and their secret pride ('${ctx.secretPride}'). This is the 'aha' moment. Connect it to their ${ctx.industry} industry context."
    },
    "visionAchieved": {
      "title": "Your Vision Achieved: [use their winning_2030 phrase: '${ctx.winningBy2030}']",
      "narrative": "3-4 paragraphs (400+ words) painting the picture of success IN THEIR TERMS. What does their ideal Tuesday actually look like (reference their tuesday_test: '${ctx.tuesdayTest}')? How does their family see them now (contrast with '${ctx.familyFeedback}')? What can they finally do? Reference their 10-year vision ('${ctx.tenYearVision}'), their desired income (£${ctx.desiredIncome}), their target working hours (${ctx.targetWorkingHours}). Be specific, emotional, and use their words."
    }
  },
  
  "yearMilestones": {
    "year1": {
      "headline": "From [their current pain] to [first relief] - use their exact phrases",
      "story": "Full paragraph (150+ words) showing what specifically changes. What's different about their mornings? Their weekends? Their stress levels? Their family time? Reference their current pain points being resolved. Include specific ${ctx.industry} industry wins.",
      "measurable": "Specific metrics: Working hours reduced from ${ctx.currentWorkingHours} to X, income at £Y, their specific pain point (${ctx.magicAwayTask}) resolved by Z%",
      "financialImpact": "£X value created through efficiency + growth"
    },
    "year3": {
      "headline": "The Business That Serves Your [their key desire]",
      "story": "Full paragraph (150+ words) showing their transformation midpoint. The business works differently now. What can they do that was impossible before? Reference their 10-year vision progress. Include ${ctx.industry} specific achievements.",
      "measurable": "Their target working hours (${ctx.targetWorkingHours}) achieved, income goals (£${ctx.desiredIncome}) met, specific life milestones progressing",
      "financialImpact": "Business value increased by £X"
    },
    "year5": {
      "headline": "[Their exact winning_2030 phrase or ten_year_vision]",  
      "story": "Full paragraph (150+ words) showing complete vision achieved. Not generic success - THEIR success. Reference their exact 'winning' description ('${ctx.winningBy2030}'). What's their relationship with the business now? With their family?",
      "measurable": "Their specific vision quantified - income £X, hours Y, lifestyle Z, business value £A",
      "financialImpact": "Total transformation value £X"
    }
  },
  
  "northStar": "One powerful sentence that captures their core desire using their EXACT words from their responses. This becomes the filter for every decision they make. Pull directly from their tuesday_test, winning_2030, or ten_year_vision.",
  
  "archetype": "freedom_seeker|empire_builder|lifestyle_designer|impact_maker|balanced_achiever",
  
  "emotionalCore": "2-3 sentences explaining the deep truth about what they're really seeking - usually connection, control, freedom, or peace. Why does THIS matter to THIS person specifically? Reference their family feedback and sacrifices."
}

Remember: This should be so well-written that they want to print it out and put it on their wall. Every paragraph should make them think "How did you know that about me?" Use their exact words throughout. Be specific to ${ctx.industry} and their £${ctx.revenueNumeric} stage.`;
}

function buildShiftPrompt(ctx: RoadmapContext, vision: any): string {
  return `Based on ${ctx.userName}'s 5-year vision, create a detailed 6-month shift plan that bridges their current reality to their year 1 goals.

FIVE-YEAR VISION CONTEXT:
${JSON.stringify(vision, null, 2)}

CURRENT REALITY:
- Business: ${ctx.companyName} (${ctx.industry})
- Revenue: ${ctx.annualTurnover} (£${ctx.revenueNumeric})
- Pre-revenue: ${ctx.isPreRevenue}
- Years Trading: ${ctx.yearsTrading}
- Team: ${ctx.teamSize}
- Current Hours: ${ctx.currentWorkingHours}/week
- Target Hours: ${ctx.targetWorkingHours}/week
- Time Available for Change: ${ctx.commitmentHours}
- Tools Currently Using: ${JSON.stringify(ctx.toolsUsed)}

THEIR SPECIFIC PAIN POINTS (use their exact words):
- Biggest Challenge: "${ctx.growthBottleneck}"
- Money Worry: "${ctx.moneyWorry}"
- Danger Zone: "${ctx.dangerZone}"
- What They'd Magic Away: "${ctx.magicAwayTask}"
- Emergency Log: "${ctx.emergencyLog}"
- Monday Frustration: "${ctx.mondayFrustration}"
- 90-Day Priorities Selected: ${JSON.stringify(ctx.ninetyDayPriorities)}

EMOTIONAL ANCHORS (weave these in):
Pain phrases: ${JSON.stringify(ctx.emotionalAnchors.painPhrases)}
Desire phrases: ${JSON.stringify(ctx.emotionalAnchors.desirePhrases)}

ROI TARGETS:
${JSON.stringify(ctx.roiData, null, 2)}

INDUSTRY CONTEXT:
${ctx.industryContext}

NORTH STAR: ${vision.northStar}
ARCHETYPE: ${vision.archetype}

Create a 6-month shift plan that:
1. Addresses their immediate pain points using THEIR language
2. Makes tangible progress toward their year 1 vision
3. Respects their time constraints (${ctx.commitmentHours})
4. Focuses on highest-impact activities for ${ctx.industry}
5. Builds momentum through quick wins
6. Uses their emotional anchors naturally throughout

Return as JSON:
{
  "shiftOverview": "3-4 sentences summarizing what this 6 months will achieve. Use their exact words and phrases. Connect to their north star: '${vision.northStar}'. Reference their specific pain ('${ctx.magicAwayTask}') and desire ('${ctx.winningBy2030}').",
  
  "month1_2": {
    "theme": "Short, punchy theme that resonates with their situation",
    "focus": "Clear description of the primary focus area - connect to their biggest pain ('${ctx.growthBottleneck}')",
    "keyActions": [
      "Specific action that addresses their pain ('${ctx.magicAwayTask}')",
      "Specific action building toward their desire",
      "Specific action relevant to ${ctx.industry} at £${ctx.revenueNumeric} stage"
    ],
    "successMetrics": [
      "Measurable outcome 1 with specific number",
      "Measurable outcome 2 with specific number"
    ],
    "timeCommitment": "X hours/week on specific activities (within ${ctx.commitmentHours})",
    "toolsToUse": ["Specific tools from their stack or new recommendations"],
    "howYoullFeel": "Describe the emotional shift using their language"
  },
  
  "month3_4": {
    "theme": "Theme that builds on months 1-2",
    "focus": "Building momentum - what's now possible",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "Hours/week allocation",
    "toolsToUse": ["Tools"],
    "howYoullFeel": "Emotional progress description"
  },
  
  "month5_6": {
    "theme": "Theme approaching year 1 milestone",
    "focus": "Consolidation and preparing for scale",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "Hours/week allocation",
    "toolsToUse": ["Tools"],
    "howYoullFeel": "How they feel approaching year 1 transformation"
  },
  
  "quickWins": [
    "Something they can achieve THIS WEEK that addresses '${ctx.magicAwayTask}'",
    "Something achievable in the first month that builds confidence",
    "Early indicator of progress toward their north star"
  ],
  
  "dangerMitigation": "Specific plan for addressing their danger zone: '${ctx.dangerZone}'",
  
  "northStarAlignment": "How each phase moves them toward: '${vision.northStar}'",
  
  "monthlyCheckIn": {
    "week2": "What to evaluate after 2 weeks",
    "month1": "Month 1 milestone check",
    "month3": "Quarterly review focus",
    "month6": "6-month transformation review"
  }
}`;
}

function buildSprintPrompt(ctx: RoadmapContext, vision: any, shift: any): string {
  return `You are implementing The 365 Method for ${ctx.userName} at ${ctx.companyName} - a ${ctx.industry} business ready for life-first transformation.

THE 365 METHOD FOUNDATION:
- 365 days to transform (not just grow)
- 5-Year Life Compass (not just business goals)
- 6-Month Structural Shifts (HOW they work, not tasks)
- 3-Month Implementation Sprints (specific, measurable progress)
- This is about changing HOW they work, not just WHAT they do
- Every week must move them closer to their ideal Tuesday feeling
- Progress is measured in life quality improvement, not just revenue

THEIR 6-MONTH SHIFTS:
${JSON.stringify(shift, null, 2)}

THEIR 5-YEAR COMPASS:
North Star: ${vision.northStar}
Emotional Core: ${vision.emotionalCore}
Year 1 Target: ${vision.yearMilestones?.year1?.measurable}
Archetype: ${vision.archetype}

BUSINESS SPECIFICS:
- Business: ${ctx.companyName} (${ctx.industry})
- Revenue: ${ctx.annualTurnover} (£${ctx.revenueNumeric})
- Pre-revenue: ${ctx.isPreRevenue}
- Team: ${ctx.teamSize}
- Years Trading: ${ctx.yearsTrading}
- Current Tools: ${JSON.stringify(ctx.toolsUsed)}
- Current working hours: ${ctx.currentWorkingHours} hours/week
- Target working hours: ${ctx.targetWorkingHours} hours/week

EMOTIONAL DRIVERS (USE THESE EXACT WORDS):
- Their biggest pain: "${ctx.growthBottleneck}"
- Their 90-day fantasy: "${ctx.tuesdayTest}"
- Tuesday currently feels: "${ctx.relationshipMirror}"
- Money worry: "${ctx.moneyWorry}"
- Emergency log: "${ctx.emergencyLog}"
- Danger zone: "${ctx.dangerZone}"
- What they'd magic away: "${ctx.magicAwayTask}"
- Monday frustration: "${ctx.mondayFrustration}"
- Family feedback: "${ctx.familyFeedback}"
- Secret pride: "${ctx.secretPride}"

CONSTRAINTS TO HONOR:
- Available time per week: ${ctx.commitmentHours}
- Must work within current team size (${ctx.teamSize}) initially
- 90-day priorities selected: ${JSON.stringify(ctx.ninetyDayPriorities)}

ROI TARGETS:
${JSON.stringify(ctx.roiData, null, 2)}

INDUSTRY CONTEXT FOR ${ctx.industry}:
${ctx.industryContext}

CRITICAL: Create a 12-week transformation following this structure. Each week MUST be specific to THEIR situation using THEIR words.

Return as JSON:
{
  "sprintTheme": "Overarching theme connecting to their 90-day fantasy: '${ctx.tuesdayTest}'",
  
  "sprintPromise": "In 90 days, transform from '${ctx.relationshipMirror}' to '${ctx.tuesdayTest}'",
  
  "sprintGoals": [
    "Primary goal: Solve '${ctx.growthBottleneck}'",
    "Secondary goal: Address '${ctx.moneyWorry}'",
    "Tertiary goal: Progress toward '${vision.northStar}'"
  ],
  
  "phases": {
    "weeks1_2": { "name": "Immediate Relief", "purpose": "Quick wins and pain reduction addressing '${ctx.magicAwayTask}'" },
    "weeks3_4": { "name": "Foundation Building", "purpose": "Address root causes of '${ctx.growthBottleneck}'" },
    "weeks5_6": { "name": "Momentum Multiplication", "purpose": "Scale what works" },
    "weeks7_8": { "name": "Lock-In Phase", "purpose": "Make changes permanent" },
    "weeks9_10": { "name": "Scale Phase", "purpose": "Multiply success" },
    "weeks11_12": { "name": "Transform Phase", "purpose": "Become the new version" }
  },
  
  "week0_preparation": {
    "theme": "Creating Space for Change",
    "tasks": [
      {
        "task": "Clear calendar for transformation time",
        "output": "${ctx.commitmentHours} blocked weekly",
        "tool": "Calendar"
      },
      {
        "task": "Document baseline metrics",
        "output": "Current state captured",
        "tool": "Spreadsheet"
      },
      {
        "task": "Communicate changes to ${ctx.teamSize === 'Just me' ? 'key stakeholders/family' : 'team'}",
        "output": "Everyone aligned",
        "tool": "Email/Meeting"
      }
    ]
  },
  
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Immediate Relief",
      "theme": "[Specific relief for '${ctx.magicAwayTask}']",
      "tuesdayTransformation": "First glimpse of calm instead of '${ctx.relationshipMirror}'",
      "focus": "The ONE thing that provides immediate relief from '${ctx.growthBottleneck}'",
      "unlockRequirement": "Complete Week 0 prep",
      "tasks": [
        {
          "id": "w1_t1",
          "title": "[Quick win addressing '${ctx.magicAwayTask}']",
          "description": "Specific actionable instructions",
          "why": "Immediate proof that change is possible - connects to '${ctx.emotionalAnchors.painPhrases[0] || 'their pain'}'",
          "category": "Operations|Systems|People|Financial|Marketing",
          "priority": "critical",
          "estimatedHours": 1,
          "deliverable": "[Specific output]",
          "tool": "[Tool from ${JSON.stringify(ctx.toolsUsed)} or recommendation]",
          "capture": "What to measure/document",
          "quickWin": true
        },
        {
          "id": "w1_t2",
          "title": "[${ctx.industry}-specific improvement]",
          "description": "Description specific to ${ctx.industry} at £${ctx.revenueNumeric} stage",
          "why": "Industry best practice implementation",
          "category": "Operations",
          "priority": "high",
          "estimatedHours": 2,
          "deliverable": "[System or process improved]",
          "tool": "[Specific platform]",
          "capture": "Before/after comparison",
          "quickWin": false
        },
        {
          "id": "w1_t3",
          "title": "Weekly Reflection & Planning",
          "description": "15-minute review of wins and lessons",
          "why": "Build the habit of strategic thinking",
          "category": "Personal",
          "priority": "medium",
          "estimatedHours": 0.5,
          "deliverable": "Week 1 insights captured",
          "tool": "Notes",
          "capture": "Key learnings",
          "quickWin": false
        }
      ],
      "milestone": "First win achieved - proof that change is possible",
      "celebrationPrompt": "How to recognize this week's progress",
      "warningSign": "If X happens, do Y"
    }
    // Continue for weeks 2-12, each building on previous and specific to their industry/situation
  ],
  
  "successMetrics": {
    "week4": "Foundation solid - '${ctx.magicAwayTask}' 50% reduced",
    "week8": "Momentum locked - Working toward ${ctx.targetWorkingHours} hours/week",
    "week12": "Transformed - Living closer to '${ctx.tuesdayTest}'"
  },
  
  "tuesdayEvolution": {
    "week0": "'${ctx.relationshipMirror}'",
    "week4": "First noticeable shift - [specific improvement]",
    "week8": "New patterns established - [specific change]",
    "week12": "This is just how Tuesdays are now - approaching '${ctx.tuesdayTest}'"
  },
  
  "backslidePreventions": [
    {
      "trigger": "Common trigger related to '${ctx.dangerZone}'",
      "response": "Specific action to take instead"
    },
    {
      "trigger": "Feeling overwhelmed like '${ctx.emergencyLog}'",
      "response": "Return to Week X foundation"
    }
  ],
  
  "supportNeeded": [
    "Type of support 1 based on '${ctx.helpFears}'",
    "Type of support 2"
  ]
}

IMPORTANT: Generate ALL 12 weeks with specific, actionable tasks. Each week should have 3-5 tasks that are realistic given their time constraints (${ctx.commitmentHours}). Make every task specific to their industry (${ctx.industry}), their revenue stage (£${ctx.revenueNumeric}), and their situation. Use their exact words and emotional anchors throughout.`;
}

// ============================================================================
// FALLBACK GENERATORS
// ============================================================================

function generateFallbackVision(ctx: RoadmapContext): any {
  const wantsFreedom = ctx.emotionalAnchors.desirePhrases.some(p => 
    p.toLowerCase().includes('freedom') || p.toLowerCase().includes('choose') || p.toLowerCase().includes('time'));
  const isOverwhelmed = ctx.emotionalAnchors.painPhrases.some(p =>
    p.toLowerCase().includes('stress') || p.toLowerCase().includes('overwhelm') || p.toLowerCase().includes('chaos'));

  let archetype = 'balanced_achiever';
  if (wantsFreedom && isOverwhelmed) archetype = 'freedom_seeker';
  else if (ctx.revenueNumeric > 500000) archetype = 'empire_builder';
  else if (ctx.isPreRevenue) archetype = 'lifestyle_designer';

  return {
    tagline: `${ctx.companyName}: Building Success on Your Terms`,
    transformationStory: {
      currentReality: {
        title: `Your Current Reality: ${ctx.relationshipMirror || 'The Grind'}`,
        narrative: `Right now, you're running ${ctx.companyName}, working ${ctx.currentWorkingHours} hours a week. ${ctx.tuesdayTest ? `Your ideal Tuesday would be: "${ctx.tuesdayTest}"` : ''} ${ctx.familyFeedback ? `Your family has noticed: "${ctx.familyFeedback}"` : ''} ${ctx.moneyWorry ? `The money worry that keeps you up: "${ctx.moneyWorry}"` : ''}`
      },
      turningPoint: {
        title: 'Your Turning Point',
        narrative: `The shift happens when you realize that ${ctx.growthBottleneck || 'the current approach'} isn't sustainable. ${ctx.dangerZone ? `You've identified your danger zone: "${ctx.dangerZone}"` : ''} It's time for a different approach.`
      },
      visionAchieved: {
        title: ctx.winningBy2030 || 'Your Vision Achieved',
        narrative: `In 5 years, ${ctx.companyName} is different. You're working ${ctx.targetWorkingHours} hours a week, earning £${ctx.desiredIncome}/month. ${ctx.tenYearVision ? `Your vision: "${ctx.tenYearVision}"` : ''}`
      }
    },
    yearMilestones: {
      year1: {
        headline: 'Foundation & Relief',
        story: `Year 1 focuses on addressing ${ctx.magicAwayTask || 'immediate pain points'} and building systems.`,
        measurable: `Hours: ${ctx.currentWorkingHours} → ${Math.round(ctx.currentWorkingHours * 0.85)}, Revenue maintained/grown`
      },
      year3: {
        headline: 'Momentum & Systems',
        story: `By year 3, the business runs with systems, not heroics.`,
        measurable: `Hours: ${ctx.targetWorkingHours + 5}, Income: £${Math.round(ctx.desiredIncome * 0.8)}/month`
      },
      year5: {
        headline: ctx.winningBy2030 || 'Vision Achieved',
        story: `Year 5 sees your full vision realized.`,
        measurable: `Hours: ${ctx.targetWorkingHours}, Income: £${ctx.desiredIncome}/month, ${ctx.tenYearVision}`
      }
    },
    northStar: ctx.tuesdayTest || ctx.winningBy2030 || `Build ${ctx.companyName} to serve your life, not consume it`,
    archetype,
    emotionalCore: `${ctx.userName} is seeking ${wantsFreedom ? 'freedom and control over time' : 'sustainable growth and stability'}. The real goal isn't just revenue—it's quality of life.`
  };
}

function generateFallbackShift(ctx: RoadmapContext, vision: any): any {
  const benchmarks = getUkSmeBenchmarks(ctx.revenueNumeric, ctx.teamSize, ctx.industry);
  
  return {
    shiftOverview: `Over the next 6 months, ${ctx.companyName} will transform from ${ctx.relationshipMirror || 'current state'} to a foundation for ${vision.northStar}. Focus: ${benchmarks.quickWins.join(', ')}.`,
    month1_2: {
      theme: 'Foundation & Quick Wins',
      focus: ctx.magicAwayTask || benchmarks.commonChallenges[0],
      keyActions: benchmarks.quickWins.slice(0, 3),
      successMetrics: ['First quick win achieved', '10% reduction in pain point'],
      timeCommitment: ctx.commitmentHours,
      howYoullFeel: 'First signs of relief'
    },
    month3_4: {
      theme: 'Building Momentum',
      focus: 'Systematize what works',
      keyActions: ['Document working processes', 'Automate one task', 'Optimize pricing'],
      successMetrics: ['One process documented', 'One automation implemented'],
      timeCommitment: ctx.commitmentHours,
      howYoullFeel: 'Growing confidence'
    },
    month5_6: {
      theme: 'Approaching Transformation',
      focus: 'Prepare for scale',
      keyActions: ['Review all changes', 'Plan next phase', 'Celebrate progress'],
      successMetrics: ['Year 1 readiness', 'Clear next steps'],
      timeCommitment: ctx.commitmentHours,
      howYoullFeel: 'Ready for what\'s next'
    },
    quickWins: benchmarks.quickWins,
    dangerMitigation: `Watch for: ${ctx.dangerZone || benchmarks.commonChallenges[0]}`,
    northStarAlignment: `Every action moves toward: ${vision.northStar}`
  };
}

function generateFallbackSprint(ctx: RoadmapContext, vision: any, shift: any): any {
  const weeks = [];
  const phases = [
    { weeks: [1, 2], name: 'Immediate Relief', focus: ctx.magicAwayTask || 'Quick wins' },
    { weeks: [3, 4], name: 'Foundation', focus: 'Systems and processes' },
    { weeks: [5, 6], name: 'Momentum', focus: 'Scale what works' },
    { weeks: [7, 8], name: 'Lock-In', focus: 'Make permanent' },
    { weeks: [9, 10], name: 'Scale', focus: 'Multiply success' },
    { weeks: [11, 12], name: 'Transform', focus: 'New normal' }
  ];

  for (let w = 1; w <= 12; w++) {
    const phase = phases.find(p => p.weeks.includes(w))!;
    weeks.push({
      weekNumber: w,
      phase: phase.name,
      theme: `Week ${w}: ${phase.focus}`,
      focus: `Continue building on ${phase.name.toLowerCase()}`,
      tasks: [
        {
          id: `w${w}_t1`,
          title: `Week ${w} Priority Task`,
          description: `Focus on ${phase.focus} for ${ctx.companyName}`,
          why: `Moves toward ${vision.northStar}`,
          category: 'Operations',
          priority: w <= 4 ? 'critical' : 'high',
          estimatedHours: 2,
          deliverable: 'Task completed'
        },
        {
          id: `w${w}_t2`,
          title: 'Weekly Reflection',
          description: 'Review progress and plan next steps',
          why: 'Build strategic thinking habit',
          category: 'Personal',
          priority: 'medium',
          estimatedHours: 0.5,
          deliverable: 'Insights captured'
        }
      ],
      milestone: `Week ${w} complete`
    });
  }

  return {
    sprintTheme: `90 Days to ${vision.northStar}`,
    sprintPromise: `Transform from '${ctx.relationshipMirror}' to living '${ctx.tuesdayTest}'`,
    sprintGoals: [
      `Solve: ${ctx.growthBottleneck}`,
      `Address: ${ctx.moneyWorry}`,
      `Progress toward: ${vision.northStar}`
    ],
    phases: {
      weeks1_2: { name: 'Immediate Relief', purpose: 'Quick wins' },
      weeks3_4: { name: 'Foundation', purpose: 'Systems' },
      weeks5_6: { name: 'Momentum', purpose: 'Scale' },
      weeks7_8: { name: 'Lock-In', purpose: 'Permanent' },
      weeks9_10: { name: 'Scale', purpose: 'Multiply' },
      weeks11_12: { name: 'Transform', purpose: 'New version' }
    },
    week0_preparation: {
      theme: 'Creating Space',
      tasks: [
        { task: 'Block calendar time', output: ctx.commitmentHours, tool: 'Calendar' },
        { task: 'Document baseline', output: 'Current metrics', tool: 'Spreadsheet' }
      ]
    },
    weeks,
    successMetrics: {
      week4: 'Foundation solid',
      week8: 'Momentum locked',
      week12: 'Transformed'
    },
    tuesdayEvolution: {
      week0: ctx.relationshipMirror,
      week4: 'First shift visible',
      week8: 'New patterns forming',
      week12: ctx.tuesdayTest
    }
  };
}

// ============================================================================
// LLM HELPERS
// ============================================================================

async function callLLM(prompt: string, maxTokens = 8000): Promise<string> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor 365 Roadmap'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { 
          role: 'system', 
          content: 'You create deeply personal transformation narratives that make founders feel truly understood. Write in second person. Use their exact quotes. Always return valid JSON. Be specific to their industry and situation.' 
        },
        { role: 'user', content: prompt }
      ]
    })
  });
  
  if (!response.ok) throw new Error(`OpenRouter error: ${await response.text()}`);
  return (await response.json()).choices[0].message.content;
}

function extractJson(text: string): any {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  const jsonStr = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to fix common issues
    const fixed = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1f]/g, ' ')
      .replace(/\n/g, '\\n');
    return JSON.parse(fixed);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { clientId, practiceId, regenerate } = await req.json();
    if (!clientId || !practiceId) {
      return new Response(JSON.stringify({ error: 'Missing clientId or practiceId' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Generating comprehensive roadmap for client ${clientId}...`);
    const startTime = Date.now();

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Fetch Parts 1 & 2
    const { data: assessments, error: fetchError } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses')
      .eq('client_id', clientId)
      .in('assessment_type', ['part1', 'part2']);

    if (fetchError) throw new Error(`Failed to fetch: ${fetchError.message}`);

    const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};

    // Build comprehensive context
    const context = buildContext(part1, part2);
    console.log(`Context built for ${context.companyName} (${context.industry}, £${context.revenueNumeric})`);
    console.log(`Emotional anchors: ${context.emotionalAnchors.painPhrases.length} pain, ${context.emotionalAnchors.desirePhrases.length} desire`);

    // Phase 1: 5-Year Vision
    console.log('Generating 5-Year Vision...');
    let fiveYearVision;
    try {
      const visionPrompt = buildVisionPrompt(context);
      const visionResponse = await callLLM(visionPrompt, 6000);
      fiveYearVision = extractJson(visionResponse);
      console.log('Vision generated:', fiveYearVision.northStar?.substring(0, 50));
    } catch (e) {
      console.error('Vision LLM failed, using fallback:', e);
      fiveYearVision = generateFallbackVision(context);
    }

    // Phase 2: 6-Month Shift
    console.log('Generating 6-Month Shift...');
    let sixMonthShift;
    try {
      const shiftPrompt = buildShiftPrompt(context, fiveYearVision);
      const shiftResponse = await callLLM(shiftPrompt, 4000);
      sixMonthShift = extractJson(shiftResponse);
      console.log('Shift generated');
    } catch (e) {
      console.error('Shift LLM failed, using fallback:', e);
      sixMonthShift = generateFallbackShift(context, fiveYearVision);
    }

    // Phase 3: 12-Week Sprint
    console.log('Generating 12-Week Sprint...');
    let sprint;
    try {
      const sprintPrompt = buildSprintPrompt(context, fiveYearVision, sixMonthShift);
      const sprintResponse = await callLLM(sprintPrompt, 10000);
      sprint = extractJson(sprintResponse);
      console.log('Sprint generated:', sprint.weeks?.length, 'weeks');
    } catch (e) {
      console.error('Sprint LLM failed, using fallback:', e);
      sprint = generateFallbackSprint(context, fiveYearVision, sixMonthShift);
    }

    const duration = Date.now() - startTime;

    // Build comprehensive roadmap data
    const roadmapData = {
      fiveYearVision,
      sixMonthShift,
      sprint,
      context: {
        industry: context.industry,
        revenueStage: context.isPreRevenue ? 'pre_revenue' : context.revenueNumeric < 250000 ? 'early' : 'growth',
        archetype: fiveYearVision.archetype,
        emotionalAnchors: context.emotionalAnchors
      },
      roiData: context.roiData,
      summary: {
        headline: fiveYearVision.tagline || `${context.companyName}'s Transformation`,
        northStar: fiveYearVision.northStar,
        keyInsight: sixMonthShift.shiftOverview,
        expectedOutcome: fiveYearVision.yearMilestones?.year1?.measurable
      },
      weeks: sprint.weeks || [],
      generatedAt: new Date().toISOString(),
      generationDurationMs: duration,
      version: '2.0'
    };

    // Deactivate old roadmaps
    await supabase.from('client_roadmaps').update({ is_active: false }).eq('client_id', clientId);

    // Insert new
    const { data: savedRoadmap, error: saveError } = await supabase
      .from('client_roadmaps')
      .insert({ practice_id: practiceId, client_id: clientId, roadmap_data: roadmapData, is_active: true })
      .select()
      .single();

    if (saveError) throw new Error(`Failed to save: ${saveError.message}`);

    // Create tasks from sprint weeks
    if (sprint.weeks?.length > 0) {
      const tasks = sprint.weeks.flatMap((week: any) =>
        (week.tasks || []).map((task: any, i: number) => ({
          practice_id: practiceId, client_id: clientId, roadmap_id: savedRoadmap.id,
          week_number: week.weekNumber, title: task.title, description: task.description,
          category: task.category || 'General', priority: task.priority || 'medium',
          estimated_hours: task.estimatedHours || 1, sort_order: i, status: 'pending'
        }))
      );
      if (tasks.length > 0) {
        await supabase.from('client_tasks').insert(tasks);
        console.log(`Created ${tasks.length} tasks`);
      }
    }

    console.log(`Roadmap generation complete in ${duration}ms!`);

    return new Response(JSON.stringify({
      success: true,
      roadmapId: savedRoadmap.id,
      summary: {
        headline: roadmapData.summary.headline,
        northStar: fiveYearVision.northStar,
        archetype: fiveYearVision.archetype,
        weekCount: sprint.weeks?.length || 0,
        taskCount: sprint.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || 0,
        roiSummary: context.roiData
      },
      usage: { durationMs: duration, llmCalls: 3 }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
