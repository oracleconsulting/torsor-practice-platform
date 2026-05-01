# Business Intelligence Service Line — System Summary & Architecture

**Purpose:** Oversight reference for the Business Intelligence (BI) / Management Accounts (MA) service line in torsor-practice-platform: data model, migrations, edge functions, and front-end surfaces (admin, platform, client portal).  
**This folder and summary are read-only in normal work; update this summary only when explicitly requested.**  
**Flat copies** of live files are produced by `scripts/sync-business-intelligence-assessment-copies.sh`.

**Last updated:** May 2026 (initial parity with Systems Audit / Benchmarking assessment folders).

---

## 1. Overview

- **Service name:** Business Intelligence (formerly Management Accounts; still reflected in `ma_*` tables and `generate-ma-*` functions).
- **Codes:** `business_intelligence` (primary), legacy `management_accounts` (portal and assessments often treat as equivalent).
- **Outcome:** Financial visibility on a recurring cycle: P&L / management data capture, KPI tracking, True Cash, cash-flow forecasting, scenarios, client profitability, AI-assisted insights with admin review, PDF generation, and scheduled delivery (three tiers: Clarity, Foresight, Strategic).

**Dual schema:** The product introduced **`bi_*`** tables while retaining **`ma_*`** tables from the original build. Edge functions and migrations may write to either or both depending on feature phase; treat both families as part of one service line.

---

## 2. Data Model (Families)

### 2.1 `bi_*` (current BI product tables)

Typical entities (see migrations `20260122_business_intelligence_core.sql`, `business_intelligence_kpis.sql`, `bi_phase1_enhancements.sql`, `bi_phase3_scheduling.sql`, `rename_ma_to_bi.sql`):

| Area | Examples |
|------|-----------|
| Engagement & time | `bi_engagements`, `bi_periods` |
| Documents & financials | `bi_documents`, `bi_financial_data` |
| KPIs | `bi_kpi_definitions`, `bi_kpi_values`, `bi_kpi_alerts` |
| Insights | `bi_insights` |
| Cash & scenarios | `bi_cash_forecasts`, `bi_cash_forecast_periods`, `bi_cash_flow_items`, `bi_scenarios` |
| Client economics | `bi_client_profitability`, `bi_watch_list` |
| Reporting | `bi_report_config`, `bi_budgets`, `bi_period_comparisons`, `bi_generated_reports`, `bi_report_schedules`, `bi_scheduled_report_history`, `bi_notification_preferences` |

Exact columns and RLS evolve with migrations in this folder prefixed `migrations-`.

### 2.2 `ma_*` (legacy / ongoing)

Still referenced for uploads, snapshots, assessment reports, KPI selections, trends, and True Cash, including but not limited to:

`ma_engagements`, `ma_periods`, `ma_documents`, `ma_financial_data`, `ma_financial_snapshots`, `ma_extracted_financials`, `ma_monthly_insights`, `ma_insights`, `ma_cash_forecasts`, `ma_scenarios`, `ma_client_profitability`, `ma_kpi_definitions`, `ma_kpi_selections`, `ma_kpi_tracking`, `ma_assessment_reports`, `ma_trend_data`, `ma_true_cash_calculations`, `ma_tier_definitions`, etc.

---

## 3. Migrations (Synced Set)

Chronological MA → BI migrations copied into this folder include:

- **20251216–20251218** — MA AI layer, documents RLS, assessment sync, insights constraints.
- **20260115–20260118** — Ongoing cycle, assessment questions/reports, sales flow, call context, RLS fixes.
- **20260120–20260121** — KPI system, portal core, dashboard elevation, insights review workflow, burn rate KPI.
- **20260122** — BI core tables, KPIs, phase 1/3 enhancements, storage bucket, MA→BI rename, period RLS fixes.

Re-run the sync script after adding migrations to pull new SQL into this folder.

---

## 4. Edge Functions

| Function | Role |
|----------|------|
| **upload-ma-document** | Accepts uploads; feeds extraction pipeline. |
| **extract-ma-financials** | Parses documents → structured financial data. |
| **calculate-ma-trends** | Trend analysis over financial series. |
| **generate-ma-insights** / **generate-bi-insights** | LLM-backed insight generation; BI variant aligns with `bi_insights` / review workflow. |
| **generate-ma-report-pass1** / **generate-ma-report-pass2** | Report narrative / refinement passes. |
| **generate-bi-pdf** | PDF output for client-ready packs. |
| **generate-ma-forecast** | Cash / P&L style forecasts. |
| **generate-ma-scenarios** | Scenario modelling support. |
| **generate-ma-precall-analysis** | Pre-call / consultant briefing generation. |
| **get-kpi-dashboard** / **get-kpi-definitions** / **save-kpi-values** / **manage-kpi-selections** | KPI CRUD and dashboard assembly. |
| **send-scheduled-report** | Reads `bi_report_schedules` (and related history); sends scheduled deliveries. |
| **regenerate-ma-admin-view** | Refreshes admin-facing aggregates / views after data changes. |
| **process-accounts-upload** / **reprocess-accounts** / **upload-client-accounts** | Shared accounts pipeline (also Benchmarking); included here for BI oversight. |

Shared scoring/registry context: **`_shared/service-registry.ts`**, **`service-scorer-v2.ts`**, **`service-scorer.ts`** (Discovery recommendations touching BI).

---

## 5. Front-End Architecture

### 5.1 Admin (`src/`)

- **Host:** `src/pages/admin/ClientServicesPage.tsx` — service tabs and BI/MA workflows per client.
- **Components:** `src/components/business-intelligence/**` — KPI dashboards, insights review, cash forecast charts, scenario builder, tier comparison, report scheduler, PDF export, profitability views, Tuesday question display, etc.
- **Legacy:** `src/components/_bi_legacy/**` — older BIDashboard shell; may still be referenced in places.
- **Types & services:** `src/types/business-intelligence.ts`, `src/services/business-intelligence/*`, `src/services/ma/*`, `src/services/BIAlertService.ts`.
- **Assessments:** `src/config/serviceLineAssessments.ts` — MANAGEMENT_ACCOUNTS_ASSESSMENT (Business Intelligence).

### 5.2 Platform app (`apps/platform/`)

- `apps/platform/src/components/services/business-intelligence/**` — e.g. MA admin/client report views, tier selector, previews.
- `apps/platform/src/types/business-intelligence.ts`.

### 5.3 Client portal (`apps/client-portal/`)

- **Pages:** `BIDashboardPage.tsx`, `BIReportPage.tsx`, `BIPresentationPage.tsx`.
- **Components:** `components/bi-dashboard/**`, `components/business-intelligence/**`.
- **Routing:** `App.tsx` — `/service/business_intelligence/*` and redirects from `management_accounts`.
- **Catalogue:** `lib/service-registry.ts` — tier names, pricing bands, popup content.
- **Assessments:** `config/serviceLineAssessments.ts`, `pages/services/ServiceAssessmentPage.tsx`.

---

## 6. Discovery & Catalogue

- Discovery scoring may recommend BI via **`service-scorer-v2`** (financial confidence, management information gaps).
- Client portal must map recommended codes/names to **`business_intelligence`** for popups (not **`quarterly_bi`**); see **`discovery assessment analysis/BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md`** for mapping notes.
- Architecture cross-links: **`docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md`** §3 (copied here as `docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md`).

---

## 7. Related Documentation

| Document | Location |
|----------|----------|
| Short service-line summary | `docs/BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md` → copied as `docs-BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md` |
| PDF export behaviour | `docs/PDF_EXPORT_FUNCTIONALITY.md` → `docs-PDF_EXPORT_FUNCTIONALITY.md` |
| Platform-wide master | `docs/TORSOR_PRACTICE_PLATFORM_MASTER.md` → `TORSOR_PRACTICE_PLATFORM_MASTER.md` |
| Inventory snapshot | `TORSOR_PLATFORM_INVENTORY.md` §3.2 (repo root; optional manual refresh into analysis if needed) |

---

## 8. Folder Contents (Flat Copies)

Synced filenames include:

- **Edge:** `*-copy.ts` per function listed in §4; **`shared-*-copy.ts`** for `_shared` modules.
- **Migrations:** `migrations-<timestamp>_<name>.sql`.
- **Admin UI:** `frontend-admin-*`, `frontend-admin-bi-*-copy.tsx`, `frontend-admin-bi_legacy-*-copy.tsx`.
- **Platform:** `frontend-platform-bi-*-copy.tsx`, `frontend-platform-types-business-intelligence.ts`.
- **Client:** `frontend-client-*` pages, components, `App.tsx`, registry, assessments config.

---

*Do not edit `-copy` artifacts during live development; change live paths and re-run the sync script.*
