import { useState } from 'react';
import { 
  User, 
  Users, 
  Building, 
  Clock, 
  Target,
  Check,
  ChevronRight
} from 'lucide-react';

interface NextStep {
  action: string;
  owner: 'client' | 'joint' | 'practice';
  timing: string;
  outcome: string;
  priority: number;
}

interface Task {
  task: string;
  assignTo: string;
  dueDate: string;
  deliverable: string;
}

interface NextStepsPanelProps {
  nextSteps: NextStep[];
  tasks: Task[];
}

export function NextStepsPanel({ nextSteps, tasks }: NextStepsPanelProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  
  const ownerConfig = {
    client: { 
      icon: User, 
      label: 'Client', 
      bg: 'bg-blue-50', 
      text: 'text-blue-700',
      border: 'border-blue-200'
    },
    joint: { 
      icon: Users, 
      label: 'Joint', 
      bg: 'bg-purple-50', 
      text: 'text-purple-700',
      border: 'border-purple-200'
    },
    practice: { 
      icon: Building, 
      label: 'Practice', 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700',
      border: 'border-emerald-200'
    }
  };
  
  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };
  
  const toggleTask = (index: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedTasks(newCompleted);
  };

  // Group steps by owner
  const groupedSteps = nextSteps.reduce((acc, step, i) => {
    if (!acc[step.owner]) acc[step.owner] = [];
    acc[step.owner].push({ ...step, originalIndex: i });
    return acc;
  }, {} as Record<string, (NextStep & { originalIndex: number })[]>);

  return (
    <div className="space-y-6">
      {/* Next Steps by Owner */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Next Steps
        </h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          {(['client', 'joint', 'practice'] as const).map(owner => {
            const config = ownerConfig[owner];
            const Icon = config.icon;
            const steps = groupedSteps[owner] || [];
            
            return (
              <div 
                key={owner}
                className={`${config.bg} ${config.border} border rounded-lg p-4`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${config.text}`} />
                  <span className={`text-sm font-semibold ${config.text}`}>
                    {config.label} Actions
                  </span>
                </div>
                
                <div className="space-y-2">
                  {steps.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No actions</p>
                  ) : (
                    steps.map((step) => {
                      const isCompleted = completedSteps.has(step.originalIndex);
                      
                      return (
                        <div 
                          key={step.originalIndex}
                          className={`bg-white rounded p-2 text-sm transition-opacity ${isCompleted ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => toggleStep(step.originalIndex)}
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                isCompleted 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'border-slate-300'
                              }`}
                            >
                              {isCompleted && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <p className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                                {step.action}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                {step.timing}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Practice Tasks */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Practice Team Tasks
        </h3>
        
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {tasks.map((task, i) => {
            const isCompleted = completedTasks.has(i);
            
            return (
              <div 
                key={i}
                className={`p-3 flex items-center gap-3 transition-opacity ${isCompleted ? 'opacity-50 bg-slate-50' : ''}`}
              >
                <button
                  onClick={() => toggleTask(i)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {isCompleted && <Check className="w-3 h-3" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-slate-800 ${isCompleted ? 'line-through' : ''}`}>
                    {task.task}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignTo}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.dueDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {task.deliverable}
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



