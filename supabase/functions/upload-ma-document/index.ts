// ============================================================================
// EDGE FUNCTION: upload-ma-document
// ============================================================================
// Handles upload of Management Accounts documents (PDF/Excel)
// Extracts financial data and creates a financial snapshot
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface ExtractedMetrics {
  turnover?: number;
  revenue?: number;
  gross_profit?: number;
  operating_profit?: number;
  net_profit?: number;
  cost_of_sales?: number;
  overheads?: number;
  cash_position?: number;
  debtors_total?: number;
  creditors_total?: number;
  extraction_confidence?: 'high' | 'medium' | 'low';
}

// ============================================================================
// EXTRACT FINANCIAL DATA FROM PDF
// ============================================================================

function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  try {
    const uint8Array = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawContent = textDecoder.decode(uint8Array);
    
    const textMatches: string[] = [];
    
    // Extract text from PDF text streams (BT...ET blocks)
    const btEtPattern = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    while ((match = btEtPattern.exec(rawContent)) !== null) {
      const textInBlock = match[1];
      const stringPattern = /\(([^)]+)\)/g;
      let strMatch;
      while ((strMatch = stringPattern.exec(textInBlock)) !== null) {
        const text = strMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        if (text.trim() && text.length > 1 && !/^[\x00-\x1F]+$/.test(text)) {
          textMatches.push(text.trim());
        }
      }
    }
    
    return textMatches.join(' ').trim();
  } catch (error) {
    console.error('[extractText] Error:', error);
    return '';
  }
}

function extractFinancialMetrics(text: string): ExtractedMetrics {
  const metrics: ExtractedMetrics = {};
  const normalized = text.toLowerCase();
  
  // Revenue/Turnover patterns
  const revenuePatterns = [
    /(?:sales|turnover|revenue)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
    /(?:total\s+)?(?:sales|turnover|revenue)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
  ];
  
  for (const pattern of revenuePatterns) {
    const matches = [...normalized.matchAll(pattern)];
    if (matches.length > 0) {
      const value = parseFloat(matches[0][1].replace(/,/g, ''));
      if (value > 1000 && value < 100000000) {
        metrics.revenue = value;
        metrics.turnover = value;
        break;
      }
    }
  }
  
  // Gross Profit
  const grossProfitPattern = /(?:gross\s+profit)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi;
  const grossMatch = normalized.match(grossProfitPattern);
  if (grossMatch) {
    const value = parseFloat(grossMatch[0].replace(/[^\d,.]/g, '').replace(/,/g, ''));
    if (value > 0 && value < 100000000) {
      metrics.gross_profit = value;
    }
  }
  
  // Operating Profit
  const operatingProfitPattern = /(?:operating\s+profit|profit\s+before\s+tax)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi;
  const operatingMatch = normalized.match(operatingProfitPattern);
  if (operatingMatch) {
    const value = parseFloat(operatingMatch[0].replace(/[^\d,.]/g, '').replace(/,/g, ''));
    if (value > -10000000 && value < 100000000) {
      metrics.operating_profit = value;
    }
  }
  
  // Net Profit
  const netProfitPattern = /(?:net\s+profit|profit\s+after\s+tax)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi;
  const netMatch = normalized.match(netProfitPattern);
  if (netMatch) {
    const value = parseFloat(netMatch[0].replace(/[^\d,.]/g, '').replace(/,/g, ''));
    if (value > -10000000 && value < 100000000) {
      metrics.net_profit = value;
    }
  }
  
  // Cost of Sales
  const costOfSalesPattern = /(?:cost\s+of\s+sales|direct\s+costs)[:\s]*£?\s*\(?([\d,]+(?:\.\d{2})?)\)?/gi;
  const costMatch = normalized.match(costOfSalesPattern);
  if (costMatch) {
    const value = parseFloat(costMatch[0].replace(/[^\d,.]/g, '').replace(/,/g, ''));
    if (value > 0 && value < 100000000) {
      metrics.cost_of_sales = value;
    }
  }
  
  // Cash
  const cashPatterns = [
    /(?:cash\s+(?:and\s+)?(?:at\s+bank|balance))[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
    /(?:bank\s+balance)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
  ];
  
  for (const pattern of cashPatterns) {
    const matches = [...normalized.matchAll(pattern)];
    if (matches.length > 0) {
      const value = parseFloat(matches[0][1].replace(/,/g, ''));
      if (value >= 0 && value < 100000000) {
        metrics.cash_position = value;
        break;
      }
    }
  }
  
  // Debtors
  const debtorsPattern = /(?:trade\s+debtors|debtors)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi;
  const debtorsMatch = normalized.match(debtorsPattern);
  if (debtorsMatch) {
    const value = parseFloat(debtorsMatch[0].replace(/[^\d,.]/g, '').replace(/,/g, ''));
    if (value >= 0 && value < 10000000) {
      metrics.debtors_total = value;
    }
  }
  
  // Creditors
  const creditorsPattern = /(?:trade\s+creditors|creditors)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi;
  const creditorsMatch = normalized.match(creditorsPattern);
  if (creditorsMatch) {
    const value = parseFloat(creditorsMatch[0].replace(/[^\d,.]/g, '').replace(/,/g, ''));
    if (value >= 0 && value < 10000000) {
      metrics.creditors_total = value;
    }
  }
  
  // Calculate margins if we have the data
  if (metrics.revenue && metrics.gross_profit) {
    // Already have gross profit
  }
  if (metrics.revenue && metrics.operating_profit) {
    // Already have operating profit
  }
  if (metrics.revenue && metrics.net_profit) {
    // Already have net profit
  }
  
  // Set confidence
  const metricCount = Object.keys(metrics).filter(k => 
    k !== 'extraction_confidence' && metrics[k as keyof ExtractedMetrics] !== undefined
  ).length;
  
  if (metricCount >= 4 && metrics.revenue) {
    metrics.extraction_confidence = 'high';
  } else if (metricCount >= 2 && metrics.revenue) {
    metrics.extraction_confidence = 'medium';
  } else {
    metrics.extraction_confidence = 'low';
  }
  
  return metrics;
}

// ============================================================================
// CREATE SNAPSHOT FROM METRICS
// ============================================================================

async function createSnapshotFromMetrics(
  supabase: any,
  engagementId: string,
  metrics: ExtractedMetrics,
  periodEndDate: string,
  rawData: any
): Promise<string> {
  // Calculate derived metrics
  const grossMarginPct = metrics.revenue && metrics.gross_profit
    ? (metrics.gross_profit / metrics.revenue) * 100
    : null;
  
  const operatingMarginPct = metrics.revenue && metrics.operating_profit
    ? (metrics.operating_profit / metrics.revenue) * 100
    : null;
  
  const netMarginPct = metrics.revenue && metrics.net_profit
    ? (metrics.net_profit / metrics.revenue) * 100
    : null;
  
  // Calculate overheads if we have revenue, gross profit, and operating profit
  const overheads = metrics.gross_profit && metrics.operating_profit
    ? metrics.gross_profit - metrics.operating_profit
    : null;
  
  // Get prior snapshot for comparatives
  const { data: priorSnapshot } = await supabase
    .from('ma_financial_snapshots')
    .select('*')
    .eq('engagement_id', engagementId)
    .lt('period_end_date', periodEndDate)
    .order('period_end_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  // Calculate comparatives
  const revenueVsPriorMonth = priorSnapshot?.revenue && metrics.revenue
    ? metrics.revenue - priorSnapshot.revenue
    : null;
  
  const revenueVsPriorMonthPct = priorSnapshot?.revenue && metrics.revenue
    ? ((metrics.revenue - priorSnapshot.revenue) / priorSnapshot.revenue) * 100
    : null;
  
  const cashVsPriorMonth = priorSnapshot?.cash_position && metrics.cash_position
    ? metrics.cash_position - priorSnapshot.cash_position
    : null;
  
  // Create snapshot
  const { data: snapshot, error } = await supabase
    .from('ma_financial_snapshots')
    .insert({
      engagement_id: engagementId,
      period_end_date: periodEndDate,
      period_type: 'month',
      revenue: metrics.revenue,
      cost_of_sales: metrics.cost_of_sales,
      gross_profit: metrics.gross_profit,
      gross_margin_pct: grossMarginPct,
      overheads: overheads,
      operating_profit: metrics.operating_profit,
      operating_margin_pct: operatingMarginPct,
      net_profit: metrics.net_profit,
      net_margin_pct: netMarginPct,
      cash_position: metrics.cash_position,
      debtors_total: metrics.debtors_total,
      creditors_total: metrics.creditors_total,
      revenue_vs_prior_month: revenueVsPriorMonth,
      revenue_vs_prior_month_pct: revenueVsPriorMonthPct,
      cash_vs_prior_month: cashVsPriorMonth,
      source: 'upload',
      raw_data: rawData,
    })
    .select('id')
    .single();
  
  if (error) throw error;
  
  return snapshot.id;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const engagementId = formData.get('engagementId') as string;
    const periodEndDate = formData.get('periodEndDate') as string;
    
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!engagementId) {
      return new Response(
        JSON.stringify({ success: false, error: 'engagementId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!periodEndDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'periodEndDate is required (YYYY-MM-DD)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !['pdf', 'xls', 'xlsx'].includes(fileExtension)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid file type. Only PDF and Excel files are supported.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[upload-ma-document] Processing ${file.name} for engagement ${engagementId}`);
    
    // Read file content
    const fileBuffer = await file.arrayBuffer();
    
    // For now, only handle PDFs (Excel parsing would require additional libraries)
    if (fileExtension !== 'pdf') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Excel file parsing not yet implemented. Please upload a PDF file.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract text from PDF
    const extractedText = extractTextFromPdfBuffer(fileBuffer);
    
    if (!extractedText || extractedText.length < 100) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract sufficient text from PDF. Please ensure the file is a valid PDF with readable text.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract financial metrics
    const metrics = extractFinancialMetrics(extractedText);
    
    console.log(`[upload-ma-document] Extracted metrics:`, metrics);
    
    if (!metrics.revenue && metrics.extraction_confidence === 'low') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract financial data from the document. Please ensure it contains management accounts with revenue/turnover figures.',
          extractedText: extractedText.substring(0, 500) // Include sample for debugging
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Upload file to storage
    const fileName = `ma-documents/${engagementId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('[upload-ma-document] Storage upload error:', uploadError);
      // Continue anyway - we can still create the snapshot
    }
    
    // Create snapshot from extracted metrics
    const snapshotId = await createSnapshotFromMetrics(
      supabase,
      engagementId,
      metrics,
      periodEndDate,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: fileName,
        extractedText: extractedText.substring(0, 1000), // Store first 1000 chars
        extractionConfidence: metrics.extraction_confidence,
        extractedAt: new Date().toISOString()
      }
    );
    
    console.log(`[upload-ma-document] Created snapshot: ${snapshotId}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        snapshotId,
        metrics,
        extractionConfidence: metrics.extraction_confidence,
        message: 'Document uploaded and financial snapshot created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[upload-ma-document] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

