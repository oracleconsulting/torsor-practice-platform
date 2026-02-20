import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Skill, SkillAssessment } from '../lib/types';

interface SkillCategory {
  category: string;
  skills: Skill[];
  averageLevel: number;
  skillsCount: number;
  assessedCount: number;
  belowTargetCount: number;
}

export function useSkillsByCategory(practiceId: string | null) {
  const skillsQuery = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name, category, required_level, is_active')
        .eq('is_active', true)
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data as Skill[];
    },
  });

  const assessmentsQuery = useQuery({
    queryKey: ['all-assessments', practiceId],
    queryFn: async () => {
      if (!practiceId) return [];
      
      // Get all practice members first
      const { data: members } = await supabase
        .from('practice_members')
        .select('id')
        .eq('practice_id', practiceId);
      
      if (!members) return [];
      
      const memberIds = members.map(m => m.id);
      
      const { data, error } = await supabase
        .from('skill_assessments')
        .select('skill_id, current_level, member_id')
        .in('member_id', memberIds);
      
      if (error) throw error;
      return data as SkillAssessment[];
    },
    enabled: !!practiceId,
  });

  const categories: SkillCategory[] = [];
  
  if (skillsQuery.data && assessmentsQuery.data) {
    const skillsByCategory = skillsQuery.data.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);

    Object.entries(skillsByCategory).forEach(([category, skills]) => {
      // Get all assessments for skills in this category
      const categoryAssessments = assessmentsQuery.data.filter(a =>
        skills.some(s => s.id === a.skill_id)
      );

      // Calculate average level across all assessments in this category
      const totalLevel = categoryAssessments.reduce((sum, a) => sum + a.current_level, 0);
      const averageLevel = categoryAssessments.length > 0 ? totalLevel / categoryAssessments.length : 0;

      // Count assessed skills (skills with at least one assessment)
      const assessedSkillIds = new Set(categoryAssessments.map(a => a.skill_id));
      const assessedCount = assessedSkillIds.size;

      // Count skills below target (average level < required_level)
      const belowTargetCount = skills.filter(skill => {
        const skillAssessments = categoryAssessments.filter(a => a.skill_id === skill.id);
        if (skillAssessments.length === 0) return true; // Not assessed = below target
        const avgForSkill = skillAssessments.reduce((sum, a) => sum + a.current_level, 0) / skillAssessments.length;
        return avgForSkill < skill.required_level;
      }).length;

      categories.push({
        category,
        skills,
        averageLevel,
        skillsCount: skills.length,
        assessedCount,
        belowTargetCount,
      });
    });
  }

  return {
    categories,
    isLoading: skillsQuery.isLoading || assessmentsQuery.isLoading,
    error: skillsQuery.error || assessmentsQuery.error,
  };
}

