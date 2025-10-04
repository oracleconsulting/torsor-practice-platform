import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function DebugDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.email) return;

      try {
        // 1. Get client_intake data
        const { data: intakeData, error: intakeError } = await supabase
          .from('client_intake')
          .select('*')
          .eq('email', user.email)
          .single();

        console.log('Client Intake:', intakeData, 'Error:', intakeError);

        if (!intakeData?.group_id) {
          setData({ error: 'No intake data found for user' });
          setLoading(false);
          return;
        }

        const groupId = intakeData.group_id;

        // 2. Get client_intake_part2 data
        const { data: part2Data, error: part2Error } = await supabase
          .from('client_intake_part2')
          .select('*')
          .eq('group_id', groupId)
          .single();

        console.log('Part 2 Data:', part2Data, 'Error:', part2Error);

        // 3. Get client_config data
        const { data: configData, error: configError } = await supabase
          .from('client_config')
          .select('*')
          .eq('group_id', groupId)
          .single();

        console.log('Client Config:', configData, 'Error:', configError);

        // 4. Get board_conversations data
        const { data: boardConversations, error: boardError } = await supabase
          .from('board_conversations')
          .select('*')
          .eq('group_id', groupId);

        console.log('Board Conversations:', boardConversations, 'Error:', boardError);

        // 5. Get sprint_progress data
        const { data: sprintProgress, error: sprintError } = await supabase
          .from('sprint_progress')
          .select('*')
          .eq('group_id', groupId);

        console.log('Sprint Progress:', sprintProgress, 'Error:', sprintError);

        setData({
          user: {
            email: user.email,
            id: user.id
          },
          groupId,
          intake: intakeData,
          part2: part2Data,
          config: configData,
          boardConversations,
          sprintProgress
        });
      } catch (error) {
        console.error('Debug fetch error:', error);
        setData({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  if (loading) {
    return <div className="p-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4">🔍 Debug: Database Data</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-yellow-400">User Info:</h3>
          <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
            {JSON.stringify(data.user, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold text-yellow-400">Group ID:</h3>
          <p className="text-sm font-mono">{data.groupId || 'NOT FOUND'}</p>
        </div>

        <div>
          <h3 className="font-semibold text-yellow-400">Client Intake (Part 1):</h3>
          <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(data.intake, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold text-yellow-400">Client Intake Part 2:</h3>
          <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(data.part2, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold text-yellow-400">Client Config (Board & Roadmap):</h3>
          <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(data.config, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold text-yellow-400">Board Conversations:</h3>
          <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(data.boardConversations, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold text-yellow-400">Sprint Progress:</h3>
          <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(data.sprintProgress, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 