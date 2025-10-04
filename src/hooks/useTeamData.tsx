import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export function useTeamData() {
  const { user } = useAuth();
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [hasTeamMembers, setHasTeamMembers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTeamMembers();
  }, [user]);

  const checkTeamMembers = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      // Get user's group_id
      const { data: userData } = await supabase
        .from('client_intake')
        .select('group_id')
        .eq('email', user.email)
        .maybeSingle();

      if (!userData?.group_id) {
        setLoading(false);
        return;
      }

      // Get all team members
      const { data: teamMembers } = await supabase
        .from('client_intake')
        .select('email')
        .eq('group_id', userData.group_id);

      const memberCount = teamMembers?.length || 0;
      setTeamMemberCount(memberCount);
      setHasTeamMembers(memberCount > 1);
    } catch (error) {
      console.error('Error checking team members:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    teamMemberCount,
    hasTeamMembers,
    loading,
    refresh: checkTeamMembers
  };
}
