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
  member_type?: 'team' | 'client';
  client_company?: string;
  client_owner_id?: string;
  owner?: { id: string; name: string; email: string } | null;
}

export interface SkillAssessment {
  id: string;
  member_id: string;
  skill_id: string;
  current_level: number;
  interest_level: number;
  assessed_at: string;
}

export const SKILL_CATEGORIES = [
  'Advisory & Consulting',
  'Client Management & Development',
  'Communication & Presentation',
  'Financial Analysis & Reporting',
  'Financial Planning',
  'Leadership & Management',
  'Personal Effectiveness',
  'Software & Technical',
  'Tax & Compliance',
  'Working Capital & Business Finance',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface CPDRecord {
  id: string;
  practice_id: string;
  member_id: string;
  activity_type: 'course' | 'webinar' | 'reading' | 'conference' | 'mentoring' | 'workshop' | 'on_the_job' | 'shadowing';
  title: string;
  description?: string;
  provider?: string;
  hours: number;
  date_completed: string;
  skill_category: string;
  skill_ids: string[];
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  certificate_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CPDTarget {
  id: string;
  practice_id: string;
  member_id: string;
  year: number;
  target_hours: number;
  category_targets: Record<string, number>;
}

export interface TrainingPlan {
  id: string;
  practice_id: string;
  member_id: string;
  title: string;
  description?: string;
  skill_ids: string[];
  service_line_id?: string;
  target_level?: number;
  current_progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  start_date?: string;
  target_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  modules?: TrainingModule[];
}

export interface TrainingModule {
  id: string;
  training_plan_id: string;
  title: string;
  description?: string;
  module_type: 'video' | 'reading' | 'exercise' | 'assessment' | 'workshop' | 'on_the_job' | 'shadowing' | 'mentoring' | 'client_delivery';
  duration_hours: number;
  skill_category?: string;
  resource_url?: string;
  sort_order: number;
  completed: boolean;
  completed_at?: string;
  cpd_record_id?: string;
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

