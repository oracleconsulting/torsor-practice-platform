/**
 * Pending Assessment Banner
 * Shows notifications for incomplete assessments (VARK, Skills, etc.)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, GraduationCap, Play, X } from 'lucide-react';
import { useState } from 'react';

interface PendingAssessmentBannerProps {
  memberData?: {
    vark_assessment_completed?: boolean;
    skills_assessment_progress?: number;
    name?: string;
  };
}

export const PendingAssessmentBanner: React.FC<PendingAssessmentBannerProps> = ({ memberData }) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>(() => {
    // Load dismissed banners from localStorage
    const stored = localStorage.getItem('dismissed_assessment_banners');
    return stored ? JSON.parse(stored) : [];
  });

  const handleDismiss = (bannerId: string) => {
    const newDismissed = [...dismissed, bannerId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_assessment_banners', JSON.stringify(newDismissed));
  };

  const varkIncomplete = !memberData?.vark_assessment_completed;
  const skillsIncomplete = (memberData?.skills_assessment_progress || 0) < 100;

  // Don't show if no pending assessments or all dismissed
  if ((!varkIncomplete && !skillsIncomplete) || 
      (varkIncomplete && dismissed.includes('vark')) ||
      (skillsIncomplete && dismissed.includes('skills'))) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Skills Assessment Banner */}
      {skillsIncomplete && !dismissed.includes('skills') && (
        <Alert className="bg-purple-900/20 border-purple-500/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Play className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <AlertDescription className="text-white font-medium">
                  <span className="font-bold">Action Required:</span> Complete your Skills Assessment to unlock personalized training recommendations and development plans.
                  {memberData?.skills_assessment_progress && (
                    <span className="block mt-1 text-sm">
                      {Math.round(memberData.skills_assessment_progress)}% complete
                    </span>
                  )}
                </AlertDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => navigate('/team/skills-assessment')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Continue Assessment
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss('skills')}
                className="text-white hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* VARK Assessment Banner */}
      {varkIncomplete && !dismissed.includes('vark') && !skillsIncomplete && (
        <Alert className="bg-green-900/20 border-green-500/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <GraduationCap className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <AlertDescription className="text-white font-bold" style={{ color: '#ffffff' }}>
                  <span className="font-bold">Next Step:</span> Discover your learning style with the VARK Assessment. 
                  This helps us tailor training recommendations to match how you learn best. 
                  <span className="block mt-1 text-sm text-white font-bold" style={{ color: '#ffffff' }}>Takes only 5 minutes • Visual, Auditory, Reading, Kinesthetic</span>
                </AlertDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  console.log('[PendingAssessmentBanner] Navigating to VARK assessment...');
                  console.log('[PendingAssessmentBanner] Target path: /team-portal/vark-assessment');
                  navigate('/team-portal/vark-assessment');
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                Take VARK Assessment
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss('vark')}
                className="text-white hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default PendingAssessmentBanner;

