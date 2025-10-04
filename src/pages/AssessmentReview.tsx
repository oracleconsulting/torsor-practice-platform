import { useOracleData } from '../hooks/useOracleData';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, Brain, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AssessmentReviewProps {
  part?: 1 | 2;
}

export default function AssessmentReview({ part }: AssessmentReviewProps) {
  const oracleData = useOracleData();
  const { loading, error, rawData, refreshData } = oracleData;
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [isRefetching, setIsRefetching] = useState(false);

  // Auto-retry on error
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`[AssessmentReview] Auto-retry ${retryCount + 1}/3`);
        setRetryCount(prev => prev + 1);
        refreshData?.();
      }, 2000 * (retryCount + 1)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, refreshData]);

  // Manual retry function
  const handleRetry = async () => {
    setIsRefetching(true);
    try {
      await refreshData?.();
      toast.success('Data refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefetching(false);
    }
  };

  // Show error state with retry option
  if (error && retryCount >= 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Failed to Load Assessment Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              disabled={isRefetching}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isRefetching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading assessment data...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500">Retry attempt {retryCount}/3</p>
          )}
        </div>
      </div>
    );
  }

  const formatAnswer = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Get the actual assessment data from the correct locations
  const part1Data = rawData?.part1?.responses || {};
  const part2Data = rawData?.part2?.responses || {};
  const part3Data = rawData?.part2?.part3_data || {};
  const validationData = rawData?.part2?.validation_responses || {};

  // Check if we have any data
  const hasPart1Data = Object.keys(part1Data).length > 0;
  const hasPart2Data = Object.keys(part2Data).length > 0;
  const hasPart3Data = Object.keys(part3Data).length > 0;
  const hasAnyData = hasPart1Data || hasPart2Data || hasPart3Data;

  if (!hasAnyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto p-6">
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Assessment Data Found</h2>
            <p className="text-gray-600 mb-6">
              It looks like you haven't completed any assessments yet, or the data hasn't been saved properly.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/assessment/part1')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Start Assessment
              </Button>
              <Button 
                onClick={handleRetry}
                variant="outline"
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Assessment Review
            </h1>
            <p className="text-gray-600 text-lg">
              Review your assessment responses and see how they shape your personalized journey
            </p>
          </motion.div>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">🔍 Debug: Assessment Review Status</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>Part 1 Complete: {oracleData.part1Complete ? '✅ Yes' : '❌ No'}</div>
              <div>Part 2 Complete: {oracleData.part2Complete ? '✅ Yes' : '❌ No'}</div>
              <div>Part 3 Complete: {oracleData.part3Complete ? '✅ Yes' : '❌ No'}</div>
              <div>Has Part 1 Data: {hasPart1Data ? '✅ Yes' : '❌ No'}</div>
              <div>Has Part 2 Data: {hasPart2Data ? '✅ Yes' : '❌ No'}</div>
              <div>Has Part 3 Data: {hasPart3Data ? '✅ Yes' : '❌ No'}</div>
              <div>Part 1 Answers: {Object.keys(part1Data).length} questions</div>
              <div>Part 2 Answers: {Object.keys(part2Data).length} questions</div>
              <div>Part 3 Data: {Object.keys(part3Data).length} fields</div>
            </div>
          </div>
        )}

        {/* Completion Status */}
        {oracleData.part1Complete && oracleData.part2Complete && oracleData.part3Complete && (
          <motion.div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-8 shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">All assessments complete!</h3>
                <p className="text-green-50">Your personalised roadmap is ready</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Part 1 Completion Only Status */}
        {oracleData.part1Complete && !oracleData.part2Complete && (
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Part 1 Complete!</h3>
                <p className="text-blue-50">Ready to dive deeper with Part 2?</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/assessment/part2')}
              className="mt-4 bg-white text-blue-600 hover:bg-gray-100"
            >
              Start Part 2
            </Button>
          </motion.div>
        )}

        {/* Part 1: Life Design Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Part 1: Life Design</h2>
                <p className="text-gray-600">Understanding your personal goals and constraints</p>
              </div>
              {oracleData.part1Complete && (
                <div className="ml-auto flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Completed</span>
                </div>
              )}
            </div>

            {hasPart1Data ? (
              <div className="space-y-4">
                {Object.entries(part1Data).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-800 mb-2">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">{formatAnswer(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Part 1 assessment not completed yet</p>
                <Button 
                  onClick={() => navigate('/assessment/part1')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  Start Part 1
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Part 2: Business Deep Dive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8 p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Part 2: Business Deep Dive</h2>
                <p className="text-gray-600">Analyzing your business model and opportunities</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {oracleData.part2Complete ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
                <span className={`text-sm font-medium ${
                  oracleData.part2Complete ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {oracleData.part2Complete ? 'Completed' : 'Not Started'}
                </span>
              </div>
            </div>

            {hasPart2Data ? (
              <div className="space-y-4">
                {Object.entries(part2Data).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-800 mb-2">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">{formatAnswer(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Part 2 assessment not completed yet</p>
                <Button 
                  onClick={() => navigate('/assessment/part2')}
                  className="bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  Start Part 2
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* AI Insight */}
        {oracleData.part1Complete && oracleData.part2Complete && (
          <motion.div 
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Board Insight
            </h4>
            <p className="text-purple-700 italic leading-relaxed">
              "Based on your assessment, we've identified key opportunities to reclaim 10+ hours per week 
              while increasing revenue. Your personalized roadmap in the 12-Week Plan section breaks this 
              down into actionable weekly sprints."
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          className="flex gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex-1"
          >
            Back to Dashboard
          </Button>
          {oracleData.part1Complete && oracleData.part2Complete && (
            <Button 
              onClick={() => navigate('/dashboard?section=journey')}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
            >
              View My Journey
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
} 