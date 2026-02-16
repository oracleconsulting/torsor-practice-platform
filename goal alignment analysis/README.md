# Goal Alignment Analysis — Read-Only Copy

This folder holds **direct copies** of all live files related to the **Goal Alignment Programme** (365 Method / 365 Alignment) service line in torsor-practice-platform. It is intended for assessment and analysis in a separate Claude (or other) project.

## Do not edit these copies during live development

- All edits must be made in the **live** paths under `torsor-practice-platform/` (e.g. `supabase/functions/`, `supabase/migrations/`, `src/`, `apps/client-portal/`, `apps/platform/`, `packages/`).
- After making changes in the repo, re-run the sync script from the **repo root** to refresh this folder:

```bash
./scripts/sync-goal-alignment-assessment-copies.sh
```

## What’s included

- **Edge functions:** Roadmap pipeline (fit, vision, shift, sprint part1/2, value_analysis, orchestrator, notify), plus Discovery/BM functions that contain material Goal Alignment logic.
- **Shared:** service-scorer-v2, service-scorer, service-registry.
- **Migrations:** Roadmap, 365, goal_alignment, generation_queue, service catalogue, RLS, and related.
- **Frontend:** Admin (ClientServicesPage, **SprintEditorModal**, DeliveryManagementPage, DiscoveryAdminModal, ServiceSelectionPanel, issue-service-mapping, advisory-services-full, service-catalog, ServiceConfigPage); client portal (RoadmapPage, DiscoveryReportPage, DiscoveryReportView, Layout, App, UnifiedDashboardPage, hooks, config); platform (RoadmapReviewPage, ClientDetailPage). Tier (Lite/Growth/Partner) on client_service_lines; Partner clients see sprint only when published.
- **Packages:** LLM roadmap/value-analysis prompts and generator; shared types (roadmap, client).
- **Docs:** 365 alignment overviews, staged roadmap architecture, service lines architecture, roadmap-to-10, narrative design, client portal spec, discovery mapping.

File names in this folder use a flat naming convention with a `-copy` suffix (e.g. `generate-five-year-vision-copy.ts`, `frontend-client-RoadmapPage.tsx`, `migrations-20251216_staged_roadmap_architecture.sql`, `docs-STAGED_ROADMAP_ARCHITECTURE.md`).

## Summary documents (created for this folder)

| Document | Purpose |
|----------|---------|
| **GOAL_ALIGNMENT_ARCHITECTURE_AND_WORKFLOWS.md** | How Goal Alignment works: data model, pipeline, edge functions, admin/client UI, workflows, file reference. |
| **GOAL_ALIGNMENT_INTEGRATIONS.md** | How Goal Alignment integrates with Discovery, Benchmarking, BI, Systems Audit, and shared platform. |
| **GOAL_ALIGNMENT_FILES_INDEX.md** | Index of all copied files and their live paths. |
| **README.md** (this file) | How to use this folder and sync. |

## Sync script

- **Location:** `torsor-practice-platform/scripts/sync-goal-alignment-assessment-copies.sh`
- **Run from:** Repository root: `./scripts/sync-goal-alignment-assessment-copies.sh`
