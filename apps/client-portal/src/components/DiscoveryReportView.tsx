// ============================================================================
// DISCOVERY REPORT VIEW - CLIENT PORTAL
// ============================================================================
// Beautiful client-facing view of their Discovery Report narrative
// Shows personalized insights and service recommendations
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Loader2,
  Target,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Briefcase,
  Award,
  Quote,
  ChevronRight,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Calendar
} from 'lucide-react';

interface DiscoveryReportViewProps {
  clientId: string;
}

const SERVICE_ICONS: Record<string, any> = {
  '365_method': Target,
  'management_accounts': BarChart3,
  'systems_audit': Settings,
  'automation': Settings,
  'fractional_cfo': TrendingUp,
  'fractional_coo': Users,
  'combined_advisory': Briefcase,
  'business_advisory': Award,
  'benchmarking': BarChart3,
};

const SERVICE_COLORS: Record<string, string> = {
  '365_method': 'indigo',
  'management_accounts': 'emerald',
  'systems_audit': 'amber',
  'automation': 'orange',
  'fractional_cfo': 'blue',
  'fractional_coo': 'cyan',
  'combined_advisory': 'purple',
  'business_advisory': 'rose',
  'benchmarking': 'teal',
};

export function DiscoveryReportView({ clientId }: DiscoveryReportViewProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      fetchReport();
    }
  }, [clientId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Fetch engagement
      const { data: engagementData, error: engError } = await supabase
        .from('discovery_engagements')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'published')
        .maybeSingle();

      if (engError) throw engError;
      
      if (!engagementData) {
        setError('Your report is being prepared and will be available soon.');
        setLoading(false);
        return;
      }

      setEngagement(engagementData);

      // Fetch report
      const { data: reportData, error: reportError } = await supabase
        .from('discovery_reports')
        .select('*')
        .eq('engagement_id', engagementData.id)
        .eq('status', 'published')
        .maybeSingle();

      if (reportError) throw reportError;
      
      setReport(reportData);
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-16">
        <Sparkles className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Your Discovery Report
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          {error || 'Your personalized report is being prepared. You\'ll be notified when it\'s ready.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium text-indigo-200">Your Discovery Report</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {report.headline}
        </h1>
        {engagement?.published_at && (
          <p className="text-indigo-200 text-sm">
            Prepared {new Date(engagement.published_at).toLocaleDateString('en-GB', { 
              day: 'numeric', month: 'long', year: 'numeric' 
            })}
          </p>
        )}
      </div>

      {/* Executive Summary */}
      {report.executive_summary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <div className="whitespace-pre-wrap">{report.executive_summary}</div>
          </div>
        </div>
      )}

      {/* What We Heard */}
      {report.what_we_heard && (
        <div className="bg-indigo-50 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Quote className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-indigo-900">What We Heard</h2>
          </div>
          <div className="prose max-w-none text-indigo-800">
            <div className="whitespace-pre-wrap">{report.what_we_heard}</div>
          </div>
        </div>
      )}

      {/* Vision & Reality */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {report.vision_narrative && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Your Vision
            </h3>
            <div className="text-gray-700 whitespace-pre-wrap">
              {report.vision_narrative}
            </div>
          </div>
        )}
        
        {report.reality_check_narrative && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              The Reality
            </h3>
            <div className="text-gray-700 whitespace-pre-wrap">
              {report.reality_check_narrative}
            </div>
          </div>
        )}
      </div>

      {/* What It Means */}
      {report.what_it_means && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What This Means</h2>
          <div className="text-gray-700 whitespace-pre-wrap">
            {report.what_it_means}
          </div>
        </div>
      )}

      {/* Service Recommendations */}
      {report.service_narratives?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            Our Recommendations
          </h2>
          
          <div className="space-y-6">
            {report.service_narratives.map((service: any, index: number) => {
              const Icon = SERVICE_ICONS[service.serviceCode] || Target;
              const color = SERVICE_COLORS[service.serviceCode] || 'gray';
              
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Service Header */}
                  <div className={`bg-${color}-50 px-6 py-4 border-b border-${color}-100`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${color}-100 rounded-lg`}>
                        <Icon className={`h-5 w-5 text-${color}-600`} />
                      </div>
                      <h3 className={`text-lg font-semibold text-${color}-900`}>
                        {service.serviceName}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Why This Matters */}
                    {service.whyThisMatters && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Why This Matters For You
                        </h4>
                        <p className="text-gray-700">{service.whyThisMatters}</p>
                      </div>
                    )}
                    
                    {/* What We Do */}
                    {service.whatWeDo && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          What We'll Do Together
                        </h4>
                        <p className="text-gray-700">{service.whatWeDo}</p>
                      </div>
                    )}
                    
                    {/* Expected Outcome */}
                    {service.expectedOutcome && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          What Changes
                        </h4>
                        <p className="text-gray-700">{service.expectedOutcome}</p>
                      </div>
                    )}
                    
                    {/* Quote Tie-In */}
                    {service.quoteTieIn && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
                        <p className="text-gray-600 italic">"{service.quoteTieIn}"</p>
                        <p className="text-sm text-gray-500 mt-1">— Something you told us</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* The Transformation */}
      {report.what_changes && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-emerald-900">The Transformation</h2>
          </div>
          <div className="text-emerald-800 whitespace-pre-wrap">
            {report.what_changes}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {report.next_steps && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-indigo-600" />
            Next Steps
          </h2>
          <div className="text-gray-700 whitespace-pre-wrap">
            {report.next_steps}
          </div>
        </div>
      )}

      {/* Conversation Starters */}
      {report.conversation_starters?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Questions To Explore Together
          </h2>
          <ul className="space-y-3">
            {report.conversation_starters.map((question: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to Take the Next Step?</h2>
        <p className="text-indigo-100 mb-6">
          Let's discuss how we can help you achieve your vision.
        </p>
        <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors inline-flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule a Conversation
        </button>
      </div>
    </div>
  );
}

export default DiscoveryReportView;

