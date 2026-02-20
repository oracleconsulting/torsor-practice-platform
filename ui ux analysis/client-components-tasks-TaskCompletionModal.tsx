import { useState } from 'react';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg border border-slate-600 max-w-lg w-full mx-4 p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">
            Complete: {task.title}
          </h2>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              What went well? ✅
            </label>
            <textarea
              value={feedback.whatWentWell}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFeedback(f => ({ ...f, whatWentWell: e.target.value }))
              }
              placeholder="e.g., 'Found a great template that made this easy'"
              rows={2}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg 
                         text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 
                         focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              What didn't work? ⚠️
            </label>
            <textarea
              value={feedback.whatDidntWork}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFeedback(f => ({ ...f, whatDidntWork: e.target.value }))
              }
              placeholder="e.g., 'The tool recommended wasn't available on my plan'"
              rows={2}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg 
                         text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 
                         focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Anything else? (optional)
            </label>
            <textarea
              value={feedback.additionalNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFeedback(f => ({ ...f, additionalNotes: e.target.value }))
              }
              placeholder="Any other thoughts or suggestions"
              rows={2}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg 
                         text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 
                         focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg 
                       border border-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg 
                       transition-colors font-medium"
          >
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}


