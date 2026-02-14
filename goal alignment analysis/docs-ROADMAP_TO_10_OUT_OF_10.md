# TORSOR PLATFORM: ROADMAP TO 10/10
## Based on December 3, 2025 Architecture Assessment

---

# CURRENT SCORES

| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| **Architecture & Structure** | 7/10 | 10/10 | 3 points |
| **Security** | 8/10 | 10/10 | 2 points |
| **Scalability** | 6/10 | 10/10 | 4 points |
| **Code Quality** | 5/10 | 10/10 | 5 points |
| **LLM Integration** | 8/10 | 10/10 | 2 points |
| **Competitive Position** | 9/10 | 10/10 | 1 point |

---

# PHASE 1: IMMEDIATE ACTIONS (This Week)
## Priority: P0 - Critical for Performance

### 1.1 Database Indexes (Scalability +2)

```sql
-- Run in Supabase SQL Editor
-- scripts/add-performance-indexes.sql

-- Skill assessments - most frequently queried
CREATE INDEX IF NOT EXISTS idx_skill_assessments_member 
  ON skill_assessments(member_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skill 
  ON skill_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_composite 
  ON skill_assessments(member_id, skill_id, current_level);

-- Practice members - team queries
CREATE INDEX IF NOT EXISTS idx_practice_members_practice_type 
  ON practice_members(practice_id, member_type);
CREATE INDEX IF NOT EXISTS idx_practice_members_user 
  ON practice_members(user_id);

-- Client assessments - frequent filtering
CREATE INDEX IF NOT EXISTS idx_client_assessments_client 
  ON client_assessments(client_id, assessment_type);
CREATE INDEX IF NOT EXISTS idx_client_assessments_practice 
  ON client_assessments(practice_id, status);

-- Client roadmaps - active lookup
CREATE INDEX IF NOT EXISTS idx_client_roadmaps_active 
  ON client_roadmaps(client_id, is_active) WHERE is_active = true;

-- LLM execution history - cost tracking
CREATE INDEX IF NOT EXISTS idx_llm_history_created 
  ON llm_execution_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_history_model 
  ON llm_execution_history(model_used, created_at DESC);

-- Document embeddings - vector search optimization
CREATE INDEX IF NOT EXISTS idx_embeddings_client 
  ON document_embeddings(client_id);

-- Assessment questions - frequent lookups
CREATE INDEX IF NOT EXISTS idx_assessment_questions_service 
  ON assessment_questions(service_line_code, is_active, display_order);
```

**Expected Impact:** 30-50% faster queries

---

### 1.2 LLM Response Caching (LLM +1, Cost -40%)

```typescript
// New Edge Function: supabase/functions/cached-llm-call/index.ts

// 1. Create cache table
/*
CREATE TABLE llm_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text UNIQUE NOT NULL,
  model text NOT NULL,
  response jsonb NOT NULL,
  tokens_used int,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  hit_count int DEFAULT 0
);

CREATE INDEX idx_cache_hash ON llm_response_cache(prompt_hash);
CREATE INDEX idx_cache_expires ON llm_response_cache(expires_at);
*/

// 2. Before LLM call, check cache
const promptHash = await crypto.subtle.digest('SHA-256', 
  new TextEncoder().encode(prompt + model));
const hashHex = Array.from(new Uint8Array(promptHash))
  .map(b => b.toString(16).padStart(2, '0')).join('');

const { data: cached } = await supabase
  .from('llm_response_cache')
  .select('response')
  .eq('prompt_hash', hashHex)
  .gt('expires_at', new Date().toISOString())
  .single();

if (cached) {
  // Update hit count and return cached
  await supabase.from('llm_response_cache')
    .update({ hit_count: supabase.sql`hit_count + 1` })
    .eq('prompt_hash', hashHex);
  return cached.response;
}

// 3. Make LLM call and cache response
const response = await callOpenRouter(prompt, model);
await supabase.from('llm_response_cache').insert({
  prompt_hash: hashHex,
  model,
  response,
  tokens_used: response.usage?.total_tokens
});
```

**Expected Impact:** 40-60% LLM cost reduction

---

### 1.3 Rate Limiting on Edge Functions (Security +1)

```typescript
// Add to every Edge Function at the top

const RATE_LIMITS = {
  'generate-roadmap': { requests: 5, window: 3600 },      // 5/hour
  'generate-value-analysis': { requests: 10, window: 3600 }, // 10/hour
  'chat-completion': { requests: 50, window: 3600 },      // 50/hour
  'default': { requests: 100, window: 3600 }              // 100/hour
};

async function checkRateLimit(userId: string, functionName: string) {
  const limit = RATE_LIMITS[functionName] || RATE_LIMITS.default;
  const key = `rate:${functionName}:${userId}`;
  
  const { data, error } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', key)
    .single();
    
  const now = Date.now();
  const windowStart = data?.window_start || now;
  
  if (now - windowStart > limit.window * 1000) {
    // Reset window
    await supabase.from('rate_limits').upsert({
      key, count: 1, window_start: now
    });
    return true;
  }
  
  if (data?.count >= limit.requests) {
    return false; // Rate limited
  }
  
  await supabase.from('rate_limits')
    .update({ count: (data?.count || 0) + 1 })
    .eq('key', key);
  return true;
}

// Usage in Edge Function:
if (!await checkRateLimit(userId, 'generate-roadmap')) {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), 
    { status: 429 });
}
```

---

# PHASE 2: SHORT-TERM (Next 30 Days)
## Priority: P1 - Code Quality & Security

### 2.1 Squash Migration Files (Code Quality +2)

**Current:** 78 migration files = hard to track, prone to conflicts

**Target:** 1 consolidated schema + versioned migrations

```bash
# Step 1: Export current production schema
pg_dump --schema-only $DATABASE_URL > scripts/00_production_schema.sql

# Step 2: Archive old migrations
mkdir scripts/archive_migrations
mv scripts/*.sql scripts/archive_migrations/

# Step 3: Create new structure
# scripts/
#   00_init.sql (full schema)
#   migrations/
#     001_add_delivery_management.sql
#     002_add_phase_activities.sql

# Step 4: Add migration tracking table
CREATE TABLE schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz DEFAULT now()
);
```

---

### 2.2 Audit Logging (Security +1)

```sql
-- Create audit log table
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,           -- 'create', 'update', 'delete', 'view'
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Partition by month for performance
CREATE TABLE audit_log_2024_12 PARTITION OF audit_log
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Create audit trigger function
CREATE OR REPLACE FUNCTION log_audit() RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_log (
    practice_id, user_id, action, table_name, record_id,
    old_values, new_values
  ) VALUES (
    COALESCE(NEW.practice_id, OLD.practice_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to critical tables
CREATE TRIGGER audit_practice_members
  AFTER INSERT OR UPDATE OR DELETE ON practice_members
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_client_assessments
  AFTER INSERT OR UPDATE OR DELETE ON client_assessments
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_client_roadmaps
  AFTER INSERT OR UPDATE OR DELETE ON client_roadmaps
  FOR EACH ROW EXECUTE FUNCTION log_audit();
```

---

### 2.3 Route Missing Features (Architecture +1)

**Identified Missing Routes:**

| Feature | Status | Action |
|---------|--------|--------|
| Mentoring Hub | Built, not routed | Add to navigation |
| CPD Tracker | Built, not routed | Add to Skills section |
| Training Plans | Built, not routed | Add to Skills section |
| Service Diagnostics Results | Built, partial | Complete routing |
| Knowledge Base Admin | Schema exists | Build UI |

```typescript
// Update Navigation.tsx to expose all features
const NAV_ITEMS = [
  // Current
  { page: 'heatmap', label: 'Skills Heatmap', icon: Grid },
  { page: 'management', label: 'Skills Management', icon: Settings },
  { page: 'readiness', label: 'Service Readiness', icon: Target },
  { page: 'analytics', label: 'Team Analytics', icon: BarChart },
  { page: 'clients', label: 'Client Services', icon: Users },
  { page: 'assessments', label: 'Assessments', icon: ClipboardList },
  { page: 'delivery', label: 'Delivery Teams', icon: Truck },
  { page: 'config', label: 'Service Config', icon: Cog },
  
  // ADD THESE:
  { page: 'training', label: 'Training Plans', icon: BookOpen },
  { page: 'cpd', label: 'CPD Tracker', icon: Award },
  { page: 'mentoring', label: 'Mentoring', icon: Users2 },
  { page: 'knowledge', label: 'Knowledge Base', icon: Database },
];
```

---

### 2.4 Retention Risk Scoring (Competitive +1)

```typescript
// New: src/lib/retentionRisk.ts

interface RetentionRiskFactors {
  motivationalDriversMatch: number;    // 0-100
  workingPreferencesMatch: number;     // 0-100
  roleSkillFit: number;                // 0-100
  lastAssessmentDays: number;          // Days since last assessment
  performanceTrend: 'up' | 'flat' | 'down';
}

function calculateRetentionRisk(factors: RetentionRiskFactors): {
  score: number;  // 0-100 (higher = more risk)
  level: 'low' | 'medium' | 'high' | 'critical';
  drivers: string[];
} {
  let score = 0;
  const drivers: string[] = [];
  
  // Motivational alignment (30% weight)
  if (factors.motivationalDriversMatch < 50) {
    score += 30;
    drivers.push('Motivational drivers misaligned with role');
  } else if (factors.motivationalDriversMatch < 70) {
    score += 15;
  }
  
  // Working preferences (25% weight)
  if (factors.workingPreferencesMatch < 50) {
    score += 25;
    drivers.push('Working style not accommodated');
  } else if (factors.workingPreferencesMatch < 70) {
    score += 12;
  }
  
  // Role-skill fit (25% weight)
  if (factors.roleSkillFit < 60) {
    score += 25;
    drivers.push('Skills underutilized or overextended');
  } else if (factors.roleSkillFit < 80) {
    score += 10;
  }
  
  // Assessment freshness (10% weight)
  if (factors.lastAssessmentDays > 180) {
    score += 10;
    drivers.push('Assessments outdated (>6 months)');
  } else if (factors.lastAssessmentDays > 90) {
    score += 5;
  }
  
  // Performance trend (10% weight)
  if (factors.performanceTrend === 'down') {
    score += 10;
    drivers.push('Declining performance trend');
  }
  
  const level = score >= 70 ? 'critical' :
                score >= 50 ? 'high' :
                score >= 30 ? 'medium' : 'low';
  
  return { score, level, drivers };
}
```

---

# PHASE 3: MEDIUM-TERM (60-90 Days)
## Priority: P2 - Enterprise Readiness

### 3.1 Table Partitioning for Scale (Scalability +1)

```sql
-- Partition llm_execution_history by month
ALTER TABLE llm_execution_history RENAME TO llm_execution_history_old;

CREATE TABLE llm_execution_history (
  id uuid DEFAULT gen_random_uuid(),
  practice_id uuid,
  function_name text,
  model_used text,
  prompt_tokens int,
  completion_tokens int,
  total_cost numeric,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE llm_history_2024_12 PARTITION OF llm_execution_history
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE llm_history_2025_01 PARTITION OF llm_execution_history
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- Add more as needed

-- Migrate data
INSERT INTO llm_execution_history SELECT * FROM llm_execution_history_old;
DROP TABLE llm_execution_history_old;

-- Auto-create partitions function
CREATE OR REPLACE FUNCTION create_monthly_partition() RETURNS void AS $$
DECLARE
  next_month date := date_trunc('month', now()) + interval '1 month';
  partition_name text := 'llm_history_' || to_char(next_month, 'YYYY_MM');
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF llm_execution_history
     FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    next_month,
    next_month + interval '1 month'
  );
END;
$$ LANGUAGE plpgsql;
```

---

### 3.2 Bundle Size Optimization (Architecture +1)

```typescript
// vite.config.ts - Add code splitting

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          
          // Split by route
          'page-skills': [
            './src/pages/admin/SkillsHeatmapPage.tsx',
            './src/pages/admin/SkillsManagementPage.tsx'
          ],
          'page-clients': [
            './src/pages/admin/ClientServicesPage.tsx'
          ],
          'page-delivery': [
            './src/pages/admin/DeliveryManagementPage.tsx',
            './src/pages/admin/ServiceConfigPage.tsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500 // Warn on chunks > 500KB
  }
});

// Add lazy loading for routes
const SkillsHeatmapPage = lazy(() => import('./pages/admin/SkillsHeatmapPage'));
const ClientServicesPage = lazy(() => import('./pages/admin/ClientServicesPage'));
// ... etc
```

**Target:** Reduce initial bundle from ~5MB to <1MB

---

### 3.3 GDPR Data Export (Security +1)

```typescript
// New Edge Function: export-user-data

async function exportUserData(userId: string) {
  const supabase = createClient(/* service role */);
  
  // Gather all user data
  const { data: member } = await supabase
    .from('practice_members')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  const { data: assessments } = await supabase
    .from('client_assessments')
    .select('*')
    .eq('client_id', member.id);
    
  const { data: roadmaps } = await supabase
    .from('client_roadmaps')
    .select('*')
    .eq('client_id', member.id);
    
  const { data: tasks } = await supabase
    .from('client_tasks')
    .select('*')
    .eq('client_id', member.id);
    
  // Compile export
  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: userId,
      email: member.email,
      name: member.name
    },
    assessments,
    roadmaps,
    tasks,
    // Add all relevant data
  };
  
  // Store export and notify user
  const { data: file } = await supabase.storage
    .from('exports')
    .upload(`${userId}/data_export_${Date.now()}.json`, 
      JSON.stringify(exportData, null, 2));
      
  // Send email with download link
  await sendEmail(member.email, 'Your Data Export', {
    downloadUrl: file.signedUrl
  });
  
  return { success: true };
}
```

---

### 3.4 Streaming LLM Responses (LLM +1)

```typescript
// Update generate-roadmap to use streaming

import { createParser } from 'eventsource-parser';

async function* streamLLMResponse(prompt: string, model: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true  // Enable streaming
    })
  });
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
    
    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      
      const parsed = JSON.parse(data);
      const content = parsed.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}

// Client-side consumption with Server-Sent Events
export async function generateRoadmapStreaming(clientId: string) {
  const eventSource = new EventSource(
    `${SUPABASE_URL}/functions/v1/generate-roadmap-stream?clientId=${clientId}`
  );
  
  eventSource.onmessage = (event) => {
    // Update UI progressively
    appendToRoadmap(event.data);
  };
}
```

---

# PHASE 4: CODE CONSOLIDATION
## Target: 290k → 150k LOC (48% reduction)

### 4.1 Remove Duplicate Implementations

| Duplicate | Files | Action |
|-----------|-------|--------|
| Assessment logic | 6 files | Consolidate to 1 hook |
| Auth context | 3 files | Use shared package |
| Supabase client | 4 files | Use shared package |
| Type definitions | Scattered | Move to packages/shared |

### 4.2 Archive Non-Core Features for V1

| Feature | LOC | Action |
|---------|-----|--------|
| Gamification | ~20k | Archive to `_archive/` |
| Outreach System | ~15k | Archive |
| Legacy Oracle Server | ~40k | Archive (replaced by Edge Functions) |

### 4.3 Remove Unused Code

```bash
# Find unused exports
npx ts-prune src/

# Find dead code
npx knip

# Remove unused dependencies
npx depcheck
```

---

# SUCCESS METRICS

## Weekly Tracking

| Metric | Current | Week 1 | Week 4 | Week 8 |
|--------|---------|--------|--------|--------|
| LOC | 290k | 280k | 200k | 150k |
| Migration Files | 78 | 78 | 1 | 1 |
| LLM Cost/Workflow | £2-5 | £1.50-3 | £0.80-2 | £0.80-2 |
| Initial Bundle | ~5MB | ~4MB | ~2MB | <1MB |
| Query P95 | ? | -30% | -40% | -50% |
| Feature Visibility | 60% | 75% | 90% | 100% |

## Score Progression

| Category | Now | +2wk | +4wk | +8wk |
|----------|-----|------|------|------|
| Architecture | 7 | 8 | 9 | 10 |
| Security | 8 | 9 | 10 | 10 |
| Scalability | 6 | 8 | 9 | 10 |
| Code Quality | 5 | 6 | 8 | 10 |
| LLM Integration | 8 | 9 | 10 | 10 |
| Competitive | 9 | 9 | 10 | 10 |

---

# IMMEDIATE NEXT STEPS (TODAY)

1. **Run database indexes script** (15 mins)
2. **Create LLM cache table** (10 mins)
3. **Add rate limiting to top 3 Edge Functions** (30 mins)
4. **Start migration squash** (2 hours)

---

*Generated from December 3, 2025 Architecture Assessment*
*Target: Market-ready in 8-10 weeks*

