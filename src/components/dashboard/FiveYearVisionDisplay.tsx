import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, Trophy, Rocket, Flag } from 'lucide-react';
import type { FiveYearVision } from '../types/oracle';

interface Props {
  vision: FiveYearVision;
}

export const FiveYearVisionDisplay: React.FC<Props> = ({ vision }) => {
  const milestones = [
    { year: 1, data: vision.year_1, icon: Rocket, color: 'from-purple-400 to-pink-400' },
    { year: 3, data: vision.year_3, icon: Target, color: 'from-blue-400 to-purple-400' },
    { year: 5, data: vision.year_5, icon: Trophy, color: 'from-pink-400 to-orange-400' }
  ];

  return (
    <div className="space-y-8">
      {/* North Star */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm text-center"
      >
        <Flag className="w-8 h-8 text-purple-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Your North Star</h3>
        <p className="text-gray-600 italic">"{vision.north_star}"</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">{vision.archetype.replace('_', ' ').toUpperCase()}</span>
        </div>
      </motion.div>

      {/* Vision Narrative */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Your Journey</h4>
        <p className="text-gray-700 leading-relaxed">{vision.vision_narrative}</p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-400 to-pink-400" />
        
        {/* Milestones */}
        <div className="space-y-8">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            return (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex gap-6"
              >
                {/* Year Marker */}
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${milestone.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-600">
                    Year {milestone.year}
                  </span>
                </div>

                {/* Content Card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm"
                >
                  <h5 className="font-bold text-gray-800 mb-2">{milestone.data.headline}</h5>
                  <p className="text-gray-600 mb-3">{milestone.data.story}</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">Success Metrics:</p>
                    <p className="text-sm text-gray-600">{milestone.data.measurable}</p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 