# Auth & Loading Best Practices

## Problem Overview
The platform was experiencing infinite loading spinners when navigating between pages, particularly:
- Team Member Dashboard
- Skills Heatmap
- Other team portal pages

## Root Causes
1. **Silent Supabase failures**: Queries failing without proper error handling
2. **Missing error capture**: Not checking `error` property in Supabase responses
3. **No timeout protection**: Pages could hang indefinitely
4. **Incomplete loading state management**: `setLoading(false)` not always called

## Solution Pattern

### 1. Individual Error Checking
Always destructure and check the `error` property from Supabase queries:

```typescript
// ❌ BAD
const { data } = await supabase
  .from('table')
  .select('*');

// ✅ GOOD
const { data, error } = await supabase
  .from('table')
  .select('*');

if (error) {
  console.error('[Component] Error fetching data:', error);
  setLoading(false);
  return;
}
```

### 2. Safety Timeout
Always implement a timeout to prevent infinite loading:

```typescript
// Add this useEffect to every page with loading state
useEffect(() => {
  const loadingTimeout = setTimeout(() => {
    if (loading) {
      console.warn('[Component] Loading timeout - forcing loading to false');
      setLoading(false);
    }
  }, 10000); // 10 seconds

  return () => clearTimeout(loadingTimeout);
}, [loading]);
```

### 3. Comprehensive Logging
Log every step of the data loading process:

```typescript
const loadData = async () => {
  try {
    console.log('[Component] Starting data load');
    setLoading(true);

    // Query 1
    const { data: result1, error: error1 } = await supabase...;
    console.log('[Component] Query 1 result:', result1?.length || 0, 'records');
    if (error1) console.error('[Component] Query 1 error:', error1);

    // Query 2
    const { data: result2, error: error2 } = await supabase...;
    console.log('[Component] Query 2 result:', result2?.length || 0, 'records');
    if (error2) console.error('[Component] Query 2 error:', error2);

    // Processing
    console.log('[Component] Data processing complete');

  } catch (error) {
    console.error('[Component] Error in loadData:', error);
  } finally {
    console.log('[Component] Setting loading to false');
    setLoading(false);
  }
};
```

### 4. Always Use Finally Block
Ensure `setLoading(false)` is **always** called:

```typescript
const loadData = async () => {
  try {
    setLoading(true);
    // ... data loading logic
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // This ALWAYS runs, even if there's an error or early return
    setLoading(false);
  }
};
```

### 5. Handle Empty States
Don't assume data exists - handle empty/null cases:

```typescript
if (!data || data.length === 0) {
  console.log('[Component] No data found - setting empty state');
  setData([]);
  setLoading(false);
  return;
}
```

### 6. Continue on Non-Critical Failures
Not all queries are critical - continue loading if possible:

```typescript
// Critical query - stop if it fails
const { data: user, error: userError } = await supabase...;
if (userError || !user) {
  console.error('[Component] Critical: No user found');
  setLoading(false);
  return;
}

// Non-critical query - log but continue
const { data: stats, error: statsError } = await supabase...;
if (statsError) {
  console.error('[Component] Non-critical: Stats failed:', statsError);
  // Continue anyway with default values
}
setStats(stats || defaultStats);
```

## Checklist for New/Updated Pages

When creating or updating a page with data loading:

- [ ] Destructure and check `error` from every Supabase query
- [ ] Add 10-second safety timeout `useEffect`
- [ ] Wrap data loading in try-catch-finally
- [ ] Always call `setLoading(false)` in finally block
- [ ] Add comprehensive console logging
- [ ] Handle empty data states
- [ ] Differentiate critical vs non-critical failures
- [ ] Test navigation between pages multiple times
- [ ] Check console for any errors during testing

## Pages Already Fixed

✅ **Team Member Dashboard** (`/torsor-practice-platform/src/pages/accountancy/team/TeamMemberDashboard.tsx`)
- Individual error checking
- 10-second timeout
- Comprehensive logging
- Proper finally block

✅ **Skills Heatmap** (`/torsor-practice-platform/src/pages/accountancy/team/MySkillsHeatmap.tsx`)
- Individual error checking
- 10-second timeout
- Enhanced logging
- Empty state handling

## Pages That May Need Updates

Check and update these pages if they have loading states:
- [ ] MySkillsComparison.tsx
- [ ] CPDOverview.tsx
- [ ] MyAssignmentsPage.tsx
- [ ] Any other pages with `useState(true)` for loading

## Testing Procedure

1. **Clear browser cache and cookies**
2. **Fresh login**
3. **Navigate through all pages**:
   - Dashboard → Skills Heatmap → Back to Dashboard
   - Dashboard → CPD → Skills → Dashboard
   - Refresh page mid-navigation
4. **Check console**:
   - Should see "[Component] Data loading complete"
   - Should see "[Component] Setting loading to false"
   - Should NOT see any unhandled errors
5. **Maximum 10 seconds** per page load
6. **No infinite spinners**

## Deployment Readiness

Before deploying to all team members:
1. ✅ Fix all loading issues
2. ✅ Add timeout protection to all pages
3. ✅ Test with multiple user accounts
4. ✅ Test slow network conditions (Network throttling in DevTools)
5. ✅ Test with users who have no data
6. ✅ Test with users who have lots of data
7. ✅ Verify console logs are helpful but not excessive
8. ✅ Test on mobile devices/responsive design

## Contact/Support

If you encounter loading issues:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for [ComponentName] prefixed logs
4. Screenshot any errors
5. Note which page and action caused the issue
