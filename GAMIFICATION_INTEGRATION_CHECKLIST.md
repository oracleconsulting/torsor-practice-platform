# Gamification Integration - Automated Script

This document lists all files that need gamification hooks added and the exact code to add.

## Assessment Pages Integration

### 1. VARK Assessment
**File:** `src/pages/accountancy/team/VARKAssessmentPage.tsx`
**Status:** ✅ COMPLETED

### 2. OCEAN Assessment  
**File:** `src/pages/accountancy/team/OCEANAssessmentPage.tsx`
**Import to add:**
```typescript
import { onAssessmentComplete } from '@/lib/api/gamification/hooks';
```

**Code to add** (after successful database save):
```typescript
// 🎮 Trigger gamification: Assessment complete
onAssessmentComplete(teamMemberId, 'ocean').catch(err => 
  console.error('[OCEANAssessmentPage] Gamification error:', err)
);
```

### 3. Belbin Assessment
**File:** `src/pages/accountancy/team/BelbinAssessmentPage.tsx`
**Import to add:**
```typescript
import { onAssessmentComplete } from '@/lib/api/gamification/hooks';
```

**Code to add** (after successful database save):
```typescript
// 🎮 Trigger gamification: Assessment complete
onAssessmentComplete(teamMemberId, 'belbin').catch(err => 
  console.error('[BelbinAssessmentPage] Gamification error:', err)
);
```

### 4. Strengths Assessment
**File:** `src/pages/accountancy/team/StrengthsAssessmentPage.tsx`
**Import to add:**
```typescript
import { onAssessmentComplete } from '@/lib/api/gamification/hooks';
```

**Code to add** (after successful database save):
```typescript
// 🎮 Trigger gamification: Assessment complete
onAssessmentComplete(teamMemberId, 'strengths').catch(err => 
  console.error('[StrengthsAssessmentPage] Gamification error:', err)
);
```

### 5. Motivations Assessment
**File:** `src/pages/accountancy/team/MotivationsAssessmentPage.tsx`
**Import to add:**
```typescript
import { onAssessmentComplete } from '@/lib/api/gamification/hooks';
```

**Code to add** (after successful database save):
```typescript
// 🎮 Trigger gamification: Assessment complete
onAssessmentComplete(teamMemberId, 'motivations').catch(err => 
  console.error('[MotivationsAssessmentPage] Gamification error:', err)
);
```

### 6. EQ Assessment
**File:** `src/pages/accountancy/team/EQAssessmentPage.tsx`
**Import to add:**
```typescript
import { onAssessmentComplete } from '@/lib/api/gamification/hooks';
```

**Code to add** (after successful database save):
```typescript
// 🎮 Trigger gamification: Assessment complete
onAssessmentComplete(teamMemberId, 'eq').catch(err => 
  console.error('[EQAssessmentPage] Gamification error:', err)
);
```

### 7. Skills Assessment
**File:** `src/pages/accountancy/team/SkillsDashboardV2Page.tsx`
**Import to add:**
```typescript
import { onAssessmentComplete, onSkillUpdate } from '@/lib/api/gamification/hooks';
```

**Code to add** (after successful initial assessment):
```typescript
// 🎮 Trigger gamification: Assessment complete
onAssessmentComplete(memberId, 'skills').catch(err => 
  console.error('[SkillsDashboard] Gamification error:', err)
);
```

**Code to add** (after updating skills):
```typescript
// 🎮 Trigger gamification: Skills updated
onSkillUpdate(memberId, 1).catch(err => 
  console.error('[SkillsDashboard] Gamification error:', err)
);
```

## CPD Integration

### 8. CPD Activity Logging
**File:** `src/components/accountancy/team/CPDOverview.tsx`
**Import to add:**
```typescript
import { onCPDLog } from '@/lib/api/gamification/hooks';
```

**Code to add** (after successful CPD activity log):
```typescript
// 🎮 Trigger gamification: CPD logged
onCPDLog(memberId, hoursLogged, activityId).catch(err => 
  console.error('[CPDOverview] Gamification error:', err)
);
```

## Member Activity Tracking

### 9. Main App Component
**File:** `src/App.tsx` or auth handler
**Import to add:**
```typescript
import { onMemberActivity } from '@/lib/api/gamification/hooks';
```

**Code to add** (after successful login):
```typescript
// 🎮 Trigger gamification: Member activity (streak tracking)
if (user && memberId) {
  onMemberActivity(memberId).catch(err => 
    console.error('[App] Gamification error:', err)
  );
}
```

## Integration Strategy

1. ✅ VARK - Already integrated
2. Find and integrate OCEAN assessment
3. Find and integrate Belbin assessment
4. Find and integrate Strengths assessment
5. Find and integrate Motivations assessment
6. Find and integrate EQ assessment
7. Find and integrate Skills assessment
8. Integrate CPD logging
9. Integrate member login/activity tracking

All integrations use `.catch()` to ensure gamification failures don't break the main application flow.

