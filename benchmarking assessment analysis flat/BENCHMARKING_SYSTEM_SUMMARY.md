# Benchmarking Assessment System — Current Live Summary

**As of:** 2026-02-07  
**Purpose:** Single reference for the deployed Benchmarking (BM) system. All files in this folder are flat copies of live sources (no subfolders).

---

## 1. What the system does

- **Benchmarking assessment**: Client completes a questionnaire (industry, metrics, goals). Data is combined with HVA/financials where available.
- **Pass 1 (generate-bm-report-pass1)**: Classifies business, fetches industry benchmarks, runs surplus cash/founder risk/balance sheet/trends, builds value analysis (baseline value, suppressors, exit readiness, path to value), writes to `bm_reports`.
- **Pass 2 (generate-bm-report-pass2)**: Generates narratives (executive summary, position, strengths, gaps, opportunity, recommendations) and optional two-paths; updates `bm_reports`.
- **Pass 3 (generate-bm-opportunities)**: Identifies opportunities, maps to services/concepts, stores in `client_opportunities`; can pin/block services via `bm_engagements.pinned_services` / `blocked_services`.
- **PDF export (generate-benchmarking-pdf)**: Renders `bm_reports` (by `engagement_id`) to HTML then PDF (Browserless). Uses top-level columns: `value_analysis`, `enhanced_suppressors`, `exit_readiness_breakdown`; client name from `bm_engagements` → `practice_members`. Sections: valuation, suppressors, value protectors, path to value, exit readiness, scenarios, services.
- **Admin UI**: ClientServicesPage hosts BenchmarkingAdminView (data collection, opportunity dashboard, value panel, service pathway, PDF export, share). Uses `engagement_id` (not `id`) for report/PDF.

---

## 2. Key tables

| Table | Purpose |
|-------|---------|
| `bm_engagements` | One per client benchmarking engagement; `client_id`, `pinned_services`, `blocked_services`. |
| `bm_assessment_responses` | Questionnaire answers; `responses` JSONB. |
| `bm_reports` | **PK = engagement_id**. Full report: metrics, narratives, `value_analysis`, `enhanced_suppressors`, `exit_readiness_breakdown`, `pdf_config`, etc. |
| `bm_metric_comparisons` | Per-metric benchmark comparisons. |
| `client_opportunities` | Opportunities from Pass 3; links to `services` / `service_concepts`. |
| `practice_members` | Client names (for PDF); not `clients`. |

---

## 3. Edge functions (live paths)

| Function | Path | Role |
|----------|------|------|
| generate-bm-report-pass1 | supabase/functions/generate-bm-report-pass1/index.ts | Analysis, benchmarks, value model, write bm_reports. |
| generate-bm-report-pass2 | supabase/functions/generate-bm-report-pass2/index.ts | Narratives, two-paths; update bm_reports. |
| generate-bm-opportunities | supabase/functions/generate-bm-opportunities/index.ts | Opportunities, pin/block, client_opportunities. |
| generate-benchmarking-pdf | supabase/functions/generate-benchmarking-pdf/index.ts | PDF from bm_reports (engagement_id), client name lookup. |
| fetch-industry-benchmarks | supabase/functions/fetch-industry-benchmarks/index.ts | Industry benchmark data. |
| regenerate-bm-report | supabase/functions/regenerate-bm-report/index.ts | Re-run Pass 1/2. |
| save-bm-supplementary-data | supabase/functions/save-bm-supplementary-data/index.ts | Save supplementary BM data. |

---

## 4. Frontend (live paths)

- **Host page:** `src/pages/admin/ClientServicesPage.tsx` — tabs for MA / Discovery / Benchmarking; BM uses `engagement_id` for report and PDF.
- **Admin:** `src/components/benchmarking/admin/` — BenchmarkingAdminView, DataCollectionPanel, OpportunityPanel, ValueAnalysisPanel, ServicePathwayPanel, ServiceSelectionPanel, PDFExportEditor, ExportAnalysisButton, AccountsUploadPanel, ConversationScript, NextStepsPanel, etc.
- **Client report:** `src/components/benchmarking/client/BenchmarkingClientReport.tsx` — HeroSection, MetricComparisonCard, NarrativeSection, ValueBridgeSection, ScenarioPlanningSection, ServiceRecommendationsSection, etc.
- **Shared:** `src/components/benchmarking/` — CalculationBreakdown, EnhancedSuppressorCard, ExitReadinessBreakdown, SurplusCashBreakdown, TwoPathsSection.

---

## 5. Config and types

- **Assessment config:** `src/config/assessments/benchmarking-discovery.ts` — sections, questions, industry.
- **Types:** `src/types/benchmarking.ts` — ValueAnalysis and related types.
- **Lib:** `src/lib/export-benchmarking-data.ts`, `src/lib/scenario-calculator.ts`, `src/lib/services/benchmarking/industry-mapper.ts`.

---

## 6. Migrations (BM-related, applied order)

- 20251222_benchmarking_complete, fix_bm_reports_rls_policy, add_status_to_bm_reports, fix_bm_assessment_responses_rls_upsert, add_responses_jsonb_to_bm_assessment_responses, fix_bm_rls_client_inserts, fix_bm_rls_client_inserts_v2  
- 20260120_bm_sources_detail, bm_enhanced_admin_guidance  
- 20260129_bm_balance_sheet_trends  
- 20260130_bm_surplus_cash_founder_risk  
- 20260201_add_value_analysis_column, create_client_opportunities_table  
- 20260202_value_suppressors_overhaul  
- 20260203_opportunity_calculations  
- 20260204_fix_bm_share_tracking, fix_bm_reports_rls, bm_reports_share_functionality  
- 20260205_fix_bm_reports_client_rls, add_bm_reports_delete_policy  

---

## 7. Flat folder contents (this folder)

All filenames are **flat** (path segments joined with `_`):

- **Docs:** README.md, BENCHMARKING_SYSTEM_ARCHITECTURE.md, COMPONENT_SUMMARIES.md, MIGRATIONS_INDEX.md, RELATED_DOCUMENTATION.md, BENCHMARKING_*_COPY.md.
- **Edge:** generate-bm-report-pass1-COPY.ts, generate-bm-report-pass2-COPY.ts, generate-bm-opportunities-COPY.ts, generate-benchmarking-pdf-COPY.ts, fetch-industry-benchmarks-COPY.ts, regenerate-bm-report-COPY.ts, save-bm-supplementary-data-COPY.ts.
- **Components:** components_admin_*.tsx, components_client_*.tsx, components_shared_*.tsx.
- **Page:** pages_ClientServicesPage-COPY.tsx.
- **Config/types/lib:** benchmarking-discovery-COPY.ts, benchmarking-types-COPY.ts, export-benchmarking-data-COPY.ts, scenario-calculator-COPY.ts, industry-mapper-COPY.ts, founder-risk-calculator-COPY.ts (legacy copy if present).
- **Migrations:** migrations_*.sql (all BM-related migrations above).

---

## 8. Critical implementation details

- **Report key:** Always use `engagement_id` when reading/updating `bm_reports` or calling the PDF function (not `id`).
- **Client name for PDF:** Resolved via `bm_engagements` → `practice_members`, not `clients`.
- **Suppressors / exit readiness:** Stored at **top level** on `bm_reports` (`enhanced_suppressors`, `exit_readiness_breakdown`), not under `pass1_data`.
- **PDF reportData:** Built from `report.value_analysis`, `report.enhanced_suppressors`, `report.exit_readiness_breakdown`; surplus/balance with fallbacks to `pass1_data`; scenarios and services derived or from recommendations.

---

*This summary and the flat file set reflect the live, deployed benchmarking system as of the date above.*
