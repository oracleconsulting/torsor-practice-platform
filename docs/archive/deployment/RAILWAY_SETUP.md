# 🚂 Railway Deployment Setup for TORSOR

## ✅ Build Error Fixed!

The build error has been fixed and pushed to GitHub. Railway will automatically redeploy.

---

## 🔧 Required Environment Variables

In your **Railway Project** → **Variables** tab, add these:

### 1. VITE_APP_NAME
```
TORSOR
```

### 2. VITE_SUPABASE_URL
```
https://nwmzegonnmqzflamcxfd.supabase.co
```

### 3. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bXplZ29ubm1xemZsYW1jeGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTkzNjYsImV4cCI6MjA2MzA5NTM2Nn0.XO-0dWDh37dU_VnUHNZXOCv7PonAXl_Ol3Fzd_istJA
```

### 4. VITE_API_URL

**You need to find your API server URL first!**

#### Option A: If you have `oracle_api_server` deployed on Railway:
1. Go to your Railway dashboard
2. Find your `oracle_api_server` service
3. Go to **Settings** → **Domains**
4. Copy the URL (e.g., `https://oracle-api-server.up.railway.app`)
5. Use that URL:
```
https://your-oracle-api-server-url.up.railway.app
```

#### Option B: If API server is deployed elsewhere:
Use your existing API server URL:
```
https://your-existing-api-url.com
```

#### Option C: For testing (temporary):
```
http://localhost:8080
```
⚠️ **Note**: This will only work for local development, not production!

---

## 📋 Step-by-Step Railway Setup

### Step 1: Add Environment Variables
1. Go to your TORSOR project in Railway
2. Click **Variables** tab
3. Click **+ New Variable**
4. Add each variable above (one at a time)
5. Click **Add** after each one

### Step 2: Verify Build Settings
Railway should auto-detect these from your `package.json`:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start` (or `node server.js`)
- **Install Command**: `npm install`

If not auto-detected:
1. Go to **Settings** tab
2. Scroll to **Build Command**
3. Set: `npm run build`
4. Set **Start Command**: `npm run start`

### Step 3: Deploy
1. Railway will automatically detect the GitHub push
2. It will rebuild with the fix
3. Watch the **Deployments** tab for progress

### Step 4: Verify Deployment
Once deployed:
1. Click on the deployment
2. Click **View Logs**
3. Look for `✓ built in X.XXs` (success indicator)
4. Click **Deployments** → **Domain** to get your URL

---

## 🌐 Custom Domain (Optional)

After successful deployment:

1. **Railway Settings** → **Domains**
2. **Custom Domain** → Add `app.torsor.com` (or your domain)
3. **Add DNS Record** at your domain provider:
   ```
   Type: CNAME
   Name: app (or @ for root)
   Value: your-app.up.railway.app
   TTL: 3600
   ```
4. Wait 5-30 minutes for DNS propagation

---

## 🔍 Environment Variables Quick Copy

```bash
# Copy these to Railway Variables tab

VITE_APP_NAME=TORSOR

VITE_SUPABASE_URL=https://nwmzegonnmqzflamcxfd.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bXplZ29ubm1xemZsYW1jeGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTkzNjYsImV4cCI6MjA2MzA5NTM2Nn0.XO-0dWDh37dU_VnUHNZXOCv7PonAXl_Ol3Fzd_istJA

VITE_API_URL=https://your-api-server-url.up.railway.app
```

---

## ✅ Deployment Checklist

- [ ] Build error fixed (✅ Done - pushed to GitHub)
- [ ] Environment variables added in Railway
- [ ] API server URL configured
- [ ] Build command set
- [ ] Start command set
- [ ] Deployment triggered
- [ ] Logs checked (no errors)
- [ ] App accessible via Railway URL
- [ ] Login works
- [ ] Dashboard loads
- [ ] Custom domain configured (optional)

---

## 🐛 Troubleshooting

### Build Still Fails?
1. Check Railway logs
2. Verify all environment variables are set
3. Ensure no typos in variable names
4. Try manual redeploy: **Deployments** → **Redeploy**

### "Cannot connect to Supabase"?
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check Supabase dashboard is accessible

### "API calls failing"?
- Verify `VITE_API_URL` is correct
- Check API server is running
- Verify CORS settings on API server

### White screen after deployment?
1. Open browser console (F12)
2. Check for errors
3. Verify environment variables
4. Check Railway logs

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Railway build completes with `✓ built in X.XXs`  
✅ No errors in Railway logs  
✅ App URL loads (e.g., `https://torsor-practice-platform.up.railway.app`)  
✅ Login page appears  
✅ Can log in successfully  
✅ Dashboard loads  

---

## 📊 Expected Railway Output

**Successful build looks like:**
```
✓ 1451 modules transformed.
✓ built in 2.90s
dist/index.html                   0.58 kB │ gzip:  0.34 kB
dist/assets/index-abc123.css     50.20 kB │ gzip: 10.52 kB
dist/assets/index-xyz789.js   1,250.43 kB │ gzip: 350.21 kB
```

---

## 🔐 Security Note

**Never commit `.env` files!**  
Railway environment variables are secure and separate from your code.

---

## 📞 Next Steps

1. **Add all environment variables** ✅
2. **Wait for automatic redeploy** (GitHub push triggers this)
3. **Check deployment logs** for success
4. **Visit your Railway URL** to test
5. **Configure custom domain** (optional)

**Status**: ✅ Build fixed, ready to deploy!

