/**
 * Mentoring Notification Service
 * PROMPT 4 Implementation
 * 
 * Handles email notifications for:
 * - New mentor matches
 * - Weekly progress reminders
 * - Goal achievement celebrations
 * - Session reminders
 */

import { supabase } from '@/lib/supabase/client';

export interface EmailNotification {
  type: 'match_created' | 'session_reminder' | 'goal_achieved' | 'progress_update' | 'feedback_request';
  recipientEmail: string;
  recipientName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

/**
 * Send email notification via Supabase Edge Function (or your email service)
 */
async function sendEmail(notification: EmailNotification): Promise<boolean> {
  try {
    // In production, this would call your email service (SendGrid, AWS SES, etc.)
    // For now, we'll log to the mentoring_notifications table
    
    const { error } = await (supabase
      .from('mentoring_notifications') as any)
      .insert({
        type: notification.type,
        recipient_email: notification.recipientEmail,
        subject: notification.subject,
        message: notification.textContent,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging notification:', error);
      return false;
    }

    // TODO: Integrate with actual email service
    console.log(`📧 Email sent to ${notification.recipientEmail}: ${notification.subject}`);
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Notify mentor when matched with a new mentee
 */
export async function notifyMentorOfMatch(
  mentorEmail: string,
  mentorName: string,
  menteeName: string,
  matchedSkills: string[],
  relationshipId: string
): Promise<boolean> {
  const notification: EmailNotification = {
    type: 'match_created',
    recipientEmail: mentorEmail,
    recipientName: mentorName,
    subject: '🎉 New Mentee Match - Review Request',
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">You've Been Matched with a New Mentee!</h2>
            <p>Hi ${mentorName},</p>
            <p>Great news! <strong>${menteeName}</strong> has requested you as their mentor.</p>
            
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Skills Match:</h3>
              <p><strong>${matchedSkills.join(', ')}</strong></p>
            </div>
            
            <p>This is a great opportunity to share your expertise and help a colleague grow.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/accountancy/team-portal/mentoring?relationship=${relationshipId}" 
                 style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Match & Respond
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Remember: You can mentor up to 3 people at a time. Review the match details and accept if you have capacity.
            </p>
            
            <p>Best regards,<br>Your Team Management System</p>
          </div>
        </body>
      </html>
    `,
    textContent: `
Hi ${mentorName},

Great news! ${menteeName} has requested you as their mentor.

Skills Match: ${matchedSkills.join(', ')}

This is a great opportunity to share your expertise and help a colleague grow.

View and respond to the match request here:
${process.env.VITE_APP_URL || 'http://localhost:3000'}/accountancy/team-portal/mentoring?relationship=${relationshipId}

Remember: You can mentor up to 3 people at a time.

Best regards,
Your Team Management System
    `.trim()
  };

  return await sendEmail(notification);
}

/**
 * Notify mentee when mentor accepts
 */
export async function notifyMenteeOfAcceptance(
  menteeEmail: string,
  menteeName: string,
  mentorName: string,
  relationshipId: string
): Promise<boolean> {
  const notification: EmailNotification = {
    type: 'match_created',
    recipientEmail: menteeEmail,
    recipientName: menteeName,
    subject: '🎊 Your Mentor Accepted! Let\'s Get Started',
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">Your Mentor Accepted!</h2>
            <p>Hi ${menteeName},</p>
            <p>Excellent news! <strong>${mentorName}</strong> has accepted your mentorship request.</p>
            
            <div style="background: #ECFDF5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <ol style="margin: 10px 0;">
                <li>Schedule your first session</li>
                <li>Prepare questions and goals</li>
                <li>Come ready to learn!</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/accountancy/team-portal/mentoring?relationship=${relationshipId}" 
                 style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Schedule First Session
              </a>
            </div>
            
            <p>Best regards,<br>Your Team Management System</p>
          </div>
        </body>
      </html>
    `,
    textContent: `
Hi ${menteeName},

Excellent news! ${mentorName} has accepted your mentorship request.

Next Steps:
1. Schedule your first session
2. Prepare questions and goals
3. Come ready to learn!

Get started here:
${process.env.VITE_APP_URL || 'http://localhost:3000'}/accountancy/team-portal/mentoring?relationship=${relationshipId}

Best regards,
Your Team Management System
    `.trim()
  };

  return await sendEmail(notification);
}

/**
 * Send weekly progress reminder
 */
export async function sendWeeklyProgressReminder(
  recipientEmail: string,
  recipientName: string,
  role: 'mentor' | 'mentee',
  relationshipId: string,
  partnerName: string,
  weeksSinceLastSession: number
): Promise<boolean> {
  const isMentor = role === 'mentor';
  
  const notification: EmailNotification = {
    type: 'progress_update',
    recipientEmail,
    recipientName,
    subject: `⏰ Weekly Mentoring Reminder - ${partnerName}`,
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #F59E0B;">Weekly Mentoring Check-In</h2>
            <p>Hi ${recipientName},</p>
            
            ${weeksSinceLastSession > 2 
              ? `<div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                   <p style="margin: 0;"><strong>⚠️ It's been ${weeksSinceLastSession} weeks since your last session with ${partnerName}.</strong></p>
                   <p style="margin: 10px 0 0 0;">Regular meetings are key to a successful mentoring relationship!</p>
                 </div>`
              : `<p>This is your weekly reminder about your mentoring relationship with <strong>${partnerName}</strong>.</p>`
            }
            
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${isMentor ? 'Mentor Tips:' : 'Mentee Tips:'}</h3>
              <ul>
                ${isMentor 
                  ? '<li>Check in on progress toward goals</li><li>Share relevant resources or insights</li><li>Provide constructive feedback</li>'
                  : '<li>Come prepared with specific questions</li><li>Update your mentor on progress</li><li>Be open to feedback</li>'
                }
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/accountancy/team-portal/mentoring?relationship=${relationshipId}" 
                 style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Mentoring Dashboard
              </a>
            </div>
            
            <p>Keep up the great work!</p>
            <p>Best regards,<br>Your Team Management System</p>
          </div>
        </body>
      </html>
    `,
    textContent: `
Hi ${recipientName},

${weeksSinceLastSession > 2 
  ? `⚠️ It's been ${weeksSinceLastSession} weeks since your last session with ${partnerName}. Regular meetings are key!`
  : `This is your weekly reminder about your mentoring relationship with ${partnerName}.`
}

${isMentor ? 'Mentor Tips:' : 'Mentee Tips:'}
${isMentor 
  ? '- Check in on progress toward goals\n- Share relevant resources\n- Provide constructive feedback'
  : '- Come prepared with questions\n- Update your mentor on progress\n- Be open to feedback'
}

View your mentoring dashboard:
${process.env.VITE_APP_URL || 'http://localhost:3000'}/accountancy/team-portal/mentoring?relationship=${relationshipId}

Keep up the great work!

Best regards,
Your Team Management System
    `.trim()
  };

  return await sendEmail(notification);
}

/**
 * Celebrate goal achievement
 */
export async function celebrateGoalAchievement(
  menteeEmail: string,
  menteeName: string,
  mentorEmail: string,
  mentorName: string,
  goalTitle: string,
  skillName: string,
  fromLevel: number,
  toLevel: number
): Promise<boolean> {
  // Email to mentee
  const menteeNotification: EmailNotification = {
    type: 'goal_achieved',
    recipientEmail: menteeEmail,
    recipientName: menteeName,
    subject: '🎉 Congratulations! You Achieved Your Goal!',
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">🎉🎊🏆</div>
            <h1 style="color: #10B981; margin-bottom: 10px;">Congratulations!</h1>
            <h2 style="color: #333; font-weight: normal;">You Achieved Your Goal!</h2>
            
            <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <h3 style="margin-top: 0; font-size: 24px;">${goalTitle}</h3>
              <p style="font-size: 18px; margin: 15px 0;">
                <strong>${skillName}</strong><br>
                Level ${fromLevel} → Level ${toLevel} ✓
              </p>
            </div>
            
            <p style="font-size: 16px; color: #666;">
              Your hard work and dedication have paid off. ${mentorName} helped guide you, but <strong>you</strong> did the work!
            </p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; font-style: italic; color: #555;">
                "Success is the sum of small efforts repeated day in and day out."
              </p>
            </div>
            
            <p>What's next? Set a new goal and keep growing!</p>
            
            <p style="margin-top: 40px;">Best regards,<br>Your Team Management System</p>
          </div>
        </body>
      </html>
    `,
    textContent: `
🎉 CONGRATULATIONS! 🎉

You Achieved Your Goal!

${goalTitle}
${skillName}: Level ${fromLevel} → Level ${toLevel} ✓

Your hard work and dedication have paid off. ${mentorName} helped guide you, but YOU did the work!

"Success is the sum of small efforts repeated day in and day out."

What's next? Set a new goal and keep growing!

Best regards,
Your Team Management System
    `.trim()
  };

  await sendEmail(menteeNotification);

  // Email to mentor
  const mentorNotification: EmailNotification = {
    type: 'goal_achieved',
    recipientEmail: mentorEmail,
    recipientName: mentorName,
    subject: `🎊 Your Mentee ${menteeName} Achieved Their Goal!`,
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981;">Great Mentoring Work!</h2>
            <p>Hi ${mentorName},</p>
            
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px;">
                <strong>${menteeName}</strong> just achieved their goal:<br>
                <strong>${goalTitle}</strong>
              </p>
              <p style="margin: 15px 0 0 0; font-size: 16px;">
                ${skillName}: Level ${fromLevel} → Level ${toLevel} ✓
              </p>
            </div>
            
            <p>Your guidance and support made a real difference. Thank you for investing in your colleague's growth!</p>
            
            <p>This achievement is a testament to both their hard work and your mentorship.</p>
            
            <p>Best regards,<br>Your Team Management System</p>
          </div>
        </body>
      </html>
    `,
    textContent: `
Hi ${mentorName},

Great news! ${menteeName} just achieved their goal:

${goalTitle}
${skillName}: Level ${fromLevel} → Level ${toLevel} ✓

Your guidance and support made a real difference. Thank you for investing in your colleague's growth!

Best regards,
Your Team Management System
    `.trim()
  };

  return await sendEmail(mentorNotification);
}

/**
 * Send session reminder (24 hours before)
 */
export async function sendSessionReminder(
  recipientEmail: string,
  recipientName: string,
  partnerName: string,
  sessionDate: Date,
  sessionFormat: string,
  sessionId: string
): Promise<boolean> {
  const dateStr = sessionDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = sessionDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  const notification: EmailNotification = {
    type: 'session_reminder',
    recipientEmail,
    recipientName,
    subject: `⏰ Reminder: Mentoring Session Tomorrow with ${partnerName}`,
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Session Reminder</h2>
            <p>Hi ${recipientName},</p>
            <p>This is a friendly reminder about your mentoring session tomorrow:</p>
            
            <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
              <p style="margin: 0 0 10px 0;"><strong>With:</strong> ${partnerName}</p>
              <p style="margin: 0 0 10px 0;"><strong>When:</strong> ${dateStr} at ${timeStr}</p>
              <p style="margin: 0;"><strong>Format:</strong> ${sessionFormat}</p>
            </div>
            
            <p><strong>Preparation Tips:</strong></p>
            <ul>
              <li>Review your goals and progress</li>
              <li>Prepare questions or topics to discuss</li>
              <li>Update your notes from last session</li>
            </ul>
            
            <p>Looking forward to a productive session!</p>
            <p>Best regards,<br>Your Team Management System</p>
          </div>
        </body>
      </html>
    `,
    textContent: `
Hi ${recipientName},

This is a friendly reminder about your mentoring session tomorrow:

With: ${partnerName}
When: ${dateStr} at ${timeStr}
Format: ${sessionFormat}

Preparation Tips:
- Review your goals and progress
- Prepare questions or topics
- Update your notes from last session

Looking forward to a productive session!

Best regards,
Your Team Management System
    `.trim()
  };

  return await sendEmail(notification);
}

/**
 * Request feedback after session
 */
export async function requestFeedback(
  recipientEmail: string,
  recipientName: string,
  role: 'mentor' | 'mentee',
  sessionId: string,
  relationshipId: string
): Promise<boolean> {
  const notification: EmailNotification = {
    type: 'feedback_request',
    recipientEmail,
    recipientName,
    subject: '📝 How was your mentoring session?',
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8B5CF6;">We'd Love Your Feedback</h2>
            <p>Hi ${recipientName},</p>
            <p>How was your recent mentoring session? Your feedback helps improve the mentoring experience for everyone.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/accountancy/team-portal/mentoring?feedback=${sessionId}" 
                 style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Provide Feedback (2 minutes)
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Your feedback is confidential and helps us match mentors and mentees more effectively.
            </p>
            
            <p>Thank you for your time!</p>
            <p>Best regards,<br>Your Team Management System</p>
          </div>
        </body>
      </html>
    `,
    textContent: `
Hi ${recipientName},

How was your recent mentoring session? Your feedback helps improve the mentoring experience for everyone.

Provide feedback here (2 minutes):
${process.env.VITE_APP_URL || 'http://localhost:3000'}/accountancy/team-portal/mentoring?feedback=${sessionId}

Your feedback is confidential and helps us match mentors and mentees more effectively.

Thank you for your time!

Best regards,
Your Team Management System
    `.trim()
  };

  return await sendEmail(notification);
}

