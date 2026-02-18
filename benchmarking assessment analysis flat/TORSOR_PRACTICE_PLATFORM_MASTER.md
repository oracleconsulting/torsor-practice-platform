# Torsor Practice Platform — Master Reference

**Purpose:** Single master document combining all service lines, skills assessments, service line assessments, discovery, and backend/frontend architecture. Use it across multiple project files to track **overlap** and **how components work together**.

**Scope:** torsor-practice-platform (client portal, practice platform, Supabase backend).  
**Last updated:** February 2026.

---

## How to use this document

- **Share across projects** — One file to attach or link when onboarding or when working in a separate repo that touches the platform.
- **Track overlap** — See [§ Overlap & how things work together](#overlap--how-things-work-together) for which tables, edge functions, and UIs are shared.
- **Find definitions** — Service codes, assessment sources, skills per service, and client routes are in one place.
- **Deep dives** — Each section points to detailed docs (goal alignment analysis, discovery assessment analysis, systems audit analysis, COMPLETE_SYSTEM_OVERVIEW, etc.).

**Copies in analysis folders:** This document is copied into every analysis folder (goal alignment analysis, discovery assessment analysis, systems audit analysis, benchmarking assessment analysis, benchmarking assessment analysis flat) so each project has the same reference. **Source of truth:** `docs/TORSOR_PRACTICE_PLATFORM_MASTER.md` — edit only there. To refresh copies: run `./torsor-practice-platform/scripts/sync-master-doc-to-all-analysis-folders.sh` from repo root, or run any service-specific sync script (each copies the master into its folder).

---

## 1. System at a glance

| Layer | What | Where |
|-------|------|--------|
| **Client portal** | client.torsor.co.uk | `apps/client-portal/` |
| **Practice platform** | torsor.co.uk | `apps/platform/` + `src/` (admin) |
| **Backend** | PostgreSQL + Edge Functions | Supabase (`supabase/`) |
| **Shared types/config** | Service registry, assessments | `src/lib/`, `src/config/`, `apps/*/src/` |

**Key shared tables:** `practice_members`, `client_service_lines`, `service_lines`, `skills`, skill assessments, discovery tables, and service-specific engagement/report tables.

---

## 2. All service lines

Canonical list from **ClientServicesPage** (`SERVICE_LINES`) and **service registry** (`supabase/functions/_shared/service-registry.ts`). Discovery and client portal map display names to these **codes**.

| Code | Display name | Status | Category | Notes |
|------|--------------|--------|----------|--------|
| `discovery` | Destination Discovery | ready | — | Entry point; recommends other services |
| `365_method` | Goal Alignment Programme | ready | growth | Roadmap: vision, shift, sprint, value analysis |
| `goal_alignment` | (same as 365 in catalogue) | — | — | Used in discovery/scoring |
| `fractional_cfo` | Fractional CFO Services | ready | strategic | |
| `fractional_coo` | Fractional COO Services | development | strategic | |
| `combined_advisory` | Combined CFO/COO Advisory | ready | strategic | |
| `systems_audit` | Systems Audit | ready | foundation | 3-stage: discovery → inventory → deep dives → report. Stage 1: 19q, 6 sections (incl. Context). Client report at `/service/systems_audit/report` when `is_shared_with_client`; status validation + RLS (Feb 2026). |
| `business_intelligence` | Business Intelligence | ready | operational | Replaces Management Accounts; BI/MA dashboards |
| `management_accounts` | (legacy BI label) | — | — | Mapped to business_intelligence in places |
| `benchmarking` | Benchmarking | ready | operational | Benchmarking + Hidden Value; bm_engagements, bm_reports |
| `business_advisory` | Business Advisory & Exit Planning | development | strategic | |
| `automation` | Automation Services | development | operational | |

**Pricing and tiers** are defined in **service registry** (fixed, turnover-scaled, one-off/monthly/annual). Client portal and discovery Pass 2/3 use this for display and recommendations.

---

## 3. Service line assessments — where they live and where they’re stored

Each service line that has a client-facing or admin assessment is listed with **source** (config vs DB), **storage**, and **client routes**.

| Service | Assessment type | Source | Storage | Client portal routes |
|---------|------------------|--------|---------|----------------------|
| **Destination Discovery** | Single-stage, ~25 questions | DB / discovery flow | `destination_discovery`, `discovery_engagements`, etc. | `/discovery`, `/discovery/report` |
| **Goal Alignment (365)** | Multi-stage (fit, vision, shift, sprint, value) | Roadmap pipeline | `roadmap_stages`, `client_roadmaps` | `/roadmap`, `/roadmap/tasks` |
| **Business Intelligence** | Config-driven | `serviceLineAssessments.ts` → MANAGEMENT_ACCOUNTS_ASSESSMENT | `service_line_assessments` (responses JSONB) | `/service/business_intelligence/assessment`, MA dashboard/report |
| **Benchmarking** | DB-driven | `assessment_questions` (service_line_code=benchmarking) | `service_line_assessments` + `bm_assessment_responses`, `bm_engagements` | `/service/benchmarking/*`, report when shared |
| **Systems Audit** | 3-stage: Stage 1 discovery (19q, 6 sections), Stage 2 inventory, Stage 3 deep dives | Config: `serviceLineAssessments.ts` (SYSTEMS_AUDIT_ASSESSMENT, 19q); platform: `systems-audit-discovery.ts` (19q) | `sa_engagements`, `sa_discovery_responses`, `sa_system_inventory`, `sa_process_deep_dives` | `/service/systems_audit/assessment`, `/inventory`, `/process-deep-dives`, **`/report`** when report shared |
| **Management Accounts** | (Same as Business Intelligence in current setup) | As above | `service_line_assessments`, `ma_assessment_responses` (if used) | As BI |
| **Other (Fractional CFO/COO, etc.)** | Varies | Some in `serviceLineAssessments.ts` or DB | `service_line_assessments` or service-specific | `/service/:code/assessment` where implemented |

**Config file:** `src/config/serviceLineAssessments.ts` (and client-portal copy) — exports one assessment config per service (e.g. `SYSTEMS_AUDIT_ASSESSMENT`, `MANAGEMENT_ACCOUNTS_ASSESSMENT`). **DB:** `assessment_questions` for benchmarking (and optionally others). **Dedicated tables:** Systems Audit (sa_*), Benchmarking (bm_*), Goal Alignment (roadmap_stages, client_roadmaps).

**Detailed assessment patterns:** `docs/ALL_SERVICE_LINE_ASSESSMENTS.md`.

---

## 4. Skills: assessments and service line mapping

### 4.1 Practice member skills (assessments)

- **Table:** Skills live in **`skills`** (name, category, is_active). Practice members are assessed on these skills (e.g. **skill_assessments** or equivalent).
- **111 active skills** in 10 categories: Advisory & Consulting, Client Management & Development, Communication & Presentation, Financial Analysis & Reporting, Financial Planning, Leadership & Management, Personal Effectiveness, Software & Technical, Tax & Compliance, Working Capital & Business Finance.
- **Portal:** Skills heatmap, service readiness (per service line), and team analytics use these assessments. Readiness is derived from **service line → required skills** (see below).

### 4.2 Service line → required skills

From **`SERVICE_LINE_SKILLS_MAPPING.md`** (repo root). Each service line lists **skill names** (must match DB), **min/ideal level**, and **critical** flag.

| Service line | Key skills (examples) |
|--------------|------------------------|
| Automation | Accounting System Selection, Xero Complete Mastery, Workflow Optimisation, Zapier/Make Automation, Client Retention Strategies |
| Management Accounts / BI | Management Pack Production, Financial Statements Preparation, KPI Framework Design, Dashboard Design, Variance Commentary |
| Benchmarking | Benchmarking Interpretation, KPI Framework Design, Dashboard Design |
| 365 Alignment | 365 Alignment Facilitation, Workflow Optimisation, Strategic Options Appraisal, Training Design & Delivery, Delegation & Prioritisation |
| Systems Audit | Accounting System Selection, Workflow Optimisation, Professional Scepticism |
| Profit Extraction / Remuneration | Corporation Tax, Strategic Options Appraisal, Capital Gains Tax Planning |
| Fractional CFO | Strategic Options Appraisal, Board Presentation Skills, Performance Management, Client Retention Strategies |
| Fractional COO | Workflow Optimisation, Performance Management, Delegation & Prioritisation |
| Combined CFO/COO | Strategic Options Appraisal, Board Presentation Skills, Workflow Optimisation, Performance Management |

**Implementation:** Service readiness logic (e.g. `src/lib/service-calculations.ts`) compares member skill levels to these requirements. **Full table:** `SERVICE_LINE_SKILLS_MAPPING.md`.

---

## 5. Discovery: flow, scoring, and service recommendation

### 5.1 Flow

1. Client completes **Destination Discovery** (e.g. 25 questions in sections: Destination, Reality, Team, Blind Spots, Moving Forward).
2. Practice team can upload **documents** and add **context**; **process-client-context** (and related) extracts financial/operational context.
3. **Generate report** (Pass 1 → Pass 2 → opportunities) produces **recommended services** and journey narrative.
4. Report can be **shared with client**; client sees it at `/discovery/report`.
5. Practice assigns **service lines** via **client_service_lines**; client then gets service-specific routes (assessment, report, dashboard).

### 5.2 Scoring (Discovery → services)

- **service-scorer-v2.ts** (_shared): Maps discovery question/response to **service codes** and **points** (e.g. goal_alignment, business_intelligence, systems_audit, benchmarking, automation, fractional_cfo/coo, business_advisory).
- **Pass 1** (`generate-discovery-report-pass1`): Uses **SERVICE_CATALOG** and calculators → recommendedInvestments, journey phases.
- **Pass 2** (`generate-discovery-report-pass2`): Applies **pinned_services** / **blocked_services** from `discovery_engagements`; builds **recommendedServices**; **ENABLED_BY_STRINGS** (e.g. “Enabled by: Goal Alignment”).
- **Pass 3** (`generate-discovery-opportunities`): Writes **discovery_opportunities**; respects pin/block.

**Display name → code** on client report: **DiscoveryReportPage.tsx** / **DiscoveryReportView.tsx** (e.g. “Systems Audit”, “Goal Alignment Programme” → `systems_audit`, `goal_alignment`).

**Full question → service mapping:** `docs/SERVICE_LINE_DISCOVERY_MAPPING.md`.

### 5.3 Dependencies and overlap

- **automation** can be described as “requires systems_audit” in journey logic.
- **management_accounts** / BI can “enable” benchmarking (data for benchmarks).
- **fractional_cfo + fractional_coo** can suggest **combined_advisory**.

---

## 6. Overlap & how things work together

### 6.1 Shared tables (used by multiple services or flows)

| Table | Used by |
|-------|---------|
| `practice_members` | All: clients and team; member_type drives visibility |
| `client_service_lines` | All service lines: enrollment (service_line_id, status) |
| `service_lines` | Admin list, client_service_lines FK, catalogue |
| `skills`, skill assessments | Service readiness for all service lines |
| `destination_discovery` / `discovery_engagements` | Discovery flow; feeds report and recommendations |
| `client_reports` (report_type) | Discovery report; can be extended |
| `client_context` | Documents/notes; used by discovery, roadmap, some service modals |
| `service_line_assessments` | BI/MA, benchmarking (partial), generic completion tracking |

### 6.2 Service-specific tables (no subfolder = single service)

| Domain | Main tables |
|--------|-------------|
| **Goal Alignment** | `roadmap_stages`, `client_roadmaps`, `generation_queue` |
| **Benchmarking** | `bm_engagements`, `bm_reports`, `bm_assessment_responses`, `bm_metric_comparisons` |
| **Systems Audit** | `sa_engagements`, `sa_discovery_responses`, `sa_system_inventory`, `sa_process_deep_dives`, `sa_audit_reports`, `sa_findings`, `sa_recommendations`, `sa_documents`, `sa_context_notes` |
| **Business Intelligence / MA** | KPI tables, client financial data, MA report tables |

### 6.3 Admin UI overlap

- **ClientServicesPage** is the hub: one list of **SERVICE_LINES**; clicking a client + service opens either **ClientDetailModal** (roadmap, assessments, BI) or a **dedicated modal** (Discovery, Benchmarking, **Systems Audit**).
- **Discovery** → DiscoveryClientModal (responses, documents, analysis, services).
- **Benchmarking** → BenchmarkingClientModal (assessment, HVA, upload, report).
- **Systems Audit** → Systems Audit modal (Stage 1–3, report, findings, recommendations, documents, context).
- **Goal Alignment / BI** → ClientDetailModal (tabs: Roadmap, Assessments, Documents, etc.).

### 6.4 Edge functions that touch multiple services

| Function | Services / flow |
|----------|------------------|
| `generate-discovery-report` (legacy/orchestration) | Discovery → report |
| `generate-discovery-report-pass1` / `pass2` | Discovery → recommended services (all codes in catalog) |
| `generate-discovery-opportunities` | Discovery opportunities (all services) |
| `generate-service-recommendations` | Post-discovery service scoring |
| `process-client-context` | Documents → context for discovery/reporting |
| `build-service-line` | Generic: design new service line (LLM) |

**Service-specific:** generate-sa-report*, generate-bm-report*, generate-roadmap, generate-five-year-vision, generate-six-month-shift, generate-sprint-plan-part1/2, generate-value-analysis, etc. See COMPLETE_SYSTEM_OVERVIEW and per-service analysis folders.

### 6.5 Client portal overlap

- **UnifiedDashboardPage:** Shows tiles per **enrolled** service; route logic (e.g. by stage) sends client to correct page. For **systems_audit**: if report is shared (`is_shared_with_client`), tile shows “Report Ready” and links to **`/service/systems_audit/report`** (SAReportPage); otherwise assessment → inventory → process-deep-dives by stage.
- **ServiceAssessmentPage:** Generic; **serviceCode** from URL + **serviceLineAssessments** config determine which assessment and where to save (e.g. systems_audit → sa_engagements + sa_discovery_responses).
- **DiscoveryReportPage / DiscoveryReportView:** Map display names to codes for navigation to service routes.

---

## 7. Key tables index (by domain)

- **Identity & enrollment:** practice_members, practices, client_service_lines, service_lines, service_catalogue (if used).
- **Skills:** skills, skill_assessments (or equivalent), service line skills in code/DB.
- **Discovery:** destination_discovery, discovery_engagements, client_reports, client_financial_context, client_operational_context, client_pattern_analysis, discovery_opportunities.
- **Context & docs:** client_context.
- **Goal Alignment:** roadmap_stages, client_roadmaps, generation_queue.
- **Benchmarking:** bm_engagements, bm_reports, bm_assessment_responses, bm_metric_comparisons, assessment_questions (benchmarking).
- **Systems Audit:** sa_engagements, sa_discovery_responses, sa_system_inventory, sa_process_chains, sa_process_deep_dives, sa_audit_reports, sa_findings, sa_recommendations, sa_system_categories, sa_documents, sa_context_notes; **tech stack intelligence:** sa_tech_products, sa_tech_integrations, sa_middleware_capabilities, sa_auto_discovery_log.
- **BI / MA:** service_line_assessments, kpi_*, client_financial_data, ma_* (as per migrations).

---

## 8. Edge functions index (by purpose)

- **Discovery:** generate-discovery-report, generate-discovery-report-pass1, generate-discovery-report-pass2, generate-discovery-analysis, generate-discovery-opportunities, generate-discovery-pdf, prepare-discovery-data, start-discovery-report, generate-service-recommendations, process-client-context, detect-assessment-patterns, generate-value-proposition.
- **Goal Alignment / Roadmap:** generate-roadmap, generate-five-year-vision, generate-six-month-shift, generate-sprint-plan, generate-sprint-plan-part1/2, roadmap-orchestrator, generate-fit-profile, generate-value-analysis, notify-roadmap-ready, notify-sprint-lifecycle, generate-life-design-refresh, generate-vision-update, generate-shift-update, generate-sprint-summary.
- **Benchmarking:** generate-bm-report-pass1, generate-bm-report-pass2, generate-benchmarking-pdf, generate-bm-opportunities, generate-value-analysis (shared).
- **Systems Audit:** generate-sa-report (deprecated: thin redirect to Pass 1), generate-sa-report-pass1 (5 phases: extract, analyse, diagnose, recommend, then systems maps in separate call; tech context from sa_tech_*; triggers Pass 2), generate-sa-report-pass2 (narrative from pass1_data), discover-sa-tech-product (lookup / lookup_batch / discover stub for tech DB).
- **Shared / utility:** _shared/service-registry.ts, _shared/service-scorer-v2.ts, _shared/service-scorer.ts, build-service-line, process-documents, send-client-invitation, accept-invitation, client-signup, send-assessment-review.

(Exact list may vary with migrations; see `supabase/functions/` and COMPLETE_SYSTEM_OVERVIEW.)

---

## 9. Detailed document references

| Topic | Document / location |
|-------|----------------------|
| Full system architecture, deployments, discovery flow, schema | `docs/COMPLETE_SYSTEM_OVERVIEW.md` |
| Four core services (Benchmarking, BI, Goal Alignment, Systems Audit) end-to-end | `docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md` |
| Discovery question → service triggers, scoring | `docs/SERVICE_LINE_DISCOVERY_MAPPING.md` |
| All assessment patterns and questions per service | `docs/ALL_SERVICE_LINE_ASSESSMENTS.md` |
| Skills per service line, skill categories, migration | `SERVICE_LINE_SKILLS_MAPPING.md` (repo root) |
| Goal Alignment / 365 / Roadmap (read-only copy) | `goal alignment analysis/` + sync script `scripts/sync-goal-alignment-assessment-copies.sh` |
| Discovery (read-only copy) | `discovery assessment analysis/` + `scripts/sync-discovery-assessment-copies.sh` |
| Systems Audit (read-only copy) | `systems audit analysis/` + `scripts/sync-systems-audit-assessment-copies.sh` + `SYSTEMS_AUDIT_SYSTEM_SUMMARY.md` |
| Benchmarking | `benchmarking assessment analysis/`, `benchmarking assessment analysis flat/`, `docs/BENCHMARKING_*.md` |
| Staged roadmap, trigger chain | `docs/STAGED_ROADMAP_ARCHITECTURE.md` |
| 365 alignment system | `docs/365_ALIGNMENT_SYSTEM_OVERVIEW.md`, `docs/365-ALIGNMENT-SYSTEM-OVERVIEW.md` |

---

## 10. Quick reference: service code ↔ name

| Code | Name |
|------|------|
| discovery | Destination Discovery |
| 365_method / goal_alignment | Goal Alignment Programme |
| fractional_cfo | Fractional CFO Services |
| fractional_coo | Fractional COO Services |
| combined_advisory | Combined CFO/COO Advisory |
| systems_audit | Systems Audit |
| business_intelligence / management_accounts | Business Intelligence / Management Accounts |
| benchmarking | Benchmarking |
| business_advisory | Business Advisory & Exit Planning |
| automation | Automation Services |

Use this master document to keep service lines, assessments, skills, and discovery aligned across projects and to see at a glance how each part of the platform overlaps and connects.
