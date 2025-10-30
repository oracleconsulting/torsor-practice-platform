/**
 * Emotional Intelligence (EQ) Assessment Component
 * 27-question assessment covering 4 domains of emotional intelligence
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  eqQuestions, 
  calculateEQProfile,
  type EQProfile 
} from '@/lib/assessments/eq-questions';
import { supabase } from '@/lib/supabase/client';
import { Brain, Heart, Users, Sparkles } from 'lucide-react';

interface EQAssessmentProps {
  practiceMemberId: string;
  practiceId: string;
  onComplete?: (profile: EQProfile) => void;
}

export const EQAssessment: React.FC<EQAssessmentProps> = ({
  practiceMemberId,
  practiceId,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const progress = (Object.keys(answers).length / eqQuestions.length) * 100;
  const isComplete = Object.keys(answers).length === eqQuestions.length;

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question
    if (currentQuestion < eqQuestions.length - 1) {
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
    console.log('[EQ] Calculating profile from answers:', answers);

    try {
      const profile = calculateEQProfile(answers);
      console.log('[EQ] Profile calculated:', profile);

      // Save to database
      const { data, error } = await supabase
        .from('eq_assessments')
        .upsert({
          practice_member_id: practiceMemberId,
          practice_id: practiceId,
          answers: answers,
          self_awareness_score: profile.domain_scores.self_awareness,
          self_management_score: profile.domain_scores.self_management,
          social_awareness_score: profile.domain_scores.social_awareness,
          relationship_management_score: profile.domain_scores.relationship_management,
          overall_eq_score: profile.overall_eq,
          eq_level: profile.eq_level,
          domain_scores: profile.domain_scores,
          strengths: profile.strengths,
          development_areas: profile.development_areas,
          eq_summary: profile.summary,
          assessed_at: new Date().toISOString()
        }, {
          onConflict: 'practice_member_id'
        });

      if (error) {
        console.error('[EQ] Save error:', error);
        throw error;
      }

      console.log('[EQ] Saved successfully:', data);

      toast({
        title: '✅ Assessment Complete!',
        description: `Your EQ level is: ${profile.eq_level} (${profile.overall_eq}/100)`,
      });

      if (onComplete) {
        onComplete(profile);
      }
    } catch (error: any) {
      console.error('[EQ] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assessment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQ = eqQuestions[currentQuestion];

  const getDomainIcon = (domain: string) => {
    const icons: Record<string, any> = {
      'self_awareness': <Brain className="w-5 h-5 text-blue-600" />,
      'self_management': <Heart className="w-5 h-5 text-green-600" />,
      'social_awareness': <Users className="w-5 h-5 text-purple-600" />,
      'relationship_management': <Sparkles className="w-5 h-5 text-pink-600" />
    };
    return icons[domain] || <Brain className="w-5 h-5" />;
  };

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      'self_awareness': 'blue',
      'self_management': 'green',
      'social_awareness': 'purple',
      'relationship_management': 'pink'
    };
    return colors[domain] || 'blue';
  };

  const likertOptions = [
    { value: 1, label: 'Strongly Disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly Agree' }
  ];

  const color = getDomainColor(currentQ.domain);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            Emotional Intelligence (EQ) Assessment
          </CardTitle>
          <CardDescription>
            Assess your emotional intelligence across 4 key domains (27 questions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress: {Object.keys(answers).length} of {eqQuestions.length}</span>
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
            {getDomainIcon(currentQ.domain)}
            <span className="capitalize">{currentQ.domain.replace('_', ' ')}</span>
            <span className="ml-auto">Question {currentQuestion + 1} of {eqQuestions.length}</span>
          </div>
          <CardTitle className="text-xl">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQ.id]?.toString() || ''}
            onValueChange={(value) => handleAnswer(currentQ.id, parseInt(value))}
          >
            <div className="space-y-3">
              {likertOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-${color}-300 hover:bg-${color}-50 ${
                    answers[currentQ.id] === option.value
                      ? `border-${color}-600 bg-${color}-50`
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleAnswer(currentQ.id, option.value)}
                >
                  <RadioGroupItem value={option.value.toString()} id={`q${currentQ.id}-${option.value}`} />
                  <Label
                    htmlFor={`q${currentQ.id}-${option.value}`}
                    className="flex-1 cursor-pointer text-gray-900 font-medium"
                  >
                    {option.label}
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
            onClick={() => setCurrentQuestion(Math.min(eqQuestions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === eqQuestions.length - 1}
          >
            Next
          </Button>

          {isComplete && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
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
          <div className="grid grid-cols-9 gap-2">
            {eqQuestions.map((q, index) => {
              const qColor = getDomainColor(q.domain);
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                    answers[q.id]
                      ? `bg-${qColor}-600 text-white`
                      : currentQuestion === index
                      ? `bg-${qColor}-100 text-${qColor}-600 border-2 border-${qColor}-600`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EQAssessment;

