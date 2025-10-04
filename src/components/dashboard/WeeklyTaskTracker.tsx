import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, FileText } from 'lucide-react';
import type { SprintWeek, SprintTask } from '../types/oracle';

interface Props {
  week: SprintWeek;
  onTaskToggle?: (taskIndex: number) => void;
}

export const WeeklyTaskTracker: React.FC<Props> = ({ week, onTaskToggle }) => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  const toggleTask = (index: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedTasks(newCompleted);
    onTaskToggle?.(index);
  };

  const progress = (completedTasks.size / week.tasks.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-bold text-gray-800">Week {week.week}: {week.theme}</h4>
          <span className="text-sm text-gray-500">{completedTasks.size}/{week.tasks.length} tasks</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{week.focus}</p>
        
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {week.tasks.map((task: SprintTask, index: number) => (
          <motion.div
            key={index}
            whileHover={{ x: 2 }}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              completedTasks.has(index)
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 hover:border-purple-200'
            }`}
            onClick={() => toggleTask(index)}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              {completedTasks.has(index) ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 mt-0.5" />
              )}
              
              {/* Task Content */}
              <div className="flex-1">
                <p className={`font-medium ${
                  completedTasks.has(index) ? 'text-gray-500 line-through' : 'text-gray-800'
                }`}>
                  {task.task}
                </p>
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {task.time}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FileText className="w-3 h-3" />
                    {task.output}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}; 