# CPD Admin Portal Integration

## Overview
The CPD tracking system now fully reconciles between **team member portals** and the **admin portal**, ensuring managers can monitor all staff CPD activity.

## Admin View Access

### Database View: `admin_cpd_overview`
This view provides a complete overview of all team member CPD progress.

**Columns Available:**
- `member_id` - Team member UUID
- `member_name` - Full name
- `role` - Job role/position
- `practice_id` - Practice identifier
- `hours_required` - Total annual hours required (from practice settings)
- `determined_required` - Practice-assigned hours target
- `self_allocated_required` - Personal learning hours target
- `hours_completed` - Total hours logged to date
- `determined_completed` - Practice-assigned hours completed
- `self_allocated_completed` - Personal hours completed
- `progress_percentage` - Completion percentage (0-100)
- `hours_remaining` - Hours still needed
- `activities_completed` - Count of completed CPD activities
- `last_cpd_date` - Date of most recent CPD activity
- `cpd_exempt` - Whether member is exempt from CPD requirements
- `cpd_notes` - Any special notes about member's CPD

### Example Admin Queries

**View all team CPD progress:**
```sql
SELECT 
  member_name,
  role,
  hours_completed,
  hours_required,
  progress_percentage,
  activities_completed,
  last_cpd_date
FROM admin_cpd_overview
ORDER BY progress_percentage DESC;
```

**Find team members behind on CPD:**
```sql
SELECT 
  member_name,
  role,
  hours_completed,
  hours_required,
  hours_remaining,
  last_cpd_date
FROM admin_cpd_overview
WHERE progress_percentage < 50
  AND cpd_exempt = false
ORDER BY progress_percentage ASC;
```

**Get CPD summary statistics:**
```sql
SELECT 
  COUNT(*) as total_members,
  AVG(progress_percentage) as avg_progress,
  SUM(hours_completed) as total_hours_logged,
  SUM(activities_completed) as total_activities,
  COUNT(*) FILTER (WHERE progress_percentage >= 100) as members_complete
FROM admin_cpd_overview
WHERE cpd_exempt = false;
```

## Individual Member CPD Details

**View all CPD activities for a specific member:**
```sql
SELECT 
  ca.activity_date,
  ca.title,
  ca.type,
  ca.cpd_category,
  ca.hours_claimed,
  ca.status,
  ca.learnings_captured,
  ca.provider,
  ca.cost
FROM cpd_activities ca
JOIN practice_members pm ON ca.practice_member_id = pm.id
WHERE pm.name = 'Luke Tyrrell'
  AND ca.status = 'completed'
ORDER BY ca.activity_date DESC;
```

## Real-Time Updates

### Automatic Trigger
When a team member logs CPD:
1. ✅ `cpd_activities` table gets new row
2. ✅ **Trigger fires automatically** → `update_member_cpd_hours()`
3. ✅ `practice_members.cpd_completed_hours` updates
4. ✅ Admin view reflects new total **immediately**

### Data Flow
```
Team Member Portal
    ↓
  Logs CPD Activity
    ↓
cpd_activities INSERT
    ↓
Trigger: update_member_cpd_hours()
    ↓
practice_members UPDATE
    ↓
admin_cpd_overview (view refreshes automatically)
    ↓
Admin Portal sees updated data
```

## Admin Portal UI Integration

### Option 1: Direct Database Query (Temporary)
Until the admin UI is built, managers can query directly:
```sql
SELECT * FROM admin_cpd_overview;
```

### Option 2: API Endpoint (Recommended)
Create an API endpoint that returns the view data:

**Endpoint:** `GET /api/admin/cpd/overview`

**Response:**
```json
{
  "members": [
    {
      "member_id": "3b6a7b6a-6c8c-48e8-b32d-3ca3119da05e",
      "member_name": "Luke Tyrrell",
      "role": "Assistant Manager",
      "hours_completed": 2,
      "hours_required": 40,
      "progress_percentage": 5.0,
      "activities_completed": 1,
      "last_cpd_date": "2025-10-18"
    }
  ],
  "summary": {
    "total_members": 16,
    "avg_progress": 12.5,
    "total_hours_logged": 80,
    "members_on_track": 10,
    "members_behind": 6
  }
}
```

### Option 3: Admin UI Component (Future)
Create a React component in the admin portal:

**File:** `src/pages/accountancy/admin/TeamCPDDashboard.tsx`

**Features:**
- 📊 Table view of all team member CPD progress
- 🔍 Filter by role, progress status, date range
- 📈 Charts showing team CPD trends
- 🎯 Identify members needing support
- 📄 Export to CSV for reporting
- 🔔 Alerts for members falling behind

## Reconciliation Checks

### Verify Data Consistency
Run this to ensure all data matches:
```sql
SELECT * FROM recalculate_all_cpd_hours();
```

This returns any members where stored hours don't match calculated hours.

### Manual Recalculation
If needed, force a recalculation:
```sql
-- For all members
WITH member_totals AS (
  SELECT 
    practice_member_id,
    COALESCE(SUM(hours_claimed), 0) as total_hours
  FROM cpd_activities
  WHERE status = 'completed'
  GROUP BY practice_member_id
)
UPDATE practice_members pm
SET 
  cpd_completed_hours = COALESCE(mt.total_hours, 0),
  cpd_self_allocated_completed = COALESCE(mt.total_hours, 0)
FROM member_totals mt
WHERE pm.id = mt.practice_member_id;
```

## Reporting

### Monthly CPD Report
```sql
SELECT 
  member_name,
  role,
  hours_completed,
  hours_required,
  progress_percentage,
  activities_completed
FROM admin_cpd_overview
WHERE cpd_exempt = false
ORDER BY role, member_name;
```

### CPD Activity Breakdown by Type
```sql
SELECT 
  ca.type,
  COUNT(*) as activity_count,
  SUM(ca.hours_claimed) as total_hours,
  AVG(ca.hours_claimed) as avg_hours_per_activity
FROM cpd_activities ca
JOIN practice_members pm ON ca.practice_member_id = pm.id
WHERE ca.status = 'completed'
  AND pm.practice_id = 'your-practice-id'
GROUP BY ca.type
ORDER BY total_hours DESC;
```

## Next Steps

1. ✅ Run both database migrations
2. ✅ Verify data appears in `admin_cpd_overview`
3. 🔄 Build admin UI component (optional)
4. 🔄 Create API endpoint for admin access (optional)
5. 🔄 Add email alerts for CPD deadlines (future)

## Support

If admins can't see CPD data:
1. Check migrations ran successfully
2. Run `SELECT * FROM admin_cpd_overview;`
3. Run `SELECT * FROM recalculate_all_cpd_hours();` to diagnose
4. Check practice_members table has correct practice_id
5. Verify team members have active status

