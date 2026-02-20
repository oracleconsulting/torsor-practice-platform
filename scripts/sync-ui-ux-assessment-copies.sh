#!/usr/bin/env bash
# Syncs live UI/UX display files (admin torsor.co.uk + client portal) into "ui ux analysis" as flat copies.
# Focus: display/presentation only — pages, components, layouts, config, types, migrations that source data for UI.
# Run from repo root: ./torsor-practice-platform/scripts/sync-ui-ux-assessment-copies.sh
# Use this folder for assessment in a separate Claude project; do not edit these copies during live work.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/ui ux analysis"
mkdir -p "$DEST"

echo "Syncing live UI/UX display files -> ui ux analysis (flat copies)..."

# --- Admin (src/): pages, components, layout, app, config, types, lib used by UI, hooks ---
for f in "$ROOT/src/App.tsx" "$ROOT/src/index.css" "$ROOT/src/main.tsx"; do
  [ -f "$f" ] && cp "$f" "$DEST/admin-$(basename "$f")" && echo "  admin-$(basename "$f")"
done
[ -f "$ROOT/src/components/Navigation.tsx" ] && cp "$ROOT/src/components/Navigation.tsx" "$DEST/admin-Navigation.tsx" && echo "  admin-Navigation.tsx"
[ -f "$ROOT/src/components/Layout.tsx" ] && cp "$ROOT/src/components/Layout.tsx" "$DEST/admin-Layout.tsx" && echo "  admin-Layout.tsx"

find "$ROOT/src/pages" -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | while read -r f; do
  rel="${f#$ROOT/src/pages/}"
  base=$(echo "$rel" | tr '/' '-')
  cp "$f" "$DEST/admin-pages-$base" && echo "  admin-pages-$base"
done

find "$ROOT/src/components" -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | while read -r f; do
  rel="${f#$ROOT/src/components/}"
  base=$(echo "$rel" | tr '/' '-')
  cp "$f" "$DEST/admin-components-$base" && echo "  admin-components-$base"
done

find "$ROOT/src/config" -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | while read -r f; do
  cp "$f" "$DEST/admin-config-$(basename "$f")" && echo "  admin-config-$(basename "$f")"
done
find "$ROOT/src/types" -type f -name "*.ts" 2>/dev/null | while read -r f; do
  cp "$f" "$DEST/admin-types-$(basename "$f")" && echo "  admin-types-$(basename "$f")"
done
find "$ROOT/src/hooks" -type f -name "*.ts" 2>/dev/null | while read -r f; do
  cp "$f" "$DEST/admin-hooks-$(basename "$f")" && echo "  admin-hooks-$(basename "$f")"
done
for lib in service-registry.ts advisory-services-full.ts issue-service-mapping.ts service-calculations.ts types.ts; do
  [ -f "$ROOT/src/lib/$lib" ] && cp "$ROOT/src/lib/$lib" "$DEST/admin-lib-$lib" && echo "  admin-lib-$lib"
done

# --- Platform app (torsor.co.uk admin) ---
find "$ROOT/apps/platform/src" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) 2>/dev/null | while read -r f; do
  rel="${f#$ROOT/apps/platform/src/}"
  base=$(echo "$rel" | tr '/' '-')
  cp "$f" "$DEST/platform-$base" && echo "  platform-$base"
done

# --- Client portal ---
find "$ROOT/apps/client-portal/src" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) 2>/dev/null | while read -r f; do
  rel="${f#$ROOT/apps/client-portal/src/}"
  base=$(echo "$rel" | tr '/' '-')
  cp "$f" "$DEST/client-$base" && echo "  client-$base"
done

# --- Migrations (data sourced for display: RLS, tables/views used by UI) ---
find "$ROOT/supabase/migrations" -maxdepth 1 -name "*.sql" -type f 2>/dev/null | while read -r m; do
  name=$(basename "$m" .sql)
  cp "$m" "$DEST/migrations-$name.sql" && echo "  migrations-$name.sql"
done

# --- Master platform reference ---
[ -f "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" ] && cp "$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md" "$DEST/TORSOR_PRACTICE_PLATFORM_MASTER.md" && echo "  TORSOR_PRACTICE_PLATFORM_MASTER.md"

# Note: UI_UX_SYSTEM_SUMMARY.md is maintained in this folder; update only when explicitly requested (see .cursor/rules).

echo "Done. ui ux analysis is now a direct copy of live UI/UX display files (flat, no subfolders)."
echo "Do not edit files in that folder during live work; use the live paths and re-run this script to sync."
