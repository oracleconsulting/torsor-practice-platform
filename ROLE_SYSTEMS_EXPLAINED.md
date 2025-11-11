# 🎯 ROLE SYSTEMS EXPLAINED

## There Are TWO Different "Role" Systems:

### 1. **User Permission Roles** (in "Role Management")
**Location:** Admin Dashboard → Role Management tab

**Purpose:** Control who can access what features

**Roles:**
- Partner (full admin access)
- Director (can manage team + invite)
- Manager (can view team)
- Assistant Manager
- Senior  
- Junior

**These control:**
- Can they access admin features?
- Can they invite team members?
- Can they view analytics?
- etc.

---

### 2. **Job Role Definitions** (in "Role Definitions")
**Location:** Team Management → Role Definitions tab

**Purpose:** Define job requirements for skills/assessment matching

**Examples:**
- Audit Junior (entry-level auditor)
- Audit Senior (experienced auditor)
- Tax Advisor (tax specialist)
- Corporate Finance Analyst
- etc.

**These define:**
- Required EQ scores
- Required Belbin roles
- Required technical skills
- Communication style needs
- etc.

---

## Why Are They Different?

**Permission Roles** = **WHO CAN DO WHAT** in the portal  
**Job Role Definitions** = **WHAT SKILLS ARE NEEDED** for a specific job

**Example:**
- James is a **Director** (permission role) → can access admin features
- James might be assigned **Corporate Finance Analyst** (job role) → needs certain skills for that job

---

## Your Current Situation:

### Role Management (User Permissions):
✅ Partner  
✅ Director  
✅ Manager  
✅ Assistant Manager  
✅ Senior  
✅ Junior  

These are CORRECT and control portal access.

### Role Definitions (Job Requirements):
❌ "Audit Junior" (seeded role from migration)  
❌ 4 other seeded roles  

These need to be DELETED and replaced with YOUR custom job roles.

---

## What You Should Do:

### Option A: Delete All Seeded Roles & Start Fresh
Run `INVESTIGATE_AND_DELETE_ROLES.sql` in Supabase:

```sql
DELETE FROM role_definitions;
```

Then create YOUR custom job roles like:
- "Senior Auditor"
- "Tax Manager"
- "Advisory Consultant"
- etc.

### Option B: Keep Using Seeded Roles
If "Audit Junior" is fine for your practice, keep them and just add more as needed.

---

## Quick Comparison:

| Feature | Permission Roles | Job Role Definitions |
|---------|-----------------|---------------------|
| Controls portal access | ✅ | ❌ |
| Defines skill requirements | ❌ | ✅ |
| Used for assessment matching | ❌ | ✅ |
| Shown in "Role Management" | ✅ | ❌ |
| Shown in "Role Definitions" | ❌ | ✅ |
| Can be assigned to team members | Both can be assigned, but serve different purposes |

---

## TL;DR:

**Role Management** = Access control (who can do what in portal)  
**Role Definitions** = Job requirements (what skills are needed for a job)

They're SUPPOSED to be different!

If you want "Role Definitions" to match your team structure (Partner, Director, etc.), delete the seeded roles and create new ones with those titles.

