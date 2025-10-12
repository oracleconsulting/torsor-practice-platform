import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Ear,
  BookOpen,
  Hand,
  Sparkles,
  Brain,
  TrendingUp,
  CheckSquare
} from 'lucide-react';
import {
  getVARKQuestions,
  saveLearningPreference,
  getLearningStyleProfile,
  type VARKQuestion,
  type VARKAnswer,
  type LearningStyleProfile,
} from '@/lib/api/learning-preferences';
import { useAuth } from '@/contexts/AuthContext';

interface VARKAssessmentProps {
  teamMemberId: string;
  teamMemberName?: string;
  onComplete?: () => void;
  onBack?: () => void;
}

const VARKAssessment: React.FC<VARKAssessmentProps> = ({
  teamMemberId,
  teamMemberName,
  onComplete,
  onBack,
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<VARKQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: VARKAnswer }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [profile, setProfile] = useState<LearningStyleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
    checkExistingProfile();
  }, []);

  const loadQuestions = async () => {
    try {
      const data = await getVARKQuestions();
      setQuestions(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load assessment questions. Please try again.');
      setLoading(false);
    }
  };

  const checkExistingProfile = async () => {
    try {
      const existingProfile = await getLearningStyleProfile(teamMemberId);
      if (existingProfile) {
        // User has already completed the assessment
        setProfile(existingProfile);
        setCompleted(true);
      }
    } catch (err) {
      console.error('Error checking existing profile:', err);
    }
  };

  const handleAnswerSelect = (option: 'a' | 'b' | 'c' | 'd') => {
    const question = questions[currentQuestion];
    if (!question) return;

    const styleKey = `option_${option}_style` as keyof VARKQuestion;
    const selectedStyle = question[styleKey] as 'visual' | 'auditory' | 'reading_writing' | 'kinesthetic';

    const answer: VARKAnswer = {
      question_number: question.question_number,
      selected_option: option,
      selected_style: selectedStyle,
    };

    setAnswers((prev) => ({
      ...prev,
      [question.question_number]: answer,
    }));

    // Auto-save to localStorage
    localStorage.setItem(
      `vark_answers_${teamMemberId}`,
      JSON.stringify({ ...answers, [question.question_number]: answer })
    );
  };

  const isCurrentQuestionAnswered = (): boolean => {
    if (!questions[currentQuestion]) return false;
    return !!answers[questions[currentQuestion].question_number];
  };

  const getProgressPercentage = (): number => {
    return ((Object.keys(answers).length) / questions.length) * 100;
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitAssessment = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to submit the assessment.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const answerArray = Object.values(answers);
      await saveLearningPreference(teamMemberId, user.id, answerArray);
      
      // Load the profile
      const newProfile = await getLearningStyleProfile(teamMemberId);
      setProfile(newProfile);
      setCompleted(true);

      // Clear localStorage
      localStorage.removeItem(`vark_answers_${teamMemberId}`);

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'visual':
        return <Eye className="w-5 h-5" />;
      case 'auditory':
        return <Ear className="w-5 h-5" />;
      case 'reading_writing':
        return <BookOpen className="w-5 h-5" />;
      case 'kinesthetic':
        return <Hand className="w-5 h-5" />;
      case 'multimodal':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getStyleLabel = (style: string): string => {
    const labels: { [key: string]: string } = {
      visual: 'Visual Learner',
      auditory: 'Auditory Learner',
      reading_writing: 'Reading/Writing Learner',
      kinesthetic: 'Kinesthetic Learner',
      multimodal: 'Multimodal Learner',
    };
    return labels[style] || style;
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading assessment...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !questions.length) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
          <p className="text-white font-medium mb-4">{error}</p>
          <Button onClick={loadQuestions}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (completed && profile) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-700">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Assessment Complete!</h3>
            <p className="text-white font-medium mb-6">
              {teamMemberName ? `${teamMemberName}'s` : 'Your'} learning style profile has been created.
            </p>
          </CardContent>
        </Card>

        {/* Primary Learning Style */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              {getStyleIcon(profile.primary_style)}
              <span>{getStyleLabel(profile.primary_style)}</span>
            </CardTitle>
            <CardDescription>
              {profile.is_multimodal
                ? 'You have a balanced multimodal learning style, benefiting from multiple approaches.'
                : 'This is your dominant learning preference.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium text-white text-sm uppercase tracking-wide">Score Breakdown</h4>
              
              {/* Visual */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-white font-medium">Visual</span>
                  </div>
                  <span className="text-white font-medium">{profile.scores.visual}%</span>
                </div>
                <Progress value={profile.scores.visual} className="h-2 bg-gray-700" />
              </div>

              {/* Auditory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Ear className="w-4 h-4 text-purple-500" />
                    <span className="text-white font-medium">Auditory</span>
                  </div>
                  <span className="text-white font-medium">{profile.scores.auditory}%</span>
                </div>
                <Progress value={profile.scores.auditory} className="h-2 bg-gray-700" />
              </div>

              {/* Reading/Writing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    <span className="text-white font-medium">Reading/Writing</span>
                  </div>
                  <span className="text-white font-medium">{profile.scores.reading_writing}%</span>
                </div>
                <Progress value={profile.scores.reading_writing} className="h-2 bg-gray-700" />
              </div>

              {/* Kinesthetic */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Hand className="w-4 h-4 text-orange-500" />
                    <span className="text-white font-medium">Kinesthetic</span>
                  </div>
                  <span className="text-white font-medium">{profile.scores.kinesthetic}%</span>
                </div>
                <Progress value={profile.scores.kinesthetic} className="h-2 bg-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5" />
              Your Learning Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {profile.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-white font-medium">
                  <CheckSquare className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Learning Tips */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Brain className="w-5 h-5" />
              Personalized Learning Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {profile.learning_tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-white font-medium">
                  <Sparkles className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Development Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.recommendations.map((rec, index) => (
                <Alert key={index} className="bg-blue-900/20 border-blue-700">
                  <AlertDescription className="text-white font-medium">{rec}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Team Portal
            </Button>
          )}
          <Button
            onClick={() => {
              setCompleted(false);
              setProfile(null);
              setAnswers({});
              setCurrentQuestion(0);
            }}
          >
            Retake Assessment
          </Button>
        </div>
      </div>
    );
  }

  // Assessment Form
  const currentQ = questions[currentQuestion];
  if (!currentQ) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">VARK Learning Style Assessment</CardTitle>
              <CardDescription>
                {teamMemberName
                  ? `Completing assessment for ${teamMemberName}`
                  : 'Discover your learning preferences'}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              {Object.keys(answers).length} / {questions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">Overall Progress</span>
              <span className="text-white font-medium">{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-white font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Question Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge variant="secondary" className="mb-2">
                Question {currentQuestion + 1} of {questions.length}
              </Badge>
              <CardTitle className="text-white text-lg leading-relaxed">{currentQ.question_text}</CardTitle>
              {currentQ.category && (
                <CardDescription className="text-xs uppercase tracking-wide">
                  {currentQ.category}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQ.question_number]?.selected_option || ''}
            onValueChange={(value) => handleAnswerSelect(value as 'a' | 'b' | 'c' | 'd')}
            className="space-y-4"
          >
            {/* Option A */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
              <RadioGroupItem value="a" id={`q${currentQ.question_number}-a`} className="mt-1" />
              <Label
                htmlFor={`q${currentQ.question_number}-a`}
                className="text-white font-medium cursor-pointer flex-1"
              >
                {currentQ.option_a}
              </Label>
            </div>

            {/* Option B */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
              <RadioGroupItem value="b" id={`q${currentQ.question_number}-b`} className="mt-1" />
              <Label
                htmlFor={`q${currentQ.question_number}-b`}
                className="text-white font-medium cursor-pointer flex-1"
              >
                {currentQ.option_b}
              </Label>
            </div>

            {/* Option C */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
              <RadioGroupItem value="c" id={`q${currentQ.question_number}-c`} className="mt-1" />
              <Label
                htmlFor={`q${currentQ.question_number}-c`}
                className="text-white font-medium cursor-pointer flex-1"
              >
                {currentQ.option_c}
              </Label>
            </div>

            {/* Option D */}
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
              <RadioGroupItem value="d" id={`q${currentQ.question_number}-d`} className="mt-1" />
              <Label
                htmlFor={`q${currentQ.question_number}-d`}
                className="text-white font-medium cursor-pointer flex-1"
              >
                {currentQ.option_d}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || isSubmitting}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : currentQuestion === questions.length - 1 ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Submit Assessment
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Quick Navigation */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-white font-medium mr-2">Quick Jump:</span>
            {questions.map((q, index) => (
              <Button
                key={q.question_number}
                variant={currentQuestion === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 p-0 ${
                  answers[q.question_number]
                    ? 'bg-green-900/30 border-green-700'
                    : ''
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VARKAssessment;

