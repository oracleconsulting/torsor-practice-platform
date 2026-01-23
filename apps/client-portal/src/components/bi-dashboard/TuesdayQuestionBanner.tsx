'use client';

import { AlertCircle, CheckCircle, Clock, HelpCircle } from 'lucide-react';

interface TuesdayQuestionProps {
  question: string | null;
  answer: string | null;
  verdict?: 'yes' | 'no' | 'not_yet' | 'conditional';
  conditions?: string[];
  linkedScenarioId?: string | null;
  onRunScenario?: (id: string) => void;
}

const verdictConfig = {
  yes: {
    icon: CheckCircle,
    badge: 'YES',
    bgClass: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
    badgeClass: 'bg-emerald-400/30 text-emerald-100'
  },
  no: {
    icon: AlertCircle,
    badge: 'NO',
    bgClass: 'bg-gradient-to-r from-red-600 to-red-500',
    badgeClass: 'bg-red-400/30 text-red-100'
  },
  not_yet: {
    icon: Clock,
    badge: 'NOT YET',
    bgClass: 'bg-gradient-to-r from-amber-600 to-amber-500',
    badgeClass: 'bg-amber-400/30 text-amber-100'
  },
  conditional: {
    icon: HelpCircle,
    badge: 'IT DEPENDS',
    bgClass: 'bg-gradient-to-r from-blue-600 to-blue-500',
    badgeClass: 'bg-blue-400/30 text-blue-100'
  }
};

// Detect verdict from answer text
function detectVerdict(answer: string | null): 'yes' | 'no' | 'not_yet' | 'conditional' {
  if (!answer) return 'conditional';
  const lower = answer.toLowerCase();
  if (lower.startsWith('yes') || lower.includes('you can')) return 'yes';
  if (lower.startsWith('no,') || lower.startsWith('no.') || lower.includes("can't") || lower.includes('cannot')) return 'no';
  if (lower.includes('not yet') || lower.includes('wait until') || lower.includes('unless')) return 'not_yet';
  return 'conditional';
}

export function TuesdayQuestionBanner({
  question,
  answer,
  verdict,
  conditions,
  linkedScenarioId,
  onRunScenario
}: TuesdayQuestionProps) {
  // Don't render if no question
  if (!question) {
    return null;
  }
  
  const detectedVerdict = verdict || detectVerdict(answer);
  const config = verdictConfig[detectedVerdict];
  const Icon = config.icon;
  
  return (
    <div className={`${config.bgClass} rounded-2xl p-6 text-white shadow-lg mb-6`}>
      <div className="flex items-start gap-4">
        <div className="p-2 bg-white/10 rounded-xl flex-shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase opacity-80">
              📅 Your Tuesday Question
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.badgeClass}`}>
              {config.badge}
            </span>
          </div>
          
          <p className="text-xl font-medium italic mb-4 leading-relaxed">
            "{question}"
          </p>
          
          {answer && (
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm leading-relaxed opacity-95">{answer}</p>
              
              {conditions && conditions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">
                    Conditions to watch:
                  </p>
                  <ul className="space-y-1">
                    {conditions.map((condition, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {linkedScenarioId && onRunScenario && (
                <button
                  onClick={() => onRunScenario(linkedScenarioId)}
                  className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                >
                  📊 Run the scenario →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TuesdayQuestionBanner;

