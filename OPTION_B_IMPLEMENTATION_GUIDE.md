# TeamAssessmentInsights - Option B Implementation Guide

## 🎯 Goal
Reduce TeamAssessmentInsights.tsx from 2,603 lines to ~1,600 lines (40% reduction)  
**Time:** 4-6 hours | **Risk:** LOW | **Benefit:** 80% of full refactor

---

## 📋 Step 1: Extract Helper Functions (Quick Win - 30 min)

### Create: `src/utils/team-insights/helpers.ts`

**Functions to move:**
```typescript
export const getFriendlyName = (type: string, value: string): string => { ... }
export const getCompletionColor = (rate: number): string => { ... }
export const getDynamicsColor = (score: number): string => { ... }
export const formatAssessmentData = (data: any) => { ... }
```

**Impact:** ~150 lines moved, file more focused

---

## 📋 Step 2: Extract Shared Types (Quick Win - 20 min)

### Create: `src/types/team-insights.ts`

**Interfaces to move:**
```typescript
export interface TeamMember { ... }
export interface AssessmentCompletion { ... }
export interface TeamComposition { ... }
export interface TeamDynamics { ... }
export interface DevelopmentPriorities { ... }
```

**Impact:** ~100 lines moved, better reusability

---

## 📋 Step 3: Split Tab Content into Components (Main Work - 2-3 hours)

### 3A. Create: `src/components/accountancy/team/insights/OverviewTab.tsx` (~350 lines)

**What it contains:**
- Assessment completion grid
- Overall metrics
- Member completion status cards

**Props:**
```typescript
interface OverviewTabProps {
  loading: boolean;
  completionStatus: AssessmentCompletion[];
  teamMembers: TeamMember[];
  getFriendlyName: (type: string, value: string) => string;
}
```

**Impact:** Removes ~350 lines from main file

---

### 3B. Create: `src/components/accountancy/team/insights/StrategicTab.tsx` (~450 lines)

**What it contains:**
- Strategic insights AI section
- Individual role-fit analysis table
- Team composition insights
- Red flags and recommendations

**Props:**
```typescript
interface StrategicTabProps {
  loading: boolean;
  individualInsights: AssessmentInsight[];
  strategicTeamInsight: TeamCompositionInsight | null;
  onCalculateStrategic: () => Promise<void>;
  calculating: boolean;
}
```

**Impact:** Removes ~450 lines from main file

---

### 3C. Create: `src/components/accountancy/team/insights/CompositionTab.tsx` (~700 lines)

**What it contains:**
- All composition charts (Communication, Belbin, EQ, Conflict, VARK, OCEAN)
- Team dynamics metrics
- AI-generated composition analysis

**Props:**
```typescript
interface CompositionTabProps {
  loading: boolean;
  teamComposition: TeamComposition | null;
  teamDynamics: TeamDynamics | null;
  teamMembers: TeamMember[];
  compositionAnalysis: string | null;
  gapAnalysis: string | null;
  onGenerateComposition: () => Promise<void>;
  onGenerateGapAnalysis: () => Promise<void>;
  generatingComposition: boolean;
  generatingGap: boolean;
  getFriendlyName: (type: string, value: string) => string;
}
```

**Impact:** Removes ~700 lines from main file

---

## 📋 Step 4: Update Main Container (30 min)

### Update: `src/pages/accountancy/admin/TeamAssessmentInsights.tsx`

**New structure:**
```typescript
import { OverviewTab } from '@/components/accountancy/team/insights/OverviewTab';
import { StrategicTab } from '@/components/accountancy/team/insights/StrategicTab';
import { CompositionTab } from '@/components/accountancy/team/insights/CompositionTab';
import { getFriendlyName, getCompletionColor, getDynamicsColor } from '@/utils/team-insights/helpers';
import type { TeamMember, AssessmentCompletion, TeamComposition, TeamDynamics } from '@/types/team-insights';

const TeamAssessmentInsights: React.FC = () => {
  // All useState hooks (stays here)
  // All data loading functions (stays here)
  // All calculation functions (stays here)
  
  return (
    <div>
      <Card>...</Card> {/* Header stays */}
      
      <Tabs>
        <TabsList>...</TabsList>
        
        <TabsContent value="overview">
          <OverviewTab 
            loading={loading}
            completionStatus={completionStatus}
            teamMembers={teamMembers}
            getFriendlyName={getFriendlyName}
          />
        </TabsContent>
        
        <TabsContent value="strategic">
          <StrategicTab
            loading={loading}
            individualInsights={individualInsights}
            strategicTeamInsight={strategicTeamInsight}
            onCalculateStrategic={calculateStrategicInsights}
            calculating={calculatingStrategic}
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
            onGenerateComposition={generateTeamComposition}
            onGenerateGapAnalysis={generateGapAnalysis}
            generatingComposition={generatingComposition}
            generatingGap={generatingGapAnalysis}
            getFriendlyName={getFriendlyName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

**New line count:** ~400 lines (data + state management + tab structure)

---

## 📊 Before & After

### Before (Option B):
```
TeamAssessmentInsights.tsx: 2,603 lines
```

### After (Option B):
```
types/team-insights.ts:          ~100 lines (shared types)
utils/team-insights/helpers.ts:  ~150 lines (utilities)
insights/OverviewTab.tsx:        ~350 lines (overview)
insights/StrategicTab.tsx:       ~450 lines (strategic)
insights/CompositionTab.tsx:     ~700 lines (composition)
TeamAssessmentInsights.tsx:      ~400 lines (container) ← 85% smaller!
```

**Total:** ~2,150 lines across 6 files  
**Reduction:** Main file is now 400 lines (85% reduction!)

---

## ✅ Testing Checklist

After each extraction:

- [ ] File imports correctly
- [ ] TypeScript compiles without errors
- [ ] Page loads without crashes
- [ ] All tabs render correctly
- [ ] Charts display properly
- [ ] AI features still work
- [ ] No console errors
- [ ] Linter passes

---

## 🔄 Migration Order (Minimize Risk)

1. **Extract types first** (safest, just move interfaces)
2. **Extract helpers second** (safe, just utility functions)
3. **Extract OverviewTab** (simple, lowest risk tab)
4. **Test thoroughly**
5. **Extract StrategicTab** (medium complexity)
6. **Test thoroughly**
7. **Extract CompositionTab** (most complex, has all charts)
8. **Final testing**

---

## 🚀 Final 20% (Next Session)

After Option B succeeds, we can:

1. **Further split CompositionTab** into individual chart components
   - `TeamBelbinChart.tsx` (100 lines)
   - `TeamEQChart.tsx` (100 lines)
   - `TeamVARKChart.tsx` (100 lines)
   - etc.

2. **Extract data loading logic** into custom hooks
   - `useTeamAssessmentData()` hook
   - `useTeamComposition()` hook
   - Reduces container to ~250 lines

3. **Repeat for ServiceDetailPage and OracleDashboard**

---

## 📝 Implementation Status

- [ ] Step 1: Extract helpers
- [ ] Step 2: Extract types
- [ ] Step 3A: Create OverviewTab
- [ ] Step 3B: Create StrategicTab
- [ ] Step 3C: Create CompositionTab
- [ ] Step 4: Update main container
- [ ] Testing & verification

---

**Ready to implement!**

