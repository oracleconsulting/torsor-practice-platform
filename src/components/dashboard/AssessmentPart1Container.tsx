import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { assessmentQuestions } from '@/data/assessmentQuestions';
import { QuestionRenderer } from '@/components/assessment/QuestionRenderer';
import { AssessmentPart1Review } from '@/components/dashboard/AssessmentPart1Review';
import { CheckCircle, ArrowLeft, ArrowRight, Loader2, Mail, Trash2, Clock, Brain } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AssessmentApiService } from '@/services/assessmentApiService';
import { AssessmentDatabaseService } from '@/services/assessmentDatabaseService';
import { BackToDashboard } from '@/components/assessment/BackToDashboard';
import { toast } from 'sonner';

export const AssessmentPart1Container = () => {
  const { user } = useAuth();
  const { progress, savePart1Answer, completePart1, clearAllData } = useAssessmentProgress();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [groupId, setGroupId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const mode = searchParams.get('mode');
  
  // Initialize local state from progress
  useEffect(() => {
    if (progress.part1Answers) {
      setAnswers(progress.part1Answers);
    }
    if (progress.group_id) {
      setGroupId(progress.group_id);
    }
  }, [progress.part1Answers, progress.group_id]);
  
  // Show message if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-2xl text-oracle-navy font-bold mb-4">You must be signed in to access the assessment.</p>
          <Button onClick={() => navigate('/auth')} className="bg-oracle-navy text-white">Sign In</Button>
        </div>
      </div>
    );
  }

  // Filter questions based on conditional logic
  const getVisibleQuestions = () => {
    return assessmentQuestions.filter(question => {
      if (!question.conditional) return true;
      
      const dependentAnswer = progress.part1Answers[question.conditional.dependsOn];
      const showWhen = question.conditional.showWhen;
      
      if (Array.isArray(showWhen)) {
        return showWhen.includes(dependentAnswer);
      }
      return dependentAnswer === showWhen;
    });
  };

  const visibleQuestions = getVisibleQuestions();
  
  // Show message if there are no visible questions
  if (!visibleQuestions || visibleQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-2xl text-oracle-navy font-bold mb-4">No assessment questions available.</p>
          <Button onClick={() => navigate('/dashboard')} className="bg-oracle-navy text-white">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // If in review mode, show the review component
  if (mode === 'review') {
    return <AssessmentPart1Review onComplete={() => navigate('/dashboard')} />;
  }

  // Helper function to handle back to dashboard navigation
  const handleBackToDashboard = () => {
    console.log('Back to Dashboard clicked');
    navigate('/dashboard');
  };

  // If already completed, show completion state with prominent fit message
  if (progress.part1Complete && !showSuccess) {
    return (
      <div className="space-y-6">
        {/* Back to Dashboard Button */}
        <div className="flex justify-start">
          <BackToDashboard />
        </div>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <CardTitle className="text-green-800">Foundation Assessment Complete!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-6">
              Great work! You've completed the foundation assessment. Here's your personalized assessment result:
            </p>
            
            {/* PROMINENT FIT MESSAGE DISPLAY */}
            {(completionData?.fit_message || progress.fitMessage) && (
              <div className="bg-white p-6 rounded-lg border-2 border-oracle-gold shadow-md mb-6">
                <h3 className="text-xl font-bold text-oracle-navy mb-4 text-center">Your Assessment Result</h3>
                <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                  {(completionData?.fit_message || progress.fitMessage).split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-3">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {completionData?.partner_invites_sent && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Mail className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  Partner invitations have been sent to the email addresses you provided.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons - Fixed Back to Dashboard button */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button
                onClick={handleBackToDashboard}
                className="bg-oracle-navy hover:bg-oracle-navy/90 text-white flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              
              <Button
                onClick={() => navigate('/assessment/part2')}
                className="bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy flex items-center gap-2"
              >
                Continue to Part 2
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Delete All Data Section */}
            <div className="border-t pt-6 mt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Reset Assessment Data</h4>
                <p className="text-sm text-red-600 mb-3">
                  If you need to start completely fresh, you can delete all your assessment data. 
                  This action cannot be undone.
                </p>
                <Button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all assessment data? This cannot be undone.')) {
                      clearAllData();
                      handleBackToDashboard();
                    }
                  }}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = visibleQuestions[currentQuestion];
  const totalQuestions = visibleQuestions.length;
  const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleAnswerChange = useCallback(async (questionId: string, value: any) => {
    console.log('Answer changed:', questionId, value);
    
    setAnswers(prevAnswers => {
      const updatedAnswers = { ...prevAnswers, [questionId]: value };
      
      // Save to localStorage as backup
      localStorage.setItem('assessmentResponses', JSON.stringify(updatedAnswers));
      
      // Also update the progress hook state
      savePart1Answer(questionId, value);
      
      // Save to database with proper error handling
      (async () => {
        try {
          console.log('Calling AssessmentDatabaseService.savePart1...');
          console.log('Parameters:', {
            userId: user.id,
            email: user.email,
            answersCount: Object.keys(updatedAnswers).length,
            groupId: groupId || 'will be generated'
          });
          
          const result = await AssessmentDatabaseService.savePart1(
            user.id,
            user.email,
            updatedAnswers,
            groupId || undefined
          );
          
          console.log('Save successful:', result);
          
          // Update groupId if it was generated
          if (result?.group_id && !groupId) {
            setGroupId(result.group_id);
            localStorage.setItem('assessmentGroupId', result.group_id);
          }
          
        } catch (error: any) {
          console.error('Error saving answer:', error);
          
          // Check for specific error types
          if (error?.code === '42P10') {
            console.error('Database constraint error - user_id might be null');
            toast.error('Authentication error. Please refresh the page and try again.');
          } else if (error?.message?.includes('JWT')) {
            toast.error('Session expired. Please sign in again.');
            navigate('/auth');
          } else {
            // Don't show error toast for every save - just log it
            console.warn('Background save failed, will retry on next change');
          }
        }
      })();
      
      return updatedAnswers;
    });
  }, [user, groupId, savePart1Answer, navigate]);

  const canProceed = () => {
    if (!currentQ.required) return true;
    const answer = answers[currentQ.id];
    return !!(answer && (typeof answer === 'string' ? answer.trim() : true));
  };

  const handleNext = async () => {
    // Add validation at the start
    if (!user || !user.id || !user.email) {
      console.error('User not properly authenticated for submission');
      toast.error('Please sign in again to continue');
      navigate('/auth');
      return;
    }

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev: number) => prev + 1);
    } else {
      // Submit the assessment
      console.log('=== COMPLETING PART 1 ===');
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('Answers:', answers);
      setIsSubmitting(true);
      setTimeoutError(null);
      try {
        // Save final state to database
        console.log('Saving final state...');
        const result = await AssessmentDatabaseService.savePart1(
          user.id,
          user.email,
          answers,
          groupId || undefined
        );
        
        console.log('Save successful, group_id:', result.group_id);
        
        // Call backend API to complete assessment and generate AI analysis
        console.log('Calling backend API to complete assessment...');
        try {
          const completionResponse = await AssessmentApiService.completeAssessmentPart1(
            result.group_id,
            user.email,
            answers
          );
          
          console.log('API completion response:', completionResponse);
          
          if (completionResponse.fit_message) {
            // Update the database with the fit message
            await AssessmentDatabaseService.updatePart1(
              user.id,
              user.email,
              {
                fit_message: completionResponse.fit_message,
                status: 'completed'
              }
            );
            
            // Update progress to show completion
            completePart1();
            
            // Show success with fit message
            toast.success('Assessment completed! Your personalized analysis is ready.');
          }
          
          // Update completion data with API response
          setCompletionData({
            ...result,
            fit_message: completionResponse.fit_message,
            board_generation_started: completionResponse.board_generation_started
          });
        } catch (apiError) {
          console.error('Error calling completion API:', apiError);
          // Continue anyway - the assessment is saved
          toast.warning('Assessment saved. AI analysis will be available shortly.');
        }
        
        // Update progress state
        setCompletionData(result);
        setShowSuccess(true);
        
        // Clear localStorage
        localStorage.removeItem('assessmentResponses');
        localStorage.removeItem('assessmentGroupId');
        
        // Check if partner emails were provided and send invites
        const partnerEmails = answers['partner_emails'];
        if (partnerEmails && partnerEmails.trim()) {
          try {
            const emails = partnerEmails.split(',').map((e: string) => e.trim()).filter((e: string) => e);
            if (emails.length > 0 && result.group_id) {
              await AssessmentApiService.sendPartnerInvites(result.group_id, emails);
              setCompletionData((prev: any) => ({ ...prev, partner_invites_sent: true }));
            }
          } catch (inviteError) {
            console.error('Error sending partner invites:', inviteError);
            // Don't fail the whole process if invites fail
          }
        }
        
        setTimeout(() => {
          setShowSuccess(false);
          // Navigate to Part 2 automatically after showing success
          console.log('[AssessmentPart1Container] Navigating to Part 2 with groupId:', result.group_id);
          navigate(`/assessment/part2?groupId=${result.group_id}`);
        }, 3000);
      } catch (error) {
        console.error('Full error details:', error);
        setTimeoutError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev: number) => prev - 1);
    }
  };

  if (showSuccess) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <CardTitle className="text-green-800">Assessment Complete!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
                          Excellent! Your foundation assessment has been completed and analysed.
          </p>
          
          {completionData?.partner_invites_sent && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                Partner invitations have been sent to the email addresses you provided. They'll receive an email with instructions to join your assessment.
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-green-600">
            You can now access your results and proceed to the next steps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeout Error Display with improved messaging */}
      {timeoutError && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Brain className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <p className="font-medium">AI Analysis in Progress</p>
              <p>{timeoutError}</p>
              <p className="text-sm">Our AI is processing your responses using advanced language models, which can take 1-2 minutes.</p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleBackToDashboard}
                  size="sm"
                  variant="outline"
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  Check Dashboard
                </Button>
                <Button
                  onClick={() => setTimeoutError(null)}
                  size="sm"
                  variant="outline"
                  className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progressPercent)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-oracle-navy h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <CardTitle className="text-xl text-gray-900">{currentQ.title}</CardTitle>
          {currentQ.context && (
            <p className="text-gray-600 mt-2">{currentQ.context}</p>
          )}
        </CardHeader>
        <CardContent className="bg-white">
          <QuestionRenderer
            question={currentQ}
            answer={answers[currentQ.id] || ''}
            onAnswer={(value: any) => handleAnswerChange(currentQ.id, value)}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="bg-oracle-navy hover:bg-oracle-navy/90 text-white flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Brain className="w-4 h-4 animate-pulse" />
              {currentQuestion === totalQuestions - 1 ? 'Analyzing your responses... (up to 90 seconds)' : 'Next'}
            </>
          ) : (
            <>
              {currentQuestion === totalQuestions - 1 ? 'Complete Assessment' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
