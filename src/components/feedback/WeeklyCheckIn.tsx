
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, Circle, AlertCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WeeklyCheckInProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  weekNumber: number;
  tasks: any[];
}

export const WeeklyCheckIn: React.FC<WeeklyCheckInProps> = ({
  open,
  onClose,
  groupId,
  weekNumber,
  tasks
}) => {
  const { toast } = useToast();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [blockers, setBlockers] = useState('');
  const [wins, setWins] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // For now, save to localStorage until backend is ready
      const checkInData = {
        group_id: groupId,
        week_number: weekNumber,
        check_in: {
          tasks_completed: completedTasks,
          blockers,
          wins,
          confidence_level: confidenceLevel,
          completion_percentage: (completedTasks.length / tasks.length) * 100,
          timestamp: new Date().toISOString()
        }
      };

      const existingCheckIns = JSON.parse(localStorage.getItem('oracle_checkins') || '[]');
      existingCheckIns.push(checkInData);
      localStorage.setItem('oracle_checkins', JSON.stringify(existingCheckIns));

      toast({
        title: "Week " + weekNumber + " check-in complete!",
        description: "Great job on your progress this week.",
      });

      onClose();
    } catch (error) {
      console.error('Error submitting check-in:', error);
      toast({
        title: "Error",
        description: "Failed to submit check-in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-oracle-navy">
            Week {weekNumber} Check-In
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Overview */}
          <Card className="p-4 bg-oracle-gold/5 border-oracle-gold/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-oracle-navy">
                Week Progress
              </span>
              <span className="text-sm text-gray-600">
                {completedTasks.length} of {tasks.length} tasks
              </span>
            </div>
            <Progress 
              value={(completedTasks.length / tasks.length) * 100} 
              className="h-2"
            />
          </Card>

          {/* Task Checklist */}
          <div>
            <h3 className="text-lg font-semibold text-oracle-navy mb-3">
              What did you complete this week?
            </h3>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <label
                  key={task.id || index}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    completedTasks.includes(task.id || index.toString())
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } border`}
                >
                  <Checkbox
                    checked={completedTasks.includes(task.id || index.toString())}
                    onCheckedChange={() => toggleTask(task.id || index.toString())}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {task.title || task}
                    </p>
                    {task.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Wins */}
          <div>
            <h3 className="text-lg font-semibold text-oracle-navy mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Celebrate your wins
            </h3>
            <Textarea
              placeholder="What went well this week? What are you proud of?"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Blockers */}
          <div>
            <h3 className="text-lg font-semibold text-oracle-navy mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Any blockers or challenges?
            </h3>
            <Textarea
              placeholder="What got in your way? What support do you need?"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Confidence Level */}
          <div>
            <h3 className="text-lg font-semibold text-oracle-navy mb-3">
              How confident are you about next week?
            </h3>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setConfidenceLevel(level)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    confidenceLevel === level
                      ? 'bg-oracle-gold text-oracle-navy border-oracle-gold'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-oracle-gold/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              1 = Very uncertain, 5 = Very confident
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy"
            >
              {isSubmitting ? 'Submitting...' : 'Complete Check-In'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
