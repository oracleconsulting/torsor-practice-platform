// ============================================================================
// GENERATE LIFE DESIGN REFRESH (Phase 4 — Renewal)
// ============================================================================
// Rule-based merge of Part 1 + Quarterly Life Check + Sprint 1 Summary.
// No LLM. Output feeds vision_update and shift_update.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, sprintNumber = 2 } = await req.json();
    if (!clientId || !practiceId) throw new Error('clientId and practiceId required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const prevSprint = sprintNumber - 1;

    const { data: part1Data } = await supabase
      .from('client_assessments')
      .select('responses')
      .eq('client_id', clientId)
      .eq('assessment_type', 'part1')
      .maybeSingle();
    const part1 = (part1Data?.responses as Record<string, any>) || {};

    const { data: lifeCheck } = await supabase
      .from('quarterly_life_checks')
      .select('*')
      .eq('client_id', clientId)
      .eq('sprint_number', prevSprint)
      .maybeSingle();

    const { data: prevSummaryStage } = await supabase
      .from('roadmap_stages')
      .select('generated_content, approved_content')
      .eq('client_id', clientId)
      .eq('stage_type', 'sprint_summary')
      .eq('sprint_number', prevSprint)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const prevSummaryContent = prevSummaryStage?.approved_content || prevSummaryStage?.generated_content;
    const prevSummary = prevSummaryContent?.summary || {};
    const prevAnalytics = prevSummaryContent?.analytics || {};

    const updatedTuesday = lifeCheck?.tuesday_test_update || part1.tuesday_test || '';
    const updatedNorthStar =
      (prevSummary?.renewalRecommendations?.lifeDesignAdjustment as string) ||
      part1.north_star ||
      updatedTuesday?.slice(0, 80) ||
      'Align life and business';

    const refreshedProfile = {
      northStar: updatedNorthStar,
      tagline: updatedNorthStar,
      archetype: (part1.archetype as string) || 'balanced_achiever',
      archetypeExplanation:
        lifeCheck?.priority_shift || part1.danger_zone || 'Evolved through sprint 1.',

      originalTuesdayTest: part1.tuesday_test || '',
      originalDangerZone: part1.danger_zone || '',
      originalRelationshipMirror: part1.relationship_mirror || '',
      originalCommitmentHours: part1.commitment_hours ?? part1.hours_to_reclaim ?? '',
      originalNinetyDayPriorities: part1.ninety_day_priorities ?? part1.priorities_90_days ?? '',

      updatedTuesdayTest: updatedTuesday,
      timeReclaimProgress: lifeCheck?.time_reclaim_progress ?? null,
      biggestWin: lifeCheck?.biggest_win ?? null,
      biggestFrustration: lifeCheck?.biggest_frustration ?? null,
      priorityShift: lifeCheck?.priority_shift ?? null,
      nextSprintWish: lifeCheck?.next_sprint_wish ?? null,

      sprint1CompletionRate: prevAnalytics?.completionRate ?? null,
      sprint1SkipPatterns: prevSummary?.skipAnalysis ?? null,
      sprint1Strengths: prevSummary?.strengthsRevealed ?? [],
      sprint1GrowthAreas: prevSummary?.growthAreas ?? [],
      sprint1RenewalRecommendations: prevSummary?.renewalRecommendations ?? null,

      tuesdayTestEvolution: {
        original: part1.tuesday_test || '',
        afterSprint1: updatedTuesday,
        progressAssessment: prevSummary?.tuesdayTestComparison?.progress ?? null,
      },
      sprintNumber,
    };

    const { data: existing } = await supabase
      .from('roadmap_stages')
      .select('version')
      .eq('client_id', clientId)
      .eq('stage_type', 'life_design_refresh')
      .eq('sprint_number', sprintNumber)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = existing ? (existing.version + 1) : 1;

    const { data: stage, error: insertErr } = await supabase
      .from('roadmap_stages')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        stage_type: 'life_design_refresh',
        sprint_number: sprintNumber,
        version: nextVersion,
        status: 'generated',
        generated_content: refreshedProfile,
        generation_completed_at: new Date().toISOString(),
        model_used: 'rule-based',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ success: true, stageId: stage.id, sprintNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-life-design-refresh error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
