// File: src/components/feedback/MissingInfoCollector.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import FeedbackCollector from './FeedbackCollector';

interface MissingField {
  field: string;
  question: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
  required: boolean;
  context?: string;
}

interface MissingInfoCollectorProps {
  groupId: string;
  missingFields: MissingField[];
  onComplete: (responses: Record<string, any>) => void;
  onSkip?: () => void;
  context?: {
    stage: 'board' | 'roadmap' | 'assessment';
    message?: string;
  };
}

export default function MissingInfoCollector({
  groupId,
  missingFields,
  onComplete,
  onSkip,
  context
}: MissingInfoCollectorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [allResponses, setAllResponses] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);

  const requiredFields = missingFields.filter(f => f.required);
  const optionalFields = missingFields.filter(f => !f.required);
  
  // Group fields by priority
  const fieldGroups = [
    { title: "Essential Information", fields: requiredFields },
    { title: "Additional Details (Optional)", fields: optionalFields }
  ].filter(group => group.fields.length > 0);

  const currentGroup = fieldGroups[currentStep];
  const progress = ((currentStep + 1) / fieldGroups.length) * 100;

  const handleGroupSubmit = (responses: Record<string, any>) => {
    // Merge responses
    const newAllResponses = { ...allResponses, ...responses };
    setAllResponses(newAllResponses);

    if (currentStep < fieldGroups.length - 1) {
      // Move to next group
      setCurrentStep(currentStep + 1);
    } else {
      // All done
      setIsComplete(true);
      onComplete(newAllResponses);
    }
  };

  const handleSkipGroup = () => {
    if (currentStep === 0 && requiredFields.length > 0) {
      // Can't skip required fields
      return;
    }
    
    if (currentStep < fieldGroups.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(allResponses);
    }
  };

  const getContextMessage = () => {
    switch (context?.stage) {
      case 'board':
        return "We need a bit more information to find the perfect advisors for you.";
      case 'roadmap':
        return "Help us personalize your roadmap with a few more details.";
      case 'assessment':
        return "Let's fill in some gaps to create the best recommendations.";
      default:
        return "We need some additional information to proceed.";
    }
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center p-8"
      >
        <Card className="bg-gray-900 border-green-500 p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Information Updated!</h3>
            <p className="text-gray-400 mb-6">
              We're now regenerating your personalized recommendations...
            </p>
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>This will take just a moment</span>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {/* Header with progress */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <AlertCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Quick Information Check</h2>
            <p className="text-gray-400">{getContextMessage()}</p>
          </div>
        </div>
        
        {fieldGroups.length > 1 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Step {currentStep + 1} of {fieldGroups.length}</span>
              <span className="text-purple-400">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      {/* Current group of questions */}
      {currentGroup && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <FeedbackCollector
            feedbackType="missing_info"
            questions={currentGroup.fields.map(field => ({
              id: field.field,
              question: field.question,
              type: field.type,
              options: field.options,
              required: field.required,
              context: field.context
            }))}
            onSubmit={handleGroupSubmit}
            onSkip={currentGroup.fields.every(f => !f.required) ? handleSkipGroup : undefined}
            title={currentGroup.title}
            description={
              currentStep === 0 
                ? "This information will help us create more accurate recommendations"
                : "Additional details help us fine-tune your experience"
            }
          />
        </motion.div>
      )}

      {/* Navigation hint */}
      {currentStep < fieldGroups.length - 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span>Next: {fieldGroups[currentStep + 1].title}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Skip all button for non-required info */}
      {currentStep === 0 && requiredFields.length === 0 && onSkip && (
        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={onSkip}
            className="text-gray-400 hover:text-white"
          >
            Continue without providing additional information
          </Button>
        </div>
      )}
    </div>
  );
}
