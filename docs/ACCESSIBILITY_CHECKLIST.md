# Accessibility Checklist - WCAG 2.1 AA Compliance

## Visual Requirements

### Color Contrast
- [ ] Text color contrast ratio ≥ 4.5:1 (normal text)
- [ ] Large text contrast ratio ≥ 3:1 (18pt+ or 14pt+ bold)
- [ ] UI component contrast ratio ≥ 3:1 (buttons, form controls)
- [ ] No information conveyed by color alone
- [ ] Focus indicators have sufficient contrast

### Visual Presentation
- [ ] Text resizable to 200% without loss of content or functionality
- [ ] Line height at least 1.5x font size
- [ ] Paragraph spacing at least 2x font size
- [ ] Letter spacing at least 0.12x font size
- [ ] Word spacing at least 0.16x font size
- [ ] No horizontal scrolling at 320px width

### Focus Management
- [ ] All interactive elements have visible focus indicators
- [ ] Focus indicators are at least 2px thick
- [ ] Focus order is logical and follows visual flow
- [ ] No focus traps (users can navigate away with keyboard)
- [ ] Modal dialogs trap focus within the dialog

## Keyboard Navigation

### General
- [ ] All functionality available via keyboard
- [ ] Logical tab order throughout application
- [ ] No keyboard traps
- [ ] Skip links present ("Skip to main content")
- [ ] Keyboard shortcuts documented

### Interactive Elements
- [ ] All buttons keyboard accessible (Enter/Space)
- [ ] All links keyboard accessible (Enter)
- [ ] All form controls keyboard accessible (Tab, Arrow keys)
- [ ] Dropdown menus keyboard navigable (Arrow keys, Enter, Esc)
- [ ] Modal dialogs dismissible with Escape key
- [ ] Custom components follow ARIA authoring practices

### Keyboard Shortcuts
- [ ] Shortcuts don't conflict with browser/screen reader shortcuts
- [ ] Single-key shortcuts can be disabled or remapped
- [ ] Shortcut hint appears on hover/focus
- [ ] Shortcuts listed in help documentation

## Screen Reader Compatibility

### Semantic HTML
- [ ] Correct heading structure (h1-h6, no skipped levels)
- [ ] Headings describe content accurately
- [ ] Landmarks used correctly (header, nav, main, aside, footer)
- [ ] Lists used for list content (ul, ol, li)
- [ ] Tables used for tabular data only
- [ ] Form elements have proper labels

### Images & Media
- [ ] All images have alt text
- [ ] Decorative images have empty alt ("")
- [ ] Complex images have long descriptions
- [ ] Icons have accessible labels or text alternatives
- [ ] SVGs have title and desc elements
- [ ] Videos have captions
- [ ] Audio has transcripts

### Forms
- [ ] All form controls have labels
- [ ] Labels are associated with controls (for/id)
- [ ] Required fields indicated (not color-only)
- [ ] Error messages are descriptive and associated with fields
- [ ] Help text associated with controls
- [ ] Fieldsets and legends used for related groups
- [ ] Form validation provides clear feedback

### ARIA Labels
- [ ] aria-label used where visible labels not possible
- [ ] aria-labelledby used to reference labels
- [ ] aria-describedby used for additional descriptions
- [ ] Role attribute used for custom components
- [ ] aria-live regions for dynamic content updates
- [ ] aria-expanded for expandable sections
- [ ] aria-current for navigation

### Live Regions
- [ ] Status messages use role="status" or aria-live="polite"
- [ ] Alerts use role="alert" or aria-live="assertive"
- [ ] Loading states announced to screen readers
- [ ] Success/error messages announced
- [ ] Dynamic content changes announced

## Content & Language

### Text Content
- [ ] Language of page specified (lang attribute)
- [ ] Language changes marked (lang attribute on element)
- [ ] Abbreviations explained on first use
- [ ] Unusual words defined
- [ ] Reading level appropriate (8-9th grade or lower for primary content)

### Navigation
- [ ] Multiple ways to find content (search, sitemap, nav)
- [ ] Page titles are descriptive and unique
- [ ] Breadcrumbs show current location
- [ ] Navigation is consistent across pages
- [ ] Link text is descriptive (no "click here")

## Testing

### Automated Testing
- [ ] Lighthouse accessibility score ≥ 90
- [ ] axe DevTools scan (0 violations)
- [ ] WAVE evaluation tool (0 errors)
- [ ] Pa11y CI integration
- [ ] ESLint jsx-a11y plugin configured

### Screen Reader Testing
- [ ] NVDA (Windows) - Firefox
- [ ] JAWS (Windows) - Chrome
- [ ] VoiceOver (macOS) - Safari
- [ ] VoiceOver (iOS) - Safari
- [ ] TalkBack (Android) - Chrome

### Keyboard Testing
- [ ] Tab through all interactive elements
- [ ] Shift+Tab backwards navigation works
- [ ] Enter/Space activate buttons
- [ ] Escape closes dialogs
- [ ] Arrow keys navigate custom components
- [ ] No keyboard traps encountered

### Visual Testing
- [ ] Zoom to 200% (no horizontal scroll)
- [ ] Windows High Contrast Mode
- [ ] Browser zoom at 400%
- [ ] Text spacing bookmarklet
- [ ] Grayscale filter (color-blind simulation)
- [ ] Various viewport sizes (320px to 1920px+)

## Responsive & Mobile

### Touch Targets
- [ ] Minimum 44x44px touch target size
- [ ] Adequate spacing between targets (8px minimum)
- [ ] No touch gestures required for essential functions
- [ ] Drag actions have keyboard alternative

### Mobile Specific
- [ ] Portrait and landscape orientations supported
- [ ] Content reflows without horizontal scrolling
- [ ] Pinch to zoom not disabled
- [ ] Touch gestures documented
- [ ] Mobile keyboard doesn't obscure form fields

## Specific Component Checks

### Modals/Dialogs
- [ ] Focus trapped within modal
- [ ] Escape closes modal
- [ ] Focus returns to trigger element on close
- [ ] Background content inert (aria-hidden)
- [ ] Role="dialog" and aria-modal="true"

### Accordions
- [ ] Button controls expand/collapse
- [ ] aria-expanded state correct
- [ ] Keyboard navigation (Arrow keys)
- [ ] Screen reader announces state

### Tabs
- [ ] Role="tablist", "tab", "tabpanel"
- [ ] Arrow keys navigate tabs
- [ ] Only active tab in tab order
- [ ] aria-selected indicates active tab
- [ ] aria-controls links tab to panel

### Tooltips
- [ ] Keyboard accessible (hover and focus)
- [ ] Dismissible (Escape key)
- [ ] Not hidden by other content
- [ ] aria-describedby links to tooltip
- [ ] Adequate hover/focus time before dismissal

### Data Tables
- [ ] <th> with scope for headers
- [ ] <caption> describes table
- [ ] Row/column headers correct
- [ ] Sortable columns indicated
- [ ] Pagination keyboard accessible

## Common Issues to Avoid

### ❌ Don't Do This
- Using div/span for buttons
- Color-only error indicators
- Missing form labels
- Skipping heading levels
- Automatic page refreshes
- Time limits without user control
- Flashing content (>3 times per second)
- Pop-ups without warning
- CAPTCHA without audio alternative

### ✅ Do This Instead
- Use semantic HTML (<button>)
- Multiple error indicators (color + icon + text)
- Explicit <label> elements
- Logical heading hierarchy (h1 → h2 → h3)
- User-triggered updates only
- Sufficient time or ability to extend
- No flashing content
- Warn before opening new windows
- Provide multiple CAPTCHA options

## Documentation

- [ ] Accessibility statement published
- [ ] Conformance report available (VPAT)
- [ ] Known issues documented
- [ ] Keyboard shortcuts documented
- [ ] Screen reader instructions provided
- [ ] Feedback mechanism for a11y issues

## Compliance Level

Target: **WCAG 2.1 Level AA**

Current Status: ☐ In Progress ☐ Complete

Last Reviewed: _________________

Reviewer: _________________

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Inclusive Components](https://inclusive-components.design/)

---

**Note:** This checklist should be reviewed regularly and updated as the application evolves. Accessibility is an ongoing process, not a one-time task.

