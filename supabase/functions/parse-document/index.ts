// parse-document - Extract text from PDFs and documents
// Stores extracted content back in client_context for use by value analysis

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PDF.js for text extraction
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { action, clientId, documentId } = await req.json();

    // ACTION: Parse all documents for a client
    if (action === 'parse-client-documents') {
      if (!clientId) {
        return new Response(JSON.stringify({ error: 'Missing clientId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get all unprocessed documents for this client
      const { data: documents, error: fetchError } = await supabase
        .from('client_context')
        .select('*')
        .eq('client_id', clientId)
        .eq('context_type', 'document');

      if (fetchError) throw fetchError;

      console.log(`Found ${documents?.length || 0} documents for client ${clientId}`);

      const results = [];

      for (const doc of documents || []) {
        // Parse source_file_url to get file URLs
        let fileUrls: Array<{ fileName: string; fileUrl: string; fileType: string }> = [];
        
        try {
          fileUrls = typeof doc.source_file_url === 'string' 
            ? JSON.parse(doc.source_file_url)
            : doc.source_file_url || [];
        } catch {
          console.log(`Could not parse source_file_url for doc ${doc.id}`);
          continue;
        }

        let extractedText = doc.content || '';
        const extractedMetrics: Record<string, any> = doc.extracted_metrics || {};

        for (const file of fileUrls) {
          if (file.fileType === 'application/pdf') {
            console.log(`Parsing PDF: ${file.fileName}`);
            
            try {
              // Download the PDF
              const pdfResponse = await fetch(file.fileUrl);
              if (!pdfResponse.ok) {
                console.error(`Failed to download PDF: ${pdfResponse.status}`);
                continue;
              }

              const pdfBuffer = await pdfResponse.arrayBuffer();
              const pdfData = new Uint8Array(pdfBuffer);

              // Extract text using PDF.js
              const loadingTask = pdfjsLib.getDocument({ data: pdfData });
              const pdf = await loadingTask.promise;
              
              let pdfText = `\n\n=== Extracted from: ${file.fileName} ===\n`;
              
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item: any) => item.str)
                  .join(' ');
                pdfText += `\n--- Page ${i} ---\n${pageText}`;
              }

              extractedText += pdfText;

              // Try to extract financial metrics from the text
              const metrics = extractFinancialMetrics(pdfText);
              Object.assign(extractedMetrics, metrics);

              console.log(`Extracted ${pdfText.length} chars from ${file.fileName}`);
              
            } catch (pdfError) {
              console.error(`Error parsing PDF ${file.fileName}:`, pdfError);
            }
          }
        }

        // Update the document with extracted content
        const { error: updateError } = await supabase
          .from('client_context')
          .update({
            content: extractedText,
            extracted_metrics: extractedMetrics,
            processed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', doc.id);

        if (updateError) {
          console.error(`Error updating doc ${doc.id}:`, updateError);
        } else {
          results.push({
            docId: doc.id,
            fileName: fileUrls.map(f => f.fileName).join(', '),
            extractedLength: extractedText.length,
            metrics: extractedMetrics
          });
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

    // ACTION: Parse a single document
    if (action === 'parse-document' && documentId) {
      const { data: doc, error: fetchError } = await supabase
        .from('client_context')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !doc) {
        return new Response(JSON.stringify({ error: 'Document not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Similar parsing logic as above...
      let fileUrls: Array<{ fileName: string; fileUrl: string; fileType: string }> = [];
      try {
        fileUrls = typeof doc.source_file_url === 'string'
          ? JSON.parse(doc.source_file_url)
          : doc.source_file_url || [];
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid source_file_url' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let extractedText = '';
      const extractedMetrics: Record<string, any> = {};

      for (const file of fileUrls) {
        if (file.fileType === 'application/pdf') {
          try {
            const pdfResponse = await fetch(file.fileUrl);
            const pdfBuffer = await pdfResponse.arrayBuffer();
            const pdfData = new Uint8Array(pdfBuffer);

            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;

            let pdfText = `\n=== ${file.fileName} ===\n`;

            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              pdfText += `\n${pageText}`;
            }

            extractedText += pdfText;
            const metrics = extractFinancialMetrics(pdfText);
            Object.assign(extractedMetrics, metrics);

          } catch (pdfError) {
            console.error(`Error parsing ${file.fileName}:`, pdfError);
          }
        }
      }

      // Update document
      await supabase
        .from('client_context')
        .update({
          content: extractedText || doc.content,
          extracted_metrics: extractedMetrics,
          processed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      return new Response(JSON.stringify({
        success: true,
        extractedLength: extractedText.length,
        metrics: extractedMetrics,
        preview: extractedText.substring(0, 1000)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Parse document error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Extract financial metrics from text
function extractFinancialMetrics(text: string): Record<string, any> {
  const metrics: Record<string, any> = {};
  
  // Normalize text for pattern matching
  const normalized = text.replace(/\s+/g, ' ');
  
  // Helper to extract currency values
  const extractValue = (pattern: RegExp): number | null => {
    const match = normalized.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      return isNaN(value) ? null : value;
    }
    return null;
  };

  // Try multiple patterns for turnover/sales
  const turnoverPatterns = [
    /sales\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /turnover\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /revenue\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /total\s+(?:sales|revenue|turnover)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of turnoverPatterns) {
    const value = extractValue(pattern);
    if (value && value > 10000) {
      metrics.turnover = value;
      break;
    }
  }

  // Gross profit patterns
  const gpPatterns = [
    /gross\s+profit\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /gross\s+margin\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of gpPatterns) {
    const value = extractValue(pattern);
    if (value && value > 0) {
      metrics.gross_profit = value;
      break;
    }
  }

  // Net profit patterns
  const npPatterns = [
    /net\s+profit\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /profit\s+after\s+tax\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /profit\s+for\s+(?:the\s+)?year\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of npPatterns) {
    const value = extractValue(pattern);
    if (value !== null) {
      metrics.net_profit = value;
      break;
    }
  }

  // Cost of sales
  const cosPatterns = [
    /cost\s+of\s+sales\s+\(?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\)?/i,
    /materials\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of cosPatterns) {
    const value = extractValue(pattern);
    if (value && value > 0) {
      metrics.cost_of_sales = value;
      break;
    }
  }

  // Calculate gross margin if we have both turnover and gross profit
  if (metrics.turnover && metrics.gross_profit) {
    metrics.gross_margin_pct = Math.round((metrics.gross_profit / metrics.turnover) * 10000) / 100;
  }

  // Look for year indicators (e.g., "2025", "2024", "Year Ended 31 January 2025")
  const yearMatch = text.match(/(?:year\s+ended|for\s+(?:the\s+)?year)\s+\d{1,2}\s+\w+\s+(\d{4})/i);
  if (yearMatch) {
    metrics.year = parseInt(yearMatch[1]);
  }

  console.log('Extracted metrics:', metrics);
  return metrics;
}
