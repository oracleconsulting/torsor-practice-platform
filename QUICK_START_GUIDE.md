# 🚀 TORSOR Email Fix - Quick Start

## ✅ **We Proved It Works!**

Your Resend API key works perfectly. Test email sent successfully to `jameshowardivc@gmail.com` with message ID: `a7766f9c-3c7b-4e22-ac3a-2fded2866d2f`

---

## 📋 **Current Status**

| Item | Status | Notes |
|------|--------|-------|
| Resend API Key | ✅ Valid | `re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC` |
| Email Sending | ✅ Works | Confirmed via curl test |
| Test Mode Limit | ⚠️ Active | Can only send to `jameshowardivc@gmail.com` |
| Domain Verification | ❌ Needed | Required to send to team members |
| Railway Variables | ❌ Not Set | Blocking frontend from using Resend |

---

## 🎯 **Two Solutions**

### **Solution A: Quick Test Mode (5 min) - Use Your Gmail**

Perfect for testing the system TODAY before verifying domain.

**What this does:**
- Emails send to `jameshowardivc@gmail.com` only
- You can test the entire invitation flow
- No domain verification needed
- Works immediately

**Steps:**

1. **Add Railway Variables** (2 min)
   
   Go to: https://railway.app → Your Project → Variables
   
   Add these 3 variables:
   ```bash
   VITE_RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC
   VITE_FROM_EMAIL=onboarding@resend.dev
   VITE_FROM_NAME=RPGCC Team Portal
   ```

2. **Wait for Redeploy** (2 min)
   
   Railway auto-deploys. Wait for "Active" status.

3. **Test Invitation** (1 min)
   
   - Go to: https://torsor-practice-platform-production.up.railway.app/accountancy/team/invitations
   - Create invitation with: `jameshowardivc@gmail.com`
   - Check email arrives
   - Test the invite link works

**Limitation:** Only works for your Gmail. Cannot invite team yet.

---

### **Solution B: Production Mode (30 min) - Verify Domain**

Required to invite your actual team members to their RPGCC emails.

**What this does:**
- Emails send to ANY address (@rpgcc.co.uk, @rpgcc.com, etc.)
- Professional sender: `noreply@rpgcc.co.uk`
- No restrictions
- Production-ready

**Steps:**

#### 1. Verify Domain in Resend (15 min)

1. **Go to Resend Domains**: https://resend.com/domains
2. **Click "Add Domain"**
3. **Enter:** `rpgcc.co.uk` (or `rpgcc.com` if you prefer)
4. **Resend shows DNS records to add**

   Example records you'll need to add:
   ```
   Type: TXT
   Name: _resend
   Value: resend_verify_abc123xyz...
   
   Type: MX
   Name: @
   Value: mx.resend.com
   Priority: 10
   
   Type: TXT
   Name: @
   Value: v=DMARC1; p=none; ...
   ```

5. **Add DNS Records** (depends on your DNS provider)
   
   - **Cloudflare**: Dashboard → DNS → Add Record
   - **GoDaddy**: Domain Settings → Manage DNS
   - **Namecheap**: Domain List → Manage → Advanced DNS
   - **Google Domains**: DNS → Custom Records

6. **Wait for Verification** (5-15 minutes)
   
   Resend checks DNS automatically. You'll see ✅ when ready.

#### 2. Update Railway Variables (2 min)

Change the from email to use your verified domain:

```bash
VITE_RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC
VITE_FROM_EMAIL=noreply@rpgcc.co.uk  # ← Changed from onboarding@resend.dev
VITE_FROM_NAME=RPGCC Team Portal
```

#### 3. Test Production Email (1 min)

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@rpgcc.co.uk",
    "to": ["jhoward@rpgcc.co.uk"],
    "subject": "Test from verified domain",
    "html": "<h1>It works!</h1>"
  }'
```

Should return: `{"id":"..."}` (success!)

#### 4. Invite Team (2 min)

Now you can invite all 16 team members to their actual emails!

---

## 🎯 **Recommended Approach**

### **For Your Monday Launch:**

**Weekend (Today/Tomorrow):**
1. ✅ Add Railway variables (Solution A) - 5 minutes
2. ✅ Test with your Gmail - verify everything works
3. ✅ Verify domain (Solution B) - 30 minutes
4. ✅ Sunday evening: Test with real team emails

**Monday Morning:**
1. ✅ Invite all 16 team members
2. ✅ Emails arrive instantly
3. ✅ Team can access portal
4. 🎉 Launch successful!

---

## 📧 **DNS Records Quick Reference**

When verifying domain, Resend typically needs these 3 records:

| Type | Name | Value | Priority |
|------|------|-------|----------|
| TXT | `_resend` | `resend_verify_...` (Resend provides) | - |
| MX | `@` or `rpgcc.co.uk` | `mx.resend.com` | 10 |
| TXT | `@` or `rpgcc.co.uk` | `v=DMARC1; p=none;...` (Resend provides) | - |

**Note:** Exact values come from Resend dashboard. Don't guess these!

---

## 🆘 **Common Issues**

### "Domain verification taking too long"

**Cause:** DNS propagation delay  
**Fix:** 
- Check DNS records are entered correctly
- Use DNS checker: https://dnschecker.org
- Wait 15-30 minutes for propagation
- Some DNS providers are faster (Cloudflare = minutes, GoDaddy = hours)

### "Still can't send to team emails after verification"

**Cause:** From email doesn't match verified domain  
**Fix:**
- Make sure `VITE_FROM_EMAIL=noreply@rpgcc.co.uk`
- Domain in from email MUST match verified domain
- Redeploy Railway after changing variable

### "Test mode restriction returned"

**Cause:** Domain verification expired or removed  
**Fix:**
- Check Resend dashboard shows ✅ verified
- Re-verify if needed
- Check DNS records still exist

---

## ✅ **Final Checklist**

### **Before Inviting Team:**

- [ ] Railway variables added (`VITE_RESEND_API_KEY`, `VITE_FROM_EMAIL`, `VITE_FROM_NAME`)
- [ ] Railway redeployed successfully
- [ ] Test invitation to `jameshowardivc@gmail.com` works
- [ ] Email received and link works
- [ ] "Email not configured" warning is GONE
- [ ] Domain verified in Resend (shows ✅)
- [ ] Test invitation to `jhoward@rpgcc.co.uk` works
- [ ] Email deliverability confirmed

### **Monday Launch:**

- [ ] All 16 team members invited
- [ ] Confirmation emails sent
- [ ] Team can access their portals
- [ ] Skills assessment loading correctly
- [ ] No "invitation expired" errors

---

## 🎉 **You're Ready!**

Your Resend setup is working. All you need is:

1. **5 minutes** → Add Railway variables → Test mode working
2. **30 minutes** → Verify domain → Production ready
3. **Monday** → Invite team → Launch! 🚀

**Next command to run:**

```bash
# Test that curl command works (should show email in your inbox)
open https://mail.google.com
```

Then add those Railway variables and you're golden!

---

## 📊 **Support Resources**

- **Resend Dashboard**: https://resend.com
- **Resend Domains**: https://resend.com/domains
- **Resend Emails Log**: https://resend.com/emails
- **Railway Dashboard**: https://railway.app
- **DNS Checker**: https://dnschecker.org
- **Your Portal**: https://torsor-practice-platform-production.up.railway.app

---

**Questions? Check the test email I just sent to `jameshowardivc@gmail.com` - it has all the details! 📧**
