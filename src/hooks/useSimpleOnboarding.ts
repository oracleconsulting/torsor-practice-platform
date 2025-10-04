import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export type OnboardingStage = 
  | 'signup' 
  | 'assessment_1' 
  | 'assessment_2' 
  | 'board_selection' 
  | 'roadmap_generated' 
  | 'dashboard_setup' 
  | 'completed';

interface SimpleOnboardingState {
  stage: OnboardingStage;
  completedSteps: string[];
  groupId: string | null;
}

const STORAGE_KEY = 'oracle_onboarding_state';

export function useSimpleOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<SimpleOnboardingState>(() => {
    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing onboarding state:', e);
      }
    }
    return {
      stage: 'signup',
      completedSteps: [],
      groupId: null
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, user?.id]);

  const updateStage = (newStage: OnboardingStage) => {
    setState(prev => ({
      ...prev,
      stage: newStage
    }));
  };

  const completeStep = (stepId: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, stepId])]
    }));
  };

  const setGroupId = (groupId: string) => {
    setState(prev => ({
      ...prev,
      groupId
    }));
  };

  const canAccessStage = (requiredStage: OnboardingStage): boolean => {
    const stageOrder: OnboardingStage[] = [
      'signup',
      'assessment_1',
      'assessment_2',
      'board_selection',
      'roadmap_generated',
      'dashboard_setup',
      'completed'
    ];

    const currentIndex = stageOrder.indexOf(state.stage);
    const requiredIndex = stageOrder.indexOf(requiredStage);

    return currentIndex >= requiredIndex;
  };

  const getNextRoute = (): string => {
    switch (state.stage) {
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
  };

  const navigateToNext = () => {
    const nextRoute = getNextRoute();
    navigate(nextRoute);
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      stage: 'signup',
      completedSteps: [],
      groupId: null
    });
  };

  return {
    stage: state.stage,
    completedSteps: state.completedSteps,
    groupId: state.groupId,
    updateStage,
    completeStep,
    setGroupId,
    canAccessStage,
    getNextRoute,
    navigateToNext,
    reset,
    isStepCompleted: (stepId: string) => state.completedSteps.includes(stepId)
  };
} 