/**
 * Personality Assessment API
 * Handles OCEAN (Big Five) personality assessment data
 */

import { supabase } from '@/lib/supabase/client';
import { BigFiveProfile } from '../assessments/big-five-questions';

export interface PersonalityAssessment {
  id: string;
  team_member_id: string;
  assessment_version: string;
  openness_score: number;
  conscientiousness_score: number;
  extraversion_score: number;
  agreeableness_score: number;
  neuroticism_score: number;
  emotional_stability_score: number;
  facet_scores: Record<string, number>;
  dominant_traits: string[];
  work_style: string;
  communication_style: string;
  completed_at: string;
  completion_time_seconds: number;
  responses: number[];
}

export interface TeamMemberProfile {
  id: string;
  team_member_id: string;
  personality_profile: Record<string, number>;
  learning_style: string;
  cognitive_style: string;
  preferred_work_environment: string[];
  preferred_communication_channels: string[];
  preferred_feedback_style: string;
  preferred_recognition_type: string;
  ideal_team_size: string;
  collaboration_preference: number;
  leadership_potential: number;
  specialist_vs_generalist: number;
  role_affinities: Record<string, number>;
  vark_completed: boolean;
  ocean_completed: boolean;
  profile_strength: number;
}

/**
 * Save personality assessment results
 */
export async function savePersonalityAssessment(
  teamMemberId: string,
  profile: BigFiveProfile,
  responses: number[],
  completionTimeSeconds: number
): Promise<{ success: boolean; assessment?: PersonalityAssessment; error?: any }> {
  try {
    const { data, error } = await (supabase
      .from('personality_assessments') as any)
      .upsert({
        team_member_id: teamMemberId,
        assessment_version: '1.0',
        openness_score: profile.traits.openness,
        conscientiousness_score: profile.traits.conscientiousness,
        extraversion_score: profile.traits.extraversion,
        agreeableness_score: profile.traits.agreeableness,
        neuroticism_score: profile.traits.neuroticism,
        emotional_stability_score: profile.emotionalStability,
        facet_scores: profile.facets,
        dominant_traits: profile.dominant_traits,
        work_style: profile.work_style,
        communication_style: profile.communication_style,
        responses: responses,
        completion_time_seconds: completionTimeSeconds,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Personality Assessment] Error saving:', error);
      return { success: false, error };
    }

    console.log('[Personality Assessment] Saved successfully for member:', teamMemberId);
    return { success: true, assessment: data as any };
  } catch (error) {
    console.error('[Personality Assessment] Exception:', error);
    return { success: false, error };
  }
}

/**
 * Get personality assessment for a team member
 */
export async function getPersonalityAssessment(
  teamMemberId: string
): Promise<PersonalityAssessment | null> {
  try {
    const { data, error } = await supabase
      .from('personality_assessments')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No assessment found - this is expected
        return null;
      }
      console.error('[Personality Assessment] Error fetching:', error);
      return null;
    }

    return data as any;
  } catch (error) {
    console.error('[Personality Assessment] Exception:', error);
    return null;
  }
}

/**
 * Create or update combined team member profile (VARK + OCEAN)
 */
export async function createCombinedProfile(
  teamMemberId: string,
  personalityProfile: BigFiveProfile,
  varkData?: { primary_style: string; scores: Record<string, number> }
): Promise<boolean> {
  try {
    // Determine cognitive style
    const cognitiveStyle = determineCognitiveStyle(personalityProfile, varkData);
    
    // Determine work environment preferences
    const workEnvironment = determinePreferredEnvironment(personalityProfile, varkData);
    
    // Determine communication channels
    const communicationChannels = determineCommunicationChannels(personalityProfile, varkData);
    
    // Calculate leadership potential
    const leadershipPotential = calculateLeadershipPotential(personalityProfile);
    
    // Calculate role affinities
    const roleAffinities = calculateRoleAffinities(personalityProfile, varkData);
    
    // Determine other preferences
    const idealTeamSize = personalityProfile.traits.extraversion > 60 ? 'medium' : 'small';
    const collaborationPreference = personalityProfile.traits.extraversion / 100;
    const specialistVsGeneralist = personalityProfile.traits.openness > 60 ? 0.7 : 0.3; // Higher openness = more generalist
    
    // Calculate profile strength
    const varkCompleted = !!varkData;
    const oceanCompleted = true;
    const profileStrength = varkCompleted && oceanCompleted ? 1.0 : oceanCompleted ? 0.7 : 0.3;
    
    const { error } = await (supabase
      .from('team_member_profiles') as any)
      .upsert({
        team_member_id: teamMemberId,
        personality_profile: personalityProfile.traits,
        learning_style: varkData?.primary_style || null,
        cognitive_style: cognitiveStyle,
        preferred_work_environment: workEnvironment,
        preferred_communication_channels: communicationChannels,
        preferred_feedback_style: determineFeedbackStyle(personalityProfile),
        preferred_recognition_type: determineRecognitionType(personalityProfile),
        ideal_team_size: idealTeamSize,
        collaboration_preference: collaborationPreference,
        leadership_potential: leadershipPotential,
        specialist_vs_generalist: specialistVsGeneralist,
        role_affinities: roleAffinities,
        vark_completed: varkCompleted,
        ocean_completed: oceanCompleted,
        profile_strength: profileStrength,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('[Team Member Profile] Error saving:', error);
      return false;
    }

    console.log('[Team Member Profile] Created/updated for member:', teamMemberId);
    return true;
  } catch (error) {
    console.error('[Team Member Profile] Exception:', error);
    return false;
  }
}

/**
 * Get combined team member profile
 */
export async function getTeamMemberProfile(
  teamMemberId: string
): Promise<TeamMemberProfile | null> {
  try {
    const { data, error } = await supabase
      .from('team_member_profiles')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[Team Member Profile] Error fetching:', error);
      return null;
    }

    return data as any;
  } catch (error) {
    console.error('[Team Member Profile] Exception:', error);
    return null;
  }
}

/**
 * Get all team member profiles for a practice (for admin dashboard)
 */
export async function getPracticeTeamProfiles(
  practiceId: string
): Promise<any[]> {
  try {
    const { data, error} = await supabase
      .from('team_assessment_overview')
      .select('*')
      .eq('practice_id', practiceId)
      .order('member_name');

    if (error) {
      console.error('[Practice Team Profiles] Error fetching:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('[Practice Team Profiles] Exception:', error);
    return [];
  }
}

// ============================================
// Helper Functions
// ============================================

function determineCognitiveStyle(
  personality: BigFiveProfile,
  vark?: { primary_style: string }
): string {
  if (personality.traits.openness > 70 && vark?.primary_style === 'visual') {
    return 'conceptual-visual';
  }
  if (personality.traits.conscientiousness > 70 && vark?.primary_style === 'reading_writing') {
    return 'analytical-textual';
  }
  if (personality.traits.extraversion > 60 && vark?.primary_style === 'auditory') {
    return 'verbal-processor';
  }
  if (vark?.primary_style === 'kinesthetic') {
    return 'experiential-learner';
  }
  if (personality.traits.openness > 60) {
    return 'conceptual-thinker';
  }
  if (personality.traits.conscientiousness > 60) {
    return 'systematic-processor';
  }
  return 'adaptive-processor';
}

function determinePreferredEnvironment(
  personality: BigFiveProfile,
  vark?: { primary_style: string }
): string[] {
  const environment: string[] = [];
  
  // Based on extraversion
  if (personality.traits.extraversion > 60) {
    environment.push('collaborative-spaces', 'open-office', 'team-areas');
  } else {
    environment.push('quiet-zones', 'private-workspace', 'focused-areas');
  }
  
  // Based on VARK
  if (vark?.primary_style === 'visual') {
    environment.push('natural-light', 'visual-displays', 'whiteboards');
  } else if (vark?.primary_style === 'kinesthetic') {
    environment.push('standing-desks', 'flexible-seating', 'movement-friendly');
  }
  
  // Based on conscientiousness
  if (personality.traits.conscientiousness > 70) {
    environment.push('organized-workspace', 'minimal-distractions');
  }
  
  return environment;
}

function determineCommunicationChannels(
  personality: BigFiveProfile,
  vark?: { primary_style: string }
): string[] {
  const channels: string[] = [];
  
  // Based on extraversion
  if (personality.traits.extraversion > 60) {
    channels.push('video-calls', 'in-person-meetings', 'team-discussions');
  } else {
    channels.push('email', 'async-messaging', 'written-updates');
  }
  
  // Based on VARK
  if (vark?.primary_style === 'visual') {
    channels.push('diagrams', 'charts', 'visual-presentations');
  } else if (vark?.primary_style === 'auditory') {
    channels.push('voice-notes', 'phone-calls', 'verbal-briefings');
  } else if (vark?.primary_style === 'reading_writing') {
    channels.push('documentation', 'written-reports', 'detailed-emails');
  } else if (vark?.primary_style === 'kinesthetic') {
    channels.push('demonstrations', 'hands-on-sessions', 'workshops');
  }
  
  return channels;
}

function determineFeedbackStyle(personality: BigFiveProfile): string {
  const { agreeableness, neuroticism, extraversion } = personality.traits;
  
  if (agreeableness > 60 && neuroticism > 60) {
    return 'supportive-detailed'; // Needs gentle, comprehensive feedback
  }
  if (agreeableness < 40 && extraversion > 60) {
    return 'direct-immediate'; // Prefers straightforward, quick feedback
  }
  if (neuroticism < 40 && conscientiousness > 60) {
    return 'objective-structured'; // Wants data-driven, organized feedback
  }
  return 'balanced-constructive';
}

function determineRecognitionType(personality: BigFiveProfile): string {
  const { extraversion, agreeableness } = personality.traits;
  
  if (extraversion > 60) {
    return 'public-praise'; // Enjoys public recognition
  }
  if (extraversion < 40 && agreeableness > 60) {
    return 'private-appreciation'; // Prefers quiet acknowledgment
  }
  if (agreeableness < 40) {
    return 'achievement-based'; // Wants tangible rewards/advancement
  }
  return 'mixed-recognition';
}

function calculateLeadershipPotential(personality: BigFiveProfile): number {
  // Leadership formula:
  // High Extraversion + High Conscientiousness + Low Neuroticism + Moderate Agreeableness
  const { extraversion, conscientiousness, neuroticism, agreeableness } = personality.traits;
  
  const score = (
    extraversion * 0.30 +
    conscientiousness * 0.30 +
    (100 - neuroticism) * 0.20 +
    (Math.abs(agreeableness - 60) < 20 ? 20 : Math.max(0, 20 - Math.abs(agreeableness - 60))) // Optimal agreeableness is moderate
  ) / 100;
  
  return Math.min(1, Math.max(0, score));
}

function calculateRoleAffinities(
  personality: BigFiveProfile,
  vark?: { primary_style: string }
): Record<string, number> {
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = personality.traits;
  const emotionalStability = 100 - neuroticism;
  
  return {
    // Project Manager: High Conscientiousness + Extraversion + Agreeableness
    project_manager: Math.round(
      conscientiousness * 0.4 + extraversion * 0.3 + agreeableness * 0.3
    ),
    
    // Technical Specialist: High Conscientiousness + Openness + Low Extraversion
    technical_specialist: Math.round(
      conscientiousness * 0.5 + openness * 0.3 + (100 - extraversion) * 0.2
    ),
    
    // Client Relationship: High Extraversion + Agreeableness + Emotional Stability
    client_relationship: Math.round(
      extraversion * 0.4 + agreeableness * 0.4 + emotionalStability * 0.2
    ),
    
    // Innovator: High Openness + Extraversion + Low Conscientiousness (flexibility)
    innovator: Math.round(
      openness * 0.6 + extraversion * 0.2 + (100 - conscientiousness) * 0.2
    ),
    
    // Quality Assurance: High Conscientiousness + Low Openness (detail focus) + Moderate Agreeableness
    quality_assurance: Math.round(
      conscientiousness * 0.6 + (100 - openness) * 0.2 + agreeableness * 0.2
    ),
    
    // Team Coordinator: High Agreeableness + Extraversion + Conscientiousness
    team_coordinator: Math.round(
      agreeableness * 0.4 + extraversion * 0.3 + conscientiousness * 0.3
    ),
    
    // Strategic Advisor: High Openness + Conscientiousness + Moderate Extraversion
    strategic_advisor: Math.round(
      openness * 0.4 + conscientiousness * 0.3 + Math.min(extraversion, 70) * 0.3
    ),
    
    // Crisis Manager: High Emotional Stability + Conscientiousness + Moderate Extraversion
    crisis_manager: Math.round(
      emotionalStability * 0.4 + conscientiousness * 0.3 + Math.min(extraversion, 70) * 0.3
    )
  };
}

export {
  determineCognitiveStyle,
  determinePreferredEnvironment,
  determineCommunicationChannels,
  calculateLeadershipPotential,
  calculateRoleAffinities
};


