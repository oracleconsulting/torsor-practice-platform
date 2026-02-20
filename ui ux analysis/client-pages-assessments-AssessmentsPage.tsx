// ============================================================================
// ASSESSMENTS — COMPLETED ONLY
// ============================================================================
// Lists only completed assessments across all service lines (and 365 parts).
// Each card links to view that assessment's answers. Not tied to goal alignment.
// ============================================================================

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const SERVICE_LINE_LABELS: Record<string, string> = {
  systems_audit: 'Systems Audit',
  management_accounts: 'Management Accounts',
  benchmarking: 'Benchmarking',
  fractional_executive: 'Fractional Executive',
};

const PART_LABELS: Record<string, string> = {
  part1: 'Part 1: Life Design',
  part2: 'Part 2: Business Deep Dive',
  part3: 'Part 3: Hidden Value Audit',
};

interface CompletedAssessment {
  id: string;
  source: 'service_line' | 'part1' | 'part2' | 'part3' | 'benchmarking';
  title: string;
  completedAt: string;
  viewUrl: string;
}

export default function AssessmentsPage() {
  const { clientSession } = useAuth();
  const [assessments, setAssessments] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }
    const clientId = clientSession.clientId;

    (async () => {
      try {
        const [slaRes, part1Res, part2Res, part3Res, bmRes] = await Promise.all([
          supabase
            .from('service_line_assessments')
            .select('service_line_code, completed_at')
            .eq('client_id', clientId)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false }),

          supabase
            .from('client_assessments')
            .select('id, completed_at')
            .eq('client_id', clientId)
            .eq('assessment_type', 'part1')
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from('client_assessments')
            .select('id, completed_at')
            .eq('client_id', clientId)
            .eq('assessment_type', 'part2')
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from('client_assessments')
            .select('id, completed_at')
            .eq('client_id', clientId)
            .eq('assessment_type', 'part3')
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from('bm_engagements')
            .select('id, assessment_completed_at')
            .eq('client_id', clientId)
            .not('assessment_completed_at', 'is', null)
            .order('assessment_completed_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const list: CompletedAssessment[] = [];

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

        if (part1Res.data?.completed_at) {
          list.push({
            id: 'part1',
            source: 'part1',
            title: PART_LABELS.part1,
            completedAt: part1Res.data.completed_at,
            viewUrl: '/assessment/part1?mode=review',
          });
        }
        if (part2Res.data?.completed_at) {
          list.push({
            id: 'part2',
            source: 'part2',
            title: PART_LABELS.part2,
            completedAt: part2Res.data.completed_at,
            viewUrl: '/assessment/part2?mode=review',
          });
        }
        if (part3Res.data?.completed_at) {
          list.push({
            id: 'part3',
            source: 'part3',
            title: PART_LABELS.part3,
            completedAt: part3Res.data.completed_at,
            viewUrl: '/assessment/part3?mode=review',
          });
        }
        if (bmRes.data?.assessment_completed_at) {
          list.push({
            id: 'benchmarking',
            source: 'benchmarking',
            title: 'Benchmarking',
            completedAt: bmRes.data.assessment_completed_at,
            viewUrl: '/assessments/view/benchmarking',
          });
        }

        // Sort by completed_at descending
        list.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setAssessments(list);
      } catch (err) {
        console.error('Failed to load completed assessments:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientSession?.clientId]);

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
      subtitle="Completed assessments — view your answers for each service line"
    >
      <div className="space-y-6">
        {assessments.length === 0 ? (
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
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => (
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
                      Completed {new Date(a.completedAt).toLocaleDateString('en-GB', {
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
        )}
      </div>
    </Layout>
  );
}
