import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MessageSquare, Target, TrendingUp, Clock, 
  CheckCircle, X, Loader2, AlertCircle, Brain
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface SprintReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  email: string;
  weekNumber: number;
}

interface ReflectionData {
  overall_satisfaction: number;
  what_worked_well: string;
  what_didnt_work: string;
  most_successful_week: number;
  least_successful_week: number;
  business_metrics_achieved: string;
  time_commitment_accuracy: string;
  usage_analytics: {
    login_frequency: string;
    avg_session_duration: string;
    most_used_features: string[];
  };
}

export default function SprintReflectionModal({ 
  isOpen, 
  onClose, 
  groupId, 
  email, 
  weekNumber 
}: SprintReflectionModalProps) {
  const [reflection, setReflection] = useState<ReflectionData>({
    overall_satisfaction: 0,
    what_worked_well: '',
    what_didnt_work: '',
    most_successful_week: 0,
    least_successful_week: 0,
    business_metrics_achieved: '',
    time_commitment_accuracy: '',
    usage_analytics: {
      login_frequency: '',
      avg_session_duration: '',
      most_used_features: []
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [analytics, setAnalytics] = useState<any>(null);

  // Fetch usage analytics
  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analytics/user-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          email: email,
          start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        setReflection(prev => ({
          ...prev,
          usage_analytics: {
            login_frequency: data.login_frequency || 'Unknown',
            avg_session_duration: data.avg_session_duration || 'Unknown',
            most_used_features: data.most_used_features || []
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/progress/trigger-regeneration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          email: email,
          reflection_data: reflection,
          analytics_data: analytics,
          week_number: weekNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit reflection');
      }

      toast.success('Thank you for your feedback! We\'ll use this to improve your next roadmap.');
      onClose();
    } catch (error) {
      console.error('Error submitting reflection:', error);
      toast.error('Failed to submit reflection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateReflection = (field: keyof ReflectionData, value: any) => {
    setReflection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return reflection.overall_satisfaction > 0;
      case 2:
        return reflection.what_worked_well.trim().length > 0;
      case 3:
        return reflection.what_didnt_work.trim().length > 0;
      case 4:
        return reflection.most_successful_week > 0 && reflection.least_successful_week > 0;
      case 5:
        return reflection.business_metrics_achieved.trim().length > 0;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Overall Satisfaction</h3>
            <p className="text-gray-600 mb-8">
              How would you rate your overall experience with the 90-day sprint?
            </p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => updateReflection('overall_satisfaction', rating)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    reflection.overall_satisfaction >= rating
                      ? 'bg-yellow-400 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <Star className="w-6 h-6" fill={reflection.overall_satisfaction >= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-500">
              {reflection.overall_satisfaction === 1 && 'Very Dissatisfied'}
              {reflection.overall_satisfaction === 2 && 'Dissatisfied'}
              {reflection.overall_satisfaction === 3 && 'Neutral'}
              {reflection.overall_satisfaction === 4 && 'Satisfied'}
              {reflection.overall_satisfaction === 5 && 'Very Satisfied'}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">What Worked Well</h3>
                <p className="text-gray-600">What aspects of the sprint were most effective?</p>
              </div>
            </div>
            
            <textarea
              value={reflection.what_worked_well}
              onChange={(e) => updateReflection('what_worked_well', e.target.value)}
              placeholder="Describe what went well, what you enjoyed, and what helped you make progress..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={6}
            />
          </div>
        );

      case 3:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">What Didn't Work</h3>
                <p className="text-gray-600">What challenges did you face?</p>
              </div>
            </div>
            
            <textarea
              value={reflection.what_didnt_work}
              onChange={(e) => updateReflection('what_didnt_work', e.target.value)}
              placeholder="Describe what was difficult, what didn't work as expected, or what could be improved..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={6}
            />
          </div>
        );

      case 4:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Week Performance</h3>
                <p className="text-gray-600">Which weeks were most and least successful?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Most Successful Week
                </label>
                <select
                  value={reflection.most_successful_week}
                  onChange={(e) => updateReflection('most_successful_week', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={0}>Select a week...</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Least Successful Week
                </label>
                <select
                  value={reflection.least_successful_week}
                  onChange={(e) => updateReflection('least_successful_week', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={0}>Select a week...</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Business Impact</h3>
                <p className="text-gray-600">What business metrics did you achieve?</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Metrics Achieved
                </label>
                <textarea
                  value={reflection.business_metrics_achieved}
                  onChange={(e) => updateReflection('business_metrics_achieved', e.target.value)}
                  placeholder="Revenue growth, time savings, new clients, process improvements..."
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Commitment Accuracy
                </label>
                <select
                  value={reflection.time_commitment_accuracy}
                  onChange={(e) => updateReflection('time_commitment_accuracy', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="much_less">Much less time than expected</option>
                  <option value="less">Less time than expected</option>
                  <option value="accurate">About as expected</option>
                  <option value="more">More time than expected</option>
                  <option value="much_more">Much more time than expected</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Usage Analytics</h3>
                <p className="text-gray-600">Here's how you used the platform</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Login Frequency</p>
                  <p className="font-semibold text-gray-800">{reflection.usage_analytics.login_frequency}</p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg">
                  <MessageSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Avg Session</p>
                  <p className="font-semibold text-gray-800">{reflection.usage_analytics.avg_session_duration}</p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg">
                  <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Most Used</p>
                  <p className="font-semibold text-gray-800">
                    {reflection.usage_analytics.most_used_features.length > 0 
                      ? reflection.usage_analytics.most_used_features[0] 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  This data helps us improve your next roadmap
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Complete Reflection'
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">90-Day Sprint Reflection</h2>
                  <p className="text-purple-100">Help us improve your next roadmap</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 w-full bg-white/20 rounded-full h-2">
                <motion.div
                  className="bg-white h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / 6) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {renderStep()}
            </div>

            {/* Navigation */}
            {currentStep < 6 && (
              <div className="p-6 border-t border-gray-100 flex justify-between">
                <Button
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {currentStep === 5 ? 'Review & Submit' : 'Next'}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 