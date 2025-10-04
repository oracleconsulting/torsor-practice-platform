
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface QuestionRendererProps {
  question: any;
  answer: any;
  onAnswer: (value: any) => void;
}

export const QuestionRenderer = ({ question, answer, onAnswer }: QuestionRendererProps) => {
  const [otherText, setOtherText] = useState('');

  // Check if N/A is selected for this question
  const isNASelected = answer === '__NOT_APPLICABLE__';
  const naExplanation = typeof answer === 'object' && answer?.naExplanation || '';

  // Handle N/A toggle
  const handleNAToggle = (checked: boolean) => {
    if (checked) {
      onAnswer('__NOT_APPLICABLE__');
    } else {
      onAnswer(null);
    }
  };

  // Handle regular answer change
  const handleRegularAnswer = (value: any) => {
    if (isNASelected) return; // Don't change if N/A is selected
    onAnswer(value);
  };

  // Get the actual value (handling N/A case)
  const actualValue = isNASelected ? null : answer;

  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (isNASelected) return;
    
    const currentAnswers = Array.isArray(actualValue) ? actualValue : [];
    let newAnswers;
    
    if (checked) {
      newAnswers = [...currentAnswers, option];
    } else {
      newAnswers = currentAnswers.filter((a: string) => a !== option);
      if (option === 'Other...' && otherText) {
        setOtherText('');
      }
    }
    
    handleRegularAnswer(newAnswers);
  };

  const handleOtherTextChange = (value: string) => {
    setOtherText(value);
    const currentAnswers = Array.isArray(actualValue) ? actualValue : [];
    const withoutOther = currentAnswers.filter((a: string) => !a.startsWith('Other: '));
    if (value.trim()) {
      handleRegularAnswer([...withoutOther, `Other: ${value}`]);
    } else {
      handleRegularAnswer(withoutOther);
    }
  };

  const handleMultiPartChange = (partId: string, value: string) => {
    const currentAnswer = actualValue || {};
    handleRegularAnswer({
      ...currentAnswer,
      [partId]: value
    });
  };

  // Common N/A section for checkbox and radio questions
  const NASection = () => {
    if (!['checkbox', 'radio', 'select'].includes(question.type)) {
      return null;
    }

    return (
      <div className="mt-6 pt-4 border-t-2 border-orange-200 bg-orange-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <button
            type="button"
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isNASelected 
                ? 'border-orange-500 bg-orange-500' 
                : 'border-orange-400 hover:border-orange-500'
            }`}
            onClick={() => handleNAToggle(!isNASelected)}
          >
            {isNASelected && (
              <Check className="w-3 h-3 text-white" />
            )}
          </button>
          <div className="flex-1">
            <label 
              className="text-sm font-medium text-orange-800 cursor-pointer block"
              onClick={() => handleNAToggle(!isNASelected)}
            >
              Not Applicable / Too Early Stage
            </label>
            <p className="text-xs text-orange-600 mt-1">
              Select this if the question doesn't apply to your business yet
            </p>
          </div>
        </div>
      </div>
    );
  };

  switch (question.type) {
    case 'textarea':
      return (
        <Textarea
          value={actualValue || ''}
          onChange={(e) => handleRegularAnswer(e.target.value)}
          placeholder="Share your thoughts..."
          className="min-h-[120px] border-gray-300 focus:border-teal-600 focus:ring-teal-600 resize-none text-gray-900 bg-white placeholder:text-gray-500"
          disabled={isNASelected}
        />
      );

    case 'text':
    case 'email':
      return (
        <Input
          type={question.type}
          value={actualValue || ''}
          onChange={(e) => handleRegularAnswer(e.target.value)}
          placeholder="Your answer..."
          className="border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 bg-white placeholder:text-gray-500"
          disabled={isNASelected}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={actualValue || ''}
          onChange={(e) => handleRegularAnswer(e.target.value)}
          placeholder="Enter a number..."
          className="border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 bg-white placeholder:text-gray-500"
          disabled={isNASelected}
        />
      );

    case 'slider':
      return (
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>0</span>
            <span>10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={actualValue || 0}
            onChange={(e) => handleRegularAnswer(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            disabled={isNASelected}
          />
          <div className="text-center">
            <span className="text-lg font-semibold text-teal-600">
              {actualValue || 0}/10
            </span>
          </div>
        </div>
      );

    case 'multi-part':
      return (
        <div className="space-y-4">
          {question.parts?.map((part: any) => (
            <div key={part.id}>
              <Label className="text-gray-700 font-medium mb-2 block">
                {part.label}
              </Label>
              <Input
                value={actualValue?.[part.id] || ''}
                onChange={(e) => handleMultiPartChange(part.id, e.target.value)}
                placeholder="Your answer..."
                className="border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 bg-white placeholder:text-gray-500"
                disabled={isNASelected}
              />
            </div>
          ))}
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-3">
          <div className={`space-y-3 ${isNASelected ? 'opacity-40' : ''}`}>
            {question.options?.map((option: string) => {
              const isSelected = actualValue === option && !isNASelected;
              return (
                <label
                  key={option}
                  className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                    isSelected
                      ? 'bg-oracle-navy text-white border-oracle-navy'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-teal-500'
                  } ${isNASelected ? 'pointer-events-none' : ''}`}
                  onClick={() => !isNASelected && handleRegularAnswer(option)}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-white bg-white' 
                      : 'border-gray-400'
                  }`}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-oracle-navy"></div>
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </label>
              );
            })}
          </div>
          <NASection />
        </div>
      );

    case 'checkbox':
      const currentAnswers = Array.isArray(actualValue) ? actualValue : [];
      const hasOtherSelected = currentAnswers.some((a: string) => a.startsWith('Other'));
      
      return (
        <div className="space-y-3">
          <div className={`space-y-3 ${isNASelected ? 'opacity-40' : ''}`}>
            {question.options?.map((option: string) => {
              const isChecked = option === 'Other...' 
                ? hasOtherSelected
                : currentAnswers.includes(option);
                
              return (
                <div key={option} className="space-y-2">
                  <label
                    className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      isChecked
                        ? 'bg-oracle-navy text-white border-oracle-navy'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-teal-500'
                    } ${isNASelected ? 'pointer-events-none' : ''}`}
                    onClick={() => !isNASelected && handleCheckboxChange(option, !isChecked)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isChecked 
                        ? 'border-white bg-white' 
                        : 'border-gray-400'
                    }`}>
                      {isChecked && (
                        <Check className="w-3 h-3 text-oracle-navy" />
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </label>
                  
                  {option === 'Other...' && hasOtherSelected && question.hasOther && !isNASelected && (
                    <div className="ml-6">
                      <Textarea
                        value={otherText}
                        onChange={(e) => handleOtherTextChange(e.target.value)}
                        placeholder={question.otherLabel || "Please specify..."}
                        className="min-h-[80px] border-gray-300 focus:border-teal-600 focus:ring-teal-600 resize-none text-gray-900 bg-white placeholder:text-gray-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <NASection />
        </div>
      );

    case 'matrix':
      return (
        <div className="space-y-4">
          {question.matrixRows?.map((row: any) => (
            <div key={row.id} className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label className="text-gray-700 font-medium block mb-3">
                {row.label}
              </Label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = actualValue?.[row.id] === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        const newValue = { ...actualValue, [row.id]: num };
                        handleRegularAnswer(newValue);
                      }}
                      className={`w-10 h-10 rounded-lg border-2 font-medium transition-all ${
                        isSelected
                          ? 'bg-oracle-navy text-white border-oracle-navy'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500'
                      }`}
                      disabled={isNASelected}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>💀 (Terrible)</span>
                <span>🚀 (Excellent)</span>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
};
