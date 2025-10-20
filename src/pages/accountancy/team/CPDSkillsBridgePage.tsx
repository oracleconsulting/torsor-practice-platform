import React, { useState, useEffect } from 'react';
import CPDSkillsBridge from '@/components/accountancy/team/CPDSkillsBridge';
import CPDOverview from '@/components/accountancy/team/CPDOverview';
import QuickCPDLogger from '@/components/accountancy/team/QuickCPDLogger';
import CPDSkillReassessment from '@/components/accountancy/team/CPDSkillReassessment';
import ServiceLineInterestRanking from '@/components/accountancy/team/ServiceLineInterestRanking';
import VARKAssessment from '@/components/accountancy/team/VARKAssessment';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, ArrowLeft, Info, Plus, Clock, Target, Brain, Briefcase } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'impact' | 'service-lines' | 'vark'>('overview');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with Back Button and Log CPD Button */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/team-member/dashboard')}
            className="text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Button
            onClick={() => setIsLogCPDOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log CPD Activity
          </Button>
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Professional Development
              </h1>
              <p className="text-gray-300 text-lg">
                Track your CPD, develop skills, and plan your career growth
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all rounded-lg"
            >
              <Clock className="w-4 h-4 mr-2" />
              CPD Overview
            </TabsTrigger>
            <TabsTrigger 
              value="impact" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all rounded-lg"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Skills Impact
            </TabsTrigger>
            <TabsTrigger 
              value="service-lines" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all rounded-lg"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Service Lines
            </TabsTrigger>
            <TabsTrigger 
              value="vark" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all rounded-lg"
            >
              <Brain className="w-4 h-4 mr-2" />
              Learning Style
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
          <TabsContent value="impact" className="space-y-4">
            {/* Info Card - Modern gradient background */}
            <div className="bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20 flex-shrink-0">
                  <Info className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Understanding Skills Impact</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Track the direct correlation between your CPD activities and skill level improvements.
                    See which types of learning deliver the best results for you.
                  </p>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-green-500/20 flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      </div>
                      <span>See before/after skill levels for linked CPD activities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-green-500/20 flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      </div>
                      <span>Calculate ROI: skill improvement per CPD hour invested</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-green-500/20 flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      </div>
                      <span>Get suggestions for which skills to target with your next CPD activity</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

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

          {/* Service Lines Tab */}
          <TabsContent value="service-lines" className="space-y-6">
            {memberId ? (
              <ServiceLineInterestRanking memberId={memberId} />
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <p className="text-white font-medium text-center">Please log in to manage your service line preferences.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* VARK Learning Style Tab */}
          <TabsContent value="vark" className="space-y-6">
            {memberId ? (
              <VARKAssessment teamMemberId={memberId} />
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <p className="text-white font-medium text-center">Please log in to take your learning style assessment.</p>
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

