
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Clock, PlayCircle, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProgressState {
  currentPart1Question: number;
  part1Complete: boolean;
  part2Complete: boolean;
  validationComplete: boolean;
  part3Complete: boolean;
  valueAnalysisComplete: boolean;
  roadmapGenerated: boolean;
}

interface ActionCardsProps {
  progress: ProgressState;
  onStartAssessment: () => void;
  onContinueAssessment: () => void;
  onViewResults: () => void;
}

export const ActionCards = ({ 
  progress, 
  onStartAssessment, 
  onContinueAssessment, 
  onViewResults 
}: ActionCardsProps) => {
  const navigate = useNavigate();

  const handleStartPart1 = () => {
    // Navigate to dashboard with assessment parameter
    navigate('/dashboard?assessment=part1');
    if (onStartAssessment) onStartAssessment();
  };

  const handleStartPart2 = () => {
    // Navigate directly to Part 2 assessment page
    navigate('/assessment/part2');
  };

  const handleStartPart3 = () => {
    // Navigate directly to Part 3 assessment page
    navigate('/assessment/part3');
  };

  const handleViewValueAnalysis = () => {
    // Navigate to value analysis page
    navigate('/dashboard/value-analysis');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Start/Continue Assessment Card */}
      {!progress.part1Complete ? (
        <Card className="bg-white/80 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartPart1}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-oracle-gold/20 rounded-full">
                <PlayCircle className="h-6 w-6 text-oracle-gold" />
              </div>
              <CardTitle className="text-oracle-navy">
                {progress.currentPart1Question > 0 ? 'Continue Assessment' : 'Start Your Assessment'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              {progress.currentPart1Question > 0 
                ? `You're ${progress.currentPart1Question}/10 questions in. Let's keep the momentum going!`
                : 'Begin your 10-minute journey to business clarity. Discover what\'s holding you back and create your path forward.'
              }
            </CardDescription>
            <Button className="w-full bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy font-semibold">
              {progress.currentPart1Question > 0 ? 'Continue' : 'Start Assessment'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : !progress.part2Complete ? (
        <Card className="bg-white/80 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartPart2}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-oracle-navy/20 rounded-full">
                <ArrowRight className="h-6 w-6 text-oracle-navy" />
              </div>
              <CardTitle className="text-oracle-navy">Continue to Part 2</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Great progress! Now let's dive deeper into your business model and operations to create your personalized roadmap.
            </CardDescription>
            <Button className="w-full bg-oracle-navy hover:bg-oracle-navy/90 text-oracle-cream font-semibold">
              Start Part 2
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : progress.validationComplete && !progress.part3Complete ? (
        <Card 
          className="bg-white/80 backdrop-blur hover:shadow-lg transition-all cursor-pointer border-2 border-oracle-gold"
          onClick={handleStartPart3}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-oracle-gold/20 rounded-full">
                <Sparkles className="h-6 w-6 text-oracle-gold" />
              </div>
              <CardTitle className="text-oracle-navy">Start Hidden Value Audit</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Discover the invisible barriers and untapped assets in your business. 
              This final assessment reveals 20+ hidden value drivers.
            </CardDescription>
            <Button className="w-full bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy font-semibold">
              Begin Part 3
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : progress.part3Complete && !progress.valueAnalysisComplete ? (
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-oracle-purple/20 rounded-full">
                <Loader2 className="h-6 w-6 text-oracle-purple animate-spin" />
              </div>
              <CardTitle className="text-oracle-navy">Generating Value Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              We're analyzing your hidden value opportunities. This typically takes 2-3 minutes.
            </CardDescription>
          </CardContent>
        </Card>
      ) : progress.valueAnalysisComplete ? (
        <Card 
          className="bg-gradient-to-br from-oracle-purple/10 to-oracle-gold/10 hover:shadow-lg transition-all cursor-pointer"
          onClick={handleViewValueAnalysis}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-oracle-purple/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-oracle-purple" />
              </div>
              <CardTitle className="text-oracle-navy">View Hidden Value Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Your comprehensive value analysis is ready! Discover hidden opportunities worth £100k+.
            </CardDescription>
            <Button className="w-full bg-oracle-purple hover:bg-oracle-purple/90 text-white">
              View Analysis
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle className="text-oracle-navy">Assessment Complete</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4 text-green-700">
              Excellent work! You've completed your comprehensive business assessment.
            </CardDescription>
            <div className="text-sm text-green-600">
              ✓ Foundation assessment complete<br/>
              ✓ Deep dive analysis complete
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roadmap Status Card - Non-clickable when complete */}
      {progress.roadmapGenerated ? (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle className="text-green-800">Roadmap Created</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-green-700 mb-4">
              Your personalized 90-day transformation roadmap has been created and is displayed below.
            </CardDescription>
            <div className="text-sm text-green-600">
              ✓ Strategic priorities identified<br/>
              ✓ Weekly action plan ready<br/>
              ✓ Time-budgeted for your schedule
            </div>
          </CardContent>
        </Card>
      ) : progress.part2Complete ? (
        <Card className="bg-oracle-cream border-oracle-gold">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-oracle-gold animate-pulse" />
              <CardTitle className="text-oracle-navy">Creating Your Roadmap</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Our team is crafting your personalized roadmap based on your responses...
            </CardDescription>
            <div className="text-sm text-oracle-navy/70">
              Usually takes 24-48 hours
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
