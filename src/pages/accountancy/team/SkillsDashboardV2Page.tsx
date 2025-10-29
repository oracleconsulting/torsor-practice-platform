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

      // **NEW: Load assessments from invitations table (single source of truth)**
      const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('email, assessment_data, status');

      if (invitationsError) {
        console.error('Error loading invitations:', invitationsError);
      }

      console.log('[SkillsDashboardV2] Loaded invitations:', invitations?.length || 0);

      // Transform JSONB assessment_data into flat assessment records
      const allAssessments: any[] = [];
      
      (invitations || []).forEach(invitation => {
        if (invitation.status !== 'accepted' || !invitation.assessment_data) return;
        
        // Find member by email (case-insensitive)
        const member = (members || []).find(m => m.email.toLowerCase() === invitation.email.toLowerCase());
        if (!member) {
          console.warn('[SkillsDashboardV2] No member found for invitation:', invitation.email);
          return;
        }
        
        // Extract assessments from JSONB (using snake_case field names)
        (invitation.assessment_data as any[]).forEach(skill => {
          allAssessments.push({
            team_member_id: member.id, // Map email → member.id
            skill_id: skill.skill_id, // snake_case
            current_level: skill.current_level || 0, // snake_case
            interest_level: skill.interest_level || 3, // snake_case
            assessed_at: invitation.accepted_at || new Date().toISOString()
          });
        });
      });
      
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

