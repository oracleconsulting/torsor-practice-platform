import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Rocket, 
  Target, 
  TrendingUp, 
  Award, 
  Zap, 
  Star, 
  Crown, 
  Gem,
  Sparkles,
  Flame,
  Mountain,
  Compass,
  Trophy,
  Lightbulb,
  Shield,
  Heart
} from 'lucide-react';

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  status: 'completed' | 'current' | 'upcoming';
  metrics?: {
    value: string;
    label: string;
  };
}

interface JourneyTimelineProps {
  currentStep?: number;
  roadmap?: any;
  fitMessage?: string;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  currentStep = 1,
  roadmap,
  fitMessage
}) => {
  const steps: JourneyStep[] = [
    {
      id: 'now',
      title: 'Starting Point',
      description: 'Begin your transformation journey',
      icon: Rocket,
      color: 'from-emerald-500 to-teal-600',
      gradient: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      status: 'completed',
      metrics: {
        value: 'NOW',
        label: 'Current State'
      }
    },
    {
      id: 'milestone-1',
      title: 'First Milestone',
      description: 'Systems in place, revenue growing',
      icon: Target,
      color: 'from-blue-500 to-indigo-600',
      gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      status: currentStep >= 2 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming',
      metrics: {
        value: 'M1',
        label: 'Foundation'
      }
    },
    {
      id: 'major-shift',
      title: 'Major Shift',
      description: 'Working ON the business, not IN it',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-600',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-600',
      status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'current' : 'upcoming',
      metrics: {
        value: 'M2',
        label: 'Transformation'
      }
    },
    {
      id: 'ultimate-vision',
      title: 'Ultimate Vision',
      description: 'Your fully realized transformation',
      icon: Crown,
      color: 'from-amber-500 to-orange-600',
      gradient: 'bg-gradient-to-r from-amber-500 to-orange-600',
      status: currentStep >= 4 ? 'completed' : currentStep === 3 ? 'current' : 'upcoming',
      metrics: {
        value: 'Y',
        label: 'Vision'
      }
    }
  ];

  const getStepIcon = (step: JourneyStep) => {
    const Icon = step.icon;
    const baseClasses = "w-8 h-8";
    
    switch (step.status) {
      case 'completed':
        return (
          <div className={`${step.gradient} rounded-full p-2 shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300`}>
            <Icon className={`${baseClasses} text-white`} />
          </div>
        );
      case 'current':
        return (
          <div className={`${step.gradient} rounded-full p-2 shadow-lg animate-pulse`}>
            <Icon className={`${baseClasses} text-white`} />
          </div>
        );
      default:
        return (
          <div className="bg-gray-200 rounded-full p-2">
            <Icon className={`${baseClasses} text-gray-400`} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3 shadow-lg">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Transformation Timeline
          </h2>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          A visual roadmap of your journey from where you are now to your ultimate vision
        </p>
      </motion.div>

      {/* Timeline Steps */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 via-purple-500 to-amber-500 transform -translate-x-1/2" />
        
        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="relative flex items-start gap-6"
            >
              {/* Step Icon */}
              <div className="relative z-10 flex-shrink-0">
                {getStepIcon(step)}
                
                {/* Status Indicator */}
                {step.status === 'current' && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                  />
                )}
              </div>

              {/* Step Content */}
              <motion.div 
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className={`border-2 ${
                  step.status === 'completed' ? 'border-emerald-200 bg-emerald-50' :
                  step.status === 'current' ? 'border-blue-200 bg-blue-50 shadow-lg' :
                  'border-gray-200 bg-white'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${
                          step.status === 'completed' ? 'text-emerald-800' :
                          step.status === 'current' ? 'text-blue-800' :
                          'text-gray-800'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm ${
                          step.status === 'completed' ? 'text-emerald-600' :
                          step.status === 'current' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                      
                      {/* Metrics Badge */}
                      {step.metrics && (
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          step.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          step.status === 'current' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <div className="font-bold">{step.metrics.value}</div>
                          <div className="text-xs opacity-75">{step.metrics.label}</div>
                        </div>
                      )}
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2">
                      {step.status === 'completed' && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                      {step.status === 'current' && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <motion.div 
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 bg-blue-500 rounded-full" 
                          />
                          <span className="text-sm font-medium">In Progress</span>
                        </div>
                      )}
                      {step.status === 'upcoming' && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          <span className="text-sm">Upcoming</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Enhanced Fit Assessment */}
      {fitMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3 shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-900 mb-2">Your Fit Assessment</h3>
                  <p className="text-purple-700 leading-relaxed">
                    {fitMessage}
                  </p>
                </div>
              </div>
              
              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-gray-800">Energy</span>
                  </div>
                  <p className="text-sm text-gray-600">High drive and ambition</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-gray-800">Goals</span>
                  </div>
                  <p className="text-sm text-gray-600">£1.5M turnover target</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-gray-800">Security</span>
                  </div>
                  <p className="text-sm text-gray-600">Freedom and stability</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}; 