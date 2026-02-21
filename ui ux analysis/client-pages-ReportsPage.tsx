import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Compass,
  BarChart3,
  Target,
  TrendingUp,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { PageSkeleton, EmptyState, StatusBadge } from '@/components/ui';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  link: string;
  status: 'available' | 'in_progress' | 'not_available';
  statusLabel: string;
  date?: string;
  color: string;
}

export default function ReportsPage() {
  const { clientSession } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientSession?.clientId) return;
    const clientId = clientSession.clientId;

    (async () => {
      try {
        // Only include reports that have been explicitly shared with the client
        const [
          discoveryReportSharedRes,
          bmEngagementRes,
          saRes,
          maSharedRes,
        ] = await Promise.all([
          supabase
            .from('discovery_reports')
            .select('id, updated_at')
            .eq('client_id', clientId)
            .eq('is_shared_with_client', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from('bm_engagements')
            .select('id, report_shared_with_client, updated_at')
            .eq('client_id', clientId)
            .maybeSingle(),

          supabase
            .from('sa_engagements')
            .select('id, status, updated_at, is_shared_with_client')
            .eq('client_id', clientId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from('ma_assessment_reports')
            .select('id, updated_at')
            .eq('client_id', clientId)
            .eq('shared_with_client', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        // Fallback: legacy client_reports for discovery if no discovery_reports row
        let discoveryShared = !!discoveryReportSharedRes.data;
        let discoveryDate = discoveryReportSharedRes.data?.updated_at;
        if (!discoveryShared) {
          const { data: legacyDiscovery } = await supabase
            .from('client_reports')
            .select('id, created_at')
            .eq('client_id', clientId)
            .eq('report_type', 'discovery_analysis')
            .eq('is_shared_with_client', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          discoveryShared = !!legacyDiscovery;
          discoveryDate = legacyDiscovery?.created_at;
        }

        const items: ReportItem[] = [];

        if (discoveryShared) {
          items.push({
            id: 'discovery',
            title: 'Discovery Report',
            description: 'Your personalised service recommendations and business analysis',
            icon: Compass,
            link: '/discovery/report',
            status: 'available',
            statusLabel: 'View Report',
            date: discoveryDate,
            color: 'purple',
          });
        }

        if (bmEngagementRes.data?.report_shared_with_client) {
          const { data: bmReport } = await supabase
            .from('bm_reports')
            .select('id, status, updated_at')
            .eq('engagement_id', bmEngagementRes.data.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (bmReport) {
            items.push({
              id: 'benchmarking',
              title: 'Benchmarking Report',
              description: 'Industry comparison, percentile rankings, and growth opportunities',
              icon: BarChart3,
              link: '/service/benchmarking/report',
              status: 'available',
              statusLabel: bmReport.status === 'delivered' ? 'Delivered' : 'View Report',
              date: bmReport.updated_at,
              color: 'blue',
            });
          }
        }

        const saReportShared = !!(saRes.data as { is_shared_with_client?: boolean })?.is_shared_with_client;
        if (saReportShared && saRes.data) {
          items.push({
            id: 'systems_audit',
            title: 'Systems Audit Report',
            description: 'System inventory, integration analysis, and process deep-dives',
            icon: Briefcase,
            link: '/service/systems_audit/report',
            status: 'available',
            statusLabel: 'View Report',
            date: saRes.data.updated_at,
            color: 'teal',
          });
        }

        if (maSharedRes.data) {
          items.push({
            id: 'management_accounts',
            title: 'Management Accounts Report',
            description: 'Your financial insight and analysis',
            icon: TrendingUp,
            link: '/service/management_accounts/report',
            status: 'available',
            statusLabel: 'View Report',
            date: maSharedRes.data.updated_at,
            color: 'indigo',
          });
        }

        setReports(items);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientSession?.clientId]);

  const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  };

  return (
    <Layout title="Reports" subtitle="Analysis that has been shared with you">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Reports</h1>
          <p className="text-gray-500 mt-1">
            Only reports and analysis that have been shared with you by your practice appear here.
          </p>
        </div>

        {loading ? (
          <PageSkeleton />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="When your practice shares a report or analysis with you, it will appear here."
            icon={<FileText className="w-8 h-8" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => {
              const Icon = report.icon;
              const colors = colorMap[report.color] || colorMap.indigo;

              return (
                <Link
                  key={report.id}
                  to={report.link}
                  className={`block bg-white rounded-xl border ${colors.border} p-5 hover:shadow-md transition-shadow group`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 ${colors.bg} rounded-lg`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
                          {report.title}
                        </h3>
                        <StatusBadge
                          status={report.status === 'available' ? 'ready' : report.status === 'in_progress' ? 'generating' : 'neutral'}
                          label={report.statusLabel}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{report.description}</p>
                      {report.date && (
                        <span className="text-xs text-gray-400">
                          {new Date(report.date).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 mt-1 flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
