// ============================================================================
// GENERATE SPRINT SUMMARY
// ============================================================================
// Fired when client completes all 12 weeks (every task resolved).
// Collects task data, computes analytics, calls LLM for narrative, stores in roadmap_stages.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ----------------------------------------------------------------------------
// Analytics types and computation
// ----------------------------------------------------------------------------

interface SprintAnalytics {
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  completionRate: number;
  skipRate: number;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    completed: number;
    skipped: number;
    completionRate: number;
  }>;
  weeklyBreakdown: Array<{
    weekNumber: number;
    theme: string;
    total: number;
    completed: number;
    skipped: number;
    completionRate: number;
    hadCatchUp: boolean;
  }>;
  phaseBreakdown: Array<{ phase: string; weeks: number[]; completionRate: number }>;
  catchUpWeeks: number[];
  fastestWeek: number;
  mostSkippedCategory: string;
  streaks: { longestCompletionStreak: number; currentStreak: number };
  lifeTaskCompletion: number;
  businessTaskCompletion: number;
  sprintStartDate: string;
  sprintEndDate: string;
  totalDays: number;
  calendarWeeksUsed: number;
}

function computeSprintAnalytics(
  sprintWeeks: any[],
  dbTasks: any[],
  sprintStartDate: string,
): SprintAnalytics {
  const totalTasks = dbTasks.length;
  const completedTasks = dbTasks.filter((t: any) => t.status === 'completed').length;
  const skippedTasks = dbTasks.filter((t: any) => t.status === 'skipped').length;

  const categories = new Map<string, { total: number; completed: number; skipped: number }>();
  for (const task of dbTasks) {
    const cat = task.category || 'general';
    if (!categories.has(cat)) categories.set(cat, { total: 0, completed: 0, skipped: 0 });
    const entry = categories.get(cat)!;
    entry.total++;
    if (task.status === 'completed') entry.completed++;
    if (task.status === 'skipped') entry.skipped++;
  }

  const categoryBreakdown = Array.from(categories.entries()).map(([category, stats]) => ({
    category,
    ...stats,
    completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
  }));

  const weeklyBreakdown = (sprintWeeks || []).map((week: any) => {
    const weekNum = week.weekNumber ?? week.week ?? 0;
    const weekTasks = dbTasks.filter((t: any) => t.week_number === weekNum);
    const completed = weekTasks.filter((t: any) => t.status === 'completed').length;
    const skipped = weekTasks.filter((t: any) => t.status === 'skipped').length;
    const hadCatchUp = weekTasks.some((t: any) => t.metadata?.caughtUp === true);

    return {
      weekNumber: weekNum,
      theme: week.theme || '',
      total: weekTasks.length,
      completed,
      skipped,
      completionRate:
        weekTasks.length > 0 ? Math.round((completed / weekTasks.length) * 100) : 0,
      hadCatchUp,
    };
  });

  const catchUpWeeks = weeklyBreakdown.filter((w) => w.hadCatchUp).map((w) => w.weekNumber);

  const mostSkippedEntry = categoryBreakdown.sort(
    (a, b) => (b.total ? b.skipped / b.total : 0) - (a.total ? a.skipped / a.total : 0),
  )[0];
  const mostSkippedCategory = mostSkippedEntry?.category || 'none';

  const lifeTasks = dbTasks.filter((t: any) => t.category?.startsWith?.('life_'));
  const businessTasks = dbTasks.filter((t: any) => !t.category?.startsWith?.('life_'));
  const lifeTaskCompletion =
    lifeTasks.length > 0
      ? Math.round(
          (lifeTasks.filter((t: any) => t.status === 'completed').length / lifeTasks.length) * 100,
        )
      : 0;
  const businessTaskCompletion =
    businessTasks.length > 0
      ? Math.round(
          (businessTasks.filter((t: any) => t.status === 'completed').length /
            businessTasks.length) *
            100,
        )
      : 0;

  const lastTaskDate = dbTasks
    .map((t: any) => t.completed_at || t.skipped_at || t.updated_at)
    .filter(Boolean)
    .sort()
    .pop() as string | undefined;
  const sprintEndDate = lastTaskDate || new Date().toISOString();

  const start = new Date(sprintStartDate);
  const end = new Date(sprintEndDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const calendarWeeksUsed = Math.ceil(totalDays / 7);

  const phaseBreakdown: Array<{ phase: string; weeks: number[]; completionRate: number }> = [];
  const phaseNames: Record<number, string> = {
    1: 'Relief',
    2: 'Foundation',
    3: 'Momentum',
    4: 'Embed',
    5: 'Measure',
  };
  for (let p = 1; p <= 5; p++) {
    const phaseWeeks = weeklyBreakdown.filter((w) => w.weekNumber >= (p - 1) * 2.4 + 1 && w.weekNumber <= p * 2.4);
    const total = phaseWeeks.reduce((s, w) => s + w.total, 0);
    const completed = phaseWeeks.reduce((s, w) => s + w.completed, 0);
    phaseBreakdown.push({
      phase: phaseNames[p] || `Phase ${p}`,
      weeks: phaseWeeks.map((w) => w.weekNumber),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }

  let longestStreak = 0;
  let currentStreak = 0;
  for (const w of weeklyBreakdown) {
    if (w.total > 0 && w.completionRate >= 80) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return {
    totalTasks,
    completedTasks,
    skippedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    skipRate: totalTasks > 0 ? Math.round((skippedTasks / totalTasks) * 100) : 0,
    categoryBreakdown,
    weeklyBreakdown,
    phaseBreakdown,
    catchUpWeeks,
    fastestWeek: 0,
    mostSkippedCategory,
    streaks: { longestCompletionStreak: longestStreak, currentStreak },
    lifeTaskCompletion,
    businessTaskCompletion,
    sprintStartDate,
    sprintEndDate,
    totalDays,
    calendarWeeksUsed,
  };
}

// ----------------------------------------------------------------------------
// Prompt builder
// ----------------------------------------------------------------------------

function buildSprintSummaryPrompt(
  context: {
    userName: string;
    companyName: string;
    northStar: string;
    tuesdayTest: string;
    year1Milestone: any;
    dangerZone: string;
    sprintTheme: string;
    sprintGoals: any;
  },
  analytics: SprintAnalytics,
  weeklyDetails: Array<{
    weekNumber: number;
    theme: string;
    completedTasks: string[];
    skippedTasks: string[];
  }>,
  checkInData: any[],
): string {
  const checkInSection =
    checkInData.length > 0
      ? `\n## WEEKLY CHECK-IN DATA\n${checkInData
          .map(
            (c: any) =>
              `Week ${c.week_number}: Satisfaction ${c.life_satisfaction ?? '?'}/5, Time Protected: ${c.time_protected ?? '?'}, Win: "${c.personal_win || 'none recorded'}", Business: ${c.business_progress ?? '?'}/5`,
          )
          .join('\n')}`
      : '\n## No weekly check-in data available';

  return `You are reviewing a completed 12-week transformation sprint for ${context.userName} (${context.companyName}).

## CLIENT CONTEXT

North Star: ${context.northStar}
Sprint Theme: ${context.sprintTheme}
Original Tuesday Test (their ideal future Tuesday): "${context.tuesdayTest}"
Danger Zone (what could sink the business): "${context.dangerZone}"
Year 1 Milestone: ${JSON.stringify(context.year1Milestone)}
Sprint Goals: ${JSON.stringify(context.sprintGoals)}

## COMPLETION DATA (pre-computed — DO NOT recalculate)

Overall: ${analytics.completedTasks} completed, ${analytics.skippedTasks} skipped out of ${analytics.totalTasks} tasks
Completion Rate: ${analytics.completionRate}% (completed only)
Skip Rate: ${analytics.skipRate}%
Calendar Time: ${analytics.calendarWeeksUsed} weeks (vs 12 planned)
${analytics.catchUpWeeks.length > 0 ? `Catch-up weeks (bulk-resolved after a break): ${analytics.catchUpWeeks.join(', ')}` : 'No catch-up weeks — completed in real-time'}

Life Task Completion: ${analytics.lifeTaskCompletion}%
Business Task Completion: ${analytics.businessTaskCompletion}%

Most Skipped Category: ${analytics.mostSkippedCategory}

## WEEK-BY-WEEK DETAIL

${weeklyDetails
  .map(
    (w) => `
Week ${w.weekNumber}: ${w.theme}
  Completed: ${w.completedTasks.length > 0 ? w.completedTasks.join('; ') : 'None'}
  Skipped: ${w.skippedTasks.length > 0 ? w.skippedTasks.join('; ') : 'None'}`,
  )
  .join('\n')}
${checkInSection}

## YOUR TASK

Generate a Sprint Summary with the following structure. Be honest and specific — use the actual task titles, don't generalise. If the skip rate is high, say so directly. If catch-up mode was used, acknowledge the break and what was resolved retroactively vs in real-time.

Return ONLY valid JSON:

{
  "headlineAchievement": "One sentence — the single biggest transformation from this sprint",
  "transformationNarrative": {
    "opening": "2-3 sentences. Where ${context.userName} started 12 weeks ago",
    "journey": "3-4 sentences. What actually happened — the real story, not the plan. Reference specific weeks and tasks.",
    "closing": "2-3 sentences. Where they are now. Be honest about what changed and what didn't."
  },
  "tuesdayTestComparison": {
    "original": "Their original Tuesday Test vision (quote it back)",
    "progress": "What's actually shifted toward that vision based on completed tasks",
    "gap": "What's still missing — the distance between current reality and the vision",
    "nextSteps": "1-2 specific things Sprint 2 should prioritise to close the gap"
  },
  "strengthsRevealed": [
    {
      "strength": "A specific strength shown by task completion patterns",
      "evidence": "Which tasks/weeks demonstrate this",
      "howToLeverage": "How Sprint 2 can build on this"
    }
  ],
  "growthAreas": [
    {
      "area": "A specific area where skips or struggles appeared",
      "evidence": "Which tasks/weeks show this pattern",
      "recommendation": "What Sprint 2 should do differently here"
    }
  ],
  "skipAnalysis": {
    "pattern": "What the skip patterns reveal about priorities and resistance",
    "insight": "The underlying reason — time, capability, avoidance, or legitimate deprioritisation",
    "adjustment": "How Sprint 2 should adapt task design based on this"
  },
  "phaseReview": [
    {
      "phase": "Relief / Foundation / Momentum / Embed / Measure",
      "weeks": "1-2",
      "verdict": "How this phase went — 1-2 sentences",
      "completionRate": 85
    }
  ],
  "renewalRecommendations": {
    "shouldRenew": true,
    "urgency": "high | medium | low",
    "focusAreas": ["Top 3 areas Sprint 2 should prioritise"],
    "toneShift": "How the sprint approach should change (e.g., 'less foundation, more execution')",
    "lifeDesignAdjustment": "Any changes to life design goals based on what was learned",
    "estimatedImpact": "What completing Sprint 2 could mean for Year 1 milestone progress"
  },
  "clientMessage": "A direct, personal 3-4 sentence message to ${context.userName}. Not corporate. Sound like a coach who knows them. Acknowledge what was hard. Celebrate what was achieved. Point forward."
}

ANTI-AI-SLOP RULES:
BANNED: Additionally, delve, crucial, pivotal, testament, underscores, showcases, fostering, tapestry, landscape, synergy, leverage (as verb), scalable, holistic, impactful, ecosystem, journey (overused), empower
BANNED STRUCTURES: "Not only X but also Y", "It's important to note", "In summary", rule of three lists
THE TEST: Read the clientMessage aloud. If it sounds like a LinkedIn post, rewrite it.

British English only (organise, colour, £). Return ONLY valid JSON.`;
}

// ----------------------------------------------------------------------------
// LLM call
// ----------------------------------------------------------------------------

async function generateSummaryWithLLM(prompt: string): Promise<any> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor Sprint Summary',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 4000,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content:
            'You are a transformation coach writing a sprint review. Be specific, honest, and human. Use the client\'s exact words where given. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`LLM error: ${response.status} - ${err}`);
    throw new Error(`LLM error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in LLM response');

  try {
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch (e) {
    const fixed = cleaned
      .substring(start, end + 1)
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(fixed);
  }
}

// ----------------------------------------------------------------------------
// Main handler
// ----------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const { clientId, practiceId, sprintNumber = 1 } = body;

    if (!clientId || !practiceId) {
      return new Response(
        JSON.stringify({ error: 'clientId and practiceId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Check for existing sprint summary (don't overwrite unless regenerating)
    const { data: existing } = await supabase
      .from('roadmap_stages')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('stage_type', 'sprint_summary')
      .eq('sprint_number', sprintNumber)
      .in('status', ['generated', 'approved', 'published'])
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && body.action !== 'regenerate') {
      return new Response(
        JSON.stringify({ success: true, stageId: existing.id, alreadyExists: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const nextVersion = existing ? (await getNextVersion(supabase, clientId, sprintNumber)) : 1;

    // 1. Client info
    const { data: client } = await supabase
      .from('practice_members')
      .select('name, client_company')
      .eq('id', clientId)
      .single();

    // 2. Assessments (Part 1 / Part 2 for Tuesday Test, danger zone)
    const { data: assessments } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses')
      .eq('client_id', clientId)
      .in('assessment_type', ['part1', 'part2']);

    const part1 = (assessments?.find((a: any) => a.assessment_type === 'part1') as any)?.responses || {};
    const part2 = (assessments?.find((a: any) => a.assessment_type === 'part2') as any)?.responses || {};

    // 3. Pipeline stages
    const stageTypes = [
      'fit_assessment',
      'five_year_vision',
      'six_month_shift',
      'sprint_plan_part2',
      'value_analysis',
    ];
    const stageData: Record<string, any> = {};
    for (const stageType of stageTypes) {
      const { data: stage } = await supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content')
        .eq('client_id', clientId)
        .eq('stage_type', stageType)
        .eq('sprint_number', sprintNumber)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      stageData[stageType] = stage?.approved_content || stage?.generated_content;
    }

    const sprintContent = stageData.sprint_plan_part2?.sprint || stageData.sprint_plan_part2;
    const sprintWeeks = sprintContent?.weeks || [];
    const vision = stageData.five_year_vision;
    const fitProfile = stageData.fit_assessment;
    const northStar =
      fitProfile?.northStar || vision?.northStar || part1.north_star || 'Not set';
    const tuesdayTest =
      part1.tuesday_test || part1.ideal_tuesday || vision?.tuesdayTest || 'Not described';
    const dangerZone = part1.danger_zone || part1.dangerZone || 'Not described';
    const year1Milestone = vision?.yearMilestones?.year1 || vision?.year1Milestone || {};
    const sprintTheme = sprintContent?.sprintTheme || sprintContent?.theme || '12-week transformation';
    const sprintGoals = sprintContent?.goals || sprintContent?.sprintGoals || [];

    // 4. All tasks
    const { data: allTasks } = await supabase
      .from('client_tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('week_number', { ascending: true });

    const dbTasks = allTasks || [];

    // 5. Sprint start date
    const { data: sprintStage } = await supabase
      .from('roadmap_stages')
      .select('created_at, published_at')
      .eq('client_id', clientId)
      .eq('stage_type', 'sprint_plan_part2')
      .eq('sprint_number', sprintNumber)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const sprintStartDate =
      sprintStage?.published_at || sprintStage?.created_at || new Date().toISOString();

    // 6. Weekly check-ins (optional)
    let checkIns: any[] = [];
    try {
      const { data: checkInData } = await supabase
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', clientId)
        .order('week_number', { ascending: true });
      checkIns = checkInData || [];
    } catch {
      // table may not exist
    }

    const analytics = computeSprintAnalytics(sprintWeeks, dbTasks, sprintStartDate);

    const weeklyDetails = analytics.weeklyBreakdown.map((w) => {
      const weekTasks = dbTasks.filter((t: any) => t.week_number === w.weekNumber);
      return {
        weekNumber: w.weekNumber,
        theme: w.theme,
        completedTasks: weekTasks
          .filter((t: any) => t.status === 'completed')
          .map((t: any) => t.title),
        skippedTasks: weekTasks
          .filter((t: any) => t.status === 'skipped')
          .map((t: any) => t.title),
      };
    });

    const prompt = buildSprintSummaryPrompt(
      {
        userName: client?.name?.split(' ')[0] || 'there',
        companyName: client?.client_company || 'your business',
        northStar,
        tuesdayTest,
        year1Milestone,
        dangerZone,
        sprintTheme,
        sprintGoals,
      },
      analytics,
      weeklyDetails,
      checkIns,
    );

    const { data: stage, error: stageError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'sprint_summary',
        sprint_number: sprintNumber,
        version: nextVersion,
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        model_used: 'anthropic/claude-sonnet-4.5',
      })
      .select()
      .single();

    if (stageError) throw stageError;

    const llmOutput = await generateSummaryWithLLM(prompt);
    const duration = Date.now() - startTime;

    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: {
          summary: llmOutput,
          analytics,
          generatedAt: new Date().toISOString(),
          sprintNumber,
          inputData: {
            totalTasks: analytics.totalTasks,
            completedTasks: analytics.completedTasks,
            skippedTasks: analytics.skippedTasks,
            catchUpWeeks: analytics.catchUpWeeks,
            calendarWeeksUsed: analytics.calendarWeeksUsed,
          },
        },
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: duration,
      })
      .eq('id', stage.id);

    return new Response(
      JSON.stringify({
        success: true,
        stageId: stage.id,
        duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('generate-sprint-summary error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

async function getNextVersion(
  supabase: SupabaseClient,
  clientId: string,
  sprintNumber: number,
): Promise<number> {
  const { data: rows } = await supabase
    .from('roadmap_stages')
    .select('version')
    .eq('client_id', clientId)
    .eq('stage_type', 'sprint_summary')
    .eq('sprint_number', sprintNumber)
    .order('version', { ascending: false })
    .limit(1);
  return rows?.[0]?.version != null ? rows[0].version + 1 : 1;
}
