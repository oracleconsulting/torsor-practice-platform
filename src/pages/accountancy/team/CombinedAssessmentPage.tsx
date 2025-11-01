/**
 * Combined Assessment Page
 * Manages both VARK and OCEAN assessments with results display
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, BookOpen, CheckCircle, Clock, ArrowRight, 
  TrendingUp, Users, Target, Sparkles, ArrowLeft, 
  Briefcase, Zap, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import PersonalityAssessment from '@/components/accountancy/team/PersonalityAssessment';
import PersonalityResults from '@/components/accountancy/team/PersonalityResults';
import VARKAssessment from '@/components/accountancy/team/VARKAssessment';
import WorkingPreferencesAssessment from '@/components/accountancy/team/WorkingPreferencesAssessment';
import BelbinAssessment from '@/components/accountancy/team/BelbinAssessment';
import MotivationalDriversAssessment from '@/components/accountancy/team/MotivationalDriversAssessment';
import EQAssessment from '@/components/accountancy/team/EQAssessment';
import ConflictStyleAssessment from '@/components/accountancy/team/ConflictStyleAssessment';
import ServiceLineInterestRanking from '@/components/accountancy/team/ServiceLineInterestRanking';
import ComprehensiveAssessmentResults from '@/components/accountancy/team/ComprehensiveAssessmentResults';
import { getPersonalityAssessment } from '@/lib/api/personality-assessment';
import { toast } from 'sonner';

export const CombinedAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string>('');
  const [practiceId, setPracticeId] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [memberRole, setMemberRole] = useState<string>('');
  
  // Assessment status
  const [varkCompleted, setVarkCompleted] = useState(false);
  const [oceanCompleted, setOceanCompleted] = useState(false);
  const [workingPrefsCompleted, setWorkingPrefsCompleted] = useState(false);
  const [belbinCompleted, setBelbinCompleted] = useState(false);
  const [motivationalCompleted, setMotivationalCompleted] = useState(false);
  const [eqCompleted, setEqCompleted] = useState(false);
  const [conflictCompleted, setConflictCompleted] = useState(false);
  const [serviceLineCompleted, setServiceLineCompleted] = useState(false);
  
  const [varkData, setVarkData] = useState<any>(null);
  const [oceanData, setOceanData] = useState<any>(null);
  
  // Current view
  const [currentView, setCurrentView] = useState<'overview' | 'vark' | 'ocean' | 'working' | 'belbin' | 'motivational' | 'eq' | 'conflict' | 'serviceline' | 'results'>('overview');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vark-results' | 'ocean-results' | 'comprehensive'>('dashboard');

  useEffect(() => {
    loadMemberData();
  }, [user?.id]);

  const loadMemberData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get member info
      const { data: member, error: memberError } = await supabase
        .from('practice_members')
        .select('id, name, role, practice_id, vark_assessment_completed, learning_style, vark_result')
        .eq('user_id', user.id)
        .single() as { data: any; error: any };

      if (memberError) throw memberError;
      if (!member) {
        toast.error('Member profile not found');
        return;
      }

      setMemberId(member.id);
      setPracticeId(member.practice_id || '');
      setMemberName(member.name || '');
      setMemberRole(member.role?.toLowerCase() || '');
      setVarkCompleted(member.vark_assessment_completed);

      // Load VARK data if completed
      if (member.vark_assessment_completed && member.vark_result) {
        setVarkData({
          primary_style: member.learning_style,
          scores: member.vark_result
        });
      }

      // Load OCEAN data if completed
      const oceanAssessment = await getPersonalityAssessment(member.id);
      if (oceanAssessment) {
        setOceanCompleted(true);
        setOceanData({
          traits: {
            openness: oceanAssessment.openness_score,
            conscientiousness: oceanAssessment.conscientiousness_score,
            extraversion: oceanAssessment.extraversion_score,
            agreeableness: oceanAssessment.agreeableness_score,
            neuroticism: oceanAssessment.neuroticism_score
          },
          emotionalStability: oceanAssessment.emotional_stability_score,
          facets: oceanAssessment.facet_scores,
          profile: generateProfileText(oceanAssessment),
          dominant_traits: oceanAssessment.dominant_traits,
          work_style: oceanAssessment.work_style,
          communication_style: oceanAssessment.communication_style
        });
      }

      // Load all 5 new assessments
      const [workingPrefs, belbin, motivational, eq, conflict, serviceLineInterests] = await Promise.all([
        supabase.from('working_preferences').select('*').eq('practice_member_id', member.id).single(),
        supabase.from('belbin_assessments').select('*').eq('practice_member_id', member.id).single(),
        supabase.from('motivational_drivers').select('*').eq('practice_member_id', member.id).single(),
        supabase.from('eq_assessments').select('*').eq('practice_member_id', member.id).single(),
        supabase.from('conflict_style_assessments').select('*').eq('practice_member_id', member.id).single(),
        supabase.from('service_line_interests').select('*').eq('practice_member_id', member.id).limit(1).single()
      ]);

      setWorkingPrefsCompleted(!!workingPrefs.data);
      setBelbinCompleted(!!belbin.data);
      setMotivationalCompleted(!!motivational.data);
      setEqCompleted(!!eq.data);
      setConflictCompleted(!!conflict.data);
      setServiceLineCompleted(!!serviceLineInterests.data);

      console.log('[CombinedAssessment] Assessment status:', {
        vark: member.vark_assessment_completed,
        ocean: !!oceanAssessment,
        workingPrefs: !!workingPrefs.data,
        belbin: !!belbin.data,
        motivational: !!motivational.data,
        eq: !!eq.data,
        conflict: !!conflict.data,
        serviceLine: !!serviceLineInterests.data
      });
    } catch (error) {
      console.error('[Combined Assessment] Error loading data:', error);
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const generateProfileText = (assessment: any): string => {
    const descriptions = [];
    if (assessment.openness_score > 70) descriptions.push("innovative and adaptable");
    if (assessment.conscientiousness_score > 70) descriptions.push("highly organized");
    if (assessment.extraversion_score > 70) descriptions.push("energized by collaboration");
    if (assessment.agreeableness_score > 70) descriptions.push("collaborative and supportive");
    if (assessment.emotional_stability_score > 70) descriptions.push("emotionally stable");
    return descriptions.length > 0 ? descriptions.join(", ") + "." : "Balanced across all traits.";
  };

  const handleVARKComplete = () => {
    toast.success('VARK assessment completed!');
    loadMemberData();
    setCurrentView('overview');
  };

  const handleOCEANComplete = (profile: any) => {
    toast.success('Personality assessment completed!');
    setOceanData(profile);
    setOceanCompleted(true);
    setCurrentView('results');
    setActiveTab('ocean-results');
  };

  // Determine correct back navigation based on user role
  const getBackPath = () => {
    const isAdmin = memberRole && ['owner', 'admin', 'manager', 'director', 'partner'].includes(memberRole);
    return isAdmin ? '/dashboard' : '/team-member/dashboard';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your assessments...</p>
        </div>
      </div>
    );
  }

  // Show specific assessment view
  if (currentView === 'vark') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <VARKAssessment 
          teamMemberId={memberId}
          onComplete={handleVARKComplete}
        />
      </div>
    );
  }

  if (currentView === 'ocean') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <PersonalityAssessment
          teamMemberId={memberId}
          memberName={memberName}
          existingVARKData={varkData}
          onComplete={handleOCEANComplete}
        />
      </div>
    );
  }

  if (currentView === 'working') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <WorkingPreferencesAssessment
          practiceMemberId={memberId}
          practiceId={practiceId}
          onComplete={() => {
            toast.success('Working Preferences assessment completed!');
            loadMemberData();
            setCurrentView('overview');
          }}
        />
      </div>
    );
  }

  if (currentView === 'belbin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <BelbinAssessment
          practiceMemberId={memberId}
          practiceId={practiceId}
          onComplete={() => {
            toast.success('Belbin Team Roles assessment completed!');
            loadMemberData();
            setCurrentView('overview');
          }}
        />
      </div>
    );
  }

  if (currentView === 'motivational') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <MotivationalDriversAssessment
          practiceMemberId={memberId}
          practiceId={practiceId}
          onComplete={() => {
            toast.success('Motivational Drivers assessment completed!');
            loadMemberData();
            setCurrentView('overview');
          }}
        />
      </div>
    );
  }

  if (currentView === 'eq') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <EQAssessment
          practiceMemberId={memberId}
          practiceId={practiceId}
          onComplete={() => {
            toast.success('Emotional Intelligence assessment completed!');
            loadMemberData();
            setCurrentView('overview');
          }}
        />
      </div>
    );
  }

  if (currentView === 'conflict') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <ConflictStyleAssessment
          practiceMemberId={memberId}
          practiceId={practiceId}
          onComplete={() => {
            toast.success('Conflict Style assessment completed!');
            loadMemberData();
            setCurrentView('overview');
          }}
        />
      </div>
    );
  }

  if (currentView === 'serviceline') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <ServiceLineInterestRanking
          memberId={memberId}
          memberName={memberName}
        />
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => {
              toast.success('Service line preferences saved! Returning to overview...');
              loadMemberData();
              setCurrentView('overview');
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Done - Return to Overview
          </Button>
        </div>
      </div>
    );
  }

  if (currentView === 'results') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentView('overview')}
          className="mb-6"
        >
          ← Back to Overview
        </Button>
        <ComprehensiveAssessmentResults
          practiceMemberId={memberId}
          memberName={memberName}
        />
      </div>
    );
  }

  // Calculate completion percentage (8 total assessments)
  const totalAssessments = 8;
  const completedAssessments = [
    varkCompleted, oceanCompleted, workingPrefsCompleted, 
    belbinCompleted, motivationalCompleted, eqCompleted, conflictCompleted, serviceLineCompleted
  ].filter(Boolean).length;
  const completionPercentage = (completedAssessments / totalAssessments) * 100;

  const getCompletionStatus = () => {
    if (completedAssessments === totalAssessments) return { text: 'Complete', color: 'bg-green-600', icon: CheckCircle };
    if (completedAssessments >= 5) return { text: 'Mostly Complete', color: 'bg-blue-600', icon: TrendingUp };
    if (completedAssessments >= 2) return { text: 'In Progress', color: 'bg-yellow-600', icon: Clock };
    return { text: 'Getting Started', color: 'bg-gray-600', icon: Clock };
  };

  const status = getCompletionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(getBackPath())}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-lg p-8 border-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Professional Profile Assessment
            </h1>
            <p className="text-gray-700 mb-4">
              Complete 8 comprehensive assessments to unlock your full professional profile
            </p>
            <div className="flex items-center gap-4">
              <Badge className={`${status.color} text-white px-4 py-2`}>
                <StatusIcon className="w-4 h-4 mr-2 inline" />
                {completedAssessments} of {totalAssessments} Complete
              </Badge>
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-gray-900">{Math.round(completionPercentage)}%</span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
              </div>
            </div>
          </div>
          <Brain className="w-20 h-20 text-blue-600 flex-shrink-0 ml-6" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Target className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="vark-results" disabled={!varkCompleted} className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            VARK
          </TabsTrigger>
          <TabsTrigger value="ocean-results" disabled={!oceanCompleted} className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Brain className="w-4 h-4 mr-2" />
            Personality
          </TabsTrigger>
          <TabsTrigger 
            value="comprehensive" 
            disabled={completedAssessments < 5} 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            All Results
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Assessment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VARK Assessment Card */}
            <Card className={`border-2 ${varkCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-blue-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  VARK Learning Style
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Discover how you learn best
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {varkCompleted ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Your Learning Style</p>
                        <p className="text-xl font-bold text-gray-900 capitalize">
                          {varkData?.primary_style?.replace('_', ' ') || 'Not specified'}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setActiveTab('vark-results')}
                      >
                        View Results
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => setCurrentView('vark')}
                      >
                        Retake Assessment
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-4 border space-y-2">
                      <p className="text-sm text-gray-700">
                        Understand whether you learn best through:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• Visual (diagrams, charts)</li>
                        <li>• Auditory (listening, discussion)</li>
                        <li>• Reading/Writing (text, notes)</li>
                        <li>• Kinesthetic (hands-on, practice)</li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-2">
                        ⏱️ Takes 5-7 minutes
                      </p>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setCurrentView('vark')}
                    >
                      Start VARK Assessment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* OCEAN Assessment Card */}
            <Card className={`border-2 ${oceanCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-purple-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Brain className="w-6 h-6 text-purple-600" />
                  Personality Profile (OCEAN)
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Understand your work style and strengths
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {oceanCompleted ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Your Work Style</p>
                        <p className="text-xl font-bold text-gray-900 capitalize">
                          {oceanData?.work_style?.replace(/-/g, ' ') || 'Not specified'}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setActiveTab('ocean-results')}
                      >
                        View Results
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                        onClick={() => setCurrentView('ocean')}
                      >
                        Retake Assessment
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-4 border space-y-2">
                      <p className="text-sm text-gray-700">
                        Measures the Big Five personality traits:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• Openness (innovation)</li>
                        <li>• Conscientiousness (reliability)</li>
                        <li>• Extraversion (social energy)</li>
                        <li>• Agreeableness (cooperation)</li>
                        <li>• Emotional Stability (resilience)</li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-2">
                        ⏱️ Takes 10-15 minutes
                      </p>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => setCurrentView('ocean')}
                      disabled={!varkCompleted}
                    >
                      {varkCompleted ? (
                        <>
                          Start Personality Assessment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'Complete VARK First'
                      )}
                    </Button>
                    {!varkCompleted && (
                      <p className="text-xs text-gray-500 text-center">
                        Complete VARK assessment to unlock
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Working Preferences Assessment Card */}
            <Card className={`border-2 ${workingPrefsCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-blue-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  Working Preferences
                </CardTitle>
                <CardDescription className="text-gray-600">
                  How you prefer to work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workingPrefsCompleted ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Assessment Complete</p>
                        <p className="text-xl font-bold text-green-600">✓ Completed</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => setCurrentView('working')}
                    >
                      Retake Assessment
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-4 border space-y-2">
                      <p className="text-sm text-gray-700">13 questions • 5 minutes</p>
                      <p className="text-xs text-gray-500">Communication, work style, environment</p>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setCurrentView('working')}
                      disabled={!oceanCompleted}
                    >
                      {oceanCompleted ? (
                        <>
                          Start Assessment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'Complete Core Assessments First'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Belbin Team Roles Assessment Card */}
            <Card className={`border-2 ${belbinCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-purple-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Users className="w-6 h-6 text-purple-600" />
                  Team Roles (Belbin)
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your natural team contributions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {belbinCompleted ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Assessment Complete</p>
                        <p className="text-xl font-bold text-green-600">✓ Completed</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => setCurrentView('belbin')}
                    >
                      Retake Assessment
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-4 border space-y-2">
                      <p className="text-sm text-gray-700">8 questions • 4 minutes</p>
                      <p className="text-xs text-gray-500">Discover your team role profile</p>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => setCurrentView('belbin')}
                      disabled={!oceanCompleted}
                    >
                      {oceanCompleted ? (
                        <>
                          Start Assessment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'Complete Core Assessments First'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Motivational Drivers Assessment Card */}
            <Card className={`border-2 ${motivationalCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-yellow-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  Motivational Drivers
                </CardTitle>
                <CardDescription className="text-gray-600">
                  What energizes you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {motivationalCompleted ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Assessment Complete</p>
                        <p className="text-xl font-bold text-green-600">✓ Completed</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      onClick={() => setCurrentView('motivational')}
                    >
                      Retake Assessment
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-4 border space-y-2">
                      <p className="text-sm text-gray-700">10 questions • 5 minutes</p>
                      <p className="text-xs text-gray-500">Achievement, autonomy, affiliation</p>
                    </div>
                    <Button 
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => setCurrentView('motivational')}
                      disabled={!oceanCompleted}
                    >
                      {oceanCompleted ? (
                        <>
                          Start Assessment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'Complete Core Assessments First'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* EQ Assessment Card */}
            <Card className={`border-2 ${eqCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-blue-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Brain className="w-6 h-6 text-blue-600" />
                  Emotional Intelligence
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your EQ profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {eqCompleted ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Assessment Complete</p>
                        <p className="text-xl font-bold text-green-600">✓ Completed</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => setCurrentView('eq')}
                    >
                      Retake Assessment
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-4 border space-y-2">
                      <p className="text-sm text-gray-700">27 questions • 10 minutes</p>
                      <p className="text-xs text-gray-500">Self-awareness, social awareness</p>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setCurrentView('eq')}
                      disabled={!oceanCompleted}
                    >
                      {oceanCompleted ? (
                        <>
                          Start Assessment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'Complete Core Assessments First'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Conflict Style Assessment Card */}
            <Card className={`border-2 ${conflictCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-orange-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Shield className="w-6 h-6 text-orange-600" />
                  Conflict Style
                </CardTitle>
                <CardDescription className="text-gray-600">
                  How you handle conflict
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {conflictCompleted ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Assessment Complete</p>
                        <p className="text-xl font-bold text-green-600">✓ Completed</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => setCurrentView('conflict')}
                    >
                      Retake Assessment
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-4 border space-y-2">
                      <p className="text-sm text-gray-700">10 questions • 5 minutes</p>
                      <p className="text-xs text-gray-500">Thomas-Kilmann model</p>
                    </div>
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => setCurrentView('conflict')}
                      disabled={!oceanCompleted}
                    >
                      {oceanCompleted ? (
                        <>
                          Start Assessment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'Complete Core Assessments First'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Service Line Preferences Card */}
            <Card className={`border-2 ${serviceLineCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-purple-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Service Line Preferences
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Rank your service line interests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {serviceLineCompleted ? (
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assessment Complete</p>
                      <p className="text-xl font-bold text-green-600">✓ Completed</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-4 border space-y-2">
                      <p className="text-sm text-gray-700">10 service lines • 10-15 minutes</p>
                      <p className="text-xs text-gray-500">Rank your interest, experience, and desired involvement</p>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => setCurrentView('serviceline')}
                    >
                      Start Ranking
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
                {serviceLineCompleted && (
                  <Button 
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => setCurrentView('serviceline')}
                  >
                    Update Preferences
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* View Comprehensive Results Button */}
          {completedAssessments >= 5 && (
            <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      🎉 Comprehensive Profile Available!
                    </h3>
                    <p className="text-gray-700">
                      You've completed 5+ assessments. View your comprehensive professional profile.
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => setActiveTab('comprehensive')}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    View Full Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits of Completion */}
          {completedAssessments < totalAssessments ? (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Sparkles className="w-6 h-6 text-yellow-600" />
                  Why Complete All Assessments?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Personalized CPD</h4>
                      <p className="text-sm text-gray-600">
                        Get CPD recommendations tailored to your learning style and personality
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Better Team Fit</h4>
                      <p className="text-sm text-gray-600">
                        Help your manager assign you to projects that suit your strengths
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Career Growth</h4>
                      <p className="text-sm text-gray-600">
                        Understand your natural tendencies to guide professional development
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Profile Complete! 🎉
                </CardTitle>
                <CardDescription className="text-gray-600">
                  You've unlocked all insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Your combined profile is now available. Explore your results using the tabs above or take action below:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button variant="outline" onClick={() => setActiveTab('vark-results')}>
                    View VARK Results
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('ocean-results')}>
                    View Personality Results
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Get CPD Recommendations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* VARK Results Tab */}
        <TabsContent value="vark-results">
          {varkCompleted && varkData ? (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">Your VARK Learning Style Results</CardTitle>
                <CardDescription className="text-gray-600">
                  Primary Style: {varkData.primary_style.replace('_', ' ').toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    You learn best through <strong className="capitalize">{varkData.primary_style.replace('_', ' ')}</strong> methods.
                  </p>
                  
                  {/* Score breakdown */}
                  <div className="space-y-3">
                    {Object.entries(varkData.scores).map(([style, score]: [string, any]) => (
                      <div key={style}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {style.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">VARK assessment not completed yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* OCEAN Results Tab */}
        <TabsContent value="ocean-results">
          {oceanCompleted && oceanData ? (
            <PersonalityResults
              profile={oceanData}
              varkData={varkData}
              teamMemberId={memberId}
              memberName={memberName}
            />
          ) : (
            <Card className="bg-white">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Personality assessment not completed yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comprehensive Results Tab */}
        <TabsContent value="comprehensive">
          {completedAssessments >= 5 ? (
            <ComprehensiveAssessmentResults
              practiceMemberId={memberId}
              memberName={memberName}
            />
          ) : (
            <Card className="bg-white">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Complete at least 5 assessments to unlock comprehensive results</p>
                <p className="text-sm text-gray-400 mt-2">Progress: {completedAssessments} of {totalAssessments}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CombinedAssessmentPage;

