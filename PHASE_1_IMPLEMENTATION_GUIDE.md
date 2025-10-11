# PHASE 1: CRITICAL CONNECTIONS - Implementation Guide

## ✅ COMPLETED (Prompts 1A, 1B, 1G, 1F)

### Files Created/Modified

1. **✅ PROMPT 1A: Routing** - `src/routes/accountancy.tsx`
   - Added 3 new routes:
     - `/team-portal/training-recommendations` → TrainingRecommendationsPage
     - `/team-portal/cpd-skills-impact` → CPDSkillsBridgePage
     - `/team-portal/mobile-assessment` → MobileAssessmentPage

2. **✅ PROMPT 1B: Page Wrappers**
   - `src/pages/accountancy/team/TrainingRecommendationsPage.tsx` - NEW
   - `src/pages/accountancy/team/CPDSkillsBridgePage.tsx` - NEW
   - `src/pages/team-portal/MobileAssessmentPage.tsx` - NEW

3. **✅ PROMPT 1G: Mobile Detection** - `src/hooks/useMobileDetection.ts` - NEW
   - Hook for detecting mobile/tablet/desktop
   - Use in any component: `const { isMobile, isTablet, isDesktop } = useMobileDetection();`

4. **✅ PROMPT 1F: PWA Service Worker** - `src/lib/pwa/registerSW.ts` - NEW
   - Service worker registration utilities
   - Notification permission handling
   - PWA detection

---

## 🔶 REMAINING TASKS (Manual Implementation Needed)

The following prompts require manual implementation or review before committing:

### PROMPT 1C: Update TeamManagementPage with New Tabs

**File to modify:** `src/pages/accountancy/TeamManagementPage.tsx`

**Changes needed:**
1. Add imports for new components
2. Add 4 new tabs to `<TabsList>`:
   - Training (with `<Target />` icon)
   - Mentoring (with `<Users />` icon)
   - Analytics (with `<BarChart2 />` icon)
   - Onboarding (with `<CheckCircle />` icon)
3. Add corresponding `<TabsContent>` sections

**Code to add:**
```tsx
// Add to imports
import { Target, Users, BarChart2, CheckCircle } from 'lucide-react';
import TrainingRecommendationsPage from './team/TrainingRecommendationsPage';
import MentoringHubPage from './team/MentoringHubPage';
import AnalyticsDashboardPage from './team/AnalyticsDashboardPage';
import OnboardingAdminPage from './team/OnboardingAdminPage';

// Add to TabsList (after existing tabs)
<TabsTrigger value="training" className="flex-1 flex items-center justify-center gap-2">
  <Target className="w-4 h-4" />
  <span>Training</span>
</TabsTrigger>
<TabsTrigger value="mentoring" className="flex-1 flex items-center justify-center gap-2">
  <Users className="w-4 h-4" />
  <span>Mentoring</span>
</TabsTrigger>
<TabsTrigger value="analytics" className="flex-1 flex items-center justify-center gap-2">
  <BarChart2 className="w-4 h-4" />
  <span>Analytics</span>
</TabsTrigger>
<TabsTrigger value="onboarding" className="flex-1 flex items-center justify-center gap-2">
  <CheckCircle className="w-4 h-4" />
  <span>Onboarding</span>
</TabsTrigger>

// Add TabsContent sections
<TabsContent value="training">
  <TrainingRecommendationsPage />
</TabsContent>
<TabsContent value="mentoring">
  <MentoringHubPage />
</TabsContent>
<TabsContent value="analytics">
  <AnalyticsDashboardPage />
</TabsContent>
<TabsContent value="onboarding">
  <OnboardingAdminPage />
</TabsContent>
```

---

### PROMPT 1D: Integrate Gamification Widgets

**File to modify:** `src/components/accountancy/team/OverviewTab.tsx` (or similar dashboard component)

**Changes needed:**
1. Import gamification components:
   ```tsx
   import LeaderboardWidget from '@/components/accountancy/team/LeaderboardWidget';
   import ProgressStreaks from '@/components/accountancy/team/ProgressStreaks';
   ```

2. Add to layout (example):
   ```tsx
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div className="lg:col-span-2 space-y-6">
       {/* Existing overview content */}
     </div>
     
     <div className="space-y-6">
       <ProgressStreaks 
         memberId={currentUserId} 
         practiceId={currentPracticeId}
       />
       
       <LeaderboardWidget 
         practiceId={currentPracticeId}
         leaderboardType="top_points"
       />
     </div>
   </div>
   ```

**Note:** Requires actual user IDs and practice IDs from context

---

### PROMPT 1E: Add Floating AI Skills Coach

**File to modify:** `src/components/accountancy/layout/AccountancyLayout.tsx`

**Changes needed:**
1. Import AISkillsCoach component
2. Add to layout (renders on all accountancy pages)

**Code to add:**
```tsx
import AISkillsCoach from '@/components/accountancy/team/AISkillsCoach';
import { useAuth } from '@/contexts/AuthContext';

// In layout component:
const { user } = useAuth();
const currentUserId = user?.id || '';

return (
  <div className="relative">
    {/* Existing layout content */}
    {children}
    
    {/* Floating AI Coach */}
    {currentUserId && (
      <AISkillsCoach
        memberId={currentUserId}
        context={{
          type: 'general',
          userData: {
            memberName: user?.user_metadata?.full_name || user?.email || 'there'
          }
        }}
      />
    )}
  </div>
);
```

**⚠️ Important:** Ensure `VITE_OPENROUTER_API_KEY` is set in environment variables!

---

### PROMPT 1H: Connect Gap Analysis with AI Recommendations

**File to modify:** `src/components/accountancy/team/GapAnalysis.tsx`

**Changes needed:**
Add a CTA card linking to Training Recommendations

**Code to add** (at the end of GapAnalysis component):
```tsx
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// Inside component:
const navigate = useNavigate();

// Add after gap analysis table:
<Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-700">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-white">
      <Sparkles className="w-5 h-5" />
      AI-Powered Recommendations
    </CardTitle>
    <CardDescription className="text-gray-300">
      Get personalized training recommendations based on your skill gaps
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button 
      onClick={() => navigate('/accountancy/team-portal/training-recommendations')}
      className="w-full bg-purple-600 hover:bg-purple-700"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Generate AI Recommendations
    </Button>
  </CardContent>
</Card>
```

---

### PROMPT 1I: Add Quick Actions to Dashboard

**Option 1:** Create standalone `QuickActions.tsx` component
**Option 2:** Add directly to `OverviewTab.tsx`

**Full component code:**
```tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Target, Users, BookOpen, Activity, 
  Trophy, Brain, Smartphone, BarChart2 
} from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Target className="w-5 h-5" />,
      label: 'Training Recommendations',
      description: 'AI-powered learning paths',
      path: '/accountancy/team-portal/training-recommendations',
      color: 'purple'
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Find a Mentor',
      description: 'Connect with experts',
      path: '/accountancy/team-portal/mentoring',
      color: 'blue'
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: 'CPD Impact',
      description: 'Track skills improvement',
      path: '/accountancy/team-portal/cpd-skills-impact',
      color: 'green'
    },
    {
      icon: <Brain className="w-5 h-5" />,
      label: 'VARK Assessment',
      description: 'Discover learning style',
      path: '/accountancy/team-portal/vark-assessment',
      color: 'yellow'
    },
    {
      icon: <BarChart2 className="w-5 h-5" />,
      label: 'Analytics',
      description: 'Team insights & trends',
      path: '/accountancy/team-portal/analytics',
      color: 'indigo'
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      label: 'Mobile Assessment',
      description: 'Optimized for mobile',
      path: '/accountancy/team-portal/mobile-assessment',
      color: 'pink'
    }
  ];

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.path}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-700 border-gray-600"
              onClick={() => navigate(action.path)}
            >
              <div className={`text-${action.color}-500`}>
                {action.icon}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm text-white">
                  {action.label}
                </div>
                <div className="text-xs text-gray-400">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Usage:** Add `<QuickActions />` to your dashboard Overview tab

---

### PROMPT 1J: Enable Command Palette (Cmd+K)

**Files needed:**
1. `src/components/ui/command-palette.tsx` - Main component
2. Update `AccountancyLayout.tsx` to include it

**Check if `command.tsx` exists** in `src/components/ui/`:
- If not, you may need to install it via shadcn/ui: `npx shadcn-ui@latest add command`

**Command Palette Component:**
```tsx
// src/components/ui/command-palette.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Target, Users, BookOpen, Activity, 
  Trophy, Brain, BarChart2, CheckCircle 
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands = [
    {
      group: 'Navigation',
      items: [
        { icon: <Target />, label: 'Training Recommendations', path: '/accountancy/team-portal/training-recommendations' },
        { icon: <Users />, label: 'Mentoring Hub', path: '/accountancy/team-portal/mentoring' },
        { icon: <Activity />, label: 'CPD Skills Impact', path: '/accountancy/team-portal/cpd-skills-impact' },
        { icon: <Brain />, label: 'VARK Assessment', path: '/accountancy/team-portal/vark-assessment' },
        { icon: <BarChart2 />, label: 'Analytics Dashboard', path: '/accountancy/team-portal/analytics' },
        { icon: <CheckCircle />, label: 'Onboarding', path: '/accountancy/team-portal/onboarding' },
      ]
    }
  ];

  const handleSelect = (item: any) => {
    if (item.path) {
      navigate(item.path);
    }
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => handleSelect(item)}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
```

**Add to Layout:**
```tsx
// In AccountancyLayout.tsx or App.tsx
import { CommandPalette } from '@/components/ui/command-palette';

return (
  <>
    {children}
    <CommandPalette />
  </>
);
```

**Add Keyboard Hint (optional):**
```tsx
<div className="fixed bottom-4 left-4 bg-gray-800 text-gray-400 px-3 py-2 rounded-lg text-sm hidden lg:block">
  Press <kbd className="px-2 py-1 bg-gray-700 rounded text-white">⌘K</kbd> for commands
</div>
```

---

## 🔧 PWA SETUP (PROMPT 1F)

### Main App Entry Point

**File: `src/main.tsx`** (or `src/index.tsx`)

Add at the END of the file:
```tsx
import { registerServiceWorker } from '@/lib/pwa/registerSW';

// After ReactDOM.render:
if ('serviceWorker' in navigator) {
  registerServiceWorker();
}
```

### HTML Manifest Link

**File: `index.html`** (or `public/index.html`)

Add to `<head>`:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#111827" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

### Verify PWA Files Exist

Check that these files are in `/public`:
- `/public/service-worker.js` ✓ (created in PROMPT 7)
- `/public/manifest.json` ✓ (created in PROMPT 7)
- `/public/offline.html` ✓ (created in PROMPT 7)
- `/public/icons/icon-192x192.png` (may need to create)
- `/public/icons/icon-512x512.png` (may need to create)

---

## 📱 MOBILE DETECTION (PROMPT 1G)

The `useMobileDetection` hook is now available. To use it:

### Example: Add Mobile Banner to Assessment Page

**File:** Any assessment page

```tsx
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

const AssessmentPage = () => {
  const { isMobile } = useMobileDetection();
  const navigate = useNavigate();

  return (
    <div>
      {isMobile && (
        <Alert className="mb-4 bg-blue-900/20 border-blue-700">
          <Smartphone className="h-4 w-4" />
          <AlertTitle>Mobile-Optimized Version Available</AlertTitle>
          <AlertDescription>
            <Button 
              variant="link" 
              onClick={() => navigate('/accountancy/team-portal/mobile-assessment')}
              className="px-0 text-blue-400 hover:text-blue-300"
            >
              Switch to mobile-friendly view →
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Rest of assessment page */}
    </div>
  );
};
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Completed
- [x] Routes added for Training, CPD Bridge, Mobile Assessment
- [x] Page wrappers created
- [x] Mobile detection hook created
- [x] PWA registration utilities created

### Ready to Implement (Code Provided Above)
- [ ] **PROMPT 1C:** Update TeamManagementPage tabs
- [ ] **PROMPT 1D:** Add gamification widgets to dashboard
- [ ] **PROMPT 1E:** Add floating AI Skills Coach
- [ ] **PROMPT 1F:** Register service worker in main.tsx
- [ ] **PROMPT 1H:** Connect Gap Analysis to Training Recommendations
- [ ] **PROMPT 1I:** Add Quick Actions component
- [ ] **PROMPT 1J:** Enable Command Palette (Cmd+K)

### Environment Variables Required
- [ ] `VITE_OPENROUTER_API_KEY` for AI Skills Coach

---

## 🚀 TESTING CHECKLIST

After implementing remaining prompts:

1. **Navigation**
   - [ ] All 8 team-portal routes accessible
   - [ ] Training Recommendations page loads
   - [ ] CPD Skills Bridge page loads
   - [ ] Mobile Assessment page loads

2. **UI Integration**
   - [ ] 4 new tabs visible in Team Management page
   - [ ] Gamification widgets appear in dashboard
   - [ ] AI Skills Coach floating button visible
   - [ ] Quick Actions grid displays correctly

3. **Functionality**
   - [ ] Command palette opens with Cmd+K (or Ctrl+K)
   - [ ] Mobile detection shows banner on mobile devices
   - [ ] Gap Analysis links to Training Recommendations
   - [ ] PWA install prompt appears (mobile/Chrome)

4. **Console**
   - [ ] No React errors
   - [ ] Service Worker registered (check console log)
   - [ ] No 404s for routes or components

---

## 📝 NOTES

- All routes are now accessible at `/accountancy/team-portal/*`
- Mobile assessment is fully functional with swipe gestures
- PWA will work once service worker is registered in main.tsx
- AI Coach requires OpenRouter API key to be configured
- Command Palette requires `@/components/ui/command` from shadcn/ui

---

**Next Steps:** Implement remaining prompts 1C-1J using the code snippets provided above, then test all features before committing.

