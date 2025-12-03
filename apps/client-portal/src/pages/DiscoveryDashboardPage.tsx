// ============================================================================
// DISCOVERY DASHBOARD - Simple Service Box Layout
// ============================================================================
// Clean dashboard showing only enrolled service lines
// For discovery clients: just shows Discovery assessment box
// ============================================================================

import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Compass, CheckCircle, Clock, ArrowRight, 
  FileText, Target, Award, ChevronRight 
} from 'lucide-react';

interface ServiceLine {
  id: string;
  code: string;
  name: string;
  short_description: string;
  icon: string;
  status: string;
  progress?: number;
}

const SERVICE_ICONS: Record<string, any> = {
  'discovery': Compass,
  '365_alignment': Target,
  'management_accounts': FileText,
  'hidden_value_audit': Award,
};

export default function DiscoveryDashboardPage() {
  const { clientSession } = useAuth();
  const [services, setServices] = useState<ServiceLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientSession?.clientId) {
      loadServices();
    }
  }, [clientSession?.clientId]);

  const loadServices = async () => {
    try {
      // Get client's enrolled service lines
      const { data, error } = await supabase
        .from('client_service_lines')
        .select(`
          id,
          status,
          service_line:service_lines(
            id,
            code,
            name,
            short_description,
            icon
          )
        `)
        .eq('client_id', clientSession?.clientId);

      if (error) throw error;

      const serviceLines: ServiceLine[] = (data || []).map((csl: any) => ({
        id: csl.service_line.id,
        code: csl.service_line.code,
        name: csl.service_line.name,
        short_description: csl.service_line.short_description,
        icon: csl.service_line.icon,
        status: csl.status,
      }));

      setServices(serviceLines);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const getServiceLink = (code: string) => {
    if (code === 'discovery') return '/discovery';
    if (code === '365_alignment') return '/assessments';
    return `/service/${code}/assessment`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_discovery':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
            <Clock className="w-3 h-3" />
            Start Assessment
          </span>
        );
      case 'discovery_complete':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
            <CheckCircle className="w-3 h-3" />
            Complete
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <ArrowRight className="w-3 h-3" />
            Active
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title={`Welcome, ${clientSession?.name?.split(' ')[0] || 'there'}!`}
      subtitle="Your advisory services dashboard"
    >
      <div className="space-y-6">
        {/* If no services yet, show welcome message */}
        {services.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to Your Client Portal
            </h2>
            <p className="text-gray-600">
              Your advisor will be in touch shortly to get you started.
            </p>
          </div>
        )}

        {/* Service Line Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => {
            const Icon = SERVICE_ICONS[service.code] || FileText;
            
            return (
              <Link
                key={service.id}
                to={getServiceLink(service.code)}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  {getStatusBadge(service.status)}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {service.short_description || 'Get started with this service'}
                </p>
                
                <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                  {service.status === 'pending_discovery' ? 'Start Now' : 'View Details'}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Support Section */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm">
            If you have any questions, contact your advisor or email us at{' '}
            <a href="mailto:hello@rpgcc.co.uk" className="text-blue-600 hover:text-blue-700 font-medium">
              hello@rpgcc.co.uk
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}

