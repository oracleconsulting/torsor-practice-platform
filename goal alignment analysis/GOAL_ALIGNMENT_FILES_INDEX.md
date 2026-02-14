# Goal Alignment Analysis — File Index

Quick index of copied files in this folder and their **live** paths. Use this to find the real file when making changes (always edit live, then re-run the sync script).

## Edge functions (Supabase)

| Copy in this folder | Live path |
|---------------------|-----------|
| generate-roadmap-copy.ts | supabase/functions/generate-roadmap/index.ts |
| generate-five-year-vision-copy.ts | supabase/functions/generate-five-year-vision/index.ts |
| generate-six-month-shift-copy.ts | supabase/functions/generate-six-month-shift/index.ts |
| generate-sprint-plan-copy.ts | supabase/functions/generate-sprint-plan/index.ts |
| generate-sprint-plan-part1-copy.ts | supabase/functions/generate-sprint-plan-part1/index.ts |
| generate-sprint-plan-part2-copy.ts | supabase/functions/generate-sprint-plan-part2/index.ts |
| roadmap-orchestrator-copy.ts | supabase/functions/roadmap-orchestrator/index.ts |
| generate-fit-profile-copy.ts | supabase/functions/generate-fit-profile/index.ts |
| notify-roadmap-ready-copy.ts | supabase/functions/notify-roadmap-ready/index.ts |
| generate-value-analysis-copy.ts | supabase/functions/generate-value-analysis/index.ts |
| generate-discovery-report-pass1-copy.ts | supabase/functions/generate-discovery-report-pass1/index.ts |
| generate-discovery-report-pass2-copy.ts | supabase/functions/generate-discovery-report-pass2/index.ts |
| generate-discovery-analysis-copy.ts | supabase/functions/generate-discovery-analysis/index.ts |
| generate-discovery-report-index-copy.ts | supabase/functions/generate-discovery-report/index.ts |
| generate-discovery-opportunities-copy.ts | supabase/functions/generate-discovery-opportunities/index.ts |
| generate-bm-opportunities-copy.ts | supabase/functions/generate-bm-opportunities/index.ts |
| generate-bm-report-pass1-copy.ts | supabase/functions/generate-bm-report-pass1/index.ts |
| generate-benchmarking-pdf-copy.ts | supabase/functions/generate-benchmarking-pdf/index.ts |
| build-service-line-copy.ts | supabase/functions/build-service-line/index.ts |
| generate-service-recommendations-copy.ts | supabase/functions/generate-service-recommendations/index.ts |

## Shared

| Copy in this folder | Live path |
|---------------------|-----------|
| shared-service-scorer-v2-copy.ts | supabase/functions/_shared/service-scorer-v2.ts |
| shared-service-scorer-copy.ts | supabase/functions/_shared/service-scorer.ts |
| shared-service-registry-copy.ts | supabase/functions/_shared/service-registry.ts |

## Migrations

All live under `supabase/migrations/`. Copied as `migrations-<name>.sql`, e.g.:

- migrations-20251212_update_scoring_weights.sql
- migrations-20251214_service_metadata_schema.sql
- migrations-20251214_split_sprint_plan_trigger.sql
- migrations-20251214_fix_trigger_chain_final.sql
- migrations-20251215_fix_service_value_calculations.sql
- migrations-20251216_staged_roadmap_architecture.sql
- migrations-20251216_fix_all_rls_policies.sql
- migrations-20251216_fix_generation_queue_rls.sql
- migrations-20251216_fix_service_line_assessments.sql
- migrations-20251216_add_value_analysis_to_trigger_chain.sql
- migrations-20251217_create_client_tasks_table.sql
- migrations-20260115_service_manuals.sql
- migrations-20260122_rename_365_to_goal_alignment.sql
- migrations-20260123_service_pricing.sql
- migrations-20260129_fix_goal_alignment_metadata.sql
- migrations-20260201_add_services_catalog.sql
- migrations-20260201_create_services_table.sql
- migrations-20260203_fix_service_pricing_models.sql
- migrations-20260203_new_client_type_services.sql
- migrations-20260204_context_intelligence_overhaul.sql
- migrations-20260209160000_service_catalogue.sql

## Frontend — Admin (src/)

| Copy in this folder | Live path |
|---------------------|-----------|
| frontend-admin-ClientServicesPage.tsx | src/pages/admin/ClientServicesPage.tsx |
| frontend-admin-DeliveryManagementPage.tsx | src/pages/admin/DeliveryManagementPage.tsx |
| frontend-admin-DiscoveryAdminModal.tsx | src/components/discovery/DiscoveryAdminModal.tsx |
| frontend-admin-ServiceSelectionPanel.tsx | src/components/benchmarking/admin/ServiceSelectionPanel.tsx |
| frontend-admin-issue-service-mapping.ts | src/lib/issue-service-mapping.ts |
| frontend-admin-advisory-services-full.ts | src/lib/advisory-services-full.ts |
| frontend-admin-service-catalog.ts | src/lib/services/service-catalog.ts |
| frontend-admin-ServiceConfigPage.tsx | src/pages/admin/ServiceConfigPage.tsx |

## Frontend — Client portal (apps/client-portal/src/)

| Copy in this folder | Live path |
|---------------------|-----------|
| frontend-client-RoadmapPage.tsx | apps/client-portal/src/pages/roadmap/RoadmapPage.tsx |
| frontend-client-DiscoveryReportPage.tsx | apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx |
| frontend-client-DiscoveryReportView.tsx | apps/client-portal/src/components/DiscoveryReportView.tsx |
| frontend-client-Layout.tsx | apps/client-portal/src/components/Layout.tsx |
| frontend-client-App.tsx | apps/client-portal/src/App.tsx |
| frontend-client-UnifiedDashboardPage.tsx | apps/client-portal/src/pages/UnifiedDashboardPage.tsx |
| frontend-client-service-registry.ts | apps/client-portal/src/lib/service-registry.ts |
| frontend-client-useAnalysis.ts | apps/client-portal/src/hooks/useAnalysis.ts |
| frontend-client-useAssessmentProgress.ts | apps/client-portal/src/hooks/useAssessmentProgress.ts |
| frontend-client-serviceLineAssessments.ts | apps/client-portal/src/config/serviceLineAssessments.ts |

## Frontend — Platform (apps/platform/src/)

| Copy in this folder | Live path |
|---------------------|-----------|
| frontend-platform-RoadmapReviewPage.tsx | apps/platform/src/pages/clients/RoadmapReviewPage.tsx |
| frontend-platform-ClientDetailPage.tsx | apps/platform/src/pages/ClientDetailPage.tsx |

## Packages

| Copy in this folder | Live path |
|---------------------|-----------|
| packages-llm-prompts-roadmap.ts | packages/llm/src/prompts/roadmap.ts |
| packages-llm-prompts-value-analysis.ts | packages/llm/src/prompts/value-analysis.ts |
| packages-llm-roadmap-generator.ts | packages/llm/src/generators/roadmap-generator.ts |
| packages-llm-router.ts | packages/llm/src/router.ts |
| packages-shared-types-roadmap.ts | packages/shared/src/types/roadmap.ts |
| packages-shared-types-client.ts | packages/shared/src/types/client.ts |

## Docs

| Copy in this folder | Live path |
|---------------------|-----------|
| docs-365-ALIGNMENT-SYSTEM-OVERVIEW.md | docs/365-ALIGNMENT-SYSTEM-OVERVIEW.md |
| docs-365_ALIGNMENT_SYSTEM_OVERVIEW.md | docs/365_ALIGNMENT_SYSTEM_OVERVIEW.md |
| docs-STAGED_ROADMAP_ARCHITECTURE.md | docs/STAGED_ROADMAP_ARCHITECTURE.md |
| docs-ROADMAP_TO_10_OUT_OF_10.md | docs/ROADMAP_TO_10_OUT_OF_10.md |
| docs-365-NARRATIVE-ELEVATION-DESIGN.md | docs/365-NARRATIVE-ELEVATION-DESIGN.md |
| docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md | docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md |
| docs-SERVICE_LINE_DISCOVERY_MAPPING.md | docs/SERVICE_LINE_DISCOVERY_MAPPING.md |
| docs-365_CLIENT_PORTAL_SPECIFICATION.md | 365_CLIENT_PORTAL_SPECIFICATION.md (repo root) |

## Summary docs (created in this folder only)

- **GOAL_ALIGNMENT_ARCHITECTURE_AND_WORKFLOWS.md** — Architecture and workflows.
- **GOAL_ALIGNMENT_INTEGRATIONS.md** — Integrations with other service lines.
- **README.md** — Usage and sync instructions.
- **GOAL_ALIGNMENT_FILES_INDEX.md** — This index.
