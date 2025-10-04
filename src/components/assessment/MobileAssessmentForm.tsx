
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface AssessmentQuestion {
  id: string;
  type: 'slider' | 'checkbox' | 'radio';
  question: string;
  options?: string[];
  min?: number;
  max?: number;
  value?: number | string | string[];
}

interface MobileAssessmentFormProps {
  questions: AssessmentQuestion[];
  currentSection: number;
  totalSections: number;
  onNext: () => void;
  onPrevious: () => void;
  onAnswer: (questionId: string, value: any) => void;
}

export const MobileAssessmentForm: React.FC<MobileAssessmentFormProps> = ({
  questions,
  currentSection,
  totalSections,
  onNext,
  onPrevious,
  onAnswer
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    onAnswer(questionId, value);
  };

  const progress = (currentSection / totalSections) * 100;

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-gray-800">
        <div className="container-mobile py-4">
          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm font-medium">Progress</span>
              <span className="text-purple-400 text-sm font-medium">
                {currentSection} of {totalSections}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-mobile"
          >
            {questions.map((question, index) => (
              <div key={question.id} className="mb-8">
                {question.type === 'slider' && (
                  <div className="card-mobile">
                    <label className="block text-white font-medium mb-6 text-lg">
                      {question.question}
                    </label>
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type="range"
                          min={question.min || 1}
                          max={question.max || 10}
                          value={answers[question.id] || question.min || 1}
                          onChange={(e) => handleAnswer(question.id, parseInt(e.target.value))}
                          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer touch-slider"
                          style={{
                            background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${
                              ((answers[question.id] || question.min || 1) / (question.max || 10)) * 100
                            }%, #374151 ${
                              ((answers[question.id] || question.min || 1) / (question.max || 10)) * 100
                            }%, #374151 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {question.min || 1}
                        </span>
                        <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg px-3 py-1">
                          <span className="text-purple-400 font-bold text-lg">
                            {answers[question.id] || question.min || 1}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {question.max || 10}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {question.type === 'checkbox' && (
                  <div className="card-mobile">
                    <h3 className="text-white font-medium mb-6 text-lg">
                      {question.question}
                    </h3>
                    <div className="space-y-3">
                      {question.options?.map((option) => {
                        const isSelected = Array.isArray(answers[question.id]) 
                          ? answers[question.id].includes(option)
                          : false;
                        
                        return (
                          <motion.label
                            key={option}
                            className={`
                              relative flex items-center p-4 rounded-lg border cursor-pointer transition-all touch-area
                              ${isSelected
                                ? 'bg-purple-900/20 border-purple-500/50 text-white'
                                : 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:border-gray-600'
                              }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const currentAnswers = Array.isArray(answers[question.id]) 
                                ? answers[question.id] 
                                : [];
                              const newAnswers = isSelected
                                ? currentAnswers.filter((a: string) => a !== option)
                                : [...currentAnswers, option];
                              handleAnswer(question.id, newAnswers);
                            }}
                          >
                            <input type="checkbox" className="sr-only" />
                            <div className={`
                              w-5 h-5 rounded border-2 mr-4 flex items-center justify-center transition-all
                              ${isSelected 
                                ? 'bg-purple-600 border-purple-600' 
                                : 'border-gray-600'
                              }
                            `}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm md:text-base font-medium">{option}</span>
                          </motion.label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {question.type === 'radio' && (
                  <div className="card-mobile">
                    <h3 className="text-white font-medium mb-6 text-lg">
                      {question.question}
                    </h3>
                    <div className="space-y-3">
                      {question.options?.map((option) => {
                        const isSelected = answers[question.id] === option;
                        
                        return (
                          <motion.label
                            key={option}
                            className={`
                              relative flex items-center p-4 rounded-lg border cursor-pointer transition-all touch-area
                              ${isSelected
                                ? 'bg-purple-900/20 border-purple-500/50 text-white'
                                : 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:border-gray-600'
                              }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAnswer(question.id, option)}
                          >
                            <input type="radio" className="sr-only" />
                            <div className={`
                              w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all
                              ${isSelected 
                                ? 'bg-purple-600 border-purple-600' 
                                : 'border-gray-600'
                              }
                            `}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="text-sm md:text-base font-medium">{option}</span>
                          </motion.label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-gray-800">
        <div className="container-mobile py-4">
          <div className="flex justify-between items-center">
            <motion.button
              onClick={onPrevious}
              disabled={currentSection === 1}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg transition-all touch-area
                ${currentSection === 1 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-white'
                }
              `}
              whileHover={currentSection > 1 ? { x: -5 } : {}}
              whileTap={currentSection > 1 ? { scale: 0.95 } : {}}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </motion.button>

            <motion.button
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium shadow-lg touch-area"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>
                {currentSection === totalSections ? 'Complete' : 'Next'}
              </span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
