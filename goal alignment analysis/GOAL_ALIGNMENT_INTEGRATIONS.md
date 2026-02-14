# Goal Alignment — Integrations With Other Service Lines

**Purpose:** Summary of how the Goal Alignment Programme (365 Method) integrates with Discovery, Benchmarking, Business Intelligence, Systems Audit, and shared platform features in torsor-practice-platform.

---

## 1. Discovery ↔ Goal Alignment

### 1.1 Discovery Recommends Goal Alignment

- **Service scorer** (`_shared/service-scorer-v2.ts`): Discovery assessment responses are scored for multiple services. **goal_alignment** gets points from:
  - No clear plan / lack of clarity / “magic fix” (strategy, clarity, freedom).
  - Lack of accountability / going it alone.
  - Burnout, overwhelm, stress, lifestyle transformation signals.
  - Exit-related needs (ongoing accountability for 3-year exit plan).
- **Pass 1** (`generate-discovery-report-pass1`): SERVICE_CATALOG includes goal_alignment with tiers (Lite/Growth/Partner) and pricing. Outputs **recommendedInvestments** and **page3_journey.phases** that can include Goal Alignment.
- **Pass 2** (`generate-discovery-report-pass2`):
  - Builds **recommendedServices** from Pass 1 and applies **pinned_services** / **blocked_services** from **discovery_engagements**.
  - **ENABLED_BY_STRINGS**: Journey phases show “Enabled by: Goal Alignment Programme” (or “365”) where appropriate.
  - **Exit clients:** For exit-focused clients, Pass 2 enforces order: **Benchmarking FIRST**, then improvements, then **Goal Alignment** for ongoing exit support (quarterly roadmap, accountability).
  - Hardcoded Goal Alignment pricing (e.g. Growth £4,500/year, Partner £9,000/year) in narrative and phase labels.
- **generate-discovery-analysis**: 
  - **selectGoalAlignmentTier()** chooses Lite / Growth / Partner from responses and client stage (e.g. exit → Growth/Partner).
  - Transformation triggers (burnout, lifestyle, exit, accountability) drive recommendation of Goal Alignment even when client has a business plan (“structured path to becoming the person in your 5-year vision”).
  - Sets **enabledBy** on journey phases to “Goal Alignment Programme (Growth)” etc.
- **Client report:** `DiscoveryReportPage.tsx` / `DiscoveryReportView.tsx` map service names “Goal Alignment Programme”, “365_method”, “GOAL_ALIGNMENT” to route/code `goal_alignment` for display and navigation.

### 1.2 Goal Alignment in Discovery UI

- **DiscoveryAdminModal:** Pinned/blocked services and display names; GOAL_ALIGNMENT / 365_METHOD both map to `goal_alignment`.
- **Discovery report (client):** Journey phases and “Enabled by” link to Goal Alignment; pricing and tier (Lite/Growth/Partner) shown in narrative.

**Summary:** Discovery is the main **lead source** for Goal Alignment: scoring, catalog, journey phases, exit ordering, and tier selection all integrate Goal Alignment. No separate “Goal Alignment assessment”; roadmap pipeline is the delivery.

---

## 2. Benchmarking ↔ Goal Alignment

### 2.1 Benchmarking Recommends or References Goal Alignment

- **generate-bm-opportunities:** When building opportunity service suggestions, **GOAL_ALIGNMENT** is included in the list of suggested services (e.g. for remediation or follow-on).
- **generate-bm-report-pass1:** Remediation narrative can include “Goal Alignment Programme + Succession Planning” as a recommended follow-on (e.g. after benchmarking diagnostics).
- **generate-benchmarking-pdf:** PDF narrative can reference “Goal Alignment Programme + Succession Planning” in recommendations section.
- **ServiceSelectionPanel** (benchmarking admin): Can suggest **GOAL_ALIGNMENT** when configuring or exporting analysis.

### 2.2 Data / Flow

- Benchmarking does **not** write to roadmap_stages or client_roadmaps. Integration is **narrative and recommendation only**: BM report/opportunities can point client toward Goal Alignment (and succession planning) as a next step.
- Shared **client** and **practice** context (e.g. client_financial_data, client_service_lines) are used by both BM and Goal Alignment elsewhere; no direct BM → GA data pipeline.

**Summary:** Benchmarking surfaces Goal Alignment as a **recommended next service** (e.g. after diagnostics). No shared assessments or pipeline; integration is via opportunity/report text and admin service selection.

---

## 3. Business Intelligence ↔ Goal Alignment

### 3.1 Shared Client Context

- Both BI and Goal Alignment use **client_service_lines** (different service_line_id). A client can be enrolled in both.
- **ClientDetailModal** (admin) shows tabs for Overview, **Roadmap** (Goal Alignment), Assessments, Documents. BI/MA assessments and dashboards live in other tabs; same client, same modal.
- No BI-specific logic that *generates* roadmap or enqueues Goal Alignment stages. No BI assessment data fed into **generate-fit-profile** or other roadmap functions unless part of shared “client context” (e.g. Part 1/2 used by roadmap).

### 3.2 Discovery

- Discovery can recommend both Business Intelligence and Goal Alignment; Pass 2 and analysis can place both in journey (e.g. “Management accounts + Goal Alignment programme”). BI and Goal Alignment are independent recommendations; no hard ordering between them except where exit logic applies (Benchmarking → Goal Alignment).

**Summary:** BI and Goal Alignment are **parallel** service lines: same client can have both; shared admin UI (ClientDetailModal); no direct data or pipeline integration.

---

## 4. Systems Audit ↔ Goal Alignment

### 4.1 Shared Admin and Discovery

- **ClientServicesPage** lists both Systems Audit and Goal Alignment (365_method). Same admin surface; no shared engagement or report tables.
- Discovery can recommend both Systems Audit and Goal Alignment in the same journey (e.g. “fix systems first”, then “Goal Alignment for strategy/accountability”). Ordering is by journey logic in Pass 2, not by a dedicated SA → GA pipeline.
- **issue-service-mapping.ts** maps issues to services; **goalAlignment** is one of the services (e.g. for “no clear plan”, “accountability”), separate from systems_audit.

### 4.2 No Direct Pipeline

- Systems Audit has its own tables (sa_engagements, sa_discovery_responses, sa_audit_reports, etc.). Goal Alignment uses roadmap_stages, client_roadmaps, generation_queue. No SA stage that enqueues Goal Alignment or writes to roadmap tables.

**Summary:** Systems Audit and Goal Alignment are **parallel** service lines; both appear in Discovery and admin; no direct integration beyond shared discovery journey and admin layout.

---

## 5. Shared Platform Features

### 5.1 Service Catalogue and Metadata

- **service_line_metadata** / **services** / **service_catalogue**: Goal Alignment (365_method) has display name “Goal Alignment Programme”, tiers (Lite/Growth/Partner), pricing. Used by Discovery, build-service-line, and any UI that shows service names.
- **service-scorer-v2**, **service-registry** (shared and per-app): goal_alignment / 365_method appear in canonical service lists and scoring.

### 5.2 Delivery and Admin

- **DeliveryManagementPage:** 365_method / Goal Alignment appears in delivery view (icon, name, filter) alongside other service lines.
- **ClientServicesPage:** Single entry point; selecting Goal Alignment (365) opens ClientDetailModal with Roadmap tab and assessments/documents shared with other lines.

### 5.3 Client Portal

- **Layout / App:** Routes for `/roadmap` and discovery report; discovery report links to “goal_alignment” for navigation.
- **UnifiedDashboardPage:** Can show links or cards for both Discovery and Roadmap (Goal Alignment).

### 5.4 Value Analysis

- **generate-value-analysis** is part of the **Goal Alignment pipeline** (last stage). It can share concepts with Benchmarking’s value analysis (e.g. exit readiness, surplus cash) but is invoked in the roadmap trigger chain and writes to roadmap_stages / client_roadmaps, not to bm_reports. No automatic cross-write between BM value analysis and GA value_analysis.

**Summary:** Goal Alignment shares **catalogue**, **scoring**, **delivery UI**, and **client portal layout** with other service lines; pipeline and data (roadmap_stages, generation_queue) are Goal Alignment–specific.

---

## 6. Integration Matrix (Quick Reference)

| Integration | Direction | Nature |
|-------------|-----------|--------|
| Discovery → Goal Alignment | Discovery recommends GA | Scoring, catalog, journey phases, “Enabled by”, exit order (BM then GA), tier selection. |
| Goal Alignment → Discovery | — | None (GA does not trigger or write Discovery). |
| Benchmarking → Goal Alignment | BM recommends GA | Opportunity suggestions, report/PDF text “Goal Alignment Programme + Succession Planning”. |
| Goal Alignment → Benchmarking | — | None. |
| BI ↔ Goal Alignment | Shared client | Same client can have both; shared ClientDetailModal; no pipeline. |
| Systems Audit ↔ Goal Alignment | Shared client / journey | Same client/journey; no pipeline. |
| Shared catalogue / scorer / delivery | All ↔ GA | Service names, codes, pricing, delivery view, client nav. |

---

**Document generated:** February 2026  
**Folder:** goal alignment analysis. Re-sync with `./scripts/sync-goal-alignment-assessment-copies.sh` after live changes.
