import React, { useState, useEffect } from 'react';
import CPDSkillsBridge from '@/components/accountancy/team/CPDSkillsBridge';
import CPDOverview from '@/components/accountancy/team/CPDOverview';
import QuickCPDLogger from '@/components/accountancy/team/QuickCPDLogger';
import CPDSkillReassessment from '@/components/accountancy/team/CPDSkillReassessment';
import ServiceLineInterestRanking from '@/components/accountancy/team/ServiceLineInterestRanking';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'impact' | 'service-lines'>('overview');
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with Back Button and Log CPD Button */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/team-member/dashboard')}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Button
            onClick={() => setIsLogCPDOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log CPD Activity
          </Button>
        </div>

        {/* Header Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Professional Development
              </h1>
              <p className="text-gray-600">
                Track your CPD, develop skills, and plan your career growth
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
            >
              <Clock className="w-4 h-4 mr-2" />
              CPD Overview
            </TabsTrigger>
            <TabsTrigger 
              value="impact" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Skills Impact
            </TabsTrigger>
            <TabsTrigger 
              value="service-lines" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Service Lines
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
            {/* Info Card - Clean white theme */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100 flex-shrink-0">
                  <Info className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg mb-2">Understanding Skills Impact</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Track the direct correlation between your CPD activities and skill level improvements.
                    See which types of learning deliver the best results for you.
                  </p>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-green-100 flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      </div>
                      <span>See before/after skill levels for linked CPD activities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-green-100 flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      </div>
                      <span>Calculate ROI: skill improvement per CPD hour invested</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 rounded bg-green-100 flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-green-600" />
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

