'use client';

import { HelpCircle, MessageSquare, Calculator, BarChart3 } from 'lucide-react';

interface TuesdayQuestionDisplayProps {
  question: string;
  answer?: string;
  answerFormat?: 'text' | 'calculation' | 'scenario' | 'chart';
  askedAt?: string;
  compact?: boolean;
}

const FORMAT_ICONS = {
  text: MessageSquare,
  calculation: Calculator,
  scenario: BarChart3,
  chart: BarChart3,
};

export function TuesdayQuestionDisplay({ 
  question, 
  answer, 
  answerFormat = 'text',
  askedAt,
  compact = false
}: TuesdayQuestionDisplayProps) {
  const FormatIcon = FORMAT_ICONS[answerFormat] || MessageSquare;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900">Your Tuesday Question</p>
            <p className="text-sm text-blue-700 mt-1">"{question}"</p>
            {answer && (
              <p className="text-sm text-slate-700 mt-2 line-clamp-2">{answer}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-blue-200/50 bg-white/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-blue-900">Your Tuesday Question</h3>
          </div>
          {askedAt && (
            <span className="text-xs text-blue-600">
              Asked {new Date(askedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="px-6 py-5">
        <blockquote className="text-lg text-blue-800 font-medium italic border-l-4 border-blue-400 pl-4">
          "{question}"
        </blockquote>
      </div>

      {/* Answer */}
      {answer && (
        <div className="px-6 pb-6">
          <div className="bg-white/60 rounded-xl p-5 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <FormatIcon className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                The Answer
              </span>
            </div>
            
            <div className="prose prose-sm prose-slate max-w-none">
              {answer.split('\n').map((paragraph, idx) => (
                <p key={idx} className="text-slate-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No answer yet */}
      {!answer && (
        <div className="px-6 pb-6">
          <div className="bg-white/40 rounded-xl p-5 border border-blue-100 text-center">
            <p className="text-sm text-blue-600">
              We're working on your answer...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TuesdayQuestionDisplay;

