/**
 * Invitations API
 * Full invitation management with tracking, reminders, bulk import
 */

import { supabase } from '@/lib/supabase/client';

// =====================================================
// Types
// =====================================================

export interface Invitation {
  id: string;
  practice_id: string;
  email: string;
  name?: string;
  role?: string;
  personal_message?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invite_code: string;
  created_at: string;
  sent_at?: string;
  accepted_at?: string;
  expires_at: string;
  last_reminded_at?: string;
  created_by?: string;
  accepted_by?: string;
  email_sent: boolean;
  email_opened: boolean;
  email_clicked: boolean;
  reminders_sent: number;
  batch_id?: string;
}

export interface InvitationEvent {
  id: string;
  invitation_id: string;
  event_type: 'created' | 'sent' | 'opened' | 'clicked' | 'accepted' | 'expired' | 'revoked' | 'resent' | 'reminded';
  event_data: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface InvitationBatch {
  id: string;
  practice_id: string;
  name: string;
  description?: string;
  total_count: number;
  sent_count: number;
  accepted_count: number;
  failed_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename?: string;
  created_at: string;
  processed_at?: string;
  created_by?: string;
}

export interface CreateInvitationParams {
  email: string;
  name?: string;
  role?: string;
  personalMessage?: string;
}

// =====================================================
// Invitations CRUD
// =====================================================

export async function createInvitation(
  practiceId: string,
  params: CreateInvitationParams
): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      practice_id: practiceId,
      email: params.email,
      name: params.name,
      role: params.role,
      personal_message: params.personalMessage,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInvitations(practiceId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('practice_id', practiceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getInvitation(invitationId: string): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single();

  if (error) throw error;
  return data;
}

export async function getInvitationByCode(inviteCode: string): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  if (error) throw error;
  return data;
}

export async function resendInvitation(invitationId: string): Promise<void> {
  // Update sent_at timestamp
  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      sent_at: new Date().toISOString(),
    })
    .eq('id', invitationId);

  if (updateError) throw updateError;

  // Log event
  const { error: eventError } = await supabase
    .from('invitation_events')
    .insert({
      invitation_id: invitationId,
      event_type: 'resent',
    });

  if (eventError) throw eventError;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  
  const { error } = await supabase.rpc('revoke_invitation', {
    p_invitation_id: invitationId,
    p_user_id: user.user?.id,
  });

  if (error) throw error;
}

export async function acceptInvitation(inviteCode: string): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.rpc('accept_invitation', {
    p_invite_code: inviteCode,
    p_user_id: user.user?.id,
  });

  if (error) throw error;
  return data;
}

// =====================================================
// Invitation Events
// =====================================================

export async function getInvitationEvents(invitationId: string): Promise<InvitationEvent[]> {
  const { data, error } = await supabase
    .from('invitation_events')
    .select('*')
    .eq('invitation_id', invitationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function trackInvitationEvent(
  invitationId: string,
  eventType: InvitationEvent['event_type'],
  eventData?: any
): Promise<void> {
  const { error } = await supabase
    .from('invitation_events')
    .insert({
      invitation_id: invitationId,
      event_type: eventType,
      event_data: eventData || {},
    });

  if (error) throw error;
}

// =====================================================
// Bulk Import
// =====================================================

export interface BulkInviteRow {
  email: string;
  name?: string;
  role?: string;
}

export async function createBulkInvitationBatch(
  practiceId: string,
  name: string,
  invitations: BulkInviteRow[]
): Promise<InvitationBatch> {
  const { data: user } = await supabase.auth.getUser();

  // Create batch
  const { data: batch, error: batchError } = await supabase
    .from('invitation_batches')
    .insert({
      practice_id: practiceId,
      name,
      total_count: invitations.length,
      status: 'processing',
      created_by: user.user?.id,
    })
    .select()
    .single();

  if (batchError) throw batchError;

  // Create invitations
  const invitationRecords = invitations.map(inv => ({
    practice_id: practiceId,
    email: inv.email,
    name: inv.name,
    role: inv.role,
    batch_id: batch.id,
    created_by: user.user?.id,
  }));

  const { error: invError } = await supabase
    .from('invitations')
    .insert(invitationRecords);

  if (invError) {
    // Mark batch as failed
    await supabase
      .from('invitation_batches')
      .update({ status: 'failed' })
      .eq('id', batch.id);
    throw invError;
  }

  // Mark batch as completed
  await supabase
    .from('invitation_batches')
    .update({ status: 'completed', processed_at: new Date().toISOString() })
    .eq('id', batch.id);

  return batch;
}

export async function getBatches(practiceId: string): Promise<InvitationBatch[]> {
  const { data, error } = await supabase
    .from('invitation_batches')
    .select('*')
    .eq('practice_id', practiceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBatchInvitations(batchId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// =====================================================
// Statistics
// =====================================================

export async function getInvitationStats(practiceId: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('status')
    .eq('practice_id', practiceId);

  if (error) throw error;

  const stats = {
    total: data.length,
    pending: data.filter(i => i.status === 'pending').length,
    accepted: data.filter(i => i.status === 'accepted').length,
    expired: data.filter(i => i.status === 'expired').length,
    revoked: data.filter(i => i.status === 'revoked').length,
  };

  return stats;
}

// =====================================================
// Reminders
// =====================================================

export async function getPendingReminders() {
  const { data, error } = await supabase.rpc('get_pending_reminders');
  
  if (error) throw error;
  return data || [];
}

export async function markReminderSent(invitationId: string): Promise<void> {
  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      last_reminded_at: new Date().toISOString(),
      reminders_sent: supabase.raw('reminders_sent + 1'),
    })
    .eq('id', invitationId);

  if (updateError) throw updateError;

  // Log event
  const { error: eventError } = await supabase
    .from('invitation_events')
    .insert({
      invitation_id: invitationId,
      event_type: 'reminded',
    });

  if (eventError) throw eventError;
}

// =====================================================
// Email Generation
// =====================================================

export function generateInviteLink(inviteCode: string): string {
  return `${window.location.origin}/team-portal/login?invite=${inviteCode}`;
}

export function getInvitationEmailTemplate(
  name: string,
  inviteLink: string,
  personalMessage?: string
): string {
  return `
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
}

