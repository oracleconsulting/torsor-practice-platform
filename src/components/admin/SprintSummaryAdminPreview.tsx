// ============================================================================
// SprintSummaryAdminPreview — Admin view of generated sprint summary
// ============================================================================
// Used in ClientDetailModal Roadmap tab for review/approve/regenerate
// ============================================================================

import React from 'react';

interface SprintSummaryAdminPreviewProps {
  content: {
    summary?: any;
    analytics?: any;
    generatedAt?: string;
    sprintNumber?: number;
  } | null;
}

export function SprintSummaryAdminPreview({ content }: SprintSummaryAdminPreviewProps) {
  if (!content?.summary) {
    return (
      <div className="text-sm text-gray-500 italic py-4">
        No summary content to preview
      </div>
    );
  }

  const s = content.summary;
  const a = content.analytics || {};
  const narrative = s.transformationNarrative || {};
  const tuesday = s.tuesdayTestComparison || {};
  const renewal = s.renewalRecommendations || {};

  return (
    <div className="space-y-4 text-sm">
      {s.headlineAchievement && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Headline</p>
          <p className="text-gray-900 font-medium">{s.headlineAchievement}</p>
        </div>
      )}
      {s.clientMessage && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r">
          <p className="text-xs font-medium text-indigo-700 uppercase tracking-wide mb-1">Client message</p>
          <p className="text-gray-800 whitespace-pre-wrap">{s.clientMessage}</p>
        </div>
      )}
      {(narrative.opening || narrative.journey || narrative.closing) && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Transformation narrative</p>
          <div className="space-y-2 text-gray-700">
            {narrative.opening && <p>{narrative.opening}</p>}
            {narrative.journey && <p>{narrative.journey}</p>}
            {narrative.closing && <p>{narrative.closing}</p>}
          </div>
        </div>
      )}
      {(tuesday.original || tuesday.progress || tuesday.gap) && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tuesday Test</p>
          <div className="grid grid-cols-2 gap-3 text-gray-700">
            {tuesday.original && <p><strong>Original:</strong> {tuesday.original}</p>}
            {tuesday.progress && <p><strong>Progress:</strong> {tuesday.progress}</p>}
          </div>
          {tuesday.gap && <p className="mt-2 text-gray-600">{tuesday.gap}</p>}
        </div>
      )}
      {a.totalTasks != null && (
        <div className="flex gap-4 text-gray-600">
          <span>{a.completedTasks}/{a.totalTasks} completed</span>
          <span>{a.completionRate}% completion rate</span>
          {a.catchUpWeeks?.length > 0 && (
            <span>Catch-up weeks: {a.catchUpWeeks.join(', ')}</span>
          )}
        </div>
      )}
      {renewal.focusAreas?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sprint 2 focus</p>
          <ul className="list-disc list-inside text-gray-700">
            {renewal.focusAreas.map((area: string, i: number) => (
              <li key={i}>{area}</li>
            ))}
          </ul>
        </div>
      )}
      {content.generatedAt && (
        <p className="text-xs text-gray-400">
          Generated {new Date(content.generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
