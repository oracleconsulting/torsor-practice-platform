# Torsor V2 - Next Steps Plan

## What User Wants

Based on the screenshots shown:

### 1. **Skills Management Page** (Category View Style)
- Dark theme with tabs at top
- Categories collapsing/expanding (Technical, Soft Skills, Compliance, Business, etc.)
- Shows average level per category
- Shows # skills below target
- Progress bars for each category
- Matches the beige/orange design shown

### 2. **Service Line Readiness** (Capability Matrix)
- Shows all 15+ advisory services
- For each service:
  - Readiness score (%)
  - Skills required vs. skills we have
  - Who can deliver it
  - What's missing
  - Training needs

### 3. **Real Capability Assessment**
- Use the 1,663 skill assessments we migrated
- Use the advisory services mapping (skill requirements)
- Calculate: Can we deliver this service NOW?
- Identify gaps for development

---

## Technical Approach

### Keep It Simple (Same as Heatmap)

**No complex abstractions. Direct queries. Clean components.**

```typescript
// Example: Service Readiness Hook
export function useServiceReadiness() {
  return useQuery({
    queryKey: ['service-readiness'],
    queryFn: async () => {
      // 1. Get all team members
      const members = await supabase.from('practice_members').select('*');
      
      // 2. Get all their skill assessments
      const assessments = await supabase.from('skill_assessments').select('*');
      
      // 3. Get all skills
      const skills = await supabase.from('skills').select('*');
      
      // 4. Calculate readiness for each service
      return ADVISORY_SERVICES.map(service => {
        const readiness = calculateServiceReadiness(service, members, assessments, skills);
        return { ...service, ...readiness };
      });
    }
  });
}
```

---

## File Structure

```
src/
  pages/
    admin/
      SkillsHeatmapPage.tsx          ✅ Done
      SkillsManagementPage.tsx       🔄 Build this
      ServiceReadinessPage.tsx       🔄 Build this
  components/
    SkillsHeatmapGrid.tsx            ✅ Done
    SkillCategoryCard.tsx            🔄 Build this
    ServiceReadinessCard.tsx         🔄 Build this
  hooks/
    useSkills.ts                     ✅ Done
    useTeamMembers.ts                ✅ Done
    useSkillAssessments.ts           ✅ Done
    useServiceReadiness.ts           🔄 Build this
  lib/
    advisory-services.ts             ✅ Done
    service-calculations.ts          🔄 Build this
```

---

## Implementation Steps

### Step 1: Skills Management Page
- **Style**: Match the dark theme with beige/orange accents
- **Layout**: Tabs at top (Dashboard, Team Assessments, Skills & Development, Analytics, Knowledge)
- **Content**: 
  - Collapsible categories
  - Average level per category
  - Skills below target
  - Progress bars
  - "Add New Skill" button

### Step 2: Service Readiness Page
- **Layout**: Grid of service cards
- **Each card shows**:
  - Service name
  - Readiness % (based on team skills vs. requirements)
  - Skills ready / total skills
  - Team members who can deliver
  - Missing skills (gaps)
  - Training recommendations

### Step 3: Capability Calculation Logic
```typescript
function calculateServiceReadiness(service, members, assessments, skills) {
  // For each required skill:
  const skillReadiness = service.requiredSkills.map(req => {
    // Find team members assessed in this skill
    const relevantAssessments = assessments.filter(a => 
      a.skill_name === req.skillName && 
      a.current_level >= req.minimumLevel
    );
    
    // Count how many meet minimum
    const membersReady = relevantAssessments.length;
    
    return {
      skill: req.skillName,
      required: req.minimumLevel,
      membersReady,
      isCritical: req.criticalToDelivery
    };
  });
  
  // Calculate overall readiness
  const totalSkills = service.requiredSkills.length;
  const skillsMet = skillReadiness.filter(s => s.membersReady > 0).length;
  const readinessPercent = (skillsMet / totalSkills) * 100;
  
  // Identify gaps
  const criticalGaps = skillReadiness.filter(s => 
    s.isCritical && s.membersReady === 0
  );
  
  return {
    readinessPercent,
    skillsMet,
    totalSkills,
    canDeliver: criticalGaps.length === 0,
    gaps: criticalGaps,
    skillReadiness
  };
}
```

---

## Design System

### Colors (from screenshot)
- **Background**: Dark gray/charcoal (#1a1a1a, #2d2d2d)
- **Primary**: Orange/Beige (#e8a87c, #d4915f)
- **Cards**: White with shadows
- **Progress bars**: Orange gradient
- **Text**: Dark gray on light backgrounds

### Components
- Tabs (navigation)
- Cards (white, rounded, shadow)
- Accordion (collapsible categories)
- Progress bars (orange gradient)
- Badges (for counts)
- Buttons (orange primary, white secondary)

---

## Data Flow

```
Database (Supabase)
  ↓
Hooks (useSkills, useTeamMembers, useSkillAssessments)
  ↓
Calculation Functions (calculateServiceReadiness)
  ↓
UI Components (ServiceReadinessCard)
  ↓
User sees: "Management Accounts: 85% ready, 4/5 skills met, Need 1 more person with Financial Reporting Level 4"
```

---

## Key Features

### Skills Management
1. ✅ See all skills grouped by category
2. ✅ Average team level per category
3. ✅ Skills below target highlighted
4. ✅ Add/edit skills
5. ✅ Track progress over time

### Service Readiness
1. ✅ Can we deliver this service NOW?
2. ✅ Who can deliver it?
3. ✅ What skills are we missing?
4. ✅ Training recommendations
5. ✅ Go-to-market decision support

---

## Next Action

I'll build:
1. Skills Management Page (with dark theme)
2. Service Readiness Page (with capability matrix)
3. Update navigation to include both

All using the same simple, direct architecture as the heatmap.

**Estimated: ~1 hour of focused building**

Ready to proceed?

