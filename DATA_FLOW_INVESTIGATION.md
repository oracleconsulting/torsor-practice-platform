# 🔍 Data Flow Investigation - Advisory Skills Page

**Date:** October 10, 2025  
**Status:** 🔄 In Progress

---

## 🐛 Reported Issues

1. **Skills Matrix Heatmap**: Not showing any data + requires excessive scrolling
2. **Gap Analysis**: Confusing visualization, doesn't make sense
3. **Development Planning**: Team members have disappeared
4. **Skills Analysis**: No skills showing at all
5. **Root Cause**: Data flow issue between frontend and Supabase

---

## 📊 Console Logs from Screenshots

From the browser console, we can see:
- ✅ `Found 111 skills in database` - Skills are loading correctly
- ❌ `No team members found - use Team Invitations to add your team` - **THIS IS THE PROBLEM**

**Expected:** Should find Luke Tyrrell and Jaanu Nana's assessments  
**Actual:** 0 team members found

---

## 🔧 Investigation Steps Taken

### 1. Added Comprehensive Logging (v1.0.9-debug)

Updated `AdvisorySkillsPage.tsx` to log:
- `🔍 Fetching skill assessments...`
- `📊 Assessments query result:` - Shows count, errors, and sample data
- `👥 Unique team member IDs` - Lists all member IDs found
- `📋 Practice members:` - Shows separate query results
- `👤 Building member:` - Details for each member being constructed

###2. Added Fallback Query

If the join `practice_member:team_member_id` fails, we now:
1. Still get the assessments
2. Separately fetch `practice_members` by ID
3. Merge the data manually

This will work even if Supabase foreign key relationships aren't configured.

---

## 🎯 Expected Debugging Output (After Deployment)

Once deployed, the console should show:

**If assessments exist but join fails:**
```
🔍 Fetching skill assessments...
📊 Assessments query result: { 
  count: 222, 
  error: null,
  sampleData: { team_member_id: "abc123", skill_id: "xyz789", current_level: 3 }
}
👥 Unique team member IDs: ["abc123", "def456"]
📋 Practice members: { count: 2, error: null, members: [{...}] }
👤 Building member: { memberId: "abc123", name: "Luke Tyrrell", role: "Member", hasData: true }
```

**If no assessments exist:**
```
🔍 Fetching skill assessments...
📊 Assessments query result: { count: 0, error: null, sampleData: undefined }
📭 No team members found - use Team Invitations to add your team
```

---

## 🔍 Possible Root Causes

### Theory 1: No Assessments in Database
- Luke and Jaanu completed assessments via the public portal
- But the data was saved to `survey_sessions` instead of `skill_assessments`
- **Solution**: Need to migrate data from `survey_sessions` to `skill_assessments`

### Theory 2: Foreign Key Relationship Missing
- `skill_assessments.team_member_id` doesn't have proper FK to `practice_members.id`
- The Supabase join `practice_member:team_member_id` fails silently
- **Solution**: Our fallback query should handle this

### Theory 3: RLS (Row Level Security) Blocking
- User doesn't have permission to see assessments
- RLS policy is too restrictive
- **Solution**: Check RLS policies on `skill_assessments` table

### Theory 4: Wrong Table Structure
- `team_member_id` column doesn't exist or has different name
- Table structure changed but code wasn't updated
- **Solution**: Verify actual table schema in Supabase

---

## 📝 Next Steps

1. **Wait for v1.0.9-debug deployment** (~2-3 minutes)
2. **Refresh Advisory Skills page**
3. **Check browser console** for new debug logs
4. **Analyze the output** to determine which theory is correct
5. **Apply targeted fix** based on findings

---

## 🎨 UI/UX Improvements (After Data Flow Fixed)

Once data is loading correctly, we'll address:

### Skills Matrix Heatmap
- Reduce vertical scrolling with collapsible categories
- Add sticky headers for member names
- Implement horizontal scrolling for wide matrices
- Add "Expand All" / "Collapse All" buttons

### Gap Analysis
- Replace scatter plot with clearer bar charts
- Add color-coded priority levels (red/amber/green)
- Show top 10 critical gaps in a list
- Add filtering by category and member

### Development Planning
- Ensure team member selector populates correctly
- Add "Create Plan" button (currently hidden)
- Pre-fill forms with assessment data

### Skills Analysis
- Ensure accordion expands with actual skill data
- Show member photos/avatars
- Add "Contact for mentoring" action buttons

---

## 🚀 Deployment Status

- **Commit**: `debug: Add comprehensive logging for data flow investigation`
- **Push**: Complete
- **GitHub Actions**: Running migrations
- **Railway**: Building and deploying
- **ETA**: 2-3 minutes

---

## 📊 Data Model Reference

**Expected Structure:**
```
practice_members
  ├─ id (UUID, PK)
  ├─ name (TEXT)
  ├─ email (TEXT)
  ├─ role (TEXT)
  └─ practice_id (UUID, FK)

skills
  ├─ id (UUID, PK)
  ├─ name (TEXT)
  ├─ category (TEXT)
  ├─ description (TEXT)
  └─ required_level (INT)

skill_assessments
  ├─ id (UUID, PK)
  ├─ team_member_id (UUID, FK → practice_members.id)
  ├─ skill_id (UUID, FK → skills.id)
  ├─ current_level (INT 0-5)
  ├─ interest_level (INT 0-5)
  ├─ assessed_at (TIMESTAMP)
  └─ assessment_type (TEXT)
```

---

## 💡 Key Insight

The console log "Found 111 skills" proves the database connection works fine. The issue is specifically with **loading assessments or joining to practice_members**. Once we see the debug output, we'll know exactly which step is failing.

