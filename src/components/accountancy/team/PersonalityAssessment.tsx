/**
 * OCEAN Personality Assessment Component
 * 30-question Big Five assessment with progress tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Brain, ChevronRight, ChevronLeft, Check, Info } from 'lucide-react';
import { 
  professionalBigFiveQuestions, 
  responseScale, 
  traitLabels,
  calculateBigFiveScores,
  type PersonalityQuestion 
} from '@/lib/assessments/big-five-questions';
import { savePersonalityAssessment, createCombinedProfile } from '@/lib/api/personality-assessment';
import { toast } from 'sonner';

interface PersonalityAssessmentProps {
  teamMemberId: string;
  memberName?: string;
  existingVARKData?: { primary_style: string; scores: Record<string, number> };
  onComplete?: (profile: any) => void;
}

export const PersonalityAssessment: React.FC<PersonalityAssessmentProps> = ({ 
  teamMemberId, 
  memberName,
  existingVARKData,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<number[]>(new Array(30).fill(0));
  const [showIntro, setShowIntro] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (!showIntro && startTime === 0) {
      setStartTime(Date.now());
    }
  }, [showIntro, startTime]);

  const handleResponse = (value: number) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = value;
    setResponses(newResponses);
    
    // Auto-advance to next question after selection
    if (currentQuestion < professionalBigFiveQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    }
  };

  const canGoNext = () => responses[currentQuestion] !== 0;
  const canGoPrevious = () => currentQuestion > 0;
  const isComplete = () => responses.every(r => r !== 0);
  const progress = ((responses.filter(r => r !== 0).length / 30) * 100);

  const jumpToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const submitAssessment = async () => {
    if (!isComplete()) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const completionTime = Math.round((Date.now() - startTime) / 1000);
      
      // Calculate scores
      const profile = calculateBigFiveScores(responses);
      
      // Save to database
      const { success, error } = await savePersonalityAssessment(
        teamMemberId,
        profile,
        responses,
        completionTime
      );
      
      if (!success) {
        throw error || new Error('Failed to save assessment');
      }

      // Create combined profile if VARK data exists
      if (existingVARKData) {
        await createCombinedProfile(teamMemberId, profile, existingVARKData);
      }

      toast.success('Assessment completed successfully!');
      
      if (onComplete) {
        onComplete(profile);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showIntro) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-blue-100">
                <Brain className="w-16 h-16 text-blue-600" />
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Professional Personality Assessment
              </h2>
              <p className="text-lg text-gray-600">
                {memberName && `${memberName}, `}discover your work style and team dynamics
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 text-left border border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What we'll measure:</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    This assessment uses the Big Five model - the most scientifically validated personality framework used worldwide.
                  </p>
                </div>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Openness:</strong>
                    <span className="text-gray-600"> Innovation, creativity, and adaptability to change</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Conscientiousness:</strong>
                    <span className="text-gray-600"> Organization, reliability, and attention to detail</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Extraversion:</strong>
                    <span className="text-gray-600"> Social energy, assertiveness, and collaboration preference</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Agreeableness:</strong>
                    <span className="text-gray-600"> Cooperation, trust, and team harmony</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-600 mt-2 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900">Emotional Stability:</strong>
                    <span className="text-gray-600"> Stress management, resilience, and calm under pressure</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    30
                  </div>
                  <span className="text-gray-600">questions</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                    10
                  </div>
                  <span className="text-gray-600">minutes</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                    ✓
                  </div>
                  <span className="text-gray-600">private results</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600 text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-semibold text-yellow-900">💡 Tips for accurate results:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Answer honestly based on how you typically behave at work</li>
                <li>Don't overthink - go with your first instinct</li>
                <li>There are no right or wrong answers</li>
                <li>Your results are confidential and only shared with your permission</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => setShowIntro(false)}
              className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-lg py-6"
              size="lg"
            >
              Begin Assessment
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>

            <p className="text-xs text-gray-500">
              Your responses will be saved automatically as you progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQ = professionalBigFiveQuestions[currentQuestion];
  const traitColor = {
    'O': 'bg-blue-600',
    'C': 'bg-green-600',
    'E': 'bg-purple-600',
    'A': 'bg-orange-600',
    'N': 'bg-teal-600'
  }[currentQ.trait];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Card */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Question {currentQuestion + 1} of {professionalBigFiveQuestions.length}
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${traitColor}`} />
                Measuring: {traitLabels[currentQ.trait]}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</span>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="border-2 shadow-lg">
        <CardContent className="p-8 md:p-12">
          <h3 className="text-2xl font-semibold mb-8 text-center text-gray-900 leading-relaxed">
            {currentQ.question}
          </h3>
          
          <RadioGroup 
            value={responses[currentQuestion]?.toString()} 
            onValueChange={(value) => handleResponse(parseInt(value))}
            className="space-y-3"
          >
            {responseScale.map(option => (
              <div 
                key={option.value} 
                className={`
                  flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${responses[currentQuestion] === option.value 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                `}
                onClick={() => handleResponse(option.value)}
              >
                <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                <Label 
                  htmlFor={`option-${option.value}`} 
                  className="flex-1 cursor-pointer text-base font-medium"
                >
                  {option.label}
                </Label>
                {responses[currentQuestion] === option.value && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            ))}
          </RadioGroup>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              disabled={!canGoPrevious()}
              size="lg"
            >
              <ChevronLeft className="mr-2 w-4 h-4" />
              Previous
            </Button>

            {currentQuestion === professionalBigFiveQuestions.length - 1 ? (
              <Button
                onClick={submitAssessment}
                disabled={!isComplete() || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Assessment
                    <Check className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={!canGoNext()}
                size="lg"
              >
                Next
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Quick Navigation:</p>
          <div className="grid grid-cols-10 gap-2">
            {professionalBigFiveQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => jumpToQuestion(index)}
                className={`
                  w-full aspect-square text-xs rounded-md font-semibold transition-all
                  ${responses[index] !== 0 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  ${currentQuestion === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                `}
                title={`Question ${index + 1}${responses[index] !== 0 ? ' (answered)' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            {responses.filter(r => r !== 0).length} of 30 questions answered
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalityAssessment;


