import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  uploadId: string;
}

interface ExtractedFinancialData {
  fiscal_year: number;
  fiscal_year_end?: string;
  period_months?: number;
  revenue?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  gross_margin_pct?: number;
  operating_expenses?: number;
  ebitda?: number;
  ebitda_margin_pct?: number;
  depreciation?: number;
  amortisation?: number;
  interest_paid?: number;
  tax?: number;
  net_profit?: number;
  net_margin_pct?: number;
  total_assets?: number;
  current_assets?: number;
  fixed_assets?: number;
  total_liabilities?: number;
  current_liabilities?: number;
  long_term_liabilities?: number;
  net_assets?: number;
  debtors?: number;
  creditors?: number;
  stock?: number;
  cash?: number;
  debtor_days?: number;
  creditor_days?: number;
  employee_count?: number;
  confidence: number;
  notes: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: ProcessRequest = await req.json();
    const { uploadId } = body;

    console.log(`[Accounts Process] Starting processing for upload ${uploadId}`);

    // Get upload record
    const { data: upload, error: uploadError } = await supabase
      .from('client_accounts_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (uploadError || !upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }

    // Update status to processing
    await supabase
      .from('client_accounts_uploads')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', uploadId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('client-accounts')
      .download(upload.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log(`[Accounts Process] File downloaded, size: ${fileData.size} bytes`);

    // Extract text based on file type
    let extractedText = '';
    
    if (upload.file_type === 'pdf') {
      extractedText = await extractTextFromPDF(fileData);
    } else if (upload.file_type === 'csv') {
      extractedText = await fileData.text();
    } else if (['xlsx', 'xls'].includes(upload.file_type)) {
      extractedText = await extractTextFromExcel(fileData);
    }

    if (!extractedText || extractedText.length < 100) {
      throw new Error('Could not extract sufficient text from file. Please ensure the file contains readable financial data.');
    }

    console.log(`[Accounts Process] Extracted ${extractedText.length} characters of text`);

    // Use LLM to extract financial data
    const financialData = await extractFinancialDataWithLLM(
      extractedText, 
      upload.fiscal_year,
      openrouterKey
    );

    console.log(`[Accounts Process] LLM extraction complete, confidence: ${financialData.confidence}`);

    // Calculate derived metrics
    if (financialData.revenue && financialData.gross_profit) {
      financialData.gross_margin_pct = Number(((financialData.gross_profit / financialData.revenue) * 100).toFixed(1));
    }
    if (financialData.revenue && financialData.ebitda) {
      financialData.ebitda_margin_pct = Number(((financialData.ebitda / financialData.revenue) * 100).toFixed(1));
    }
    if (financialData.revenue && financialData.net_profit) {
      financialData.net_margin_pct = Number(((financialData.net_profit / financialData.revenue) * 100).toFixed(1));
    }
    if (financialData.revenue && financialData.employee_count && financialData.employee_count > 0) {
      financialData.revenue_per_employee = Math.round(financialData.revenue / financialData.employee_count);
    }
    if (financialData.revenue && financialData.debtors) {
      financialData.debtor_days = Math.round((financialData.debtors / financialData.revenue) * 365);
    }
    if (financialData.cost_of_sales && financialData.creditors) {
      financialData.creditor_days = Math.round((financialData.creditors / financialData.cost_of_sales) * 365);
    }

    // Store extracted data
    const { data: savedData, error: saveError } = await supabase
      .from('client_financial_data')
      .upsert({
        client_id: upload.client_id,
        practice_id: upload.practice_id,
        upload_id: uploadId,
        fiscal_year: financialData.fiscal_year,
        fiscal_year_end: financialData.fiscal_year_end,
        period_months: financialData.period_months || 12,
        revenue: financialData.revenue,
        cost_of_sales: financialData.cost_of_sales,
        gross_profit: financialData.gross_profit,
        gross_margin_pct: financialData.gross_margin_pct,
        operating_expenses: financialData.operating_expenses,
        ebitda: financialData.ebitda,
        ebitda_margin_pct: financialData.ebitda_margin_pct,
        depreciation: financialData.depreciation,
        amortisation: financialData.amortisation,
        interest_paid: financialData.interest_paid,
        tax: financialData.tax,
        net_profit: financialData.net_profit,
        net_margin_pct: financialData.net_margin_pct,
        total_assets: financialData.total_assets,
        current_assets: financialData.current_assets,
        fixed_assets: financialData.fixed_assets,
        total_liabilities: financialData.total_liabilities,
        current_liabilities: financialData.current_liabilities,
        long_term_liabilities: financialData.long_term_liabilities,
        net_assets: financialData.net_assets,
        debtors: financialData.debtors,
        creditors: financialData.creditors,
        stock: financialData.stock,
        cash: financialData.cash,
        debtor_days: financialData.debtor_days,
        creditor_days: financialData.creditor_days,
        employee_count: financialData.employee_count,
        revenue_per_employee: financialData.revenue_per_employee,
        data_source: 'upload',
        confidence_score: financialData.confidence,
        notes: financialData.notes?.join('\n') || null
      }, {
        onConflict: 'client_id,fiscal_year'
      })
      .select()
      .single();

    if (saveError) {
      console.error(`[Accounts Process] Save error:`, saveError);
      throw saveError;
    }

    // Update upload record
    await supabase
      .from('client_accounts_uploads')
      .update({
        status: 'extracted',
        processing_completed_at: new Date().toISOString(),
        fiscal_year: financialData.fiscal_year,
        fiscal_year_end: financialData.fiscal_year_end,
        extraction_confidence: financialData.confidence,
        raw_extraction: financialData
      })
      .eq('id', uploadId);

    console.log(`[Accounts Process] Processing complete for upload ${uploadId}`);

    return new Response(
      JSON.stringify({
        success: true,
        uploadId,
        financialDataId: savedData?.id,
        fiscalYear: financialData.fiscal_year,
        confidence: financialData.confidence,
        notes: financialData.notes,
        extractedMetrics: {
          revenue: financialData.revenue,
          gross_margin_pct: financialData.gross_margin_pct,
          ebitda_margin_pct: financialData.ebitda_margin_pct,
          net_margin_pct: financialData.net_margin_pct,
          debtor_days: financialData.debtor_days,
          employee_count: financialData.employee_count
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[Accounts Process] Error:`, error);

    // Update upload with error status
    const body: ProcessRequest = await req.json().catch(() => ({ uploadId: '' }));
    if (body.uploadId) {
      await supabase
        .from('client_accounts_uploads')
        .update({
          status: 'failed',
          processing_completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', body.uploadId);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Processing failed' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Extract text from PDF using basic parsing
// Note: For production, consider using a dedicated PDF parsing service
async function extractTextFromPDF(fileBlob: Blob): Promise<string> {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Convert to string and try to extract readable text
  // This is a simplified approach - PDFs with complex encoding may need external service
  let text = '';
  
  // Try to find text streams in PDF
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(bytes);
  
  // Extract text between stream markers (simplified)
  const streamMatches = content.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
  if (streamMatches) {
    for (const match of streamMatches) {
      // Try to decode content
      const streamContent = match.replace(/stream[\r\n]+/, '').replace(/[\r\n]+endstream/, '');
      // Filter to printable characters
      const printable = streamContent.replace(/[^\x20-\x7E\r\n]/g, ' ').trim();
      if (printable.length > 50) {
        text += printable + '\n';
      }
    }
  }
  
  // Also try to find literal strings
  const stringMatches = content.match(/\(([^)]{10,})\)/g);
  if (stringMatches) {
    for (const match of stringMatches) {
      const str = match.slice(1, -1);
      if (str.length > 10 && /[a-zA-Z]/.test(str)) {
        text += str + '\n';
      }
    }
  }

  // If we couldn't extract much text, the PDF might need OCR
  if (text.length < 200) {
    console.warn('[PDF Extract] Limited text extracted - PDF may require OCR');
    text = `[Limited text extraction - PDF may be scanned/image-based]\n${text}`;
  }

  return text;
}

// Extract text from Excel files
async function extractTextFromExcel(fileBlob: Blob): Promise<string> {
  // For XLSX files, they're actually ZIP archives with XML inside
  // This is a simplified extraction - for production, use a proper XLSX library
  
  const arrayBuffer = await fileBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Try to find XML content (XLSX is a ZIP of XML files)
  const decoder = new TextDecoder('utf-8');
  const content = decoder.decode(bytes);
  
  // Extract any numbers and text that look financial
  const lines: string[] = [];
  
  // Look for patterns like "Revenue: 750000" or numeric patterns
  const patterns = [
    /(?:revenue|turnover|sales)[\s:]+[\£\$]?[\d,]+/gi,
    /(?:profit|loss|ebitda|margin)[\s:]+[\£\$]?[\d,]+/gi,
    /(?:cost|expense|overhead)[\s:]+[\£\$]?[\d,]+/gi,
    /(?:asset|liability|debtor|creditor)[\s:]+[\£\$]?[\d,]+/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      lines.push(...matches);
    }
  }
  
  // Also try to extract from XML tags
  const valueMatches = content.match(/<v>(\d+\.?\d*)<\/v>/g);
  if (valueMatches) {
    lines.push('Numeric values found: ' + valueMatches.slice(0, 50).join(', '));
  }

  return lines.join('\n') || 'Could not extract structured data from Excel file';
}

// Use LLM to extract structured financial data
async function extractFinancialDataWithLLM(
  documentText: string,
  hintYear: number | null,
  apiKey: string
): Promise<ExtractedFinancialData> {
  
  const currentYear = new Date().getFullYear();
  const yearHint = hintYear ? `The user indicated this is for fiscal year ${hintYear}.` : '';
  
  const prompt = `You are a financial data extraction specialist. Extract key financial metrics from these company accounts.

${yearHint}

EXTRACT THESE METRICS (use null if not found, numbers only - no currency symbols):

REQUIRED - P&L:
- fiscal_year: The year these accounts cover (e.g., 2024)
- fiscal_year_end: End date if visible (e.g., "2024-03-31")
- revenue: Total revenue/turnover
- cost_of_sales: Direct costs / cost of sales
- gross_profit: Revenue minus cost of sales
- operating_expenses: Administrative/operating expenses
- ebitda: Earnings before interest, tax, depreciation, amortisation (calculate if needed)
- depreciation: Depreciation charge
- amortisation: Amortisation charge
- interest_paid: Interest expense
- tax: Tax charge
- net_profit: Profit after tax

BALANCE SHEET (if available):
- debtors: Trade debtors / receivables
- creditors: Trade creditors / payables  
- cash: Cash and cash equivalents
- current_assets: Total current assets
- current_liabilities: Total current liabilities
- fixed_assets: Fixed/non-current assets
- net_assets: Total net assets

OTHER:
- employee_count: Number of employees (often in notes)

Also provide:
- confidence: 0.0 to 1.0 based on how clearly you could extract the data
- notes: Array of strings noting any issues, assumptions, or items that need verification

RESPOND IN VALID JSON ONLY. Example:
{
  "fiscal_year": 2024,
  "fiscal_year_end": "2024-03-31",
  "revenue": 750000,
  "cost_of_sales": 450000,
  "gross_profit": 300000,
  "operating_expenses": 210000,
  "ebitda": 90000,
  "depreciation": 15000,
  "amortisation": 5000,
  "interest_paid": 8000,
  "tax": 12000,
  "net_profit": 50000,
  "debtors": 85000,
  "creditors": 42000,
  "cash": 35000,
  "current_assets": 150000,
  "current_liabilities": 80000,
  "fixed_assets": 120000,
  "net_assets": 190000,
  "employee_count": 8,
  "confidence": 0.85,
  "notes": ["Employee count estimated from wage costs", "EBITDA calculated from operating profit + D&A"]
}

DOCUMENT TEXT:
${documentText.slice(0, 15000)}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://torsor.io",
      "X-Title": "Torsor Accounts Processing"
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from LLM');
  }

  // Parse JSON response
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, content];
    const jsonStr = jsonMatch[1] || content;
    const parsed = JSON.parse(jsonStr.trim());
    
    // Ensure required fields
    if (!parsed.fiscal_year) {
      parsed.fiscal_year = hintYear || currentYear;
      parsed.notes = parsed.notes || [];
      parsed.notes.push('Fiscal year not found in document - using provided/current year');
    }
    
    if (parsed.confidence === undefined) {
      parsed.confidence = 0.5;
    }
    
    return parsed as ExtractedFinancialData;
    
  } catch (parseError) {
    console.error('[LLM Parse] Failed to parse response:', content);
    throw new Error('Failed to parse financial data from document');
  }
}

