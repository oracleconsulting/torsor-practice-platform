/**
 * MentoringHubPage - Page wrapper for MentoringHub
 * PROMPT 4 Implementation
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MentoringHub from '@/components/accountancy/team/MentoringHub';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { TeamMemberForMatching } from '@/services/mentoring/matchingAlgorithm';

const MentoringHubPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMemberForMatching[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [user]);

  const loadTeamData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First, get current user's practice_member id
      const { data: currentMember } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (currentMember) {
        setCurrentMemberId(currentMember.id);
        console.log('[MentoringHubPage] Current member ID:', currentMember.id);
      }

      // Load team members - simple query without auth.users join
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select('*');

      if (membersError) {
        console.error('Error loading members:', membersError);
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Load skills assessments instead of team_member_skills
      const { data: skillsData } = await supabase
        .from('skill_assessments')
        .select('*');

      // Load skills reference
      const { data: skillsRef } = await supabase
        .from('skills')
        .select('*');

      // Load learning preferences
      const { data: learningPrefs } = await supabase
        .from('learning_preferences')
        .select('*');

      // Transform data to match interface
      const transformedMembers: TeamMemberForMatching[] = (members || []).map(member => {
        const memberSkills = (skillsData || [])
          .filter((s: any) => s.team_member_id === member.id)
          .map((s: any) => {
            const skillInfo = skillsRef?.find((sr: any) => sr.id === s.skill_id);
            return {
              skillId: s.skill_id,
              skillName: skillInfo?.name || 'Unknown',
              category: skillInfo?.category || 'General',
              currentLevel: s.current_level,
              targetLevel: Math.min(s.current_level + 1, 5),
              interestLevel: s.interest_level || 3
            };
          });

        const learningPref = learningPrefs?.find((lp: any) => lp.user_id === member.user_id);

        return {
          id: member.id,
          name: member.name,
          email: member.email || '',
          role: member.role || 'Team Member',
          department: member.department || 'General',
          skills: memberSkills,
          learningStyle: learningPref?.primary_style,
          availability: [],
          currentMentees: 0,
          maxMentees: 3
        };
      });

      setTeamMembers(transformedMembers);
    } catch (error) {
      console.error('Error loading team data:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading mentoring data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !currentMemberId) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {!user ? 'Please log in to access the Mentoring Hub' : 'Loading your profile...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/team-member/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <MentoringHub
          teamMembers={teamMembers}
          currentUserId={currentMemberId}
        />
      </div>
    </div>
  );
};

export default MentoringHubPage;

