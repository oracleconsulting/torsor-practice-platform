# Companies House Outreach Tool - Architecture Decision

## Recommendation: Separate Repo + Shared Supabase

**Date:** December 9, 2025  
**Status:** ✅ Approved

---

## Architecture Decision

### ✅ Separate Repository: `torsor-outreach-tool`

**Rationale:**
- Independent deployment to Railway at `outreach.torsor.co.uk`
- Clean separation from practice platform
- Independent versioning and CI/CD
- Easier to scale and maintain
- Follows pattern of client-portal (separate app, shared infra)

**Repository Structure:**
```
torsor-outreach-tool/
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── lib/
├── supabase/
│   └── functions/          # Edge functions specific to outreach
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── railway.toml
```

### ✅ Shared Supabase Project

**Rationale:**
- **Shared Authentication**: Users log in once, access all Torsor tools
- **Data Integration**: Prospects can link to existing clients in practice platform
- **RLS Policies**: Leverage existing `practice_members` table for access control
- **Cost Efficiency**: Single database instance
- **Schema Isolation**: `outreach.*` schema keeps data organized

**Shared Resources:**
- Supabase Instance: `mvdejlkiqslwrbarwxkw.supabase.co`
- Auth: Shared `auth.users` table
- Practices: Shared `practices` and `practice_members` tables
- Edge Functions: Deploy to same Supabase project

**Isolated Resources:**
- Schema: `outreach.*` (companies, prospects, covenants, etc.)
- Edge Functions: `companies-house`, `address-discovery`, etc.

---

## Implementation Plan

### Phase 1: Repository Setup

1. **Create GitHub Repository**
   - Name: `torsor-outreach-tool`
   - Description: Companies House data mining tool for accounting practices
   - Private repository
   - Initialize with README

2. **Clone and Initialize**
   ```bash
   git clone <repo-url>
   cd torsor-outreach-tool
   npm create vite@latest . -- --template react-ts
   ```

3. **Install Dependencies**
   - React 18 + TypeScript
   - TanStack Router + Query
   - Tailwind CSS + shadcn/ui
   - Supabase JS client

### Phase 2: Database Migration

1. **Run Migration Script**
   - Execute `scripts/20251209_create_outreach_schema.sql`
   - Creates `outreach.*` schema with all tables
   - Sets up RLS policies referencing `practice_members`
   - Creates helper functions

2. **Verify Integration**
   - Test RLS policies work with existing auth
   - Verify foreign keys to `practices` table
   - Test `practice_members` access

### Phase 3: Edge Functions

1. **Deploy to Shared Supabase**
   ```bash
   supabase functions deploy companies-house --project-ref mvdejlkiqslwrbarwxkw
   supabase functions deploy address-discovery --project-ref mvdejlkiqslwrbarwxkw
   ```

2. **Set Secrets**
   ```bash
   supabase secrets set COMPANIES_HOUSE_API_KEY=xxx --project-ref mvdejlkiqslwrbarwxkw
   ```

### Phase 4: Frontend Development

1. **Build Services Layer**
   - `src/services/companiesHouse.ts`
   - `src/services/prospects.ts`
   - `src/services/covenants.ts`

2. **Build React Query Hooks**
   - `src/hooks/useCompaniesHouse.ts`
   - `src/hooks/useProspects.ts`
   - `src/hooks/useCovenants.ts`

3. **Build UI Components**
   - Search forms
   - Results tables
   - Company modals
   - Prospect management

4. **Build Pages**
   - Dashboard
   - Firm Search
   - Address Search
   - Prospects
   - Covenants

### Phase 5: Railway Deployment

1. **Create Railway Service**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set start command: `npm run preview` or serve static files

2. **Configure Environment Variables**
   ```
   VITE_SUPABASE_URL=https://mvdejlkiqslwrbarwxkw.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon_key>
   ```

3. **Configure Custom Domain**
   - Domain: `outreach.torsor.co.uk`
   - SSL: Automatic via Railway

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              outreach.torsor.co.uk                          │
│              (Separate Railway Service)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React Frontend (Vite + React)                │  │
│  │  - Firm Search                                       │  │
│  │  - Address Search                                    │  │
│  │  - Prospects Management                              │  │
│  │  - Covenants Management                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Supabase JS Client                           │  │
│  │  - Auth (shared auth.users)                          │  │
│  │  - Database (outreach.* schema)                      │  │
│  │  - Edge Functions                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│         Shared Supabase Instance                            │
│    mvdejlkiqslwrbarwxkw.supabase.co                        │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Shared Schema   │  │  Outreach Schema │               │
│  │                  │  │                  │               │
│  │  • practices     │  │  • companies     │               │
│  │  • practice_     │  │  • prospects     │               │
│  │    members       │  │  • covenants     │               │
│  │  • auth.users    │  │  • search_       │               │
│  │  • clients       │  │    history       │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Edge Functions                               │  │
│  │  • companies-house (API proxy)                       │  │
│  │  • address-discovery (firm clients)                  │  │
│  │  • export-prospects (CSV/Excel)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│         External APIs                                       │
│  • Companies House API (api.company-information...)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefits of This Architecture

### ✅ Separation of Concerns
- Outreach tool is independent
- Can be developed/deployed separately
- Clear boundaries

### ✅ Shared Infrastructure
- Single auth system
- Shared practice data
- Consistent RLS policies
- Cost efficient

### ✅ Data Integration
- Prospects can link to existing clients
- Cross-tool analytics possible
- Unified user experience

### ✅ Scalability
- Each tool scales independently
- Database scales as one unit
- Edge functions shared efficiently

---

## Migration Path (If Needed Later)

If we ever need to separate Supabase projects:

1. **Export Data**
   ```sql
   pg_dump -t outreach.* > outreach_schema.sql
   ```

2. **Create New Project**
   - New Supabase project
   - Import schema

3. **Update Frontend**
   - Change `VITE_SUPABASE_URL`
   - Update RLS policies if needed

4. **Sync Auth** (complex)
   - Would need auth sync mechanism
   - Or separate auth per tool

**Recommendation:** Stay with shared Supabase unless there's a compelling reason to separate (e.g., different compliance requirements, different regions, etc.)

---

## Security Considerations

### ✅ RLS Policies
- All `outreach.*` tables use RLS
- Policies reference `practice_members` for access control
- Users only see their practice's data

### ✅ Edge Functions
- Service role key only in Edge Functions
- Anon key in frontend (safe for RLS-protected queries)
- API keys (Companies House) in Edge Function secrets

### ✅ Authentication
- Shared Supabase auth
- Same session across tools
- Consistent security model

---

## Next Steps

1. ✅ **Approve Architecture** (this document)
2. ⏳ **Create GitHub Repository** (`torsor-outreach-tool`)
3. ⏳ **Initialize Project** (Vite + React + TypeScript)
4. ⏳ **Run Database Migration** (outreach schema)
5. ⏳ **Build Edge Functions** (companies-house, address-discovery)
6. ⏳ **Build Frontend** (services, hooks, components, pages)
7. ⏳ **Deploy to Railway** (outreach.torsor.co.uk)
8. ⏳ **Test Integration** (auth, RLS, data flow)

---

## Questions & Answers

**Q: Why not put it in `apps/outreach-tool` in the monorepo?**  
A: The client-portal is in the monorepo because it's tightly integrated with the practice platform. The outreach tool is more standalone and benefits from independent deployment and versioning.

**Q: What if we need to share components between tools?**  
A: We can create a shared npm package (`@torsor/ui` or `@torsor/shared`) that both repos can import. This is cleaner than a monorepo for this use case.

**Q: Can prospects link to clients in the practice platform?**  
A: Yes! Since we're using the same database, we can add a `client_id` foreign key to `outreach.prospects` that references `clients.id`. This enables powerful cross-tool features.

**Q: What about rate limiting on Companies House API?**  
A: The Edge Function handles rate limiting (600 req/5 min). We can add a queue system later if needed.

---

*Document prepared: December 9, 2025*  
*Status: Ready for implementation*

