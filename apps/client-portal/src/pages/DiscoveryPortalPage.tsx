// ============================================================================
// DISCOVERY PORTAL - Simple, Clean Client Experience
// ============================================================================
// Single-purpose page: Complete your discovery assessment
// No complex navigation - just the task at hand
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Compass, ChevronRight, LogOut, CheckCircle, 
  Clock, Building2, Loader2, Target, TrendingUp,
  Settings, LineChart, Users, Briefcase, ArrowRight,
  Sparkles, FileText
} from 'lucide-react';

interface AssignedService {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
}

// Service line icons mapping
const SERVICE_ICONS: Record<string, any> = {
  '365_method': Target,
  'fractional_cfo': TrendingUp,
  'systems_audit': Settings,
  'management_accounts': LineChart,
  'combined_advisory': Users,
  'fractional_coo': Briefcase,
  'default': Target
};

export default function DiscoveryPortalPage() {
  const { user, clientSession, signOut } = useAuth();
  const navigate = useNavigate();
  const [discoveryStatus, setDiscoveryStatus] = useState<'pending' | 'in_progress' | 'complete'>('pending');
  const [assignedServices, setAssignedServices] = useState<AssignedService[]>([]);
  const [hasReport, setHasReport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientSession?.clientId) {
      checkDiscoveryStatus();
      fetchAssignedServices();
      checkForReport();
    } else {
      setLoading(false);
    }
  }, [clientSession?.clientId]);

  const checkDiscoveryStatus = async () => {
    try {
      // Check program status directly from practice_members (more reliable)
      const { data: memberData } = await supabase
        .from('practice_members')
        .select('program_status')
        .eq('id', clientSession?.clientId)
        .single();

      if (memberData?.program_status === 'discovery_complete' || memberData?.program_status === 'enrolled') {
        setDiscoveryStatus('complete');
      } else if (memberData?.program_status === 'discovery' || memberData?.program_status === 'discovery_in_progress') {
        setDiscoveryStatus('pending');
      }
    } catch (err) {
      // Handle silently
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedServices = async () => {
    try {
      const { data } = await supabase
        .from('client_service_lines')
        .select(`
          id,
          status,
          service_line:service_lines(code, name, short_description)
        `)
        .eq('client_id', clientSession?.clientId)
        .neq('status', 'cancelled');

      if (data) {
        const services = data
          .filter((d: any) => d.service_line && d.service_line.code !== 'discovery')
          .map((d: any) => ({
            id: d.id,
            code: d.service_line.code,
            name: d.service_line.name,
            description: d.service_line.short_description,
            status: d.status
          }));
        setAssignedServices(services);
      }
    } catch (err) {
      // Handle silently
    }
  };

  const checkForReport = async () => {
    try {
      const { data, error } = await supabase
        .from('client_reports')
        .select('id')
        .eq('client_id', clientSession?.clientId)
        .eq('report_type', 'discovery_analysis')
        .eq('is_shared_with_client', true)
        .limit(1)
        .single();

      if (data && !error) {
        setHasReport(true);
      }
    } catch (err) {
      // No report available yet
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleStartDiscovery = () => {
    navigate('/discovery');
  };

  const handleViewReport = () => {
    navigate('/discovery/report');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // Get first name for greeting
  const firstName = clientSession?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* RPGCC Branded Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* RPGCC Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">RPGCC</span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{clientSession?.name}</p>
              <p className="text-xs text-slate-300">{clientSession?.company || user?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {firstName}! 👋
          </h1>
          <p className="text-gray-600">
            {discoveryStatus === 'complete' 
              ? "Here's your personalized overview and next steps."
              : "Let's discover what makes your business unique and where we can help."}
          </p>
        </div>

        {/* Client Info Card */}
        {clientSession?.company && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{clientSession.company}</p>
              <p className="text-sm text-gray-500">Your business</p>
            </div>
          </div>
        )}

        {/* Report Available Card - Show prominently when report is ready */}
        {hasReport && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Your Discovery Insights Are Ready</h2>
                <p className="text-blue-100 mb-4">
                  We've analyzed your responses and prepared personalized recommendations for your business.
                </p>
                <button
                  onClick={handleViewReport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  View Your Personalized Report
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discovery Assessment Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold">Destination Discovery</h2>
            </div>
            <p className="text-blue-100 text-sm">
              A guided assessment to help us understand your business goals, challenges, and opportunities.
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {discoveryStatus === 'complete' ? (
              // Completed State
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Discovery Complete!
                </h3>
                <p className="text-gray-600 mb-4">
                  Thank you for completing your discovery assessment. 
                  {hasReport 
                    ? " Your personalized insights are ready to view above."
                    : assignedServices.length > 0 
                      ? " Here are the services you've been enrolled in:"
                      : " Your advisor will be in touch shortly to discuss your results."}
                </p>
                {!hasReport && assignedServices.length === 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                    <Clock className="w-4 h-4" />
                    Awaiting advisor review
                  </div>
                )}
              </div>
            ) : (
              // Not Started / In Progress State
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estimated time</p>
                    <p className="font-medium text-gray-900">10-15 minutes</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {discoveryStatus === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                        <Clock className="w-3 h-3" />
                        In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        <Compass className="w-3 h-3" />
                        Ready to Start
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Tell us about your business and what you do</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Share your goals and where you want to be</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Identify challenges and opportunities</span>
                  </div>
                </div>

                <button
                  onClick={handleStartDiscovery}
                  className="w-full py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  {discoveryStatus === 'in_progress' ? 'Continue Assessment' : 'Start Assessment'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Assigned Services Section */}
        {assignedServices.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Services</h2>
            <div className="space-y-4">
              {assignedServices.map((service) => {
                const Icon = SERVICE_ICONS[service.code] || SERVICE_ICONS.default;
                const statusColors = {
                  'pending_onboarding': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Onboarding' },
                  'active': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active' },
                  'in_progress': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'In Progress' }
                };
                const statusStyle = statusColors[service.status as keyof typeof statusColors] || statusColors.pending_onboarding;

                return (
                  <div 
                    key={service.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-50 rounded-xl">
                        <Icon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {statusStyle.label}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                        
                        {service.status === 'pending_onboarding' && (
                          <p className="text-amber-600 text-sm">
                            Your advisor will reach out to begin onboarding soon.
                          </p>
                        )}
                        
                        {service.status === 'active' && (
                          <button className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            View Details
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm">
            If you have any questions about the discovery process, contact us at{' '}
            <a href="mailto:hello@rpgcc.co.uk" className="text-blue-600 hover:text-blue-700 font-medium">
              hello@rpgcc.co.uk
            </a>
          </p>
        </div>
      </main>

      {/* RPGCC Footer */}
      <footer className="mt-auto bg-slate-800 border-t border-slate-700 py-6 text-center text-slate-300 text-xs">
        <p>RP Griffiths Chartered Certified Accountants</p>
        <p className="mt-1 text-slate-400">London Chartered Accountants and Auditors</p>
      </footer>
    </div>
  );
}
