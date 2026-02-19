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
        const [discoveryRes, bmEngagementRes, saRes, sprintSummariesRes, valueAnalysisRes] = await Promise.all([
          supabase
            .from('discovery_engagements')
            .select('id, status, updated_at')
            .eq('client_id', clientId)
            .in('status', ['report_generated', 'report_delivered'])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from('bm_engagements')
            .select('id')
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
            .from('roadmap_stages')
            .select('id, sprint_number, status, created_at')
            .eq('client_id', clientId)
            .eq('stage_type', 'sprint_summary')
            .in('status', ['approved', 'published'])
            .order('sprint_number', { ascending: false }),

          supabase
            .from('roadmap_stages')
            .select('id, stage_type, status, created_at')
            .eq('client_id', clientId)
            .eq('stage_type', 'value_analysis')
            .in('status', ['generated', 'approved', 'published'])
            .limit(1)
            .maybeSingle(),
        ]);

        let bmReport: { id: string; status: string; updated_at: string } | null = null;
        if (bmEngagementRes.data?.id) {
          const { data: bmReportRow } = await supabase
            .from('bm_reports')
            .select('id, status, updated_at')
            .eq('engagement_id', bmEngagementRes.data.id)
            .in('status', ['generated', 'approved', 'published', 'delivered'])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          bmReport = bmReportRow;
        }

        const items: ReportItem[] = [];

        if (discoveryRes.data) {
          items.push({
            id: 'discovery',
            title: 'Discovery Report',
            description: 'Your personalised service recommendations and business analysis',
            icon: Compass,
            link: '/discovery/report',
            status: 'available',
            statusLabel: discoveryRes.data.status === 'report_delivered' ? 'Delivered' : 'Generated',
            date: discoveryRes.data.updated_at,
            color: 'purple',
          });
        }

        if (bmReport) {
          items.push({
            id: 'benchmarking',
            title: 'Benchmarking Report',
            description: 'Industry comparison, percentile rankings, and growth opportunities',
            icon: BarChart3,
            link: '/service/benchmarking/report',
            status: 'available',
            statusLabel: bmReport.status === 'delivered' ? 'Delivered' : 'Ready',
            date: bmReport.updated_at,
            color: 'blue',
          });
        }

        if (saRes.data) {
          const saComplete = ['stage_3_complete', 'stage3_complete', 'analysis_complete', 'report_generated', 'completed'].includes(saRes.data.status);
          const saReportShared = !!(saRes.data as { is_shared_with_client?: boolean }).is_shared_with_client;
          if (saComplete) {
            items.push({
              id: 'systems_audit',
              title: 'Systems Audit Report',
              description: 'System inventory, integration analysis, and process deep-dives',
              icon: Briefcase,
              link: saReportShared ? '/service/systems_audit/report' : '/service/systems_audit/process-deep-dives',
              status: 'available',
              statusLabel: saReportShared ? 'View Report' : 'Complete',
              date: saRes.data.updated_at,
              color: 'teal',
            });
          } else {
            items.push({
              id: 'systems_audit',
              title: 'Systems Audit',
              description: 'System inventory, integration analysis, and process deep-dives',
              icon: Briefcase,
              link: '/service/systems_audit/inventory',
              status: 'in_progress',
              statusLabel: 'In Progress',
              date: saRes.data.updated_at,
              color: 'teal',
            });
          }
        }

        if (sprintSummariesRes.data && sprintSummariesRes.data.length > 0) {
          for (const summary of sprintSummariesRes.data) {
            items.push({
              id: `sprint_summary_${summary.sprint_number}`,
              title: `Sprint ${summary.sprint_number ?? 1} Summary`,
              description: 'Achievements, progress, and what shifted during this sprint',
              icon: Target,
              link: '/tasks',
              status: 'available',
              statusLabel: 'Ready',
              date: summary.created_at,
              color: 'emerald',
            });
          }
        }

        if (valueAnalysisRes.data) {
          items.push({
            id: 'value_analysis',
            title: 'Value Analysis',
            description: 'ROI projections and business impact of your transformation programme',
            icon: TrendingUp,
            link: '/roadmap',
            status: 'available',
            statusLabel: 'Available',
            date: valueAnalysisRes.data.created_at,
            color: 'amber',
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
    <Layout title="Reports" subtitle="All your reports and analysis in one place">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Reports</h1>
          <p className="text-gray-500 mt-1">
            All your reports and analysis in one place
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-600 font-medium mb-1">No reports yet</h3>
            <p className="text-gray-400 text-sm">
              Reports will appear here as you complete assessments and sprints
            </p>
          </div>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          report.status === 'available' ? colors.badge :
                          report.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {report.statusLabel}
                        </span>
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
