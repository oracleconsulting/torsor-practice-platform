// File: src/components/feedback/FeedbackCollector.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Star, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FeedbackQuestion {
  id: string;
  question: string;
  type: 'text' | 'rating' | 'boolean' | 'select' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  scale?: number;
  min?: number;
  max?: number;
  context?: string;
}

interface FeedbackCollectorProps {
  feedbackType: string;
  questions: FeedbackQuestion[];
  onSubmit: (responses: Record<string, any>) => void;
  onSkip?: () => void;
  context?: Record<string, any>;
  title?: string;
  description?: string;
}

export default function FeedbackCollector({
  feedbackType,
  questions,
  onSubmit,
  onSkip,
  context,
  title = "Help Us Improve",
  description = "Your feedback helps us create better recommendations"
}: FeedbackCollectorProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user provides input
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    questions.forEach(question => {
      if (question.required && !responses[question.id]) {
        newErrors[question.id] = "This field is required";
      }
      
      if (responses[question.id] && question.type === 'number') {
        const value = Number(responses[question.id]);
        if (isNaN(value)) {
          newErrors[question.id] = "Please enter a valid number";
        } else if (question.min !== undefined && value < question.min) {
          newErrors[question.id] = `Minimum value is ${question.min}`;
        } else if (question.max !== undefined && value > question.max) {
          newErrors[question.id] = `Maximum value is ${question.max}`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(responses);
      setShowThankYou(true);
      setTimeout(() => {
        setShowThankYou(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: FeedbackQuestion) => {
    switch (question.type) {
      case 'rating':
        return (
          <div className="space-y-2">
            <div className="flex gap-2 justify-center">
              {Array.from({ length: question.scale || 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleResponseChange(question.id, i + 1)}
                  className={`p-3 rounded-lg transition-all ${
                    responses[question.id] === i + 1
                      ? 'bg-purple-500 text-white scale-110'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  }`}
                >
                  <Star className="w-5 h-5" fill={responses[question.id] >= i + 1 ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            {responses[question.id] && (
              <p className="text-center text-sm text-gray-400">
                {responses[question.id]} out of {question.scale || 5}
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <RadioGroup
            value={responses[question.id]?.toString()}
            onValueChange={(value) => handleResponseChange(question.id, value === 'true')}
          >
            <div className="flex gap-4 justify-center">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`} className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`} className="cursor-pointer">No</Label>
              </div>
            </div>
          </RadioGroup>
        );

      case 'select':
        return (
          <Select
            value={responses[question.id]}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            min={question.min}
            max={question.max}
            className="bg-gray-800 border-gray-700 text-center"
          />
        );

      case 'text':
      default:
        return (
          <Textarea
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={3}
            className="bg-gray-800 border-gray-700"
          />
        );
    }
  };

  if (showThankYou) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
      >
        <Card className="bg-gray-900 border-green-500 p-8">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
            <p className="text-gray-400">Your feedback helps us improve</p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="bg-gray-900/90 backdrop-blur-sm border-purple-500/30">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
              <p className="text-gray-400 text-sm">{description}</p>
            </div>
            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Context Alert if provided */}
          {context && context.message && (
            <Alert className="mb-6 bg-purple-900/30 border-purple-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{context.message}</AlertDescription>
            </Alert>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <Label className="text-white text-base">
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {question.context && (
                  <div className="bg-gray-800/50 p-3 rounded text-sm text-gray-400">
                    Current: {question.context}
                  </div>
                )}
                
                {renderQuestion(question)}
                
                {errors[question.id] && (
                  <p className="text-red-500 text-sm">{errors[question.id]}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-8">
            {onSkip && (
              <Button
                variant="outline"
                onClick={onSkip}
                className="border-gray-700"
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
