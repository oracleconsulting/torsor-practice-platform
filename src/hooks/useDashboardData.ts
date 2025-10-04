import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  metrics: {
    revenue: number;
    growth: number;
    health: number;
    energy: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    urgency: 'low' | 'medium' | 'high';
    time_estimate: string;
    completed: boolean;
  }>;
  boardMembers: Array<{
    id: string;
    name: string;
    role: string;
    status: 'active' | 'thinking' | 'offline';
    current_task: string;
  }>;
  activity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user_name: string;
    user_avatar: string;
  }>;
  userOnboarded: boolean;
  clientConfig?: any;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    metrics: { revenue: 0, growth: 0, health: 85, energy: 72 },
    tasks: [],
    boardMembers: [],
    activity: [],
    userOnboarded: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get the user's group_id from client_intake
        const { data: intakeData, error: intakeError } = await supabase
          .from('client_intake')
          .select('group_id')
          .eq('email', user.email)
          .single();

        if (intakeError || !intakeData?.group_id) {
          console.log('No intake data found for user');
          setData(prev => ({ ...prev, userOnboarded: false }));
          setLoading(false);
          return;
        }

        const groupId = intakeData.group_id;

        // Fetch client_config for board and roadmap data
        const { data: configData, error: configError } = await supabase
          .from('client_config')
          .select('*')
          .eq('group_id', groupId)
          .single();

        if (configError) {
          console.error('Error fetching client config:', configError);
        }

        // Transform board data into board members for the dashboard
        let boardMembers = [];
        if (configData?.board) {
          boardMembers = configData.board.map((role: string, index: number) => ({
            id: `board-${index}`,
            name: role,
            role: role,
            status: 'active' as const,
            current_task: 'Analyzing business metrics'
          }));
        }

        // Extract tasks from roadmap if available
        let tasks = [];
        if (configData?.roadmap) {
          // The roadmap is a 12-week structure, extract week 1 tasks
          const week1 = configData.roadmap.find((week: any) => week.week === 1);
          if (week1?.priorities) {
            tasks = week1.priorities.map((task: any, index: number) => ({
              id: `task-${index}`,
              title: task.task || task,
              urgency: task.urgency || 'medium',
              time_estimate: task.time_estimate || '1-2 hours',
              completed: false
            }));
          }
        }

        // Calculate metrics from config data
        const metrics = {
          revenue: 0, // You might want to pull this from another source
          growth: 0,  // Calculate based on historical data if available
          health: configData?.scores?.overall_health || 85,
          energy: configData?.founder_state?.energy_level || 72
        };

        // Fetch community activity
        const { data: activityData } = await supabase
          .from('community_activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        const activity = activityData?.map(item => ({
          id: item.id,
          type: item.type,
          message: item.message,
          timestamp: item.created_at,
          user_name: item.user_name || 'Oracle User',
          user_avatar: item.user_avatar || ''
        })) || [];

        setData({
          metrics,
          tasks,
          boardMembers,
          activity,
          userOnboarded: true,
          clientConfig: configData
        });

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_config'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { data, loading, error, refetch: () => {} };
}