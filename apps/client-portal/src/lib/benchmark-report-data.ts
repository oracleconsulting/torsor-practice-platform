import type { SupabaseClient } from '@supabase/supabase-js';
import { mergeBenchmarkHvaForClientView } from '@torsor/platform/lib/benchmarking/merge-benchmark-hva';

export interface ClientBenchSession {
  clientId: string;
  practiceId?: string | null;
}

export type BenchReportPayloadResult =
  | {
      ok: true;
      report: Record<string, unknown>;
      clientCompany: string;
      practitionerInfo: { name?: string; email?: string };
    }
  | { ok: false; error: string };

/**
 * Shared loader for client portal benchmarking: engagement gate, bm_reports row,
 * Part 3 HVA merge (prefer rich bm_reports.hva_data — same as admin modal).
 */
export async function fetchBenchmarkReportPayload(
  supabase: SupabaseClient,
  session: ClientBenchSession
): Promise<BenchReportPayloadResult> {
  const { clientId, practiceId } = session;
  if (!clientId) {
    return { ok: false, error: 'No client session found' };
  }

  const { data: clientData } = await supabase
    .from('practice_members')
    .select('client_company, company, name')
    .eq('id', clientId)
    .maybeSingle();

  const clientCompany =
    clientData?.client_company || clientData?.company || clientData?.name || 'Your Company';

  const { data: engagement, error: engagementError } = await supabase
    .from('bm_engagements')
    .select('id, report_shared_with_client')
    .eq('client_id', clientId)
    .maybeSingle();

  if (engagementError || !engagement) {
    return { ok: false, error: 'No benchmarking engagement found' };
  }

  if (!engagement.report_shared_with_client) {
    return {
      ok: false,
      error: 'Report not yet available. Your advisor will share it with you when ready.',
    };
  }

  const { data: report, error: reportError } = await supabase
    .from('bm_reports')
    .select('*')
    .eq('engagement_id', engagement.id)
    .maybeSingle();

  if (reportError) {
    return { ok: false, error: 'Unable to load report' };
  }

  if (!report) {
    return {
      ok: false,
      error: 'Report not yet available. Your advisor will share it with you when ready.',
    };
  }

  const { data: hvaAssessment } = await supabase
    .from('client_assessments')
    .select('responses')
    .eq('client_id', clientId)
    .eq('assessment_type', 'part3')
    .maybeSingle();

  const pass1Raw = report.pass1_data;
  let pass1_data: unknown = pass1Raw;
  if (typeof pass1Raw === 'string') {
    try {
      pass1_data = JSON.parse(pass1Raw) as unknown;
    } catch {
      pass1_data = null;
    }
  }

  const hva_data = mergeBenchmarkHvaForClientView(
    report as { hva_data?: unknown },
    hvaAssessment
  );

  const merged: Record<string, unknown> = {
    ...report,
    pass1_data,
    ...(hva_data !== undefined ? { hva_data } : {}),
  };

  let practitionerInfo: { name?: string; email?: string } = {};
  if (practiceId) {
    const { data: practice } = await supabase
      .from('practices')
      .select('name, support_email')
      .eq('id', practiceId)
      .maybeSingle();
    if (practice) {
      practitionerInfo = { name: practice.name, email: practice.support_email };
    }
  }

  return { ok: true, report: merged, clientCompany, practitionerInfo };
}
