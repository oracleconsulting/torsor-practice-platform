# TeamAssessmentInsights Component Refactoring Plan

## Current State
- **File:** `src/pages/accountancy/admin/TeamAssessmentInsights.tsx`
- **Lines:** 2,603
- **Problem:** Massive monolithic component with data loading, calculations, and rendering all in one file

## Refactoring Strategy

### Split into 4 Main Components:

#### 1. **TeamAssessmentOverview.tsx** (~400 lines)
**Responsibility:** Overview tab - completion status and key metrics

**Props:**
```typescript
interface TeamAssessmentOverviewProps {
  loading: boolean;
  completionStatus: AssessmentCompletion[];
  teamMembers: TeamMember[];
}
```

**Contents:**
- Assessment completion grid
- Overall completion metrics
- Individual member completion status
- Team readiness summary

---

#### 2. **TeamStrategicInsights.tsx** (~600 lines)
**Responsibility:** Strategic tab - AI-powered role-fit and composition analysis

**Props:**
```typescript
interface TeamStrategicInsightsProps {
  loading: boolean;
  individualInsights: AssessmentInsight[];
  strategicTeamInsight: TeamCompositionInsight | null;
  onCalculate: () => Promise<void>;
  calculating: boolean;
}
```

**Contents:**
- Individual role-fit analysis table
- Team composition strategic overview
- Red flags and recommendations
- AI-generated insights

---

#### 3. **TeamCompositionCharts.tsx** (~800 lines)
**Responsibility:** Composition tab - detailed charts and visualizations

**Props:**
```typescript
interface TeamCompositionChartsProps {
  loading: boolean;
  teamComposition: TeamComposition | null;
  teamDynamics: TeamDynamics | null;
  gapAnalysis: string | null;
  compositionAnalysis: string | null;
  onGenerateGapAnalysis: () => Promise<void>;
  onGenerateComposition: () => Promise<void>;
  generatingGap: boolean;
  generatingComposition: boolean;
}
```

**Contents:**
- Working preferences distribution charts
- Belbin roles charts
- Motivational drivers charts
- EQ distribution
- Conflict styles
- VARK learning styles
- OCEAN personality radar
- Team dynamics metrics

---

#### 4. **TeamAssessmentInsights.tsx** (~400 lines) ← Main container
**Responsibility:** Data loading, state management, tab coordination

**Keeps:**
- All `useState` hooks
- All data loading functions (`loadTeamData`, `loadCompletionStatus`, etc.)
- All calculation functions
- Tab navigation structure
- Delegates rendering to sub-components

---

### 5. **Shared Types** - New file
**File:** `src/types/team-insights.ts`

**Exports:**
```typescript
export interface TeamMember { ... }
export interface AssessmentCompletion { ... }
export interface TeamComposition { ... }
export interface TeamDynamics { ... }
export interface DevelopmentPriorities { ... }
```

---

## Implementation Steps

### Step 1: Extract Types
1. Create `src/types/team-insights.ts`
2. Move all interfaces
3. Update imports in main file

### Step 2: Extract TeamAssessmentOverview
1. Create `src/components/accountancy/team/insights/TeamAssessmentOverview.tsx`
2. Move Overview tab JSX
3. Move helper functions (getCompletionColor, etc.)
4. Import in main file

### Step 3: Extract TeamStrategicInsights
1. Create `src/components/accountancy/team/insights/TeamStrategicInsights.tsx`
2. Move Strategic tab JSX
3. Move role-fit display logic
4. Import in main file

### Step 4: Extract TeamCompositionCharts
1. Create `src/components/accountancy/team/insights/TeamCompositionCharts.tsx`
2. Move Composition tab JSX
3. Move all chart components
4. Move chart helper functions
5. Import in main file

### Step 5: Clean up Main File
1. Keep only data loading and state management
2. Update imports
3. Render sub-components with props
4. Test

---

## Expected Results

### Before:
```
TeamAssessmentInsights.tsx: 2,603 lines
```

### After:
```
team-insights.ts: ~150 lines (types)
TeamAssessmentOverview.tsx: ~400 lines
TeamStrategicInsights.tsx: ~600 lines
TeamCompositionCharts.tsx: ~800 lines
TeamAssessmentInsights.tsx: ~400 lines (container)
```

**Total:** ~2,350 lines distributed across 5 focused files

### Benefits:
- ✅ Each file under 800 lines
- ✅ Clear separation of concerns
- ✅ Easier to test individual components
- ✅ Reduced cognitive load
- ✅ Easier to maintain
- ✅ Reusable chart components
- ✅ Better code organization

---

## Next: Start with Types Extraction

