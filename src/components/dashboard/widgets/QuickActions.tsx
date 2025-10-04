import React from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, MessageSquare, Calendar, FileText, Share2, 
  Brain, BarChart3, Settings, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

export const QuickActionsWidget: React.FC = () => {
  const actions: QuickAction[] = [
    { id: 'ask', label: 'Ask Board', icon: MessageSquare, color: 'purple', description: 'Get instant advice' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, color: 'blue', description: 'Book time slots' },
    { id: 'reports', label: 'Reports', icon: FileText, color: 'green', description: 'View analytics' },
    { id: 'refer', label: 'Refer', icon: Share2, color: 'orange', description: 'Invite friends' }
  ];
  
  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-white font-medium flex items-center gap-2">
          <Rocket className="w-4 h-4 text-purple-500" />
          Quick Actions
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="ml-auto"
          >
            <Zap className="w-3 h-3 text-yellow-400" />
          </motion.div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, i) => {
            const Icon = action.icon;
            const colors = {
              purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300',
              blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300',
              green: 'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300',
              orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-300'
            };
            
            return (
              <motion.div
                key={action.id}
                className={`group p-3 ${colors[action.color as keyof typeof colors]} rounded-lg text-xs font-medium transition-all relative overflow-hidden`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-20"
                  style={{ 
                    background: `radial-gradient(circle at center, ${
                      action.color === 'purple' ? '#8B5CF6' :
                      action.color === 'blue' ? '#3B82F6' :
                      action.color === 'green' ? '#10B981' :
                      '#F97316'
                    } 0%, transparent 70%)`
                  }}
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 2 }}
                  transition={{ duration: 0.3 }}
                />
                
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <Icon className="w-5 h-5" />
                  <span>{action.label}</span>
                </div>
                
                <motion.div
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
                  initial={{ y: -5 }}
                  whileHover={{ y: 0 }}
                >
                  {action.description}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}; 