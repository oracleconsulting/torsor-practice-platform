// ============================================================================
// LifeAlignmentCard — Compact dashboard card for life alignment score (4A)
// ============================================================================

import { Link } from 'react-router-dom';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LifeAlignmentScoreRow } from '@/hooks/useLifeAlignment';

const LIFE_CATEGORIES = ['life_time', 'life_relationship', 'life_health', 'life_experience', 'life_identity'];
const CATEGORY_LABELS: Record<string, string> = {
  life_time: 'Time',
  life_relationship: 'Relationships',
  life_health: 'Health',
  life_experience: 'Experiences',
  life_identity: 'Identity',
};

export interface LifeAlignmentCardProps {
  scores: LifeAlignmentScoreRow[];
  currentScore: number | null;
  trend: string;
  categoryScores: Record<string, number>;
}

function scoreColor(score: number) {
  if (score >= 70) return { text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50' };
  return { text: 'text-rose-600', bg: 'bg-rose-50' };
}

export function LifeAlignmentCard({
  scores,
  currentScore,
  trend,
  categoryScores,
}: LifeAlignmentCardProps) {
  const scoreNum = currentScore != null ? Math.round(currentScore) : null;
  const { text: scoreTextClass, bg: scoreBgClass } =
    scoreNum != null ? scoreColor(scoreNum) : { text: 'text-gray-400', bg: 'bg-gray-50' };

  const trendIcon =
    trend === 'up' ? (
      <TrendingUp className="w-5 h-5 text-emerald-600" />
    ) : trend === 'down' ? (
      <TrendingDown className="w-5 h-5 text-rose-600" />
    ) : (
      <Minus className="w-5 h-5 text-gray-500" />
    );

  const sparklineScores = scores.slice(-8).map((s) => Number(s.overall_score));
  const hasSparkline = sparklineScores.length >= 2;
  const min = Math.min(...sparklineScores, 0);
  const max = Math.max(...sparklineScores, 100);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = sparklineScores
    .map((v, i) => {
      const x = (i / (sparklineScores.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  const lineColor = scoreNum != null ? (scoreNum >= 70 ? '#059669' : scoreNum >= 40 ? '#d97706' : '#e11d48') : '#9ca3af';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-semibold text-slate-700">Life Alignment</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${scoreBgClass}`}>
          {trendIcon}
          <span className={`text-xl font-bold tabular-nums ${scoreTextClass}`}>
            {scoreNum != null ? scoreNum : '—'}
          </span>
        </div>
      </div>

      {hasSparkline && (
        <div className="mt-3 flex justify-center">
          <svg width={w} height={h} className="overflow-visible">
            <polyline
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      )}

      <div className="flex items-center justify-center gap-1 mt-2" title="Category activity">
        {LIFE_CATEGORIES.map((cat) => {
          const val = categoryScores[cat] ?? 0;
          const active = val > 0;
          return (
            <span
              key={cat}
              className={`w-2 h-2 rounded-full ${active ? 'bg-rose-500' : 'bg-gray-200'}`}
              title={`${CATEGORY_LABELS[cat]}: ${val}%`}
            />
          );
        })}
      </div>

      <Link
        to="/life"
        className="mt-3 block text-center text-sm font-medium text-rose-600 hover:text-rose-700"
      >
        View Life Thread →
      </Link>
    </div>
  );
}
