import { useState } from 'react';
import { 
  MessageSquare, 
  Copy, 
  Check,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Quote
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

interface ConversationScriptProps {
  openingStatement: string;
  talkingPoints: TalkingPoint[];
  questionsToAsk: QuestionToAsk[];
}

export function ConversationScript({
  openingStatement,
  talkingPoints,
  questionsToAsk
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
    </div>
  );
}

