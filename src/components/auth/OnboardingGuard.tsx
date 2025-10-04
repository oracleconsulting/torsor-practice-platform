import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingProgress, OnboardingStage } from '@/hooks/useOnboardingProgress';
import { Loader2 } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
  requiredStage?: OnboardingStage;
  redirectTo?: string;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ 
  children, 
  requiredStage,
  redirectTo 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, canAccessStage } = useOnboardingProgress();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !profileLoading && profile) {
      // Check if user has access to the required stage
      if (requiredStage && !canAccessStage(requiredStage)) {
        // Redirect to the appropriate stage based on their current progress
        const redirectPath = getRedirectPath(profile.onboarding_stage);
        navigate(redirectPath);
      }
    }
  }, [authLoading, profileLoading, profile, requiredStage, navigate, canAccessStage]);

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If no profile yet, wait for it to be created
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have access to required stage, they'll be redirected by useEffect
  // Otherwise, render children
  return <>{children}</>;
};

// Helper function to determine where to redirect based on current stage
function getRedirectPath(currentStage: OnboardingStage): string {
  switch (currentStage) {
    case 'signup':
      return '/assessment/part1';
    case 'assessment_1':
      return '/assessment/part2';
    case 'assessment_2':
      return '/board-selection';
    case 'board_selection':
      return '/roadmap-generation';
    case 'roadmap_generated':
      return '/dashboard/setup';
    case 'dashboard_setup':
    case 'completed':
      return '/dashboard';
    default:
      return '/assessment/part1';
  }
} 