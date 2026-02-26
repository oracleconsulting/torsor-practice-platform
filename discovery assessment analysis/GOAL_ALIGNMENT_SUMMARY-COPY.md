# Goal Alignment Programme — Architecture & Workflows

**Purpose:** Single reference for how the Goal Alignment service line (365 Method / 365 Alignment) is implemented in torsor-practice-platform: data model, pipeline, edge functions, admin and client UI, and workflows.

**Scope:** torsor-practice-platform. This folder holds read-only copies of live files; edit live paths and re-run `./scripts/sync-goal-alignment-assessment-copies.sh` to sync.

---

## 1. Overview

### 1.1 What Goal Alignment Is

- **Names:** Goal Alignment Programme, 365 Alignment, 365 Method.
- **Codes:** `365_method` (DB/enrollment), `goal_alignment` (Discovery/catalogue).
- **Outcome:** Life-first transformation: 5-year vision, 6-month shift, 12-week sprints; roadmap and value analysis; “Enabled by: Goal Alignment Programme” in Discovery journey.

### 1.2 How It Differs From Other Service Lines

- **No standalone “Goal Alignment assessment” table.** The **roadmap pipeline** is the assessment and delivery: fit → vision → shift → sprint → value analysis.
- **Engagement:** Enrollment in `client_service_lines` for `365_method`; roadmap data in `client_roadmaps` (legacy) and **`roadmap_stages`** (staged pipeline).
- **Client portal:** `/roadmap` and `/roadmap/tasks`; admin sees roadmap in ClientDetailModal (Roadmap tab).

---

## 2. Data Architecture

### 2.1 Core Tables

| Table | Purpose |
|-------|--------|
| **roadmap_stages** | One row per client per stage type (and version). Stores `generated_content`, `approved_content`, `status` (not_started → generating → generated → approved → published). |
| **generation_queue** | Queue for pipeline: `stage_type`, `depends_on_stage`, `status` (pending → processing → completed/failed). Trigger chain inserts next stage when previous completes. |
| **client_roadmaps** | Legacy: single roadmap per client, `roadmap_data` JSONB (fitProfile, fiveYearVision, sixMonthShift, sprint; value_analysis). Still used as fallback when no staged data. |
| **client_tasks** | Tasks derived from 12-week sprint; `sprint_number` links to roadmap_stages; client can complete and give feedback. |
| **generation_feedback** | Learning DB: practice edits, client task feedback; `original_content` / `edited_content`, `feedback_text`, `feedback_source`, `incorporated_into_prompts`. |
| **client_service_lines** | Enrollment: client is “on Goal Alignment” when they have a row with service line `365_method`. **tier_name** (Lite/Growth/Partner), **current_sprint_number**, **max_sprints** (e.g. Partner = 4). |
| **service_line_metadata** / **services** / **service_catalogue** | Display names (e.g. “Goal Alignment Programme” for `365_method`), pricing (Lite £1,500, Growth £4,500, Partner £9,000/year). |

### 2.2 Stage Types (Pipeline Order)

1. **fit_assessment** — Fit profile, north star, journey recommendation.
2. **five_year_vision** — 5-year vision, tagline, transformation story, Y1/Y3/Y5 milestones.
3. **six_month_shift** — 6-month shift statement, key milestones, gap analysis, risks, quick wins.
4. **sprint_plan_part1** — Weeks 1–6 of 12-week sprint (themes, focus areas, tasks).
5. **sprint_plan_part2** — Weeks 7–12; merges with part1 into full sprint.
6. **value_analysis** — Business valuation, opportunity score, risk register (triggered after sprint_plan_part2).
7. **sprint_summary** — Optional; generated when all 12-week sprint tasks are resolved (client-triggered, not in DB trigger chain). Index: `idx_roadmap_stages_sprint` on (client_id, stage_type, sprint_number).

### 2.3 Trigger Chain

When a stage’s `roadmap_stages.status` moves to `generated`, a DB trigger **`trigger_next_stage`** inserts the next stage into **generation_queue**:

- `fit_assessment` → `five_year_vision`
- `five_year_vision` → `six_month_shift`
- `six_month_shift` → `sprint_plan_part1`
- `sprint_plan_part1` → `sprint_plan_part2`
- `sprint_plan_part2` → `value_analysis`
- `value_analysis` → (end)

Defined in migrations (e.g. `20251214_split_sprint_plan_trigger.sql`, `20251214_fix_trigger_chain_final.sql`, `20251216_add_value_analysis_to_trigger_chain.sql`).

---

## 3. Edge Functions (Backend)

### 3.1 Pipeline (Goal Alignment Core)

| Function | Stage | Role |
|----------|--------|------|
| **roadmap-orchestrator** | — | Polls `generation_queue`, invokes stage functions in order. Actions: `process`, `resume`, `retry`, `status`. |
| **generate-fit-profile** | fit_assessment | Rule/LLM: Part 1 assessment → fit signals, north star, journey recommendation. |
| **generate-five-year-vision** | five_year_vision | LLM: Fit + Part 1/2 → vision story, Y1/Y3/Y5 milestones. |
| **generate-six-month-shift** | six_month_shift | LLM: Vision + assessment → 6-month shift, milestones, gap analysis. |
| **generate-sprint-plan-part1** | sprint_plan_part1 | LLM: Weeks 1–6 with themes and tasks. |
| **generate-sprint-plan-part2** | sprint_plan_part2 | LLM: Weeks 7–12; merges with part1 into full 12-week sprint. |
| **generate-value-analysis** | value_analysis | Rule/LLM: Valuation, opportunity score, risks. |
| **notify-roadmap-ready** | — | Notifications when roadmap is ready (e.g. client email). |
| **generate-roadmap** | — | Legacy/orchestration entry point (if still used). |
| **generate-sprint-plan** | — | Legacy single-call sprint (superseded by part1/part2). |

### 3.2 Shared / Discovery / BM (Goal Alignment Logic)

- **service-scorer-v2.ts** — Discovery: `goal_alignment` in SERVICES; question/response → points; burnout, lifestyle, clarity, accountability → goal_alignment.
- **generate-discovery-report-pass1** — SERVICE_CATALOG includes goal_alignment; journey phases and recommendedInvestments.
- **generate-discovery-report-pass2** — recommendedServices, ENABLED_BY_STRINGS (“Enabled by: Goal Alignment Programme”), exit-client ordering (Benchmarking first, then Goal Alignment), hardcoded Goal Alignment pricing.
- **generate-discovery-analysis** — `selectGoalAlignmentTier()`, transformation triggers, exit-client logic; recommends Goal Alignment (Lite/Growth/Partner) and sets “Enabled by” on phases.
- **generate-discovery-report** / **generate-discovery-opportunities** — Catalog and opportunity surfacing for goal_alignment.
- **generate-bm-opportunities** — Suggests GOAL_ALIGNMENT in opportunity service list.
- **generate-bm-report-pass1** / **generate-benchmarking-pdf** — Remediation text “Goal Alignment Programme + Succession Planning”.
- **build-service-line** — Describes goal_alignment for service line build.

---

## 4. Workflows

### 4.1 Starting a Roadmap (Admin)

1. Client has completed Destination Discovery Part 1 (and optionally Part 2/3).
2. Admin opens **ClientServicesPage** → selects client → **ClientDetailModal** (e.g. for 365_method).
3. Admin triggers “Regenerate Roadmap” (or equivalent). This enqueues **fit_assessment** for that client in **generation_queue**.
4. **roadmap-orchestrator** is invoked (manual or scheduled). It processes the queue: calls **generate-fit-profile** → writes **roadmap_stages** for fit_assessment → trigger queues five_year_vision → orchestrator calls **generate-five-year-vision** → … → through **value_analysis**.

### 4.2 Review and Publish

1. Each stage is written with `status = 'generated'`.
2. Practice reviews in admin (Roadmap tab). For the sprint stage, **Sprint Editor** modal (Open Sprint Editor from Roadmap or Sprint tab) edits **approved_content** (overview, weeks, tasks), with Save Draft and Approve & Publish. **Tier** (Lite/Growth/Partner) is set per client in ClientDetailModal **Overview** tab for 365_method (stored in **client_service_lines.tier_name**).
3. **generation_feedback** records practice edits (e.g. `feedback_source: 'practice_edit'`) for learning.
4. When published, **client_tasks** are synced: delete by client_id + sprint_number, then insert from approved sprint content (with **sprint_number**). Client sees content in client portal **RoadmapPage** (vision, shift, sprint, value). **Partner tier:** client portal shows sprint stages only when `status = 'published'`; other tiers see generated/approved as well (see useAnalysis.ts).

### 4.3 Client View

1. Client logs into client portal; navigates to **/roadmap** (**RoadmapPage**).
2. Data is loaded from **roadmap_stages** (and **client_service_lines** for tier) for that client, or fallback **client_roadmaps.roadmap_data**. For **Partner** tier, sprint stages (sprint_plan_part2 / sprint_plan / sprint_plan_part1) are included only when `status = 'published'`; other tiers see generated/approved content.
3. Client can view vision, shift, sprint; complete **client_tasks** and submit feedback (fed into generation_feedback where applicable).

### 4.4 Discovery → Goal Alignment

1. Client completes Destination Discovery; **generate-discovery-report-pass1** and **pass2** (and **generate-discovery-analysis**) score and recommend services.
2. Scorer and catalog recommend **Goal Alignment** (goal_alignment / 365_method) when signals: no clear plan, no accountability, burnout/lifestyle, “magic fix” clarity/strategy/freedom, exit needing ongoing support.
3. Discovery report and journey show “Goal Alignment Programme” and “Enabled by: Goal Alignment Programme” on phases; pricing (Lite £1,500, Growth £4,500, Partner £9,000/year).

---

## 5. Front-End Layout

### 5.1 Admin

- **ClientServicesPage** — Service line list includes Goal Alignment (365_method). Opening a client with 365 shows **ClientDetailModal** with tabs: **Overview** (tier selector Lite/Growth/Partner for 365_method, stored in client_service_lines), **Roadmap** (vision, shift, sprint, value), **Sprint** tab, Assessments, Documents, etc. **Sprint Editor** modal (SprintEditorModal) opens from “Open Sprint Editor” (Roadmap or Sprint tab): full-screen edit of sprint overview, weeks, tasks; Save Draft; Approve & Publish (writes approved_content, status published, syncs client_tasks by sprint_number).
- **DeliveryManagementPage** — 365_method / Goal Alignment shown in delivery view (e.g. icon, filter).
- **DiscoveryAdminModal** — Maps GOAL_ALIGNMENT / 365_METHOD to `goal_alignment` for display and pins.
- **ServiceSelectionPanel** (benchmarking) — Can suggest GOAL_ALIGNMENT in recommendations.

Roadmap tab builds from **roadmap_stages** (or fallback **client_roadmaps**).

### 5.2 Client Portal

- **App.tsx** / **Layout.tsx** — Routes and nav for `/roadmap`, `/roadmap/tasks`.
- **RoadmapPage** — Main roadmap view: vision, shift, sprint, value analysis. Data via **useAnalysis.ts** (useRoadmap): fetches tier from **client_service_lines** (365_method); for **Partner** tier, sprint stages are filtered to `status = 'published'` only.
- **UnifiedDashboardPage** — Can show roadmap/GA entry point.
- **DiscoveryReportPage** / **DiscoveryReportView** — Map “Goal Alignment Programme”, “365_method”, “goal_alignment” to correct code and navigation for discovery report and “Enabled by” links.

### 5.3 Platform App (Internal)

- **RoadmapReviewPage** — Review roadmaps.
- **ClientDetailPage** — Can show roadmap/GA context.

---

## 6. Pricing and Catalogue

- **Tiers:** Lite (£1,500/year), Growth (£4,500/year), Partner (£9,000/year). Stored in **service_catalogue** / **service_line_metadata** and referenced in discovery Pass 2 and analysis.
- **Migrations:** e.g. `20260129_fix_goal_alignment_metadata.sql`, `20260203_fix_service_pricing_models.sql`, `20260209160000_service_catalogue.sql` ensure Goal Alignment is annual (not monthly) and display names correct.

---

## 7. Skills and Service Line Metadata

- **SERVICE_LINE_SKILLS_MAPPING** (repo): Goal Alignment (365) links to 365 Alignment Facilitation, Workflow Optimisation, Strategic Options Appraisal, Training Design & Delivery, Delegation & Prioritisation.
- **service_line_metadata** / **services**: display_name “Goal Alignment Programme” for code `365_method`; used across admin and client-facing copy.

---

## 8. File Reference (Live Paths)

- **Edge:** `supabase/functions/roadmap-orchestrator`, `generate-fit-profile`, `generate-five-year-vision`, `generate-six-month-shift`, `generate-sprint-plan-part1`, `generate-sprint-plan-part2`, `generate-value-analysis`, `notify-roadmap-ready`, `generate-roadmap`, `generate-sprint-plan`.
- **Shared:** `supabase/functions/_shared/service-scorer-v2.ts`, `service-scorer.ts`, `service-registry.ts`.
- **Migrations:** `20251216_staged_roadmap_architecture.sql`, `20251214_split_sprint_plan_trigger.sql`, `20251214_fix_trigger_chain_final.sql`, `20251216_add_value_analysis_to_trigger_chain.sql`, `20251217_create_client_tasks_table.sql`, `20260122_rename_365_to_goal_alignment.sql`, `20260129_fix_goal_alignment_metadata.sql`, `20260203_fix_service_pricing_models.sql`, `20260209160000_service_catalogue.sql`, `20260214000000_add_sprint_summary_stage.sql`, `20260215000000_renewal_pipeline.sql`, `20260216000000_add_tier_to_client_service_lines.sql`, and related RLS/service catalogue migrations.
- **Admin:** `src/pages/admin/ClientServicesPage.tsx`, `src/components/admin/SprintEditorModal.tsx`, `DeliveryManagementPage.tsx`, `src/components/discovery/DiscoveryAdminModal.tsx`, `src/components/benchmarking/admin/ServiceSelectionPanel.tsx`, `src/lib/issue-service-mapping.ts`, `src/lib/advisory-services-full.ts`, `src/lib/services/service-catalog.ts`.
- **Client:** `apps/client-portal/src/pages/roadmap/RoadmapPage.tsx`, `apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx`, `apps/client-portal/src/components/DiscoveryReportView.tsx`, `Layout.tsx`, `App.tsx`, `UnifiedDashboardPage.tsx`, `lib/service-registry.ts`, `hooks/useAnalysis.ts`, `hooks/useAssessmentProgress.ts`, `config/serviceLineAssessments.ts`.
- **Platform:** `apps/platform/src/pages/clients/RoadmapReviewPage.tsx`, `apps/platform/src/pages/ClientDetailPage.tsx`.
- **Packages:** `packages/llm/src/prompts/roadmap.ts`, `value-analysis.ts`, `packages/llm/src/generators/roadmap-generator.ts`, `packages/shared/src/types/roadmap.ts`, `client.ts`.
- **Docs:** `docs/365-ALIGNMENT-SYSTEM-OVERVIEW.md`, `docs/STAGED_ROADMAP_ARCHITECTURE.md`, `docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md`, `docs/ROADMAP_TO_10_OUT_OF_10.md`, `365_CLIENT_PORTAL_SPECIFICATION.md`.

---

**Document generated:** February 2026  
**Folder:** goal alignment analysis (read-only copies). Sync with `./scripts/sync-goal-alignment-assessment-copies.sh`.
