# Service Lines Architecture — Discovery Document

**Purpose:** Comprehensive reference for how the four core service lines (Benchmarking & Hidden Value, Business Intelligence, Goal Alignment, Systems Audit) are implemented end-to-end: assessments, front-end layout, backend architecture, and linkage to skills. Use this when designing new service lines so new flows follow existing patterns from assessment → analysis → client engagement.

**No files were altered.** This is a read-only discovery summary.

---

## Table of Contents

1. [High-Level Comparison](#1-high-level-comparison)
2. [Benchmarking & Hidden Value](#2-benchmarking--hidden-value)
3. [Business Intelligence](#3-business-intelligence)
4. [Goal Alignment Programme](#4-goal-alignment-programme)
5. [Systems Audit](#5-systems-audit)
6. [Discovery → Service Recommendation](#6-discovery--service-recommendation)
7. [Skills Linkage](#7-skills-linkage)
8. [Patterns for New Service Lines](#8-patterns-for-new-service-lines)

---

## 1. High-Level Comparison

| Aspect | Benchmarking & Hidden Value | Business Intelligence | Goal Alignment | Systems Audit |
|--------|-----------------------------|------------------------|----------------|---------------|
| **Code** | `benchmarking` | `business_intelligence` (legacy: `management_accounts`, `quarterly_bi`) | `365_method` / `goal_alignment` | `systems_audit` |
| **Assessment source** | DB: `assessment_questions` (service_line_code=benchmarking) | DB: `assessment_questions` (business_intelligence) + client config in `serviceLineAssessments.ts` | Discovery + roadmap stages (fit, vision, shift, sprint) | Dedicated tables: `sa_discovery_responses` (Stage 1) |
| **Response storage** | `service_line_assessments` (responses JSONB) + `bm_assessment_responses` | `service_line_assessments` | `roadmap_stages` + `client_roadmaps` | `sa_discovery_responses` (columns), `sa_system_inventory`, `sa_process_deep_dives` |
| **Engagement table** | `bm_engagements` | Client enrollment only (`client_service_lines`) | `client_roadmaps` + `roadmap_stages` | `sa_engagements` |
| **Report / output table** | `bm_reports` (+ `value_analysis` JSONB, HVA) | MA/BI dashboards, KPI values, reports | `client_roadmaps.roadmap_data`, `roadmap_stages` | `sa_audit_reports`, `sa_findings`, `sa_recommendations` |
| **Backend generation** | `generate-bm-report-pass1`, `generate-bm-report-pass2`, `generate-benchmarking-pdf`, `generate-value-analysis` | `generate-ma-*`, `generate-bi-*`, `get-kpi-dashboard`, `process-accounts-upload` (Discovery financials) | `generate-roadmap`, `generate-five-year-vision`, `generate-six-month-shift`, `generate-sprint-plan-part1/2`, `roadmap-orchestrator` | `generate-sa-report`, `generate-sa-report-pass1`, `generate-sa-report-pass2` |
| **Admin UI** | `ClientServicesPage` → Benchmarking modal; `BenchmarkingAdminView`, `AccountsUploadPanel`, etc. | `ClientServicesPage` → ClientDetailModal (assessments + BI tabs); MA/BI components | `ClientServicesPage` → ClientDetailModal (roadmap tab, phases, “Enabled by” Goal Alignment) | `ClientServicesPage` → Systems Audit modal (stages 1–3, findings, report) |
| **Client portal routes** | `/service/benchmarking/report` | `/service/business_intelligence/assessment`, MA dashboard/report routes | `/roadmap`, `/roadmap/tasks` | `/service/systems_audit/assessment`, `/service/systems_audit/inventory`, `/service/systems_audit/deep-dives` |
| **Client portal pages** | `BenchmarkingReportPage` | `ServiceAssessmentPage` (BI), `MADashboardPage`, `MAReportPage` | `RoadmapPage`, `TasksPage` | `ServiceAssessmentPage`, `SystemInventoryPage`, `ProcessDeepDivesPage` |

---

## 2. Benchmarking & Hidden Value

### 2.1 Overview

- **Name:** Benchmarking (Industry Benchmarking / Full Package) + Hidden Value Analysis (HVA).
- **Discovery names:** “Benchmarking & Hidden Value Analysis”, “Industry Benchmarking”, “Hidden Value Audit” → all map to `benchmarking`.
- **Outcome:** Client sees how they compare to industry (metrics, percentiles), narrative report, opportunity sizing; optional HVA (value suppression, exit readiness) feeds into `bm_reports.value_analysis`.

### 2.2 Assessments

- **Primary:** Benchmarking assessment (15–17 questions) stored in **`assessment_questions`** with `service_line_code = 'benchmarking'`.
  - Sections: **Classification** (business description, industry, sub-sector, SIC), **Size & Context** (revenue, employees, age, location), **Perception** (performance vs competitors, current tracking), **Priorities** (suspected underperformance, leaving money on table, top-quartile ambition), **Magic & Action** (magic fix, action readiness, blind spot).
  - Migration: `20251222_seed_benchmarking_assessment_questions.sql`; also `20260201_add_leadership_direction_questions.sql` for leadership questions.
- **Responses:**  
  - **`service_line_assessments`** — used for completion tracking and as fallback (e.g. admin modal) with `service_line_code = 'benchmarking'`, `responses` JSONB.  
  - **`bm_assessment_responses`** — canonical engagement-level answers (one row per `bm_engagements.id`): classification, size, self-assessment, pain/priority, magic/action fields as columns.
- **Hidden Value Audit (HVA):** Separate flow; data can feed `bm_reports.value_analysis` (e.g. exit readiness, surplus cash, value suppressors). References: `hva_engagements` in test/migration scripts; `generate-value-analysis` edge function; value analysis in roadmap (Goal Alignment) also exists.

### 2.3 Backend Architecture

- **Engagement:** `bm_engagements` (client_id, practice_id, status: draft → assessment_complete → pass1_complete → generated → approved → published → delivered).
- **Report:** `bm_reports` (one per engagement): industry/revenue/employee band, narratives (headline, executive_summary, position/strength/gap/opportunity), metrics_comparison JSONB, top_strengths/top_gaps, opportunity sizing, admin guidance (talking_points, questions_to_ask, next_steps, risk_flags), recommendations, `value_analysis` JSONB.
- **Supporting:** `bm_metric_comparisons` (per-metric client vs benchmark); `industries`, `benchmark_metrics`, `benchmark_data`; `benchmark_sources`, `benchmark_refresh_log`.
- **Edge functions:**
  - **generate-bm-report-pass1** — metrics, comparisons, admin guidance.
  - **generate-bm-report-pass2** — narrative (headline, summaries, strengths/gaps, opportunities).
  - **generate-benchmarking-pdf** — PDF from report.
  - **generate-value-analysis** — value/HVA content (can feed `value_analysis`).
  - **generate-bm-opportunities** — opportunity sizing.
  - **save-bm-supplementary-data**, **reset-bm-report**, **regenerate-bm-report** — admin actions.
- **Financial data:** Client financials (e.g. from accounts upload) are used for benchmarking; `process-accounts-upload` and client financial tables (e.g. `client_financial_data`, investment vehicle columns) feed into metrics. See migrations for `client_financial_data` and benchmarking-related columns.

### 2.4 Front-End Layout

- **Admin:** `ClientServicesPage` — when service line “Benchmarking” is selected and a client is chosen, opens **BenchmarkingClientModal**. Tabs: Assessment, Hidden Value Audit (Part 3), Accounts Upload, **Analysis** (BenchmarkingClientReport), **Admin View** (BenchmarkingAdminView). Uses `bm_engagements`, `bm_reports`, HVA data; share toggle syncs to `bm_engagements` and report sharing.
- **Components:** `src/components/benchmarking/` — admin (AccountsUploadPanel, BenchmarkingAdminView, ValueAnalysisPanel, etc.), client (BenchmarkingClientReport, narrative sections, scenario explorer, service recommendations).
- **Client portal:** Route `/service/benchmarking/report` → **BenchmarkingReportPage**; client sees report when shared. Assessment can be taken via service assessment flow (benchmarking loads questions from DB in `ServiceAssessmentPage`).

### 2.5 Link to Discovery

- Discovery recommends “Benchmarking” / “Hidden Value Audit” via service scorer (e.g. `sd_benchmark_awareness` = No → benchmarking; “Don’t know how we compare” → benchmarking). Pass 1/2 use catalog entry for “Industry Benchmarking” with tiers (e.g. Tier 1 £2,000, Tier 2 £4,500). Report page shows “Benchmarking & Hidden Value Analysis” etc. in service name mapping.

---

## 3. Business Intelligence

### 3.1 Overview

- **Name:** Business Intelligence (formerly Management Accounts / Quarterly BI).
- **Codes:** `business_intelligence` (primary), legacy `management_accounts`, `quarterly_bi` in places.
- **Outcome:** Financial visibility: True Cash, KPIs, dashboards, insights, forecasts, scenario modelling; monthly/quarterly reporting.

### 3.2 Assessments

- **Source:** **`src/config/serviceLineAssessments.ts`** — **MANAGEMENT_ACCOUNTS_ASSESSMENT** (exported as Business Intelligence). Same definitions may be reflected in DB via migrations (e.g. `assessment_questions` for `business_intelligence` / `management_accounts`).
- **Sections:** Current State, Pain Points, System Context, Business Model, Known Commitments, Reporting Requirements, Desired Outcomes, Frequency & Scope (many questions, e.g. relationship with numbers, Tuesday morning question, pain points, accounting platform, revenue model, reporting frequency, transformation desires).
- **Storage:** **`service_line_assessments`** with `service_line_code` in `('management_accounts', 'business_intelligence')`; `responses` JSONB. Admin also fetches `extracted_insights` for display.
- **Optional:** MA assessment report flow (`ma_assessment_reports`, shared_with_client, pass2_data) can redirect client to a post-assessment view.

### 3.3 Backend Architecture

- **Engagement:** No dedicated engagement table; enrollment in **`client_service_lines`** (service_line_id for Business Intelligence). Progress tracked via `service_line_assessments` and onboarding_completed_at on enrollment.
- **Data:** KPI definitions and values (e.g. `kpi_definitions`, KPI values tables), client financial data from accounts upload; BI-specific tables for dashboards and insights.
- **Edge functions:** `generate-ma-report-pass1`, `generate-ma-report-pass2`, `generate-ma-insights`, `generate-ma-forecast`, `generate-ma-scenarios`, `generate-bi-insights`, `generate-bi-pdf`, `get-kpi-dashboard`, `get-kpi-definitions`, `save-kpi-values`, `manage-kpi-selections`, `process-accounts-upload`, `extract-ma-financials`, `calculate-ma-trends`, etc.

### 3.4 Front-End Layout

- **Admin:** `ClientServicesPage` → **ClientDetailModal** when service is Business Intelligence (or management_accounts). Tabs include Overview, Roadmap (if 365), **Assessments** (service line assessments for BI/MA), Documents, Analysis. BI/MA-specific: BI dashboard, KPI manager, insights, reports.
- **Components:** `src/components/management-accounts/` (MADashboard, MAClientReportView, KPIDashboard, TrueCashCard, ScenarioBuilder, etc.); `src/components/business-intelligence/` (BIDashboard, CashForecastSection, KPIGrid, TrueCashWaterfall, etc.).
- **Client portal:** `/service/:serviceCode/assessment` with `serviceCode=business_intelligence` (or management_accounts) → **ServiceAssessmentPage**. After assessment, **MADashboardPage**, **MAReportPage**, **MAPresentationPage** for reports/dashboard.

### 3.5 Link to Discovery

- Discovery scorer: low financial confidence, numbers rarely change behaviour, no management information → business_intelligence. Pass 2 catalog: “Business Intelligence” (e.g. Clarity tier, turnover-scaled pricing). Report and client report page map “Business Intelligence”, “Management Accounts”, “Quarterly BI” to `quarterly_bi` / `business_intelligence`.

---

## 4. Goal Alignment Programme

### 4.1 Overview

- **Name:** Goal Alignment Programme (365 Alignment / 365 Method).
- **Codes:** `365_method`, `goal_alignment` (discovery/catalogue).
- **Outcome:** Life-first transformation: 5-year vision, 6-month shift, 12-week sprints; roadmap and value analysis; “Enabled by” in discovery journey often shows “Goal Alignment Programme” or “365”.

### 4.2 Assessments

- **Discovery:** Part of the main **Destination Discovery** (Part 1 & 2) drives recommendation for Goal Alignment (e.g. plan clarity, accountability, time/firefighting, burnout signals).
- **Roadmap-specific:** No separate “Goal Alignment assessment” table; instead the **roadmap pipeline** is the assessment + delivery:
  - **fit_assessment** — Fit profile, north star.
  - **five_year_vision** — 5-year vision.
  - **six_month_shift** — 6-month shift.
  - **sprint_plan** (or **sprint_plan_part1** → **sprint_plan_part2**) — 12-week sprint.
  - **value_analysis** — Value/readiness (trigger chain: sprint_plan_part2 → value_analysis).
- **Storage:** **`roadmap_stages`** (client_id, practice_id, stage_type, status, output JSONB); legacy **`client_roadmaps`** (roadmap_data JSONB: fitProfile, fiveYearVision, sixMonthShift, sprint; value_analysis).

### 4.3 Backend Architecture

- **Engagement:** **`client_roadmaps`** (legacy single roadmap per client); **`roadmap_stages`** (per-stage status and output). Client listed under Goal Alignment when enrolled in `client_service_lines` for `365_method` and optionally when they have a roadmap.
- **Edge functions:** **generate-roadmap** (orchestration), **generate-five-year-vision**, **generate-six-month-shift**, **generate-sprint-plan**, **generate-sprint-plan-part1**, **generate-sprint-plan-part2**, **roadmap-orchestrator** (trigger chain), **generate-fit-profile**; **notify-roadmap-ready**.
- **Trigger chain:** fit_assessment → five_year_vision → six_month_shift → sprint_plan_part1 → sprint_plan_part2 → value_analysis (see migrations for `trigger_next_stage`).

### 4.4 Front-End Layout

- **Admin:** `ClientServicesPage` → **ClientDetailModal** for `365_method`: tabs include **Roadmap** (phases, “Enabled by: Goal Alignment Programme”), Assessments, Documents, etc. Roadmap built from `roadmap_stages` or fallback `client_roadmaps.roadmap_data`.
- **Components:** Transformation journey (discovery), roadmap views; client portal roadmap components.
- **Client portal:** **`/roadmap`** → **RoadmapPage** (status, generation trigger, display of vision/shift/sprint, value analysis); **`/roadmap/tasks`** → **TasksPage**. Layout shows vision, shift, sprint, north star, tagline from roadmap data.

### 4.5 Link to Discovery

- Discovery scorer: no clear plan, no accountability, burnout/lifestyle signals, “magic fix” clarity/strategy/freedom → goal_alignment. Pass 2 **ENABLED_BY_STRINGS** and journey phases show “Goal Alignment Programme” or “365”. Service catalogue: Goal Alignment (e.g. standard tier £1,500–£4,500/month).

---

## 5. Systems Audit

### 5.1 Overview

- **Name:** Systems Audit (Systems & Process Audit).
- **Code:** `systems_audit`.
- **Outcome:** Identify operational bottlenecks, integration gaps, manual workarounds; findings, recommendations, and a delivered audit report.

### 5.2 Assessments

- **Stage 1 (Discovery):** Stored in **`sa_discovery_responses`** (one row per `sa_engagements.id`). Columns map to questions: Current Pain (systems_breaking_point, operations_self_diagnosis, month_end_shame), Impact Quantification (manual_hours_monthly, month_end_close_duration, data_error_frequency, expensive_systems_mistake, information_access_frequency), Tech Stack (software_tools_used, integration_rating, critical_spreadsheets), Focus Areas (broken_areas, magic_process_fix), Readiness (change_appetite, systems_fears, internal_champion), Context (team_size, expected_team_size_12mo, revenue_band, industry_sector). Plus `raw_responses` JSONB.
- **Config:** **`src/config/serviceLineAssessments.ts`** — **SYSTEMS_AUDIT_ASSESSMENT** (sections: Current Pain, Impact Quantification, Tech Stack, Focus Areas, Readiness). Client portal and admin map this to the same structure; client submits to **`sa_discovery_responses`** (and engagement created/linked).
- **Stage 2:** **`sa_system_inventory`** — per-engagement system cards (category from **`sa_system_categories`**), usage, cost, integration, data quality, satisfaction, pain points, future plan.
- **Stage 3:** **`sa_process_deep_dives`** — per engagement and chain_code (from **`sa_process_chains**”, e.g. quote_to_cash, procure_to_pay), consultant-led; responses JSONB, key_pain_points, hours_identified.

### 5.3 Backend Architecture

- **Engagement:** **`sa_engagements`** (client_id, practice_id, status: pending → stage_1_complete → stage_2_complete → stage_3_scheduled → stage_3_complete → analysis_complete → report_delivered → implementation → completed). Stage timestamps and stage_3_consultant_id.
- **Report & analysis:** **`sa_audit_reports`** (one per engagement): headline, executive_summary, cost of chaos, scores (integration, automation, data accessibility, scalability), findings summary, quick_wins, investment summary, time freedom narrative; status workflow: generating → generated → approved → published → delivered.
- **Findings / recommendations:** **`sa_findings`** (per engagement: category, severity, title, description, impact, recommendation, status); **`sa_recommendations`** (priority_rank, category, implementation_phase, benefits, dependencies).
- **Reference:** **`sa_system_categories`**, **`sa_process_chains`**.
- **Edge functions:** **generate-sa-report** (orchestration), **generate-sa-report-pass1**, **generate-sa-report-pass2** — read Stage 1–3 data and produce report, findings, recommendations.

### 5.4 Front-End Layout

- **Admin:** `ClientServicesPage` → when service line “Systems Audit” and client selected, opens **Systems Audit modal** (not ClientDetailModal): Stage 1 (sa_discovery_responses), Stage 2 (inventory), Stage 3 (deep dives), Report, Findings, Recommendations, Documents, Context notes.
- **Components:** `src/components/systems-audit/` (SAAdminReportView, SAClientReportView).
- **Client portal:** **`/service/systems_audit/assessment`** → **ServiceAssessmentPage** (Systems Audit config from serviceLineAssessments); submits to create/update **`sa_engagements`** and **`sa_discovery_responses`**. **`/service/systems_audit/inventory`** → **SystemInventoryPage**; **`/service/systems_audit/deep-dives`** (or similar) → **ProcessDeepDivesPage**.

### 5.5 Link to Discovery

- Discovery scorer: founder dependency “chaos”, manual work >30%, problem awareness “days/blindsided”, key person risk, delegation poor, “what breaks if you double revenue” operational → systems_audit. Pass 2 catalog: Systems Audit (e.g. £2,000–£5,000). Report and client report page map “Systems Audit” to `systems_audit`.

---

## 6. Discovery → Service Recommendation

- **Pass 1** (`generate-discovery-report-pass1`): Uses **SERVICE_CATALOG** (benchmarking, systems_audit, business_intelligence, goal_alignment, etc.) and calculators to produce **recommendedInvestments** and **page3_journey.phases** with default pricing.
- **Pass 2** (`generate-discovery-report-pass2`): Consumes Pass 1 output; applies **pinned_services** / **blocked_services** from **`discovery_engagements`**; builds **recommendedServices**; uses **ENABLED_BY_STRINGS** for “Enabled by” (e.g. Goal Alignment); hardcoded pricing for systems_audit (£2,000) and others as per catalog.
- **Pass 3** (`generate-discovery-opportunities`): **`discovery_opportunities`** and report opportunity fields; respects pin/block.
- **Scoring:** **`_shared/service-scorer-v2.ts`** — question/response → service codes and points (goal_alignment, business_intelligence, systems_audit, benchmarking, automation, fractional_cfo/coo, business_advisory). Used by Pass 1 and opportunity logic.
- **Client report:** **`apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx`** — maps display names (e.g. “Benchmarking & Hidden Value Analysis”, “Goal Alignment Programme”, “Systems Audit”, “Business Intelligence”) to codes for display and navigation.

---

## 7. Skills Linkage

- **Central doc:** **`SERVICE_LINE_SKILLS_MAPPING.md`** (repo root) — lists which skills (by name) are required per service line with min/ideal level and critical flag.
- **Benchmarking:** Benchmarking Interpretation, KPI Framework Design, Dashboard Design (Advisory & Consulting / Financial).
- **Management Accounts / BI:** Management Pack Production, Financial Statements Preparation, KPI Framework Design, Dashboard Design, Variance Commentary.
- **Goal Alignment (365):** 365 Alignment Facilitation, Workflow Optimisation, Strategic Options Appraisal, Training Design & Delivery, Delegation & Prioritisation.
- **Systems Audit:** Accounting System Selection, Workflow Optimisation, Professional Scepticism.
- **Implementation:** Skills are stored in DB (e.g. **`skills`** table); practice member assessments and heatmaps use them; service readiness and “service line readiness” in the portal are derived from these mappings. Service line definitions in code (e.g. **`src/lib/service-registry.ts`**, **service-lines.ts**) and discovery docs reference the same names for display and recommendation context.

---

## 8. Patterns for New Service Lines

To build a **full assessment → analysis → client engagement** flow similar to the four above:

1. **Define the service code and names**  
   Add to `SERVICE_LINES` in `ClientServicesPage.tsx`, to discovery catalog in Pass 1/2, and to `service_lines` (and optionally `service_catalogue`) in DB. Map discovery display names to code in client report page.

2. **Assessments**  
   - **Option A (DB-driven):** Add rows to **`assessment_questions`** with your `service_line_code`; client/admin can load by code.  
   - **Option B (config-driven):** Add a block in **`serviceLineAssessments.ts`** and optionally sync to DB.  
   - **Option C (dedicated tables):** Like Systems Audit: create an engagement table and a responses table (columns or JSONB) and an assessment config that maps to them.

3. **Response storage**  
   - Generic: **`service_line_assessments`** (client_id, service_line_code, responses JSONB, completion, extracted_insights).  
   - Or dedicated tables (e.g. `xx_engagements`, `xx_responses`) if you need multi-stage or complex schema.

4. **Engagement and report**  
   - If one “report” per client per service: create an engagement table and a report/output table (e.g. `xx_reports` with narrative + structured JSONB).  
   - Backend: one or more edge functions (e.g. pass1 calc, pass2 narrative, PDF) that read engagement + responses + any financial/data tables and write to the report table.

5. **Discovery recommendation**  
   - Add the service to **service-scorer-v2** (SERVICES list and question/response → points).  
   - Add to Pass 1 SERVICE_CATALOG and Pass 2 recommendedServices/ENABLED_BY logic if needed.  
   - Ensure client report page and discovery report map the new name/code.

6. **Admin UI**  
   - Either reuse **ClientDetailModal** with a new tab (assessments + your report/dashboard) or add a dedicated modal (like Benchmarking/Systems Audit) when the service line is selected in ClientServicesPage.  
   - Fetch engagement + report from your new tables; add share/publish workflow if needed.

7. **Client portal**  
   - Routes: e.g. `/service/:serviceCode/assessment` (reuse ServiceAssessmentPage with your code) and `/service/your_code/report` or dashboard.  
   - Add requiredServices / nav in Layout if the service has a dedicated client area.

8. **Skills**  
   - Update **SERVICE_LINE_SKILLS_MAPPING.md** and any DB-driven service line skills (e.g. practice readiness) so the new line has the right skills and levels.

---

**Document generated:** February 2026  
**Scope:** torsor-practice-platform (Discovery, Benchmarking, BI, Goal Alignment, Systems Audit).  
**No files were modified; this is a discovery summary only.**
