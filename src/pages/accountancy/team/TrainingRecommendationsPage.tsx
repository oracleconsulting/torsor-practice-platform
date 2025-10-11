import React from 'react';
import TrainingRecommendationCards from '@/components/accountancy/team/TrainingRecommendationCards';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TrainingRecommendationsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/accountancy/team')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Team Management
        </Button>

        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Target className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">AI-Powered Training Recommendations</CardTitle>
                <CardDescription className="text-gray-400">
                  Personalized learning paths based on your skill gaps, interests, and learning style
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-700/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-2">How it works</p>
                <p className="text-gray-300 text-sm">
                  Our AI analyzes your current skill levels, identified gaps, personal interests, and learning style (VARK)
                  to generate tailored training recommendations. Each recommendation includes estimated time, cost-benefit
                  analysis, and success probability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <TrainingRecommendationCards />
      </div>
    </div>
  );
};

export default TrainingRecommendationsPage;

