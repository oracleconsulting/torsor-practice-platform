# Service Line Interests Migration Guide

## Overview
The Service Line Interests feature allows team members to rank their interest in BSG service lines for strategic deployment planning.

## Database Error (Expected Until Migration)
If you see this error in console:
```
Error: relation "public.service_line_interests" does not exist
Code: 42P01
```

**This is expected!** The table hasn't been created in production yet.

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** in left sidebar
3. Click **New query**
4. Copy entire contents of `supabase/migrations/20251020_service_line_interests.sql`
5. Paste into SQL editor
6. Click **Run** (bottom right)
7. You should see: "Success. No rows returned"

### Option 2: Supabase CLI
```bash
cd torsor-practice-platform
supabase db push
```

### Option 3: Direct psql
```bash
psql "postgresql://[connection-string]" < supabase/migrations/20251020_service_line_interests.sql
```

## What This Migration Creates

### 1. `service_line_interests` Table
Stores team member rankings for BSG service lines:
- `practice_member_id` - Who ranked it
- `service_line` - Which service line
- `interest_rank` - Priority ranking (1 = most interested)
- `current_experience_level` - Experience (0-5 scale)
- `desired_involvement_pct` - How much involvement they want (0-100%)
- `notes` - Why they're interested

### 2. `service_line_coverage` View
Strategic view combining:
- Member interests
- Current experience levels
- Skill assessments for each service line
- Match scores for optimal deployment

### 3. RLS Policies
- Team members can manage their own interests
- Managers/directors can view all team interests

## BSG Service Lines (As of Oct 2025)

**Active Service Lines:**
1. **Automation** - £115-£180/hour + setup
2. **Management Accounts** - £650/month or £1,750/quarter
3. **Future Financial Information / Advisory Accelerator** - £1,000-£9,000 depending on scope
4. **Benchmarking - External and Internal** - £450-£1,500
5. **Profit Extraction / Remuneration Strategies** - Free (compliance) to £500 (advisory)
6. **365 Alignment Programme** - £1,500-£9,000 (Tiered: Lite/Growth/Partner)

**Coming Soon:**
- Systems Audit

## After Migration

### Team Member Portal
Users can now:
1. Go to **Professional Development** → **Service Lines** tab
2. Drag and drop to rank service lines by interest
3. Set experience level (0-5) for each service line
4. Set desired involvement percentage
5. Add notes about their interest

### Admin Portal (Future)
Strategic deployment view showing:
- Which service lines have strong team interest
- Which service lines need skill development
- Optimal team member assignments based on:
  - Interest rankings
  - Current skills
  - Experience levels
  - Capacity

## Verification

After running migration, verify in SQL Editor:

```sql
-- Check table exists
SELECT COUNT(*) FROM service_line_interests;

-- Check view exists
SELECT * FROM service_line_coverage LIMIT 5;

-- Test insert (replace with real member ID)
INSERT INTO service_line_interests (
  practice_member_id,
  service_line,
  interest_rank,
  current_experience_level,
  desired_involvement_pct
) VALUES (
  '3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e', -- Luke Tyrrell
  'Automation',
  1,
  2,
  30
);

-- Verify
SELECT * FROM service_line_interests;
```

## Rollback (If Needed)

```sql
DROP VIEW IF EXISTS service_line_coverage;
DROP TABLE IF EXISTS service_line_interests;
DROP FUNCTION IF EXISTS update_service_line_interests_updated_at();
```

## Next Steps

1. **Apply migration** to production database
2. **Test** with one team member (e.g., Luke Tyrrell)
3. **Verify** rankings save and load correctly
4. **Deploy** to all team members
5. **Monitor** for strategic planning insights

## Support

If you encounter issues:
1. Check Supabase logs for detailed error messages
2. Verify you have admin permissions
3. Ensure RLS policies are correct for your user roles
4. Check that practice_members table has correct user_id mappings

---

**Last Updated:** October 20, 2025  
**Version:** 1.0  
**Status:** Ready for production deployment

