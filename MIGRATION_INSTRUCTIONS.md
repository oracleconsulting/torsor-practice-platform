# Database Migration Instructions

## Issues
The application had these errors:
1. ❌ `column cpd_activities.learnings_captured does not exist`
2. ❌ `relation "public.cpd_roi_dashboard" does not exist`
3. ❌ CPD hours not updating in member totals (activities logged but hours stay at 0)

## Solutions
Two migration files need to be run:
1. `20251018_add_learnings_captured.sql` - Adds missing column and fixes ROI view
2. `20251018_fix_cpd_hours_tracking.sql` - **NEW** - Fixes hours tracking and admin reconciliation

## Steps to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "+ New Query"

**First Migration:**
4. Copy and paste contents of `supabase/migrations/20251018_add_learnings_captured.sql`
5. Click "Run"

**Second Migration:**
6. Click "+ New Query" again
7. Copy and paste contents of `supabase/migrations/20251018_fix_cpd_hours_tracking.sql`
8. Click "Run"

### Option 2: Supabase CLI
```bash
cd torsor-practice-platform
supabase db push
```

### Option 3: psql Command Line
```bash
psql <connection-string> < supabase/migrations/20251018_add_learnings_captured.sql
psql <connection-string> < supabase/migrations/20251018_fix_cpd_hours_tracking.sql
```

## What Migration 1 Does (learnings_captured)
1. ✅ Adds `learnings_captured` column to `cpd_activities` table
2. ✅ Creates full-text search index on learnings
3. ✅ Fixes `cpd_roi_dashboard` view to use correct column names

## What Migration 2 Does (hours_tracking) - **CRITICAL**
1. ✅ **Creates automatic trigger** to update `practice_members.cpd_completed_hours` when CPD is logged
2. ✅ **Syncs existing CPD activities** - Your 2 hours will immediately show up!
3. ✅ Adds `cpd_category` column to distinguish "Defined" vs "Personal" hours
4. ✅ Creates `admin_cpd_overview` view for practice managers to see all team CPD
5. ✅ Adds `recalculate_all_cpd_hours()` function for troubleshooting

## Expected Results After Migration 2

### Team Member Portal
- ✅ "Overall Progress" shows **2 / 40 hours** (was 0 / 40)
- ✅ "Personal Hours Completed" shows **2h** (was 0h)
- ✅ Progress bar shows **5%** completion
- ✅ "Hours to Go" shows **38.0h** (was 40.0h)
- ✅ "Activities Logged" badge shows **1**

### Admin Portal
You can now query the admin view to see all team CPD:
```sql
SELECT * FROM admin_cpd_overview;
```

This shows:
- Each team member's CPD progress
- Hours completed vs required
- Progress percentage
- Last CPD activity date
- Activity counts

## Troubleshooting

If hours still don't show up after migration, run this diagnostic:
```sql
SELECT * FROM recalculate_all_cpd_hours();
```

This will show any discrepancies between stored totals and calculated totals.

To manually trigger a recalculation for a specific member:
```sql
-- Replace 'member-id-here' with actual member ID
UPDATE cpd_activities 
SET hours_claimed = hours_claimed 
WHERE practice_member_id = 'member-id-here' 
  AND status = 'completed';
```

## Files Changed
- `supabase/migrations/20251018_add_learnings_captured.sql` (NEW)
- `supabase/migrations/20251018_fix_cpd_hours_tracking.sql` (NEW)
- `src/components/accountancy/team/CPDOverview.tsx` (UPDATED)
- `src/pages/accountancy/team/CPDSkillsBridgePage.tsx` (UPDATED)

## Next Steps
1. Run both migrations on your Supabase database
2. Refresh your browser
3. Your 2 hours should immediately appear in the totals
4. Future CPD activities will automatically update hours
5. Admin portal will show all team member CPD progress

