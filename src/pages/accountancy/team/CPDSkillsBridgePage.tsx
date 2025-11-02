import React, { useState, useEffect } from 'react';
import CPDSkillsBridge from '@/components/accountancy/team/CPDSkillsBridge';
import CPDOverview from '@/components/accountancy/team/CPDOverview';
import QuickCPDLogger from '@/components/accountancy/team/QuickCPDLogger';
import CPDSkillReassessment from '@/components/accountancy/team/CPDSkillReassessment';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, ArrowLeft, Info, Plus, Clock, Target, Brain, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { supabase } from '@/lib/supabase/client';
import { generateTrainingNarrative } from '@/lib/api/advanced-analysis';
import { useToast } from '@/components/ui/use-toast';

const CPDSkillsBridgePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { practice } = useAccountancyContext();
  const [memberId, setMemberId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'impact' | 'training'>('overview');
  const [isLogCPDOpen, setIsLogCPDOpen] = useState(false);
  const [isReassessmentOpen, setIsReassessmentOpen] = useState(false);
  const [cpdActivityData, setCpdActivityData] = useState<{
    id: string;
    skillIds: string[];
    hours: number;
    title: string;
  } | null>(null);
  
  // Phase 2 AI Feature
  const [trainingNarrative, setTrainingNarrative] = useState<string | null>(null);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadMemberId();
    }
  }, [user?.id]);

  const loadMemberId = async () => {
    try {
      const { data: member, error } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('[CPDSkillsBridge] Error loading member ID:', error);
        return;
      }

      if (member) {
        console.log('[CPDSkillsBridge] Loaded member ID:', (member as any).id);
        setMemberId((member as any).id);
      } else {
        console.warn('[CPDSkillsBridge] No member found for user:', user?.id);
      }
    } catch (error) {
      console.error('[CPDSkillsBridge] Error in loadMemberId:', error);
    }
  };

  // Phase 2 AI Feature - Manual Trigger Handler
  const handleGenerateTrainingNarrative = async () => {
    if (!memberId || !practice?.id) {
      toast({
        title: 'Error',
        description: 'Member ID not found',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingNarrative(true);
    try {
      const result = await generateTrainingNarrative(memberId, practice.id);
      setTrainingNarrative(result.narrative);
      toast({
        title: 'Training Plan Generated!',
        description: 'Your personalized training narrative is ready.',
      });
    } catch (error: any) {
      console.error('[CPDSkillsBridge] Error generating narrative:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate training plan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingNarrative(false);
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
              value="training" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Training Plan
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

          {/* Training Plan Tab - Phase 2 AI Feature */}
          <TabsContent value="training" className="space-y-4">
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-emerald-600" />
                      AI-Powered Training Plan
                    </CardTitle>
                    <CardDescription>
                      Personalized, motivational training recommendations tailored to your goals and learning style
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateTrainingNarrative}
                    disabled={generatingNarrative}
                    variant="outline"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    {generatingNarrative ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        {trainingNarrative ? 'Regenerate Plan' : 'Generate Plan'}
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {generatingNarrative ? (
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-emerald-900">Creating Your Training Plan</p>
                    <p className="text-sm text-gray-600">Analyzing your profile and generating personalized recommendations...</p>
                    <p className="text-xs text-gray-500">This may take 15-30 seconds</p>
                  </div>
                </CardContent>
              ) : trainingNarrative ? (
                <CardContent className="space-y-6">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{trainingNarrative}</div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Target className="w-16 h-16 text-emerald-300" />
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-gray-900">Ready to Create Your Training Plan</p>
                    <p className="text-sm text-gray-600">Get personalized, motivational recommendations that connect to YOUR career goals</p>
                  </div>
                  <Button
                    onClick={handleGenerateTrainingNarrative}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate My Training Plan
                  </Button>
                </CardContent>
              )}
            </Card>
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

