import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Question, Section } from '@/data/part2Sections';

interface Part2SectionProps {
  section: any; // Accept any for now to support both Section types
  responses: Record<string, any>;
  onResponseChange: (questionId: string, value: any) => void;
}

export const Part2Section = ({ section, responses, onResponseChange }: Part2SectionProps) => {
  const [visibleQuestions, setVisibleQuestions] = useState<Set<string | number>>(new Set());

  // Initialize slider values when component mounts
  useEffect(() => {
    section.questions.forEach((question: any) => {
      if (question.type === 'slider' && responses[question.fieldName || question.id] === undefined) {
        onResponseChange(question.fieldName || question.id, 0);
      }
    });
  }, [section.questions, responses, onResponseChange]);

  // Update visible questions based on conditional logic
  useEffect(() => {
    const newVisibleQuestions = new Set<string | number>();
    
    section.questions.forEach((question: any) => {
      if (!question.conditional) {
        newVisibleQuestions.add(question.fieldName || question.id);
      } else {
        const conditionQuestionId = question.conditional.if?.questionId || question.conditional.dependsOn;
        const conditionValue = question.conditional.if?.value || question.conditional.showWhen;
        const currentResponse = responses[conditionQuestionId];
        
        // For checkbox arrays, check if the value is included
        if (Array.isArray(currentResponse)) {
          if (currentResponse.includes(conditionValue)) {
            newVisibleQuestions.add(question.fieldName || question.id);
          }
        } else if (currentResponse === conditionValue) {
          newVisibleQuestions.add(question.fieldName || question.id);
        }
      }
    });
    
    setVisibleQuestions(newVisibleQuestions);
  }, [responses, section.questions]);

  const handleCheckboxChange = (questionId: string | number, option: string) => {
    const key = questionId;
    const currentValues = responses[key] || [];
    const isChecked = currentValues.includes(option);
    if (isChecked) {
      onResponseChange(String(key), currentValues.filter((value: string) => value !== option));
    } else {
      onResponseChange(String(key), [...currentValues, option]);
    }
  };

  const renderQuestion = (question: any, index: number) => {
    const key = question.fieldName || question.id;
    if (!visibleQuestions.has(key)) {
      return null;
    }

    return (
      <div key={key} className="space-y-3">
        <div className="flex items-start gap-2">
          <label className="text-lg font-semibold text-gray-900 leading-relaxed">
            {index + 1}. {question.question}
            {question.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        </div>
        
        {question.description && (
          <p className="text-gray-600 text-sm leading-relaxed">
            {question.description}
          </p>
        )}

        {question.helperText && (
          <p className="text-xs text-gray-500 mt-2">{question.helperText}</p>
        )}

        {question.type === 'text' && (
          <Input
            value={responses[key] || ''}
            onChange={(e) => onResponseChange(String(key), e.target.value)}
            placeholder="Your answer..."
            className="border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 placeholder:text-gray-500"
          />
        )}

        {question.type === 'number' && (
          <Input
            type="number"
            value={responses[key] || ''}
            onChange={(e) => onResponseChange(String(key), e.target.value)}
            placeholder="Enter number..."
            className="border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 placeholder:text-gray-500"
          />
        )}

        {question.type === 'email' && (
          <Input
            type="email"
            value={responses[key] || ''}
            onChange={(e) => onResponseChange(String(key), e.target.value)}
            placeholder="Enter email address..."
            className="border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 placeholder:text-gray-500"
          />
        )}

        {question.type === 'textarea' && (
          <Textarea
            value={responses[key] || ''}
            onChange={(e) => onResponseChange(String(key), e.target.value)}
            placeholder="Your answer..."
            className="min-h-[100px] border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 placeholder:text-gray-500 resize-vertical"
          />
        )}

        {question.type === 'radio' && (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const isSelected = responses[key] === option;
              return (
                <label
                  key={option}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    isSelected
                      ? 'bg-teal-50 text-teal-900 border-teal-500'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-teal-300'
                  }`}
                  onClick={() => onResponseChange(String(key), option)}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-teal-600 bg-teal-600'
                      : 'border-gray-400'
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-sm">{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'checkbox' && (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const currentValues = responses[key] || [];
              const isChecked = currentValues.includes(option);
              
              return (
                <label
                  key={option}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    isChecked
                      ? 'bg-teal-50 text-teal-900 border-teal-500'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-teal-300'
                  }`}
                  onClick={() => handleCheckboxChange(key, option)}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isChecked
                      ? 'border-teal-600 bg-teal-600'
                      : 'border-gray-400'
                  }`}>
                    {isChecked && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'slider' && (
          <div className="space-y-3">
            <Slider
              value={[responses[key] || 0]}
              onValueChange={(value) => onResponseChange(String(key), value[0])}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>0</span>
              <span className="font-medium text-gray-700">
                {responses[key] || 0}/10
              </span>
              <span>10</span>
            </div>
            {question.description && (
              <p className="text-xs text-gray-500">{question.description}</p>
            )}
          </div>
        )}

        {question.type === 'matrix' && (
          <div className="space-y-4">
            {question.matrixItems?.map((item) => (
              <div key={item.fieldName} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {item.label}
                </label>
                <div className="space-y-2">
                  <Slider
                    value={[responses[item.fieldName] || 0]}
                    onValueChange={(value) => onResponseChange(String(item.fieldName), value[0])}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>💀 (0)</span>
                    <span className="font-medium text-gray-700">
                      {responses[item.fieldName] || 0}/10
                    </span>
                    <span>🚀 (10)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {question.type === 'select' && (
          <Select onValueChange={(value) => onResponseChange(String(key), value)}>
            <SelectTrigger className="border-gray-300 focus:border-teal-600 focus:ring-teal-600 text-gray-900 bg-white">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {question.type === 'conditional' && (
          <div className="space-y-3">
            <div className="space-y-2">
              {question.options?.map((option) => {
                const isSelected = responses[key] === option;
                return (
                  <label
                    key={option}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 border-teal-500'
                        : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-teal-300'
                    }`}
                    onClick={() => onResponseChange(String(key), option)}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600'
                        : 'border-gray-400'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-sm">{option}</span>
                  </label>
                );
              })}
            </div>
            
            {responses[key] && question.conditionalQuestions && (
              <div className="ml-8 space-y-3 p-4 bg-gray-50 rounded-lg">
                {question.conditionalQuestions
                  .filter((subQ: any) => subQ.showWhen === responses[key])
                  .map((subQ: any) => (
                    <div key={subQ.id}>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        {subQ.question}
                      </label>
                      {subQ.type === 'number' && (
                        <Input
                          type="number"
                          value={responses[subQ.fieldName] || ''}
                          onChange={(e) => onResponseChange(subQ.fieldName, e.target.value)}
                          className="border-gray-300 focus:border-teal-600"
                        />
                      )}
                      {subQ.type === 'radio' && (
                        <div className="space-y-2">
                          {subQ.options?.map((opt: string) => {
                            const isSubSelected = responses[subQ.fieldName] === opt;
                            return (
                              <label
                                key={opt}
                                className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-all border ${
                                  isSubSelected
                                    ? 'bg-teal-50 text-teal-900 border-teal-500'
                                    : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300'
                                }`}
                                onClick={() => onResponseChange(subQ.fieldName, opt)}
                              >
                                <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                                  isSubSelected
                                    ? 'border-teal-600 bg-teal-600'
                                    : 'border-gray-400'
                                }`}>
                                  {isSubSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <span className="text-sm">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {subQ.type === 'checkbox' && (
                        <div className="space-y-2">
                          {subQ.options?.map((opt: string) => {
                            const currentValues = responses[subQ.fieldName] || [];
                            const isChecked = currentValues.includes(opt);
                            return (
                              <label
                                key={opt}
                                className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-all border ${
                                  isChecked
                                    ? 'bg-teal-50 text-teal-900 border-teal-500'
                                    : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300'
                                }`}
                                onClick={() => {
                                  const newValues = isChecked
                                    ? currentValues.filter((v: string) => v !== opt)
                                    : [...currentValues, opt];
                                  onResponseChange(subQ.fieldName, newValues);
                                }}
                              >
                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                                  isChecked
                                    ? 'border-teal-600 bg-teal-600'
                                    : 'border-gray-400'
                                }`}>
                                  {isChecked && (
                                    <Check className="w-2 h-2 text-white" />
                                  )}
                                </div>
                                <span className="text-sm">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {subQ.type === 'text' && (
                        <Input
                          value={responses[subQ.fieldName] || ''}
                          onChange={(e) => onResponseChange(subQ.fieldName, e.target.value)}
                          placeholder={subQ.helperText || "Your answer..."}
                          className="border-gray-300 focus:border-teal-600"
                        />
                      )}
                      {subQ.type === 'slider' && (
                        <div className="space-y-2">
                          <Slider
                            value={[responses[subQ.fieldName] || 0]}
                            onValueChange={(value) => onResponseChange(subQ.fieldName, value[0])}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>0</span>
                            <span className="font-medium text-gray-700">
                              {responses[subQ.fieldName] || 0}/10
                            </span>
                            <span>10</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {section.questions.map((question, index) => renderQuestion(question, index))}
    </div>
  );
};
