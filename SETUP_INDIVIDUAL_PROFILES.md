# 🚀 SETUP INSTRUCTIONS - Individual Profiles

## ✅ What You Need to Do

### **Step 1: Run the SQL Migration**

1. Go to your **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy the contents of this file:
   ```
   torsor-practice-platform/supabase/migrations/20251104_role_definitions_system.sql
   ```
6. Paste it into the SQL Editor
7. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

**What this does:**
- Creates 4 new tables
- Seeds 5 default roles
- Sets up indexes and policies

### **Step 2: Access the New Tabs**

Once the migration is complete:

1. Navigate to **Team Management** in your app
2. Scroll through the tabs - you'll see two new ones:
   - **INDIVIDUAL PROFILES** (with UserCircle icon) [NEW badge]
   - **ROLE DEFINITIONS** (with Briefcase icon) [NEW badge]

### **Step 3: Try It Out**

#### **Option A: View Individual Profiles First**
1. Click **"INDIVIDUAL PROFILES"** tab
2. Profiles will auto-calculate on first load (takes ~30-60 seconds)
3. Click any team member to expand their full profile
4. See their:
   - Role suitability scores
   - Top strengths
   - Development areas
   - Training priorities
   - Career trajectory
   - Recommended roles

#### **Option B: Customize Roles First**
1. Click **"ROLE DEFINITIONS"** tab
2. You'll see 5 default roles pre-configured:
   - Audit Junior
   - Audit Senior
   - Audit Manager
   - Tax Advisor
   - Corporate Finance Analyst
3. Click **"Edit"** on any role to customize
4. Or click **"Create Role"** to add new ones

---

## 🔧 Troubleshooting

### **"Relation does not exist" error**
- Migration hasn't run yet
- Go to Supabase SQL Editor and run the migration

### **"No profiles showing"**
- Profiles auto-calculate on first load
- Wait 30-60 seconds for calculation
- Check that team members have completed assessments
- Click "Refresh All" button

### **"Tabs not appearing"**
- Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
- Hard refresh the page
- Check browser console for errors

---

## 📍 Where Everything Is

### **In Your App:**
```
Team Management
  └─ INDIVIDUAL PROFILES tab (14th tab)
  └─ ROLE DEFINITIONS tab (15th tab)
```

### **In Your Codebase:**
```
torsor-practice-platform/
  ├─ supabase/migrations/
  │   └─ 20251104_role_definitions_system.sql  ← RUN THIS FIRST!
  │
  ├─ src/pages/accountancy/admin/
  │   ├─ IndividualAssessmentProfilesPage.tsx
  │   └─ RoleDefinitionsAdminPanel.tsx
  │
  └─ src/lib/api/assessment-insights/
      ├─ types.ts
      ├─ profile-calculator.ts
      └─ individual-profiles-api.ts
```

---

## 🎯 Quick Start Checklist

- [ ] Run SQL migration in Supabase
- [ ] Navigate to Team Management
- [ ] Find "INDIVIDUAL PROFILES" tab (has NEW badge)
- [ ] Find "ROLE DEFINITIONS" tab (has NEW badge)
- [ ] Click "INDIVIDUAL PROFILES" to see team profiles
- [ ] Click any member to expand their profile
- [ ] Click "ROLE DEFINITIONS" to manage roles
- [ ] Customize existing roles or create new ones

---

## 💡 What to Expect

### **Individual Profiles Tab:**
- Summary stats at top (4 cards)
- List of all team members (accordion view)
- Each member shows:
  - Quick stats (role match %, strengths, gaps)
  - Readiness badge (color-coded)
- Click to expand for full profile

### **Role Definitions Tab:**
- List of all defined roles
- Each role shows:
  - Title, category, seniority, department
  - Description
  - Key responsibilities
  - EQ requirements
  - Motivational requirements
  - Communication preferences
- Create, Edit, or Delete roles

---

## 🚀 You're All Set!

Once you run the migration, both tabs will be **fully functional** and ready to use!

**Navigation:**
```
Team Management → INDIVIDUAL PROFILES → View accordion of all team members
Team Management → ROLE DEFINITIONS → Manage role requirements
```

---

**Created:** November 4, 2025
**Status:** ✅ Ready to Deploy
**Migration:** `20251104_role_definitions_system.sql`

