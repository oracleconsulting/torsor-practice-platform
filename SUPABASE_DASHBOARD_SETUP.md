# 🔧 SUPABASE DASHBOARD SETUP - Session Duration

## ⚠️ Critical Step: Extend Session Duration

The code changes have been deployed, but you **must** update Supabase settings for sessions to persist properly!

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Select Your Project
Click on your TORSOR project

### 3. Navigate to Authentication Settings
- Click **"Project Settings"** (gear icon, bottom left)
- Click **"Authentication"** in the left sidebar

### 4. Find JWT Settings
Scroll down until you see:
- **JWT Expiry**
- **Refresh Token Expiry**

### 5. Update the Values

**Current (Default) Values:**
- JWT Expiry: `3600` (1 hour) ❌ Too short!
- Refresh Token Expiry: `604800` (7 days)

**Change To:**
- JWT Expiry: **`604800`** (7 days) ✅
- Refresh Token Expiry: **`2592000`** (30 days) ✅

### 6. Save Changes
Click the **"Save"** button at the bottom of the page

---

## 🎯 What These Settings Do

| Setting | Before | After | Impact |
|---------|--------|-------|--------|
| **JWT Expiry** | 3600 (1 hour) | 604800 (7 days) | Users stay logged in 7 days instead of 1 hour |
| **Refresh Token** | 604800 (7 days) | 2592000 (30 days) | Automatic token refresh works for 30 days |

---

## ✅ After You Save

Users will experience:
- ✅ Stay logged in for **7 days** (not just 1 hour)
- ✅ No more constant "Please log in again" messages
- ✅ Sessions persist through:
  - Browser closes
  - Page refreshes
  - Navigation
  - New tabs

---

## 🧪 How to Verify It Worked

1. Have a team member log in
2. Close their browser completely
3. Open browser again and go to torsor.co.uk
4. ✅ They should still be logged in!

If they get kicked to login page, the settings weren't saved properly.

---

## 📸 Visual Guide

Look for a section that says:

```
JWT Settings
├─ JWT Expiry (seconds)
│  └─ [______3600______] ← Change this to 604800
│
└─ Refresh Token Expiry (seconds)
   └─ [____604800______] ← Change this to 2592000
```

---

## ⚠️ Important Notes

1. **This is a one-time setup** - you don't need to do it again
2. **Changes apply immediately** - no restart needed
3. **Existing logged-in users** will get new tokens on next refresh
4. **SQL doesn't work** - auth.config table doesn't exist, must use Dashboard

---

## 🆘 Troubleshooting

### Can't find JWT Expiry setting?
- Make sure you're in **Project Settings** (not Table Editor)
- Look under **"Authentication"** tab
- Scroll down past "Email Auth" section

### Changes not saving?
- Check you have owner/admin permissions
- Try refreshing the dashboard page
- Make sure you clicked "Save" button

### Users still getting logged out?
- Verify the settings were saved (reload the page and check values)
- Have users log out and log back in (to get new session with new duration)
- Wait 5-10 minutes for changes to propagate

---

**This is the critical missing piece!** Once you update these settings, the session persistence will work perfectly. 🎉

