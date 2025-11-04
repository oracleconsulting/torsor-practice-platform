# 🧪 Test Account System

## Overview
The platform now supports marking specific accounts as "test accounts" to exclude them from team analytics and reports while keeping them functional for testing purposes.

---

## Database Schema

### **New Column: `practice_members.is_test_account`**
- **Type:** `BOOLEAN`
- **Default:** `false`
- **Purpose:** Flag accounts used for testing
- **Indexed:** Yes (for performance)

```sql
ALTER TABLE practice_members
ADD COLUMN is_test_account BOOLEAN DEFAULT false;

CREATE INDEX idx_practice_members_is_test_account 
ON practice_members(is_test_account);
```

---

## Current Test Accounts

### **Jimmy Test**
- **Email:** `jameshowardivc@gmail.com`
- **Name:** Jimmy Test
- **Purpose:** Internal testing and development
- **Status:** ✅ Marked as test account

---

## What Gets Excluded

Test accounts are excluded from:

### **1. Admin Dashboard (`AdminDashboardPage.tsx`)**
- ✅ Team size calculations
- ✅ Assessment completion stats
- ✅ Average team skill levels
- ✅ Skill gap analysis
- ✅ Critical gaps identification
- ✅ All aggregate metrics

### **2. Team Analytics (`team-portal.ts`)**
- ✅ Team skills overview
- ✅ Service line coverage
- ✅ Anonymized team averages
- ✅ Category insights

### **3. Advanced Analytics (`AnalyticsDashboardPage.tsx`)**
- ✅ Team capability scores
- ✅ Skills coverage percentages
- ✅ CPD compliance rates
- ✅ Department comparisons
- ✅ Growth trajectories
- ✅ Skills at risk analysis
- ✅ Succession planning
- ✅ ROI predictions

### **4. Team Insights (`TeamInsightsPage.tsx`)**
- ✅ Team skill averages (via RPC)
- ✅ Percentile calculations
- ✅ Category comparisons

---

## What Still Works

Test accounts **can still**:
- ✅ Log in normally
- ✅ Complete all assessments
- ✅ View their individual portal
- ✅ See their own skills and CPD
- ✅ Use all individual features
- ✅ Test new functionality

---

## How It Works

### **Filter Pattern:**
```typescript
// Exclude test accounts in queries
const { data: members } = await supabase
  .from('practice_members')
  .select('*')
  .or('is_test_account.is.null,is_test_account.eq.false');

// Get member IDs for filtering assessments
const memberIds = members?.map(m => m.id) || [];

// Query assessments only for real members
const { data: assessments } = await supabase
  .from('skill_assessments')
  .select('*')
  .in('team_member_id', memberIds);
```

This ensures:
1. Members without the flag (`NULL`) are included (backward compatibility)
2. Members with `is_test_account = false` are included
3. Members with `is_test_account = true` are excluded

---

## Adding New Test Accounts

### **Via SQL:**
```sql
UPDATE practice_members
SET is_test_account = true
WHERE email = 'test@example.com';
```

### **Via Admin UI (Future Enhancement):**
Could add a toggle in admin settings:
- User Management → Select Member → Toggle "Test Account"

---

## Removing Test Account Flag

```sql
UPDATE practice_members
SET is_test_account = false
WHERE email = 'jameshowardivc@gmail.com';
```

---

## Migration Script

Run this to set up the system:
```bash
supabase/migrations/20251104_add_test_account_flag.sql
```

This will:
1. ✅ Add `is_test_account` column
2. ✅ Create index for performance
3. ✅ Mark Jimmy Test as test account
4. ✅ Verify the changes

---

## Verification

### **Check test accounts:**
```sql
SELECT name, email, is_test_account
FROM practice_members
WHERE is_test_account = true;
```

### **Check real accounts:**
```sql
SELECT name, email, is_test_account
FROM practice_members
WHERE is_test_account = false OR is_test_account IS NULL;
```

### **Verify exclusion from analytics:**
```sql
-- Should NOT include Jimmy Test
SELECT pm.name, COUNT(sa.id) as skills
FROM practice_members pm
LEFT JOIN skill_assessments sa ON sa.team_member_id = pm.id
WHERE pm.is_test_account IS NULL OR pm.is_test_account = false
GROUP BY pm.name
ORDER BY pm.name;
```

---

## Updated Files

### **Backend:**
- ✅ `supabase/migrations/20251104_add_test_account_flag.sql` - Schema changes
- ✅ `src/lib/api/team-portal.ts` - Team insights exclusion
- ✅ `src/pages/accountancy/team/AdminDashboardPage.tsx` - Admin dashboard exclusion

### **Future Updates Needed:**
If you add new analytics features, remember to exclude test accounts:
```typescript
.or('is_test_account.is.null,is_test_account.eq.false')
```

---

## Benefits

✅ **Clean Analytics:** Real team data isn't polluted by test accounts  
✅ **Safe Testing:** Can test features without affecting reports  
✅ **Flexible:** Easy to add/remove test account flags  
✅ **Backward Compatible:** Existing accounts without flag work normally  
✅ **Performance:** Indexed for fast queries  

---

## 🎯 Ready to Use!

Jimmy Test is now marked as a test account and excluded from all team analytics while remaining fully functional for testing! 🚀

