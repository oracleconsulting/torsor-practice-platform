# 📧 Resend Email Setup (5 Minutes)

## ✅ You Already Have Resend!

I can see you have `RESEND_API_KEY` configured. You're almost done!

---

## 🚀 Quick Setup Steps

### Step 1: Verify Domain (2 min)

1. **Go to Resend Dashboard**: https://resend.com/domains
2. **Check if domain is verified**:
   - If you see ✅ next to your domain → You're done!
   - If not → Follow domain verification steps

### Step 2: Add Environment Variable to Railway (1 min)

You need to make the key available to the frontend:

**In Railway Dashboard:**
```bash
# Add this (your existing key but with VITE_ prefix)
VITE_RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC

# Or keep the existing one (code checks both)
RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC
```

**Or in `.env.local` for local development:**
```bash
VITE_RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC
VITE_FROM_EMAIL=noreply@rpgcc.com
VITE_FROM_NAME=RPGCC Team Portal
```

### Step 3: Configure Sender Email (1 min)

**Option A: Use Verified Domain**
```bash
VITE_FROM_EMAIL=noreply@your-verified-domain.com
```

**Option B: Use Resend Test Mode** (100 emails/day to your own email)
```bash
VITE_FROM_EMAIL=onboarding@resend.dev
```

### Step 4: Deploy & Test (1 min)

```bash
cd torsor-practice-platform
git push origin main  # Railway auto-deploys

# Then test:
# 1. Go to Team Invitations
# 2. Create invitation with YOUR email
# 3. Check email arrives!
```

---

## 📧 What Resend Will Send

### Invitation Email
- **From**: RPGCC Team Portal <noreply@rpgcc.com>
- **Subject**: You're Invited to Join Our Skills Portal
- **Content**: Beautiful HTML email with:
  - Personal welcome
  - Your custom message (if added)
  - Portal access button
  - What to expect (60-90 min assessment)
  - 7-day expiry notice

### Reminder Email (48h before expiry)
- **Subject**: Skills Portal Invitation - 2 Days Remaining
- **Content**: Friendly reminder with urgency

### Reminder Email (24h before expiry)
- **Subject**: ⏰ Skills Portal Invitation - 1 Day Remaining
- **Content**: Urgent reminder with red theme

### Welcome Email (after completion)
- **Subject**: 🎉 Welcome! Your Skills Profile is Ready
- **Content**: Confirmation + next steps

---

## 🎯 Testing Your Setup

### Test 1: Single Email
1. Go to Team Invitations
2. Create invitation with YOUR email
3. Check email arrives within 1 minute
4. Click link → verify it works

### Test 2: Check Logs
In Railway logs, you should see:
```
✅ Email sent to: your.email@rpgcc.com Message ID: abc123
```

### Test 3: Error Handling
Create invitation with fake email:
- Should still work (link copied to clipboard)
- No crash
- Toast notification shows link copied

---

## 🔧 Troubleshooting

### "Email not configured" warning shows
**Problem**: Frontend can't find API key

**Solution**: Add `VITE_RESEND_API_KEY` (with VITE_ prefix)

### Emails not arriving
**Problem**: Domain not verified or wrong sender email

**Solutions**:
1. Use `onboarding@resend.dev` for testing
2. Verify your domain in Resend dashboard
3. Check Resend logs: https://resend.com/emails

### "Resend error: 403"
**Problem**: API key invalid or domain not verified

**Solutions**:
1. Generate new API key in Resend
2. Verify domain
3. Use test mode email: `onboarding@resend.dev`

---

## 📊 Resend vs SendGrid

### Why Resend is Better:

| Feature | Resend | SendGrid |
|---------|--------|----------|
| **Setup Time** | 5 minutes | 30+ minutes |
| **API Simplicity** | Dead simple | Complex |
| **Free Tier** | 100 emails/day | 100 emails/day |
| **Verification** | Easy | Pain in the ass |
| **Developer Experience** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Documentation** | Crystal clear | Confusing |

**You made the right choice having Resend already!** 🎉

---

## ✅ Quick Checklist

- [ ] Resend API key is `re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC` ✅ (you have it!)
- [ ] Add `VITE_RESEND_API_KEY` to Railway
- [ ] Set `VITE_FROM_EMAIL` (use `onboarding@resend.dev` for testing)
- [ ] Deploy changes
- [ ] Test with your own email
- [ ] Ready to invite team! 🚀

---

## 🎯 Your Current Configuration

Based on your screenshot:
```bash
RESEND_API_KEY=re_gNeRqnEt_MxFb413pA2FZKFsCLD1XeBGC ✅ (Already set!)
```

**All you need to do:**
1. Add `VITE_RESEND_API_KEY` with the same value (so frontend can access it)
2. Deploy
3. Test!

**Total time: 2 minutes** ⏱️

---

## 📚 Resend Dashboard

- **Emails**: https://resend.com/emails (see sent emails)
- **Domains**: https://resend.com/domains (verify domains)
- **API Keys**: https://resend.com/api-keys (manage keys)
- **Docs**: https://resend.com/docs (super clear!)

---

**You're 2 minutes away from automatic invitation emails!** 🚀

