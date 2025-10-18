import React, { useState, useEffect } from 'react';
import CPDSkillsBridge from '@/components/accountancy/team/CPDSkillsBridge';
import CPDOverview from '@/components/accountancy/team/CPDOverview';
import QuickCPDLogger from '@/components/accountancy/team/QuickCPDLogger';
import CPDSkillReassessment from '@/components/accountancy/team/CPDSkillReassessment';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, ArrowLeft, Info, Plus, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';

const CPDSkillsBridgePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { practice } = useAccountancyContext();
  const [memberId, setMemberId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'impact'>('overview');
  const [isLogCPDOpen, setIsLogCPDOpen] = useState(false);
  const [isReassessmentOpen, setIsReassessmentOpen] = useState(false);
  const [cpdActivityData, setCpdActivityData] = useState<{
    id: string;
    skillIds: string[];
    hours: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadMemberId();
    }
  }, [user?.id]);

  const loadMemberId = async () => {
    try {
      const { data: member } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (member) {
        setMemberId((member as any).id);
      }
    } catch (error) {
      console.error('Error loading member ID:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button and Log CPD Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/team-member/dashboard')}
            className="text-white font-medium hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Button
            onClick={() => setIsLogCPDOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log CPD Activity
          </Button>
        </div>

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

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              <Clock className="w-4 h-4 mr-2" />
              CPD Overview
            </TabsTrigger>
            <TabsTrigger value="impact" className="data-[state=active]:bg-purple-600">
              <Target className="w-4 h-4 mr-2" />
              Skills Impact
            </TabsTrigger>
          </TabsList>

          {/* CPD Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {memberId && practice ? (
              <CPDOverview memberId={memberId} practiceId={practice.id} />
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <p className="text-white font-medium text-center">Please log in to view your CPD overview.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Skills Impact Tab */}
          <TabsContent value="impact" className="space-y-6">
            {/* Info Card - Dark background for contrast */}
            <Card className="bg-gray-800 border-gray-700">
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
          </TabsContent>
        </Tabs>

        {/* Log CPD Dialog */}
        <Dialog open={isLogCPDOpen} onOpenChange={setIsLogCPDOpen}>
          <DialogContent className="max-w-2xl bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl">Log CPD Activity</DialogTitle>
            </DialogHeader>
            {memberId && (
              <QuickCPDLogger
                memberId={memberId}
                onComplete={async (cpdActivityId: string, selectedSkills: string[]) => {
                  // Close CPD dialog
                  setIsLogCPDOpen(false);
                  
                  // Get CPD details for reassessment
                  const { data: cpdActivity } = await supabase
                    .from('cpd_activities')
                    .select('title, hours_claimed')
                    .eq('id', cpdActivityId)
                    .single();

                  if (cpdActivity && selectedSkills.length > 0) {
                    const activityData = cpdActivity as any;
                    // Open reassessment dialog
                    setCpdActivityData({
                      id: cpdActivityId,
                      skillIds: selectedSkills,
                      hours: activityData.hours_claimed,
                      title: activityData.title
                    });
                    setIsReassessmentOpen(true);
                  } else {
                    // No skills selected, just refresh
                    window.location.reload();
                  }
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Skill Reassessment Dialog */}
        {cpdActivityData && (
          <CPDSkillReassessment
            isOpen={isReassessmentOpen}
            onClose={() => {
              setIsReassessmentOpen(false);
              setCpdActivityData(null);
              // Refresh the page to show updated data
              window.location.reload();
            }}
            memberId={memberId}
            cpdActivityId={cpdActivityData.id}
            selectedSkillIds={cpdActivityData.skillIds}
            cpdHours={cpdActivityData.hours}
            cpdTitle={cpdActivityData.title}
          />
        )}
      </div>
    </div>
  );
};

export default CPDSkillsBridgePage;

