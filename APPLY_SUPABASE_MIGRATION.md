# Apply Supabase Migration - AI Training Recommendations

## Quick Instructions

### Method 1: Supabase Dashboard (Easiest) ✅

1. **Open Supabase Dashboard**: https://app.supabase.com
2. **Select your project**: torsor-practice-platform
3. **Go to**: SQL Editor (left sidebar)
4. **Click**: "+ New query"
5. **Open local file**: `supabase/migrations/20251012_ai_training_recommendations.sql`
6. **Copy all contents** and paste into SQL Editor
7. **Click**: "Run" button
8. **Wait** for success message

### Method 2: Supabase CLI (If installed)

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform
supabase db push
```

## Verification

After running the migration, verify it worked:

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (table_name LIKE '%training%' OR table_name LIKE '%learning%')
ORDER BY table_name;
```

**Expected tables:**
- `training_recommendations_cache`
- `group_training_opportunities`
- `learning_paths`
- `recommendation_feedback`

### Check Views Created
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected views:**
- `active_training_recommendations`
- `group_opportunities_with_details`

### Test Cache Function
```sql
SELECT clean_expired_recommendation_caches();
```

Should return: `0` (no expired caches yet)

## What This Migration Does

1. **Creates 4 new tables**:
   - Recommendations cache (7-day storage)
   - Group training opportunities
   - Learning paths (6-month roadmaps)
   - Recommendation feedback

2. **Sets up auto-invalidation**:
   - Cache automatically expires after 7 days
   - Cache invalidates when skills are updated
   - Trigger function monitors skill changes

3. **Creates helper functions**:
   - `clean_expired_recommendation_caches()` - cleanup utility
   - `invalidate_recommendations_cache()` - trigger function

4. **Creates useful views**:
   - Active recommendations with expiry info
   - Group opportunities with member details

5. **Adds indexes** for performance:
   - Member ID lookups
   - Expiry date queries
   - Status filters
   - Practice ID queries

## Migration File Location

```
torsor-practice-platform/supabase/migrations/20251012_ai_training_recommendations.sql
```

## If Something Goes Wrong

### Error: "relation already exists"
**Solution**: Table might already exist. Drop tables first:
```sql
DROP TABLE IF EXISTS recommendation_feedback CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS group_training_opportunities CASCADE;
DROP TABLE IF EXISTS training_recommendations_cache CASCADE;
```

Then re-run the migration.

### Error: "function already exists"
**Solution**: Drop functions first:
```sql
DROP FUNCTION IF EXISTS clean_expired_recommendation_caches();
DROP FUNCTION IF EXISTS invalidate_recommendations_cache();
```

Then re-run the migration.

### Error: Permission denied
**Solution**: Ensure you're logged in as the database owner/admin.

## Post-Migration

### Update TypeScript Types (Optional but Recommended)
If you have Supabase CLI:
```bash
cd torsor-practice-platform
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

This will remove the need for `as any` type assertions in the code.

### Test the Feature
1. Go to Team Management → Advisory Skills
2. Click "Show Recommendations" in AI section
3. Select a team member
4. View generated recommendations
5. Click "Generate 6-Month Learning Path"
6. Verify everything works!

## Need Help?

Check the full documentation:
- `/PROMPT_2_COMPLETION_SUMMARY.md` - Complete implementation details
- `/TORSOR_CODEBASE_ANALYSIS/` - Archived copies of all files

## Status Tracking

After applying migration, update this checklist:

- [ ] Migration run successfully
- [ ] Tables verified in database
- [ ] Views created
- [ ] Functions working
- [ ] TypeScript types updated (optional)
- [ ] Feature tested in UI
- [ ] Team members notified

---

**File**: `supabase/migrations/20251012_ai_training_recommendations.sql`
**Date**: October 11, 2025
**Size**: 255 lines, 8.2KB

