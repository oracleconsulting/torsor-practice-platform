import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Calendar, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { ConversationHistoryRow, safeJsonToRecord } from '@/types/supabase-extensions';

interface BoardHistoryProps {
  groupId: string;
}

export const BoardHistory: React.FC<BoardHistoryProps> = ({ groupId }) => {
  const [conversations, setConversations] = useState<ConversationHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [groupId]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('board_conversations')
        .select('*')
        .eq('group_id', groupId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Transform the data to ensure proper types
      const transformedData = (data || []).map(item => ({
        ...item,
        responses: safeJsonToRecord(item.responses)
      })) as ConversationHistoryRow[];

      setConversations(transformedData);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.synthesis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedBySessions = filteredConversations.reduce((acc, conv) => {
    if (!acc[conv.session_id]) {
      acc[conv.session_id] = [];
    }
    acc[conv.session_id].push(conv);
    return acc;
  }, {} as Record<string, ConversationHistoryRow[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-16 bg-gray-700 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-400">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session History */}
      {Object.keys(groupedBySessions).length === 0 ? (
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Board Sessions Yet</h3>
            <p className="text-gray-400">
              Start your first board meeting to see conversation history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBySessions).map(([sessionId, sessionConversations]) => {
            const isExpanded = selectedSession === sessionId;
            const firstConversation = sessionConversations[0];
            
            return (
              <motion.div key={sessionId} layout>
                <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-800/50 transition-colors"
                    onClick={() => setSelectedSession(isExpanded ? null : sessionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">
                          Board Session
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(firstConversation.timestamp).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {sessionConversations.length} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {Object.keys(firstConversation.responses || {}).length} advisors
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <CardContent className="pt-0">
                        <div className="space-y-6">
                          {sessionConversations.map((conversation, index) => (
                            <div key={conversation.id} className="border-l-2 border-purple-600 pl-4">
                              <div className="mb-3">
                                <h4 className="text-white font-medium mb-2">
                                  Question {index + 1}
                                </h4>
                                <p className="text-gray-300 bg-gray-800/50 p-3 rounded-lg">
                                  {conversation.question}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <h5 className="text-purple-400 font-medium mb-2">Board Synthesis:</h5>
                                <p className="text-gray-300 bg-purple-900/20 p-3 rounded-lg">
                                  {conversation.synthesis}
                                </p>
                              </div>
                              
                              {conversation.responses && Object.keys(conversation.responses).length > 0 && (
                                <div>
                                  <h5 className="text-gray-400 font-medium mb-2">Individual Responses:</h5>
                                  <div className="grid gap-3">
                                    {Object.entries(conversation.responses).map(([advisor, response]: [string, any]) => (
                                      <div key={advisor} className="bg-gray-800/30 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                            {advisor.substring(0, 2)}
                                          </div>
                                          <span className="text-white font-medium">{advisor}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">
                                          {typeof response === 'object' ? response.content || response.response : response}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
