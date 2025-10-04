import React from 'react';

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ steps, currentStep, onStepChange, className }) => {
  return (
    <div className={`flex items-center gap-4 ${className || ''}`}>
      {steps.map((label, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <button
            type="button"
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${
              idx + 1 === currentStep
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white/10 text-purple-200 border-white/20'
            }`}
            disabled={!onStepChange || idx + 1 === currentStep}
            onClick={() => onStepChange && onStepChange(idx + 1)}
          >
            {idx + 1}
          </button>
          <span className={`text-sm ${idx + 1 === currentStep ? 'text-white font-semibold' : 'text-purple-200'}`}>{label}</span>
          {idx < steps.length - 1 && <span className="w-8 h-1 bg-white/10 rounded" />}
        </div>
      ))}
    </div>
  );
}; 