/**
 * Team Portal API Service
 * Handles all backend operations for the team member portal
 */

import { supabase } from '@/lib/supabase/client';

// =====================================================
// Types
// =====================================================

export interface SkillAssessment {
  id: string;
  skill_id: string;
  current_level: number;
  interest_level: number;
  years_experience?: number;
  last_used_date?: string;
  notes?: string;
  certifications?: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  required_level: number;
  service_line?: string;
}

export interface DevelopmentGoal {
  id: string;
  skill_id: string;
  target_level: number;
  target_date: string;
  progress_percentage: number;
  status: 'active' | 'completed' | 'paused';
  notes?: string;
  skill?: Skill;
}

export interface SurveySession {
  id: string;
  started_at: string;
  completed_at?: string;
  last_category?: string;
  progress_percentage: number;
}

// =====================================================
// Authentication
// =====================================================

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/team-portal/dashboard`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// =====================================================
// Profile & Practice Member
// =====================================================

export async function getPracticeMember(userId: string) {
  const { data, error } = await supabase
    .from('practice_members')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
}

export async function updatePracticeMember(memberId: string, updates: any) {
  const { data, error } = await supabase
    .from('practice_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// =====================================================
// Skills
// =====================================================

export async function getAllSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });
    
  if (error) throw error;
  return data || [];
}

export async function getSkillsByCategory() {
  const skills = await getAllSkills();
  
  return skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);
}

export async function getSkillsByServiceLine() {
  const skills = await getAllSkills();
  
  return skills.reduce((acc, skill) => {
    const serviceLine = skill.service_line || 'Other';
    if (!acc[serviceLine]) {
      acc[serviceLine] = [];
    }
    acc[serviceLine].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);
}

// =====================================================
// Skill Assessments
// =====================================================

export async function getMyAssessments(memberId: string): Promise<SkillAssessment[]> {
  const { data, error } = await supabase
    .from('skill_assessments')
    .select(`
      *,
      skill:skills(*)
    `)
    .eq('team_member_id', memberId);
    
  if (error) throw error;
  return data || [];
}

export async function saveAssessment(
  memberId: string,
  skillId: string,
  assessment: Partial<SkillAssessment>
) {
  // Check if assessment exists
  const { data: existing } = await supabase
    .from('skill_assessments')
    .select('id')
    .eq('team_member_id', memberId)
    .eq('skill_id', skillId)
    .single();
    
  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('skill_assessments')
      .update({
        ...assessment,
        assessment_date: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('skill_assessments')
      .insert({
        team_member_id: memberId,
        skill_id: skillId,
        ...assessment,
        assessment_date: new Date().toISOString(),
        assessed_by: memberId,
        assessment_type: 'self',
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}

export async function batchSaveAssessments(
  memberId: string,
  assessments: Array<{ skillId: string; assessment: Partial<SkillAssessment> }>
) {
  const results = await Promise.allSettled(
    assessments.map(({ skillId, assessment }) =>
      saveAssessment(memberId, skillId, assessment)
    )
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { successful, failed, total: assessments.length };
}

// =====================================================
// Survey Sessions
// =====================================================

export async function getSurveySession(memberId: string): Promise<SurveySession | null> {
  const { data, error } = await supabase
    .from('survey_sessions')
    .select('*')
    .eq('practice_member_id', memberId)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
  return data;
}

export async function createSurveySession(memberId: string): Promise<SurveySession> {
  const { data, error } = await supabase
    .from('survey_sessions')
    .insert({
      practice_member_id: memberId,
      email: (await supabase.auth.getUser()).data.user?.email || '',
      started_at: new Date().toISOString(),
      progress_percentage: 0,
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateSurveySession(
  sessionId: string,
  updates: Partial<SurveySession>
) {
  const { data, error } = await supabase
    .from('survey_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function completeSurveySession(sessionId: string) {
  return updateSurveySession(sessionId, {
    completed_at: new Date().toISOString(),
    progress_percentage: 100,
  });
}

// =====================================================
// Development Goals
// =====================================================

export async function getMyGoals(memberId: string): Promise<DevelopmentGoal[]> {
  const { data, error } = await supabase
    .from('development_goals')
    .select(`
      *,
      skill:skills(*)
    `)
    .eq('practice_member_id', memberId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function createGoal(memberId: string, goal: Omit<DevelopmentGoal, 'id'>) {
  const { data, error } = await supabase
    .from('development_goals')
    .insert({
      practice_member_id: memberId,
      ...goal,
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateGoal(goalId: string, updates: Partial<DevelopmentGoal>) {
  const { data, error } = await supabase
    .from('development_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteGoal(goalId: string) {
  const { error } = await supabase
    .from('development_goals')
    .delete()
    .eq('id', goalId);
    
  if (error) throw error;
}

// =====================================================
// Team Insights (Anonymized)
// =====================================================

export async function getTeamSkillsOverview() {
  const { data, error } = await supabase
    .from('skill_assessments')
    .select(`
      skill_id,
      current_level,
      interest_level,
      skill:skills(name, category, service_line, required_level)
    `);
    
  if (error) throw error;
  
  // Group by skill and calculate aggregates
  const skillMap = new Map<string, any>();
  
  data?.forEach(assessment => {
    const skillId = assessment.skill_id;
    if (!skillMap.has(skillId)) {
      skillMap.set(skillId, {
        skill: assessment.skill,
        levels: [],
        interests: [],
      });
    }
    
    const entry = skillMap.get(skillId);
    entry.levels.push(assessment.current_level);
    entry.interests.push(assessment.interest_level);
  });
  
  // Calculate statistics
  return Array.from(skillMap.entries()).map(([skillId, data]) => ({
    skillId,
    skillName: data.skill.name,
    category: data.skill.category,
    serviceLine: data.skill.service_line,
    requiredLevel: data.skill.required_level,
    teamCount: data.levels.length,
    avgLevel: data.levels.reduce((a: number, b: number) => a + b, 0) / data.levels.length,
    avgInterest: data.interests.reduce((a: number, b: number) => a + b, 0) / data.interests.length,
    minLevel: Math.min(...data.levels),
    maxLevel: Math.max(...data.levels),
  }));
}

export async function getServiceLineCoverage() {
  const overview = await getTeamSkillsOverview();
  
  const serviceLines = new Map<string, any>();
  
  overview.forEach(skill => {
    const serviceLine = skill.serviceLine || 'Other';
    if (!serviceLines.has(serviceLine)) {
      serviceLines.set(serviceLine, {
        totalSkills: 0,
        coveredSkills: 0,
        avgLevel: 0,
        teamMembers: new Set(),
      });
    }
    
    const sl = serviceLines.get(serviceLine);
    sl.totalSkills++;
    if (skill.avgLevel >= 3) sl.coveredSkills++;
    sl.avgLevel += skill.avgLevel;
    sl.teamMembers.add(skill.teamCount);
  });
  
  return Array.from(serviceLines.entries()).map(([name, data]) => ({
    serviceLine: name,
    totalSkills: data.totalSkills,
    coveredSkills: data.coveredSkills,
    coveragePercentage: Math.round((data.coveredSkills / data.totalSkills) * 100),
    avgLevel: data.avgLevel / data.totalSkills,
    teamSize: Math.max(...data.teamMembers),
  }));
}

// =====================================================
// Notifications
// =====================================================

export async function getMyNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
    
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false);
    
  if (error) throw error;
}

// =====================================================
// Analytics
// =====================================================

export async function getMyStats(memberId: string) {
  const assessments = await getMyAssessments(memberId);
  const goals = await getMyGoals(memberId);
  
  const totalSkills = assessments.length;
  const assessedSkills = assessments.filter(a => a.current_level > 0).length;
  const avgLevel = assessments.reduce((sum, a) => sum + a.current_level, 0) / totalSkills || 0;
  const avgInterest = assessments.reduce((sum, a) => sum + a.interest_level, 0) / totalSkills || 0;
  
  const strengths = assessments
    .filter(a => a.current_level >= 4)
    .sort((a, b) => b.current_level - a.current_level)
    .slice(0, 5);
    
  const opportunities = assessments
    .filter(a => a.current_level < 3 && a.interest_level >= 3)
    .sort((a, b) => b.interest_level - a.interest_level)
    .slice(0, 5);
    
  const activeGoals = goals.filter(g => g.status === 'active');
  
  return {
    totalSkills,
    assessedSkills,
    completionPercentage: Math.round((assessedSkills / totalSkills) * 100),
    avgLevel: Math.round(avgLevel * 10) / 10,
    avgInterest: Math.round(avgInterest * 10) / 10,
    strengths,
    opportunities,
    activeGoalsCount: activeGoals.length,
  };
}

