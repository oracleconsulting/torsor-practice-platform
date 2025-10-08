# BSG Skills Matrix Update

## 🎯 What's Changed

Updated from 80 generic skills to **85 BSG-aligned skills** organized by RPGCC Business Services Group service offerings.

## 📊 New Structure

| Category | Skills | Service Line Focus |
|----------|--------|-------------------|
| Cloud Accounting & Automation | 12 | Automation |
| Management Accounting & Reporting | 10 | Management Accounts |
| Advisory & Consulting | 12 | Advisory/Forecasting, 365 Alignment |
| Digital & AI Capabilities | 10 | Core Capability, Client Vault |
| Tax & Compliance (UK) | 8 | Compliance, Advisory |
| Client Management & Development | 10 | Core Capability |
| Leadership & Team Skills | 8 | Core Capability |
| Communication & Soft Skills | 10 | Core Capability, 365 Alignment |
| Process & Efficiency | 5 | Systems Audit |
| **TOTAL** | **85** | |

## 🔧 Database Changes

### New Column: `service_line`
Each skill now includes which BSG service line it supports:
- Automation
- Management Accounts
- Advisory/Forecasting
- 365 Alignment
- Systems Audit
- Client Vault
- Compliance
- Core Capability

## 📝 How to Apply

### Option 1: Supabase SQL Editor (Recommended)
```sql
-- Copy the entire contents of:
torsor-practice-platform/supabase/migrations/20251008_bsg_skills_matrix.sql

-- Paste into Supabase SQL Editor and run
```

### Option 2: Command Line
```bash
cd torsor-practice-platform
psql $DATABASE_URL -f supabase/migrations/20251008_bsg_skills_matrix.sql
```

## ✅ What This Enables

1. **Service Line Reporting**: See skills coverage by service offering
2. **Gap Analysis**: Identify which service lines need development
3. **Team Deployment**: Match team members to service delivery needs
4. **Training Priorities**: Focus on skills that support revenue-generating services

## 🎨 Frontend Impact

The portal automatically adapts to the new skills:
- ✅ Assessment page will show all 85 skills
- ✅ Profile page will display by new categories
- ✅ Team insights will show service line coverage
- ✅ Dashboard will highlight BSG-specific metrics

No code changes required - it's all data-driven!

## 📈 Business Intelligence

New queries available:
```sql
-- Coverage by service line
SELECT 
    service_line,
    COUNT(DISTINCT skill_id) as skills_covered,
    ROUND(AVG(current_level), 1) as avg_level
FROM skill_assessments sa
JOIN skills s ON sa.skill_id = s.id
GROUP BY service_line;

-- Team capacity for each service
SELECT 
    s.service_line,
    COUNT(DISTINCT sa.team_member_id) FILTER (WHERE sa.current_level >= 3) as capable_members,
    COUNT(DISTINCT sa.team_member_id) FILTER (WHERE sa.current_level >= 4) as expert_members
FROM skills s
LEFT JOIN skill_assessments sa ON s.id = sa.skill_id
GROUP BY s.service_line
ORDER BY capable_members DESC;
```

## 🚀 Next Steps

1. **Run migration** (5 minutes)
2. **Test assessment flow** with new skills (10 minutes)
3. **Invite first team member** to complete survey (60-90 minutes)
4. **Review service line coverage** on dashboard

---

**Status**: Ready to deploy
**Impact**: High - aligns skills directly to revenue-generating services
**Risk**: Low - non-breaking change, graceful degradation if old data exists

