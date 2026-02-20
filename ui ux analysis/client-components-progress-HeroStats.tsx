// ============================================================================
// HeroStats — 4-card hero stats for progress page
// ============================================================================

import { Clock, CheckCircle, Heart, Target } from 'lucide-react';

export interface HeroStatsProps {
  hoursReclaimed: number | null;
  totalTasksCompleted: number;
  lifeAlignmentScore: number | null;
  sprintsCompleted: number;
  totalSprints: number;
  completionRate: number;
}

export function HeroStats({
  hoursReclaimed,
  totalTasksCompleted,
  lifeAlignmentScore,
  sprintsCompleted,
  totalSprints,
  completionRate,
}: HeroStatsProps) {
  const lifeColor =
    lifeAlignmentScore == null
      ? 'text-gray-400'
      : lifeAlignmentScore >= 70
        ? 'text-emerald-600'
        : lifeAlignmentScore >= 40
          ? 'text-amber-600'
          : 'text-rose-600';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-emerald-600 mb-1">
          <Clock className="w-5 h-5" />
          <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Hours reclaimed</span>
        </div>
        <p className="text-3xl font-bold text-emerald-600">
          {hoursReclaimed != null ? hoursReclaimed : '—'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {hoursReclaimed != null ? 'hours/week reclaimed' : 'Track your hours in Life Pulse'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <CheckCircle className="w-5 h-5" />
          <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Tasks completed</span>
        </div>
        <p className="text-3xl font-bold text-indigo-600">{totalTasksCompleted}</p>
        <p className="text-xs text-gray-500 mt-1">{completionRate}% completion rate</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-rose-500 mb-1">
          <Heart className="w-5 h-5" />
          <span className="text-xs font-medium text-rose-600 uppercase tracking-wide">Life alignment</span>
        </div>
        <p className={`text-3xl font-bold ${lifeColor}`}>
          {lifeAlignmentScore != null ? Math.round(lifeAlignmentScore) : '—'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {lifeAlignmentScore != null ? '/100' : 'Start your Life Pulse'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-amber-600 mb-1">
          <Target className="w-5 h-5" />
          <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Sprints</span>
        </div>
        <p className="text-3xl font-bold text-amber-600">
          {sprintsCompleted} of {totalSprints}
        </p>
        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${totalSprints > 0 ? (sprintsCompleted / totalSprints) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
