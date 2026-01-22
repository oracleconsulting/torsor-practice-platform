/**
 * Discovery Assessment PDF Report Generator
 * 
 * Generates professional PDF reports for Discovery Analysis results.
 * Matches the visual quality of the Business Intelligence reports.
 * 
 * Features:
 * - Professional cover page with gradient
 * - Executive summary with metric cards
 * - Transformation journey visualization
 * - ROI and investment breakdown
 * - Print-optimized styling
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

interface GeneratePDFRequest {
  clientId: string;
  reportId?: string;
}

interface ReportData {
  client: any;
  report: any;
  analysis: any;
  practice: any;
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
    const { clientId, reportId } = request;

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'clientId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-discovery-pdf] Generating PDF for client: ${clientId}`);

    // Fetch report data
    const reportData = await fetchReportData(supabase, clientId, reportId);
    
    if (!reportData.report) {
      return new Response(
        JSON.stringify({ error: 'No discovery report found for this client' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build HTML report
    const html = buildReportHTML(reportData);

    // Generate filename
    const clientName = reportData.client?.name || 'Client';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Discovery_Analysis_${clientName.replace(/\s+/g, '_')}_${date}`;

    console.log(`[generate-discovery-pdf] Report generated: ${filename}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        html,
        filename: `${filename}.pdf`,
        message: 'Report generated - open in browser and print to PDF'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-discovery-pdf] Error:', error);
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
  clientId: string,
  reportId?: string
): Promise<ReportData> {
  // Fetch client
  const { data: client } = await supabase
    .from('clients')
    .select('*, practice:practices(*)')
    .eq('id', clientId)
    .single();

  // Fetch discovery report
  let reportQuery = supabase
    .from('client_reports')
    .select('*')
    .eq('client_id', clientId)
    .eq('report_type', 'discovery_analysis')
    .order('created_at', { ascending: false });

  if (reportId) {
    reportQuery = reportQuery.eq('id', reportId);
  }

  const { data: report } = await reportQuery.limit(1).single();

  return {
    client,
    report,
    analysis: report?.report_data?.analysis || {},
    practice: client?.practice || {}
  };
}

// ============================================================================
// HTML BUILDING
// ============================================================================

function buildReportHTML(data: ReportData): string {
  const { client, analysis, practice } = data;
  const clientName = client?.name || 'Client';
  const companyName = client?.client_company || clientName;
  const practiceName = practice?.name || 'Your Accounting Practice';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Discovery Analysis - ${companyName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        ${getReportStyles()}
      </style>
    </head>
    <body>
      ${buildCoverPage(clientName, companyName, practiceName)}
      ${buildExecutiveSummary(analysis)}
      ${buildTransformationJourney(analysis)}
      ${buildInvestmentBreakdown(analysis)}
      ${buildGapAnalysis(analysis)}
      ${buildClosingPage(analysis, practiceName)}
    </body>
    </html>
  `;
}

// ============================================================================
// STYLES
// ============================================================================

function getReportStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 0;
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
      padding: 50px;
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
      background: linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%);
      color: white;
      padding: 60px;
    }
    
    .cover-logo {
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.2);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 50px;
      backdrop-filter: blur(10px);
    }
    
    .cover-title {
      font-size: 42pt;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: -1px;
    }
    
    .cover-subtitle {
      font-size: 18pt;
      opacity: 0.9;
      margin-bottom: 60px;
      font-weight: 400;
    }
    
    .cover-client {
      font-size: 28pt;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .cover-company {
      font-size: 16pt;
      opacity: 0.85;
      margin-bottom: 40px;
    }
    
    .cover-badge {
      display: inline-block;
      padding: 12px 28px;
      background: rgba(255,255,255,0.2);
      border-radius: 40px;
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }
    
    .cover-footer {
      position: absolute;
      bottom: 50px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10pt;
      opacity: 0.7;
    }
    
    /* Section Styles */
    .section-header {
      margin-bottom: 30px;
    }
    
    .section-label {
      font-size: 10pt;
      font-weight: 600;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
    }
    
    .section-title {
      font-size: 24pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .section-subtitle {
      font-size: 12pt;
      color: #64748b;
      max-width: 600px;
    }
    
    .subsection-title {
      font-size: 14pt;
      font-weight: 600;
      color: #1e293b;
      margin: 30px 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    /* Metric Cards */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    
    .metric-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
    }
    
    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #059669, #10b981);
    }
    
    .metric-card.highlight {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-color: #6ee7b7;
    }
    
    .metric-card.warning::before {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }
    
    .metric-card.danger::before {
      background: linear-gradient(90deg, #dc2626, #ef4444);
    }
    
    .metric-label {
      font-size: 9pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .metric-value {
      font-size: 28pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
    }
    
    .metric-value.positive { color: #059669; }
    .metric-value.negative { color: #dc2626; }
    .metric-value.warning { color: #d97706; }
    
    .metric-context {
      font-size: 10pt;
      color: #64748b;
      margin-top: 8px;
    }
    
    /* Destination Hero */
    .destination-hero {
      background: linear-gradient(135deg, #047857 0%, #059669 100%);
      border-radius: 20px;
      padding: 40px;
      color: white;
      margin: 30px 0;
      position: relative;
      overflow: hidden;
    }
    
    .destination-hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }
    
    .destination-label {
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.8;
      margin-bottom: 16px;
      font-weight: 600;
    }
    
    .destination-quote {
      font-size: 20pt;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 20px;
      font-style: italic;
      position: relative;
      z-index: 1;
    }
    
    .destination-context {
      font-size: 12pt;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    
    /* Journey Timeline */
    .journey-timeline {
      margin: 30px 0;
    }
    
    .journey-phase {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 24px;
      background: #f8fafc;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      position: relative;
    }
    
    .journey-phase::before {
      content: '';
      position: absolute;
      left: 30px;
      top: 70px;
      bottom: -24px;
      width: 2px;
      background: linear-gradient(180deg, #059669, #10b981);
    }
    
    .journey-phase:last-child::before {
      display: none;
    }
    
    .phase-number {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #059669, #10b981);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 16pt;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    
    .phase-content {
      flex: 1;
    }
    
    .phase-timeframe {
      font-size: 9pt;
      color: #059669;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    
    .phase-title {
      font-size: 14pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }
    
    .phase-description {
      font-size: 11pt;
      color: #475569;
      margin-bottom: 12px;
    }
    
    .phase-outcome {
      background: white;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 10pt;
      color: #059669;
      font-weight: 500;
    }
    
    .phase-investment {
      display: inline-block;
      background: #ecfdf5;
      color: #047857;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 600;
      margin-top: 12px;
    }
    
    /* Investment Table */
    .investment-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .investment-table th,
    .investment-table td {
      padding: 16px 20px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .investment-table th {
      background: #f8fafc;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
    }
    
    .investment-table tr:last-child td {
      border-bottom: none;
    }
    
    .investment-table .total-row {
      background: #ecfdf5;
      font-weight: 700;
    }
    
    .investment-table .total-row td {
      color: #047857;
      font-size: 12pt;
    }
    
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    
    /* Gap Cards */
    .gap-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
      border-left: 4px solid #f59e0b;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .gap-card.critical {
      border-left-color: #dc2626;
      background: #fef2f2;
    }
    
    .gap-card.opportunity {
      border-left-color: #059669;
      background: #ecfdf5;
    }
    
    .gap-title {
      font-weight: 600;
      font-size: 12pt;
      color: #1e293b;
      margin-bottom: 8px;
    }
    
    .gap-description {
      font-size: 11pt;
      color: #475569;
      line-height: 1.6;
    }
    
    .gap-cost {
      margin-top: 12px;
      padding: 12px;
      background: rgba(0,0,0,0.05);
      border-radius: 8px;
      font-size: 10pt;
    }
    
    .gap-cost strong {
      color: #dc2626;
    }
    
    /* Closing Page */
    .closing-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100vh;
    }
    
    .closing-message {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 40px;
      border: 1px solid #e2e8f0;
    }
    
    .closing-quote {
      font-size: 14pt;
      font-style: italic;
      color: #475569;
      line-height: 1.7;
      margin-bottom: 24px;
    }
    
    .cta-box {
      background: linear-gradient(135deg, #047857 0%, #059669 100%);
      border-radius: 16px;
      padding: 32px;
      color: white;
      text-align: center;
    }
    
    .cta-title {
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 12px;
    }
    
    .cta-text {
      font-size: 12pt;
      opacity: 0.9;
      margin-bottom: 20px;
    }
    
    .cta-button {
      display: inline-block;
      background: white;
      color: #047857;
      padding: 14px 32px;
      border-radius: 30px;
      font-weight: 600;
      font-size: 12pt;
      text-decoration: none;
    }
    
    /* Page Footer */
    .page-footer {
      position: absolute;
      bottom: 30px;
      left: 50px;
      right: 50px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
    }
    
    /* Print Styles */
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

// ============================================================================
// PAGE BUILDERS
// ============================================================================

function buildCoverPage(clientName: string, companyName: string, practiceName: string): string {
  const date = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  return `
    <div class="page cover-page">
      <div class="cover-logo">
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h1 class="cover-title">Discovery Analysis</h1>
      <p class="cover-subtitle">Your Transformation Roadmap</p>
      <div class="cover-client">${clientName}</div>
      <div class="cover-company">${companyName}</div>
      <div class="cover-badge">Personalised Report</div>
      <div class="cover-footer">
        Prepared by ${practiceName}<br>
        ${date}
      </div>
    </div>
  `;
}

function buildExecutiveSummary(analysis: any): string {
  const summary = analysis.executiveSummary || {};
  const investment = analysis.investmentSummary || {};
  const journey = analysis.transformationJourney || {};
  
  const totalInvestment = investment.totalFirstYearInvestment || journey.totalInvestment || '—';
  const projectedReturn = investment.projectedFirstYearReturn || '—';
  const paybackPeriod = investment.paybackPeriod || '—';
  const roiMultiple = investment.roiMultiple || '—';
  
  return `
    <div class="page">
      <div class="section-header">
        <div class="section-label">Executive Summary</div>
        <h2 class="section-title">${summary.headline || 'Your Path Forward'}</h2>
        <p class="section-subtitle">
          ${summary.criticalInsight || 'A personalised analysis based on your discovery assessment responses.'}
        </p>
      </div>
      
      <div class="metric-grid">
        <div class="metric-card highlight">
          <div class="metric-label">Total Investment</div>
          <div class="metric-value">${totalInvestment}</div>
          <div class="metric-context">First year commitment</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Projected Return</div>
          <div class="metric-value positive">${projectedReturn}</div>
          <div class="metric-context">First year benefit</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Payback Period</div>
          <div class="metric-value">${paybackPeriod}</div>
          <div class="metric-context">Time to break even</div>
        </div>
      </div>
      
      ${summary.currentReality ? `
        <div class="subsection-title">Where You Are Today</div>
        <p style="color: #475569; line-height: 1.8; margin-bottom: 20px;">
          ${summary.currentReality}
        </p>
      ` : ''}
      
      ${summary.destinationVision ? `
        <div class="subsection-title">Where You're Headed</div>
        <p style="color: #475569; line-height: 1.8;">
          ${summary.destinationVision}
        </p>
      ` : ''}
      
      <div class="page-footer">
        <span>Discovery Analysis</span>
        <span>Page 2</span>
      </div>
    </div>
  `;
}

function buildTransformationJourney(analysis: any): string {
  const journey = analysis.transformationJourney || {};
  const phases = journey.phases || [];
  
  if (phases.length === 0) {
    return '';
  }
  
  return `
    <div class="page">
      <div class="section-header">
        <div class="section-label">Your Transformation</div>
        <h2 class="section-title">${journey.journeyLabel || 'The Journey Ahead'}</h2>
        <p class="section-subtitle">
          ${journey.totalTimeframe || 'A structured path from where you are to where you want to be.'}
        </p>
      </div>
      
      ${journey.destination ? `
        <div class="destination-hero">
          <div class="destination-label">${journey.destinationLabel || 'Your Destination'}</div>
          <div class="destination-quote">"${journey.destination}"</div>
          ${journey.destinationContext ? `
            <div class="destination-context">${journey.destinationContext}</div>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="journey-timeline">
        ${phases.map((phase: any, idx: number) => `
          <div class="journey-phase">
            <div class="phase-number">${idx + 1}</div>
            <div class="phase-content">
              <div class="phase-timeframe">${phase.timeframe || `Phase ${idx + 1}`}</div>
              <div class="phase-title">${phase.title || 'Building Foundations'}</div>
              <div class="phase-description">${phase.youWillHave || phase.whatChanges || ''}</div>
              ${phase.whatChanges && phase.youWillHave ? `
                <div class="phase-outcome">✓ ${phase.whatChanges}</div>
              ` : ''}
              ${phase.investment ? `
                <div class="phase-investment">${phase.investment}</div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="page-footer">
        <span>Discovery Analysis</span>
        <span>Page 3</span>
      </div>
    </div>
  `;
}

function buildInvestmentBreakdown(analysis: any): string {
  const investments = analysis.recommendedInvestments || [];
  const summary = analysis.investmentSummary || {};
  
  if (investments.length === 0) {
    return '';
  }
  
  // Calculate total
  const parseAmount = (str: string) => {
    if (!str) return 0;
    const match = str.replace(/[^0-9.]/g, '');
    return parseFloat(match) || 0;
  };
  
  return `
    <div class="page">
      <div class="section-header">
        <div class="section-label">Investment Breakdown</div>
        <h2 class="section-title">Your Recommended Services</h2>
        <p class="section-subtitle">
          Each service is selected based on your specific situation and goals.
        </p>
      </div>
      
      <table class="investment-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Tier</th>
            <th class="text-right">Investment</th>
          </tr>
        </thead>
        <tbody>
          ${investments.map((inv: any) => `
            <tr>
              <td>
                <strong>${inv.service || inv.serviceName || inv.name || 'Service'}</strong>
                ${inv.rationale ? `<br><small style="color: #64748b;">${inv.rationale.substring(0, 80)}${inv.rationale.length > 80 ? '...' : ''}</small>` : ''}
              </td>
              <td>${inv.recommendedTier || inv.tier || '—'}</td>
              <td class="text-right font-bold">${inv.investment || inv.price || '—'}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2"><strong>Total First Year Investment</strong></td>
            <td class="text-right">${summary.totalFirstYearInvestment || '—'}</td>
          </tr>
        </tbody>
      </table>
      
      ${summary.investmentBreakdown ? `
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 20px;">
          <div style="font-size: 10pt; color: #64748b; margin-bottom: 8px; font-weight: 600;">BREAKDOWN</div>
          <div style="font-size: 11pt; color: #475569;">${summary.investmentBreakdown}</div>
        </div>
      ` : ''}
      
      ${summary.roiCalculation ? `
        <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; margin-top: 16px; border: 1px solid #6ee7b7;">
          <div style="font-size: 10pt; color: #059669; margin-bottom: 8px; font-weight: 600;">ROI CALCULATION</div>
          <div style="font-size: 11pt; color: #047857;">${summary.roiCalculation}</div>
        </div>
      ` : ''}
      
      <div class="page-footer">
        <span>Discovery Analysis</span>
        <span>Page 4</span>
      </div>
    </div>
  `;
}

function buildGapAnalysis(analysis: any): string {
  const gapAnalysis = analysis.gapAnalysis || {};
  const gaps = gapAnalysis.primaryGaps || [];
  const costOfInaction = gapAnalysis.costOfInaction || {};
  
  if (gaps.length === 0 && !costOfInaction.annualFinancialCost) {
    return '';
  }
  
  return `
    <div class="page">
      <div class="section-header">
        <div class="section-label">Gap Analysis</div>
        <h2 class="section-title">What's Holding You Back</h2>
        <p class="section-subtitle">
          Understanding the gaps between where you are and where you want to be.
        </p>
      </div>
      
      ${gaps.length > 0 ? `
        <div style="margin: 30px 0;">
          ${gaps.map((gap: any, idx: number) => `
            <div class="gap-card ${gap.severity === 'critical' ? 'critical' : ''}">
              <div class="gap-title">${gap.title || gap.gap || `Gap ${idx + 1}`}</div>
              <div class="gap-description">${gap.description || gap.impact || ''}</div>
              ${gap.cost ? `
                <div class="gap-cost">
                  <strong>Cost:</strong> ${gap.cost}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${costOfInaction.annualFinancialCost || costOfInaction.annual ? `
        <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); padding: 30px; border-radius: 16px; border: 1px solid #fca5a5; margin-top: 30px;">
          <div style="font-size: 10pt; color: #dc2626; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
            Cost of Inaction
          </div>
          <div style="font-size: 24pt; font-weight: 700; color: #dc2626; margin-bottom: 12px;">
            ${costOfInaction.annualFinancialCost || costOfInaction.annual || '—'}
          </div>
          ${costOfInaction.description ? `
            <div style="font-size: 11pt; color: #7f1d1d;">
              ${costOfInaction.description}
            </div>
          ` : ''}
          ${costOfInaction.personalCost ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #fca5a5; font-size: 11pt; color: #991b1b; font-style: italic;">
              ${costOfInaction.personalCost}
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="page-footer">
        <span>Discovery Analysis</span>
        <span>Page 5</span>
      </div>
    </div>
  `;
}

function buildClosingPage(analysis: any, practiceName: string): string {
  const closing = analysis.closingMessage || {};
  const personalNote = typeof closing === 'string' ? closing : closing.personalNote;
  const callToAction = typeof closing === 'object' ? closing.callToAction : null;
  
  return `
    <div class="page closing-page">
      <div class="section-header">
        <div class="section-label">Next Steps</div>
        <h2 class="section-title">Ready to Begin?</h2>
      </div>
      
      ${personalNote ? `
        <div class="closing-message">
          <div class="closing-quote">${personalNote}</div>
        </div>
      ` : ''}
      
      <div class="cta-box">
        <div class="cta-title">Book Your Strategy Call</div>
        <div class="cta-text">
          ${callToAction || `Let's discuss how we can help you achieve your goals. Schedule a 30-minute call with ${practiceName} to review this analysis and plan your next steps.`}
        </div>
        <span class="cta-button">Schedule a Call →</span>
      </div>
      
      <div style="text-align: center; margin-top: 60px; color: #64748b; font-size: 10pt;">
        <p>This analysis was generated based on your discovery assessment responses.</p>
        <p style="margin-top: 8px;">All projections are estimates and actual results may vary.</p>
      </div>
      
      <div class="page-footer">
        <span>Discovery Analysis</span>
        <span>Page 6</span>
      </div>
    </div>
  `;
}

