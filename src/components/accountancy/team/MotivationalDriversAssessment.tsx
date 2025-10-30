/**
 * Motivational Drivers Assessment Component
 * 10-question assessment to identify what motivates you at work
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  motivationalDriversQuestions, 
  calculateMotivationalProfile,
  type MotivationalProfile 
} from '@/lib/assessments/motivational-drivers-questions';
import { supabase } from '@/lib/supabase/client';
import { Target, Zap, Heart, Crown, Shield, Award } from 'lucide-react';

interface MotivationalDriversAssessmentProps {
  practiceMemberId: string;
  practiceId: string;
  onComplete?: (profile: MotivationalProfile) => void;
}

export const MotivationalDriversAssessment: React.FC<MotivationalDriversAssessmentProps> = ({
  practiceMemberId,
  practiceId,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const progress = (Object.keys(answers).length / motivationalDriversQuestions.length) * 100;
  const isComplete = Object.keys(answers).length === motivationalDriversQuestions.length;

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question
    if (currentQuestion < motivationalDriversQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    }
  };

  const handleSubmit = async () => {
    if (!isComplete) {
      toast({
        title: 'Incomplete Assessment',
        description: 'Please answer all questions before submitting.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    console.log('[Motivational] Calculating profile from answers:', answers);

    try {
      const profile = calculateMotivationalProfile(answers);
      console.log('[Motivational] Profile calculated:', profile);

      // Calculate motivation intensity based on primary driver score
      const primaryScore = profile.driver_scores[profile.primary_driver as keyof typeof profile.driver_scores];
      const motivation_intensity = primaryScore >= 20 ? 'high' : primaryScore >= 10 ? 'moderate' : 'low';

      // Save to database
      const { data, error } = await supabase
        .from('motivational_drivers')
        .upsert({
          practice_member_id: practiceMemberId,
          practice_id: practiceId,
          answers: answers,
          primary_driver: profile.primary_driver,
          secondary_driver: profile.secondary_driver,
          driver_scores: profile.driver_scores,
          motivation_intensity: motivation_intensity,
          summary: profile.summary,
          assessed_at: new Date().toISOString()
        }, {
          onConflict: 'practice_member_id'
        });

      if (error) {
        console.error('[Motivational] Save error:', error);
        throw error;
      }

      console.log('[Motivational] Saved successfully:', data);

      toast({
        title: '✅ Assessment Complete!',
        description: `Your primary motivational driver is: ${profile.primary_driver}`,
      });

      if (onComplete) {
        onComplete(profile);
      }
    } catch (error: any) {
      console.error('[Motivational] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assessment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQ = motivationalDriversQuestions[currentQuestion];

  const getDriverIcon = (driver: string) => {
    const icons: Record<string, any> = {
      'achievement': <Target className="w-5 h-5 text-green-600" />,
      'autonomy': <Zap className="w-5 h-5 text-blue-600" />,
      'affiliation': <Heart className="w-5 h-5 text-pink-600" />,
      'power': <Crown className="w-5 h-5 text-purple-600" />,
      'security': <Shield className="w-5 h-5 text-gray-600" />,
      'recognition': <Award className="w-5 h-5 text-yellow-600" />
    };
    return icons[driver] || <Target className="w-5 h-5" />;
  };

  const getDriverColor = (driver: string) => {
    const colors: Record<string, string> = {
      'achievement': 'green',
      'autonomy': 'blue',
      'affiliation': 'pink',
      'power': 'purple',
      'security': 'gray',
      'recognition': 'yellow'
    };
    return colors[driver] || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-600" />
            Motivational Drivers Assessment
          </CardTitle>
          <CardDescription>
            Understand what drives and energizes you at work (10 questions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress: {Object.keys(answers).length} of {motivationalDriversQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Question {currentQuestion + 1} of {motivationalDriversQuestions.length}</span>
          </div>
          <CardTitle className="text-xl">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={(value) => handleAnswer(currentQ.id, value)}
          >
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-blue-300 hover:bg-blue-50 ${
                    answers[currentQ.id] === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleAnswer(currentQ.id, option.value)}
                >
                  <RadioGroupItem value={option.value} id={`q${currentQ.id}-${index}`} />
                  <Label
                    htmlFor={`q${currentQ.id}-${index}`}
                    className="flex-1 cursor-pointer text-gray-900"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.min(motivationalDriversQuestions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === motivationalDriversQuestions.length - 1}
          >
            Next
          </Button>

          {isComplete && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? 'Saving...' : 'Submit Assessment'}
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {motivationalDriversQuestions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  answers[q.id]
                    ? 'bg-yellow-600 text-white'
                    : currentQuestion === index
                    ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MotivationalDriversAssessment;

