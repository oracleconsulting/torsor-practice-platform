import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Target, TrendingUp, Users, Lightbulb, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const AdvisoryAssessment = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);

  const assessmentSections = [
    {
      id: 'technical',
      title: 'Technical Capability',
      icon: Target,
      color: 'from-purple-600 to-pink-600',
      description: 'Assess your team\'s current expertise levels',
      questions: [
        {
          id: 'tax_planning',
          text: 'Rate your team\'s confidence in tax planning',
          type: 'scale',
          min: 1,
          max: 10,
          labels: ['Beginner', 'Expert']
        },
        {
          id: 'business_strategy',
          text: 'Rate your team\'s confidence in business strategy',
          type: 'scale',
          min: 1,
          max: 10,
          labels: ['Beginner', 'Expert']
        },
        {
          id: 'financial_forecasting',
          text: 'Rate your team\'s confidence in financial forecasting',
          type: 'scale',
          min: 1,
          max: 10,
          labels: ['Beginner', 'Expert']
        },
        {
          id: 'current_advisory',
          text: 'Which advisory areas do you currently offer?',
          type: 'multiselect',
          options: [
            'Tax planning',
            'Business strategy',
            'Financial forecasting',
            'Management reporting',
            'Succession planning',
            'Corporate restructuring',
            'None currently'
          ]
        }
      ]
    },
    {
      id: 'appetite',
      title: 'Advisory Appetite',
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-600',
      description: 'Understand your growth ambitions',
      questions: [
        {
          id: 'revenue_split',
          text: 'What % of revenue comes from advisory vs compliance?',
          type: 'scale',
          min: 0,
          max: 100,
          suffix: '% advisory',
          labels: ['All Compliance', 'All Advisory']
        },
        {
          id: 'partner_hours',
          text: 'How many hours/week can partners dedicate to advisory?',
          type: 'scale',
          min: 0,
          max: 40,
          suffix: ' hours',
          labels: ['None', '40+ hours']
        },
        {
          id: 'barriers',
          text: 'What\'s stopping you from doing more advisory work?',
          type: 'multiselect',
          options: [
            'Lack of skills/confidence',
            'No time - too busy with compliance',
            'Don\'t know how to price it',
            'Clients don\'t want to pay',
            'No structured methodology',
            'Competition from consultancies'
          ]
        }
      ]
    },
    {
      id: 'current',
      title: 'Current Projects',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      description: 'Review your existing advisory work',
      questions: [
        {
          id: 'active_projects',
          text: 'Describe your most successful advisory projects',
          type: 'textarea',
          placeholder: 'e.g., Business plan for Smith Ltd, Tax planning for Jones family...'
        },
        {
          id: 'project_duration',
          text: 'Average project duration',
          type: 'radio',
          options: [
            'Less than 1 month',
            '1-3 months',
            '3-6 months',
            '6-12 months',
            'Ongoing retainers'
          ]
        },
        {
          id: 'success_rate',
          text: 'Success rate of advisory engagements',
          type: 'scale',
          min: 0,
          max: 100,
          suffix: '% successful',
          labels: ['Poor Results', 'Excellent Results']
        }
      ]
    },
    {
      id: 'vision',
      title: 'Growth Vision',
      icon: Lightbulb,
      color: 'from-amber-600 to-orange-600',
      description: 'Define your future aspirations',
      questions: [
        {
          id: 'target_revenue',
          text: 'Target advisory revenue in 12 months',
          type: 'radio',
          options: [
            '10-25% of total revenue',
            '25-50% of total revenue',
            '50-75% of total revenue',
            '75%+ of total revenue'
          ]
        },
        {
          id: 'target_clients',
          text: 'Types of clients you want to attract',
          type: 'multiselect',
          options: [
            'Growing SMEs',
            'Family businesses',
            'Start-ups',
            'Property developers',
            'Professional services',
            'E-commerce businesses'
          ]
        },
        {
          id: 'known_for',
          text: 'What do you want your reputation to be in 3 years?',
          type: 'textarea',
          placeholder: 'Describe the services and expertise you want to be known for...'
        }
      ]
    }
  ];

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    Object.entries(responses).forEach(([key, value]) => {
      if (typeof value === 'number') {
        totalScore += value;
        maxScore += 10;
      } else if (Array.isArray(value)) {
        totalScore += value.length * 2;
        maxScore += 16;
      }
    });

    return Math.round((totalScore / maxScore) * 100);
  };

  const getRecommendations = (score: number) => {
    if (score >= 80) {
      return {
        level: 'Advanced',
        message: 'Your firm is well-positioned to expand advisory services significantly.',
        actions: [
          'Focus on premium advisory services',
          'Develop specialist industry expertise',
          'Consider acquisition of smaller practices'
        ]
      };
    } else if (score >= 60) {
      return {
        level: 'Intermediate',
        message: 'Good foundation - focus on systematic expansion of advisory capabilities.',
        actions: [
          'Implement structured advisory methodologies',
          'Invest in team training',
          'Develop recurring advisory products'
        ]
      };
    } else if (score >= 40) {
      return {
        level: 'Developing',
        message: 'Early stage - build confidence and capabilities gradually.',
        actions: [
          'Start with simple advisory services',
          'Focus on existing client relationships',
          'Invest in partner development'
        ]
      };
    } else {
      return {
        level: 'Foundational',
        message: 'Focus on building basic advisory capabilities within compliance work.',
        actions: [
          'Begin with management reporting',
          'Offer simple tax planning',
          'Build internal confidence first'
        ]
      };
    }
  };

  const currentSectionData = assessmentSections[currentSection];
  const progress = ((currentSection) / assessmentSections.length) * 100;

  if (showResults) {
    const score = calculateScore();
    const recommendations = getRecommendations(score);

    return (
      <div className="bg-black">
        {/* Animated gradient background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/30" />
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:50px_50px]" />
        </div>

        <div className="relative z-10 pt-24 px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
                >
                  {score}/100
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Your Advisory Readiness Score</h2>
                <div className="text-xl text-purple-400 mb-4">{recommendations.level} Level</div>
                <p className="text-gray-400">{recommendations.message}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Target className="w-5 h-5 text-purple-400 mr-2" />
                    Recommended Actions
                  </h3>
                  <ul className="space-y-3">
                    {recommendations.actions.map((action, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300">{action}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 text-amber-400 mr-2" />
                    Next Steps
                  </h3>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      Chat with Advisory AI Coach
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gray-700/50 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-all border border-gray-600"
                    >
                      Download Detailed Report
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowResults(false);
                    setCurrentSection(0);
                    setResponses({});
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Take Assessment Again
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/30" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:50px_50px]" />
      </div>

      <div className="relative z-10 pt-24 px-8">
        <div className="w-full overflow-auto" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Advisory Readiness Assessment</h3>
              <span className="text-purple-400 text-sm font-medium">{currentSection + 1} of {assessmentSections.length}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Main Assessment Card */}
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl"
          >
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 bg-gradient-to-br ${currentSectionData.color} rounded-lg flex items-center justify-center`}>
                  <currentSectionData.icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{currentSectionData.title}</h2>
              </div>
              <p className="text-gray-400 ml-13">{currentSectionData.description}</p>
            </div>

            {/* Questions */}
            <div className="space-y-8">
              {currentSectionData.questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all"
                >
                  <label className="block text-white font-medium mb-4">{question.text}</label>

                  {question.type === 'scale' && (
                    <div className="relative">
                      <input
                        type="range"
                        min={question.min}
                        max={question.max}
                        value={responses[question.id] || question.min}
                        onChange={(e) => setResponses(prev => ({
                          ...prev,
                          [question.id]: Number(e.target.value)
                        }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((responses[question.id] || question.min) - question.min) / (question.max - question.min) * 100}%, #374151 ${((responses[question.id] || question.min) - question.min) / (question.max - question.min) * 100}%, #374151 100%)`
                        }}
                      />
                      <div className="flex justify-between mt-3">
                        <span className="text-xs text-gray-500">{question.labels?.[0] || question.min}</span>
                        <motion.span
                          key={responses[question.id]}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="text-sm text-purple-400 font-bold"
                        >
                          {responses[question.id] || question.min}{question.suffix || ''}
                        </motion.span>
                        <span className="text-xs text-gray-500">{question.labels?.[1] || question.max}</span>
                      </div>
                    </div>
                  )}

                  {question.type === 'radio' && (
                    <RadioGroup
                      value={responses[question.id] || ''}
                      onValueChange={(value) => setResponses(prev => ({
                        ...prev,
                        [question.id]: value
                      }))}
                      className="space-y-3"
                    >
                      {question.options?.map((option, optIndex) => (
                        <motion.div
                          key={optIndex}
                          whileHover={{ x: 4 }}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/30 transition-all"
                        >
                          <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} className="border-gray-600 text-purple-400" />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="text-gray-300 cursor-pointer flex-1">
                            {option}
                          </Label>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === 'textarea' && (
                    <Textarea
                      placeholder={question.placeholder}
                      value={responses[question.id] || ''}
                      onChange={(e) => setResponses(prev => ({
                        ...prev,
                        [question.id]: e.target.value
                      }))}
                      rows={4}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    />
                  )}

                  {question.type === 'multiselect' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.options?.map((option, optIndex) => {
                        const isSelected = (responses[question.id] || []).includes(option);
                        return (
                          <motion.label
                            key={optIndex}
                            className={`
                              relative flex items-center p-4 rounded-lg border cursor-pointer transition-all
                              ${isSelected
                                ? 'bg-purple-900/20 border-purple-500/50 text-white'
                                : 'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                              }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentValues = responses[question.id] || [];
                                if (e.target.checked) {
                                  setResponses(prev => ({
                                    ...prev,
                                    [question.id]: [...currentValues, option]
                                  }));
                                } else {
                                  setResponses(prev => ({
                                    ...prev,
                                    [question.id]: currentValues.filter((v: string) => v !== option)
                                  }));
                                }
                              }}
                            />
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0"
                              >
                                <Check className="w-5 h-5" />
                              </motion.div>
                            )}
                            <span className="text-sm font-medium">{option}</span>
                          </motion.label>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-12">
              <motion.button
                onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
                disabled={currentSection === 0}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={currentSection > 0 ? { x: -5 } : {}}
              >
                <ChevronLeft className="inline-block mr-2 w-4 h-4" />
                Previous
              </motion.button>

              {currentSection === assessmentSections.length - 1 ? (
                <motion.button
                  onClick={() => setShowResults(true)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium shadow-lg"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Results
                  <Lightbulb className="inline-block ml-2 w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setCurrentSection(prev => prev + 1)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium shadow-lg"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                  <ChevronRight className="inline-block ml-2 w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
          border: 3px solid #1F2937;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
          border: 3px solid #1F2937;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
      `}</style>
    </div>
  );
};

export default AdvisoryAssessment;
