import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { 
  FileText, 
  BarChart3, 
  Compass, 
  Award,
  Clock,
  ChevronRight,
  Lock
} from 'lucide-react';

interface ReportStatus {
  serviceCode: string;
  serviceName: string;
  icon: any;
  status: 'available' | 'coming_soon' | 'not_started';
  reportUrl?: string;
  description: string;
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportStatus[]>([]);

  useEffect(() => {
    if (clientSession?.clientId) {
      loadReportStatuses();
    }
  }, [clientSession?.clientId]);

  const loadReportStatuses = async () => {
    if (!clientSession?.clientId) return;
    
    try {
      const enrolledServices = clientSession.enrolledServices || [];
      const reportStatuses: ReportStatus[] = [];

      // Check Benchmarking
      if (enrolledServices.includes('benchmarking')) {
        const { data: bmEngagement } = await supabase
          .from('bm_engagements')
          .select('id, status, report_shared_with_client')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();

        if (bmEngagement?.report_shared_with_client) {
          reportStatuses.push({
            serviceCode: 'benchmarking',
            serviceName: 'Benchmarking Analysis',
            icon: BarChart3,
            status: 'available',
            reportUrl: '/service/benchmarking/report',
            description: 'Your business performance benchmarked against industry leaders'
          });
        } else if (bmEngagement) {
          reportStatuses.push({
            serviceCode: 'benchmarking',
            serviceName: 'Benchmarking Analysis',
            icon: BarChart3,
            status: 'coming_soon',
            description: 'Your report is being prepared by your advisor'
          });
        } else {
          reportStatuses.push({
            serviceCode: 'benchmarking',
            serviceName: 'Benchmarking Analysis',
            icon: BarChart3,
            status: 'not_started',
            description: 'Complete your assessment to generate your report'
          });
        }
      }

      // Check Discovery
      if (enrolledServices.includes('discovery')) {
        const { data: discovery } = await supabase
          .from('destination_discovery')
          .select('id, completed_at')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();

        const { data: discoveryReport } = await supabase
          .from('ai_generated_reports')
          .select('id, is_shared_with_client')
          .eq('client_id', clientSession.clientId)
          .eq('report_type', 'discovery_analysis')
          .eq('is_shared_with_client', true)
          .maybeSingle();

        if (discoveryReport) {
          reportStatuses.push({
            serviceCode: 'discovery',
            serviceName: 'Discovery Report',
            icon: Compass,
            status: 'available',
            reportUrl: '/discovery/report',
            description: 'Your personalized business discovery analysis'
          });
        } else if (discovery?.completed_at) {
          reportStatuses.push({
            serviceCode: 'discovery',
            serviceName: 'Discovery Report',
            icon: Compass,
            status: 'coming_soon',
            description: 'Your discovery report is being prepared'
          });
        } else {
          reportStatuses.push({
            serviceCode: 'discovery',
            serviceName: 'Discovery Report',
            icon: Compass,
            status: 'not_started',
            description: 'Complete your discovery assessment to unlock your report'
          });
        }
      }

      // Check Hidden Value Audit (part of benchmarking flow)
      if (enrolledServices.includes('hidden_value_audit') && !enrolledServices.includes('benchmarking')) {
        // HVA as standalone - rare, usually part of benchmarking
        reportStatuses.push({
          serviceCode: 'hidden_value_audit',
          serviceName: 'Hidden Value Audit',
          icon: Award,
          status: 'not_started',
          description: 'Discover hidden value in your business'
        });
      }

      setReports(reportStatuses);
    } catch (error) {
      console.error('Error loading report statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ReportStatus['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            <FileText className="w-3.5 h-3.5" />
            Ready to View
          </span>
        );
      case 'coming_soon':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Coming Soon
          </span>
        );
      case 'not_started':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <Lock className="w-3.5 h-3.5" />
            Not Started
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Layout title="Your Reports" subtitle="Access your shared reports and analyses">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Reports" subtitle="Access your shared reports and analyses">
      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No Reports Yet</h2>
            <p className="text-slate-600">
              Complete your assessments and your advisor will share reports with you here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.serviceCode}
                  className={`bg-white rounded-xl border p-6 transition-all ${
                    report.status === 'available' 
                      ? 'border-emerald-200 hover:shadow-md cursor-pointer' 
                      : 'border-slate-200'
                  }`}
                  onClick={() => report.status === 'available' && report.reportUrl && navigate(report.reportUrl)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        report.status === 'available' 
                          ? 'bg-emerald-100' 
                          : report.status === 'coming_soon'
                          ? 'bg-amber-100'
                          : 'bg-slate-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          report.status === 'available' 
                            ? 'text-emerald-600' 
                            : report.status === 'coming_soon'
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.serviceName}</h3>
                        <p className="text-sm text-slate-600 mt-1">{report.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(report.status)}
                      {report.status === 'available' && (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info section */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="font-medium text-slate-900 mb-2">About Your Reports</h3>
          <p className="text-sm text-slate-600">
            Reports are generated after you complete your assessments. Your advisor will review 
            and share them with you when ready. Check back here regularly to see new reports.
          </p>
        </div>
      </div>
    </Layout>
  );
}
