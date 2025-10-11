# TORSOR Skills Portal - Admin Guide

## Administrator Overview

This guide is for system administrators, practice managers, and team leads who need to manage the TORSOR Skills Portal.

---

## User Management 👥

### Inviting New Users

1. Go to **Team Management** → **Invitations** tab
2. Click **"Invite Team Member"**
3. Enter details:
   - Email address
   - Full name
   - Role (Member, Manager, Admin)
   - Department/team
4. Click **"Send Invitation"**
5. User receives email with onboarding link

**Bulk Invitations:**
1. Click **"Bulk Invite"**
2. Upload CSV file with columns:
   - `email`, `name`, `role`, `department`
3. Preview invitations
4. Click **"Send All"**

### Managing Permissions

**Role Levels:**
- **Member** - Basic access (own data only)
- **Manager** - Team views and reports
- **Admin** - Full system access

**Permission Changes:**
1. Go to **Admin Dashboard** → **Users**
2. Find user in list
3. Click **"Edit"**
4. Change role
5. Save changes

### Deactivating Accounts

**When to Deactivate:**
- User leaves organization
- Extended leave
- Security concerns

**How to Deactivate:**
1. Go to **Admin Dashboard** → **Users**
2. Find user
3. Click **"Deactivate"**
4. Select reason
5. Confirm

**Effects of Deactivation:**
- User cannot log in
- Data preserved (not deleted)
- Mentoring relationships paused
- CPD records archived
- Can be reactivated later

---

## Onboarding Management 📋

### Monitoring Completion Rates

**Dashboard View:**
1. Go to **Team Management** → **Onboarding** tab
2. View metrics:
   - Overall completion rate
   - Average time to complete
   - Current step distribution
   - Stuck users
   - Drop-off points

**Key Metrics:**
- ✅ Completion Rate: Target >90%
- ⏱️ Average Time: Target <45 minutes
- 🚨 Stuck Users: Users on same step >7 days
- 📉 Drop-off: Steps where users quit

### Identifying Stuck Users

**Automatic Alerts:**
- Users on same step >5 days → Yellow flag
- Users on same step >10 days → Red flag
- No activity >14 days → Critical alert

**Manual Check:**
1. Go to **Onboarding** tab
2. Filter by "Status: In Progress"
3. Sort by "Last Activity" (oldest first)
4. View which step each user is on

**Common Stuck Points:**
- Step 2 (Skills Assessment) - Too overwhelming
- Step 3 (VARK Assessment) - Not understanding purpose
- Step 6 (Development Plan) - Need guidance

### Sending Reminders

**Automatic Reminders:**
- Day 3: Gentle nudge
- Day 7: Helpful resources
- Day 14: Personal outreach offer

**Manual Reminders:**
1. Go to **Onboarding** tab
2. Select stuck users
3. Click **"Send Reminder"**
4. Choose template or write custom message
5. Include offer to help personally

**Reminder Templates:**
- "Quick Check-in"
- "Need Help?"
- "Almost There!"
- "Let's Connect"

---

## System Configuration ⚙️

### Gamification Rules

**Points System:**
1. Go to **Admin Dashboard** → **Settings** → **Gamification**
2. Configure points for:
   - Skills assessment completion
   - Skill level increases
   - CPD activity logging
   - Mentoring sessions
   - Streak multipliers
3. Save changes

**Adjusting Point Values:**
- Increase to boost engagement
- Decrease if points feel too easy
- Balance across activities
- Consider team size

### Achievement Badges

**Creating New Badges:**
1. Go to **Settings** → **Achievements**
2. Click **"Create Badge"**
3. Enter details:
   - Name
   - Description
   - Icon (emoji or upload image)
   - Rarity (common → legendary)
   - Unlock criteria
   - Points value
4. Preview badge
5. Publish

**Editing Existing Badges:**
1. Find badge in list
2. Click **"Edit"**
3. Modify details
4. Update criteria
5. Save (retroactive changes optional)

**Badge Rarity Guidelines:**
- **Common** - Easy to get (80% should earn)
- **Uncommon** - Moderate effort (50% should earn)
- **Rare** - Significant achievement (20% should earn)
- **Epic** - Exceptional (5% should earn)
- **Legendary** - Elite (1% should earn)

### CPD Targets

**Setting Annual Targets:**
1. Go to **Settings** → **CPD**
2. Set targets by:
   - Role level
   - Department
   - Individual (override)
3. Common targets:
   - Junior: 20-25 hours/year
   - Mid: 25-35 hours/year
   - Senior: 35-40 hours/year
   - Partner: 40+ hours/year
4. Save targets

**CPD Categories:**
- Structured (minimum 50%)
- Unstructured (maximum 50%)
- Mix requirements by role

**Target Tracking:**
- Dashboard shows progress
- Alerts when below pace
- Compliance reports monthly

---

## Reporting & Analytics 📊

### User Engagement Reports

**Dashboard Metrics:**
1. Go to **Admin Dashboard** → **Analytics**
2. View key metrics:
   - Daily Active Users (DAU)
   - Weekly Active Users (WAU)
   - Monthly Active Users (MAU)
   - Feature usage rates
   - Time spent in portal
   - Drop-off points

**Engagement Indicators:**
- 🟢 Good: >80% monthly active
- 🟡 Watch: 60-80% monthly active
- 🔴 Action Needed: <60% monthly active

### Skills Reports

**Team Skills Coverage:**
1. Go to **Analytics** → **Skills**
2. View:
   - Coverage by skill category
   - Average skill levels
   - Critical skill gaps
   - Top performers per skill
   - Skills trending up/down

**Export Options:**
- PDF report (summary)
- CSV (raw data)
- Excel (formatted tables)
- PowerPoint (presentation)

### CPD Compliance Reports

**Monthly CPD Report:**
1. Go to **CPD Tracker** → **Reports**
2. Select month/quarter
3. View:
   - Total hours logged
   - Compliance rate
   - On-pace percentage
   - Category breakdown
   - Individual progress

**Compliance Alerts:**
- Behind pace (< 25% of target at quarter)
- Not logging (no activity 30+ days)
- Non-compliant (end of year)

**Export for Compliance:**
1. Select time period
2. Choose format (PDF/Excel)
3. Include:
   - Individual summaries
   - Evidence attachments
   - Learning outcomes
   - Skills mapped
4. Download report

### Custom Reports

**Creating Custom Reports:**
1. Go to **Analytics** → **Custom**
2. Select:
   - Data source (Skills, CPD, Mentoring, etc.)
   - Metrics to include
   - Filters (date, department, role)
   - Grouping (by person, team, skill)
   - Chart type
3. Preview report
4. Save template
5. Schedule (daily/weekly/monthly)
6. Choose recipients

---

## Mentoring Program Management 🤝

### Matching Algorithm

**Algorithm Settings:**
1. Go to **Settings** → **Mentoring**
2. Configure weights:
   - Skill expertise match (40%)
   - VARK compatibility (20%)
   - Availability overlap (20%)
   - Department proximity (10%)
   - Past ratings (10%)
3. Save settings

**Manual Matching:**
1. Go to **Mentoring Hub** → **Admin View**
2. Click **"Suggest Match"**
3. Select mentor and mentee
4. View compatibility score
5. Send introduction email
6. Track acceptance

### Program Metrics

**Key Metrics to Track:**
- Active mentoring pairs
- Average sessions per pair
- Mentee satisfaction scores
- Mentor retention rate
- Skills improved through mentoring
- Time to first session
- Goal completion rate

**Red Flags:**
- No sessions scheduled in 30 days
- Low mentee satisfaction (<3/5)
- Mentor overloaded (>3 mentees)
- Goals not set after 2 sessions

### Mentoring Quality

**Ensuring Quality:**
1. Monitor session frequency
2. Review feedback scores
3. Check goal progress
4. Intervene if issues detected
5. Provide mentor training
6. Recognize great mentors

**Mentor Recognition:**
- "Mentor of the Month" badge
- Public recognition
- Extra points
- Thank you notes
- Mentor appreciation events

---

## Skills Assessment Management 🎯

### Assessment Periods

**Setting Assessment Windows:**
1. Go to **Settings** → **Assessments**
2. Define periods:
   - Quarterly assessments (recommended)
   - Annual reviews
   - Ad-hoc assessments
3. Set dates:
   - Start date
   - End date
   - Reminder schedule
4. Auto-notify users

**Assessment Reminders:**
- 2 weeks before: "Assessment opening soon"
- Day 1: "Assessment now open"
- Midpoint: "Don't forget to complete"
- 3 days before close: "Final reminder"

### Skill Categories

**Adding New Categories:**
1. Go to **Settings** → **Skills** → **Categories**
2. Click **"Add Category"**
3. Enter:
   - Category name
   - Description
   - Icon
   - Required level (by role)
4. Add skills to category
5. Publish

**Adding New Skills:**
1. Select category
2. Click **"Add Skill"**
3. Enter:
   - Skill name
   - Description
   - Required level
   - Related skills
   - Learning resources
4. Save

### Assessment Analytics

**Completion Tracking:**
1. Go to **Skills Dashboard** → **Admin View**
2. View:
   - Completion rate
   - Average time to complete
   - Skills most assessed
   - Distribution of levels
   - Improvement trends

**Quality Checks:**
- All ratings at 5 → Investigate (may not understand scale)
- All ratings at 1 → Check if genuine or need support
- No interest ratings → Remind about importance
- Very quick completion → May need review

---

## System Health & Maintenance 🔧

### Monitoring System Health

**Daily Checks:**
- [ ] Error logs reviewed
- [ ] Performance metrics normal
- [ ] Backup completed
- [ ] User reports addressed

**Weekly Tasks:**
- [ ] Database optimization
- [ ] Inactive users reviewed
- [ ] Content updates
- [ ] Analytics reviewed

**Monthly Tasks:**
- [ ] Compliance reports
- [ ] Feature usage analysis
- [ ] User feedback synthesis
- [ ] Training materials update

### Database Management

**Backup Schedule:**
- Automatic daily backups
- Weekly full backups
- Retention: 90 days

**Data Cleanup:**
1. Go to **Admin** → **Maintenance**
2. Options:
   - Archive old CPD records (>3 years)
   - Remove draft assessments (>6 months)
   - Clean orphaned data
   - Optimize tables
3. Schedule cleanup

### User Support

**Support Dashboard:**
1. Go to **Admin** → **Support**
2. View:
   - Open tickets
   - Common issues
   - Response times
   - User satisfaction

**Common Support Issues:**
1. **Login problems** - Password reset, email verification
2. **Assessment not saving** - Browser/connection issues
3. **Missing features** - Permissions check
4. **Data export** - Format/content questions
5. **Mobile app** - Installation help

**Support Best Practices:**
- Respond within 24 hours
- Provide clear steps
- Offer to schedule call if complex
- Document solutions for FAQ
- Follow up to ensure resolution

---

## Best Practices 💡

### User Adoption

**Increasing Engagement:**
1. **Leadership Buy-in** - Get partners using it first
2. **Clear Communication** - Explain benefits, not just features
3. **Training Sessions** - Offer live demos and Q&A
4. **Quick Wins** - Show value immediately
5. **Celebrate Success** - Share user stories
6. **Regular Updates** - Keep content fresh
7. **Make it Easy** - Minimize clicks, maximize value

**Adoption Metrics:**
- Week 1: 40% logged in
- Week 2: 60% completed onboarding
- Week 4: 70% actively using
- Week 8: 80% monthly active

### Data Quality

**Ensuring Quality Data:**
1. **Regular Audits** - Spot check assessments
2. **Clear Guidelines** - Rating scales well defined
3. **Examples** - Show good vs bad assessments
4. **Feedback** - Tell users if assessments seem off
5. **Training** - Educate on honest self-assessment

**Red Flags:**
- All 5s or all 1s
- No variance across skills
- Very quick completion
- No notes/context
- Identical to previous assessment

### System Optimization

**Performance Optimization:**
1. Archive old data
2. Optimize images
3. Cache frequently accessed data
4. Monitor slow queries
5. Regular maintenance windows

**User Experience:**
1. Test on real devices
2. Gather user feedback
3. A/B test new features
4. Monitor drop-offs
5. Quick iterations

---

## Troubleshooting Common Issues 🔧

### Users Can't Log In

**Diagnostics:**
1. Check if email verified
2. Verify user account active
3. Test password reset flow
4. Check for typos in email
5. Test in different browser

**Solutions:**
- Resend verification email
- Manual password reset
- Reactivate account if needed
- Update email if incorrect

### Data Not Syncing

**Diagnostics:**
1. Check user's internet connection
2. Verify database connectivity
3. Check for browser errors (console)
4. Test with different user
5. Review recent system changes

**Solutions:**
- User refreshes page
- Clear browser cache
- Database connection restart
- Rollback recent deploy if widespread

### Reports Not Generating

**Diagnostics:**
1. Check database query performance
2. Verify data integrity
3. Check date ranges selected
4. Test with smaller dataset
5. Review error logs

**Solutions:**
- Optimize slow queries
- Fix data inconsistencies
- Adjust date ranges
- Generate in batches
- Contact support if persists

---

## Security & Compliance 🔒

### Access Control

**Permission Levels:**
- **View Only** - Can view own data
- **Edit Own** - Can edit own records
- **Team View** - Can view team data
- **Team Admin** - Can manage team
- **System Admin** - Full access

**Security Best Practices:**
1. Regular permission audits
2. Remove access when users leave
3. Use strong password policies
4. Enable 2FA for admins
5. Monitor for suspicious activity

### Data Privacy

**GDPR Compliance:**
1. Users can export data
2. Users can delete accounts
3. Data retention policies enforced
4. Privacy policy accessible
5. Cookie consent implemented

**Data Handling:**
- Encrypted at rest
- Encrypted in transit (HTTPS)
- Regular security audits
- Access logs maintained
- Breach procedures documented

---

## Emergency Procedures 🚨

### System Outage

**Immediate Actions:**
1. Check system status dashboard
2. Notify team of outage
3. Contact hosting provider if needed
4. Post status updates
5. Implement rollback if recent deploy

**Communication Template:**
> "We're aware of an issue with the Skills Portal and are working to resolve it. Expected resolution: [time]. We'll keep you updated."

### Data Loss

**Recovery Steps:**
1. Stop all write operations
2. Assess extent of loss
3. Restore from most recent backup
4. Validate data integrity
5. Notify affected users
6. Document incident

**Prevention:**
- Automated daily backups
- Tested restore procedures
- Redundant storage
- Version control for data changes

---

## Support Contacts 📞

**Technical Support:**
- Email: support@torsor.com
- Phone: [Your number]
- Hours: Mon-Fri 9am-5pm

**Emergency Support:**
- On-Call: [Number]
- Available: 24/7 for critical issues

**Product Team:**
- Feature requests: features@torsor.com
- Bug reports: bugs@torsor.com

---

## Appendix 📚

### Keyboard Shortcuts (Admin)

| Shortcut | Action |
|----------|--------|
| `⌘⇧A` | Admin dashboard |
| `⌘⇧U` | User management |
| `⌘⇧R` | Reports |
| `⌘⇧S` | Settings |

### API Access (Advanced)

Admins can access the API for custom integrations:
- Documentation: api.torsor.com/docs
- API key: Generate in Settings → API
- Rate limits: 1000 requests/hour

### Change Log

Keep track of system changes and updates:
- Feature additions
- Bug fixes
- Performance improvements
- Security patches

---

**Questions?** Contact the TORSOR support team anytime.

**Admin Training:** Quarterly admin training sessions available. Contact training@torsor.com to register.

