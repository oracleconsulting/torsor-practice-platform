import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AssessmentCard } from '../assessment/AssessmentCard';
import { 
  CheckCircle, Clock, ArrowRight, ChevronDown, ChevronUp,
  FileText, Brain, Target, DollarSign, Users, Shield,
  AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface AssessmentsPageProps {
  displayData: any;
  loading: boolean;
  error: string | null;
  user: any;
  profile: any;
  isAdminViewing: boolean;
  assessmentProgress: any;
  weekProgress: Record<number, any>;
  toggleTask: (weekNum: number, taskIdx: number) => void;
  updateWeekNotes: (weekNum: number, field: 'notes' | 'blockers' | 'wins', value: string) => void;
  setWeekProgress: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  userContext: any;
  navigate: any;
  setActiveSection: (section: string) => void;
  activeSection: string;
  theme: any;
  userEnergy: number;
  businessHealth: number;
  getGreeting: () => string;
  renderValue: (value: any) => React.ReactNode;
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({
  displayData,
  loading,
  navigate,
  setActiveSection,
  assessmentProgress,
  isAdminViewing
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Assessment status - use assessmentProgress data with comprehensive checks
  const hasCompletedPart1 = !!(assessmentProgress?.part1Complete && assessmentProgress?.fitMessage);
  const hasCompletedPart2 = !!(assessmentProgress?.part2Complete && assessmentProgress?.roadmapGenerated);
  const hasCompletedPart3 = !!(
    assessmentProgress?.part3Complete || 
    assessmentProgress?.part3_complete ||
    (assessmentProgress?.part3Answers && Object.keys(assessmentProgress.part3Answers).length > 0) ||
    (displayData?.part3Answers && Object.keys(displayData.part3Answers).length > 0) ||
    assessmentProgress?.value_analysis_generated ||
    displayData?.valueAnalysisComplete
  );
  const hasCompletedValidation = !!(assessmentProgress?.validationComplete || assessmentProgress?.validation_complete);
  
  // Use the comprehensive checks for completion status
  const part1Complete = hasCompletedPart1 || displayData?.part1Complete || false;
  const part2Complete = hasCompletedPart2 || displayData?.part2Complete || false;
  const part3Complete = hasCompletedPart3 || displayData?.part3Complete || false;
  const validationComplete = hasCompletedValidation || displayData?.validationComplete || false;

  const assessments = [
    {
      id: 'part1',
      title: 'Part 1: Life Design',
      description: 'Understanding your personal goals and constraints',
      icon: Brain,
      complete: part1Complete,
      route: '/assessment/part1',
      color: 'purple',
      answers: displayData?.part1Answers
    },
    {
      id: 'part2',
      title: 'Part 2: Business Deep Dive',
      description: 'Analyzing your business model and opportunities',
      icon: Target,
      complete: part2Complete,
      route: '/assessment/part2',
      color: 'blue',
      answers: displayData?.part2Answers,
      disabled: !part1Complete
    },
    {
      id: 'validation',
      title: 'Validation Questions',
      description: 'Quick validation to finalize your roadmap',
      icon: Shield,
      complete: validationComplete,
      route: '/assessment/validation',
      color: 'green',
      answers: displayData?.validationResponses,
      disabled: !part2Complete
    },
    {
      id: 'part3',
      title: 'Part 3: Hidden Value Audit',
      description: 'Discover invisible barriers and untapped assets worth £50k+',
      icon: DollarSign,
      complete: part3Complete,
      route: '/assessment/part3',
      color: 'orange',
      answers: displayData?.part3Answers,
      disabled: !validationComplete,
      badge: '£50k+ Value'
    }
  ];

  const completedCount = assessments.filter(a => a.complete).length;
  const overallProgress = (completedCount / assessments.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Assessment Overview</h1>
        <p className="text-white/80 text-lg">Track your progress through the Oracle Method assessment</p>
      </div>

      {/* Overall Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Progress</h2>
          <span className="text-2xl font-bold text-purple-600">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <motion.div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                assessment.complete 
                  ? 'bg-green-100 text-green-600' 
                  : assessment.disabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {assessment.complete ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-700">{assessment.title.split(':')[0]}</p>
              <p className={`text-xs ${assessment.complete ? 'text-green-600' : 'text-gray-500'}`}>
                {assessment.complete ? 'Complete' : assessment.disabled ? 'Locked' : 'Available'}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Assessment Cards */}
      <div className="space-y-4">
        {assessments.map((assessment) => {
          const Icon = assessment.icon;
          const isExpanded = expandedSections[assessment.id];

          return (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: assessments.indexOf(assessment) * 0.1 }}
            >
              <Card className={`overflow-hidden ${assessment.disabled ? 'opacity-60' : ''}`}>
                <div className={`p-6 ${assessment.complete ? 'bg-gradient-to-r from-green-50 to-emerald-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        assessment.complete 
                          ? 'bg-green-500 text-white' 
                          : `bg-${assessment.color}-100 text-${assessment.color}-600`
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-800">{assessment.title}</h3>
                          {assessment.badge && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                              {assessment.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{assessment.description}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          {!assessment.complete && !assessment.disabled && (
                            <Button
                              onClick={() => navigate?.(assessment.route)}
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 to-blue-500"
                            >
                              Start Assessment
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                          
                          {assessment.complete && (
                            <>
                              <Button
                                onClick={() => toggleSection(assessment.id)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    Hide Answers
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    View Answers
                                  </>
                                )}
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                              
                              {assessment.id === 'part3' && (
                                <Button
                                  onClick={() => setActiveSection('part3-review')}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  View Analysis
                                </Button>
                              )}
                              
                              <button
                                onClick={() => navigate('/assessment/review')}
                                className="mt-2 text-purple-600 hover:text-purple-800 underline text-sm"
                              >
                                View Answers
                              </button>
                            </>
                          )}
                          
                          {assessment.disabled && (
                            <span className="text-sm text-gray-500">
                              Complete previous assessment first
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Answers Section */}
                  {isExpanded && assessment.answers && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 pt-6 border-t border-gray-100"
                    >
                      <h4 className="font-semibold text-gray-800 mb-4">Your Answers</h4>
                      <div className="space-y-3">
                        {Object.entries(assessment.answers).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-700 mb-2">
                              {formatQuestionKey(key)}
                            </h5>
                            <p className="text-gray-600">{formatAnswer(value)}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Helper functions
function formatQuestionKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatAnswer(value: any): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
} 