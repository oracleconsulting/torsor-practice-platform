# 🔐 Team Member Access Portal
**Oracle Consulting AI - Team Management Self-Service**

---

## 🎯 Overview

A dedicated, secure portal within TORSOR's Team Management section where your 16 team members can:
- Login with their credentials
- View their skills profile
- Complete/update assessments
- Track their development
- Access training resources
- View team insights (limited)

---

## 🏗️ Architecture

### Portal Structure
```
TORSOR/
└── Team Management/
    ├── (Existing Manager Views)
    │   ├── Skills Matrix
    │   ├── Gap Analysis
    │   ├── Development Planning
    │   └── Team Metrics
    │
    └── 🆕 Team Member Portal/    ← NEW SECTION
        ├── Login Page
        ├── My Dashboard
        ├── My Skills Profile
        ├── Skills Assessment
        ├── My Development
        └── Team Insights
```

---

## 🔐 Authentication & Access Control

### User Roles & Permissions

```typescript
interface TeamMemberPermissions {
  // What team members CAN do:
  viewOwnProfile: true,
  editOwnProfile: true,
  viewOwnSkills: true,
  updateOwnSkills: true,
  viewOwnDevelopmentPlan: true,
  viewTeamAverages: true,        // Anonymized
  viewTrainingResources: true,
  
  // What team members CANNOT do:
  viewOtherProfiles: false,       // Unless shared
  viewIndividualComparisons: false,
  editTeamData: false,
  viewSalaryData: false,
  accessAdminSettings: false
}
```

### Login Options

#### Option 1: Supabase Auth (Recommended)
```typescript
// Simple email/password login
// Built-in security
// Password reset flows
// 2FA optional

supabase.auth.signInWithPassword({
  email: 'emma.wilson@practice.com',
  password: '********'
})
```

#### Option 2: Magic Link (Passwordless)
```typescript
// Email a login link
// No password to remember
// More secure
// Better UX

supabase.auth.signInWithOtp({
  email: 'emma.wilson@practice.com',
  options: {
    emailRedirectTo: 'https://torsor.app/team-portal'
  }
})
```

#### Option 3: SSO (Future)
```
// Single Sign-On with Google/Microsoft
// Enterprise-grade
// Seamless experience
```

---

## 📱 Portal Pages & Features

### 1. Login Page
```
┌─────────────────────────────────────────┐
│                                         │
│         🏢 TORSOR                       │
│         Team Portal                     │
│                                         │
│  ────────────────────────────────────   │
│                                         │
│  Email:                                 │
│  [emma.wilson@practice.com]             │
│                                         │
│  Password:                              │
│  [••••••••]                             │
│                                         │
│  [  Login  ]                            │
│                                         │
│  [Forgot Password?] [Request Access]    │
│                                         │
│  ─── or ───                             │
│                                         │
│  [📧 Send Magic Link]                   │
│                                         │
└─────────────────────────────────────────┘
```

---

### 2. My Dashboard (Landing Page)
```
┌─────────────────────────────────────────────────────────┐
│  👋 Welcome back, Emma!                                 │
│  ════════════════════════════════════════════════════   │
│                                                         │
│  📊 Your Skills Overview                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Overall Score: 2.8/5  [██████░░░░] 56%         │   │
│  │  Skills Assessed: 62/68                         │   │
│  │  Last Updated: 2 days ago                       │   │
│  │                                                  │   │
│  │  [Update Skills] [View Full Profile]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🎯 Your Development Goals (3 Active)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. AI & Machine Learning                       │   │
│  │     Progress: ████░░░░░░ 40% • Due: Dec 2025   │   │
│  │     [View Details]                              │   │
│  │                                                  │   │
│  │  2. Financial Modelling                         │   │
│  │     Progress: ██████░░░░ 60% • Due: Nov 2025   │   │
│  │     [View Details]                              │   │
│  │                                                  │   │
│  │  3. Leadership Skills                           │   │
│  │     Progress: ██░░░░░░░░ 20% • Due: Jan 2026   │   │
│  │     [View Details]                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📚 Recommended Training (New)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  • Advanced Excel for Finance (2h)              │   │
│  │  • Xero Advisor Certification (3h)              │   │
│  │  • Effective Client Communication (1h)          │   │
│  │                                                  │   │
│  │  [View All Courses]                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📈 Team Insights                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Your Rank in Category:                         │   │
│  │  • Digital & Technology: Top 25% 🌟            │   │
│  │  • Soft Skills: Top 15% ⭐                      │   │
│  │  • Technical Accounting: Average               │   │
│  │                                                  │   │
│  │  Team Average: 3.2/5 (You: 2.8/5)              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [My Profile] [My Skills] [My Development] [Logout]     │
└─────────────────────────────────────────────────────────┘
```

---

### 3. My Skills Profile
```
┌─────────────────────────────────────────────────────────┐
│  Emma Wilson • Junior Advisor                           │
│  ════════════════════════════════════════════════════   │
│                                                         │
│  📊 Skills Overview                                     │
│  Overall Score: 2.8/5 [██████░░░░] 56%                 │
│  Skills Assessed: 62/68 (91%)                          │
│  Last Updated: Oct 5, 2025                             │
│                                                         │
│  [📝 Update Assessment] [📄 Download PDF]              │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  📊 Skills by Category                                  │
│                                                         │
│  ▼ Technical Accounting & Audit       2.2/5            │
│     10 skills • [View Details]                         │
│     ├─ Financial Reporting (UK GAAP)  ████○ 4/5        │
│     ├─ Audit Planning                 ██○○○ 2/5        │
│     ├─ Corporate Tax                  ██○○○ 2/5        │
│     └─ [+7 more]                                       │
│                                                         │
│  ▼ Digital & Technology               3.8/5 ⭐         │
│     8 skills • [View Details]                          │
│     ├─ Xero                           ████○ 4/5        │
│     ├─ Excel Advanced                 ████● 5/5        │
│     ├─ Data Analytics                 ███○○ 3/5        │
│     └─ [+5 more]                                       │
│                                                         │
│  ▶ Advisory & Consulting              1.5/5            │
│     0 skills • [Assess Skills]                         │
│                                                         │
│  [View All Categories] [Compare with Team]              │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  🌟 Your Top 5 Strengths                                │
│  1. Excel Advanced Functions          5/5 ████●        │
│  2. Written Communication             4/5 ████○        │
│  3. Xero Platform                     4/5 ████○        │
│  4. Problem Solving                   4/5 ████○        │
│  5. Time Management                   4/5 ████○        │
│                                                         │
│  🎯 Highest Interest Areas                              │
│  1. AI & Machine Learning             ★★★★★ (Skill: 2) │
│  2. Business Valuation                ★★★★★ (Skill: 0) │
│  3. M&A Due Diligence                 ★★★★☆ (Skill: 0) │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Skills Assessment (Mobile-Optimized)
```
┌─────────────────────────────────────────┐
│  Update Your Skills                     │
│  ════════════════════════════════════   │
│                                         │
│  Last Assessment: Oct 5, 2025           │
│  Progress: ████████░░ 62/68 (91%)      │
│                                         │
│  Choose Category to Update:             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📊 Technical Accounting           │ │
│  │ 10 skills • Last: Oct 5           │ │
│  │ [Update]                          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 💻 Digital & Technology           │ │
│  │ 8 skills • Last: Oct 5            │ │
│  │ [Update]                          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 💼 Advisory & Consulting          │ │
│  │ 0/8 skills • Never assessed       │ │
│  │ [Start Assessment]   🔴           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Quick Update All] [Full Re-Assessment]│
│                                         │
│  💡 Tip: Update quarterly or when      │
│     you learn new skills                │
└─────────────────────────────────────────┘
```

---

### 5. My Development Plan
```
┌─────────────────────────────────────────────────────────┐
│  My Development Plan                                     │
│  ════════════════════════════════════════════════════   │
│                                                         │
│  🎯 Active Goals (3)                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. AI & Machine Learning Applications          │   │
│  │     Current: 2/5 → Target: 4/5                  │   │
│  │     Timeline: 6 months • Due: Dec 2025          │   │
│  │     Progress: ████░░░░░░ 40%                    │   │
│  │                                                  │   │
│  │     ✅ Completed:                               │   │
│  │     • AI Fundamentals Course (3h)               │   │
│  │     • ChatGPT for Accounting Webinar (1h)       │   │
│  │                                                  │   │
│  │     ⏳ In Progress:                              │   │
│  │     • Machine Learning Basics (50% • 2h left)   │   │
│  │                                                  │   │
│  │     📋 Next Steps:                               │   │
│  │     • AI Audit Tools Workshop (Nov 15)          │   │
│  │     • Practical Project with Manager            │   │
│  │                                                  │   │
│  │     [View Details] [Mark Milestone]             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  2. Financial Modelling                         │   │
│  │     Current: 3/5 → Target: 4/5                  │   │
│  │     Timeline: 4 months • Due: Nov 2025          │   │
│  │     Progress: ██████░░░░ 60%                    │   │
│  │                                                  │   │
│  │     ✅ Advanced Excel                           │   │
│  │     ✅ DCF Modelling Course                     │   │
│  │     ⏳ LBO Model Workshop (In Progress)         │   │
│  │                                                  │   │
│  │     [View Details]                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📚 Recommended Resources (8 Available)                 │
│  • AI-Powered Audit Analytics (Video • 2h)             │
│  • Excel Power Query for Accountants (Course • 4h)     │
│  • Building Financial Models (Book • Self-paced)       │
│                                                         │
│  [View All Resources] [Request New Goal]                │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  📅 Upcoming Reviews                                    │
│  • Quarterly Review with Manager: Nov 15, 2025         │
│  • Annual Performance Review: Jan 2026                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 6. Team Insights (Limited View)
```
┌─────────────────────────────────────────────────────────┐
│  Team Insights                                           │
│  ════════════════════════════════════════════════════   │
│                                                         │
│  How You Compare (Anonymized)                           │
│                                                         │
│  📊 Your Overall Score: 2.8/5                           │
│     Team Average: 3.2/5                                 │
│     ┌──────────────────────────────────────┐           │
│     │ You •           │ Team Avg ×          │           │
│     │ ○═•═══════×═══════════○              │           │
│     │ 1    2   3    4    5                 │           │
│     └──────────────────────────────────────┘           │
│                                                         │
│  📈 Your Strongest Categories (vs Team)                 │
│  1. Digital & Technology                                │
│     You: 3.8/5 • Team: 3.0/5  ⬆️ Top 25%               │
│                                                         │
│  2. Soft Skills & Communication                         │
│     You: 3.5/5 • Team: 3.3/5  ⬆️ Top 35%               │
│                                                         │
│  📉 Development Opportunities                           │
│  1. Advisory & Consulting                               │
│     You: 1.5/5 • Team: 3.5/5  ⬇️ Bottom 20%            │
│                                                         │
│  2. Leadership & Management                             │
│     You: 0/5 • Team: 2.8/5    ⬇️ Not Assessed          │
│                                                         │
│  🌟 Team Top Skills (Skills you might learn)            │
│  • Business Valuation (Team Avg: 3.8/5)                │
│  • Strategic Thinking (Team Avg: 3.7/5)                │
│  • M&A Due Diligence (Team Avg: 3.5/5)                 │
│                                                         │
│  💡 Based on team data, consider developing:            │
│     Advisory & Leadership skills                        │
│                                                         │
│  ⚠️ Note: Individual team member data is private       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Database Updates

```sql
-- Add login tracking
ALTER TABLE practice_members ADD COLUMN last_login_at TIMESTAMPTZ;
ALTER TABLE practice_members ADD COLUMN login_count INT DEFAULT 0;

-- Add privacy settings
ALTER TABLE practice_members ADD COLUMN privacy_settings JSONB DEFAULT '{
  "share_profile": false,
  "show_in_team_rankings": true,
  "allow_comparisons": false
}'::jsonb;

-- Add notification preferences
ALTER TABLE practice_members ADD COLUMN notification_prefs JSONB DEFAULT '{
  "email_reminders": true,
  "quarterly_review": true,
  "training_recommendations": true,
  "goal_milestones": true
}'::jsonb;
```

### New API Endpoints

```typescript
// Authentication
POST   /api/auth/team-member/login
POST   /api/auth/team-member/magic-link
POST   /api/auth/team-member/logout
POST   /api/auth/team-member/reset-password

// Profile
GET    /api/team-portal/profile
PUT    /api/team-portal/profile
GET    /api/team-portal/skills
PUT    /api/team-portal/skills/:skillId

// Development
GET    /api/team-portal/development-goals
POST   /api/team-portal/development-goals
PUT    /api/team-portal/development-goals/:id
GET    /api/team-portal/training-resources

// Insights
GET    /api/team-portal/team-insights  // Anonymized
GET    /api/team-portal/benchmarks     // Aggregated only
```

### Row Level Security (RLS) Policies

```sql
-- Team members can only see their own data
CREATE POLICY "Team members see own profile"
ON practice_members FOR SELECT
USING (auth.uid() = user_id);

-- Team members can only update their own skills
CREATE POLICY "Team members update own skills"
ON skill_assessments FOR ALL
USING (
  team_member_id IN (
    SELECT id FROM practice_members 
    WHERE user_id = auth.uid()
  )
);

-- Team members see aggregated team data only
CREATE POLICY "Team members see anonymized insights"
ON skill_assessments FOR SELECT
USING (
  -- Custom function to return anonymized aggregates
  is_anonymized_query()
);
```

---

## 🎨 UI Components to Build

```typescript
// Portal Layout
components/team-portal/
  ├── Layout.tsx              // Portal wrapper with nav
  ├── Login.tsx
  ├── Dashboard.tsx
  ├── SkillsProfile/
  │   ├── index.tsx
  │   ├── CategoryCard.tsx
  │   ├── SkillBar.tsx
  │   └── TopSkills.tsx
  ├── Assessment/
  │   ├── CategorySelect.tsx
  │   ├── SkillRating.tsx
  │   └── Progress.tsx
  ├── Development/
  │   ├── GoalCard.tsx
  │   ├── ResourceList.tsx
  │   └── Timeline.tsx
  └── TeamInsights/
      ├── Comparison.tsx
      ├── Rankings.tsx
      └── Recommendations.tsx
```

---

## 📱 Mobile Experience

### Responsive Design
```css
/* Mobile-first approach */
.portal-container {
  /* Mobile: Stack everything */
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
  }
  
  /* Tablet: 2-column grid */
  @media (min-width: 769px) and (max-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* Desktop: Full layout */
  @media (min-width: 1025px) {
    display: grid;
    grid-template-columns: 250px 1fr 300px;
  }
}
```

### Progressive Web App (PWA)
```json
// manifest.json
{
  "name": "TORSOR Team Portal",
  "short_name": "Team Portal",
  "start_url": "/team-portal",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🚀 Rollout Plan

### Phase 1: Core Portal (Week 1)
- [ ] Set up authentication
- [ ] Build login page
- [ ] Create dashboard
- [ ] Implement skills profile view
- [ ] Add RLS policies

### Phase 2: Self-Service (Week 2)
- [ ] Skills assessment integration
- [ ] Profile editing
- [ ] Development goals view
- [ ] Training resources

### Phase 3: Insights & Polish (Week 3)
- [ ] Team insights (anonymized)
- [ ] Notifications
- [ ] PDF exports
- [ ] Mobile optimization
- [ ] User testing

### Phase 4: Launch (Week 4)
- [ ] Security audit
- [ ] Load testing
- [ ] User training
- [ ] Soft launch (5 users)
- [ ] Full launch (16 users)

---

## 🔒 Security Considerations

### Data Privacy
- ✅ End-to-end encryption
- ✅ Row-level security
- ✅ Audit logging
- ✅ GDPR compliance
- ✅ Right to delete

### Authentication
- ✅ Password hashing (bcrypt)
- ✅ Session management
- ✅ 2FA optional
- ✅ Magic link backup
- ✅ Account lockout (5 attempts)

### Authorization
- ✅ Role-based access
- ✅ Resource-level permissions
- ✅ API rate limiting
- ✅ CSRF protection
- ✅ XSS prevention

---

## 📊 Analytics & Monitoring

### Track These Metrics
```typescript
// User Engagement
- Login frequency
- Time spent in portal
- Features used most
- Drop-off points
- Mobile vs desktop usage

// Skills Data
- Assessment completion rate
- Update frequency
- Skills coverage
- Development goal completion
- Resource utilization

// System Health
- API response times
- Error rates
- Peak usage times
- Database performance
```

---

## 💡 Future Enhancements

### Q1 2026
- [ ] Peer endorsements
- [ ] Skills verification
- [ ] Gamification (badges, points)
- [ ] Social learning features
- [ ] Skills marketplace (internal)

### Q2 2026
- [ ] AI-powered recommendations
- [ ] Personalized learning paths
- [ ] Video training integration
- [ ] Career pathing tool
- [ ] Skills gap predictions

---

## ✅ Next Steps

1. **Review Design** - Any changes or additions?
2. **Prioritize Features** - What's must-have vs nice-to-have?
3. **Set Timeline** - When do you need this live?
4. **Approve Budget** - Development time required?

Once approved, I'll:
✅ Build the portal components
✅ Set up authentication
✅ Configure security policies
✅ Create admin controls
✅ Provide deployment guide

---

**Ready to proceed? Let me know what to start with!**

