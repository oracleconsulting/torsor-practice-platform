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
// TEXT CLEANUP UTILITIES
// ============================================================================

/**
 * Fix common text issues in PDF output:
 * - "kk" typo (e.g., "£414kk" → "£414k")
 * - Double currency symbols
 * - Malformed percentages
 */
function cleanupPDFText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Fix "kk" typo - £414kk → £414k
    .replace(/£(\d+(?:,\d{3})*)kk/g, '£$1k')
    .replace(/(\d+(?:,\d{3})*)kk/g, '$1k')
    // Fix double currency symbols - ££ → £
    .replace(/££/g, '£')
    // Fix spaces in currency - £ 414 → £414
    .replace(/£\s+(\d)/g, '£$1')
    // Fix malformed percentages - 43.2%% → 43.2%
    .replace(/(\d+\.?\d*)%%/g, '$1%');
}

/**
 * Recursively clean all string values in an object
 */
function cleanupObjectText(obj: any): any {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return cleanupPDFText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanupObjectText(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanupObjectText(obj[key]);
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Apply all text cleanups to final HTML output
 */
function cleanupFinalHTML(html: string): string {
  let cleaned = html;
  
  // Fix "kk" typos throughout
  cleaned = cleaned.replace(/£(\d+(?:,\d{3})*)kk/g, '£$1k');
  cleaned = cleaned.replace(/(\d+(?:,\d{3})*)kk/g, '$1k');
  
  // Fix double currency
  cleaned = cleaned.replace(/££/g, '£');
  
  // Log any remaining issues for debugging
  const remainingKK = cleaned.match(/\d+kk/g);
  if (remainingKK) {
    console.warn('[PDF Cleanup] Still found "kk" patterns:', remainingKK);
  }
  
  return cleaned;
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
  // Fetch client - try practice_members first, then clients for backwards compatibility
  let client;
  const { data: memberData } = await supabase
    .from('practice_members')
    .select('*, practice:practices(*)')
    .eq('id', clientId)
    .single();
  
  if (memberData) {
    client = memberData;
  } else {
    const { data: clientData } = await supabase
      .from('clients')
      .select('*, practice:practices(*)')
      .eq('id', clientId)
      .single();
    client = clientData;
  }

  // ========================================================================
  // PRIMARY SOURCE: discovery_reports table (new destination-focused format)
  // This is the same source the portal uses
  // ========================================================================
  
  let report = null;
  let analysis: any = {};
  let dataSource = 'none';
  
  // First, try to get from discovery_reports via discovery_engagements
  const { data: engagement } = await supabase
    .from('discovery_engagements')
    .select('id')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (engagement?.id) {
    const { data: discoveryReport } = await supabase
      .from('discovery_reports')
      .select('*')
      .eq('engagement_id', engagement.id)
      .maybeSingle();
    
    if (discoveryReport?.destination_report) {
      console.log('[PDF] Using discovery_reports (new format) as data source');
      console.log('[PDF] Report ID:', discoveryReport.id);
      dataSource = 'discovery_reports';
      report = discoveryReport;
      
      // ========================================================================
      // CRITICAL: Use EXACT SAME data structure as Portal
      // Portal uses: destinationReport.destination_report.pageX
      // We must use the SAME fields to ensure PDF matches Portal
      // ========================================================================
      const destReport = discoveryReport.destination_report || {};
      const page1 = discoveryReport.page1_destination || destReport.page1_destination || {};
      const page2 = discoveryReport.page2_gaps || destReport.page2_gaps || {};
      const page3 = discoveryReport.page3_journey || destReport.page3_journey || {};
      const page4 = discoveryReport.page4_numbers || destReport.page4_numbers || {};
      const page5 = discoveryReport.page5_next_steps || destReport.page5_next_steps || destReport.page5_nextSteps || {};
      
      // ========================================================================
      // USE PAGE4.TOTALYEAR1 - the EXACT same field Portal displays
      // This is the source of truth for investment total
      // ========================================================================
      const totalInvestmentDisplay = page4.totalYear1 || 
                                     page4.investmentSummary?.totalFirstYear || 
                                     destReport.investmentSummary?.totalFirstYear || 
                                     '';
      
      // ========================================================================
      // USE PAGE3.PHASES for service prices (PRIMARY SOURCE)
      // Portal displays phase.enabledBy and phase.price in the Journey section
      // ========================================================================
      const page3Phases = page3.phases || [];
      
      // Build services from page3.phases (the source of truth for Portal)
      const servicesFromPage3 = page3Phases
        .filter((p: any) => p.enabledBy && p.price)
        .map((p: any) => ({
          service: p.enabledBy || '',
          tier: '',
          investment: p.price || '',
          whatYouGet: p.outcome || p.headline || '',
          rationale: p.feelsLike || '',
        }));
      
      // Also check page4.investment for comparison
      const page4Investments = page4.investment || [];
      const servicesFromPage4 = page4Investments.map((inv: any) => ({
        service: inv.phase || inv.service || '',
        tier: inv.tier || '',
        investment: inv.amount || inv.price || '',
        whatYouGet: inv.whatYouGet || '',
        rationale: inv.whatYouGet || '',
      }));
      
      // Log comparison for debugging
      console.log('[PDF] 📊 Service sources comparison:');
      console.log('[PDF]   page3.phases:', page3Phases.map((p: any) => `${p.enabledBy}: ${p.price}`));
      console.log('[PDF]   page4.investment:', page4Investments.map((i: any) => `${i.phase}: ${i.amount}`));
      
      // Validate that page3 and page4 match (or warn if they don't)
      const page3Total = servicesFromPage3.reduce((sum: number, s: any) => {
        const match = (s.investment || '').match(/[\d,]+/);
        return sum + (match ? parseInt(match[0].replace(/,/g, ''), 10) : 0);
      }, 0);
      
      const page4Total = servicesFromPage4.reduce((sum: number, s: any) => {
        const match = (s.investment || '').match(/[\d,]+/);
        return sum + (match ? parseInt(match[0].replace(/,/g, ''), 10) : 0);
      }, 0);
      
      const storedTotal = (page4.totalYear1 || '').match(/[\d,]+/);
      const storedTotalNum = storedTotal ? parseInt(storedTotal[0].replace(/,/g, ''), 10) : 0;
      
      if (page3Total !== page4Total) {
        console.warn('[PDF] ⚠️ MISMATCH: page3 total (£' + page3Total + ') ≠ page4 total (£' + page4Total + ')');
        console.warn('[PDF] Using page3.phases as source of truth (this is what Portal Journey shows)');
      }
      
      if (storedTotalNum > 0 && page3Total !== storedTotalNum) {
        console.warn('[PDF] ⚠️ MISMATCH: page3 total (£' + page3Total + ') ≠ stored totalYear1 (£' + storedTotalNum + ')');
      }
      
      // Use page3 services (what Portal Journey displays) as the primary source
      // Fall back to page4 if page3 is empty
      const recommendedServices = servicesFromPage3.length > 0 ? servicesFromPage3 : servicesFromPage4;
      
      // Calculate correct total from page3 (source of truth)
      const calculatedTotal = page3Total > 0 ? `£${page3Total.toLocaleString()}` : (page4.totalYear1 || totalInvestmentDisplay);
      
      console.log('[PDF] ✅ Using services from:', servicesFromPage3.length > 0 ? 'page3.phases' : 'page4.investment');
      console.log('[PDF] ✅ Total investment:', calculatedTotal);
      
      // ========================================================================
      // USE PAGE3.PHASES with FULL narrative content
      // Portal shows: phase.headline, phase.whatChanges, phase.feelsLike, etc.
      // CRITICAL: Preserve ALL emotional/narrative content - do NOT truncate
      // ========================================================================
      const phases = (page3.phases || []).map((phase: any) => {
        // PRESERVE whatChanges as array for proper bullet rendering
        let whatChanges = phase.whatChanges || [];
        if (typeof whatChanges === 'string') {
          // Split back into array if it was joined
          whatChanges = whatChanges.split(/[.\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        }
        if (!Array.isArray(whatChanges)) {
          whatChanges = [whatChanges];
        }
        
        // Log to verify full content is preserved
        console.log(`[PDF] Phase "${phase.headline || phase.title}":`, {
          whatChangesCount: whatChanges.length,
          feelsLikeLength: (phase.feelsLike || '').length,
          outcomeLength: (phase.outcome || '').length
        });
        
        return {
          timeframe: phase.timeframe || '',
          title: phase.headline || phase.title || '',
          // PRESERVE FULL "whatChanges" as array for bullet rendering
          whatChanges: whatChanges,
          // PRESERVE FULL outcome text
          youWillHave: phase.outcome || phase.youWillHave || '',
          // PRESERVE FULL "feelsLike" narrative - this is key emotional content
          feelsLike: phase.feelsLike || phase.whatThisFeelsLike || '',
          enabledBy: phase.enabledBy || '',
          investment: phase.price || phase.investment || '',
        };
      });
      
      // ========================================================================
      // USE PAGE2.GAPS with FULL narrative content - MATCHING CLIENT PORTAL EXACTLY
      // Portal shows: gap.title, gap.pattern (quote), gap.timeImpact, gap.financialImpact, 
      //               gap.emotionalImpact, gap.shiftRequired
      // ========================================================================
      const gaps = (page2.gaps || page2.primaryGaps || []).map((gap: any) => ({
        severity: gap.severity || gap.priority || 'high',
        category: gap.category || '',
        title: gap.title || '',
        // PRESERVE FULL "pattern" (client's own words)
        pattern: gap.pattern || '',
        // PRESERVE FULL impact fields - EXACTLY as client portal displays
        timeImpact: gap.timeImpact || '',
        financialImpact: gap.financialImpact || '',
        emotionalImpact: gap.emotionalImpact || '',
        // PRESERVE FULL "shiftRequired" narrative
        shiftRequired: gap.shiftRequired || '',
        // Legacy fields for backward compatibility
        costs: gap.costs || [],
        description: gap.description || gap.pattern || '',
        cost: gap.cost || '',
      }));
      
      console.log('[PDF] 📊 Gaps extracted:', gaps.map((g: any) => ({
        title: g.title,
        hasFinancialImpact: !!g.financialImpact,
        hasTimeImpact: !!g.timeImpact,
        hasEmotionalImpact: !!g.emotionalImpact
      })));
      
      // ========================================================================
      // USE PAGE5 for FULL closing narrative
      // Portal shows: thisWeek, firstStep, closingQuote, closingNarrative
      // ========================================================================
      const closingMessage = {
        personalNote: page5.thisWeek || page5.personalMessage || '',
        callToAction: page5.firstStep || '',
        closingQuote: page5.closingQuote || '',
        // PRESERVE FULL "closingNarrative" - includes "This isn't a sales pitch..."
        closingNarrative: page5.closingNarrative || page5.personalMessage || '',
        investment: page5.investment || totalInvestmentDisplay,
        fullCTA: page5.fullCTA || page5.callToAction || '',
      };

      // Build analysis object using PORTAL-IDENTICAL data
      analysis = {
        executiveSummary: {
          headline: destReport.executiveSummary?.headline || page1.headerLine || '',
          criticalInsight: destReport.executiveSummary?.criticalInsight || page2.openingLine || page2.headline || '',
          currentReality: page2.introduction || page2.openingLine || '',
          destinationVision: page1.visionVerbatim || page1.tuesdayTest || '',
          // Use Pass 1 destination_clarity as primary source
          clarityScore: discoveryReport.destination_clarity?.score || page1.clarityScore || page1.destinationClarityScore || '',
          clarityExplanation: discoveryReport.destination_clarity?.reasoning || page1.clarityExplanation || page1.clarityNarrative || '',
        },
        investmentSummary: {
          // USE CALCULATED TOTAL from page3.phases (source of truth)
          totalFirstYearInvestment: calculatedTotal,
          projectedFirstYearReturn: page4.returns?.realistic?.total || 
                                    page4.returnProjection || 
                                    page4.investmentSummary?.projectedReturn || '',
          paybackPeriod: page4.paybackPeriod || 
                         page4.investmentSummary?.paybackPeriod || '',
          roiMultiple: page4.roiRatio || 
                       page4.investmentSummary?.roiRatio || '',
          investmentBreakdown: page4.investmentSummary?.breakdown || '',
          roiCalculation: page4.paybackCalculation || 
                          page4.investmentSummary?.roiCalculation || '',
          realReturn: page4.realReturn || '',
        },
        transformationJourney: {
          journeyLabel: page3.journeyLabel || page3.headerLine || 'Your Journey',
          destination: page1.visionVerbatim || page1.tuesdayTest || '',
          destinationLabel: page3.destinationLabel || 'Your Destination',
          // PRESERVE FULL destinationContext
          destinationContext: page3.destinationContext || '',
          totalTimeframe: page3.totalTimeframe || '',
          phases: phases,
          // USE CALCULATED TOTAL from page3.phases (source of truth)
          totalInvestment: calculatedTotal,
        },
        // USE PAGE4.INVESTMENT - same as Portal
        recommendedInvestments: recommendedServices,
        gapAnalysis: {
          headline: page2.headerLine || page2.headline || '',
          introduction: page2.openingLine || page2.introduction || '',
          // PRESERVE FULL gap data with ALL impact fields
          primaryGaps: gaps,
          // Cost of inaction - prioritize comprehensive_analysis (Pass 1 calculated)
          costOfInaction: discoveryReport.comprehensive_analysis?.costOfInaction || 
                          page4.costOfStaying || 
                          page2.costOfInaction || {},
          gapScore: page2.gapScore || discoveryReport.destination_clarity?.gapScore || '',
        },
        // PRESERVE FULL closing content
        closingMessage: closingMessage,
        // Store raw page data for full access
        _rawPages: { page1, page2, page3, page4, page5 },
        // Store Pass 1 comprehensive analysis for correct figures
        _comprehensiveAnalysis: discoveryReport.comprehensive_analysis || null,
        _destinationClarity: discoveryReport.destination_clarity || null,
        _dataSource: dataSource,
        _reportId: discoveryReport.id,
      };
      
      console.log('[PDF] ✅ Data mapping complete:', {
        totalInvestment: analysis.investmentSummary.totalFirstYearInvestment,
        projectedReturn: analysis.investmentSummary.projectedFirstYearReturn,
        phases: phases.length,
        gaps: gaps.length,
        services: recommendedServices.length,
        hasClosingNarrative: !!closingMessage.closingNarrative,
      });
    }
  }
  
  // ========================================================================
  // FALLBACK: client_reports table (legacy format)
  // Only used if discovery_reports not available
  // ========================================================================
  
  if (!report) {
    console.log('[PDF] discovery_reports not found, falling back to client_reports (legacy)');
    
    let reportQuery = supabase
      .from('client_reports')
      .select('*')
      .eq('client_id', clientId)
      .eq('report_type', 'discovery_analysis')
      .order('created_at', { ascending: false });

    if (reportId) {
      reportQuery = reportQuery.eq('id', reportId);
    }

    const { data: legacyReport } = await reportQuery.limit(1).single();
    
    if (legacyReport) {
      console.log('[PDF] Using client_reports (legacy format) as data source');
      dataSource = 'client_reports';
      report = legacyReport;
      analysis = legacyReport.report_data?.analysis || {};
      analysis._dataSource = dataSource;
      analysis._reportId = legacyReport.id;
    }
  }
  
  // Log final data source for debugging
  console.log('[PDF] Final data source:', dataSource, {
    reportId: report?.id,
    hasAnalysis: !!analysis.executiveSummary || !!analysis.transformationJourney,
    totalInvestment: analysis.investmentSummary?.totalFirstYearInvestment || 'N/A',
  });

  return {
    client,
    report,
    analysis,
    practice: client?.practice || {}
  };
}

// ============================================================================
// HTML BUILDING
// ============================================================================

function buildReportHTML(data: ReportData): string {
  const { client, practice } = data;
  
  // ========================================================================
  // CLEAN ALL TEXT DATA BEFORE BUILDING HTML
  // This fixes "kk" typos and other formatting issues from LLM output
  // ========================================================================
  const analysis = cleanupObjectText(data.analysis);
  
  const clientName = client?.name || 'Client';
  const companyName = client?.client_company || clientName;
  const practiceName = practice?.name || 'Your Accounting Practice';
  
  // Log what data we're using to build the PDF
  console.log('[PDF BUILD] Building HTML with data:', {
    dataSource: analysis._dataSource || 'unknown',
    reportId: analysis._reportId || 'N/A',
    totalInvestment: analysis.investmentSummary?.totalFirstYearInvestment || 
                     analysis.transformationJourney?.totalInvestment || 'N/A',
    projectedReturn: analysis.investmentSummary?.projectedFirstYearReturn || 'N/A',
    paybackPeriod: analysis.investmentSummary?.paybackPeriod || 'N/A',
    phasesCount: analysis.transformationJourney?.phases?.length || 0,
    servicesCount: analysis.recommendedInvestments?.length || 0,
  });

  // Build the HTML
  const rawHTML = `
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
      <!-- PDF Data Source: ${analysis._dataSource || 'unknown'} | Report ID: ${analysis._reportId || 'N/A'} | Generated: ${new Date().toISOString()} -->
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
  
  // ========================================================================
  // FINAL CLEANUP - catch any remaining formatting issues
  // ========================================================================
  const cleanedHTML = cleanupFinalHTML(rawHTML);
  
  // Validate no "kk" typos remain
  if (cleanedHTML.includes('kk')) {
    const matches = cleanedHTML.match(/\d+kk/g);
    if (matches) {
      console.error('[PDF] ⚠️ "kk" typos still present after cleanup:', matches);
    }
  }
  
  return cleanedHTML;
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
  const rawPages = analysis._rawPages || {};
  const page1 = rawPages.page1 || {};
  
  const totalInvestment = investment.totalFirstYearInvestment || journey.totalInvestment || '—';
  const projectedReturn = investment.projectedFirstYearReturn || '—';
  const paybackPeriod = investment.paybackPeriod || '—';
  const clarityScore = summary.clarityScore || page1.clarityScore || page1.destinationClarityScore || null;
  
  return `
    <div class="page">
      <div class="section-header">
        <div class="section-label">Page 1 — Your Vision</div>
        <h2 class="section-title">${summary.headline || page1.headerLine || 'Your Path Forward'}</h2>
        ${summary.criticalInsight ? `
          <p class="section-subtitle" style="color: #dc2626; font-style: italic;">
            ${summary.criticalInsight}
          </p>
        ` : ''}
      </div>
      
      ${summary.destinationVision || page1.visionVerbatim ? `
        <div style="background: #fef3c7; border-radius: 16px; padding: 28px; margin: 24px 0; border-left: 4px solid #f59e0b;">
          <div style="font-size: 24px; color: #f59e0b; margin-bottom: 12px;">"</div>
          <blockquote style="font-size: 14pt; color: #475569; line-height: 1.7; font-style: italic; margin: 0;">
            ${summary.destinationVision || page1.visionVerbatim}
          </blockquote>
        </div>
      ` : ''}
      
      ${clarityScore ? `
        <div style="margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="flex: 1; height: 12px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
              <div style="height: 100%; width: ${(clarityScore / 10) * 100}%; background: linear-gradient(90deg, #f59e0b, #10b981); border-radius: 999px;"></div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 18pt; font-weight: 700; color: #059669;">${clarityScore}/10</span>
              <span style="font-size: 11pt; color: #64748b; margin-left: 8px;">Destination Clarity</span>
            </div>
          </div>
          ${summary.clarityExplanation || page1.clarityExplanation ? `
            <p style="margin-top: 8px; font-size: 11pt; color: #64748b;">${summary.clarityExplanation || page1.clarityExplanation}</p>
          ` : ''}
        </div>
      ` : ''}
      
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
              
              ${phase.whatChanges && (Array.isArray(phase.whatChanges) ? phase.whatChanges.length > 0 : phase.whatChanges) ? `
                <div style="margin: 12px 0;">
                  <div style="font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">YOU WILL HAVE:</div>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    ${(Array.isArray(phase.whatChanges) ? phase.whatChanges : [phase.whatChanges])
                      .filter((c: string) => c && c.trim().length > 0)
                      .map((change: string) => `
                      <li style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                        <span style="color: #10b981; flex-shrink: 0;">✓</span>
                        <span style="color: #475569; line-height: 1.5;">${change}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${phase.feelsLike ? `
                <div style="background: #fffbeb; padding: 12px 16px; border-radius: 8px; margin: 12px 0; border: 1px solid #fcd34d;">
                  <div style="font-size: 9pt; color: #b45309; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">WHAT THIS FEELS LIKE:</div>
                  <div style="color: #92400e; font-style: italic;">${phase.feelsLike}</div>
                </div>
              ` : ''}
              
              ${phase.youWillHave ? `
                <div class="phase-outcome">
                  <strong>The outcome:</strong> ${phase.youWillHave}
                </div>
              ` : ''}
              
              ${phase.enabledBy || phase.investment ? `
                <div style="display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                  ${phase.enabledBy ? `
                    <span style="font-size: 10pt; color: #64748b;">Enabled by: <strong style="color: #1e293b;">${phase.enabledBy}</strong></span>
                  ` : ''}
                  ${phase.investment ? `
                    <div class="phase-investment">${phase.investment}</div>
                  ` : ''}
                </div>
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
  const rawPages = analysis._rawPages || {};
  const page4 = rawPages.page4 || {};
  const comprehensiveAnalysis = analysis._comprehensiveAnalysis || {};
  
  if (investments.length === 0) {
    return '';
  }
  
  // ========================================================================
  // USE THE STORED TOTAL from page4.totalYear1 (same as Portal)
  // DO NOT recalculate - this ensures PDF matches Portal exactly
  // ========================================================================
  const displayTotal = summary.totalFirstYearInvestment || '—';
  
  // ========================================================================
  // EXTRACT valuation, hidden assets, gross margin
  // Priority: page4_numbers (Pass 2 output) > comprehensiveAnalysis (Pass 1 raw data)
  // ========================================================================
  
  // VALUATION - check page4_numbers first, then build from comprehensiveAnalysis
  let indicativeValuation = page4.indicativeValuation || null;
  if (!indicativeValuation && comprehensiveAnalysis?.valuation?.conservativeValue && comprehensiveAnalysis?.valuation?.optimisticValue) {
    const v = comprehensiveAnalysis.valuation;
    const hiddenAssetsTotal = comprehensiveAnalysis?.hiddenAssets?.totalHiddenAssets || 0;
    if (hiddenAssetsTotal > 50000) {
      const lowM = ((v.conservativeValue + hiddenAssetsTotal) / 1000000).toFixed(1);
      const highM = ((v.optimisticValue + hiddenAssetsTotal) / 1000000).toFixed(1);
      indicativeValuation = `£${lowM}M - £${highM}M`;
    } else {
      const lowM = (v.conservativeValue / 1000000).toFixed(1);
      const highM = (v.optimisticValue / 1000000).toFixed(1);
      indicativeValuation = `£${lowM}M - £${highM}M`;
    }
    console.log('[PDF] Built valuation from comprehensiveAnalysis:', indicativeValuation);
  }
  
  // HIDDEN ASSETS - check page4_numbers first, then build from comprehensiveAnalysis
  let hiddenAssets = page4.hiddenAssets || null;
  if (!hiddenAssets && comprehensiveAnalysis?.hiddenAssets?.totalHiddenAssets && comprehensiveAnalysis.hiddenAssets.totalHiddenAssets > 50000) {
    const h = comprehensiveAnalysis.hiddenAssets;
    const components: string[] = [];
    if (h.freeholdProperty) components.push(`£${Math.round(h.freeholdProperty/1000)}k freehold property`);
    if (h.excessCash) components.push(`£${Math.round(h.excessCash/1000)}k excess cash`);
    
    hiddenAssets = {
      total: `£${Math.round(h.totalHiddenAssets / 1000)}k`,
      breakdown: components.join(' + '),
      note: 'These assets sit OUTSIDE the earnings-based valuation'
    };
    console.log('[PDF] Built hidden assets from comprehensiveAnalysis:', hiddenAssets.total);
  }
  
  // GROSS MARGIN - check page4_numbers first, then build from comprehensiveAnalysis  
  let grossMarginStrength = page4.grossMarginStrength || null;
  if (!grossMarginStrength && comprehensiveAnalysis?.grossMargin?.grossMarginPct) {
    const gm = comprehensiveAnalysis.grossMargin;
    const grossMarginPct = typeof gm.grossMarginPct === 'number' ? gm.grossMarginPct : parseFloat(gm.grossMarginPct);
    if (!isNaN(grossMarginPct)) {
      const assessment = gm.assessment || (grossMarginPct > 50 ? 'excellent' : grossMarginPct > 40 ? 'healthy' : 'typical');
      if (assessment === 'excellent' || assessment === 'healthy') {
        grossMarginStrength = `${grossMarginPct.toFixed(1)}% gross margin - ${assessment} for the industry`;
        console.log('[PDF] Built gross margin from comprehensiveAnalysis:', grossMarginStrength);
      }
    }
  }
  
  console.log('[PDF Investment Table] Using PORTAL-IDENTICAL total:', {
    displayTotal,
    investmentCount: investments.length,
    investments: investments.map((i: any) => `${i.service}: ${i.investment}`),
    indicativeValuation,
    hiddenAssets: hiddenAssets?.total,
    grossMarginStrength
  });
  
  return `
    <div class="page">
      <div class="section-header">
        <div class="section-label">Investment Breakdown</div>
        <h2 class="section-title">${page4.headerLine || 'Your Recommended Services'}</h2>
        <p class="section-subtitle">
          Each service is selected based on your specific situation and goals.
        </p>
      </div>
      
      <!-- Valuation & Hidden Assets Section -->
      ${(indicativeValuation || hiddenAssets || grossMarginStrength) ? `
        <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #7dd3fc;">
          ${indicativeValuation ? `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 10pt; color: #0369a1; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                💰 Indicative Business Value
              </div>
              <div style="font-size: 24pt; font-weight: 700; color: #0c4a6e;">
                ${indicativeValuation}
              </div>
              ${hiddenAssets ? `
                <div style="font-size: 10pt; color: #0369a1; margin-top: 8px;">
                  Plus <strong>${hiddenAssets.total}</strong> in hidden assets (${hiddenAssets.breakdown || 'freehold property + excess cash'})
                </div>
                <div style="font-size: 9pt; color: #64748b; font-style: italic; margin-top: 4px;">
                  ${hiddenAssets.note || 'These assets sit OUTSIDE the earnings-based valuation'}
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          ${grossMarginStrength ? `
            <div style="display: flex; align-items: center; gap: 8px; ${indicativeValuation ? 'padding-top: 12px; border-top: 1px solid #7dd3fc;' : ''}">
              <span style="color: #059669; font-size: 14pt;">✓</span>
              <span style="font-size: 11pt; color: #047857; font-weight: 500;">${grossMarginStrength}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <table class="investment-table">
        <thead>
          <tr>
            <th>Service / Phase</th>
            <th>What You Get</th>
            <th class="text-right">Investment</th>
          </tr>
        </thead>
        <tbody>
          ${investments.map((inv: any) => `
            <tr>
              <td>
                <strong>${inv.service || inv.phase || inv.serviceName || inv.name || 'Service'}</strong>
                ${inv.tier ? `<br><small style="color: #059669; font-weight: 500;">${inv.tier}</small>` : ''}
              </td>
              <td style="color: #64748b; font-size: 10pt;">
                ${inv.whatYouGet || inv.rationale || '—'}
              </td>
              <td class="text-right font-bold">${inv.investment || inv.amount || inv.price || '—'}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2"><strong>Total First Year Investment</strong></td>
            <td class="text-right">${displayTotal}</td>
          </tr>
        </tbody>
      </table>
      
      ${page4.returns ? `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px;">
          <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; border: 1px solid #6ee7b7;">
            <div style="font-size: 10pt; color: #64748b; margin-bottom: 4px;">Conservative Return</div>
            <div style="font-size: 20pt; font-weight: 700; color: #059669;">${page4.returns.conservative?.total || '—'}</div>
          </div>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; border: 1px solid #6ee7b7;">
            <div style="font-size: 10pt; color: #059669; margin-bottom: 4px;">Realistic Return</div>
            <div style="font-size: 20pt; font-weight: 700; color: #059669;">${page4.returns.realistic?.total || '—'}</div>
          </div>
        </div>
      ` : ''}
      
      ${page4.paybackPeriod ? `
        <div style="text-align: center; margin-top: 16px; padding: 16px; background: #f0fdf4; border-radius: 12px;">
          <span style="color: #166534;">Payback period: </span>
          <strong style="color: #059669; font-size: 14pt;">${page4.paybackPeriod}</strong>
        </div>
      ` : ''}
      
      ${page4.realReturn || summary.realReturn ? `
        <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; border-left: 4px solid #059669;">
          <div style="font-size: 11pt; color: #475569; font-style: italic;">
            But the real return? ${page4.realReturn || summary.realReturn}
          </div>
        </div>
      ` : ''}
      
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
  
  // ========================================================================
  // PRIORITIZE Pass 1 comprehensive_analysis for CORRECT figures
  // This ensures PDF matches client portal exactly (£193k not £147k)
  // ========================================================================
  const comprehensiveAnalysis = analysis._comprehensiveAnalysis || {};
  const rawPages = analysis._rawPages || {};
  const page4 = rawPages.page4 || {};
  
  // Build financialInsights from Pass 1 comprehensive_analysis
  const financialInsights: any = {};
  
  // PAYROLL - Use Pass 1's calculated figures
  if (comprehensiveAnalysis.payroll?.annualExcess && comprehensiveAnalysis.payroll.annualExcess > 0) {
    const p = comprehensiveAnalysis.payroll;
    financialInsights.payroll = {
      staffCosts: p.staffCosts || 0,
      turnover: p.turnover || 0,
      actualPct: p.staffCostsPct || 0,
      benchmarkPct: p.benchmark?.good || 28,
      grossExcess: p.annualExcess || 0,
      recoverableLow: Math.round(p.annualExcess * 0.35),
      recoverableHigh: Math.round(p.annualExcess * 0.50),
      summary: `£${Math.round(p.annualExcess / 1000)}k/year excess`,
    };
    console.log('[PDF] ✅ Using Pass 1 payroll data:', financialInsights.payroll);
  } else if (page4.financialInsights?.payroll) {
    // Fallback to page4.financialInsights
    financialInsights.payroll = page4.financialInsights.payroll;
    console.log('[PDF] ⚠️ Using page4 financialInsights (fallback)');
  }
  
  // VALUATION - Use Pass 1's calculated figures
  if (comprehensiveAnalysis.valuation?.conservativeValue) {
    const v = comprehensiveAnalysis.valuation;
    financialInsights.valuation = {
      currentEbitda: v.operatingProfit || 0,
      currentMultiple: v.adjustedMultipleLow || 3,
      improvedMultiple: v.adjustedMultipleHigh || 4,
      currentValuation: v.conservativeValue || 0,
      improvedEbitda: (v.operatingProfit || 0) + (comprehensiveAnalysis.payroll?.annualExcess || 0) * 0.4,
      uplift: (v.optimisticValue || 0) - (v.conservativeValue || 0),
    };
    console.log('[PDF] ✅ Using Pass 1 valuation data');
  } else if (page4.financialInsights?.valuation) {
    financialInsights.valuation = page4.financialInsights.valuation;
  }
  
  // Prefer calculated values from financialInsights over LLM-generated text
  const labourInefficiency = financialInsights.payroll?.summary || costOfInaction.labourInefficiency;
  const valuationCost = financialInsights.valuation?.summary || costOfInaction.marginLeakage;
  
  console.log('[PDF] Gap Analysis data sources:', {
    hasPass1Payroll: !!comprehensiveAnalysis.payroll,
    hasPass1Valuation: !!comprehensiveAnalysis.valuation,
    hasCostOfInaction: !!costOfInaction.totalOverHorizon,
    labourInefficiency,
  });
  
  if (gaps.length === 0 && !costOfInaction.annualFinancialCost && !labourInefficiency) {
    return '';
  }
  
  return `
    <div class="page">
      <div class="section-header">
        <div class="section-label">Gap Analysis</div>
        <h2 class="section-title">${gapAnalysis.headline || "What's Holding You Back"}</h2>
        <p class="section-subtitle">
          ${gapAnalysis.introduction || 'Understanding the gaps between where you are and where you want to be.'}
        </p>
      </div>
      
      ${gaps.length > 0 ? `
        <div style="margin: 30px 0;">
          ${gaps.map((gap: any, idx: number) => {
            // Determine severity badge
            const severityColor = gap.severity === 'critical' ? '#dc2626' : gap.severity === 'high' ? '#f59e0b' : '#3b82f6';
            const severityLabel = gap.severity === 'critical' ? 'CRITICAL' : gap.severity === 'high' ? 'HIGH' : 'MEDIUM';
            const severityIcon = gap.severity === 'critical' ? '🔴' : gap.severity === 'high' ? '🟠' : '🟡';
            
            return `
            <div class="gap-card" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header with severity and category -->
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 12pt;">${severityIcon}</span>
                <span style="font-size: 9pt; font-weight: 600; color: ${severityColor}; text-transform: uppercase;">${severityLabel}</span>
                ${gap.category ? `<span style="font-size: 9pt; color: #64748b;">|</span><span style="font-size: 9pt; color: #64748b; text-transform: lowercase;">${gap.category}</span>` : ''}
              </div>
              
              <!-- Title -->
              <div style="font-size: 13pt; font-weight: 600; color: #1e293b; margin-bottom: 12px;">
                ${gap.title || `Gap ${idx + 1}`}
              </div>
              
              <!-- Pattern (client quote) -->
              ${gap.pattern ? `
                <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; border-left: 3px solid #64748b;">
                  <div style="font-style: italic; color: #475569;">"${gap.pattern}"</div>
                </div>
              ` : ''}
              
              <!-- Impact Grid - MATCHING CLIENT PORTAL EXACTLY -->
              ${(gap.timeImpact || gap.financialImpact || gap.emotionalImpact) ? `
                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                  ${gap.timeImpact ? `
                    <div style="display: flex; gap: 12px;">
                      <div style="min-width: 100px; font-size: 9pt; color: #64748b; font-weight: 600; text-transform: uppercase;">Time Impact</div>
                      <div style="font-size: 10pt; color: #475569;">${gap.timeImpact}</div>
                    </div>
                  ` : ''}
                  ${gap.financialImpact ? `
                    <div style="display: flex; gap: 12px;">
                      <div style="min-width: 100px; font-size: 9pt; color: #64748b; font-weight: 600; text-transform: uppercase;">Financial Impact</div>
                      <div style="font-size: 10pt; color: #dc2626; font-weight: 500;">${gap.financialImpact}</div>
                    </div>
                  ` : ''}
                  ${gap.emotionalImpact ? `
                    <div style="display: flex; gap: 12px;">
                      <div style="min-width: 100px; font-size: 9pt; color: #64748b; font-weight: 600; text-transform: uppercase;">Emotional Impact</div>
                      <div style="font-size: 10pt; color: #475569; font-style: italic;">${gap.emotionalImpact}</div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
              
              <!-- Legacy costs array (fallback) -->
              ${(!gap.timeImpact && !gap.financialImpact && !gap.emotionalImpact && gap.costs && gap.costs.length > 0) ? `
                <div style="margin-bottom: 16px;">
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    ${gap.costs.map((cost: string) => `
                      <li style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 4px;">
                        <span style="color: #dc2626;">•</span>
                        <span style="font-size: 10pt; color: #475569;">${cost}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <!-- Shift Required -->
              ${gap.shiftRequired ? `
                <div style="background: #ecfdf5; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #10b981;">
                  <div style="font-size: 9pt; color: #059669; font-weight: 600; margin-bottom: 4px;">Shift required:</div>
                  <div style="font-size: 10pt; color: #047857;">${gap.shiftRequired}</div>
                </div>
              ` : ''}
            </div>
          `}).join('')}
        </div>
      ` : ''}
      
      <!-- Cost of Not Acting Box - MATCHES CLIENT PORTAL FORMAT EXACTLY -->
      ${(costOfInaction.totalOverHorizon || costOfInaction.total || comprehensiveAnalysis?.costOfInaction?.totalOverHorizon) ? (() => {
        const coiTotal = costOfInaction.totalOverHorizon || 
                         costOfInaction.total || 
                         comprehensiveAnalysis?.costOfInaction?.totalOverHorizon || 0;
        const coiYears = costOfInaction.timeHorizon || 
                         comprehensiveAnalysis?.costOfInaction?.timeHorizon || 2;
        const coiTotalK = Math.round(coiTotal / 1000);
        const coiNarrative = costOfInaction.narrative || 
                            `Cost of inaction over ${coiYears}-year horizon: £${coiTotalK}k+. Breakdown: Payroll Excess: £${coiTotalK}k.`;
        
        return `
          <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); padding: 24px; border-radius: 12px; border: 1px solid #fca5a5; margin-top: 24px; text-align: center;">
            <div style="font-size: 9pt; color: #dc2626; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              ⚠️ Cost of Not Acting
            </div>
            <div style="font-size: 28pt; font-weight: 700; color: #dc2626; margin-bottom: 8px;">
              £${coiTotalK}k+ over ${coiYears} years
            </div>
            <div style="font-size: 10pt; color: #7f1d1d; line-height: 1.5;">
              ${coiNarrative}
            </div>
          </div>
        `;
      })() : ''}
      
      <!-- Detailed Financial Breakdown (if available) -->
      ${(costOfInaction.annualFinancialCost || costOfInaction.annual || labourInefficiency || financialInsights.payroll) ? `
        <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); padding: 30px; border-radius: 16px; border: 1px solid #fca5a5; margin-top: 30px;">
          <div style="font-size: 10pt; color: #dc2626; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
            Detailed Breakdown
          </div>
          
          ${financialInsights.payroll ? `
            <!-- Payroll Analysis with FULL calculation breakdown -->
            <div style="margin-bottom: 20px;">
              <div style="font-weight: 600; color: #7f1d1d; margin-bottom: 12px;">Elevated Payroll Suppressing Margins</div>
              
              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">YOUR NUMBERS:</div>
                <div style="font-size: 10pt; color: #1e293b; line-height: 1.7;">
                  • Staff costs: <strong>£${Math.round(financialInsights.payroll.staffCosts / 1000)}k</strong> (${financialInsights.payroll.actualPct?.toFixed(1) || '—'}% of £${Math.round(financialInsights.payroll.turnover / 1000)}k turnover)<br>
                  • Industry typical: <strong>${financialInsights.payroll.benchmarkPct || 28}-${(financialInsights.payroll.benchmarkPct || 28) + 2}%</strong>*<br>
                  • Gross excess: <strong>~£${Math.round(financialInsights.payroll.grossExcess / 1000)}k/year</strong><br>
                  • Recoverable (35-50%): <strong>£${Math.round(financialInsights.payroll.recoverableLow / 1000)}k-£${Math.round(financialInsights.payroll.recoverableHigh / 1000)}k/year</strong>
                </div>
              </div>
              
              <div style="background: #fef3c7; padding: 14px 16px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #f59e0b;">
                <div style="font-size: 9pt; color: #92400e; font-weight: 600; margin-bottom: 6px;">WHY NOT 100% RECOVERABLE?</div>
                <div style="font-size: 10pt; color: #78350f; line-height: 1.5;">
                  Not all payroll excess can be addressed without disrupting operations. Some is embedded in service delivery; some protects against key-person risk. <strong>35-50%</strong> is a conservative, achievable target that maintains business stability.
                </div>
              </div>
              
              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">EXIT IMPACT:</div>
                <div style="font-size: 10pt; color: #1e293b; line-height: 1.7;">
                  • Annual savings: <strong>£${Math.round(financialInsights.payroll.recoverableLow / 1000)}k-£${Math.round(financialInsights.payroll.recoverableHigh / 1000)}k</strong> flows to EBITDA<br>
                  • At 3.5x exit multiple: <strong>£${Math.round(financialInsights.payroll.recoverableLow * 3.5 / 1000)}k-£${Math.round(financialInsights.payroll.recoverableHigh * 3.5 / 1000)}k</strong> added to sale price<br>
                  • Monthly impact: <strong>~£${Math.round(financialInsights.payroll.recoverableLow / 12 / 1000)}k-£${Math.round(financialInsights.payroll.recoverableHigh / 12 / 1000)}k/month</strong>
                </div>
              </div>
              
              <div style="font-size: 9pt; color: #64748b; font-style: italic; line-height: 1.5;">
                *Industry averages are indicative based on published benchmarks. Your <strong>Benchmarking analysis</strong> will confirm your exact position against direct peers in your sector.
              </div>
            </div>
          ` : labourInefficiency ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fca5a5;">
              <span style="color: #7f1d1d;">Labour inefficiency</span>
              <span style="font-weight: 600; color: #dc2626;">${labourInefficiency}</span>
            </div>
          ` : ''}
          
          ${financialInsights.valuation ? `
            <!-- Valuation Analysis with calculation breakdown -->
            <div style="margin-bottom: 20px;">
              <div style="font-weight: 600; color: #7f1d1d; margin-bottom: 12px;">Value Being Left on the Table</div>
              
              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">THE MULTIPLE EFFECT:</div>
                <div style="font-size: 10pt; color: #1e293b; line-height: 1.7;">
                  • Current position: £${Math.round(financialInsights.valuation.currentEbitda / 1000)}k EBITDA × <strong>${financialInsights.valuation.currentMultiple}x</strong> = £${Math.round(financialInsights.valuation.currentValuation / 1000)}k<br>
                  • With payroll savings: +£${Math.round((financialInsights.valuation.improvedEbitda - financialInsights.valuation.currentEbitda) / 1000)}k to EBITDA<br>
                  • At improved multiple: <strong>${financialInsights.valuation.improvedMultiple}x</strong> (from operational improvements)
                </div>
              </div>
              
              <div style="background: #fef3c7; padding: 14px 16px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #f59e0b;">
                <div style="font-size: 9pt; color: #92400e; font-weight: 600; margin-bottom: 6px;">THE DIFFERENCE A MULTIPLE MAKES:</div>
                <div style="font-size: 10pt; color: #78350f; line-height: 1.5;">
                  The difference between a <strong>${financialInsights.valuation.currentMultiple}x</strong> and <strong>${financialInsights.valuation.improvedMultiple}x</strong> multiple on £${Math.round(financialInsights.valuation.improvedEbitda / 1000)}k EBITDA is <strong>£${Math.round(financialInsights.valuation.improvedEbitda * (financialInsights.valuation.improvedMultiple - financialInsights.valuation.currentMultiple) / 1000)}k</strong> on your sale price.
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 16px;">
                <div style="font-size: 12pt; color: #7f1d1d; margin-bottom: 4px;">Potential Uplift</div>
                <div style="font-size: 24pt; font-weight: 700; color: #dc2626;">
                  £${Math.round(financialInsights.valuation.uplift * 0.8 / 1000)}k - £${Math.round(financialInsights.valuation.uplift * 1.2 / 1000)}k
                </div>
              </div>
            </div>
          ` : valuationCost ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fca5a5;">
              <span style="color: #7f1d1d;">Valuation suppression</span>
              <span style="font-weight: 600; color: #dc2626;">${valuationCost}</span>
            </div>
          ` : ''}
          
          ${costOfInaction.yourTimeWasted ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="color: #7f1d1d;">Your time on work below pay grade</span>
              <span style="font-weight: 600; color: #dc2626;">${costOfInaction.yourTimeWasted}</span>
            </div>
          ` : ''}
          
          ${costOfInaction.annualFinancialCost || costOfInaction.annual ? `
            <div style="font-size: 24pt; font-weight: 700; color: #dc2626; margin-bottom: 12px; margin-top: 16px;">
              ${costOfInaction.annualFinancialCost || costOfInaction.annual || '—'}
            </div>
          ` : ''}
          
          ${costOfInaction.description ? `
            <div style="font-size: 11pt; color: #7f1d1d;">
              ${costOfInaction.description}
            </div>
          ` : ''}
          ${costOfInaction.personalCost ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #fca5a5; font-size: 11pt; color: #991b1b; font-weight: 500;">
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
  const rawPages = analysis._rawPages || {};
  const page5 = rawPages.page5 || {};
  
  // Use FULL closing content from page5
  const thisWeek = closing.personalNote || page5.thisWeek || '';
  const firstStep = closing.callToAction || page5.firstStep || '';
  const closingQuote = closing.closingQuote || page5.closingQuote || '';
  const closingNarrative = closing.closingNarrative || page5.personalMessage || page5.closingNarrative || '';
  const investment = closing.investment || page5.investment || analysis.investmentSummary?.totalFirstYearInvestment || '';
  const fullCTA = closing.fullCTA || page5.fullCTA || page5.callToAction || '';
  
  return `
    <div class="page closing-page">
      <div class="section-header">
        <div class="section-label">Next Steps</div>
        <h2 class="section-title">${page5.headerLine || 'Ready to Begin?'}</h2>
      </div>
      
      ${thisWeek ? `
        <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #86efac;">
          <div style="font-size: 10pt; color: #059669; text-transform: uppercase; font-weight: 600; margin-bottom: 12px;">THIS WEEK</div>
          <div style="font-size: 12pt; color: #166534; line-height: 1.7;">${thisWeek}</div>
        </div>
      ` : ''}
      
      ${firstStep ? `
        <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <div style="font-size: 10pt; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 12px;">YOUR FIRST STEP</div>
          <div style="font-size: 12pt; color: #334155; line-height: 1.7;">${firstStep}</div>
        </div>
      ` : ''}
      
      ${closingQuote ? `
        <div class="closing-message">
          <div class="closing-quote" style="font-size: 16pt; border-left: 4px solid #059669; padding-left: 20px;">
            "${closingQuote}"
          </div>
        </div>
      ` : ''}
      
      ${closingNarrative ? `
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 28px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <div style="font-size: 12pt; color: #475569; line-height: 1.8; white-space: pre-line;">${closingNarrative}</div>
        </div>
      ` : ''}
      
      <div class="cta-box">
        <div class="cta-title">Your Investment: ${investment}</div>
        <div class="cta-text" style="font-size: 13pt; line-height: 1.7; max-width: 500px; margin: 0 auto 24px;">
          ${fullCTA || `Let's discuss how we can help you achieve your goals. Schedule a 30-minute call with ${practiceName} to review this analysis and plan your next steps.`}
        </div>
        <span class="cta-button">Schedule a Call →</span>
      </div>
      
      <div style="text-align: center; margin-top: 40px; color: #64748b; font-size: 10pt;">
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

