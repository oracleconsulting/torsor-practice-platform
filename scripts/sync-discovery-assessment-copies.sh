#!/usr/bin/env bash
# Syncs live Discovery (and related) files into discovery assessment analysis as direct copies.
# Run from repo root: ./scripts/sync-discovery-assessment-copies.sh
# Use this folder for assessment in a separate Claude project; do not edit these copies during live work.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/discovery assessment analysis"

echo "Syncing live files -> discovery assessment analysis (direct copies)..."

# Edge functions (index.ts)
cp "$ROOT/supabase/functions/generate-discovery-opportunities/index.ts" "$DEST/generate-discovery-opportunities-copy.ts" && echo "  generate-discovery-opportunities-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/index.ts" "$DEST/generate-discovery-report-pass1-copy.ts" && echo "  generate-discovery-report-pass1-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass2/index.ts" "$DEST/generate-discovery-report-pass2-copy.ts" && echo "  generate-discovery-report-pass2-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report/index.ts" "$DEST/generate-discovery-report-index-copy.ts" && echo "  generate-discovery-report-index-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-analysis/index.ts" "$DEST/generate-discovery-analysis-copy.ts" && echo "  generate-discovery-analysis-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-pdf/index.ts" "$DEST/generate-discovery-pdf-copy.ts" && echo "  generate-discovery-pdf-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-responses-pdf/index.ts" "$DEST/generate-discovery-responses-pdf-copy.ts" && echo "  generate-discovery-responses-pdf-copy.ts"
cp "$ROOT/supabase/functions/prepare-discovery-data/index.ts" "$DEST/prepare-discovery-data-copy.ts" && echo "  prepare-discovery-data-copy.ts"
cp "$ROOT/supabase/functions/start-discovery-report/index.ts" "$DEST/start-discovery-report-copy.ts" && echo "  start-discovery-report-copy.ts"
cp "$ROOT/supabase/functions/generate-service-recommendations/index.ts" "$DEST/generate-service-recommendations-copy.ts" && echo "  generate-service-recommendations-copy.ts"
cp "$ROOT/supabase/functions/process-client-context/index.ts" "$DEST/process-client-context-copy.ts" && echo "  process-client-context-copy.ts"
cp "$ROOT/supabase/functions/process-documents/index.ts" "$DEST/process-documents-copy.ts" && echo "  process-documents-copy.ts"
cp "$ROOT/supabase/functions/parse-document/index.ts" "$DEST/parse-document-copy.ts" && echo "  parse-document-copy.ts"
cp "$ROOT/supabase/functions/process-accounts-upload/index.ts" "$DEST/process-accounts-upload-copy.ts" && echo "  process-accounts-upload-copy.ts"
cp "$ROOT/supabase/functions/upload-client-accounts/index.ts" "$DEST/upload-client-accounts-copy.ts" && echo "  upload-client-accounts-copy.ts"
cp "$ROOT/supabase/functions/detect-assessment-patterns/index.ts" "$DEST/detect-assessment-patterns-copy.ts" && echo "  detect-assessment-patterns-copy.ts"
cp "$ROOT/supabase/functions/generate-value-proposition/index.ts" "$DEST/generate-value-proposition-copy.ts" && echo "  generate-value-proposition-copy.ts"
cp "$ROOT/supabase/functions/advisory-deep-dive/index.ts" "$DEST/advisory-deep-dive-copy.ts" && echo "  advisory-deep-dive-copy.ts"
cp "$ROOT/supabase/functions/accept-invitation/index.ts" "$DEST/accept-invitation-copy.ts" && echo "  accept-invitation-copy.ts"
cp "$ROOT/supabase/functions/send-client-invitation/index.ts" "$DEST/send-client-invitation-copy.ts" && echo "  send-client-invitation-copy.ts"
cp "$ROOT/supabase/functions/client-signup/index.ts" "$DEST/client-signup-copy.ts" && echo "  client-signup-copy.ts"

# Shared
cp "$ROOT/supabase/functions/_shared/llm-cache.ts" "$DEST/shared-llm-cache-copy.ts" && echo "  shared-llm-cache-copy.ts"
cp "$ROOT/supabase/functions/_shared/llm-cost-tracker.ts" "$DEST/shared-llm-cost-tracker-copy.ts" && echo "  shared-llm-cost-tracker-copy.ts"
cp "$ROOT/supabase/functions/_shared/writing-style.ts" "$DEST/shared-writing-style-copy.ts" && echo "  shared-writing-style-copy.ts"
cp "$ROOT/supabase/functions/_shared/service-scorer.ts" "$DEST/shared-service-scorer-copy.ts" && echo "  shared-service-scorer-copy.ts"
cp "$ROOT/supabase/functions/_shared/service-scorer-v2.ts" "$DEST/shared-service-scorer-v2-copy.ts" && echo "  shared-service-scorer-v2-copy.ts"

# Pass1 calculators, benchmarks, types
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/index.ts" "$DEST/calculators-index-copy.ts" && echo "  calculators-index-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/orchestrator.ts" "$DEST/calculators-orchestrator-copy.ts" && echo "  calculators-orchestrator-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/integration.ts" "$DEST/calculators-integration-copy.ts" && echo "  calculators-integration-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/valuation.ts" "$DEST/calculators-valuation-copy.ts" && echo "  calculators-valuation-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/trajectory.ts" "$DEST/calculators-trajectory-copy.ts" && echo "  calculators-trajectory-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/payroll.ts" "$DEST/calculators-payroll-copy.ts" && echo "  calculators-payroll-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/productivity.ts" "$DEST/calculators-productivity-copy.ts" && echo "  calculators-productivity-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/profitability.ts" "$DEST/calculators-profitability-copy.ts" && echo "  calculators-profitability-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/hidden-assets.ts" "$DEST/calculators-hidden-assets-copy.ts" && echo "  calculators-hidden-assets-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/exit-readiness.ts" "$DEST/calculators-exit-readiness-copy.ts" && echo "  calculators-exit-readiness-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/cost-of-inaction.ts" "$DEST/calculators-cost-of-inaction-copy.ts" && echo "  calculators-cost-of-inaction-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/calculators/achievements.ts" "$DEST/calculators-achievements-copy.ts" && echo "  calculators-achievements-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/benchmarks/index.ts" "$DEST/benchmarks-index-copy.ts" && echo "  benchmarks-index-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/benchmarks/industry-benchmarks.ts" "$DEST/benchmarks-industry-copy.ts" && echo "  benchmarks-industry-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/types/index.ts" "$DEST/pass1-types-index-copy.ts" && echo "  pass1-types-index-copy.ts"
cp "$ROOT/supabase/functions/generate-discovery-report-pass1/types/pass1-output.ts" "$DEST/pass1-types-output-copy.ts" && echo "  pass1-types-output-copy.ts"

# Migrations (direct copy)
for m in 20251223_fix_destination_discovery_duplicates 20260115_discovery_assessment_v2 20260115_discovery_report_system 20260115_discovery_destination_focused 20260115_migrate_legacy_discovery 20260115_discovery_data_completeness 20260115_fix_discovery_trigger 20260123_discovery_learning_system 20260125_discovery_7dimension_analysis 20260129_fix_discovery_reports_client_rls 20260203_add_show_in_client_view_to_opportunities 20260204_expand_context_note_types 20260205_add_discovery_admin_context 20260206_add_followup_responses 20260207103430_discovery_opportunity_enhancements 20260208120000_discovery_three_phase_pipeline 20260209120000_reset_discovery_pipeline_for_client 20260209140000_discovery_data_audit 20260210180000_add_staff_costs_client_financial_data 20260210200000_add_directors_operating_profit_financial_data; do
  [ -f "$ROOT/supabase/migrations/${m}.sql" ] && cp "$ROOT/supabase/migrations/${m}.sql" "$DEST/migrations-${m}.sql" && echo "  migrations-${m}.sql"
done

# Frontend admin
cp "$ROOT/src/components/discovery/DiscoveryAdminModal.tsx" "$DEST/frontend-admin-DiscoveryAdminModal.tsx" && echo "  frontend-admin-DiscoveryAdminModal.tsx"
cp "$ROOT/src/components/discovery/DiscoveryOpportunityPanel.tsx" "$DEST/frontend-admin-DiscoveryOpportunityPanel.tsx" && echo "  frontend-admin-DiscoveryOpportunityPanel.tsx"
cp "$ROOT/src/components/discovery/ServicePinBlockControl.tsx" "$DEST/frontend-admin-ServicePinBlockControl.tsx" && echo "  frontend-admin-ServicePinBlockControl.tsx"
cp "$ROOT/src/components/discovery/AnalysisCommentSystem.tsx" "$DEST/frontend-admin-AnalysisCommentSystem.tsx" && echo "  frontend-admin-AnalysisCommentSystem.tsx"
cp "$ROOT/src/components/discovery/TransformationJourney.tsx" "$DEST/frontend-admin-TransformationJourney.tsx" && echo "  frontend-admin-TransformationJourney.tsx"
cp "$ROOT/src/components/discovery/index.ts" "$DEST/frontend-admin-discovery-index.ts" && echo "  frontend-admin-discovery-index.ts"

# Frontend client portal
cp "$ROOT/apps/client-portal/src/pages/discovery/DestinationDiscoveryPage.tsx" "$DEST/frontend-client-DestinationDiscoveryPage.tsx" && echo "  frontend-client-DestinationDiscoveryPage.tsx"
cp "$ROOT/apps/client-portal/src/pages/discovery/DiscoveryFollowUpPage.tsx" "$DEST/frontend-client-DiscoveryFollowUpPage.tsx" && echo "  frontend-client-DiscoveryFollowUpPage.tsx"
cp "$ROOT/apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx" "$DEST/frontend-client-DiscoveryReportPage.tsx" && echo "  frontend-client-DiscoveryReportPage.tsx"
cp "$ROOT/apps/client-portal/src/components/DiscoveryReportView.tsx" "$DEST/frontend-client-DiscoveryReportView.tsx" && echo "  frontend-client-DiscoveryReportView.tsx"
cp "$ROOT/apps/client-portal/src/components/discovery/DiscoveryMetricCard.tsx" "$DEST/frontend-client-DiscoveryMetricCard.tsx" && echo "  frontend-client-DiscoveryMetricCard.tsx"
cp "$ROOT/apps/client-portal/src/components/discovery/DiscoveryInsightCard.tsx" "$DEST/frontend-client-DiscoveryInsightCard.tsx" && echo "  frontend-client-DiscoveryInsightCard.tsx"
cp "$ROOT/apps/client-portal/src/components/discovery/index.ts" "$DEST/frontend-client-discovery-index.ts" && echo "  frontend-client-discovery-index.ts"
cp "$ROOT/apps/client-portal/src/pages/DiscoveryCompletePage.tsx" "$DEST/frontend-client-DiscoveryCompletePage.tsx" && echo "  frontend-client-DiscoveryCompletePage.tsx"
cp "$ROOT/apps/client-portal/src/pages/DiscoveryDashboardPage.tsx" "$DEST/frontend-client-DiscoveryDashboardPage.tsx" && echo "  frontend-client-DiscoveryDashboardPage.tsx"
cp "$ROOT/apps/client-portal/src/pages/DiscoveryPortalPage.tsx" "$DEST/frontend-client-DiscoveryPortalPage.tsx" && echo "  frontend-client-DiscoveryPortalPage.tsx"
cp "$ROOT/apps/client-portal/src/components/discovery/TransformationJourney.tsx" "$DEST/frontend-client-TransformationJourney.tsx" && echo "  frontend-client-TransformationJourney.tsx"

# --- Master platform reference (same file in all analysis folders; source of truth: docs/TORSOR_PRACTICE_PLATFORM_MASTER.md) ---
[ -f "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" ] && cp "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" "$DEST/TORSOR_PRACTICE_PLATFORM_MASTER.md" && echo "  TORSOR_PRACTICE_PLATFORM_MASTER.md"

echo "Done. discovery assessment analysis is now a direct copy of live files."
echo "Do not edit files in that folder during live work; use the live paths and re-run this script to sync."
