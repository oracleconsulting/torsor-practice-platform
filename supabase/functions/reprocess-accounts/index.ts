/**
 * Reprocess Accounts — re-extract financial data from stored raw CSV content.
 * 
 * Use when extraction schema changes (new columns added). Reads raw_content
 * from client_accounts_uploads and re-runs the LLM extraction with the
 * latest prompt, then upserts into client_financial_data.
 * 
 * Body: { clientId: string } or { clientId: 'all' } for batch
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXTRACTION_VERSION = 2;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { clientId } = await req.json();
    if (!clientId) throw new Error('clientId required');

    let uploads: any[] = [];

    if (clientId === 'all') {
      // Find all clients with stale extraction
      const { data: staleClients } = await supabase
        .from('client_financial_data')
        .select('client_id')
        .lt('extraction_version', EXTRACTION_VERSION);
      
      const staleIds = [...new Set((staleClients || []).map((r: any) => r.client_id))];
      console.log(`[Reprocess] Found ${staleIds.length} clients with stale data`);

      if (staleIds.length > 0) {
        const { data } = await supabase
          .from('client_accounts_uploads')
          .select('id, client_id, practice_id, fiscal_year, raw_content, file_type')
          .in('client_id', staleIds)
          .not('raw_content', 'is', null)
          .order('created_at', { ascending: false });
        
        // Deduplicate: one upload per client (most recent)
        const seen = new Set<string>();
        for (const u of (data || [])) {
          if (!seen.has(u.client_id)) {
            uploads.push(u);
            seen.add(u.client_id);
          }
        }
      }
    } else {
      const { data } = await supabase
        .from('client_accounts_uploads')
        .select('id, client_id, practice_id, fiscal_year, raw_content, file_type')
        .eq('client_id', clientId)
        .not('raw_content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      uploads = data || [];
    }

    console.log(`[Reprocess] Processing ${uploads.length} upload(s)`);
    const results: any[] = [];

    for (const upload of uploads) {
      if (!upload.raw_content || upload.raw_content.length < 100) {
        results.push({ clientId: upload.client_id, status: 'skipped', reason: 'no raw content' });
        continue;
      }

      try {
        const extracted = await extractWithLLM(upload.raw_content, upload.fiscal_year, openrouterKey);
        console.log(`[Reprocess] Client ${upload.client_id}: extracted ${extracted.length} year(s)`);

        for (const year of extracted) {
          // Calculate derived metrics
          if (year.revenue && year.gross_profit) {
            year.gross_margin_pct = Number(((year.gross_profit / year.revenue) * 100).toFixed(1));
          }
          if (year.revenue && year.net_profit) {
            year.net_margin_pct = Number(((year.net_profit / year.revenue) * 100).toFixed(1));
          }
          if (year.revenue && year.debtors) {
            year.debtor_days = Math.round((year.debtors / year.revenue) * 365);
          }

          const { error } = await supabase
            .from('client_financial_data')
            .upsert({
              client_id: upload.client_id,
              practice_id: upload.practice_id,
              upload_id: upload.id,
              fiscal_year: year.fiscal_year,
              revenue: year.revenue,
              cost_of_sales: year.cost_of_sales,
              gross_profit: year.gross_profit,
              gross_margin_pct: year.gross_margin_pct,
              operating_expenses: year.operating_expenses,
              ebitda: year.ebitda,
              depreciation: year.depreciation,
              interest_paid: year.interest_paid,
              tax: year.tax,
              net_profit: year.net_profit,
              net_margin_pct: year.net_margin_pct,
              operating_profit: year.operating_profit,
              staff_costs: year.staff_costs,
              directors_remuneration: year.directors_remuneration,
              debtors: year.debtors,
              creditors: year.creditors,
              cash: year.cash,
              current_assets: year.current_assets,
              current_liabilities: year.current_liabilities,
              fixed_assets: year.fixed_assets,
              net_assets: year.net_assets,
              employee_count: year.employee_count,
              debtor_days: year.debtor_days,
              investment_property: year.investment_property,
              bank_loans: year.bank_loans,
              director_loan_account: year.director_loan_account,
              bad_debts: year.bad_debts,
              bank_charges: year.bank_charges,
              connected_company_debtors: year.connected_company_debtors,
              dividends_paid: year.dividends_paid,
              trade_subscriptions: year.trade_subscriptions,
              trade_debtors: year.trade_debtors,
              other_loans: year.other_loans,
              principal_activity: year.principal_activity,
              extraction_version: EXTRACTION_VERSION,
              data_source: 'reprocess',
              confidence_score: year.confidence,
              notes: year.notes?.join('\n') || null,
            }, { onConflict: 'client_id,fiscal_year' });

          if (error) console.error(`[Reprocess] Upsert error FY${year.fiscal_year}:`, error.message);
        }

        results.push({ clientId: upload.client_id, status: 'success', years: extracted.length });
      } catch (err: any) {
        console.error(`[Reprocess] Error for client ${upload.client_id}:`, err.message);
        results.push({ clientId: upload.client_id, status: 'error', error: err.message });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractWithLLM(documentText: string, hintYear: number | null, apiKey: string): Promise<any[]> {
  const yearHint = hintYear ? `The user indicated this may be for fiscal year ${hintYear}, but check for all years present.` : '';

  const prompt = `You are a financial data extraction specialist. Extract key financial metrics from these company accounts.

IMPORTANT: This document may contain MULTIPLE YEARS of data. Extract ALL years present.
${yearHint}

For EACH YEAR found, extract these metrics (use null if not found, numbers only - no currency symbols):

P&L: fiscal_year, fiscal_year_end, revenue, cost_of_sales, gross_profit, operating_expenses, ebitda, depreciation, amortisation, interest_paid, tax, net_profit, operating_profit, staff_costs, directors_remuneration

BALANCE SHEET: debtors, creditors, cash, current_assets, current_liabilities, fixed_assets, net_assets, investment_property, bank_loans, long_term_liabilities

ADDITIONAL LINE ITEMS (extract if available):
- director_loan_account: Director's loan account balance (often in debtors note or "Other debtors")
- bad_debts: Bad debt expense (in admin expenses)
- bank_charges: Bank charges/fees (in admin expenses)
- connected_company_debtors: Amounts owed by connected/group companies (in debtors note)
- dividends_paid: Dividends paid in year (statement of changes in equity)
- trade_subscriptions: Platform/software/subscription costs (in admin expenses)
- trade_debtors: Trade receivables only (in debtors note, separate from connected/DLA)
- other_loans: Total loan balances

COMPANY INFO: principal_activity, sic_code, employee_count

EXTRACTION HINTS:
- cash: Look for "Cash at Bank and in Hand" or "Cash and cash equivalents"
- director_loan_account: Look for "Directors Loan Account" or "DLA" in debtors breakdown
- trade_debtors: The POUND AMOUNT, not debtor days ratio
- debtors: TOTAL DEBTORS AMOUNT (£ value), NOT debtor days
- bad_debts: "Bad Debts Written Off" or "Provision for Bad Debts"
- dividends_paid: In "Statement of Changes in Equity" or P&L appropriation

Also provide: confidence (0.0-1.0), notes (array of strings)

RESPOND IN VALID JSON ONLY:
{ "years": [{ "fiscal_year": 2024, "revenue": 610000, ... }] }

DOCUMENT TEXT:
${documentText.slice(0, 15000)}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.io',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) throw new Error(`LLM error: ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in LLM response');

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.years || [parsed];
}
