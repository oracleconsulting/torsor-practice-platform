import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  urgency: 'low' | 'medium' | 'high';
  time_estimate: string;
  completed: boolean;
}

interface TodaysFocusProps {
  tasks: Task[];
}

export function TodaysFocus({ tasks }: TodaysFocusProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === 'high') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-400">
            🎯 Today's Focus
          </CardTitle>
          <span className="text-xs text-gray-500">
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500">
              No tasks for today. Check your 12-week plan to get started.
            </p>
          ) : (
            tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-start space-x-2 group cursor-pointer"
              >
                <button
                  className="mt-0.5 transition-colors"
                  onClick={() => {/* Handle task completion */}}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${
                      task.completed ? 'text-gray-500 line-through' : 'text-gray-200'
                    }`}>
                      {task.title}
                    </p>
                    {getUrgencyIcon(task.urgency)}
                  </div>
                  <p className={`text-xs ${getUrgencyColor(task.urgency)}`}>
                    {task.time_estimate} • {task.urgency} priority
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 