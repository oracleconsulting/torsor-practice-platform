# 🎯 Phase 4: Function Cleanup & Custom Hooks - Implementation Plan

**Status**: Hook infrastructure created, ready for full implementation  
**Est. Time Remaining**: 4-6 hours  
**Expected Reduction**: -500 to -700 lines from main component

---

## ✅ Phase 4A: COMPLETED

### Created Files:
1. **`src/hooks/useTeamAssessmentData.ts`** (320 lines)
   - Loads team members, completion status, composition, and dynamics
   - Consolidates 4 separate data loading functions
   - Provides `refreshData()` for manual reload

### Impact:
- ✅ Extracted ~300 lines of data loading logic
- ✅ Created reusable hook for team assessment data
- ✅ Reduced coupling between data loading and UI

---

## 🔄 Phase 4B: TODO - Strategic Insights Hook

### File to Create: `src/hooks/useStrategicInsights.ts` (~400 lines)

**Purpose**: Extract the complex strategic insights calculation logic

**Key Functions to Extract**:
- `calculateStrategicInsights()` - Main calculation function (lines 476-882)
- Cache checking logic (24-hour cache)
- Individual role-fit analysis per member
- Team composition analysis
- Database persistence for caching

**Interface**:
```typescript
interface UseStrategicInsightsReturn {
  individualInsights: AssessmentInsight[];
  strategicTeamInsight: TeamCompositionInsight | null;
  calculatingStrategic: boolean;
  calculateStrategicInsights: (force: boolean) => Promise<void>;
}

export const useStrategicInsights = (teamMembers: TeamMember[])
```

**Benefits**:
- Isolates 400+ lines of calculation logic
- Makes strategic insights reusable across components
- Easier to test and maintain
- Clear separation of concerns

---

## 🔄 Phase 4C: TODO - AI Generation Hook

### File to Create: `src/hooks/useAIGeneration.ts` (~150 lines)

**Purpose**: Extract AI-powered analysis generation

**Key Functions to Extract**:
- `handleGenerateCompositionAnalysis()` (lines 928-948)
- `handleGenerateGapAnalysis()` (lines 906-926)

**Interface**:
```typescript
interface UseAIGenerationReturn {
  compositionAnalysis: string | null;
  gapAnalysis: string | null;
  generatingComposition: boolean;
  generatingGap: boolean;
  generateCompositionAnalysis: () => Promise<void>;
  generateGapAnalysis: () => Promise<void>;
}

export const useAIGeneration = (teamMembers: TeamMember[])
```

**Benefits**:
- Separates AI generation from main component
- Reduces state management complexity
- Easy to add new AI-powered features

---

## 🔄 Phase 4D: TODO - Development Priorities Hook

### File to Create: `src/hooks/useDevelopmentPriorities.ts` (~200 lines)

**Purpose**: Extract development priorities and gap analysis logic

**Key Functions to Extract**:
- `identifyPriorities()` (lines 439-472)
- `calculateBelbinRoleGaps()` (lines 377-437)

**Interface**:
```typescript
interface UseDevelopmentPrioritiesReturn {
  priorities: DevelopmentPriorities | null;
  calculatePriorities: () => Promise<void>;
}

export const useDevelopmentPriorities = (teamMembers: TeamMember[])
```

**Benefits**:
- Isolates priority calculation logic
- Makes gap analysis reusable
- Cleaner separation of business logic

---

## 🔄 Phase 4E: TODO - Update Main Component

### File to Update: `src/pages/accountancy/admin/TeamAssessmentInsights.tsx`

**Changes Required**:

1. **Replace state declarations** (lines 53-70):
```typescript
// BEFORE: 10+ useState declarations
// AFTER: 4 custom hook calls

const { loading, teamMembers, completionStatus, teamComposition, teamDynamics, refreshData } = 
  useTeamAssessmentData();

const { individualInsights, strategicTeamInsight, calculatingStrategic, calculateStrategicInsights } = 
  useStrategicInsights(teamMembers);

const { compositionAnalysis, gapAnalysis, generatingComposition, generatingGap, 
  generateCompositionAnalysis, generateGapAnalysis } = 
  useAIGeneration(teamMembers);

const { priorities } = 
  useDevelopmentPriorities(teamMembers);
```

2. **Remove data loading functions** (lines 77-880):
   - Delete `loadTeamData()`
   - Delete `loadCompletionStatus()`
   - Delete `loadTeamComposition()`
   - Delete `calculateTeamDynamics()`
   - Delete `assessRoleBalance()`
   - Delete `calculateBelbinRoleGaps()`
   - Delete `identifyPriorities()`
   - Delete `calculateStrategicInsights()`
   - Delete `handleGenerateCompositionAnalysis()`
   - Delete `handleGenerateGapAnalysis()`

3. **Keep UI rendering code** (lines 950-1295):
   - All the `<TabsContent>` JSX stays
   - All the chart rendering stays  
   - Only data loading logic gets removed

**Expected Result**:
- Main file: 2,603 lines → ~600-650 lines (75% reduction!)
- Total codebase: +1,070 lines in hooks, -1,953 lines from main file
- **Net reduction**: ~880 lines removed overall

---

## 📊 Phase 4 Summary: Before & After

### Current State (After Phase 3):
```
TeamAssessmentInsights.tsx:      1,150 lines ⚠️
├── State Management:              20 lines
├── Data Loading Functions:       ~600 lines
├── Strategic Calculations:       ~400 lines
├── UI Rendering (Tabs):          ~100 lines
└── Legacy Tab Content:            ~30 lines (dynamics, gaps, recommendations)
```

### Target State (After Phase 4):
```
TeamAssessmentInsights.tsx:       ~650 lines ✅
├── Custom Hook Calls:             30 lines
├── Handler Functions:             50 lines
├── UI Rendering (Tabs):          100 lines
├── Legacy Tab Content:           ~30 lines (dynamics, gaps, recommendations)
└── Event Handlers:                40 lines

NEW HOOKS (reusable):           1,070 lines
├── useTeamAssessmentData.ts:    320 lines ✅
├── useStrategicInsights.ts:     400 lines
├── useAIGeneration.ts:          150 lines
└── useDevelopmentPriorities.ts: 200 lines
```

---

## 🎯 Benefits of Phase 4

1. **Maintainability**: Each hook has a single, clear responsibility
2. **Reusability**: Hooks can be used in other components
3. **Testability**: Easy to test hooks in isolation
4. **Performance**: Can add memoization and optimization
5. **Readability**: Main component is now focused on UI

---

## 🚀 Next Steps to Complete Phase 4

1. **Create `useStrategicInsights` hook** (~2 hours)
   - Extract lines 476-882 from TeamAssessmentInsights.tsx
   - Add caching logic
   - Test with real data

2. **Create `useAIGeneration` hook** (~30 minutes)
   - Extract AI generation handlers
   - Simplify state management

3. **Create `useDevelopmentPriorities` hook** (~1 hour)
   - Extract priority calculation logic
   - Include Belbin gap analysis

4. **Update Main Component** (~1 hour)
   - Replace state with hook calls
   - Remove extracted functions
   - Test all tabs work correctly

5. **Test & Validate** (~30 minutes)
   - Run build
   - Check all tabs load
   - Verify data displays correctly

6. **Commit & Push** (~15 minutes)
   - Git commit with descriptive message
   - Push to repository

**Total Estimated Time**: 5-6 hours

---

## 💡 Optional: Phase 5 (Future Enhancement)

After Phase 4, consider:
1. **Extract remaining tabs** (dynamics, gaps, recommendations)
2. **Add React Query** for better caching and data synchronization
3. **Create context provider** for global assessment state
4. **Add loading skeletons** for better UX
5. **Implement data refresh strategies** (polling, websockets)

---

## 📝 Quick Reference

**Hook Call Pattern**:
```typescript
// In TeamAssessmentInsights.tsx component:
const hookData = useCustomHook(dependencies);

// Use hook data in JSX:
<StrategicTab {...hookData} />
```

**Testing Hooks**:
```typescript
// hooks/__tests__/useTeamAssessmentData.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useTeamAssessmentData } from '../useTeamAssessmentData';

test('loads team data on mount', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useTeamAssessmentData());
  
  expect(result.current.loading).toBe(true);
  await waitForNextUpdate();
  expect(result.current.loading).toBe(false);
  expect(result.current.teamMembers.length).toBeGreaterThan(0);
});
```

---

**Ready to continue with Phase 4B-E? Let me know!** 🚀

