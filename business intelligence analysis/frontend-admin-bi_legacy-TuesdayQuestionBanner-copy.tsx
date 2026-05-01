/**
 * Tuesday Question Banner
 * Hero section that answers the client's burning question
 * "The destination, not the plane"
 */

import { useState } from 'react';
import { Calendar, ChevronRight, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

interface TuesdayQuestionBannerProps {
  question: string | null;
  answerShort: string | null;
  answerDetail?: string | null;
  linkedScenarioId?: string | null;
  onRunScenario?: (id: string) => void;
  editable?: boolean;
  onEdit?: () => void;
}

export function TuesdayQuestionBanner({
  question,
  answerShort,
  answerDetail,
  linkedScenarioId,
  onRunScenario,
  editable,
  onEdit
}: TuesdayQuestionBannerProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!question) {
    return (
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" />
          <span className="text-slate-300 font-medium">Your Tuesday Question</span>
        </div>
        <p className="text-slate-300 italic">No question set for this period yet.</p>
        {editable && (
          <button 
            onClick={onEdit}
            className="mt-4 text-sm text-slate-300 hover:text-white flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Add a question
          </button>
        )}
      </div>
    );
  }
  
  // Determine answer type for styling
  const getAnswerStyle = () => {
    const short = (answerShort || '').toLowerCase();
    if (short.startsWith('yes')) return 'bg-green-500/20 border-green-400/30';
    if (short.startsWith('no')) return 'bg-red-500/20 border-red-400/30';
    if (short.startsWith('not yet')) return 'bg-amber-500/20 border-amber-400/30';
    return 'bg-white/10 border-white/20';
  };
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="text-blue-100 font-medium">Your Tuesday Question</span>
          </div>
          {editable && (
            <button 
              onClick={onEdit}
              className="text-blue-200 hover:text-white p-1 rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Question */}
        <h2 className="text-xl md:text-2xl font-semibold mb-6 italic leading-relaxed">
          "{question}"
        </h2>
        
        {/* Answer */}
        {answerShort ? (
          <div className={`rounded-lg p-4 border ${getAnswerStyle()}`}>
            <p className="text-lg md:text-xl font-semibold mb-2">{answerShort}</p>
            
            {answerDetail && (
              <>
                <button 
                  onClick={() => setExpanded(!expanded)}
                  className="text-blue-200 text-sm hover:text-white flex items-center gap-1 mt-2"
                >
                  {expanded ? (
                    <>Hide detail <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Read more <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
                
                {expanded && (
                  <p className="mt-4 text-blue-100 leading-relaxed">
                    {answerDetail}
                  </p>
                )}
              </>
            )}
            
            {linkedScenarioId && onRunScenario && (
              <button
                onClick={() => onRunScenario(linkedScenarioId)}
                className="mt-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <span>See the scenario</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <p className="text-blue-200 italic">Awaiting answer...</p>
          </div>
        )}
      </div>
    </div>
  );
}

