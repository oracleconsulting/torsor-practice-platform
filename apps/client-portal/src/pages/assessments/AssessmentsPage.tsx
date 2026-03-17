// ============================================================================
// ASSESSMENTS — Goal Alignment journey + completed assessments from other services
// ============================================================================
// For GA clients: shows Part 1 → Part 2 → optional Part 3, then other completed.
// For non-GA clients: shows completed assessments list only.
// ============================================================================

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Eye, FileText, Lock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SERVICE_LINE_LABELS: Record<string, string> = {
  systems_audit: 'Systems Audit',
  management_accounts: 'Management Accounts',
  benchmarking: 'Benchmarking',
  fractional_executive: 'Fractional Executive',
};

const GA_PART_LABELS: Record<string, string> = {
  part1: 'Part 1: Life Design',
  part2: 'Part 2: Business Deep Dive',
  part3: 'Part 3: Hidden Value Audit',
};

interface OtherCompletedAssessment {
  id: string;
  source: 'service_line' | 'benchmarking';
  title: string;
  completedAt: string;
  viewUrl: string;
}

function GaPartCard({
  part,
  label,
  href,
  locked,
  isComplete,
  completedAt,
}: {
  part: 'part1' | 'part2' | 'part3';
  label: string;
  href: string;
  locked: boolean;
  isComplete: boolean;
  completedAt: string | null;
}) {
  return (
    <Link
      to={href}
      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
        locked
          ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-75'
          : isComplete
            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
            : 'bg-white border-slate-200 hover:bg-slate-50'
      }`}
      onClick={(e) => locked && e.preventDefault()}
      aria-disabled={locked}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            locked ? 'bg-slate-200 text-slate-500' : isComplete ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-600'
          }`}
        >
          {locked ? <Lock className="w-4 h-4" /> : isComplete ? '✓' : part.replace('part', '')}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${locked ? 'text-slate-500' : isComplete ? 'text-emerald-800' : 'text-slate-800'}`}>
            {label}
          </p>
          <p className="text-xs text-slate-500">
            {isComplete
              ? completedAt
                ? `Completed ${new Date(completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : 'Completed'
              : locked
                ? 'Complete Part 1 first'
                : part === 'part1'
                  ? 'Life priorities and design'
                  : part === 'part2'
                    ? 'Business context and goals'
                    : 'Value drivers and risks'}
          </p>
        </div>
      </div>
      {!locked && (
        <span className="text-slate-400 flex-shrink-0">
          <ChevronRight className="w-5 h-5" />
        </span>
      )}
    </Link>
  );
}

export default function AssessmentsPage() {
  const { clientSession } = useAuth();
  const { progress: assessmentProgress, loading: progressLoading } = useAssessmentProgress();
  const [hasGA, setHasGA] = useState(false);
  const [part3Skipped, setPart3Skipped] = useState(true);
  const [partCompletedAt, setPartCompletedAt] = useState<{ part1: string | null; part2: string | null; part3: string | null }>({
    part1: null,
    part2: null,
    part3: null,
  });
  const [otherAssessments, setOtherAssessments] = useState<OtherCompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }
    const clientId = clientSession.clientId;

    (async () => {
      try {
        const [enrollmentsRes, skipRes, bmReportRes, partsRes, slaRes, bmRes] = await Promise.all([
          supabase
            .from('client_service_lines')
            .select('service_line:service_lines(code)')
            .eq('client_id', clientId),
          supabase
            .from('practice_members')
            .select('skip_value_analysis')
            .eq('id', clientId)
            .single(),
          supabase
            .from('bm_reports')
            .select('id')
            .eq('client_id', clientId)
            .not('value_analysis', 'is', null)
            .in('status', ['generated', 'approved', 'published', 'delivered'])
            .limit(1)
            .maybeSingle(),
          supabase
            .from('client_assessments')
            .select('assessment_type, completed_at')
            .eq('client_id', clientId)
            .in('assessment_type', ['part1', 'part2', 'part3'])
            .not('completed_at', 'is', null),
          supabase
            .from('service_line_assessments')
            .select('service_line_code, completed_at')
            .eq('client_id', clientId)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false }),
          supabase
            .from('bm_engagements')
            .select('id, assessment_completed_at')
            .eq('client_id', clientId)
            .not('assessment_completed_at', 'is', null)
            .order('assessment_completed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const enrollments = (enrollmentsRes.data || []) as { service_line?: { code?: string } | { code?: string }[] }[];
        const ga = enrollments.some((e) => {
          const sl = e.service_line;
          const code = Array.isArray(sl) ? sl[0]?.code : sl?.code;
          return code === '365_method' || code === '365_alignment';
        });
        setHasGA(ga);

        const skip = (skipRes.data as { skip_value_analysis?: boolean } | null)?.skip_value_analysis || !!bmReportRes.data;
        setPart3Skipped(skip);

        const parts = (partsRes.data || []) as { assessment_type: string; completed_at: string }[];
        setPartCompletedAt({
          part1: parts.find((p) => p.assessment_type === 'part1')?.completed_at ?? null,
          part2: parts.find((p) => p.assessment_type === 'part2')?.completed_at ?? null,
          part3: parts.find((p) => p.assessment_type === 'part3')?.completed_at ?? null,
        });

        const list: OtherCompletedAssessment[] = [];
        (slaRes.data || []).forEach((row: { service_line_code: string; completed_at: string }) => {
          const label = SERVICE_LINE_LABELS[row.service_line_code] || row.service_line_code.replace(/_/g, ' ');
          list.push({
            id: `sla-${row.service_line_code}`,
            source: 'service_line',
            title: label,
            completedAt: row.completed_at,
            viewUrl: `/assessments/view/${row.service_line_code}`,
          });
        });
        if (bmRes.data?.assessment_completed_at) {
          list.push({
            id: 'benchmarking',
            source: 'benchmarking',
            title: 'Benchmarking',
            completedAt: bmRes.data.assessment_completed_at,
            viewUrl: '/assessments/view/benchmarking',
          });
        }
        list.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setOtherAssessments(list);
      } catch (err) {
        console.error('Failed to load assessments:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientSession?.clientId]);

  const showGAJourney = hasGA && !progressLoading;
  const part1Complete = assessmentProgress?.part1?.status === 'completed';
  const part2Complete = assessmentProgress?.part2?.status === 'completed';
  const part3Complete = assessmentProgress?.part3?.status === 'completed';

  if (loading && !showGAJourney) {
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
      title={hasGA ? 'Goal Alignment Assessments' : 'Your Assessments'}
      subtitle={
        hasGA
          ? 'Complete your assessment to unlock your roadmap and sprints'
          : 'Completed assessments — view your answers for each service line'
      }
    >
      <div className="space-y-8">
        {showGAJourney && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Goal Alignment Programme
            </h2>
            <div className="space-y-2">
              <GaPartCard
                part="part1"
                label={GA_PART_LABELS.part1}
                href="/assessment/part1"
                locked={false}
                isComplete={part1Complete}
                completedAt={partCompletedAt.part1}
              />
              <GaPartCard
                part="part2"
                label={GA_PART_LABELS.part2}
                href="/assessment/part2"
                locked={!part1Complete}
                isComplete={part2Complete}
                completedAt={partCompletedAt.part2}
              />
              {!part3Skipped && (
                <GaPartCard
                  part="part3"
                  label={GA_PART_LABELS.part3}
                  href="/assessment/part3"
                  locked={!part2Complete}
                  isComplete={part3Complete}
                  completedAt={partCompletedAt.part3}
                />
              )}
            </div>
          </section>
        )}

        {!showGAJourney && otherAssessments.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-700 font-medium">No completed assessments yet</h3>
            <p className="text-slate-500 text-sm mt-1">
              Complete an assessment from your dashboard and it will appear here so you can view your answers anytime.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {otherAssessments.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {hasGA ? 'Completed assessments from other services' : 'Completed assessments'}
            </h2>
            <div className="space-y-3">
              {otherAssessments.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{a.title}</h3>
                      <p className="text-sm text-slate-500">
                        Completed{' '}
                        {new Date(a.completedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={a.viewUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium flex-shrink-0"
                  >
                    <Eye className="w-4 h-4" />
                    View answers
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {showGAJourney && otherAssessments.length === 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Completed assessments from other services
            </h2>
            <p className="text-sm text-slate-500">No other completed assessments yet.</p>
          </section>
        )}
      </div>
    </Layout>
  );
}
