
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Zap,
  CheckCircle
} from 'lucide-react';

interface ProgressTrackerProps {
  currentWeek: number;
  totalWeeks: number;
  completedTasks: number;
  totalTasks: number;
  onTrack: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentWeek,
  totalWeeks,
  completedTasks,
  totalTasks,
  onTrack
}) => {
  const progressPercentage = (currentWeek / totalWeeks) * 100;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Your Progress</h3>
          </div>
          <Badge className={`${
            onTrack 
              ? 'bg-green-500/20 text-green-300 border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
          }`}>
            {onTrack ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                On Track
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 mr-1" />
                Needs Attention
              </>
            )}
          </Badge>
        </div>

        {/* Time Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Sprint Timeline</span>
            </div>
            <span className="text-sm text-gray-400">
              Week {currentWeek} of {totalWeeks}
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Started</span>
              <span>{progressPercentage.toFixed(0)}% time elapsed</span>
              <span>90 days</span>
            </div>
          </div>
        </div>

        {/* Task Completion */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Task Completion</span>
            </div>
            <span className="text-sm text-gray-400">
              {completedTasks} of {totalTasks} completed
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={completionPercentage} 
              className="h-3 bg-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Not started</span>
              <span>{completionPercentage.toFixed(0)}% complete</span>
              <span>All done</span>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-300">
            {onTrack ? (
              <>
                <span className="text-green-400 font-medium">Excellent progress!</span> 
                <br />Keep up the momentum 🚀
              </>
            ) : (
              <>
                <span className="text-yellow-400 font-medium">No worries!</span> 
                <br />Every step counts. Let's refocus 💪
              </>
            )}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
