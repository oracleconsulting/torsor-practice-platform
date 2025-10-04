# 🚀 TORSOR Deployment Guide

## ✅ Status: READY TO DEPLOY!

**GitHub Repository**: https://github.com/oracleconsulting/torsor-practice-platform

All code is pushed and ready to deploy to Railway!

---

## 🎯 Quick Deploy to Railway

### Option 1: Deploy via GitHub (Recommended)

1. **Go to Railway**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Select**: `oracleconsulting/torsor-practice-platform`
4. **Add Environment Variables**:
   ```
   VITE_APP_NAME=TORSOR
   VITE_SUPABASE_URL=https://nwmzegonnmqzflamcxfd.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bXplZ29ubm1xemZsYW1jeGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTkzNjYsImV4cCI6MjA2MzA5NTM2Nn0.XO-0dWDh37dU_VnUHNZXOCv7PonAXl_Ol3Fzd_istJA
   VITE_API_URL=https://your-api-server-url.railway.app
   ```

5. **Deploy Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm run start` (or `node server.js`)
   - Root Directory: `/`

6. **Click Deploy** 🚀

### Option 2: Deploy via Railway CLI

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform

# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize new project
railway init

# Add environment variables
railway variables set VITE_APP_NAME=TORSOR
railway variables set VITE_SUPABASE_URL=https://nwmzegonnmqzflamcxfd.supabase.co
railway variables set VITE_SUPABASE_ANON_KEY=your_key_here
railway variables set VITE_API_URL=https://your-api-url.railway.app

# Deploy!
railway up
```

---

## 🔧 Environment Variables Explained

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_APP_NAME` | `TORSOR` | App branding |
| `VITE_SUPABASE_URL` | Your Supabase URL | Database connection |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Database auth |
| `VITE_API_URL` | Your API server URL | Backend API endpoint |

---

## 📋 Pre-Deployment Checklist

- [x] ✅ Git initialized
- [x] ✅ All files committed (799 files)
- [x] ✅ Pushed to GitHub
- [x] ✅ .env file created (not committed)
- [x] ✅ Dependencies installed
- [x] ✅ Dev server tested
- [ ] ⏳ Railway project created
- [ ] ⏳ Environment variables added
- [ ] ⏳ Deployed to Railway
- [ ] ⏳ Custom domain configured (optional)

---

## 🌐 Custom Domain Setup (Optional)

Once deployed on Railway:

1. **Go to Railway Dashboard**
2. **Settings** → **Domains**
3. **Add Domain**: `app.torsor.com` (or your domain)
4. **Add DNS Records** (in your domain provider):
   ```
   Type: CNAME
   Name: app
   Value: your-app.railway.app
   ```
5. **Wait for DNS propagation** (5-30 minutes)
6. **SSL Certificate** will be automatically provisioned

---

## 🔗 API Server Configuration

TORSOR shares the API server with Oracle Method Portal.

**Current API**: `oracle_api_server` (already deployed)

**If you need to update API_URL**:
1. Find your current API deployment on Railway
2. Copy the URL (e.g., `https://oracle-api-server.railway.app`)
3. Update `VITE_API_URL` environment variable in Railway
4. Redeploy TORSOR

---

## 📊 Post-Deployment Testing

Once deployed, test these key features:

### 1. Authentication
- [ ] Login works
- [ ] Signup works
- [ ] Logout works

### 2. Dashboard
- [ ] Dashboard loads
- [ ] Practice data displays
- [ ] Widgets render correctly

### 3. Core Features
- [ ] Client Management accessible
- [ ] Team Management works
- [ ] Advisory Services loads

### 4. New Features
- [ ] Client Vault accessible
- [ ] 365 Alignment page loads
- [ ] No IVC references visible
- [ ] Oracle Method roadmap displays correctly

### 5. Navigation
- [ ] All sidebar links work
- [ ] Routes are simplified (no `/accountancy/` prefix)
- [ ] Page transitions smooth

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"
**Solution**: Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly

### Issue: "API calls failing"
**Solution**: Verify `VITE_API_URL` points to your API server

### Issue: "White screen on load"
**Solution**: Check browser console for errors, verify environment variables

### Issue: "Build fails"
**Solution**: 
1. Check Railway build logs
2. Ensure all dependencies in `package.json`
3. Verify Node version compatibility

---

## 📈 Monitoring & Analytics

Once deployed, monitor:

1. **Railway Dashboard** → Performance metrics
2. **Supabase Dashboard** → Database queries
3. **Browser Console** → Frontend errors
4. **Railway Logs** → Server errors

---

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to `main`:

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform

# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Railway will automatically detect and redeploy!
```

---

## 💰 Cost Estimate

**Railway Pricing** (as of 2024):
- **Hobby Plan**: $5/month (500 hours)
- **Developer Plan**: $20/month (unlimited)

**Current Setup**:
- TORSOR frontend: ~1 instance
- Shared API server: Already running
- Shared Supabase: Already running

**Total Additional Cost**: ~$5-20/month for TORSOR

---

## 🎉 Success Indicators

You'll know deployment is successful when:

✅ **URL accessible** (e.g., `https://torsor.railway.app`)  
✅ **Login works** with Supabase auth  
✅ **Dashboard loads** with practice data  
✅ **365 Alignment** shows as Oracle Method client hub  
✅ **No IVC references** visible anywhere  
✅ **Routes simplified** (clean URLs)  

---

## 📞 Support

If you run into issues:

1. Check Railway logs
2. Check browser console
3. Verify environment variables
4. Check Supabase dashboard

**Deployment Status**: ✅ Code ready, awaiting Railway deployment

---

## 🚀 Next Steps After Deployment

1. **Test all features** thoroughly
2. **Update DNS** for custom domain (if using)
3. **Share with team** for feedback
4. **Monitor performance** in Railway
5. **Set up alerts** (optional)
6. **Document any custom configs**

---

**Repository**: https://github.com/oracleconsulting/torsor-practice-platform  
**Deployed**: Awaiting Railway deployment  
**Status**: ✅ READY!

