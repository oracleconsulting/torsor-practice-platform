import React, { useState, useEffect } from 'react';
import SkillsDashboardV2 from '@/components/accountancy/team/SkillsDashboardV2';
import PendingAssessmentBanner from '@/components/accountancy/team/PendingAssessmentBanner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Wrapper page that loads data and passes to SkillsDashboardV2
const SkillsDashboardV2Page: React.FC = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [skillCategories, setSkillCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      console.log('Loading real data from Supabase...');
      
      // Load skills (they may not have categories in the schema)
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('name');
      
      if (skillsError) {
        console.error('Error loading skills:', skillsError);
      }

      // Group skills by category manually
      const categories = skillsData ? [{
        id: 'all',
        name: 'All Skills',
        description: 'Advisory skills',
        skills: skillsData
      }] : [];

      const categoriesError = skillsError;

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        // Set empty states instead of mock data
        setSkillCategories([]);
        setTeamMembers([]);
        return;
      }

      // Load team members with their skills from skill_assessments table
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select(`
          id,
          name,
          email,
          role,
          vark_assessment_completed,
          vark_result
        `);
      
      if (membersError) {
        console.error('Error loading members:', membersError);
      }

      /**
       * DATA SOURCE: skill_assessments table (SINGLE SOURCE OF TRUTH)
       * Load all assessments for members in this practice
       */
      const { data: assessments, error: assessmentsError } = await supabase
        .from('skill_assessments')
        .select(`
          id,
          team_member_id,
          skill_id,
          current_level,
          interest_level,
          assessed_at,
          practice_members!inner(
            id,
            name,
            email,
            practice_id
          )
        `)
        .eq('practice_members.practice_id', (members?.[0] as any)?.practice_id);

      if (assessmentsError) {
        console.error('Error loading assessments:', assessmentsError);
      }

      console.log('[SkillsDashboardV2] Loaded assessments:', assessments?.length || 0);

      // Already in flat structure - no JSONB transformation needed
      const allAssessments = assessments || [];
      
      const assessments = allAssessments;
      const assessmentsError = invitationsError;

      if (assessmentsError) {
        console.error('Error loading assessments:', assessmentsError);
      }

      console.log('Loaded categories:', categories);
      console.log('Loaded members:', members);
      console.log('Loaded assessments:', assessments);
      console.log(`🔍 Assessment count: ${assessments?.length || 0} (should be 1776 for 16 members)`);
      
      if (assessments && assessments.length === 1000) {
        console.error('⚠️ WARNING: Exactly 1000 assessments loaded - limit is still active!');
      }

      // Transform member skills to match expected format
      const transformedMembers = (members || []).map(member => {
        // Find all assessments for this member
        const memberAssessments = (assessments || []).filter(
          (a: any) => a.team_member_id === member.id
        );

        const skills = memberAssessments.map((a: any) => ({
          skillId: a.skill_id,
          currentLevel: a.current_level,
          interestLevel: a.interest_level || 3,
          targetLevel: Math.min(a.current_level + 1, 5), // Default target is one level up
          lastAssessed: a.assessed_at ? new Date(a.assessed_at) : null
        }));

        const avgLevel = skills.length > 0
          ? skills.reduce((sum: number, s: any) => sum + s.currentLevel, 0) / skills.length
          : 0;

        const totalSkillsCount = categories[0]?.skills?.length || 0;
        const skills_assessment_progress = totalSkillsCount > 0 
          ? (skills.length / totalSkillsCount) * 100 
          : 0;

        // Extract learning style from VARK result
        let learningStyle: 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic' | 'multimodal' | undefined;
        if (member.vark_result) {
          const varkData = member.vark_result as any;
          // Determine dominant style from percentages
          const percentages = {
            visual: varkData.visual || 0,
            auditory: varkData.auditory || 0,
            reading: varkData.reading || 0,
            kinesthetic: varkData.kinesthetic || 0
          };
          
          // Find max percentage
          const max = Math.max(...Object.values(percentages));
          const dominantStyles = Object.entries(percentages)
            .filter(([_, val]) => val === max)
            .map(([key]) => key);
          
          // Map to learningStyle format
          if (dominantStyles.length >= 2) {
            learningStyle = 'multimodal';
          } else if (dominantStyles[0] === 'visual') {
            learningStyle = 'visual';
          } else if (dominantStyles[0] === 'auditory') {
            learningStyle = 'auditory';
          } else if (dominantStyles[0] === 'reading') {
            learningStyle = 'reading_writing';
          } else if (dominantStyles[0] === 'kinesthetic') {
            learningStyle = 'kinesthetic';
          }
        }

        return {
          ...member,
          department: member.department || 'Advisory', // Default department
          role: member.role || 'Team Member', // Ensure role exists
          skills,
          overallScore: Math.round(avgLevel * 10) / 10,
          vark_assessment_completed: member.vark_assessment_completed || false,
          vark_result: member.vark_result,
          skills_assessment_progress,
          learningStyle // Add learningStyle for Skills Matrix badges
        };
      });

      setSkillCategories(categories || []);
      setTeamMembers(transformedMembers);
      
      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty states instead of mock data
      setSkillCategories([]);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white font-medium">Loading Skills Dashboard...</p>
        </div>
      </div>
    );
  }

  // Get current user's data for banner
  const currentMember = teamMembers.find(m => m.email === user?.email);

  return (
    <div className="space-y-4">
      {/* Assessment Notification Banners */}
      <div className="px-6 pt-6">
        <PendingAssessmentBanner memberData={currentMember} />
      </div>
      
      {/* Main Dashboard */}
      <SkillsDashboardV2 
        teamMembers={teamMembers}
        skillCategories={skillCategories}
      />
    </div>
  );
};

export default SkillsDashboardV2Page;

