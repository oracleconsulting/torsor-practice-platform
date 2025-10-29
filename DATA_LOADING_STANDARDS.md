# DATA LOADING STANDARDS
# These patterns MUST be used consistently across all components

## SINGLE SOURCE OF TRUTH
- `skill_assessments` table is the ONLY source for skill data
- NEVER query `invitations.assessment_data` in frontend
- NEVER fall back to mock/dummy data

## STANDARD QUERIES

### 1. Load Member's Own Skills
```typescript
const { data: assessments, error } = await supabase
  .from('skill_assessments')
  .select(`
    skill_id,
    current_level,
    interest_level,
    assessed_at,
    skills:skill_id (
      id,
      name,
      category,
      description
    )
  `)
  .eq('team_member_id', memberId);
```

### 2. Load Team Skills (Admin View)
```typescript
const { data: assessments, error } = await supabase
  .from('skill_assessments')
  .select(`
    team_member_id,
    skill_id,
    current_level,
    interest_level,
    assessed_at,
    practice_members:team_member_id (
      id,
      name,
      email,
      role
    ),
    skills:skill_id (
      id,
      name,
      category,
      description
    )
  `)
  .in('team_member_id', memberIds);
```

### 3. Load with Pagination (Large Datasets)
```typescript
let allAssessments: any[] = [];
let page = 0;
const pageSize = 1000;
let hasMore = true;

while (hasMore) {
  const start = page * pageSize;
  const end = start + pageSize - 1;
  
  const { data: batch, error } = await supabase
    .from('skill_assessments')
    .select('*')
    .range(start, end);
  
  if (error || !batch || batch.length === 0) {
    hasMore = false;
  } else {
    allAssessments = [...allAssessments, ...batch];
    hasMore = batch.length === pageSize;
    page++;
  }
}
```

## ERROR HANDLING STANDARDS

### DO:
```typescript
if (error) {
  console.error('[Component] Error loading data:', error);
  setError('Failed to load skills. Please refresh.');
  return;
}

if (!data || data.length === 0) {
  console.warn('[Component] No data found for:', memberId);
  setEmpty(true);
  return;
}
```

### DON'T:
```typescript
// ❌ Don't fall back to mock data
if (error) {
  setData(MOCK_DATA); // NO!
}

// ❌ Don't ignore empty data
if (!data) {
  // Silently continue // NO!
}

// ❌ Don't use multiple data sources
const data = await supabase.from('skill_assessments')...
if (!data) {
  const fallback = await supabase.from('invitations')... // NO!
}
```

## LOGGING STANDARDS

### Required Logs (Keep):
- `console.log('[Component] Loading data for:', memberId)`
- `console.log('[Component] Loaded X records')`
- `console.error('[Component] Error:', error)`

### Debug Logs (Remove before production):
- `console.log('[Component] Sample data:', data.slice(0, 3))`
- `console.log('[Component] Level distribution:', counts)`

## DATA TRANSFORMATION STANDARDS

### DO:
```typescript
const formattedData = rawData
  .map(row => ({
    skillId: row.skill_id,
    skillName: row.skills?.name || 'Unknown',
    currentLevel: row.current_level || 0,
    interestLevel: row.interest_level || 3
  }))
  .filter(item => item.skillName !== 'Unknown');
```

### DON'T:
```typescript
// ❌ Don't assume structure
const name = row.skill.name; // May fail if skill is null

// ❌ Don't use magic defaults
currentLevel: row.current_level || 2 // Why 2? Use 0 or document why

// ❌ Don't silently drop data
.filter(item => item.currentLevel > 0) // Loses beginner skills!
```

## COMPONENT LIFECYCLE STANDARDS

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType[]>([]);

useEffect(() => {
  loadData();
}, [dependencies]);

const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Load data...
    
    setData(result);
  } catch (err) {
    console.error('[Component] Load error:', err);
    setError('Failed to load');
  } finally {
    setLoading(false);
  }
};
```

## TESTING CHECKLIST

Before deploying ANY data-related change:

- [ ] Does it work with 0 skills?
- [ ] Does it work with 111 skills?
- [ ] Does it work with 1000+ assessments?
- [ ] Does it handle null/undefined gracefully?
- [ ] Does it log errors clearly?
- [ ] Does it show loading states?
- [ ] Does it show empty states?
- [ ] Does it use consistent queries?
- [ ] Does it avoid mock data?
- [ ] Does it match these standards?

