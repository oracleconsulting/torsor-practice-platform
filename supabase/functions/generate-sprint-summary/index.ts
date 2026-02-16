// ============================================================================
// GENERATE SPRINT SUMMARY
// ============================================================================
// LLM-powered review of a completed sprint. NOT part of the automatic trigger
// chain — called by admin (Regenerate) or client portal when all 12 weeks resolved.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface FetchSprintDataResult {
  tasks: any[];
  sprintContent: any;
  vision: any;
  shift: any;
  client: { name?: string; client_company?: string } | null;
  feedback: any[];
}

interface BuiltStats {
  totalTasks: number;
  completed: any[];
  skipped: any[];
  inProgress: any[];
  pending: any[];
  completionRate: number;
  weekStats: Record<number, { total: number; completed: number; skipped: number }>;
  categoryStats: Record<string, { total: number; completed: number }>;
  taskFeedback: Array<{ week: number; title: string; whatWentWell: string; whatDidntWork: string; additionalNotes: string }>;
  skippedHighPriority: Array<{ week: number; title: string; priority: string }>;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const clientId = body.clientId;
    const practiceId = body.practiceId;
    const sprintNumber = body.sprintNumber ?? 1;

    if (!clientId || !practiceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'clientId and practiceId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Existing stage → next version
    const { data: existingStages } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'sprint_summary')
      .eq('sprint_number', sprintNumber)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion =
      existingStages?.length && existingStages[0].version != null
        ? existingStages[0].version + 1
        : 1;

    // Create stage record (generating)
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

    // Fetch all input data
    const { tasks, sprintContent, vision, shift, client, feedback } = await fetchSprintData(
      supabase,
      clientId,
      sprintNumber,
    );

    const userName = client?.name?.split(' ')[0] || 'there';

    // Edge case: no tasks — minimal summary, no LLM
    if (!tasks?.length) {
      const minimalSummary = {
        headline: 'Sprint not yet started',
        completionStats: {
          totalTasks: 0,
          completed: 0,
          skipped: 0,
          inProgress: 0,
          pending: 0,
          completionRate: 0,
          strongestWeek: 0,
          weakestWeek: 0,
        },
        achievements: [],
        growthAreas: [],
        behaviouralShifts: { whatChanged: '', whatDidnt: '', tuesdayTestProgress: '' },
        clientVoice: { bestQuote: null, concernQuote: null },
        nextSprintRecommendations: [],
        advisorBrief: '',
        generatedAt: new Date().toISOString(),
        sprintNumber,
      };

      await supabase
        .from('roadmap_stages')
        .update({
          status: 'generated',
          generated_content: minimalSummary,
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: Date.now() - startTime,
        })
        .eq('id', stage.id);

      return new Response(
        JSON.stringify({ success: true, stageId: stage.id, duration: Date.now() - startTime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const stats = buildStats(tasks);
    const { systemPrompt, userPrompt } = buildPrompt(
      userName,
      sprintContent,
      vision,
      stats,
      feedback,
    );

    const parsed = await callLLM(systemPrompt, userPrompt);

    // Override completionStats with computed values (don't trust LLM for numbers)
    const summaryContent = {
      ...parsed,
      generatedAt: new Date().toISOString(),
      sprintNumber,
      completionStats: {
        ...parsed.completionStats,
        totalTasks: stats.totalTasks,
        completed: stats.completed.length,
        skipped: stats.skipped.length,
        inProgress: stats.inProgress.length,
        pending: stats.pending.length,
        completionRate: stats.completionRate,
      },
    };

    await supabase
      .from('roadmap_stages')
      .update({
        status: 'generated',
        generated_content: summaryContent,
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: Date.now() - startTime,
      })
      .eq('id', stage.id);

    return new Response(
      JSON.stringify({ success: true, stageId: stage.id, duration: Date.now() - startTime }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('generate-sprint-summary error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// ============================================================================
// FETCH SPRINT DATA
// ============================================================================

async function fetchSprintData(
  supabase: SupabaseClient,
  clientId: string,
  sprintNumber: number,
): Promise<FetchSprintDataResult> {
  const [tasksRes, sprintStageRes, visionStageRes, shiftStageRes, clientRes, feedbackRes] =
    await Promise.all([
      supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber)
        .order('week_number', { ascending: true })
        .order('sort_order', { ascending: true }),
      supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content')
        .eq('client_id', clientId)
        .eq('sprint_number', sprintNumber)
        .in('stage_type', ['sprint_plan_part2', 'sprint_plan'])
        .in('status', ['published', 'approved', 'generated'])
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content')
        .eq('client_id', clientId)
        .in('stage_type', ['five_year_vision', 'vision_update'])
        .in('status', ['published', 'approved', 'generated'])
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('roadmap_stages')
        .select('generated_content, approved_content')
        .eq('client_id', clientId)
        .in('stage_type', ['six_month_shift', 'shift_update'])
        .in('status', ['published', 'approved', 'generated'])
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('practice_members')
        .select('name, client_company')
        .eq('id', clientId)
        .single(),
      supabase
        .from('generation_feedback')
        .select('feedback_text, feedback_type, feedback_source')
        .eq('client_id', clientId)
        .eq('stage_type', 'sprint_plan_part2')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  const tasks = tasksRes.data ?? [];
  const sprintStage = sprintStageRes.data;
  const sprintContent =
    sprintStage?.approved_content ?? sprintStage?.generated_content ?? null;
  const visionStage = visionStageRes.data;
  const vision = visionStage?.approved_content ?? visionStage?.generated_content ?? null;
  const shiftStage = shiftStageRes.data;
  const shift = shiftStage?.approved_content ?? shiftStage?.generated_content ?? null;
  const client = clientRes.data ?? null;
  const feedback = feedbackRes.data ?? [];

  return { tasks, sprintContent, vision, shift, client, feedback };
}

// ============================================================================
// BUILD STATS
// ============================================================================

function buildStats(tasks: any[]): BuiltStats {
  const totalTasks = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed');
  const skipped = tasks.filter((t) => t.status === 'pending' && t.completed_at);
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const pending = tasks.filter((t) => t.status === 'pending' && !t.completed_at);
  const completionRate =
    totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;

  const weekStats: Record<number, { total: number; completed: number; skipped: number }> = {};
  for (const t of tasks) {
    const wn = t.week_number ?? 0;
    if (!weekStats[wn]) weekStats[wn] = { total: 0, completed: 0, skipped: 0 };
    weekStats[wn].total++;
    if (t.status === 'completed') weekStats[wn].completed++;
    if (t.status === 'pending' && t.completed_at) weekStats[wn].skipped++;
  }

  const categoryStats: Record<string, { total: number; completed: number }> = {};
  for (const t of tasks) {
    const cat = t.category || 'general';
    if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0 };
    categoryStats[cat].total++;
    if (t.status === 'completed') categoryStats[cat].completed++;
  }

  const taskFeedback = completed
    .filter(
      (t) =>
        t.completion_feedback?.whatWentWell || t.completion_feedback?.whatDidntWork,
    )
    .map((t) => ({
      week: t.week_number ?? 0,
      title: t.title ?? '',
      whatWentWell: t.completion_feedback?.whatWentWell ?? '',
      whatDidntWork: t.completion_feedback?.whatDidntWork ?? '',
      additionalNotes: t.completion_feedback?.additionalNotes ?? '',
    }));

  const skippedHighPriority = tasks
    .filter(
      (t) =>
        t.status === 'pending' &&
        t.completed_at &&
        (t.priority === 'critical' || t.priority === 'high'),
    )
    .map((t) => ({
      week: t.week_number ?? 0,
      title: t.title ?? '',
      priority: t.priority ?? 'high',
    }));

  return {
    totalTasks,
    completed,
    skipped,
    inProgress,
    pending,
    completionRate,
    weekStats,
    categoryStats,
    taskFeedback,
    skippedHighPriority,
  };
}

// ============================================================================
// BUILD PROMPT
// ============================================================================

function buildPrompt(
  userName: string,
  sprintContent: any,
  vision: any,
  stats: BuiltStats,
  advisorFeedback: any[],
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are reviewing a client's completed 12-week transformation sprint.

Write with warmth and specificity — use their name, reference their actual tasks and feedback. 
This is a celebration of progress AND an honest assessment of what still needs work.

Sound like a thoughtful advisor who knows this person, not a corporate report generator.

ANTI-AI-SLOP RULES:
BANNED: Additionally, delve, crucial, pivotal, testament, underscores, showcases, fostering, tapestry, landscape, synergy, leverage, scalable, holistic, impactful, ecosystem, vibrant, intricate
BANNED STRUCTURES: "Not only X but also Y", "It's important to note", "In summary", rule of three lists
THE TEST: If it sounds like a LinkedIn post, rewrite it.

Return ONLY valid JSON — no markdown, no explanation. British English only (organise, colour, £).`;

  const sprintTheme =
    sprintContent?.sprintTheme ?? sprintContent?.theme ?? '';
  const sprintPromise =
    sprintContent?.sprintPromise ?? sprintContent?.promise ?? '';
  const sprintGoals =
    sprintContent?.sprintGoals ?? sprintContent?.goals ?? [];

  const northStar =
    vision?.tagline ?? vision?.northStar ?? 'Not available';

  const weekBreakdown = Object.entries(stats.weekStats)
    .map(
      ([wk, s]) =>
        `Week ${wk}: ${s.completed}/${s.total} completed, ${s.skipped} skipped`,
    )
    .join('\n');
  const categoryBreakdown = Object.entries(stats.categoryStats)
    .map(([cat, s]) => `${cat}: ${s.completed}/${s.total}`)
    .join('\n');

  const clientFeedbackSection =
    stats.taskFeedback.length > 0
      ? stats.taskFeedback
          .map(
            (f) =>
              `Week ${f.week} — "${f.title}"\n  Went well: ${f.whatWentWell}\n  Didn't work: ${f.whatDidntWork}\n  Notes: ${f.additionalNotes}`,
          )
          .join('\n\n')
      : 'No feedback submitted.';

  const skippedHighSection =
    stats.skippedHighPriority.length > 0
      ? stats.skippedHighPriority
          .map((t) => `Week ${t.week}: "${t.title}" (${t.priority})`)
          .join('\n')
      : 'None.';

  const advisorNotes =
    advisorFeedback?.map((f: any) => f.feedback_text).join('\n') || 'None.';

  const userPrompt = `Generate a sprint summary for ${userName}.

## SPRINT CONTEXT
Sprint Theme: "${sprintTheme}"
Sprint Promise: "${sprintPromise}"
Sprint Goals: ${JSON.stringify(sprintGoals)}

## THEIR NORTH STAR
${northStar}

## COMPLETION DATA
Total tasks: ${stats.totalTasks}
Completed: ${stats.completed.length} (${stats.completionRate}%)
Skipped: ${stats.skipped.length}
Still in progress: ${stats.inProgress.length}
Still pending: ${stats.pending.length}

Week-by-week breakdown:
${weekBreakdown}

Category breakdown:
${categoryBreakdown}

## CLIENT FEEDBACK (their exact words)
${clientFeedbackSection}

## SKIPPED HIGH-PRIORITY TASKS (potential concerns)
${skippedHighSection}

## ADVISOR NOTES
${advisorNotes}

Return JSON matching this structure:

{
  "headline": "One-sentence celebration of what they achieved (personalised, warm)",
  "completionStats": {
    "totalTasks": number,
    "completed": number,
    "skipped": number,
    "completionRate": number,
    "strongestWeek": number,
    "weakestWeek": number
  },
  "achievements": [
    {
      "title": "Short title",
      "description": "What they did and why it matters (2-3 sentences, reference specific tasks)",
      "category": "category name",
      "impactLevel": "high" | "medium"
    }
  ],
  "growthAreas": [
    {
      "title": "Short title",
      "description": "What didn't land and why (honest, constructive, not judgmental)",
      "suggestedFocus": "What Sprint 2 should address"
    }
  ],
  "behaviouralShifts": {
    "whatChanged": "Narrative paragraph — what actually shifted in how they work/live (based on completed tasks and feedback)",
    "whatDidnt": "Narrative paragraph — what patterns persist (based on skipped tasks and feedback)",
    "tuesdayTestProgress": "How their Tuesday has changed (or hasn't) since sprint start"
  },
  "clientVoice": {
    "bestQuote": "Most impactful thing they said in feedback (exact words)",
    "concernQuote": "Most telling concern from their feedback (exact words or null)"
  },
  "nextSprintRecommendations": [
    {
      "focus": "Recommended focus area for next sprint",
      "reason": "Why — based on this sprint's data"
    }
  ],
  "advisorBrief": "3-4 sentence brief for the advisor: what to discuss in the renewal conversation, key concerns, suggested approach"
}`;

  return { systemPrompt, userPrompt };
}

// ============================================================================
// CALL LLM
// ============================================================================

async function callLLM(systemPrompt: string, userPrompt: string): Promise<any> {
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
      temperature: 0.6,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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
  const cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1) throw new Error('Failed to find JSON in response');

  try {
    return JSON.parse(cleaned.substring(start, end + 1));
  } catch {
    const fixed = cleaned
      .substring(start, end + 1)
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(fixed);
  }
}
