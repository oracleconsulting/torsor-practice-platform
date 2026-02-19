// ============================================================================
// ValueStory — Three-column journey (started / current / heading)
// ============================================================================

import { ChevronRight, ChevronDown, Star } from 'lucide-react';

export interface ValueStoryProps {
  starting: {
    hours?: number;
    income?: number;
    painPoint?: string;
  };
  current: {
    tasksCompleted: number;
    completionRate: number;
    sprintNumber: number;
  };
  heading: {
    vision?: string;
    year1Goal?: string;
  };
}

export function ValueStory({ starting, current, heading }: ValueStoryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 relative">
        <span className="absolute top-3 right-3 text-xs font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Sprint 1</span>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Where you started</h3>
        {starting.hours != null && (
          <p className="text-gray-700">Working {starting.hours} hrs/week</p>
        )}
        {starting.income != null && (
          <p className="text-gray-700 mt-1">Earning £{starting.income.toLocaleString()}/month</p>
        )}
        {starting.painPoint && (
          <p className="text-gray-600 italic mt-3 text-sm">&ldquo;{starting.painPoint}&rdquo;</p>
        )}
        {!starting.hours && !starting.income && !starting.painPoint && (
          <p className="text-gray-400 text-sm">Your starting point from Part 1</p>
        )}
      </div>

      <div className="hidden md:flex items-center justify-center text-gray-300">
        <ChevronRight className="w-8 h-8" />
      </div>
      <div className="flex md:hidden items-center justify-center text-gray-300 -my-2">
        <ChevronDown className="w-6 h-6" />
      </div>

      <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 relative">
        <span className="absolute top-3 right-3 text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Sprint {current.sprintNumber}</span>
        <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-3">Where you are</h3>
        <p className="text-indigo-900 font-medium">{current.tasksCompleted} tasks completed</p>
        <p className="text-indigo-700 mt-1">{current.completionRate}% on track</p>
      </div>

      <div className="hidden md:flex items-center justify-center text-gray-300">
        <ChevronRight className="w-8 h-8" />
      </div>
      <div className="flex md:hidden items-center justify-center text-gray-300 -my-2">
        <ChevronDown className="w-6 h-6" />
      </div>

      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
        <div className="flex items-center gap-2 text-indigo-600 mb-3">
          <Star className="w-4 h-4" />
          <h3 className="text-sm font-semibold uppercase tracking-wide">Where you&apos;re heading</h3>
        </div>
        {heading.vision && <p className="text-indigo-900 text-sm">{heading.vision}</p>}
        {heading.year1Goal && <p className="text-indigo-700 text-sm mt-2 font-medium">Year 1: {heading.year1Goal}</p>}
        {!heading.vision && !heading.year1Goal && (
          <p className="text-indigo-500 text-sm">Your vision from your roadmap</p>
        )}
      </div>
    </div>
  );
}
