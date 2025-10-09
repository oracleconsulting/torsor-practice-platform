# 🚀 TORSOR Skills Portal - Complete Setup Guide
## 110-Skill RPGCC Matrix Implementation

This guide will get your skills assessment system fully operational for Monday launch.

**Note:** The framework contains **110 skills** (15+12+10+15+10+10+8+10+8+12), not 105 as initially titled.

---

## 📋 Database Setup - Run These 4 SQL Scripts in Order

### **Step 1: Fix `practice_members` Table**
**Purpose:** Allows creating team members without user accounts (for assessment-first flow)

**File:** Run in Supabase SQL Editor

```sql
-- Add missing columns to practice_members
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Make user_id optional
ALTER TABLE practice_members
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: must have either user_id OR email
ALTER TABLE practice_members
DROP CONSTRAINT IF EXISTS practice_members_identity_check;

ALTER TABLE practice_members
ADD CONSTRAINT practice_members_identity_check
CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_members_email ON practice_members(email);
CREATE INDEX IF NOT EXISTS idx_practice_members_user_id ON practice_members(user_id);

-- Update unique constraints
DROP INDEX IF EXISTS practice_members_user_id_practice_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS practice_members_user_practice_unique
ON practice_members(user_id, practice_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS practice_members_email_practice_unique
ON practice_members(email, practice_id)
WHERE user_id IS NULL AND email IS NOT NULL;
```

**Expected Output:** ✅ "ALTER TABLE" messages confirming each change

---

### **Step 2: Fix `skill_assessments` Table**
**Purpose:** Adds missing timestamp columns required by backend

**File:** Run in Supabase SQL Editor

```sql
-- Add missing timestamp columns
ALTER TABLE skill_assessments
ADD COLUMN IF NOT EXISTS assessed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing records (if any)
UPDATE skill_assessments
SET assessed_at = COALESCE(created_at, NOW())
WHERE assessed_at IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_skill_assessments_assessed_at ON skill_assessments(assessed_at);

-- Verify structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'skill_assessments'
AND column_name IN ('assessed_at', 'created_at', 'updated_at', 'team_member_id', 'skill_id', 'current_level', 'interest_level', 'notes')
ORDER BY column_name;
```

**Expected Output:** ✅ Table showing all required columns exist

---

### **Step 3: Load 110-Skill Matrix**
**Purpose:** Replace existing skills with new comprehensive 110-skill framework

**File:** Copy entire contents of `supabase/migrations/20251009_rpgcc_105_skills_complete.sql`

This script:
- Clears existing skills (TRUNCATE skills CASCADE)
- Loads all 110 skills with full descriptions
- Organized into 10 categories:
  - Technical Accounting Fundamentals (15)
  - Cloud Accounting & Automation (12)
  - Management Accounting & Reporting (10)
  - Advisory & Consulting (15)
  - Digital & AI Capabilities (10)
  - Tax & Compliance - UK Focus (10)
  - Sector & Industry Knowledge (8)
  - Client Management & Development (10)
  - Leadership & Team Skills (8)
  - Communication & Soft Skills (12)

**Expected Output:** 
```
✅ SUCCESS: 110 skills loaded correctly
   - 15 Technical Accounting Fundamentals
   - 12 Cloud Accounting & Automation
   - 10 Management Accounting & Reporting
   - 15 Advisory & Consulting
   - 10 Digital & AI Capabilities
   - 10 Tax & Compliance - UK Focus
   -  8 Sector & Industry Knowledge
   - 10 Client Management & Development
   -  8 Leadership & Team Skills
   - 12 Communication & Soft Skills

🎯 Total: 110 skills (15+12+10+15+10+10+8+10+8+12)
```

---

### **Step 4: Add `assessment_data` Column to Invitations**
**Purpose:** Stores JSON assessment data on invitation record

**File:** Run in Supabase SQL Editor

```sql
-- Add assessment_data column to invitations table
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS assessment_data JSONB DEFAULT NULL;

-- Create index for JSON queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_invitations_assessment_data 
ON invitations USING gin(assessment_data);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND column_name = 'assessment_data';
```

**Expected Output:** ✅ Shows `assessment_data` column as `jsonb` type

---

## 🔍 Verification Queries

After running all 4 scripts, verify everything is set up correctly:

```sql
-- 1. Check practice_members structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'practice_members' 
AND column_name IN ('user_id', 'email', 'name', 'created_at', 'updated_at')
ORDER BY column_name;

-- 2. Check skill_assessments structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'skill_assessments'
AND column_name IN ('assessed_at', 'created_at', 'updated_at')
ORDER BY column_name;

-- 3. Verify skills loaded
SELECT 
  category,
  COUNT(*) as skill_count
FROM skills
GROUP BY category
ORDER BY category;

-- Should show:
-- Advisory & Consulting: 15
-- Client Management & Development: 10
-- Cloud Accounting & Automation: 12
-- Communication & Soft Skills: 12
-- Digital & AI Capabilities: 10
-- Leadership & Team Skills: 8
-- Management Accounting & Reporting: 10
-- Sector & Industry Knowledge: 8
-- Tax & Compliance - UK Focus: 10
-- Technical Accounting Fundamentals: 15
-- TOTAL: 110

-- 4. Check invitations table
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND column_name IN ('assessment_data', 'invite_code', 'email', 'name', 'status')
ORDER BY column_name;
```

---

## 🧪 Testing the Complete Flow

### 1. Wait for Railway Deployment
After SQL setup, Railway needs to detect changes and redeploy:
- Check Railway dashboard for deployment status
- Should complete in 1-2 minutes
- Look for "✅ Deployed" status

### 2. Create Test Invitation
1. Log into TORSOR Dashboard
2. Navigate to **Team Invitations**
3. Click **Create Invitation**
4. Fill in:
   - Email: (your test email)
   - Name: Test User
   - Role: Team Member
5. Click **Send Invitation**

### 3. Complete Assessment
1. Open invitation email (or copy link from dashboard)
2. Click invitation link
3. You should see:
   - ✅ "Skills Assessment" header
   - ✅ "Welcome, [Your Name]!"
   - ✅ "Category 1 of 10: Technical Accounting Fundamentals"
   - ✅ "Loaded 110 skills in 10 categories" (check console)

4. Complete at least one skill:
   - Select a skill level (1-5)
   - Rate your interest (1-5 stars)
   - Optionally add notes

5. Click **Next Category** repeatedly or skip to **Complete Assessment**

### 4. Verify Dashboard Shows Data
1. Go back to TORSOR Dashboard
2. Navigate to **Skills Matrix**
3. You should see:
   - ✅ Test user appears in team members list
   - ✅ Skills data populated in matrix
   - ✅ Heatmap shows color-coded skill levels
   - ✅ Assessment date displayed

### 5. Check Console Logs
During submission, you should see:
```
📋 Fetching invitation details...
✅ Invitation found: [email] Practice ID: [uuid]
👤 Creating/finding practice member...
✅ Practice member created: [uuid]
📊 Creating skill assessments...
✅ Skill assessments created successfully
📝 Updating invitation status...
🎉 Assessment submission complete for: [email]
   - Practice Member ID: [uuid]
   - Skill Assessments: [number]
```

---

## ❌ Troubleshooting Common Issues

### Issue 1: "Column 'email' does not exist"
**Solution:** Run Step 1 (practice_members fix) again

### Issue 2: "Column 'assessed_at' does not exist"
**Solution:** Run Step 2 (skill_assessments fix) again

### Issue 3: "Loaded 0 skills in 0 categories"
**Solution:** Run Step 3 (110-skill matrix) again

### Issue 4: "Failed to create skill assessments"
**Check:** 
- Is `SUPABASE_SERVICE_ROLE_KEY` set in Railway environment variables?
- Has Railway finished deploying?
- Run verification queries to confirm table structure

### Issue 5: Skills show but submission fails
**Check console for specific error:**
- If RLS error: Service role key not configured
- If column error: Missing database columns
- If timeout: Railway service might be down

---

## 🎯 What Success Looks Like

### ✅ Database Setup Complete
- All 4 SQL scripts run without errors
- Verification queries return expected results
- 110 skills visible in Supabase `skills` table

### ✅ Application Deployed
- Railway shows "Deployed" status
- No errors in Railway logs
- Application loads correctly in browser

### ✅ Assessment Flow Working
- Invitation email sent successfully
- Assessment page displays all 110 skills
- Progress bar shows category navigation
- Submission completes without errors

### ✅ Dashboard Populated
- Team member appears in Skills Matrix
- Assessment data visible in heatmap
- All skill ratings displayed correctly
- Export and reporting features functional

---

## 🚀 Monday Launch Checklist

- [ ] All 4 SQL scripts run in Supabase
- [ ] Railway deployment completed successfully
- [ ] Test assessment completed end-to-end
- [ ] Dashboard displaying data correctly
- [ ] Invitation emails sending via Resend
- [ ] Team members trained on invitation process
- [ ] Backup plan if issues arise
- [ ] Support contact info shared with team

---

## 📞 Support

If you encounter issues during setup:
1. Check Railway logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Confirm Supabase RLS policies are active
5. Test with a different browser/incognito mode

Good luck with Monday's launch! 🎉

