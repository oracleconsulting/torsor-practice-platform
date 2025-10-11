/**
 * MentoringHubPage - Page wrapper for MentoringHub
 * PROMPT 4 Implementation
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MentoringHub from '@/components/accountancy/team/MentoringHub';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import type { TeamMemberForMatching } from '@/services/mentoring/matchingAlgorithm';

const MentoringHubPage: React.FC = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMemberForMatching[]>([]);
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
      // Load team members with skills and learning preferences
      const { data: members, error: membersError } = await supabase
        .from('practice_members')
        .select(`
          *,
          user:auth.users(email)
        `);

      if (membersError) {
        console.error('Error loading members:', membersError);
        setTeamMembers([]);
        return;
      }

      // Load skills for each member
      const { data: skillsData } = await supabase
        .from('team_member_skills')
        .select(`
          *,
          skill:skills(*)
        `);

      // Load learning preferences
      const { data: learningPrefs } = await supabase
        .from('learning_preferences')
        .select('*');

      // Transform data to match interface
      const transformedMembers: TeamMemberForMatching[] = (members || []).map(member => {
        const memberSkills = (skillsData || [])
          .filter((s: any) => s.member_id === member.id)
          .map((s: any) => ({
            skillId: s.skill_id,
            skillName: s.skill?.name || 'Unknown',
            category: s.skill?.category || 'General',
            currentLevel: s.current_level,
            targetLevel: s.target_level,
            interestLevel: s.interest_level
          }));

        const learningPref = learningPrefs?.find((lp: any) => lp.user_id === member.user_id);

        return {
          id: member.id,
          name: member.name,
          email: member.user?.email || '',
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to access the Mentoring Hub</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <MentoringHub
          teamMembers={teamMembers}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
};

export default MentoringHubPage;

