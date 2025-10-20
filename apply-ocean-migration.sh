#!/bin/bash
# OCEAN Personality Assessment - Migration Application Script
# Run this to apply the database migration

echo "=================================================="
echo "OCEAN Personality Assessment Migration"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20251021_personality_assessments.sql" ]; then
    echo "❌ Error: Migration file not found!"
    echo "Please run this script from the torsor-practice-platform directory"
    exit 1
fi

echo "✅ Migration file found"
echo ""
echo "📋 This migration will create:"
echo "   - personality_assessments table"
echo "   - team_member_profiles table"
echo "   - team_compositions table"
echo "   - RLS policies for security"
echo "   - Admin dashboard views"
echo "   - Helper functions"
echo ""
echo "=================================================="
echo "NEXT STEPS:"
echo "=================================================="
echo ""
echo "1. Go to your Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT_ID"
echo ""
echo "2. Navigate to: SQL Editor"
echo ""
echo "3. Click 'New Query'"
echo ""
echo "4. Copy and paste the contents of:"
echo "   supabase/migrations/20251021_personality_assessments.sql"
echo ""
echo "5. Click 'Run' or press Cmd+Enter"
echo ""
echo "6. Verify success (should see 'Success. No rows returned')"
echo ""
echo "=================================================="
echo "VERIFICATION QUERIES:"
echo "=================================================="
echo ""
echo "After applying, run these to verify:"
echo ""
echo "-- Check tables exist"
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema = 'public'"
echo "AND table_name IN ('personality_assessments', 'team_member_profiles', 'team_compositions');"
echo ""
echo "-- Check views exist"
echo "SELECT table_name FROM information_schema.views"
echo "WHERE table_schema = 'public'"
echo "AND table_name IN ('team_assessment_overview', 'practice_team_composition_summary');"
echo ""
echo "-- Check RLS is enabled"
echo "SELECT tablename, rowsecurity FROM pg_tables"
echo "WHERE schemaname = 'public'"
echo "AND tablename IN ('personality_assessments', 'team_member_profiles', 'team_compositions');"
echo ""
echo "=================================================="
echo ""
echo "📄 Migration file location:"
echo "   $(pwd)/supabase/migrations/20251021_personality_assessments.sql"
echo ""
echo "Press Enter to open the migration file..."
read

# Try to open the migration file with default editor
if command -v code &> /dev/null; then
    code supabase/migrations/20251021_personality_assessments.sql
elif command -v subl &> /dev/null; then
    subl supabase/migrations/20251021_personality_assessments.sql
else
    cat supabase/migrations/20251021_personality_assessments.sql
fi

echo ""
echo "✅ Migration guide complete!"
echo ""


