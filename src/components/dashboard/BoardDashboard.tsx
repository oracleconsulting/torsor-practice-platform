import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Brain, TrendingUp, History, Settings, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BoardChat } from './BoardChat';
import { BoardMetrics } from './BoardMetrics';
import { BoardHistory } from './BoardHistory';
import { BoardCustomizer } from './BoardCustomizer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { parseJsonField } from '@/utils/supabaseHelpers';
import DynamicHeader from '@/components/layout/DynamicHeader';

interface BoardStatus {
  accepted: boolean;
  accepted_at: string | null;
  board_members: string[];
  tier: number;
  ready: boolean;
}

interface BoardDashboardProps {
  groupId: string;
  isAdmin?: boolean;
}

export const BoardDashboard: React.FC<BoardDashboardProps> = ({ 
  groupId, 
  isAdmin = false 
}) => {
  const [boardStatus, setBoardStatus] = useState<BoardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBoardStatus();
  }, [groupId]);

  const fetchBoardStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('client_config')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (error) throw error;

      // Safely parse board members from the Json field
      const boardMembers = parseJsonField<string[]>(data?.board || data?.recommended_board, []);
      const tier = (data as any).tier || 1; // Get tier from client_config
      
      setBoardStatus({
        accepted: (data as any).board_accepted || false,
        accepted_at: (data as any).board_accepted_at || null,
        board_members: boardMembers,
        tier: tier,
        ready: !!(data as any).pinecone_index_name
      });
    } catch (error) {
      console.error('Failed to fetch board status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <DynamicHeader />
        <div className="flex items-center justify-center h-64 pt-16 md:pt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  if (!boardStatus?.accepted) {
    return (
      <div className="min-h-screen bg-black">
        <DynamicHeader />
        <div className="pt-16 md:pt-20 p-8">
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-8 text-center">
            <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Board Not Activated</h3>
            <p className="text-gray-400">
              The board hasn't been accepted yet. Complete the assessment process to unlock your AI advisors.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Only admin can access board for now
  if (!isAdmin) {
    console.log('Board access denied for user:', user?.email, 'isAdmin:', isAdmin);
    return (
      <div className="min-h-screen bg-black">
        <DynamicHeader />
        <div className="pt-16 md:pt-20 p-8">
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-8 text-center">
            <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
            <p className="text-gray-400">
              The virtual boardroom is currently in beta testing. You'll be notified when it's ready for your use.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <DynamicHeader />
      <div className="pt-16 md:pt-20 space-y-6 p-6">
        {/* Board Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">
                  {boardStatus.board_members?.length || 0} Active Advisors
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">
                  AI Learning: Active
                </span>
              </div>
            </div>
            
            <div className="flex -space-x-2">
              {boardStatus.board_members?.map((member: string, i: number) => (
                <div
                  key={member}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-900"
                  style={{ zIndex: boardStatus.board_members.length - i }}
                >
                  {member.substring(0, 2)}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
            <TabsTrigger value="chat" className="data-[state=active]:bg-purple-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Board Meeting
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-purple-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <BoardChat 
              groupId={groupId}
              boardMembers={boardStatus.board_members || []}
              tier={boardStatus.tier || 1}
            />
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <BoardMetrics groupId={groupId} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <BoardHistory groupId={groupId} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <BoardCustomizer
              groupId={groupId}
              currentBoard={boardStatus.board_members || []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
