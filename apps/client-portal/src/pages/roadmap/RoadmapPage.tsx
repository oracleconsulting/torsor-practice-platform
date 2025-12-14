// ============================================================================
// ROADMAP PAGE - Comprehensive 365 Method Display
// ============================================================================
// Displays the complete transformation journey:
// 1. North Star & Tagline
// 2. 5-Year Vision (Transformation Story)
// 3. Year Milestones (Y1, Y3, Y5)
// 4. 6-Month Shift Plan
// 5. 12-Week Sprint with Weekly Tasks
// 6. Value Analysis

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useRoadmap, useGenerateAnalysis, useTasks, useGenerateValueAnalysis } from '@/hooks/useAnalysis';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sparkles,
  CheckCircle,
  Clock,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  Star,
  Compass,
  Mountain,
  Calendar,
  Flag,
  Zap,
  TrendingUp,
  Shield,
  Users,
  RotateCcw,
  Play
} from 'lucide-react';

type ViewTab = 'vision' | 'shift' | 'sprint' | 'value';

export default function RoadmapPage() {
  const { clientSession } = useAuth();
  const { roadmap, fetchRoadmap, loading: roadmapLoading } = useRoadmap();
  const { generate, loading: generating, error: generateError } = useGenerateAnalysis();
  const { generate: generateValueAnalysis, loading: generatingValue, error: valueError } = useGenerateValueAnalysis();
  const { progress } = useAssessmentProgress();
  const { tasks, fetchTasks, updateTaskStatus } = useTasks();
  const [activeTab, setActiveTab] = useState<ViewTab>('vision');
  const [activeWeek, setActiveWeek] = useState<number | null>(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [part3Responses, setPart3Responses] = useState<Record<string, any> | null>(null);

  const [roadmapStatus, setRoadmapStatus] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await fetchRoadmap();
      // Also fetch Part 3 responses if they exist
      if (clientSession?.clientId) {
        const { data } = await supabase
          .from('client_assessments')
          .select('responses')
          .eq('client_id', clientSession.clientId)
          .eq('assessment_type', 'part3')
          .maybeSingle();
        if (data?.responses) {
          setPart3Responses(data.responses);
        }
        
        // Check roadmap status from staged architecture
        const { data: stagesStatus } = await supabase
          .from('roadmap_stages')
          .select('status')
          .eq('client_id', clientSession.clientId)
          .in('status', ['published', 'approved'])
          .limit(1)
          .maybeSingle();
        
        if (stagesStatus) {
          setRoadmapStatus('published');
        } else {
          // Fallback to old table
          const { data: roadmapData } = await supabase
            .from('client_roadmaps')
            .select('status')
            .eq('client_id', clientSession.clientId)
            .eq('is_active', true)
            .maybeSingle();
          
          setRoadmapStatus(roadmapData?.status || null);
        }
      }
      setIsInitialized(true);
    };
    init();
  }, [clientSession]);

  useEffect(() => {
    if (roadmap) {
      fetchTasks();
    }
  }, [roadmap]);

  const handleRegenerate = async () => {
    await generate(true);
    await fetchRoadmap();
  };

  const handleGenerate = async () => {
    console.log('Starting roadmap generation...');
    const result = await generate();
    console.log('Generation result:', result);
    if (result.success) {
      console.log('Generation successful, fetching roadmap...');
      await fetchRoadmap();
    } else {
      console.error('Generation failed:', result.error);
    }
  };

  const handleGenerateValueAnalysis = async () => {
    if (!part3Responses) {
      // If no Part 3 responses, generate with minimal context from roadmap
      const result = await generateValueAnalysis({});
      if (result.success) {
        await fetchRoadmap(); // Refresh to get the new value analysis
      }
    } else {
      const result = await generateValueAnalysis(part3Responses);
      if (result.success) {
        await fetchRoadmap();
      }
    }
  };

  // Loading states
  if (!isInitialized || roadmapLoading) {
    return (
      <Layout title="Your Roadmap" subtitle="Loading...">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-600 mt-4">Loading your transformation journey...</p>
        </div>
      </Layout>
    );
  }

  if (generating) {
    return (
      <Layout title="Your Roadmap" subtitle="Creating your story...">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Crafting Your Transformation Story</h2>
          <p className="text-slate-600 mt-3 max-w-md text-center">
            Analyzing everything you've shared to create a deeply personal roadmap...
          </p>
          <div className="mt-6 space-y-2 text-sm text-slate-500">
            <p>✨ Extracting your emotional anchors...</p>
            <p>🎯 Building your 5-year vision...</p>
            <p>📅 Creating your 6-month shift plan...</p>
            <p>✅ Designing your 12-week sprint...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (progress?.overall !== 100) {
    return (
      <Layout title="Your Roadmap" subtitle="Complete your assessments first">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-900">Complete Your Assessments First</h2>
          <p className="text-amber-700 mt-2">
            We need to understand your full story before creating your transformation plan.
          </p>
          <Link
            to="/assessments"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Continue Assessments <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Layout>
    );
  }

  // Show placeholder if no roadmap or if roadmap status is not 'published' or 'ready_for_client' or 'approved'
  if (!roadmap || (roadmapStatus && roadmapStatus !== 'published' && roadmapStatus !== 'ready_for_client' && roadmapStatus !== 'approved')) {
    return (
      <Layout title="Your Roadmap" subtitle="Your transformation plan is being prepared">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your Roadmap is Being Prepared</h2>
          <p className="text-slate-600 mt-3 max-w-md mx-auto">
            Your personalised roadmap will now be reviewed and generated. James will be in touch with you shortly to book a final call before presenting it.
          </p>
          <div className="mt-8 p-4 bg-white/60 rounded-lg border border-indigo-100">
            <p className="text-sm text-slate-600">
              <Clock className="w-4 h-4 inline mr-2" />
              We're carefully reviewing your responses and crafting your transformation plan. You'll receive an email notification once it's ready.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const { roadmapData, valueAnalysis } = roadmap;
  const vision = roadmapData?.fiveYearVision;
  const shift = roadmapData?.sixMonthShift;
  const sprint = roadmapData?.sprint;

  return (
    <Layout
      title={vision?.tagline || roadmapData?.summary?.headline || 'Your Transformation'}
      subtitle="Your comprehensive 365 transformation plan"
    >
      <div className="space-y-6">
        
        {/* ================================================================
            NAVIGATION TABS
        ================================================================ */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1.5 overflow-x-auto">
          {[
            { id: 'vision', label: '5-Year Vision', icon: Mountain, shortLabel: 'Vision' },
            { id: 'shift', label: '6-Month Shift', icon: Compass, shortLabel: '6-Month' },
            { id: 'sprint', label: '12-Week Sprint', icon: Flag, shortLabel: '12-Week' },
            { id: 'value', label: 'Value Analysis', icon: TrendingUp, shortLabel: 'Value' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ViewTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-fit ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* ================================================================
            TAB: 5-YEAR VISION
        ================================================================ */}
        {activeTab === 'vision' && (
          <div className="space-y-8">
            {/* North Star */}
            {vision?.northStar && (
              <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-indigo-300 text-sm uppercase tracking-widest mb-4">
                    <Star className="w-4 h-4" />
                    Your North Star
                  </div>
                  <blockquote className="text-2xl md:text-3xl font-light leading-relaxed">
                    "{vision.northStar}"
                  </blockquote>
                  {vision.emotionalCore && (
                    <p className="mt-6 text-indigo-200 text-sm max-w-2xl">
                      {vision.emotionalCore}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Transformation Story */}
            {vision?.transformationStory && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                  <h2 className="text-xl font-bold text-white">Your Transformation Story</h2>
                </div>
                
                <div className="divide-y divide-slate-200">
                  {/* Current Reality */}
                  {vision.transformationStory.currentReality && (
                    <div className="p-8 bg-gradient-to-r from-red-50 to-orange-50">
                      <h3 className="text-lg font-bold text-red-900 mb-4">
                        {vision.transformationStory.currentReality.title || 'Your Current Reality'}
                      </h3>
                      <div className="prose prose-slate max-w-none">
                        {(vision.transformationStory.currentReality.narrative || '').split('\n\n').map((p: string, i: number) => (
                          <p key={i} className="text-slate-700 leading-relaxed mb-4">{p}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Turning Point */}
                  {vision.transformationStory.turningPoint && (
                    <div className="p-8 bg-gradient-to-r from-amber-50 to-yellow-50">
                      <h3 className="text-lg font-bold text-amber-900 mb-4">
                        {vision.transformationStory.turningPoint.title || 'Your Turning Point'}
                      </h3>
                      <div className="prose prose-slate max-w-none">
                        {(vision.transformationStory.turningPoint.narrative || '').split('\n\n').map((p: string, i: number) => (
                          <p key={i} className="text-slate-700 leading-relaxed mb-4">{p}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Vision Achieved */}
                  {vision.transformationStory.visionAchieved && (
                    <div className="p-8 bg-gradient-to-r from-emerald-50 to-teal-50">
                      <h3 className="text-lg font-bold text-emerald-900 mb-4">
                        {vision.transformationStory.visionAchieved.title || 'Your Vision Achieved'}
                      </h3>
                      <div className="prose prose-slate max-w-none">
                        {(vision.transformationStory.visionAchieved.narrative || '').split('\n\n').map((p: string, i: number) => (
                          <p key={i} className="text-slate-700 leading-relaxed mb-4">{p}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Year Milestones */}
            {vision?.yearMilestones && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 px-2">Your Year-by-Year Journey</h3>
                
                {['year1', 'year3', 'year5'].map((yearKey, index) => {
                  const milestone = vision.yearMilestones[yearKey];
                  if (!milestone) return null;
                  
                  const yearNum = index === 0 ? 1 : index === 1 ? 3 : 5;
                  const colors = [
                    { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 border-emerald-200' },
                    { gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 border-blue-200' },
                    { gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-50 border-purple-200' }
                  ];
                  
                  return (
                    <div key={yearKey} className={`rounded-xl border-2 ${colors[index].bg} overflow-hidden`}>
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colors[index].gradient} text-white flex flex-col items-center justify-center flex-shrink-0`}>
                            <span className="text-xs uppercase tracking-wide opacity-75">Year</span>
                            <span className="text-2xl font-bold">{yearNum}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-slate-900">{milestone.headline}</h4>
                            <p className="text-slate-700 mt-3 leading-relaxed">{milestone.story}</p>
                            {milestone.measurable && (
                              <div className="mt-4 p-3 bg-white/60 rounded-lg">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Measurable Results</p>
                                <p className="text-sm font-medium text-slate-900">{milestone.measurable}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Archetype Badge */}
            {vision?.archetype && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-100 rounded-full">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-indigo-600">Your Archetype:</span>
                  <span className="text-sm font-bold text-indigo-900 capitalize">
                    {vision.archetype.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB: 6-MONTH SHIFT
        ================================================================ */}
        {activeTab === 'shift' && shift && (
          <div className="space-y-6">
            {/* Shift Overview */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Compass className="w-6 h-6" />
                <h2 className="text-xl font-bold">Your 6-Month Shift</h2>
              </div>
              <p className="text-lg opacity-95 leading-relaxed">{shift.shiftOverview || shift.overview}</p>
            </div>

            {/* Monthly Phases */}
            <div className="space-y-4">
              {['month1_2', 'month3_4', 'month5_6'].map((monthKey, index) => {
                const month = shift[monthKey];
                if (!month) return null;
                const monthLabels = ['Months 1-2', 'Months 3-4', 'Months 5-6'];
                
                return (
                  <div key={monthKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">{monthLabels[index]}</p>
                          <h3 className="text-lg font-bold text-slate-900">{month.theme}</h3>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 mb-4">{month.focus}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Key Actions</h4>
                          <ul className="space-y-2">
                            {(month.keyActions || month.key_actions || []).map((action: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Success Metrics</h4>
                          <ul className="space-y-2">
                            {(month.successMetrics || month.success_metrics || []).map((metric: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {month.howYoullFeel && (
                        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                          <p className="text-sm text-amber-800">
                            <span className="font-medium">How you'll feel:</span> {month.howYoullFeel}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Wins */}
            {shift.quickWins && shift.quickWins.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Wins
                </h3>
                <ul className="space-y-2">
                  {shift.quickWins.map((win: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-emerald-700">
                      <span className="text-emerald-500 font-bold">→</span>
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Danger Mitigation */}
            {shift.dangerMitigation && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Danger Zone Protection
                </h3>
                <p className="text-red-700">{shift.dangerMitigation}</p>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB: 12-WEEK SPRINT
        ================================================================ */}
        {activeTab === 'sprint' && (
          <div className="space-y-6">
            {/* Sprint Header */}
            {sprint && (
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl overflow-hidden">
                <div className="p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Flag className="w-6 h-6" />
                    <h2 className="text-xl font-bold">{sprint.sprintTheme || '90 Days to Transform'}</h2>
                  </div>
                  
                  {/* Format sprint promise into readable sections */}
                  <div className="space-y-4">
                    {sprint.sprintPromise && (
                      <div className="text-lg opacity-95 leading-relaxed">
                        {/* Split on common sentence patterns for better readability */}
                        {String(sprint.sprintPromise).split(/(?<=[.!?])\s+(?=[A-Z'"I])/).slice(0, 3).map((sentence: string, i: number) => (
                          <p key={i} className={i > 0 ? 'mt-3' : ''}>{sentence.trim()}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* What to Solve section - extract from promise if present */}
                {sprint.sprintPromise && sprint.sprintPromise.toLowerCase().includes('solve') && (
                  <div className="bg-white/10 p-6 border-t border-white/20">
                    <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-3">Key Challenge to Solve</h3>
                    <p className="text-white opacity-90">
                      {/* Extract the "solve" sentence if present */}
                      {String(sprint.sprintPromise).split(/[.!?]+/).find((s: string) => 
                        s.toLowerCase().includes('solve') || s.toLowerCase().includes('finding staff')
                      )?.trim() || ''}
                    </p>
                  </div>
                )}

                {/* Progress Toward section */}
                {(sprint.sprintGoals?.[0] || roadmapData?.summary?.northStar) && (
                  <div className="bg-indigo-800/50 p-6 border-t border-white/10">
                    <h3 className="text-indigo-200 text-sm font-semibold uppercase tracking-wide mb-2">Progress Toward</h3>
                    <p className="text-white font-medium">{sprint.sprintGoals?.[0] || roadmapData?.summary?.northStar}</p>
                  </div>
                )}
              </div>
            )}

            {/* Sprint Goals as Pills */}
            {sprint?.sprintGoals && sprint.sprintGoals.length > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">90-Day Goals</h3>
                <div className="flex flex-wrap gap-3">
                  {sprint.sprintGoals.map((goal: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg">
                      <Target className="w-4 h-4" />
                      <span className="text-sm font-medium">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Duration</p>
                    <p className="text-xl font-bold text-slate-900">12 Weeks</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tasks</p>
                    <p className="text-xl font-bold text-slate-900">
                      {tasks.filter(t => t.status === 'completed').length}/{tasks.length || roadmapData?.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || sprint?.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Value Score</p>
                    <p className="text-xl font-bold text-slate-900">{valueAnalysis?.overallScore || 0}/100</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Opportunity</p>
                    <p className="text-xl font-bold text-slate-900">£{((valueAnalysis?.totalOpportunity || 0) / 1000).toFixed(0)}k</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Weekly Breakdown</h3>
                <p className="text-sm text-slate-500 mt-1">Click on a week to see tasks</p>
              </div>

              <div className="divide-y divide-slate-100">
                {(sprint?.weeks || roadmapData?.weeks || []).map((week: any) => (
                  <WeekCard
                    key={week.weekNumber || week.week}
                    week={week}
                    tasks={tasks.filter(t => t.week_number === (week.weekNumber || week.week))}
                    isActive={activeWeek === (week.weekNumber || week.week)}
                    onToggle={() => setActiveWeek(activeWeek === (week.weekNumber || week.week) ? null : (week.weekNumber || week.week))}
                    onTaskStatusChange={updateTaskStatus}
                  />
                ))}
              </div>
            </div>

            {/* Tuesday Evolution */}
            {sprint?.tuesdayEvolution && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                <h3 className="font-bold text-indigo-900 mb-4">Your Tuesday Evolution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(sprint.tuesdayEvolution).map(([week, description]) => (
                    <div key={week} className="text-center">
                      <p className="text-xs text-indigo-600 uppercase tracking-wide">{week.replace('week', 'Week ')}</p>
                      <p className="text-sm text-indigo-800 mt-1">{description as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB: VALUE ANALYSIS
        ================================================================ */}
        {activeTab === 'value' && !valueAnalysis && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Value Analysis</h2>
            <p className="text-slate-600 max-w-md text-center mb-6">
              Discover hidden value opportunities in your business. This analysis identifies untapped assets,
              risks, and actionable improvements to maximize your business value.
            </p>
            {generatingValue ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                <p className="text-slate-600">Analyzing your business value...</p>
                <div className="mt-4 space-y-1 text-sm text-slate-500">
                  <p>🔍 Calculating asset scores...</p>
                  <p>⚠️ Identifying risks...</p>
                  <p>💡 Finding opportunities...</p>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handleGenerateValueAnalysis}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Value Analysis
                </button>
                {valueError && (
                  <p className="text-red-600 text-sm mt-3">{valueError}</p>
                )}
                {!part3Responses && (
                  <p className="text-slate-500 text-sm mt-3">
                    Complete the Hidden Value Assessment for deeper insights, or generate now with existing data.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {activeTab === 'value' && valueAnalysis && (
          <div className="space-y-6">
            {/* Business Valuation - TODAY'S VALUE */}
            {valueAnalysis.businessValuation && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-slate-400 text-sm uppercase tracking-wide">Your Business Value Today</p>
                    <p className="text-5xl font-bold mt-2 text-emerald-400">
                      £{(valueAnalysis.businessValuation.currentValue || 0).toLocaleString()}
                    </p>
                    <p className="text-slate-400 mt-1 text-sm">
                      Range: £{(valueAnalysis.businessValuation.valueRange?.low || 0).toLocaleString()} 
                      - £{(valueAnalysis.businessValuation.valueRange?.high || 0).toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      Method: {valueAnalysis.businessValuation.method} | As of {valueAnalysis.businessValuation.asOfDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm uppercase tracking-wide">Potential Value</p>
                    <p className="text-3xl font-bold mt-2 text-white">
                      £{(valueAnalysis.businessValuation.potentialValue || 0).toLocaleString()}
                    </p>
                    <p className="text-emerald-400 text-sm mt-1">
                      +£{(valueAnalysis.businessValuation.valueGapAmount || 0).toLocaleString()} opportunity
                    </p>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Revenue</p>
                    <p className="text-white font-semibold">£{(valueAnalysis.businessValuation.keyMetrics?.revenue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Net Profit</p>
                    <p className="text-white font-semibold">£{(valueAnalysis.businessValuation.keyMetrics?.netProfit || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase">SDE</p>
                    <p className="text-white font-semibold">£{(valueAnalysis.businessValuation.keyMetrics?.sde || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Growth Rate</p>
                    <p className="text-white font-semibold">{valueAnalysis.businessValuation.keyMetrics?.growthRate || '0%'}</p>
                  </div>
                </div>

                {/* Industry Comparison */}
                {valueAnalysis.businessValuation.industryComparison && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-3">Industry Comparison: {valueAnalysis.businessValuation.industryComparison.industry}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-700 rounded-full h-3 relative">
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full opacity-30"
                        />
                        <div 
                          className="absolute h-5 w-2 bg-white rounded -top-1"
                          style={{ left: `${valueAnalysis.businessValuation.industryComparison.percentile || 50}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">
                        {valueAnalysis.businessValuation.industryComparison.percentile || 50}th percentile
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      Your multiple: {valueAnalysis.businessValuation.industryComparison.yourMultiple}x 
                      | Industry avg: {valueAnalysis.businessValuation.industryComparison.averageMultiple}x
                      | Top performers: {valueAnalysis.businessValuation.industryComparison.topPerformersMultiple}x
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Value Drivers - What's Helping/Hurting Your Value */}
            {(valueAnalysis.businessValuation?.valueDrivers?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                  Value Drivers - What's Affecting Your Valuation
                </h3>
                <div className="space-y-3">
                  {valueAnalysis.businessValuation?.valueDrivers?.map((driver: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                        driver.impact > 0 ? 'bg-emerald-100 text-emerald-700' : 
                        driver.impact < -15 ? 'bg-red-100 text-red-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {driver.impact > 0 ? '+' : ''}{driver.impact}%
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{driver.name}</p>
                        <p className="text-sm text-slate-600">{driver.reason}</p>
                      </div>
                      {driver.fixable && driver.fixCost > 0 && (
                        <div className="text-right text-sm">
                          <p className="text-emerald-600 font-medium">Fixable</p>
                          <p className="text-slate-500">£{driver.fixCost.toLocaleString()} / {driver.fixTimeMonths}mo</p>
                          <p className="text-slate-400 text-xs">After: {driver.afterFix > 0 ? '+' : ''}{driver.afterFix}%</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROI on Improvements */}
            {valueAnalysis.businessValuation?.roi && valueAnalysis.businessValuation.roi.investmentRequired > 0 && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="font-bold mb-4">ROI on Value Improvements</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-indigo-200 text-sm">Investment Required</p>
                    <p className="text-2xl font-bold">£{valueAnalysis.businessValuation.roi.investmentRequired.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-sm">Time to Realize</p>
                    <p className="text-2xl font-bold">{valueAnalysis.businessValuation.roi.timeToRealize} months</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-sm">Value Increase</p>
                    <p className="text-2xl font-bold text-emerald-300">+£{valueAnalysis.businessValuation.roi.valueIncrease.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-sm">ROI</p>
                    <p className="text-2xl font-bold text-yellow-300">{valueAnalysis.businessValuation.roi.roiPercentage}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Exit Readiness */}
            {valueAnalysis.businessValuation?.exitReadiness && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Exit Readiness</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                    valueAnalysis.businessValuation.exitReadiness.score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                    valueAnalysis.businessValuation.exitReadiness.score >= 40 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {valueAnalysis.businessValuation.exitReadiness.score}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Time to Exit Ready: {valueAnalysis.businessValuation.exitReadiness.timeToExit}</p>
                    {(valueAnalysis.businessValuation?.exitReadiness?.blockers?.length ?? 0) > 0 && (
                      <p className="text-sm text-red-600">
                        Blockers: {valueAnalysis.businessValuation?.exitReadiness?.blockers?.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                {(valueAnalysis.businessValuation?.exitReadiness?.recommendations?.length ?? 0) > 0 && (
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Priority Fixes:</p>
                    {valueAnalysis.businessValuation?.exitReadiness?.recommendations?.slice(0, 3).map((rec: string, i: number) => (
                      <p key={i} className="text-sm text-slate-600">• {rec}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Overall Score */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm uppercase tracking-wide">Overall Value Score</p>
                  <p className="text-5xl font-bold mt-2">{valueAnalysis.overallScore}/100</p>
                  <p className="text-emerald-100 mt-2">
                    Total opportunity: £{(valueAnalysis.totalOpportunity || 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-12 h-12" />
                </div>
              </div>
            </div>

            {/* Asset Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(valueAnalysis.assetScores || []).map((asset: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">{asset.category}</h4>
                    <span className={`text-lg font-bold ${
                      asset.score >= 70 ? 'text-emerald-600' :
                      asset.score >= 50 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {asset.score}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full ${
                        asset.score >= 70 ? 'bg-emerald-500' :
                        asset.score >= 50 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${asset.score}%` }}
                    />
                  </div>
                  
                  {asset.issues?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Issues</p>
                      {asset.issues.map((issue: string, j: number) => (
                        <p key={j} className="text-sm text-slate-600">• {issue}</p>
                      ))}
                    </div>
                  )}
                  
                  {asset.opportunities?.length > 0 && (
                    <div>
                      <p className="text-xs text-emerald-600 uppercase tracking-wide mb-1">Opportunities</p>
                      {asset.opportunities.map((opp: string, j: number) => (
                        <p key={j} className="text-sm text-slate-600">• {opp}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Risk Register */}
            {(valueAnalysis.riskRegister?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-red-50">
                  <h3 className="font-bold text-red-900 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Risk Register
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {valueAnalysis.riskRegister?.map((risk: any, i: number) => (
                    <div key={i} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          risk.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                          risk.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {risk.severity}
                        </span>
                        <div>
                          <h4 className="font-medium text-slate-900">{risk.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{risk.impact}</p>
                          <p className="text-sm text-emerald-600 mt-2">
                            <span className="font-medium">Mitigation:</span> {risk.mitigation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Value Gaps */}
            {(valueAnalysis.valueGaps?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-emerald-50">
                  <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Value Gaps to Close
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {valueAnalysis.valueGaps?.map((gap: any, i: number) => (
                    <div key={i} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{gap.area}</h4>
                        <span className="text-lg font-bold text-emerald-600">
                          £{(gap.gap || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                        <span>Effort: {gap.effort}</span>
                        <span>Timeframe: {gap.timeframe}</span>
                      </div>
                      {gap.actions && (
                        <ul className="space-y-1">
                          {gap.actions.map((action: string, j: number) => (
                            <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            FOOTER
        ================================================================ */}
        <div className="flex justify-center pt-4 border-t border-slate-200">
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Regenerate Plan
          </button>
        </div>
      </div>
    </Layout>
  );
}

// ============================================================================
// WEEK CARD COMPONENT
// ============================================================================

function WeekCard({
  week,
  tasks,
  isActive,
  onToggle,
  onTaskStatusChange
}: {
  week: any;
  tasks: any[];
  isActive: boolean;
  onToggle: () => void;
  onTaskStatusChange: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => void;
}) {
  const weekNumber = week.weekNumber || week.week;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = week.tasks?.length || tasks.length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          progress === 100 ? 'bg-emerald-500 text-white' :
          progress > 0 ? 'bg-indigo-500 text-white' :
          'bg-slate-200 text-slate-600'
        }`}>
          {progress === 100 ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <span className="font-bold text-lg">{weekNumber}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900">{week.theme}</h4>
            {week.phase && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                {week.phase}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{week.focus}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{completedTasks}/{totalTasks}</p>
            <p className="text-xs text-slate-500">tasks</p>
          </div>
          {isActive ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {isActive && (
        <div className="px-4 pb-4">
          <div className="ml-16 space-y-2">
            {(week.tasks || []).map((task: any, index: number) => {
              const dbTask = tasks.find(t => t.title === task.title);
              const status = dbTask?.status || 'pending';
              
              return (
                <div
                  key={task.id || index}
                  className={`p-4 rounded-lg border ${
                    status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
                    status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                    'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => {
                        if (dbTask) {
                          const nextStatus = status === 'pending' ? 'in_progress' :
                                           status === 'in_progress' ? 'completed' : 'pending';
                          onTaskStatusChange(dbTask.id, nextStatus);
                        }
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                        status === 'in_progress' ? 'border-blue-500 bg-blue-100' :
                        'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {status === 'completed' && <CheckCircle className="w-4 h-4" />}
                      {status === 'in_progress' && <Play className="w-3 h-3 text-blue-500" />}
                    </button>
                    
                    <div className="flex-1">
                      <h5 className={`font-medium ${
                        status === 'completed' ? 'text-emerald-700 line-through' : 'text-slate-900'
                      }`}>
                        {task.title}
                      </h5>
                      <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                      {task.why && (
                        <p className="text-sm text-indigo-600 mt-2 italic">Why: {task.why}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{task.category}</span>
                        {task.estimatedHours && <span><Clock className="w-3 h-3 inline mr-1" />{task.estimatedHours}h</span>}
                        <span className={`px-2 py-0.5 rounded ${
                          task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {week.milestone && (
            <div className="ml-16 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">
                <span className="uppercase text-xs tracking-wide">Milestone:</span> {week.milestone}
              </p>
            </div>
          )}

          {week.tuesdayTransformation && (
            <div className="ml-16 mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-800">
                <span className="font-medium">Tuesday Evolution:</span> {week.tuesdayTransformation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
