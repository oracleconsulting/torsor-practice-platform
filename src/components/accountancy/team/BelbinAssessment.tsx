/**
 * Belbin Team Roles Assessment Component
 * 8-question assessment to identify team role preferences
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  belbinQuestions, 
  calculateBelbinProfile,
  type BelbinProfile 
} from '@/lib/assessments/belbin-questions';
import { supabase } from '@/lib/supabase';
import { Users, Lightbulb, Target, Search, Shield, Heart, Cog, CheckCircle, BookOpen } from 'lucide-react';

interface BelbinAssessmentProps {
  practiceMemberId: string;
  practiceId: string;
  onComplete?: (profile: BelbinProfile) => void;
}

export const BelbinAssessment: React.FC<BelbinAssessmentProps> = ({
  practiceMemberId,
  practiceId,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const progress = (Object.keys(answers).length / belbinQuestions.length) * 100;
  const isComplete = Object.keys(answers).length === belbinQuestions.length;

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question
    if (currentQuestion < belbinQuestions.length - 1) {
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
    console.log('[Belbin] Calculating profile from answers:', answers);

    try {
      const profile = calculateBelbinProfile(answers);
      console.log('[Belbin] Profile calculated:', profile);

      // Save to database
      const { data, error } = await supabase
        .from('belbin_assessments')
        .upsert({
          practice_member_id: practiceMemberId,
          practice_id: practiceId,
          answers: answers,
          primary_role: profile.primary_role,
          secondary_role: profile.secondary_role,
          tertiary_role: profile.tertiary_role,
          role_scores: profile.role_scores,
          role_descriptions: profile.role_descriptions,
          team_contribution: profile.team_contribution,
          assessed_at: new Date().toISOString()
        }, {
          onConflict: 'practice_member_id'
        });

      if (error) {
        console.error('[Belbin] Save error:', error);
        throw error;
      }

      console.log('[Belbin] Saved successfully:', data);

      toast({
        title: '✅ Assessment Complete!',
        description: `Your primary team role is: ${profile.primary_role}`,
      });

      if (onComplete) {
        onComplete(profile);
      }
    } catch (error: any) {
      console.error('[Belbin] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assessment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQ = belbinQuestions[currentQuestion];

  const getRoleIcon = (role: string) => {
    const icons: Record<string, any> = {
      'Plant': <Lightbulb className="w-5 h-5" />,
      'Resource Investigator': <Search className="w-5 h-5" />,
      'Coordinator': <Users className="w-5 h-5" />,
      'Shaper': <Target className="w-5 h-5" />,
      'Monitor Evaluator': <Shield className="w-5 h-5" />,
      'Teamworker': <Heart className="w-5 h-5" />,
      'Implementer': <Cog className="w-5 h-5" />,
      'Completer Finisher': <CheckCircle className="w-5 h-5" />,
      'Specialist': <BookOpen className="w-5 h-5" />
    };
    return icons[role] || <Users className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Belbin Team Roles Assessment
          </CardTitle>
          <CardDescription>
            Discover your natural team role and how you contribute to team success (8 questions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress: {Object.keys(answers).length} of {belbinQuestions.length}</span>
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
            <span>Question {currentQuestion + 1} of {belbinQuestions.length}</span>
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
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-purple-300 hover:bg-purple-50 ${
                    answers[currentQ.id] === option.value
                      ? 'border-purple-600 bg-purple-50'
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
                      {getRoleIcon(option.value)}
                      <span className="font-medium">{option.value}</span>
                    </div>
                    <p className="text-sm text-gray-600">{option.text}</p>
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
            onClick={() => setCurrentQuestion(Math.min(belbinQuestions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === belbinQuestions.length - 1}
          >
            Next
          </Button>

          {isComplete && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
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
          <div className="grid grid-cols-8 gap-2">
            {belbinQuestions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  answers[q.id]
                    ? 'bg-purple-600 text-white'
                    : currentQuestion === index
                    ? 'bg-purple-100 text-purple-600 border-2 border-purple-600'
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

export default BelbinAssessment;

