# 🤖 Give Cursor AI Direct Supabase Access

This guide shows how to give Cursor AI the ability to execute SQL queries directly on your Supabase database in real-time.

---

## ⚠️ **Security Considerations**

**What you're giving access to:**
- ✅ Read/write access to your Supabase database
- ✅ Ability to run SQL queries automatically
- ⚠️ Service Role Key bypasses Row Level Security (RLS)

**Risks:**
- If Cursor AI makes a mistake, it could modify/delete data
- The Service Role Key is powerful (like a root password)

**Mitigations:**
- Always review the SQL before Cursor runs it
- You can revoke access at any time by rotating the Service Role Key
- Cursor shows you every command before running it
- All actions are logged in chat history

---

## 🔧 **Setup Method 1: Environment Variables (RECOMMENDED)**

### Step 1: Create `.env.local` file
This file will **NOT** be committed to Git (it's in `.gitignore`).

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform
touch .env.supabase
```

### Step 2: Add your Supabase credentials
Open `.env.supabase` and add:

```bash
SUPABASE_URL=https://nwmzegonnmqzflamcxfd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_REF=nwmzegonnmqzflamcxfd
```

**Where to find these:**
1. Go to Supabase Dashboard → Your Project → Settings → API
2. Copy:
   - **URL**: `https://nwmzegonnmqzflamcxfd.supabase.co`
   - **service_role key** (NOT anon key!)
   - **Project Ref**: `nwmzegonnmqzflamcxfd`

### Step 3: Add to `.gitignore`
Make sure this line exists in `.gitignore`:
```
.env.supabase
```

### Step 4: Tell Cursor
Just say in chat:
> "I've added `.env.supabase` with my Supabase credentials. You can now run SQL queries directly."

---

## 🚀 **Setup Method 2: Supabase CLI (ALTERNATIVE)**

### Step 1: Install Supabase CLI
```bash
brew install supabase/tap/supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link to your project
```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform
supabase link --project-ref nwmzegonnmqzflamcxfd
```

### Step 4: Tell Cursor
> "Supabase CLI is installed and linked. You can use it to run queries."

---

## 📝 **How Cursor Will Use It**

Once set up, Cursor can:

### Execute SQL Directly:
```bash
# Using Node.js script
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
await client.rpc('exec_sql', { query: 'SELECT * FROM practice_members' });
"
```

### Or using Supabase CLI:
```bash
supabase db execute --file DELETE_DUPLICATE_SAFE.sql
```

---

## ✅ **What You'll See**

When Cursor needs to run SQL, you'll see:
1. 🔍 **Proposed SQL query** in chat
2. 💬 Explanation of what it does
3. ⚡ **Command proposal** asking for your approval
4. ✅ You approve or reject
5. 📊 Results displayed in chat

---

## 🛡️ **Safety Features**

1. **You approve every query** - Cursor can't run anything without your permission
2. **Read-only mode available** - Cursor can ask for read-only credentials
3. **Query review** - Every SQL statement is shown to you first
4. **Rollback possible** - For most operations, Cursor can write rollback scripts

---

## 🎯 **Recommended Approach**

**For you (James):**
Use **Method 1** (Environment Variables):
- ✅ Simplest setup (just create one file)
- ✅ Most secure (file never leaves your machine)
- ✅ Easy to revoke (just delete the file)
- ✅ Works with your existing setup

---

## 📋 **Quick Setup (Copy-Paste)**

Run these commands:
```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform

# Create credentials file
cat > .env.supabase << 'EOF'
SUPABASE_URL=https://nwmzegonnmqzflamcxfd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_KEY_HERE
SUPABASE_PROJECT_REF=nwmzegonnmqzflamcxfd
EOF

# Add to gitignore if not already there
echo ".env.supabase" >> .gitignore

# Verify it won't be committed
git check-ignore .env.supabase
```

Then tell Cursor:
> "✅ Supabase credentials added to `.env.supabase`. You have direct access now."

---

## 🔄 **How to Revoke Access**

If you ever want to revoke Cursor's access:

### Option 1: Delete the file
```bash
rm /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform/.env.supabase
```

### Option 2: Rotate Service Role Key
1. Go to Supabase Dashboard → Settings → API
2. Click "Generate new service_role key"
3. Update Railway with new key
4. Old key (that Cursor has) is now invalid

---

## ❓ **FAQ**

**Q: Can Cursor see my Service Role Key?**
A: Only if you put it in `.env.supabase`. It stays on your local machine.

**Q: What if Cursor makes a mistake?**
A: You approve every query before it runs. If something goes wrong, Cursor can help you rollback.

**Q: Is this safe?**
A: As safe as you using Supabase directly. You control what Cursor can run.

**Q: Can I give read-only access?**
A: Yes! Create a read-only Postgres role in Supabase and give Cursor those credentials instead.

---

## 🎉 **Benefits**

Once set up:
- ✅ Cursor fixes database issues **instantly** (with your approval)
- ✅ No more copy-paste SQL scripts
- ✅ Cursor can diagnose schema issues in real-time
- ✅ Automatic rollback scripts for risky operations
- ✅ Faster debugging and development

---

Ready to set this up? Just:
1. Create `.env.supabase` with your credentials
2. Tell me "You have Supabase access now"
3. I'll test the connection and we're good to go! 🚀

