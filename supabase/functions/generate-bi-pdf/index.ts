/**
 * Business Intelligence PDF Report Generator
 * 
 * This edge function generates PDF reports for BI periods.
 * It fetches all report data, builds HTML, and uses a PDF service to render.
 * 
 * For production, you can integrate with:
 * - Puppeteer (via a Docker-based setup)
 * - PDF rendering services like DocRaptor, PDFShift, etc.
 * - Client-side generation with react-pdf
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
    const { periodId, engagementId, options = {} } = request;

    const exportOptions: ExportOptions = {
      includeComparisons: options.includeComparisons ?? true,
      includeBudget: options.includeBudget ?? true,
      includeBalanceSheet: options.includeBalanceSheet ?? false,
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

    // For now, return the HTML for client-side PDF generation
    // In production, you would:
    // 1. Use a PDF service API to convert HTML to PDF
    // 2. Upload to Supabase Storage
    // 3. Return the download URL

    // Generate a filename
    const filename = generateFilename(reportData);

    // Try to store the HTML, but handle gracefully if bucket doesn't exist
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
        // Use signed URL for private bucket (valid for 1 hour)
        const { data: signedData, error: signedError } = await supabase.storage
          .from('bi-reports')
          .createSignedUrl(tempPath, 3600); // 1 hour expiry
        
        if (signedData && !signedError) {
          storageUrl = signedData.signedUrl;
        } else {
          console.warn('[generate-bi-pdf] Failed to create signed URL:', signedError);
        }
      } else {
        console.warn('[generate-bi-pdf] Storage upload failed (bucket may not exist):', uploadError.message);
      }
    } catch (storageErr) {
      console.warn('[generate-bi-pdf] Storage error (bucket may not exist):', storageErr);
    }

    // Try to record the generated report, but don't fail if table doesn't exist
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

    // Always return the HTML so client can render it properly
    // The storageUrl is for reference/backup but HTML is primary
    return new Response(
      JSON.stringify({ 
        success: true,
        html, // Client should use this to render in new window
        filename: `${filename}.pdf`,
        storageUrl, // Backup URL for downloading raw HTML if needed
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
    console.log('[generate-bi-pdf] Period not found in bi_periods or ma_periods');
    return { 
      period: null, 
      engagement: null, 
      client: null, 
      financialData: null, 
      kpis: [], 
      insights: [] 
    };
  }
  
  // Fetch engagement - try both tables
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
  
  // Fetch client separately if engagement exists
  let client = null;
  if (engagement?.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('id', engagement.client_id)
      .single();
    client = clientData;
  }
  
  // Attach for compatibility
  period.engagement = engagement;
  if (engagement) engagement.client = client;

  // Fetch financial data - try both tables
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

  // Fetch KPIs - try bi_kpi_values first, then ma_kpi_values
  let { data: kpis } = await supabase
    .from('bi_kpi_values')
    .select(`
      *,
      definition:bi_kpi_definitions(*)
    `)
    .eq('period_id', periodId);
  
  if (!kpis || kpis.length === 0) {
    const { data: maKpis } = await supabase
      .from('ma_kpi_values')
      .select('*')
      .eq('period_id', periodId);
    kpis = maKpis;
  }

  // Fetch insights - try bi_insights first, then ma_insights
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

  // Fetch comparisons if requested
  let comparisons = null;
  if (options.includeComparisons) {
    const { data } = await supabase
      .from('bi_period_comparisons')
      .select('*')
      .eq('period_id', periodId)
      .single();
    comparisons = data;
  }

  // Fetch forecasts if requested
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

  // Fetch scenarios if requested
  let scenarios = null;
  if (options.includeScenarios) {
    const { data } = await supabase
      .from('bi_scenarios')
      .select('*')
      .eq('period_id', periodId)
      .eq('is_featured', true);
    scenarios = data;
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
    scenarios
  };
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
  const { period, engagement, client, financialData, kpis, insights, comparisons, forecasts, scenarios } = data;
  
  const clientName = client?.company_name || client?.name || 'Client';
  const periodLabel = period?.period_label || 'Business Intelligence Report';
  const tier = engagement?.tier || 'clarity';
  
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
  ${buildCoverPage(clientName, periodLabel, tier)}
  ${buildExecutiveSummary(financialData, insights, kpis)}
  ${financialData ? buildTrueCashPage(financialData) : ''}
  ${options.includeComparisons && comparisons ? buildPLAnalysisPage(financialData, comparisons) : ''}
  ${kpis.length > 0 ? buildKPIPage(kpis) : ''}
  ${insights.length > 0 ? buildInsightsPage(insights) : ''}
  ${options.includeForecasts && forecasts?.length > 0 ? buildForecastPage(forecasts[0]) : ''}
  ${options.includeScenarios && scenarios?.length > 0 ? buildScenariosPage(scenarios) : ''}
  ${buildBackCover(engagement)}
</body>
</html>
`;
}

function getReportStyles(): string {
  return `
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1e293b;
      background: white;
    }
    
    .page {
      page-break-after: always;
      min-height: 100vh;
      padding: 40px;
      position: relative;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    /* Cover Page */
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
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
    }
    
    .cover-title {
      font-size: 36pt;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }
    
    .cover-subtitle {
      font-size: 18pt;
      opacity: 0.9;
      margin-bottom: 60px;
    }
    
    .cover-client {
      font-size: 24pt;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .cover-tier {
      display: inline-block;
      padding: 8px 20px;
      background: rgba(255,255,255,0.2);
      border-radius: 30px;
      font-size: 12pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 20px;
    }
    
    .cover-footer {
      position: absolute;
      bottom: 60px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10pt;
      opacity: 0.7;
    }
    
    /* Section Styles */
    .section-title {
      font-size: 20pt;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 3px solid #3b82f6;
    }
    
    .section-subtitle {
      font-size: 14pt;
      font-weight: 600;
      color: #334155;
      margin: 24px 0 16px;
    }
    
    /* Metric Cards */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }
    
    .metric-card.highlight {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-color: #93c5fd;
    }
    
    .metric-label {
      font-size: 9pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    
    .metric-value {
      font-size: 24pt;
      font-weight: 700;
      color: #0f172a;
    }
    
    .metric-value.positive { color: #059669; }
    .metric-value.negative { color: #dc2626; }
    .metric-value.warning { color: #d97706; }
    
    .metric-change {
      font-size: 10pt;
      margin-top: 8px;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background: #f8fafc;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    
    /* RAG Status */
    .rag-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 600;
    }
    
    .rag-green { background: #dcfce7; color: #166534; }
    .rag-amber { background: #fef3c7; color: #92400e; }
    .rag-red { background: #fee2e2; color: #991b1b; }
    
    /* Insights */
    .insight-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      border-left: 4px solid #3b82f6;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .insight-card.warning { border-left-color: #f59e0b; }
    .insight-card.opportunity { border-left-color: #10b981; }
    .insight-card.action { border-left-color: #ef4444; }
    
    .insight-headline {
      font-weight: 600;
      font-size: 12pt;
      color: #1e293b;
      margin-bottom: 8px;
    }
    
    .insight-description {
      font-size: 10pt;
      color: #475569;
      line-height: 1.6;
    }
    
    .insight-action {
      margin-top: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      font-size: 10pt;
    }
    
    .insight-action strong {
      color: #1e3a8a;
    }
    
    /* Footer */
    .page-footer {
      position: absolute;
      bottom: 20px;
      left: 40px;
      right: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
    
    /* Print-specific */
    @media print {
      .page {
        page-break-after: always;
      }
      
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
}

function buildCoverPage(clientName: string, periodLabel: string, tier: string): string {
  const tierLabels: Record<string, string> = {
    clarity: 'Clarity',
    foresight: 'Foresight',
    strategic: 'Strategic'
  };
  
  return `
    <div class="page cover-page">
      <div class="cover-logo">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
      </div>
      <h1 class="cover-title">Business Intelligence</h1>
      <p class="cover-subtitle">${periodLabel}</p>
      <div class="cover-client">${clientName}</div>
      <div class="cover-tier">${tierLabels[tier] || 'Clarity'} Tier</div>
      <div class="cover-footer">
        Prepared by Torsor Business Services<br>
        Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  `;
}

function buildExecutiveSummary(financialData: any, insights: any[], kpis: any[]): string {
  if (!financialData) return '';
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val || 0);
  
  const trueCash = financialData.true_cash || 0;
  const runway = financialData.true_cash_runway_months || 0;
  const netProfit = financialData.net_profit || 0;
  const revenue = financialData.revenue || 0;
  const netMargin = revenue > 0 ? (netProfit / revenue * 100).toFixed(1) : '0.0';
  
  const criticalInsights = insights.filter(i => i.priority === 'critical' || i.priority === 'high').slice(0, 3);
  const redKpis = kpis.filter(k => k.rag_status === 'red').length;
  const amberKpis = kpis.filter(k => k.rag_status === 'amber').length;
  
  return `
    <div class="page">
      <h2 class="section-title">Executive Summary</h2>
      
      <div class="metric-grid">
        <div class="metric-card highlight">
          <div class="metric-label">True Cash Position</div>
          <div class="metric-value ${trueCash >= 0 ? 'positive' : 'negative'}">${formatCurrency(trueCash)}</div>
          <div class="metric-change">${runway.toFixed(1)} months runway</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Net Profit</div>
          <div class="metric-value ${netProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(netProfit)}</div>
          <div class="metric-change">${netMargin}% margin</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">KPI Health</div>
          <div class="metric-value">${kpis.length - redKpis - amberKpis}/${kpis.length}</div>
          <div class="metric-change">${redKpis > 0 ? `${redKpis} need attention` : 'All healthy'}</div>
        </div>
      </div>
      
      ${criticalInsights.length > 0 ? `
        <h3 class="section-subtitle">Key Findings This Period</h3>
        ${criticalInsights.map(insight => `
          <div class="insight-card ${insight.insight_type === 'warning' ? 'warning' : insight.insight_type === 'opportunity' ? 'opportunity' : ''}">
            <div class="insight-headline">${insight.headline}</div>
            <div class="insight-description">${insight.description.substring(0, 200)}${insight.description.length > 200 ? '...' : ''}</div>
          </div>
        `).join('')}
      ` : ''}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 2</span>
      </div>
    </div>
  `;
}

function buildTrueCashPage(financialData: any): string {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val || 0);
  
  const bankBalance = financialData.cash_at_bank || 0;
  const vatLiability = financialData.vat_liability || 0;
  const payeLiability = financialData.paye_liability || 0;
  const corpTax = financialData.corporation_tax_liability || 0;
  const trueCash = financialData.true_cash || 0;
  
  return `
    <div class="page">
      <h2 class="section-title">True Cash Position</h2>
      
      <p style="margin-bottom: 24px; color: #475569;">
        Your True Cash represents the money that's actually yours after accounting for 
        upcoming tax obligations. It's a more accurate picture of your financial position.
      </p>
      
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cash at Bank</td>
            <td class="text-right font-bold">${formatCurrency(bankBalance)}</td>
          </tr>
          <tr>
            <td style="padding-left: 30px;">Less: VAT Liability</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(vatLiability)})</td>
          </tr>
          <tr>
            <td style="padding-left: 30px;">Less: PAYE/NI Liability</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(payeLiability)})</td>
          </tr>
          <tr>
            <td style="padding-left: 30px;">Less: Corporation Tax</td>
            <td class="text-right" style="color: #dc2626;">(${formatCurrency(corpTax)})</td>
          </tr>
          <tr style="background: #f0f9ff; border-top: 2px solid #3b82f6;">
            <td class="font-bold">True Cash Position</td>
            <td class="text-right font-bold" style="color: ${trueCash >= 0 ? '#059669' : '#dc2626'}; font-size: 14pt;">
              ${formatCurrency(trueCash)}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="metric-grid" style="margin-top: 30px;">
        <div class="metric-card">
          <div class="metric-label">Monthly Burn Rate</div>
          <div class="metric-value">${formatCurrency(financialData.monthly_operating_costs || 0)}</div>
        </div>
        <div class="metric-card highlight">
          <div class="metric-label">Cash Runway</div>
          <div class="metric-value ${(financialData.true_cash_runway_months || 0) < 3 ? 'warning' : ''}">${(financialData.true_cash_runway_months || 0).toFixed(1)} months</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Trade Debtors</div>
          <div class="metric-value">${formatCurrency(financialData.trade_debtors || 0)}</div>
        </div>
      </div>
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 3</span>
      </div>
    </div>
  `;
}

function buildPLAnalysisPage(financialData: any, comparisons: any): string {
  const formatCurrency = (val: number | null) => 
    val != null ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val) : '-';
  
  const formatVariance = (variance: any) => {
    if (!variance) return '-';
    const { amount, pct } = variance;
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${formatCurrency(amount)} (${sign}${pct}%)`;
  };
  
  const variances = comparisons?.variances || {};
  
  return `
    <div class="page">
      <h2 class="section-title">Profit & Loss Analysis</h2>
      
      <table>
        <thead>
          <tr>
            <th>Line Item</th>
            <th class="text-right">Actual</th>
            <th class="text-right">Budget</th>
            <th class="text-right">Variance</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #f8fafc;">
            <td class="font-bold">Revenue</td>
            <td class="text-right font-bold">${formatCurrency(financialData?.revenue)}</td>
            <td class="text-right">${formatCurrency(comparisons?.budget_month?.revenue)}</td>
            <td class="text-right" style="color: ${variances.vs_budget?.revenue?.amount >= 0 ? '#059669' : '#dc2626'}">
              ${formatVariance(variances.vs_budget?.revenue)}
            </td>
          </tr>
          <tr>
            <td style="padding-left: 20px;">Cost of Sales</td>
            <td class="text-right">${formatCurrency(financialData?.cost_of_sales)}</td>
            <td class="text-right">${formatCurrency(comparisons?.budget_month?.cost_of_sales)}</td>
            <td class="text-right">${formatVariance(variances.vs_budget?.cost_of_sales)}</td>
          </tr>
          <tr style="background: #f8fafc; border-top: 1px solid #cbd5e1;">
            <td class="font-bold">Gross Profit</td>
            <td class="text-right font-bold">${formatCurrency(financialData?.gross_profit)}</td>
            <td class="text-right">${formatCurrency(comparisons?.budget_month?.gross_profit)}</td>
            <td class="text-right" style="color: ${variances.vs_budget?.gross_profit?.amount >= 0 ? '#059669' : '#dc2626'}">
              ${formatVariance(variances.vs_budget?.gross_profit)}
            </td>
          </tr>
          <tr>
            <td style="padding-left: 20px;">Overheads</td>
            <td class="text-right">${formatCurrency(financialData?.overheads)}</td>
            <td class="text-right">${formatCurrency(comparisons?.budget_month?.overheads)}</td>
            <td class="text-right">${formatVariance(variances.vs_budget?.overheads)}</td>
          </tr>
          <tr style="background: #eff6ff; border-top: 2px solid #3b82f6;">
            <td class="font-bold">Net Profit</td>
            <td class="text-right font-bold" style="font-size: 12pt;">${formatCurrency(financialData?.net_profit)}</td>
            <td class="text-right">${formatCurrency(comparisons?.budget_month?.net_profit)}</td>
            <td class="text-right font-bold" style="color: ${variances.vs_budget?.net_profit?.amount >= 0 ? '#059669' : '#dc2626'}">
              ${formatVariance(variances.vs_budget?.net_profit)}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 4</span>
      </div>
    </div>
  `;
}

function buildKPIPage(kpis: any[]): string {
  const formatValue = (kpi: any) => {
    const value = kpi.value;
    if (kpi.definition?.display_format === 'percentage') return `${value.toFixed(1)}%`;
    if (kpi.definition?.display_format === 'currency') {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);
    }
    if (kpi.definition?.display_format === 'days') return `${Math.round(value)} days`;
    return value.toFixed(1);
  };
  
  const ragClass = (status: string) => {
    if (status === 'green') return 'rag-green';
    if (status === 'amber') return 'rag-amber';
    return 'rag-red';
  };
  
  return `
    <div class="page">
      <h2 class="section-title">Key Performance Indicators</h2>
      
      <table>
        <thead>
          <tr>
            <th>KPI</th>
            <th class="text-right">Value</th>
            <th class="text-right">Target</th>
            <th class="text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          ${kpis.map(kpi => `
            <tr>
              <td>
                <strong>${kpi.definition?.name || kpi.kpi_code}</strong>
                ${kpi.definition?.description ? `<br><small style="color: #64748b;">${kpi.definition.description}</small>` : ''}
              </td>
              <td class="text-right font-bold">${formatValue(kpi)}</td>
              <td class="text-right">${kpi.target_value ? formatValue({ ...kpi, value: kpi.target_value }) : '-'}</td>
              <td class="text-right">
                <span class="rag-indicator ${ragClass(kpi.rag_status || 'grey')}">
                  ${(kpi.rag_status || 'N/A').toUpperCase()}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 5</span>
      </div>
    </div>
  `;
}

function buildInsightsPage(insights: any[]): string {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedInsights = [...insights].sort((a, b) => 
    (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
  );
  
  return `
    <div class="page">
      <h2 class="section-title">Insights & Recommendations</h2>
      
      ${sortedInsights.map(insight => `
        <div class="insight-card ${insight.insight_type === 'warning' ? 'warning' : insight.insight_type === 'opportunity' ? 'opportunity' : insight.insight_type === 'action_required' ? 'action' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div class="insight-headline">${insight.headline}</div>
            <span class="rag-indicator ${insight.priority === 'critical' || insight.priority === 'high' ? 'rag-red' : insight.priority === 'medium' ? 'rag-amber' : 'rag-green'}" style="flex-shrink: 0;">
              ${(insight.priority || 'medium').toUpperCase()}
            </span>
          </div>
          <div class="insight-description">${insight.description}</div>
          ${insight.recommended_action ? `
            <div class="insight-action">
              <strong>Recommended Action:</strong> ${insight.recommended_action}
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 6</span>
      </div>
    </div>
  `;
}

function buildForecastPage(forecast: any): string {
  if (!forecast) return '';
  
  return `
    <div class="page">
      <h2 class="section-title">Cash Flow Forecast</h2>
      
      <p style="color: #475569; margin-bottom: 20px;">
        Based on current trends and known commitments, here's your projected cash position for the next 12 months.
      </p>
      
      <!-- Forecast chart would go here - in HTML we show a table -->
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th class="text-right">Projected Balance</th>
            <th class="text-right">Net Change</th>
          </tr>
        </thead>
        <tbody>
          ${(forecast.periods || []).slice(0, 6).map((period: any) => `
            <tr>
              <td>${period.month}</td>
              <td class="text-right font-bold" style="color: ${period.ending_balance >= 0 ? '#059669' : '#dc2626'}">
                ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(period.ending_balance || 0)}
              </td>
              <td class="text-right">
                ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0, signDisplay: 'always' }).format(period.net_change || 0)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 7</span>
      </div>
    </div>
  `;
}

function buildScenariosPage(scenarios: any[]): string {
  if (!scenarios || scenarios.length === 0) return '';
  
  return `
    <div class="page">
      <h2 class="section-title">Scenario Analysis</h2>
      
      <p style="color: #475569; margin-bottom: 20px;">
        We've modelled the following scenarios to help you understand potential impacts on your business.
      </p>
      
      ${scenarios.map(scenario => `
        <div class="insight-card">
          <div class="insight-headline">${scenario.name}</div>
          <div class="insight-description">${scenario.description || ''}</div>
          <div class="metric-grid" style="margin-top: 16px;">
            <div class="metric-card">
              <div class="metric-label">Cash Impact</div>
              <div class="metric-value ${(scenario.projected_cash_impact || 0) >= 0 ? 'positive' : 'negative'}">
                ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0, signDisplay: 'always' }).format(scenario.projected_cash_impact || 0)}
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Runway Impact</div>
              <div class="metric-value">
                ${scenario.projected_runway_impact >= 0 ? '+' : ''}${(scenario.projected_runway_impact || 0).toFixed(1)} months
              </div>
            </div>
          </div>
        </div>
      `).join('')}
      
      <div class="page-footer">
        <span>Business Intelligence Report</span>
        <span>Page 8</span>
      </div>
    </div>
  `;
}

function buildBackCover(engagement: any): string {
  const tierLabels: Record<string, string> = {
    clarity: 'Clarity',
    foresight: 'Foresight',
    strategic: 'Strategic'
  };
  
  return `
    <div class="page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #f8fafc;">
      <div style="margin-bottom: 40px;">
        <div style="font-size: 24pt; font-weight: 700; color: #1e3a8a; margin-bottom: 12px;">
          Your ${tierLabels[engagement?.tier] || 'Clarity'} Package
        </div>
        <p style="color: #64748b; max-width: 400px;">
          This report is part of your Business Intelligence service, designed to give you 
          financial clarity and confidence in your business decisions.
        </p>
      </div>
      
      <div style="background: white; padding: 30px 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="font-size: 12pt; font-weight: 600; color: #1e293b; margin-bottom: 20px;">
          Questions about this report?
        </div>
        <p style="color: #475569; margin-bottom: 16px;">
          Contact your Torsor Business Services advisor<br>
          to discuss any of the findings or recommendations.
        </p>
        <div style="color: #3b82f6; font-weight: 500;">
          torsor.co.uk
        </div>
      </div>
      
      <div style="position: absolute; bottom: 40px; color: #94a3b8; font-size: 9pt;">
        © ${new Date().getFullYear()} Torsor Business Services. All rights reserved.
      </div>
    </div>
  `;
}

