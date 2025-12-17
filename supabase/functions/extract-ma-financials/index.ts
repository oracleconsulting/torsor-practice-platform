// ============================================================================
// EDGE FUNCTION: extract-ma-financials
// ============================================================================
// Extracts structured financial data from uploaded management accounts PDFs
// Uses Claude to parse and structure the data
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// EXTRACTION PROMPT
// ============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are a financial data extraction specialist. Your job is to extract structured financial data from management accounts documents.

CRITICAL RULES:
1. Extract EXACT numbers from the document - never estimate or calculate
2. If a value is not present, use null
3. For percentages, extract as shown (e.g., 66.4 not 0.664)
4. For comparative documents, extract BOTH periods
5. Identify period end dates from headers/titles
6. Be precise - this data will be used for financial analysis

Return ONLY valid JSON matching the schema provided.`;

const EXTRACTION_USER_PROMPT = `Extract the financial data from this management accounts document.

Document content:
---
{DOCUMENT_TEXT}
---

Return a JSON object with this exact structure:

{
  "periods": [
    {
      "periodEndDate": "YYYY-MM-DD",
      "periodLabel": "e.g., May 2025",
      
      "revenue": number or null,
      "costOfSales": number or null,
      "grossProfit": number or null,
      "grossMarginPct": number or null,
      
      "staffCosts": number or null,
      "marketingCosts": number or null,
      "softwareCosts": number or null,
      "professionalFees": number or null,
      "rentUtilities": number or null,
      "otherOverheads": number or null,
      
      "operatingProfit": number or null,
      "operatingMarginPct": number or null,
      
      "interest": number or null,
      "netProfit": number or null,
      
      "bankBalance": number or null,
      "tradeDebtors": number or null,
      "otherCurrentAssets": number or null,
      
      "tradeCreditors": number or null,
      "vatPayable": number or null,
      "payeNicPayable": number or null,
      "corporationTaxPayable": number or null,
      "directorLoan": number or null,
      
      "netAssets": number or null,
      
      "debtorDays": number or null,
      "creditorDays": number or null
    }
  ],
  "isComparative": boolean,
  "extractionNotes": "Any notes about data quality or missing items"
}

If the document contains multiple periods (comparative), include all periods in the array, ordered from oldest to newest.

Return ONLY the JSON object, no other text.`;

// ============================================================================
// HELPER: Call Claude for extraction
// ============================================================================

async function extractWithClaude(
  documentBase64: string,
  mimeType: string
): Promise<any> {
  const messages: any[] = [];
  
  if (mimeType === 'application/pdf') {
    // Use vision capability for PDFs
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: EXTRACTION_USER_PROMPT.replace('{DOCUMENT_TEXT}', '[See attached PDF document]')
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: documentBase64
          }
        }
      ]
    });
  } else {
    // For text files, decode and use directly
    const text = atob(documentBase64);
    messages.push({
      role: 'user',
      content: EXTRACTION_USER_PROMPT.replace('{DOCUMENT_TEXT}', text)
    });
  }
  
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set');
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co',
      'X-Title': 'Torsor MA Extraction'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for precise extraction
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        ...messages
      ]
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${error}`);
  }
  
  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from Claude');
  }
  
  // Parse JSON
  let jsonString = content.trim();
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/```json?\s*/gi, '').replace(/```\s*$/g, '');
  }
  
  const start = jsonString.indexOf('{');
  const end = jsonString.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    jsonString = jsonString.substring(start, end + 1);
  }
  
  return JSON.parse(jsonString);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('[Extract] Function invoked');
    const body = await req.json();
    console.log('[Extract] Request body:', body);
    
    const { documentId, engagementId } = body;
    
    if (!documentId || !engagementId) {
      console.error('[Extract] Missing required parameters:', { documentId, engagementId });
      return new Response(
        JSON.stringify({ error: 'documentId and engagementId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Extract] Missing Supabase configuration');
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`[Extract] Starting extraction for document ${documentId}, engagement ${engagementId}`);
    
    // Update status to processing
    await supabase
      .from('ma_uploaded_documents')
      .update({ extraction_status: 'processing' })
      .eq('id', documentId);
    
    // Get document info
    const { data: document, error: docError } = await supabase
      .from('ma_uploaded_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }
    
    // Download and prepare document
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('ma-documents')
      .download(document.file_path);
    
    if (downloadError) {
      throw new Error(`Failed to download: ${downloadError.message}`);
    }
    
    // Convert to base64 for PDF processing
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes) as any));
    
    // Extract data using Claude
    console.log(`[Extract] Calling Claude for extraction...`);
    const extractedData = await extractWithClaude(base64, document.file_type);
    console.log(`[Extract] Extraction complete, found ${extractedData.periods?.length || 0} periods`);
    
    // Store extracted financials
    const insertedIds: string[] = [];
    let comparisonId: string | null = null;
    
    for (const period of extractedData.periods || []) {
      // Calculate derived fields
      const totalOverheads = (period.staffCosts || 0) + 
        (period.marketingCosts || 0) + 
        (period.softwareCosts || 0) + 
        (period.professionalFees || 0) + 
        (period.rentUtilities || 0) + 
        (period.otherOverheads || 0);
      
      const staffCostPct = period.revenue ? 
        ((period.staffCosts || 0) / period.revenue * 100) : null;
      
      const { data: inserted, error: insertError } = await supabase
        .from('ma_extracted_financials')
        .upsert({
          document_id: documentId,
          engagement_id: engagementId,
          period_end_date: period.periodEndDate,
          period_label: period.periodLabel,
          
          revenue: period.revenue,
          cost_of_sales: period.costOfSales,
          gross_profit: period.grossProfit,
          gross_margin_pct: period.grossMarginPct,
          
          staff_costs: period.staffCosts,
          marketing_costs: period.marketingCosts,
          software_costs: period.softwareCosts,
          professional_fees: period.professionalFees,
          rent_utilities: period.rentUtilities,
          other_overheads: period.otherOverheads,
          total_overheads: totalOverheads,
          
          operating_profit: period.operatingProfit,
          operating_margin_pct: period.operatingMarginPct,
          
          interest: period.interest,
          net_profit: period.netProfit,
          
          bank_balance: period.bankBalance,
          trade_debtors: period.tradeDebtors,
          other_current_assets: period.otherCurrentAssets,
          
          trade_creditors: period.tradeCreditors,
          vat_payable: period.vatPayable,
          paye_nic_payable: period.payeNicPayable,
          corporation_tax_payable: period.corporationTaxPayable,
          director_loan: period.directorLoan,
          
          net_assets: period.netAssets,
          debtor_days: period.debtorDays,
          creditor_days: period.creditorDays,
          staff_cost_pct: staffCostPct,
          
          extraction_confidence: 0.95
        }, { onConflict: 'document_id,period_end_date' })
        .select('id')
        .single();
      
      if (insertError) {
        console.error(`[Extract] Insert error:`, insertError);
        throw new Error(`Failed to store extracted data: ${insertError.message}`);
      }
      
      insertedIds.push(inserted.id);
    }
    
    // Calculate period comparison if we have 2 periods
    if (insertedIds.length >= 2 && extractedData.isComparative) {
      const periods = extractedData.periods;
      const current = periods[periods.length - 1];
      const prior = periods[periods.length - 2];
      
      const revenueChange = (current.revenue || 0) - (prior.revenue || 0);
      const revenueChangePct = prior.revenue ? 
        ((current.revenue - prior.revenue) / prior.revenue * 100) : null;
      
      const operatingProfitChange = (current.operatingProfit || 0) - (prior.operatingProfit || 0);
      const operatingMarginChangePp = (current.operatingMarginPct || 0) - (prior.operatingMarginPct || 0);
      
      const staffCostsChange = (current.staffCosts || 0) - (prior.staffCosts || 0);
      const staffCostsChangePct = prior.staffCosts ? 
        ((current.staffCosts - prior.staffCosts) / prior.staffCosts * 100) : null;
      
      const otherOverheadsChange = (current.otherOverheads || 0) - (prior.otherOverheads || 0);
      const otherOverheadsChangePct = prior.otherOverheads ? 
        ((current.otherOverheads - prior.otherOverheads) / prior.otherOverheads * 100) : null;
      
      const { data: comparison } = await supabase
        .from('ma_period_comparisons')
        .insert({
          engagement_id: engagementId,
          current_period_id: insertedIds[insertedIds.length - 1],
          prior_period_id: insertedIds[insertedIds.length - 2],
          comparison_type: 'mom',
          
          revenue_change: revenueChange,
          revenue_change_pct: revenueChangePct,
          
          operating_profit_change: operatingProfitChange,
          operating_margin_change_pp: operatingMarginChangePp,
          
          cash_change: (current.bankBalance || 0) - (prior.bankBalance || 0),
          
          staff_costs_change: staffCostsChange,
          staff_costs_change_pct: staffCostsChangePct,
          
          other_overheads_change: otherOverheadsChange,
          other_overheads_change_pct: otherOverheadsChangePct
        })
        .select('id')
        .single();
      
      if (comparison) {
        comparisonId = comparison.id;
      }
    }
    
    // Update document status
    const latestPeriod = extractedData.periods?.[extractedData.periods.length - 1];
    await supabase
      .from('ma_uploaded_documents')
      .update({
        extraction_status: 'completed',
        extracted_at: new Date().toISOString(),
        period_end: latestPeriod?.periodEndDate,
        is_comparative: extractedData.isComparative
      })
      .eq('id', documentId);
    
    // Get the true cash calculation that was auto-generated
    const { data: trueCash } = await supabase
      .from('ma_true_cash_calculations')
      .select('id')
      .eq('extracted_financials_id', insertedIds[insertedIds.length - 1])
      .single();
    
    console.log(`[Extract] Complete. Extracted ${insertedIds.length} periods, True Cash ID: ${trueCash?.id}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        extractedIds: insertedIds,
        comparisonId,
        trueCashId: trueCash?.id,
        periodsFound: extractedData.periods?.length || 0,
        isComparative: extractedData.isComparative
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('[Extract] Error:', error);
    
    // Update document status to failed
    try {
      const { documentId } = await req.json();
      if (documentId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await supabase
          .from('ma_uploaded_documents')
          .update({ 
            extraction_status: 'failed',
            extraction_error: error.message
          })
          .eq('id', documentId);
      }
    } catch (updateError) {
      console.error('[Extract] Failed to update error status:', updateError);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

