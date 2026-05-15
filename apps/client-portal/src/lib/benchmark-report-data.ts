import type { SupabaseClient } from '@supabase/supabase-js';
import { mergeBenchmarkHvaForClientView } from '@torsor/platform/lib/benchmarking/merge-benchmark-hva';

export interface ClientBenchSession {
  clientId: string;
  practiceId?: string | null;
}

export interface BenchmarkReportOption {
  engagementId: string;
  label: string;
  businessStage?: string | null;
  headline?: string | null;
  updatedAt?: string | null;
}

export type BenchReportPayloadResult =
  | {
      ok: true;
      report: Record<string, unknown>;
      reports: BenchmarkReportOption[];
      selectedEngagementId: string;
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
  session: ClientBenchSession,
  preferredEngagementId?: string | null
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

  const { data: engagements, error: engagementError } = await supabase
    .from('bm_engagements')
    .select('id, report_shared_with_client, business_stage, created_at, updated_at')
    .eq('client_id', clientId)
    .eq('report_shared_with_client', true)
    .order('updated_at', { ascending: false, nullsFirst: false });

  if (engagementError || !engagements?.length) {
    return { ok: false, error: 'No benchmarking engagement found' };
  }

  const engagementIds = engagements.map((engagement: any) => engagement.id).filter(Boolean);

  const { data: reportsData, error: reportError } = await supabase
    .from('bm_reports')
    .select('*')
    .in('engagement_id', engagementIds)
    .eq('is_shared_with_client', true);

  if (reportError) {
    return { ok: false, error: 'Unable to load report' };
  }

  const reports = reportsData || [];
  const reportByEngagement = new Map<string, any>(
    reports.map((report: any) => [report.engagement_id, report])
  );
  const sharedEngagements = engagements.filter((engagement: any) => reportByEngagement.has(engagement.id));

  const selectedEngagement =
    (preferredEngagementId
      ? sharedEngagements.find((engagement: any) => engagement.id === preferredEngagementId)
      : null) ||
    sharedEngagements[0];

  const report = selectedEngagement ? reportByEngagement.get(selectedEngagement.id) : null;

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

  const options: BenchmarkReportOption[] = sharedEngagements.map((engagement: any, index: number) => {
    const row = reportByEngagement.get(engagement.id);
    const businessStage = engagement.business_stage || row?.pass1_data?.business_stage || row?.business_stage;
    const isPreRevenue = businessStage === 'pre_revenue' || businessStage === 'early_revenue';
    return {
      engagementId: engagement.id,
      label: isPreRevenue ? 'Pre-revenue benchmark' : 'Trading benchmark',
      businessStage,
      headline: row?.headline || null,
      updatedAt: row?.updated_at || engagement.updated_at || engagement.created_at || null,
    };
  }).map((option, index, all) => ({
    ...option,
    label: all.filter((o) => o.label === option.label).length > 1
      ? `${option.label} ${index + 1}`
      : option.label,
  }));

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

  return {
    ok: true,
    report: merged,
    reports: options,
    selectedEngagementId: selectedEngagement.id,
    clientCompany,
    practitionerInfo,
  };
}
