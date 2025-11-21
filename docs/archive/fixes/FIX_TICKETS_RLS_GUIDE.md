# 🔧 FIX: Tickets System RLS Error

## 🚨 Problem
Admin cannot reply to tickets. Error message:
```
Error sending reply: {
  code: '42501',
  message: 'new row violates row-level security policy for table "ticket_replies"'
}
```

## 🔍 Root Cause
The RLS policy for `ticket_replies` was checking `practices.owner_id = auth.uid()`, but:
1. The `practices` table **does not have an `owner_id` column**
2. Admin access is determined by **email whitelist** (`jhoward@rpgcc.co.uk`)

## ✅ Solution
Updated RLS policies to use email-based authentication instead of owner_id.

## 📋 How to Apply the Fix

### Step 1: Run the SQL Migration
1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `FIX_TICKETS_RLS.sql`
4. Click **Run** or press `Cmd+Enter`

### Step 2: Verify the Fix
After running the migration, you should see:
```
✅ Tickets RLS policies fixed!
✅ Admin (jhoward@rpgcc.co.uk) can now reply to all tickets
✅ Members can still view/create/reply to their own tickets
```

### Step 3: Test the Fix
1. Hard refresh the TORSOR platform (`Cmd+Shift+R`)
2. Navigate to Admin Dashboard → **Tickets** tab
3. Click on any ticket
4. Type a reply and click **Send Reply**
5. ✅ Reply should be sent successfully!

## 🔐 What Changed

### Before (BROKEN):
```sql
-- Tried to check practices.owner_id (column doesn't exist!)
CREATE POLICY "Admins can manage replies" ON ticket_replies
  FOR ALL
  USING (
    ticket_id IN (
      SELECT st.id FROM support_tickets st
      INNER JOIN practices ap ON st.practice_id = ap.id
      WHERE ap.owner_id = auth.uid()  -- ❌ practices.owner_id doesn't exist
    )
  );
```

### After (FIXED):
```sql
-- Uses email whitelist (matches Auth.tsx logic)
CREATE POLICY "Admins can manage replies" ON ticket_replies
  FOR ALL
  USING (
    -- Admin is jhoward@rpgcc.co.uk
    auth.jwt() ->> 'email' = 'jhoward@rpgcc.co.uk'  -- ✅ Correct!
  );
```

## 🎯 Why This Works
- The admin authentication in `src/pages/Auth.tsx` uses email whitelist:
  ```typescript
  const isJamesHoward = user.email === 'jhoward@rpgcc.co.uk';
  ```
- The RLS policies now match this authentication method
- All admin actions (view tickets, reply, update status) will work

## 📝 Files Updated
- `FIX_TICKETS_RLS.sql` - SQL migration to fix RLS policies
- `CREATE_TICKETS_SYSTEM.sql` - Original schema (kept for reference)

## ⚠️ Important Notes
1. This fix is **admin-specific** to `jhoward@rpgcc.co.uk`
2. Regular team members can still:
   - View their own tickets
   - Create new tickets
   - Reply to their own tickets
3. If you need to add more admins later, update the email check in:
   - `FIX_TICKETS_RLS.sql` (database policies)
   - `src/pages/Auth.tsx` (frontend routing)

---

**Ready to apply?** Run the SQL migration now! 🚀

