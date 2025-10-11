/**
 * OnboardingHub Page
 * PROMPT 6: Onboarding Checklist System
 * 
 * Main onboarding flow with 7 sequential steps
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Save,
  SkipForward,
  Home,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Components
import { OnboardingProgress } from '@/components/accountancy/team/OnboardingProgress';
import { OnboardingChecklist, ChecklistItem } from '@/components/accountancy/team/OnboardingChecklist';
import { WelcomeVideo } from '@/components/accountancy/team/WelcomeVideo';
import { TeamDirectory } from '@/components/accountancy/team/TeamDirectory';

// API
import {
  getOnboardingProgress,
  updateOnboardingProgress,
  completeOnboardingStep,
  saveCheckpoint,
  skipOnboardingStep,
  generateCertificate,
  getMemberBadges,
  type OnboardingProgress as OnboardingProgressType
} from '@/lib/api/onboarding';

const OnboardingHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgressType | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('step-1');
  const [badges, setBadges] = useState<any[]>([]);
  const [stepStartTime, setStepStartTime] = useState<Date>(new Date());

  // Mock user data (replace with actual user context)
  const currentUserId = 'user-123';
  const practiceId = 'practice-456';

  // Step definitions
  const steps = [
    {
      number: 1,
      id: 'step-1',
      title: 'Profile Completion',
      completed: progress?.step_1_profile_completed || false,
      estimatedMinutes: 10
    },
    {
      number: 2,
      id: 'step-2',
      title: 'Skills Self-Assessment',
      completed: progress?.step_2_skills_assessment_completed || false,
      estimatedMinutes: 15
    },
    {
      number: 3,
      id: 'step-3',
      title: 'VARK Assessment',
      completed: progress?.step_3_vark_assessment_completed || false,
      estimatedMinutes: 10
    },
    {
      number: 4,
      id: 'step-4',
      title: 'CPD Requirements Review',
      completed: progress?.step_4_cpd_review_completed || false,
      estimatedMinutes: 15
    },
    {
      number: 5,
      id: 'step-5',
      title: 'Mentor Assignment',
      completed: progress?.step_5_mentor_assignment_completed || false,
      estimatedMinutes: 10
    },
    {
      number: 6,
      id: 'step-6',
      title: 'First Development Plan',
      completed: progress?.step_6_dev_plan_completed || false,
      estimatedMinutes: 20
    },
    {
      number: 7,
      id: 'step-7',
      title: 'Team Introduction',
      completed: progress?.step_7_team_intro_completed || false,
      estimatedMinutes: 15
    }
  ];

  // Load progress on mount
  useEffect(() => {
    loadProgress();
    loadBadges();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    const progressData = await getOnboardingProgress(currentUserId, practiceId);
    if (progressData) {
      setProgress(progressData);
      // Set current tab to current step
      setCurrentTab(`step-${progressData.current_step}`);
    }
    setLoading(false);
  };

  const loadBadges = async () => {
    const badgeData = await getMemberBadges(currentUserId);
    setBadges(badgeData);
  };

  const handleCompleteStep = async (stepNumber: number) => {
    if (!progress) return;

    const now = new Date();
    const timeSpentMinutes = Math.round((now.getTime() - stepStartTime.getTime()) / 60000);
    const points = 100; // Full points for completing

    const success = await completeOnboardingStep(
      progress.id,
      stepNumber,
      timeSpentMinutes,
      points
    );

    if (success) {
      await loadProgress();
      await loadBadges();
      
      // Move to next step or finish
      if (stepNumber < 7) {
        setCurrentTab(`step-${stepNumber + 1}`);
        setStepStartTime(new Date());
      } else {
        // All steps complete - generate certificate
        await handleGenerateCertificate();
      }
    }
  };

  const handleSkipStep = async (stepNumber: number) => {
    if (!progress) return;

    const success = await skipOnboardingStep(progress.id, stepNumber);
    if (success) {
      await loadProgress();
      if (stepNumber < 7) {
        setCurrentTab(`step-${stepNumber + 1}`);
        setStepStartTime(new Date());
      }
    }
  };

  const handleSaveProgress = async () => {
    if (!progress) return;

    setSaving(true);
    await saveCheckpoint(progress.id, {
      current_tab: currentTab,
      timestamp: new Date().toISOString()
    });
    setSaving(false);
  };

  const handleGenerateCertificate = async () => {
    if (!progress) return;

    const result = await generateCertificate(currentUserId, progress.id);
    if (result.success) {
      // Show success message and certificate
      alert('Congratulations! Your onboarding certificate has been generated!');
    }
  };

  const handleTabChange = (value: string) => {
    const stepNumber = parseInt(value.split('-')[1]);
    if (progress && stepNumber <= progress.current_step) {
      setCurrentTab(value);
      setStepStartTime(new Date());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your onboarding progress...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-12">
        <p>Unable to load onboarding progress. Please try again.</p>
      </div>
    );
  }

  const currentStepNumber = steps.find(s => s.id === currentTab)?.number || 1;
  const isLastStep = currentStepNumber === 7;
  const isStepCompleted = steps.find(s => s.number === currentStepNumber)?.completed || false;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to the Team! 🎉</h1>
            <p className="text-muted-foreground">
              Complete these 7 steps to unlock all features and start earning badges
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveProgress} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Progress'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/accountancy/team-portal')}>
              <Home className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>

        {/* Progress Component */}
        <OnboardingProgress
          currentStep={progress.current_step}
          totalSteps={progress.total_steps}
          completionPercentage={progress.completion_percentage}
          totalPoints={progress.total_points}
          badgesEarned={badges.map(b => b.badge.name)}
          timeSpentMinutes={progress.time_spent_minutes}
          steps={steps}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Step Navigator */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Steps</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => handleTabChange(step.id)}
                    disabled={step.number > progress.current_step}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      currentTab === step.id
                        ? 'bg-primary text-primary-foreground'
                        : step.completed
                        ? 'hover:bg-green-50 dark:hover:bg-green-900/20'
                        : step.number <= progress.current_step
                        ? 'hover:bg-muted'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          currentTab === step.id ? 'border-white' : 'border-muted-foreground'
                        }`}>
                          <span className="text-xs">{step.number}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{step.title}</div>
                      <div className="text-xs opacity-75">{step.estimatedMinutes}min</div>
                    </div>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Badges Earned */}
          {badges.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Badges Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                    >
                      <span className="text-2xl">{b.badge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{b.badge.name}</div>
                        <div className="text-xs text-muted-foreground">+{b.points_awarded} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="hidden">
              {steps.map((step) => (
                <TabsTrigger key={step.id} value={step.id}>
                  {step.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Step 1: Profile Completion */}
            <TabsContent value="step-1">
              <StepProfileCompletion
                onComplete={() => handleCompleteStep(1)}
                onSkip={() => handleSkipStep(1)}
                isCompleted={steps[0].completed}
              />
            </TabsContent>

            {/* Step 2: Skills Assessment */}
            <TabsContent value="step-2">
              <StepSkillsAssessment
                onComplete={() => handleCompleteStep(2)}
                isCompleted={steps[1].completed}
              />
            </TabsContent>

            {/* Step 3: VARK Assessment */}
            <TabsContent value="step-3">
              <StepVARKAssessment
                onComplete={() => handleCompleteStep(3)}
                isCompleted={steps[2].completed}
              />
            </TabsContent>

            {/* Step 4: CPD Review */}
            <TabsContent value="step-4">
              <StepCPDReview
                onComplete={() => handleCompleteStep(4)}
                onSkip={() => handleSkipStep(4)}
                isCompleted={steps[3].completed}
              />
            </TabsContent>

            {/* Step 5: Mentor Assignment */}
            <TabsContent value="step-5">
              <StepMentorAssignment
                onComplete={() => handleCompleteStep(5)}
                onSkip={() => handleSkipStep(5)}
                isCompleted={steps[4].completed}
              />
            </TabsContent>

            {/* Step 6: Development Plan */}
            <TabsContent value="step-6">
              <StepDevelopmentPlan
                onComplete={() => handleCompleteStep(6)}
                isCompleted={steps[5].completed}
              />
            </TabsContent>

            {/* Step 7: Team Introduction */}
            <TabsContent value="step-7">
              <StepTeamIntroduction
                onComplete={() => handleCompleteStep(7)}
                isCompleted={steps[6].completed}
              />
            </TabsContent>
          </Tabs>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => {
                const prevStep = currentStepNumber - 1;
                if (prevStep >= 1) {
                  setCurrentTab(`step-${prevStep}`);
                }
              }}
              disabled={currentStepNumber === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {!isStepCompleted ? (
              <Button
                onClick={() => handleCompleteStep(currentStepNumber)}
                className="ml-auto"
              >
                {isLastStep ? 'Complete Onboarding' : 'Complete & Continue'}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (isLastStep) {
                    navigate('/accountancy/team-portal');
                  } else {
                    setCurrentTab(`step-${currentStepNumber + 1}`);
                  }
                }}
                className="ml-auto"
              >
                {isLastStep ? 'Go to Dashboard' : 'Next Step'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Step Components
const StepProfileCompletion: React.FC<{
  onComplete: () => void;
  onSkip: () => void;
  isCompleted: boolean;
}> = ({ onComplete, onSkip, isCompleted }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'profile-photo',
      title: 'Upload profile photo',
      description: 'Add a professional photo or avatar',
      completed: false,
      required: false,
      estimatedMinutes: 2,
      canSkip: true,
      skipReason: 'You can add this later from your profile settings'
    },
    {
      id: 'contact-info',
      title: 'Complete contact information',
      description: 'Email, phone number, and location',
      completed: false,
      required: true,
      estimatedMinutes: 3,
      canSkip: false
    },
    {
      id: 'bio',
      title: 'Write a short bio',
      description: 'Tell your team about yourself',
      completed: false,
      required: false,
      estimatedMinutes: 5,
      canSkip: true
    }
  ]);

  const handleToggleItem = (itemId: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleSkipItem = (itemId: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, completed: true } : item
      )
    );
  };

  const allComplete = checklist.every(item => item.completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Step 1: Profile Completion
          {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <WelcomeVideo
          title="Welcome to the Team!"
          description="Watch this brief introduction to learn about our culture and values."
          duration="3:45"
          isCompleted={isCompleted}
        />

        <OnboardingChecklist
          items={checklist}
          onToggleItem={handleToggleItem}
          onSkipItem={handleSkipItem}
          currentStepNumber={1}
        />

        {allComplete && !isCompleted && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Great job! Click "Complete & Continue" to move to the next step.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const StepSkillsAssessment: React.FC<{
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ onComplete, isCompleted }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Step 2: Skills Self-Assessment
          {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Complete your skills assessment to help us understand your expertise.</p>
        <Button onClick={() => window.open('/accountancy/team-portal/skills-assessment', '_blank')}>
          Start Skills Assessment →
        </Button>
      </CardContent>
    </Card>
  );
};

const StepVARKAssessment: React.FC<{
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ onComplete, isCompleted }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Step 3: VARK Learning Style Assessment
          {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Discover your learning style to personalize your training.</p>
        <Button onClick={() => window.open('/accountancy/team-portal/vark-assessment', '_blank')}>
          Start VARK Assessment →
        </Button>
      </CardContent>
    </Card>
  );
};

const StepCPDReview: React.FC<{
  onComplete: () => void;
  onSkip: () => void;
  isCompleted: boolean;
}> = ({ onComplete, onSkip, isCompleted }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Step 4: CPD Requirements Review
          {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Review your Continuing Professional Development requirements.</p>
        <Button onClick={() => window.open('/accountancy/team-portal/cpd-tracker', '_blank')}>
          View CPD Requirements →
        </Button>
      </CardContent>
    </Card>
  );
};

const StepMentorAssignment: React.FC<{
  onComplete: () => void;
  onSkip: () => void;
  isCompleted: boolean;
}> = ({ onComplete, onSkip, isCompleted }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Step 5: Mentor Assignment
          {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Connect with a mentor who can guide your development.</p>
        <Button onClick={() => window.open('/accountancy/team-portal/mentoring', '_blank')}>
          Find a Mentor →
        </Button>
      </CardContent>
    </Card>
  );
};

const StepDevelopmentPlan: React.FC<{
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ onComplete, isCompleted }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Step 6: First Development Plan
          {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Create your first 90-day development plan.</p>
        <Button onClick={onComplete}>
          Create Development Plan →
        </Button>
      </CardContent>
    </Card>
  );
};

const StepTeamIntroduction: React.FC<{
  onComplete: () => void;
  isCompleted: boolean;
}> = ({ onComplete, isCompleted }) => {
  // Mock team data
  const mockTeam = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Accountant',
      department: 'Tax',
      email: 'sarah.j@example.com',
      expertise: ['Tax Planning', 'Corporate Tax', 'VAT'],
      isMentor: true,
      funFact: 'I love hiking and have climbed 15 peaks this year!'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Audit Manager',
      department: 'Audit',
      email: 'michael.c@example.com',
      expertise: ['Financial Audit', 'Risk Assessment', 'Compliance'],
      isMentor: true,
      funFact: 'Coffee enthusiast - I roast my own beans!'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Step 7: Meet Your Team
          {isCompleted && <Badge className="bg-green-500">Completed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TeamDirectory
          members={mockTeam}
          onConnect={(id) => console.log('Connect with:', id)}
          onMessage={(id) => console.log('Message:', id)}
          showConnectButtons={true}
        />
      </CardContent>
    </Card>
  );
};

export default OnboardingHubPage;

