#!/usr/bin/env bash
# Syncs live Goal Alignment / 365 / Roadmap files into "goal alignment analysis" as direct copies.
# Run from repo root: ./scripts/sync-goal-alignment-assessment-copies.sh
# Use this folder for assessment in a separate Claude project; do not edit these copies during live work.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/goal alignment analysis"
mkdir -p "$DEST"

echo "Syncing live files -> goal alignment analysis (direct copies)..."

# --- Edge functions: Goal Alignment / Roadmap pipeline ---
cp "$ROOT/supabase/functions/generate-roadmap/index.ts" "$DEST/generate-roadmap-copy.ts" 2>/dev/null && echo "  generate-roadmap-copy.ts" || true
cp "$ROOT/supabase/functions/generate-five-year-vision/index.ts" "$DEST/generate-five-year-vision-copy.ts" && echo "  generate-five-year-vision-copy.ts"
cp "$ROOT/supabase/functions/generate-six-month-shift/index.ts" "$DEST/generate-six-month-shift-copy.ts" && echo "  generate-six-month-shift-copy.ts"
cp "$ROOT/supabase/functions/generate-sprint-plan/index.ts" "$DEST/generate-sprint-plan-copy.ts" 2>/dev/null && echo "  generate-sprint-plan-copy.ts" || true
cp "$ROOT/supabase/functions/generate-sprint-plan-part1/index.ts" "$DEST/generate-sprint-plan-part1-copy.ts" && echo "  generate-sprint-plan-part1-copy.ts"
cp "$ROOT/supabase/functions/generate-sprint-plan-part2/index.ts" "$DEST/generate-sprint-plan-part2-copy.ts" && echo "  generate-sprint-plan-part2-copy.ts"
cp "$ROOT/supabase/functions/roadmap-orchestrator/index.ts" "$DEST/roadmap-orchestrator-copy.ts" && echo "  roadmap-orchestrator-copy.ts"
cp "$ROOT/supabase/functions/generate-fit-profile/index.ts" "$DEST/generate-fit-profile-copy.ts" && echo "  generate-fit-profile-copy.ts"
cp "$ROOT/supabase/functions/notify-roadmap-ready/index.ts" "$DEST/notify-roadmap-ready-copy.ts" && echo "  notify-roadmap-ready-copy.ts"
cp "$ROOT/supabase/functions/generate-value-analysis/index.ts" "$DEST/generate-value-analysis-copy.ts" && echo "  generate-value-analysis-copy.ts"

# --- Edge functions: Discovery / BM that contain material Goal Alignment logic ---
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/index.ts" "$DEST/generate-discovery-report-pass1-copy.ts" && echo "  generate-discovery-report-pass1-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass2/index.ts" "$DEST/generate-discovery-report-pass2-copy.ts" && echo "  generate-discovery-report-pass2-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-analysis/index.ts" "$DEST/generate-discovery-analysis-copy.ts" && echo "  generate-discovery-analysis-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report/index.ts" "$DEST/generate-discovery-report-index-copy.ts" && echo "  generate-discovery-report-index-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-opportunities/index.ts" "$DEST/generate-discovery-opportunities-copy.ts" && echo "  generate-discovery-opportunities-copy.ts"
cp "$ROOT/supabase/functions/generate-bm-opportunities/index.ts" "$DEST/generate-bm-opportunities-copy.ts" && echo "  generate-bm-opportunities-copy.ts"
cp "$ROOT/supabase/functions/generate-bm-report-pass1/index.ts" "$DEST/generate-bm-report-pass1-copy.ts" && echo "  generate-bm-report-pass1-copy.ts"
cp "$ROOT/supabase/functions/generate-benchmarking-pdf/index.ts" "$DEST/generate-benchmarking-pdf-copy.ts" && echo "  generate-benchmarking-pdf-copy.ts"
cp "$ROOT/supabase/functions/build-service-line/index.ts" "$DEST/build-service-line-copy.ts" && echo "  build-service-line-copy.ts"
cp "$ROOT/supabase/functions/generate-service-recommendations/index.ts" "$DEST/generate-service-recommendations-copy.ts" && echo "  generate-service-recommendations-copy.ts"

# --- Shared (scoring, registry) ---
cp "$ROOT/supabase/functions/_shared/service-scorer-v2.ts" "$DEST/shared-service-scorer-v2-copy.ts" && echo "  shared-service-scorer-v2-copy.ts"
cp "$ROOT/supabase/functions/_shared/service-scorer.ts" "$DEST/shared-service-scorer-copy.ts" && echo "  shared-service-scorer-copy.ts"
[ -f "$ROOT/supabase/functions/_shared/service-registry.ts" ] && cp "$ROOT/supabase/functions/_shared/service-registry.ts" "$DEST/shared-service-registry-copy.ts" && echo "  shared-service-registry-copy.ts"

# --- Migrations (roadmap, 365, goal_alignment, generation_queue, service catalogue, tier, renewal, sprint_summary) ---
for m in 20251212_update_scoring_weights 20251214_service_metadata_schema 20251214_split_sprint_plan_trigger 20251214_fix_trigger_chain_final 20251215_fix_service_value_calculations 20251216_staged_roadmap_architecture 20251216_fix_all_rls_policies 20251216_fix_generation_queue_rls 20251216_fix_service_line_assessments 20251216_add_value_analysis_to_trigger_chain 20251217_create_client_tasks_table 20260115_service_manuals 20260122_rename_365_to_goal_alignment 20260123_service_pricing 20260129_fix_goal_alignment_metadata 20260201_add_services_catalog 20260201_create_services_table 20260203_fix_service_pricing_models 20260203_new_client_type_services 20260204_context_intelligence_overhaul 20260209160000_service_catalogue 20260214000000_add_sprint_summary_stage 20260215000000_renewal_pipeline 20260216000000_add_tier_to_client_service_lines; do
  [ -f "$ROOT/supabase/migrations/${m}.sql" ] && cp "$ROOT/supabase/migrations/${m}.sql" "$DEST/migrations-${m}.sql" && echo "  migrations-${m}.sql"
done

# --- Frontend: Admin (src/) ---
cp "$ROOT/src/pages/admin/ClientServicesPage.tsx" "$DEST/frontend-admin-ClientServicesPage.tsx" && echo "  frontend-admin-ClientServicesPage.tsx"
cp "$ROOT/src/components/admin/SprintEditorModal.tsx" "$DEST/frontend-admin-SprintEditorModal.tsx" && echo "  frontend-admin-SprintEditorModal.tsx"
cp "$ROOT/src/pages/admin/DeliveryManagementPage.tsx" "$DEST/frontend-admin-DeliveryManagementPage.tsx" && echo "  frontend-admin-DeliveryManagementPage.tsx"
cp "$ROOT/src/components/discovery/DiscoveryAdminModal.tsx" "$DEST/frontend-admin-DiscoveryAdminModal.tsx" && echo "  frontend-admin-DiscoveryAdminModal.tsx"
cp "$ROOT/src/components/benchmarking/admin/ServiceSelectionPanel.tsx" "$DEST/frontend-admin-ServiceSelectionPanel.tsx" && echo "  frontend-admin-ServiceSelectionPanel.tsx"
cp "$ROOT/src/lib/issue-service-mapping.ts" "$DEST/frontend-admin-issue-service-mapping.ts" && echo "  frontend-admin-issue-service-mapping.ts"
cp "$ROOT/src/lib/advisory-services-full.ts" "$DEST/frontend-admin-advisory-services-full.ts" && echo "  frontend-admin-advisory-services-full.ts"
cp "$ROOT/src/lib/services/service-catalog.ts" "$DEST/frontend-admin-service-catalog.ts" 2>/dev/null && echo "  frontend-admin-service-catalog.ts" || true
[ -f "$ROOT/src/pages/admin/ServiceConfigPage.tsx" ] && cp "$ROOT/src/pages/admin/ServiceConfigPage.tsx" "$DEST/frontend-admin-ServiceConfigPage.tsx" && echo "  frontend-admin-ServiceConfigPage.tsx"

# --- Frontend: Client portal ---
cp "$ROOT/apps/client-portal/src/pages/roadmap/RoadmapPage.tsx" "$DEST/frontend-client-RoadmapPage.tsx" && echo "  frontend-client-RoadmapPage.tsx"
cp "$ROOT/apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx" "$DEST/frontend-client-DiscoveryReportPage.tsx" && echo "  frontend-client-DiscoveryReportPage.tsx"
cp "$ROOT/apps/client-portal/src/components/DiscoveryReportView.tsx" "$DEST/frontend-client-DiscoveryReportView.tsx" && echo "  frontend-client-DiscoveryReportView.tsx"
cp "$ROOT/apps/client-portal/src/components/Layout.tsx" "$DEST/frontend-client-Layout.tsx" && echo "  frontend-client-Layout.tsx"
cp "$ROOT/apps/client-portal/src/App.tsx" "$DEST/frontend-client-App.tsx" && echo "  frontend-client-App.tsx"
cp "$ROOT/apps/client-portal/src/pages/UnifiedDashboardPage.tsx" "$DEST/frontend-client-UnifiedDashboardPage.tsx" && echo "  frontend-client-UnifiedDashboardPage.tsx"
cp "$ROOT/apps/client-portal/src/lib/service-registry.ts" "$DEST/frontend-client-service-registry.ts" && echo "  frontend-client-service-registry.ts"
cp "$ROOT/apps/client-portal/src/hooks/useAnalysis.ts" "$DEST/frontend-client-useAnalysis.ts" && echo "  frontend-client-useAnalysis.ts"
cp "$ROOT/apps/client-portal/src/hooks/useAssessmentProgress.ts" "$DEST/frontend-client-useAssessmentProgress.ts" && echo "  frontend-client-useAssessmentProgress.ts"
cp "$ROOT/apps/client-portal/src/config/serviceLineAssessments.ts" "$DEST/frontend-client-serviceLineAssessments.ts" && echo "  frontend-client-serviceLineAssessments.ts"

# --- Frontend: Platform app (admin roadmap review) ---
cp "$ROOT/apps/platform/src/pages/clients/RoadmapReviewPage.tsx" "$DEST/frontend-platform-RoadmapReviewPage.tsx" 2>/dev/null && echo "  frontend-platform-RoadmapReviewPage.tsx" || true
cp "$ROOT/apps/platform/src/pages/ClientDetailPage.tsx" "$DEST/frontend-platform-ClientDetailPage.tsx" 2>/dev/null && echo "  frontend-platform-ClientDetailPage.tsx" || true

# --- Packages: LLM (roadmap, value analysis prompts) ---
cp "$ROOT/packages/llm/src/prompts/roadmap.ts" "$DEST/packages-llm-prompts-roadmap.ts" 2>/dev/null && echo "  packages-llm-prompts-roadmap.ts" || true
cp "$ROOT/packages/llm/src/prompts/value-analysis.ts" "$DEST/packages-llm-prompts-value-analysis.ts" 2>/dev/null && echo "  packages-llm-prompts-value-analysis.ts" || true
cp "$ROOT/packages/llm/src/generators/roadmap-generator.ts" "$DEST/packages-llm-roadmap-generator.ts" 2>/dev/null && echo "  packages-llm-roadmap-generator.ts" || true
[ -f "$ROOT/packages/llm/src/router.ts" ] && cp "$ROOT/packages/llm/src/router.ts" "$DEST/packages-llm-router.ts" && echo "  packages-llm-router.ts"

# --- Packages: shared types ---
cp "$ROOT/packages/shared/src/types/roadmap.ts" "$DEST/packages-shared-types-roadmap.ts" 2>/dev/null && echo "  packages-shared-types-roadmap.ts" || true
cp "$ROOT/packages/shared/src/types/client.ts" "$DEST/packages-shared-types-client.ts" 2>/dev/null && echo "  packages-shared-types-client.ts" || true

# --- Docs (365 / roadmap / service lines) ---
cp "$ROOT/docs/365-ALIGNMENT-SYSTEM-OVERVIEW.md" "$DEST/docs-365-ALIGNMENT-SYSTEM-OVERVIEW.md" 2>/dev/null && echo "  docs-365-ALIGNMENT-SYSTEM-OVERVIEW.md" || true
cp "$ROOT/docs/365_ALIGNMENT_SYSTEM_OVERVIEW.md" "$DEST/docs-365_ALIGNMENT_SYSTEM_OVERVIEW.md" 2>/dev/null && echo "  docs-365_ALIGNMENT_SYSTEM_OVERVIEW.md" || true
cp "$ROOT/docs/STAGED_ROADMAP_ARCHITECTURE.md" "$DEST/docs-STAGED_ROADMAP_ARCHITECTURE.md" && echo "  docs-STAGED_ROADMAP_ARCHITECTURE.md"
cp "$ROOT/docs/ROADMAP_TO_10_OUT_OF_10.md" "$DEST/docs-ROADMAP_TO_10_OUT_OF_10.md" 2>/dev/null && echo "  docs-ROADMAP_TO_10_OUT_OF_10.md" || true
cp "$ROOT/docs/365-NARRATIVE-ELEVATION-DESIGN.md" "$DEST/docs-365-NARRATIVE-ELEVATION-DESIGN.md" 2>/dev/null && echo "  docs-365-NARRATIVE-ELEVATION-DESIGN.md" || true
cp "$ROOT/docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md" "$DEST/docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md" && echo "  docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md"
cp "$ROOT/docs/SERVICE_LINE_DISCOVERY_MAPPING.md" "$DEST/docs-SERVICE_LINE_DISCOVERY_MAPPING.md" 2>/dev/null && echo "  docs-SERVICE_LINE_DISCOVERY_MAPPING.md" || true
[ -f "$ROOT/365_CLIENT_PORTAL_SPECIFICATION.md" ] && cp "$ROOT/365_CLIENT_PORTAL_SPECIFICATION.md" "$DEST/docs-365_CLIENT_PORTAL_SPECIFICATION.md" && echo "  docs-365_CLIENT_PORTAL_SPECIFICATION.md"

echo "Done. goal alignment analysis is now a direct copy of live files."
echo "Do not edit files in that folder during live work; use the live paths and re-run this script to sync."
