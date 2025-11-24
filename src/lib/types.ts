// Database Types (from Supabase)
export interface Skill {
  id: string;
  name: string;
  category: string;
  required_level: number;
  is_active: boolean;
}

export interface PracticeMember {
  id: string;
  name: string;
  email: string;
  role: string;
  practice_id: string;
  user_id: string | null;
}

export interface SkillAssessment {
  id: string;
  member_id: string;
  skill_id: string;
  current_level: number;
  interest_level: number;
  assessed_at: string;
}

export interface Practice {
  id: string;
  name: string;
  owner_id: string;
}

// Assessment Types (for analytics)
export interface VarkAssessment {
  id: string;
  member_id: string;
  learning_type: string;
}

export interface PersonalityAssessment {
  id: string;
  member_id: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface BelbinAssessment {
  id: string;
  member_id: string;
  primary_role: string;
  secondary_role: string;
}

export interface EQAssessment {
  id: string;
  member_id: string;
  eq_level: string;
  self_awareness: number;
  self_management: number;
  social_awareness: number;
  relationship_management: number;
}

export interface MotivationalDriver {
  id: string;
  member_id: string;
  primary_driver: string;
  secondary_driver: string;
}

export interface ConflictStyleAssessment {
  id: string;
  member_id: string;
  primary_style: string;
}

export interface WorkingPreferences {
  id: string;
  member_id: string;
  remote_preference: string;
  work_hours_preference: string;
  autonomy_preference?: number;
  work_life_balance_priority?: number;
}

// UI Types
export interface HeatmapCell {
  memberId: string;
  memberName: string;
  skillId: string;
  skillName: string;
  currentLevel: number | null;
  requiredLevel: number;
}

