// ============================================================================
// CONTEXT ENRICHMENT — Cross-Service Data for Goal Alignment Pipeline
// ============================================================================
// When a GA client also has Benchmarking, Systems Audit, or BI data, the
// generation pipeline should use that richer data instead of (or in addition to)
// the Part 2 self-reported answers.
//
// This module is called by the roadmap generation edge functions to assemble
// the fullest possible context for the LLM, regardless of which Part 2
// sections the client completed.
//
// Usage in edge functions: Dashboard deploy often sends only index.ts, so shared files
// are not bundled and "Module not found" occurs. Each function that needs enrichment
// has an INLINED copy of this logic (see comment "Canonical: supabase/functions/_shared/context-enrichment.ts"
// in generate-roadmap, generate-value-analysis, generate-six-month-shift, generate-sprint-plan-part1/part2).
// When changing behaviour, update this file then sync the inlined block in those five index.ts files.
//   const enriched = await enrichRoadmapContext(supabase, clientId);
//   // enriched.promptContext for LLM injection; enriched.financial, .systems, .market, .valueAnalysis for direct use
// ============================================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// TYPES
// ============================================================================

export interface EnrichedContext {
  /** Whether any enrichment data was found */
  hasEnrichment: boolean;

  /** Financial context from BI/MA or uploaded accounts */
  financial: FinancialEnrichment | null;

  /** Systems/operational context from Systems Audit */
  systems: SystemsEnrichment | null;

  /** Market/competitive context from Benchmarking */
  market: MarketEnrichment | null;

  /** Value analysis from BM/HVA (replaces GA Part 3) */
  valueAnalysis: ValueAnalysisEnrichment | null;

  /** Discovery data (if available — already-answered questions) */
  discovery: DiscoveryEnrichment | null;

  /** Summary for injection into LLM prompts */
  promptContext: string;
}

export interface FinancialEnrichment {
  source: 'uploaded_accounts' | 'bi_assessment' | 'bm_assessment';
  revenue: number | null;
  grossMargin: number | null;
  netProfit: number | null;
  cashPosition: number | null;
  revenueGrowth: string | null;
  keyRatios: Record<string, number>;
  concerns: string[];
  /** Pre-formatted summary for prompt injection */
  summary: string;
}

export interface SystemsEnrichment {
  source: 'sa_engagement';
  stage: string;
  /** Key pain points from SA discovery */
  painPoints: string[];
  /** Systems identified */
  systemsCount: number;
  /** Integration score (from SA report) */
  integrationScore: number | null;
  /** Automation score */
  automationScore: number | null;
  /** Key findings (if report exists) */
  findings: Array<{ title: string; severity: string; category: string }>;
  /** Manual hours identified */
  manualHoursMonthly: number | null;
  /** Pre-formatted summary for prompt injection */
  summary: string;
}

export interface MarketEnrichment {
  source: 'bm_report';
  industry: string | null;
  subSector: string | null;
  /** Percentile rankings from benchmarking */
  percentiles: Record<string, number>;
  /** Areas of underperformance */
  belowMedian: string[];
  /** Areas of strength */
  aboveMedian: string[];
  /** Opportunity sizing */
  opportunities: Array<{ area: string; potential: string }>;
  /** Pre-formatted summary for prompt injection */
  summary: string;
}

export interface ValueAnalysisEnrichment {
  source: 'bm_report' | 'ga_part3';
  exitReadinessScore: number | null;
  hiddenAssets: Array<{ asset: string; potentialValue: string }>;
  valueDestroyers: Array<{ risk: string; urgency: string }>;
  quickWins: Array<{ action: string; impact: string }>;
  estimatedMultiple: string | null;
  /** Pre-formatted summary for prompt injection */
  summary: string;
}

export interface DiscoveryEnrichment {
  /** Responses from Destination Discovery that overlap with GA Part 2 */
  responses: Record<string, any>;
  /** Service scores from discovery */
  serviceScores: Record<string, number>;
  /** Summary */
  summary: string;
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export async function enrichRoadmapContext(
  supabase: SupabaseClient,
  clientId: string
): Promise<EnrichedContext> {
  console.log(`[ContextEnrichment] Enriching context for client ${clientId}`);

  const [financial, systems, market, valueAnalysis, discovery] = await Promise.all([
    fetchFinancialEnrichment(supabase, clientId),
    fetchSystemsEnrichment(supabase, clientId),
    fetchMarketEnrichment(supabase, clientId),
    fetchValueAnalysisEnrichment(supabase, clientId),
    fetchDiscoveryEnrichment(supabase, clientId)
  ]);

  const hasEnrichment = !!(financial || systems || market || valueAnalysis || discovery);

  // Build a combined prompt context block
  const promptParts: string[] = [];

  if (financial) {
    promptParts.push(`## Financial Context (from ${financial.source})\n${financial.summary}`);
  }
  if (systems) {
    promptParts.push(`## Systems & Operations Context (from Systems Audit — ${systems.stage})\n${systems.summary}`);
  }
  if (market) {
    promptParts.push(`## Market & Competitive Context (from Benchmarking Report)\n${market.summary}`);
  }
  if (valueAnalysis) {
    promptParts.push(`## Value Analysis (from ${valueAnalysis.source === 'bm_report' ? 'Benchmarking & HVA' : 'GA Part 3'})\n${valueAnalysis.summary}`);
  }
  if (discovery) {
    promptParts.push(`## Discovery Insights\n${discovery.summary}`);
  }

  const promptContext = promptParts.length > 0
    ? `\n\n# ENRICHMENT DATA FROM OTHER SERVICE LINES\nThe following data comes from other services this client is enrolled in. Use this as authoritative context — it is more detailed and reliable than self-reported assessment answers for these areas.\n\n${promptParts.join('\n\n')}`
    : '';

  console.log(`[ContextEnrichment] Enrichment complete. Sources: financial=${!!financial}, systems=${!!systems}, market=${!!market}, valueAnalysis=${!!valueAnalysis}, discovery=${!!discovery}`);

  return {
    hasEnrichment,
    financial,
    systems,
    market,
    valueAnalysis,
    discovery,
    promptContext
  };
}

// ============================================================================
// INDIVIDUAL ENRICHMENT FETCHERS
// ============================================================================

async function fetchFinancialEnrichment(
  supabase: SupabaseClient,
  clientId: string
): Promise<FinancialEnrichment | null> {
  try {
    // Priority 1: Uploaded accounts (most accurate)
    const { data: financialData } = await supabase
      .from('client_financial_data')
      .select('*')
      .eq('client_id', clientId)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (financialData) {
      const revenue = financialData.revenue || financialData.turnover || null;
      const grossMargin = financialData.gross_margin || null;
      const netProfit = financialData.net_profit || null;

      return {
        source: 'uploaded_accounts',
        revenue,
        grossMargin,
        netProfit,
        cashPosition: financialData.cash_position || null,
        revenueGrowth: financialData.revenue_growth || null,
        keyRatios: financialData.ratios || {},
        concerns: [],
        summary: buildFinancialSummary('uploaded_accounts', { revenue, grossMargin, netProfit, ...financialData })
      };
    }

    // Priority 2: BM assessment responses (has revenue, industry classification)
    const { data: bmResponses } = await supabase
      .from('bm_assessment_responses')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bmResponses) {
      return {
        source: 'bm_assessment',
        revenue: bmResponses.revenue_numeric || null,
        grossMargin: null,
        netProfit: null,
        cashPosition: null,
        revenueGrowth: null,
        keyRatios: {},
        concerns: [],
        summary: buildFinancialSummary('bm_assessment', bmResponses)
      };
    }

    // Priority 3: BI/MA assessment (self-reported but structured)
    const { data: biAssessment } = await supabase
      .from('service_line_assessments')
      .select('responses')
      .eq('client_id', clientId)
      .in('service_line_code', ['business_intelligence', 'management_accounts'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (biAssessment?.responses) {
      return {
        source: 'bi_assessment',
        revenue: null,
        grossMargin: null,
        netProfit: null,
        cashPosition: null,
        revenueGrowth: null,
        keyRatios: {},
        concerns: extractFinancialConcerns(biAssessment.responses),
        summary: buildFinancialSummary('bi_assessment', biAssessment.responses)
      };
    }

    return null;
  } catch (err) {
    console.warn('[ContextEnrichment] Financial enrichment failed:', err);
    return null;
  }
}

async function fetchSystemsEnrichment(
  supabase: SupabaseClient,
  clientId: string
): Promise<SystemsEnrichment | null> {
  try {
    // Get SA engagement
    const { data: engagement } = await supabase
      .from('sa_engagements')
      .select('id, status')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!engagement || engagement.status === 'pending') return null;

    const enrichment: SystemsEnrichment = {
      source: 'sa_engagement',
      stage: engagement.status,
      painPoints: [],
      systemsCount: 0,
      integrationScore: null,
      automationScore: null,
      findings: [],
      manualHoursMonthly: null,
      summary: ''
    };

    // Get Stage 1 discovery responses
    const { data: discoveryResponses } = await supabase
      .from('sa_discovery_responses')
      .select('*')
      .eq('engagement_id', engagement.id)
      .maybeSingle();

    if (discoveryResponses) {
      enrichment.painPoints = [
        discoveryResponses.systems_breaking_point,
        discoveryResponses.operations_self_diagnosis,
        discoveryResponses.magic_process_fix
      ].filter(Boolean);
      enrichment.manualHoursMonthly = discoveryResponses.manual_hours_monthly || null;
    }

    // Get system inventory count
    const { count: systemsCount } = await supabase
      .from('sa_system_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('engagement_id', engagement.id);

    enrichment.systemsCount = systemsCount || 0;

    // Get report data if available
    const { data: report } = await supabase
      .from('sa_audit_reports')
      .select('integration_score, automation_score, headline, executive_summary')
      .eq('engagement_id', engagement.id)
      .maybeSingle();

    if (report) {
      enrichment.integrationScore = report.integration_score;
      enrichment.automationScore = report.automation_score;
    }

    // Get findings (table may not exist in all environments)
    try {
      const { data: findings } = await supabase
        .from('sa_findings')
        .select('title, severity, category')
        .eq('engagement_id', engagement.id)
        .order('severity', { ascending: true })
        .limit(10);

      if (findings) {
        enrichment.findings = findings.map(f => ({
          title: f.title,
          severity: f.severity,
          category: f.category
        }));
      }
    } catch {
      // sa_findings may not exist
    }

    enrichment.summary = buildSystemsSummary(enrichment);
    return enrichment;

  } catch (err) {
    console.warn('[ContextEnrichment] Systems enrichment failed:', err);
    return null;
  }
}

async function fetchMarketEnrichment(
  supabase: SupabaseClient,
  clientId: string
): Promise<MarketEnrichment | null> {
  try {
    const { data: report } = await supabase
      .from('bm_reports')
      .select('report_data, status')
      .eq('client_id', clientId)
      .in('status', ['generated', 'approved', 'published', 'delivered'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!report?.report_data) return null;

    const data = report.report_data;
    const percentiles = data.percentiles || data.rankings || {};
    const belowMedian: string[] = [];
    const aboveMedian: string[] = [];

    for (const [metric, value] of Object.entries(percentiles)) {
      if (typeof value === 'number') {
        if (value < 50) belowMedian.push(metric);
        else aboveMedian.push(metric);
      }
    }

    const enrichment: MarketEnrichment = {
      source: 'bm_report',
      industry: data.industry || data.classification?.industry || null,
      subSector: data.subSector || data.classification?.sub_sector || null,
      percentiles,
      belowMedian,
      aboveMedian,
      opportunities: (data.opportunities || []).slice(0, 5).map((o: any) => ({
        area: o.area || o.title || 'Unnamed',
        potential: o.potential || o.value || 'Not quantified'
      })),
      summary: ''
    };

    enrichment.summary = buildMarketSummary(enrichment);
    return enrichment;

  } catch (err) {
    console.warn('[ContextEnrichment] Market enrichment failed:', err);
    return null;
  }
}

async function fetchValueAnalysisEnrichment(
  supabase: SupabaseClient,
  clientId: string
): Promise<ValueAnalysisEnrichment | null> {
  try {
    // Priority 1: BM report value analysis (most comprehensive)
    const { data: bmReport } = await supabase
      .from('bm_reports')
      .select('value_analysis')
      .eq('client_id', clientId)
      .not('value_analysis', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bmReport?.value_analysis) {
      const va = bmReport.value_analysis;
      return {
        source: 'bm_report',
        exitReadinessScore: va.exitReadinessScore?.overall || va.exitReadiness?.score || null,
        hiddenAssets: (va.hiddenAssets || []).slice(0, 5).map((a: any) => ({
          asset: a.asset || a.name || 'Unnamed',
          potentialValue: a.potentialValue || a.value || 'Not quantified'
        })),
        valueDestroyers: (va.valueDestroyers || va.risks || []).slice(0, 5).map((r: any) => ({
          risk: r.risk || r.title || 'Unnamed',
          urgency: r.urgency || r.severity || 'medium'
        })),
        quickWins: (va.quickWins || []).slice(0, 3).map((q: any) => ({
          action: q.action || q.title || 'Unnamed',
          impact: q.valueImpact || q.impact || 'Not quantified'
        })),
        estimatedMultiple: va.valuationInsights?.estimatedCurrentMultiple || null,
        summary: buildValueAnalysisSummary(va, 'bm_report')
      };
    }

    return null;
  } catch (err) {
    console.warn('[ContextEnrichment] Value analysis enrichment failed:', err);
    return null;
  }
}

async function fetchDiscoveryEnrichment(
  supabase: SupabaseClient,
  clientId: string
): Promise<DiscoveryEnrichment | null> {
  try {
    const { data: engagement } = await supabase
      .from('discovery_engagements')
      .select('id, responses, service_scores')
      .eq('client_id', clientId)
      .in('status', ['completed', 'report_generated', 'report_delivered'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!engagement?.responses) return null;

    return {
      responses: engagement.responses,
      serviceScores: engagement.service_scores || {},
      summary: `Discovery completed. Service scores: ${JSON.stringify(engagement.service_scores || {})}`
    };
  } catch (err) {
    console.warn('[ContextEnrichment] Discovery enrichment failed:', err);
    return null;
  }
}

// ============================================================================
// SUMMARY BUILDERS (for prompt injection)
// ============================================================================

function buildFinancialSummary(source: string, data: any): string {
  const parts: string[] = [];

  if (source === 'uploaded_accounts') {
    if (data.revenue) parts.push(`Revenue: £${(data.revenue / 1000).toFixed(0)}k`);
    if (data.grossMargin) parts.push(`Gross margin: ${(data.grossMargin * 100).toFixed(1)}%`);
    if (data.netProfit) parts.push(`Net profit: £${(data.netProfit / 1000).toFixed(0)}k`);
    if (data.cash_position) parts.push(`Cash position: £${(data.cash_position / 1000).toFixed(0)}k`);
    if (data.revenue_growth) parts.push(`Revenue growth: ${data.revenue_growth}`);
    return `Actual financial data from uploaded accounts. ${parts.join('. ')}.`;
  }

  if (source === 'bm_assessment') {
    if (data.revenue_numeric) parts.push(`Stated revenue: £${(data.revenue_numeric / 1000).toFixed(0)}k`);
    if (data.industry) parts.push(`Industry: ${data.industry}`);
    if (data.employees) parts.push(`Employees: ${data.employees}`);
    return `Financial context from benchmarking assessment. ${parts.join('. ')}.`;
  }

  return 'Financial data available from BI assessment (self-reported).';
}

function buildSystemsSummary(data: SystemsEnrichment): string {
  const parts: string[] = [];
  parts.push(`Systems audit at stage: ${data.stage}`);
  if (data.systemsCount > 0) parts.push(`${data.systemsCount} systems inventoried`);
  if (data.manualHoursMonthly) parts.push(`${data.manualHoursMonthly} manual hours/month identified`);
  if (data.integrationScore !== null) parts.push(`Integration score: ${data.integrationScore}/100`);
  if (data.automationScore !== null) parts.push(`Automation score: ${data.automationScore}/100`);
  if (data.painPoints.length > 0) parts.push(`Key pain points: ${data.painPoints.join('; ')}`);
  if (data.findings.length > 0) {
    const critical = data.findings.filter(f => f.severity === 'critical' || f.severity === 'high');
    if (critical.length > 0) {
      parts.push(`Critical/high findings: ${critical.map(f => f.title).join('; ')}`);
    }
  }
  return parts.join('. ') + '.';
}

function buildMarketSummary(data: MarketEnrichment): string {
  const parts: string[] = [];
  if (data.industry) parts.push(`Industry: ${data.industry}`);
  if (data.subSector) parts.push(`Sub-sector: ${data.subSector}`);
  if (data.belowMedian.length > 0) parts.push(`Below median in: ${data.belowMedian.join(', ')}`);
  if (data.aboveMedian.length > 0) parts.push(`Above median in: ${data.aboveMedian.join(', ')}`);
  if (data.opportunities.length > 0) {
    parts.push(`Top opportunities: ${data.opportunities.map(o => `${o.area} (${o.potential})`).join('; ')}`);
  }
  return parts.join('. ') + '.';
}

function buildValueAnalysisSummary(va: any, source: string): string {
  const parts: string[] = [];
  parts.push(`Source: ${source === 'bm_report' ? 'Benchmarking & Hidden Value Analysis' : 'GA Part 3'}`);
  if (va.exitReadinessScore?.overall) parts.push(`Exit readiness: ${va.exitReadinessScore.overall}/100`);
  if (va.hiddenAssets?.length) parts.push(`${va.hiddenAssets.length} hidden assets identified`);
  if (va.valueDestroyers?.length) parts.push(`${va.valueDestroyers.length} value destroyers identified`);
  if (va.quickWins?.length) parts.push(`${va.quickWins.length} quick wins available`);
  if (va.valuationInsights?.estimatedCurrentMultiple) {
    parts.push(`Estimated multiple: ${va.valuationInsights.estimatedCurrentMultiple}`);
  }
  return parts.join('. ') + '.';
}

function extractFinancialConcerns(responses: Record<string, any>): string[] {
  const concerns: string[] = [];
  if (responses.ma_yearend_surprise === 'Yes, made less profit than expected') {
    concerns.push('Year-end profit below expectations');
  }
  if (responses.ma_numbers_relationship === 'Numbers stress me out - I avoid them') {
    concerns.push('Client avoids engaging with financial data');
  }
  if (responses.ma_cash_visibility_30day === 'No idea') {
    concerns.push('No visibility on 30-day cash position');
  }
  return concerns;
}
