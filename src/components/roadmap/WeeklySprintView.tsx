
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle, 
  ChevronRight,
  Zap
} from 'lucide-react';

interface Week {
  week_number: number;
  priority_level: string;
  theme: string;
  focus: string;
  time_budget: string;
  actions: string[];
  tools_to_use?: string[];
  expected_outcome: string;
}

interface WeeklySprintViewProps {
  weeks: Week[];
  checkpoints: any;
  currentWeek: number;
  groupId: string;
}

export const WeeklySprintView: React.FC<WeeklySprintViewProps> = ({
  weeks,
  checkpoints,
  currentWeek,
  groupId
}) => {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(currentWeek);

  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      'IMMEDIATE RELIEF': 'from-red-500 to-orange-500',
      'QUICK WIN': 'from-yellow-500 to-green-500',
      'FOUNDATION': 'from-blue-500 to-indigo-500',
      'STRATEGIC': 'from-purple-500 to-pink-500',
      'DELEGATION': 'from-teal-500 to-cyan-500',
      'GROWTH': 'from-green-500 to-emerald-500',
      'REVIEW & PLAN': 'from-gray-500 to-slate-500'
    };
    return styles[priority] || 'from-purple-500 to-pink-500';
  };

  const toggleTask = async (weekNumber: number, taskTitle: string) => {
    try {
      const response = await fetch(`/api/roadmap/${groupId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_title: taskTitle,
          completed: true,
          week_number: weekNumber
        })
      });
      if (response.ok) {
        // Update UI or refetch data
        console.log('Task updated successfully');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sprint Overview */}
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Your 12-Week Sprint Journey</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(checkpoints).map(([key, value]) => (
            <div key={key} className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
              <p className="font-semibold text-white">{value as string}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weeks.map((week, index) => {
          const isSelected = expandedWeek === week.week_number;
          const gradientClass = getPriorityStyle(week.priority_level);
          const isCurrent = week.week_number === currentWeek;
          const isPast = week.week_number < currentWeek;
          
          return (
            <motion.div
              key={week.week_number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                  isCurrent ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' : 
                  isPast ? 'opacity-75' : ''
                } ${
                  isSelected ? 'bg-gray-800/90 border-purple-500/50' : 'bg-gray-900/80 border-gray-800'
                } backdrop-blur-sm hover:border-gray-700`}
                onClick={() => setExpandedWeek(isSelected ? null : week.week_number)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-10`} />
                
                <div className="relative p-4">
                  {/* Week Header */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`bg-gradient-to-r ${gradientClass} text-white border-none`}>
                      Week {week.week_number}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {isCurrent && <Zap className="w-4 h-4 text-yellow-400" />}
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>

                  <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                    {week.theme}
                  </h3>
                  <p className="text-xs text-gray-300 mb-3 line-clamp-2">{week.focus}</p>
                  
                  {/* Expected Outcome Preview */}
                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-xs text-green-400 flex items-start gap-1">
                      <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{week.expected_outcome}</span>
                    </p>
                  </div>

                  {/* Time Budget */}
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{week.time_budget}</span>
                    <span className="text-gray-600">•</span>
                    <span>{week.actions?.length || 0} tasks</span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-700 bg-gray-800/50"
                  >
                    <div className="p-4 space-y-4">
                      {/* Actions */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-300 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Actions
                        </h4>
                        <div className="space-y-2">
                          {week.actions.map((action, idx) => (
                            <div key={idx} className="flex items-start space-x-2 p-2 bg-gray-900/50 rounded">
                              <Checkbox
                                className="mt-0.5"
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    toggleTask(week.week_number, action);
                                  }
                                }}
                              />
                              <label className="text-sm text-gray-200 flex-1 leading-relaxed">
                                {action}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tools */}
                      {week.tools_to_use && week.tools_to_use.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-300 mb-2">Tools:</h4>
                          <div className="flex flex-wrap gap-2">
                            {week.tools_to_use.map((tool, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline"
                                className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30"
                              >
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
