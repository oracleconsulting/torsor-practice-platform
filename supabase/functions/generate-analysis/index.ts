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
  
  // Additional Life Design fields for rich narrative
  mondayFrustration: string;
  familyFeedback: string;
  twoWeekBreakImpact: string;
  magicAwayTask: string;
  secretPride: string;
  
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
    
    // Additional life design fields
    mondayFrustration: part1.monday_frustration || '',
    familyFeedback: part1.family_feedback || '',
    twoWeekBreakImpact: part1.two_week_break_impact || '',
    magicAwayTask: part1.magic_away_task || '',
    secretPride: part1.secret_pride || '',
    
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

const FIVE_YEAR_VISION_PROMPT = `You are a world-class advisor who writes transformational narratives that make founders feel truly seen and understood. Your writing is warm, direct, and uses their exact words naturally throughout.

THEIR COMPLETE STORY (in their own words):

=== WHO THEY ARE ===
Name: {userName}
Business: {companyName}
Team: {teamSize}
Revenue: {annualTurnover}
Years Trading: {yearsTrading}

=== WHAT THEY'VE TOLD US ===
Their ideal Tuesday: "{tuesdayTest}"
Their relationship with the business: "{relationshipMirror}"
What keeps them up at night: "{moneyWorry}"
What they've sacrificed: {sacrifices}
What interrupts their life: "{emergencyLog}"
Their danger zone: "{dangerZone}"
What frustrates them on Mondays: "{mondayFrustration}"
What their family says: "{familyFeedback}"
What happens if they take 2 weeks off: "{twoWeekBreakImpact}"
What they'd magic away: "{magicAwayTask}"
What they're secretly proud of: "{secretPride}"

=== THEIR DREAMS ===
Their 10-year vision: "{tenYearVision}"
What "winning" looks like by 2030: "{winningBy2030}"
Income now: {currentIncome} → Income goal: {desiredIncome}
Time they can commit: {commitmentHours}

=== PATTERNS WE'VE NOTICED ===
Their pain in their words: {painPhrases}
Their desires in their words: {desirePhrases}
Metaphors they use: {metaphors}

YOUR TASK:
Write a comprehensive, beautifully crafted transformation story that will become their guiding document for the next 5 years. This must feel deeply personal - like you've known them for years.

CRITICAL RULES:
1. Write in SECOND PERSON - speak directly to them ("You" not "They")
2. Weave their EXACT quotes throughout - but naturally, not awkwardly
3. Focus on LIFE transformation, not just business metrics
4. Make every paragraph feel like you understand them better than they understand themselves
5. Quality over quantity - every sentence should matter

Return as JSON:

{
  "fiveYearVision": "A beautifully written 3-4 paragraph narrative (400-500 words) that tells the complete story of their transformation. Start with where they are now (the pain, the struggle, the sacrifice). Move to the turning point (the insight that changes everything). End with the achieved vision (what life looks like when they've won). Use their words. Make them feel seen. This is the centrepiece - make it exceptional.",
  
  "northStar": "One powerful sentence that captures their deepest desire - using their exact words where possible. This becomes the filter for every decision. Example: 'Give ourselves the time to have kids and step back to enjoy more time together while we can still go anywhere and do anything.'",
  
  "sixMonthShifts": [
    "First structural change that must happen - be specific to their situation",
    "Second structural change - reference their pain points",
    "Third structural change - address their danger zone",
    "Fourth structural change - move toward their vision"
  ],
  
  "threeMonthFocus": {
    "theme": "A clear, compelling theme for the next 90 days",
    "why": "Why this matters NOW - connect to their pain and their vision",
    "outcome": "What will be different in 90 days - be specific and measurable"
  },
  
  "immediateActions": [
    {
      "action": "First specific action they should take this week",
      "why": "Why this matters - connect to their story",
      "time": "How long this takes"
    },
    {
      "action": "Second action",
      "why": "Connection to their goals",
      "time": "Time estimate"
    },
    {
      "action": "Third action",
      "why": "Why this moves the needle",
      "time": "Time estimate"
    },
    {
      "action": "Fourth action",
      "why": "Strategic importance",
      "time": "Time estimate"
    },
    {
      "action": "Fifth action",
      "why": "How this builds momentum",
      "time": "Time estimate"
    }
  ],
  
  "yearMilestones": {
    "year1": {
      "headline": "A powerful headline for year 1",
      "summary": "2-3 sentences describing what's different after year 1"
    },
    "year3": {
      "headline": "A powerful headline for year 3",
      "summary": "2-3 sentences describing the midpoint transformation"
    },
    "year5": {
      "headline": "Their definition of winning achieved",
      "summary": "2-3 sentences describing the complete vision realized"
    }
  },
  
  "archetype": "freedom_seeker|empire_builder|lifestyle_designer|impact_maker|balanced_achiever"
}

Remember: The fiveYearVision narrative is the heart of this. It should be so well-written that they want to print it out and put it on their wall. Make them feel understood. Make them believe change is possible. Make them excited to start.`;

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
      max_tokens: 8000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert advisor who creates deeply personal transformation narratives. You excel at reading between the lines and finding the emotional truth in people\'s words. Write in second person, directly to the founder. Weave their exact quotes naturally throughout. Every paragraph should make them think "How did you know that about me?" Always return valid JSON.'
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

    // Generate Complete Transformation Plan (single high-quality LLM call)
    console.log('Generating Transformation Plan...');
    const startTime = Date.now();
    const planResponse = await callLLM(FIVE_YEAR_VISION_PROMPT, context);
    const plan = extractJson(planResponse);
    const duration = Date.now() - startTime;
    console.log('Plan generated in', duration, 'ms. North Star:', plan.northStar?.slice(0, 50));

    // Build roadmap data structure
    const roadmapData = {
      fiveYearVision: plan,
      northStar: plan.northStar,
      summary: {
        headline: plan.threeMonthFocus?.theme || `${context.companyName}'s Transformation`,
        keyInsight: plan.threeMonthFocus?.why || plan.fiveYearVision?.split('.')[0],
        expectedOutcome: plan.threeMonthFocus?.outcome
      },
      priorities: plan.immediateActions?.map((action: any, i: number) => ({
        rank: i + 1,
        title: action.action,
        description: action.why,
        time: action.time,
        category: 'Strategic'
      })) || []
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

    console.log(`Transformation plan complete! Duration: ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        roadmapId: savedRoadmap.id,
        valueAnalysis: { overallScore: valueAnalysis.overallScore },
        roadmap: {
          headline: roadmapData.summary.headline,
          northStar: plan.northStar,
          archetype: plan.archetype
        },
        usage: { durationMs: duration }
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
