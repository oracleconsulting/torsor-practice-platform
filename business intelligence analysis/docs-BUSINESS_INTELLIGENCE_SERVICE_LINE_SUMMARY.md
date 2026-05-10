# Business Intelligence — Service Line Summary

**Purpose:** Short live reference for the Business Intelligence (BI) offering: codes, tiers, data families, and where deeper architecture is documented. Edit this file in `docs/`; the assessment copy is refreshed by `scripts/sync-business-intelligence-assessment-copies.sh`.

**Related:** Full architecture and tables → `business intelligence analysis/BUSINESS_INTELLIGENCE_SYSTEM_SUMMARY.md` (updated only when explicitly requested). Discovery-facing popup mapping → `discovery assessment analysis/BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md`.

---

## What it is

- **Names:** Business Intelligence (client-facing); historically **Management Accounts** (`ma_*`) in schema and edge functions.
- **Catalogue codes:** `business_intelligence` (primary); legacy `management_accounts` (often aliased to the same client experience).
- **Outcome:** Monthly financial visibility — True Cash, KPIs, cash forecasts, scenarios, client profitability, curated insights, scheduled PDF delivery (tiered: Clarity → Foresight → Strategic).

## Data families

- **`bi_*`:** Engagements, periods, documents, financial data, KPI definitions/values/alerts, insights, cash forecasts, scenarios, client profitability, watch lists, report config, budgets, comparisons, generated reports, schedules, notification preferences.
- **`ma_*` (legacy / parallel):** Engagements, periods, documents, financial snapshots, extracted financials, insights, forecasts, scenarios, KPI selections/tracking, assessment reports, trend data, true cash, tier definitions, etc.

Both families remain relevant in migrations and functions (`generate-ma-*`, `generate-bi-*`).

## Edge functions (high level)

| Area | Examples |
|------|-----------|
| Upload & extraction | `upload-ma-document`, `extract-ma-financials`, `calculate-ma-trends` |
| Insights & narrative | `generate-ma-insights`, `generate-bi-insights`, `generate-ma-precall-analysis` |
| Reports & PDF | `generate-ma-report-pass1`, `generate-ma-report-pass2`, `generate-bi-pdf` |
| Forecasts & scenarios | `generate-ma-forecast`, `generate-ma-scenarios` |
| KPIs | `get-kpi-dashboard`, `get-kpi-definitions`, `manage-kpi-selections`, `save-kpi-values` |
| Delivery | `send-scheduled-report`, `regenerate-ma-admin-view` |
| Shared uploads | `process-accounts-upload`, `reprocess-accounts`, `upload-client-accounts` (also used by Benchmarking) |

## Frontend (live paths)

- **Admin:** `src/pages/admin/ClientServicesPage.tsx`, `src/components/business-intelligence/**`, `src/components/_bi_legacy/**` (legacy shell).
- **Platform:** `apps/platform/src/components/services/business-intelligence/**`, `apps/platform/src/types/business-intelligence.ts`.
- **Client portal:** `apps/client-portal/src/pages/services/BIDashboardPage.tsx`, `BIReportPage.tsx`, `BIPresentationPage.tsx`, `components/bi-dashboard/**`, `components/business-intelligence/**`, routes in `App.tsx`.

## Assessments

- Config: `src/config/serviceLineAssessments.ts` (MANAGEMENT_ACCOUNTS_ASSESSMENT / Business Intelligence); client portal mirror under `apps/client-portal/src/config/`.
- Storage: `service_line_assessments` with `service_line_code` in `management_accounts` / `business_intelligence`.

## Sync / analysis folder

- **Folder:** `business intelligence analysis/` (flat copies, read-only for live work).
- **Command:** `./torsor-practice-platform/scripts/sync-business-intelligence-assessment-copies.sh` from monorepo root (create or run from repo where that script exists).
- **Master doc:** `docs/TORSOR_PRACTICE_PLATFORM_MASTER.md` is copied into that folder by the sync script and by `scripts/sync-master-doc-to-all-analysis-folders.sh`.

---

## Sumary integration & ratio / variance layer

- **Positioning:** External MI (Sumary) supplies structured P&L / balance-sheet data; the BI service line remains the **visual wrapper and insight layer** (KPIs, ratios, variances, curated narrative, portal layout).
- **Import path:** Edge function `import-sumary-period` maps Sumary payloads into `bi_financial_data` via editable `bi_sumary_field_mappings`, logs `bi_sumary_imports`, mirrors MA rows where applicable, runs KPI persistence (`save-kpi-values`), and computes `bi_ratio_values` / `bi_variance_values`. No AI extraction on this path. Admin UI: **Sumary Import** tab on `ClientServicesPage` (`SumaryImportPanel.tsx`).
- **Catalogues:** `bi_ratio_definitions` and `bi_variance_definitions` (seeded via `seed-bi-ratio-catalogue`). Client-facing selections: `bi_ratio_selections`, `bi_variance_selections`; computed values per period: `bi_ratio_values`, `bi_variance_values`. Tier-aware caps enforced in `manage-bi-catalog-selections` and `lib/bi/tierCaps.ts` (Clarity: fewer ratios/variances, no AI period summary, no perpetual view; Foresight+: AI summary + perpetual; Strategic: drift alerts panel).
- **Dashboard sections:** Ratios and variances render through shared components under `src/components/business-intelligence/ratios/` and `variances/`, wired via `BICatalogSections` and section id `catalog_metrics` on `MADashboard`.
- **Per-report viewer:** Admin routes `/clients/:clientId/bi/reports`, `/clients/:clientId/bi/reports/:periodId`; client portal `/service/business_intelligence/reports` (+ redirects from `management_accounts` and `/services/business-intelligence/...`). Each report embeds `MADashboard` for the period, optional **bespoke period summary** (`bi_period_summaries`, editor `PeriodSummaryEditor`, AI draft via `generate-bi-period-summary` where tier allows). Clients only see summaries in **approved** or **published** status.
- **Perpetual tracker:** Admin `/clients/:clientId/bi/perpetual`; client `/service/business_intelligence/perpetual`. Consumes `bi_perpetual_metrics_view` and (Strategic) `bi_perpetual_drift_alerts`.
- **Legacy upload path:** Document upload + AI extraction (`extract-ma-financials`, etc.) remains available for clients not yet on Sumary; additive only.
