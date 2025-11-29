// ============================================================================
// ROADMAP PAGE
// ============================================================================
// Displays the 13-week transformation roadmap with:
// - Value analysis summary
// - Weekly sprints with tasks
// - Progress tracking

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
  ArrowRight
} from 'lucide-react';

export default function RoadmapPage() {
  const { roadmap, fetchRoadmap, loading: roadmapLoading } = useRoadmap();
  const { generate, loading: generating, error: generateError } = useGenerateAnalysis();
  const { progress } = useAssessmentProgress();
  const { tasks, fetchTasks, updateTaskStatus } = useTasks();
  const [activeWeek, setActiveWeek] = useState<number | null>(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch roadmap on mount - don't auto-generate (Edge Function may not be deployed)
  useEffect(() => {
    const init = async () => {
      await fetchRoadmap();
      setIsInitialized(true);
    };
    init();
  }, []);

  // Fetch tasks when roadmap is loaded
  useEffect(() => {
    if (roadmap) {
      fetchTasks();
    }
  }, [roadmap]);

  const handleRegenerate = async () => {
    await generate(true);
    await fetchRoadmap();
  };

  // Loading state
  if (!isInitialized || roadmapLoading) {
    return (
      <Layout title="Your Roadmap" subtitle="Loading...">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-600 mt-4">Loading your roadmap...</p>
        </div>
      </Layout>
    );
  }

  // Generating state
  if (generating) {
    return (
      <Layout title="Your Roadmap" subtitle="Generating...">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Generating Your Roadmap</h2>
          <p className="text-slate-600 mt-2">
            Our AI is analyzing your assessments and creating a personalized 13-week plan...
          </p>
          <div className="mt-6 text-sm text-slate-500">This usually takes 15-30 seconds</div>
        </div>
      </Layout>
    );
  }

  // Assessments not complete
  if (progress?.overall !== 100) {
    return (
      <Layout title="Your Roadmap" subtitle="Complete your assessments first">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-900">Complete Your Assessments First</h2>
          <p className="text-amber-700 mt-2 max-w-md mx-auto">
            Your roadmap will be generated once you complete all three assessments.
            You're {progress?.overall || 0}% of the way there!
          </p>
          <Link
            to="/assessments"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Continue Assessments
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Layout>
    );
  }

  // No roadmap yet (error state)
  if (!roadmap && generateError) {
    return (
      <Layout title="Your Roadmap" subtitle="Something went wrong">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900">Generation Failed</h2>
          <p className="text-red-700 mt-2">{generateError}</p>
          <button
            onClick={() => generate()}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  // No roadmap - offer to generate
  if (!roadmap) {
    return (
      <Layout title="Your Roadmap" subtitle="Ready to generate">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
          <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-indigo-900">Generate Your Roadmap</h2>
          <p className="text-indigo-700 mt-2 max-w-md mx-auto">
            All your assessments are complete. Click below to generate your personalized 13-week transformation roadmap.
          </p>
          <button
            onClick={() => generate()}
            disabled={generating}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate My Roadmap
              </>
            )}
          </button>
          
          {generateError && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left max-w-lg mx-auto">
              <p className="text-sm text-amber-800 font-medium">Edge Function Not Deployed</p>
              <p className="text-sm text-amber-700 mt-1">
                The roadmap generation Edge Function needs to be deployed to Supabase. 
                Run: <code className="bg-amber-100 px-1 rounded">supabase functions deploy generate-analysis</code>
              </p>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Main roadmap view
  const { roadmapData, valueAnalysis } = roadmap;

  return (
    <Layout
      title="Your Roadmap"
      subtitle={roadmapData?.summary?.headline || '13-week transformation plan'}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Value Score */}
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

          {/* Weeks */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Duration</p>
                <p className="text-2xl font-bold text-slate-900">{roadmapData?.weeks?.length || 13} Weeks</p>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tasks</p>
                <p className="text-2xl font-bold text-slate-900">
                  {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
                </p>
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

        {/* Priorities */}
        {roadmapData?.priorities && roadmapData.priorities.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Your Strategic Priorities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmapData.priorities.slice(0, 3).map((priority: any) => (
                <div key={priority.rank} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {priority.rank}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {priority.category}
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-900">{priority.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{priority.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">13-Week Timeline</h3>
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

        {/* Regenerate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Regenerate Roadmap
          </button>
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
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div>
      {/* Week Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
      >
        {/* Week Number */}
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

        {/* Week Info */}
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

        {/* Progress */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{completedTasks}/{totalTasks}</p>
            <p className="text-xs text-slate-500">tasks</p>
          </div>
          {isActive ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Task List */}
      {isActive && (
        <div className="px-4 pb-4">
          <div className="ml-14 space-y-2">
            {week.tasks?.map((task: any, index: number) => {
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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
