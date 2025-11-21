# 🚂 Railway Environment Variables - Step by Step

## 📍 **What You Need to Add**

Copy these 3 environment variables to Railway:

```bash
VITE_RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC
VITE_FROM_EMAIL=onboarding@resend.dev
VITE_FROM_NAME=RPGCC Team Portal
```

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Open Railway Dashboard**

1. Go to: https://railway.app
2. Click "Login" (if not logged in)
3. Find your project: **`torsor-practice-platform`**

### **Step 2: Navigate to Variables**

1. Click on your project card
2. Look for the **"Variables"** tab at the top
3. Click "Variables"

You should see a list of existing environment variables (like `SUPABASE_URL`, etc.)

### **Step 3: Add Each Variable**

For **each** of the 3 variables below, click **"New Variable"** button:

#### Variable 1:
```
Name:  VITE_RESEND_API_KEY
Value: re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC
```
Click **"Add"**

#### Variable 2:
```
Name:  VITE_FROM_EMAIL
Value: onboarding@resend.dev
```
Click **"Add"**

#### Variable 3:
```
Name:  VITE_FROM_NAME
Value: RPGCC Team Portal
```
Click **"Add"**

### **Step 4: Verify Variables Added**

You should now see all 3 variables in the list:
- ✅ `VITE_RESEND_API_KEY` = `re_gNeRqnEt_...` (partially hidden)
- ✅ `VITE_FROM_EMAIL` = `onboarding@resend.dev`
- ✅ `VITE_FROM_NAME` = `RPGCC Team Portal`

### **Step 5: Deploy**

Railway should automatically trigger a redeploy when you add variables.

Look for:
- 🔄 "Deploying..." status
- ⏳ Build running (takes ~1-2 minutes)
- ✅ "Active" or "Deployed" status

**If it doesn't auto-deploy:**
1. Click **"Deploy"** button at top right
2. Or go to "Deployments" tab → "Redeploy"

### **Step 6: Wait for Deployment**

Watch the deployment logs:
- Building... ⏳
- Installing dependencies... ⏳
- Building Vite app... ⏳
- Deployment successful ✅

**Time:** Usually 1-2 minutes

### **Step 7: Test It Works**

1. Open your portal: https://torsor-practice-platform-production.up.railway.app/accountancy

2. Go to **Team Invitations** page

3. Look for the yellow warning box:
   - ❌ **Before:** "Email not configured - Set VITE_RESEND_API_KEY"
   - ✅ **After:** Warning should be GONE!

4. Create a test invitation:
   - Email: `jameshowardivc@gmail.com` (your Resend account email)
   - Name: `Test User`
   - Click "Create Invitation"

5. Expected result:
   ```
   ✅ Invitation Sent
   Email sent to jameshowardivc@gmail.com
   ```

6. Check your Gmail inbox (usually arrives in ~30 seconds)

---

## 🔍 **Troubleshooting Railway**

### **Variables not showing effect?**

**Check 1:** Hard refresh the portal page
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

**Check 2:** Verify deployment completed
- Go to "Deployments" tab
- Latest deployment shows ✅ "Success"
- Click deployment → check build logs for errors

**Check 3:** Check browser console (F12)
```javascript
console.log(import.meta.env.VITE_RESEND_API_KEY);
// Should show: re_gNeRqnEt_...
// If shows: undefined → variables not loaded
```

**Check 4:** Verify variable names are EXACT
- Must be: `VITE_RESEND_API_KEY` (not `RESEND_API_KEY`)
- Must have `VITE_` prefix
- No typos, no extra spaces

### **Deployment failing?**

**Check build logs:**
1. Go to "Deployments" tab
2. Click the failed deployment
3. Read the error message
4. Common issues:
   - Missing dependencies → `npm install` failed
   - Syntax error → fix the error in code
   - Timeout → retry deployment

**Force clean deploy:**
1. "Settings" tab → "Danger Zone"
2. "Restart Service"
3. Wait for new deployment

### **Still seeing "Email not configured"?**

**Possible causes:**

1. **Variables not added correctly**
   - Check spelling: `VITE_RESEND_API_KEY` (exact case)
   - Check value: starts with `re_`
   - No quotes around value

2. **Deployment didn't complete**
   - Check "Deployments" tab shows ✅ success
   - Try manual redeploy

3. **Browser cache**
   - Clear browser cache
   - Try incognito/private window
   - Hard refresh (Cmd+Shift+R)

4. **Wrong environment**
   - Make sure you're adding variables to the RIGHT Railway project
   - Check project name matches

---

## ✅ **Quick Verification Checklist**

Before testing invitations:

- [ ] Logged into Railway dashboard
- [ ] Found correct project: `torsor-practice-platform`
- [ ] Opened "Variables" tab
- [ ] Added `VITE_RESEND_API_KEY` = `re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC`
- [ ] Added `VITE_FROM_EMAIL` = `onboarding@resend.dev`
- [ ] Added `VITE_FROM_NAME` = `RPGCC Team Portal`
- [ ] Deployment triggered automatically
- [ ] Deployment shows ✅ "Success" or "Active"
- [ ] Waited 2 minutes for deployment to complete
- [ ] Refreshed portal page (Cmd+Shift+R)
- [ ] Yellow "Email not configured" warning is GONE

---

## 🎯 **After Railway Setup**

Once variables are added and deployed:

### **Test Mode (works immediately):**
- Send invitations to: `jameshowardivc@gmail.com`
- Test the complete flow
- Verify email arrives and link works

### **Production Mode (requires domain verification):**
- Go to: https://resend.com/domains
- Add domain: `rpgcc.co.uk`
- Add DNS records (Resend shows you which ones)
- Wait ~15 min for verification
- Update `VITE_FROM_EMAIL=noreply@rpgcc.co.uk`
- Redeploy Railway
- Now can send to ANY email!

---

## 📊 **Expected Timeline**

| Task | Time | Status |
|------|------|--------|
| Add Railway variables | 2 min | ⏳ Do now |
| Wait for deployment | 2 min | ⏳ Automatic |
| Test with your Gmail | 1 min | ⏳ After deploy |
| Verify domain (optional) | 30 min | 🔜 For production |
| **Total to working system** | **5 min** | 🎯 Today! |

---

## 💡 **Pro Tips**

1. **Copy all 3 variables at once:**
   ```bash
   VITE_RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC
   VITE_FROM_EMAIL=onboarding@resend.dev
   VITE_FROM_NAME=RPGCC Team Portal
   ```
   Paste one at a time into Railway

2. **Keep Railway dashboard open** while testing to see logs in real-time

3. **Check Resend dashboard** after sending emails: https://resend.com/emails

4. **Save Railway project link** for quick access later

5. **Test incremental:**
   - First test: your Gmail
   - Then test: your RPGCC email (after domain verification)
   - Finally: invite whole team

---

## 🆘 **Need Help?**

**Railway Support:**
- Help: https://docs.railway.app
- Discord: https://discord.gg/railway

**Resend Support:**
- Docs: https://resend.com/docs
- Support: support@resend.com

**Quick tests:**
```bash
# Test API key with curl
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC' \
  -H 'Content-Type: application/json' \
  -d '{"from":"onboarding@resend.dev","to":["jameshowardivc@gmail.com"],"subject":"Test","html":"<h1>Test</h1>"}'

# Should return: {"id":"..."}
```

---

## 🚀 **You're Almost There!**

5 minutes of Railway setup = Fully working invitation system! 

Go add those variables now! 🎉

