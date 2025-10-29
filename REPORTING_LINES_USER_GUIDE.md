# Reporting Lines Manager - User Guide

## ✅ COMPLETED FEATURES

### 1. **Skills Gap Bar Chart** (Gap Analysis)
- Top 20 skills displayed as horizontal bars
- **Red bars** = Current team average skill level
- **Orange bars** = Target team average skill level
- Sorted by gap size (largest gaps first)
- Clean white theme with black text
- Helps prioritize training investments

### 2. **Reporting Lines Manager** (Admin Portal)
A visual tool to manage your organizational structure without SQL!

#### Location:
`Admin Portal → Reporting Lines Tab`

#### Features:
- **Visual Organization**: All team members grouped by role (Partner, Director, Manager, etc.)
- **Dropdown Assignment**: Click any "Reports to" dropdown to assign a manager
- **Live Preview**: See changes immediately before saving
- **Bulk Save**: Make multiple changes, then "Save All Changes" at once
- **Clear Lines**: Remove reporting relationships with the trash icon
- **Validation**: Can't assign someone as their own manager
- **Summary Stats**: 
  - Total team members
  - Members with reporting lines
  - Active managers
  - Pending unsaved changes

#### How to Use:
1. Go to Admin Portal → **Reporting Lines** tab
2. Find a team member in the list
3. Click their "Reports to:" dropdown
4. Select their manager
5. Repeat for all team members
6. Click **"Save All Changes"** (green button at top)
7. ✅ Done! Changes immediately reflect in individual portals

#### What Happens After Saving:
- The assigned manager will see a **"Your Direct Reports"** panel in their dashboard
- They can select any direct report from a dropdown
- They'll see:
  - Skills assessed count
  - Average skill level
  - CPD hours logged
  - Compact skills heatmap (5 colored bars: Beginner → Expert)
  - Action buttons: "View Full Dashboard", "Suggest CPD", "Suggest Mentor"

### 3. **Direct Reports Panel** (Individual Portals)
Automatically appears for anyone who has direct reports assigned.

#### Features:
- **Dropdown selector** to choose which report to view
- **Quick stats** for the selected report
- **Mini heatmap** showing skill distribution
- **Action buttons** to view their dashboard, suggest CPD, or suggest mentoring
- **Team summary** when no specific report is selected

#### Example:
If you assign **Luke → Lambros, Jack** in the Reporting Lines tool:
- Luke's dashboard will show the "Your Direct Reports" panel
- He can select "Lambros" or "Jack" from the dropdown
- He'll see their skills, CPD progress, and can take actions

---

## 📋 TO MIRROR YOUR ORG CHART

Based on your BSG Organizational Chart, here's what you need to do:

### Step 1: Run the ADD_REPORTING_LINES.sql Script
This adds the `reports_to_id` column to your database (one-time setup).

**File**: `ADD_REPORTING_LINES.sql`

### Step 2: Use the Reporting Lines Manager
Go to Admin Portal → Reporting Lines tab and assign:

#### Partners:
- **Jeremy Tyrrell** → Jaanu, Sarah, Laura
- **Wes Mason** → James, Lynley

#### Manager:
- **Laura Pond** → Luke, Edward, Azalia

#### Assistant Managers:
- **Luke Tyrrell** → Lambros, Jack
- **Edward Gale** → Shari, Rizwan
- **Azalia Farman** → Tanya, Meyanthi

### Step 3: Save and Verify
1. Click "Save All Changes"
2. Go to Luke's portal → should see Direct Reports panel
3. Select "Lambros" or "Jack" → should see their stats

---

## 🎯 ARCHITECTURE: Single Source of Truth

All skill assessment data is stored in the **`invitations` table**.

### Key Rules:
- ✅ **Always query `invitations.assessment_data`** for skill levels
- ✅ **Use `.ilike()` for email matching** (case-insensitive)
- ✅ **No migrations or remappings** - data stays in `invitations`
- ✅ **`skills` table has NO `practice_id`** - it's global

### Why?
- Reliable, stable data source
- No outdated skill IDs
- No data synchronization issues
- Easy to maintain and debug

**Documentation**: See `SKILLS_DATA_ARCHITECTURE.md` for full details.

---

## 🚀 NEXT STEPS

1. **Run `ADD_REPORTING_LINES.sql`** to add the database column
2. **Go to Admin Portal → Reporting Lines**
3. **Assign all reporting lines** per your org chart
4. **Click "Save All Changes"**
5. **Test Luke's portal** to see Lambros and Jack

---

## 🐛 TROUBLESHOOTING

### "I don't see the Direct Reports panel"
- Check if you have any direct reports assigned in the Reporting Lines tool
- The panel only appears for users who have `reports_to_id` pointing to them

### "Changes aren't saving"
- Check browser console for errors
- Verify you have admin/partner role
- Try refreshing and saving again

### "Wrong people showing in reports"
- Verify the assignments in Admin Portal → Reporting Lines
- Click "Reset" if you made mistakes, then reassign correctly

---

## 📊 BENEFITS

✅ **No SQL scripting** for org changes
✅ **Visual, intuitive** interface
✅ **Instant updates** in individual portals
✅ **Future-proof** for promotions, new hires, restructuring
✅ **Excel org chart** can be exactly mirrored in the tool
✅ **Managers get oversight** without admin portal access

---

**All code deployed to main branch and ready to use!** 🎉

