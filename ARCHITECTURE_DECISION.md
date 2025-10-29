# SIMPLIFIED ARCHITECTURE: invitations TABLE AS SINGLE SOURCE OF TRUTH

## DECISION: Stop using skill_assessments table entirely

### Why this makes sense:
1. ✅ **invitations** table already has ALL assessment data
2. ✅ Data is stable and hasn't been corrupted
3. ✅ Every new team member gets invited and completes assessment
4. ✅ assessment_data JSONB is flexible and complete
5. ❌ **skill_assessments** has been unreliable and prone to corruption

## NEW DATA MODEL:

```
invitations table:
├── email (unique per practice)
├── practice_id
├── status ('accepted')
├── assessment_data (JSONB array of 111 skills)
│   ├── skillName
│   ├── skillId
│   ├── category
│   ├── currentLevel (1-5)
│   ├── interestLevel (1-5)
│   └── assessedAt
└── vark_responses (JSONB - learning preferences)
```

## STANDARD QUERIES:

### 1. Get team member's skills
```typescript
const { data: invitation } = await supabase
  .from('invitations')
  .select('assessment_data, email, status')
  .eq('email', memberEmail)
  .eq('practice_id', practiceId)
  .single();

const skills = invitation?.assessment_data || [];
```

### 2. Get all team skills (admin view)
```typescript
const { data: invitations } = await supabase
  .from('invitations')
  .select('email, assessment_data, status')
  .eq('practice_id', practiceId)
  .eq('status', 'accepted');

// Transform to flat array if needed
const allSkills = invitations.flatMap(inv => 
  inv.assessment_data.map(skill => ({
    ...skill,
    memberEmail: inv.email
  }))
);
```

### 3. Update a skill level
```typescript
// Get current data
const { data: invitation } = await supabase
  .from('invitations')
  .select('assessment_data')
  .eq('email', memberEmail)
  .eq('practice_id', practiceId)
  .single();

// Update specific skill
const updated = invitation.assessment_data.map(skill =>
  skill.skillId === targetSkillId
    ? { ...skill, currentLevel: newLevel, assessedAt: new Date().toISOString() }
    : skill
);

// Save back
await supabase
  .from('invitations')
  .update({ assessment_data: updated })
  .eq('email', memberEmail)
  .eq('practice_id', practiceId);
```

## BENEFITS:

1. **Single source of truth** - no synchronization issues
2. **Stable** - data isn't getting deleted/corrupted
3. **Simple** - no complex migrations or dual-table logic
4. **Flexible** - JSONB allows for easy schema changes
5. **Reliable** - already working and holding all data

## MIGRATION PLAN:

1. ✅ Keep invitations table as-is (it's perfect)
2. ❌ Ignore skill_assessments table (can delete later)
3. 🔄 Update frontend to query invitations directly
4. 🧹 Remove all skill_assessments queries

## FILES TO UPDATE:

- `MySkillsHeatmap.tsx` - query invitations
- `SkillsDashboardV2Page.tsx` - query invitations
- `GapAnalysis.tsx` - query invitations
- `SkillsMatrix.tsx` - query invitations
- Any component using `skill_assessments` table

## IMPLEMENTATION: See MIGRATE_TO_INVITATIONS.md for step-by-step

