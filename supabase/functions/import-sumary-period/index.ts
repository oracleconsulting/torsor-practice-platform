/**
 * Sumary import: map structured MI payload → bi_financial_data (+ ma mirror), KPI tracking, ratio/variance values.
 * No AI extraction. Invokes save-kpi-values for ma_kpi_tracking when ma_engagement exists.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PeriodType = 'monthly' | 'quarterly';
type SourceType = 'manual_csv' | 'manual_json' | 'api';

interface ImportBody {
  engagementId: string;
  periodStart: string;
  periodEnd: string;
  periodType: PeriodType;
  source: SourceType;
  payload: Record<string, unknown>;
  importedBy?: string;
}

const MA_TIER_TO_BI: Record<string, 'clarity' | 'foresight' | 'strategic'> = {
  bronze: 'clarity',
  silver: 'foresight',
  gold: 'foresight',
  platinum: 'strategic',
};

function flattenPayload(obj: Record<string, unknown>, prefix = ''): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenPayload(v as Record<string, unknown>, key));
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      out[key] = v;
    } else if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
      out[key] = Number(v);
    }
  }
  return out;
}

function applyTransform(val: number, transform: string | null): number {
  switch (transform) {
    case 'negate':
      return -val;
    case 'divide_100':
      return val / 100;
    case 'raw':
    default:
      return val;
  }
}

/** Fallback when bi_sumary_field_mappings is empty */
const DEFAULT_MAPPINGS: Array<{
  sumary_key: string;
  internal_field: string;
  transform: string;
}> = [
  { sumary_key: 'revenue', internal_field: 'revenue', transform: 'raw' },
  { sumary_key: 'turnover', internal_field: 'revenue', transform: 'raw' },
  { sumary_key: 'cost_of_sales', internal_field: 'cost_of_sales', transform: 'raw' },
  { sumary_key: 'gross_profit', internal_field: 'gross_profit', transform: 'raw' },
  { sumary_key: 'overheads', internal_field: 'overheads', transform: 'raw' },
  { sumary_key: 'operating_profit', internal_field: 'operating_profit', transform: 'raw' },
  { sumary_key: 'net_profit', internal_field: 'net_profit', transform: 'raw' },
  { sumary_key: 'cash_at_bank', internal_field: 'cash_at_bank', transform: 'raw' },
  { sumary_key: 'trade_debtors', internal_field: 'trade_debtors', transform: 'raw' },
  { sumary_key: 'trade_creditors', internal_field: 'trade_creditors', transform: 'raw' },
  { sumary_key: 'stock', internal_field: 'stock', transform: 'raw' },
  { sumary_key: 'fixed_assets', internal_field: 'fixed_assets', transform: 'raw' },
  { sumary_key: 'vat_liability', internal_field: 'vat_liability', transform: 'raw' },
  { sumary_key: 'paye_liability', internal_field: 'paye_liability', transform: 'raw' },
  { sumary_key: 'corporation_tax_liability', internal_field: 'corporation_tax_liability', transform: 'raw' },
  { sumary_key: 'bank_loans', internal_field: 'bank_loans', transform: 'raw' },
  { sumary_key: 'director_loans', internal_field: 'director_loans', transform: 'raw' },
  { sumary_key: 'monthly_operating_costs', internal_field: 'monthly_operating_costs', transform: 'raw' },
  { sumary_key: 'monthly_payroll_costs', internal_field: 'monthly_payroll_costs', transform: 'raw' },
  { sumary_key: 'fte_count', internal_field: 'fte_count', transform: 'raw' },
  { sumary_key: 'prior_revenue', internal_field: 'prior_revenue', transform: 'raw' },
  { sumary_key: 'yoy_revenue', internal_field: 'yoy_revenue', transform: 'raw' },
];

type FinRow = Record<string, number | string | null>;

function mapToFinancialRow(
  flat: Record<string, number>,
  mappings: Array<{ sumary_key: string; internal_field: string; transform: string | null; is_required?: boolean | null }>,
): FinRow {
  const row: FinRow = {};
  const missing: string[] = [];
  for (const m of mappings) {
    const raw = flat[m.sumary_key];
    if (raw === undefined) {
      if (m.is_required) missing.push(m.sumary_key);
      continue;
    }
    row[m.internal_field] = applyTransform(Number(raw), m.transform || 'raw');
  }
  if (missing.length) {
    throw new Error(`Missing required Sumary keys: ${missing.join(', ')}`);
  }
  row.data_source = 'manual';
  row.data_confidence = 'high';
  row.data_notes = 'Imported via Sumary';
  return row;
}

async function ensureBiEngagement(
  supabase: ReturnType<typeof createClient>,
  maEng: { id: string; client_id: string; practice_id: string; tier: string; frequency: string },
): Promise<string> {
  const { data: bi } = await supabase.from('bi_engagements').select('id').eq('client_id', maEng.client_id).maybeSingle();
  if (bi?.id) return bi.id;

  const biTier = MA_TIER_TO_BI[maEng.tier?.toLowerCase()] || 'foresight';
  const freq = maEng.frequency === 'quarterly' ? 'quarterly' : 'monthly';
  const { data: created, error } = await supabase
    .from('bi_engagements')
    .insert({
      client_id: maEng.client_id,
      practice_id: maEng.practice_id,
      tier: biTier,
      frequency: freq,
      status: 'active',
    })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to create bi_engagement: ${error.message}`);
  return created!.id as string;
}

async function ensureMaEngagementFromBi(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  practiceId: string,
  biTier: string,
): Promise<string | null> {
  const { data: ex } = await supabase
    .from('ma_engagements')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle();
  if (ex?.id) return ex.id as string;

  const tierMap: Record<string, string> = {
    clarity: 'silver',
    foresight: 'gold',
    strategic: 'platinum',
  };
  const maTier = tierMap[biTier] || 'silver';
  const { data: ins, error } = await supabase
    .from('ma_engagements')
    .insert({
      client_id: clientId,
      practice_id: practiceId,
      tier: maTier,
      frequency: 'monthly',
      monthly_fee: 1,
      start_date: new Date().toISOString().slice(0, 10),
      status: 'active',
    })
    .select('id')
    .single();
  if (error) {
    console.warn('[import-sumary-period] Could not ensure ma_engagement:', error.message);
    return null;
  }
  return ins!.id as string;
}

async function resolveEngagements(
  supabase: ReturnType<typeof createClient>,
  engagementId: string,
): Promise<{ biEngagementId: string; maEngagementId: string | null; clientId: string; practiceId: string }> {
  const { data: bi } = await supabase
    .from('bi_engagements')
    .select('id, client_id, practice_id, tier')
    .eq('id', engagementId)
    .maybeSingle();
  if (bi?.id) {
    const { data: ma } = await supabase
      .from('ma_engagements')
      .select('id')
      .eq('client_id', bi.client_id)
      .eq('status', 'active')
      .maybeSingle();
    let maId = ma?.id ?? null;
    if (!maId) {
      maId = await ensureMaEngagementFromBi(supabase, bi.client_id as string, bi.practice_id as string, bi.tier as string);
    }
    return {
      biEngagementId: bi.id,
      maEngagementId: maId,
      clientId: bi.client_id as string,
      practiceId: bi.practice_id as string,
    };
  }

  const { data: ma, error } = await supabase
    .from('ma_engagements')
    .select('id, client_id, practice_id, tier, frequency, status')
    .eq('id', engagementId)
    .maybeSingle();
  if (error || !ma) throw new Error('Engagement not found (bi_engagements or ma_engagements)');

  const biId = await ensureBiEngagement(supabase, ma as any);
  return {
    biEngagementId: biId,
    maEngagementId: ma.id as string,
    clientId: ma.client_id as string,
    practiceId: ma.practice_id as string,
  };
}

/** Compute selected KPI values from financial figures */
function computeKpiValue(code: string, f: FinRow): number | null {
  const num = (k: string) => (typeof f[k] === 'number' ? (f[k] as number) : null);
  const revenue = num('revenue') ?? 0;
  const gp = num('gross_profit');
  const np = num('net_profit');
  const op = num('operating_profit');
  const cash = num('cash_at_bank');
  const debtors = num('trade_debtors');
  const creditors = num('trade_creditors');
  const payroll = num('monthly_payroll_costs');
  const ovh = num('overheads');
  const fte = num('fte_count');

  switch (code) {
    case 'gross_margin_pct':
      return revenue ? ((gp ?? 0) / revenue) * 100 : null;
    case 'net_margin_pct':
      return revenue ? ((np ?? 0) / revenue) * 100 : null;
    case 'operating_margin_pct':
      return revenue ? ((op ?? 0) / revenue) * 100 : null;
    case 'current_ratio':
      if (!creditors || creditors === 0) return null;
      return ((cash ?? 0) + (debtors ?? 0)) / creditors;
    case 'cash_cover_months':
      return payroll && payroll > 0 ? (cash ?? 0) / payroll : null;
    case 'overheads_to_revenue':
      return revenue ? ((ovh ?? 0) / revenue) * 100 : null;
    case 'revenue_per_head':
      return fte && fte > 0 ? revenue / fte : null;
    default:
      return null;
  }
}

async function invokeSaveKpiValues(
  supabaseUrl: string,
  serviceKey: string,
  maEngagementId: string,
  periodStart: string,
  periodEnd: string,
  values: Array<{ kpi_code: string; value: number }>,
) {
  const res = await fetch(`${supabaseUrl}/functions/v1/save-kpi-values`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      engagementId: maEngagementId,
      periodStart,
      periodEnd,
      values: values.map((v) => ({
        kpi_code: v.kpi_code,
        value: v.value,
        data_source: 'sumary_import',
        data_quality: 'verified',
      })),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`save-kpi-values failed: ${res.status} ${t}`);
  }
}

async function computeRatioVarianceUpserts(
  supabase: ReturnType<typeof createClient>,
  biEngagementId: string,
  biPeriodId: string,
  fin: FinRow,
  prevFin: FinRow | null,
) {
  const num = (r: FinRow, k: string) => (typeof r[k] === 'number' ? (r[k] as number) : null);

  const { data: ratios } = await supabase.from('bi_ratio_definitions').select('*').eq('is_active', true);
  const { data: selections } = await supabase
    .from('bi_ratio_selections')
    .select('ratio_code')
    .eq('engagement_id', biEngagementId);

  const selSet = new Set((selections ?? []).map((s: { ratio_code: string }) => s.ratio_code));

  for (const def of ratios ?? []) {
    if (!selSet.has(def.code)) continue;
    let value: number | null = null;
    try {
      if (def.calculation_formula && typeof def.calculation_formula === 'string') {
        value = evalFormula(def.calculation_formula, fin as Record<string, number>);
      }
    } catch {
      value = null;
    }
    if (value === null || Number.isNaN(value)) continue;

    await supabase.from('bi_ratio_values').delete().eq('period_id', biPeriodId).eq('ratio_code', def.code);
    await supabase.from('bi_ratio_values').insert({
      engagement_id: biEngagementId,
      period_id: biPeriodId,
      ratio_code: def.code,
      value,
      target_value: def.default_target ?? null,
      rag_status: 'neutral',
      calculated_at: new Date().toISOString(),
    });
  }

  const { data: vdefs } = await supabase.from('bi_variance_definitions').select('*').eq('is_active', true);
  const { data: vsel } = await supabase
    .from('bi_variance_selections')
    .select('variance_code')
    .eq('engagement_id', biEngagementId);
  const vSet = new Set((vsel ?? []).map((s: { variance_code: string }) => s.variance_code));

  for (const vd of vdefs ?? []) {
    if (!vSet.has(vd.code)) continue;
    const base = num(fin, vd.numerator_field);
    if (base === null) continue;
    let cmp: number | null = null;
    if (vd.comparator_type === 'prior_period' && prevFin) {
      cmp = num(prevFin, vd.comparator_field || vd.numerator_field);
    } else if (vd.comparator_type === 'prior_year') {
      cmp = num(fin, vd.comparator_field || 'yoy_revenue');
    }
    if (cmp === null) continue;
    const abs = base - cmp;
    const pct = cmp !== 0 ? (abs / cmp) * 100 : null;
    await supabase.from('bi_variance_values').delete().eq('period_id', biPeriodId).eq('variance_code', vd.code);
    await supabase.from('bi_variance_values').insert({
      engagement_id: biEngagementId,
      period_id: biPeriodId,
      variance_code: vd.code,
      base_value: base,
      comparator_value: cmp,
      absolute_delta: abs,
      percent_delta: pct,
      direction: abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat',
      rag_status: 'neutral',
      calculated_at: new Date().toISOString(),
    });
  }
}

/** Evaluate arithmetic formulas using only bi_financial_data numeric column names as identifiers (seed-controlled). */
function evalFormula(formula: string, ctx: Record<string, number>): number | null {
  let expr = formula.replace(/\s+/g, '');
  const tokenRe = /[a-z_][a-z0-9_]*/gi;
  expr = expr.replace(tokenRe, (tok) => {
    if (ctx[tok] === undefined || ctx[tok] === null) return '0';
    return String(ctx[tok]);
  });
  try {
    const v = Function(`"use strict"; return (${expr})`)();
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);
  let importRowId: string | null = null;
  let failureBiEngagementId: string | null = null;

  try {
    const body = (await req.json()) as ImportBody;
    const { engagementId, periodStart, periodEnd, periodType, source, payload, importedBy } = body;
    if (!engagementId || !periodStart || !periodEnd || !payload) {
      throw new Error('engagementId, periodStart, periodEnd, payload required');
    }

    const { biEngagementId, maEngagementId } = await resolveEngagements(supabase, engagementId);
    failureBiEngagementId = biEngagementId;
    const flat = flattenPayload(payload as Record<string, unknown>);

    const { data: mappingRows } = await supabase
      .from('bi_sumary_field_mappings')
      .select('sumary_key, internal_field, transform, is_required, mapping_version')
      .eq('internal_table', 'bi_financial_data')
      .order('mapping_version', { ascending: false });

    let mappingVersion = 1;
    const versions = [...new Set((mappingRows ?? []).map((m: { mapping_version: number }) => m.mapping_version))];
    if (versions.length) mappingVersion = Math.max(...versions);

    const activeMaps =
      (mappingRows ?? []).filter((m: { mapping_version: number }) => m.mapping_version === mappingVersion) ?? [];
    const mappings =
      activeMaps.length > 0
        ? activeMaps.map((m: any) => ({
            sumary_key: m.sumary_key,
            internal_field: m.internal_field,
            transform: m.transform,
            is_required: m.is_required,
          }))
        : DEFAULT_MAPPINGS;

    const { data: impInsert } = await supabase
      .from('bi_sumary_imports')
      .insert({
        engagement_id: biEngagementId,
        period_id: null,
        source,
        payload,
        mapping_version: mappingVersion,
        status: 'processing',
        imported_by: importedBy ?? null,
      })
      .select('id')
      .single();
    importRowId = impInsert?.id ?? null;

    let biPeriodId: string;
    const { data: existingBiPeriod } = await supabase
      .from('bi_periods')
      .select('id')
      .eq('engagement_id', biEngagementId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle();

    if (existingBiPeriod?.id) {
      biPeriodId = existingBiPeriod.id;
      await supabase
        .from('bi_periods')
        .update({
          status: 'documents_uploaded',
          period_type: periodType,
          period_label: `${periodStart} → ${periodEnd}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', biPeriodId);
    } else {
      const { data: np, error: pErr } = await supabase
        .from('bi_periods')
        .insert({
          engagement_id: biEngagementId,
          period_type: periodType,
          period_start: periodStart,
          period_end: periodEnd,
          period_label: `${periodStart} → ${periodEnd}`,
          status: 'documents_uploaded',
        })
        .select('id')
        .single();
      if (pErr) throw new Error(pErr.message);
      biPeriodId = np!.id as string;
    }

    if (importRowId) {
      await supabase.from('bi_sumary_imports').update({ period_id: biPeriodId }).eq('id', importRowId);
    }

    const finRow = mapToFinancialRow(flat, mappings);

    const { error: finErr } = await supabase.from('bi_financial_data').upsert(
      {
        period_id: biPeriodId,
        ...finRow,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'period_id' },
    );
    if (finErr) throw new Error(`bi_financial_data upsert: ${finErr.message}`);

    // Mirror MA period + financial for legacy dashboard / KPI path
    let maPeriodId: string | null = null;
    if (maEngagementId) {
      const { data: exMa } = await supabase
        .from('ma_periods')
        .select('id')
        .eq('engagement_id', maEngagementId)
        .eq('period_start', periodStart)
        .maybeSingle();

      if (exMa?.id) {
        maPeriodId = exMa.id;
        await supabase
          .from('ma_periods')
          .update({
            status: 'data_received',
            period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('id', maPeriodId);
      } else {
        const { data: maP } = await supabase
          .from('ma_periods')
          .insert({
            engagement_id: maEngagementId,
            period_type: periodType,
            period_start: periodStart,
            period_end: periodEnd,
            period_label: `${periodStart} → ${periodEnd}`,
            status: 'data_received',
          })
          .select('id')
          .single();
        maPeriodId = maP?.id ?? null;
      }

      if (maPeriodId) {
        const trueCash =
          (finRow.cash_at_bank as number | undefined ?? 0) -
          ((finRow.vat_liability as number | undefined ?? 0) +
            (finRow.paye_liability as number | undefined ?? 0) +
            (finRow.corporation_tax_liability as number | undefined ?? 0));

        await supabase.from('ma_financial_data').upsert(
          {
            period_id: maPeriodId,
            engagement_id: maEngagementId,
            revenue: finRow.revenue as number | undefined,
            cost_of_sales: finRow.cost_of_sales as number | undefined,
            gross_profit: finRow.gross_profit as number | undefined,
            overheads: finRow.overheads as number | undefined,
            operating_profit: finRow.operating_profit as number | undefined,
            net_profit: finRow.net_profit as number | undefined,
            cash_at_bank: finRow.cash_at_bank as number | undefined,
            trade_debtors: finRow.trade_debtors as number | undefined,
            trade_creditors: finRow.trade_creditors as number | undefined,
            stock: finRow.stock as number | undefined,
            fixed_assets: finRow.fixed_assets as number | undefined,
            vat_liability: finRow.vat_liability as number | undefined,
            paye_liability: finRow.paye_liability as number | undefined,
            corporation_tax_liability: finRow.corporation_tax_liability as number | undefined,
            loans: finRow.bank_loans as number | undefined,
            directors_loans: finRow.director_loans as number | undefined,
            monthly_operating_costs: finRow.monthly_operating_costs as number | undefined,
            fte_count: finRow.fte_count as number | undefined,
            prior_month_revenue: finRow.prior_revenue as number | undefined,
            prior_year_revenue: finRow.yoy_revenue as number | undefined,
            true_cash: trueCash,
            data_source: 'manual',
            confidence_level: 'high',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'period_id' },
        );

        const { data: kpiSels } = await supabase
          .from('ma_kpi_selections')
          .select('kpi_code')
          .eq('engagement_id', maEngagementId);

        const values: Array<{ kpi_code: string; value: number }> = [];
        for (const s of kpiSels ?? []) {
          const v = computeKpiValue(s.kpi_code, finRow);
          if (v !== null) values.push({ kpi_code: s.kpi_code, value: v });
        }
        if (values.length) {
          await invokeSaveKpiValues(supabaseUrl, serviceKey, maEngagementId, periodStart, periodEnd, values);
        }
      }
    }

    const { data: prevPeriod } = await supabase
      .from('bi_periods')
      .select('id')
      .eq('engagement_id', biEngagementId)
      .lt('period_end', periodEnd)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    let prevFin: FinRow | null = null;
    if (prevPeriod?.id) {
      const { data: pfd } = await supabase.from('bi_financial_data').select('*').eq('period_id', prevPeriod.id).maybeSingle();
      prevFin = pfd as FinRow | null;
    }

    await computeRatioVarianceUpserts(supabase, biEngagementId, biPeriodId, finRow, prevFin);

    await supabase
      .from('bi_periods')
      .update({ status: 'data_extracted', updated_at: new Date().toISOString() })
      .eq('id', biPeriodId);

    if (importRowId) {
      await supabase.from('bi_sumary_imports').update({ status: 'completed', error_message: null }).eq('id', importRowId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        biPeriodId,
        maPeriodId,
        biEngagementId,
        maEngagementId,
        importId: importRowId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (importRowId) {
      await supabase.from('bi_sumary_imports').update({ status: 'failed', error_message: msg }).eq('id', importRowId);
    } else if (failureBiEngagementId) {
      const { data: last } = await supabase
        .from('bi_sumary_imports')
        .select('id')
        .eq('engagement_id', failureBiEngagementId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last?.id) {
        await supabase.from('bi_sumary_imports').update({ status: 'failed', error_message: msg }).eq('id', last.id);
      }
    }
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
