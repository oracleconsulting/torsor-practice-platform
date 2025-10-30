/**
 * Conflict Style Assessment Component
 * 10-question assessment based on Thomas-Kilmann Conflict Mode Instrument
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  conflictStyleQuestions, 
  calculateConflictStyleProfile,
  type ConflictStyleProfile as ConflictProfile 
} from '@/lib/assessments/conflict-style-questions';
import { supabase } from '@/lib/supabase/client';
import { Shield, Swords, Scale, Users, Heart } from 'lucide-react';

interface ConflictStyleAssessmentProps {
  practiceMemberId: string;
  practiceId: string;
  onComplete?: (profile: ConflictProfile) => void;
}

export const ConflictStyleAssessment: React.FC<ConflictStyleAssessmentProps> = ({
  practiceMemberId,
  practiceId,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const progress = (Object.keys(answers).length / conflictStyleQuestions.length) * 100;
  const isComplete = Object.keys(answers).length === conflictStyleQuestions.length;

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question
    if (currentQuestion < conflictStyleQuestions.length - 1) {
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
    console.log('[ConflictStyle] Calculating profile from answers:', answers);

    try {
      const profile = calculateConflictStyleProfile(answers);
      console.log('[ConflictStyle] Profile calculated:', profile);

      // Save to database
      const { data, error } = await supabase
        .from('conflict_style_assessments')
        .upsert({
          practice_member_id: practiceMemberId,
          practice_id: practiceId,
          answers: answers,
          primary_style: profile.primary_style,
          secondary_style: profile.secondary_style,
          style_scores: profile.style_scores,
          competing_score: profile.style_scores.competing,
          collaborating_score: profile.style_scores.collaborating,
          compromising_score: profile.style_scores.compromising,
          avoiding_score: profile.style_scores.avoiding,
          accommodating_score: profile.style_scores.accommodating,
          conflict_summary: profile.summary,
          assessed_at: new Date().toISOString()
        }, {
          onConflict: 'practice_member_id'
        });

      if (error) {
        console.error('[ConflictStyle] Save error:', error);
        throw error;
      }

      console.log('[ConflictStyle] Saved successfully:', data);

      toast({
        title: '✅ Assessment Complete!',
        description: `Your primary conflict style is: ${profile.primary_style}`,
      });

      if (onComplete) {
        onComplete(profile);
      }
    } catch (error: any) {
      console.error('[ConflictStyle] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assessment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQ = conflictStyleQuestions[currentQuestion];

  const getStyleIcon = (style: string) => {
    const icons: Record<string, any> = {
      'competing': <Swords className="w-5 h-5 text-red-600" />,
      'collaborating': <Users className="w-5 h-5 text-green-600" />,
      'compromising': <Scale className="w-5 h-5 text-blue-600" />,
      'avoiding': <Shield className="w-5 h-5 text-gray-600" />,
      'accommodating': <Heart className="w-5 h-5 text-purple-600" />
    };
    return icons[style] || <Shield className="w-5 h-5" />;
  };

  const getStyleColor = (style: string) => {
    const colors: Record<string, string> = {
      'competing': 'red',
      'collaborating': 'green',
      'compromising': 'blue',
      'avoiding': 'gray',
      'accommodating': 'purple'
    };
    return colors[style] || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-600" />
            Conflict Style Assessment
          </CardTitle>
          <CardDescription>
            Discover how you naturally approach and resolve conflicts (10 questions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress: {Object.keys(answers).length} of {conflictStyleQuestions.length}</span>
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
            <span>Question {currentQuestion + 1} of {conflictStyleQuestions.length}</span>
          </div>
          <CardTitle className="text-xl">{currentQ.scenario}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={(value) => handleAnswer(currentQ.id, value)}
          >
            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const color = getStyleColor(option.value);
                return (
                  <div
                    key={option.value}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-${color}-300 hover:bg-${color}-50 ${
                      answers[currentQ.id] === option.value
                        ? `border-${color}-600 bg-${color}-50`
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleAnswer(currentQ.id, option.value)}
                  >
                    <RadioGroupItem value={option.value} id={`q${currentQ.id}-${index}`} />
                    <Label
                      htmlFor={`q${currentQ.id}-${index}`}
                      className="flex-1 cursor-pointer text-gray-900"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getStyleIcon(option.value)}
                        <span className="font-medium capitalize">{option.value}</span>
                      </div>
                      <p className="text-sm text-gray-600">{option.text}</p>
                    </Label>
                  </div>
                );
              })}
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
            onClick={() => setCurrentQuestion(Math.min(conflictStyleQuestions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === conflictStyleQuestions.length - 1}
          >
            Next
          </Button>

          {isComplete && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
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
            {conflictStyleQuestions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  answers[q.id]
                    ? 'bg-orange-600 text-white'
                    : currentQuestion === index
                    ? 'bg-orange-100 text-orange-600 border-2 border-orange-600'
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

export default ConflictStyleAssessment;

