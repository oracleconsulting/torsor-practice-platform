import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Brain, Target, Shield, Zap, Heart, TrendingUp,
  MessageSquare, ChevronDown, ChevronUp, Sparkles, 
  ArrowRight, AlertCircle, Star, DollarSign
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

// Board member role descriptions and icons
const roleDescriptions: Record<string, { icon: React.ComponentType<any>; description: string; color: string; fullName: string }> = {
  // Existing full names
  'Strategic Visionary': {
    icon: Brain,
    description: 'Sees the big picture and guides long-term strategy',
    color: 'purple',
    fullName: 'Strategic Visionary'
  },
  'Revenue Accelerator': {
    icon: TrendingUp,
    description: 'Focuses on growth strategies and revenue optimization',
    color: 'green',
    fullName: 'Revenue Accelerator'
  },
  'Operations Expert': {
    icon: Shield,
    description: 'Streamlines processes and improves efficiency',
    color: 'blue',
    fullName: 'Operations Expert'
  },
  'People & Culture Champion': {
    icon: Heart,
    description: 'Builds strong teams and positive culture',
    color: 'pink',
    fullName: 'People & Culture Champion'
  },
  'Innovation Catalyst': {
    icon: Zap,
    description: 'Drives innovation and technological advancement',
    color: 'yellow',
    fullName: 'Innovation Catalyst'
  },
  // Add acronym mappings
  'CEO': {
    icon: Brain,
    description: 'Chief Executive Officer - Overall strategy and vision',
    color: 'purple',
    fullName: 'Chief Executive Officer'
  },
  'CMO': {
    icon: TrendingUp,
    description: 'Chief Marketing Officer - Growth and customer acquisition',
    color: 'green',
    fullName: 'Chief Marketing Officer'
  },
  'CGO': {
    icon: Zap,
    description: 'Chief Growth Officer - Revenue and expansion strategies',
    color: 'yellow',
    fullName: 'Chief Growth Officer'
  },
  'CCO': {
    icon: Shield,
    description: 'Chief Customer Officer - Customer success and retention',
    color: 'blue',
    fullName: 'Chief Customer Officer'
  },
  'CFO': {
    icon: DollarSign,
    description: 'Chief Financial Officer - Financial strategy and metrics',
    color: 'emerald',
    fullName: 'Chief Financial Officer'
  },
  'COO': {
    icon: Users,
    description: 'Chief Operating Officer - Operations and efficiency',
    color: 'orange',
    fullName: 'Chief Operating Officer'
  }
};

interface AIBoardPageProps {
  displayData: any;
  loading: boolean;
  error: string | null;
  user: any;
  profile: any;
  isAdminViewing: boolean;
  assessmentProgress: any;
  weekProgress: Record<number, any>;
  toggleTask: (weekNum: number, taskIdx: number) => void;
  updateWeekNotes: (weekNum: number, field: 'notes' | 'blockers' | 'wins', value: string) => void;
  setWeekProgress: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  userContext: any;
  navigate: any;
  setActiveSection: (section: string) => void;
  activeSection: string;
  theme: any;
  userEnergy: number;
  businessHealth: number;
  getGreeting: () => string;
  renderValue: (value: any) => React.ReactNode;
}

export const AIBoardPage: React.FC<AIBoardPageProps> = ({
  displayData,
  loading,
  error,
  navigate,
  setActiveSection
}) => {
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const [showRationale, setShowRationale] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Error loading board data</p>
        </div>
      </div>
    );
  }

  // Board data comes from client_config via useOracleData
  const board = Array.isArray(displayData?.board) ? displayData.board : [];
  const boardGenerated = displayData?.boardGenerated || false;
  const boardRationale = displayData?.boardRationale || {};
  const boardScores = displayData?.boardScores || {};
  const boardComposition = displayData?.boardComposition || '';
  
  console.log('AIBoardPage - Debug data structure:', {
    board,
    boardGenerated,
    boardRationale,
    boardScores,
    boardComposition,
    dataKeys: Object.keys(displayData || {})
  });

  console.log('AIBoardPage - Extracted data:', {
    board,
    boardLength: board?.length || 0,
    boardRationale,
    boardScores,
    boardComposition,
    boardGenerated
  });

  if (!boardGenerated || !board.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-lg w-full p-8 text-center">
          <Users className="w-16 h-16 text-pink-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Meet Your AI Board</h2>
          <p className="text-gray-600 mb-6">
            Complete your assessment to unlock your personalised AI advisory board. 
            Get expert guidance, feedback, and support tailored to your business.
          </p>
          <Button 
            onClick={() => navigate?.('/assessment/part2')}
            className="bg-gradient-to-r from-pink-500 to-purple-500"
          >
            Complete Assessment
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Your AI Advisory Board</h1>
        <p className="text-white/80 text-lg">
          {board.length} expert advisors selected specifically for your business challenges
        </p>
      </div>

      {/* Board Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Board Composition</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRationale(!showRationale)}
          >
            {showRationale ? 'Hide' : 'Show'} Selection Rationale
            {showRationale ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        {boardComposition && (
          <p className="text-gray-600 mb-4">{boardComposition}</p>
        )}

        {/* Rationale Section */}
        {showRationale && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 p-4 bg-purple-50 rounded-lg"
          >
            <h3 className="font-semibold text-purple-800 mb-2">Why this board?</h3>
            <div className="space-y-2">
              {Object.entries(boardRationale).map(([role, rationale]) => (
                <div key={role} className="text-sm">
                  <span className="font-medium text-purple-700">{role}:</span>
                  <span className="text-gray-700 ml-2">{String(rationale)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </Card>

      {/* Board Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {board.map((memberRole: string, idx: number) => {
          // memberRole is a string like "Strategic Visionary" or "CEO"
          const roleInfo = roleDescriptions[memberRole] || {
            icon: Users,
            description: `${memberRole} - Your expert advisor`,
            color: 'gray',
            fullName: memberRole
          };
          const Icon = roleInfo.icon;
          const isExpanded = expandedMember === idx;
          // Convert decimal scores to percentages with proper handling
          const displayScore = (score: number) => {
            return Math.round((score || 0) * 100);
          };
          const score = displayScore(boardScores[memberRole] || 0.85);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                  isExpanded ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
                onClick={() => setExpandedMember(isExpanded ? null : idx)}
              >
                <div className={`p-6 bg-gradient-to-br from-${roleInfo.color}-50 to-${roleInfo.color}-100`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-${roleInfo.color}-500 text-white rounded-full flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {roleInfo.fullName || memberRole}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{roleInfo.description}</p>
                        
                        {/* Match Score */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.round(score / 20) 
                                    ? 'text-yellow-500 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{Math.round(score)}% match</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/20"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-medium">Ask this advisor about:</span>
                        </div>
                        <div className="space-y-2">
                          {memberRole === 'Strategic Visionary' && (
                            <>
                              <p className="text-sm">• Long-term business strategy</p>
                              <p className="text-sm">• Market positioning</p>
                              <p className="text-sm">• Competitive advantage</p>
                            </>
                          )}
                          {memberRole === 'Revenue Accelerator' && (
                            <>
                              <p className="text-sm">• Growth strategies</p>
                              <p className="text-sm">• Revenue optimization</p>
                              <p className="text-sm">• Pricing strategies</p>
                            </>
                          )}
                          {memberRole === 'Operations Expert' && (
                            <>
                              <p className="text-sm">• Process optimization</p>
                              <p className="text-sm">• Efficiency improvements</p>
                              <p className="text-sm">• System implementation</p>
                            </>
                          )}
                          {memberRole === 'People & Culture Champion' && (
                            <>
                              <p className="text-sm">• Team building</p>
                              <p className="text-sm">• Culture development</p>
                              <p className="text-sm">• Leadership skills</p>
                            </>
                          )}
                          {memberRole === 'Innovation Catalyst' && (
                            <>
                              <p className="text-sm">• Technology adoption</p>
                              <p className="text-sm">• Innovation strategies</p>
                              <p className="text-sm">• Digital transformation</p>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Ask for Advice
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setActiveSection('roadmap')}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white"
          >
            <Target className="w-4 h-4 mr-2" />
            View Your Roadmap
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveSection('assessments')}
          >
            <Shield className="w-4 h-4 mr-2" />
            Update Assessment
          </Button>
        </div>
      </Card>
    </div>
  );
}; 