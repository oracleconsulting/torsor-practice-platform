#!/bin/bash
# Fix all contrast issues in TORSOR Practice Platform

echo "🔧 Fixing contrast issues across all pages..."

# Files to fix
FILES=(
  "src/pages/ContinuityPlanningPage.tsx"
  "src/pages/accountancy/ContinuityPlanningPage.tsx"
  "src/pages/accountancy/ClientRescues.tsx"
  "src/pages/accountancy/MTDCapacityPage.tsx"
  "src/pages/accountancy/CyberSecurityPage.tsx"
  "src/pages/accountancy/ComplianceCalendarPage.tsx"
  "src/pages/accountancy/ESGReportingPage.tsx"
  "src/pages/ClientRescues.tsx"
  "src/pages/MTDCapacityPage.tsx"
  "src/pages/CyberSecurityPage.tsx"
  "src/pages/ComplianceCalendarPage.tsx"
  "src/pages/ESGReportingPage.tsx"
)

# Fix 1: Replace text-[#f5f1e8] with text-white (on dark backgrounds)
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing: $file"
    sed -i '' 's/text-\[#f5f1e8\]/text-white/g' "$file"
  fi
done

echo "✅ Fixed all files!"
echo ""
echo "Files modified:"
for file in "${FILES[@]}"; do
  echo "  - $file"
done

