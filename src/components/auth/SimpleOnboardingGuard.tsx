import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleOnboarding, OnboardingStage } from '@/hooks/useSimpleOnboarding';
import { Loader2 } from 'lucide-react';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';

interface SimpleOnboardingGuardProps {
  children: React.ReactNode;
  requiredStage?: OnboardingStage;
}

export const SimpleOnboardingGuard: React.FC<SimpleOnboardingGuardProps> = ({ 
  children, 
  requiredStage 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { stage, canAccessStage, getNextRoute } = useSimpleOnboarding();
  const { progress } = useAssessmentProgress();
  const location = useLocation();

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has access to the required stage
  if (requiredStage && !canAccessStage(requiredStage)) {
    // Redirect to the appropriate stage
    const redirectPath = getNextRoute();
    return <Navigate to={redirectPath} replace />;
  }

  if (requiredStage === "completed" && location.pathname === "/dashboard") {
    return <>{children}</>;
  }

  // Render children
  return <>{children}</>;
}; 