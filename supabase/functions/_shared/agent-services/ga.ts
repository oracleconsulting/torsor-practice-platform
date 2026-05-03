// Goal Alignment service module for the advisory agent.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ServiceModule } from './types.ts';

const GA_PROMPT = `

GOAL ALIGNMENT SERVICE CONTEXT

This client is enrolled in the Goal Alignment programme (12-week sprints,
fit profile -> 5-year vision -> 6-month shift -> sprint plan -> value
analysis). When emitting \`proposed_change\` blocks for GA content, use one
of these stage_type values:
  fit_assessment | five_year_vision | six_month_shift |
  sprint_plan | sprint_plan_part1 | sprint_plan_part2 |
  value_analysis | advisory_brief | insight_report |
  director_alignment

These are the only stage_type values that can be applied directly. Suggesting
changes to other parts of the client's record (BM positioning, SA findings,
MA insights) is fine, but the advisor will apply those manually.
`;

// Generous per-stage budget so the agent can do full-stage batch rewrites.
// 1M-token context windows mean we can afford this — see WS2 observation
// "Agent context truncates roadmap stage content, blocking full-stage rewrite
// batches".
const PER_STAGE_CHAR_CAP = 30_000;

function safeJsonString(value: unknown, max: number = PER_STAGE_CHAR_CAP): string {
  try {
    const s = JSON.stringify(value);
    return s.length > max ? `${s.slice(0, max)}...[truncated]` : s;
  } catch {
    return String(value).slice(0, max);
  }
}

async function fetchGAContext(
  supabase: SupabaseClient,
  clientId: string,
): Promise<string> {
  const [{ data: stages }, { data: enrol }] = await Promise.all([
    supabase
      .from('roadmap_stages')
      .select('stage_type, status, version, generated_content, approved_content, manually_edited')
      .eq('client_id', clientId)
      .in('status', ['published', 'approved', 'generated'])
      .order('version', { ascending: false }),
    supabase
      .from('client_service_lines')
      .select('current_sprint_number, sprint_start_date, tier_name, service_lines(code)')
      .eq('client_id', clientId),
  ]);

  if (!stages || stages.length === 0) return '';

  // Latest version per stage
  const latest = new Map<string, any>();
  for (const s of stages) {
    if (!latest.has(s.stage_type)) latest.set(s.stage_type, s);
  }

  const ga = (enrol ?? []).find((sl: any) => {
    const code = Array.isArray(sl.service_lines) ? sl.service_lines[0]?.code : sl.service_lines?.code;
    return code === '365_method' || code === '365_alignment';
  });

  const lines: string[] = ['GOAL ALIGNMENT DATA:'];
  if (ga) {
    lines.push(`Tier: ${ga.tier_name ?? 'unknown'}, Sprint ${ga.current_sprint_number ?? 1}, started ${ga.sprint_start_date ?? 'not yet'}`);
  }
  for (const s of latest.values()) {
    const flag = s.manually_edited ? ' [edited]' : '';
    const content = s.approved_content ?? s.generated_content ?? null;
    lines.push(`\n--- ${s.stage_type} (${s.status}, v${s.version})${flag} ---`);
    lines.push(safeJsonString(content, PER_STAGE_CHAR_CAP));
  }
  return lines.join('\n');
}

export const gaModule: ServiceModule = {
  codes: ['365_method', '365_alignment'],
  label: 'Goal Alignment',
  systemPromptModule: GA_PROMPT,
  fetchContext: fetchGAContext,
  allowedTargets: [
    {
      table: 'roadmap_stages',
      jsonbColumn: 'approved_content',
      label: 'Roadmap stage',
      rowDescription: 'the latest version of the named stage_type for this client',
    },
  ],
};
