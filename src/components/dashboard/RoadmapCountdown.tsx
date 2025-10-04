
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface RoadmapCountdownProps {
  roadmapExpectedAt?: string;
  roadmapGenerated?: boolean;
  onRefresh?: () => void;
}

export const RoadmapCountdown: React.FC<RoadmapCountdownProps> = ({
  roadmapExpectedAt,
  roadmapGenerated,
  onRefresh
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!roadmapExpectedAt || roadmapGenerated) return;

    const updateCountdown = () => {
      const expected = new Date(roadmapExpectedAt).getTime();
      const now = Date.now();
      const remaining = expected - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsOverdue(true);
      } else {
        setTimeRemaining(remaining);
        setIsOverdue(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [roadmapExpectedAt, roadmapGenerated]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!roadmapExpectedAt) return 0;
    const total = 15 * 60 * 1000; // 15 minutes in ms
    const elapsed = total - timeRemaining;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  if (!roadmapExpectedAt) return null;

  if (roadmapGenerated) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center space-x-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">Your Roadmap is Ready!</h3>
            <p className="text-sm text-green-700">Your personalised business roadmap has been generated.</p>
          </div>
          <Button 
            onClick={onRefresh}
            className="bg-green-600 hover:bg-green-700"
          >
            View Roadmap
          </Button>
        </div>
      </Card>
    );
  }

  if (isOverdue) {
    return (
      <Card className="p-6 bg-orange-50 border-orange-200">
        <div className="flex items-center space-x-4">
          <AlertCircle className="w-8 h-8 text-orange-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900">Roadmap Generation Taking Longer</h3>
            <p className="text-sm text-orange-700">
              Your roadmap is taking a bit longer than expected. This can happen with complex assessments.
            </p>
          </div>
          <Button 
            onClick={onRefresh} 
            variant="outline"
            className="border-orange-600 text-orange-600 hover:bg-orange-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Status
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-blue-50 border-blue-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
            <div>
              <h3 className="font-semibold text-blue-900">Generating Your Roadmap</h3>
              <p className="text-sm text-blue-700">
                Our AI is creating your personalised business roadmap...
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatTime(timeRemaining)}
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={getProgress()} className="h-2" />
          <p className="text-xs text-blue-600 text-center">
            Estimated time remaining: {formatTime(timeRemaining)}
          </p>
        </div>

        <div className="text-sm text-blue-700 space-y-1">
          <p>✨ Analysing your assessment responses</p>
          <p>🎯 Identifying key priorities and quick wins</p>
          <p>📈 Creating your personalised growth strategy</p>
        </div>
      </div>
    </Card>
  );
};
