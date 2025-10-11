import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps = []
}) => {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = currentStep === index;
        const isUpcoming = index > currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isCompleted && 'bg-green-500',
                  isCurrent && 'bg-blue-500 ring-4 ring-blue-500/30',
                  isUpcoming && 'bg-gray-700'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-white font-medium">{index + 1}</span>
                )}
              </div>
              
              {/* Label */}
              <div className="mt-2 text-center">
                <p className={cn(
                  'text-sm font-medium',
                  (isCompleted || isCurrent) ? 'text-white' : 'text-gray-500'
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-400 mt-1 max-w-32">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  'flex-1 h-0.5 mx-4 transition-colors',
                  index < currentStep ? 'bg-green-500' : 'bg-gray-700'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;

