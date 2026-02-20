# Systems Audit Service Line — System Summary & Architecture

**Purpose:** Comprehensive reference for the Systems Audit (Systems & Process Audit) service line in torsor-practice-platform: data model, migrations, edge functions, front-end (admin, platform, client portal), and integration with Discovery/scoring.  
**This folder and summary are read-only in normal work; update the summary only when explicitly requested.**

**Last updated:** February 2026 (post Part 4 universal "Add Context", field_notes, preliminary/report prompts).

---

## 1. Overview

- **Service name:** Systems & Process Audit  
- **Code:** `systems_audit`  
- **Category:** Foundation  
- **Outcome:** Map every system, process, and workaround; identify what to fix first; deliver an audit report with findings and recommendations.  
- **Tiers:** Tier 1 (Systems map and priority list, £2,000 one-off); Tier 2 (Full audit with implementation roadmap, £4,500 one-off).

**50/50 implementation (Feb 2026):** Status transition validation, `is_shared_with_client` and `hourly_rate` on engagements; comprehensive RLS review; 19-question 6-section Stage 1 assessment (including Context); Pass 1/Pass 2 pipeline (orchestrator deprecated); client-facing SA report page at `/service/systems_audit/report` when report is shared.

**Tech stack intelligence (Feb 2026):** Tech product database (`sa_tech_products`, `sa_tech_integrations`, `sa_middleware_capabilities`, `sa_auto_discovery_log`); **discover-sa-tech-product** edge function (lookup / lookup_batch / discover stub); Pass 1 Phase 4 injects tech context and generates **systems maps** (four-level), **techStackSummary**, **hoursBreakdown** in a separate AI call (Phase 4b) with graceful degradation; admin **Tech Database** page at `/tech-database`; **inventory badges** (In Database / Not in Database) and batch lookup on Stage 2 system inventory.

---

## 2. Data Model & Tables

### 2.1 Core engagement and Stage 1

| Table | Purpose |
|------|--------|
| **sa_engagements** | One row per client engagement. Tracks `client_id`, `practice_id`, `status` with **validated transitions** (pending → stage_1_complete → stage_2_complete → stage_3_scheduled | stage_3_complete → analysis_complete → report_delivered → implementation | completed). **New (20260216):** `is_shared_with_client` (BOOLEAN, default FALSE), `hourly_rate` (NUMERIC, default 45.00). Stage timestamps, `stage_3_consultant_id`, dates, `engagement_type`, `scope_areas`, `quoted_price`. Trigger `enforce_sa_status_transition` blocks invalid status changes (service_role bypass). |
| **sa_discovery_responses** | Stage 1 discovery: one row per engagement. Columns: Current Pain, Impact, Tech Stack, Focus, Readiness, **Context** (`team_size`, `expected_team_size_12mo`, `revenue_band`, `industry_sector`). Plus **`raw_responses`** JSONB: answers keyed by question ID; optional **`{questionId}_context`** keys for "Anything to add?" (max 300 chars, single/multi questions). |

### 2.2 Stage 2 – System inventory

| Table | Purpose |
|------|--------|
| **sa_system_categories** | Reference: category codes and names for grouping systems. |
| **sa_system_inventory** | Per-engagement system cards: `system_name`, `category_code`, usage, criticality, pricing, `integration_method`, `integrates_with`, `manual_transfer_required`, `manual_hours_monthly`, `data_quality_score`, `user_satisfaction`, `known_issues`, `workarounds_in_use`, `future_plan`, etc. **`field_notes`** JSONB (optional): per-field "Anything to add?" context keyed by field name (e.g. `criticality`, `integration_method`, `future_plan`). |

### 2.3 Stage 3 – Process deep dives

| Table | Purpose |
|------|--------|
| **sa_process_chains** | Reference: process chains (e.g. quote_to_cash, procure_to_pay). |
| **sa_process_deep_dives** | Per-engagement, per `chain_code`: consultant-led; **`responses`** JSONB (answers keyed by field; optional **`{field}_context`** for "Anything to add?"), `key_pain_points`, `hours_identified`, scheduling and conduct timestamps. |

### 2.4 Report and outputs

| Table | Purpose |
|------|--------|
| **sa_audit_reports** | One per engagement. `headline`, `executive_summary`, `total_hours_wasted_weekly`, `total_annual_cost_of_chaos`, `growth_multiplier`, `projected_cost_at_scale`, scores, narrative fields, **`pass1_data`** JSONB (Pass 1 extraction). Status: `generating` → `pass1_complete` → (Pass 2) → `generated` → `approved` → `published` → `delivered`. Client can SELECT only when engagement has `is_shared_with_client = TRUE` and report status in (generated, approved, published, delivered). |
| **sa_findings** | Per engagement: `finding_code`, `source_stage`, `category`, `severity`, `title`, `description`, `evidence`, `client_quote`, `hours_wasted_weekly`, `annual_cost_impact`, `recommendation`, `affected_systems`, `affected_processes`. Client SELECT only when engagement is shared. |
| **sa_recommendations** | Per engagement: `priority_rank`, `title`, `description`, `category`, `implementation_phase`, `estimated_cost`, `hours_saved_weekly`, **`annual_cost_savings`**, `time_reclaimed_weekly`, `freedom_unlocked`. Client SELECT only when engagement is shared. |

### 2.5 Documents and context

| Table | Purpose |
|------|--------|
| **sa_documents** | Documents attached to the engagement. Team only (no client access). |
| **sa_context_notes** | Admin context notes. Team only (no client access). |

### 2.6 Tech stack intelligence (live schema)

| Table | Purpose |
|------|--------|
| **sa_tech_products** | Master product DB: `slug` (unique), `product_name`, `vendor`, `category`, `market_position`, `uk_strong`, pricing (`price_entry_gbp`, `price_mid_gbp`, `price_top_gbp`, `is_per_user`), scores (`score_ease`, `score_features`, `score_integrations`, etc.), `key_strengths`, `key_weaknesses`, `best_for`, `not_ideal_for`, `sweet_min_employees`, `sweet_max_employees`, `has_zapier`, `has_make`, `has_api`. No `is_active`. |
| **sa_tech_integrations** | Pairwise integrations: `product_a_slug`, `product_b_slug`, `integration_type`, `quality`, `bidirectional`, `data_flows` (TEXT), `setup_complexity`, `setup_hours`, `monthly_cost_gbp`, `known_limitations`. UNIQUE(product_a_slug, product_b_slug). |
| **sa_middleware_capabilities** | Per-product middleware: `product_slug`, `platform` (zapier/make), `capability_type` (trigger/action/search), `capability_name`, `capability_description`. |
| **sa_auto_discovery_log** | Log of unknown products found during audits (for future auto-discovery). |

---

## 3. Migrations (Chronological)

All SA-related migrations are copied into this folder with the prefix `migrations-`. Key migrations:

- **20251219_systems_audit_complete** – Creates all SA tables, RLS, indexes.
- **20251220_fix_sa_*** – RLS for deep dives and engagements.
- **20251221_*** – Admin guidance columns, report status constraint, `pass1_data` column, engagements admin RLS.
- **20251222_fix_sa_reports_*** – RLS for `sa_audit_reports`.
- **20260114_sa_documents_and_context** – `sa_documents`, `sa_context_notes`; RLS fix for member role on reports.
- **20260204_add_systems_audit_service** – Inserts SYSTEMS_AUDIT into `services` table.
- **20260216_sa_status_validation_and_sharing** – **Status trigger:** `validate_sa_status_transition()` on `sa_engagements` (BEFORE UPDATE OF status); allowed transitions only; skip if status unchanged; service_role bypass. **Columns:** `is_shared_with_client` (BOOLEAN DEFAULT FALSE), `hourly_rate` (NUMERIC(10,2) DEFAULT 45.00). **Index:** `idx_sa_engagements_shared` on `(client_id) WHERE is_shared_with_client = TRUE`.
- **20260216_sa_rls_systematic_review** – **Helper functions:** `is_practice_team()`, `user_practice_ids()`, `user_client_ids()`. **Replaces all RLS** on the 8 SA tables: team policies via practice_id/engagement→practice; client policies via client_id or engagement→client; client can see reports/findings/recommendations only when `is_shared_with_client = TRUE` (and report status in generated/approved/published/delivered for reports). Uses dynamic DROP of existing policies from `pg_policies` then CREATE of new policies.
- **20260217_sa_*** – Engagements client insert, inventory data-entry context, text char limit 800, aspiration columns.
- **20260218000000_sa_pass1_phase_statuses** – Pass 1 phase status handling.
- **20260219000000_sa_tech_product_tables** – `sa_tech_products`, `sa_tech_integrations`, `sa_middleware_capabilities`, `sa_auto_discovery_log` (indexes, RLS).
- **20260220000001_sa_inventory_expansion** – Inventory columns (e.g. actual_usage_vs_capability, training_status, setup_ownership, contract_commitment).
- **20260220000002_sa_process_staff_interviews**, **20260220000003_sa_engagement_gaps_review** – Process/staff and gaps review.
- **20260221000001_sa_preliminary_analysis**, **20260221000002_sa_follow_up_script_transcript**, **20260222000001_sa_preliminary_gaps_and_status**, **20260222000002_sa_follow_up_script_transcript** – Preliminary analysis and follow-up.
- **20260223000001_sa_inventory_field_notes** – **`field_notes`** JSONB on `sa_system_inventory` for optional per-field context ("Anything to add?").
- **20260223000002_sa_pp_test_data_context** – Optional backfill of sample context for P&P test engagement (Stage 1 `raw_responses` and Stage 3 `responses`).

---

## 4. Edge Functions

| Function | Role |
|----------|------|
| **generate-sa-report** | **Deprecated orchestrator.** Thin redirect: parses `engagementId`, logs deprecation, calls `generate-sa-report-pass1` via fetch, returns Pass 1 response with `_note: 'Routed through deprecated orchestrator → Pass 1 pipeline'`. No longer contains inline Pass 1/Pass 2 logic. |
| **generate-sa-report-pass1** | **Phase 1:** Extract core facts and system inventory (12k tokens). **Phase 2:** Analyse processes, scores, uniquenessBrief, aspirationGap (12k). **Phase 3:** Diagnose — findings + quick wins (12k). **Phase 4a:** Recommend — recommendations only (12k tokens). **Phase 4b (separate call):** Queries tech stack DB (products with `uk_strong`, integrations, middleware), builds **tech context** via `buildTechContext()`, then one AI call (32k tokens) to generate **systemsMaps** (four levels), **techStackSummary**, **hoursBreakdown**; wrapped in try/catch — on failure sets null and continues. Final `pass1_data` includes `systemsMaps`, `techStackSummary`, `hoursBreakdown` (from Phase 4b merge). Writes findings/recommendations to `sa_findings` / `sa_recommendations`. Invokes Pass 2 via fetch when complete. |
| **generate-sa-report-pass2** | Reads `pass1_data` from `sa_audit_reports`. Writes narrative using **client’s actual system names** from inventory (no hardcoded Harvest/Asana/Xero); uses **`breakingPoint`** for framing; dynamic Path and time-freedom examples from `f.systems`. Updates report with headline, executive_summary, cost_of_chaos_narrative, time_freedom_narrative, scores; status → `generated`. |
| **analyze-sa-preliminary** | Reviews completed SA assessment (Stage 1 `raw_responses`, Stage 2 inventory with **`field_notes`**, Stage 3 deep dives **`responses`** including **`_context`** keys). Builds prompt with context inline (`→ Context: "..."` / `→ {field} note: "..."`). Returns JSON: businessSnapshot, confidenceScores, suggestedGaps, contradictions, topInsights. |
| **discover-sa-tech-product** | **Lookup:** `action: 'lookup'`, `productName` → returns `found`, `product` (full payload with pricing, scores, integration_count, middleware_count, integrations list), `integrations`. **Lookup batch:** `action: 'lookup_batch'`, `productNames[]` → returns `results: Record<name, { found, slug, product_name, category, integration_count }>`. **Discover:** `action: 'discover'` → stub (returns "Auto-discovery coming soon"). Uses live schema (`slug`, `category`, `uk_strong`, `score_ease`, etc.). Fuzzy match: slug, name, contains, slug partial. |

**Context in prompts:** **generate-sa-report-pass1** Phase 1 includes Stage 1 optional context (raw_responses keys ending `_context`) and per-system **field_notes**; Phase 2 deep-dive text includes **`_context`** per response. **analyze-sa-preliminary** includes the same context inline.

Shared modules: **\_shared/service-registry.ts**, **\_shared/service-scorer-v2.ts** (Discovery scoring for `systems_audit`).

---

## 5. Front-End Architecture

### 5.1 Admin (src/ and apps/platform)

- **ClientServicesPage.tsx** – Service line list includes “Systems Audit”; Systems Audit modal shows Stage 1–3, Report, Findings, Recommendations, Documents, Context notes.
- **apps/platform** – **ClientDetailPage.tsx**, **SystemsAuditView.tsx**; **systems-audit-discovery.ts** (19q config); **types/systems-audit.ts**. Stage 2 inventory uses **discover-sa-tech-product** (`lookup_batch`) and **SystemMatchBadge** (In Database / Not in Database). **TechDatabasePage** at /tech-database; **useTechLookupBatch**, **types/tech-stack.ts**.

### 5.2 Client portal (apps/client-portal)

- **Routes**  
  - `/service/systems_audit/assessment` → **ServiceAssessmentPage** (Stage 1; **19 questions, 6 sections** including Context).  
  - `/service/systems_audit/inventory` → **SystemInventoryPage** (Stage 2).  
  - `/service/systems_audit/process-deep-dives` → **ProcessDeepDivesPage** (Stage 3).  
  - **`/service/systems_audit/report`** → **SAReportPage** (client-facing report when `is_shared_with_client = TRUE`).
- **UnifiedDashboardPage** – SA tile; **if `saReportShared`** then route to `/service/systems_audit/report` and status “Report Ready” (emerald); else stage-based routing (assessment → inventory → process-deep-dives).
- **App.tsx** – Declares routes including **SAReportPage** at `/service/systems_audit/report`.
- **Config** – **serviceLineAssessments.ts**: **SYSTEMS_AUDIT_ASSESSMENT** with **19 questions, 6 sections** (Current Pain, Impact Quantification, Tech Stack, Focus Areas, Readiness, **Context**). Includes **sa_information_access** (Q2.5), **sa_team_size**, **sa_expected_team_size**, **sa_revenue_band**, **sa_industry**; **sa_manual_hours** has 5 options only; **sa_fears** has 7 options including “No major fears – just want to get on with it” and “We’ll discover how bad things really are”.
- **ServiceAssessmentPage** – Stage 1: **"Anything to add?"** optional context on every **single** and **multi** question (collapsible link → 300-char textarea); stored in `raw_responses` as `{questionId}_context`. Maps information_access_frequency, team_size, expected_team_size_12mo, revenue_band, industry_sector.
- **SystemInventoryPage** – Stage 2: **"Anything to add?"** after key dropdowns (criticality, integration_method, future_plan); stored in **`field_notes`** JSONB per system.
- **ProcessDeepDivesPage** – Stage 3: **"Anything to add?"** on every **select** and **multi_select**; stored in `responses` as `{field}_context`.
- **SAReportPage** – Full client report: sticky nav (Overview, Cost of Chaos, Findings, The Plan, Your Future); hero + score rings; cost narrative; findings accordion; recommendations with phase badges and payback; “Your Future” + magic-fix quote; CTA to `/appointments`. Loads from `sa_engagements` (checks `is_shared_with_client`), `sa_audit_reports`, `sa_findings`, `sa_recommendations`; redirects to dashboard if not shared or no report.

---

## 6. Integration with Discovery & Scoring

- Service catalogue and **service-scorer-v2** map Discovery responses to `systems_audit` (chaos, manual work, key person risk, etc.).
- **issue-service-mapping.ts**, **advisory-services-full.ts** reference Systems Audit.
- Systems Audit and Goal Alignment are parallel service lines; no direct pipeline between them.

---

## 7. Assessment Configuration

- **Client portal (live):** `apps/client-portal/src/config/serviceLineAssessments.ts` – **SYSTEMS_AUDIT_ASSESSMENT**: **19 questions, 6 sections** (Current Pain, Impact Quantification, Tech Stack, Focus Areas, Readiness, Context). Used by **ServiceAssessmentPage** for Stage 1. All fields map to `sa_discovery_responses` including `information_access_frequency`, `team_size`, `expected_team_size_12mo`, `revenue_band`, `industry_sector`.
- **Platform admin:** `apps/platform/src/config/assessments/systems-audit-discovery.ts` – 19q config for platform display/assessment. See **docs-SYSTEMS_AUDIT_ASSESSMENT_STATUS.md** for alignment notes.

---

## 8. Flat File Layout in This Folder

All files are in a **single folder** (no subfolders). Naming convention:

- **Edge functions:** `generate-sa-report-copy.ts`, `generate-sa-report-pass1-copy.ts`, `generate-sa-report-pass2-copy.ts`, **`analyze-sa-preliminary-copy.ts`**, **`discover-sa-tech-product-copy.ts`**
- **Shared:** `shared-service-registry-copy.ts`, `shared-service-scorer-v2-copy.ts`, `shared-service-scorer-copy.ts`
- **Migrations:** `migrations-20251219_systems_audit_complete.sql`, … **`migrations-20260219000000_sa_tech_product_tables.sql`**, **`migrations-20260220000001_sa_inventory_expansion.sql`** … **`migrations-20260223000002_sa_pp_test_data_context.sql`**
- **Frontend admin:** `frontend-admin-ClientServicesPage.tsx`, **`frontend-admin-TechDatabasePage.tsx`**, **`frontend-admin-SystemMatchBadge.tsx`**, **`frontend-admin-useTechLookupBatch.ts`**, **`frontend-admin-types-tech-stack.ts`**, etc.
- **Frontend platform:** `frontend-platform-SystemsAuditView.tsx`, etc.
- **Frontend client:** `frontend-client-ServiceAssessmentPage.tsx`, `frontend-client-SystemInventoryPage.tsx`, `frontend-client-ProcessDeepDivesPage.tsx`, **`frontend-client-SAReportPage.tsx`**, `frontend-client-UnifiedDashboardPage.tsx`, `frontend-client-App.tsx`, `frontend-client-serviceLineAssessments.ts`, etc.
- **Docs:** `docs-SYSTEMS_AUDIT_ASSESSMENT_STATUS.md`, `docs-SYSTEMS_AUDIT_ASSESSMENT_QUESTIONS.md`, `docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md`
- **Summary:** **SYSTEMS_AUDIT_SYSTEM_SUMMARY.md** (this file) — update only when explicitly requested.
- **Master:** **TORSOR_PRACTICE_PLATFORM_MASTER.md** — copied from `docs/TORSOR_PRACTICE_PLATFORM_MASTER.md` by sync script.

---

## 9. How to Refresh This Folder

From the **repository root**:

```bash
./torsor-practice-platform/scripts/sync-systems-audit-assessment-copies.sh
```

This overwrites all **copied** files from the live codebase (including the two 20260216 migrations and **frontend-client-SAReportPage.tsx**). It does **not** overwrite **SYSTEMS_AUDIT_SYSTEM_SUMMARY.md**; that document is updated only when the user explicitly asks to update the Systems Audit summary.

---

**Document generated:** February 2026  
**Scope:** torsor-practice-platform — Systems Audit service line (50/50 implementation, tech stack intelligence, Pass 1 phase split, systems maps, universal "Add Context" on structured questions, field_notes, preliminary analysis).
