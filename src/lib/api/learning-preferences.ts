/**
 * Learning Preferences API
 * Handles VARK learning style assessments and preferences
 */

import { supabase } from '@/lib/supabase/client';

export interface VARKQuestion {
  id: number;
  question_number: number;
  question_text: string;
  category: string;
  option_a: string;
  option_a_style: string;
  option_b: string;
  option_b_style: string;
  option_c: string;
  option_c_style: string;
  option_d: string;
  option_d_style: string;
  is_active: boolean;
}

export interface VARKAnswer {
  question_number: number;
  selected_option: 'a' | 'b' | 'c' | 'd';
  selected_style: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic';
}

export interface LearningPreference {
  id: string;
  team_member_id: string;
  visual_score: number;
  auditory_score: number;
  reading_writing_score: number;
  kinesthetic_score: number;
  primary_style: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'multimodal';
  is_multimodal: boolean;
  assessment_answers: VARKAnswer[];
  assessed_at: string;
  completed_by: string;
  assessment_version: string;
  learning_recommendations: string[];
  updated_at: string;
}

export interface LearningStyleProfile {
  primary_style: string;
  is_multimodal: boolean;
  scores: {
    visual: number;
    auditory: number;
    reading_writing: number;
    kinesthetic: number;
  };
  recommendations: string[];
  strengths: string[];
  learning_tips: string[];
}

/**
 * Get all VARK questions
 */
export const getVARKQuestions = async (): Promise<VARKQuestion[]> => {
  const { data, error } = await supabase
    .from('vark_questions')
    .select('*')
    .eq('is_active', true)
    .order('question_number', { ascending: true });

  if (error) {
    console.error('Error fetching VARK questions:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get learning preference for a team member
 */
export const getLearningPreference = async (
  teamMemberId: string
): Promise<LearningPreference | null> => {
  const { data, error } = await supabase
    .from('learning_preferences')
    .select('*')
    .eq('team_member_id', teamMemberId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    console.error('Error fetching learning preference:', error);
    throw error;
  }

  return data;
};

/**
 * Calculate VARK scores from answers
 */
export const calculateVARKScores = (answers: VARKAnswer[]): {
  visual: number;
  auditory: number;
  reading_writing: number;
  kinesthetic: number;
} => {
  const counts = {
    visual: 0,
    auditory: 0,
    reading_writing: 0,
    kinesthetic: 0,
  };

  // Count each style selection
  answers.forEach((answer) => {
    counts[answer.selected_style]++;
  });

  const total = answers.length;

  // Convert to percentages
  return {
    visual: Math.round((counts.visual / total) * 100),
    auditory: Math.round((counts.auditory / total) * 100),
    reading_writing: Math.round((counts.reading_writing / total) * 100),
    kinesthetic: Math.round((counts.kinesthetic / total) * 100),
  };
};

/**
 * Determine primary learning style and if multimodal
 */
export const determinePrimaryStyle = (scores: {
  visual: number;
  auditory: number;
  reading_writing: number;
  kinesthetic: number;
}): {
  primary_style: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'multimodal';
  is_multimodal: boolean;
} => {
  const maxScore = Math.max(
    scores.visual,
    scores.auditory,
    scores.reading_writing,
    scores.kinesthetic
  );

  // Count how many styles have the max score or are within 10%
  const threshold = maxScore - 10;
  const topStyles = [];

  if (scores.visual >= threshold) topStyles.push('visual');
  if (scores.auditory >= threshold) topStyles.push('auditory');
  if (scores.reading_writing >= threshold) topStyles.push('reading_writing');
  if (scores.kinesthetic >= threshold) topStyles.push('kinesthetic');

  const is_multimodal = topStyles.length >= 2;

  // Determine primary style
  let primary_style: any = 'multimodal';
  if (!is_multimodal) {
    if (scores.visual === maxScore) primary_style = 'visual';
    else if (scores.auditory === maxScore) primary_style = 'auditory';
    else if (scores.reading_writing === maxScore) primary_style = 'reading_writing';
    else if (scores.kinesthetic === maxScore) primary_style = 'kinesthetic';
  }

  return { primary_style, is_multimodal };
};

/**
 * Generate learning recommendations based on VARK profile
 */
export const generateLearningRecommendations = (
  primary_style: string,
  is_multimodal: boolean,
  scores: {
    visual: number;
    auditory: number;
    reading_writing: number;
    kinesthetic: number;
  }
): string[] => {
  const recommendations: string[] = [];

  if (is_multimodal) {
    recommendations.push('Your multimodal learning style means you benefit from varied learning approaches.');
    recommendations.push('Combine multiple methods (visual, auditory, hands-on) for best retention.');
  }

  // Visual recommendations
  if (scores.visual >= 30) {
    recommendations.push('Use diagrams, charts, and visual aids when learning new concepts.');
    recommendations.push('Color-code notes and use mind maps to organize information.');
    if (primary_style === 'visual') {
      recommendations.push('Watch video tutorials and demonstrations before hands-on practice.');
    }
  }

  // Auditory recommendations
  if (scores.auditory >= 30) {
    recommendations.push('Discuss new topics with colleagues or participate in group discussions.');
    recommendations.push('Listen to podcasts or audio recordings of training materials.');
    if (primary_style === 'auditory') {
      recommendations.push('Read important information aloud or explain concepts to others.');
    }
  }

  // Reading/Writing recommendations
  if (scores.reading_writing >= 30) {
    recommendations.push('Take detailed written notes during training sessions.');
    recommendations.push('Read manuals, articles, and documentation thoroughly.');
    if (primary_style === 'reading_writing') {
      recommendations.push('Write summaries and create checklists to reinforce learning.');
    }
  }

  // Kinesthetic recommendations
  if (scores.kinesthetic >= 30) {
    recommendations.push('Learn by doing - prioritize hands-on practice and real examples.');
    recommendations.push('Use case studies and practical exercises to understand concepts.');
    if (primary_style === 'kinesthetic') {
      recommendations.push('Take breaks during long learning sessions and apply concepts immediately.');
    }
  }

  return recommendations;
};

/**
 * Save VARK assessment results
 */
export const saveLearningPreference = async (
  teamMemberId: string,
  userId: string,
  answers: VARKAnswer[]
): Promise<LearningPreference> => {
  // Calculate scores
  const scores = calculateVARKScores(answers);
  const { primary_style, is_multimodal } = determinePrimaryStyle(scores);
  const recommendations = generateLearningRecommendations(primary_style, is_multimodal, scores);

  const preferenceData = {
    team_member_id: teamMemberId,
    visual_score: scores.visual,
    auditory_score: scores.auditory,
    reading_writing_score: scores.reading_writing,
    kinesthetic_score: scores.kinesthetic,
    primary_style,
    is_multimodal,
    assessment_answers: answers,
    completed_by: userId,
    assessment_version: '1.0',
    learning_recommendations: recommendations,
    assessed_at: new Date().toISOString(),
  };

  // Upsert (insert or update if exists)
  const { data, error } = await supabase
    .from('learning_preferences')
    .upsert(preferenceData, {
      onConflict: 'team_member_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving learning preference:', error);
    throw error;
  }

  // Also update the practice_members table
  await supabase
    .from('practice_members')
    .update({
      learning_style: primary_style,
      vark_completed: true,
      vark_completed_at: new Date().toISOString(),
    })
    .eq('id', teamMemberId);

  return data;
};

/**
 * Get learning style profile with formatted data
 */
export const getLearningStyleProfile = async (
  teamMemberId: string
): Promise<LearningStyleProfile | null> => {
  const preference = await getLearningPreference(teamMemberId);

  if (!preference) {
    return null;
  }

  const profile: LearningStyleProfile = {
    primary_style: preference.primary_style,
    is_multimodal: preference.is_multimodal,
    scores: {
      visual: preference.visual_score,
      auditory: preference.auditory_score,
      reading_writing: preference.reading_writing_score,
      kinesthetic: preference.kinesthetic_score,
    },
    recommendations: preference.learning_recommendations,
    strengths: getStyleStrengths(preference.primary_style),
    learning_tips: getStyleLearningTips(preference.primary_style),
  };

  return profile;
};

/**
 * Get strengths for each learning style
 */
const getStyleStrengths = (style: string): string[] => {
  const strengthsMap: { [key: string]: string[] } = {
    visual: [
      'Remembers faces and places well',
      'Good at reading maps and diagrams',
      'Notices visual details',
      'Thinks in pictures',
    ],
    auditory: [
      'Remembers conversations easily',
      'Learns well from lectures and discussions',
      'Good at explaining concepts verbally',
      'Enjoys group learning',
    ],
    reading_writing: [
      'Excellent note-taker',
      'Learns well from written materials',
      'Good at written communication',
      'Organized in documentation',
    ],
    kinesthetic: [
      'Learns by doing',
      'Good at hands-on tasks',
      'Understands through real examples',
      'Remembers experiences well',
    ],
    multimodal: [
      'Flexible learning approach',
      'Adapts to different training methods',
      'Benefits from varied learning resources',
      'Well-rounded understanding',
    ],
  };

  return strengthsMap[style] || strengthsMap.multimodal;
};

/**
 * Get learning tips for each style
 */
const getStyleLearningTips = (style: string): string[] => {
  const tipsMap: { [key: string]: string[] } = {
    visual: [
      'Use flowcharts and diagrams',
      'Highlight key points in color',
      'Watch video demonstrations',
      'Create visual summaries',
    ],
    auditory: [
      'Join study groups',
      'Record and listen to notes',
      'Discuss topics with others',
      'Use verbal repetition',
    ],
    reading_writing: [
      'Take comprehensive notes',
      'Rewrite key concepts',
      'Create lists and outlines',
      'Read supplementary materials',
    ],
    kinesthetic: [
      'Practice immediately',
      'Use real-world examples',
      'Take frequent breaks',
      'Learn through case studies',
    ],
    multimodal: [
      'Combine different learning methods',
      'Use multimedia resources',
      'Vary your study approach',
      'Engage multiple senses',
    ],
  };

  return tipsMap[style] || tipsMap.multimodal;
};

/**
 * Get team learning styles summary
 */
export const getTeamLearningStyles = async (
  practiceId: string
): Promise<{
  members: Array<{
    member_id: string;
    primary_style: string;
    is_multimodal: boolean;
  }>;
  distribution: {
    visual: number;
    auditory: number;
    reading_writing: number;
    kinesthetic: number;
    multimodal: number;
  };
  completion_rate: number;
}> => {
  const { data, error } = await supabase
    .from('team_learning_styles_overview')
    .select('*')
    .eq('practice_id', practiceId);

  if (error) {
    console.error('Error fetching team learning styles:', error);
    throw error;
  }

  const members = data || [];
  const distribution = {
    visual: 0,
    auditory: 0,
    reading_writing: 0,
    kinesthetic: 0,
    multimodal: 0,
  };

  members.forEach((member) => {
    if (member.primary_style) {
      distribution[member.primary_style as keyof typeof distribution]++;
    }
  });

  const total = members.length;
  const completed = members.filter((m) => m.primary_style !== null).length;
  const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    members: members.map((m) => ({
      member_id: m.member_id,
      primary_style: m.primary_style,
      is_multimodal: m.is_multimodal,
    })),
    distribution,
    completion_rate,
  };
};

/**
 * Delete learning preference
 */
export const deleteLearningPreference = async (teamMemberId: string): Promise<void> => {
  const { error } = await supabase
    .from('learning_preferences')
    .delete()
    .eq('team_member_id', teamMemberId);

  if (error) {
    console.error('Error deleting learning preference:', error);
    throw error;
  }

  // Update practice_members
  await supabase
    .from('practice_members')
    .update({
      learning_style: null,
      vark_completed: false,
      vark_completed_at: null,
    })
    .eq('id', teamMemberId);
};

