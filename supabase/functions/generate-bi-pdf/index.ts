/**
 * Business Intelligence PDF Report Generator
 * 
 * TORSOR BI REPORT - Advisory Intelligence
 * "Spotlight tells you what happened. Torsor tells you what to do about it."
 * 
 * Structure:
 * Page 1:  Cover
 * Page 2:  Contents
 * Page 3:  Executive Summary (Tuesday Question hero + metrics)
 * Page 4:  True Cash Position (waterfall breakdown)
 * Page 5:  13-Week Cash Forecast
 * Page 6:  Scenarios & Decisions
 * Page 7:  Profit & Loss Summary
 * Page 8:  Balance Sheet
 * Page 9:  Cash Flow Summary
 * Page 10: Insights & Recommendations
 * Page 11: Watch List & KPIs
 * Page 12: Back Cover
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// TYPES
// ============================================================================

interface ExportOptions {
  includeComparisons: boolean;
  includeBudget: boolean;
  includeBalanceSheet: boolean;
  includeForecasts: boolean;
  includeScenarios: boolean;
  reportType: 'standard' | 'executive' | 'detailed';
}

interface GeneratePDFRequest {
  periodId: string;
  engagementId?: string;
  options?: Partial<ExportOptions>;
}

interface ReportData {
  period: any;
  engagement: any;
  client: any;
  financialData: any;
  kpis: any[];
  insights: any[];
  comparisons?: any;
  forecasts?: any[];
  scenarios?: any[];
  discoveryData?: any;
}

interface PageSection {
  title: string;
  page: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: GeneratePDFRequest = await req.json();
    const { periodId, options = {} } = request;

    const exportOptions: ExportOptions = {
      includeComparisons: options.includeComparisons ?? true,
      includeBudget: options.includeBudget ?? true,
      includeBalanceSheet: options.includeBalanceSheet ?? true,
      includeForecasts: options.includeForecasts ?? true,
      includeScenarios: options.includeScenarios ?? true,
      reportType: options.reportType ?? 'standard'
    };

    console.log(`[generate-bi-pdf] Generating PDF for period: ${periodId}`);

    // Fetch all report data
    const reportData = await fetchReportData(supabase, periodId, exportOptions);
    
    if (!reportData.period) {
      return new Response(
        JSON.stringify({ error: 'Period not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build HTML report
    const html = buildReportHTML(reportData, exportOptions);

    // Generate a filename
    const filename = generateFilename(reportData);

    // Try to store the HTML
    const tempPath = `temp-reports/${reportData.engagement?.id || 'unknown'}/${filename}.html`;
    let storageUrl = null;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('bi-reports')
        .upload(tempPath, html, {
          contentType: 'text/html',
          upsert: true
        });

      if (!uploadError) {
        const { data: signedData } = await supabase.storage
          .from('bi-reports')
          .createSignedUrl(tempPath, 3600);
        
        if (signedData) {
          storageUrl = signedData.signedUrl;
        }
      }
    } catch (storageErr) {
      console.warn('[generate-bi-pdf] Storage error:', storageErr);
    }

    // Record the generated report
    try {
      if (reportData.engagement?.id) {
        await supabase.from('bi_generated_reports').insert({
          period_id: periodId,
          engagement_id: reportData.engagement.id,
          report_type: exportOptions.reportType,
          filename: `${filename}.pdf`,
          storage_path: storageUrl ? tempPath : null,
          options: exportOptions,
          status: 'generated'
        });
      }
    } catch (recordErr) {
      console.warn('[generate-bi-pdf] Failed to record report:', recordErr);
    }

    console.log(`[generate-bi-pdf] Report generated: ${filename}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        html,
        filename: `${filename}.pdf`,
        storageUrl,
        message: 'Report generated - open in browser and print to PDF'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-bi-pdf] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchReportData(
  supabase: any, 
  periodId: string, 
  options: ExportOptions
): Promise<ReportData> {
  // Try bi_periods first, fallback to ma_periods
  let { data: period } = await supabase
    .from('bi_periods')
    .select('*')
    .eq('id', periodId)
    .single();

  if (!period) {
    const { data: maPeriod } = await supabase
      .from('ma_periods')
      .select('*')
      .eq('id', periodId)
      .single();
    period = maPeriod;
  }

  if (!period) {
    return { 
      period: null, 
      engagement: null, 
      client: null, 
      financialData: null, 
      kpis: [], 
      insights: [] 
    };
  }
  
  // Fetch engagement
  let { data: engagement } = await supabase
    .from('bi_engagements')
    .select('*')
    .eq('id', period.engagement_id)
    .single();
  
  if (!engagement) {
    const { data: maEng } = await supabase
      .from('ma_engagements')
      .select('*')
      .eq('id', period.engagement_id)
      .single();
    engagement = maEng;
  }
  
  // Fetch client - try clients table then practice_members
  let client = null;
  if (engagement?.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('id', engagement.client_id)
      .single();
    
    if (clientData) {
      client = clientData;
    } else {
      const { data: memberData } = await supabase
        .from('practice_members')
        .select('id, name, email, client_company')
        .eq('id', engagement.client_id)
        .single();
      
      if (memberData) {
        client = {
          id: memberData.id,
          name: memberData.name,
          company_name: memberData.client_company,
          email: memberData.email
        };
      }
    }
  }
  
  period.engagement = engagement;
  if (engagement) engagement.client = client;

  // Fetch financial data
  let { data: financialData } = await supabase
    .from('bi_financial_data')
    .select('*')
    .eq('period_id', periodId)
    .single();
  
  if (!financialData) {
    const { data: maFinData } = await supabase
      .from('ma_financial_data')
      .select('*')
      .eq('period_id', periodId)
      .single();
    financialData = maFinData;
  }

  // Fetch KPIs
  let { data: kpis } = await supabase
    .from('bi_kpi_values')
    .select(`*, definition:bi_kpi_definitions(*)`)
    .eq('period_id', periodId);
  
  if (!kpis || kpis.length === 0) {
    const { data: maKpis } = await supabase
      .from('ma_kpi_values')
      .select('*')
      .eq('period_id', periodId);
    kpis = maKpis;
  }

  // Fetch insights
  let { data: insights } = await supabase
    .from('bi_insights')
    .select('*')
    .eq('period_id', periodId)
    .eq('show_to_client', true)
    .eq('status', 'approved')
    .order('priority', { ascending: true });
  
  if (!insights || insights.length === 0) {
    const { data: maInsights } = await supabase
      .from('ma_insights')
      .select('*')
      .eq('period_id', periodId)
      .eq('show_to_client', true)
      .order('priority', { ascending: true });
    insights = maInsights;
  }

  // Fetch comparisons
  let comparisons = null;
  if (options.includeComparisons) {
    const { data } = await supabase
      .from('bi_period_comparisons')
      .select('*')
      .eq('period_id', periodId)
      .single();
    comparisons = data;
  }

  // Fetch forecasts
  let forecasts = null;
  if (options.includeForecasts) {
    const { data } = await supabase
      .from('bi_cash_forecasts')
      .select('*, periods:bi_cash_forecast_periods(*)')
      .eq('period_id', periodId)
      .order('created_at', { ascending: false })
      .limit(1);
    forecasts = data;
  }

  // Fetch scenarios
  let scenarios = null;
  if (options.includeScenarios) {
    const { data } = await supabase
      .from('bi_scenarios')
      .select('*')
      .eq('period_id', periodId)
      .eq('is_featured', true);
    
    if (!data || data.length === 0) {
      const { data: maScenarios } = await supabase
        .from('ma_scenarios')
        .select('*')
        .eq('period_id', periodId);
      scenarios = maScenarios;
    } else {
      scenarios = data;
    }
  }

  // Fetch discovery data for client voice
  let discoveryData = null;
  if (engagement?.id) {
    const { data: discovery } = await supabase
      .from('discovery_calls')
      .select('*')
      .eq('engagement_id', engagement.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    discoveryData = discovery;
  }

  return {
    period,
    engagement: engagement || period.engagement,
    client: client || engagement?.client,
    financialData,
    kpis: kpis || [],
    insights: insights || [],
    comparisons,
    forecasts,
    scenarios,
    discoveryData
  };
}

// ============================================================================
// FORMATTERS
// ============================================================================

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '-';
  return new Intl.NumberFormat('en-GB', { 
    style: 'currency', 
    currency: 'GBP', 
    maximumFractionDigits: 0 
  }).format(val);
}

function formatPercent(val: number | null | undefined): string {
  if (val == null) return '-';
  return `${val.toFixed(1)}%`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function formatMonthYear(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', { 
    month: 'long', 
    year: 'numeric' 
  });
}

// ============================================================================
// INSIGHT HELPERS
// ============================================================================

function getInsightTitle(insight: any): string {
  return insight.title || insight.headline || 
    (insight.summary || insight.description || 'Key Finding').split('.')[0].substring(0, 60);
}

function getInsightDescription(insight: any): string {
  return insight.description || insight.summary || insight.detail || '';
}

function getInsightPriority(insight: any): string {
  if (insight.priority) return insight.priority;
  if (insight.recommendation_priority) return insight.recommendation_priority;
  if (insight.insight_type === 'action_required') return 'critical';
  if (insight.insight_type === 'warning') return 'high';
  if (insight.insight_type === 'opportunity') return 'medium';
  return 'medium';
}

// ============================================================================
// HTML GENERATION
// ============================================================================

function generateFilename(reportData: ReportData): string {
  const clientName = (reportData.client?.company_name || reportData.client?.name || 'Client')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-');
  const periodLabel = (reportData.period?.period_label || 'Period')
    .replace(/[^a-zA-Z0-9]/g, '-');
  const date = new Date().toISOString().split('T')[0];
  
  return `BI-Report-${clientName}-${periodLabel}-${date}`;
}

function buildReportHTML(data: ReportData, options: ExportOptions): string {
  const { period, engagement, client, financialData, kpis, insights, comparisons, forecasts, scenarios, discoveryData } = data;
  
  const clientName = client?.company_name || client?.name || 'Client';
  const periodLabel = period?.period_label || 'Business Intelligence Report';
  const tier = engagement?.tier || 'clarity';
  
  // Build table of contents
  const sections: PageSection[] = [
    { title: 'Executive Summary', page: 3 },
    { title: 'True Cash Position', page: 4 },
    { title: '13-Week Cash Forecast', page: 5 },
    { title: 'Scenarios & Decisions', page: 6 },
    { title: 'Profit & Loss Summary', page: 7 },
    { title: 'Balance Sheet', page: 8 },
    { title: 'Cash Flow Summary', page: 9 },
    { title: 'Insights & Recommendations', page: 10 },
    { title: 'Watch List & KPIs', page: 11 },
  ];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BI Report - ${clientName} - ${periodLabel}</title>
  <style>
    ${getReportStyles()}
  </style>
</head>
<body>
  ${buildCoverPage(clientName, periodLabel, tier, period?.period_end)}
  ${buildContentsPage(sections)}
  ${buildExecutiveSummary(financialData, insights, kpis, period, discoveryData)}
  ${buildTrueCashPage(financialData)}
  ${buildForecastPage(financialData, forecasts)}
  ${buildScenariosPage(scenarios, financialData, period)}
  ${buildPLPage(financialData, comparisons)}
  ${buildBalanceSheetPage(financialData)}
  ${buildCashFlowPage(financialData)}
  ${buildInsightsPage(insights, discoveryData)}
  ${buildWatchListKPIPage(kpis, financialData)}
  ${buildBackCover(engagement, tier)}
</body>
</html>
`;
}

function getReportStyles(): string {
  return `
    @page {
      size: A4;
      margin: 15mm;
    }
    
    @font-face {
      font-family: 'Inter';
      src: local('Inter'), local('Inter-Regular');
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1e293b;
      background: white;
    }
    
    /* =========================
       PAGE LAYOUT
       ========================= */
    .page {
      page-break-after: always;
      min-height: 100vh;
      padding: 32px 40px;
      position: relative;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .page-footer {
      position: absolute;
      bottom: 20px;
      left: 40px;
      right: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #94a3b8;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }
    
    /* =========================
       COVER PAGE
       ========================= */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
      color: white;
      padding: 60px;
    }
    
    .cover-logo {
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.15);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 48px;
      backdrop-filter: blur(10px);
    }
    
    .cover-title {
      font-size: 42pt;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -1px;
    }
    
    .cover-subtitle {
      font-size: 16pt;
      opacity: 0.9;
      margin-bottom: 60px;
      font-weight: 300;
    }
    
    .cover-client {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .cover-period {
      font-size: 14pt;
      opacity: 0.85;
      margin-bottom: 24px;
    }
    
    .cover-tier {
      display: inline-block;
      padding: 10px 28px;
      background: rgba(255,255,255,0.2);
      border-radius: 30px;
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
    }
    
    .cover-footer {
      position: absolute;
      bottom: 48px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10pt;
      opacity: 0.7;
    }
    
    /* =========================
       CONTENTS PAGE
       ========================= */
    .contents-page {
      padding: 60px 80px;
    }
    
    .contents-title {
      font-size: 28pt;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 48px;
    }
    
    .toc-item {
      display: flex;
      align-items: baseline;
      padding: 14px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .toc-item:last-child {
      border-bottom: none;
    }
    
    .toc-title {
      font-size: 13pt;
      color: #1e293b;
      font-weight: 500;
    }
    
    .toc-dots {
      flex: 1;
      border-bottom: 2px dotted #cbd5e1;
      margin: 0 16px;
      position: relative;
      top: -4px;
    }
    
    .toc-page {
      font-size: 13pt;
      font-weight: 700;
      color: #1e3a8a;
      min-width: 24px;
      text-align: right;
    }
    
    /* =========================
       TUESDAY QUESTION BANNER (HERO)
       ========================= */
    .tuesday-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 28px;
    }
    
    .tuesday-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .tuesday-icon {
      font-size: 24px;
    }
    
    .tuesday-label {
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.9;
      font-weight: 600;
    }
    
    .tuesday-question {
      font-size: 18pt;
      font-style: italic;
      line-height: 1.4;
      margin-bottom: 20px;
      padding-left: 20px;
      border-left: 4px solid rgba(255,255,255,0.3);
    }
    
    .tuesday-answer {
      background: rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 20px;
    }
    
    .answer-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14pt;
      font-weight: 700;
    }
    
    .answer-badge.yes { color: #86efac; }
    .answer-badge.no { color: #fca5a5; }
    .answer-badge.not-yet { color: #fcd34d; }
    .answer-badge.conditional { color: #93c5fd; }
    
    .answer-detail {
      font-size: 11pt;
      line-height: 1.6;
      opacity: 0.95;
    }
    
    /* =========================
       SECTION STYLES
       ========================= */
    .section-title {
      font-size: 20pt;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 3px solid #3b82f6;
    }
    
    .section-subtitle {
      font-size: 13pt;
      font-weight: 600;
      color: #334155;
      margin: 24px 0 12px;
    }
    
    .section-intro {
      color: #64748b;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    
    /* =========================
       METRIC CARDS
       ========================= */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .metric-grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .metric-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 16px 20px;
      border: 1px solid #e2e8f0;
    }
    
    .metric-card.highlight {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-color: #93c5fd;
    }
    
    .metric-card.warning {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-color: #fbbf24;
    }
    
    .metric-card.danger {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-color: #f87171;
    }
    
    .metric-label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      font-weight: 600;
    }
    
    .metric-value {
      font-size: 20pt;
      font-weight: 700;
      color: #0f172a;
    }
    
    .metric-value.positive { color: #059669; }
    .metric-value.negative { color: #dc2626; }
    .metric-value.warning { color: #d97706; }
    
    .metric-change {
      font-size: 9pt;
      margin-top: 4px;
      color: #64748b;
    }
    
    /* =========================
       TABLES
       ========================= */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 9pt;
    }
    
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background: #f8fafc;
      font-weight: 600;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tr.subtotal {
      background: #f8fafc;
    }
    
    tr.total-row {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
    }
    
    tr.total-row td {
      border-bottom: none;
      font-weight: 700;
    }
    
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: 'SF Mono', 'Consolas', monospace; }
    
    .amount { font-family: 'SF Mono', monospace; }
    .amount.positive { color: #059669; }
    .amount.negative { color: #dc2626; }
    
    /* =========================
       TRUE CASH WATERFALL
       ========================= */
    .waterfall-table {
      margin: 20px 0;
    }
    
    .waterfall-table td:first-child {
      width: 50%;
    }
    
    .waterfall-row-deduction td {
      padding-left: 32px;
      color: #64748b;
    }
    
    .waterfall-row-addition td {
      padding-left: 32px;
      color: #059669;
    }
    
    .waterfall-total {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-top: 2px solid #3b82f6;
    }
    
    .waterfall-total td {
      font-size: 12pt;
      font-weight: 700;
    }
    
    /* =========================
       RAG INDICATORS
       ========================= */
    .rag-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 600;
    }
    
    .rag-green { background: #dcfce7; color: #166534; }
    .rag-amber { background: #fef3c7; color: #92400e; }
    .rag-red { background: #fee2e2; color: #991b1b; }
    
    .rag-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }
    
    .rag-dot.red { background: #ef4444; }
    .rag-dot.amber { background: #f59e0b; }
    .rag-dot.green { background: #10b981; }
    
    /* =========================
       INSIGHT CARDS
       ========================= */
    .insight-card {
      background: white;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 12px;
      border-left: 4px solid #3b82f6;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    
    .insight-card.critical { border-left-color: #ef4444; background: #fef2f2; }
    .insight-card.warning { border-left-color: #f59e0b; background: #fffbeb; }
    .insight-card.opportunity { border-left-color: #10b981; background: #f0fdf4; }
    
    .insight-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    
    .insight-headline {
      font-weight: 600;
      font-size: 11pt;
      color: #1e293b;
      flex: 1;
      padding-right: 12px;
    }
    
    .insight-description {
      font-size: 9pt;
      color: #475569;
      line-height: 1.5;
    }
    
    .insight-action {
      margin-top: 12px;
      padding: 12px;
      background: rgba(59, 130, 246, 0.08);
      border-radius: 8px;
      font-size: 9pt;
    }
    
    .insight-action strong {
      color: #1e3a8a;
    }
    
    /* =========================
       WATCH LIST
       ========================= */
    .watch-item {
      display: flex;
      gap: 16px;
      padding: 14px 16px;
      background: #f8fafc;
      border-radius: 10px;
      margin-bottom: 10px;
      align-items: flex-start;
    }
    
    .watch-content {
      flex: 1;
    }
    
    .watch-metric {
      font-weight: 600;
      font-size: 10pt;
      margin-bottom: 4px;
    }
    
    .watch-values {
      display: flex;
      gap: 20px;
      font-size: 9pt;
      color: #64748b;
    }
    
    .watch-action {
      margin-top: 6px;
      font-size: 8pt;
      color: #1e3a8a;
      font-style: italic;
    }
    
    /* =========================
       SCENARIO CARDS
       ========================= */
    .scenario-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .scenario-name {
      font-weight: 600;
      font-size: 11pt;
      color: #1e293b;
    }
    
    .scenario-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 600;
    }
    
    .scenario-badge.high-risk { background: #fee2e2; color: #991b1b; }
    .scenario-badge.moderate-risk { background: #fef3c7; color: #92400e; }
    .scenario-badge.acceptable { background: #dcfce7; color: #166534; }
    
    .scenario-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .scenario-metric {
      text-align: center;
      padding: 10px;
      background: #f8fafc;
      border-radius: 8px;
    }
    
    .scenario-metric-label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    
    .scenario-metric-value {
      font-size: 14pt;
      font-weight: 700;
    }
    
    .scenario-recommendation {
      padding: 12px;
      background: #f0f9ff;
      border-radius: 8px;
      font-size: 9pt;
      color: #1e3a8a;
    }
    
    /* =========================
       DECISION BOX
       ========================= */
    .decision-box {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      align-items: flex-start;
    }
    
    .decision-box.yes {
      background: #f0fdf4;
      border: 1px solid #86efac;
    }
    
    .decision-box.no {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
    
    .decision-box.not-yet {
      background: #fffbeb;
      border: 1px solid #fde68a;
    }
    
    .decision-icon {
      font-size: 16pt;
      line-height: 1;
    }
    
    .decision-content {
      flex: 1;
    }
    
    .decision-title {
      font-weight: 600;
      font-size: 10pt;
      margin-bottom: 4px;
    }
    
    .decision-detail {
      font-size: 9pt;
      color: #64748b;
    }
    
    /* =========================
       MARGIN CHART (SVG)
       ========================= */
    .margin-chart-container {
      display: flex;
      justify-content: center;
      margin: 24px 0;
    }
    
    /* =========================
       BACK COVER
       ========================= */
    .back-cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
    }
    
    /* =========================
       PRINT OPTIMIZATIONS
       ========================= */
    @media print {
      .page {
        page-break-after: always;
      }
      
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .no-break {
        page-break-inside: avoid;
      }
    }
  `;
}

// ============================================================================
// PAGE BUILDERS
// ============================================================================

function buildCoverPage(clientName: string, periodLabel: string, tier: string, periodEnd?: string): string {
  const tierLabels: Record<string, string> = {
    clarity: 'Clarity',
    foresight: 'Foresight',
    strategic: 'Strategic',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum'
  };
  
  return `
    <div class="page cover-page">
      <div class="cover-logo">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
      </div>
      <h1 class="cover-title">Business Intelligence</h1>
      <p class="cover-subtitle">Financial Clarity • Strategic Insight • Confident Decisions</p>
      <div class="cover-client">${clientName}</div>
      <div class="cover-period">${periodLabel}${periodEnd ? ` • ${formatMonthYear(periodEnd)}` : ''}</div>
      <div class="cover-tier">${tierLabels[tier] || tier} Service</div>
      <div class="cover-footer">
        Prepared by Torsor Business Services<br>
        Generated: ${formatDate(new Date())}
      </div>
    </div>
  `;
}

function buildContentsPage(sections: PageSection[]): string {
  return `
    <div class="page contents-page">
      <h1 class="contents-title">Contents</h1>
      
      <div class="toc">
        ${sections.map(s => `
          <div class="toc-item">
            <span class="toc-title">${s.title}</span>
            <span class="toc-dots"></span>
            <span class="toc-page">${s.page}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 2 of 12</span>
      </div>
    </div>
  `;
}

function buildExecutiveSummary(financialData: any, insights: any[], kpis: any[], period: any, discoveryData: any): string {
  if (!financialData) {
    return `
      <div class="page">
        <h2 class="section-title">Executive Summary</h2>
        <p class="section-intro">Financial data not yet available for this period.</p>
        <div class="page-footer">
          <span>Business Intelligence Report</span>
          <span>Page 3 of 12</span>
        </div>
      </div>
    `;
  }
  
  const trueCash = financialData.true_cash || financialData.true_cash_position || 0;
  const runway = financialData.true_cash_runway_months || financialData.runway_months || 0;
  const netProfit = financialData.net_profit || 0;
  const revenue = financialData.revenue || 0;
  const grossMargin = revenue > 0 ? ((financialData.gross_profit || 0) / revenue * 100) : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue * 100) : 0;
  
  // KPI health
  const redKpis = kpis.filter(k => k.rag_status === 'red').length;
  const amberKpis = kpis.filter(k => k.rag_status === 'amber').length;
  const greenKpis = kpis.length - redKpis - amberKpis;
  
  // Critical insights
  const criticalInsights = insights.filter(i => {
    const priority = getInsightPriority(i);
    return priority === 'critical' || priority === 'high' || priority === 'warning';
  }).slice(0, 3);
  
  // Determine status
  const runwayStatus = runway < 2 ? 'danger' : runway < 3 ? 'warning' : 'highlight';
  const profitStatus = netProfit < 0 ? 'danger' : netProfit === 0 ? 'warning' : '';
  
  // Tuesday Question
  const tuesdayQuestion = period?.tuesday_question || discoveryData?.tuesday_question;
  const tuesdayAnswer = period?.tuesday_answer || discoveryData?.tuesday_answer;
  
  return `
    <div class="page">
      <h2 class="section-title">Executive Summary</h2>
      
      ${tuesdayQuestion ? `
        <div class="tuesday-banner">
          <div class="tuesday-header">
            <span class="tuesday-icon">📅</span>
            <span class="tuesday-label">Your Tuesday Question</span>
          </div>
          <div class="tuesday-question">"${tuesdayQuestion}"</div>
          ${tuesdayAnswer ? `
            <div class="tuesday-answer">
              <div class="answer-badge ${getAnswerType(tuesdayAnswer)}">
                ${getAnswerBadge(tuesdayAnswer)}
              </div>
              <div class="answer-detail">${tuesdayAnswer}</div>
            </div>
          ` : `
            <div class="tuesday-answer">
              <div class="answer-detail" style="opacity: 0.7;">
                Answer will be provided in your review meeting.
              </div>
            </div>
          `}
        </div>
      ` : ''}
      
      <div class="metric-grid">
        <div class="metric-card ${runwayStatus}">
          <div class="metric-label">True Cash</div>
          <div class="metric-value ${trueCash >= 0 ? 'positive' : 'negative'}">${formatCurrency(trueCash)}</div>
          <div class="metric-change">${runway.toFixed(1)} months runway</div>
        </div>
        <div class="metric-card ${profitStatus}">
          <div class="metric-label">Net Profit</div>
          <div class="metric-value ${netProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(netProfit)}</div>
          <div class="metric-change">${formatPercent(netMargin)} margin</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Revenue</div>
          <div class="metric-value">${formatCurrency(revenue)}</div>
          <div class="metric-change">${formatPercent(grossMargin)} gross margin</div>
        </div>
        <div class="metric-card ${redKpis > 0 ? 'warning' : ''}">
          <div class="metric-label">KPI Health</div>
          <div class="metric-value">${greenKpis}/${kpis.length}</div>
          <div class="metric-change">${redKpis > 0 ? `${redKpis} need attention` : 'All healthy'}</div>
        </div>
      </div>
      
      ${criticalInsights.length > 0 ? `
        <h3 class="section-subtitle">Priority Findings This Period</h3>
        ${criticalInsights.map(insight => {
          const title = getInsightTitle(insight);
          const desc = getInsightDescription(insight);
          const priority = getInsightPriority(insight);
          return `
            <div class="insight-card ${priority === 'critical' ? 'critical' : priority === 'high' ? 'warning' : ''}">
              <div class="insight-header">
                <div class="insight-headline">${title}</div>
                <span class="rag-indicator ${priority === 'critical' || priority === 'high' ? 'rag-red' : 'rag-amber'}">${priority.toUpperCase()}</span>
              </div>
              <div class="insight-description">${desc.substring(0, 180)}${desc.length > 180 ? '...' : ''}</div>
            </div>
          `;
        }).join('')}
      ` : ''}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 3 of 12</span>
      </div>
    </div>
  `;
}

function getAnswerType(answer: string): string {
  const lower = answer.toLowerCase();
  if (lower.startsWith('yes')) return 'yes';
  if (lower.startsWith('no')) return 'no';
  if (lower.includes('not yet')) return 'not-yet';
  return 'conditional';
}

function getAnswerBadge(answer: string): string {
  const type = getAnswerType(answer);
  const badges: Record<string, string> = {
    'yes': '✓ YES',
    'no': '✗ NO',
    'not-yet': '⏳ NOT YET',
    'conditional': '⚖️ IT DEPENDS'
  };
  return badges[type] || badges.conditional;
}

function buildTrueCashPage(financialData: any): string {
  if (!financialData) {
    return `
      <div class="page">
        <h2 class="section-title">True Cash Position</h2>
        <p class="section-intro">Financial data not yet available.</p>
        <div class="page-footer">
          <span>Business Intelligence Report</span>
          <span>Page 4 of 12</span>
        </div>
      </div>
    `;
  }
  
  const bankBalance = financialData.cash_at_bank || 0;
  const vatLiability = financialData.vat_liability || 0;
  const payeLiability = financialData.paye_liability || 0;
  const corpTax = financialData.corporation_tax_liability || 0;
  const committedPayments = financialData.committed_payments || 0;
  const confirmedReceivables = financialData.confirmed_receivables || 0;
  const trueCash = financialData.true_cash || financialData.true_cash_position || 0;
  const runway = financialData.true_cash_runway_months || financialData.runway_months || 0;
  const burnRate = financialData.monthly_burn_rate || financialData.monthly_operating_costs || 0;
  
  const runwayStatus = runway < 2 ? 'danger' : runway < 3 ? 'warning' : '';
  
  return `
    <div class="page">
      <h2 class="section-title">True Cash Position</h2>
      
      <p class="section-intro">
        Your True Cash represents the money that's <strong>actually yours</strong> after accounting for 
        upcoming tax obligations and committed payments. It's a more accurate picture than bank balance alone.
      </p>
      
      <table class="waterfall-table">
        <tbody>
          <tr>
            <td class="font-bold">Cash at Bank</td>
            <td class="text-right font-bold amount">${formatCurrency(bankBalance)}</td>
          </tr>
          <tr class="waterfall-row-deduction">
            <td>Less: VAT Liability</td>
            <td class="text-right amount negative">(${formatCurrency(vatLiability)})</td>
          </tr>
          <tr class="waterfall-row-deduction">
            <td>Less: PAYE/NI Liability</td>
            <td class="text-right amount negative">(${formatCurrency(payeLiability)})</td>
          </tr>
          <tr class="waterfall-row-deduction">
            <td>Less: Corporation Tax Reserve</td>
            <td class="text-right amount negative">(${formatCurrency(corpTax)})</td>
          </tr>
          <tr class="waterfall-row-deduction">
            <td>Less: Committed Payments</td>
            <td class="text-right amount negative">(${formatCurrency(committedPayments)})</td>
          </tr>
          ${confirmedReceivables > 0 ? `
            <tr class="waterfall-row-addition">
              <td>Add: Confirmed Receivables (due this week)</td>
              <td class="text-right amount positive">+${formatCurrency(confirmedReceivables)}</td>
            </tr>
          ` : ''}
          <tr class="waterfall-total">
            <td>TRUE CASH POSITION</td>
            <td class="text-right amount ${trueCash >= 0 ? 'positive' : 'negative'}">${formatCurrency(trueCash)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="metric-grid metric-grid-3" style="margin-top: 32px;">
        <div class="metric-card">
          <div class="metric-label">Monthly Burn Rate</div>
          <div class="metric-value">${formatCurrency(burnRate)}</div>
          <div class="metric-change">Average monthly outgoings</div>
        </div>
        <div class="metric-card ${runwayStatus}">
          <div class="metric-label">Cash Runway</div>
          <div class="metric-value">${runway.toFixed(1)} months</div>
          <div class="metric-change">${Math.round(runway * 30)} days at current burn</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Trade Debtors</div>
          <div class="metric-value">${formatCurrency(financialData.trade_debtors || 0)}</div>
          <div class="metric-change">Outstanding invoices</div>
        </div>
      </div>
      
      ${runway < 3 ? `
        <div style="margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <span style="font-size: 20px;">⚠️</span>
            <div>
              <div style="font-weight: 600; color: #991b1b; margin-bottom: 4px;">Low Runway Warning</div>
              <div style="font-size: 9pt; color: #7f1d1d;">
                With ${runway.toFixed(1)} months runway, immediate attention to cash collection and cost management is recommended.
                ${runway < 2 ? 'Consider speaking with your advisor urgently about options.' : ''}
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 4 of 12</span>
      </div>
    </div>
  `;
}

function buildForecastPage(financialData: any, forecasts: any): string {
  const burnRate = financialData?.monthly_burn_rate || financialData?.monthly_operating_costs || 0;
  const trueCash = financialData?.true_cash || financialData?.true_cash_position || 0;
  const revenue = financialData?.revenue || 0;
  
  // Generate 13-week forecast
  const weeklyBurn = burnRate / 4.33;
  const weeklyInflow = (revenue * 0.9) / 4.33; // Assume 90% collection rate
  
  const weeks: any[] = [];
  let runningCash = trueCash;
  const today = new Date();
  
  for (let i = 0; i < 13; i++) {
    const weekDate = new Date(today);
    weekDate.setDate(weekDate.getDate() + (i * 7));
    
    if (i > 0) {
      runningCash = runningCash + weeklyInflow - weeklyBurn;
    }
    
    weeks.push({
      week: i + 1,
      date: weekDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      balance: runningCash,
      isNegative: runningCash < 0,
      isWarning: runningCash < (burnRate * 0.5) && runningCash >= 0
    });
  }
  
  const negativeWeeks = weeks.filter(w => w.isNegative);
  const minBalance = Math.min(...weeks.map(w => w.balance));
  
  return `
    <div class="page">
      <h2 class="section-title">13-Week Cash Forecast</h2>
      
      <p class="section-intro">
        Based on current burn rate of ${formatCurrency(burnRate)}/month and revenue run rate of ${formatCurrency(revenue)}/month.
      </p>
      
      ${negativeWeeks.length > 0 ? `
        <div style="margin-bottom: 20px; padding: 16px; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <span style="font-size: 20px;">⚠️</span>
            <div>
              <strong style="color: #991b1b;">Cash projected negative in ${negativeWeeks.length} of 13 weeks</strong>
              <div style="font-size: 9pt; color: #7f1d1d;">First occurrence: Week ${negativeWeeks[0].week} (${negativeWeeks[0].date})</div>
            </div>
          </div>
        </div>
      ` : `
        <div style="margin-bottom: 20px; padding: 16px; background: #f0fdf4; border-radius: 12px; border: 1px solid #86efac;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <span style="font-size: 20px;">✓</span>
            <div>
              <strong style="color: #166534;">Cash positive throughout the 13-week forecast</strong>
              <div style="font-size: 9pt; color: #15803d;">Minimum projected balance: ${formatCurrency(minBalance)}</div>
            </div>
          </div>
        </div>
      `}
      
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Date</th>
            <th class="text-right">Projected Balance</th>
            <th class="text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          ${weeks.map(w => `
            <tr style="${w.isNegative ? 'background: #fef2f2;' : w.isWarning ? 'background: #fffbeb;' : ''}">
              <td>Week ${w.week}</td>
              <td>${w.date}</td>
              <td class="text-right font-bold amount ${w.isNegative ? 'negative' : ''}">${formatCurrency(w.balance)}</td>
              <td class="text-right">
                <span class="rag-dot ${w.isNegative ? 'red' : w.isWarning ? 'amber' : 'green'}"></span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p style="margin-top: 16px; font-size: 8pt; color: #64748b; font-style: italic;">
        Note: This forecast assumes consistent revenue collection and operating costs. Actual results may vary.
        Discuss with your advisor to refine assumptions.
      </p>
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 5 of 12</span>
      </div>
    </div>
  `;
}

function buildScenariosPage(scenarios: any[], financialData: any, period: any): string {
  const trueCash = financialData?.true_cash || financialData?.true_cash_position || 0;
  const burnRate = financialData?.monthly_burn_rate || financialData?.monthly_operating_costs || 0;
  const revenue = financialData?.revenue || 0;
  
  // Generate default scenarios if none exist
  const displayScenarios = scenarios && scenarios.length > 0 ? scenarios : generateDefaultScenarios(trueCash, burnRate, revenue);
  
  // Get decisions from period or generate defaults
  const decisions = period?.decisions || generateDefaultDecisions(trueCash, burnRate, revenue);
  
  return `
    <div class="page">
      <h2 class="section-title">Scenarios & Decisions</h2>
      
      <p class="section-intro">
        Pre-modelled scenarios to help you understand potential impacts and make informed decisions.
      </p>
      
      ${displayScenarios.slice(0, 3).map((scenario: any) => {
        const verdict = getScenarioVerdict(scenario, trueCash, burnRate);
        return `
          <div class="scenario-card no-break">
            <div class="scenario-header">
              <span class="scenario-name">${scenario.name || scenario.scenario_type || 'Scenario'}</span>
              <span class="scenario-badge ${verdict.class}">${verdict.badge}</span>
            </div>
            <div class="scenario-metrics">
              <div class="scenario-metric">
                <div class="scenario-metric-label">Cash Impact</div>
                <div class="scenario-metric-value ${(scenario.projected_cash_impact || 0) >= 0 ? 'positive' : 'negative'}">
                  ${formatCurrency(scenario.projected_cash_impact || scenario.cash_impact || 0)}
                </div>
              </div>
              <div class="scenario-metric">
                <div class="scenario-metric-label">Runway Impact</div>
                <div class="scenario-metric-value">
                  ${scenario.projected_runway_impact >= 0 ? '+' : ''}${(scenario.projected_runway_impact || scenario.runway_impact || 0).toFixed(1)} mo
                </div>
              </div>
              <div class="scenario-metric">
                <div class="scenario-metric-label">New Runway</div>
                <div class="scenario-metric-value ${verdict.newRunway < 2 ? 'negative' : ''}">
                  ${verdict.newRunway.toFixed(1)} mo
                </div>
              </div>
            </div>
            ${scenario.recommendation || verdict.recommendation ? `
              <div class="scenario-recommendation">
                <strong>Recommendation:</strong> ${scenario.recommendation || verdict.recommendation}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
      
      ${decisions && decisions.length > 0 ? `
        <h3 class="section-subtitle">Decisions This Month</h3>
        ${decisions.slice(0, 4).map((d: any) => `
          <div class="decision-box ${d.verdict}">
            <span class="decision-icon">${d.verdict === 'yes' ? '✓' : d.verdict === 'no' ? '✗' : '⏳'}</span>
            <div class="decision-content">
              <div class="decision-title">${d.title}</div>
              <div class="decision-detail">${d.detail}</div>
            </div>
          </div>
        `).join('')}
      ` : ''}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 6 of 12</span>
      </div>
    </div>
  `;
}

function generateDefaultScenarios(trueCash: number, burnRate: number, revenue: number): any[] {
  const currentRunway = burnRate > 0 ? trueCash / burnRate : 0;
  
  return [
    {
      name: 'Hire New Team Member (£3,500/mo)',
      projected_cash_impact: -3500,
      projected_runway_impact: burnRate > 0 ? trueCash / (burnRate + 3500) - currentRunway : 0,
    },
    {
      name: 'Lose Largest Client (30% revenue)',
      projected_cash_impact: -revenue * 0.3,
      projected_runway_impact: burnRate > 0 ? trueCash / (burnRate + revenue * 0.3 * 0.4) - currentRunway : 0,
    },
    {
      name: 'Price Increase 10%',
      projected_cash_impact: revenue * 0.1,
      projected_runway_impact: burnRate > 0 ? trueCash / (burnRate - revenue * 0.1 * 0.4) - currentRunway : 0,
    }
  ];
}

function generateDefaultDecisions(trueCash: number, burnRate: number, revenue: number): any[] {
  const runway = burnRate > 0 ? trueCash / burnRate : 0;
  
  const decisions = [];
  
  if (runway < 3) {
    decisions.push({
      verdict: 'no',
      title: 'Major capital expenditure',
      detail: `Not recommended with ${runway.toFixed(1)} months runway. Revisit when runway > 3 months.`
    });
  }
  
  if (runway >= 2) {
    decisions.push({
      verdict: 'yes',
      title: 'Continue current operations',
      detail: 'Cash position supports normal business activities.'
    });
  }
  
  decisions.push({
    verdict: 'not-yet',
    title: 'New hires',
    detail: runway < 3 
      ? `Wait until true cash exceeds ${formatCurrency(burnRate * 3)}`
      : 'Review after next quarter results'
  });
  
  return decisions;
}

function getScenarioVerdict(scenario: any, trueCash: number, burnRate: number): any {
  const currentRunway = burnRate > 0 ? trueCash / burnRate : 0;
  const impact = scenario.projected_cash_impact || scenario.cash_impact || 0;
  const newCash = trueCash + impact;
  const newRunway = burnRate > 0 ? newCash / burnRate : currentRunway;
  
  let verdict = {
    class: 'acceptable',
    badge: '✓ ACCEPTABLE',
    newRunway,
    recommendation: 'Proceed with normal caution.'
  };
  
  if (newRunway < 2) {
    verdict = {
      class: 'high-risk',
      badge: '⚠️ HIGH RISK',
      newRunway,
      recommendation: `Would reduce runway to ${newRunway.toFixed(1)} months. Not recommended until cash position improves.`
    };
  } else if (newRunway < 3) {
    verdict = {
      class: 'moderate-risk',
      badge: '🟡 CAUTION',
      newRunway,
      recommendation: 'Proceed with close cash monitoring. Review weekly.'
    };
  }
  
  return verdict;
}

function buildPLPage(financialData: any, comparisons: any): string {
  if (!financialData) {
    return `
      <div class="page">
        <h2 class="section-title">Profit & Loss Summary</h2>
        <p class="section-intro">Financial data not yet available.</p>
        <div class="page-footer">
          <span>Business Intelligence Report</span>
          <span>Page 7 of 12</span>
        </div>
      </div>
    `;
  }
  
  const revenue = financialData.revenue || 0;
  const cos = financialData.cost_of_sales || 0;
  const grossProfit = financialData.gross_profit || (revenue - cos);
  const overheads = financialData.overheads || 0;
  const operatingProfit = financialData.operating_profit || (grossProfit - overheads);
  const netProfit = financialData.net_profit || operatingProfit;
  
  const grossMargin = revenue > 0 ? (grossProfit / revenue * 100) : 0;
  const opMargin = revenue > 0 ? (operatingProfit / revenue * 100) : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue * 100) : 0;
  
  const budget = comparisons?.budget_month || {};
  const priorMonth = comparisons?.prior_month || {};
  
  return `
    <div class="page">
      <h2 class="section-title">Profit & Loss Summary</h2>
      
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">Line Item</th>
            <th class="text-right">Actual</th>
            <th class="text-right">% Rev</th>
            ${budget.revenue ? '<th class="text-right">Budget</th><th class="text-right">Var</th>' : ''}
            ${priorMonth.revenue ? '<th class="text-right">Prior</th>' : ''}
          </tr>
        </thead>
        <tbody>
          <tr style="background: #f8fafc;">
            <td class="font-bold">Revenue</td>
            <td class="text-right font-bold amount">${formatCurrency(revenue)}</td>
            <td class="text-right">100.0%</td>
            ${budget.revenue ? `<td class="text-right amount">${formatCurrency(budget.revenue)}</td>
            <td class="text-right amount ${revenue - budget.revenue >= 0 ? 'positive' : 'negative'}">${formatCurrency(revenue - budget.revenue)}</td>` : ''}
            ${priorMonth.revenue ? `<td class="text-right amount">${formatCurrency(priorMonth.revenue)}</td>` : ''}
          </tr>
          <tr>
            <td style="padding-left: 20px;">Cost of Sales</td>
            <td class="text-right amount">(${formatCurrency(cos)})</td>
            <td class="text-right">${formatPercent(revenue > 0 ? cos / revenue * 100 : 0)}</td>
            ${budget.revenue ? `<td class="text-right amount">(${formatCurrency(budget.cost_of_sales || 0)})</td><td></td>` : ''}
            ${priorMonth.revenue ? `<td class="text-right amount">(${formatCurrency(priorMonth.cost_of_sales || 0)})</td>` : ''}
          </tr>
          <tr class="subtotal">
            <td class="font-bold">Gross Profit</td>
            <td class="text-right font-bold amount">${formatCurrency(grossProfit)}</td>
            <td class="text-right font-bold">${formatPercent(grossMargin)}</td>
            ${budget.revenue ? `<td class="text-right amount">${formatCurrency(budget.gross_profit || 0)}</td>
            <td class="text-right amount ${grossProfit - (budget.gross_profit || 0) >= 0 ? 'positive' : 'negative'}">${formatCurrency(grossProfit - (budget.gross_profit || 0))}</td>` : ''}
            ${priorMonth.revenue ? `<td class="text-right amount">${formatCurrency(priorMonth.gross_profit || 0)}</td>` : ''}
          </tr>
          <tr>
            <td style="padding-left: 20px;">Overheads</td>
            <td class="text-right amount">(${formatCurrency(overheads)})</td>
            <td class="text-right">${formatPercent(revenue > 0 ? overheads / revenue * 100 : 0)}</td>
            ${budget.revenue ? `<td class="text-right amount">(${formatCurrency(budget.overheads || 0)})</td><td></td>` : ''}
            ${priorMonth.revenue ? `<td class="text-right amount">(${formatCurrency(priorMonth.overheads || 0)})</td>` : ''}
          </tr>
          <tr class="subtotal">
            <td class="font-bold">Operating Profit</td>
            <td class="text-right font-bold amount">${formatCurrency(operatingProfit)}</td>
            <td class="text-right font-bold">${formatPercent(opMargin)}</td>
            ${budget.revenue ? `<td></td><td></td>` : ''}
            ${priorMonth.revenue ? `<td></td>` : ''}
          </tr>
          <tr class="total-row">
            <td>Net Profit</td>
            <td class="text-right">${formatCurrency(netProfit)}</td>
            <td class="text-right">${formatPercent(netMargin)}</td>
            ${budget.revenue ? `<td class="text-right">${formatCurrency(budget.net_profit || 0)}</td>
            <td class="text-right">${formatCurrency(netProfit - (budget.net_profit || 0))}</td>` : ''}
            ${priorMonth.revenue ? `<td class="text-right">${formatCurrency(priorMonth.net_profit || 0)}</td>` : ''}
          </tr>
        </tbody>
      </table>
      
      <div class="metric-grid metric-grid-3" style="margin-top: 32px;">
        <div class="metric-card highlight">
          <div class="metric-label">Gross Margin</div>
          <div class="metric-value ${grossMargin < 40 ? 'warning' : ''}">${formatPercent(grossMargin)}</div>
          <div class="metric-change">Target: 50%+</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Operating Margin</div>
          <div class="metric-value ${opMargin < 10 ? 'warning' : ''}">${formatPercent(opMargin)}</div>
          <div class="metric-change">Target: 15%+</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Net Margin</div>
          <div class="metric-value ${netMargin < 5 ? 'negative' : netMargin < 10 ? 'warning' : 'positive'}">${formatPercent(netMargin)}</div>
          <div class="metric-change">Target: 10%+</div>
        </div>
      </div>
      
      ${renderMarginChart(grossMargin, opMargin, netMargin)}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 7 of 12</span>
      </div>
    </div>
  `;
}

function renderMarginChart(grossMargin: number, opMargin: number, netMargin: number): string {
  const maxVal = Math.max(grossMargin, 100);
  const barHeight = 100;
  const barWidth = 70;
  const gap = 40;
  const chartWidth = (barWidth * 3) + (gap * 2) + 40;
  
  const bars = [
    { label: 'Gross', value: grossMargin, color: '#3b82f6' },
    { label: 'Operating', value: opMargin, color: '#10b981' },
    { label: 'Net', value: netMargin, color: '#8b5cf6' },
  ];
  
  return `
    <div class="margin-chart-container">
      <svg width="${chartWidth}" height="${barHeight + 50}" viewBox="0 0 ${chartWidth} ${barHeight + 50}">
        ${bars.map((bar, i) => {
          const h = Math.max(0, (bar.value / maxVal) * barHeight);
          const x = 20 + i * (barWidth + gap);
          const y = barHeight - h;
          
          return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="${bar.color}" rx="4" />
            <text x="${x + barWidth/2}" y="${barHeight + 20}" text-anchor="middle" font-size="10" fill="#64748b">${bar.label}</text>
            <text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" font-size="12" font-weight="600" fill="#1e293b">${bar.value.toFixed(1)}%</text>
          `;
        }).join('')}
      </svg>
    </div>
  `;
}

function buildBalanceSheetPage(financialData: any): string {
  if (!financialData) {
    return `
      <div class="page">
        <h2 class="section-title">Balance Sheet</h2>
        <p class="section-intro">Financial data not yet available.</p>
        <div class="page-footer">
          <span>Business Intelligence Report</span>
          <span>Page 8 of 12</span>
        </div>
      </div>
    `;
  }
  
  // Current Assets
  const cashAtBank = financialData.cash_at_bank || 0;
  const tradeDebtors = financialData.trade_debtors || 0;
  const prepayments = financialData.prepayments || 0;
  const confirmedReceivables = financialData.confirmed_receivables || 0;
  const totalCurrentAssets = cashAtBank + tradeDebtors + prepayments + confirmedReceivables;
  
  // Current Liabilities
  const tradeCreditors = financialData.trade_creditors || 0;
  const vatLiability = financialData.vat_liability || 0;
  const payeLiability = financialData.paye_liability || 0;
  const corpTax = financialData.corporation_tax_liability || 0;
  const accruals = financialData.accruals || 0;
  const totalCurrentLiabilities = tradeCreditors + vatLiability + payeLiability + corpTax + accruals;
  
  // Key Ratios
  const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
  const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
  const quickRatio = totalCurrentLiabilities > 0 ? (cashAtBank + tradeDebtors) / totalCurrentLiabilities : 0;
  
  const ratioStatus = (val: number, target: number) => val >= target ? 'positive' : val >= target * 0.8 ? 'warning' : 'negative';
  
  return `
    <div class="page">
      <h2 class="section-title">Balance Sheet</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
        <div>
          <h3 class="section-subtitle" style="margin-top: 0;">Current Assets</h3>
          <table>
            <tbody>
              <tr>
                <td>Cash at Bank</td>
                <td class="text-right amount">${formatCurrency(cashAtBank)}</td>
              </tr>
              <tr>
                <td>Trade Debtors</td>
                <td class="text-right amount">${formatCurrency(tradeDebtors)}</td>
              </tr>
              ${prepayments > 0 ? `
                <tr>
                  <td>Prepayments</td>
                  <td class="text-right amount">${formatCurrency(prepayments)}</td>
                </tr>
              ` : ''}
              ${confirmedReceivables > 0 ? `
                <tr>
                  <td>Confirmed Receivables</td>
                  <td class="text-right amount">${formatCurrency(confirmedReceivables)}</td>
                </tr>
              ` : ''}
              <tr class="subtotal">
                <td class="font-bold">Total Current Assets</td>
                <td class="text-right font-bold amount">${formatCurrency(totalCurrentAssets)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div>
          <h3 class="section-subtitle" style="margin-top: 0;">Current Liabilities</h3>
          <table>
            <tbody>
              <tr>
                <td>Trade Creditors</td>
                <td class="text-right amount negative">${formatCurrency(tradeCreditors)}</td>
              </tr>
              <tr>
                <td>VAT Liability</td>
                <td class="text-right amount negative">${formatCurrency(vatLiability)}</td>
              </tr>
              <tr>
                <td>PAYE/NI Liability</td>
                <td class="text-right amount negative">${formatCurrency(payeLiability)}</td>
              </tr>
              <tr>
                <td>Corporation Tax</td>
                <td class="text-right amount negative">${formatCurrency(corpTax)}</td>
              </tr>
              ${accruals > 0 ? `
                <tr>
                  <td>Accruals</td>
                  <td class="text-right amount negative">${formatCurrency(accruals)}</td>
                </tr>
              ` : ''}
              <tr class="subtotal">
                <td class="font-bold">Total Current Liabilities</td>
                <td class="text-right font-bold amount negative">${formatCurrency(totalCurrentLiabilities)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div style="margin-top: 24px; padding: 20px; background: ${workingCapital >= 0 ? '#f0fdf4' : '#fef2f2'}; border-radius: 12px; border: 1px solid ${workingCapital >= 0 ? '#86efac' : '#fecaca'};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10pt; color: #64748b; margin-bottom: 4px;">Working Capital</div>
            <div style="font-size: 24pt; font-weight: 700; color: ${workingCapital >= 0 ? '#059669' : '#dc2626'};">${formatCurrency(workingCapital)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 9pt; color: #64748b;">Current Ratio: <strong>${currentRatio.toFixed(2)}:1</strong></div>
            <div style="font-size: 9pt; color: #64748b;">Quick Ratio: <strong>${quickRatio.toFixed(2)}:1</strong></div>
          </div>
        </div>
      </div>
      
      <div class="metric-grid metric-grid-3" style="margin-top: 24px;">
        <div class="metric-card">
          <div class="metric-label">Current Ratio</div>
          <div class="metric-value ${ratioStatus(currentRatio, 1.5)}">${currentRatio.toFixed(2)}:1</div>
          <div class="metric-change">Target: 1.5:1+</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Quick Ratio</div>
          <div class="metric-value ${ratioStatus(quickRatio, 1.0)}">${quickRatio.toFixed(2)}:1</div>
          <div class="metric-change">Target: 1.0:1+</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Debtor Days</div>
          <div class="metric-value">${financialData.debtor_days?.toFixed(0) || '-'}</div>
          <div class="metric-change">Target: &lt;45 days</div>
        </div>
      </div>
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 8 of 12</span>
      </div>
    </div>
  `;
}

function buildCashFlowPage(financialData: any): string {
  if (!financialData) {
    return `
      <div class="page">
        <h2 class="section-title">Cash Flow Summary</h2>
        <p class="section-intro">Financial data not yet available.</p>
        <div class="page-footer">
          <span>Business Intelligence Report</span>
          <span>Page 9 of 12</span>
        </div>
      </div>
    `;
  }
  
  // Operating Cash Flow Items
  const netProfit = financialData.net_profit || 0;
  const depreciation = financialData.depreciation || 0;
  const debtorChange = financialData.debtor_change || 0;
  const creditorChange = financialData.creditor_change || 0;
  const operatingCashFlow = netProfit + depreciation - debtorChange + creditorChange;
  
  // Inflows
  const customerReceipts = financialData.revenue || 0;
  const otherIncome = financialData.other_income || 0;
  const totalInflows = customerReceipts + otherIncome;
  
  // Outflows
  const supplierPayments = financialData.cost_of_sales || 0;
  const staffCosts = financialData.payroll_costs || (financialData.overheads * 0.5) || 0;
  const overheadPayments = (financialData.overheads || 0) - staffCosts;
  const taxPayments = (financialData.vat_paid || 0) + (financialData.paye_paid || 0);
  const totalOutflows = supplierPayments + staffCosts + overheadPayments + taxPayments;
  
  const netCashFlow = totalInflows - totalOutflows;
  
  return `
    <div class="page">
      <h2 class="section-title">Cash Flow Summary</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
        <div>
          <h3 class="section-subtitle" style="margin-top: 0; color: #059669;">💰 Cash Inflows</h3>
          <table>
            <tbody>
              <tr>
                <td>Customer Receipts</td>
                <td class="text-right amount positive">${formatCurrency(customerReceipts)}</td>
              </tr>
              ${otherIncome > 0 ? `
                <tr>
                  <td>Other Income</td>
                  <td class="text-right amount positive">${formatCurrency(otherIncome)}</td>
                </tr>
              ` : ''}
              <tr class="subtotal">
                <td class="font-bold">Total Inflows</td>
                <td class="text-right font-bold amount positive">${formatCurrency(totalInflows)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div>
          <h3 class="section-subtitle" style="margin-top: 0; color: #dc2626;">📤 Cash Outflows</h3>
          <table>
            <tbody>
              <tr>
                <td>Supplier Payments</td>
                <td class="text-right amount negative">(${formatCurrency(supplierPayments)})</td>
              </tr>
              <tr>
                <td>Staff Costs</td>
                <td class="text-right amount negative">(${formatCurrency(staffCosts)})</td>
              </tr>
              <tr>
                <td>Overhead Payments</td>
                <td class="text-right amount negative">(${formatCurrency(overheadPayments)})</td>
              </tr>
              <tr>
                <td>Tax Payments</td>
                <td class="text-right amount negative">(${formatCurrency(taxPayments)})</td>
              </tr>
              <tr class="subtotal">
                <td class="font-bold">Total Outflows</td>
                <td class="text-right font-bold amount negative">(${formatCurrency(totalOutflows)})</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div style="margin-top: 32px; padding: 24px; background: ${netCashFlow >= 0 ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'}; border-radius: 16px;">
        <div style="text-align: center;">
          <div style="font-size: 10pt; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Net Cash Flow This Period</div>
          <div style="font-size: 36pt; font-weight: 800; color: ${netCashFlow >= 0 ? '#059669' : '#dc2626'};">
            ${netCashFlow >= 0 ? '+' : ''}${formatCurrency(netCashFlow)}
          </div>
        </div>
      </div>
      
      <div class="metric-grid metric-grid-3" style="margin-top: 24px;">
        <div class="metric-card">
          <div class="metric-label">Opening Cash</div>
          <div class="metric-value">${formatCurrency((financialData.cash_at_bank || 0) - netCashFlow)}</div>
        </div>
        <div class="metric-card highlight">
          <div class="metric-label">Closing Cash</div>
          <div class="metric-value">${formatCurrency(financialData.cash_at_bank || 0)}</div>
        </div>
        <div class="metric-card ${netCashFlow < 0 ? 'warning' : ''}">
          <div class="metric-label">Cash Conversion</div>
          <div class="metric-value">${netProfit !== 0 ? ((operatingCashFlow / netProfit) * 100).toFixed(0) : '-'}%</div>
          <div class="metric-change">Profit → Cash</div>
        </div>
      </div>
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 9 of 12</span>
      </div>
    </div>
  `;
}

function buildInsightsPage(insights: any[], discoveryData: any): string {
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, warning: 1, medium: 2, low: 3, opportunity: 2, positive: 3 };
  const sortedInsights = [...insights].sort((a, b) => {
    const aPriority = getInsightPriority(a);
    const bPriority = getInsightPriority(b);
    return (priorityOrder[aPriority] ?? 3) - (priorityOrder[bPriority] ?? 3);
  });
  
  // Client voice quote from discovery
  const clientVoice = discoveryData?.sleep_better || discoveryData?.worst_cash_moment || discoveryData?.blindspot_story;
  
  return `
    <div class="page">
      <h2 class="section-title">Insights & Recommendations</h2>
      
      ${clientVoice ? `
        <div style="margin-bottom: 24px; padding: 16px 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
          <div style="font-size: 9pt; color: #1e40af; margin-bottom: 8px; font-weight: 600;">💬 Your Words, Our Focus</div>
          <div style="font-size: 10pt; font-style: italic; color: #1e293b;">"${clientVoice}"</div>
        </div>
      ` : ''}
      
      ${sortedInsights.length > 0 ? sortedInsights.slice(0, 6).map(insight => {
        const title = getInsightTitle(insight);
        const description = getInsightDescription(insight);
        const priority = getInsightPriority(insight);
        const recommendation = insight.recommendation || insight.recommended_action;
        
        const cardClass = priority === 'critical' ? 'critical' 
          : priority === 'high' || priority === 'warning' ? 'warning' 
          : priority === 'opportunity' ? 'opportunity' 
          : '';
        
        const badgeClass = priority === 'critical' || priority === 'high' || priority === 'warning'
          ? 'rag-red' 
          : priority === 'medium' 
            ? 'rag-amber' 
            : 'rag-green';
        
        return `
          <div class="insight-card ${cardClass} no-break">
            <div class="insight-header">
              <div class="insight-headline">${title}</div>
              <span class="rag-indicator ${badgeClass}">${priority.toUpperCase()}</span>
            </div>
            <div class="insight-description">${description}</div>
            ${recommendation ? `
              <div class="insight-action">
                <strong>Recommended Action:</strong> ${recommendation}
              </div>
            ` : ''}
          </div>
        `;
      }).join('') : `
        <p class="section-intro">No insights generated for this period yet. Insights will appear after your advisor reviews the financial data.</p>
      `}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 10 of 12</span>
      </div>
    </div>
  `;
}

function buildWatchListKPIPage(kpis: any[], financialData: any): string {
  // Generate watch list items
  const watchItems = generateWatchList(financialData);
  
  return `
    <div class="page">
      <h2 class="section-title">Watch List & KPIs</h2>
      
      <h3 class="section-subtitle" style="margin-top: 0;">📋 Your Watch List</h3>
      <p class="section-intro">Personalized thresholds we're monitoring for you</p>
      
      <div style="margin-bottom: 28px;">
        ${watchItems.map(item => `
          <div class="watch-item">
            <span class="rag-dot ${item.status}"></span>
            <div class="watch-content">
              <div class="watch-metric">${item.metric}</div>
              <div class="watch-values">
                <span>Current: <strong>${item.currentValue}</strong></span>
                <span>Threshold: ${item.threshold}</span>
              </div>
              ${item.action ? `<div class="watch-action">${item.action}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      
      ${kpis.length > 0 ? `
        <h3 class="section-subtitle">📊 Key Performance Indicators</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 40%;">KPI</th>
              <th class="text-right">Value</th>
              <th class="text-right">Target</th>
              <th class="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            ${kpis.slice(0, 8).map(kpi => {
              const value = kpi.value;
              const format = kpi.definition?.display_format || 'number';
              let displayValue = value?.toFixed(1) || '-';
              if (format === 'percentage') displayValue = `${value?.toFixed(1)}%`;
              if (format === 'currency') displayValue = formatCurrency(value);
              if (format === 'days') displayValue = `${Math.round(value || 0)} days`;
              
              return `
                <tr>
                  <td>
                    <strong>${kpi.definition?.name || kpi.kpi_code || 'KPI'}</strong>
                  </td>
                  <td class="text-right font-bold">${displayValue}</td>
                  <td class="text-right">${kpi.target_value ? (format === 'currency' ? formatCurrency(kpi.target_value) : kpi.target_value) : '-'}</td>
                  <td class="text-right">
                    <span class="rag-dot ${kpi.rag_status || 'grey'}"></span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : ''}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 11 of 12</span>
      </div>
    </div>
  `;
}

function generateWatchList(financialData: any): any[] {
  if (!financialData) return [];
  
  const trueCash = financialData.true_cash || financialData.true_cash_position || 0;
  const runway = financialData.true_cash_runway_months || financialData.runway_months || 0;
  const burnRate = financialData.monthly_burn_rate || financialData.monthly_operating_costs || 0;
  const grossMargin = financialData.revenue > 0 ? ((financialData.gross_profit || 0) / financialData.revenue * 100) : 0;
  const debtorDays = financialData.debtor_days || 0;
  
  return [
    {
      metric: 'True Cash below £30,000',
      currentValue: formatCurrency(trueCash),
      threshold: '£30,000',
      status: trueCash < 30000 ? 'red' : trueCash < 40000 ? 'amber' : 'green',
      action: trueCash < 30000 ? 'Review all non-essential spending immediately' : null
    },
    {
      metric: 'Runway below 2 months',
      currentValue: `${runway.toFixed(1)} months`,
      threshold: '2 months',
      status: runway < 2 ? 'red' : runway < 3 ? 'amber' : 'green',
      action: runway < 2 ? 'Accelerate collections, delay non-critical payments' : null
    },
    {
      metric: 'Gross Margin below 50%',
      currentValue: `${grossMargin.toFixed(1)}%`,
      threshold: '50%',
      status: grossMargin < 50 ? 'red' : grossMargin < 55 ? 'amber' : 'green',
      action: grossMargin < 50 ? 'Review pricing and direct costs' : null
    },
    {
      metric: 'Debtor Days above 45',
      currentValue: `${Math.round(debtorDays)} days`,
      threshold: '45 days',
      status: debtorDays > 45 ? 'red' : debtorDays > 35 ? 'amber' : 'green',
      action: debtorDays > 45 ? 'Chase overdue invoices aggressively' : null
    },
    {
      metric: `Monthly Burn above ${formatCurrency(55000)}`,
      currentValue: formatCurrency(burnRate),
      threshold: formatCurrency(55000),
      status: burnRate > 55000 ? 'red' : burnRate > 50000 ? 'amber' : 'green',
      action: burnRate > 55000 ? 'Cost reduction review needed' : null
    }
  ];
}

function buildBackCover(engagement: any, tier: string): string {
  const tierLabels: Record<string, string> = {
    clarity: 'Clarity',
    foresight: 'Foresight',
    strategic: 'Strategic',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum'
  };
  
  const tierDescriptions: Record<string, string> = {
    clarity: 'Essential financial clarity with True Cash position, core KPIs, and monthly insights.',
    foresight: 'Forward-looking analysis with cash forecasting, scenarios, and proactive recommendations.',
    strategic: 'Full advisory partnership with deep analysis, strategic planning, and priority support.',
    bronze: 'Essential reporting and insights.',
    silver: 'Enhanced analysis with forecasting.',
    gold: 'Comprehensive advisory support.',
    platinum: 'Full strategic partnership.'
  };
  
  return `
    <div class="page back-cover">
      <div style="max-width: 500px;">
        <div style="font-size: 28pt; font-weight: 700; color: #1e3a8a; margin-bottom: 16px;">
          Your ${tierLabels[tier] || tier} Service
        </div>
        <p style="color: #64748b; font-size: 11pt; line-height: 1.6; margin-bottom: 40px;">
          ${tierDescriptions[tier] || 'Comprehensive business intelligence designed to give you financial clarity and confidence in your business decisions.'}
        </p>
        
        <div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 40px;">
          <div style="font-size: 14pt; font-weight: 600; color: #1e293b; margin-bottom: 20px;">
            Questions about this report?
          </div>
          <p style="color: #475569; font-size: 10pt; line-height: 1.6; margin-bottom: 20px;">
            Your Torsor advisor is here to discuss any of the findings,<br>
            recommendations, or scenarios in this report.
          </p>
          <div style="display: flex; gap: 24px; justify-content: center;">
            <div style="text-align: center;">
              <div style="font-size: 9pt; color: #64748b; margin-bottom: 4px;">Email</div>
              <div style="color: #3b82f6; font-weight: 500;">hello@torsor.co.uk</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 9pt; color: #64748b; margin-bottom: 4px;">Website</div>
              <div style="color: #3b82f6; font-weight: 500;">torsor.co.uk</div>
            </div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
          </div>
          <div style="font-size: 20pt; font-weight: 700; color: #1e3a8a;">Torsor</div>
        </div>
        
        <p style="font-size: 9pt; color: #94a3b8;">
          Business Intelligence that goes beyond the numbers.
        </p>
      </div>
      
      <div style="position: absolute; bottom: 40px; font-size: 8pt; color: #94a3b8;">
        © ${new Date().getFullYear()} Torsor Business Services. All rights reserved.<br>
        This report is confidential and prepared for the named client only.
      </div>
    </div>
  `;
}
