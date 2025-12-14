import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle } from 'lucide-react';

interface TaskCompletionModalProps {
  task: {
    id: string;
    title: string;
    week_number: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, feedback: TaskFeedback) => void;
}

interface TaskFeedback {
  whatWentWell: string;
  whatDidntWork: string;
  additionalNotes: string;
}

export function TaskCompletionModal({ task, isOpen, onClose, onComplete }: TaskCompletionModalProps) {
  const [feedback, setFeedback] = useState<TaskFeedback>({
    whatWentWell: '',
    whatDidntWork: '',
    additionalNotes: ''
  });

  const handleSubmit = () => {
    onComplete(task.id, feedback);
    onClose();
    // Reset form
    setFeedback({
      whatWentWell: '',
      whatDidntWork: '',
      additionalNotes: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="text-green-500" />
            Complete: {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              What went well? ✅
            </label>
            <Textarea
              value={feedback.whatWentWell}
              onChange={(e) => setFeedback(f => ({ ...f, whatWentWell: e.target.value }))}
              placeholder="e.g., 'Found a great template that made this easy'"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              What didn't work? ⚠️
            </label>
            <Textarea
              value={feedback.whatDidntWork}
              onChange={(e) => setFeedback(f => ({ ...f, whatDidntWork: e.target.value }))}
              placeholder="e.g., 'The tool recommended wasn't available on my plan'"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Anything else? (optional)
            </label>
            <Textarea
              value={feedback.additionalNotes}
              onChange={(e) => setFeedback(f => ({ ...f, additionalNotes: e.target.value }))}
              placeholder="Any other thoughts or suggestions"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Mark Complete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

