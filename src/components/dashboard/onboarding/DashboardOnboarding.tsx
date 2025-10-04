import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleOnboarding } from '@/hooks/useSimpleOnboarding';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Import onboarding steps
import { WelcomeStep } from './steps/WelcomeStep';
import { DataImportStep } from './steps/DataImportStep';
import { MetricsConfigStep } from './steps/MetricsConfigStep';
import { BoardIntroStep } from './steps/BoardIntroStep';
import { FirstTaskStep } from './steps/FirstTaskStep';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Living Dashboard',
    description: 'Your business intelligence comes alive here',
    component: WelcomeStep
  },
  {
    id: 'import_data',
    title: 'Import Your Assessment Data',
    description: 'Let\'s bring over your business information',
    component: DataImportStep
  },
  {
    id: 'configure_metrics',
    title: 'Set Your Key Metrics',
    description: 'What should we track for you?',
    component: MetricsConfigStep
  },
  {
    id: 'meet_board',
    title: 'Meet Your AI Board',
    description: 'Your advisors are ready to help',
    component: BoardIntroStep
  },
  {
    id: 'first_task',
    title: 'Your First Focus',
    description: 'Let\'s set today\'s priority',
    component: FirstTaskStep
  }
];

export function DashboardOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    stage,
    completeStep,
    updateStage,
    isStepCompleted 
  } = useSimpleOnboarding();

  // Resume from last step if returning
  useEffect(() => {
    const lastCompletedIndex = ONBOARDING_STEPS.findIndex(
      step => !isStepCompleted(step.id)
    );
    if (lastCompletedIndex > 0) {
      setCurrentStep(lastCompletedIndex);
    }
  }, [isStepCompleted]);

  const handleStepComplete = async () => {
    const step = ONBOARDING_STEPS[currentStep];
    
    try {
      // Save step progress
      completeStep(step.id);
      
      if (currentStep < ONBOARDING_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete onboarding
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
    
    try {
      // Update onboarding stage to completed
      updateStage('completed');
      
      // Show success message
      toast.success('Welcome to your Oracle Dashboard! 🎉');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    if (window.confirm('Are you sure you want to skip the setup? You can always come back later.')) {
      await completeOnboarding();
    }
  };

  const CurrentStepComponent = ONBOARDING_STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-sm font-medium">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </h2>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Skip setup
            </button>
          </div>
          <div className="flex gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                  index <= currentStep 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Current step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20"
          >
            {/* Step header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {ONBOARDING_STEPS[currentStep].title}
              </h1>
              <p className="text-gray-300">
                {ONBOARDING_STEPS[currentStep].description}
              </p>
            </div>

            {/* Step component */}
            <CurrentStepComponent
              onComplete={handleStepComplete}
              onBack={currentStep > 0 ? () => setCurrentStep(currentStep - 1) : undefined}
              isLastStep={currentStep === ONBOARDING_STEPS.length - 1}
            />

            {/* Loading overlay */}
            {isCompleting && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                  <p className="text-white">Setting up your dashboard...</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 