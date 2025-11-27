# Database Schema Comparison
## Oracle Method Portal vs 365 Client Portal

---

## Executive Summary

| Metric | Oracle Method Portal | 365 Client Portal | Improvement |
|--------|---------------------|-------------------|-------------|
| **Core Tables** | 30+ | 9 | **-70%** |
| **Migration Files** | 87 | 1 | **-99%** |
| **Assessment Tables** | 4 (separate per part) | 1 (unified) | **-75%** |
| **Progress Tables** | 3 | 0 (embedded) | **-100%** |
| **Unused Features** | 15+ tables | 0 | **-100%** |

---

## Tables Eliminated

### ❌ Subscription & Partner System (Not Needed for 365)

| Table | Rows Typical | Why Eliminated |
|-------|--------------|----------------|
| `subscription_tiers` | 3 | No freemium model for 365 |
| `user_subscriptions` | Thousands | Direct enrollment, no tiers |
| `feature_usage` | Millions | Not tracking feature limits |
| `partners` | Dozens | No partner ecosystem |
| `partner_services` | Hundreds | No partner services |
| `user_partner_subscriptions` | Thousands | No partner integrations |
| `revenue_sharing` | Thousands | No revenue splits |

**Tables eliminated: 7**

---

### ❌ Duplicate/Redundant Tables

| Table | Issue | Solution |
|-------|-------|----------|
| `user_profiles` | Duplicates `auth.users` | Use auth.users directly |
| `dashboard_setup` | Separate config table | Embed in `practice_members.settings` |
| `onboarding_progress` | Step-by-step tracking | Embed in assessment status |
| `assessment_progress` | Separate progress table | Embed in `client_assessments` |
| `validation_sessions` | Separate validation | Embed in assessment responses |
| `sprint_progress` | Separate per week | Embed in tasks |
| `sprint_reflections` | Rarely used | Not needed for MVP |

**Tables eliminated: 7**

---

### ❌ Split Assessment Tables (Unified)

| Old Tables | New Approach |
|------------|--------------|
| `client_intake` (Part 1) | → `client_assessments` with `assessment_type = 'part1'` |
| `client_intake_part2` (Part 2) | → `client_assessments` with `assessment_type = 'part2'` |
| `client_intake_part3` (Part 3) | → `client_assessments` with `assessment_type = 'part3'` |
| `client_config` | → Merged into `practice_members` |

**Tables eliminated: 4 → 1**

---

### ❌ Feature-Specific Tables (Out of Scope)

| Table | Feature | Why Eliminated |
|-------|---------|----------------|
| `cyber_assessments` | Partner cyber security | Not core to 365 |
| `kpi_definitions` | KPI system | Overkill - JSONB in roadmap |
| `kpi_values` | KPI tracking | Overkill - tasks track progress |
| `knowledge_base_*` | 5 tables | Different feature |
| `outreach_*` | 4 tables | Accountancy feature |

**Tables eliminated: 10+**

---

## New Clean Schema

### ✅ Core Tables (9 total)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        365 CLIENT PORTAL SCHEMA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  practice_members (extended)                                                │
│  └── Unified team + client management                                       │
│                                                                             │
│  client_assessments                                                         │
│  └── Part 1, 2, 3 in one table (type column)                               │
│  └── Progress embedded (current_section, completion_percentage)            │
│                                                                             │
│  client_roadmaps                                                            │
│  └── Version history built-in                                              │
│  └── LLM metadata tracked                                                  │
│                                                                             │
│  client_tasks                                                               │
│  └── 13-week structure                                                     │
│  └── Attachments as JSONB                                                  │
│                                                                             │
│  client_chat_threads                                                        │
│  └── Escalation support                                                    │
│  └── Context snapshot for AI                                               │
│                                                                             │
│  client_chat_messages                                                       │
│  └── Role-based (user, assistant, advisor)                                │
│  └── Cost tracking                                                         │
│                                                                             │
│  client_appointments                                                        │
│  └── Calendar integration ready                                            │
│  └── Agenda + action items                                                 │
│                                                                             │
│  client_activity_log                                                        │
│  └── Lightweight engagement tracking                                       │
│                                                                             │
│  llm_usage_log                                                              │
│  └── Cost management                                                       │
│                                                                             │
│  + client_engagement_summary (materialized view)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Design Principles Applied

### 1. JSONB for Flexibility

```sql
-- OLD: Add column = migration
ALTER TABLE client_intake_part2 ADD COLUMN new_field TEXT;

-- NEW: Add field = just update JSONB
UPDATE client_assessments 
SET responses = responses || '{"new_field": "value"}'
WHERE assessment_type = 'part2';
```

**Benefit:** Zero schema migrations for assessment changes.

---

### 2. Single Source of Truth

```sql
-- OLD: Client data scattered
client_intake.email
client_intake_part2.user_id
client_config.company_name
user_profiles.business_name

-- NEW: One place
practice_members.email
practice_members.client_company
practice_members.settings
```

**Benefit:** No data sync issues.

---

### 3. Embedded Progress

```sql
-- OLD: Separate progress table
CREATE TABLE assessment_progress (
  part1_complete BOOLEAN,
  part2_complete BOOLEAN,
  part3_complete BOOLEAN,
  ...20 more columns
);

-- NEW: Status on the record itself
client_assessments.status = 'completed'
client_assessments.completion_percentage = 100
```

**Benefit:** No joins needed, always in sync.

---

### 4. Version History Built-In

```sql
-- Roadmaps have versioning
client_roadmaps.version = 2
client_roadmaps.is_active = TRUE
client_roadmaps.superseded_by = [previous_id]
```

**Benefit:** Full audit trail without separate tables.

---

### 5. RLS from Day One

```sql
-- Helper functions for clean policies
is_client_member(client_id)
is_team_member_of_practice(practice_id)

-- Simple, readable policies
CREATE POLICY "clients_own_data" ON table
  FOR ALL USING (is_client_member(client_id));
```

**Benefit:** Security baked in, not bolted on.

---

## Performance Optimizations

### Indexes Created

| Table | Index | Purpose |
|-------|-------|---------|
| `client_assessments` | `idx_assessments_incomplete` | Find in-progress quickly |
| `client_tasks` | `idx_tasks_due` | Pending tasks with due dates |
| `client_chat_threads` | `idx_chat_threads_escalated` | Find escalations |
| `client_appointments` | `idx_appointments_upcoming` | Dashboard upcoming |
| `client_activity_log` | `idx_activity_client_date` | Recent activity |

### Materialized View

```sql
-- Pre-computed for dashboard
client_engagement_summary
├── assessments_completed
├── tasks_completed
├── tasks_pending
├── activities_30d
├── logins_30d
└── engagement_score
```

**Refresh:** `REFRESH MATERIALIZED VIEW CONCURRENTLY client_engagement_summary;`

---

## Migration Path

### From Oracle Method Portal

If migrating existing clients:

```sql
-- 1. Migrate Part 1
INSERT INTO client_assessments (client_id, assessment_type, responses, status, completed_at)
SELECT pm.id, 'part1', ci.responses, 
       CASE WHEN ci.completed THEN 'completed' ELSE 'in_progress' END,
       ci.part1_completed_at
FROM client_intake ci
JOIN practice_members pm ON pm.user_id = ci.user_id;

-- 2. Migrate Part 2
INSERT INTO client_assessments (client_id, assessment_type, responses, status, completed_at)
SELECT pm.id, 'part2', ci2.responses,
       CASE WHEN ci2.completed THEN 'completed' ELSE 'in_progress' END,
       ci2.part2_completed_at
FROM client_intake_part2 ci2
JOIN practice_members pm ON pm.user_id = ci2.user_id;

-- Similar for Part 3, roadmaps, etc.
```

---

## Summary

The new 365 Client Portal schema is:

- **70% fewer tables** (9 vs 30+)
- **Unified data model** (no scattered client info)
- **Flexible with JSONB** (no migrations for new fields)
- **Secure by default** (RLS from day one)
- **Performance optimized** (proper indexes, materialized views)
- **Maintainable** (clear naming, documentation)

This is a class-leading schema that will scale with the 365 Alignment Program.

