# 🚨 TICKET EMAIL NOTIFICATIONS NOT WORKING

## 🔍 Issue
Admin replied to ticket, but the team member didn't receive an email notification.

## 🎯 Root Cause
The email system requires **Resend API key** to be configured in Railway environment variables.

---

## ✅ Quick Fix: Configure Resend API

### Step 1: Get Resend API Key

1. **Go to**: https://resend.com/login
2. **Sign in** (or create account if you don't have one)
3. **Go to**: API Keys section
4. **Create API Key**:
   - Name: `TORSOR Production`
   - Permission: `Sending access`
5. **Copy the key** (starts with `re_...`)

---

### Step 2: Add Domain to Resend

To send from `@torsor.co.uk` or `@rpgcc.co.uk`:

1. **Go to**: Domains section in Resend
2. **Add Domain**: `torsor.co.uk` (or `rpgcc.co.uk`)
3. **Add DNS records** they provide to your domain registrar
4. **Verify domain** (click verify button)

**OR use the default domain** (quicker):
- Use: `onboarding@resend.dev` (works immediately, no DNS setup)
- Update `VITE_FROM_EMAIL` to `onboarding@resend.dev`

---

### Step 3: Configure Railway Environment

1. **Go to**: https://railway.app
2. **Select** your torsor-practice-platform project
3. **Click**: Variables tab
4. **Add these environment variables**:

```bash
# Required for email sending
RESEND_API_KEY=re_your_actual_key_here
VITE_RESEND_API_KEY=re_your_actual_key_here

# Email sender details (use verified domain or onboarding@resend.dev)
VITE_FROM_EMAIL=onboarding@resend.dev
VITE_FROM_NAME=TORSOR Support

# Alternative: If you verified torsor.co.uk domain
# VITE_FROM_EMAIL=noreply@torsor.co.uk
```

5. **Click "Save"** or deploy will auto-trigger

---

## 🧪 Test Email System

### Option 1: Test via Admin Panel
1. Reply to a ticket as admin
2. Check console for:
   ```
   ✅ Email sent to: [email]
   OR
   ⚠️ Resend not configured, email not sent
   ```

### Option 2: Test via Node Script
```bash
cd torsor-practice-platform
node test-deployed-email.mjs
```

This will show you if:
- ✅ API key is configured
- ✅ Email sends successfully
- ❌ What's wrong if it fails

---

## 📧 Current Email Flow

When admin replies to ticket:

1. **Admin sends reply** → Saved to `ticket_replies` table
2. **Email function called** → `sendTicketReplyEmail()`
3. **Checks API key** → If missing, logs warning but doesn't fail
4. **Sends via `/api/send-email`** → Backend endpoint calls Resend
5. **Updates database** → Sets `email_sent = true` if successful

---

## 🔍 Debug: Check What's Happening

### Look in Browser Console (Admin Panel)
After replying to ticket, you should see:

**If email sent:**
```
✅ Email notification sent to: member@email.com
```

**If email NOT configured:**
```
⚠️ Resend not configured, email not sent: member@email.com
```

**If email failed:**
```
❌ Email API error: 500 - Email service not configured
```

### Look in Railway Logs
Go to Railway → Logs tab, look for:

**If API key missing:**
```
❌ Resend API key not configured on server
```

**If email sent:**
```
✅ Email sent successfully: [message-id]
```

---

## 🎯 Quick Start (5 Minutes)

### Fastest Way to Get Emails Working:

1. **Sign up for Resend**: https://resend.com (free plan: 3,000 emails/month)
2. **Get API key** (starts with `re_...`)
3. **Add to Railway**:
   - `RESEND_API_KEY=re_your_key`
   - `VITE_RESEND_API_KEY=re_your_key`
   - `VITE_FROM_EMAIL=onboarding@resend.dev`
   - `VITE_FROM_NAME=TORSOR Support`
4. **Wait 2 minutes** for Railway to redeploy
5. **Test**: Reply to a ticket as admin
6. **Check email** 📧

---

## ✅ After Configuration

Ticket reply emails will include:
- 📋 Ticket subject
- 💬 Admin's reply message
- 🔗 Link to view ticket: `/team-member/tickets`
- 🎨 Professional TORSOR branding
- 📱 Mobile-responsive design

---

## 🆘 Troubleshooting

### Still not receiving emails?

1. **Check spam folder**
2. **Verify Railway env vars** are saved
3. **Check Railway logs** for errors
4. **Run test script**: `node test-deployed-email.mjs`
5. **Check Resend dashboard** for delivery status

### Email sent but not received?

- Check Resend dashboard → Logs
- Verify recipient email is correct
- Check email provider isn't blocking
- Try with a different email address

---

## 📝 Summary

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Email template | ✅ Ready | None |
| Email function | ✅ Ready | None |
| Backend endpoint | ✅ Ready | None |
| **Resend API key** | ❌ **Missing** | **Add to Railway** |

**Bottom line**: The code is ready, just needs the Resend API key configured in Railway! 🚀

