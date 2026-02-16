# Systems Audit Service Line — System Summary & Architecture

**Purpose:** Comprehensive reference for the Systems Audit (Systems & Process Audit) service line in torsor-practice-platform: data model, migrations, edge functions, front-end (admin, platform, client portal), and integration with Discovery/scoring.  
**This folder and summary are read-only in normal work; update the summary only when explicitly requested.**

---

## 1. Overview

- **Service name:** Systems & Process Audit  
- **Code:** `systems_audit`  
- **Category:** Foundation  
- **Outcome:** Map every system, process, and workaround; identify what to fix first; deliver an audit report with findings and recommendations.  
- **Tiers:** Tier 1 (Systems map and priority list, £2,000 one-off); Tier 2 (Full audit with implementation roadmap, £4,500 one-off).

---

## 2. Data Model & Tables

### 2.1 Core engagement and Stage 1

| Table | Purpose |
|------|--------|
| **sa_engagements** | One row per client engagement. Tracks `client_id`, `practice_id`, `status` (pending → stage_1_complete → stage_2_complete → stage_3_scheduled → stage_3_complete → analysis_complete → report_delivered → implementation → completed), stage timestamps (`stage_1_completed_at`, `stage_2_completed_at`, `stage_3_completed_at`), `stage_3_consultant_id`, dates, `engagement_type`, `scope_areas`, `quoted_price`. |
| **sa_discovery_responses** | Stage 1 discovery: one row per engagement. Columns map to questions: Current Pain (`systems_breaking_point`, `operations_self_diagnosis`, `month_end_shame`), Impact (`manual_hours_monthly`, `month_end_close_duration`, `data_error_frequency`, `expensive_systems_mistake`, `information_access_frequency`), Tech Stack (`software_tools_used`, `integration_rating`, `critical_spreadsheets`), Focus (`broken_areas`, `magic_process_fix`), Readiness (`change_appetite`, `systems_fears`, `internal_champion`), Context (`team_size`, `expected_team_size_12mo`, `revenue_band`, `industry_sector`). Plus `raw_responses` JSONB. |

### 2.2 Stage 2 – System inventory

| Table | Purpose |
|------|--------|
| **sa_system_categories** | Reference: category codes and names for grouping systems. |
| **sa_system_inventory** | Per-engagement system cards: `system_name`, `category_code`, `usage_frequency`, `criticality`, pricing/cost, `integration_method`, `integrates_with`, `manual_transfer_required`, `manual_hours_monthly`, `data_quality_score`, `user_satisfaction`, `known_issues`, `workarounds_in_use`, `future_plan`, etc. |

### 2.3 Stage 3 – Process deep dives

| Table | Purpose |
|------|--------|
| **sa_process_chains** | Reference: process chains (e.g. quote_to_cash, procure_to_pay) with `chain_code`, `chain_name`, `process_steps`, `estimated_duration_mins`. |
| **sa_process_deep_dives** | Per-engagement, per `chain_code`: consultant-led; `responses` JSONB, `key_pain_points`, `hours_identified`, `scheduled_at`, `conducted_at`, `duration_mins`. |

### 2.4 Report and outputs

| Table | Purpose |
|------|--------|
| **sa_audit_reports** | One per engagement. Holds `headline`, `executive_summary`, `total_hours_wasted_weekly`, `total_annual_cost_of_chaos`, scores (`integration_score`, `automation_score`, `data_accessibility_score`, `scalability_score`), `critical_findings_count`, `high_findings_count`, narrative fields, `pass1_data` JSONB (from Pass 1 edge function). Status: `generating` → `generated` → `approved` → `published` → `delivered`. |
| **sa_findings** | Per engagement: `finding_code`, `source_stage`, `category`, `severity`, `title`, `description`, `evidence`, `hours_wasted_weekly`, `annual_cost_impact`, `recommendation`, `status`. |
| **sa_recommendations** | Per engagement: `priority_rank`, `category`, `implementation_phase`, benefits, dependencies, `finding_ids`. |

### 2.5 Documents and context

| Table | Purpose |
|------|--------|
| **sa_documents** | Documents attached to the engagement (e.g. process docs, spreadsheets). |
| **sa_context_notes** | Admin context notes for the engagement. |

---

## 3. Migrations (Chronological)

All SA-related migrations are copied into this folder with the prefix `migrations-`. Key migrations:

- **20251219_systems_audit_complete** – Creates `sa_engagements`, `sa_discovery_responses`, `sa_system_inventory`, `sa_system_categories`, `sa_process_chains`, `sa_process_deep_dives`, `sa_audit_reports`, `sa_findings`, `sa_recommendations`, RLS, indexes.
- **20251220_fix_sa_deep_dives_client_rls** – RLS for `sa_process_deep_dives`.
- **20251220_fix_sa_engagements_client_rls** – RLS for `sa_engagements`.
- **20251221_*** – Admin guidance columns, `sa_reports` status constraint, pass1_data column, `sa_engagements` admin RLS.
- **20251222_fix_sa_reports_*** – RLS for `sa_audit_reports` (update, client).
- **20260114_sa_documents_and_context** – `sa_documents`, `sa_context_notes`.
- **20260114_fix_sa_reports_rls_member_role** – RLS fix for member role on reports.
- **20260204_add_systems_audit_service** – Inserts `SYSTEMS_AUDIT` (and other services) into `services` table.

---

## 4. Edge Functions

| Function | Role |
|----------|------|
| **generate-sa-report** | Orchestrator: validates engagement and stages, calls Pass 1 then Pass 2, updates `sa_audit_reports` status, writes `sa_findings` and `sa_recommendations`. Uses LLM for extraction (Pass 1) and narrative (Pass 2). |
| **generate-sa-report-pass1** | Reads Stage 1 (`sa_discovery_responses`), Stage 2 (`sa_system_inventory`), Stage 3 (`sa_process_deep_dives`). Extracts structured facts, system/process analysis, metrics, cost calculations. Writes `pass1_data` to `sa_audit_reports` and sets status for Pass 2. |
| **generate-sa-report-pass2** | Reads `pass1_data` from `sa_audit_reports`. Writes narrative (story arc: Proof → Pattern → Price → Path → Plan). Updates report with `executive_summary`, `headline`, cost of chaos narrative, scores; status → `generated`. |

Shared modules used by SA and other services:

- **\_shared/service-registry.ts** – Defines `systems_audit` (name, tiers, pricing, example PDFs).
- **\_shared/service-scorer-v2.ts** – Discovery scoring: question/response → service points including `systems_audit` (chaos, manual work, awareness, key person risk, etc.).

---

## 5. Front-End Architecture

### 5.1 Admin (src/ and apps/platform)

- **ClientServicesPage.tsx** – Service line list includes “Systems Audit”. When the user selects Systems Audit and a client, the **Systems Audit modal** opens (not ClientDetailModal). The modal shows: Stage 1 (sa_discovery_responses), Stage 2 (inventory), Stage 3 (deep dives), Report, Findings, Recommendations, Documents, Context notes. Data is loaded from `sa_engagements`, `sa_discovery_responses`, `sa_system_inventory`, `sa_process_deep_dives`, `sa_audit_reports`, `sa_findings`, `sa_recommendations`, `sa_documents`, `sa_context_notes`.
- **apps/platform**  
  - **ClientDetailPage.tsx** – Can show a “Systems Audit” view when the client has an SA engagement (checks `sa_engagements` and `client_service_lines` for `systems_audit`).  
  - **SystemsAuditView.tsx** – Dedicated SA view: engagement status, Stage 1 discovery, systems list, deep dives, report, findings, recommendations, documents, context; can trigger report generation.
- **Config and types**  
  - **apps/platform/src/config/assessments/systems-audit-discovery.ts** – Stage 1 discovery config (19 questions, 6 sections) in `AssessmentConfig` format; used by platform admin.  
  - **apps/platform/src/types/systems-audit.ts** – TypeScript types: `SAEngagement`, `SADiscoveryResponse`, `SASystemInventory`, `SAProcessDeepDive`, `SAFinding`, `SARecommendation`, `SAAuditReport`, etc.

### 5.2 Client portal (apps/client-portal)

- **Routes**  
  - `/service/systems_audit/assessment` → **ServiceAssessmentPage** (Stage 1; uses `SYSTEMS_AUDIT_ASSESSMENT` from `serviceLineAssessments.ts`). Submits to create/update `sa_engagements` and `sa_discovery_responses`. On completion can redirect to Stage 2.  
  - `/service/systems_audit/inventory` → **SystemInventoryPage** – Stage 2 system inventory.  
  - `/service/systems_audit/process-deep-dives` → **ProcessDeepDivesPage** – Stage 3 deep dives and report view.
- **UnifiedDashboardPage** – Shows Systems Audit tile; route logic for `systems_audit` sends users to assessment / inventory / process-deep-dives by stage.
- **App.tsx** – Declares routes for `ServiceAssessmentPage`, `SystemInventoryPage`, `ProcessDeepDivesPage` for `systems_audit`.
- **Config**  
  - **serviceLineAssessments.ts** – `SYSTEMS_AUDIT_ASSESSMENT` (sections: Current Pain, Impact Quantification, Tech Stack, Focus Areas, Readiness).  
  - **service-registry.ts** – `systems_audit` entry (tiers, pricing).  
  - **useServiceContext.ts** / **useAdaptiveAssessment.ts** – Service context and display name for `systems_audit`.
- **Discovery**  
  - **DiscoveryReportPage.tsx** / **DiscoveryReportView.tsx** – Map “Systems Audit” / “Systems & Process Audit” to code `systems_audit` for display and navigation.

---

## 6. Integration with Discovery & Scoring

- **Service catalogue** – Pass 1 and Pass 2 discovery use a service catalog that includes Systems Audit (e.g. £2,000–£4,500).
- **service-scorer-v2** – Maps Discovery questionnaire responses to service points; high scores for chaos, manual work, “days later / blindsided”, key person risk, delegation issues, operational “what breaks if you double revenue” → `systems_audit`.
- **Issue–service mapping** – **issue-service-mapping.ts** maps issues (e.g. “manual”, “process”, “system”, “chaos”) to `systems_audit` for recommendations.
- **advisory-services-full.ts** – References Systems Audit in advisory/service content.

Systems Audit and Goal Alignment are **parallel** service lines: same admin surface and discovery journey, but separate engagement and report tables; no direct pipeline between them.

---

## 7. Assessment Configuration (Dual config)

- **Client portal (live):** `apps/client-portal/src/config/serviceLineAssessments.ts` – **SYSTEMS_AUDIT_ASSESSMENT** in `ServiceLineAssessment` format (15 questions, 5 sections). Used by **ServiceAssessmentPage** for Stage 1.
- **Platform admin (new Stage 1):** `apps/platform/src/config/assessments/systems-audit-discovery.ts` – **systemsAuditDiscoveryConfig** in `AssessmentConfig` format (19 questions, 6 sections). Used by platform for display/assessment; not yet wired as the single source for client portal. See **SYSTEMS_AUDIT_ASSESSMENT_STATUS.md** for current status and planned alignment.

---

## 8. Flat File Layout in This Folder

All files are in a **single folder** (no subfolders). Naming convention:

- **Edge functions:** `generate-sa-report-copy.ts`, `generate-sa-report-pass1-copy.ts`, `generate-sa-report-pass2-copy.ts`
- **Shared:** `shared-service-registry-copy.ts`, `shared-service-scorer-v2-copy.ts`, `shared-service-scorer-copy.ts`
- **Migrations:** `migrations-20251219_systems_audit_complete.sql`, etc.
- **Frontend admin:** `frontend-admin-ClientServicesPage.tsx`, `frontend-admin-issue-service-mapping.ts`, etc.
- **Frontend platform:** `frontend-platform-SystemsAuditView.tsx`, `frontend-platform-ClientDetailPage.tsx`, `frontend-platform-systems-audit-discovery.ts`, `frontend-platform-types-systems-audit.ts`
- **Frontend client:** `frontend-client-ServiceAssessmentPage.tsx`, `frontend-client-SystemInventoryPage.tsx`, `frontend-client-ProcessDeepDivesPage.tsx`, etc.
- **Docs:** `docs-SYSTEMS_AUDIT_ASSESSMENT_STATUS.md`, `docs-SYSTEMS_AUDIT_ASSESSMENT_QUESTIONS.md`, `docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md`

The **summary** (this file, **SYSTEMS_AUDIT_SYSTEM_SUMMARY.md**) is maintained in this folder and must **only be updated when explicitly requested** (see Cursor rule).

---

## 9. How to Refresh This Folder

From the **repository root**:

```bash
./torsor-practice-platform/scripts/sync-systems-audit-assessment-copies.sh
```

This overwrites all **copied** files from the live codebase. It does **not** overwrite or regenerate **SYSTEMS_AUDIT_SYSTEM_SUMMARY.md**; that document is updated only when the user explicitly asks to update the Systems Audit summary.

---

**Document generated:** February 2026  
**Scope:** torsor-practice-platform — Systems Audit service line only.
