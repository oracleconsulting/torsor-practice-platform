# Mobile Testing Guide
**PROMPT 7: Mobile-First Assessment Experience**

## Device Testing Requirements

### iOS Safari 14+
- ✅ Test on iPhone 12, 13, 14 (Pro/Pro Max)
- ✅ Safari 14.0+
- ✅ iOS 14.0+

**Key Features to Test:**
- Swipe gestures (left/right navigation)
- Touch targets (minimum 44x44pt)
- Haptic feedback
- PWA installation via Share Sheet
- Offline mode
- Local storage persistence

### Chrome Android 90+
- ✅ Test on Samsung Galaxy S21+, Pixel 5+
- ✅ Chrome 90.0+
- ✅ Android 11+

**Key Features to Test:**
- Swipe gestures
- Touch targets (minimum 48x48dp)
- Vibration API
- PWA installation via banner
- Offline mode
- Background sync

## Screen Sizes

### Portrait Mode (Primary)
- **320px** - iPhone SE (1st gen)
- **375px** - iPhone 12/13 mini
- **390px** - iPhone 12/13/14 Pro
- **414px** - iPhone 12/13/14 Pro Max
- **428px** - iPhone 14 Pro Max

### Landscape Mode (Secondary)
- **667px** x 375px - iPhone SE
- **844px** x 390px - iPhone 12/13
- **926px** x 428px - iPhone 14 Pro Max

## PWA Features Testing Checklist

### Installation
- [ ] Install prompt appears after 5 seconds
- [ ] "Add to Home Screen" works on iOS
- [ ] Install banner works on Android
- [ ] App icon appears on home screen
- [ ] App opens in standalone mode (no browser UI)

### Offline Mode
- [ ] Service worker registers successfully
- [ ] Initial page loads without network
- [ ] Skills data cached properly
- [ ] Assessment progress saved offline
- [ ] "Offline" banner displays when disconnected
- [ ] Auto-sync when connection restored

### Background Sync
- [ ] Pending assessments queue correctly
- [ ] Sync triggers when online
- [ ] Duplicate prevention works
- [ ] Success notification appears

### Push Notifications
- [ ] Permission request shows
- [ ] Notifications appear on lock screen
- [ ] Notification actions work
- [ ] Badge updates correctly

## Gesture Controls Testing

### Swipe Gestures
- [ ] Swipe right navigates to next skill
- [ ] Swipe left navigates to previous
- [ ] Swipe indicators ("NEXT →", "← PREV") appear
- [ ] Card animates smoothly during swipe
- [ ] Rotation effect works
- [ ] Swipe threshold (50px) is appropriate

### Tap and Hold
- [ ] Long press (500ms) shows description
- [ ] Haptic feedback triggers
- [ ] Description modal appears
- [ ] Cancel on movement works

### Touch Targets
- [ ] All buttons >= 44px (iOS) / 48px (Android)
- [ ] Rating buttons are large enough
- [ ] No accidental taps
- [ ] Active states provide visual feedback

## Performance Testing

### Load Times
- [ ] Initial load < 3 seconds on 3G
- [ ] Time to interactive < 5 seconds
- [ ] First contentful paint < 2 seconds

### Animations
- [ ] 60 FPS during swipe
- [ ] No jank on low-end devices
- [ ] Smooth transitions
- [ ] Reduced motion support

### Memory
- [ ] No memory leaks after 100 swipes
- [ ] Cache size < 50MB
- [ ] IndexedDB < 10MB

## Accessibility Testing

### Screen Readers
- [ ] VoiceOver (iOS) reads content correctly
- [ ] TalkBack (Android) navigation works
- [ ] ARIA labels present
- [ ] Focus order logical

### Color Contrast
- [ ] WCAG AA compliance (4.5:1)
- [ ] Dark mode support
- [ ] High contrast mode

### Motor Impairments
- [ ] Can complete assessment without gestures
- [ ] Button navigation works
- [ ] No time limits

## Cross-Browser Testing

### iOS
- [ ] Safari 14+
- [ ] Safari 15+
- [ ] Safari 16+
- [ ] Chrome iOS
- [ ] Firefox iOS

### Android
- [ ] Chrome 90+
- [ ] Chrome 100+
- [ ] Firefox Android
- [ ] Samsung Internet
- [ ] Edge Android

## Network Conditions Testing

### Slow 3G (400kb/s)
- [ ] Page loads within 10 seconds
- [ ] Images compressed
- [ ] Skeleton loaders show

### Offline
- [ ] Cached page loads
- [ ] "Offline" banner shows
- [ ] Can complete assessment
- [ ] Progress saves locally

### Intermittent Connection
- [ ] Retries failed requests
- [ ] No data loss
- [ ] Sync queue works

## Edge Cases

### Battery Saver Mode
- [ ] Animations reduce
- [ ] Background sync delays
- [ ] Still functional

### Low Storage
- [ ] Handles quota exceeded
- [ ] Clears old cache
- [ ] Warns user

### Orientation Change
- [ ] Layout adapts
- [ ] No data loss
- [ ] State persists

## Testing Commands

```bash
# Run on local network
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm run preview

# Test service worker
# Open DevTools > Application > Service Workers

# Test offline mode
# DevTools > Network > Offline

# Test slow connection
# DevTools > Network > Slow 3G
```

## Lighthouse Scores (Target)

- **Performance:** ≥ 90
- **Accessibility:** ≥ 95
- **Best Practices:** ≥ 90
- **SEO:** ≥ 90
- **PWA:** ✅ Installable

## iOS Safari Specific Issues

### Known Limitations:
1. No vibration API (use visual feedback instead)
2. No background sync (manual sync on app open)
3. PWA quota limited to 50MB
4. No web push notifications (in-app only)
5. Service worker may be killed aggressively

### Workarounds:
- Visual feedback for haptics
- Manual sync button
- Aggressive cache cleanup
- In-app notifications
- Frequent state saving

## Android Chrome Specific Issues

### Known Limitations:
1. PWA may be uninstalled if unused for 30 days
2. Background sync limited to 1 attempt per day
3. Notification permission required explicitly

### Workarounds:
- Engagement reminders
- Foreground sync fallback
- Permission request at optimal time

## Test Data

### Sample Assessment:
- **Invite Code:** `test-123-456`
- **Email:** `test@example.com`
- **Skills Count:** 50
- **Categories:** 5

### Test Scenarios:
1. Complete assessment in one session
2. Save progress, exit, resume
3. Complete offline, sync when online
4. Switch between portrait/landscape
5. Low battery mode
6. Slow network

## Reporting Issues

### Template:
```
Device: iPhone 14 Pro
OS: iOS 16.5
Browser: Safari 16.5
Issue: [Description]
Steps to reproduce: [List]
Expected: [Behavior]
Actual: [Behavior]
Screenshots: [Attach]
```

## Sign-Off Checklist

- [ ] All gestures work smoothly
- [ ] PWA installs successfully
- [ ] Offline mode functional
- [ ] Background sync works
- [ ] Touch targets appropriately sized
- [ ] Performance targets met
- [ ] Accessibility compliant
- [ ] Cross-browser tested
- [ ] Edge cases handled
- [ ] Documentation complete

## Next Steps After Testing

1. Fix identified issues
2. Optimize performance bottlenecks
3. Improve accessibility gaps
4. Add analytics tracking
5. User feedback collection
6. A/B testing setup

