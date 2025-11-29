// ============================================================================
// EDGE FUNCTION: Generate Complete 365 Transformation Analysis
// ============================================================================
// Implements the Oracle Method:
// 1. Extract Emotional Anchors from assessments
// 2. Generate 5-Year Vision (life transformation, not just business)
// 3. Generate 6-Month Shift (structural changes)
// 4. Generate 12-Week Sprint (weekly tasks with Tuesday Test evolution)
// 5. Value Analysis (rule-based scoring)

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
}

interface AssessmentContext {
  // Part 1 - Life Design
  userName: string;
  companyName: string;
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
  
  // Part 3 - Hidden Value
  knowledgeDependency: number;
  personalBrand: number;
  competitiveMoat: string[];
  undocumentedProcesses: string[];
  
  // Computed
  industry: string;
  isPreRevenue: boolean;
  revenueNumeric: number;
  emotionalAnchors: EmotionalAnchors;
}

// ============================================================================
// EMOTIONAL ANCHOR EXTRACTION
// ============================================================================

function extractEmotionalAnchors(
  part1: Record<string, any>,
  part2: Record<string, any>,
  part3: Record<string, any>
): EmotionalAnchors {
  const anchors: EmotionalAnchors = {
    painPhrases: [],
    desirePhrases: [],
    metaphors: [],
    timePatterns: [],
    transformationSignals: []
  };

  // Tuesday Test / 90-Day Fantasy - extract their vision elements
  const tuesday = part1.tuesday_test || part1.ninety_day_fantasy || '';
  if (tuesday) {
    // Find time references
    const timeMatches = tuesday.toLowerCase().match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\bearly\b|\blate\b|\bmorning\b|\bevening\b/g);
    if (timeMatches) anchors.timePatterns = [...new Set(timeMatches)];
    
    // Extract pain phrases (what they want to stop)
    const painWords = ['not', "don't", 'stop', 'no more', 'without', 'never', 'tired of', 'sick of'];
    painWords.forEach(word => {
      if (tuesday.toLowerCase().includes(word)) {
        const regex = new RegExp(`[^.]*${word}[^.]*`, 'gi');
        const matches = tuesday.match(regex);
        if (matches) anchors.painPhrases.push(...matches.map(m => m.trim()));
      }
    });
    
    // Extract desire phrases
    const desireWords = ['want', 'wish', 'dream', 'love to', 'finally', 'freedom', 'choose', 'able to'];
    desireWords.forEach(word => {
      if (tuesday.toLowerCase().includes(word)) {
        const regex = new RegExp(`[^.]*${word}[^.]*`, 'gi');
        const matches = tuesday.match(regex);
        if (matches) anchors.desirePhrases.push(...matches.map(m => m.trim()));
      }
    });
  }

  // Relationship Mirror - extract their metaphor
  const relationship = part1.relationship_mirror || '';
  if (relationship && relationship.toLowerCase().includes('feels like')) {
    const metaphorPart = relationship.toLowerCase().split('feels like')[1];
    if (metaphorPart) {
      const metaphor = metaphorPart.split(/[.!?]/)[0].trim();
      if (metaphor) anchors.metaphors.push(metaphor);
    }
  }

  // Emergency Log - extract pain patterns
  const emergencyLog = part1.emergency_log || '';
  if (emergencyLog) {
    const emotionalWords = emergencyLog.toLowerCase().match(
      /\b(stress|overwhelm|chaos|struggle|worry|fear|exhaust|frustrat|anxious|trapped|drown|spinning|emergency|constantly|always)\w*\b/g
    );
    if (emotionalWords) anchors.painPhrases.push(...emotionalWords);
  }

  // Money Worry
  const moneyWorry = part1.money_worry || part2.money_worry || '';
  if (moneyWorry) {
    anchors.painPhrases.push(moneyWorry);
  }

  // Biggest Challenge
  const challenge = part2.growth_bottleneck || part2.biggest_challenge || '';
  if (challenge) {
    anchors.painPhrases.push(challenge);
  }

  // Clean duplicates
  Object.keys(anchors).forEach(key => {
    anchors[key as keyof EmotionalAnchors] = [...new Set(anchors[key as keyof EmotionalAnchors])].filter(Boolean);
  });

  return anchors;
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildContext(
  part1: Record<string, any>,
  part2: Record<string, any>,
  part3: Record<string, any>
): AssessmentContext {
  const anchors = extractEmotionalAnchors(part1, part2, part3);
  
  // Parse revenue
  const turnoverStr = part2.annual_turnover || '';
  let revenueNumeric = 0;
  if (turnoverStr.includes('Under £100k')) revenueNumeric = 50000;
  else if (turnoverStr.includes('£100k-£250k')) revenueNumeric = 175000;
  else if (turnoverStr.includes('£250k-£500k')) revenueNumeric = 375000;
  else if (turnoverStr.includes('£500k-£1m')) revenueNumeric = 750000;
  else if (turnoverStr.includes('£1m')) revenueNumeric = 2500000;

  return {
    userName: part1.full_name || 'Founder',
    companyName: part1.company_name || part2.trading_name || 'Your Business',
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
    
    tradingName: part2.trading_name || '',
    yearsTrading: part2.years_trading || '',
    tenYearVision: part2.ten_year_vision || '',
    annualTurnover: part2.annual_turnover || '',
    winningBy2030: part2.winning_2030 || '',
    sixMonthShifts: part2.six_month_shifts || '',
    teamSize: part2.team_size || 'solo',
    growthBottleneck: part2.growth_bottleneck || '',
    ninetyDayPriorities: part2.ninety_day_priorities || [],
    
    knowledgeDependency: parseInt(part3.knowledge_dependency_percentage) || 0,
    personalBrand: parseInt(part3.personal_brand_percentage) || 0,
    competitiveMoat: part3.competitive_moat || [],
    undocumentedProcesses: part3.critical_processes_undocumented || [],
    
    industry: 'general_business',
    isPreRevenue: revenueNumeric === 0,
    revenueNumeric,
    emotionalAnchors: anchors
  };
}

// ============================================================================
// THE 365 METHOD PROMPTS
// ============================================================================

const FIVE_YEAR_VISION_PROMPT = `You are an emotionally intelligent advisor who creates deeply personal transformation narratives. You understand that true success isn't just financial growth - it's about creating a business that enhances life rather than consuming it.

FOUNDER'S COMPLETE JOURNEY (their exact words):

=== PART 1: LIFE DESIGN ===
Tuesday Test/90-Day Fantasy: "{tuesdayTest}"
Business Relationship: "{relationshipMirror}"
Money Worry: "{moneyWorry}"
What They've Sacrificed: {sacrifices}
Emergency Log: "{emergencyLog}"
Danger Zone: "{dangerZone}"

=== PART 2: BUSINESS REALITY ===
Current Personal Income: {currentIncome}
Desired Personal Income: {desiredIncome}
Business Turnover: {annualTurnover}
10-Year Vision: "{tenYearVision}"
Winning by 2030: "{winningBy2030}"
Biggest Challenge: "{growthBottleneck}"
Time Commitment Available: {commitmentHours}
Team Size: {teamSize}

=== PART 3: HIDDEN VALUE ===
Knowledge Dependency: {knowledgeDependency}%
Personal Brand Dependency: {personalBrand}%
Undocumented Processes: {undocumentedProcesses}

=== EMOTIONAL PATTERNS DETECTED ===
Pain phrases: {painPhrases}
Desire phrases: {desirePhrases}
Metaphors used: {metaphors}

THE CORE INSIGHT:
This founder isn't just seeking more money or growth. They're seeking a specific quality of life. Look at what they've sacrificed. Notice what they say about their business relationship - that reveals the real cost. Their emergency log tells you what keeps interrupting their life.

CRITICAL INSTRUCTIONS:
1. Identify the LIFE they want, not just the business they want
2. Use their EXACT emotional phrases naturally throughout
3. Mirror their communication style and energy
4. Show them a path where success means LESS stress, not more
5. Make them feel truly understood

Create a 5-year vision that shows them how to build a business that serves their life, not the other way around.

Return as JSON:
{
  "narrative": "2-3 paragraphs that paint their transformation journey. Start with their current struggle (using their exact pain words), show the turning point, then paint their achieved vision. This must sound like THEIR story.",
  
  "year1": {
    "headline": "Their first crucial shift",
    "story": "2-3 sentences showing what changes - likely boundaries, systems, delegation",
    "measurable": "Specific improvements"
  },
  
  "year3": {
    "headline": "The transformation deepens",
    "story": "2-3 sentences showing their new normal",
    "measurable": "Their target working hours achieved, income goals met"
  },
  
  "year5": {
    "headline": "Living their definition of winning",
    "story": "Their version of success achieved - not generic, THEIR success",
    "measurable": "Their specific vision quantified"
  },
  
  "northStar": "One powerful line capturing their core desire using their EXACT words",
  
  "emotionalCore": "The deep truth about what they're really seeking"
}`;

const SIX_MONTH_SHIFT_PROMPT = `Based on the founder's 5-year vision, create a 6-month shift plan that bridges their current reality to their year 1 goals.

5-YEAR VISION CONTEXT:
{fiveYearVision}

CURRENT REALITY:
- Business: {companyName}
- Revenue: {annualTurnover}
- Time Available: {commitmentHours}
- Team Size: {teamSize}
- Biggest Challenge: {growthBottleneck}
- Danger Zone: {dangerZone}
- 90-Day Priorities: {ninetyDayPriorities}

Create a 6-month shift plan that:
1. Addresses their immediate pain points using their language
2. Makes progress toward their year 1 vision
3. Respects their time constraints
4. Focuses on highest-impact activities

Return as JSON:
{
  "overview": "2-3 sentences summarizing what this 6 months will achieve, using their words",
  
  "month1_2": {
    "theme": "Short theme name",
    "focus": "What to focus on",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "X hours/week on Y"
  },
  
  "month3_4": {
    "theme": "Short theme name",
    "focus": "What to focus on",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"]
  },
  
  "month5_6": {
    "theme": "Short theme name",
    "focus": "What to focus on",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"]
  },
  
  "quickWins": ["Win they can achieve in week 1", "Win in month 1"],
  
  "dangerMitigation": "How this shift addresses their specific danger zone",
  
  "northStarAlignment": "How this moves them toward their north star"
}`;

const TWELVE_WEEK_SPRINT_PROMPT = `Create a 12-week transformation sprint for {companyName}. This is about changing HOW they work, not just WHAT they do.

THE 365 METHOD FOUNDATION:
- Every week must move them closer to their ideal Tuesday feeling
- Progress is measured in life quality improvement, not just revenue
- Build in backslide prevention and celebrations

6-MONTH SHIFTS:
{sixMonthShift}

5-YEAR COMPASS:
North Star: {northStar}
Emotional Core: {emotionalCore}
Year 1 Target: {year1Target}

BUSINESS SPECIFICS:
- Business: {companyName}
- Revenue: {annualTurnover}
- Team: {teamSize}
- Current tools mentioned: {toolsUsed}
- Commitment: {commitmentHours}

EMOTIONAL DRIVERS (USE THESE EXACT WORDS):
- Their biggest pain: "{growthBottleneck}"
- Their 90-day fantasy: "{tuesdayTest}"
- Money worry: "{moneyWorry}"
- Emergency log: "{emergencyLog}"
- Danger zone: "{dangerZone}"

CONSTRAINTS:
- Available time: {commitmentHours}
- 90-day priorities: {ninetyDayPriorities}

Create 12 weeks following this structure:

{
  "sprintTheme": "Overarching theme connecting to their 90-day fantasy",
  
  "sprintPromise": "In 90 days, transform from X to Y",
  
  "sprintGoals": ["Goal 1", "Goal 2", "Goal 3"],
  
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Immediate Relief",
      "theme": "Specific theme for this week",
      "focus": "The ONE thing to focus on",
      "tasks": [
        {
          "id": "w1-t1",
          "title": "Task title",
          "description": "Clear actionable instructions",
          "category": "Operations|People|Systems|Financial|Marketing",
          "priority": "critical|high|medium",
          "estimatedHours": 2
        }
      ],
      "milestone": "What success looks like this week",
      "tuesdayEvolution": "How their Tuesday starts to feel different"
    }
  ],
  
  "successMetrics": [
    {"metric": "Name", "baseline": "Current state", "target": "90-day goal"}
  ],
  
  "tuesdayTestEvolution": {
    "week0": "Current Tuesday feeling",
    "week4": "First shift",
    "week8": "Momentum building",
    "week12": "Transformed"
  }
}

PHASES TO FOLLOW:
- Weeks 1-2: Immediate Relief (quick wins, pain reduction)
- Weeks 3-4: Foundation Building (systems, processes)
- Weeks 5-6: Momentum Multiplication (scale what works)
- Weeks 7-8: Lock-In Phase (make changes permanent)
- Weeks 9-10: Scale Phase (multiply success)
- Weeks 11-12: Transform Phase (become the new version)

Every task must be specific to their situation. Reference their emotional language throughout.`;

// ============================================================================
// VALUE ANALYSIS (Rule-Based - No LLM Cost)
// ============================================================================

function calculateValueAnalysis(part3: Record<string, any>, context: AssessmentContext): any {
  const assetScores = [];
  
  // Intellectual Capital
  let icScore = 50;
  const undocumented = part3.critical_processes_undocumented || [];
  if (undocumented.length > 4) icScore -= undocumented.length * 5;
  const dependency = parseInt(part3.knowledge_dependency_percentage) || 0;
  if (dependency > 67) icScore -= 20;
  
  assetScores.push({
    category: 'Intellectual Capital',
    score: Math.max(0, Math.min(100, icScore)),
    percentage: Math.max(0, Math.min(100, icScore)),
    issues: dependency > 67 ? [`${dependency}% knowledge dependency on founder`] : [],
    opportunities: undocumented.length > 0 ? ['Document critical processes'] : []
  });
  
  // Brand & Trust
  let btScore = 50;
  const personalBrand = parseInt(part3.personal_brand_percentage) || 0;
  if (personalBrand > 60) btScore -= 25;
  
  assetScores.push({
    category: 'Brand & Trust',
    score: Math.max(0, Math.min(100, btScore)),
    percentage: Math.max(0, Math.min(100, btScore)),
    issues: personalBrand > 60 ? [`${personalBrand}% buy from you personally`] : [],
    opportunities: ['Build business brand independent of founder']
  });
  
  // Systems & Scale
  let ssScore = 50;
  let failedProcesses = 0;
  ['autonomy_sales', 'autonomy_delivery', 'autonomy_finance'].forEach(f => {
    if (part3[f] === 'Would fail') failedProcesses++;
  });
  if (failedProcesses > 1) ssScore -= failedProcesses * 12;
  
  assetScores.push({
    category: 'Systems & Scale',
    score: Math.max(0, Math.min(100, ssScore)),
    percentage: Math.max(0, Math.min(100, ssScore)),
    issues: failedProcesses > 1 ? [`${failedProcesses} processes would fail without you`] : [],
    opportunities: ['Systematize key operations']
  });
  
  // People & Culture
  let pcScore = 50;
  let noSuccession = 0;
  if (part3.succession_your_role === 'Nobody') noSuccession++;
  if (noSuccession > 0) pcScore -= noSuccession * 15;
  
  assetScores.push({
    category: 'People & Culture',
    score: Math.max(0, Math.min(100, pcScore)),
    percentage: Math.max(0, Math.min(100, pcScore)),
    issues: noSuccession > 0 ? ['No succession plan for your role'] : [],
    opportunities: ['Develop succession planning']
  });
  
  const overallScore = Math.round(assetScores.reduce((sum, s) => sum + s.score, 0) / assetScores.length);
  
  // Risk Register
  const riskRegister = [];
  if (dependency > 80) {
    riskRegister.push({
      title: 'Critical Knowledge Concentration',
      severity: 'Critical',
      impact: `${dependency}% of business knowledge inaccessible if founder unavailable`,
      mitigation: 'Immediate documentation of critical processes'
    });
  }
  if (failedProcesses > 1) {
    riskRegister.push({
      title: 'Founder Dependency',
      severity: 'High',
      impact: `${failedProcesses} processes would fail without you`,
      mitigation: 'Cross-train team and document SOPs'
    });
  }
  
  // Value Gaps
  const valueGaps = [];
  if (undocumented.length > 0) {
    valueGaps.push({
      area: 'Process Documentation',
      gap: undocumented.length * 50000,
      effort: 'Medium',
      actions: [`Document "${undocumented[0]}" process first`]
    });
  }
  
  return {
    assetScores,
    overallScore,
    riskRegister,
    valueGaps,
    totalOpportunity: valueGaps.reduce((sum, g) => sum + g.gap, 0),
    generatedAt: new Date().toISOString()
  };
}

// ============================================================================
// LLM CALL HELPER
// ============================================================================

async function callLLM(prompt: string, context: AssessmentContext): Promise<string> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');
  
  // Replace placeholders in prompt
  let filledPrompt = prompt;
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    const stringValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
    filledPrompt = filledPrompt.replace(new RegExp(placeholder, 'g'), stringValue);
  });
  
  // Also replace emotional anchors
  if (context.emotionalAnchors) {
    filledPrompt = filledPrompt.replace('{painPhrases}', JSON.stringify(context.emotionalAnchors.painPhrases));
    filledPrompt = filledPrompt.replace('{desirePhrases}', JSON.stringify(context.emotionalAnchors.desirePhrases));
    filledPrompt = filledPrompt.replace('{metaphors}', JSON.stringify(context.emotionalAnchors.metaphors));
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co',
      'X-Title': 'Torsor 365 Alignment'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating deeply personal narratives that make founders feel truly seen and understood. Always return valid JSON.'
        },
        { role: 'user', content: filledPrompt }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`LLM API error: ${await response.text()}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Extract JSON from LLM response (handles markdown code blocks)
function extractJson(text: string): any {
  if (!text) throw new Error('Empty LLM response');
  
  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // Find JSON object boundaries
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  
  if (start === -1 || end === -1 || end < start) {
    console.error('No JSON found in response:', text.substring(0, 200));
    throw new Error('No valid JSON object found in LLM response');
  }
  
  const jsonStr = cleaned.substring(start, end + 1);
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try to fix common issues
    const fixed = jsonStr
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/[\x00-\x1f]/g, ' '); // Remove control characters
    
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      console.error('JSON parse failed. First 500 chars:', jsonStr.substring(0, 500));
      throw new Error(`Failed to parse JSON: ${e2.message}`);
    }
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

    console.log(`Starting 365 Analysis for client ${clientId}...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all assessments
    const { data: assessments, error: fetchError } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses, status')
      .eq('client_id', clientId);

    if (fetchError) throw new Error(`Failed to fetch assessments: ${fetchError.message}`);

    const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
    const part3 = assessments?.find(a => a.assessment_type === 'part3')?.responses || {};

    // Build context
    const context = buildContext(part1, part2, part3);
    console.log('Context built:', context.companyName, context.emotionalAnchors.painPhrases.length, 'pain phrases');

    // Value Analysis (free - rule-based)
    const valueAnalysis = calculateValueAnalysis(part3, context);
    console.log('Value analysis complete. Score:', valueAnalysis.overallScore);

    // Generate 5-Year Vision
    console.log('Generating 5-Year Vision...');
    const startTime = Date.now();
    const visionResponse = await callLLM(FIVE_YEAR_VISION_PROMPT, context);
    const fiveYearVision = extractJson(visionResponse);
    console.log('Vision generated:', fiveYearVision.northStar?.slice(0, 50));

    // Generate 6-Month Shift
    console.log('Generating 6-Month Shift...');
    const shiftContext = { ...context, fiveYearVision: JSON.stringify(fiveYearVision) };
    const shiftResponse = await callLLM(SIX_MONTH_SHIFT_PROMPT, shiftContext);
    const sixMonthShift = extractJson(shiftResponse);

    // Generate 12-Week Sprint
    console.log('Generating 12-Week Sprint...');
    const sprintContext = {
      ...context,
      sixMonthShift: JSON.stringify(sixMonthShift),
      northStar: fiveYearVision.northStar,
      emotionalCore: fiveYearVision.emotionalCore,
      year1Target: fiveYearVision.year1?.measurable,
      toolsUsed: 'scheduling software, CRM'
    };
    const sprintResponse = await callLLM(TWELVE_WEEK_SPRINT_PROMPT, sprintContext);
    const sprint = extractJson(sprintResponse);

    const duration = Date.now() - startTime;

    // Build full roadmap
    const roadmapData = {
      fiveYearVision,
      sixMonthShift,
      summary: {
        headline: sprint.sprintTheme || `${context.companyName}'s 12-Week Transformation`,
        keyInsight: sprint.sprintPromise,
        expectedOutcome: sprint.sprintGoals?.[0]
      },
      priorities: sprint.sprintGoals?.map((goal: string, i: number) => ({
        rank: i + 1,
        title: goal,
        description: goal,
        category: 'Strategic'
      })) || [],
      weeks: sprint.weeks || [],
      successMetrics: sprint.successMetrics || []
    };

    // Save to database
    await supabase.from('client_roadmaps').update({ is_active: false }).eq('client_id', clientId);

    const { data: savedRoadmap, error: saveError } = await supabase
      .from('client_roadmaps')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        roadmap_data: roadmapData,
        value_analysis: valueAnalysis,
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
          sort_order: i,
          status: 'pending'
        }))
      );
      if (tasks.length > 0) await supabase.from('client_tasks').insert(tasks);
    }

    console.log(`365 Analysis complete! Duration: ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        roadmapId: savedRoadmap.id,
        valueAnalysis: { overallScore: valueAnalysis.overallScore },
        roadmap: {
          headline: roadmapData.summary.headline,
          northStar: fiveYearVision.northStar,
          weekCount: sprint.weeks?.length || 0
        },
        usage: { cost, durationMs: duration }
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
