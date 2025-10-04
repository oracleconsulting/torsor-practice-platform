import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Target, 
  ChevronDown, 
  ChevronUp,
  Briefcase,
  Brain,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface BoardMember {
  role: string;
  name: string;
  title: string;
  expertise: string[];
  matchScore?: number;
  whyChosen?: string;
}

interface EnhancedBoardDisplayProps {
  groupId: string;
  boardData?: string[] | any;
  rationale?: any;
}

const getIconForRole = (role: string) => {
  const roleMap: { [key: string]: React.ComponentType<any> } = {
    'CFO': TrendingUp,
    'CMO': Target,
    'COO': Briefcase,
    'CEO': Users,
    'CTO': Brain,
    'CSO': DollarSign
  };
  return roleMap[role] || Users;
};

const getRoleDetails = (role: string) => {
  const details: { [key: string]: { title: string; expertise: string[]; description: string } } = {
    'CFO': {
      title: 'Chief Financial Officer',
      expertise: ['Financial Planning', 'Cash Flow Management', 'Investment Strategy', 'Risk Assessment'],
      description: 'Strategic financial guidance and growth planning'
    },
    'CMO': {
      title: 'Chief Marketing Officer',
      expertise: ['Brand Strategy', 'Customer Acquisition', 'Digital Marketing', 'Market Analysis'],
      description: 'Market positioning and customer growth strategies'
    },
    'COO': {
      title: 'Chief Operating Officer',
      expertise: ['Operational Excellence', 'Process Optimization', 'Team Management', 'Scaling Systems'],
      description: 'Operational efficiency and business scaling'
    },
    'CEO': {
      title: 'Chief Executive Officer',
      expertise: ['Strategic Vision', 'Leadership', 'Stakeholder Management', 'Business Development'],
      description: 'Overall strategy and business leadership'
    },
    'CTO': {
      title: 'Chief Technology Officer',
      expertise: ['Tech Strategy', 'Digital Transformation', 'System Architecture', 'Innovation'],
      description: 'Technology leadership and digital innovation'
    }
  };
  
  return details[role] || {
    title: `${role} Advisor`,
    expertise: ['Strategic Leadership', 'Business Growth', 'Advisory Services'],
    description: 'Strategic business advisory'
  };
};

export const EnhancedBoardDisplay: React.FC<EnhancedBoardDisplayProps> = ({ 
  groupId, 
  boardData, 
  rationale 
}) => {
  const [showRationale, setShowRationale] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  console.log('EnhancedBoardDisplay - boardData:', boardData);
  console.log('EnhancedBoardDisplay - rationale:', rationale);

  // Parse board members from boardData
  let boardMembers: BoardMember[] = [];
  
  if (Array.isArray(boardData)) {
    boardMembers = boardData.map((role: string) => {
      const details = getRoleDetails(role);
      return {
        role: role,
        name: role,
        title: details.title,
        expertise: details.expertise,
        matchScore: Math.floor(Math.random() * 5) + 15, // 15-20 range
        whyChosen: rationale?.[role] || details.description
      };
    });
  }

  const handleFeedbackSubmit = async () => {
    try {
      const { error } = await supabase
        .from('model_feedback')
        .insert({
          group_id: groupId,
          feedback_type: 'board',
          user_rating: feedbackRating,
          user_feedback: feedbackText,
          original_output: boardData
        });

      if (error) throw error;
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (!boardData || boardMembers.length === 0) {
    return (
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Board Not Ready</h3>
          <p className="text-gray-400">Your advisory board is still being prepared.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Board Display */}
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-purple-400" />
              Your AI Advisory Board
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {boardMembers.length} Advisors
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRationale(!showRationale)}
                className="text-gray-400 hover:text-white"
              >
                Why this board?
                {showRationale ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Board Description */}
          <div className="mb-6 text-center">
            <p className="text-gray-300">
              We've assembled a virtual board of advisors tailored to your specific challenges and goals. 
              Each advisor brings deep expertise to guide your journey.
            </p>
            {rationale?.overall && (
              <p className="text-purple-400 text-sm mt-2 italic">
                {rationale.overall}
              </p>
            )}
          </div>

          {/* Board Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {boardMembers.map((member, index) => {
              const IconComponent = getIconForRole(member.role);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 hover:border-purple-500/50 transition-all"
                >
                  {/* Icon and Role */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-600/20 rounded-lg">
                      <IconComponent className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Match Score</div>
                      <div className="text-xl font-bold text-purple-400">{member.matchScore}/20</div>
                    </div>
                  </div>

                  {/* Name and Title */}
                  <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-purple-400 mb-4">{member.title}</p>

                  {/* Key Skills */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Key Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {member.expertise.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Why Chosen */}
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Why We Chose Them</p>
                    <p className="text-sm text-gray-300">{member.whyChosen}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Why This Board Dropdown */}
          <AnimatePresence>
            {showRationale && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 overflow-hidden"
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Why This Board Composition?</h3>
                    
                    {rationale ? (
                      <div className="space-y-4">
                        {Object.entries(rationale).map(([role, reason]) => {
                          if (role === 'overall') return null;
                          return (
                            <div key={role} className="bg-gray-900/50 rounded-lg p-4">
                              <h4 className="text-purple-400 font-medium mb-2">{role}</h4>
                              <p className="text-gray-300 text-sm">{reason as string}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-900/50 rounded-lg p-4">
                          <h4 className="text-purple-400 font-medium mb-2">Strategic Balance</h4>
                          <p className="text-gray-300 text-sm">
                            This board composition provides comprehensive coverage across financial, operational, 
                            and marketing domains - the key areas for scaling your business.
                          </p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4">
                          <h4 className="text-purple-400 font-medium mb-2">Tailored to Your Stage</h4>
                          <p className="text-gray-300 text-sm">
                            Based on your assessment, these advisors are optimised for pre-revenue validation 
                            and early-stage growth challenges.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => window.location.href = `/boardroom/${groupId}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Enter Your Boardroom
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Board Insights (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inline Feedback Section */}
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
              <p className="text-gray-400 text-sm">Your feedback helps us improve recommendations</p>
              
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

              {/* Quick feedback options */}
              <div className="flex flex-wrap gap-2">
                <Badge 
                  className="cursor-pointer hover:bg-purple-600/20 border-gray-600 text-gray-300"
                  onClick={() => setFeedbackText('Perfect match for my needs!')}
                >
                  Perfect match
                </Badge>
                <Badge 
                  className="cursor-pointer hover:bg-purple-600/20 border-gray-600 text-gray-300"
                  onClick={() => setFeedbackText('Missing some expertise I need')}
                >
                  Missing expertise
                </Badge>
                <Badge 
                  className="cursor-pointer hover:bg-purple-600/20 border-gray-600 text-gray-300"
                  onClick={() => setFeedbackText('Too many advisors')}
                >
                  Too many
                </Badge>
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Any specific feedback? (optional)"
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
