# 🔐 Role-Based Permissions System

## 🎯 THE PROBLEM WE SOLVED

### **Original Issue:**
```
You: "can we assign 'admin privileges' to certain team members, like partners and 
directors, which should bypass the issue of using the same email for assessment 
AND admin oversight?"
```

**Why This Was Needed:**
- `jhoward@rpgcc.co.uk` needed to be BOTH:
  1. **A team member** (taking skills assessments)
  2. **An admin** (managing the team, viewing reports)
- The old system didn't allow this dual role
- You created `BSGBD@rpgcc.co.uk` as a workaround (not ideal!)

---

## ✅ THE SOLUTION: Role-Based Access Control (RBAC)

Instead of separate admin accounts, team members now have **permission roles** that grant different levels of access.

### **5 Permission Roles:**

| Role | Description | Access Level |
|------|-------------|--------------|
| **👤 Staff** | Standard team member | Assessment access only |
| **📊 Manager** | Team oversight | View team reports + all Staff permissions |
| **💼 Director** | Team management | Invite members, manage settings + all Manager permissions |
| **👑 Partner** | Full admin (safe) | Edit assessments, manage all data + all Director permissions |
| **🛡️ Admin** | Ultimate control | Delete data, billing, ownership + all Partner permissions |

---

## 🏗️ WHAT WAS CREATED

### **1. Database Schema**
```sql
-- Enum for roles
user_role: staff | manager | director | partner | admin

-- New columns on practice_members table
- permission_role (user_role)
- can_manage_team (boolean)
- can_invite_members (boolean)
- can_edit_assessments (boolean)
- can_delete_data (boolean)
```

### **2. Helper Functions**
- `has_permission(email, required_role)` - Check if user has permission
- `get_user_permissions(email)` - Get all permissions for a user
- `set_permissions_by_role()` - Auto-set flags when role changes (trigger)

### **3. Audit Trail**
- `role_changes_log` table - Track all role changes with timestamps, who changed it, and why

### **4. Convenient View**
- `v_team_permissions` - Easy-to-query view of all team member permissions

### **5. UI Component**
- `RoleManagement.tsx` - Beautiful admin interface to assign/change roles

---

## 🎨 HOW TO USE IT

### **For Admins:**

1. **Go to Admin Dashboard**
   - Navigate to: `Team Management` → `Admin Dashboard`

2. **Click "Role Management" Tab**
   - You'll see two tabs: "Dashboard" and "Role Management"
   - Click "Role Management"

3. **View Team Permissions**
   - See all team members with their current roles
   - Color-coded badges show permission levels
   - Quick view of what each member can do

4. **Change Someone's Role**
   - Click "Change Role" button next to their name
   - Select new role from dropdown
   - Add a reason (optional but recommended)
   - Click "Confirm Change"

5. **Audit Trail**
   - All changes are logged in `role_changes_log`
   - Track who changed what and when

---

## 📋 PERMISSION BREAKDOWN

### **What Each Role Can Do:**

#### **👤 STAFF**
- ✅ Complete own skills assessment
- ✅ View own skill profile
- ❌ View other team members
- ❌ Access admin features

#### **📊 MANAGER**
- ✅ All Staff permissions
- ✅ View team skills matrix
- ✅ View team analytics
- ✅ View development plans
- ❌ Edit anything
- ❌ Invite members

#### **💼 DIRECTOR**
- ✅ All Manager permissions
- ✅ Invite team members
- ✅ Manage team settings
- ✅ Create development plans
- ❌ Edit other's assessments
- ❌ Delete data

#### **👑 PARTNER**
- ✅ All Director permissions
- ✅ Edit any assessment
- ✅ Manage all team data
- ✅ View audit logs
- ✅ Configure system settings
- ❌ Delete practice data
- ❌ Transfer ownership

#### **🛡️ ADMIN**
- ✅ ALL Partner permissions
- ✅ Delete practice data
- ✅ Manage billing
- ✅ Transfer ownership
- ✅ **EVERYTHING**

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Database Migration:**
```sql
-- Applied: 20251011_role_permissions_v2.sql
✅ Created user_role enum
✅ Added permission columns to practice_members
✅ Created helper functions
✅ Set up auto-permission triggers
✅ Created audit log table
✅ Created v_team_permissions view
✅ Granted admin role to jhoward@rpgcc.co.uk
```

### **Frontend Components:**
```typescript
// New files created:
✅ src/components/accountancy/team/RoleManagement.tsx
   - Full UI for role management
   - Role definitions display
   - Team permissions table
   - Change role dialog
   - Audit trail integration

✅ src/pages/accountancy/team/AdminDashboardPage.tsx (modified)
   - Added tabs for Dashboard vs Role Management
   - Integrated RoleManagement component
```

---

## 🎉 BENEFITS

### **1. Clean Architecture**
- ✅ No more separate admin accounts
- ✅ One email can be both team member AND admin
- ✅ Follows industry best practices (RBAC)
- ✅ Scalable for future growth

### **2. Flexible Permissions**
- ✅ Granular control (staff → manager → director → partner → admin)
- ✅ Easy to adjust access levels
- ✅ Partners can help with admin tasks
- ✅ Directors can manage their departments

### **3. Audit & Compliance**
- ✅ Full audit trail of all role changes
- ✅ Know who changed what and when
- ✅ Reason tracking for changes
- ✅ Meets professional standards

### **4. User Experience**
- ✅ Beautiful, intuitive UI
- ✅ Clear role definitions
- ✅ Easy to understand permissions
- ✅ One-click role changes

---

## 🚀 CURRENT STATUS

### **James Howard (jhoward@rpgcc.co.uk)**
- ✅ **Role:** Admin
- ✅ **Status:** Full access granted
- ✅ **Can:** Do everything (admin + team member)
- ✅ **No longer need:** BSGBD@rpgcc.co.uk account

### **Next Steps:**
1. ✅ Sign in with `jhoward@rpgcc.co.uk`
2. ✅ Take your skills assessment (as a team member)
3. ✅ Access admin features (as an admin)
4. ✅ Assign roles to other partners/directors

---

## 📊 EXAMPLE USE CASES

### **Use Case 1: Making a Partner an Admin**
```
Scenario: Sarah is a partner and needs admin access
Solution:
1. Go to Role Management
2. Find Sarah's row
3. Click "Change Role"
4. Select "Partner"
5. Reason: "Partner promotion - needs full team visibility"
6. Confirm
Result: Sarah can now view all team data and manage settings!
```

### **Use Case 2: Director with Team Management**
```
Scenario: Mike is a director who manages advisory team
Solution:
1. Go to Role Management
2. Find Mike's row
3. Click "Change Role"
4. Select "Director"
5. Reason: "Advisory team lead - needs to invite and manage team"
6. Confirm
Result: Mike can invite new members and manage advisory team settings!
```

### **Use Case 3: Manager with View-Only Access**
```
Scenario: Emma is a manager who needs to see team reports
Solution:
1. Go to Role Management
2. Find Emma's row
3. Click "Change Role"
4. Select "Manager"
5. Reason: "Needs visibility for performance reviews"
6. Confirm
Result: Emma can view all team skills and reports (but not edit)!
```

---

## 🔍 VERIFICATION

### **Check Your Own Permissions:**
```sql
-- Run this in Supabase SQL editor:
SELECT * FROM get_user_permissions('jhoward@rpgcc.co.uk');

-- Should return:
-- role: admin
-- can_manage_team: true
-- can_invite_members: true
-- can_edit_assessments: true
-- can_delete_data: true
-- is_admin: true
```

### **View All Team Permissions:**
```sql
SELECT * FROM v_team_permissions ORDER BY permission_role, name;
```

---

## 📝 MIGRATION NOTES

### **What Happened:**
1. ✅ Created `user_role` enum type
2. ✅ Added `permission_role` column to `practice_members`
3. ✅ Added 4 boolean permission flags
4. ✅ Created helper functions for permission checks
5. ✅ Set up trigger to auto-set permissions based on role
6. ✅ Created `role_changes_log` audit table
7. ✅ Created `v_team_permissions` view
8. ✅ Granted admin role to `jhoward@rpgcc.co.uk`

### **Database Changes:**
```
practice_members table:
  + permission_role (user_role) DEFAULT 'staff'
  + can_manage_team (boolean) DEFAULT false
  + can_invite_members (boolean) DEFAULT false
  + can_edit_assessments (boolean) DEFAULT false
  + can_delete_data (boolean) DEFAULT false

New tables:
  + role_changes_log (audit trail)

New views:
  + v_team_permissions (convenient query)

New functions:
  + has_permission(email, role)
  + get_user_permissions(email)
  + set_permissions_by_role() [trigger]
```

---

## 🎯 FUTURE ENHANCEMENTS

### **Potential Additions:**
1. **Custom Roles** - Allow creating custom roles with specific permissions
2. **Time-Limited Permissions** - Temporary admin access that expires
3. **Department-Based Roles** - Different permissions per department
4. **Multi-Practice Roles** - Manage roles across multiple practices
5. **Permission Templates** - Predefined role templates for quick setup

---

## 🆘 TROUBLESHOOTING

### **Issue: Can't see Role Management tab**
**Solution:** You need to be logged in as an admin or partner.

### **Issue: Changes not taking effect**
**Solution:** Log out and log back in to refresh permissions.

### **Issue: Someone has wrong permissions**
**Solution:** Go to Role Management and verify their role assignment.

### **Issue: Need to revoke admin access**
**Solution:** Change their role back to Staff, Manager, or Director.

---

## 📞 SUMMARY

**Problem Solved:** ✅  
You no longer need separate admin accounts. Any team member can have admin privileges while still being able to take assessments.

**Current Setup:** ✅  
- `jhoward@rpgcc.co.uk` = Admin role (full access)
- No longer need `BSGBD@rpgcc.co.uk`
- Clean, professional architecture
- Easy to manage going forward

**Next Step:** 🚀  
Sign in with `jhoward@rpgcc.co.uk` and:
1. Take your skills assessment
2. Access admin features
3. Assign roles to other partners/directors

---

**Created:** Saturday, October 11, 2025  
**Status:** ✅ Deployed and Ready  
**Migration:** `20251011_role_permissions_v2.sql` (applied successfully)

