// ============================================================================
// Life Thread Page — Full-page life alignment view at /life
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeAlignment, type LifePulseEntry, type LifeAlignmentScoreRow } from '@/hooks/useLifeAlignment';
import { Heart, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

const CATEGORY_DISPLAY: Record<string, string> = {
  life_time: 'Time',
  life_relationship: 'Relationships',
  life_health: 'Health',
  life_experience: 'Experiences',
  life_identity: 'Identity',
};

const LIFE_CATEGORIES = ['life_time', 'life_relationship', 'life_health', 'life_experience', 'life_identity'];

function scoreColor(score: number) {
  if (score >= 70) return { text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50' };
  return { text: 'text-rose-600', bg: 'bg-rose-50' };
}

interface LifeCommitment {
  id?: string;
  commitment: string;
  category: string;
  frequency: string;
  source?: string;
}

export default function LifeThreadPage() {
  const { clientSession } = useAuth();
  const clientId = clientSession?.clientId ?? null;
  const [currentSprintNumber, setCurrentSprintNumber] = useState(1);
  const [allScores, setAllScores] = useState<LifeAlignmentScoreRow[]>([]);
  const [lifeCommitments, setLifeCommitments] = useState<LifeCommitment[]>([]);
  const [loadingCommitments, setLoadingCommitments] = useState(true);

  const { scores, currentScore, trend, categoryScores, pulse, loading } = useLifeAlignment(
    currentSprintNumber,
    12
  );

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const { data: sl } = await supabase.from('service_lines').select('id').eq('code', '365_method').maybeSingle();
      if (!sl?.id) return;
      const { data: enrollment } = await supabase
        .from('client_service_lines')
        .select('current_sprint_number')
        .eq('client_id', clientId)
        .eq('service_line_id', sl.id)
        .maybeSingle();
      if (enrollment?.current_sprint_number != null) setCurrentSprintNumber(enrollment.current_sprint_number);
    })();
  }, [clientId]);

  const fetchAllScores = useCallback(async () => {
    if (!clientId) return;
    try {
      const { data } = await supabase
        .from('life_alignment_scores')
        .select('*')
        .eq('client_id', clientId)
        .order('sprint_number', { ascending: true })
        .order('week_number', { ascending: true });
      setAllScores((data as LifeAlignmentScoreRow[]) ?? []);
    } catch {
      setAllScores([]);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAllScores();
  }, [fetchAllScores]);

  useEffect(() => {
    if (!clientId) return;
    setLoadingCommitments(true);
    (async () => {
      try {
        const { data } = await supabase
          .from('roadmap_stages')
          .select('generated_content, approved_content')
          .eq('client_id', clientId)
          .eq('stage_type', 'life_design_profile')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const content = data?.approved_content ?? data?.generated_content ?? null;
        const commitments = (content?.lifeCommitments ?? content?.lifeDesignProfile?.lifeCommitments) ?? [];
        setLifeCommitments(Array.isArray(commitments) ? commitments : []);
      } catch {
        setLifeCommitments([]);
      } finally {
        setLoadingCommitments(false);
      }
    })();
  }, [clientId]);

  const scoreNum = currentScore != null ? Math.round(currentScore) : null;
  const { text: scoreTextClass, bg: scoreBgClass } =
    scoreNum != null ? scoreColor(scoreNum) : { text: 'text-gray-400', bg: 'bg-gray-50' };

  const trendIcon =
    trend === 'up' ? (
      <TrendingUp className="w-6 h-6 text-emerald-600" />
    ) : trend === 'down' ? (
      <TrendingDown className="w-6 h-6 text-rose-600" />
    ) : (
      <Minus className="w-6 h-6 text-gray-500" />
    );

  const chartData = allScores.length > 0 ? allScores : scores;
  const chartPoints = chartData.map((s) => ({ week: s.week_number, sprint: s.sprint_number, score: Number(s.overall_score) }));
  const min = Math.min(...chartPoints.map((p) => p.score), 0);
  const max = Math.max(...chartPoints.map((p) => p.score), 100);
  const range = max - min || 1;
  const chartW = 400;
  const chartH = 160;

  if (!clientId) {
    return (
      <Layout title="Life Thread" subtitle="Life alignment over time">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Life Thread" subtitle="Your life alignment over time">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* 1. Current Score Hero */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Current score
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading…</span>
            </div>
          ) : (
            <>
              <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl ${scoreBgClass}`}>
                {trendIcon}
                <span className={`text-4xl font-bold tabular-nums ${scoreTextClass}`}>
                  {scoreNum != null ? scoreNum : '—'}
                </span>
                <span className="text-sm text-slate-600">vs last week</span>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
                {LIFE_CATEGORIES.map((cat) => {
                  const val = categoryScores[cat] ?? 0;
                  return (
                    <div key={cat} className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-500 truncate">{CATEGORY_DISPLAY[cat]}</p>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-rose-400 rounded-full transition-all"
                          style={{ width: `${Math.min(100, val)}%` }}
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-0.5">{Math.round(val)}%</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* 2. Score Trend Chart (SVG) */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Score trend</h2>
          {chartPoints.length < 2 ? (
            <p className="text-sm text-slate-500">Complete more weekly pulses to see your trend.</p>
          ) : (
            <div className="overflow-x-auto">
              <svg width={chartW} height={chartH} className="min-w-[300px]">
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartPoints
                    .map((p, i) => {
                      const x = (i / (chartPoints.length - 1)) * (chartW - 40) + 20;
                      const y = chartH - 30 - ((p.score - min) / range) * (chartH - 40);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
                {chartPoints.map((p, i) => {
                  const x = (i / (chartPoints.length - 1)) * (chartW - 40) + 20;
                  const y = chartH - 30 - ((p.score - min) / range) * (chartH - 40);
                  return (
                    <circle
                      key={`${p.sprint}-${p.week}`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#f43f5e"
                    />
                  );
                })}
              </svg>
              <p className="text-xs text-slate-500 mt-2">Weeks (0–100 score)</p>
            </div>
          )}
        </section>

        {/* 3. Category Heatmap */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Category by week</h2>
          {scores.length === 0 ? (
            <p className="text-sm text-slate-500">No weekly scores yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-2 text-slate-600 font-medium w-24">Category</th>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <th key={w} className="p-1 text-center text-xs text-slate-500 w-8">
                        W{w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LIFE_CATEGORIES.map((cat) => (
                    <tr key={cat}>
                      <td className="py-1 pr-2 text-slate-700">{CATEGORY_DISPLAY[cat]}</td>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((weekNum) => {
                        const row = scores.find((s) => s.week_number === weekNum);
                        const val = row?.category_scores?.[cat] ?? 0;
                        const intensity = Math.min(1, val / 100);
                        return (
                          <td key={weekNum} className="p-0.5">
                            <div
                              className="h-6 rounded"
                              style={{
                                backgroundColor:
                                  val === 0 ? 'rgb(241 245 249)' : `rgba(244, 63, 94, ${0.2 + intensity * 0.6})`,
                              }}
                              title={`${CATEGORY_DISPLAY[cat]} week ${weekNum}: ${Math.round(val)}%`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 4. Life Commitments Tracker */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Life commitments</h2>
          {loadingCommitments ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading…</span>
            </div>
          ) : lifeCommitments.length === 0 ? (
            <p className="text-sm text-slate-500">No life commitments from your profile yet.</p>
          ) : (
            <ul className="space-y-3">
              {lifeCommitments.map((c, i) => (
                <li
                  key={c.id ?? i}
                  className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-rose-500 mt-0.5">♥</span>
                  <div>
                    <p className="text-slate-900 font-medium">{c.commitment}</p>
                    <p className="text-xs text-slate-500">
                      {CATEGORY_DISPLAY[c.category] ?? c.category} · {c.frequency}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 5. Pulse History */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pulse history</h2>
          {pulse.length === 0 ? (
            <p className="text-sm text-slate-500">No pulse entries this sprint yet.</p>
          ) : (
            <ul className="space-y-3">
              {([...pulse].reverse() as LifePulseEntry[]).map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-2 py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-xs font-medium text-slate-600">Week {entry.week_number}</span>
                  <span className="text-rose-600">
                    {'♥'.repeat(entry.alignment_rating)}{'☆'.repeat(5 - entry.alignment_rating)}
                  </span>
                  {(entry.active_categories ?? []).length > 0 && (
                    <span className="text-xs text-slate-500">
                      {(entry.active_categories ?? []).map((c) => CATEGORY_DISPLAY[c] ?? c).join(', ')}
                    </span>
                  )}
                  {entry.protect_next_week && (
                    <span className="text-xs text-slate-600 italic">&ldquo;{entry.protect_next_week}&rdquo;</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
