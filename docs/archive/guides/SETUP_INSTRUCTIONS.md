# TORSOR Practice Platform - Setup Instructions

## Quick Start

This is TORSOR - a complete practice management platform for accountancy firms, separated from Oracle Method Portal for easier file management and development.

### What is TORSOR?

TORSOR contains ALL the accountancy portal functionality from Oracle Method Portal:
- Dashboard & Practice Health
- Client Management
- Team Management & CPD Tracking
- Advisory Services (Forecasting, Valuation, Strategy)
- Client Vault
- 365 Alignment Programme
- Outreach & Marketing Tools
- All other accountancy features

### Setup Steps

1. **Install Dependencies**
```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform
npm install --legacy-peer-deps
```

2. **Copy Configuration Files**
```bash
# Copy from oracle-method-portal
cp ../oracle-method-portal/tailwind.config.js .
cp ../oracle-method-portal/postcss.config.js .
cp ../oracle-method-portal/tsconfig.json .
cp ../oracle-method-portal/vite.config.ts .
cp ../oracle-method-portal/.env.example .
cp ../oracle-method-portal/index.html .
```

3. **Copy All Accountancy Source Files**
```bash
# This will be done via script
npm run copy-files
```

4. **Environment Variables**
Create `.env` file:
```env
VITE_APP_NAME=TORSOR
VITE_SUPABASE_URL=https://nwmzegonnmqzflamcxfd.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_API_URL=http://localhost:8080
```

5. **Run Development Server**
```bash
npm run dev
```

### Directory Structure

```
torsor-practice-platform/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── layout/          # Main layout
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── team/
│   │   ├── advisory/
│   │   ├── vault/
│   │   └── outreach/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ClientManagement.tsx
│   │   ├── AdvisoryServices.tsx
│   │   └── ...
│   ├── contexts/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── routes/
│   └── lib/
├── public/
├── Dockerfile
├── railway.json
└── package.json
```

### Key Differences from Oracle Method Portal

1. **No Oracle Branding** - All references to "Oracle" removed
2. **Simplified Routes** - `/dashboard` instead of `/accountancy/dashboard`
3. **Independent** - Own repository, deployment, and configuration
4. **Same Database** - Still uses same Supabase for now (can be separated later)

### Deployment

Will be deployed to Railway as separate service:
- **URL**: app.torsor.com (or similar)
- **Railway Project**: TORSOR Practice Platform
- **Database**: Same Supabase (shared with Oracle Method for now)

### Cross-Functionality with Oracle Method Portal

While TORSOR is separate, it shares:
- **Database** (Supabase)
- **API Server** (oracle_api_server endpoints)
- **Authentication** (same auth system)
- **UI Components** (shadcn/ui)

This allows:
- Easy data sharing
- Consistent user experience
- Shared infrastructure costs
- Gradual separation if needed

### Development Workflow

1. Work on TORSOR features in this directory
2. Changes won't affect Oracle Method Portal
3. Both can run simultaneously
4. Easy to find/organize files

### Future Enhancements

- [ ] Complete branding to TORSOR
- [ ] Custom domain setup
- [ ] Separate Railway deployment
- [ ] Optional: Separate Supabase project
- [ ] Independent versioning
- [ ] Dedicated documentation site

