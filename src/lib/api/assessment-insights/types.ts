/**
 * INDIVIDUAL ASSESSMENT PROFILES - TYPE DEFINITIONS
 * Role definitions, member assignments, and profile analysis types
 */

// =====================================================
// ROLE DEFINITION TYPES
// =====================================================

export interface RoleDefinition {
  id: string;
  practice_id: string;
  
  // Basic Info
  role_title: string;
  role_category: 'technical' | 'advisory' | 'hybrid' | 'leadership';
  seniority_level: 'Junior' | 'Senior' | 'Assistant Manager' | 'Manager' | 'Director' | 'Associate Director' | 'Partner';
  department: string;
  
  // Description
  description: string;
  key_responsibilities: string[];
  
  // Requirements
  required_belbin_roles: {
    [key: string]: 'required' | 'preferred' | 'optional';
  };
  
  min_eq_self_awareness: number;
  min_eq_self_management: number;
  min_eq_social_awareness: number;
  min_eq_relationship_management: number;
  
  required_achievement: number;
  required_affiliation: number;
  required_autonomy: number;
  required_influence: number;
  
  preferred_communication_style: 'sync' | 'async' | 'hybrid';
  preferred_work_environment?: 'office' | 'remote' | 'hybrid';
  client_facing: boolean;
  
  preferred_conflict_styles?: string[];
  
  required_skills: {
    skill_name: string;
    min_level: number;
    importance: 'critical' | 'high' | 'medium' | 'low';
  }[];
  
  training_delivery_preference?: string;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// =====================================================
// MEMBER ROLE ASSIGNMENT TYPES
// =====================================================

export interface MemberRoleAssignment {
  id: string;
  practice_member_id: string;
  role_definition_id: string;
  
  assigned_date: string;
  target_proficiency_date?: string;
  
  suitability_score?: number;
  last_calculated?: string;
  
  assignment_status: 'active' | 'training' | 'completed' | 'reassigned';
  assignment_notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // Expanded data
  role_definition?: RoleDefinition;
}

// =====================================================
// INDIVIDUAL ASSESSMENT PROFILE TYPES
// =====================================================

export interface Strength {
  area: string;
  score: number;
  evidence: string;
  category: 'technical' | 'interpersonal' | 'leadership' | 'analytical' | 'creative';
}

export interface DevelopmentArea {
  area: string;
  current_score: number;
  target_score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeline: string;
  recommended_actions: string[];
}

export interface TrainingPriority {
  skill: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  estimated_time: string;
  recommended_method: string;
  expected_outcome: string;
}

export interface OptimalWorkConditions {
  communication: string;
  environment: string;
  autonomy: 'high' | 'medium' | 'low';
  supervision: 'minimal' | 'moderate' | 'close';
  task_variety: 'high' | 'medium' | 'low';
}

export interface RoleGap {
  competency: string;
  required: number;
  current: number;
  gap: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: string;
}

export interface IndividualAssessmentProfile {
  id: string;
  practice_member_id: string;
  
  // Strengths
  top_strengths: Strength[];
  
  // Development Areas
  development_areas: DevelopmentArea[];
  
  // Personality
  personality_summary: string;
  
  // Work Style
  optimal_work_conditions: OptimalWorkConditions;
  
  // Team Contribution
  team_contribution_style: string;
  
  // Role Suitability
  advisory_score: number;
  technical_score: number;
  hybrid_score: number;
  leadership_score: number;
  
  // Current Role Match
  current_role_match_score: number;
  current_role_gaps: RoleGap[];
  
  // Recommendations
  recommended_roles: string[];
  training_priorities: TrainingPriority[];
  
  // Career Path
  career_trajectory: 'technical_specialist' | 'people_manager' | 'hybrid_leader' | 'partner_track';
  next_role_readiness: number;
  
  // Metadata
  last_calculated: string;
  calculation_version: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// ROLE COMPETENCY GAP TYPES
// =====================================================

export interface RoleCompetencyGap {
  id: string;
  practice_member_id: string;
  role_definition_id: string;
  
  competency_type: 'belbin' | 'eq' | 'skill' | 'motivation' | 'communication';
  competency_name: string;
  
  required_level: number;
  current_level: number;
  gap_size: number;
  
  severity: 'critical' | 'high' | 'medium' | 'low';
  is_blocking: boolean;
  
  recommended_action: string;
  estimated_time_to_close: string;
  
  gap_status: 'identified' | 'in_progress' | 'closed';
  progress_notes?: string;
  
  created_at: string;
  updated_at: string;
}

// =====================================================
// COMPUTED PROFILE DATA TYPES
// =====================================================

export interface IndividualProfileData {
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  
  profile: IndividualAssessmentProfile;
  
  currentRoleAssignment?: MemberRoleAssignment;
  
  assessments: {
    eq?: any;
    belbin?: any;
    motivational_drivers?: any;
    conflict_style?: any;
    working_preferences?: any;
    vark?: any;
    skills?: any[];
  };
  
  gaps: RoleCompetencyGap[];
  
  // Quick Stats
  stats: {
    strengths_count: number;
    critical_gaps_count: number;
    training_priorities_count: number;
    overall_readiness: number;
    role_match_percentage: number;
  };
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateRoleDefinitionRequest {
  role_title: string;
  role_category: string;
  seniority_level: string;
  department: string;
  description: string;
  key_responsibilities: string[];
  required_belbin_roles: any;
  min_eq_self_awareness: number;
  min_eq_self_management: number;
  min_eq_social_awareness: number;
  min_eq_relationship_management: number;
  required_achievement: number;
  required_affiliation: number;
  required_autonomy: number;
  required_influence: number;
  preferred_communication_style: string;
  client_facing: boolean;
  required_skills: any[];
}

export interface AssignRoleRequest {
  practice_member_id: string;
  role_definition_id: string;
  target_proficiency_date?: string;
  assignment_notes?: string;
}

export interface CalculateProfileRequest {
  practice_member_id: string;
  force_recalculate?: boolean;
}

export interface CalculateProfileResponse {
  success: boolean;
  profile: IndividualAssessmentProfile;
  gaps: RoleCompetencyGap[];
  message?: string;
}

