# 🎯 NEW CHAT PROMPT - Complete Phase 3 Refactoring

**Copy and paste this entire message into a new chat to continue:**

---

I need to complete Phase 3 refactoring of the Torsor platform TeamAssessmentInsights component.

## CONTEXT:
**Repository:** `/Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform`  
**Current Branch:** `main`  
**Last Commit:** `a5f6011` (Phase 2 cleanup - 13,456 lines removed)

### What's Been Completed:
- ✅ **Phase 1 & 2:** Massive cleanup (247 files organized, 13k lines removed)
- ✅ **Phase 3 Foundation:**
  - `src/types/team-insights.ts` created (shared interfaces)
  - `src/utils/team-insights/helpers.ts` created (utility functions)
  - `src/components/accountancy/team/insights/OverviewTab.tsx` created (first tab component)

### What Needs Completion:
**Target File:** `src/pages/accountancy/admin/TeamAssessmentInsights.tsx` (2,603 lines - TOO LARGE)

**Goal:** Split into focused, testable components

## YOUR TASK:

### Step 1: Create StrategicTab Component
**File:** `src/components/accountancy/team/insights/StrategicTab.tsx`  
**Size:** ~450 lines  
**Extract:** Lines 1216-1511 from TeamAssessmentInsights.tsx  

**Props Interface:**
```typescript
interface StrategicTabProps {
  loading: boolean;
  individualInsights: AssessmentInsight[];
  strategicTeamInsight: TeamCompositionInsight | null;
  calculatingStrategic: boolean;
  onCalculateStrategic: (force: boolean) => Promise<void>;
}
```

**Content to Include:**
- Strategic Assessment Framework header with Calculate button
- Loading state (calculating spinner)
- Team Health Overview (4 metric cards)
- Individual Role-Fit Analysis table (Advisory, Technical, Hybrid, Leadership scores)
- Team Composition Analysis (Belbin Balance, EQ mapping, Motivational alignment)
- Red flags and development priorities for each member

**Pattern to Follow:** See `OverviewTab.tsx` for structure example

---

### Step 2: Create CompositionTab Component
**File:** `src/components/accountancy/team/insights/CompositionTab.tsx`  
**Size:** ~700 lines  
**Extract:** Lines 1513-2450 from TeamAssessmentInsights.tsx

**Props Interface:**
```typescript
interface CompositionTabProps {
  loading: boolean;
  teamComposition: TeamComposition | null;
  teamDynamics: TeamDynamics | null;
  teamMembers: TeamMember[];
  compositionAnalysis: string | null;
  gapAnalysis: string | null;
  generatingComposition: boolean;
  generatingGap: boolean;
  onGenerateComposition: () => Promise<void>;
  onGenerateGapAnalysis: () => Promise<void>;
}
```

**Content to Include:**
- AI-Generated Team Composition Analysis section
- Communication Style Distribution (Pie Chart)
- Belbin Team Roles (Progress bars with member names)
- EQ Distribution (Bar Chart or simple display for single values)
- Conflict Styles (Charts)
- VARK Learning Styles (Charts)
- OCEAN Personality Radar Chart
- Team Dynamics Metrics (5 progress bars: Communication, Work Style, Role Completion, Motivation, Conflict Resolution)

**Important:**
- Wrap all charts in `<ChartErrorBoundary>`
- Use `validateChartData()` before rendering charts
- Use `getFriendlyName()` for display names
- Use `CHART_COLORS` constant from helpers
- Handle empty/null data gracefully

---

### Step 3: Update Main File
**File:** `src/pages/accountancy/admin/TeamAssessmentInsights.tsx`

**Changes Needed:**

1. **Add Imports:**
```typescript
import { OverviewTab } from '@/components/accountancy/team/insights/OverviewTab';
import { StrategicTab } from '@/components/accountancy/team/insights/StrategicTab';
import { CompositionTab } from '@/components/accountancy/team/insights/CompositionTab';
import type { TeamMember, AssessmentCompletion, TeamComposition, TeamDynamics } from '@/types/team-insights';
```

2. **Remove Duplicate Interfaces** (lines 34-100):
Delete `TeamMember`, `AssessmentCompletion`, `TeamComposition`, `TeamDynamics`, `DevelopmentPriorities` - now in types file

3. **Remove Helper Functions** (lines 124-192):
Delete `displayNames` object and `getFriendlyName` function - now in helpers file

4. **Replace Tab Content** (lines 1140-2450):
Replace the three `<TabsContent>` blocks with:

```typescript
<TabsContent value="overview">
  <OverviewTab
    loading={loading}
    completionStatus={completionStatus}
    teamMembers={teamMembers}
  />
</TabsContent>

<TabsContent value="strategic">
  <StrategicTab
    loading={loading}
    individualInsights={individualInsights}
    strategicTeamInsight={strategicTeamInsight}
    calculatingStrategic={calculatingStrategic}
    onCalculateStrategic={calculateStrategicInsights}
  />
</TabsContent>

<TabsContent value="composition">
  <CompositionTab
    loading={loading}
    teamComposition={teamComposition}
    teamDynamics={teamDynamics}
    teamMembers={teamMembers}
    compositionAnalysis={compositionAnalysis}
    gapAnalysis={gapAnalysis}
    generatingComposition={generatingComposition}
    generatingGap={generatingGapAnalysis}
    onGenerateComposition={generateTeamComposition}
    onGenerateGapAnalysis={generateGapAnalysis}
  />
</TabsContent>
```

**Keep "dynamics", "gaps", and "recommendations" tabs as-is for now**

---

### Step 4: Test Everything

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform

# Check TypeScript
npx tsc --noEmit

# Start dev server
npm run dev

# Test in browser at http://localhost:5173
```

**Test Checklist:**
- [ ] Page loads without errors
- [ ] All 6 tabs switch smoothly
- [ ] Overview tab shows assessment completion
- [ ] Strategic tab "Calculate" button works
- [ ] Composition tab shows all charts
- [ ] No console errors
- [ ] Data displays correctly

---

### Step 5: Commit

```bash
git add .
git commit -m "Phase 3: Split TeamAssessmentInsights into focused components

- Created StrategicTab.tsx (~450 lines)
- Created CompositionTab.tsx (~700 lines)
- Updated TeamAssessmentInsights to use components
- Reduced main file from 2,603 → ~1,100 lines (58% reduction)

Ref: CONTINUE_PHASE_3_REFACTORING.md"

git push origin main
```

---

## EXPECTED RESULTS:

**Before:**
```
TeamAssessmentInsights.tsx: 2,603 lines (MASSIVE, UNMAINTAINABLE)
```

**After:**
```
types/team-insights.ts:              75 lines
utils/team-insights/helpers.ts:     120 lines  
insights/OverviewTab.tsx:           122 lines
insights/StrategicTab.tsx:         ~450 lines
insights/CompositionTab.tsx:       ~700 lines
TeamAssessmentInsights.tsx:      ~1,100 lines
────────────────────────────────────────────
Total: ~2,567 lines in 6 focused, testable files
```

---

## REFERENCE DOCUMENTS:

All details are in: `CONTINUE_PHASE_3_REFACTORING.md`

---

## START HERE:

Please begin by:
1. Reading `src/components/accountancy/team/insights/OverviewTab.tsx` to see the pattern
2. Creating `StrategicTab.tsx` using the structure above
3. Then creating `CompositionTab.tsx`
4. Finally updating the main file

Let's create `StrategicTab.tsx` first.

