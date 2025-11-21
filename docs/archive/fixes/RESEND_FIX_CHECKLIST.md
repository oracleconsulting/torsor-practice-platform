# 🚨 RESEND EMAIL FIX - Step by Step

**Problem**: Invitations create successfully but emails don't send. Nothing appears in Resend dashboard.

**Root Cause**: Frontend can't access `RESEND_API_KEY` because Vite requires `VITE_` prefix for environment variables.

---

## ✅ 5-Minute Fix

### Step 1: Open Debug Tool (30 seconds)

Open `EMAIL_DEBUG_TOOL.html` in your browser to test Resend directly:

```bash
open /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform/EMAIL_DEBUG_TOOL.html
```

**What it does:**
- ✅ Tests your Resend API key directly
- ✅ Sends a test email to verify it works
- ✅ Shows exactly what's wrong if it fails

### Step 2: Railway Environment Variables (2 minutes)

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**: `torsor-practice-platform`
3. **Click "Variables" tab**
4. **Add these three variables:**

```bash
VITE_RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC
VITE_FROM_EMAIL=onboarding@resend.dev
VITE_FROM_NAME=RPGCC Team Portal
```

> **Why `VITE_` prefix?**  
> Your email service runs in the browser (frontend). Vite only exposes environment variables that start with `VITE_` to the frontend code. Without this prefix, `import.meta.env.VITE_RESEND_API_KEY` returns `undefined`.

> **Why `onboarding@resend.dev`?**  
> This is Resend's test email that requires NO domain verification. Perfect for testing! Once working, you can switch to `noreply@rpgcc.co.uk` after verifying your domain.

### Step 3: Redeploy (1 minute)

After adding variables, Railway will auto-redeploy. Wait for:
- ✅ Build completes
- ✅ Deployment successful
- ✅ Service shows "Active"

Or force redeploy:
```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform
git commit --allow-empty -m "Redeploy with Resend env vars"
git push origin main
```

### Step 4: Test in Production (1 minute)

1. Go to: https://torsor-practice-platform-production.up.railway.app/accountancy/team/invitations
2. Click "New Invitation"
3. **Important:** The "Email not configured" warning should be GONE
4. Fill in YOUR email address (jhoward@rpgcc.co.uk)
5. Click "Create Invitation"
6. Should see: "✅ Invitation Sent - Email sent to jhoward@rpgcc.co.uk"
7. Check your email (arrives in ~30 seconds)

### Step 5: Verify in Resend Dashboard (30 seconds)

Check Resend shows the email was sent:
- Go to: https://resend.com/emails
- You should see the invitation email
- Status should be "Delivered" or "Sent"

---

## 🔍 Debugging If Still Not Working

### Check 1: Browser Console

Open browser console (F12) when creating invitation. Look for:

**✅ Good - Should see:**
```
✅ Email sent to: jhoward@rpgcc.co.uk Message ID: abc123...
```

**❌ Bad - If you see:**
```
⚠️ Resend not configured, email not sent: jhoward@rpgcc.co.uk
```
**Fix:** Environment variables not set correctly. Double-check Railway dashboard.

**❌ Bad - If you see:**
```
❌ Resend error: 403 - Forbidden
```
**Fix:** Domain not verified. Use `onboarding@resend.dev` as from email.

### Check 2: Railway Logs

In Railway dashboard, click "View Logs" and look for:

**✅ Good:**
```
Email sent successfully
```

**❌ Bad:**
```
Resend not configured
```
**Fix:** Redeploy didn't work. Try force redeploy (see Step 3).

### Check 3: Resend Dashboard

Go to https://resend.com/emails

**✅ Good:** You see emails listed (even if failed)  
**❌ Bad:** Nothing appears at all  
**Fix:** API calls aren't reaching Resend. Check API key is correct.

---

## 🎯 Quick Test Script

Run this in your browser console while on the invitations page:

```javascript
// Check if email is configured
import('/@fs/Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform/src/lib/email-service.ts').then(module => {
  console.log('Email Config:', module.getEmailConfig());
  console.log('Is Configured:', module.isEmailConfigured());
});
```

**Should show:**
```javascript
{
  configured: true,
  fromEmail: "onboarding@resend.dev",
  fromName: "RPGCC Team Portal",
  provider: "Resend"
}
```

If `configured: false`, the API key isn't accessible.

---

## 📋 Final Checklist

Before inviting your team, verify:

- [ ] `VITE_RESEND_API_KEY` set in Railway ✅
- [ ] `VITE_FROM_EMAIL` set to `onboarding@resend.dev` ✅
- [ ] `VITE_FROM_NAME` set to `RPGCC Team Portal` ✅
- [ ] Railway deployment completed successfully ✅
- [ ] Test email sent to yourself ✅
- [ ] Email received (check spam!) ✅
- [ ] Email appears in Resend dashboard ✅
- [ ] "Email not configured" warning is GONE ✅
- [ ] Invitation link in email works ✅

---

## 🚀 After It's Working

### Optional: Use Your Own Domain

Once everything works with `onboarding@resend.dev`, you can switch to your custom domain:

1. **Verify domain in Resend**: https://resend.com/domains
2. **Add DNS records** (Resend will show you what to add)
3. **Wait for verification** (~15 minutes)
4. **Update Railway variable**:
   ```bash
   VITE_FROM_EMAIL=noreply@rpgcc.co.uk
   ```
5. **Redeploy**

Benefits of custom domain:
- ✅ Professional branding
- ✅ Better email deliverability
- ✅ No "sent via resend.dev" in email headers

---

## 🆘 Still Not Working?

If after all this it's still not working:

1. **Open the debug tool** (`EMAIL_DEBUG_TOOL.html`)
2. **Send a test email** using the tool
3. **Copy the exact error message**
4. **Check Resend logs**: https://resend.com/emails
5. **Check Railway logs** for any errors

Common final issues:
- **API key expired**: Generate new one at https://resend.com/api-keys
- **Resend account suspended**: Check Resend dashboard for warnings
- **CORS issue**: Resend API should work from any domain, but check browser console

---

## 💡 Why This Happened

**The Issue:**
Your email service (`email-service.ts`) runs in the **frontend** (browser), not the backend. Vite (your build tool) only exposes environment variables starting with `VITE_` to frontend code.

**What was happening:**
```javascript
// This line in email-service.ts was returning undefined:
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
```

Because Railway had `RESEND_API_KEY` but NOT `VITE_RESEND_API_KEY`, the frontend couldn't access it.

**The fix:**
Add the same key with `VITE_` prefix so the frontend can access it.

**Alternative approach** (for later):
Move email sending to a backend API endpoint. This way you can use `RESEND_API_KEY` without the `VITE_` prefix and keep the API key server-side (more secure).

But for now, the frontend approach works fine for your use case!

---

**Total time to fix: ~5 minutes** ⏱️

You're launching Monday. This is the ONLY thing blocking email invitations. Fix this and you're golden! 🎉

