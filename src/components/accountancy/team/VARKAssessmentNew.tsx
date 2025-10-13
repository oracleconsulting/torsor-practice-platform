/**
 * Comprehensive VARK Learning Styles Assessment
 * One question per screen with progress tracking and animations
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Ear,
  FileText,
  Hand,
  SkipForward
} from 'lucide-react';
import { varkQuestions, calculateVARKProfile, type VARKProfile } from '@/data/varkQuestions';

interface VARKAssessmentProps {
  teamMemberId: string;
  onComplete: (profile: VARKProfile) => void;
  onCancel?: () => void;
}

interface Response {
  questionId: number;
  type: 'V' | 'A' | 'R' | 'K' | null;
}

const STORAGE_KEY = 'vark_assessment_progress';

export default function VARKAssessmentNew({ teamMemberId, onComplete, onCancel }: VARKAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Response[]>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem(`${STORAGE_KEY}_${teamMemberId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved responses:', e);
      }
    }
    // Initialize with null responses
    return varkQuestions.map(q => ({ questionId: q.id, type: null }));
  });

  const [selectedOption, setSelectedOption] = useState<'V' | 'A' | 'R' | 'K' | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Auto-save progress
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_${teamMemberId}`, JSON.stringify(responses));
  }, [responses, teamMemberId]);

  // Load current question's response
  useEffect(() => {
    setSelectedOption(responses[currentQuestion]?.type || null);
  }, [currentQuestion, responses]);

  const totalQuestions = varkQuestions.length;
  const answeredCount = responses.filter(r => r.type !== null).length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  const question = varkQuestions[currentQuestion];

  const handleOptionSelect = (type: 'V' | 'A' | 'R' | 'K') => {
    setSelectedOption(type);
    
    // Update response
    const newResponses = [...responses];
    newResponses[currentQuestion] = { questionId: question.id, type };
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setDirection('forward');
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Complete assessment
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setDirection('backward');
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSkip = () => {
    // Skip counts as no preference
    const newResponses = [...responses];
    newResponses[currentQuestion] = { questionId: question.id, type: null };
    setResponses(newResponses);
    handleNext();
  };

  const handleComplete = () => {
    // Calculate profile
    const profile = calculateVARKProfile(responses);
    
    // Clear localStorage
    localStorage.removeItem(`${STORAGE_KEY}_${teamMemberId}`);
    
    // Trigger completion
    onComplete(profile);
  };

  const canGoNext = selectedOption !== null;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  const variants = {
    enter: (direction: string) => ({
      x: direction === 'forward' ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: string) => ({
      x: direction === 'forward' ? -300 : 300,
      opacity: 0
    })
  };

  const getOptionIcon = (type: string) => {
    switch (type) {
      case 'V': return <Eye className="w-5 h-5" />;
      case 'A': return <Ear className="w-5 h-5" />;
      case 'R': return <FileText className="w-5 h-5" />;
      case 'K': return <Hand className="w-5 h-5" />;
      default: return null;
    }
  };

  const getOptionColor = (type: string) => {
    switch (type) {
      case 'V': return 'border-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'A': return 'border-green-500 bg-green-50 hover:bg-green-100';
      case 'R': return 'border-purple-500 bg-purple-50 hover:bg-purple-100';
      case 'K': return 'border-orange-500 bg-orange-50 hover:bg-orange-100';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VARK Learning Styles Assessment</h1>
          <p className="text-gray-600">
            Discover your preferred learning style to personalize your development journey
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {answeredCount} answered
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Question Card */}
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle className="text-2xl font-bold text-white">
              Question {currentQuestion + 1}
            </CardTitle>
            <CardDescription className="text-white font-medium opacity-90">
              Choose the option that best describes your preference
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentQuestion}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Question Text */}
                <h3 className="text-xl font-bold text-gray-900 mb-8">
                  {question.question}
                </h3>

                {/* Options */}
                <RadioGroup
                  value={selectedOption || ''}
                  onValueChange={(value) => handleOptionSelect(value as 'V' | 'A' | 'R' | 'K')}
                >
                  <div className="space-y-4">
                    {question.options.map((option, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Label
                          htmlFor={`option-${idx}`}
                          className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedOption === option.type
                              ? `${getOptionColor(option.type)} border-4 shadow-lg`
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <RadioGroupItem
                            value={option.type}
                            id={`option-${idx}`}
                            className="mt-1"
                          />
                          <div className="ml-4 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getOptionIcon(option.type)}
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {option.type === 'V' && 'Visual'}
                                {option.type === 'A' && 'Auditory'}
                                {option.type === 'R' && 'Read/Write'}
                                {option.type === 'K' && 'Kinesthetic'}
                              </span>
                            </div>
                            <p className="text-base text-gray-900 font-medium">
                              {option.text}
                            </p>
                          </div>
                          {selectedOption === option.type && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-2 mt-1"
                            >
                              <Check className="w-6 h-6 text-green-600" />
                            </motion.div>
                          )}
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </RadioGroup>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-gray-600"
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex items-center gap-2 text-gray-600"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canGoNext}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLastQuestion ? (
                <>
                  <Check className="w-4 h-4" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Learning Style Icons Legend */}
        <div className="mt-8 grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Eye className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs font-semibold text-blue-900">Visual</p>
            <p className="text-xs text-blue-700">Pictures & Diagrams</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <Ear className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-xs font-semibold text-green-900">Auditory</p>
            <p className="text-xs text-green-700">Listening & Speaking</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-xs font-semibold text-purple-900">Read/Write</p>
            <p className="text-xs text-purple-700">Reading & Writing</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Hand className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-xs font-semibold text-orange-900">Kinesthetic</p>
            <p className="text-xs text-orange-700">Hands-On & Practice</p>
          </div>
        </div>
      </div>
    </div>
  );
}

