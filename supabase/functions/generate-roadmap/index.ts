// ============================================================================
// EDGE FUNCTION: generate-roadmap
// ============================================================================
// Triggered: After Parts 1 & 2 are complete
// Generates: 5-Year Vision, 6-Month Shift, 12-Week Sprint
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// EMOTIONAL ANCHOR EXTRACTION
// ============================================================================

function extractEmotionalAnchors(part1: Record<string, any>, part2: Record<string, any>) {
  const anchors = {
    painPhrases: [] as string[],
    desirePhrases: [] as string[],
    metaphors: [] as string[],
    timePatterns: [] as string[],
    repeatedThemes: [] as string[]
  };

  const allResponses = { ...part1, ...part2 };

  // Tuesday Test extraction
  const tuesdayTest = part1.tuesday_test || part1.ninety_day_fantasy || '';
  if (tuesdayTest) {
    // Time patterns
    const timeMatches = tuesdayTest.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\bearly\b|\blate\b|\bmorning\b|\bevening\b/gi);
    if (timeMatches) anchors.timePatterns = [...new Set(timeMatches.map((t: string) => t.toLowerCase()))];

    // Pain phrases
    ['not', "don't", 'stop', 'no more', 'without', 'never', 'tired of', 'hate'].forEach(word => {
      if (tuesdayTest.toLowerCase().includes(word)) {
        const regex = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]?`, 'gi');
        const matches = tuesdayTest.match(regex);
        if (matches) anchors.painPhrases.push(...matches.map((m: string) => m.trim()));
      }
    });

    // Desire phrases
    ['want', 'wish', 'dream', 'love to', 'finally', 'freedom', 'choose', 'able to'].forEach(word => {
      if (tuesdayTest.toLowerCase().includes(word)) {
        const regex = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]?`, 'gi');
        const matches = tuesdayTest.match(regex);
        if (matches) anchors.desirePhrases.push(...matches.map((m: string) => m.trim()));
      }
    });
  }

  // Metaphors from Relationship Mirror
  const relationshipMirror = part1.relationship_mirror || '';
  if (relationshipMirror.toLowerCase().includes('feels like')) {
    const metaphor = relationshipMirror.toLowerCase().split('feels like').pop()?.replace(/[.!?].*/, '').trim();
    if (metaphor && metaphor.length > 3) anchors.metaphors.push(metaphor);
  }

  // Extract from emotion-rich fields
  const emotionFields = ['emergency_log', 'money_worry', 'monday_frustration', 'family_feedback', 
    'two_week_break_impact', 'magic_away_task', 'secret_pride', 'danger_zone', 'growth_bottleneck'];

  emotionFields.forEach(field => {
    const content = allResponses[field];
    if (content && typeof content === 'string' && content.length > 15) {
      const painMatches = content.match(/\b(stress|overwhelm|chaos|struggle|worry|fear|exhaust|frustrat|anxious|trapped|drown|spinning)\w*\b/gi);
      if (painMatches) anchors.painPhrases.push(...painMatches);
      const desireMatches = content.match(/\b(freedom|peace|calm|control|balance|growth|success|finally|family|enjoy)\w*\b/gi);
      if (desireMatches) anchors.desirePhrases.push(...desireMatches);
    }
  });

  // Find repeated themes
  const allText = Object.values(allResponses).filter(v => typeof v === 'string').join(' ').toLowerCase();
  ['time', 'money', 'family', 'freedom', 'stress', 'work', 'team', 'growth', 'control'].forEach(word => {
    if ((allText.match(new RegExp(`\\b${word}\\w*\\b`, 'g')) || []).length >= 3) anchors.repeatedThemes.push(word);
  });

  // Deduplicate
  Object.keys(anchors).forEach(key => {
    (anchors as any)[key] = [...new Set((anchors as any)[key].filter(Boolean))].slice(0, 10);
  });

  return anchors;
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildContext(part1: Record<string, any>, part2: Record<string, any>) {
  const anchors = extractEmotionalAnchors(part1, part2);
  
  // Parse revenue
  const turnoverStr = part2.annual_turnover || '';
  let revenueNumeric = 0;
  if (turnoverStr.includes('Under £100k')) revenueNumeric = 50000;
  else if (turnoverStr.includes('£100k-£250k')) revenueNumeric = 175000;
  else if (turnoverStr.includes('£250k-£500k')) revenueNumeric = 375000;
  else if (turnoverStr.includes('£500k-£1m')) revenueNumeric = 750000;
  else if (turnoverStr.includes('£1m')) revenueNumeric = 2500000;

  // Detect industry
  const allText = JSON.stringify({ ...part1, ...part2 }).toLowerCase();
  let industry = 'general_business';
  if (allText.includes('rowing') || allText.includes('fitness')) industry = 'fitness_equipment';
  else if (allText.includes('consult')) industry = 'consulting';
  else if (allText.includes('software') || allText.includes('saas')) industry = 'technology';
  else if (allText.includes('agency')) industry = 'agency';

  return {
    userName: part1.full_name || 'Founder',
    companyName: part1.company_name || part2.trading_name || 'Your Business',
    industry,
    tuesdayTest: part1.tuesday_test || part1.ninety_day_fantasy || '',
    emergencyLog: part1.emergency_log || '',
    relationshipMirror: part1.relationship_mirror || '',
    moneyWorry: part1.money_worry || '',
    sacrifices: JSON.stringify(part1.sacrifices || []),
    commitmentHours: part1.commitment_hours || '10-15 hours',
    currentIncome: part1.current_income || '',
    desiredIncome: part1.desired_income || '',
    dangerZone: part1.danger_zone || '',
    mondayFrustration: part1.monday_frustration || '',
    familyFeedback: part1.family_feedback || '',
    twoWeekBreakImpact: part1.two_week_break_impact || '',
    magicAwayTask: part1.magic_away_task || '',
    secretPride: part1.secret_pride || '',
    lastExcitement: part1.last_excitement || '',
    helpFears: part1.help_fears || '',
    yearsTrading: part2.years_trading || '',
    tenYearVision: part2.ten_year_vision || '',
    annualTurnover: part2.annual_turnover || '',
    winningBy2030: part2.winning_2030 || '',
    teamSize: part2.team_size || 'solo',
    growthBottleneck: part2.growth_bottleneck || '',
    ninetyDayPriorities: JSON.stringify(part2.ninety_day_priorities || []),
    currentWorkingHours: parseInt(part2.current_working_hours) || 50,
    targetWorkingHours: parseInt(part2.target_working_hours) || 35,
    toolsUsed: JSON.stringify(part2.current_tools || []),
    isPreRevenue: revenueNumeric === 0,
    revenueNumeric,
    painPhrases: JSON.stringify(anchors.painPhrases),
    desirePhrases: JSON.stringify(anchors.desirePhrases),
    metaphors: JSON.stringify(anchors.metaphors),
    timePatterns: JSON.stringify(anchors.timePatterns),
    repeatedThemes: JSON.stringify(anchors.repeatedThemes)
  };
}

// ============================================================================
// PROMPTS
// ============================================================================

const FIVE_YEAR_VISION_PROMPT = `You are an emotionally intelligent advisor creating a deeply personal transformation narrative for {userName} who runs {companyName}.

FOUNDER'S JOURNEY (their exact words):

=== LIFE DESIGN ===
Tuesday Test/90-Day Fantasy: "{tuesdayTest}"
Business Relationship: "{relationshipMirror}"
Money Worry: "{moneyWorry}"
Sacrifices: {sacrifices}
Emergency Log: "{emergencyLog}"
Danger Zone: "{dangerZone}"
Monday Frustration: "{mondayFrustration}"
Family Feedback: "{familyFeedback}"
Two Week Break Impact: "{twoWeekBreakImpact}"
Magic Away Task: "{magicAwayTask}"
Secret Pride: "{secretPride}"
Help Fears: "{helpFears}"

=== BUSINESS REALITY ===
Industry: {industry}
Years Trading: {yearsTrading}
Turnover: {annualTurnover}
Personal Income: {currentIncome} → Target: {desiredIncome}
Working Hours: {currentWorkingHours}/week → Target: {targetWorkingHours}/week
Team: {teamSize}
10-Year Vision: "{tenYearVision}"
Winning by 2030: "{winningBy2030}"
Biggest Challenge: "{growthBottleneck}"
Available Time: {commitmentHours}
90-Day Priorities: {ninetyDayPriorities}

=== EMOTIONAL PATTERNS ===
Pain phrases: {painPhrases}
Desire phrases: {desirePhrases}
Metaphors: {metaphors}
Time patterns: {timePatterns}
Repeated themes: {repeatedThemes}

INSTRUCTIONS:
1. Write in SECOND PERSON directly to them ("You" not "They")
2. Use their EXACT emotional phrases throughout
3. Show a path where success = LESS stress, not more
4. Make them feel truly understood

Return JSON:
{
  "tagline": "Short aspirational tagline for their transformation",
  "transformationStory": {
    "currentReality": {
      "title": "Your Current Reality: [use their phrase]",
      "narrative": "3-4 paragraphs (300+ words) describing where they are now using their EXACT quotes from tuesday_test, emergency_log, family_feedback. Make them feel DEEPLY understood."
    },
    "turningPoint": {
      "title": "Your Turning Point",
      "narrative": "2-3 paragraphs (200+ words) about the breakthrough moment. Reference their help_fears and danger_zone."
    },
    "visionAchieved": {
      "title": "Your Vision Achieved: [their winning_2030 phrase]",
      "narrative": "3-4 paragraphs (300+ words) painting their success IN THEIR TERMS. Reference their tuesday_test ideal, ten_year_vision, desired_income, target_working_hours."
    }
  },
  "yearMilestones": {
    "year1": {
      "headline": "From [current] to [first shift]",
      "story": "100+ words showing specific changes in their mornings, weekends, stress, family time",
      "measurable": "Working hours reduced to X, income at £Y, [pain point] resolved"
    },
    "year3": {
      "headline": "The Transformation Deepens",
      "story": "100+ words showing their new normal",
      "measurable": "Target working hours achieved, income goals met"
    },
    "year5": {
      "headline": "[Their winning_2030 phrase]",
      "story": "100+ words showing THEIR definition of success",
      "measurable": "Their specific vision quantified"
    }
  },
  "northStar": "One powerful sentence using their EXACT words - the filter for every decision",
  "archetype": "freedom_seeker|empire_builder|lifestyle_designer|impact_maker|balanced_achiever",
  "emotionalCore": "2-3 sentences explaining the deep truth about what they're really seeking"
}`;

const SIX_MONTH_SHIFT_PROMPT = `Create a 6-month shift plan for {companyName} based on their 5-year vision.

VISION CONTEXT:
{fiveYearVision}

CURRENT STATE:
- Revenue: {annualTurnover} (£{revenueNumeric})
- Team: {teamSize}
- Hours: {currentWorkingHours}/week → Target: {targetWorkingHours}/week
- Available Time: {commitmentHours}

PAIN POINTS:
- Biggest Challenge: "{growthBottleneck}"
- Money Worry: "{moneyWorry}"
- Danger Zone: "{dangerZone}"
- Magic Away: "{magicAwayTask}"
- 90-Day Priorities: {ninetyDayPriorities}

EMOTIONAL ANCHORS:
Pain: {painPhrases}
Desire: {desirePhrases}

Return JSON:
{
  "shiftOverview": "3-4 sentences summarizing what this 6 months achieves using their words",
  "month1_2": {
    "theme": "Theme name",
    "focus": "Primary focus connecting to their biggest pain",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "X hours/week",
    "howYoullFeel": "Emotional shift description"
  },
  "month3_4": {
    "theme": "Theme building on months 1-2",
    "focus": "Building momentum",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "X hours/week",
    "howYoullFeel": "Progress description"
  },
  "month5_6": {
    "theme": "Theme approaching year 1",
    "focus": "Consolidation",
    "keyActions": ["Action 1", "Action 2", "Action 3"],
    "successMetrics": ["Metric 1", "Metric 2"],
    "timeCommitment": "X hours/week",
    "howYoullFeel": "How they feel approaching year 1"
  },
  "quickWins": ["Achievable THIS WEEK", "First month win"],
  "dangerMitigation": "How this addresses their danger zone",
  "northStarAlignment": "How each phase moves toward their north star"
}`;

const TWELVE_WEEK_SPRINT_PROMPT = `Create a 12-week sprint for {companyName}.

SIX-MONTH SHIFTS:
{sixMonthShift}

FIVE-YEAR COMPASS:
North Star: {northStar}
Emotional Core: {emotionalCore}
Year 1 Target: {year1Target}

BUSINESS:
- Industry: {industry}
- Revenue: £{revenueNumeric}
- Team: {teamSize}
- Hours: {currentWorkingHours}/week → {targetWorkingHours}/week
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

Return JSON with ALL 12 weeks:
{
  "sprintTheme": "Theme connecting to their 90-day fantasy",
  "sprintPromise": "In 90 days, transform from [current] to [ideal]",
  "sprintGoals": ["Primary goal", "Secondary goal", "Tertiary goal"],
  "phases": {
    "weeks1_2": { "name": "Immediate Relief", "purpose": "Quick wins" },
    "weeks3_4": { "name": "Foundation", "purpose": "Root causes" },
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
      "milestone": "Success by end of week"
    }
  ],
  "successMetrics": {
    "week4": "Foundation solid",
    "week8": "Momentum locked",
    "week12": "Transformed"
  },
  "tuesdayEvolution": {
    "week0": "Current Tuesday",
    "week4": "First shift",
    "week8": "New patterns",
    "week12": "New normal"
  }
}

Generate ALL 12 weeks with 3-5 tasks each, specific to their industry and situation.`;

// ============================================================================
// LLM HELPERS
// ============================================================================

async function callLLM(prompt: string, context: Record<string, any>): Promise<string> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

  let filledPrompt = prompt;
  Object.entries(context).forEach(([key, value]) => {
    filledPrompt = filledPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? ''));
  });

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
    return JSON.parse(jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x1f]/g, ' '));
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

    console.log(`Generating roadmap for client ${clientId}...`);
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

    // Build context
    const context = buildContext(part1, part2);
    console.log('Context built for', context.companyName);

    // Phase 1: 5-Year Vision
    console.log('Generating 5-Year Vision...');
    const visionResponse = await callLLM(FIVE_YEAR_VISION_PROMPT, context);
    const fiveYearVision = extractJson(visionResponse);
    console.log('Vision:', fiveYearVision.northStar?.substring(0, 50));

    // Phase 2: 6-Month Shift
    console.log('Generating 6-Month Shift...');
    const shiftContext = { ...context, fiveYearVision: JSON.stringify(fiveYearVision) };
    const shiftResponse = await callLLM(SIX_MONTH_SHIFT_PROMPT, shiftContext);
    const sixMonthShift = extractJson(shiftResponse);

    // Phase 3: 12-Week Sprint
    console.log('Generating 12-Week Sprint...');
    const sprintContext = {
      ...context,
      sixMonthShift: JSON.stringify(sixMonthShift),
      northStar: fiveYearVision.northStar || '',
      emotionalCore: fiveYearVision.emotionalCore || '',
      year1Target: fiveYearVision.yearMilestones?.year1?.measurable || ''
    };
    const sprintResponse = await callLLM(TWELVE_WEEK_SPRINT_PROMPT, sprintContext);
    const sprint = extractJson(sprintResponse);
    console.log('Sprint:', sprint.weeks?.length, 'weeks');

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
      weeks: sprint.weeks || [],
      generatedAt: new Date().toISOString(),
      generationDurationMs: duration
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

    // Create tasks
    if (sprint.weeks?.length > 0) {
      const tasks = sprint.weeks.flatMap((week: any) =>
        (week.tasks || []).map((task: any, i: number) => ({
          practice_id: practiceId, client_id: clientId, roadmap_id: savedRoadmap.id,
          week_number: week.weekNumber, title: task.title, description: task.description,
          category: task.category || 'General', priority: task.priority || 'medium',
          estimated_hours: task.estimatedHours || 1, sort_order: i, status: 'pending'
        }))
      );
      if (tasks.length > 0) await supabase.from('client_tasks').insert(tasks);
      console.log(`Created ${tasks.length} tasks`);
    }

    console.log('Roadmap generation complete!');

    return new Response(JSON.stringify({
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
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
