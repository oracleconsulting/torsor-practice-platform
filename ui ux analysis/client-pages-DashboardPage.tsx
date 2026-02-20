import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { useCurrentTasks } from '@/hooks/useTasks';
import {
  ClipboardList,
  Map,
  CheckCircle,
  Clock,
  ArrowRight,
  Target,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { ASSESSMENT_LABELS } from '@torsor/shared';

export default function DashboardPage() {
  const { clientSession } = useAuth();
  const { progress, loading: progressLoading } = useAssessmentProgress();
  const { tasks, loading: tasksLoading } = useCurrentTasks();

  // Discovery clients go straight to discovery assessment
  if (clientSession?.status === 'discovery') {
    return <Navigate to="/discovery" replace />;
  }

  // Discovery complete clients see holding message
  if (clientSession?.status === 'discovery_complete') {
    return <Navigate to="/discovery/complete" replace />;
  }

  const currentWeek = progress?.currentWeek || 1;
  const pendingTasks = tasks?.filter(t => t.status === 'pending') || [];
  const completedTasks = tasks?.filter(t => t.status === 'completed') || [];

  return (
    <Layout
      title={`Welcome back, ${clientSession?.name?.split(' ')[0] || 'there'}!`}
      subtitle={`Week ${currentWeek} of your 13-week transformation`}
    >
      <div className="space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProgressCard
            title="Assessments"
            value={`${progress?.overall || 0}%`}
            subtitle="Complete"
            icon={ClipboardList}
            color="indigo"
          />
          <ProgressCard
            title="This Week"
            value={`${completedTasks.length}/${tasks?.length || 0}`}
            subtitle="Tasks done"
            icon={Target}
            color="emerald"
          />
          <ProgressCard
            title="Program"
            value={`Week ${currentWeek}`}
            subtitle="of 13 weeks"
            icon={TrendingUp}
            color="amber"
          />
        </div>

        {/* Assessment Status */}
        {progress && progress.overall < 100 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Complete Your Assessments
            </h2>
            <div className="space-y-3">
              <AssessmentRow
                type="part1"
                title={ASSESSMENT_LABELS.part1}
                status={progress.part1.status}
                percentage={progress.part1.percentage}
              />
              <AssessmentRow
                type="part2"
                title={ASSESSMENT_LABELS.part2}
                status={progress.part2.status}
                percentage={progress.part2.percentage}
                disabled={progress.part1.status !== 'completed'}
              />
              <AssessmentRow
                type="part3"
                title={ASSESSMENT_LABELS.part3}
                status={progress.part3.status}
                percentage={progress.part3.percentage}
                disabled={progress.part2.status !== 'completed'}
              />
            </div>
          </div>
        )}

        {/* This Week's Tasks */}
        {progress?.hasRoadmap && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                This Week's Focus
              </h2>
              <Link
                to="/tasks"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {tasksLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.slice(0, 3).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p className="font-medium text-slate-900">All caught up!</p>
                <p className="text-sm">You've completed all tasks for this week.</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            to="/chat"
            icon="💬"
            title="Ask a Question"
            description="Get help from your AI assistant"
          />
          <QuickAction
            to="/appointments"
            icon="📅"
            title="Book a Call"
            description="Schedule time with your advisor"
          />
        </div>
      </div>
    </Layout>
  );
}

// Progress Card Component
function ProgressCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'indigo' | 'emerald' | 'amber';
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

// Assessment Row Component
function AssessmentRow({
  type,
  title,
  status,
  percentage,
  disabled = false,
}: {
  type: string;
  title: string;
  status: string;
  percentage: number;
  disabled?: boolean;
}) {
  const isComplete = status === 'completed';

  return (
    <Link
      to={disabled ? '#' : `/assessment/${type}`}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
        disabled
          ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
          : isComplete
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-slate-200 hover:border-indigo-300'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isComplete ? 'bg-emerald-500' : 'bg-slate-200'
        }`}
      >
        {isComplete ? (
          <CheckCircle className="w-5 h-5 text-white" />
        ) : (
          <Clock className="w-5 h-5 text-slate-500" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">
          {isComplete ? 'Completed' : `${percentage}% complete`}
        </p>
      </div>
      {!disabled && !isComplete && (
        <ArrowRight className="w-5 h-5 text-slate-400" />
      )}
    </Link>
  );
}

// Task Card Component
function TaskCard({ task }: { task: any }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
      <div className="w-2 h-2 rounded-full bg-indigo-500" />
      <div className="flex-1">
        <p className="font-medium text-slate-900">{task.title}</p>
        <p className="text-sm text-slate-500">{task.category}</p>
      </div>
      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded">
        {task.priority}
      </span>
    </div>
  );
}

// Quick Action Component
function QuickAction({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
    </Link>
  );
}

