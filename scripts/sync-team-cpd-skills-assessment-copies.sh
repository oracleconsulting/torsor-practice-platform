#!/usr/bin/env bash
# Syncs live Team / CPD / Skills / Interests / Mentoring files into "team cpd skills analysis" as flat copies.
# Run from repo root: ./torsor-practice-platform/scripts/sync-team-cpd-skills-assessment-copies.sh
# Use this folder for assessment in a separate Claude project; do not edit these copies during live work.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/team cpd skills analysis"
mkdir -p "$DEST"

echo "Syncing live Team/CPD/Skills/Interests/Mentoring files -> team cpd skills analysis (flat copies)..."

# --- Admin pages: team, CPD, skills, service readiness, training ---
for p in CPDTrackerPage.tsx TrainingPlansPage.tsx TeamAnalyticsPage.tsx SkillsManagementPage.tsx SkillsHeatmapPage.tsx ServiceReadinessPage.tsx; do
  [ -f "$ROOT/src/pages/admin/$p" ] && cp "$ROOT/src/pages/admin/$p" "$DEST/admin-pages-$p" && echo "  admin-pages-$p"
done

# --- Admin components: skills heatmap, service readiness ---
for c in SkillsHeatmapGrid.tsx ServiceReadinessCard.tsx; do
  [ -f "$ROOT/src/components/$c" ] && cp "$ROOT/src/components/$c" "$DEST/admin-components-$c" && echo "  admin-components-$c"
done

# --- Lib: service readiness calculations, advisory services (required skills) ---
cp "$ROOT/src/lib/service-calculations.ts" "$DEST/lib-service-calculations.ts" 2>/dev/null && echo "  lib-service-calculations.ts" || true
cp "$ROOT/src/lib/advisory-services.ts" "$DEST/lib-advisory-services.ts" 2>/dev/null && echo "  lib-advisory-services.ts" || true
[ -f "$ROOT/src/lib/types.ts" ] && cp "$ROOT/src/lib/types.ts" "$DEST/lib-types.ts" && echo "  lib-types.ts"

# --- Hooks: service readiness, team members ---
cp "$ROOT/src/hooks/useServiceReadiness.ts" "$DEST/hooks-useServiceReadiness.ts" 2>/dev/null && echo "  hooks-useServiceReadiness.ts" || true
cp "$ROOT/src/hooks/useTeamMembers.ts" "$DEST/hooks-useTeamMembers.ts" 2>/dev/null && echo "  hooks-useTeamMembers.ts" || true

# --- Types used by skills/team (from types/) ---
for t in navigation.ts; do
  [ -f "$ROOT/src/types/$t" ] && cp "$ROOT/src/types/$t" "$DEST/types-$t" && echo "  types-$t"
done

# --- Migrations: practice_members, skills, skill_assessments, service_skill_requirements, service_line_interests, client_owner, staff RLS ---
MIGRATIONS=(
  20251214_service_metadata_schema
  20260115_client_owner_assignment
  20260201_service_intelligence_system
  20260201_create_services_table
  20260224000001_hide_discovery_in_portal
  20260225000001_sa_staff_roster_foundation
  20260226000001_service_line_assessments_rls_staff
)
for m in "${MIGRATIONS[@]}"; do
  [ -f "$ROOT/supabase/migrations/${m}.sql" ] && cp "$ROOT/supabase/migrations/${m}.sql" "$DEST/migrations-${m}.sql" && echo "  migrations-${m}.sql"
done

# --- Any migration that references skills, skill_assessments, practice_members (team/staff) ---
for m in "$ROOT/supabase/migrations/"*.sql; do
  [ -f "$m" ] || continue
  name=$(basename "$m" .sql)
  if grep -q -E 'skills|skill_assessments|service_line_interests|service_skill_requirements|practice_members|client_owner' "$m" 2>/dev/null; then
    cp "$m" "$DEST/migrations-$name.sql" 2>/dev/null && echo "  migrations-$name.sql" || true
  fi
done

# --- Docs: skills mapping if present ---
[ -f "$ROOT/SERVICE_LINE_SKILLS_MAPPING.md" ] && cp "$ROOT/SERVICE_LINE_SKILLS_MAPPING.md" "$DEST/docs-SERVICE_LINE_SKILLS_MAPPING.md" && echo "  docs-SERVICE_LINE_SKILLS_MAPPING.md"

# --- Master platform reference ---
[ -f "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" ] && cp "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" "$DEST/TORSOR_PRACTICE_PLATFORM_MASTER.md" && echo "  TORSOR_PRACTICE_PLATFORM_MASTER.md"

# Note: TEAM_CPD_SKILLS_SYSTEM_SUMMARY.md is maintained in this folder; update only when explicitly requested (see .cursor/rules).

echo "Done. team cpd skills analysis is now a direct copy of live Team/CPD/Skills/Interests files (flat, no subfolders)."
echo "Do not edit files in that folder during live work; use the live paths and re-run this script to sync."
