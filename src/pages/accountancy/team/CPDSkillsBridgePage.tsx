import React from 'react';
import CPDSkillsBridge from '@/components/accountancy/team/CPDSkillsBridge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const CPDSkillsBridgePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const memberId = user?.id || '';

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/accountancy/team')}
          className="text-white font-medium hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Team Management
        </Button>

        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">CPD Skills Impact</CardTitle>
                <CardDescription className="text-white font-medium">
                  Track how your CPD activities improve your skills and measure your development ROI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-green-900/20 border-blue-700/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-2">Understanding the Connection</p>
                <p className="text-white font-medium text-sm mb-3">
                  This dashboard shows the direct correlation between your CPD activities and skill level improvements.
                  Track which types of learning deliver the best results for you.
                </p>
                <ul className="text-white font-medium text-sm space-y-1">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>See before/after skill levels for linked CPD activities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Calculate ROI: skill improvement per CPD hour invested</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Get AI suggestions for which skills to target with your next CPD activity</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CPD Skills Bridge Component */}
        {memberId ? (
          <CPDSkillsBridge memberId={memberId} />
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <p className="text-white font-medium text-center">Please log in to view your CPD skills impact.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CPDSkillsBridgePage;

