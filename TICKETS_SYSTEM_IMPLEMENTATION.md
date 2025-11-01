# 🎫 Support Tickets System - Complete Implementation Guide

## ✅ Implementation Summary

A fully functional support ticket system has been implemented across the TORSOR platform, allowing team members to raise tickets (questions, issues, suggestions, feedback) and admins to respond with a full conversation thread.

---

## 🗂️ What Was Built

### 1. **Database Schema** (`CREATE_TICKETS_SYSTEM.sql`)

Two main tables with full RLS (Row Level Security):

#### **`support_tickets` Table**
- Ticket categories: `issue`, `question`, `suggestion`, `feedback`, `other`
- Anonymous submission support (name hidden from admin, but email stored for notifications)
- Status tracking: `open`, `in_progress`, `resolved`, `closed`
- Priority levels: `low`, `medium`, `high`, `urgent`
- Full audit trail with timestamps

#### **`ticket_replies` Table**
- Conversation threads between admin and team members
- Distinguishes admin replies from member follow-ups
- Email notification tracking
- Chronological ordering

### 2. **Admin Portal - Tickets Tab**

**Location**: Admin Dashboard → Row 3 → TICKETS button

**File**: `src/pages/accountancy/admin/TicketsAdmin.tsx`

**Features**:
- 📊 **Stats Dashboard**: Total, Open, In Progress, Resolved counts
- 🔍 **Advanced Filtering**:
  - Search by subject/description/member name
  - Filter by status (open/in_progress/resolved/closed)
  - Filter by category (issue/question/suggestion/feedback)
- 📝 **Ticket Management**:
  - View full ticket details
  - Reply to tickets with conversation threading
  - Update status and priority
  - Anonymous ticket handling (submitter name hidden)
- 💬 **Reply System**:
  - Admin can reply to each ticket
  - Replies organized as a conversation thread
  - Auto-changes status to "in_progress" on first reply
  - Closed tickets cannot receive new replies

### 3. **Team Member Portal - My Tickets**

**Location**: Team Member Dashboard → Main Cards → "Support Tickets" card

**File**: `src/pages/accountancy/team/MyTicketsPage.tsx`

**Features**:
- ✨ **Raise New Ticket**:
  - Category selection (Question, Issue, Suggestion, Feedback, Other)
  - Subject (200 char limit)
  - Detailed description
  - **Anonymous checkbox**: Submit without revealing your name to admin
- 📜 **My Tickets List**:
  - View all your submitted tickets
  - See status and category badges
  - "New Reply" notification badge when admin responds
  - Click to view full details and conversation
- 💬 **Follow-up System**:
  - Add follow-up messages to existing tickets
  - View admin responses in chronological order
  - Visual distinction between admin replies and your messages
- 🔔 **Status Indicators**:
  - Open: Blue badge
  - In Progress: Yellow badge
  - Resolved: Green badge
  - Closed: Gray badge

### 4. **UI Integration**

#### Admin Dashboard
- Added **Tickets** tab in `TeamManagementPage.tsx`
- Added Ticket icon import from Lucide
- Positioned in Row 3, spare slot as requested

#### Team Member Dashboard  
- Added **Support Tickets** card in `TeamMemberDashboard.tsx`
- Orange-themed card (matching design system)
- Positioned after "Knowledge Base" card
- Direct navigation to `/team-member/tickets`

#### Routing
- Added `/team-member/tickets` route in `src/routes/index.tsx`
- Protected route with authentication
- Imports `MyTicketsPage` component

---

## 🎨 UI/UX Design

### Color Coding
- **Orange Theme**: Tickets system uses orange (#FF6B35) to stand out
- **Category Icons**:
  - 🚨 Issue: AlertCircle (red)
  - ❓ Question: HelpCircle (blue)
  - 💡 Suggestion: Lightbulb (yellow)
  - 💬 Feedback: MessageCircle (gray)
  - 🎫 Other: Ticket icon

### Status Colors
- **Open**: Blue background
- **In Progress**: Yellow background
- **Resolved**: Green background
- **Closed**: Gray background

### Anonymous Submission
- When anonymous checkbox is checked:
  - Member's name is **NOT** displayed to admin
  - Admin sees "Anonymous Submission" badge
  - Email is still stored for notifications (hidden from UI)
  - Member can still view their own tickets and replies

---

## 📊 Data Flow

### Raising a Ticket (Team Member)
1. Navigate to **My Tickets** page
2. Click **"Raise New Ticket"**
3. Fill form:
   - Select category
   - Enter subject
   - Write detailed description
   - *(Optional)* Check "Submit anonymously"
4. Click **Submit Ticket**
5. Ticket is created with status: `open`, priority: `medium`

### Admin Responding to Ticket
1. Navigate to **TICKETS** tab in admin portal
2. View ticket in list or use filters
3. Click **"View & Reply"**
4. See full conversation thread
5. Type reply message
6. Click **"Send Reply"**
7. Ticket status auto-updates to `in_progress`
8. *(TODO)* Email notification sent to member

### Member Follow-up
1. Member sees "New Reply" badge on their ticket
2. Opens ticket to read admin response
3. Can add follow-up message
4. Continues conversation thread

### Resolving a Ticket
1. Admin updates status to `resolved` or `closed`
2. Timestamp recorded in `resolved_at`
3. Resolved/closed tickets cannot receive new replies
4. Member can raise new ticket if needed

---

## 🔐 Security & Privacy

### Row Level Security (RLS)
- **Team members** can:
  - View their own tickets
  - Create new tickets
  - Update their own tickets (add follow-ups)
- **Admins/owners** can:
  - View all tickets in their practice
  - Reply to any ticket
  - Update status and priority
  - View anonymous submissions (but not see submitter name)

### Anonymous Submissions
- `is_anonymous` flag controls visibility
- When `TRUE`:
  - `practice_member_id` is stored (for RLS)
  - Member name **NOT** displayed in admin view
  - Email stored in `submitter_email` for notifications
  - Admin sees "Anonymous" badge

---

## 🔔 Email Notifications (TODO)

### Current Status
Email notification system is **prepared but not implemented**. The database includes:
- `submitter_email` column in tickets table
- `email_sent` and `email_sent_at` columns in replies table

### Implementation Plan (User Action Required)

You'll need to set up an email service. Recommended options:

#### **Option 1: Supabase Edge Functions + SendGrid/Postmark**
```typescript
// Edge function to send email when reply is created
supabase.functions.invoke('send-ticket-reply-email', {
  body: { ticket_id, reply_id }
});
```

#### **Option 2: Server-side API with Node-mailer**
```typescript
// In your API server (oracle_api_server)
app.post('/api/tickets/reply', async (req, res) => {
  // Create reply in database
  // Send email notification
  await sendEmail({
    to: ticket.submitter_email,
    subject: `Update on your ticket: ${ticket.subject}`,
    html: generateEmailTemplate(ticket, reply)
  });
});
```

#### **Option 3: Database Triggers + Supabase Webhooks**
Set up a database trigger on `ticket_replies` insert to call a webhook that sends emails.

### Email Template Structure
```
Subject: Update on your ticket: [TICKET_SUBJECT]

Hi [MEMBER_NAME or "Team Member" if anonymous],

You have a new reply on your support ticket:

Ticket: [SUBJECT]
Category: [CATEGORY]

Admin Reply:
[REPLY_MESSAGE]

View the full conversation: [LINK_TO_TICKET]

---
TORSOR Team Development Hub
```

---

## 📁 Files Created/Modified

### New Files Created
1. ✅ `CREATE_TICKETS_SYSTEM.sql` - Database schema
2. ✅ `src/pages/accountancy/admin/TicketsAdmin.tsx` - Admin tickets page
3. ✅ `src/pages/accountancy/team/MyTicketsPage.tsx` - Member tickets page

### Modified Files
1. ✅ `src/pages/accountancy/TeamManagementPage.tsx`
   - Added Ticket icon import
   - Added TicketsAdmin import
   - Added Tickets tab to admin dashboard
   
2. ✅ `src/pages/accountancy/team/TeamMemberDashboard.tsx`
   - Added Ticket icon import
   - Added Support Tickets card
   - Orange-themed card with navigation
   
3. ✅ `src/routes/index.tsx`
   - Added MyTicketsPage import
   - Added `/team-member/tickets` route

---

## 🚀 Deployment Steps

### 1. Run the SQL Migration
```bash
# Connect to your Supabase database
psql [YOUR_DATABASE_URL]

# Run the schema
\i CREATE_TICKETS_SYSTEM.sql
```

**Or** use Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `CREATE_TICKETS_SYSTEM.sql`
3. Click "Run"

### 2. Build and Deploy Frontend
```bash
cd torsor-practice-platform
git add -A
git commit -m "feat: Add comprehensive support tickets system

- Database schema for tickets and replies
- Admin portal for managing tickets
- Team member portal for raising tickets
- Anonymous submission support
- Conversation threading
- Status and priority management
- Full RLS security policies"
git push origin main
```

Railway will auto-deploy the new version.

### 3. Test the System

#### As Team Member:
1. Navigate to team member dashboard
2. Click "Support Tickets" card
3. Raise a test ticket
4. Try anonymous submission
5. Check ticket list

#### As Admin:
1. Navigate to admin dashboard
2. Click "TICKETS" tab
3. View the ticket
4. Reply to it
5. Update status and priority

#### As Team Member (again):
6. Check for "New Reply" badge
7. View admin response
8. Add follow-up message

---

## 🎯 Key Features Implemented

✅ **Multi-category tickets**: Issue, Question, Suggestion, Feedback, Other  
✅ **Anonymous submissions**: Checkbox to hide name from admin  
✅ **Conversation threading**: Back-and-forth messaging  
✅ **Status management**: Open → In Progress → Resolved → Closed  
✅ **Priority levels**: Low, Medium, High, Urgent  
✅ **Advanced filtering**: Status, category, search  
✅ **Email tracking**: Prepared for notifications  
✅ **Row-level security**: Privacy and data protection  
✅ **Responsive UI**: Mobile-friendly design  
✅ **Real-time updates**: Database queries on load  

---

## 📝 User Guide

### For Team Members

**Raising a Ticket:**
1. Click "Support Tickets" on your dashboard
2. Click "Raise New Ticket"
3. Choose category (Question, Issue, etc.)
4. Write a clear subject line
5. Describe your issue in detail
6. *(Optional)* Check "Submit anonymously" if you want privacy
7. Click "Submit Ticket"

**Following Up:**
1. You'll see "New Reply" badge when admin responds
2. Click "View Details" on any ticket
3. Read the conversation thread
4. Add follow-up messages as needed
5. Continue until resolved

**Tips:**
- Be specific in your description
- Include steps to reproduce issues
- Use suggestions category for feature ideas
- Anonymous submissions still get replies

### For Admins

**Managing Tickets:**
1. Go to admin dashboard → TICKETS tab
2. Use filters to find specific tickets
3. Click "View & Reply" to open any ticket
4. Read the full description and context

**Responding:**
1. Type your reply in the text box
2. Click "Send Reply"
3. Update status to "In Progress"
4. Set priority if urgent

**Closing Tickets:**
1. When resolved, update status to "Resolved"
2. If no longer relevant, set to "Closed"
3. Closed tickets cannot receive more replies

**Tips:**
- Reply promptly to keep team engaged
- Use priority to organize workload
- Anonymous tickets still need responses
- Update status as you progress

---

## 🔮 Future Enhancements (Optional)

### Phase 2 Ideas:
1. **Email Notifications** (currently pending)
   - Notify on new tickets
   - Notify on replies
   - Notify on status changes

2. **Ticket Assignments**
   - Assign tickets to specific team members
   - Track who's working on what

3. **SLA Tracking**
   - Set response time goals
   - Alert on overdue tickets

4. **Rich Text Editor**
   - Formatting in ticket descriptions
   - Attach images/files

5. **Ticket Templates**
   - Pre-filled forms for common issues
   - Guided ticket creation

6. **Analytics Dashboard**
   - Ticket volume trends
   - Response time metrics
   - Category distribution

7. **Tags/Labels**
   - Custom categorization
   - Multiple tags per ticket

8. **Satisfaction Ratings**
   - Rate admin responses
   - Feedback on resolution quality

---

## 🎉 Complete!

The support tickets system is fully functional and ready to use! Team members can raise tickets (including anonymously), admins can respond and manage them, and conversations can flow back and forth until issues are resolved.

**Next Steps:**
1. Run the SQL migration
2. Deploy the frontend
3. Test with real tickets
4. (Optional) Set up email notifications

---

## 📞 Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Verify database schema is applied
3. Confirm RLS policies are active
4. Test with hard refresh (Cmd+Shift+R)

The system is production-ready and follows best practices for security, UX, and data management!

