#!/usr/bin/env bash
# Copies docs/TORSOR_PRACTICE_PLATFORM_MASTER.md into every analysis folder so each has an up-to-date copy.
# Run from repo root: ./torsor-practice-platform/scripts/sync-master-doc-to-all-analysis-folders.sh
# Also run automatically when you run any of the service-specific sync scripts (they copy the master into their own folder).
# Use this script to refresh the master doc in all folders at once, including benchmarking (which has no full sync script).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MASTER="$ROOT/docs/TORSOR_PRACTICE_PLATFORM_MASTER.md"

if [ ! -f "$MASTER" ]; then
  echo "Error: Master doc not found at docs/TORSOR_PRACTICE_PLATFORM_MASTER.md"
  exit 1
fi

echo "Copying TORSOR_PRACTICE_PLATFORM_MASTER.md into all analysis folders..."

for dir in "goal alignment analysis" "discovery assessment analysis" "systems audit analysis" "benchmarking assessment analysis" "benchmarking assessment analysis flat" "ui ux analysis" "team cpd skills analysis"; do
  DEST="$ROOT/$dir"
  if [ -d "$DEST" ]; then
    cp "$MASTER" "$DEST/TORSOR_PRACTICE_PLATFORM_MASTER.md" && echo "  $dir/TORSOR_PRACTICE_PLATFORM_MASTER.md"
  else
    echo "  (skip $dir - folder not found)"
  fi
done

echo "Done. Master doc is updated in all existing analysis folders."
echo "Source of truth: docs/TORSOR_PRACTICE_PLATFORM_MASTER.md — edit only there."
