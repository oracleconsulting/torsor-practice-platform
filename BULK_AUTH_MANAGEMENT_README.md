# Bulk Auth Account Management Scripts

## 🎯 Purpose

These scripts allow you to:
1. **Bulk create** auth accounts for all team members
2. **Bulk delete** auth accounts (cleanup old users)

Both use Supabase Management API (requires service role key).

---

## 📋 Files

- `bulk_create_auth_accounts.js` - Create auth accounts for all team members without user_id
- `bulk_delete_auth_accounts.js` - Delete auth accounts by email address
- `package.json` - Node.js dependencies

---

## 🚀 Setup (One-Time)

### 1. Install Dependencies

```bash
cd torsor-practice-platform
npm install @supabase/supabase-js dotenv
```

### 2. Get Your Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **`service_role`** key (NOT the `anon` key!)
5. ⚠️ **IMPORTANT**: Keep this secret! Never commit to git!

### 3. Create `.env` File

Create a file named `.env` in the `torsor-practice-platform` directory:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Add to `.gitignore`:**
```
.env
```

---

## 📦 Bulk Create Auth Accounts

### What It Does:
- Finds all team members in `practice_members` without `user_id`
- Creates Supabase auth account for each
- Links `user_id` back to `practice_members`
- Sets `password_change_required = true`
- Uses standard password: `TorsorTeam2025!`

### Configuration:

Edit `bulk_create_auth_accounts.js` lines 14-17:

```javascript
const SUPABASE_URL = 'https://nwmzegonrmqzflamcxfd.supabase.co';
const STANDARD_PASSWORD = 'TorsorTeam2025!';
const PRACTICE_ID = 'a1b2c3d4-5678-90ab-cdef-123456789abc'; // Your RPGCC ID
```

### Run:

```bash
node bulk_create_auth_accounts.js
```

### Output:

```
🚀 Starting bulk auth account creation...

📋 Step 1: Finding team members without auth accounts...
✅ Found 15 members without auth accounts:

   1. Luke Tyrrell (Ltyrrell@rpgcc.co.uk) - Assistant Manager
   2. Edward Gale (EGale@rpgcc.co.uk) - Assistant Manager
   ...

🔐 Step 2: Creating auth accounts...

   Creating account for Luke Tyrrell (Ltyrrell@rpgcc.co.uk)...
   ✅ Auth account created! user_id: abc123...
   ✅ Linked to practice_members

...

📊 SUMMARY
✅ Successfully created: 15
❌ Failed: 0

🎉 Bulk creation complete!
📧 Standard password for all users: TorsorTeam2025!
⚠️  All users are marked as password_change_required = true
```

---

## 🗑️ Bulk Delete Auth Accounts

### What It Does:
- Deletes Supabase auth accounts for specified emails
- Unlinks `user_id` from `practice_members` (sets to null)
- Useful for cleaning up test accounts

### Configuration:

Edit `bulk_delete_auth_accounts.js` line 20-23:

```javascript
const DELETE_EMAILS = [
  'james@ivcaccounting.co.uk',  // Old test account
  'testuser@example.com',
  // Add more emails here
];
```

### Run:

```bash
node bulk_delete_auth_accounts.js
```

### Output:

```
🗑️  Starting bulk auth account deletion...
⚠️  WARNING: This will permanently delete auth accounts!

📋 Emails to delete:
   1. james@ivcaccounting.co.uk

🔍 Looking up user: james@ivcaccounting.co.uk
   Found user_id: xyz789...
   ✅ Auth account deleted
   ✅ Unlinked from practice_members

📊 SUMMARY
✅ Successfully deleted: 1
⚠️  Not found: 0
❌ Failed: 0

🎉 Bulk deletion complete!
```

---

## ⚠️ Important Notes

### Security:
- **Service role key** has admin privileges
- Keep `.env` file secure
- Never commit service role key to git
- Add `.env` to `.gitignore`

### Permissions:
- Service role key bypasses Row Level Security (RLS)
- Can create/delete any user
- Use with caution in production

### Limitations:
- Supabase UI doesn't support bulk operations
- Must use Management API for bulk actions
- Requires Node.js environment

---

## 🎯 Recommended Workflow

### For Initial Setup (15 team members):

1. **Use bulk create script** (saves 30+ minutes vs manual):
   ```bash
   node bulk_create_auth_accounts.js
   ```

2. **Send credentials via User Management UI**:
   - Go to Skills Portal Admin → User Management
   - Click "Invite to Portal" for each user
   - Copy credentials and email

### For Cleanup (old test accounts):

1. **Add emails to delete array**:
   ```javascript
   const DELETE_EMAILS = [
     'olduser@example.com',
   ];
   ```

2. **Run delete script**:
   ```bash
   node bulk_delete_auth_accounts.js
   ```

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Check your `.env` file
- Make sure you're using **service_role** key, not **anon** key
- Verify the key is on a single line with no spaces

### Error: "User already exists"
- User already has an auth account
- Script will skip and continue with next user
- Check `user_id` in `practice_members` table

### Error: "Failed to link"
- Auth account was created but linking failed
- Manually run UPDATE query with the user_id
- Or delete auth account and try again

---

## 📚 Additional Resources

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [Service Role Key Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Node.js Supabase Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Questions? Check the inline comments in each script for more details!**

