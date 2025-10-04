import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Target, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface FirstTaskStepProps {
  onComplete: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

interface SuggestedTask {
  title: string;
  description: string;
  category: string;
  icon: string;
}

const suggestedTasks: SuggestedTask[] = [
  {
    title: 'Review Financial Dashboard',
    description: 'Familiarize yourself with your key metrics and financial health indicators',
    category: 'finance',
    icon: '💰'
  },
  {
    title: 'Connect with First Board Member',
    description: 'Have your first strategic conversation with your AI advisory board',
    category: 'strategy',
    icon: '💬'
  },
  {
    title: 'Set Weekly Revenue Goal',
    description: 'Define your revenue target for this week based on your roadmap',
    category: 'revenue',
    icon: '🎯'
  },
  {
    title: 'Complete Energy Assessment',
    description: 'Take 5 minutes to assess your current energy levels and set boundaries',
    category: 'wellness',
    icon: '⚡'
  }
];

export const FirstTaskStep: React.FC<FirstTaskStepProps> = ({ onComplete, onBack, isLastStep }) => {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<SuggestedTask | null>(null);
  const [customTask, setCustomTask] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0]
  });
  const [isCustom, setIsCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTask = async () => {
    if (!user?.id) return;

    const taskToSave = isCustom ? customTask : {
      title: selectedTask?.title || '',
      description: selectedTask?.description || '',
      due_date: new Date().toISOString(),
      category: selectedTask?.category || 'general',
      priority: 'high' as const,
      status: 'pending' as const
    };

    if (!taskToSave.title) {
      toast.error('Please select or enter a task');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          ...taskToSave,
          source: 'onboarding'
        });

      if (error) throw error;

      toast.success('Your first task has been set!');
      onComplete();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-gray-300 text-lg">
          Let's set your first priority to build momentum right away.
        </p>
      </motion.div>

      <div className="space-y-4">
        <h3 className="text-white font-semibold mb-3">Choose a suggested task or create your own:</h3>
        
        {/* Suggested tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestedTasks.map((task, index) => (
            <motion.button
              key={task.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                setSelectedTask(task);
                setIsCustom(false);
              }}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedTask?.title === task.title && !isCustom
                  ? 'bg-purple-500/20 border-purple-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{task.icon}</span>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">{task.title}</h4>
                  <p className="text-gray-400 text-sm">{task.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Custom task option */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => setIsCustom(true)}
          className={`w-full p-4 rounded-xl border text-left transition-all ${
            isCustom
              ? 'bg-purple-500/20 border-purple-500'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Create custom task</span>
          </div>
        </motion.button>

        {/* Custom task form */}
        {isCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4"
          >
            <div>
              <Label htmlFor="title" className="text-white mb-2 block">
                Task Title
              </Label>
              <Input
                id="title"
                value={customTask.title}
                onChange={(e) => setCustomTask({ ...customTask, title: e.target.value })}
                placeholder="e.g., Review Q1 financial reports"
                className="bg-white/10 border-white/20 text-white placeholder-gray-500"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white mb-2 block">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={customTask.description}
                onChange={(e) => setCustomTask({ ...customTask, description: e.target.value })}
                placeholder="Add any details or context..."
                className="bg-white/10 border-white/20 text-white placeholder-gray-500 min-h-[80px]"
              />
            </div>
            
            <div>
              <Label htmlFor="due_date" className="text-white mb-2 block">
                Due Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="due_date"
                  type="date"
                  value={customTask.due_date}
                  onChange={(e) => setCustomTask({ ...customTask, due_date: e.target.value })}
                  className="bg-white/10 border-white/20 text-white pl-10"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30"
      >
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold mb-2">Why start with one task?</h3>
            <p className="text-gray-300 text-sm">
              Focus is your superpower. By completing one meaningful task each day, 
              you'll build momentum and make consistent progress toward your goals. 
              Your dashboard will track your progress and celebrate your wins!
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
        )}
        
        <div className="flex-1 flex justify-end">
          <Button
            onClick={handleSaveTask}
            disabled={isSaving || (!selectedTask && !customTask.title)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isSaving ? 'Setting up...' : isLastStep ? 'Complete Setup' : 'Save & Continue'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 