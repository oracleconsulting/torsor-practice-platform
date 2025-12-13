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
import { cleanAllStrings } from '../_shared/cleanup.ts';

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
  threeExpertsNeeded: string;
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
// BOARD MEMBER DETERMINATION
// ============================================================================

interface BoardMember {
  role: string;
  focus: string;
  priority: number;
}

function determineBoardMembers(ctx: RoadmapContext): BoardMember[] {
  const board: BoardMember[] = [];
  
  // Always include COO for operations (most common need)
  board.push({
    role: 'COO',
    focus: 'Systems, processes, delegation, time recovery',
    priority: 1
  });

  // CFO if money worries or cash flow issues
  if (ctx.moneyWorry || ctx.growthBottleneck?.toLowerCase().includes('cash') ||
      ctx.growthBottleneck?.toLowerCase().includes('money') ||
      ctx.growthBottleneck?.toLowerCase().includes('profit')) {
    board.push({
      role: 'CFO',
      focus: 'Cash flow, pricing, profitability, financial systems',
      priority: 2
    });
  }

  // CMO if growth/marketing mentioned
  if (ctx.growthBottleneck?.toLowerCase().includes('lead') ||
      ctx.growthBottleneck?.toLowerCase().includes('customer') ||
      ctx.growthBottleneck?.toLowerCase().includes('sales') ||
      ctx.growthBottleneck?.toLowerCase().includes('marketing') ||
      ctx.ninetyDayPriorities?.some((p: string) => p.toLowerCase().includes('market') || p.toLowerCase().includes('sales'))) {
    board.push({
      role: 'CMO',
      focus: 'Marketing, lead generation, brand, customer acquisition',
      priority: 3
    });
  }

  // CTO if tech/systems mentioned
  if (ctx.toolsUsed?.length > 3 || ctx.industry === 'technology' ||
      ctx.growthBottleneck?.toLowerCase().includes('tech') ||
      ctx.growthBottleneck?.toLowerCase().includes('system') ||
      ctx.growthBottleneck?.toLowerCase().includes('automation')) {
    board.push({
      role: 'CTO',
      focus: 'Technology, automation, integrations, digital infrastructure',
      priority: 4
    });
  }

  // CHRO if team/people issues
  if (ctx.teamSize !== 'Just me' ||
      ctx.growthBottleneck?.toLowerCase().includes('staff') ||
      ctx.growthBottleneck?.toLowerCase().includes('hire') ||
      ctx.growthBottleneck?.toLowerCase().includes('team') ||
      ctx.threeExpertsNeeded?.toLowerCase().includes('hr')) {
    board.push({
      role: 'CHRO',
      focus: 'Team, hiring, culture, performance, delegation',
      priority: 5
    });
  }

  // Default additional members if board is small
  if (board.length < 3) {
    if (!board.find(b => b.role === 'CFO')) {
      board.push({ role: 'CFO', focus: 'Financial health and pricing', priority: 6 });
    }
    if (!board.find(b => b.role === 'CMO')) {
      board.push({ role: 'CMO', focus: 'Growth and customer acquisition', priority: 7 });
    }
  }

  return board.sort((a, b) => a.priority - b.priority).slice(0, 4);
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
// CLIENT-SPECIFIC CONTENT FILTER (for shared documents)
// ============================================================================

function filterContentForClient(
  content: string, 
  thisClientPatterns: string[], 
  otherClientPatterns: string[]
): string {
  const lines = content.split('\n');
  const relevantLines: string[] = [];
  let inRelevantSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    
    // Check if line mentions THIS client
    const mentionsThis = thisClientPatterns.some(p => lineLower.includes(p));
    // Check if line mentions OTHER clients
    const mentionsOther = otherClientPatterns.some(p => lineLower.includes(p));
    
    // Detect speaker changes in transcripts
    if (lineLower.match(/^[\w\s]+:/)) {
      inRelevantSection = mentionsThis && !mentionsOther;
    }
    
    // Include line if:
    // 1. Specifically mentions this client
    // 2. We're in a section where this client is speaking
    // 3. It's general advice (not about any specific client's business)
    if (mentionsThis && !mentionsOther) {
      relevantLines.push(lines[i]);
      inRelevantSection = true;
    } else if (inRelevantSection && !mentionsOther) {
      relevantLines.push(lines[i]);
    } else if (!mentionsOther && isGeneralAdvice(lineLower)) {
      relevantLines.push(lines[i]);
    }
    
    // Reset section flag after empty lines
    if (lines[i].trim() === '') {
      inRelevantSection = false;
    }
  }
  
  return relevantLines.join('\n').trim();
}

function isGeneralAdvice(line: string): boolean {
  const generalPatterns = [
    'recommend', 'suggest', 'should', 'could', 'consider',
    'strategy', 'approach', 'framework', 'process', 'system',
    'goal setting', 'planning', 'priority', 'focus on'
  ];
  return generalPatterns.some(p => line.includes(p));
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
    threeExpertsNeeded: part2.three_experts_needed || part1.three_experts_needed || '',
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
  // Determine board members based on their needs
  const boardMembers = determineBoardMembers(ctx);
  
  return `You are implementing The 365 Method for ${ctx.userName} at ${ctx.companyName} - a ${ctx.industry} business ready for life-first transformation.

THE 365 METHOD FOUNDATION:
- 365 days to transform (not just grow)
- 5-Year Life Compass (not just business goals)
- 6-Month Structural Shifts (HOW they work, not tasks)
- 3-Month Implementation Sprints (specific, measurable progress)
- Every week must move them closer to their ideal Tuesday feeling

THEIR 6-MONTH SHIFTS:
${JSON.stringify(shift, null, 2)}

THEIR 5-YEAR COMPASS:
North Star: ${vision.northStar}
Emotional Core: ${vision.emotionalCore}
Year 1 Target: ${vision.yearMilestones?.year1?.measurable}

BUSINESS SPECIFICS:
- Business: ${ctx.companyName} (${ctx.industry})
- Revenue: ${ctx.annualTurnover} (£${ctx.revenueNumeric})
- Team: ${ctx.teamSize}
- Years Trading: ${ctx.yearsTrading}
- Current working hours: ${ctx.currentWorkingHours} hours/week
- Target working hours: ${ctx.targetWorkingHours} hours/week

═══════════════════════════════════════════════════════════════════
TASK GENERATION CONTEXT (CRITICAL - USE THESE SPECIFICALLY)
═══════════════════════════════════════════════════════════════════

THEIR CURRENT TOOLS (reference these in tasks):
${ctx.toolsUsed.length > 0 ? ctx.toolsUsed.map(t => `- ${t}`).join('\n') : '- No specific tools mentioned - recommend appropriate ones'}

THEIR MONDAY FRUSTRATION (address this in Week 1-2):
"${ctx.mondayFrustration || ctx.growthBottleneck || 'general operational friction'}"

THEIR MAGIC-AWAY TASK (if they could eliminate one thing):
"${ctx.magicAwayTask || 'administrative burden'}"

THEIR 90-DAY PRIORITIES (must address at least 2 in Weeks 1-4):
${ctx.ninetyDayPriorities?.length > 0 ? ctx.ninetyDayPriorities.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') : '- Systems, delegation, time recovery'}

THREE EXPERTS THEY WISH THEY HAD (inform task delegation):
"${ctx.threeExpertsNeeded || 'Operations manager, marketing support, admin help'}"

THEIR DANGER ZONE (build prevention into tasks):
"${ctx.dangerZone || 'overcommitment'}"

═══════════════════════════════════════════════════════════════════
ADVISORY BOARD ROLES (assign ownership to each task)
═══════════════════════════════════════════════════════════════════
${boardMembers.map(b => `- ${b.role}: ${b.focus}`).join('\n')}

═══════════════════════════════════════════════════════════════════
EMOTIONAL ANCHORS (use their exact words)
═══════════════════════════════════════════════════════════════════
- Their biggest pain: "${ctx.growthBottleneck}"
- Their 90-day fantasy: "${ctx.tuesdayTest}"
- Tuesday currently feels: "${ctx.relationshipMirror}"
- Money worry: "${ctx.moneyWorry}"
- Emergency log: "${ctx.emergencyLog}"
- Family feedback: "${ctx.familyFeedback}"
- Secret pride: "${ctx.secretPride}"

CONSTRAINTS:
- Available time per week: ${ctx.commitmentHours}
- Team size: ${ctx.teamSize}

INDUSTRY CONTEXT FOR ${ctx.industry}:
${ctx.industryContext}

═══════════════════════════════════════════════════════════════════
TASK REQUIREMENTS (CRITICAL - FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════════════

For EVERY task, you MUST include:
1. A SPECIFIC tool reference (from their list or an industry-appropriate recommendation)
2. A board member owner (${boardMembers.map(b => b.role).join(', ')})
3. A quantified success metric (not "improved" - give a number or percentage)
4. A clear deliverable output (not "progress made" - name the artifact)
5. Delegation score (1-10 how suitable for delegation) and who to delegate to

GOOD TASK EXAMPLE:
{
  "title": "Set up automated payment reminders in Xero",
  "description": "Configure 3-stage reminder sequence: 7 days before, on due date, 7 days overdue",
  "why": "Addresses your Monday frustration about 'chasing invoices'",
  "tool": "Xero",
  "boardOwner": "CFO",
  "successMetric": "Reduce debtor days from 45 to 30",
  "deliverable": "Automated reminder sequence live and tested",
  "delegationScore": 8,
  "delegateTo": "Bookkeeper"
}

BAD TASK EXAMPLE (DO NOT DO THIS):
{
  "title": "Work on cash flow",
  "description": "Improve the business finances",
  "tool": "Accounting software",
  "successMetric": "Better cash position"
}

Return as JSON:
{
  "sprintTheme": "90 Days to ${ctx.tuesdayTest || 'Transform Your Tuesday'}",
  
  "sprintPromise": "Transform from '${ctx.relationshipMirror}' to finally experiencing '${ctx.tuesdayTest}'. Solve: ${ctx.magicAwayTask}. Address: ${ctx.mondayFrustration || ctx.growthBottleneck}. Progress toward: ${vision.northStar}.",
  
  "sprintGoals": [
    "Eliminate: ${ctx.magicAwayTask}",
    "Solve: ${ctx.growthBottleneck}",
    "Achieve: Progress toward ${ctx.tuesdayTest}"
  ],
  
  "phases": {
    "weeks1_2": { "name": "Immediate Relief", "purpose": "Quick wins addressing '${ctx.magicAwayTask}'" },
    "weeks3_4": { "name": "Foundation", "purpose": "Systems for '${ctx.growthBottleneck}'" },
    "weeks5_6": { "name": "Momentum", "purpose": "Scale what's working" },
    "weeks7_8": { "name": "Lock-In", "purpose": "Make permanent" },
    "weeks9_10": { "name": "Scale", "purpose": "Multiply wins" },
    "weeks11_12": { "name": "Transform", "purpose": "New normal" }
  },
  
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Immediate Relief",
      "theme": "Week 1: [Specific action addressing their Monday frustration]",
      "focus": "[What ONE thing gives immediate relief from '${ctx.mondayFrustration}']",
      "tuesdayTransformation": "First glimpse of relief from '${ctx.relationshipMirror}'",
      "tasks": [
        {
          "id": "w1_t1",
          "title": "[SPECIFIC action with SPECIFIC tool from their list]",
          "description": "[Step-by-step what to do]",
          "why": "Directly addresses: '${ctx.mondayFrustration}'",
          "category": "Operations",
          "priority": "critical",
          "estimatedHours": 2,
          "tool": "[Actual tool name from ${ctx.toolsUsed.join(', ')} or recommend one]",
          "boardOwner": "[Role from ${boardMembers.map(b => b.role).join(', ')}]",
          "successMetric": "[Number or percentage, e.g., 'Reduce X by 50%']",
          "deliverable": "[Specific artifact, e.g., 'Automated sequence configured']",
          "delegationScore": 7,
          "delegateTo": "[Who could do this, e.g., 'VA', 'Bookkeeper']"
        },
        // 2-4 more tasks per week, each specific and measurable
      ],
      "milestone": "[Concrete achievement, not 'progress made']"
    }
    // Generate all 12 weeks with 3-5 SPECIFIC tasks each
  ],
  
  "tuesdayEvolution": {
    "week0": "'${ctx.relationshipMirror}'",
    "week4": "[Specific improvement they'll feel]",
    "week8": "[How Tuesday feels now]",
    "week12": "Approaching: '${ctx.tuesdayTest}'"
  },
  
  "backslidePreventions": [
    { "trigger": "${ctx.dangerZone}", "response": "[Specific action]" }
  ]
}

CRITICAL REMINDERS:
- Generate ALL 12 weeks with 3-5 SPECIFIC tasks each
- Time per week available: ${ctx.commitmentHours}
- Reference their ACTUAL tools: ${ctx.toolsUsed.join(', ') || 'recommend appropriate tools'}
- Address their 90-day priorities: ${ctx.ninetyDayPriorities?.join(', ') || 'systems, delegation, time'}
- Every task needs a board owner from: ${boardMembers.map(b => b.role).join(', ')}
- Use their exact emotional language throughout`;
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
  const boardMembers = determineBoardMembers(ctx);
  const primaryTool = ctx.toolsUsed?.[0] || getDefaultToolForIndustry(ctx.industry);
  
  // Helper function for default tools
  function getDefaultToolForIndustry(industry: string): string {
    const defaults: Record<string, string> = {
      fitness_equipment: 'Shopify + Xero',
      consulting: 'Notion + Google Workspace',
      technology: 'Jira + Slack',
      agency: 'Asana + Figma',
      trades: 'ServiceM8 + QuickBooks',
      general_business: 'Google Workspace + Xero'
    };
    return defaults[industry] || 'Google Workspace';
  }

  // ============================================================================
  // DYNAMIC PRIORITY ANALYSIS - What does THIS client need most?
  // ============================================================================
  interface PriorityItem {
    type: string;
    urgency: number;   // 1-10, higher = more urgent
    impact: number;    // 1-10, higher = more impact
    context: string;   // What triggered this priority
    tasks: TaskTemplate[];
  }

  interface TaskTemplate {
    phase: 'diagnose' | 'design' | 'implement' | 'embed' | 'measure';
    title: string;
    description: string;
    why: string;
    category: string;
    estimatedHours: number;
    tool: string;
    boardOwner: string;
    successMetric: string;
    deliverable: string;
    delegationScore: number;
    delegateTo: string;
  }

  // Analyze client context and determine priorities
  function analyzePriorities(ctx: RoadmapContext): PriorityItem[] {
    const priorities: PriorityItem[] = [];

    // TIME CRISIS - if working way too many hours
    if (ctx.currentWorkingHours && ctx.targetWorkingHours) {
      const hoursGap = ctx.currentWorkingHours - ctx.targetWorkingHours;
      if (hoursGap > 15) {
        priorities.push({
          type: 'time_crisis',
          urgency: 9,
          impact: 10,
          context: `${hoursGap} hours over target`,
          tasks: [
            { phase: 'diagnose', title: `Find where ${hoursGap} hours are going`, description: `You work ${ctx.currentWorkingHours}hrs, want ${ctx.targetWorkingHours}. Track every hour for one week - where does the time actually go?`, why: 'You can\'t fix what you can\'t see', category: 'Operations', estimatedHours: 1, tool: 'Time tracking', boardOwner: 'COO', successMetric: '7-day time audit complete', deliverable: 'Time breakdown by category', delegationScore: 10, delegateTo: 'Personal' },
            { phase: 'design', title: `Identify top 3 time thieves`, description: `From your time audit: What 3 activities eat the most hours for the least value? List them with hours/week`, why: 'Focus on biggest levers first', category: 'Operations', estimatedHours: 1, tool: 'Spreadsheet', boardOwner: 'COO', successMetric: 'Top 3 identified with hours', deliverable: 'Time thief list with delegation plan', delegationScore: 10, delegateTo: 'Personal' },
            { phase: 'implement', title: `Eliminate or delegate time thief #1`, description: `Your biggest time thief needs to go. Can it be: Automated? Delegated? Eliminated? Reduced?`, why: 'One change can free 5+ hours/week', category: 'Operations', estimatedHours: 3, tool: primaryTool, boardOwner: 'COO', successMetric: 'Time thief #1 no longer yours', deliverable: 'Delegation complete or automation live', delegationScore: 7, delegateTo: 'VA or team' },
            { phase: 'embed', title: `Create boundary: No work after 6pm on Thursdays`, description: `Pick ONE evening this week to protect completely. No work, no emails, no thinking about work. Practice the boundary.`, why: 'Boundaries must be practiced to become real', category: 'Personal', estimatedHours: 0, tool: 'Calendar', boardOwner: 'COO', successMetric: 'Thursday evening protected', deliverable: 'Calendar blocked, family knows', delegationScore: 10, delegateTo: 'Personal' },
            { phase: 'measure', title: `Compare: Week 1 vs now - are you working less?`, description: `Run another time audit. Compare to your first one. Are you actually working fewer hours?`, why: 'Measure or it didn\'t happen', category: 'Operations', estimatedHours: 1, tool: 'Time tracking', boardOwner: 'COO', successMetric: 'Hours reduced by at least 5', deliverable: 'Before/after comparison', delegationScore: 10, delegateTo: 'Personal' }
          ]
        });
      } else if (hoursGap > 5) {
        priorities.push({
          type: 'time_optimization',
          urgency: 6,
          impact: 7,
          context: `${hoursGap} hours over target`,
          tasks: [
            { phase: 'diagnose', title: `Quick time audit: Where are ${hoursGap} extra hours going?`, description: `You're ${hoursGap} hours over your ideal. Spend 30 mins listing everything you did yesterday hour by hour.`, why: 'Awareness is the first step', category: 'Operations', estimatedHours: 0.5, tool: 'Notes', boardOwner: 'COO', successMetric: 'Yesterday mapped hour by hour', deliverable: 'Time breakdown', delegationScore: 10, delegateTo: 'Personal' },
            { phase: 'implement', title: `Cut one low-value recurring meeting`, description: `Which meeting could be an email? Cancel it.`, why: 'Meetings are time sinkholes', category: 'Operations', estimatedHours: 0.5, tool: 'Calendar', boardOwner: 'COO', successMetric: 'One recurring meeting cancelled', deliverable: 'Calendar updated', delegationScore: 10, delegateTo: 'Personal' }
          ]
        });
      }
    }

    // MONDAY FRUSTRATION - high urgency, daily pain
    if (ctx.mondayFrustration) {
      priorities.push({
        type: 'daily_pain',
        urgency: 8,
        impact: 8,
        context: ctx.mondayFrustration,
        tasks: [
          { phase: 'diagnose', title: `Root cause: "${ctx.mondayFrustration.substring(0, 40)}..."`, description: `You said this frustrates you: "${ctx.mondayFrustration}". Write down: When did this last happen? What caused it? What would have prevented it?`, why: 'Understanding the trigger is half the fix', category: 'Analysis', estimatedHours: 1, tool: 'Notes', boardOwner: 'COO', successMetric: 'Root cause documented', deliverable: '1-page analysis: trigger → cause → fix', delegationScore: 10, delegateTo: 'Only you know the real pain' },
          { phase: 'design', title: `Design the fix: How to prevent "${ctx.mondayFrustration.substring(0, 30)}..."`, description: `Now you know the cause. What would prevent this? A process? A tool? A boundary? A hire?`, why: 'Design before implementation', category: 'Planning', estimatedHours: 1, tool: 'Notes', boardOwner: 'COO', successMetric: 'Solution designed', deliverable: 'Fix specification', delegationScore: 8, delegateTo: 'Can get input but decision is yours' },
          { phase: 'implement', title: `Implement first fix for "${ctx.mondayFrustration.substring(0, 30)}..."`, description: `Put your fix in place. Not perfect - just version 1. Test it this week.`, why: 'Progress over perfection', category: 'Operations', estimatedHours: 3, tool: primaryTool, boardOwner: 'COO', successMetric: 'Fix implemented and tested', deliverable: 'First version live', delegationScore: 5, delegateTo: 'Depends on the fix' }
        ]
      });
    }

    // GROWTH BOTTLENECK - medium urgency, high impact
    if (ctx.growthBottleneck) {
      priorities.push({
        type: 'bottleneck',
        urgency: 7,
        impact: 9,
        context: ctx.growthBottleneck,
        tasks: [
          { phase: 'diagnose', title: `Map the bottleneck: "${ctx.growthBottleneck.substring(0, 40)}..."`, description: `Document exactly how "${ctx.growthBottleneck}" works today. What are the steps? Where does it break? Who's involved?`, why: 'Can\'t fix what isn\'t mapped', category: 'Systems', estimatedHours: 2, tool: 'Miro or Notion', boardOwner: 'COO', successMetric: 'Process fully mapped', deliverable: 'Visual process map', delegationScore: 5, delegateTo: 'You map, team validates' },
          { phase: 'design', title: `Design SOP for: "${ctx.growthBottleneck.substring(0, 30)}..."`, description: `Turn your process map into a Standard Operating Procedure someone else could follow`, why: 'Documentation enables delegation', category: 'Systems', estimatedHours: 3, tool: 'Notion or Loom', boardOwner: 'COO', successMetric: 'SOP complete', deliverable: 'Written SOP or video walkthrough', delegationScore: 3, delegateTo: 'You create, team refines' },
          { phase: 'implement', title: `Hand off: "${ctx.growthBottleneck.substring(0, 30)}..." to someone else`, description: `Your SOP is ready. Train someone else to do it. Watch them do it once. Then let them own it.`, why: 'The bottleneck is YOU - remove yourself', category: 'Delegation', estimatedHours: 4, tool: 'Training session', boardOwner: 'COO', successMetric: 'Someone else handles this', deliverable: 'Handoff complete', delegationScore: 8, delegateTo: 'Team member or VA' },
          { phase: 'embed', title: `Check: Is the bottleneck still gone after 2 weeks?`, description: `Has the person you trained still handling it? Any issues? Any creep back to you?`, why: 'Delegation fails without follow-up', category: 'Delegation', estimatedHours: 0.5, tool: 'Check-in meeting', boardOwner: 'COO', successMetric: 'Still delegated, still working', deliverable: 'Status confirmed', delegationScore: 10, delegateTo: 'Quick check-in' }
        ]
      });
    }

    // INCOME GAP - important for sustainability
    if (ctx.desiredIncome && ctx.currentIncome && ctx.desiredIncome > ctx.currentIncome) {
      const incomeGap = ctx.desiredIncome - ctx.currentIncome;
      const monthlyGap = Math.round(incomeGap / 12);
      priorities.push({
        type: 'income_growth',
        urgency: 6,
        impact: 8,
        context: `£${monthlyGap.toLocaleString()}/month gap`,
        tasks: [
          { phase: 'diagnose', title: `Audit: Where could £${monthlyGap.toLocaleString()}/month come from?`, description: `List all options: Price increase? More clients? Bigger projects? New service? Cutting costs?`, why: 'Multiple paths to the same destination', category: 'Financial', estimatedHours: 2, tool: 'Spreadsheet', boardOwner: 'CFO', successMetric: '5 options listed with £ attached', deliverable: 'Income improvement options doc', delegationScore: 2, delegateTo: 'Strategy is yours' },
          { phase: 'design', title: `Choose: Which income lever to pull first?`, description: `Pick the one income change with highest impact and lowest friction. Commit to it.`, why: 'Focus beats scattered effort', category: 'Financial', estimatedHours: 1, tool: 'Decision', boardOwner: 'CFO', successMetric: 'One lever chosen', deliverable: 'Clear decision made', delegationScore: 2, delegateTo: 'Your call' },
          { phase: 'implement', title: `Do it: Implement your £${monthlyGap.toLocaleString()}/month change`, description: `Execute your chosen income lever. Raise the price, launch the offer, make the call. Not "thinking about it" - doing it.`, why: 'Action > Planning', category: 'Financial', estimatedHours: 4, tool: 'Depends on lever', boardOwner: 'CFO', successMetric: 'Change implemented', deliverable: 'Proof: email sent, price raised, offer launched', delegationScore: 3, delegateTo: 'You decide, team executes' }
        ]
      });
    }

    // MAGIC AWAY TASK - something they deeply want gone
    if (ctx.magicAwayTask) {
      priorities.push({
        type: 'magic_away',
        urgency: 7,
        impact: 7,
        context: ctx.magicAwayTask,
        tasks: [
          { phase: 'diagnose', title: `Research: How to eliminate "${ctx.magicAwayTask.substring(0, 35)}..."`, description: `You'd magic this away: "${ctx.magicAwayTask}". Research: Can it be automated? Outsourced? Eliminated? Changed?`, why: 'Someone has solved this before', category: 'Research', estimatedHours: 2, tool: 'Google, YouTube, ChatGPT', boardOwner: 'COO', successMetric: '3 options identified', deliverable: 'Options comparison', delegationScore: 6, delegateTo: 'VA can research' },
          { phase: 'implement', title: `Execute: Start eliminating "${ctx.magicAwayTask.substring(0, 30)}..."`, description: `Pick best option and start implementation. Even 50% reduction is a win.`, why: 'Your wish list becomes your done list', category: 'Operations', estimatedHours: 4, tool: primaryTool, boardOwner: 'COO', successMetric: '50% reduction achieved', deliverable: 'Automation or delegation in place', delegationScore: 5, delegateTo: 'Depends on solution' }
        ]
      });
    }

    // IDEAL TUESDAY - the emotional north star
    if (ctx.tuesdayTest) {
      priorities.push({
        type: 'ideal_life',
        urgency: 5,
        impact: 10,
        context: ctx.tuesdayTest,
        tasks: [
          { phase: 'design', title: `Design your ideal Tuesday in detail`, description: `Your vision: "${ctx.tuesdayTest}". Write out the PERFECT Tuesday hour by hour. 7am-10pm. What are you doing? Where? With whom?`, why: 'Can\'t build what you can\'t see clearly', category: 'Personal', estimatedHours: 1, tool: 'Notes', boardOwner: 'COO', successMetric: 'Hour-by-hour ideal Tuesday', deliverable: 'Ideal Tuesday document', delegationScore: 10, delegateTo: 'Personal' },
          { phase: 'implement', title: `Create one element of your ideal Tuesday this week`, description: `Pick ONE thing from your ideal Tuesday. Make it happen this week. Even just for 2 hours.`, why: 'Taste the future to fuel the journey', category: 'Personal', estimatedHours: 2, tool: 'Calendar', boardOwner: 'COO', successMetric: 'One element experienced', deliverable: 'Tuesday looks 10% closer', delegationScore: 10, delegateTo: 'Only you can live your life' },
          { phase: 'embed', title: `Protect: Block ideal Tuesday elements in your calendar`, description: `Schedule the non-negotiables. Block them. Tell people. Treat them like client meetings.`, why: 'What isn\'t scheduled doesn\'t happen', category: 'Personal', estimatedHours: 0.5, tool: 'Calendar', boardOwner: 'COO', successMetric: 'Calendar blocks in place', deliverable: 'Protected time scheduled', delegationScore: 10, delegateTo: 'Personal' }
        ]
      });
    }

    // DANGER ZONE - risk of backslide
    if (ctx.dangerZone) {
      priorities.push({
        type: 'backslide_prevention',
        urgency: 6,
        impact: 7,
        context: ctx.dangerZone,
        tasks: [
          { phase: 'design', title: `Guardrails: Prevent "${ctx.dangerZone.substring(0, 35)}..."`, description: `Your danger zone: "${ctx.dangerZone}". Design 3 guardrails: What system, boundary, or accountability prevents backslide?`, why: 'Change without protection doesn\'t last', category: 'Personal', estimatedHours: 1, tool: 'Notes', boardOwner: 'COO', successMetric: '3 guardrails designed', deliverable: 'Backslide prevention plan', delegationScore: 10, delegateTo: 'Personal' },
          { phase: 'embed', title: `Activate your guardrails`, description: `Put your backslide prevention in place. Calendar blocks, accountability partner, or whatever you designed.`, why: 'Knowing isn\'t doing', category: 'Personal', estimatedHours: 1, tool: 'Calendar + accountability', boardOwner: 'COO', successMetric: 'Guardrails active', deliverable: 'Prevention measures live', delegationScore: 10, delegateTo: 'Personal' }
        ]
      });
    }

    // EXPERTISE GAP - they know they need help
    if (ctx.threeExpertsNeeded) {
      const experts = ctx.threeExpertsNeeded.split(',').map(e => e.trim());
      experts.forEach((expert, idx) => {
        if (expert && idx < 2) { // Only first 2 experts
          priorities.push({
            type: 'expertise_gap',
            urgency: 5 - idx,
            impact: 7,
            context: expert,
            tasks: [
              { phase: 'design', title: `Write spec: What exactly do you need from ${expert}?`, description: `Before hiring, clarify: What tasks would they do? How many hours/week? What's the output? What's the budget?`, why: 'Clarity prevents bad hires', category: 'People', estimatedHours: 1, tool: 'Notes', boardOwner: 'CHRO', successMetric: 'Role spec written', deliverable: 'Job specification', delegationScore: 4, delegateTo: 'You spec, recruiter can source' },
              { phase: 'implement', title: `Find ${expert}`, description: `Post the role, reach out to 5 candidates, or engage a recruiter. Fractional, freelance, or permanent.`, why: 'You identified this gap - fill it', category: 'People', estimatedHours: 4, tool: 'LinkedIn, Upwork, or recruiter', boardOwner: 'CHRO', successMetric: 'Candidates identified or hire in progress', deliverable: 'Shortlist or trial started', delegationScore: 5, delegateTo: 'Recruiter sources, you approve' }
            ]
          });
        }
      });
    }

    // MONEY WORRY - needs visibility
    if (ctx.moneyWorry) {
      priorities.push({
        type: 'financial_visibility',
        urgency: 7,
        impact: 6,
        context: ctx.moneyWorry,
        tasks: [
          { phase: 'design', title: `Dashboard: Turn "${ctx.moneyWorry.substring(0, 30)}..." into data`, description: `Your worry: "${ctx.moneyWorry}". What numbers would you need to see weekly to stop worrying? Cash position? Forecast? Pipeline?`, why: 'Visibility beats anxiety', category: 'Financial', estimatedHours: 1, tool: 'Spreadsheet', boardOwner: 'CFO', successMetric: 'Key metrics identified', deliverable: 'Dashboard spec', delegationScore: 3, delegateTo: 'You define, bookkeeper builds' },
          { phase: 'implement', title: `Build: Financial dashboard for "${ctx.moneyWorry.substring(0, 25)}..."`, description: `Create the dashboard. Even a simple spreadsheet. Track weekly instead of worrying daily.`, why: 'What you measure, you manage', category: 'Financial', estimatedHours: 3, tool: 'Xero, QuickBooks, or Sheets', boardOwner: 'CFO', successMetric: 'Dashboard live', deliverable: 'Financial dashboard with 3+ metrics', delegationScore: 6, delegateTo: 'Bookkeeper can build' }
        ]
      });
    }

    // Sort by urgency * impact score
    return priorities.sort((a, b) => (b.urgency * b.impact) - (a.urgency * a.impact));
  }

  // Generate task queue from priorities
  function generateTaskQueue(priorities: PriorityItem[]): any[] {
    const allTasks: any[] = [];
    
    // Flatten all tasks from all priorities
    priorities.forEach(priority => {
      priority.tasks.forEach((task, idx) => {
        allTasks.push({
          ...task,
          priorityType: priority.type,
          priorityContext: priority.context,
          priorityScore: priority.urgency * priority.impact,
          taskIndex: idx
        });
      });
    });

    // Sort tasks: diagnose first, then by priority score, then by task phase
    const phaseOrder = { diagnose: 0, design: 1, implement: 2, embed: 3, measure: 4 };
    return allTasks.sort((a, b) => {
      // First week: prioritize diagnose tasks from highest priorities
      if (a.phase === 'diagnose' && b.phase !== 'diagnose') return -1;
      if (b.phase === 'diagnose' && a.phase !== 'diagnose') return 1;
      // Then by priority score
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      // Then by phase
      return phaseOrder[a.phase as keyof typeof phaseOrder] - phaseOrder[b.phase as keyof typeof phaseOrder];
    });
  }

  // Distribute tasks across 12 weeks (2 tasks per week, max)
  function distributeTasksToWeeks(taskQueue: any[], ctx: RoadmapContext): any[] {
    const weeks: any[] = [];
    let taskIdx = 0;

    for (let w = 1; w <= 12; w++) {
      const weekTasks: any[] = [];
      
      // Get 2 tasks for this week (or fewer if we run out)
      for (let t = 0; t < 2 && taskIdx < taskQueue.length; t++) {
        const task = taskQueue[taskIdx];
        weekTasks.push({
          id: `w${w}_t${t + 1}`,
          title: task.title,
          description: task.description,
          why: task.why,
          category: task.category,
          priority: task.priorityScore >= 50 ? 'critical' : task.priorityScore >= 30 ? 'high' : 'medium',
          estimatedHours: task.estimatedHours,
          tool: task.tool,
          boardOwner: task.boardOwner,
          successMetric: task.successMetric,
          deliverable: task.deliverable,
          delegationScore: task.delegationScore,
          delegateTo: task.delegateTo
        });
        taskIdx++;
      }

      // Add reflection task if we have 0-1 tasks
      if (weekTasks.length < 2) {
        weekTasks.push({
          id: `w${w}_reflection`,
          title: `Week ${w} Review: What's working for ${ctx.companyName}?`,
          description: `End of week reflection: What worked? What didn't? What's the ONE thing to focus on next week? Journal for 15 minutes.`,
          why: 'Reflection builds strategic thinking muscle',
          category: 'Personal',
          priority: 'medium',
          estimatedHours: 0.5,
          tool: 'Journal',
          boardOwner: 'COO',
          successMetric: 'Review completed, next week priority identified',
          deliverable: 'Week review notes',
          delegationScore: 10,
          delegateTo: 'Personal'
        });
      }

      // Determine week theme from tasks
      const dominantPriority = taskQueue[taskIdx - 2]?.priorityType || taskQueue[taskIdx - 1]?.priorityType || 'general';
      const theme = getThemeFromPriority(dominantPriority, weekTasks[0]?.title || '', w);
      const focus = weekTasks[0]?.description?.substring(0, 60) + '...' || 'Continue progress';

      weeks.push({
        weekNumber: w,
        phase: getPhaseFromWeek(w),
        theme,
        focus,
        tuesdayTransformation: getTuesdayTransformation(w, ctx),
        tasks: weekTasks,
        milestone: weekTasks[0]?.deliverable || `Week ${w} complete`
      });
    }

    return weeks;
  }

  function getThemeFromPriority(priorityType: string, taskTitle: string, week: number): string {
    const themes: Record<string, string> = {
      time_crisis: 'Reclaim Your Time',
      time_optimization: 'Time Efficiency',
      daily_pain: 'Fix the Daily Grind',
      bottleneck: 'Remove the Bottleneck',
      income_growth: 'Income Breakthrough',
      magic_away: 'Eliminate the Drag',
      ideal_life: 'Design Your Ideal Life',
      backslide_prevention: 'Lock In the Gains',
      expertise_gap: 'Build Your Team',
      financial_visibility: 'Financial Clarity',
      general: 'Progress Week'
    };
    const base = themes[priorityType] || themes.general;
    return `Week ${week}: ${taskTitle.substring(0, 40)}...` || `Week ${week}: ${base}`;
  }

  function getPhaseFromWeek(week: number): string {
    if (week <= 2) return 'Diagnose';
    if (week <= 4) return 'Design';
    if (week <= 8) return 'Implement';
    if (week <= 10) return 'Embed';
    return 'Measure';
  }

  function getTuesdayTransformation(week: number, ctx: RoadmapContext): string | undefined {
    if (week === 2) return 'First insights emerging - you now see where time really goes';
    if (week === 4) return 'First systems designed - you have plans not just pain';
    if (week === 6) return `Moving toward: "${ctx.tuesdayTest?.substring(0, 30) || 'your ideal week'}..."`;
    if (week === 8) return 'Implementation underway - change is becoming real';
    if (week === 10) return 'New patterns forming - this is becoming normal';
    if (week === 12) return `Transformation: ${ctx.userName} living closer to the vision`;
    return undefined;
  }

  // EXECUTE THE DYNAMIC GENERATION
  const priorities = analyzePriorities(ctx);
  const taskQueue = generateTaskQueue(priorities);
  const dynamicWeeks = distributeTasksToWeeks(taskQueue, ctx);

  // Legacy compatibility: copy to weeks array  
  dynamicWeeks.forEach(week => weeks.push(week));

  // Define phases for return object
  const phases = [
    { name: 'Diagnose', focus: priorities[0]?.context || 'Understand current state' },
    { name: 'Design', focus: priorities[1]?.context || 'Plan the changes' },
    { name: 'Implement', focus: 'Execute the plan' },
    { name: 'Implement', focus: 'Continue execution' },
    { name: 'Embed', focus: 'Lock in the changes' },
    { name: 'Measure', focus: 'Assess transformation' }
  ];

  return {
    sprintTheme: `90 Days for ${ctx.userName} to ${ctx.tuesdayTest?.substring(0, 40) || 'Transform ' + ctx.companyName}`,
    sprintPromise: `${ctx.userName}, transform from '${ctx.relationshipMirror || 'overwhelmed founder'}' to living '${ctx.tuesdayTest || 'business serving life'}'. Based on YOUR priorities, we'll tackle: ${priorities.slice(0, 3).map(p => p.type.replace('_', ' ')).join(', ')}.`,
    sprintGoals: priorities.slice(0, 3).map(p => `${p.type.replace('_', ' ').charAt(0).toUpperCase() + p.type.replace('_', ' ').slice(1)}: ${p.context.substring(0, 50)}`),
    phases: {
      weeks1_2: { name: 'Diagnose', purpose: 'Understand the real problems' },
      weeks3_4: { name: 'Design', purpose: 'Create solutions' },
      weeks5_6: { name: 'Implement', purpose: 'Execute changes' },
      weeks7_8: { name: 'Implement', purpose: 'Continue execution' },
      weeks9_10: { name: 'Embed', purpose: 'Lock in gains' },
      weeks11_12: { name: 'Measure', purpose: 'Assess transformation' }
    },
    week0_preparation: {
      theme: `${ctx.userName}: Creating Space for Change`,
      tasks: [
        { task: `Block ${ctx.commitmentHours || '10-15 hours'} in calendar`, output: 'Protected time', tool: 'Calendar' },
        { task: `Write down: "${ctx.relationshipMirror || 'How Tuesday feels now'}"`, output: 'Baseline documented', tool: 'Notes' },
        { task: 'Tell one person you\'re doing this', output: 'Accountability partner', tool: 'Conversation' }
      ]
    },
    weeks,
    successMetrics: {
      week4: `Top priorities addressed: ${priorities.slice(0, 2).map(p => p.type).join(', ')}`,
      week8: ctx.targetWorkingHours ? `Working toward ${ctx.targetWorkingHours} hrs/wk` : 'Implementation underway',
      week12: ctx.tuesdayTest ? `Living: "${ctx.tuesdayTest.substring(0, 30)}"` : 'Transformed'
    },
    tuesdayEvolution: {
      week0: ctx.relationshipMirror || 'Exhausted and stretched thin',
      week4: 'First relief - not firefighting daily',
      week8: 'Control emerging - choosing what gets attention',
      week12: ctx.tuesdayTest || 'Business serves life, not the other way around'
    },
    backslidePreventions: [
      { trigger: ctx.dangerZone || 'Overcommitment', response: 'Use calendar blocks as non-negotiable' },
      { trigger: 'Old habits', response: 'Weekly reflection keeps awareness high' }
    ]
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
      .select('assessment_type, responses, client_id')
      .eq('client_id', clientId)
      .in('assessment_type', ['part1', 'part2']);

    if (fetchError) throw new Error(`Failed to fetch: ${fetchError.message}`);

    // CRITICAL: Validate that all assessments belong to this client
    if (assessments && assessments.length > 0) {
      const wrongClientAssessments = assessments.filter((a: any) => a.client_id !== clientId);
      if (wrongClientAssessments.length > 0) {
        console.error(`SECURITY ISSUE: Found ${wrongClientAssessments.length} assessments with mismatched client_id!`);
        throw new Error(`Data integrity error: Assessments do not match client ${clientId}`);
      }
    }

    const part1 = assessments?.find((a: any) => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find((a: any) => a.assessment_type === 'part2')?.responses || {};

    // CRITICAL: Validate assessment responses match the client
    // Get client info to verify assessment data
    const { data: clientInfo } = await supabase
      .from('practice_members')
      .select('email, name')
      .eq('id', clientId)
      .single();
    
    if (clientInfo) {
      const clientEmailLower = clientInfo.email?.toLowerCase() || '';
      const clientNameLower = clientInfo.name?.toLowerCase() || '';
      const clientFirstName = clientNameLower.split(' ')[0] || '';
      
      // Check if part1 has full_name that doesn't match client
      if (part1.full_name) {
        const fullNameLower = part1.full_name.toLowerCase();
        const emailMatch = clientEmailLower.includes(fullNameLower) || fullNameLower.includes(clientEmailLower.split('@')[0]);
        const nameMatch = fullNameLower.includes(clientFirstName) || clientNameLower.includes(fullNameLower);
        
        if (!emailMatch && !nameMatch && fullNameLower.length > 1) {
          console.warn(`⚠️ WARNING: Assessment full_name "${part1.full_name}" doesn't match client "${clientInfo.name}" (${clientInfo.email})`);
          // Don't throw error, but log warning - this might be intentional (nickname, etc.)
        }
      }
      
      // Check for obvious mismatches (e.g., "Tom" in response but client is James)
      if (part1.full_name && part1.full_name.toLowerCase().includes('tom') && 
          !clientEmailLower.includes('tom') && !clientNameLower.includes('tom')) {
        console.error(`CRITICAL: Assessment contains "Tom" but client is ${clientInfo.name} (${clientInfo.email})`);
        throw new Error(`Assessment data mismatch: Assessment contains data for "Tom" but belongs to ${clientInfo.name}. Please regenerate assessments.`);
      }
      
      // Check for fitness/rowing keywords if client email doesn't suggest fitness industry
      if (!clientEmailLower.includes('rowgear') && !clientEmailLower.includes('fitness') && 
          !clientNameLower.includes('tom')) {
        const allText = JSON.stringify({ ...part1, ...part2 }).toLowerCase();
        if ((allText.includes('rowing') || allText.includes('rowgear') || allText.includes('fitness equipment')) &&
            !allText.includes(clientEmailLower.split('@')[0]) && !allText.includes(clientFirstName)) {
          console.warn(`⚠️ WARNING: Assessment contains fitness/rowing keywords but client is ${clientInfo.name} (${clientInfo.email})`);
        }
      }
    }

    // Log what we're actually using for debugging
    console.log(`=== ASSESSMENT DATA FOR CLIENT ${clientId} ===`);
    console.log(`Part 1 keys: ${Object.keys(part1).join(', ')}`);
    console.log(`Part 2 keys: ${Object.keys(part2).join(', ')}`);
    console.log(`Part 1 company_name: ${part1.company_name || 'NOT SET'}`);
    console.log(`Part 2 trading_name: ${part2.trading_name || 'NOT SET'}`);
    console.log(`Part 2 annual_turnover: ${part2.annual_turnover || 'NOT SET'}`);
    console.log(`Part 1 full_name: ${part1.full_name || 'NOT SET'}`);
    if (part1.tuesday_test) console.log(`Part 1 tuesday_test preview: ${part1.tuesday_test.substring(0, 100)}...`);
    if (part2.ten_year_vision) console.log(`Part 2 ten_year_vision preview: ${part2.ten_year_vision.substring(0, 100)}...`);

    // ================================================================
    // FETCH ADVISOR-PROVIDED CONTEXT (for regeneration with new info)
    // ================================================================
    // CRITICAL: Filter shared documents to only include THIS client's content
    let advisorContext: Array<{id: string, type: string, content: string, priority: string}> = [];
    
    // Get client name for entity filtering
    const clientName = part1.full_name || '';
    const clientFirstName = clientName.split(' ')[0].toLowerCase();
    const companyName = (part1.company_name || part2.trading_name || '').toLowerCase();
    
    // Build patterns to identify THIS client's content
    const thisClientPatterns = [clientFirstName, companyName].filter(p => p.length > 2);
    
    // Get OTHER clients in practice to filter OUT their content
    let otherClientPatterns: string[] = [];
    try {
      const { data: otherClients } = await supabase
        .from('practice_members')
        .select('name, email')
        .eq('practice_id', practiceId)
        .eq('member_type', 'client')
        .neq('id', clientId);
      
      if (otherClients) {
        otherClientPatterns = otherClients.flatMap((c: any) => {
          const patterns: string[] = [];
          if (c.name) patterns.push(c.name.split(' ')[0].toLowerCase());
          if (c.email) {
            const domain = c.email.split('@')[1];
            if (domain && !domain.includes('gmail')) {
              patterns.push(domain.split('.')[0].toLowerCase());
            }
          }
          return patterns;
        }).filter(p => p.length > 2);
      }
    } catch (e) {
      console.log('Could not fetch other clients for filtering');
    }
    
    console.log(`Entity filtering: THIS client [${thisClientPatterns.join(', ')}], EXCLUDE [${otherClientPatterns.join(', ')}]`);
    
    try {
      const { data: contextData } = await supabase
        .from('client_context')
        .select('id, context_type, content, priority_level, is_shared, data_source_type, client_id')
        .eq('client_id', clientId)
        .eq('processed', false)
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (contextData && contextData.length > 0) {
        console.log(`Found ${contextData.length} context items for client ${clientId}`);
        for (const c of contextData) {
          // CRITICAL: Double-check client_id matches
          if (c.client_id && c.client_id !== clientId) {
            console.error(`SECURITY ISSUE: Context item ${c.id} has client_id ${c.client_id} but was queried for client ${clientId}!`);
            continue; // Skip this context item
          }
          
          let content = c.content;
          
          // For SHARED documents, filter content by entity
          if (c.is_shared && c.data_source_type === 'transcript') {
            content = filterContentForClient(c.content, thisClientPatterns, otherClientPatterns);
            if (content.length < 50) {
              console.log(`Skipping shared context ${c.id} - no relevant content for ${clientFirstName}`);
              continue; // Skip if no relevant content for this client
            }
          }
          
          // For NON-SHARED documents, ensure they're not accidentally shared
          if (!c.is_shared && c.content.toLowerCase().includes('tom') && c.content.toLowerCase().includes('rowgear')) {
            console.warn(`⚠️ WARNING: Non-shared context ${c.id} contains 'tom' and 'rowgear' - may be incorrectly linked to client ${clientId}`);
          }
          
          advisorContext.push({
            id: c.id,
            type: c.context_type,
            content: content,
            priority: c.priority_level
          });
        }
        console.log(`Found ${advisorContext.length} relevant context items (after entity filtering)`);
      }
    } catch (e) {
      // Table might not exist yet - that's okay
      console.log('No client_context table or no context found');
    }

    // Build comprehensive context
    const context = buildContext(part1, part2);
    console.log(`=== CONTEXT BUILT ===`);
    console.log(`Client ID: ${clientId}`);
    console.log(`Company Name: ${context.companyName}`);
    console.log(`Industry: ${context.industry}`);
    console.log(`Revenue: £${context.revenueNumeric}`);
    console.log(`Is Pre-Revenue: ${context.isPreRevenue}`);
    console.log(`Emotional anchors: ${context.emotionalAnchors.painPhrases.length} pain, ${context.emotionalAnchors.desirePhrases.length} desire`);
    
    // CRITICAL: Validate context matches client expectations
    if (context.industry === 'fitness_equipment' && !part1.tuesday_test?.toLowerCase().includes('rowing') && 
        !part1.tuesday_test?.toLowerCase().includes('fitness') && !part2.trading_name?.toLowerCase().includes('rowgear') &&
        !part1.company_name?.toLowerCase().includes('rowgear') && !part2.ten_year_vision?.toLowerCase().includes('rowing')) {
      console.warn(`⚠️ WARNING: Industry detected as 'fitness_equipment' but no fitness/rowing keywords found in assessment responses!`);
      console.warn(`This may indicate data leakage from another client.`);
    }

    // ================================================================
    // BUILD ADVISOR CONTEXT INJECTION FOR PROMPTS
    // ================================================================
    const advisorContextSection = advisorContext.length > 0 
      ? `
═══════════════════════════════════════════════════════════════════
⚠️ CRITICAL: DATA SOURCE PRIORITY ⚠️
═══════════════════════════════════════════════════════════════════
The following facts are from the client's OFFICIAL ASSESSMENT - use ONLY these:
- CLIENT ID: ${clientId}
- CLIENT NAME: ${context.userName}
- COMPANY NAME: ${context.companyName}
- INDUSTRY: ${context.industry}
- REVENUE: £${context.revenueNumeric.toLocaleString()}
- TEAM SIZE: ${context.teamSize}

⚠️ CRITICAL: DO NOT use company names, industries, or financial figures from the advisor 
context below. The advisor context is for QUALITATIVE insights only.
If the advisor context mentions a different company (like "Rowgear", "Tom", "rowing machines", 
"fitness equipment") or industry that doesn't match ${context.companyName}, IGNORE IT COMPLETELY.
Only use assessment data above for business facts.

═══════════════════════════════════════════════════════════════════
ADVISOR-PROVIDED CONTEXT (FOR QUALITATIVE INSIGHTS ONLY)
═══════════════════════════════════════════════════════════════════
${advisorContext.map(c => `[${c.type.toUpperCase()}${c.priority === 'critical' ? ' - CRITICAL' : c.priority === 'high' ? ' - HIGH PRIORITY' : ''}]:
${c.content}
`).join('\n')}
Use these insights for understanding goals, challenges, and emotions.
DO NOT extract business facts from here - use the assessment data above.
`
      : '';

    // Phase 1: 5-Year Vision (usually not affected by sprint-level context)
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

    // Phase 3: 12-Week Sprint (INJECT ADVISOR CONTEXT HERE)
    console.log('Generating 12-Week Sprint...');
    let sprint;
    try {
      let sprintPrompt = buildSprintPrompt(context, fiveYearVision, sixMonthShift);
      
      // INJECT ADVISOR CONTEXT AT TOP OF SPRINT PROMPT
      if (advisorContextSection) {
        sprintPrompt = advisorContextSection + '\n\n' + sprintPrompt;
        console.log('Injected advisor context into sprint prompt');
      }
      
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

    // Deactivate old roadmaps and delete old tasks
    await supabase.from('client_roadmaps').update({ is_active: false }).eq('client_id', clientId);
    
    // Get current roadmap version
    const { data: existingRoadmaps } = await supabase
      .from('client_roadmaps')
      .select('version')
      .eq('client_id', clientId)
      .order('version', { ascending: false })
      .limit(1);
    
    const newVersion = (existingRoadmaps?.[0]?.version || 0) + 1;

    // Apply cleanup to all string fields in roadmap data
    const cleanedRoadmapData = cleanAllStrings(roadmapData);
    
    // Insert new roadmap with context snapshot
    const { data: savedRoadmap, error: saveError } = await supabase
      .from('client_roadmaps')
      .insert({ 
        practice_id: practiceId, 
        client_id: clientId, 
        roadmap_data: cleanedRoadmapData, 
        is_active: true,
        status: 'pending_review',
        version: newVersion,
        context_snapshot: advisorContext.length > 0 ? advisorContext : null
      })
      .select()
      .single();

    if (saveError) throw new Error(`Failed to save: ${saveError.message}`);

    // ================================================================
    // MARK ADVISOR CONTEXT AS PROCESSED
    // ================================================================
    if (advisorContext.length > 0) {
      const contextIds = advisorContext.map(c => c.id);
      await supabase
        .from('client_context')
        .update({ processed: true })
        .in('id', contextIds);
      console.log(`Marked ${contextIds.length} context items as processed`);
    }

    // Delete old tasks for this client (we'll recreate from new sprint)
    await supabase.from('client_tasks').delete().eq('client_id', clientId);

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

    console.log(`Roadmap v${newVersion} generation complete in ${duration}ms!`);

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
