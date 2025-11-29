// ============================================================================
// ROADMAP PAGE - Your Transformation Journey
// ============================================================================
// A clean, narrative-focused view of the client's transformation plan

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useRoadmap, useGenerateAnalysis, useTasks } from '@/hooks/useAnalysis';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle,
  Clock,
  Target,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Star,
  Compass,
  Mountain,
  Calendar,
  ChevronRight,
  Quote,
  Zap
} from 'lucide-react';

export default function RoadmapPage() {
  const { roadmap, fetchRoadmap, loading: roadmapLoading } = useRoadmap();
  const { generate, loading: generating, error: generateError } = useGenerateAnalysis();
  const { progress } = useAssessmentProgress();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchRoadmap();
      setIsInitialized(true);
    };
    init();
  }, []);

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
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Crafting Your Story</h2>
          <p className="text-slate-600 mt-3 max-w-md text-center">
            We're analyzing everything you've shared to create a deeply personal transformation plan...
          </p>
          <div className="mt-8 flex gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
            We need to understand your story before we can create your transformation plan.
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

  if (!roadmap) {
    return (
      <Layout title="Your Roadmap" subtitle="Ready to create your plan">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mountain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your Story Awaits</h2>
          <p className="text-slate-600 mt-3 max-w-md mx-auto">
            You've completed your assessments. Now let's turn everything you've shared into a clear, actionable transformation plan.
          </p>
          <button
            onClick={() => generate()}
            disabled={generating}
            className="inline-flex items-center gap-3 mt-8 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium text-lg"
          >
            <Sparkles className="w-5 h-5" />
            Create My Transformation Plan
          </button>
        </div>
      </Layout>
    );
  }

  const { roadmapData, valueAnalysis } = roadmap;
  const vision = roadmapData?.fiveYearVision;

  return (
    <Layout
      title="Your Transformation"
      subtitle="A clear path from where you are to where you want to be"
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        
        {/* ================================================================
            SECTION 1: THE NORTH STAR
        ================================================================ */}
        {(vision?.northStar || roadmapData?.northStar) && (
          <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-indigo-300 text-sm uppercase tracking-widest mb-4">
                <Star className="w-4 h-4" />
                Your North Star
              </div>
              <blockquote className="text-2xl md:text-3xl font-light leading-relaxed">
                "{vision?.northStar || roadmapData?.northStar}"
              </blockquote>
            </div>
          </div>
        )}

        {/* ================================================================
            SECTION 2: YOUR 5-YEAR VISION (The Story)
        ================================================================ */}
        {(vision?.fiveYearVision || vision?.narrative || vision?.currentReality) && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Mountain className="w-6 h-6" />
                Your 5-Year Vision
              </h2>
              <p className="text-indigo-100 mt-1">The story of your transformation</p>
            </div>
            
            <div className="p-8">
              {/* New format: single narrative */}
              {vision?.fiveYearVision && typeof vision.fiveYearVision === 'string' && (
                <div className="prose prose-lg prose-slate max-w-none">
                  {vision.fiveYearVision.split('\n\n').map((paragraph: string, i: number) => (
                    <p key={i} className="text-slate-700 leading-relaxed mb-6 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Legacy format: currentReality/turningPoint/visionAchieved */}
              {vision?.currentReality && (
                <div className="space-y-8">
                  <div className="border-l-4 border-red-400 pl-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">
                      {vision.currentReality.headline || 'Where You Are Now'}
                    </h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {vision.currentReality.narrative}
                    </p>
                  </div>
                  
                  {vision.turningPoint && (
                    <div className="border-l-4 border-amber-400 pl-6">
                      <h3 className="text-lg font-semibold text-amber-800 mb-3">
                        {vision.turningPoint.headline || 'The Turning Point'}
                      </h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {vision.turningPoint.narrative}
                      </p>
                    </div>
                  )}
                  
                  {vision.visionAchieved && (
                    <div className="border-l-4 border-emerald-400 pl-6">
                      <h3 className="text-lg font-semibold text-emerald-800 mb-3">
                        {vision.visionAchieved.headline || 'Your Vision Achieved'}
                      </h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {vision.visionAchieved.narrative}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Fallback: simple narrative */}
              {vision?.narrative && !vision?.fiveYearVision && !vision?.currentReality && (
                <div className="prose prose-lg prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {vision.narrative}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            SECTION 3: YEAR MILESTONES
        ================================================================ */}
        {(vision?.yearMilestones || vision?.year1) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['year1', 'year3', 'year5'].map((yearKey, index) => {
              const milestone = vision?.yearMilestones?.[yearKey] || vision?.[yearKey];
              if (!milestone) return null;
              
              const yearNum = index === 0 ? 1 : index === 1 ? 3 : 5;
              const colors = [
                { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 border-emerald-200' },
                { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 border-blue-200' },
                { bg: 'from-purple-500 to-pink-600', light: 'bg-purple-50 border-purple-200' }
              ];
              
              return (
                <div key={yearKey} className={`rounded-xl border ${colors[index].light} overflow-hidden`}>
                  <div className={`bg-gradient-to-r ${colors[index].bg} px-4 py-3 text-white`}>
                    <span className="text-sm opacity-75">Year</span>
                    <span className="ml-2 text-2xl font-bold">{yearNum}</span>
                  </div>
                  <div className="p-5">
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {milestone.headline}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {milestone.summary || milestone.story}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================================
            SECTION 4: 6-MONTH SHIFTS
        ================================================================ */}
        {(vision?.sixMonthShifts || roadmapData?.sixMonthShift) && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">What Needs to Change</h2>
                <p className="text-slate-600 text-sm">The structural shifts for the next 6 months</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* New format: array of shifts */}
              {Array.isArray(vision?.sixMonthShifts) && vision.sixMonthShifts.map((shift: string, i: number) => (
                <div key={i} className="flex items-start gap-4 bg-white/60 rounded-xl p-4">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 pt-1">{shift}</p>
                </div>
              ))}
              
              {/* Legacy format: overview */}
              {roadmapData?.sixMonthShift?.overview && !Array.isArray(vision?.sixMonthShifts) && (
                <p className="text-slate-700">{roadmapData.sixMonthShift.overview}</p>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            SECTION 5: 3-MONTH FOCUS
        ================================================================ */}
        {(vision?.threeMonthFocus || roadmapData?.summary) && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Your 3-Month Focus</h2>
                <p className="text-indigo-200 text-sm">Where to put your energy right now</p>
              </div>
            </div>
            
            {vision?.threeMonthFocus && (
              <div className="space-y-4">
                <div className="text-2xl font-bold">{vision.threeMonthFocus.theme}</div>
                <p className="text-indigo-100">{vision.threeMonthFocus.why}</p>
                <div className="bg-white/10 rounded-xl p-4 mt-4">
                  <p className="text-sm text-indigo-200 uppercase tracking-wide mb-1">In 90 days:</p>
                  <p className="text-white font-medium">{vision.threeMonthFocus.outcome}</p>
                </div>
              </div>
            )}
            
            {/* Legacy format */}
            {!vision?.threeMonthFocus && roadmapData?.summary && (
              <div className="space-y-4">
                <div className="text-2xl font-bold">{roadmapData.summary.headline}</div>
                <p className="text-indigo-100">{roadmapData.summary.keyInsight}</p>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            SECTION 6: IMMEDIATE ACTIONS
        ================================================================ */}
        {(vision?.immediateActions || roadmapData?.priorities) && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Your Action Plan</h2>
                  <p className="text-slate-600 text-sm">Start here - these are your next steps</p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {/* New format: immediateActions with why */}
              {Array.isArray(vision?.immediateActions) && vision.immediateActions.map((item: any, i: number) => (
                <div key={i} className="px-8 py-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{item.action}</h4>
                      <p className="text-slate-600 text-sm mt-1">{item.why}</p>
                      {item.time && (
                        <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
              
              {/* Legacy format: priorities */}
              {!vision?.immediateActions && Array.isArray(roadmapData?.priorities) && roadmapData.priorities.map((priority: any, i: number) => (
                <div key={i} className="px-8 py-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">
                      {priority.rank || i + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{priority.title}</h4>
                      {priority.description && (
                        <p className="text-slate-600 text-sm mt-1">{priority.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            FOOTER: REGENERATE OPTION
        ================================================================ */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => generate(true)}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Regenerate My Plan
          </button>
        </div>
      </div>
    </Layout>
  );
}
