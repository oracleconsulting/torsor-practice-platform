# Skills Data Architecture - Single Source of Truth

## ✅ DEFINITIVE DATA SOURCE

**The `invitations` table is the ONLY source of truth for skill assessment data.**

### Schema
```sql
invitations {
  id: UUID (PK)
  practice_id: UUID (FK)
  email: TEXT (unique per practice)
  name: TEXT
  role: TEXT
  status: TEXT ('accepted', 'pending', etc.)
  assessment_data: JSONB[] -- Array of skill assessments
  created_at: TIMESTAMP
  accepted_at: TIMESTAMP
}
```

### Assessment Data Structure (JSONB)
```json
[
  {
    "skill_id": "uuid",
    "current_level": 1-5,
    "interest_level": 1-5,
    "notes": "optional text"
  },
  // ... 111 skills total
]
```

## 🚫 DEPRECATED TABLES

**DO NOT USE:**
- `skill_assessments` table - DEPRECATED, unreliable, outdated IDs
- Any other assessment storage - does not exist

## 📋 Frontend Data Loading Pattern

### Step 1: Get Practice Member Info
```typescript
const { data: member } = await supabase
  .from('practice_members')
  .select('id, email, name, role, practice_id')
  .eq('user_id', user?.id)
  .single();
```

### Step 2: Get Assessment Data from Invitations
```typescript
const { data: invitation } = await supabase
  .from('invitations')
  .select('assessment_data, email, status')
  .ilike('email', member.email) // ⚠️ ALWAYS use .ilike() for case-insensitive
  .eq('practice_id', member.practice_id)
  .eq('status', 'accepted')
  .single();
```

### Step 3: Get Skills Metadata
```typescript
const { data: allSkills } = await supabase
  .from('skills')
  .select('id, name, category, description');
  // ⚠️ NO practice_id filter - skills table is global
```

### Step 4: Transform and Enrich
```typescript
const assessments = (invitation.assessment_data as any[]).map(skill => {
  const skillInfo = skillsMap[skill.skill_id];
  return {
    skill_id: skill.skill_id,
    skill_name: skillInfo.name,
    category: skillInfo.category,
    current_level: skill.current_level || 0,
    interest_level: skill.interest_level || 3,
    description: skillInfo.description
  };
});
```

## ⚠️ CRITICAL RULES

1. **Email Matching**: ALWAYS use `.ilike()` for email queries (case-insensitive)
   - ❌ `.eq('email', email)` - will fail on case mismatches
   - ✅ `.ilike('email', email)` - handles Ltyrrell vs ltyrrell

2. **Skills Table**: NO practice_id filter
   - ❌ `.eq('practice_id', id)` - column doesn't exist
   - ✅ Load all skills, filter client-side if needed

3. **Field Names**: Use snake_case in JSONB
   - `skill_id`, `current_level`, `interest_level` (NOT camelCase)

4. **No Migrations**: Never copy data TO `skill_assessments`
   - Read directly from `invitations.assessment_data`
   - Update directly in `invitations.assessment_data`

5. **Practice Members**: Required for UI display
   - `invitations` has assessment data
   - `practice_members` has user metadata (name, role, etc.)
   - Join on email (case-insensitive)

## 📁 Files Following This Pattern

✅ **Correct Implementation:**
- `/src/pages/accountancy/team/MySkillsHeatmap.tsx`
- `/src/pages/accountancy/team/TeamMemberDashboard.tsx`
- `/src/pages/accountancy/team/SkillsDashboardV2Page.tsx`

❌ **DO NOT USE as examples:**
- Any file querying `skill_assessments`
- Any migration scripts

## 🔄 Data Updates

When a user completes/updates their assessment:
1. Update `invitations.assessment_data` JSONB directly
2. Set `invitations.status = 'accepted'`
3. Set `invitations.accepted_at = NOW()`
4. Frontend will automatically reflect changes on next load

## 🎯 Assessment Count Formula

**Expected total assessments:**
```
Total = Number of Active Members × 111 skills
16 members × 111 skills = 1776 assessments
```

If you see fewer, check:
- Missing `practice_members` records
- Email case mismatches
- `status != 'accepted'` in invitations
- Frontend pagination limits (should use `.range()` loop for >1000)

---

**Last Updated:** 2025-10-29
**Status:** ✅ PRODUCTION READY

