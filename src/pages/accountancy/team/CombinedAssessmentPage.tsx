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
  TrendingUp, Users, Target, Sparkles, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import PersonalityAssessment from '@/components/accountancy/team/PersonalityAssessment';
import PersonalityResults from '@/components/accountancy/team/PersonalityResults';
import VARKAssessment from '@/components/accountancy/team/VARKAssessment';
import { getPersonalityAssessment } from '@/lib/api/personality-assessment';
import { toast } from 'sonner';

export const CombinedAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  
  // Assessment status
  const [varkCompleted, setVarkCompleted] = useState(false);
  const [oceanCompleted, setOceanCompleted] = useState(false);
  const [varkData, setVarkData] = useState<any>(null);
  const [oceanData, setOceanData] = useState<any>(null);
  
  // Current view
  const [currentView, setCurrentView] = useState<'overview' | 'vark' | 'ocean' | 'results'>('overview');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vark-results' | 'ocean-results'>('dashboard');

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
        .select('id, name, vark_assessment_completed, learning_style, vark_result')
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;

      setMemberId(member.id);
      setMemberName(member.name);
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

  const getCompletionStatus = () => {
    if (varkCompleted && oceanCompleted) return { text: 'Complete', color: 'bg-green-600', icon: CheckCircle };
    if (varkCompleted || oceanCompleted) return { text: 'Partial', color: 'bg-yellow-600', icon: Clock };
    return { text: 'Not Started', color: 'bg-gray-600', icon: Clock };
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

  const status = getCompletionStatus();
  const StatusIcon = status.icon;
  const completionPercentage = ((varkCompleted ? 50 : 0) + (oceanCompleted ? 50 : 0));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/team-member/dashboard')}
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
              Complete your learning style and personality assessments to unlock personalized insights
            </p>
            <div className="flex items-center gap-4">
              <Badge className={`${status.color} text-white px-4 py-2`}>
                <StatusIcon className="w-4 h-4 mr-2 inline" />
                {status.text}
              </Badge>
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-gray-900">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
              </div>
            </div>
          </div>
          <Brain className="w-20 h-20 text-blue-600 flex-shrink-0 ml-6" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Target className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="vark-results" disabled={!varkCompleted} className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            VARK Results
          </TabsTrigger>
          <TabsTrigger value="ocean-results" disabled={!oceanCompleted} className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Brain className="w-4 h-4 mr-2" />
            Personality Results
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
                          {varkData?.primary_style.replace('_', ' ')}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('vark-results')}
                    >
                      View Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
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
                          {oceanData?.work_style.replace(/-/g, ' ')}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('ocean-results')}
                    >
                      View Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
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
          </div>

          {/* Benefits of Completion */}
          {!varkCompleted || !oceanCompleted ? (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Sparkles className="w-6 h-6 text-yellow-600" />
                  Why Complete Both Assessments?
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
      </Tabs>
    </div>
  );
};

export default CombinedAssessmentPage;

