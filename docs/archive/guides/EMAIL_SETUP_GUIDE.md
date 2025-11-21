# 📧 Email Integration Guide

## Current Status

✅ **UI Complete**: Invitation forms, email templates, tracking  
⚠️ **Email Sending**: Not yet implemented  
✅ **Workaround**: Copy invite link feature works now  

---

## How It Works Right Now

### 1. Create Invitation (Copy Link Method)

1. **Go to Team Management → Team Invitations**
2. **Click "New Invitation"**
3. **Fill in details**:
   - Email: `member@rpgcc.com`
   - Name: `Team Member Name`
   - Role: `Their role`
4. **Click "Send Invitation"**
5. **Link auto-copies to clipboard** 📋
6. **Manually share** via Slack/WhatsApp/Email

### Example Link:
```
https://torsor-practice-platform-production.up.railway.app/team-portal/login?email=member@rpgcc.com
```

Team member:
- Clicks link
- Creates account (or uses magic link)
- Completes assessment
- Appears in Skills Matrix ✅

---

## Option 1: Quick Email Setup (SendGrid/Mailgun)

If you want actual email sending, here's how to add it:

### A. Get Email Service (5 minutes)

**SendGrid** (Free: 100 emails/day):
1. Sign up: https://signup.sendgrid.com/
2. Create API Key
3. Verify sender email (your email address)

**Or Mailgun** (Free: 100 emails/day):
1. Sign up: https://signup.mailgun.com/
2. Get API Key from dashboard
3. Add sending domain

### B. Add to Railway (2 minutes)

Add environment variables:

```bash
# For SendGrid:
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@rpgcc.com
FROM_NAME=RPGCC Team Portal

# Or for Mailgun:
MAILGUN_API_KEY=xxxxx
MAILGUN_DOMAIN=rpgcc.com
FROM_EMAIL=noreply@rpgcc.com
```

### C. Install Package (1 minute)

```bash
cd torsor-practice-platform
npm install @sendgrid/mail
# or
npm install mailgun.js
```

### D. Add Email Function (5 minutes)

Create `src/lib/email.ts`:

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendInvitationEmail(
  to: string,
  name: string,
  inviteLink: string,
  personalMessage?: string
) {
  const msg = {
    to,
    from: {
      email: process.env.FROM_EMAIL || 'noreply@rpgcc.com',
      name: process.env.FROM_NAME || 'RPGCC Team Portal',
    },
    subject: "You're Invited to Join Our Skills Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a2b4a;">You're Invited!</h1>
        <p>Hi ${name},</p>
        <p>You've been invited to join the RPGCC BSG Skills Portal.</p>
        
        ${personalMessage ? `<p style="background: #f5f1e8; padding: 15px; border-left: 4px solid #ff6b35;">${personalMessage}</p>` : ''}
        
        <p>This portal will help you:</p>
        <ul>
          <li>Complete your skills self-assessment (60-90 minutes)</li>
          <li>View your skills profile and development opportunities</li>
          <li>Set and track personal development goals</li>
          <li>See anonymized team insights and benchmarks</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" 
             style="background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Access the Portal →
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          This invitation link is valid for 7 days. If you have any questions, please contact your team lead.
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email sent to:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ Email failed:', error);
    return { success: false, error };
  }
}
```

### E. Update InvitationsPage (2 minutes)

Replace the TODO in `handleSubmit`:

```typescript
import { sendInvitationEmail } from '@/lib/email';

// In handleSubmit:
const inviteLink = `${window.location.origin}/team-portal/login?email=${encodeURIComponent(formData.email)}`;

// Send email
const result = await sendInvitationEmail(
  formData.email,
  formData.name,
  inviteLink,
  formData.personalMessage
);

if (result.success) {
  toast({
    title: 'Invitation Sent',
    description: `Email sent to ${formData.email}`,
  });
} else {
  // Fallback to copy link
  await navigator.clipboard.writeText(inviteLink);
  toast({
    title: 'Link Copied',
    description: 'Email failed, link copied to clipboard instead',
  });
}
```

### F. Deploy

```bash
git add .
git commit -m "Add email sending via SendGrid"
git push origin main
```

**Total Time: ~15 minutes** ⏱️

---

## Option 2: Manual Process (Current - Works Fine!)

For 16 people, the manual process is actually quite fast:

1. **Create invitation** (30 seconds)
2. **Link auto-copies** ✅
3. **Paste into email/Slack** (10 seconds)
4. **Repeat 15 more times** (10 minutes total)

You can batch this:
- Create 16 invitations
- Each auto-copies
- Paste into a spreadsheet
- Send bulk email with mail merge
- Or post all links in team Slack channel

---

## Option 3: Advanced (Future)

For a full invitation management system:

### Features to Add:
- ✅ Invitation status tracking (pending/accepted/expired)
- ✅ Resend invitation functionality
- ✅ Invitation expiry (7 days)
- ✅ Automatic reminder emails (48h, 5 days)
- ✅ Bulk invitation import (CSV)

### Database Table Needed:

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(255),
  personal_message TEXT,
  
  -- Tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_code ON invitations(invite_code);
```

**Implementation Time: 2-3 hours**

---

## Recommendation

### For Monday Launch:
✅ **Use the copy link method** - it's fast, reliable, and works perfectly for 16 people

### For Week 2:
⚙️ **Add SendGrid integration** - 15 minutes of work, makes future invitations smoother

### For Month 2:
🚀 **Build full invitation system** - tracking, reminders, bulk import

---

## Current Workflow (Copy Link)

```
Admin → Team Invitations
  ↓
Click "New Invitation"
  ↓
Fill: email, name, role, message
  ↓
Click "Send" → Link auto-copies 📋
  ↓
Paste into email/Slack
  ↓
Team member clicks link
  ↓
Creates account + completes assessment
  ↓
Appears in Skills Matrix ✅
```

**Time per person: 40 seconds**  
**Time for 16 people: 10 minutes**  

That's totally reasonable for launch! 🎉

---

## Need Help?

**Email setup questions**: Let me know which service you prefer (SendGrid/Mailgun)  
**Link not working**: Check the team member can access the Railway URL  
**Track who's accepted**: Check practice_members table in Supabase  

---

**Status**: Copy link method working ✅  
**Email sending**: Optional, 15-min setup  
**Good for Monday**: Yes! 🚀

