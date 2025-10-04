import React, { useState, useCallback, useEffect } from 'react';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { Part2AssessmentForm } from '@/components/assessment/Part2AssessmentForm';

export const AssessmentPart2Container = () => {
  const { progress, savePart2Progress, loading } = useAssessmentProgress();
  const [localResponses, setLocalResponses] = useState<Record<string, any>>({});
  
  console.log('[AssessmentPart2Container] Component rendering:', {
    loading,
    progressKeys: Object.keys(progress || {}),
    localResponsesCount: Object.keys(localResponses).length,
    timestamp: new Date().toISOString()
  });
  
  // Sync local responses with progress data
  useEffect(() => {
    if (progress.part2Answers && Object.keys(progress.part2Answers).length > 0) {
      console.log('[Part2Container] Syncing responses from progress:', progress.part2Answers);
      setLocalResponses(progress.part2Answers);
    }
  }, [progress.part2Answers]);

  const handleResponsesUpdate = async (newResponses: Record<string, any>) => {
    console.log('[Part2Container] Saving responses:', {
      count: Object.keys(newResponses).length,
      sample: Object.entries(newResponses).slice(0, 3)
    });
    
    setLocalResponses(newResponses);
    
    // Save to database
    try {
      await savePart2Progress(newResponses);
      console.log('[Part2Container] Saved successfully');
    } catch (error) {
      console.error('[Part2Container] Save failed:', error);
      // Show error toast to user
    }
  };

  if (loading) {
    console.log('[AssessmentPart2Container] Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  console.log('[AssessmentPart2Container] Rendering main content');
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Part 2: Detailed Assessment</h1>
        <p className="text-sm text-gray-600 mt-1">
          {Object.keys(localResponses).length} answers saved
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <Part2AssessmentForm 
          currentSectionIndex={progress.currentPart2Section || 0}
          singleSectionMode={false}
          onResponsesUpdate={handleResponsesUpdate}
          initialResponses={localResponses} // Pass the responses
        />
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
        <div id="progress-indicator-container" className="w-full" />
      </div>
    </div>
  );
};