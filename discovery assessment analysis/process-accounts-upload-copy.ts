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
  staff_costs?: number;
  directors_remuneration?: number;
  operating_profit?: number;
  confidence: number;
  notes: string[];
}

// ─── Structured CSV parsing (multi-year financial tables) ───────────────────
const METRIC_LABELS: { patterns: RegExp[]; field: keyof ExtractedFinancialData }[] = [
  { patterns: [/^revenue$|^turnover$|^sales$|^total\s+income$|^total\s+turnover$|^revenue\s*\(/i], field: 'revenue' },
  { patterns: [/^cost\s+of\s+sales$|^direct\s+costs$|^cost\s+of\s+goods\s+sold$|^total\s+cost\s+of\s+sales$/i], field: 'cost_of_sales' },
  { patterns: [/^gross\s+profit$/i], field: 'gross_profit' },
  { patterns: [/^operating\s+expenses$|^admin\s+expenses$|^overheads$|^total\s+expenses$|^total\s+administrative\s+costs$/i], field: 'operating_expenses' },
  { patterns: [/^ebitda$|^operating\s+profit$/i], field: 'ebitda' },
  { patterns: [/^depreciation$/i], field: 'depreciation' },
  { patterns: [/^amortisation$/i], field: 'amortisation' },
  { patterns: [/^interest$|^interest\s+paid$/i], field: 'interest_paid' },
  { patterns: [/^tax$|^corporation\s+tax$/i], field: 'tax' },
  { patterns: [/^net\s+profit$|^profit\s+after\s+tax$|^pat$|^profit\s+for\s+the\s+year$|^current\s+year\s+earnings$/i], field: 'net_profit' },
  { patterns: [/^debtors$|^trade\s+debtors$|^receivables$|^accounts\s+receivable$/i], field: 'debtors' },
  { patterns: [/^creditors$|^trade\s+creditors$|^payables$|^accounts\s+payable$/i], field: 'creditors' },
  { patterns: [/^cash$|^cash\s+at\s+bank$|^total\s+cash$|^cash\s+position$/i], field: 'cash' },
  { patterns: [/^current\s+assets$|^total\s+current\s+assets$/i], field: 'current_assets' },
  { patterns: [/^fixed\s+assets$|^tangible\s+assets$|^net\s+fixed\s+assets$/i], field: 'fixed_assets' },
  { patterns: [/^total\s+assets$/i], field: 'total_assets' },
  { patterns: [/^current\s+liabilities$|^total\s+current\s+liabilities$/i], field: 'current_liabilities' },
  { patterns: [/^total\s+liabilities$/i], field: 'total_liabilities' },
  { patterns: [/^net\s+assets$|^shareholders?\s+funds?$|^total\s+equity$/i], field: 'net_assets' },
  { patterns: [/^employees?$|^employee\s+count$/i], field: 'employee_count' },
  { patterns: [/^stock$|^inventory$/i], field: 'stock' },
  { patterns: [/^staff\s+costs\s+total$|^total\s+staff\s+costs$|^staff\s+salaries$|^staff\s+costs$|^payroll$|^wages\s+and\s+salaries$/i], field: 'staff_costs' },
];

function parseCSVToGrid(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let inQuotes = false;
  let cell = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      cell += c;
    } else if (c === ',' || c === '\t' || c === ';') {
      current.push(cell.trim());
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      current.push(cell.trim());
      cell = '';
      if (current.some(x => x.length > 0)) rows.push(current);
      current = [];
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || current.length > 0) {
    current.push(cell.trim());
    if (current.some(x => x.length > 0)) rows.push(current);
  }
  return rows;
}

function parseNumber(val: string | undefined): number | null {
  if (val == null || val === '') return null;
  const s = String(val).trim();
  if (/^n\/a$|^-$/i.test(s)) return null;
  const cleaned = s.replace(/[£$,\s%]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function detectYearColumns(headerRow: string[]): { year: number; colIndex: number }[] {
  const result: { year: number; colIndex: number }[] = [];
  const seen = new Set<number>();
  const currentYear = new Date().getFullYear();
  for (let col = 0; col < headerRow.length; col++) {
    const cell = (headerRow[col] || '').trim();
    const yearMatch = cell.match(/(\d{4})/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1], 10);
      if (y >= 2000 && y <= currentYear + 1 && !seen.has(y)) {
        result.push({ year: y, colIndex: col });
        seen.add(y);
      }
    } else if (/^year\s*(\d)?$/i.test(cell) || /^fy\s*(\d{4})?$/i.test(cell)) {
      const y = parseInt(cell.replace(/\D/g, ''), 10) || currentYear;
      if (y >= 2000 && y <= currentYear + 1 && !seen.has(y)) {
        result.push({ year: y, colIndex: col });
        seen.add(y);
      }
    }
  }
  return result.sort((a, b) => a.year - b.year);
}

function getFieldForRowLabel(label: string): keyof ExtractedFinancialData | null {
  const normalized = label
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  for (const { patterns, field } of METRIC_LABELS) {
    if (patterns.some(p => p.test(normalized))) return field;
  }
  return null;
}

function findYearColumnsForRow(grid: string[][], rowIndex: number): { year: number; colIndex: number }[] {
  const maxLookBack = 5;
  for (let b = 1; b <= maxLookBack && rowIndex - b >= 0; b++) {
    const headerRow = grid[rowIndex - b].map(c => c.replace(/^["']|["']$/g, '').trim());
    const yearCols = detectYearColumns(headerRow);
    if (yearCols.length >= 1) return yearCols;
  }
  return [];
}

function tryParseStructuredCSV(csvText: string): ExtractedFinancialData[] | null {
  const normalized = csvText.replace(/^\uFEFF/, '').trim();
  const grid = parseCSVToGrid(normalized);
  if (grid.length < 2) return null;

  const yearsMap = new Map<number, Partial<ExtractedFinancialData>>();
  const currentYear = new Date().getFullYear();

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    // Try first four columns as label (Section, Subsection, Item, Description) so formats like
    // "KEY RATIOS, Cost Structure, Staff Costs Total, ..." match on "Staff Costs Total"
    let field: keyof ExtractedFinancialData | null = null;
    for (let c = 0; c < 4 && c < row.length; c++) {
      const label = (row[c] || '').replace(/^["']|["']$/g, '').trim();
      if (!label || /^=+$/.test(label)) continue;
      field = getFieldForRowLabel(label);
      if (field && field !== 'confidence' && field !== 'notes') break;
    }
    if (!field) continue;

    const yearCols = findYearColumnsForRow(grid, r);
    if (yearCols.length === 0) continue;

    for (const { year, colIndex } of yearCols) {
      if (year < 2000 || year > currentYear + 1) continue;
      if (!yearsMap.has(year)) {
        yearsMap.set(year, { fiscal_year: year, confidence: 0.9, notes: [] });
      }
      const val = parseNumber(row[colIndex]);
      if (val === null) continue;
      const entry = yearsMap.get(year)!;
      (entry as any)[field] = val;
    }
  }

  const result: ExtractedFinancialData[] = [];
  Array.from(yearsMap.values()).forEach((entry) => {
    const e = entry as ExtractedFinancialData;
    const hasData = e.revenue != null || e.gross_profit != null || e.net_profit != null || e.ebitda != null ||
      e.total_assets != null || e.net_assets != null || e.cash != null || e.debtors != null || e.cost_of_sales != null;
    if (hasData) {
      result.push({ ...e, confidence: e.confidence ?? 0.9, notes: e.notes || [] });
    }
  });
  return result.length > 0 ? result.sort((a, b) => a.fiscal_year - b.fiscal_year) : null;
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
      // For CSV/Excel, extract text then try structured CSV parse (CSV only) or LLM
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
      
      if (upload.file_type === 'csv') {
        const structured = tryParseStructuredCSV(extractedText);
        if (structured && structured.length > 0) {
          const withData = structured.filter(y => y.revenue != null || y.gross_profit != null || y.net_profit != null);
          if (withData.length > 0) {
            console.log(`[Accounts Process] Structured CSV parse: ${structured.length} year(s), ${withData.length} with key metrics`);
            extractedYears = structured;
          }
        }
      }
      
      if (extractedYears.length === 0) {
        extractedYears = await extractFinancialDataWithLLM(extractedText, upload.fiscal_year, openrouterKey);
      }
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
          staff_costs: financialData.staff_costs,
          directors_remuneration: financialData.directors_remuneration,
          operating_profit: financialData.operating_profit,
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
  const extractedText = extractTextFromPDFAdvanced(buffer);
  
  console.log(`[PDF Extract] Extracted ${extractedText?.length || 0} characters`);
  
  if (extractedText && extractedText.length > 100) {
    console.log('[PDF Extract] Preview:', extractedText.substring(0, 500));
  }
  
  // Check if we got meaningful text
  const hasFinancialTerms = extractedText && 
    /revenue|turnover|profit|loss|assets|debtors|creditors|£|\d{3},?\d{3}/i.test(extractedText);
  
  console.log(`[PDF Extract] Text analysis: ${extractedText?.length || 0} chars, financial terms: ${hasFinancialTerms}`);
  
  if (extractedText && extractedText.length > 100 && hasFinancialTerms) {
    console.log('[PDF Extract] Sending extracted text to Claude for analysis...');
    console.log('[PDF Extract] Text preview:', extractedText.substring(0, 300));
    return await extractFinancialDataFromText(extractedText, hintYear, apiKey);
  }
  
  // If text extraction failed, provide helpful error
  console.log('[PDF Extract] Insufficient readable text extracted from PDF');
  console.log('[PDF Extract] Raw preview (first 200 chars):', extractedText?.substring(0, 200) || 'empty');
  
  throw new Error(
    'Unable to extract financial data from this PDF. Companies House PDFs often use complex encoding that cannot be parsed directly. ' +
    'Please try one of these alternatives:\n' +
    '1. Download your accounts as CSV from your accounting software (Xero, QuickBooks, etc.)\n' +
    '2. Copy the key figures (revenue, costs, profit) into a simple spreadsheet and upload as CSV\n' +
    '3. Use the Review screen to manually enter the financial data'
  );
}

// PDF text extraction for Deno edge functions
// Note: Most PDFs from Companies House use encoding that can't be easily extracted
// This function attempts basic extraction but may fail for complex PDFs
function extractTextFromPDFAdvanced(bytes: Uint8Array): string {
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(bytes);
  
  const extractedParts: string[] = [];
  
  console.log('[PDF Text] Scanning PDF structure (simplified extraction)...');
  
  // Method 1: Extract text objects directly (Tj operator) - uncompressed only
  const textMatches = content.match(/\((.*?)\)\s*Tj/g);
  if (textMatches) {
    for (const m of textMatches) {
      const text = m.replace(/\((.*?)\)\s*Tj/, '$1');
      // Only keep readable ASCII text
      if (text.length > 1 && /^[\x20-\x7E]+$/.test(text)) {
        extractedParts.push(text);
      }
    }
  }
  
  // Method 2: Extract TJ arrays (multiple text strings)
  const tjArrays = content.match(/\[(.*?)\]\s*TJ/g);
  if (tjArrays) {
    for (const arr of tjArrays) {
      const strings = arr.match(/\((.*?)\)/g);
      if (strings) {
        const combined = strings.map(s => s.slice(1, -1)).join('');
        if (combined.length > 1 && /^[\x20-\x7E]+$/.test(combined)) {
          extractedParts.push(combined);
        }
      }
    }
  }
  
  // Method 3: Look for financial keywords in plain text regions
  // Search for patterns that look like financial data
  const financialPatterns = [
    /(?:turnover|revenue|sales)[\s:£]*[\d,]+/gi,
    /(?:profit|loss)[\s:£]*[\d,]+/gi,
    /(?:gross profit)[\s:£]*[\d,]+/gi,
    /(?:cost of sales)[\s:£]*[\d,]+/gi,
    /(?:debtors|creditors)[\s:£]*[\d,]+/gi,
    /(?:total assets)[\s:£]*[\d,]+/gi,
    /(?:net assets)[\s:£]*[\d,]+/gi,
    /£[\d,]+(?:\.\d{2})?/g
  ];
  
  for (const pattern of financialPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      extractedParts.push(...matches.filter(m => /^[\x20-\x7E£]+$/.test(m)));
    }
  }
  
  // Method 4: Extract literal strings that contain financial keywords
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
      // Only keep if it's readable ASCII and contains meaningful content
      if (/^[\x20-\x7E\r\n]+$/.test(decoded) && 
          (/[a-zA-Z]{3,}/.test(decoded) || /[\d,]{4,}/.test(decoded))) {
        extractedParts.push(decoded);
      }
    }
  }
  
  console.log(`[PDF Text] Found ${extractedParts.length} readable text segments`);
  
  // Clean up and dedupe - filter out encoding garbage
  const lines = extractedParts
    .map(l => l.trim())
    .filter(l => l.length > 2)
    .filter(l => !/^[^a-zA-Z0-9£]+$/.test(l)) // Remove lines with only special chars
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
      operating_profit: year.operating_profit,
      staff_costs: year.staff_costs,
      directors_remuneration: year.directors_remuneration,
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
- operating_profit: Operating profit / profit before interest and tax (if stated separately from EBITDA)
- staff_costs: TOTAL staff costs (directors remuneration + staff wages + national insurance + pension costs). Critical — look in admin expenses schedule, notes, or key ratios. Sum all staff-related costs.
- directors_remuneration: Directors' pay/remuneration (often in notes or admin schedule)

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

