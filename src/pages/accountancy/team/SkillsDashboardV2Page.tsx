import React, { useState, useEffect } from 'react';
import SkillsDashboardV2 from '@/components/accountancy/team/SkillsDashboardV2';
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
        // Fall back to mock data
        const mockSkillCategories = getMockSkillCategories();
        const mockTeamMembers = getMockTeamMembers();
        setSkillCategories(mockSkillCategories);
        setTeamMembers(mockTeamMembers);
        return;
      }

      // Load team members with their skills from skill_assessments table
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select(`
          id,
          name,
          email,
          role
        `);
      
      if (membersError) {
        console.error('Error loading members:', membersError);
      }

      // Load skill assessments separately
      const { data: assessments, error: assessmentsError } = await supabase
        .from('skill_assessments')
        .select(`
          team_member_id,
          skill_id,
          current_level,
          interest_level,
          assessed_at
        `);

      if (assessmentsError) {
        console.error('Error loading assessments:', assessmentsError);
      }

      console.log('Loaded categories:', categories);
      console.log('Loaded members:', members);
      console.log('Loaded assessments:', assessments);

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

        return {
          ...member,
          department: member.department || 'Advisory', // Default department
          role: member.role || 'Team Member', // Ensure role exists
          skills,
          overallScore: Math.round(avgLevel * 10) / 10
        };
      });

      setSkillCategories(categories || []);
      setTeamMembers(transformedMembers);
      
      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      // Fall back to mock data on any error
      const mockSkillCategories = getMockSkillCategories();
      const mockTeamMembers = getMockTeamMembers();
      setSkillCategories(mockSkillCategories);
      setTeamMembers(mockTeamMembers);
    } finally {
      setLoading(false);
    }
  };

  const getMockSkillCategories = () => {
    return [
      {
        id: '1',
        name: 'Financial Planning & Analysis',
        description: 'Strategic financial planning and forecasting',
        skills: [
          { id: '1-1', name: 'Cash Flow Forecasting', description: '13-week cash flow', requiredLevel: 4 },
          { id: '1-2', name: 'Scenario Planning', description: 'Multiple scenario modeling', requiredLevel: 3 },
          { id: '1-3', name: 'Budget vs Actual', description: 'Variance analysis', requiredLevel: 3 },
          { id: '1-4', name: 'KPI Design', description: 'Performance indicators', requiredLevel: 4 },
        ]
      },
      {
        id: '2',
        name: 'Business Valuation',
        description: 'Company and asset valuation',
        skills: [
          { id: '2-1', name: 'DCF Modeling', description: 'Discounted cash flow', requiredLevel: 4 },
          { id: '2-2', name: 'Comparable Analysis', description: 'Market comparables', requiredLevel: 3 },
          { id: '2-3', name: 'Exit Planning', description: 'Business exit strategies', requiredLevel: 4 },
        ]
      },
      {
        id: '3',
        name: 'Strategic Advisory',
        description: 'Strategic planning and execution',
        skills: [
          { id: '3-1', name: 'Business Model Canvas', description: 'Strategy frameworks', requiredLevel: 3 },
          { id: '3-2', name: 'Market Analysis', description: 'Competitive analysis', requiredLevel: 3 },
          { id: '3-3', name: 'Growth Strategy', description: 'Scaling businesses', requiredLevel: 4 },
        ]
      },
      {
        id: '4',
        name: 'Risk Management',
        description: 'Risk assessment and mitigation',
        skills: [
          { id: '4-1', name: 'Risk Assessment', description: 'Identify and assess risks', requiredLevel: 3 },
          { id: '4-2', name: 'Controls Design', description: 'Internal controls', requiredLevel: 3 },
          { id: '4-3', name: 'Scenario Testing', description: 'Stress testing', requiredLevel: 4 },
        ]
      },
    ];
  };

  const getMockTeamMembers = () => {
    return [
      {
        id: 'tm-1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        role: 'Senior Advisor',
        department: 'Advisory',
        skills: [
          { skillId: '1-1', currentLevel: 5, interestLevel: 5, targetLevel: 5, lastAssessed: new Date() },
          { skillId: '1-2', currentLevel: 4, interestLevel: 4, targetLevel: 5, lastAssessed: new Date() },
          { skillId: '2-1', currentLevel: 4, interestLevel: 5, targetLevel: 5, lastAssessed: new Date() },
          { skillId: '3-1', currentLevel: 3, interestLevel: 4, targetLevel: 4, lastAssessed: new Date() },
        ],
        overallScore: 4.0
      },
      {
        id: 'tm-2',
        name: 'Michael Chen',
        email: 'michael@example.com',
        role: 'Advisory Consultant',
        department: 'Advisory',
        skills: [
          { skillId: '1-1', currentLevel: 3, interestLevel: 5, targetLevel: 4, lastAssessed: new Date() },
          { skillId: '1-3', currentLevel: 4, interestLevel: 4, targetLevel: 4, lastAssessed: new Date() },
          { skillId: '2-2', currentLevel: 3, interestLevel: 4, targetLevel: 4, lastAssessed: new Date() },
          { skillId: '4-1', currentLevel: 4, interestLevel: 3, targetLevel: 4, lastAssessed: new Date() },
        ],
        overallScore: 3.5
      },
      {
        id: 'tm-3',
        name: 'Emma Davis',
        email: 'emma@example.com',
        role: 'Junior Advisor',
        department: 'Advisory',
        skills: [
          { skillId: '1-1', currentLevel: 2, interestLevel: 5, targetLevel: 4, lastAssessed: new Date() },
          { skillId: '1-4', currentLevel: 2, interestLevel: 4, targetLevel: 3, lastAssessed: new Date() },
          { skillId: '3-2', currentLevel: 3, interestLevel: 5, targetLevel: 4, lastAssessed: new Date() },
        ],
        overallScore: 2.3
      },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading Skills Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SkillsDashboardV2 
      teamMembers={teamMembers}
      skillCategories={skillCategories}
    />
  );
};

export default SkillsDashboardV2Page;

