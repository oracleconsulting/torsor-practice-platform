// ============================================================================
// EDGE FUNCTION: Generate Roadmap (Parts 1 + 2)
// ============================================================================
// This generates the comprehensive 365 transformation roadmap:
// - 5-Year Life Compass (from Part 1 life design + Part 2 business reality)
// - 6-Month Structural Shifts
// - 12-Week Implementation Sprint
//
// This runs AFTER Parts 1 & 2 are complete, BEFORE Part 3 (Hidden Value).
// The Hidden Value Audit is a separate assessment with its own analysis.
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
  repeatedThemes: string[];
}

interface RoadmapContext {
  // Identity
  userName: string;
  companyName: string;
  industry: string;
  
  // Part 1 - Life Design
  tuesdayTest: string;
  emergencyLog: string;
  relationshipMirror: string;
  moneyWorry: string;
  sacrifices: string[];
  commitmentHours: string;
  currentIncome: string;
  desiredIncome: string;
  hasPartners: string;
  dangerZone: string;
  mondayFrustration: string;
  familyFeedback: string;
  twoWeekBreakImpact: string;
  magicAwayTask: string;
  secretPride: string;
  lastExcitement: string;
  helpFears: string;
  
  // Part 2 - Business Deep Dive
  tradingName: string;
  yearsTrading: string;
  tenYearVision: string;
  annualTurnover: string;
  winningBy2030: string;
  sixMonthShifts: string;
  teamSize: string;
  growthBottleneck: string;
  ninetyDayPriorities: string[];
  currentWorkingHours: number;
  targetWorkingHours: number;
  toolsUsed: string[];
  
  // Computed
  isPreRevenue: boolean;
  revenueNumeric: number;
  emotionalAnchors: EmotionalAnchors;
}

// ============================================================================
// EMOTIONAL ANCHOR EXTRACTION
// ============================================================================

function extractEmotionalAnchors(
  part1: Record<string, any>,
  part2: Record<string, any>
): EmotionalAnchors {
  const anchors: EmotionalAnchors = {
    painPhrases: [],
    desirePhrases: [],
    metaphors: [],
    timePatterns: [],
    transformationSignals: [],
    repeatedThemes: []
  };

  const allResponses = { ...part1, ...part2 };

  // Extract from Tuesday Test / 90-Day Fantasy
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  if (tuesdayTest) {
    // Time patterns
    const timeMatches = tuesdayTest.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\b\d+-\d+\b|\bearly\b|\blate\b|\bmorning\b|\bevening\b/gi);
    if (timeMatches) {
      anchors.timePatterns = [...new Set(timeMatches.map((t: string) => t.toLowerCase()))];
    }

    // Pain phrases
    const painWords = ['not', "don't", 'stop', 'no more', 'without', 'never', 'tired of', 'sick of', 'hate'];
    painWords.forEach(word => {
      if (tuesdayTest.toLowerCase().includes(word)) {
        const regex = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]?`, 'gi');
        const matches = tuesdayTest.match(regex);
        if (matches) anchors.painPhrases.push(...matches.map((m: string) => m.trim()));
      }
    });

    // Desire phrases
    const desireWords = ['want', 'wish', 'dream', 'love to', 'finally', 'freedom', 'choose', 'able to'];
    desireWords.forEach(word => {
      if (tuesdayTest.toLowerCase().includes(word)) {
        const regex = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]?`, 'gi');
        const matches = tuesdayTest.match(regex);
        if (matches) anchors.desirePhrases.push(...matches.map((m: string) => m.trim()));
      }
    });
  }

  // Extract metaphors from Relationship Mirror
  const relationshipMirror = part1.relationship_mirror || part1.business_relationship || '';
  if (relationshipMirror) {
    if (relationshipMirror.toLowerCase().includes('feels like')) {
      const metaphorPart = relationshipMirror.toLowerCase().split('feels like').pop() || '';
      const metaphor = metaphorPart.replace(/[.!?].*/, '').trim();
      if (metaphor && metaphor.length > 3) anchors.metaphors.push(metaphor);
    }
    const likeAMatch = relationshipMirror.match(/like a ([^.!?,]+)/i);
    if (likeAMatch) anchors.metaphors.push(likeAMatch[1].trim());
  }

  // Extract from emotion-rich fields
  const emotionFields = [
    'emergency_log', 'money_worry', 'monday_frustration',
    'family_feedback', 'two_week_break_impact', 'magic_away_task',
    'business_secret', 'secret_pride', 'last_excitement',
    'danger_zone', 'help_fears', 'biggest_challenge', 'growth_bottleneck'
  ];

  emotionFields.forEach(field => {
    const content = allResponses[field];
    if (content && typeof content === 'string' && content.length > 15) {
      const painMatches = content.match(/\b(stress|overwhelm|chaos|struggle|worry|fear|exhaust|frustrat|anxious|trapped|drown|spinning|emergency|constant|always|never|can't)\w*\b/gi);
      if (painMatches) anchors.painPhrases.push(...painMatches);

      const aspirationMatches = content.match(/\b(freedom|peace|calm|control|balance|growth|success|achieve|finally|time|family|enjoy|love|happy)\w*\b/gi);
      if (aspirationMatches) anchors.desirePhrases.push(...aspirationMatches);

      const transformMatches = content.match(/\b(change|transform|different|better|improve|grow|build|create|start|stop|more|less)\w*\b/gi);
      if (transformMatches) anchors.transformationSignals.push(...transformMatches);
    }
  });

  // Find repeated themes
  const allText = Object.values(allResponses).filter(v => typeof v === 'string').join(' ').toLowerCase();
  const themeWords = ['time', 'money', 'family', 'freedom', 'stress', 'work', 'team', 'growth', 'control', 'help'];
  themeWords.forEach(word => {
    const count = (allText.match(new RegExp(`\\b${word}\\w*\\b`, 'g')) || []).length;
    if (count >= 3) anchors.repeatedThemes.push(word);
  });

  // Clean and deduplicate
  Object.keys(anchors).forEach(key => {
    const arr = anchors[key as keyof EmotionalAnchors];
    if (Array.isArray(arr)) {
      (anchors as any)[key] = [...new Set(arr.filter(Boolean).map((s: string) => 
        typeof s === 'string' ? s.trim() : s
      ))].slice(0, 10);
    }
  });

  return anchors;
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildContext(part1: Record<string, any>, part2: Record<string, any>): RoadmapContext {
  const anchors = extractEmotionalAnchors(part1, part2);
  
  // Parse revenue
  const turnoverStr = part2.annual_turnover || '';
  let revenueNumeric = 0;
  if (turnoverStr.includes('Under £100k')) revenueNumeric = 50000;
  else if (turnoverStr.includes('£100k-£250k')) revenueNumeric = 175000;
  else if (turnoverStr.includes('£250k-£500k')) revenueNumeric = 375000;
  else if (turnoverStr.includes('£500k-£1m')) revenueNumeric = 750000;
  else if (turnoverStr.includes('£1m-£2.5m')) revenueNumeric = 1750000;
  else if (turnoverStr.includes('£2.5m')) revenueNumeric = 3500000;

  // Detect industry
  const allText = JSON.stringify({ ...part1, ...part2 }).toLowerCase();
  let industry = 'general_business';
  if (allText.includes('rowing') || allText.includes('fitness') || allText.includes('gym')) industry = 'fitness_equipment';
  else if (allText.includes('consult') || allText.includes('advisor')) industry = 'consulting';
  else if (allText.includes('software') || allText.includes('saas') || allText.includes('tech')) industry = 'technology';
  else if (allText.includes('agency') || allText.includes('marketing')) industry = 'agency';
  else if (allText.includes('trade') || allText.includes('construction')) industry = 'trades';

  return {
    userName: part1.full_name || 'Founder',
    companyName: part1.company_name || part2.trading_name || 'Your Business',
    industry,
    
    tuesdayTest: part1.tuesday_test || part1.ninety_day_fantasy || '',
    emergencyLog: part1.emergency_log || '',
    relationshipMirror: part1.relationship_mirror || '',
    moneyWorry: part1.money_worry || '',
    sacrifices: part1.sacrifices || [],
    commitmentHours: part1.commitment_hours || '10-15 hours',
    currentIncome: part1.current_income || '',
    desiredIncome: part1.desired_income || '',
    hasPartners: part1.has_partners || 'No',
    dangerZone: part1.danger_zone || '',
    mondayFrustration: part1.monday_frustration || '',
    familyFeedback: part1.family_feedback || '',
    twoWeekBreakImpact: part1.two_week_break_impact || '',
    magicAwayTask: part1.magic_away_task || '',
    secretPride: part1.secret_pride || '',
    lastExcitement: part1.last_excitement || '',
    helpFears: part1.help_fears || '',
    
    tradingName: part2.trading_name || '',
    yearsTrading: part2.years_trading || '',
    tenYearVision: part2.ten_year_vision || '',
    annualTurnover: part2.annual_turnover || '',
    winningBy2030: part2.winning_2030 || '',
    sixMonthShifts: part2.six_month_shifts || '',
    teamSize: part2.team_size || 'solo',
    growthBottleneck: part2.growth_bottleneck || '',
    ninetyDayPriorities: part2.ninety_day_priorities || [],
    currentWorkingHours: parseInt(part2.current_working_hours) || 50,
    targetWorkingHours: parseInt(part2.target_working_hours) || 35,
    toolsUsed: part2.current_tools || [],
    
    isPreRevenue: revenueNumeric === 0,
    revenueNumeric,
    emotionalAnchors: anchors
  };
}

// ============================================================================
// PROMPTS
// ============================================================================

const FIVE_YEAR_VISION_PROMPT = `You are an emotionally intelligent advisor who creates deeply personal transformation narratives. You excel at recognising that true success isn't just financial growth - it's about creating a business that enhances life rather than consuming it.

FOUNDER'S COMPLETE JOURNEY (their exact words):

=== PART 1: LIFE DESIGN ===
Name: {userName}
Company: {companyName}
Tuesday Test/90-Day Fantasy: "{tuesdayTest}"
Business Relationship (metaphor): "{relationshipMirror}"
Money Worry: "{moneyWorry}"
What They've Sacrificed: {sacrifices}
Emergency Log: "{emergencyLog}"
Danger Zone: "{dangerZone}"
Monday Frustration: "{mondayFrustration}"
Family Feedback: "{familyFeedback}"
Two Week Break Impact: "{twoWeekBreakImpact}"
What They'd Magic Away: "{magicAwayTask}"
Secret Pride: "{secretPride}"
Last Excitement: "{lastExcitement}"
Help Fears: "{helpFears}"

=== PART 2: BUSINESS REALITY ===
Industry: {industry}
Years Trading: {yearsTrading}
Annual Turnover: {annualTurnover}
Current Personal Income: {currentIncome}
Desired Personal Income: {desiredIncome}
Current Working Hours: {currentWorkingHours} hours/week
Target Working Hours: {targetWorkingHours} hours/week
Team Size: {teamSize}
10-Year Vision: "{tenYearVision}"
Winning by 2030: "{winningBy2030}"
Biggest Challenge: "{growthBottleneck}"
Time Commitment Available: {commitmentHours}
90-Day Priorities: {ninetyDayPriorities}

=== EMOTIONAL PATTERNS DETECTED ===
Pain phrases (their exact words): {painPhrases}
Desire phrases (their exact words): {desirePhrases}
Metaphors they use: {metaphors}
Time patterns mentioned: {timePatterns}
Repeated themes: {repeatedThemes}

CRITICAL INSTRUCTIONS:
1. Write in SECOND PERSON - speak directly to them ("You" not "They")
2. Use their EXACT emotional phrases naturally throughout - weave their actual quotes
3. Mirror their communication style and energy
4. Show them a path where success means LESS stress, not more
5. Make them feel truly understood - "How did you know that about me?"

Return as JSON:
{
  "tagline": "A short aspirational tagline for their transformation",
  "transformationStory": {
    "currentReality": {
      "title": "Your Current Reality: [use their exact phrase]",
      "narrative": "3-4 paragraphs (300+ words) describing where they are now using their EXACT quotes"
    },
    "turningPoint": {
      "title": "Your Turning Point",
      "narrative": "2-3 paragraphs (200+ words) about the breakthrough moment"
    },
    "visionAchieved": {
      "title": "Your Vision Achieved: [use their winning_2030 phrase]",
      "narrative": "3-4 paragraphs (300+ words) painting their success IN THEIR TERMS"
    }
  },
  "yearMilestones": {
    "year1": {
      "headline": "From [current state] to [first shift]",
      "story": "Full paragraph (100+ words) showing what specifically changes",
      "measurable": "Specific metrics"
    },
    "year3": {
      "headline": "The Transformation Deepens",
      "story": "Full paragraph (100+ words)",
      "measurable": "Their target working hours achieved, income goals met"
    },
    "year5": {
      "headline": "[Their exact winning_2030 phrase]",
      "story": "Full paragraph (100+ words)",
      "measurable": "Their specific vision quantified"
    }
  },
  "northStar": "One powerful sentence using their EXACT words - the filter for every decision",
  "archetype": "freedom_seeker|empire_builder|lifestyle_designer|impact_maker|balanced_achiever",
  "emotionalCore": "2-3 sentences explaining the deep truth about what they're really seeking"
}`;

const SIX_MONTH_SHIFT_PROMPT = `Based on the founder's 5-year vision, create a detailed 6-month shift plan.

FIVE-YEAR VISION CONTEXT:
{fiveYearVision}

CURRENT REALITY:
- Business: {companyName} ({industry})
- Revenue: {annualTurnover} (Numeric: £{revenueNumeric})
- Pre-revenue: {isPreRevenue}
- Time Available: {commitmentHours}
- Team Size: {teamSize}
- Current Working Hours: {currentWorkingHours}/week
- Target Working Hours: {targetWorkingHours}/week

THEIR SPECIFIC PAIN POINTS:
- Biggest Challenge: "{growthBottleneck}"
- Money Worry: "{moneyWorry}"
- Danger Zone: "{dangerZone}"
- What They'd Magic Away: "{magicAwayTask}"
- 90-Day Priorities: {ninetyDayPriorities}

EMOTIONAL ANCHORS:
Pain phrases: {painPhrases}
Desire phrases: {desirePhrases}

Return as JSON:
{
  "shiftOverview": "3-4 sentences summarizing what this 6 months will achieve using their words",
  "month1_2": {
    "theme": "Short theme name",
    "focus": "Clear description connecting to their biggest pain",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "X hours/week",
    "howYoullFeel": "Emotional shift they'll experience"
  },
  "month3_4": {
    "theme": "Theme building on months 1-2",
    "focus": "Building momentum",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "Hours/week",
    "howYoullFeel": "Progress description"
  },
  "month5_6": {
    "theme": "Theme approaching year 1",
    "focus": "Consolidation and scaling",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "Hours/week",
    "howYoullFeel": "How they feel approaching year 1"
  },
  "quickWins": ["Something achievable THIS WEEK", "Something in first month"],
  "dangerMitigation": "How this addresses their danger zone",
  "northStarAlignment": "How each phase moves toward their north star"
}`;

const TWELVE_WEEK_SPRINT_PROMPT = `Create a comprehensive 12-week sprint for {companyName}.

THE 365 METHOD:
- 365 days to transform (not just grow)
- Every week moves them closer to their ideal Tuesday
- Progress measured in life quality, not just revenue

SIX-MONTH SHIFTS:
{sixMonthShift}

FIVE-YEAR COMPASS:
North Star: {northStar}
Emotional Core: {emotionalCore}
Year 1 Target: {year1Target}

BUSINESS CONTEXT:
- Industry: {industry}
- Revenue: £{revenueNumeric} (Pre-revenue: {isPreRevenue})
- Team: {teamSize}
- Current hours: {currentWorkingHours}/week → Target: {targetWorkingHours}/week
- Tools: {toolsUsed}

EMOTIONAL DRIVERS:
- Biggest pain: "{growthBottleneck}"
- 90-day fantasy: "{tuesdayTest}"
- Money worry: "{moneyWorry}"
- Danger zone: "{dangerZone}"
- Magic away: "{magicAwayTask}"

CONSTRAINTS:
- Available time: {commitmentHours}
- 90-day priorities: {ninetyDayPriorities}

Return as JSON with ALL 12 weeks:
{
  "sprintTheme": "Theme connecting to their 90-day fantasy",
  "sprintPromise": "In 90 days, transform from [current] to [ideal]",
  "sprintGoals": ["Primary goal", "Secondary goal", "Tertiary goal"],
  "phases": {
    "weeks1_2": { "name": "Immediate Relief", "purpose": "Quick wins" },
    "weeks3_4": { "name": "Foundation Building", "purpose": "Root causes" },
    "weeks5_6": { "name": "Momentum", "purpose": "Scale what works" },
    "weeks7_8": { "name": "Lock-In", "purpose": "Make permanent" },
    "weeks9_10": { "name": "Scale", "purpose": "Multiply" },
    "weeks11_12": { "name": "Transform", "purpose": "New version" }
  },
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Immediate Relief",
      "theme": "Specific theme",
      "tuesdayTransformation": "How Tuesday feels different",
      "focus": "ONE thing to focus on",
      "tasks": [
        {
          "id": "w1_t1",
          "title": "Task title",
          "description": "Clear instructions",
          "why": "Connection to pain/desire",
          "category": "Operations|Systems|People|Financial|Marketing",
          "priority": "critical|high|medium",
          "estimatedHours": 1,
          "deliverable": "Specific output"
        }
      ],
      "milestone": "Success by end of week",
      "celebrationPrompt": "How to recognize wins"
    }
    // ... weeks 2-12 with similar structure
  ],
  "successMetrics": {
    "week4": "Foundation solid",
    "week8": "Momentum locked",
    "week12": "Transformed"
  },
  "tuesdayEvolution": {
    "week0": "Current Tuesday feeling",
    "week4": "First shift",
    "week8": "New patterns",
    "week12": "New normal"
  }
}

Generate ALL 12 weeks with 3-5 tasks each.`;

// ============================================================================
// LLM HELPERS
// ============================================================================

async function callLLM(prompt: string, context: RoadmapContext): Promise<string> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

  let filledPrompt = prompt;
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    let stringValue: string;
    if (Array.isArray(value)) stringValue = JSON.stringify(value);
    else if (typeof value === 'object' && value !== null) stringValue = JSON.stringify(value);
    else stringValue = String(value || '');
    filledPrompt = filledPrompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
  });

  if (context.emotionalAnchors) {
    filledPrompt = filledPrompt
      .replace(/{painPhrases}/g, JSON.stringify(context.emotionalAnchors.painPhrases))
      .replace(/{desirePhrases}/g, JSON.stringify(context.emotionalAnchors.desirePhrases))
      .replace(/{metaphors}/g, JSON.stringify(context.emotionalAnchors.metaphors))
      .replace(/{timePatterns}/g, JSON.stringify(context.emotionalAnchors.timePatterns))
      .replace(/{repeatedThemes}/g, JSON.stringify(context.emotionalAnchors.repeatedThemes));
  }

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
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You create deeply personal transformation narratives. Write in second person. Use their exact quotes. Always return valid JSON.' },
        { role: 'user', content: filledPrompt }
      ]
    })
  });
  
  if (!response.ok) throw new Error(`OpenRouter error: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJson(text: string): any {
  if (!text) throw new Error('Empty LLM response');
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('No valid JSON found');
  const jsonStr = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    const fixed = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x1f]/g, ' ');
    return JSON.parse(fixed);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, regenerate } = await req.json();

    if (!clientId || !practiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing clientId or practiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating roadmap for client ${clientId}...`);
    const startTime = Date.now();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Parts 1 & 2 only (Part 3 is separate value analysis)
    const { data: assessments, error: fetchError } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses, status')
      .eq('client_id', clientId)
      .in('assessment_type', ['part1', 'part2']);

    if (fetchError) throw new Error(`Failed to fetch assessments: ${fetchError.message}`);

    const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};

    // Build context
    const context = buildContext(part1, part2);
    console.log('Context built for', context.companyName);
    console.log('Emotional anchors:', context.emotionalAnchors.painPhrases.length, 'pain phrases');

    // ========================================
    // PHASE 1: 5-Year Vision
    // ========================================
    console.log('Generating 5-Year Vision...');
    const visionResponse = await callLLM(FIVE_YEAR_VISION_PROMPT, context);
    const fiveYearVision = extractJson(visionResponse);
    console.log('Vision:', fiveYearVision.northStar?.substring(0, 50) + '...');

    // ========================================
    // PHASE 2: 6-Month Shift
    // ========================================
    console.log('Generating 6-Month Shift...');
    const shiftContext = {
      ...context,
      fiveYearVision: JSON.stringify(fiveYearVision),
      northStar: fiveYearVision.northStar || '',
      archetype: fiveYearVision.archetype || 'balanced_achiever'
    } as any;
    const shiftResponse = await callLLM(SIX_MONTH_SHIFT_PROMPT, shiftContext);
    const sixMonthShift = extractJson(shiftResponse);
    console.log('6-Month Shift generated');

    // ========================================
    // PHASE 3: 12-Week Sprint
    // ========================================
    console.log('Generating 12-Week Sprint...');
    const sprintContext = {
      ...context,
      sixMonthShift: JSON.stringify(sixMonthShift),
      northStar: fiveYearVision.northStar || '',
      emotionalCore: fiveYearVision.emotionalCore || '',
      year1Target: fiveYearVision.yearMilestones?.year1?.measurable || ''
    } as any;
    const sprintResponse = await callLLM(TWELVE_WEEK_SPRINT_PROMPT, sprintContext);
    const sprint = extractJson(sprintResponse);
    console.log('12-Week Sprint:', sprint.weeks?.length || 0, 'weeks');

    const duration = Date.now() - startTime;

    // Build roadmap data
    const roadmapData = {
      fiveYearVision,
      sixMonthShift,
      sprint,
      summary: {
        headline: fiveYearVision.tagline || `${context.companyName}'s Transformation`,
        northStar: fiveYearVision.northStar,
        keyInsight: sixMonthShift.shiftOverview,
        expectedOutcome: fiveYearVision.yearMilestones?.year1?.measurable
      },
      priorities: sprint.sprintGoals?.map((goal: string, i: number) => ({
        rank: i + 1, title: goal, description: goal, category: 'Strategic'
      })) || [],
      weeks: sprint.weeks || [],
      generatedAt: new Date().toISOString(),
      generationDurationMs: duration
    };

    // Deactivate old roadmaps
    await supabase.from('client_roadmaps').update({ is_active: false }).eq('client_id', clientId);

    // Insert new (value_analysis will be added by separate function after Part 3)
    const { data: savedRoadmap, error: saveError } = await supabase
      .from('client_roadmaps')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        roadmap_data: roadmapData,
        is_active: true
      })
      .select()
      .single();

    if (saveError) throw new Error(`Failed to save: ${saveError.message}`);

    // Create tasks
    if (sprint.weeks?.length > 0) {
      const tasks = sprint.weeks.flatMap((week: any) =>
        (week.tasks || []).map((task: any, i: number) => ({
          practice_id: practiceId,
          client_id: clientId,
          roadmap_id: savedRoadmap.id,
          week_number: week.weekNumber,
          title: task.title,
          description: task.description,
          category: task.category || 'General',
          priority: task.priority || 'medium',
          estimated_hours: task.estimatedHours || 1,
          sort_order: i,
          status: 'pending'
        }))
      );
      if (tasks.length > 0) {
        await supabase.from('client_tasks').insert(tasks);
        console.log(`Created ${tasks.length} tasks`);
      }
    }

    console.log('Roadmap generation complete!');

    return new Response(
      JSON.stringify({
        success: true,
        roadmapId: savedRoadmap.id,
        summary: {
          headline: roadmapData.summary.headline,
          northStar: fiveYearVision.northStar,
          archetype: fiveYearVision.archetype,
          weekCount: sprint.weeks?.length || 0,
          taskCount: sprint.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || 0
        },
        usage: { durationMs: duration, llmCalls: 3 }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
