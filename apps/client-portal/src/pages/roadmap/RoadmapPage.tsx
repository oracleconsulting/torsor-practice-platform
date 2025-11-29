// ============================================================================
// ROADMAP PAGE - Narrative-Driven Oracle Method
// ============================================================================
// Displays the transformation journey:
// 1. 5-Year Vision (where you're going)
// 2. 6-Month Shift (what needs to happen first)
// 3. 12-Week Sprint (your immediate action plan)

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
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Play,
  RotateCcw,
  ArrowRight,
  Star,
  Calendar,
  Flag,
  Compass,
  Mountain
} from 'lucide-react';

type ViewMode = 'vision' | 'shift' | 'sprint';

export default function RoadmapPage() {
  const { roadmap, fetchRoadmap, loading: roadmapLoading } = useRoadmap();
  const { generate, loading: generating, error: generateError } = useGenerateAnalysis();
  const { progress } = useAssessmentProgress();
  const { tasks, fetchTasks, updateTaskStatus } = useTasks();
  const [activeWeek, setActiveWeek] = useState<number | null>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('sprint');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchRoadmap();
      setIsInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (roadmap) {
      fetchTasks();
    }
  }, [roadmap]);

  const handleRegenerate = async () => {
    await generate(true);
    await fetchRoadmap();
  };

  // Loading states
  if (!isInitialized || roadmapLoading) {
    return (
      <Layout title="Your Roadmap" subtitle="Loading...">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-600 mt-4">Loading your transformation roadmap...</p>
        </div>
      </Layout>
    );
  }

  if (generating) {
    return (
      <Layout title="Your Roadmap" subtitle="Generating...">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Building Your Transformation Story</h2>
          <p className="text-slate-600 mt-2 max-w-md text-center">
            Analyzing your goals, your life, and your business to create a personalized journey...
          </p>
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
            Your transformation roadmap will be generated once you complete all three assessments.
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
      <Layout title="Your Roadmap" subtitle="Ready to generate">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
          <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-indigo-900">Generate Your Roadmap</h2>
          <p className="text-indigo-700 mt-2 max-w-md mx-auto">
            Your assessments are complete. Click below to generate your personalized transformation journey.
          </p>
          <button
            onClick={() => generate()}
            disabled={generating}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate My Roadmap
          </button>
          {generateError && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left max-w-lg mx-auto">
              <p className="text-sm text-amber-800">
                Run the SQL script <code className="bg-amber-100 px-1 rounded">scripts/insert-tom-roadmap.sql</code> in Supabase to see a sample roadmap.
              </p>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  const { roadmapData, valueAnalysis } = roadmap;

  return (
    <Layout
      title="Your Transformation"
      subtitle={roadmapData?.summary?.headline || 'Your personalized journey'}
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-white rounded-lg border border-slate-200 p-1">
          <button
            onClick={() => setViewMode('vision')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'vision' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mountain className="w-4 h-4" />
            5-Year Vision
          </button>
          <button
            onClick={() => setViewMode('shift')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'shift' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            6-Month Shift
          </button>
          <button
            onClick={() => setViewMode('sprint')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'sprint' 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flag className="w-4 h-4" />
            12-Week Sprint
          </button>
        </div>

        {/* 5-Year Vision View */}
        {viewMode === 'vision' && roadmapData?.fiveYearVision && (
          <div className="space-y-6">
            {/* Vision Narrative */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-xl p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6" />
                <h2 className="text-xl font-bold">Your 5-Year Vision</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed opacity-95 whitespace-pre-line">
                  {roadmapData.fiveYearVision.narrative}
                </p>
              </div>
              {roadmapData.fiveYearVision.northStar && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-sm uppercase tracking-wide opacity-75 mb-1">Your North Star</p>
                  <p className="text-xl font-semibold">{roadmapData.fiveYearVision.northStar}</p>
                </div>
              )}
            </div>

            {/* Year Milestones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['year1', 'year3', 'year5'].map((year, index) => {
                const yearData = roadmapData.fiveYearVision[year];
                if (!yearData) return null;
                const yearNum = index === 0 ? 1 : index === 1 ? 3 : 5;
                const colors = [
                  'border-emerald-200 bg-emerald-50',
                  'border-blue-200 bg-blue-50',
                  'border-purple-200 bg-purple-50'
                ];
                return (
                  <div key={year} className={`rounded-xl border ${colors[index]} p-6`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                      } text-white font-bold`}>
                        Y{yearNum}
                      </div>
                      <h3 className="font-semibold text-slate-900">{yearData.headline}</h3>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">{yearData.story}</p>
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Measurable</p>
                      <p className="text-sm font-medium text-slate-900">{yearData.measurable}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6-Month Shift View */}
        {viewMode === 'shift' && roadmapData?.sixMonthShift && (
          <div className="space-y-6">
            {/* Shift Overview */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Compass className="w-6 h-6" />
                <h2 className="text-xl font-bold">Your 6-Month Shift</h2>
              </div>
              <p className="text-lg opacity-95">{roadmapData.sixMonthShift.overview}</p>
            </div>

            {/* Monthly Phases */}
            <div className="space-y-4">
              {['month1_2', 'month3_4', 'month5_6'].map((monthKey, index) => {
                const monthData = roadmapData.sixMonthShift[monthKey];
                if (!monthData) return null;
                const monthLabel = index === 0 ? 'Months 1-2' : index === 1 ? 'Months 3-4' : 'Months 5-6';
                return (
                  <div key={monthKey} className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">{monthLabel}</p>
                        <h3 className="font-semibold text-slate-900">{monthData.theme}</h3>
                      </div>
                    </div>
                    <p className="text-slate-600 mb-4">{monthData.focus}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Key Actions</p>
                        <ul className="space-y-1">
                          {monthData.keyActions?.map((action: string, i: number) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Success Metrics</p>
                        <ul className="space-y-1">
                          {monthData.successMetrics?.map((metric: string, i: number) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {metric}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Wins */}
            {roadmapData.sixMonthShift.quickWins && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Quick Wins
                </h3>
                <ul className="space-y-2">
                  {roadmapData.sixMonthShift.quickWins.map((win: string, i: number) => (
                    <li key={i} className="text-emerald-700 flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      {win}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 12-Week Sprint View */}
        {viewMode === 'sprint' && (
          <div className="space-y-6">
            {/* Sprint Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Value Score</p>
                    <p className="text-2xl font-bold text-slate-900">{valueAnalysis?.overallScore || 0}/100</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Sprint Duration</p>
                    <p className="text-2xl font-bold text-slate-900">12 Weeks</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tasks Complete</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {tasks.filter(t => t.status === 'completed').length}/{tasks.length || roadmapData?.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || 0}
                    </p>
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
                    <p className="text-2xl font-bold text-slate-900">£{((valueAnalysis?.totalOpportunity || 0) / 1000).toFixed(0)}k</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insight */}
            {roadmapData?.summary?.keyInsight && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-start gap-4">
                  <Sparkles className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Key Insight</h3>
                    <p className="mt-1 opacity-90">{roadmapData.summary.keyInsight}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Your 12-Week Sprint</h3>
                <p className="text-sm text-slate-500 mt-1">Click on a week to see tasks</p>
              </div>

              <div className="divide-y divide-slate-200">
                {roadmapData?.weeks?.map((week: any) => (
                  <WeekCard
                    key={week.weekNumber}
                    week={week}
                    tasks={tasks.filter(t => t.week_number === week.weekNumber)}
                    isActive={activeWeek === week.weekNumber}
                    onToggle={() => setActiveWeek(activeWeek === week.weekNumber ? null : week.weekNumber)}
                    onTaskStatusChange={updateTaskStatus}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Regenerate Roadmap
          </button>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View All Tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}

// Week Card Component
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
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = week.tasks?.length || tasks.length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          progress === 100 ? 'bg-emerald-500 text-white' :
          progress > 0 ? 'bg-indigo-500 text-white' :
          'bg-slate-200 text-slate-600'
        }`}>
          {progress === 100 ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <span className="font-bold">{week.weekNumber}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900">{week.theme}</h4>
            {week.milestone && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                Milestone
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
          <div className="ml-14 space-y-2">
            {(week.tasks || []).map((task: any, index: number) => {
              const dbTask = tasks.find(t => t.title === task.title);
              const status = dbTask?.status || 'pending';
              
              return (
                <div
                  key={task.id || index}
                  className={`p-3 rounded-lg border ${
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
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                        status === 'in_progress' ? 'border-blue-500 bg-blue-100' :
                        'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {status === 'in_progress' && <Play className="w-3 h-3 text-blue-500" />}
                    </button>
                    
                    <div className="flex-1">
                      <h5 className={`font-medium ${
                        status === 'completed' ? 'text-emerald-700 line-through' : 'text-slate-900'
                      }`}>
                        {task.title}
                      </h5>
                      <p className="text-sm text-slate-500 mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{task.category}</span>
                        <span>{task.estimatedHours}h</span>
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
            <div className="ml-14 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">{week.milestone}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
