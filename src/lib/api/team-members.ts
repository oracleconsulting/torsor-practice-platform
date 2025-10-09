/**
 * Team Members API
 * CRUD operations for practice team members
 */

import { supabase } from '@/lib/supabase/client';

export interface TeamMember {
  id: string;
  practice_id: string;
  user_id?: string;
  email: string;
  name: string;
  role?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Delete a team member and ALL associated data
 * This removes:
 * - skill_assessments
 * - development_goals (if exists)
 * - survey_sessions (if exists)
 * - cpd_activities (if exists)
 * - practice_members record
 * - related invitations
 */
export async function deleteTeamMember(memberId: string, email: string): Promise<void> {
  console.log('[TeamMembersAPI] Deleting team member:', memberId, email);
  
  try {
    // Delete skill assessments
    const { error: skillsError } = await supabase
      .from('skill_assessments')
      .delete()
      .eq('practice_member_id', memberId);
    
    if (skillsError) {
      console.error('[TeamMembersAPI] Error deleting skill_assessments:', skillsError);
      throw new Error(`Failed to delete skill assessments: ${skillsError.message}`);
    }
    
    console.log('[TeamMembersAPI] Deleted skill_assessments');
    
    // Delete development goals (if table exists)
    try {
      await supabase
        .from('development_goals')
        .delete()
        .eq('practice_member_id', memberId);
      console.log('[TeamMembersAPI] Deleted development_goals');
    } catch (err) {
      console.log('[TeamMembersAPI] development_goals table might not exist, skipping');
    }
    
    // Delete survey sessions (if table exists)
    try {
      await supabase
        .from('survey_sessions')
        .delete()
        .eq('practice_member_id', memberId);
      console.log('[TeamMembersAPI] Deleted survey_sessions');
    } catch (err) {
      console.log('[TeamMembersAPI] survey_sessions table might not exist, skipping');
    }
    
    // Delete CPD activities (if table exists)
    try {
      await supabase
        .from('cpd_activities')
        .delete()
        .eq('practice_member_id', memberId);
      console.log('[TeamMembersAPI] Deleted cpd_activities');
    } catch (err) {
      console.log('[TeamMembersAPI] cpd_activities table might not exist, skipping');
    }
    
    // Delete the practice member record
    const { error: memberError } = await supabase
      .from('practice_members')
      .delete()
      .eq('id', memberId);
    
    if (memberError) {
      console.error('[TeamMembersAPI] Error deleting practice_member:', memberError);
      throw new Error(`Failed to delete team member: ${memberError.message}`);
    }
    
    console.log('[TeamMembersAPI] Deleted practice_member');
    
    // Delete related invitations
    const { error: invitationsError } = await supabase
      .from('invitations')
      .delete()
      .eq('email', email);
    
    if (invitationsError) {
      console.warn('[TeamMembersAPI] Error deleting invitations (non-critical):', invitationsError);
      // Don't throw - this is non-critical
    } else {
      console.log('[TeamMembersAPI] Deleted invitations');
    }
    
    console.log('[TeamMembersAPI] Team member completely deleted:', memberId);
  } catch (error) {
    console.error('[TeamMembersAPI] Error in deleteTeamMember:', error);
    throw error;
  }
}

/**
 * Get all team members for a practice
 */
export async function getTeamMembers(practiceId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('practice_members')
    .select('*')
    .eq('practice_id', practiceId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single team member
 */
export async function getTeamMember(memberId: string): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('practice_members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error) throw error;
  return data;
}

