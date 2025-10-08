# 📱 Mobile-Friendly Skills Survey Design
**Oracle Consulting AI - Team Skills Assessment**

---

## 🎯 Overview

A mobile-optimized, self-service survey that allows your 16 team members to:
1. Create their profile
2. Assess their skills across all categories
3. Indicate interest levels
4. Track their own development

---

## 🚀 Implementation Options

### Option A: Standalone Survey Page (Recommended for Quick Rollout)
**Timeline**: 2-3 hours  
**Pros**: Fast, email-friendly, no auth required initially  
**Cons**: Separate from main portal initially

### Option B: Team Member Portal with Auth (Comprehensive)
**Timeline**: 1-2 days  
**Pros**: Secure, integrated, allows updates over time  
**Cons**: Requires more setup

### Option C: Hybrid Approach (Best of Both)
**Timeline**: 4-6 hours  
**Pros**: Quick start with anonymous survey, migrate to portal later  
**Cons**: Requires data migration step

---

## 📋 Survey Flow & UX

### **Step 1: Welcome & Instructions** (30 seconds)
```
┌─────────────────────────────────────┐
│  🎯 Skills Assessment Survey         │
│                                     │
│  Help us understand your skills     │
│  and interests to:                  │
│                                     │
│  ✅ Identify development needs      │
│  ✅ Match you with opportunities    │
│  ✅ Plan team training              │
│  ✅ Track your growth               │
│                                     │
│  ⏱️ Takes 10-15 minutes             │
│  📱 Mobile-friendly                 │
│  💾 Save & resume anytime           │
│                                     │
│         [Start Assessment]          │
└─────────────────────────────────────┘
```

---

### **Step 2: Your Profile** (1 minute)
```
┌─────────────────────────────────────┐
│  About You                          │
│  ───────────────────────────────    │
│                                     │
│  Full Name: [____________]          │
│  Email: [____________]              │
│  Role: [▼ Select Role        ]      │
│    • Junior Accountant             │
│    • Senior Accountant             │
│    • Manager                       │
│    • Senior Manager                │
│    • Partner                       │
│                                     │
│  Department: [▼ Select       ]      │
│    • Audit & Assurance             │
│    • Tax                           │
│    • Advisory                      │
│    • Accounting Services           │
│                                     │
│  Years with Firm: [___]             │
│  Total Experience: [___] years      │
│                                     │
│         [Continue] [Save Draft]     │
└─────────────────────────────────────┘
```

---

### **Step 3: Skills Assessment** (8-12 minutes)

#### Category Navigation (Swipeable Cards)
```
┌─────────────────────────────────────┐
│  ← 1/8 Categories →                 │
│  ═══════════════════════════════    │
│                                     │
│  📊 Technical Accounting & Audit    │
│  ───────────────────────────────    │
│  Core accounting, audit, and tax    │
│                                     │
│  Progress: ████░░░░░░ 4/10          │
│                                     │
│  [Continue Assessment]              │
│                                     │
│  Quick Actions:                     │
│  [Skip Category] [Mark All N/A]     │
└─────────────────────────────────────┘
```

#### Individual Skill Rating (Card-Based)
```
┌─────────────────────────────────────┐
│  Skill 1 of 10                      │
│  ═══════════════════════════════    │
│                                     │
│  Financial Reporting (UK GAAP)      │
│  ───────────────────────────────    │
│  Expertise in UK Generally Accepted │
│  Accounting Principles              │
│                                     │
│  📈 YOUR SKILL LEVEL                │
│  ○ 1 - Awareness                    │
│  ○ 2 - Working Knowledge            │
│  ○ 3 - Proficient                   │
│  ● 4 - Advanced ✓                   │
│  ○ 5 - Master/Expert                │
│  ○ N/A - Not Applicable             │
│                                     │
│  ❤️ YOUR INTEREST LEVEL             │
│  ☆☆☆★★  (3/5)                       │
│                                     │
│  📅 Last Used:                       │
│  ○ Currently  ● Past Year           │
│  ○ 1-2 years  ○ 2+ years            │
│                                     │
│  📝 Notes (optional):                │
│  [Completed ACA audit module]       │
│                                     │
│         [← Back] [Next →]           │
└─────────────────────────────────────┘
```

#### Quick Rate Alternative (List View)
```
┌─────────────────────────────────────┐
│  Technical Accounting & Audit       │
│  ═══════════════════════════════    │
│                                     │
│  Financial Reporting (UK GAAP)      │
│  Skill: ●●●●○ (4/5) Interest: ★★★☆☆ │
│  [Edit]                             │
│  ───────────────────────────────    │
│  Financial Reporting (IFRS)         │
│  Skill: ●●●○○ (3/5) Interest: ★★☆☆☆ │
│  [Edit]                             │
│  ───────────────────────────────    │
│  Audit Planning & Execution         │
│  [Not Rated Yet]                    │
│  ───────────────────────────────    │
│                                     │
│  [Mark All Complete] [Next Category]│
└─────────────────────────────────────┘
```

---

### **Step 4: Development Interests** (2 minutes)
```
┌─────────────────────────────────────┐
│  Your Development Goals             │
│  ═══════════════════════════════    │
│                                     │
│  What areas would you like to       │
│  develop in the next 12 months?     │
│                                     │
│  ☑ AI & Machine Learning            │
│  ☑ Financial Modelling              │
│  ☐ M&A Due Diligence                │
│  ☑ Leadership Skills                │
│  ☐ Sector: Technology & SaaS        │
│                                     │
│  Preferred Learning Methods:        │
│  ☑ Online Courses                   │
│  ☑ Mentoring                        │
│  ☐ Conferences                      │
│  ☑ On-the-job Training              │
│                                     │
│  Additional Comments:                │
│  [Interested in AI applications for] │
│  [audit automation]                  │
│                                     │
│         [Continue]                  │
└─────────────────────────────────────┘
```

---

### **Step 5: Review & Submit** (1 minute)
```
┌─────────────────────────────────────┐
│  📊 Assessment Summary              │
│  ═══════════════════════════════    │
│                                     │
│  Skills Assessed: 62/68 (91%)       │
│                                     │
│  By Category:                       │
│  ✓ Technical Accounting: 10/10      │
│  ✓ Digital & Technology: 8/10       │
│  ✓ Advisory: 8/8                    │
│  • Sector Specialization: 5/8       │
│  ✓ Regulatory: 7/7                  │
│  ✓ Client Development: 7/7          │
│  • Leadership: 6/8                  │
│  ✓ Soft Skills: 10/10               │
│                                     │
│  Your Top 5 Strengths:              │
│  1. Financial Reporting (UK GAAP) 4 │
│  2. Written Communication 4         │
│  3. Client Relationship Mgmt 4      │
│  4. Excel Advanced Functions 4      │
│  5. Problem Solving 4               │
│                                     │
│  Development Areas (Interest > Skill):│
│  • AI & Machine Learning (5 vs 2)   │
│  • M&A Due Diligence (4 vs 2)       │
│  • Business Valuation (5 vs 3)      │
│                                     │
│  [← Edit] [Submit Assessment] [PDF] │
└─────────────────────────────────────┘
```

---

### **Step 6: Confirmation** (30 seconds)
```
┌─────────────────────────────────────┐
│  ✅ Assessment Complete!            │
│  ═══════════════════════════════    │
│                                     │
│  Thank you for completing your      │
│  skills assessment!                 │
│                                     │
│  📧 Confirmation sent to:           │
│  emma.wilson@practice.com           │
│                                     │
│  Next Steps:                        │
│  • View your skills profile         │
│  • See team comparison              │
│  • Review development plan          │
│  • Update anytime                   │
│                                     │
│  [View My Profile] [Download PDF]   │
│                                     │
│  Need to make changes?              │
│  [Edit Assessment]                  │
└─────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation

### Frontend Components

```typescript
// Survey Page Structure
survey/
  ├── index.tsx              // Main survey container
  ├── components/
  │   ├── WelcomeScreen.tsx
  │   ├── ProfileForm.tsx
  │   ├── CategoryNav.tsx
  │   ├── SkillRating.tsx    // Individual skill card
  │   ├── QuickRateList.tsx  // Alternative list view
  │   ├── DevelopmentGoals.tsx
  │   ├── ReviewSummary.tsx
  │   └── Confirmation.tsx
  ├── hooks/
  │   ├── useSurveyState.ts  // Local storage persistence
  │   └── useSubmitSurvey.ts
  └── utils/
      ├── progressCalculator.ts
      └── validationRules.ts
```

### API Endpoints Needed

```typescript
// POST /api/surveys/start
// - Creates survey session
// - Returns survey ID for saving progress

// POST /api/surveys/:id/save
// - Saves draft progress
// - Returns updated state

// POST /api/surveys/:id/submit
// - Validates completion
// - Creates skill_assessments records
// - Links to practice_member

// GET /api/surveys/:id
// - Retrieves draft survey
// - For resume functionality
```

### Database Schema

```sql
-- Survey Sessions (for draft saving)
CREATE TABLE survey_sessions (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  practice_id UUID,
  survey_data JSONB,  -- Stores all responses
  status VARCHAR(20),  -- draft, submitted, expired
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- After submission, data moves to:
-- - practice_members (profile)
-- - skill_assessments (ratings)
```

---

## 📧 Email Templates

### Initial Invitation
```
Subject: 🎯 Complete Your Skills Assessment - 15 Minutes

Hi [Name],

We're launching a team-wide skills assessment to help us:
✅ Identify development opportunities
✅ Plan training programs
✅ Match you with interesting projects
✅ Track career progression

📱 Mobile-Friendly Survey: [LINK]
⏱️ Takes: 10-15 minutes
💾 Save & Resume: Anytime

Your responses are:
• Confidential to HR & Management
• Used for development planning only
• Updatable quarterly

Please complete by: [DATE]

Questions? Reply to this email.

Thanks!
[Manager Name]
```

### Reminder Email (After 3 days)
```
Subject: Reminder: Skills Assessment Due [DATE]

Hi [Name],

Just a friendly reminder to complete your skills assessment.

Progress: [X]% Complete
[Continue Assessment →]

Need help? [FAQ Link]

Thanks!
```

### Completion Confirmation
```
Subject: ✅ Skills Assessment Complete - Next Steps

Hi [Name],

Thanks for completing your skills assessment!

📊 Your Summary:
• [X] skills assessed
• Top strengths: [Skill 1], [Skill 2], [Skill 3]
• Development interests: [Interest 1], [Interest 2]

What's Next:
1. Review with your manager (scheduled)
2. Receive personalized development plan
3. Access training resources

[View Full Report] [Update Assessment]

Questions? We're here to help.
```

---

## 🎨 Mobile UI Best Practices

### Design Principles
1. **One Question Per Screen** (for detailed mode)
2. **Large Touch Targets** (min 44x44px)
3. **Progress Indicators** (always visible)
4. **Auto-Save** (every 30 seconds)
5. **Offline Support** (local storage)
6. **Dark Mode** (optional)

### Performance
- **Lazy Load** categories
- **Prefetch** next category
- **Compress** images
- **Cache** skill data
- **Optimize** for 3G networks

### Accessibility
- **ARIA labels** on all inputs
- **Keyboard navigation**
- **Screen reader support**
- **High contrast mode**
- **Text resizing**

---

## 📊 Admin Dashboard

What you'll need to see:

```
┌──────────────────────────────────────────┐
│  Survey Progress Dashboard               │
│  ════════════════════════════════════    │
│                                          │
│  Completion Rate: ████████░░ 12/16 (75%) │
│                                          │
│  Status Breakdown:                       │
│  ✅ Completed: 12                        │
│  ⏳ In Progress: 3                       │
│  ❌ Not Started: 1                       │
│                                          │
│  By Department:                          │
│  Audit: 5/6 (83%)                        │
│  Tax: 4/5 (80%)                          │
│  Advisory: 3/5 (60%)                     │
│                                          │
│  [Send Reminders] [Export Data] [View Results]│
└──────────────────────────────────────────┘
```

---

## ⏱️ Implementation Timeline

### Phase 1: MVP (4-6 hours)
- [x] Skills populated in database ✅
- [ ] Create survey page component
- [ ] Implement skill rating UI
- [ ] Add draft save functionality
- [ ] Create submission API endpoint
- [ ] Test on mobile devices

### Phase 2: Email & Polish (2-3 hours)
- [ ] Design email templates
- [ ] Create invitation system
- [ ] Add confirmation emails
- [ ] Build admin dashboard
- [ ] Add PDF export

### Phase 3: Portal Integration (4-6 hours)
- [ ] Add authentication (next section)
- [ ] Build team member login
- [ ] Add profile editing
- [ ] Create progress tracking
- [ ] Enable quarterly updates

---

## 🔐 Security & Privacy

### Data Protection
- HTTPS only
- Encrypted storage
- GDPR compliant
- Right to deletion
- Data export (PDF)

### Access Control
- Survey links expire after 30 days
- One submission per email
- Manager access to direct reports only
- Aggregated data only for senior leadership

---

## 📈 Success Metrics

Track these:
- **Completion Rate**: Target 90%+ in 2 weeks
- **Time to Complete**: Target < 15 minutes
- **Mobile vs Desktop**: Expect 60/40 split
- **Drop-off Points**: Identify friction
- **Data Quality**: Check for "straight-lining"

---

## 💡 Next Steps

1. **Review this design** - Any changes needed?
2. **Confirm approach** - Option A, B, or C?
3. **Approve email copy** - Modify templates?
4. **Set timeline** - When do you want to launch?

Once approved, I'll:
✅ Build the survey components
✅ Create the API endpoints
✅ Set up email system
✅ Provide testing instructions

---

**Questions or feedback?** Let me know what to adjust!

