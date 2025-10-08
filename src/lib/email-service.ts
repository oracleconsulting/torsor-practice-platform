/**
 * Email Service
 * Handles all outgoing emails via Resend
 */

// =====================================================
// Configuration
// =====================================================

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'noreply@rpgcc.com';
const FROM_NAME = import.meta.env.VITE_FROM_NAME || 'RPGCC Team Portal';
const RESEND_API_URL = 'https://api.resend.com/emails';

// =====================================================
// Types
// =====================================================

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =====================================================
// Core Email Function
// =====================================================

export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  // Check if Resend is configured
  if (!RESEND_API_KEY || RESEND_API_KEY === 'your-resend-api-key-here') {
    console.warn('⚠️ Resend not configured, email not sent:', params.to);
    return {
      success: false,
      error: 'Resend API key not configured',
    };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Email sent to:', params.to, 'Message ID:', data.id);
      return {
        success: true,
        messageId: data.id,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Resend error:', response.status, errorData);
      return {
        success: false,
        error: `Resend error: ${response.status} - ${errorData.message || 'Unknown error'}`,
      };
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// Invitation Emails
// =====================================================

export async function sendInvitationEmail(
  to: string,
  name: string,
  inviteLink: string,
  personalMessage?: string
): Promise<EmailResult> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a2b4a 0%, #2d4a7c 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">RPGCC BSG Skills Portal</p>
  </div>
  
  <div style="background: #f5f1e8; padding: 40px 30px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name || 'there'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      You've been invited to join the RPGCC Business Services Group Skills Portal – your personal development hub.
    </p>
    
    ${personalMessage ? `
    <div style="background: white; border-left: 4px solid #ff6b35; padding: 20px; margin: 30px 0; border-radius: 5px;">
      <p style="margin: 0; font-style: italic; color: #555;">${personalMessage}</p>
    </div>
    ` : ''}
    
    <div style="background: white; padding: 25px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #1a2b4a; margin-top: 0;">What You'll Do:</h3>
      <ul style="color: #555; line-height: 2;">
        <li>Complete your skills assessment (60-90 minutes)</li>
        <li>View your personalized skills profile</li>
        <li>Set development goals aligned to your interests</li>
        <li>See anonymized team benchmarks</li>
        <li>Track your CPD and career progression</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${inviteLink}" 
         style="display: inline-block; background: #ff6b35; color: white; padding: 16px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 107, 53, 0.3);">
        Access Your Portal →
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
      This invitation expires in 7 days. Questions? Contact your team lead.
    </p>
  </div>
  
  <div style="background: #1a2b4a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #ffffff; margin: 0; font-size: 12px;">
      © ${new Date().getFullYear()} RPGCC Business Services Group
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${name || 'there'},

You've been invited to join the RPGCC BSG Skills Portal.

${personalMessage ? `\n${personalMessage}\n` : ''}

Access your portal: ${inviteLink}

This invitation expires in 7 days.

© ${new Date().getFullYear()} RPGCC Business Services Group
  `.trim();

  return sendEmail({
    to,
    subject: "You're Invited to Join Our Skills Portal",
    html,
    text,
  });
}

export async function sendReminderEmail(
  to: string,
  name: string,
  inviteLink: string,
  daysRemaining: number
): Promise<EmailResult> {
  const urgency = daysRemaining <= 1 ? 'urgent' : 'reminder';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${urgency === 'urgent' ? '#d32f2f' : '#1a2b4a'}; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">
      ${urgency === 'urgent' ? '⏰ Invitation Expiring Soon!' : '👋 Reminder: Skills Portal'}
    </h1>
    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
      ${daysRemaining === 1 ? 'Expires tomorrow!' : `${daysRemaining} days remaining`}
    </p>
  </div>
  
  <div style="background: #f5f1e8; padding: 40px 30px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name || 'there'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Just a friendly reminder that your invitation to the RPGCC Skills Portal will expire in 
      <strong style="color: #ff6b35;">${daysRemaining === 1 ? '1 day' : `${daysRemaining} days`}</strong>.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      The skills assessment takes 60-90 minutes and will help us:
    </p>
    
    <ul style="color: #555; line-height: 2; font-size: 16px;">
      <li>Understand your strengths and development interests</li>
      <li>Provide targeted training opportunities</li>
      <li>Support your career progression</li>
    </ul>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${inviteLink}" 
         style="display: inline-block; background: ${urgency === 'urgent' ? '#d32f2f' : '#ff6b35'}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 107, 53, 0.3);">
        Complete Assessment Now →
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
      Need more time? Contact your team lead for a new invitation.
    </p>
  </div>
  
  <div style="background: #1a2b4a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #ffffff; margin: 0; font-size: 12px;">
      © ${new Date().getFullYear()} RPGCC Business Services Group
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${name || 'there'},

Reminder: Your invitation to the RPGCC Skills Portal expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.

Complete your assessment: ${inviteLink}

Need more time? Contact your team lead.

© ${new Date().getFullYear()} RPGCC Business Services Group
  `.trim();

  return sendEmail({
    to,
    subject: `${urgency === 'urgent' ? '⏰ ' : ''}Skills Portal Invitation - ${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'} Remaining`,
    html,
    text,
  });
}

// =====================================================
// Welcome Email (After Completion)
// =====================================================

export async function sendWelcomeEmail(
  to: string,
  name: string,
  portalLink: string
): Promise<EmailResult> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to the Team!</h1>
    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Your skills profile is ready</p>
  </div>
  
  <div style="background: #f5f1e8; padding: 40px 30px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for completing your skills assessment! 🎯
    </p>
    
    <div style="background: white; padding: 25px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #1a2b4a; margin-top: 0;">What's Next:</h3>
      <ul style="color: #555; line-height: 2;">
        <li>Review your skills profile and development opportunities</li>
        <li>Set personal development goals</li>
        <li>Explore training resources</li>
        <li>Track your CPD progress</li>
        <li>See anonymized team insights</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${portalLink}" 
         style="display: inline-block; background: #4caf50; color: white; padding: 16px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        View Your Profile →
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
      Questions? Your team lead is here to help!
    </p>
  </div>
  
  <div style="background: #1a2b4a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #ffffff; margin: 0; font-size: 12px;">
      © ${new Date().getFullYear()} RPGCC Business Services Group
    </p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject: '🎉 Welcome! Your Skills Profile is Ready',
    html,
  });
}

// =====================================================
// Utility Functions
// =====================================================

export function isEmailConfigured(): boolean {
  return !!(RESEND_API_KEY && RESEND_API_KEY !== 'your-resend-api-key-here');
}

export function getEmailConfig() {
  return {
    configured: isEmailConfigured(),
    fromEmail: FROM_EMAIL,
    fromName: FROM_NAME,
    provider: 'Resend',
  };
}

