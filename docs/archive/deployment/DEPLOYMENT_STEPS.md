# Workflow System - Deployment Steps

## ⚠️ Important: Complete These Steps in Order

---

## Step 1: Run Database Migration

### Option A: Supabase CLI (Recommended)
```bash
# Navigate to project
cd torsor-practice-platform

# Run migration
supabase db push

# Generate TypeScript types (CRITICAL!)
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

### Option B: Supabase Dashboard
1. Go to https://supabase.com
2. Open your project
3. Navigate to SQL Editor
4. Copy contents of `supabase/migrations/20251004_create_workflow_tables.sql`
5. Paste and run
6. Wait for success message

---

## Step 2: Regenerate TypeScript Types

**This fixes all the linter errors!**

### Method 1: Supabase CLI
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

### Method 2: Manual (if CLI not available)
1. The types in `src/lib/supabase/types.ts` are already correct
2. Just need to wait for Supabase to propagate changes
3. Or restart your dev server

---

## Step 3: Set Environment Variables

Create/update `.env` file:

```bash
# Supabase (already configured)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# OpenRouter API Key (REQUIRED)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Optional
VITE_API_URL=https://your-api.com
VITE_APP_NAME=TORSOR
```

### Get OpenRouter API Key:
1. Go to https://openrouter.ai
2. Sign up / Log in
3. Navigate to "Keys" section
4. Create new key
5. Copy and add to `.env`

---

## Step 4: Install Dependencies (if needed)

```bash
npm install
# or
yarn install
```

---

## Step 5: Restart Development Server

```bash
# Stop current server (Ctrl+C)

# Start fresh
npm run dev
# or
yarn dev
```

---

## Step 6: Verify Everything Works

### Test 1: Database Connection
1. Navigate to Advisory Services page
2. Click any service card
3. Should load Service Detail Page without errors

### Test 2: Template Loading
1. Click "Load Template" button
2. Should create workflow successfully
3. Check browser console for errors

### Test 3: Workflow Execution
1. Click "Run Workflow" on any workflow
2. Enter test data
3. Click "Execute Workflow"
4. Should complete successfully

---

## 🐛 Fixing Linter Errors

### If you see TypeScript errors about types:

**Option 1: Regenerate types (best)**
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

**Option 2: Restart TypeScript server**
- VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
- Cursor: Same command

**Option 3: Wait and rebuild**
```bash
npm run build
```

---

## 📋 Post-Deployment Checklist

- [ ] Database migration completed successfully
- [ ] TypeScript types regenerated
- [ ] OpenRouter API key configured
- [ ] Dev server restarted
- [ ] Test workflow creation works
- [ ] Test template loading works
- [ ] Test workflow execution works
- [ ] No console errors
- [ ] Linter errors resolved

---

## 🚨 Common Issues

### Issue: "workflows table does not exist"
**Solution:** Run the database migration (Step 1)

### Issue: TypeScript errors about "never" type
**Solution:** Regenerate Supabase types (Step 2)

### Issue: "OpenRouter API key not configured"
**Solution:** Add API key to .env file (Step 3)

### Issue: Workflow execution fails immediately
**Solution:** Check browser console for specific error

---

## ✅ Success Indicators

You'll know everything is working when:
1. ✅ No red squiggly lines in code editor
2. ✅ No console errors in browser
3. ✅ Workflows create successfully
4. ✅ Templates load correctly
5. ✅ Workflows execute and complete
6. ✅ Execution history shows results

---

## 🚀 You're Ready!

Once all steps are complete and tests pass, the system is **production-ready**.

Start by loading templates and running test workflows with sample data.

---

**Need Help?**
- Check WORKFLOW_SYSTEM_GUIDE.md for detailed documentation
- Review SESSION_SUMMARY_WORKFLOW_SYSTEM_OCT_4_2025.md for overview
- Check browser console for specific errors
- Verify Supabase connection in dashboard

**Good luck! 🎉**

