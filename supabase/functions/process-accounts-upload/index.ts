import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Note: No PDF library - Deno edge functions don't support Node.js fs module
// We use pure text extraction + LLM analysis instead

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
  revenue_per_employee?: number;
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

    // Extract financial data based on file type
    let extractedYears: ExtractedFinancialData[] = [];
    
    if (upload.file_type === 'pdf') {
      // Use Claude Vision to read PDF directly - handles multi-year documents
      console.log('[Accounts Process] Using Vision API for PDF extraction...');
      extractedYears = await extractFromPDFWithVision(fileData, upload.fiscal_year, openrouterKey);
    } else {
      // For CSV/Excel, extract text and use LLM
      let extractedText = '';
      if (upload.file_type === 'csv') {
        extractedText = await fileData.text();
      } else if (['xlsx', 'xls'].includes(upload.file_type)) {
        extractedText = await extractTextFromExcel(fileData);
      }
      
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Could not extract sufficient text from file.');
      }
      
      console.log(`[Accounts Process] Extracted ${extractedText.length} characters of text`);
      console.log(`[Accounts Process] Text preview: ${extractedText.slice(0, 500)}...`);
      
      // Extract all years from the document
      extractedYears = await extractFinancialDataWithLLM(extractedText, upload.fiscal_year, openrouterKey);
    }

    console.log(`[Accounts Process] Extraction complete, found ${extractedYears.length} year(s) of data`);

    // Process each year of data
    const savedRecords: any[] = [];
    
    for (const financialData of extractedYears) {
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
      
      console.log(`[Accounts Process] Saving FY${financialData.fiscal_year}: Revenue £${financialData.revenue?.toLocaleString()}, Confidence ${financialData.confidence}`);
      
      // Save to database (upsert by client_id + fiscal_year)
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
        console.error(`[Accounts Process] Save error for FY${financialData.fiscal_year}:`, saveError);
      } else {
        savedRecords.push(savedData);
      }
    }
    
    // Use the most recent year for the upload record summary
    const latestYear = extractedYears.sort((a, b) => (b.fiscal_year || 0) - (a.fiscal_year || 0))[0];

    // Update upload record with summary of extraction
    await supabase
      .from('client_accounts_uploads')
      .update({
        status: 'extracted',
        processing_completed_at: new Date().toISOString(),
        fiscal_year: latestYear.fiscal_year,
        fiscal_year_end: latestYear.fiscal_year_end,
        extraction_confidence: latestYear.confidence,
        raw_extraction: { years: extractedYears }
      })
      .eq('id', uploadId);

    console.log(`[Accounts Process] Processing complete for upload ${uploadId} - ${savedRecords.length} year(s) saved`);

    return new Response(
      JSON.stringify({
        success: true,
        uploadId,
        yearsExtracted: extractedYears.length,
        savedRecords: savedRecords.length,
        fiscalYears: extractedYears.map(y => y.fiscal_year),
        latestYear: {
          fiscalYear: latestYear.fiscal_year,
          revenue: latestYear.revenue,
          grossProfit: latestYear.gross_profit,
          netProfit: latestYear.net_profit,
          confidence: latestYear.confidence
        },
        notes: latestYear.notes
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

// Extract financial data from PDF using pure text extraction
// Note: Deno edge functions don't support Node.js fs module, so no PDF libraries work
// We use custom text extraction + LLM analysis instead
async function extractFromPDFWithVision(
  fileBlob: Blob,
  hintYear: number | null,
  apiKey: string
): Promise<ExtractedFinancialData[]> {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  
  console.log('[PDF Extract] Using pure text extraction (no external libraries)...');
  
  // Extract text using our custom methods that work in Deno
  const extractedText = await extractTextFromPDFAdvanced(buffer);
  
  console.log(`[PDF Extract] Extracted ${extractedText?.length || 0} characters`);
  
  if (extractedText && extractedText.length > 100) {
    console.log('[PDF Extract] Preview:', extractedText.substring(0, 500));
  }
  
  // Check if we got meaningful text
  if (extractedText && extractedText.length > 100) {
    // Check for financial terms to ensure it's not garbage
    const hasFinancialTerms = /revenue|turnover|profit|loss|assets|debtors|creditors|£|\d{3},?\d{3}/i.test(extractedText);
    
    if (hasFinancialTerms || extractedText.length > 500) {
      console.log('[PDF Extract] Sending extracted text to Claude for analysis...');
      return await extractFinancialDataFromText(extractedText, hintYear, apiKey);
    }
  }
  
  // If text extraction failed, provide helpful error
  console.log('[PDF Extract] Insufficient text extracted from PDF');
  throw new Error(
    'Unable to extract readable text from this PDF. The file may be scanned, image-based, or use complex encoding. ' +
    'Please try: 1) Export your accounts as CSV or Excel instead, or 2) Enter the financial data manually using the review screen.'
  );
}

// Advanced PDF text extraction - handles more PDF structures
// Works in Deno edge functions without Node.js dependencies
async function extractTextFromPDFAdvanced(bytes: Uint8Array): Promise<string> {
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(bytes);
  
  const extractedParts: string[] = [];
  
  console.log('[PDF Text] Scanning PDF structure...');
  
  // Method 1: Try to decompress FlateDecode streams (most common PDF compression)
  const streamRegex = /\/FlateDecode[\s\S]*?stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  let decompressedCount = 0;
  
  while ((match = streamRegex.exec(content)) !== null) {
    try {
      // Get raw bytes for this stream
      const streamStart = match.index + match[0].indexOf('stream') + 7; // skip "stream\n"
      const streamEnd = match.index + match[0].lastIndexOf('endstream') - 1;
      const streamBytes = bytes.slice(streamStart, streamEnd);
      
      // Try to decompress using DecompressionStream (available in Deno)
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(streamBytes);
      writer.close();
      
      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      // Combine and decode
      const decompressed = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }
      
      const text = new TextDecoder('latin1').decode(decompressed);
      
      // Extract text from decompressed content
      const textOps = text.match(/\((.*?)\)\s*Tj/g);
      if (textOps) {
        for (const op of textOps) {
          const t = op.replace(/\((.*?)\)\s*Tj/, '$1');
          if (t.length > 1) extractedParts.push(t);
        }
        decompressedCount++;
      }
      
      // Also look for TJ arrays
      const tjOps = text.match(/\[(.*?)\]\s*TJ/g);
      if (tjOps) {
        for (const op of tjOps) {
          const strings = op.match(/\(([^)]*)\)/g);
          if (strings) {
            const combined = strings.map(s => s.slice(1, -1)).join('');
            if (combined.length > 1) extractedParts.push(combined);
          }
        }
      }
    } catch {
      // Decompression failed - stream may not be deflate or is corrupted
    }
  }
  
  console.log(`[PDF Text] Decompressed ${decompressedCount} streams`);
  
  // Method 2: Extract text objects directly (Tj operator)
  const textMatches = content.match(/\((.*?)\)\s*Tj/g);
  if (textMatches) {
    for (const m of textMatches) {
      const text = m.replace(/\((.*?)\)\s*Tj/, '$1');
      if (text.length > 1) extractedParts.push(text);
    }
  }
  
  // Method 3: Extract TJ arrays (multiple text strings)
  const tjArrays = content.match(/\[(.*?)\]\s*TJ/g);
  if (tjArrays) {
    for (const arr of tjArrays) {
      const strings = arr.match(/\((.*?)\)/g);
      if (strings) {
        const combined = strings.map(s => s.slice(1, -1)).join('');
        if (combined.length > 1) extractedParts.push(combined);
      }
    }
  }
  
  // Method 4: Extract literal strings (useful for metadata and simple text)
  const stringMatches = content.match(/\(([^)]{3,100})\)/g);
  if (stringMatches) {
    for (const m of stringMatches) {
      const str = m.slice(1, -1);
      // Decode PDF escape sequences
      const decoded = str
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (/[a-zA-Z]{2,}|[\d,]{3,}/.test(decoded) && !/^[\\x]/.test(decoded)) {
        extractedParts.push(decoded);
      }
    }
  }
  
  // Method 5: Look for readable text in uncompressed streams
  const uncompressedStreams = content.match(/stream\r?\n([\s\S]{50,}?)\r?\nendstream/g);
  if (uncompressedStreams) {
    for (const stream of uncompressedStreams) {
      const readable = stream
        .replace(/stream\r?\n/, '')
        .replace(/\r?\nendstream/, '')
        .replace(/[^\x20-\x7E\r\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Look for financial keywords
      if (readable.length > 50 && 
          /revenue|turnover|profit|loss|assets|liabilities|balance|cash|debtors|creditors|£|\d{3},\d{3}/i.test(readable)) {
        extractedParts.push(readable);
      }
    }
  }
  
  console.log(`[PDF Text] Found ${extractedParts.length} text segments`);
  
  // Clean up and dedupe
  const result = extractedParts.join('\n');
  const lines = result.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2)
    .filter((l, i, arr) => arr.indexOf(l) === i);
  
  return lines.join('\n');
}

// Extract financial data from text using Claude
async function extractFinancialDataFromText(
  text: string,
  hintYear: number | null,
  apiKey: string
): Promise<ExtractedFinancialData[]> {
  const yearHint = hintYear ? `The user indicated this is for fiscal year ${hintYear}.` : '';
  
  const prompt = `Extract financial data from these statutory accounts/financial statements.

${yearHint}

TEXT CONTENT:
${text.substring(0, 15000)}

EXTRACT FOR EACH FISCAL YEAR:
- fiscal_year: Year (number)
- fiscal_year_end: Date string (e.g., "2024-12-31")
- revenue: Turnover/sales
- cost_of_sales: Cost of sales/direct costs
- gross_profit: Gross profit
- operating_expenses: Total overheads
- ebitda: EBITDA or calculate from operating profit + depreciation
- depreciation: Depreciation charge
- net_profit: Net profit/loss after tax
- debtors: Trade debtors/receivables
- creditors: Trade creditors/payables
- cash: Cash at bank
- fixed_assets: Tangible/fixed assets
- net_assets: Net assets/shareholders funds
- confidence: 0.0-1.0 based on data clarity

RESPOND WITH JSON ARRAY ONLY:
[{"fiscal_year": 2024, "revenue": 610000, ...}, {"fiscal_year": 2025, ...}]

Use null for missing values. Include notes array explaining any calculations.`;

  console.log('[Text Extract] Sending to Claude for analysis...');
  
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
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Text Extract] API error:', response.status, errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Claude');
  }

  console.log('[Text Extract] Response received');
  return parseFinancialJson(content);
}

// Parse JSON response from LLM
function parseFinancialJson(content: string): ExtractedFinancialData[] {
  try {
    // Try to extract JSON from markdown code blocks or raw
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, content];
    const jsonStr = jsonMatch[1] || content;
    
    // Clean up common issues
    const cleaned = jsonStr
      .trim()
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
    
    const parsed = JSON.parse(cleaned);
    
    // Ensure it's an array
    const years = Array.isArray(parsed) ? parsed : [parsed];
    
    // Ensure each year has required fields
    return years.map(year => ({
      fiscal_year: year.fiscal_year || new Date().getFullYear(),
      fiscal_year_end: year.fiscal_year_end,
      revenue: year.revenue || year.turnover,
      cost_of_sales: year.cost_of_sales,
      gross_profit: year.gross_profit,
      gross_margin_pct: year.gross_margin_pct,
      operating_expenses: year.operating_expenses || year.overheads,
      ebitda: year.ebitda,
      ebitda_margin_pct: year.ebitda_margin_pct,
      depreciation: year.depreciation,
      amortisation: year.amortisation,
      interest_paid: year.interest_paid || year.interest,
      tax: year.tax || year.corporation_tax,
      net_profit: year.net_profit || year.profit_after_tax,
      net_margin_pct: year.net_margin_pct,
      debtors: year.debtors || year.trade_debtors || year.receivables,
      creditors: year.creditors || year.trade_creditors || year.payables,
      cash: year.cash || year.cash_at_bank,
      fixed_assets: year.fixed_assets || year.tangible_assets,
      net_assets: year.net_assets || year.shareholders_funds,
      confidence: year.confidence || 0.7,
      notes: year.notes || []
    }));
    
  } catch (parseError) {
    console.error('[Parse] Failed to parse JSON:', content.substring(0, 500));
    throw new Error('Failed to parse financial data from response');
  }
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
): Promise<ExtractedFinancialData[]> {
  
  const currentYear = new Date().getFullYear();
  const yearHint = hintYear ? `The user indicated this may be for fiscal year ${hintYear}, but check for all years present.` : '';
  
  const prompt = `You are a financial data extraction specialist. Extract key financial metrics from these company accounts.

IMPORTANT: This document may contain MULTIPLE YEARS of data (e.g., columns for YE 2024 and YE 2025, or comparative figures).
You MUST extract ALL years present, not just the most recent.

${yearHint}

For EACH YEAR found, extract these metrics (use null if not found, numbers only - no currency symbols):

REQUIRED - P&L:
- fiscal_year: The year these accounts cover (e.g., 2024, 2025)
- fiscal_year_end: End date if visible (e.g., "2024-03-31")
- revenue: Total revenue/turnover
- cost_of_sales: Direct costs / cost of sales (as positive number)
- gross_profit: Revenue minus cost of sales
- operating_expenses: Total of all operating/admin costs (as positive number)
- ebitda: Earnings before interest, tax, depreciation, amortisation (calculate: operating_profit + depreciation)
- depreciation: Depreciation charge (as positive number)
- amortisation: Amortisation charge
- interest_paid: Interest expense (as positive number)
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

Also provide for each year:
- confidence: 0.0 to 1.0 based on how clearly you could extract the data
- notes: Array of strings noting any issues, assumptions, or items that need verification

RESPOND IN VALID JSON ONLY - RETURN AN ARRAY with one object per year:
{
  "years": [
    {
      "fiscal_year": 2024,
      "fiscal_year_end": "2024-12-31",
      "revenue": 610000,
      "cost_of_sales": 212000,
      "gross_profit": 398000,
      "operating_expenses": 402000,
      "ebitda": 12000,
      "depreciation": 16000,
      "net_profit": -24000,
      "confidence": 0.9,
      "notes": ["Company made a loss this year"]
    },
    {
      "fiscal_year": 2025,
      "fiscal_year_end": "2025-12-31",
      "revenue": 780000,
      "cost_of_sales": 274000,
      "gross_profit": 506000,
      "operating_expenses": 509000,
      "ebitda": 15000,
      "depreciation": 18000,
      "net_profit": -25500,
      "confidence": 0.9,
      "notes": ["Company made a loss this year"]
    }
  ]
}

NOTE: If data only exists for a single year, still return it in the "years" array format.

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
    
    // Handle both array format and single object format
    let years: ExtractedFinancialData[] = [];
    
    if (parsed.years && Array.isArray(parsed.years)) {
      // New multi-year format
      years = parsed.years;
    } else if (Array.isArray(parsed)) {
      // Direct array
      years = parsed;
    } else {
      // Single object (legacy format)
      years = [parsed];
    }
    
    // Validate and clean each year
    for (const yearData of years) {
      if (!yearData.fiscal_year) {
        yearData.fiscal_year = hintYear || currentYear;
        yearData.notes = yearData.notes || [];
        yearData.notes.push('Fiscal year not found in document - using provided/current year');
      }
      
      if (yearData.confidence === undefined) {
        yearData.confidence = 0.5;
      }
      
      // Ensure cost_of_sales and expenses are stored as positive numbers for calculations
      if (yearData.cost_of_sales && yearData.cost_of_sales < 0) {
        yearData.cost_of_sales = Math.abs(yearData.cost_of_sales);
      }
      if (yearData.operating_expenses && yearData.operating_expenses < 0) {
        yearData.operating_expenses = Math.abs(yearData.operating_expenses);
      }
    }
    
    console.log(`[LLM Parse] Extracted ${years.length} year(s): ${years.map(y => `FY${y.fiscal_year}`).join(', ')}`);
    
    return years as ExtractedFinancialData[];
    
  } catch (parseError) {
    console.error('[LLM Parse] Failed to parse response:', content);
    throw new Error('Failed to parse financial data from document');
  }
}

