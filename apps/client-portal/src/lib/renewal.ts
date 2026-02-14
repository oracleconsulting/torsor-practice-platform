// ============================================================================
// Renewal eligibility and status (Phase 4)
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

export interface RenewalEligibility {
  isEligible: boolean;
  reason: string;
  currentSprint: number;
  maxSprints: number;
  tierName: string;
  sprintSummaryApproved: boolean;
  renewalStatus: string;
}

export async function checkRenewalEligibility(
  supabase: SupabaseClient,
  clientId: string,
  practiceId: string
): Promise<RenewalEligibility> {
  const defaultResult: RenewalEligibility = {
    isEligible: false,
    reason: 'Not enrolled in Goal Alignment',
    currentSprint: 1,
    maxSprints: 1,
    tierName: 'Lite',
    sprintSummaryApproved: false,
    renewalStatus: 'not_started',
  };

  const { data: enrollment, error: enrollError } = await supabase
    .from('client_service_lines')
    .select('current_sprint_number, max_sprints, tier_name, renewal_status')
    .eq('client_id', clientId)
    .eq('service_line_code', '365_method')
    .maybeSingle();

  if (enrollError || !enrollment) {
    return { ...defaultResult, reason: enrollment ? 'Not enrolled in Goal Alignment' : 'Could not load enrollment' };
  }

  const currentSprint = enrollment.current_sprint_number ?? 1;
  const maxSprints = enrollment.max_sprints ?? 1;
  const tierName = enrollment.tier_name || 'Growth';
  const renewalStatus = enrollment.renewal_status || 'not_started';

  const { data: summary } = await supabase
    .from('roadmap_stages')
    .select('status')
    .eq('client_id', clientId)
    .eq('stage_type', 'sprint_summary')
    .eq('sprint_number', currentSprint)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sprintSummaryApproved =
    summary?.status === 'approved' || summary?.status === 'published';
  const hasSprintsRemaining = currentSprint < maxSprints;

  let reason = 'Ready for renewal';
  if (!sprintSummaryApproved) reason = 'Sprint Summary needs approval first';
  else if (!hasSprintsRemaining)
    reason = `Sprint limit reached (${maxSprints} on ${tierName} tier)`;

  return {
    isEligible: sprintSummaryApproved && hasSprintsRemaining,
    reason,
    currentSprint,
    maxSprints,
    tierName,
    sprintSummaryApproved,
    renewalStatus,
  };
}
