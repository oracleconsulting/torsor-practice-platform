// ============================================================================
// generate-bm-integrity-pass / index.ts
// ============================================================================
// Pass 1.5 — the integrity pass. Runs between Pass 1 and Pass 2.
//
// Inputs (read from database, keyed on engagementId):
//   - bm_reports.pass1_data (calculator output)
//   - bm_reports.numeric_anchors (already populated by Pass 1)
//   - bm_reports.data_integrity_manifest (already populated by Pass 1)
//   - bm_assessment_responses.responses
//   - bm_engagements (+ joined clients record)
//   - client_context_notes (filtered: is_quotable = true)
//   - industry_safe_comparables (filtered by industry_code + business_stage)
//   - bm_industry_benchmarks.market_context (validated for unmatched entities)
//
// Outputs (written to bm_reports):
//   - entity_allowlist          — deterministic list of entities Pass 2 may name
//   - narrative_quality remains 'unverified' (Pass 2 will set 'clean' or 'requires_review')
//   - data_integrity unchanged (Pass 1 set this; integrity pass does not touch it)
//
// Outputs (written to bm_engagements):
//   - status = 'integrity_pass_complete'  → orchestrator chains to Pass 2
//   - status = 'integrity_review_required' → orchestrator halts, admin must intervene
//
// This pass NEVER mutates narrative text. Detection only. Pass 2 reads the
// allowlist and embeds it into its own prompt as the authoritative grounding.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ────────────────────────────────────────────────────────────────────────────
// Static safe entity allowlist.
// ────────────────────────────────────────────────────────────────────────────
// Things every regtech / SaaS report can legitimately name without curation:
// regulators, accounting frameworks, well-known financial/audit acronyms,
// professional bodies, established academic/industry framework authors.
// This is the *floor* — engagement-specific entities are added on top.
// ────────────────────────────────────────────────────────────────────────────

const STATIC_SAFE_ENTITIES: string[] = [
  // Regulators & gov bodies (UK)
  'FCA', 'PRA', 'HMRC', 'HMT', 'BEIS', 'ICO', 'NCSC', 'Companies House',
  'Innovate UK', 'TechUK', 'BVCA',
  // Regulatory frameworks & standards
  'AML', 'CTF', 'CFT', 'KYC', 'KYB', 'GDPR', 'SOC', 'ISO', 'PCI', 'DSS',
  'HIPAA', 'AMLD6', 'FATF', 'SRA', 'SEIS', 'EIS', 'VCT', 'EMI', 'CSOP', 'SDLT',
  // Stage labels (avoid these being flagged as "Series A" the company)
  'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D',
  // Geo
  'UK', 'US', 'EU', 'EEA', 'London', 'Manchester', 'Edinburgh', 'Birmingham',
  'New York', 'San Francisco', 'Hong Kong', 'Singapore',
  // Internal — RPGCC, Torsor (the platform itself, fine to mention)
  'RPGCC', 'Torsor',
  // Valuation framework authors and well-known data sources
  'Damodaran', 'NYU', 'Bill Payne', 'Dave Berkus', 'Bill Sahlman', 'Harvard',
  'BDO', 'PCPI', 'Beauhurst', 'PitchBook', 'Crunchbase', 'Dealroom',
  'SaaS Capital', 'Bessemer', 'First Page Sage', 'Robot Mascot',
  'FinTech Global', 'BusinessCloud', 'RegTech100', 'Cambridge Centre for Alternative Finance',
  // Common SaaS acronyms (avoid these being flagged as company names)
  'NRR', 'GRR', 'ARR', 'MRR', 'CAC', 'LTV', 'EBITDA', 'SDE', 'NFI', 'GRF',
  // Common role acronyms
  'CTO', 'CEO', 'CFO', 'COO', 'CMO', 'CRO', 'NED', 'MD', 'MLRO',
  // Percentile labels
  'P25', 'P50', 'P75', 'P90', 'P99',
  // Rule-of-X labels
  'Rule of 40', 'Rule of 50',
];

// ────────────────────────────────────────────────────────────────────────────
// Proper-noun extraction.
// ────────────────────────────────────────────────────────────────────────────
// Three regex patterns covering the common shapes the previous Section 2
// regex missed:
//   1. ALL_CAPS_ACRONYM      — VYKN, MUFG, RPGCC          /\b[A-Z]{3,}\b/g
//   2. MIXED_CASE_PRODUCT    — StudyAML, ComplyAdvantage  /\b[A-Z][a-z]+(?:[A-Z][a-zA-Z]+)+\b/g
//   3. MULTI_WORD_PROPER     — Damon Wilson, Bill Payne   /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g
//
// Each is run independently so we don't lose matches that fall into multiple
// categories. Common stop-words (sentence-start capitalised but not proper
// nouns) are filtered by a static stop-list.
// ────────────────────────────────────────────────────────────────────────────

const PROPER_NOUN_STOP_WORDS = new Set<string>([
  // Sentence-starters that are not proper nouns
  'The', 'This', 'That', 'These', 'Those', 'There', 'Their', 'They', 'Them',
  'What', 'When', 'Where', 'Which', 'While', 'Who', 'Whose', 'Why', 'How',
  'From', 'With', 'Without', 'About', 'After', 'Before', 'Between', 'During',
  'Through', 'Against', 'Among', 'Within', 'Above', 'Below', 'Across', 'Around',
  'Each', 'Every', 'Some', 'Such', 'Both', 'Either', 'Neither', 'All', 'Any',
  'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Last', 'Next',
  'Year', 'Month', 'Week', 'Day', 'Today', 'Tomorrow', 'Yesterday',
  'Yes', 'Yet', 'Still', 'Then', 'Than', 'Thus', 'Therefore',
  // Generic capitalised business nouns we don't want as candidate names
  'Annual', 'Revenue', 'Growth', 'Margin', 'Value', 'Investment', 'Investors',
  'Business', 'Market', 'Industry', 'Current', 'Target', 'Readiness', 'Ready',
  'Pipeline', 'Contract', 'Contracts', 'Enterprise', 'Platform', 'Compliance',
  'Regulatory', 'Financial', 'Corporate', 'Defensible', 'Milestone', 'Advisory',
  'Governance', 'Structuring', 'Forecast', 'Forecasts', 'Strategy', 'Strategic',
  'Operations', 'Operational', 'Conservative', 'Stretch', 'Base', 'High', 'Low',
  'Customer', 'Customers', 'Sales', 'Marketing', 'Team', 'Teams', 'Head', 'Heads',
  'Success', 'Path', 'Paths', 'North', 'Star', 'Deep', 'Strong', 'Weak',
  // Common corporate verb-nouns
  'Build', 'Building', 'Built', 'Move', 'Moving', 'Hit', 'Hitting',
  'Lock', 'Locking', 'Position', 'Positioning', 'Prove', 'Proving',
  // Noise that arose in the previous regen
  'Without', 'Score', 'Scorecard', 'Berkus', 'Method',
]);

function extractProperNouns(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  const candidates = new Set<string>();

  // 1. ALL-CAPS acronym (3+ letters, optionally with digits)
  const acronymMatches = text.match(/\b[A-Z][A-Z0-9]{2,}\b/g) || [];
  for (const m of acronymMatches) candidates.add(m);

  // 2. Mixed-case product/company names — initial cap then lowercase, then
  //    one-or-more interior caps (StudyAML, ComplyAdvantage, FinTech).
  //    Important: requires interior cap to fire, otherwise 'Year' would match.
  const mixedMatches = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-zA-Z]+)+\b/g) || [];
  for (const m of mixedMatches) candidates.add(m);

  // 3. Multi-word proper-noun phrases — two or more capital-then-lowercase
  //    words separated by spaces (Damon Wilson, Bill Payne).
  const multiWordMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
  for (const m of multiWordMatches) candidates.add(m);

  // 4. Single capital-then-lowercase word (4+ letters), filtered against stop-words.
  //    Conservative: only adds if the word is uncommon enough to plausibly be
  //    a name. The stop-list catches sentence-starters and generic nouns.
  const singleCapMatches = text.match(/\b[A-Z][a-z]{3,}\b/g) || [];
  for (const m of singleCapMatches) {
    if (!PROPER_NOUN_STOP_WORDS.has(m)) candidates.add(m);
  }

  return Array.from(candidates);
}

// ────────────────────────────────────────────────────────────────────────────
// Allowlist matching with substring tolerance.
// ────────────────────────────────────────────────────────────────────────────
// 'Damon' should match 'Damon Wilson' in the allowlist. 'Wilson' should not
// match unless 'Wilson' is independently allowlisted. The matcher allows the
// candidate to be a substring of an allowlisted entity (forward containment)
// but not the reverse, to prevent 'A' allowlisting 'Apple Inc'.
// ────────────────────────────────────────────────────────────────────────────

function isAllowed(candidate: string, allowlist: Set<string>): boolean {
  if (allowlist.has(candidate)) return true;
  // Forward containment: any allowlisted multi-word entry contains the candidate
  // as a whole word.
  for (const entry of allowlist) {
    if (entry.length <= candidate.length) continue;
    // Whole-word match: entry contains candidate bounded by spaces or string start/end
    const wordRegex = new RegExp(
      `(^|\\s)${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`
    );
    if (wordRegex.test(entry)) return true;
  }
  return false;
}

// ────────────────────────────────────────────────────────────────────────────
// Allowlist build.
// ────────────────────────────────────────────────────────────────────────────

interface AllowlistBuildSources {
  staticEntities: string[];
  clientNames: string[];                  // engagement.client + clients.* fields
  assessmentEntities: string[];           // proper nouns from assessment responses
  contextNoteEntities: string[];          // proper nouns from is_quotable=true notes
  industrySafeComparables: string[];      // curated companies for this industry/stage
  benchmarkSources: string[];             // citation names from industry_valuation_basis
  comparableRoundEntities: string[];      // companies named in comparable rounds
  marketContextEntities: string[];        // proper nouns from validated market_context
}

interface BuildAllowlistResult {
  allowlist: string[];                    // deduplicated, sorted
  sources: AllowlistBuildSources;         // diagnostic breakdown
  candidatesRejected: string[];           // proper nouns considered but excluded
}

function buildAllowlist(args: {
  pass1Data: any;
  engagement: any;
  clientRow: any | null;
  assessmentResponses: Record<string, unknown>;
  quotableContextNotes: any[];
  industrySafeComparables: Array<{ company_name: string }>;
  industryValuationBasisSources: string[];
  comparableRoundsCompanies: string[];
  validatedMarketContext: string | null;
}): BuildAllowlistResult {
  const sources: AllowlistBuildSources = {
    staticEntities: [...STATIC_SAFE_ENTITIES],
    clientNames: [],
    assessmentEntities: [],
    contextNoteEntities: [],
    industrySafeComparables: [],
    benchmarkSources: [],
    comparableRoundEntities: [],
    marketContextEntities: [],
  };

  // Client identifiers
  const clientCandidates = [
    args.clientRow?.name,
    args.clientRow?.company_name,
    args.clientRow?.trading_name,
    args.clientRow?.legal_name,
    args.engagement?.client_name,
    args.engagement?.company_name,
  ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  for (const raw of clientCandidates) {
    sources.clientNames.push(raw.trim());
    // Also add any proper-noun fragments inside the name (e.g. "VYKN UK Ltd" → VYKN)
    for (const frag of extractProperNouns(raw)) {
      sources.clientNames.push(frag);
    }
  }

  // Assessment responses — proper nouns from any string-valued field
  for (const val of Object.values(args.assessmentResponses || {})) {
    if (typeof val === 'string' && val.length > 2) {
      for (const n of extractProperNouns(val)) sources.assessmentEntities.push(n);
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string') {
          for (const n of extractProperNouns(item)) sources.assessmentEntities.push(n);
        }
      }
    }
  }

  // Context notes (only is_quotable = true; restrictive default)
  for (const note of args.quotableContextNotes) {
    const text = note?.note_content || note?.content || '';
    if (typeof text === 'string') {
      for (const n of extractProperNouns(text)) sources.contextNoteEntities.push(n);
    }
  }

  // Industry-safe comparables (curated)
  for (const c of args.industrySafeComparables) {
    if (c?.company_name) sources.industrySafeComparables.push(c.company_name);
  }

  // Benchmark source citations (from industry_valuation_basis.sources)
  for (const s of args.industryValuationBasisSources) {
    if (typeof s === 'string' && s.length > 0) {
      sources.benchmarkSources.push(s);
      // Extract proper nouns from the source string itself (e.g. "Themis funding history (FinTech Global, FFNews)" → Themis, FinTech Global, FFNews)
      for (const n of extractProperNouns(s)) sources.benchmarkSources.push(n);
    }
  }

  // Comparable round companies
  for (const c of args.comparableRoundsCompanies) {
    if (c) sources.comparableRoundEntities.push(c);
  }

  // Validated market context
  if (args.validatedMarketContext) {
    for (const n of extractProperNouns(args.validatedMarketContext)) {
      sources.marketContextEntities.push(n);
    }
  }

  // Deduplicate and sort
  const allUnique = new Set<string>();
  const addAll = (arr: string[]) => arr.forEach(s => {
    const trimmed = s.trim();
    if (trimmed.length >= 2) allUnique.add(trimmed);
  });
  addAll(sources.staticEntities);
  addAll(sources.clientNames);
  addAll(sources.assessmentEntities);
  addAll(sources.contextNoteEntities);
  addAll(sources.industrySafeComparables);
  addAll(sources.benchmarkSources);
  addAll(sources.comparableRoundEntities);
  addAll(sources.marketContextEntities);

  const allowlist = Array.from(allUnique).sort();

  return { allowlist, sources, candidatesRejected: [] };
}

// ────────────────────────────────────────────────────────────────────────────
// Validation of industry_valuation_basis.sources against the allowlist.
// ────────────────────────────────────────────────────────────────────────────
// Even seeded registry data can drift. The integrity pass validates each
// source citation has its proper nouns covered by either the static list,
// industry_safe_comparables, or self-citation (the source's own name is
// allowlisted by virtue of being a benchmark source).
// ────────────────────────────────────────────────────────────────────────────

function validateRegistrySources(
  sourceList: string[],
  allowlistSet: Set<string>
): Array<{ source: string; unmatched: string[] }> {
  const violations: Array<{ source: string; unmatched: string[] }> = [];
  for (const s of sourceList) {
    const properNouns = extractProperNouns(s);
    const unmatched = properNouns.filter(p => !isAllowed(p, allowlistSet));
    if (unmatched.length > 0) {
      violations.push({ source: s, unmatched });
    }
  }
  return violations;
}

// ────────────────────────────────────────────────────────────────────────────
// Market context validation.
// ────────────────────────────────────────────────────────────────────────────
// Reads bm_industry_benchmarks.market_context for the industry, extracts
// proper nouns, diffs against the in-progress allowlist (everything except
// market_context contribution itself), and returns a list of unmatched
// entities. Caller decides what to do with the result — for the integrity
// pass, an unmatched market-context entity flags the report for review and
// the offending text is suppressed from feeding the allowlist.
// ────────────────────────────────────────────────────────────────────────────

function validateMarketContext(
  marketContext: string | null,
  preMarketAllowlist: Set<string>
): { passes: boolean; unmatched: string[]; cleanedText: string | null } {
  if (!marketContext || typeof marketContext !== 'string') {
    return { passes: true, unmatched: [], cleanedText: null };
  }
  const properNouns = extractProperNouns(marketContext);
  const unmatched = properNouns.filter(p => !isAllowed(p, preMarketAllowlist));
  if (unmatched.length === 0) {
    return { passes: true, unmatched: [], cleanedText: marketContext };
  }
  // Cleaning strategy: strip sentences containing any unmatched entity.
  // This is the (a) fallback referenced in the patch design — we don't
  // re-prompt Perplexity here because that's the responsibility of the
  // upstream fetch function. By the time market_context reaches the integrity
  // pass, it has already been through the upstream re-prompt loop.
  const sentences = marketContext.split(/(?<=[.!?])\s+/);
  const keptSentences = sentences.filter(sentence => {
    const sentenceNouns = extractProperNouns(sentence);
    return !sentenceNouns.some(n => unmatched.includes(n));
  });
  const cleaned = keptSentences.join(' ').trim();
  return {
    passes: false,
    unmatched,
    cleanedText: cleaned.length > 0 ? cleaned : null,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    if (!engagementId) throw new Error('engagementId is required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[BM Integrity Pass] Starting for:', engagementId);

    // Fetch engagement + client
    const { data: engagement, error: engagementErr } = await supabase
      .from('bm_engagements')
      .select('*, clients:client_id(*)')
      .eq('id', engagementId)
      .single();
    if (engagementErr || !engagement) {
      throw new Error(`Engagement not found: ${engagementErr?.message || 'no row'}`);
    }

    // Fetch report (must already exist with pass1_data)
    const { data: report, error: reportErr } = await supabase
      .from('bm_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();
    if (reportErr || !report) {
      throw new Error(`Report not found: ${reportErr?.message || 'no row'}`);
    }
    if (!report.pass1_data) {
      throw new Error('pass1_data missing — Pass 1 must run before integrity pass');
    }

    // Pass 1 must have left data_integrity = 'complete' for the integrity
    // pass to proceed. If Pass 1 found critical gaps, the engagement should
    // already be at 'data_collection_incomplete' and we should not be here.
    if (report.data_integrity === 'incomplete') {
      console.warn('[BM Integrity Pass] data_integrity = incomplete — refusing to proceed');
      return new Response(
        JSON.stringify({
          success: false,
          status: 'refused',
          reason: 'data_integrity_incomplete',
          message: 'Integrity pass refused to run — Pass 1 manifest reports critical input gaps. Resolve via data collection panel and regenerate.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch assessment
    const { data: assessment } = await supabase
      .from('bm_assessment_responses')
      .select('responses')
      .eq('engagement_id', engagementId)
      .single();
    const assessmentResponses = (assessment?.responses ?? {}) as Record<string, unknown>;

    // Fetch quotable context notes
    const { data: contextNotes } = await supabase
      .from('client_context_notes')
      .select('*')
      .eq('client_id', engagement.client_id)
      .eq('include_in_analysis', true)
      .eq('is_quotable', true);
    const quotableContextNotes = contextNotes || [];
    console.log('[BM Integrity Pass] Quotable context notes:', quotableContextNotes.length);

    // Fetch industry-safe comparables
    const industryCode = report.industry_code || engagement.industry_code;
    const businessStage = engagement.business_stage || 'operating';
    const { data: safeComparables } = await supabase
      .from('industry_safe_comparables')
      .select('company_name')
      .eq('is_active', true)
      .eq('industry_code', industryCode)
      .or(`business_stage.eq.${businessStage},business_stage.eq.all`);
    const industrySafeComparables = safeComparables || [];
    console.log('[BM Integrity Pass] Safe comparables loaded:', industrySafeComparables.length);

    // Fetch industry_valuation_basis sources for self-validation
    const { data: ivb } = await supabase
      .from('industry_valuation_basis')
      .select('sources')
      .eq('industry_code', industryCode)
      .eq('business_stage', businessStage)
      .eq('is_current', true)
      .maybeSingle();
    const industryBasisSources: string[] = Array.isArray(ivb?.sources) ? ivb.sources : [];

    // Fetch market_context (live-search output) for the industry
    const { data: bmIB } = await supabase
      .from('bm_industry_benchmarks')
      .select('market_context')
      .eq('industry_code', industryCode)
      .order('last_refreshed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const rawMarketContext: string | null = bmIB?.market_context ?? null;

    // Comparable round companies from pass1_data (if present)
    const pass1Data = typeof report.pass1_data === 'string'
      ? JSON.parse(report.pass1_data)
      : report.pass1_data;
    const comparableRoundsCompanies: string[] = (
      pass1Data?.pre_revenue_analysis?.comparableRoundsAnalysis?.rounds || []
    ).map((r: any) => r?.company).filter((c: any) => typeof c === 'string');

    // ────────────────────────────────────────────────────────────────────
    // BUILD #1 — pre-market-context allowlist.
    // We need an allowlist that excludes market_context contributions in
    // order to validate market_context against it. Otherwise market_context
    // would self-validate.
    // ────────────────────────────────────────────────────────────────────

    const preMarketBuild = buildAllowlist({
      pass1Data,
      engagement,
      clientRow: engagement.clients ?? null,
      assessmentResponses,
      quotableContextNotes,
      industrySafeComparables,
      industryValuationBasisSources: industryBasisSources,
      comparableRoundsCompanies,
      validatedMarketContext: null, // explicitly excluded
    });
    const preMarketSet = new Set(preMarketBuild.allowlist);

    // Validate registry sources against the pre-market allowlist
    const registrySourceViolations = validateRegistrySources(industryBasisSources, preMarketSet);
    if (registrySourceViolations.length > 0) {
      console.warn('[BM Integrity Pass] Registry source citations contain unmatched entities:', registrySourceViolations);
    }

    // Validate market context
    const marketCheck = validateMarketContext(rawMarketContext, preMarketSet);
    let validatedMarketContext: string | null;
    if (marketCheck.passes) {
      validatedMarketContext = rawMarketContext;
    } else {
      console.warn('[BM Integrity Pass] market_context contains unmatched entities:', marketCheck.unmatched);
      validatedMarketContext = marketCheck.cleanedText;
      // Persist the cleaned market_context back to bm_industry_benchmarks so the
      // dashboard renders the cleaned version. We do not retry Perplexity here —
      // that's the responsibility of fetch-industry-benchmarks during refresh.
      if (rawMarketContext !== validatedMarketContext) {
        const { error: updateErr } = await supabase
          .from('bm_industry_benchmarks')
          .update({
            market_context: validatedMarketContext,
            market_context_review_notes: {
              cleaned_at: new Date().toISOString(),
              cleaned_by: 'integrity_pass',
              unmatched_entities: marketCheck.unmatched,
              original_text: rawMarketContext,
            },
          })
          .eq('industry_code', industryCode);
        if (updateErr) {
          console.warn('[BM Integrity Pass] Could not persist cleaned market_context (column may not exist):', updateErr.message);
          // Non-fatal — the allowlist build still proceeds with the cleaned text in memory
        }
      }
    }

    // ────────────────────────────────────────────────────────────────────
    // BUILD #2 — final allowlist including the validated market context
    // ────────────────────────────────────────────────────────────────────

    const finalBuild = buildAllowlist({
      pass1Data,
      engagement,
      clientRow: engagement.clients ?? null,
      assessmentResponses,
      quotableContextNotes,
      industrySafeComparables,
      industryValuationBasisSources: industryBasisSources,
      comparableRoundsCompanies,
      validatedMarketContext,
    });

    const allowlistPayload = {
      built_at: new Date().toISOString(),
      total_entries: finalBuild.allowlist.length,
      entries: finalBuild.allowlist,
      sources: {
        static: finalBuild.sources.staticEntities.length,
        client_names: finalBuild.sources.clientNames.length,
        assessment: finalBuild.sources.assessmentEntities.length,
        context_notes: finalBuild.sources.contextNoteEntities.length,
        industry_safe_comparables: finalBuild.sources.industrySafeComparables.length,
        benchmark_sources: finalBuild.sources.benchmarkSources.length,
        comparable_rounds: finalBuild.sources.comparableRoundEntities.length,
        market_context: finalBuild.sources.marketContextEntities.length,
      },
      market_context_validation: {
        passed: marketCheck.passes,
        unmatched_entities: marketCheck.unmatched,
        cleaned: rawMarketContext !== validatedMarketContext,
      },
      registry_source_violations: registrySourceViolations,
    };

    // ────────────────────────────────────────────────────────────────────
    // Decide outbound state
    // ────────────────────────────────────────────────────────────────────

    const requiresReview =
      registrySourceViolations.length > 0
      || (!marketCheck.passes && (marketCheck.cleanedText === null || marketCheck.cleanedText.trim().length === 0));

    const newEngagementStatus = requiresReview
      ? 'integrity_review_required'
      : 'integrity_pass_complete';

    // Write allowlist to the report
    const { error: updateErr } = await supabase
      .from('bm_reports')
      .update({ entity_allowlist: allowlistPayload })
      .eq('engagement_id', engagementId);
    if (updateErr) throw updateErr;

    await supabase
      .from('bm_engagements')
      .update({ status: newEngagementStatus })
      .eq('id', engagementId);

    console.log('[BM Integrity Pass] Allowlist built:', {
      total: finalBuild.allowlist.length,
      review_required: requiresReview,
      market_context_clean: marketCheck.passes,
      registry_violations: registrySourceViolations.length,
    });

    if (newEngagementStatus === 'integrity_pass_complete') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && serviceRoleKey) {
        const pass2Url = `${supabaseUrl}/functions/v1/generate-bm-report-pass2`;
        console.log(`[BM Integrity Pass] Triggering Pass 2 at: ${pass2Url} (fire-and-forget)`);
        // Fire-and-forget — Pass 2 runs Opus + up to 2 reprompts which together
        // exceed the 150s IDLE_TIMEOUT. Status flows through bm_engagements.status.
        try {
          fetch(pass2Url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
            body: JSON.stringify({ engagementId }),
          }).catch(triggerErr => {
            console.error('[BM Integrity Pass] ❌ Pass 2 fire-and-forget rejected:', triggerErr);
          });
          console.log('[BM Integrity Pass] ✅ Pass 2 triggered (fire-and-forget). Status will update via DB polling.');
        } catch (triggerErr) {
          console.error('[BM Integrity Pass] ❌ Failed to invoke Pass 2 fetch:', triggerErr);
        }
      }
    } else {
      console.warn('[BM Integrity Pass] Engagement at integrity_review_required — Pass 2 NOT triggered');
    }

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        status: newEngagementStatus,
        allowlist_size: finalBuild.allowlist.length,
        review_required: requiresReview,
        market_context_validation: allowlistPayload.market_context_validation,
        registry_violations: registrySourceViolations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BM Integrity Pass] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
