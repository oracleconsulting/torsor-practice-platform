# 🎯 PROPER REBUILD PLAN - Copying from Archive

## What I Got Wrong
- Only showed 5 services (there are 10!)
- Didn't copy the actual Skills Management structure (needs individual skill cards with performers/interest)
- Didn't implement team insights
- Didn't implement development opportunities
- Didn't implement LLM assessment analysis

## What to Copy from Archive

### 1. Service Lines (ALL 10)
```
1. Automation
2. Management Accounts
3. Future Financial Information / Advisory Accelerator
4. Benchmarking - External and Internal
5. 365 Alignment Programme
6. Systems Audit
7. Profit Extraction / Remuneration Strategies
8. Fractional CFO Services
9. Fractional COO Services
10. Combined CFO/COO Advisory
```

### 2. Skills Management Structure
From screenshot, each skill needs:
- Skill name
- Required level (e.g., "3")
- Gap indicator (e.g., "+3.0")
- Average (e.g., "0.0")
- Top Performers section (with names)
- Lowest Performers section (with names)
- Team icon
- Edit icon
- Delete icon
- 0 assessments count
- Interest level (e.g., "0.0/5")

### 3. Files to Copy & Adapt

#### Core Data Files:
- `/src/lib/advisory-services-skills-mapping.ts` (FULL version with all services)
- `/src/lib/api/service-line-interests.ts` (10 services)
- `/src/lib/api/service-skills.ts`

#### Component Files:
- `/src/components/accountancy/team/SkillsDashboardV2.tsx` (the REAL one)
- `/src/pages/accountancy/team/SkillsDashboardV2Page.tsx`
- `/src/pages/accountancy/admin/ServiceReadinessDashboard.tsx` (REAL readiness)
- `/src/pages/accountancy/admin/ServiceLinePreferencesAdmin.tsx`

#### Assessment & Insights:
- `/src/lib/services/llm-service.ts` (LLM calls)
- `/src/lib/ai/perplexity-service.ts`
- Team insights generation
- Development opportunities

### 4. Database Queries to Match
The archive uses these tables:
- `skills` - ✅ We have this
- `skill_assessments` - ✅ We have this
- `practice_members` - ✅ We have this
- `service_line_interests` - ✅ We migrated this
- `service_skill_assignments` - ✅ We migrated this
- `skill_required_levels` - ✅ We migrated this

### 5. What Needs Building
1. ✅ Copy full advisory services mapping (all 10 + full skills)
2. ✅ Rebuild Skills Management to match screenshot exactly
3. ✅ Rebuild Service Readiness with all 10 services
4. ⏳ Add Team Insights (LLM-powered)
5. ⏳ Add Development Opportunities
6. ⏳ Add Assessment Analysis (correlation analysis from your doc)

## Next Steps

1. **Copy the full advisory-services-skills-mapping.ts** (all 10 services with complete skills)
2. **Update Skills Management Page** to show individual skills like screenshot
3. **Update Service Readiness** with all 10 services
4. **Add LLM service** for insights
5. **Add Team Insights page**
6. **Add Development Opportunities page**

## Time Estimate
- Phase 1 (All 10 services + proper skills management): 30 min
- Phase 2 (Team insights + LLM): 30 min  
- Phase 3 (Development opportunities): 20 min

**Total: ~80 minutes to get it properly working**

---

I'll start now by copying the ACTUAL files and adapting them to work with our clean v2 architecture.

