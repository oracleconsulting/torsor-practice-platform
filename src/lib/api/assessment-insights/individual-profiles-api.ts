/**
 * INDIVIDUAL PROFILES API
 * Functions for calculating, retrieving, and managing individual assessment profiles
 */

import { supabase } from '@/lib/supabase/client';
import { roleFitAnalyzer } from './role-fit-analyzer';
import * as profileCalculator from './profile-calculator';
import type {
  IndividualAssessmentProfile,
  IndividualProfileData,
  RoleCompetencyGap,
  RoleDefinition,
  MemberRoleAssignment
} from './types';

// =====================================================
// CALCULATE INDIVIDUAL PROFILE
// =====================================================

export async function calculateIndividualProfile(
  practiceMemberId: string,
  forceRecalculate: boolean = false
): Promise<IndividualProfileData | null> {
  try {
    console.log(`[IndividualProfile] 🎯 Calculating profile for member: ${practiceMemberId}`);

    // 1. Check if profile exists and is recent (< 7 days old)
    if (!forceRecalculate) {
      const { data: existing } = await supabase
        .from('individual_assessment_profiles')
        .select('*')
        .eq('practice_member_id', practiceMemberId)
        .maybeSingle();

      if (existing) {
        // Profile exists - check if it's recent enough to use cached version
        if (existing.last_calculated) {
          const daysSinceCalc = (Date.now() - new Date(existing.last_calculated).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCalc < 7) {
            console.log('[IndividualProfile] Using cached profile (< 7 days old)');
            return await getIndividualProfile(practiceMemberId);
          }
        } else {
          // Profile exists but no last_calculated timestamp - use it anyway
          console.log('[IndividualProfile] Using existing profile (no timestamp)');
          return await getIndividualProfile(practiceMemberId);
        }
      }
    }

    // 2. Fetch member data
    console.log('[IndividualProfile] Step 1: Fetching member data...');
    const { data: member, error: memberError } = await supabase
      .from('practice_members')
      .select('id, name, email, role')
        .eq('id', practiceMemberId)
      .single();

    if (memberError || !member) {
      console.error('[IndividualProfile] ❌ Member not found:', memberError);
      return null;
    }
    console.log(`[IndividualProfile] ✅ Member data loaded: ${member.name}`);

    // 3. Fetch all assessment data
    console.log('[IndividualProfile] Step 2: Fetching all assessment data...');
    const [eqData, belbinData, motivData, conflictData, workingPrefsData, varkData, skillsData] = await Promise.all([
      supabase.from('eq_assessments').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('belbin_assessments').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('motivational_drivers').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('conflict_style_assessments').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('working_preferences').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('vark_assessments').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('skill_assessments').select('*, skills(name)').eq('team_member_id', practiceMemberId)
    ]);
    
    console.log('[IndividualProfile] ✅ Assessment data loaded:', {
      eq: !!eqData.data,
      belbin: !!belbinData.data,
      motivational: !!motivData.data,
      conflict: !!conflictData.data,
      workingPrefs: !!workingPrefsData.data,
      vark: !!varkData.data,
      skills: skillsData.data?.length || 0
    });

    // Build member data object for analysis
    // CRITICAL: Do NOT use default values - use actual assessment data
    // CRITICAL: Use correct column names from database (_score suffix)
    const memberData = {
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email,
      eq_scores: eqData.data ? {
        self_awareness: eqData.data.self_awareness_score ?? null,  // Note: _score suffix in DB
        self_management: eqData.data.self_management_score ?? null,
        social_awareness: eqData.data.social_awareness_score ?? null,
        relationship_management: eqData.data.relationship_management_score ?? null
      } : null,  // Explicitly null if no EQ data
      belbin_primary: belbinData.data?.primary_role ? [belbinData.data.primary_role] : [],
      belbin_secondary: belbinData.data?.secondary_role ? [belbinData.data.secondary_role] : [],
      motivational_drivers: motivData.data ? {
        // CRITICAL FIX: Scores are in JSONB field 'driver_scores', not individual columns
        achievement: motivData.data.driver_scores?.achievement ?? null,
        affiliation: motivData.data.driver_scores?.affiliation ?? null,
        autonomy: motivData.data.driver_scores?.autonomy ?? null,
        influence: motivData.data.driver_scores?.influence ?? null
      } : null,  // Explicitly null if no motivational data
      conflict_style_primary: conflictData.data?.primary_style || null,
      // CRITICAL FIX: Column is 'communication_style', not 'communication_preference'
      communication_preference: workingPrefsData.data?.communication_style || null,
      vark_preference: varkData.data?.learning_style || null,
      skills: (skillsData.data || []).map((s: any) => ({
        name: s.skills?.name || '',
        current_level: s.self_rating || 0
      }))
    };

    // 4. Calculate role-fit scores
    const advisoryScore = roleFitAnalyzer.calculateAdvisorySuitability(memberData);
    const technicalScore = roleFitAnalyzer.calculateTechnicalSuitability(memberData);
    const hybridScore = roleFitAnalyzer.calculateHybridSuitability(advisoryScore, technicalScore);
    const leadershipScore = roleFitAnalyzer.calculateLeadershipReadiness(memberData);

    // 5. Fetch current role assignment (if any)
    const { data: roleAssignment } = await supabase
      .from('member_role_assignments')
      .select('*, role_definitions(*)')
      .eq('practice_member_id', practiceMemberId)
      .eq('assignment_status', 'active')
      .maybeSingle();

    const currentRole = roleAssignment?.role_definitions as RoleDefinition | undefined;

    // 6. Generate strengths
    const strengths = profileCalculator.identifyStrengths(memberData);

    // 7. Generate development areas (considering current role if assigned)
    const developmentAreas = profileCalculator.identifyDevelopmentAreas(memberData, currentRole);

    // 8. Generate training priorities
    const trainingPriorities = profileCalculator.generateTrainingPriorities(
      memberData,
      developmentAreas,
      currentRole
    );

    // 9. Determine optimal work conditions
    const optimalConditions = profileCalculator.determineOptimalWorkConditions(memberData);

    // 10. Generate personality summary
    const personalitySummary = profileCalculator.generatePersonalitySummary(memberData);

    // 11. Generate team contribution style
    const teamContributionStyle = profileCalculator.generateTeamContributionStyle(memberData);

    // 12. Determine career trajectory
    const careerTrajectory = profileCalculator.determineCareerTrajectory(
      advisoryScore,
      technicalScore,
      leadershipScore
    );

    // 13. Generate recommended roles
    const recommendedRoles = profileCalculator.generateRecommendedRoles(
      advisoryScore,
      technicalScore,
      leadershipScore,
      member.role || 'Junior'
    );

    // 14. Calculate current role match (if assigned)
    let currentRoleMatchScore = 50;
    const currentRoleGaps: RoleCompetencyGap[] = [];

    if (currentRole) {
      // Calculate match score based on role category
      if (currentRole.role_category === 'advisory') {
        currentRoleMatchScore = advisoryScore;
      } else if (currentRole.role_category === 'technical') {
        currentRoleMatchScore = technicalScore;
      } else if (currentRole.role_category === 'hybrid') {
        currentRoleMatchScore = hybridScore;
      } else if (currentRole.role_category === 'leadership') {
        currentRoleMatchScore = leadershipScore;
      }

      // Calculate specific gaps vs role requirements
      const gaps = await calculateRoleGaps(practiceMemberId, currentRole.id, memberData, currentRole);
      currentRoleGaps.push(...gaps);
    }

    // 15. Calculate next role readiness
    const nextRoleReadiness = Math.round((leadershipScore + currentRoleMatchScore) / 2);

    // 16. Build profile object
    console.log('[IndividualProfile] Step 3: Building profile object...');
    const profile: Partial<IndividualAssessmentProfile> = {
      practice_member_id: practiceMemberId,
      top_strengths: strengths,
      development_areas: developmentAreas,
      personality_summary: personalitySummary,
      optimal_work_conditions: optimalConditions,
      team_contribution_style: teamContributionStyle,
      advisory_score: advisoryScore,
      technical_score: technicalScore,
      hybrid_score: hybridScore,
      leadership_score: leadershipScore,
      current_role_match_score: currentRoleMatchScore,
      current_role_gaps: currentRoleGaps.map(g => ({
        competency: g.competency_name,
        required: g.required_level,
        current: g.current_level,
        gap: g.gap_size,
        severity: g.severity,
        action: g.recommended_action
      })),
      recommended_roles: recommendedRoles,
      training_priorities: trainingPriorities,
      career_trajectory: careerTrajectory,
      next_role_readiness: nextRoleReadiness,
      last_calculated: new Date().toISOString(),
      calculation_version: '1.0'
    };
    console.log('[IndividualProfile] ✅ Profile object built');

    // 17. Upsert profile to database
    console.log('[IndividualProfile] Step 4: Saving profile to database...');
    const { data: savedProfile, error: saveError } = await supabase
      .from('individual_assessment_profiles')
      .upsert(profile, { onConflict: 'practice_member_id' })
      .select()
      .single();

    if (saveError) {
      console.error('[IndividualProfile] ❌ Error saving profile to database:', saveError);
      throw saveError;
    }
    console.log('[IndividualProfile] ✅ Profile saved to database');

    // 18. Save role gaps to database (if any)
    if (currentRoleGaps.length > 0 && currentRole) {
      console.log(`[IndividualProfile] Step 5: Saving ${currentRoleGaps.length} role gaps...`);
      // Delete old gaps
      await supabase
        .from('role_competency_gaps')
        .delete()
        .eq('practice_member_id', practiceMemberId)
        .eq('role_definition_id', currentRole.id);

      // Insert new gaps
      await supabase
        .from('role_competency_gaps')
        .insert(currentRoleGaps);
      console.log('[IndividualProfile] ✅ Role gaps saved');
    }

    // 19. Update role assignment suitability score
    if (roleAssignment) {
      console.log('[IndividualProfile] Step 6: Updating role assignment...');
      await supabase
        .from('member_role_assignments')
        .update({
          suitability_score: currentRoleMatchScore,
          last_calculated: new Date().toISOString()
        })
        .eq('id', roleAssignment.id);
      console.log('[IndividualProfile] ✅ Role assignment updated');
    }

    console.log(`[IndividualProfile] 🎉 Profile calculated successfully for ${member.name}`);

    // 20. Return full profile data
    return await getIndividualProfile(practiceMemberId);

  } catch (error) {
    console.error('[IndividualProfile] Error calculating profile:', error);
    console.error('[IndividualProfile] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      practiceMemberId
    });
    throw error;
  }
}

// =====================================================
// GET INDIVIDUAL PROFILE
// =====================================================

export async function getIndividualProfile(practiceMemberId: string): Promise<IndividualProfileData | null> {
  try {
    console.log(`[IndividualProfile] 🔍 Fetching profile for member: ${practiceMemberId}`);
    
    // Fetch member
    const { data: member, error: memberError } = await supabase
      .from('practice_members')
      .select('id, name, email, role')
      .eq('id', practiceMemberId)
      .single();

    if (memberError) {
      console.error(`[IndividualProfile] ❌ Error fetching member ${practiceMemberId}:`, memberError);
      return null;
    }

    if (!member) {
      console.warn(`[IndividualProfile] ⚠️ Member ${practiceMemberId} not found`);
      return null;
    }

    console.log(`[IndividualProfile] Found member: ${member.name}`);

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('individual_assessment_profiles')
      .select('*')
      .eq('practice_member_id', practiceMemberId)
      .maybeSingle();

    if (profileError) {
      console.error(`[IndividualProfile] ❌ Error fetching profile for ${member.name}:`, profileError);
      return null;
    }

    if (!profile) {
      // Profile doesn't exist yet - calculate it
      console.log(`[IndividualProfile] 🚀 No profile found for ${member.name} - triggering calculation...`);
      try {
        const calculatedProfile = await calculateIndividualProfile(practiceMemberId);
        console.log(`[IndividualProfile] ✅ Profile calculated successfully for ${member.name}`);
        return calculatedProfile;
      } catch (calcError) {
        console.error(`[IndividualProfile] ❌ Failed to calculate profile for ${member.name}:`, calcError);
        console.error(`[IndividualProfile] Calculation error details:`, {
          message: calcError instanceof Error ? calcError.message : 'Unknown',
          stack: calcError instanceof Error ? calcError.stack : undefined,
          memberId: practiceMemberId,
          memberName: member.name
        });
        return null;
      }
    }

    console.log(`[IndividualProfile] 📊 Found existing profile for ${member.name}, fetching related data...`);

    // Fetch current role assignment
    const { data: roleAssignment } = await supabase
      .from('member_role_assignments')
      .select('*, role_definitions(*)')
      .eq('practice_member_id', practiceMemberId)
      .eq('assignment_status', 'active')
      .maybeSingle();

    // Fetch role gaps
    const { data: gaps } = await supabase
      .from('role_competency_gaps')
      .select('*')
      .eq('practice_member_id', practiceMemberId)
      .order('severity', { ascending: true });

    // Fetch assessment data for display
    const [eqData, belbinData, motivData, conflictData, workingPrefsData, varkData, skillsData] = await Promise.all([
      supabase.from('eq_assessments').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('belbin_assessments').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('motivational_drivers').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('conflict_style_assessments').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('working_preferences').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('vark_assessments').select('*').eq('practice_member_id', practiceMemberId).maybeSingle(),
      supabase.from('skill_assessments').select('*, skills(name)').eq('team_member_id', practiceMemberId)
    ]);

    // Calculate stats
    const stats = {
      strengths_count: profile.top_strengths?.length || 0,
      critical_gaps_count: profile.development_areas?.filter((d: any) => d.priority === 'critical').length || 0,
      training_priorities_count: profile.training_priorities?.length || 0,
      overall_readiness: Math.round(
        (profile.advisory_score + profile.technical_score + profile.leadership_score) / 3
      ),
      role_match_percentage: profile.current_role_match_score || 0
    };

    return {
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role || ''
      },
      profile: profile as IndividualAssessmentProfile,
      currentRoleAssignment: roleAssignment as MemberRoleAssignment,
      assessments: {
        eq: eqData.data,
        belbin: belbinData.data,
        motivational_drivers: motivData.data,
        conflict_style: conflictData.data,
        working_preferences: workingPrefsData.data,
        vark: varkData.data,
        skills: skillsData.data
      },
      gaps: (gaps || []) as RoleCompetencyGap[],
      stats
    };

  } catch (error) {
    console.error('[IndividualProfile] Error fetching profile:', error);
    return null;
  }
}

// =====================================================
// CALCULATE ROLE GAPS
// =====================================================

async function calculateRoleGaps(
  practiceMemberId: string,
  roleDefinitionId: string,
  memberData: any,
  role: RoleDefinition
): Promise<RoleCompetencyGap[]> {
  const gaps: RoleCompetencyGap[] = [];

  // EQ Gaps
  if (memberData.eq_scores) {
    const eqChecks = [
      { dimension: 'self_awareness', min: role.min_eq_self_awareness },
      { dimension: 'self_management', min: role.min_eq_self_management },
      { dimension: 'social_awareness', min: role.min_eq_social_awareness },
      { dimension: 'relationship_management', min: role.min_eq_relationship_management }
    ];

    eqChecks.forEach(check => {
      const current = memberData.eq_scores[check.dimension] || 0;
      const gap = check.min - current;

      if (gap > 0) {
        gaps.push({
          id: '', // Will be generated by DB
          practice_member_id: practiceMemberId,
          role_definition_id: roleDefinitionId,
          competency_type: 'eq',
          competency_name: `EQ: ${check.dimension.replace('_', ' ')}`,
          required_level: check.min,
          current_level: current,
          gap_size: gap,
          severity: gap >= 20 ? 'critical' : gap >= 10 ? 'high' : 'medium',
          is_blocking: gap >= 20,
          recommended_action: `Develop ${check.dimension.replace('_', ' ')} through coaching and targeted training`,
          estimated_time_to_close: gap >= 20 ? '6 months' : '3 months',
          gap_status: 'identified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
  }

  // Skill Gaps
  if (role.required_skills && Array.isArray(role.required_skills)) {
    const memberSkillMap = new Map(
      (memberData.skills || []).map((s: any) => [s.name, s.current_level])
    );

    role.required_skills.forEach(reqSkill => {
      const current = memberSkillMap.get(reqSkill.skill_name) || 0;
      const gap = reqSkill.min_level - current;

      if (gap > 0) {
        gaps.push({
          id: '',
          practice_member_id: practiceMemberId,
          role_definition_id: roleDefinitionId,
          competency_type: 'skill',
          competency_name: reqSkill.skill_name,
          required_level: reqSkill.min_level * 20, // Convert to 0-100
          current_level: current * 20,
          gap_size: gap * 20,
          severity: reqSkill.importance === 'critical' ? 'high' : 'medium',
          is_blocking: reqSkill.importance === 'critical' && gap >= 2,
          recommended_action: `Complete ${reqSkill.skill_name} training and gain practical experience`,
          estimated_time_to_close: gap >= 2 ? '6 months' : '3 months',
          gap_status: 'identified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
  }

  // Motivation Gaps
  const motivChecks = [
    { driver: 'achievement', required: role.required_achievement },
    { driver: 'affiliation', required: role.required_affiliation },
    { driver: 'autonomy', required: role.required_autonomy },
    { driver: 'influence', required: role.required_influence }
  ];

  motivChecks.forEach(check => {
    const current = memberData.motivational_drivers?.[check.driver] || 50;
    const gap = check.required - current;

    if (gap >= 15) { // Only flag significant gaps
      gaps.push({
        id: '',
        practice_member_id: practiceMemberId,
        role_definition_id: roleDefinitionId,
        competency_type: 'motivation',
        competency_name: `Motivational Driver: ${check.driver}`,
        required_level: check.required,
        current_level: current,
        gap_size: gap,
        severity: gap >= 25 ? 'high' : 'medium',
        is_blocking: false, // Motivational gaps are rarely blocking
        recommended_action: `Discuss role expectations and motivational fit with manager`,
        estimated_time_to_close: 'Ongoing',
        gap_status: 'identified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  });

  return gaps;
}

// =====================================================
// GET ALL PROFILES FOR PRACTICE
// =====================================================

export async function getAllProfilesForPractice(practiceId: string): Promise<IndividualProfileData[]> {
  try {
    console.log('[IndividualProfile] 🎯 Getting all profiles for practice:', practiceId);
    
    // Get all active members (excluding test accounts)
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id, name')
      .eq('practice_id', practiceId)
      .eq('is_active', true)
      .or('is_test_account.is.null,is_test_account.eq.false');

    if (membersError) {
      console.error('[IndividualProfile] ❌ Error fetching members:', membersError);
      return [];
    }

    if (!members || members.length === 0) {
      console.warn('[IndividualProfile] ⚠️ No active members found for practice');
      return [];
    }

    console.log(`[IndividualProfile] Found ${members.length} active members`);

    // Fetch profiles for all members (will auto-calculate if missing)
    const profiles: (IndividualProfileData | null)[] = [];
    
    for (const member of members) {
      try {
        console.log(`[IndividualProfile] Processing ${member.name} (${member.id})...`);
        const profile = await getIndividualProfile(member.id);
        profiles.push(profile);
        
        if (profile) {
          console.log(`[IndividualProfile] ✅ Profile loaded for ${member.name}`);
        } else {
          console.warn(`[IndividualProfile] ⚠️ No profile returned for ${member.name}`);
        }
      } catch (error) {
        console.error(`[IndividualProfile] ❌ Error processing ${member.name}:`, error);
        profiles.push(null);
      }
    }

    const validProfiles = profiles.filter(p => p !== null) as IndividualProfileData[];
    console.log(`[IndividualProfile] 🎯 Returning ${validProfiles.length} valid profiles`);
    
    return validProfiles;

  } catch (error) {
    console.error('[IndividualProfile] ❌ Fatal error fetching all profiles:', error);
    console.error('[IndividualProfile] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      practiceId
    });
    return [];
  }
}

