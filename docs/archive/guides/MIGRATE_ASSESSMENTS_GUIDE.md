# Migration Guide: Copy Assessment Data from Invitations to Skill Assessments

## Problem
Assessment data is stored in `invitations.assessment_data` but not in the `skill_assessments` table where the portal reads from. This causes:
- Skills showing as 0/111 for James, Tanya, and Rizwan
- Empty skills heatmaps despite completed assessments

## Solution
Run the migration script to copy all assessment data from invitations to skill_assessments.

## Steps

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy the contents of `supabase/migrations/20251021_migrate_invitation_assessments.sql`
5. Paste into the SQL editor
6. Click **"Run"**
7. You should see output like:
   ```
   Processing invitation for: James Howard (jhoward@rpgcc.co.uk)
   Found existing practice_member with ID: xxx
   Inserting 111 skill assessments...
   ✅ Completed migration for jhoward@rpgcc.co.uk
   
   Processing invitation for: Tanya Okorji (TOkorji@rpgcc.co.uk)
   ...
   ```

### Option 2: Via Supabase CLI
```bash
cd torsor-practice-platform
supabase db push --file supabase/migrations/20251021_migrate_invitation_assessments.sql
```

### Option 3: Via psql (Direct Connection)
```bash
psql "your-supabase-connection-string" < supabase/migrations/20251021_migrate_invitation_assessments.sql
```

## What This Does

1. **Finds all accepted invitations** with assessment data
2. **Creates or finds practice_member** records for each person
3. **Deletes old assessments** (if any) to avoid duplicates
4. **Inserts all skill assessments** from the invitation data
5. **Verifies** by showing a count of skills per person

## Expected Results

After running the migration, you should see:
- James Howard: 111 skills
- Tanya Okorji: 111 skills
- Rizwan Paderwala: 111 skills
- All other team members with their respective skill counts

## Verification

After running the migration, refresh your portal and:
1. Go to the Skills Dashboard
2. You should see your "Skills Assessed: 111/111"
3. Go to Skills Heatmap - you should see all your colored squares
4. Check Tanya and Rizwan's profiles - they should also show 111 skills

## Troubleshooting

If you still see 0/111 after the migration:
1. Check the SQL output for any errors
2. Verify the `practice_id` matches: `a1b2c3d4-5678-90ab-cdef-123456789abc`
3. Clear your browser cache and hard refresh (Cmd+Shift+R)
4. Check the verification query at the end of the migration script

## Safety

This migration is safe to run multiple times because:
- It uses `ON CONFLICT ... DO UPDATE` to handle duplicates
- It only processes accepted invitations
- It deletes old data before inserting new data for each member

