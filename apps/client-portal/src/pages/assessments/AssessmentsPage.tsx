// ============================================================================
// ASSESSMENTS OVERVIEW PAGE
// ============================================================================
// Shows all 3 assessments with status and ability to review/continue

import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { 
  CheckCircle, 
  Clock, 
  Play, 
  Eye, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ASSESSMENT_LABELS } from '@torsor/shared';

export default function AssessmentsPage() {
  const { clientSession } = useAuth();
  const { progress, loading } = useAssessmentProgress();
  const navigate = useNavigate();

  const allComplete = progress?.overall === 100;

  if (loading) {
    return (
      <Layout title="Assessments" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Your Assessments"
      subtitle="Complete all three parts to unlock your personalized roadmap"
    >
      <div className="space-y-6">
        {/* Overall Progress */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold opacity-90">Overall Progress</h2>
              <p className="text-3xl font-bold mt-1">{progress?.overall || 0}%</p>
              <p className="text-sm opacity-75 mt-1">
                {allComplete 
                  ? 'All assessments completed!' 
                  : 'Complete all assessments to generate your roadmap'}
              </p>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
              <span className="text-2xl font-bold">{progress?.overall || 0}%</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress?.overall || 0}%` }}
            />
          </div>
        </div>

        {/* Assessment Cards */}
        <div className="space-y-4">
          <AssessmentCard
            number={1}
            type="part1"
            title={ASSESSMENT_LABELS.part1}
            description="15 questions about your personal vision and life design"
            status={progress?.part1.status || 'not_started'}
            percentage={progress?.part1.percentage || 0}
            questions={15}
            estimatedTime="10-15 min"
            disabled={false}
          />
          
          <AssessmentCard
            number={2}
            type="part2"
            title={ASSESSMENT_LABELS.part2}
            description="72 questions exploring your business operations and goals"
            status={progress?.part2.status || 'not_started'}
            percentage={progress?.part2.percentage || 0}
            questions={72}
            estimatedTime="30-45 min"
            disabled={progress?.part1.status !== 'completed'}
          />
          
          <AssessmentCard
            number={3}
            type="part3"
            title={ASSESSMENT_LABELS.part3}
            description="32 questions uncovering hidden value in your business"
            status={progress?.part3.status || 'not_started'}
            percentage={progress?.part3.percentage || 0}
            questions={32}
            estimatedTime="15-20 min"
            disabled={progress?.part2.status !== 'completed'}
          />
        </div>

        {/* Action Buttons */}
        {allComplete && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900">All Assessments Complete!</h3>
                <p className="text-emerald-700 mt-1">
                  Your personalized roadmap is ready. View your strategic action plan and start making progress.
                </p>
                <Link
                  to="/roadmap"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  View Your Roadmap
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Review All Responses */}
        {(progress?.overall || 0) > 0 && (
          <div className="border-t border-slate-200 pt-6">
            <Link
              to="/assessment/review"
              className="flex items-center justify-center gap-2 w-full py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Eye className="w-5 h-5" />
              Review All Responses
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Assessment Card Component
function AssessmentCard({
  number,
  type,
  title,
  description,
  status,
  percentage,
  questions,
  estimatedTime,
  disabled,
}: {
  number: number;
  type: string;
  title: string;
  description: string;
  status: string;
  percentage: number;
  questions: number;
  estimatedTime: string;
  disabled: boolean;
}) {
  const isComplete = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isNotStarted = status === 'not_started' || !status;

  const getStatusBadge = () => {
    if (isComplete) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }
    if (isInProgress) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          <Clock className="w-3 h-3" />
          In Progress ({percentage}%)
        </span>
      );
    }
    if (disabled) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
          <Lock className="w-3 h-3" />
          Locked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
        Not Started
      </span>
    );
  };

  const getActionButton = () => {
    if (disabled) {
      return (
        <button 
          disabled
          className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed text-sm"
        >
          Complete Part {number - 1} first
        </button>
      );
    }
    if (isComplete) {
      return (
        <Link
          to={`/assessment/${type}?mode=review`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          Review Answers
        </Link>
      );
    }
    if (isInProgress) {
      return (
        <Link
          to={`/assessment/${type}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          <Play className="w-4 h-4" />
          Continue
        </Link>
      );
    }
    return (
      <Link
        to={`/assessment/${type}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
      >
        <Play className="w-4 h-4" />
        Start
      </Link>
    );
  };

  return (
    <div className={`bg-white rounded-xl border p-6 ${
      disabled ? 'border-slate-200 opacity-60' : 
      isComplete ? 'border-emerald-200' : 
      'border-slate-200'
    }`}>
      <div className="flex items-start gap-4">
        {/* Number Badge */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          isComplete ? 'bg-emerald-500 text-white' :
          isInProgress ? 'bg-indigo-500 text-white' :
          disabled ? 'bg-slate-200 text-slate-400' :
          'bg-slate-100 text-slate-600'
        }`}>
          {isComplete ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <span className="text-xl font-bold">{number}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
            {getStatusBadge()}
          </div>
          
          {/* Meta Info */}
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <span>{questions} questions</span>
            <span>•</span>
            <span>{estimatedTime}</span>
          </div>

          {/* Progress Bar for In Progress */}
          {isInProgress && percentage > 0 && (
            <div className="mt-3">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Action */}
          <div className="mt-4">
            {getActionButton()}
          </div>
        </div>
      </div>
    </div>
  );
}

