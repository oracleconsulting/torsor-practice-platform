/**
 * Working Preferences Assessment Component
 * 13-question assessment covering communication, work style, environment, feedback, and collaboration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  workingPreferencesQuestions, 
  calculateWorkingPreferences,
  type WorkingPreferencesProfile 
} from '@/lib/assessments/working-preferences-questions';
import { supabase } from '@/lib/supabase/client';
import { Briefcase, Clock, MessageSquare, Users, Lightbulb } from 'lucide-react';

interface WorkingPreferencesAssessmentProps {
  practiceMemberId: string;
  practiceId: string;
  onComplete?: (profile: WorkingPreferencesProfile) => void;
}

export const WorkingPreferencesAssessment: React.FC<WorkingPreferencesAssessmentProps> = ({
  practiceMemberId,
  practiceId,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const progress = (Object.keys(answers).length / workingPreferencesQuestions.length) * 100;
  const isComplete = Object.keys(answers).length === workingPreferencesQuestions.length;

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question
    if (currentQuestion < workingPreferencesQuestions.length - 1) {
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
    console.log('[WorkingPreferences] Calculating profile from answers:', answers);

    try {
      const profile = calculateWorkingPreferences(answers);
      console.log('[WorkingPreferences] Profile calculated:', profile);

      // Save to database
      const { data, error } = await supabase
        .from('working_preferences')
        .upsert({
          practice_member_id: practiceMemberId,
          practice_id: practiceId,
          answers: answers,
          communication_style: profile.communication_style,
          work_style: profile.work_style,
          environment: profile.environment,
          feedback_preference: profile.feedback_preference,
          collaboration_preference: profile.collaboration_preference,
          time_management: profile.time_management,
          preferences_data: profile.preferences_raw,
          summary: profile.summary,
          assessed_at: new Date().toISOString()
        }, {
          onConflict: 'practice_member_id'
        });

      if (error) {
        console.error('[WorkingPreferences] Save error:', error);
        throw error;
      }

      console.log('[WorkingPreferences] Saved successfully:', data);

      toast({
        title: '✅ Assessment Complete!',
        description: 'Your working preferences have been saved.',
      });

      if (onComplete) {
        onComplete(profile);
      }
    } catch (error: any) {
      console.error('[WorkingPreferences] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assessment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQ = workingPreferencesQuestions[currentQuestion];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return <MessageSquare className="w-5 h-5" />;
      case 'work_style': return <Briefcase className="w-5 h-5" />;
      case 'environment': return <Lightbulb className="w-5 h-5" />;
      case 'feedback': return <Users className="w-5 h-5" />;
      case 'collaboration': return <Users className="w-5 h-5" />;
      case 'time_management': return <Clock className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Working Preferences Assessment
          </CardTitle>
          <CardDescription>
            Help us understand how you prefer to work, communicate, and collaborate (13 questions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress: {Object.keys(answers).length} of {workingPreferencesQuestions.length}</span>
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
            {getCategoryIcon(currentQ.category)}
            <span className="capitalize">{currentQ.category.replace('_', ' ')}</span>
            <span className="ml-auto">Question {currentQuestion + 1} of {workingPreferencesQuestions.length}</span>
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
            onClick={() => setCurrentQuestion(Math.min(workingPreferencesQuestions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === workingPreferencesQuestions.length - 1}
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
          <div className="grid grid-cols-13 gap-2">
            {workingPreferencesQuestions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  answers[q.id]
                    ? 'bg-blue-600 text-white'
                    : currentQuestion === index
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
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

export default WorkingPreferencesAssessment;

