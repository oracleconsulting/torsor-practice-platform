import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { toast } from 'sonner';

export const AssessmentGenerationProgress = () => {
  const navigate = useNavigate();
  const { progress, checkRoadmapStatus } = useAssessmentProgress();
  const [checkCount, setCheckCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (progress.boardGenerated && progress.roadmapGenerated) return 100;
    if (progress.boardGenerated) return 50;
    return 10;
  };

  // Check generation status periodically
  useEffect(() => {
    const checkStatus = async () => {
      if (progress.boardGenerated && progress.roadmapGenerated) {
        // Both complete - show success briefly then navigate
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        return;
      }

      setIsChecking(true);
      try {
        const status = await checkRoadmapStatus();
        console.log('Roadmap status check result:', status);
        
        if (status && (status.roadmapExists || status.boardExists)) {
          toast.success('🎉 Your personalised roadmap is ready!');
          // Force navigation after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Check every 10 seconds for up to 10 minutes
    const interval = setInterval(() => {
      if (checkCount < 60) { // 60 * 10s = 10 minutes
        checkStatus();
        setCheckCount(prev => prev + 1);
      } else {
        clearInterval(interval);
        toast.error('Generation is taking longer than expected. Please check your dashboard.');
      }
    }, 10000);

    // Initial check
    checkStatus();

    return () => clearInterval(interval);
  }, [progress.boardGenerated, progress.roadmapGenerated, checkCount]);

  const getStageMessage = () => {
    if (progress.boardGenerated && progress.roadmapGenerated) {
      return "All done! Redirecting to your dashboard...";
    }
    if (progress.boardGenerated) {
      return "Creating your personalized 90-day roadmap...";
    }
    return "Selecting your AI advisory board...";
  };

  const getEstimatedTime = () => {
    if (!progress.boardGenerated) return "1-2 minutes";
    return "2-3 minutes";
  };

  return (
    <div className="min-h-screen bg-oracle-cream flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white/90 backdrop-blur border-oracle-navy/20">
        <CardHeader>
          <CardTitle className="text-2xl text-oracle-navy text-center">
            Generating Your Personalised Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Message */}
          <div className="text-center space-y-2">
            <p className="text-lg text-oracle-navy/80">{getStageMessage()}</p>
            <p className="text-sm text-oracle-navy/60">
              Estimated time remaining: {getEstimatedTime()}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-oracle-navy/60">
              <span>Assessment Complete</span>
              <span>{getProgressPercentage()}%</span>
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="space-y-4">
            <StageIndicator
              icon={CheckCircle}
              title="Assessment Analysed"
              status="complete"
            />
            <StageIndicator
              icon={progress.boardGenerated ? CheckCircle : isChecking ? Loader2 : Clock}
              title="AI Board Selection"
              status={progress.boardGenerated ? "complete" : "in-progress"}
              isAnimating={!progress.boardGenerated && isChecking}
            />
            <StageIndicator
              icon={progress.roadmapGenerated ? CheckCircle : progress.boardGenerated ? (isChecking ? Loader2 : Clock) : Clock}
              title="90-Day Roadmap Creation"
              status={progress.roadmapGenerated ? "complete" : progress.boardGenerated ? "in-progress" : "pending"}
              isAnimating={progress.boardGenerated && !progress.roadmapGenerated && isChecking}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {progress.boardGenerated && progress.roadmapGenerated ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy"
              >
                View Your Roadmap
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  Continue to Dashboard
                </Button>
                <Button
                  onClick={async () => {
                    setIsChecking(true);
                    try {
                      const status = await checkRoadmapStatus();
                      console.log('Manual refresh result:', status);
                      if (status && (status.roadmapExists || status.boardExists)) {
                        toast.success('🎉 Your roadmap is ready!');
                        setTimeout(() => navigate('/dashboard'), 1000);
                      } else {
                        toast.info('Still processing... Check back in a moment.');
                      }
                    } catch (error) {
                      console.error('Manual refresh error:', error);
                      toast.error('Failed to check status. Please try again.');
                    } finally {
                      setIsChecking(false);
                    }
                  }}
                  disabled={isChecking}
                  variant="outline"
                  className="w-full"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    'Refresh Status'
                  )}
                </Button>
                <p className="text-xs text-center text-oracle-navy/50">
                  You'll be notified when your roadmap is ready
                </p>
              </>
            )}
          </div>

          {/* Helpful Information */}
          <div className="bg-oracle-gold/10 p-4 rounded-lg">
            <h4 className="font-semibold text-oracle-navy mb-2">What's happening?</h4>
            <ul className="text-sm text-oracle-navy/70 space-y-1">
              <li>• Our AI is analyzing your responses to select the perfect advisory board</li>
              <li>• We're creating a customised 90-day action plan based on your specific situation</li>
              <li>• Your roadmap will include weekly milestones and ROI projections</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Stage Indicator Component
interface StageIndicatorProps {
  icon: React.ElementType;
  title: string;
  status: 'complete' | 'in-progress' | 'pending';
  isAnimating?: boolean;
}

const StageIndicator: React.FC<StageIndicatorProps> = ({ icon: Icon, title, status, isAnimating = false }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'complete': return 'text-green-600';
      case 'in-progress': return 'text-oracle-gold';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Icon 
        className={`h-5 w-5 ${getStatusColor()} ${isAnimating ? 'animate-spin' : ''}`} 
      />
      <span className={`${status === 'complete' ? 'text-oracle-navy' : 'text-oracle-navy/60'}`}>
        {title}
      </span>
    </div>
  );
}; 