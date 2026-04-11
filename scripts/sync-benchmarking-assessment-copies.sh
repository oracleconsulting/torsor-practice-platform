#!/usr/bin/env bash
# Syncs live Benchmarking (BM) files into "benchmarking assessment analysis flat" as flat -COPY files.
# Run from repo root: ./torsor-practice-platform/scripts/sync-benchmarking-assessment-copies.sh
# Use for assessment in a separate Claude project; do not edit these copies during live work.
# Source of truth: live paths under src/, supabase/, docs/. Re-run after benchmarking changes.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/benchmarking assessment analysis flat"
mkdir -p "$DEST"

echo "Syncing live Benchmarking files -> benchmarking assessment analysis flat..."

# --- Docs (questionnaire / HVA / service line — live in docs/) ---
for pair in \
  "BENCHMARKING_AND_HVA_QUESTIONNAIRE.md|BENCHMARKING_AND_HVA_QUESTIONNAIRE-COPY.md" \
  "BENCHMARKING_HIDDEN_VALUE_DISCOVERY.md|BENCHMARKING_HIDDEN_VALUE_DISCOVERY-COPY.md" \
  "BENCHMARKING_SERVICE_LINE_SUMMARY.md|BENCHMARKING_SERVICE_LINE_SUMMARY-COPY.md"; do
  src="${pair%%|*}"
  out="${pair##*|}"
  if [ -f "$ROOT/docs/$src" ]; then
    cp "$ROOT/docs/$src" "$DEST/$out" && echo "  $out"
  fi
done

# --- Config & types ---
[ -f "$ROOT/src/config/assessments/benchmarking-discovery.ts" ] && cp "$ROOT/src/config/assessments/benchmarking-discovery.ts" "$DEST/benchmarking-discovery-COPY.ts" && echo "  benchmarking-discovery-COPY.ts"
[ -f "$ROOT/src/types/benchmarking.ts" ] && cp "$ROOT/src/types/benchmarking.ts" "$DEST/benchmarking-types-COPY.ts" && echo "  benchmarking-types-COPY.ts"

# --- Lib / calculators ---
[ -f "$ROOT/src/lib/export-benchmarking-data.ts" ] && cp "$ROOT/src/lib/export-benchmarking-data.ts" "$DEST/export-benchmarking-data-COPY.ts" && echo "  export-benchmarking-data-COPY.ts"
[ -f "$ROOT/src/lib/scenario-calculator.ts" ] && cp "$ROOT/src/lib/scenario-calculator.ts" "$DEST/scenario-calculator-COPY.ts" && echo "  scenario-calculator-COPY.ts"
[ -f "$ROOT/src/lib/services/benchmarking/founder-risk-calculator.ts" ] && cp "$ROOT/src/lib/services/benchmarking/founder-risk-calculator.ts" "$DEST/founder-risk-calculator-COPY.ts" && echo "  founder-risk-calculator-COPY.ts"
[ -f "$ROOT/src/lib/services/benchmarking/industry-mapper.ts" ] && cp "$ROOT/src/lib/services/benchmarking/industry-mapper.ts" "$DEST/industry-mapper-COPY.ts" && echo "  industry-mapper-COPY.ts"

# --- Admin UI: src/components/benchmarking/admin/ ---
for base in AccountsUploadPanel BenchmarkingAdminView ConversationScript DataCollectionPanel ExportAnalysisButton \
  NextStepsPanel OpportunityDashboard OpportunityPanel PDFExportEditor ServicePathwayPanel ServiceSelectionPanel ValueAnalysisPanel; do
  f="$ROOT/src/components/benchmarking/admin/${base}.tsx"
  if [ -f "$f" ]; then
    cp "$f" "$DEST/components_admin_${base}-COPY.tsx" && echo "  components_admin_${base}-COPY.tsx"
  fi
done

# --- Client report UI: src/components/benchmarking/client/ ---
for base in BenchmarkingClientDashboard BenchmarkingClientReport HeroSection MetricComparisonCard NarrativeSection \
  ScenarioPlanningSection ServiceRecommendationsSection ValueBridgeSection; do
  f="$ROOT/src/components/benchmarking/client/${base}.tsx"
  if [ -f "$f" ]; then
    cp "$f" "$DEST/components_client_${base}-COPY.tsx" && echo "  components_client_${base}-COPY.tsx"
  fi
done

# --- Shared (root of benchmarking components package) ---
for base in CalculationBreakdown EnhancedSuppressorCard ExitReadinessBreakdown SurplusCashBreakdown TwoPathsSection; do
  f="$ROOT/src/components/benchmarking/${base}.tsx"
  if [ -f "$f" ]; then
    cp "$f" "$DEST/components_shared_${base}-COPY.tsx" && echo "  components_shared_${base}-COPY.tsx"
  fi
done

# --- Admin page (BM sections live here) ---
[ -f "$ROOT/src/pages/admin/ClientServicesPage.tsx" ] && cp "$ROOT/src/pages/admin/ClientServicesPage.tsx" "$DEST/pages_ClientServicesPage-COPY.tsx" && echo "  pages_ClientServicesPage-COPY.tsx"

# --- Edge functions (index.ts) ---
for fn in generate-benchmarking-pdf generate-bm-opportunities generate-bm-report-pass1 generate-bm-report-pass2 \
  regenerate-bm-report save-bm-supplementary-data fetch-industry-benchmarks; do
  f="$ROOT/supabase/functions/$fn/index.ts"
  if [ -f "$f" ]; then
    cp "$f" "$DEST/${fn}-COPY.ts" && echo "  ${fn}-COPY.ts"
  fi
done

# --- Migrations (BM-focused set; matches historical flat folder + newer BM engagement migrations) ---
for m in \
  20251222_add_responses_jsonb_to_bm_assessment_responses \
  20251222_add_status_to_bm_reports \
  20251222_benchmarking_complete \
  20251222_fix_bm_assessment_responses_rls_upsert \
  20251222_fix_bm_reports_rls_policy \
  20251222_fix_bm_rls_client_inserts \
  20251222_fix_bm_rls_client_inserts_v2 \
  20260120_bm_enhanced_admin_guidance \
  20260120_bm_sources_detail \
  20260129_bm_balance_sheet_trends \
  20260130_bm_surplus_cash_founder_risk \
  20260201_add_value_analysis_column \
  20260201_create_client_opportunities_table \
  20260202_value_suppressors_overhaul \
  20260203_opportunity_calculations \
  20260204_bm_reports_share_functionality \
  20260204_fix_bm_reports_rls \
  20260204_fix_bm_share_tracking \
  20260205_add_bm_reports_delete_policy \
  20260205_fix_bm_reports_client_rls \
  20260207100000_bm_engagements_hva_status \
  20260208100000_bm_engagements_status_in_progress; do
  if [ -f "$ROOT/supabase/migrations/${m}.sql" ]; then
    cp "$ROOT/supabase/migrations/${m}.sql" "$DEST/migrations_${m}-COPY.sql" && echo "  migrations_${m}-COPY.sql"
  fi
done

# --- Master platform reference ---
if [ -f "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" ]; then
  cp "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" "$DEST/TORSOR_PRACTICE_PLATFORM_MASTER.md" && echo "  TORSOR_PRACTICE_PLATFORM_MASTER.md"
fi

echo ""
echo "Done. benchmarking assessment analysis flat now mirrors live benchmarking paths for synced files."
echo "Assessment-only notes (e.g. BENCHMARKING_SYSTEM_SUMMARY.md without a single live file) were not removed; refresh those manually if needed."
echo "Do not edit -COPY files during live work; re-run this script after changes."
