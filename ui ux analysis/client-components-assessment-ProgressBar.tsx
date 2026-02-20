// ============================================================================
// ASSESSMENT PROGRESS BAR
// ============================================================================
// Visual progress indicator for assessments with section breakdown

import React from 'react';

interface Section {
  id: string | number;
  title: string;
  shortTitle?: string;
  questions: any[];
}

interface ProgressBarProps {
  currentSection: number;
  totalSections: number;
  currentQuestion: number;
  totalQuestions: number;
  sections?: Section[];
  showSections?: boolean;
}

export function ProgressBar({
  currentSection,
  totalSections,
  currentQuestion,
  totalQuestions,
  sections,
  showSections = true
}: ProgressBarProps) {
  const overallProgress = Math.round((currentQuestion / totalQuestions) * 100);
  const sectionProgress = sections 
    ? Math.round((currentSection / sections.length) * 100)
    : overallProgress;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Overall Progress</span>
          <span className="text-emerald-400 font-medium">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="text-xs text-slate-500">
          Question {currentQuestion} of {totalQuestions}
        </div>
      </div>

      {/* Section Pills */}
      {showSections && sections && sections.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sections.map((section, index) => {
            const isComplete = index < currentSection;
            const isCurrent = index === currentSection;
            
            return (
              <div
                key={section.id}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${isComplete 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : isCurrent
                      ? 'bg-slate-700 text-white border border-slate-500'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
              >
                {isComplete && (
                  <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {section.shortTitle || section.title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Minimal version for Part 1 (single questions, no sections)
export function SimpleProgressBar({
  current,
  total
}: {
  current: number;
  total: number;
}) {
  const progress = Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Question {current} of {total}</span>
        <span className="text-emerald-400 font-medium">{progress}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Dot-style progress for conversational Part 1
export function DotProgress({
  current,
  total
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const isComplete = i < current;
        const isCurrent = i === current;
        
        return (
          <div
            key={i}
            className={`transition-all duration-300
              ${isComplete 
                ? 'w-2 h-2 rounded-full bg-emerald-500' 
                : isCurrent
                  ? 'w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20'
                  : 'w-2 h-2 rounded-full bg-slate-600'
              }`}
          />
        );
      })}
    </div>
  );
}

export default ProgressBar;

