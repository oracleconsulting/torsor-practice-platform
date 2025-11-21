# Training Plan & CPD Improvements - Implementation Plan

## Issues Identified

### 1. **CPD Recommendations Not Working** 🔴 CRITICAL
- Console shows: "Query returned: 0 assessments"
- MySkillsComparison works fine with same data
- Likely RLS policy or query issue

### 2. **Training Plan Unrealistic** 🟡 HIGH
- Suggesting 20-hour courses over 5 weeks
- Not appropriate for busy professionals
- Not linked to CPD library or knowledge base

### 3. **Missing Integrations** 🟡 HIGH
- Not linked to CPD recommendations
- Not linked to CPD library
- Not linked to knowledge base (to be populated)

### 4. **Missing Features** 🟡 HIGH
- No "Send to Manager" functionality
- No reporting line integration
- No manager review workflow

### 5. **CPD Structure Not Reflected** 🟢 MEDIUM
- 24 defined hours (2hrs/month in work time)
- 16 personal hours
- Needs to be clear in recommendations

---

## Implementation Phases

### ✅ PHASE 1: DIAGNOSTICS & PROMPT (COMPLETE)

**Status**: Deployed

**Changes Made**:
1. Enhanced CPD diagnostics with detailed logging
2. Updated training plan prompt to be realistic:
   - 3-4 month focused bursts
   - Max 10 hours total
   - 1-3 hour activities
   - Mix of defined vs personal hours

**Files**:
- `src/lib/api/cpd-skills-bridge.ts` - Enhanced diagnostics
- `UPDATE_TRAINING_PROMPT_REALISTIC.sql` - New prompt

**Next Steps**:
- Run SQL script in Supabase
- Test CPD recommendations
- Check console logs for diagnostic info

---

### 🔧 PHASE 2: FIX CPD RECOMMENDATIONS

**Priority**: CRITICAL  
**Status**: Pending diagnostic results

**Potential Issues**:
1. **RLS Policy** - May be blocking access to skill_assessments
2. **Column Name Mismatch** - team_member_id vs practice_member_id
3. **Data Source** - Skills may be in different table

**Diagnostic Plan**:
1. Check console logs from enhanced diagnostics
2. Identify root cause
3. Implement fix based on findings

**Possible Fixes**:
```sql
-- Option A: RLS Policy Fix
CREATE POLICY "Members can view own skill assessments" ON skill_assessments
FOR SELECT USING (
  team_member_id = (
    SELECT id FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

-- Option B: Check if data is in invitations table instead
-- (as seen in SkillsDashboardV2Page.tsx)
SELECT assessment_data FROM invitations WHERE email = ?;
```

---

### 🔗 PHASE 3: INTEGRATE WITH EXISTING DATA

**Priority**: HIGH  
**Status**: Ready to implement after Phase 2

#### 3A. Link Training Plan to CPD Recommendations

**Current State**:
- Training plan generates generic recommendations
- CPD recommendations exist separately
- No connection between them

**Implementation**:
```typescript
// In generateTrainingNarrative function
// 1. Fetch CPD recommendations for member
const { data: cpdRecs } = await supabase
  .from('cpd_recommendations')
  .select('*')
  .eq('member_id', memberId)
  .order('priority_score', { ascending: false })
  .limit(5);

// 2. Pass to LLM prompt
const userPrompt = applyTemplate(promptConfig.user_prompt_template, {
  ...existing_vars,
  cpd_recommendations: cpdRecs?.map(r => 
    `${r.recommended_cpd_type} for ${r.skill_name} (${r.estimated_hours}hrs)`
  ).join('\n') || 'None generated yet'
});
```

#### 3B. Link to CPD Library

**Current State**:
- CPD library exists (to be confirmed)
- Not referenced in training plans

**Implementation**:
```typescript
// Query CPD library for relevant courses
const { data: cpdCourses } = await supabase
  .from('cpd_library') // or whatever the table is called
  .select('*')
  .or(`category.in.(${categories}),skills.cs.{${skillIds}})`)
  .limit(10);

// Add to prompt template
cpd_library_courses: cpdCourses?.map(c => 
  `${c.title} (${c.duration}hrs) - ${c.provider}`
).join('\n') || 'Library being populated'
```

#### 3C. Link to Knowledge Base

**Current State**:
- Knowledge base to be populated in next couple weeks
- Table structure unknown

**Implementation** (when ready):
```typescript
// Query knowledge base for relevant resources
const { data: resources } = await supabase
  .from('knowledge_base') // table name TBD
  .select('*')
  .or(`category.in.(${categories}),tags.cs.{${skillTags}})`)
  .limit(10);

// Add to prompt
knowledge_base_resources: resources?.map(r =>
  `${r.title} - ${r.type} (${r.estimated_reading_time})`
).join('\n')
```

---

### 👥 PHASE 4: MANAGER REVIEW FEATURE

**Priority**: HIGH  
**Status**: Requires design decisions

#### 4A. Database Schema

```sql
-- Create training_plan_approvals table
CREATE TABLE training_plan_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_member_id UUID REFERENCES practice_members(id),
  manager_id UUID REFERENCES practice_members(id),
  training_plan_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'revised')),
  manager_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (practice_member_id) REFERENCES practice_members(id),
  FOREIGN KEY (manager_id) REFERENCES practice_members(id)
);

-- Add RLS policies
ALTER TABLE training_plan_approvals ENABLE ROW LEVEL SECURITY;

-- Members can view own submissions
CREATE POLICY "Members view own plan submissions" ON training_plan_approvals
FOR SELECT USING (
  practice_member_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
);

-- Managers can view their direct reports' submissions
CREATE POLICY "Managers view direct reports plans" ON training_plan_approvals
FOR SELECT USING (
  manager_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
);
```

#### 4B. UI Components

**Send to Manager Button**:
```tsx
// In CPDSkillsBridgePage.tsx
const handleSendToManager = async () => {
  // 1. Get manager_id from practice_members.reports_to
  const { data: member } = await supabase
    .from('practice_members')
    .select('reports_to')
    .eq('id', memberId)
    .single();
  
  if (!member?.reports_to) {
    toast.error('No manager assigned in reporting structure');
    return;
  }
  
  // 2. Save training plan for approval
  const { error } = await supabase
    .from('training_plan_approvals')
    .insert({
      practice_member_id: memberId,
      manager_id: member.reports_to,
      training_plan_content: trainingNarrative,
      status: 'pending'
    });
  
  if (!error) {
    toast.success('Training plan sent to manager for review!');
    // Optional: Send email notification to manager
  }
};
```

**Manager Review UI**:
```tsx
// New component: ManagerTrainingPlanReviews.tsx
// Shows pending training plans for direct reports
// Allows approve/reject with notes
```

#### 4C. Reporting Lines

**Required**:
- `practice_members.reports_to` column (UUID reference to manager)
- Reporting structure must be set up in team management

**Check**:
```sql
-- Verify reports_to column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'practice_members' AND column_name = 'reports_to';

-- If not exists, add it:
ALTER TABLE practice_members ADD COLUMN reports_to UUID REFERENCES practice_members(id);
```

---

### 📊 PHASE 5: CPD STRUCTURE VISIBILITY

**Priority**: MEDIUM  
**Status**: Ready to implement

#### UI Changes

**CPD Overview Stats**:
```tsx
// Update CPDOverview.tsx to show breakdown
<div className="grid grid-cols-3 gap-4">
  <Card>
    <CardHeader>
      <CardTitle>Defined Hours</CardTitle>
      <CardDescription>In work time (2hrs/month)</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{determinedCompleted}/24h</p>
      <Progress value={(determinedCompleted / 24) * 100} />
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Personal Hours</CardTitle>
      <CardDescription>Own time</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{selfAllocatedCompleted}/16h</p>
      <Progress value={(selfAllocatedCompleted / 16) * 100} />
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Total</CardTitle>
      <CardDescription>Annual requirement</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{completedHours}/40h</p>
      <Progress value={(completedHours / 40) * 100} />
    </CardContent>
  </Card>
</div>
```

**CPD Logging**:
```tsx
// Add radio buttons to QuickCPDLogger for type selection
<RadioGroup value={cpdType} onValueChange={setCpdType}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="defined" id="defined" />
    <Label htmlFor="defined">
      Defined Hours (In work time)
    </Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="personal" id="personal" />
    <Label htmlFor="personal">
      Personal Hours (Own time)
    </Label>
  </div>
</RadioGroup>
```

---

## Testing Checklist

### Phase 1 (Current)
- [ ] Deploy code to Railway
- [ ] Run UPDATE_TRAINING_PROMPT_REALISTIC.sql in Supabase
- [ ] Test CPD recommendations - check console logs
- [ ] Identify root cause from diagnostics
- [ ] Report findings

### Phase 2
- [ ] Implement fix based on diagnostic results
- [ ] Test CPD recommendations generate successfully
- [ ] Verify recommendations are realistic

### Phase 3
- [ ] Training plan includes CPD recommendations
- [ ] Training plan references CPD library
- [ ] (Later) Training plan references knowledge base

### Phase 4
- [ ] "Send to Manager" button appears
- [ ] Plan saves to approvals table
- [ ] Manager receives notification
- [ ] Manager can review/approve plans

### Phase 5
- [ ] CPD hours split shown (24 defined + 16 personal)
- [ ] Logging allows type selection
- [ ] Stats reflect correct breakdown

---

## Immediate Actions Required

### 1. **User: Run SQL Script** ⚠️
```bash
# In Supabase SQL Editor:
# Copy contents of UPDATE_TRAINING_PROMPT_REALISTIC.sql
# Paste and run
```

### 2. **User: Test CPD Recommendations** 🔍
```bash
# In browser:
# 1. Hard refresh (Cmd+Shift+R)
# 2. Navigate to CPD Overview
# 3. Click "Generate Recommendations"
# 4. Open Console (F12)
# 5. Look for [CPD] diagnostic logs
# 6. Report back what it shows
```

### 3. **Dev: Await Diagnostic Results** ⏳
Based on console logs, we'll know:
- If assessments exist but query fails (RLS issue)
- If assessments don't exist (data source issue)
- If there's a column mismatch

---

## Questions for User

1. **CPD Library**: What table stores CPD courses/resources?
2. **Knowledge Base**: What will the table structure be? (Can wait until populated)
3. **Reporting Lines**: Does `practice_members` have `reports_to` column?
4. **Manager Portal**: Do managers have a separate view or same portal with different permissions?

---

## Summary

**Current Status**: Phase 1 complete - diagnostic logging deployed

**Blocking Issue**: CPD recommendations returning 0 assessments

**Next Step**: Run SQL script and test CPD recommendations with console open to see diagnostic output

**Timeline**: 
- Phase 2 (Fix CPD): Immediate after diagnostics
- Phase 3 (Integrations): 1-2 days
- Phase 4 (Manager Review): 2-3 days
- Phase 5 (CPD Structure): 1 day

**Total Estimated**: 4-6 days to complete all improvements

