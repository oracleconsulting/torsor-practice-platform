#!/usr/bin/env bash
# Syncs live Systems Audit service line files into "systems audit analysis" as flat copies (no subfolders).
# Run from repo root: ./torsor-practice-platform/scripts/sync-systems-audit-assessment-copies.sh
# Use this folder for assessment in a separate Claude project; do not edit these copies during live work.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/systems audit analysis"
mkdir -p "$DEST"

echo "Syncing live files -> systems audit analysis (flat copies)..."

# --- Edge functions: Systems Audit report pipeline + preliminary analysis + tech stack discovery ---
cp "$ROOT/supabase/functions/generate-sa-report/index.ts" "$DEST/generate-sa-report-copy.ts" 2>/dev/null && echo "  generate-sa-report-copy.ts" || true
cp "$ROOT/supabase/functions/generate-sa-report-pass1/index.ts" "$DEST/generate-sa-report-pass1-copy.ts" 2>/dev/null && echo "  generate-sa-report-pass1-copy.ts" || true
cp "$ROOT/supabase/functions/generate-sa-report-pass2/index.ts" "$DEST/generate-sa-report-pass2-copy.ts" 2>/dev/null && echo "  generate-sa-report-pass2-copy.ts" || true
cp "$ROOT/supabase/functions/analyze-sa-preliminary/index.ts" "$DEST/analyze-sa-preliminary-copy.ts" 2>/dev/null && echo "  analyze-sa-preliminary-copy.ts" || true
cp "$ROOT/supabase/functions/discover-sa-tech-product/index.ts" "$DEST/discover-sa-tech-product-copy.ts" 2>/dev/null && echo "  discover-sa-tech-product-copy.ts" || true
cp "$ROOT/supabase/functions/generate-sa-call-script/index.ts" "$DEST/generate-sa-call-script-copy.ts" 2>/dev/null && echo "  generate-sa-call-script-copy.ts" || true
cp "$ROOT/supabase/functions/process-sa-transcript/index.ts" "$DEST/process-sa-transcript-copy.ts" 2>/dev/null && echo "  process-sa-transcript-copy.ts" || true

# --- Shared (registry, scorer - systems_audit entries) ---
[ -f "$ROOT/supabase/functions/_shared/service-registry.ts" ] && cp "$ROOT/supabase/functions/_shared/service-registry.ts" "$DEST/shared-service-registry-copy.ts" && echo "  shared-service-registry-copy.ts"
[ -f "$ROOT/supabase/functions/_shared/service-scorer-v2.ts" ] && cp "$ROOT/supabase/functions/_shared/service-scorer-v2.ts" "$DEST/shared-service-scorer-v2-copy.ts" && echo "  shared-service-scorer-v2-copy.ts"
[ -f "$ROOT/supabase/functions/_shared/service-scorer.ts" ] && cp "$ROOT/supabase/functions/_shared/service-scorer.ts" "$DEST/shared-service-scorer-copy.ts" && echo "  shared-service-scorer-copy.ts"

# --- Migrations (SA-specific: sa_engagements, sa_discovery_responses, sa_audit_reports, sa_findings, sa_recommendations, sa_system_*, sa_process_*, sa_tech_*, service_lines systems_audit) ---
for m in 20251219_systems_audit_complete 20251220_fix_sa_deep_dives_client_rls 20251220_fix_sa_engagements_client_rls 20251221_add_admin_guidance_columns 20251221_update_sa_reports_status_constraint 20251221_add_pass1_data_column 20251221_fix_sa_engagements_admin_rls 20251222_fix_sa_reports_update_rls 20251222_fix_sa_reports_client_rls 20260114_sa_documents_and_context 20260114_fix_sa_reports_rls_member_role 20260204_add_systems_audit_service 20260216_sa_status_validation_and_sharing 20260216_sa_rls_systematic_review 20260217_sa_engagements_client_insert 20260217_sa_inventory_data_entry_context 20260217_sa_text_char_limit_800 20260217_sa_aspiration_columns 20260218000000_sa_pass1_phase_statuses 20260219000000_sa_tech_product_tables 20260220000001_sa_inventory_expansion 20260220000002_sa_process_staff_interviews 20260220000003_sa_engagement_gaps_review 20260221000001_sa_preliminary_analysis 20260221000002_sa_follow_up_script_transcript 20260222000001_sa_preliminary_gaps_and_status 20260222000002_sa_follow_up_script_transcript 20260223000001_sa_inventory_field_notes 20260223000002_sa_pp_test_data_context 20260225000001_sa_staff_roster_foundation 20260226000001_service_line_assessments_rls_staff; do
  [ -f "$ROOT/supabase/migrations/${m}.sql" ] && cp "$ROOT/supabase/migrations/${m}.sql" "$DEST/migrations-${m}.sql" && echo "  migrations-${m}.sql"
done

# --- Frontend: Admin (src/) - ClientServicesPage contains Systems Audit modal; Tech Database + inventory badges ---
cp "$ROOT/src/pages/admin/ClientServicesPage.tsx" "$DEST/frontend-admin-ClientServicesPage.tsx" 2>/dev/null && echo "  frontend-admin-ClientServicesPage.tsx" || true
cp "$ROOT/src/pages/admin/TechDatabasePage.tsx" "$DEST/frontend-admin-TechDatabasePage.tsx" 2>/dev/null && echo "  frontend-admin-TechDatabasePage.tsx" || true
cp "$ROOT/src/components/admin/SystemMatchBadge.tsx" "$DEST/frontend-admin-SystemMatchBadge.tsx" 2>/dev/null && echo "  frontend-admin-SystemMatchBadge.tsx" || true
cp "$ROOT/src/hooks/useTechLookupBatch.ts" "$DEST/frontend-admin-useTechLookupBatch.ts" 2>/dev/null && echo "  frontend-admin-useTechLookupBatch.ts" || true
cp "$ROOT/src/types/tech-stack.ts" "$DEST/frontend-admin-types-tech-stack.ts" 2>/dev/null && echo "  frontend-admin-types-tech-stack.ts" || true
cp "$ROOT/src/lib/issue-service-mapping.ts" "$DEST/frontend-admin-issue-service-mapping.ts" 2>/dev/null && echo "  frontend-admin-issue-service-mapping.ts" || true
cp "$ROOT/src/lib/advisory-services-full.ts" "$DEST/frontend-admin-advisory-services-full.ts" 2>/dev/null && echo "  frontend-admin-advisory-services-full.ts" || true
cp "$ROOT/src/config/serviceLineAssessments.ts" "$DEST/frontend-admin-serviceLineAssessments.ts" 2>/dev/null && echo "  frontend-admin-serviceLineAssessments.ts" || true
cp "$ROOT/src/lib/service-registry.ts" "$DEST/frontend-admin-service-registry.ts" 2>/dev/null && echo "  frontend-admin-service-registry.ts" || true

# --- Frontend: Platform app (Systems Audit view, client detail, SA config & types) ---
cp "$ROOT/apps/platform/src/components/systems-audit/SystemsAuditView.tsx" "$DEST/frontend-platform-SystemsAuditView.tsx" 2>/dev/null && echo "  frontend-platform-SystemsAuditView.tsx" || true
cp "$ROOT/apps/platform/src/pages/ClientDetailPage.tsx" "$DEST/frontend-platform-ClientDetailPage.tsx" 2>/dev/null && echo "  frontend-platform-ClientDetailPage.tsx" || true
cp "$ROOT/apps/platform/src/config/assessments/systems-audit-discovery.ts" "$DEST/frontend-platform-systems-audit-discovery.ts" 2>/dev/null && echo "  frontend-platform-systems-audit-discovery.ts" || true
cp "$ROOT/apps/platform/src/types/systems-audit.ts" "$DEST/frontend-platform-types-systems-audit.ts" 2>/dev/null && echo "  frontend-platform-types-systems-audit.ts" || true

# --- Frontend: Client portal (assessment, inventory, deep dives, dashboard, config, registry) ---
cp "$ROOT/apps/client-portal/src/pages/services/ServiceAssessmentPage.tsx" "$DEST/frontend-client-ServiceAssessmentPage.tsx" 2>/dev/null && echo "  frontend-client-ServiceAssessmentPage.tsx" || true
cp "$ROOT/apps/client-portal/src/pages/services/SystemInventoryPage.tsx" "$DEST/frontend-client-SystemInventoryPage.tsx" 2>/dev/null && echo "  frontend-client-SystemInventoryPage.tsx" || true
cp "$ROOT/apps/client-portal/src/pages/services/ProcessDeepDivesPage.tsx" "$DEST/frontend-client-ProcessDeepDivesPage.tsx" 2>/dev/null && echo "  frontend-client-ProcessDeepDivesPage.tsx" || true
cp "$ROOT/apps/client-portal/src/pages/services/SAReportPage.tsx" "$DEST/frontend-client-SAReportPage.tsx" 2>/dev/null && echo "  frontend-client-SAReportPage.tsx" || true
cp "$ROOT/apps/client-portal/src/components/SystemsMapSection.tsx" "$DEST/frontend-client-SystemsMapSection.tsx" 2>/dev/null && echo "  frontend-client-SystemsMapSection.tsx" || true
cp "$ROOT/apps/client-portal/src/pages/UnifiedDashboardPage.tsx" "$DEST/frontend-client-UnifiedDashboardPage.tsx" 2>/dev/null && echo "  frontend-client-UnifiedDashboardPage.tsx" || true
cp "$ROOT/apps/client-portal/src/App.tsx" "$DEST/frontend-client-App.tsx" 2>/dev/null && echo "  frontend-client-App.tsx" || true
cp "$ROOT/apps/client-portal/src/config/serviceLineAssessments.ts" "$DEST/frontend-client-serviceLineAssessments.ts" 2>/dev/null && echo "  frontend-client-serviceLineAssessments.ts" || true
cp "$ROOT/apps/client-portal/src/lib/service-registry.ts" "$DEST/frontend-client-service-registry.ts" 2>/dev/null && echo "  frontend-client-service-registry.ts" || true
cp "$ROOT/apps/client-portal/src/hooks/useServiceContext.ts" "$DEST/frontend-client-useServiceContext.ts" 2>/dev/null && echo "  frontend-client-useServiceContext.ts" || true
cp "$ROOT/apps/client-portal/src/hooks/useAdaptiveAssessment.ts" "$DEST/frontend-client-useAdaptiveAssessment.ts" 2>/dev/null && echo "  frontend-client-useAdaptiveAssessment.ts" || true
cp "$ROOT/apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx" "$DEST/frontend-client-DiscoveryReportPage.tsx" 2>/dev/null && echo "  frontend-client-DiscoveryReportPage.tsx" || true
cp "$ROOT/apps/client-portal/src/components/DiscoveryReportView.tsx" "$DEST/frontend-client-DiscoveryReportView.tsx" 2>/dev/null && echo "  frontend-client-DiscoveryReportView.tsx" || true
cp "$ROOT/apps/client-portal/src/pages/assessments/AssessmentsPage.tsx" "$DEST/frontend-client-AssessmentsPage.tsx" 2>/dev/null && echo "  frontend-client-AssessmentsPage.tsx" || true
cp "$ROOT/apps/client-portal/src/pages/assessments/ViewAssessmentAnswersPage.tsx" "$DEST/frontend-client-ViewAssessmentAnswersPage.tsx" 2>/dev/null && echo "  frontend-client-ViewAssessmentAnswersPage.tsx" || true

# --- Docs (SA assessment status, questions, service lines architecture excerpt) ---
[ -f "$ROOT/SYSTEMS_AUDIT_ASSESSMENT_STATUS.md" ] && cp "$ROOT/SYSTEMS_AUDIT_ASSESSMENT_STATUS.md" "$DEST/docs-SYSTEMS_AUDIT_ASSESSMENT_STATUS.md" && echo "  docs-SYSTEMS_AUDIT_ASSESSMENT_STATUS.md"
[ -f "$ROOT/docs/SYSTEMS_AUDIT_ASSESSMENT_QUESTIONS.md" ] && cp "$ROOT/docs/SYSTEMS_AUDIT_ASSESSMENT_QUESTIONS.md" "$DEST/docs-SYSTEMS_AUDIT_ASSESSMENT_QUESTIONS.md" && echo "  docs-SYSTEMS_AUDIT_ASSESSMENT_QUESTIONS.md"
[ -f "$ROOT/docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md" ] && cp "$ROOT/docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md" "$DEST/docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md" && echo "  docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md"

# --- Master platform reference (same file in all analysis folders; source of truth: docs/TORSOR_PRACTICE_PLATFORM_MASTER.md) ---
[ -f "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" ] && cp "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" "$DEST/TORSOR_PRACTICE_PLATFORM_MASTER.md" && echo "  TORSOR_PRACTICE_PLATFORM_MASTER.md"

# Note: SYSTEMS_AUDIT_SYSTEM_SUMMARY.md is maintained in this folder; update only when explicitly requested (see .cursor/rules).

echo "Done. systems audit analysis is now a direct copy of live files (flat, no subfolders)."
echo "Do not edit files in that folder during live work; use the live paths and re-run this script to sync."
