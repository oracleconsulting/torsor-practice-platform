#!/usr/bin/env bash
# Syncs live Business Intelligence / Management Accounts files into "business intelligence analysis"
# as flat copies (no subfolders). Same pattern as systems audit analysis.
# Run from repo root: ./torsor-practice-platform/scripts/sync-business-intelligence-assessment-copies.sh
# Use for assessment / oversight in a separate Claude project; do not edit these copies during live work.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/business intelligence analysis"
mkdir -p "$DEST"

echo "Syncing live BI / MA files -> business intelligence analysis (flat copies)..."

# --- Edge functions (BI / MA pipeline, KPIs, scheduling, shared uploads) ---
for fn in \
  calculate-ma-trends \
  extract-ma-financials \
  generate-bi-insights \
  generate-bi-pdf \
  generate-ma-forecast \
  generate-ma-insights \
  generate-ma-precall-analysis \
  generate-ma-report-pass1 \
  generate-ma-report-pass2 \
  generate-ma-scenarios \
  get-kpi-dashboard \
  get-kpi-definitions \
  manage-kpi-selections \
  regenerate-ma-admin-view \
  save-kpi-values \
  send-scheduled-report \
  upload-ma-document \
  process-accounts-upload \
  reprocess-accounts \
  upload-client-accounts; do
  f="$ROOT/supabase/functions/$fn/index.ts"
  if [ -f "$f" ]; then
    cp "$f" "$DEST/${fn}-copy.ts" && echo "  ${fn}-copy.ts"
  fi
done

# --- Migrations (MA → BI evolution, KPIs, portal, scheduling, core bi_* tables) ---
for m in \
  20251216_management_accounts_ai_layer \
  20251216_management_accounts_ai_layer_v2 \
  20251217_fix_ma_documents_storage_policies \
  20251217_sync_ma_assessment_data \
  20251218_add_ma_insights_unique_constraint \
  20260115_clear_ma_assessment_responses \
  20260115_management_accounts_ongoing_cycle \
  20260115_unshare_ma_insights \
  20260115_update_ma_assessment_questions \
  20260117_ma_assessment_reports \
  20260117_ma_reports_add_client_id \
  20260117_ma_sales_flow_architecture \
  20260117_update_ma_questions_to_20 \
  20260118_add_call_context_to_ma_reports \
  20260118_fix_ma_documents_rls \
  20260118_fix_ma_precall_gaps_trigger \
  20260120_ma_kpi_system \
  20260120_ma_portal_core \
  20260120_ma_portal_core_fix \
  20260121_add_burn_rate_kpi \
  20260121_ma_dashboard_elevated \
  20260121_ma_insights_columns \
  20260121_ma_insights_review_workflow \
  20260122_bi_phase1_enhancements \
  20260122_bi_phase3_scheduling \
  20260122_bi_storage_bucket \
  20260122_business_intelligence_core \
  20260122_business_intelligence_kpis \
  20260122_fix_ma_periods_rls \
  20260122_fix_ma_periods_status_constraint \
  20260122_rename_ma_to_bi; do
  if [ -f "$ROOT/supabase/migrations/${m}.sql" ]; then
    cp "$ROOT/supabase/migrations/${m}.sql" "$DEST/migrations-${m}.sql" && echo "  migrations-${m}.sql"
  fi
done

# --- Shared modules referenced by BI/scoring ---
for shared in service-registry service-scorer-v2 service-scorer; do
  f="$ROOT/supabase/functions/_shared/${shared}.ts"
  if [ -f "$f" ]; then
    cp "$f" "$DEST/shared-${shared}-copy.ts" && echo "  shared-${shared}-copy.ts"
  fi
done

# --- Admin: ClientServicesPage hosts MA/BI workflows ---
cp "$ROOT/src/pages/admin/ClientServicesPage.tsx" "$DEST/frontend-admin-ClientServicesPage.tsx" 2>/dev/null && echo "  frontend-admin-ClientServicesPage.tsx" || true

# --- Config / types / services (admin src) ---
cp "$ROOT/src/config/serviceLineAssessments.ts" "$DEST/frontend-admin-serviceLineAssessments.ts" 2>/dev/null && echo "  frontend-admin-serviceLineAssessments.ts" || true
cp "$ROOT/src/types/business-intelligence.ts" "$DEST/frontend-admin-types-business-intelligence.ts" 2>/dev/null && echo "  frontend-admin-types-business-intelligence.ts" || true
cp "$ROOT/src/lib/service-registry.ts" "$DEST/frontend-admin-service-registry.ts" 2>/dev/null && echo "  frontend-admin-service-registry.ts" || true
cp "$ROOT/src/services/BIAlertService.ts" "$DEST/frontend-admin-BIAlertService.ts" 2>/dev/null && echo "  frontend-admin-BIAlertService.ts" || true
cp "$ROOT/src/services/business-intelligence/comparison-service.ts" "$DEST/frontend-admin-bi-comparison-service.ts" 2>/dev/null && echo "  frontend-admin-bi-comparison-service.ts" || true
cp "$ROOT/src/services/business-intelligence/kpi-calculator.ts" "$DEST/frontend-admin-bi-kpi-calculator.ts" 2>/dev/null && echo "  frontend-admin-bi-kpi-calculator.ts" || true
cp "$ROOT/src/services/ma/kpi-calculations.ts" "$DEST/frontend-admin-ma-kpi-calculations.ts" 2>/dev/null && echo "  frontend-admin-ma-kpi-calculations.ts" || true
cp "$ROOT/src/services/ma/true-cash.ts" "$DEST/frontend-admin-ma-true-cash.ts" 2>/dev/null && echo "  frontend-admin-ma-true-cash.ts" || true

# --- Admin components: business-intelligence (recursive, flat names) ---
if [ -d "$ROOT/src/components/business-intelligence" ]; then
  find "$ROOT/src/components/business-intelligence" -name '*.tsx' -type f | sort | while read -r f; do
    rel="${f#$ROOT/src/components/business-intelligence/}"
    safe=$(echo "$rel" | tr '/' '-' | sed 's/\.tsx$//')
    cp "$f" "$DEST/frontend-admin-bi-${safe}-copy.tsx" && echo "  frontend-admin-bi-${safe}-copy.tsx"
  done
fi

# --- Legacy admin BI shell (if present) ---
if [ -d "$ROOT/src/components/_bi_legacy" ]; then
  find "$ROOT/src/components/_bi_legacy" -name '*.tsx' -type f | sort | while read -r f; do
    base=$(basename "$f" .tsx)
    cp "$f" "$DEST/frontend-admin-bi_legacy-${base}-copy.tsx" && echo "  frontend-admin-bi_legacy-${base}-copy.tsx"
  done
fi

# --- Platform app (practice-facing BI views) ---
if [ -d "$ROOT/apps/platform/src/components/services/business-intelligence" ]; then
  find "$ROOT/apps/platform/src/components/services/business-intelligence" -name '*.tsx' -type f | sort | while read -r f; do
    rel="${f#$ROOT/apps/platform/src/components/services/business-intelligence/}"
    safe=$(echo "$rel" | tr '/' '-' | sed 's/\.tsx$//')
    cp "$f" "$DEST/frontend-platform-bi-${safe}-copy.tsx" && echo "  frontend-platform-bi-${safe}-copy.tsx"
  done
fi
cp "$ROOT/apps/platform/src/types/business-intelligence.ts" "$DEST/frontend-platform-types-business-intelligence.ts" 2>/dev/null && echo "  frontend-platform-types-business-intelligence.ts" || true

# --- Client portal: BI pages, components, registry, routes ---
cp "$ROOT/apps/client-portal/src/pages/services/BIDashboardPage.tsx" "$DEST/frontend-client-BIDashboardPage.tsx" 2>/dev/null && echo "  frontend-client-BIDashboardPage.tsx" || true
cp "$ROOT/apps/client-portal/src/pages/services/BIReportPage.tsx" "$DEST/frontend-client-BIReportPage.tsx" 2>/dev/null && echo "  frontend-client-BIReportPage.tsx" || true
cp "$ROOT/apps/client-portal/src/pages/services/BIPresentationPage.tsx" "$DEST/frontend-client-BIPresentationPage.tsx" 2>/dev/null && echo "  frontend-client-BIPresentationPage.tsx" || true
cp "$ROOT/apps/client-portal/src/App.tsx" "$DEST/frontend-client-App.tsx" 2>/dev/null && echo "  frontend-client-App.tsx" || true
cp "$ROOT/apps/client-portal/src/lib/service-registry.ts" "$DEST/frontend-client-service-registry.ts" 2>/dev/null && echo "  frontend-client-service-registry.ts" || true
cp "$ROOT/apps/client-portal/src/config/serviceLineAssessments.ts" "$DEST/frontend-client-serviceLineAssessments.ts" 2>/dev/null && echo "  frontend-client-serviceLineAssessments.ts" || true
cp "$ROOT/apps/client-portal/src/pages/services/ServiceAssessmentPage.tsx" "$DEST/frontend-client-ServiceAssessmentPage.tsx" 2>/dev/null && echo "  frontend-client-ServiceAssessmentPage.tsx" || true

for subdir in bi-dashboard business-intelligence; do
  if [ -d "$ROOT/apps/client-portal/src/components/$subdir" ]; then
    find "$ROOT/apps/client-portal/src/components/$subdir" -name '*.tsx' -type f | sort | while read -r f; do
      base=$(basename "$f" .tsx)
      cp "$f" "$DEST/frontend-client-${subdir}-${base}-copy.tsx" && echo "  frontend-client-${subdir}-${base}-copy.tsx"
    done
  fi
done

# --- Docs (architecture excerpt + PDF notes + live service-line summary) ---
[ -f "$ROOT/docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md" ] && cp "$ROOT/docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md" "$DEST/docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md" && echo "  docs-SERVICE_LINES_ARCHITECTURE_DISCOVERY.md"
[ -f "$ROOT/docs/PDF_EXPORT_FUNCTIONALITY.md" ] && cp "$ROOT/docs/PDF_EXPORT_FUNCTIONALITY.md" "$DEST/docs-PDF_EXPORT_FUNCTIONALITY.md" && echo "  docs-PDF_EXPORT_FUNCTIONALITY.md"
[ -f "$ROOT/docs/BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md" ] && cp "$ROOT/docs/BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md" "$DEST/docs-BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md" && echo "  docs-BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md"

# --- Master platform reference ---
[ -f "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" ] && cp "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" "$DEST/TORSOR_PRACTICE_PLATFORM_MASTER.md" && echo "  TORSOR_PRACTICE_PLATFORM_MASTER.md"

# Note: BUSINESS_INTELLIGENCE_SYSTEM_SUMMARY.md in this folder is the oversight doc;
# refresh its narrative only when explicitly requested (see .cursor/rules).

echo ""
echo "Done. business intelligence analysis is now synced from live paths (flat, no subfolders)."
echo "Do not edit files in that folder during live work; re-run this script after changes."
