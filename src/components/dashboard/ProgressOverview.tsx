'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, ArrowRight, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { AssessmentDatabaseService } from '@/services/assessmentDatabaseService';
import { useAuth } from '@/hooks/useAuth';

export const ProgressOverview = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, onRefresh } = useAssessmentProgress();
  const part2Started = Object.keys(progress.part2Answers || {}).length > 0;

  useEffect(() => {
    // Initial refresh when component mounts
    onRefresh();
  }, [onRefresh]);

  const handleContinue = () => {
    if (!progress.part1Complete) {
      navigate('/assessment');
    }
  };

  const handleContinuePart2 = () => {
    navigate('/assessment/part2');
  };

  const handleReviewPart1 = () => {
    navigate('/assessment?mode=review');
  };

  useEffect(() => {
    const refreshState = async () => {
      if (user?.id) {
        try {
          const refreshedProgress = await AssessmentDatabaseService.forceRefreshAssessmentState(user.id);
          onRefresh();
        } catch (error) {
          console.error('Error refreshing assessment state:', error);
        }
      }
    };
    refreshState();
  }, [user?.id, onRefresh]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-oracle-navy">Assessment Progress</CardTitle>
          {progress.fitMessage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-oracle-navy hover:bg-oracle-gold/10"
            >
              {isMinimized ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {progress.part1Complete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Clock className="w-5 h-5 text-orange-500" />
            )}
            <div>
              <p className="font-medium text-oracle-navy">Part 1: Foundation Assessment</p>
              <p className="text-sm text-gray-600">
                {progress.part1Complete ? 'Completed' : '10 strategic questions'}
              </p>
            </div>
          </div>
          {!progress.part1Complete && (
            <Button
              onClick={() => navigate('/assessment/part1')}
              size="sm"
              className="bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy"
            >
              Start Part 1
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg ${
          !progress.part1Complete ? 'opacity-50' : ''
        }`}>
          <div className="flex items-center space-x-3">
            {progress.part2Complete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Clock className={`w-5 h-5 ${progress.part1Complete ? 'text-orange-500' : 'text-gray-400'}`} />
            )}
            <div>
              <p className={`font-medium ${progress.part1Complete ? 'text-oracle-navy' : 'text-gray-500'}`}>
                Part 2: Deep Dive Assessment
              </p>
              <p className="text-sm text-gray-600">
                {progress.part2Complete ? 'Completed' : 
                 part2Started ? `In progress - Section ${progress.currentPart2Section + 1}` :
                 progress.part1Complete ? 'Detailed business analysis' : 'Complete Part 1 first'}
              </p>
            </div>
          </div>
          {progress.part1Complete && !progress.part2Complete && (
            <Button
              onClick={handleContinuePart2}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {part2Started ? 'Continue Part 2' : 'Start Part 2'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Assessment Result - Minimizable */}
        {progress.fitMessage && !isMinimized && (
          <div className="bg-oracle-navy/5 p-4 rounded-lg">
            <h3 className="font-medium text-oracle-navy mb-2">Your Personalized Fit Analysis</h3>
            <p className="text-oracle-navy/80 text-sm whitespace-pre-line">{progress.fitMessage}</p>
          </div>
        )}

        {progress.part2Complete && progress.roadmapGenerated && (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-green-800">Personalized Roadmap</p>
                <p className="text-sm text-green-600">Your strategic roadmap is ready!</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
