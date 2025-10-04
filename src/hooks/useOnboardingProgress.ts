import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type OnboardingStage = 
  | 'signup' 
  | 'assessment_1' 
  | 'assessment_2' 
  | 'board_selection' 
  | 'roadmap_generated' 
  | 'dashboard_setup' 
  | 'completed';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  business_type: string | null;
  timezone: string;
  onboarding_stage: OnboardingStage;
  assessment_completed: boolean;
  dashboard_configured: boolean;
  group_id: string | null;
  created_at: string;
  last_active: string;
}

interface OnboardingStep {
  step_id: string;
  completed: boolean;
  completed_at: string | null;
  data: any;
}

export function useOnboardingProgress() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile and onboarding progress
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        // Get or create user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // If no profile exists, create one
        if (!profileData) {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              email: user.email || '',
              onboarding_stage: 'signup'
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          setProfile(profileData);
        }

        // Fetch onboarding progress
        const { data: stepsData, error: stepsError } = await supabase
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', user.id);

        if (stepsError) throw stepsError;
        setOnboardingSteps(stepsData || []);

      } catch (err) {
        console.error('Error fetching onboarding data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load onboarding data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Update onboarding stage
  const updateOnboardingStage = async (stage: OnboardingStage) => {
    if (!user?.id || !profile) return;

    try {
      const updates = {
        onboarding_stage: stage,
        last_active: new Date().toISOString(),
        ...(stage === 'assessment_2' && { assessment_completed: true }),
        ...(stage === 'completed' && { dashboard_configured: true })
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating onboarding stage:', err);
      throw err;
    }
  };

  // Update profile data
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Save onboarding step progress
  const saveStepProgress = async (stepId: string, data?: any) => {
    if (!user?.id) return;

    try {
      const { data: stepData, error } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          step_id: stepId,
          completed: true,
          completed_at: new Date().toISOString(),
          data: data || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setOnboardingSteps(prev => {
        const existing = prev.find(s => s.step_id === stepId);
        if (existing) {
          return prev.map(s => s.step_id === stepId ? stepData : s);
        }
        return [...prev, stepData];
      });

      return stepData;
    } catch (err) {
      console.error('Error saving step progress:', err);
      throw err;
    }
  };

  // Check if a specific step is completed
  const isStepCompleted = (stepId: string) => {
    return onboardingSteps.some(step => step.step_id === stepId && step.completed);
  };

  // Get the next required stage based on current progress
  const getNextStage = (): OnboardingStage => {
    if (!profile) return 'signup';

    const stageOrder: OnboardingStage[] = [
      'signup',
      'assessment_1',
      'assessment_2',
      'board_selection',
      'roadmap_generated',
      'dashboard_setup',
      'completed'
    ];

    const currentIndex = stageOrder.indexOf(profile.onboarding_stage);
    if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
      return profile.onboarding_stage;
    }

    return stageOrder[currentIndex + 1];
  };

  // Check if user can access a specific stage
  const canAccessStage = (requiredStage: OnboardingStage): boolean => {
    if (!profile) return false;

    const stageOrder: OnboardingStage[] = [
      'signup',
      'assessment_1',
      'assessment_2',
      'board_selection',
      'roadmap_generated',
      'dashboard_setup',
      'completed'
    ];

    const currentIndex = stageOrder.indexOf(profile.onboarding_stage);
    const requiredIndex = stageOrder.indexOf(requiredStage);

    return currentIndex >= requiredIndex;
  };

  return {
    profile,
    onboardingSteps,
    loading,
    error,
    updateOnboardingStage,
    updateProfile,
    saveStepProgress,
    isStepCompleted,
    getNextStage,
    canAccessStage
  };
} 