import { useState } from 'react';
import { 
  MessageSquare, 
  Copy, 
  Check,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Quote,
  User,
  Users,
  Building2,
  ListChecks,
  Clock
} from 'lucide-react';

interface TalkingPoint {
  topic: string;
  point: string;
  dataPoint: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  clientQuoteToReference?: string;
}

interface QuestionToAsk {
  question: string;
  purpose: string;
  followUp: string;
  expectedInsight: string;
}

interface NextStep {
  action: string;
  owner: 'practice' | 'client' | 'joint';
  timing: string;
  outcome?: string;
  priority?: number;
}

interface Task {
  task: string;
  assignTo?: string;
  dueDate?: string;
  deliverable?: string;
}

interface ConversationScriptProps {
  openingStatement: string;
  talkingPoints: TalkingPoint[];
  questionsToAsk: QuestionToAsk[];
  nextSteps?: NextStep[];
  tasks?: Task[];
}

export function ConversationScript({
  openingStatement,
  talkingPoints,
  questionsToAsk,
  nextSteps = [],
  tasks = []
}: ConversationScriptProps) {
  const [checkedPoints, setCheckedPoints] = useState<Set<number>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const togglePoint = (index: number) => {
    const newChecked = new Set(checkedPoints);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedPoints(newChecked);
  };
  
  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };
  
  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  const importanceConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
    high: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
    medium: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
    low: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' }
  };

  return (
    <div className="space-y-6">
      {/* Opening Statement */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Opening Statement</p>
              <p className="text-blue-800 italic">"{openingStatement}"</p>
            </div>
          </div>
          <button 
            onClick={() => copyToClipboard(openingStatement, -1)}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
          >
            {copiedIndex === -1 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Talking Points */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Key Talking Points
        </h3>
        <div className="space-y-2">
          {talkingPoints.map((tp, i) => {
            const config = importanceConfig[tp.importance];
            const isChecked = checkedPoints.has(i);
            
            return (
              <div 
                key={i}
                className={`${config.bg} ${config.border} border rounded-lg p-4 transition-opacity ${isChecked ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => togglePoint(i)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isChecked 
                        ? 'bg-slate-600 border-slate-600 text-white' 
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
                        {tp.importance.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{tp.topic}</span>
                    </div>
                    
                    <p className="text-slate-800">{tp.point}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-slate-500">
                        <strong>Data:</strong> {tp.dataPoint}
                      </span>
                      {tp.clientQuoteToReference && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Quote className="w-3 h-3" />
                          "{tp.clientQuoteToReference.slice(0, 50)}..."
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => copyToClipboard(tp.point, i)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded"
                  >
                    {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Questions to Ask */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Discovery Questions
        </h3>
        <div className="space-y-2">
          {questionsToAsk.map((q, i) => {
            const isExpanded = expandedQuestions.has(i);
            
            return (
              <div 
                key={i}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(i)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-500">{q.purpose}</span>
                    </div>
                    <p className="text-slate-800 font-medium mt-1">"{q.question}"</p>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4 ml-8 space-y-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Follow-up</p>
                      <p className="text-slate-700 italic">"{q.followUp}"</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Expected Insight</p>
                      <p className="text-slate-700">{q.expectedInsight}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agreed Next Steps - For wrapping up the conversation */}
      {nextSteps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Agree Next Steps
          </h3>
          <p className="text-sm text-slate-500 mb-4 italic">
            "Before we wrap up, let's agree on the next steps to move forward..."
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Client Actions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Client Actions</span>
              </div>
              <div className="space-y-2">
                {nextSteps.filter(s => s.owner === 'client').map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 rounded border-blue-300" />
                    <div>
                      <p className="text-sm text-slate-700">{step.action}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {step.timing}
                      </p>
                    </div>
                  </div>
                ))}
                {nextSteps.filter(s => s.owner === 'client').length === 0 && (
                  <p className="text-sm text-slate-400 italic">No client actions</p>
                )}
              </div>
            </div>

            {/* Joint Actions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">Joint Actions</span>
              </div>
              <div className="space-y-2">
                {nextSteps.filter(s => s.owner === 'joint').map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 rounded border-amber-300" />
                    <div>
                      <p className="text-sm text-slate-700">{step.action}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {step.timing}
                      </p>
                    </div>
                  </div>
                ))}
                {nextSteps.filter(s => s.owner === 'joint').length === 0 && (
                  <p className="text-sm text-slate-400 italic">No joint actions</p>
                )}
              </div>
            </div>

            {/* Practice Actions */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">Practice Actions</span>
              </div>
              <div className="space-y-2">
                {nextSteps.filter(s => s.owner === 'practice').map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1 rounded border-emerald-300" />
                    <div>
                      <p className="text-sm text-slate-700">{step.action}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {step.timing}
                      </p>
                    </div>
                  </div>
                ))}
                {nextSteps.filter(s => s.owner === 'practice').length === 0 && (
                  <p className="text-sm text-slate-400 italic">No practice actions</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Practice Team Tasks */}
      {tasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Practice Team Tasks
          </h3>
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
            {tasks.map((task, i) => (
              <div key={i} className="p-4 flex items-start gap-3 hover:bg-slate-50">
                <input type="checkbox" className="mt-1 rounded border-slate-300" />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{task.task}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    {task.assignTo && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {task.assignTo}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.dueDate}
                      </span>
                    )}
                  </div>
                  {task.deliverable && (
                    <p className="text-xs text-slate-400 mt-1">📋 {task.deliverable}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


