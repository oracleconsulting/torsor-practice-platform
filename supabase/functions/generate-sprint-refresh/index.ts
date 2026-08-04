// ============================================================================
// GENERATE SPRINT REFRESH — Mid-sprint replan at weeks 3, 6, 9
// ============================================================================
// Loads the optional sprint_checkpoint_reviews row for the checkpoint being
// processed and regenerates the weeks ahead. Client-stated context (especially
// whats_changed and capacity_outlook) is weighted above inference from task
// outcomes. Skipping the review does not block anything — this function simply
// has less signal when no review exists.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GA_SYSTEM_PROMPT } from '../_shared/ga-system-prompt.ts';
import { recordLlmCostByClient } from '../_shared/llm-cost-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHECKPOINT_WEEKS = [3, 6, 9] as const;

type CapacityOutlook = 'lighter' | 'similar' | 'heavier';

function capacityGuidance(outlook: CapacityOutlook | null | undefined): string {
  if (outlook === 'lighter') {
    return 'CAPACITY: Client said capacity is lighter. Generate fewer tasks and shorter ones. Prefer 2–3 tasks per week, each doable in under 45 minutes.';
  }
  if (outlook === 'heavier') {
    return 'CAPACITY: Client said capacity is more than usual. Normal task load is fine; you may keep the full planned density.';
  }
  if (outlook === 'similar') {
    return 'CAPACITY: Client said capacity is about the same. Keep the normal task load.';
  }
  return 'CAPACITY: No capacity answer. Keep the normal task load.';
}

function buildRefreshPrompt(args: {
  checkpointWeek: number;
  weeksToRegenerate: number[];
  existingWeeks: any[];
  review: any | null;
  taskOutcomes: any[];
  pulseSummary: string;
}): string {
  const { checkpointWeek, weeksToRegenerate, existingWeeks, review, taskOutcomes, pulseSummary } =
    args;

  const pastWeeks = existingWeeks.filter(
    (w: any) => (w.weekNumber ?? w.week) <= checkpointWeek,
  );
  const upcomingStub = existingWeeks.filter((w: any) =>
    weeksToRegenerate.includes(w.weekNumber ?? w.week),
  );

  const reviewBlock = review
    ? `
# CLIENT CHECKPOINT REVIEW (PRIMARY SIGNAL — weight above task inference)
The client answered these after week ${checkpointWeek}. Treat as ground truth about their business and capacity. Where whats_changed contradicts anything in the existing upcoming plan, CORRECT the plan — that is the purpose of this refresh.

- What worked: ${review.what_worked || '(not answered)'}
- What didn't: ${review.what_didnt || '(not answered)'}
- What's changed in the business: ${review.whats_changed || '(not answered)'}
- Where they want the next three weeks pointed: ${review.next_three_weeks || '(not answered)'}
- Capacity outlook: ${review.capacity_outlook || '(not answered)'}

${capacityGuidance(review.capacity_outlook)}
`
    : `
# CLIENT CHECKPOINT REVIEW
No review was submitted (optional). Infer carefully from task outcomes and pulses only. Do not invent business changes.
${capacityGuidance(null)}
`;

  return `# SPRINT CHECKPOINT REFRESH — Week ${checkpointWeek}

You are regenerating weeks ${weeksToRegenerate.join(', ')} of a 12-week Goal Alignment sprint after a three-week checkpoint.

${reviewBlock}

# PULSE SUMMARY (secondary)
${pulseSummary}

# TASK OUTCOMES TO DATE (secondary — never override client-stated whats_changed)
${JSON.stringify(taskOutcomes, null, 2)}

# WEEKS ALREADY LIVED (keep as context; do not rewrite)
${JSON.stringify(pastWeeks, null, 2)}

# CURRENT PLAN FOR WEEKS TO REGENERATE (replace these)
${JSON.stringify(upcomingStub, null, 2)}

# OUTPUT
Return a JSON object:
{
  "weeks": [
    {
      "weekNumber": <number>,
      "theme": "...",
      "phase": "...",
      "narrative": "...",
      "focus": "...",
      "weekMilestone": "...",
      "tasks": [
        {
          "title": "...",
          "description": "...",
          "category": "...",
          "estimatedMinutes": <number>
        }
      ]
    }
  ],
  "refreshNotes": "Brief note on what changed and why (especially corrections from whats_changed)"
}

Rules:
- Exactly one object per week in [${weeksToRegenerate.join(', ')}].
- British English.
- If whats_changed says someone left, a system was fixed, or ownership moved — update who/what the tasks assume. Do not keep stale assumptions.
- Keep life_* tasks if the original weeks had them; otherwise match the mix of the existing plan.
- Do not invent company facts not in the review or outcomes.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const clientId = body.clientId as string;
    const practiceId = body.practiceId as string;
    const sprintNumber = Number(body.sprintNumber ?? 1);
    const checkpointWeek = Number(body.checkpointWeek);

    if (!clientId || !practiceId) throw new Error('clientId and practiceId required');
    if (!(CHECKPOINT_WEEKS as readonly number[]).includes(checkpointWeek)) {
      throw new Error('checkpointWeek must be 3, 6 or 9');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const weeksToRegenerate =
      checkpointWeek === 3
        ? [4, 5, 6]
        : checkpointWeek === 6
          ? [7, 8, 9]
          : [10, 11, 12];

    const { data: review } = await supabase
      .from('sprint_checkpoint_reviews')
      .select('*')
      .eq('client_id', clientId)
      .eq('sprint_number', sprintNumber)
      .eq('checkpoint_week', checkpointWeek)
      .maybeSingle();

    const { data: stages } = await supabase
      .from('roadmap_stages')
      .select(
        'id, stage_type, version, sprint_number, generated_content, approved_content, status',
      )
      .eq('client_id', clientId)
      .eq('practice_id', practiceId)
      .in('stage_type', ['sprint_plan', 'sprint_plan_part1', 'sprint_plan_part2'])
      .in('status', ['generated', 'approved', 'published'])
      .order('created_at', { ascending: false });

    if (!stages?.length) throw new Error('No sprint plan found for client');

    // Prefer full sprint_plan, else merge part1/part2 content from newest rows
    let sprintContent: any = null;
    const primaryStage = stages.find((s) => s.stage_type === 'sprint_plan') || stages[0];
    const content = primaryStage.approved_content || primaryStage.generated_content;
    sprintContent = content?.sprint ? content : { sprint: content };
    if (!sprintContent?.sprint?.weeks && stages.length > 1) {
      const weeks: any[] = [];
      for (const s of stages) {
        const c = s.approved_content || s.generated_content;
        const w = c?.sprint?.weeks || c?.weeks || [];
        weeks.push(...w);
      }
      sprintContent = { sprint: { ...(content?.sprint || content || {}), weeks } };
    }

    const existingWeeks: any[] = sprintContent?.sprint?.weeks || [];
    const stageType = primaryStage.stage_type as string;

    const { data: tasks } = await supabase
      .from('client_tasks')
      .select('title, week_number, status, category, completion_feedback, skip_reason')
      .eq('client_id', clientId)
      .eq('sprint_number', sprintNumber)
      .lte('week_number', checkpointWeek)
      .order('week_number', { ascending: true });

    const { data: pulses } = await supabase
      .from('life_pulse_entries')
      .select('week_number, alignment_rating, protect_next_week, active_categories')
      .eq('client_id', clientId)
      .eq('sprint_number', sprintNumber)
      .lte('week_number', checkpointWeek)
      .order('week_number', { ascending: true });

    const pulseSummary =
      (pulses || [])
        .map(
          (p: any) =>
            `Week ${p.week_number}: rating ${p.alignment_rating}/5; protect: ${p.protect_next_week || '—'}; categories: ${(p.active_categories || []).join(', ') || '—'}`,
        )
        .join('\n') || 'No pulses yet.';

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const prompt = buildRefreshPrompt({
      checkpointWeek,
      weeksToRegenerate,
      existingWeeks,
      review,
      taskOutcomes: tasks || [],
      pulseSummary,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    let data: any;
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://torsor.co.uk',
          'X-Title': 'Torsor Sprint Checkpoint Refresh',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
          max_tokens: 8000,
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: GA_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`LLM error: ${response.status} - ${errText}`);
      }
      data = await response.json();
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e?.name === 'AbortError') throw new Error('OpenRouter request timed out');
      throw e;
    }

    try {
      await recordLlmCostByClient({
        supabase,
        clientId,
        operationType: 'sprint_plan_generation',
        sourceFunction: 'generate-sprint-refresh',
        model: 'anthropic/claude-sonnet-4.5',
        inputTokens: data?.usage?.prompt_tokens ?? 0,
        outputTokens: data?.usage?.completion_tokens ?? 0,
        serviceLineCode: '365_method',
        metadata: { checkpointWeek, sprintNumber },
      });
    } catch (_) {
      /* ignore */
    }

    const raw = data.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Failed to parse refresh JSON');
    const parsed = JSON.parse(cleaned.substring(start, end + 1));
    const newWeeks: any[] = parsed.weeks || [];

    if (newWeeks.length === 0) throw new Error('Refresh returned no weeks');

    // Weeks 1..checkpointWeek stay verbatim from the source row. Regenerated
    // weeks replace their window; anything beyond that window is kept as-is.
    const weekNum = (w: any) => w.weekNumber ?? w.week;
    const pastWeeks = existingWeeks.filter((w) => weekNum(w) <= checkpointWeek);
    const untouchedFuture = existingWeeks.filter(
      (w) => weekNum(w) > checkpointWeek && !weeksToRegenerate.includes(weekNum(w)),
    );
    const refreshedWeeks = weeksToRegenerate.map((n) => {
      const fromLlm = newWeeks.find((w) => weekNum(w) === n);
      if (!fromLlm) throw new Error(`Refresh missing week ${n}`);
      return { ...fromLlm, weekNumber: n };
    });
    const mergedWeeks = [...pastWeeks, ...refreshedWeeks, ...untouchedFuture].sort(
      (a, b) => weekNum(a) - weekNum(b),
    );

    const baseContent = primaryStage.approved_content || primaryStage.generated_content || {};
    const generatedContent: any = {
      ...baseContent,
      sprint: {
        ...(baseContent.sprint || baseContent),
        weeks: mergedWeeks,
        lastCheckpointRefresh: {
          checkpointWeek,
          refreshedAt: new Date().toISOString(),
          refreshNotes: parsed.refreshNotes || null,
          hadClientReview: !!review,
          capacityOutlook: review?.capacity_outlook ?? null,
          sourceStageId: primaryStage.id,
        },
      },
    };
    if (!baseContent.sprint && baseContent.weeks) {
      generatedContent.weeks = mergedWeeks;
    }

    const { data: latestVersionRow } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', stageType)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (latestVersionRow?.version ?? 0) + 1;
    const now = new Date().toISOString();

    // New version for admin review — never overwrite the published/source row.
    const { data: insertedStage, error: insertError } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: stageType,
        sprint_number: primaryStage.sprint_number ?? sprintNumber,
        version: nextVersion,
        status: 'generated',
        generated_content: generatedContent,
        approved_content: null,
        published_at: null,
        manually_edited: false,
        created_at: now,
        updated_at: now,
        generation_completed_at: now,
        model_used: 'anthropic/claude-sonnet-4.5',
      })
      .select('id, version')
      .single();

    if (insertError) {
      throw new Error(`Failed to save refresh version: ${insertError.message}`);
    }

    // client_tasks are created lazily on first click — do not pre-insert or
    // delete rows here. Regenerated weeks have no rows yet by definition.

    return new Response(
      JSON.stringify({
        success: true,
        checkpointWeek,
        weeksRegenerated: weeksToRegenerate,
        hadClientReview: !!review,
        refreshNotes: parsed.refreshNotes || null,
        stageId: insertedStage?.id ?? null,
        version: insertedStage?.version ?? nextVersion,
        status: 'generated',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[generate-sprint-refresh]', err);
    return new Response(JSON.stringify({ error: err.message || 'Refresh failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
