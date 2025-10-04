
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Building, 
  Users, 
  Clock, 
  Plane, 
  Heart,
  PoundSterling,
  Trophy,
  Target
} from 'lucide-react';

interface FiveYearVisionProps {
  fiveYearVision: {
    title?: string;
    description?: string;
    business_metrics?: {
      revenue?: string;
      team_size?: string;
      locations?: string;
      market_position?: string;
    };
    life_metrics?: {
      working_hours?: string;
      holidays?: string;
      family_time?: string;
      personal_goals?: string;
    };
    british_founder_goals?: string[];
  };
}

export const FiveYearVision: React.FC<FiveYearVisionProps> = ({ fiveYearVision }) => {
  if (!fiveYearVision || Object.keys(fiveYearVision).length === 0) {
    return null;
  }

  const businessMetrics = fiveYearVision.business_metrics || {};
  const lifeMetrics = fiveYearVision.life_metrics || {};
  const britishGoals = fiveYearVision.british_founder_goals || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/30 backdrop-blur-sm border-indigo-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-32 -mt-32" />
        
        <div className="relative p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">
                {fiveYearVision.title || 'Your Five-Year Vision'}
              </h3>
            </div>
            
            {fiveYearVision.description && (
              <p className="text-gray-200 text-lg max-w-3xl mx-auto">
                {fiveYearVision.description}
              </p>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Business Metrics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-indigo-900/20 backdrop-blur-sm border-indigo-500/30 p-6">
                <h4 className="text-xl font-bold text-indigo-300 mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Success
                </h4>
                
                <div className="space-y-4">
                  {businessMetrics.revenue && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PoundSterling className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Annual Revenue</span>
                      </div>
                      <span className="text-white font-bold">{businessMetrics.revenue}</span>
                    </div>
                  )}
                  
                  {businessMetrics.team_size && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">Team Size</span>
                      </div>
                      <span className="text-white font-bold">{businessMetrics.team_size}</span>
                    </div>
                  )}
                  
                  {businessMetrics.locations && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300">Locations</span>
                      </div>
                      <span className="text-white font-bold">{businessMetrics.locations}</span>
                    </div>
                  )}
                  
                  {businessMetrics.market_position && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">Market Position</span>
                      </div>
                      <span className="text-white font-bold">{businessMetrics.market_position}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Life Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-pink-900/20 backdrop-blur-sm border-pink-500/30 p-6">
                <h4 className="text-xl font-bold text-pink-300 mb-6 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Life Balance
                </h4>
                
                <div className="space-y-4">
                  {lifeMetrics.working_hours && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Working Hours</span>
                      </div>
                      <span className="text-white font-bold">{lifeMetrics.working_hours}</span>
                    </div>
                  )}
                  
                  {lifeMetrics.holidays && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">Annual Holidays</span>
                      </div>
                      <span className="text-white font-bold">{lifeMetrics.holidays}</span>
                    </div>
                  )}
                  
                  {lifeMetrics.family_time && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-gray-300">Family Time</span>
                      </div>
                      <span className="text-white font-bold">{lifeMetrics.family_time}</span>
                    </div>
                  )}
                  
                  {lifeMetrics.personal_goals && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300">Personal Goals</span>
                      </div>
                      <span className="text-white font-bold">{lifeMetrics.personal_goals}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* British Founder Goals */}
          {britishGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <h4 className="text-xl font-bold text-orange-300 mb-4 text-center">
                British Founder Excellence
              </h4>
              <div className="flex flex-wrap justify-center gap-3">
                {britishGoals.map((goal, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + (idx * 0.1) }}
                  >
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-4 py-2 text-sm">
                      {goal}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
