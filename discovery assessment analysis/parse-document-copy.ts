// ============================================================================
// PARSE-DOCUMENT: Automated Financial Data Extraction Pipeline
// ============================================================================
// Extracts text and financial metrics from uploaded PDFs
// Called automatically when documents are uploaded or via queue processing
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// PDF TEXT EXTRACTION (Binary pattern extraction)
// ============================================================================

function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  try {
    const uint8Array = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawContent = textDecoder.decode(uint8Array);
    
    const textMatches: string[] = [];
    
    // Method 1: Extract text from PDF text streams (BT...ET blocks)
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
    
    // Method 2: Look for financial patterns directly
    const financialPatterns = [
      /(?:Sales|Turnover|Revenue)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
      /(?:Gross\s+Profit)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
      /(?:Operating\s+Profit)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
      /(?:Net\s+Profit|Profit\s+after\s+tax)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
      /(?:Cost\s+of\s+Sales)[:\s]*£?\s*\(?([\d,]+(?:\.\d{2})?)\)?/gi,
      /(?:Materials)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
      /(?:Subcontractor)[:\s]*£?\s*([\d,]+(?:\.\d{2})?)/gi,
    ];
    
    for (const pattern of financialPatterns) {
      let finMatch;
      while ((finMatch = pattern.exec(rawContent)) !== null) {
        textMatches.push(finMatch[0]);
      }
    }
    
    // Method 3: Extract readable number sequences in financial range
    const numberPattern = /(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/g;
    const numbers: string[] = [];
    let numMatch;
    while ((numMatch = numberPattern.exec(rawContent)) !== null) {
      const value = parseFloat(numMatch[1].replace(/,/g, ''));
      if (value >= 10000 && value <= 10000000) {
        numbers.push(numMatch[1]);
      }
    }
    
    let result = textMatches.join(' ').trim();
    
    if (numbers.length > 0 && result.length < 200) {
      result += '\n\nFinancial figures found: ' + numbers.slice(0, 10).join(', ');
    }
    
    console.log(`[extractText] Extracted ${result.length} chars, ${textMatches.length} text blocks, ${numbers.length} numbers`);
    
    return result;
  } catch (error) {
    console.error('[extractText] Error:', error);
    return '';
  }
}

// ============================================================================
// FINANCIAL METRICS EXTRACTION
// ============================================================================

interface ExtractedMetrics {
  turnover?: number;
  turnover_2024?: number;
  gross_profit?: number;
  gross_profit_2024?: number;
  gross_margin_pct?: number;
  gross_margin_2024?: number;
  operating_profit?: number;
  operating_profit_2024?: number;
  net_profit?: number;
  cost_of_sales?: number;
  materials?: number;
  subcontractor_costs?: number;
  year?: number;
  extraction_confidence: 'high' | 'medium' | 'low';
}

function extractFinancialMetrics(text: string): ExtractedMetrics {
  const metrics: ExtractedMetrics = { extraction_confidence: 'low' };
  const normalized = text.replace(/\s+/g, ' ');
  
  // Helper to extract currency values
  const extractValue = (patterns: RegExp[]): number | null => {
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0) return value;
      }
    }
    return null;
  };

  // Current year turnover/sales
  const turnover = extractValue([
    /sales[:\s]+£?\s*([\d,]+)/i,
    /turnover[:\s]+£?\s*([\d,]+)/i,
    /revenue[:\s]+£?\s*([\d,]+)/i,
  ]);
  if (turnover && turnover > 10000) {
    metrics.turnover = turnover;
  }

  // Gross Profit
  const grossProfit = extractValue([
    /gross\s+profit[:\s]+£?\s*([\d,]+)/i,
  ]);
  if (grossProfit && grossProfit > 0) {
    metrics.gross_profit = grossProfit;
  }

  // Operating Profit
  const operatingProfit = extractValue([
    /operating\s+profit[:\s]+£?\s*([\d,]+)/i,
    /profit\s+from\s+operations[:\s]+£?\s*([\d,]+)/i,
  ]);
  if (operatingProfit) {
    metrics.operating_profit = operatingProfit;
  }

  // Net Profit
  const netProfit = extractValue([
    /net\s+profit[:\s]+£?\s*([\d,]+)/i,
    /profit\s+(?:after\s+tax|for\s+(?:the\s+)?year)[:\s]+£?\s*([\d,]+)/i,
  ]);
  if (netProfit !== null) {
    metrics.net_profit = netProfit;
  }

  // Cost of Sales
  const costOfSales = extractValue([
    /cost\s+of\s+sales[:\s]+£?\s*\(?([\d,]+)\)?/i,
  ]);
  if (costOfSales && costOfSales > 0) {
    metrics.cost_of_sales = costOfSales;
  }

  // Materials
  const materials = extractValue([
    /materials[:\s]+£?\s*([\d,]+)/i,
  ]);
  if (materials && materials > 0) {
    metrics.materials = materials;
  }

  // Subcontractor costs
  const subcontractor = extractValue([
    /subcontractor[:\s]+£?\s*([\d,]+)/i,
  ]);
  if (subcontractor && subcontractor > 0) {
    metrics.subcontractor_costs = subcontractor;
  }

  // Calculate gross margin if we have both turnover and gross profit
  if (metrics.turnover && metrics.gross_profit) {
    metrics.gross_margin_pct = Math.round((metrics.gross_profit / metrics.turnover) * 10000) / 100;
  }

  // Look for year
  const yearMatch = text.match(/(?:year\s+ended|31\s+(?:january|jan|december|dec))\s+(\d{4})/i);
  if (yearMatch) {
    metrics.year = parseInt(yearMatch[1]);
  }

  // Try to find prior year data (look for patterns like "2024: 147,458" or comparative columns)
  const priorYearPatterns = [
    /2024[:\s]+£?\s*([\d,]+)/gi,
    /prior\s+year[:\s]+£?\s*([\d,]+)/gi,
  ];
  
  for (const pattern of priorYearPatterns) {
    const matches = [...normalized.matchAll(pattern)];
    if (matches.length > 0) {
      // First large number in 2024 context is likely turnover
      for (const match of matches) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (value > 50000 && value < 10000000 && !metrics.turnover_2024) {
          metrics.turnover_2024 = value;
          break;
        }
      }
    }
  }

  // Set confidence level
  const metricCount = Object.keys(metrics).filter(k => 
    k !== 'extraction_confidence' && metrics[k as keyof ExtractedMetrics] !== undefined
  ).length;
  
  if (metricCount >= 4 && metrics.turnover) {
    metrics.extraction_confidence = 'high';
  } else if (metricCount >= 2 && metrics.turnover) {
    metrics.extraction_confidence = 'medium';
  }

  console.log('[extractMetrics] Found metrics:', metrics);
  return metrics;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json();
    const { action, clientId, documentId, practiceId } = body;

    console.log(`[parse-document] Action: ${action}, Client: ${clientId}, Doc: ${documentId}`);

    // ========================================================================
    // ACTION: Process the parse queue (called by cron/scheduler)
    // ========================================================================
    if (action === 'process-queue') {
      const { data: queueItems, error: queueError } = await supabase
        .from('document_parse_queue')
        .select(`
          id,
          client_context_id,
          client_id,
          attempts
        `)
        .eq('status', 'pending')
        .lt('attempts', 3)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5);

      if (queueError) throw queueError;

      console.log(`[process-queue] Found ${queueItems?.length || 0} items to process`);

      const results = [];
      for (const item of queueItems || []) {
        // Mark as processing
        await supabase
          .from('document_parse_queue')
          .update({ 
            status: 'processing', 
            started_at: new Date().toISOString(),
            attempts: item.attempts + 1
          })
          .eq('id', item.id);

        try {
          // Process the document
          const result = await processDocument(supabase, item.client_context_id);
          results.push({ id: item.client_context_id, ...result });
        } catch (error) {
          console.error(`[process-queue] Error processing ${item.client_context_id}:`, error);
          await supabase.rpc('mark_document_parse_failed', {
            p_client_context_id: item.client_context_id,
            p_error: error instanceof Error ? error.message : 'Unknown error'
          });
          results.push({ id: item.client_context_id, error: true });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        processed: results.length,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========================================================================
    // ACTION: Parse all documents for a client
    // ========================================================================
    if (action === 'parse-client-documents') {
      if (!clientId) {
        return new Response(JSON.stringify({ error: 'Missing clientId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: documents, error: fetchError } = await supabase
        .from('client_context')
        .select('id')
        .eq('client_id', clientId)
        .eq('context_type', 'document')
        .not('source_file_url', 'is', null);

      if (fetchError) throw fetchError;

      console.log(`[parse-client] Found ${documents?.length || 0} documents for client ${clientId}`);

      const results = [];
      for (const doc of documents || []) {
        try {
          const result = await processDocument(supabase, doc.id);
          results.push({ id: doc.id, ...result });
        } catch (error) {
          console.error(`[parse-client] Error processing ${doc.id}:`, error);
          results.push({ id: doc.id, error: true });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        documentsProcessed: results.length,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========================================================================
    // ACTION: Parse a single document
    // ========================================================================
    if (action === 'parse-document' && documentId) {
      const result = await processDocument(supabase, documentId);
      
      return new Response(JSON.stringify({
        success: true,
        ...result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========================================================================
    // ACTION: Get parsing status for a client
    // ========================================================================
    if (action === 'get-status' && clientId) {
      const { data: docs } = await supabase
        .from('client_context')
        .select('id, parsing_status, financial_data_quality, extracted_metrics, parsed_at, parsing_error')
        .eq('client_id', clientId)
        .eq('context_type', 'document');

      const { data: queueItems } = await supabase
        .from('document_parse_queue')
        .select('client_context_id, status, attempts')
        .eq('client_id', clientId)
        .in('status', ['pending', 'processing']);

      return new Response(JSON.stringify({
        documents: docs || [],
        queuedItems: queueItems || [],
        summary: {
          total: docs?.length || 0,
          parsed: docs?.filter(d => d.parsing_status === 'completed').length || 0,
          pending: docs?.filter(d => d.parsing_status === 'pending').length || 0,
          failed: docs?.filter(d => d.parsing_status === 'failed').length || 0,
          hasFinancialData: docs?.some(d => d.extracted_metrics?.turnover) || false
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[parse-document] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// PROCESS SINGLE DOCUMENT
// ============================================================================

async function processDocument(supabase: any, documentId: string): Promise<any> {
  console.log(`[processDocument] Processing ${documentId}`);

  // Fetch the document
  const { data: doc, error: fetchError } = await supabase
    .from('client_context')
    .select('*')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    throw new Error(`Document not found: ${documentId}`);
  }

  // Parse source_file_url
  let fileUrls: Array<{ fileName: string; fileUrl: string; fileType: string }> = [];
  try {
    fileUrls = typeof doc.source_file_url === 'string'
      ? JSON.parse(doc.source_file_url)
      : doc.source_file_url || [];
  } catch {
    throw new Error('Invalid source_file_url format');
  }

  let extractedText = '';
  const allMetrics: ExtractedMetrics = { extraction_confidence: 'low' };

  // Process each PDF
  for (const file of fileUrls) {
    if (file.fileType === 'application/pdf') {
      console.log(`[processDocument] Downloading PDF: ${file.fileName}`);
      
      try {
        const pdfResponse = await fetch(file.fileUrl);
        if (!pdfResponse.ok) {
          console.error(`Failed to download PDF: ${pdfResponse.status}`);
          continue;
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfText = extractTextFromPdfBuffer(pdfBuffer);
        
        if (pdfText) {
          extractedText += `\n\n=== ${file.fileName} ===\n${pdfText}`;
          
          // Extract metrics from this PDF
          const metrics = extractFinancialMetrics(pdfText);
          
          // Merge metrics (later values override earlier)
          Object.assign(allMetrics, metrics);
          
          console.log(`[processDocument] Extracted ${pdfText.length} chars from ${file.fileName}`);
        }
      } catch (pdfError) {
        console.error(`[processDocument] Error with ${file.fileName}:`, pdfError);
      }
    }
  }

  // Update the document using the helper function
  if (Object.keys(allMetrics).length > 1) { // More than just extraction_confidence
    await supabase.rpc('mark_document_parsed', {
      p_client_context_id: documentId,
      p_extracted_metrics: allMetrics,
      p_extracted_content: extractedText || null
    });
  } else if (extractedText) {
    // Some text but no metrics - partial success
    await supabase
      .from('client_context')
      .update({
        content: extractedText,
        parsing_status: 'completed',
        financial_data_quality: 'none',
        parsed_at: new Date().toISOString()
      })
      .eq('id', documentId);
  } else {
    // No data extracted - mark as needing manual review
    await supabase.rpc('mark_document_parse_failed', {
      p_client_context_id: documentId,
      p_error: 'Could not extract text or financial data from PDF'
    });
  }

  return {
    documentId,
    extractedTextLength: extractedText.length,
    metrics: allMetrics,
    confidence: allMetrics.extraction_confidence
  };
}
