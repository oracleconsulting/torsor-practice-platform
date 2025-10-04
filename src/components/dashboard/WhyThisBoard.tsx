// File: src/components/dashboard/WhyThisBoard.tsx

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Lightbulb, 
  Target, 
  CheckCircle,
  TrendingUp,
  Briefcase,
  Brain,
  DollarSign,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BoardRationale {
  overall_reasoning?: string;
  role_explanations?: Record<string, string>;
  scores?: Record<string, number>;
  [key: string]: any; // For individual role rationales like CFO, CMO, etc.
}

interface WhyThisBoardProps {
  board: string[];
  rationale: BoardRationale;
  businessName?: string;
}

// Get display info for each role
const getRoleInfo = (role: string) => {
  const roleMap: Record<string, { 
    color: string; 
    icon: any; 
    title: string; 
    skills: string[];
    bgGradient: string;
    iconBg: string;
    textColor: string;
  }> = {
    'CFO': { 
      color: 'purple', 
      icon: TrendingUp, 
      title: 'Chief Financial Officer',
      skills: ['Financial Strategy', 'Cash Flow', 'Pricing', 'Profitability'],
      bgGradient: 'from-purple-900/20 to-purple-800/20',
      iconBg: 'bg-purple-500/20',
      textColor: 'text-purple-400'
    },
    'CMO': { 
      color: 'pink', 
      icon: Lightbulb, 
      title: 'Chief Marketing Officer',
      skills: ['Customer Acquisition', 'Brand Strategy', 'Digital Marketing', 'Growth'],
      bgGradient: 'from-pink-900/20 to-pink-800/20',
      iconBg: 'bg-pink-500/20',
      textColor: 'text-pink-400'
    },
    'COO': { 
      color: 'blue', 
      icon: CheckCircle, 
      title: 'Chief Operating Officer',
      skills: ['Systems', 'Processes', 'Efficiency', 'Scaling'],
      bgGradient: 'from-blue-900/20 to-blue-800/20',
      iconBg: 'bg-blue-500/20',
      textColor: 'text-blue-400'
    },
    'CTO': { 
      color: 'green', 
      icon: Brain, 
      title: 'Chief Technology Officer',
      skills: ['Tech Strategy', 'Architecture', 'Innovation', 'Digital'],
      bgGradient: 'from-green-900/20 to-green-800/20',
      iconBg: 'bg-green-500/20',
      textColor: 'text-green-400'
    },
    'CHRO': { 
      color: 'orange', 
      icon: Users, 
      title: 'Chief Human Resources Officer',
      skills: ['Culture', 'Talent', 'Leadership', 'Team Building'],
      bgGradient: 'from-orange-900/20 to-orange-800/20',
      iconBg: 'bg-orange-500/20',
      textColor: 'text-orange-400'
    }
  };
  
  return roleMap[role] || { 
    color: 'gray', 
    icon: Users, 
    title: role,
    skills: ['Strategic Leadership', 'Business Growth'],
    bgGradient: 'from-gray-900/20 to-gray-800/20',
    iconBg: 'bg-gray-500/20',
    textColor: 'text-gray-400'
  };
};

export const WhyThisBoard: React.FC<WhyThisBoardProps> = ({ 
  board = [], 
  rationale = {},
  businessName = "your business"
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded

  // Extract rationale for each board member
  const getBoardMemberRationale = (role: string) => {
    // Check multiple possible locations for the rationale
    return rationale[role] || 
           rationale.role_explanations?.[role] || 
           `Strategic ${role} guidance tailored to your business needs`;
  };

  // Get match score for a role
  const getMatchScore = (role: string) => {
    if (rationale.scores?.[role]) {
      return Math.round(rationale.scores[role] * 100);
    }
    // Default scores based on typical priorities
    const defaultScores: Record<string, number> = {
      'CFO': 95,
      'CMO': 92,
      'COO': 88,
      'CTO': 85,
      'CHRO': 82
    };
    return defaultScores[role] || 85;
  };

  return (
    <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Your AI Advisory Board</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              {board.length} Advisors
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
            >
              <span className="mr-2">{isExpanded ? 'Show Less' : 'Show More'}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-8 text-center">
          <p className="text-gray-300 text-lg mb-3">
            We've assembled a virtual board of AI advisors tailored specifically to your challenges and goals.
          </p>
          <p className="text-purple-400 italic">
            Each advisor brings deep expertise in areas critical to transforming {businessName}
          </p>
        </div>

        {/* Board Members Grid - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {board.map((role, index) => {
            const roleInfo = getRoleInfo(role);
            const Icon = roleInfo.icon;
            const matchScore = getMatchScore(role);
            const roleRationale = getBoardMemberRationale(role);
            
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${roleInfo.bgGradient} border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all`}
              >
                {/* Match Score Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`${roleInfo.iconBg} rounded-xl p-3`}>
                    <Icon className={`w-8 h-8 ${roleInfo.textColor}`} />
                  </div>
                  <Badge className="bg-gray-800/50 text-white border-gray-600">
                    {matchScore}% Match
                  </Badge>
                </div>

                {/* Role Title */}
                <h3 className={`text-xl font-bold ${roleInfo.textColor} mb-1`}>{role}</h3>
                <p className="text-gray-400 text-sm mb-4">{roleInfo.title}</p>

                {/* Key Skills */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {roleInfo.skills.slice(0, 3).map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs border-gray-600 text-gray-300 bg-gray-800/30"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Why This Advisor - Always show a preview */}
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Why This Advisor</p>
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {roleRationale}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Expandable Detailed Rationale Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-800 pt-6 space-y-6">
                {/* Overall Board Strategy */}
                <Card className="bg-gray-800/50 border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Why This Specific Board Composition?</h3>
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {rationale.overall_reasoning || 
                     `Based on your assessment, we've identified that your primary challenges revolve around ${
                       board.includes('CFO') ? 'financial management and cash flow' : ''
                     }${board.includes('CMO') ? ', marketing and customer acquisition' : ''}${
                       board.includes('COO') ? ', and operational efficiency' : ''
                     }. This board composition provides comprehensive coverage across these critical areas.`}
                  </p>

                  {/* Individual Role Deep Dives */}
                  <div className="space-y-4">
                    {board.map((role) => {
                      const roleInfo = getRoleInfo(role);
                      const Icon = roleInfo.icon;
                      const roleRationale = getBoardMemberRationale(role);
                      
                      return (
                        <div key={role} className="bg-gray-900/50 rounded-lg p-5">
                          <div className="flex items-start gap-4">
                            <div className={`${roleInfo.iconBg} rounded-lg p-2 mt-1`}>
                              <Icon className={`w-5 h-5 ${roleInfo.textColor}`} />
                            </div>
                            <div className="flex-1">
                              <h4 className={`${roleInfo.textColor} font-semibold mb-2`}>
                                {role} - {roleInfo.title}
                              </h4>
                              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                                {roleRationale}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Match Score: {getMatchScore(role)}%</span>
                                <span>•</span>
                                <span>Priority: High</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* How Your Board Works Together */}
                <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/30 p-6">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">
                    How Your Board Works Together
                  </h3>
                  <div className="space-y-3 text-gray-300">
                    <p className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Your {board[0]} will ensure financial sustainability while your {board[1]} drives operational excellence</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Your {board[2]} focuses on growth and market positioning to achieve your revenue goals</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Together, they provide a 360-degree view of your business transformation</span>
                    </p>
                  </div>
                </Card>

                {/* Call to Action */}
                <div className="text-center pt-6">
                  <p className="text-gray-400 mb-4">
                    Ready to tap into your board's expertise?
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={() => {
                      console.log('Start board conversation');
                    }}
                  >
                    Start Your First Board Session
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};