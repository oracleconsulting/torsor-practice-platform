import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface BoardDisplayProps {
  groupId: string;
  boardData?: any;
}

const getIconForRole = (role: string) => {
  const roleMap: { [key: string]: React.ComponentType<any> } = {
    'CFO': TrendingUp,
    'CMO': Users,
    'COO': Target,
    'CEO': Users,
    'CTO': Target
  };
  return roleMap[role] || Users;
};

export const BoardDisplay: React.FC<BoardDisplayProps> = ({ groupId, boardData }) => {
  // ALL HOOKS AT TOP
  const [loading, setLoading] = useState(!boardData);
  const [board, setBoard] = useState<any>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // useEffect at top level
  useEffect(() => {
    if (boardData) {
      setBoard(boardData);
      setLoading(false);
    } else {
      fetchBoardData();
    }
  }, [boardData, groupId]);

  const fetchBoardData = async () => {
    try {
      const { data, error } = await supabase
        .from('client_config')
        .select('recommended_board, board, board_composition, rationale')
        .eq('group_id', groupId)
        .maybeSingle();

      if (error) throw error;
      
      const boardResult = data?.board_composition || data?.board || data?.recommended_board;
      setBoard(boardResult);
    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      const { error } = await supabase
        .from('model_feedback')
        .insert({
          group_id: groupId,
          feedback_type: 'board',
          user_rating: feedbackRating,
          user_feedback: feedbackText,
          original_output: board
        });

      if (error) throw error;
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (loading) {
    return (
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!board) {
    return (
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Board Not Ready</h3>
          <p className="text-gray-400">Your advisory board is still being prepared. Check back soon!</p>
        </CardContent>
      </Card>
    );
  }

  // Handle different board data structures
  let boardMembers = [];
  if (Array.isArray(board)) {
    boardMembers = board;
  } else if (board.board_composition && Array.isArray(board.board_composition)) {
    boardMembers = board.board_composition;
  } else if (board.members && Array.isArray(board.members)) {
    boardMembers = board.members;
  }

  // Transform board members to ensure proper structure
  const transformedMembers = boardMembers.map((member: any, index: number) => {
    if (typeof member === 'string') {
      return {
        name: member,
        title: `${member} Advisor`,
        expertise: ['Strategic Leadership'],
        role: member,
        icon: member.substring(0, 2).toUpperCase()
      };
    }
    
    return {
      name: member.name || member.role || `Advisor ${index + 1}`,
      title: member.title || `${member.role || 'Strategic'} Advisor`,
      expertise: member.expertise || member.skills || ['Strategic Leadership'],
      role: member.role || 'Advisor',
      icon: member.icon || (member.name || member.role || 'AD').substring(0, 2).toUpperCase()
    };
  });

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            Your Advisory Board
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {transformedMembers.map((member: any, index: number) => {
              const IconComponent = getIconForRole(member.role);
              return (
                <div key={index} className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                    {member.icon}
                  </div>
                  <h4 className="font-semibold text-white">{member.name}</h4>
                  <p className="text-sm text-gray-400">{member.title}</p>
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {member.expertise.slice(0, 2).map((skill: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs border-gray-600 text-gray-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat with Board (Coming Soon)
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Insights (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inline Board Feedback */}
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardContent className="p-6">
          {feedbackSubmitted ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Thank you for your feedback!</h3>
              <p className="text-gray-400">Your input helps us improve board recommendations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">How well does this board match your needs?</h3>
              
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= feedbackRating ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
                {feedbackRating > 0 && (
                  <span className="text-gray-400 ml-2">({feedbackRating}/5)</span>
                )}
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us more about how this board could better serve your needs..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 resize-none"
                rows={3}
              />

              <Button 
                onClick={handleFeedbackSubmit}
                disabled={feedbackRating === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                Submit Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
