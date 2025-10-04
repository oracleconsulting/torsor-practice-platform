
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Edit3 } from 'lucide-react';
import { assessmentQuestions } from '@/data/assessmentQuestions';
import { QuestionRenderer } from '@/components/assessment/QuestionRenderer';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AssessmentPart1ReviewProps {
  onComplete: () => void;
}

export const AssessmentPart1Review = ({ onComplete }: AssessmentPart1ReviewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { progress, savePart1Answer, completePart1, updateProgress } = useAssessmentProgress();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const question = assessmentQuestions[currentQuestion];

  // Check if current question is partner_emails and previous answer was "No"
  const shouldSkipPartnerEmails = question.id === 'partner_emails' && 
    progress.part1Answers['has_partners'] !== 'Yes';

  const handleAnswer = (value: any) => {
    savePart1Answer(question.id, value);
    setHasChanges(true);
  };

  const handleNext = () => {
    let nextQuestion = currentQuestion + 1;
    
    // Skip partner_emails question if has_partners is not "Yes"
    if (nextQuestion < assessmentQuestions.length && 
        assessmentQuestions[nextQuestion].id === 'partner_emails' && 
        progress.part1Answers['has_partners'] !== 'Yes') {
      nextQuestion = nextQuestion + 1;
    }
    
    if (nextQuestion >= assessmentQuestions.length) {
      handleSubmitChanges();
    } else {
      setCurrentQuestion(nextQuestion);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      let prevQuestion = currentQuestion - 1;
      
      // Skip partner_emails question if has_partners is not "Yes" when going back
      if (prevQuestion >= 0 && 
          assessmentQuestions[prevQuestion].id === 'partner_emails' && 
          progress.part1Answers['has_partners'] !== 'Yes') {
        prevQuestion = prevQuestion - 1;
      }
      
      setCurrentQuestion(Math.max(0, prevQuestion));
    }
  };

  const handleSubmitChanges = async () => {
    if (!hasChanges) {
      toast({
        title: "No Changes Made",
        description: "You haven't made any changes to your answers.",
      });
      onComplete();
      return;
    }

    setLoading(true);
    
    try {
      const result = await completePart1();
      
      if (result?.success) {
        toast({
          title: "Assessment Updated!",
          description: "Your answers have been updated and your fit assessment has been refreshed.",
          duration: 10000,
        });
        
        // Update the fit message in progress
        if (result.data?.data?.[0]?.fit_message) {
          updateProgress({ 
            fitMessage: result.data.data[0].fit_message,
            part1Complete: true 
          });
        }
        
        onComplete();
      } else {
        throw new Error(result?.error || 'Failed to update assessment');
      }
    } catch (error) {
      console.error('Error updating assessment:', error);
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update your assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = (): boolean => {
    if (shouldSkipPartnerEmails) return true;
    if (!question.required) return true;
    const answer = progress.part1Answers[question.id];
    return !!(answer && (typeof answer === 'string' ? answer.trim() : true));
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-8">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-oracle-navy hover:bg-oracle-navy/10 text-lg px-6 py-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-oracle-gold" />
            <span className="text-lg text-gray-600">Review Mode</span>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-3xl mx-auto mb-8 p-6 bg-oracle-gold/10 rounded-lg">
        <h2 className="text-xl font-semibold text-oracle-navy mb-2">Review Your Answers</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          You can now review and edit your foundation assessment answers. Any changes will update your fit assessment and recommendations.
        </p>
      </div>

      <Card className="mb-8 max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-500 text-lg">
              Question {currentQuestion + 1} of {assessmentQuestions.length}
            </div>
            {hasChanges && (
              <div className="text-oracle-gold text-sm font-medium">
                Changes detected - will update on submission
              </div>
            )}
          </div>
          <CardTitle className="text-oracle-navy text-3xl mb-4">
            Review Foundation Assessment
          </CardTitle>
          <Progress 
            value={((currentQuestion + 1) / assessmentQuestions.length) * 100} 
            className="w-full h-3"
          />
        </CardHeader>
        <CardContent className="space-y-8">
          {!shouldSkipPartnerEmails && (
            <div>
              <h3 className="text-3xl text-gray-900 leading-relaxed mb-4 font-bold">
                {question.title}
              </h3>
              
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {question.context}
              </p>
              
              <QuestionRenderer
                question={question}
                answer={progress.part1Answers[question.id]}
                onAnswer={handleAnswer}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              size="lg"
              className="border-oracle-navy text-oracle-navy hover:bg-oracle-navy hover:text-oracle-cream text-lg px-8 py-4"
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              size="lg"
              className="bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy font-semibold text-lg px-8 py-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : currentQuestion >= assessmentQuestions.length - 1 || 
                    (currentQuestion === assessmentQuestions.length - 2 && shouldSkipPartnerEmails) ? (
                'Update Assessment'
              ) : (
                <>
                  Next
                  <ArrowRight className="h-5 w-5 ml-3" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
