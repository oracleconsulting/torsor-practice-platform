import { useState, useEffect } from 'react';
import type { Page } from '../../types/navigation';
import { Navigation } from '../../components/Navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Target,
  TrendingUp,
  Briefcase,
  Calendar,
  Filter,
  Search,
  Plus,
  Mail,
  X,
  Send,
  LineChart,
  Settings
} from 'lucide-react';


interface ClientServicesPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

// All 9 Service Lines - BSG Complete Offering
const SERVICE_LINES = [
  // Week 1 Ready
  { 
    id: '365_method', 
    code: '365_method',
    name: '365 Alignment Programme',
    description: 'Life-first business transformation with 5-year vision, 6-month shift, and 12-week sprints',
    icon: Target,
    color: 'indigo',
    monthlyRevenue: 5000,
    status: 'ready'
  },
  { 
    id: 'fractional_cfo', 
    code: 'fractional_cfo',
    name: 'Fractional CFO Services',
    description: 'Strategic financial leadership without the full-time cost',
    icon: TrendingUp,
    color: 'blue',
    monthlyRevenue: 6000,
    status: 'ready'
  },
  { 
    id: 'systems_audit', 
    code: 'systems_audit',
    name: 'Systems Audit',
    description: 'Identify and fix operational bottlenecks, integrate systems, eliminate manual workarounds',
    icon: Settings,
    color: 'amber',
    monthlyRevenue: 3000,
    status: 'ready'
  },
  { 
    id: 'management_accounts', 
    code: 'management_accounts',
    name: 'Management Accounts',
    description: 'Monthly financial visibility with P&L, Balance Sheet, KPIs and Cash Flow analysis',
    icon: LineChart,
    color: 'emerald',
    monthlyRevenue: 650,
    status: 'ready'
  },
  // Week 2-3 Ready
  { 
    id: 'combined_advisory', 
    code: 'combined_advisory',
    name: 'Combined CFO/COO Advisory',
    description: 'Executive partnership covering both financial and operational strategy',
    icon: Users,
    color: 'purple',
    monthlyRevenue: 10000,
    status: 'ready'
  },
  { 
    id: 'fractional_coo', 
    code: 'fractional_coo',
    name: 'Fractional COO Services',
    description: 'Operational leadership to build systems that run without you',
    icon: Briefcase,
    color: 'cyan',
    monthlyRevenue: 5500,
    status: 'development'
  },
  // Week 2-4 Development
  { 
    id: 'business_advisory', 
    code: 'business_advisory',
    name: 'Business Advisory & Exit Planning',
    description: 'Protect and maximise the value you\'ve built',
    icon: Target,
    color: 'rose',
    monthlyRevenue: 9000,
    status: 'development'
  },
  { 
    id: 'automation', 
    code: 'automation',
    name: 'Automation Services',
    description: 'Eliminate manual work and unlock your team\'s potential',
    icon: Settings,
    color: 'orange',
    monthlyRevenue: 1500,
    status: 'development'
  },
  // Month 2 Development
  { 
    id: 'benchmarking', 
    code: 'benchmarking',
    name: 'Benchmarking Services',
    description: 'Know exactly how you compare to your industry peers',
    icon: LineChart,
    color: 'teal',
    monthlyRevenue: 2000,
    status: 'development'
  }
];

interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service_line: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  lastActivity: string | null;
  hasRoadmap: boolean;
}

export function ClientServicesPage({ currentPage, onNavigate }: ClientServicesPageProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [selectedServiceLine, setSelectedServiceLine] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  
  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    company: '',
    services: [] as string[],
    customMessage: '',
    inviteType: 'discovery' as 'discovery' | 'direct'  // Discovery First or Direct Service
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  // Fetch clients when service line is selected
  useEffect(() => {
    if (selectedServiceLine) {
      fetchClients();
    }
  }, [selectedServiceLine]);

  // Send client invitation
  const handleSendInvite = async () => {
    // For discovery invites, services are optional. For direct invites, at least one is required.
    if (!inviteForm.email || !currentMember?.practice_id) {
      alert('Please enter an email address');
      return;
    }
    
    if (inviteForm.inviteType === 'direct' && inviteForm.services.length === 0) {
      alert('Please select at least one service for direct enrollment');
      return;
    }

    setSendingInvite(true);
    try {
      const response = await supabase.functions.invoke('send-client-invitation', {
        body: {
          email: inviteForm.email,
          name: inviteForm.name,
          company: inviteForm.company,
          practiceId: currentMember.practice_id,
          invitedBy: currentMember.id,
          serviceLineCodes: inviteForm.services,
          customMessage: inviteForm.customMessage,
          includeDiscovery: inviteForm.inviteType === 'discovery'
        }
      });

      if (response.error) throw response.error;

      alert(response.data.message || 'Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', company: '', services: [], customMessage: '', inviteType: 'discovery' });
      
      // Refresh clients list
      if (selectedServiceLine) {
        fetchClients();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const practiceId = currentMember?.practice_id;

      if (!practiceId || !selectedServiceLine) {
        console.log('No practice or service line selected');
        setLoading(false);
        setClients([]);
        return;
      }

      // Get the service line from our constants to find its code
      const serviceLineConfig = SERVICE_LINES.find(sl => sl.id === selectedServiceLine);
      const serviceLineCode = serviceLineConfig?.code || selectedServiceLine;

      console.log('Fetching clients for practice:', practiceId, 'service:', serviceLineCode);

      // First, get the service_line_id from the database
      const { data: serviceLineData } = await supabase
        .from('service_lines')
        .select('id')
        .eq('code', serviceLineCode)
        .single();

      if (!serviceLineData) {
        console.log('Service line not found in database:', serviceLineCode);
        // Fallback: if service_lines table not populated, show 365 clients from practice_members
        if (serviceLineCode === '365_method') {
          const { data: clientsData } = await supabase
            .from('practice_members')
            .select('id, name, email, client_company, program_status, last_portal_login')
            .eq('practice_id', practiceId)
            .eq('member_type', 'client')
            .order('name');

          const clientIds = clientsData?.map(c => c.id) || [];
          const { data: roadmaps } = await supabase
            .from('client_roadmaps')
            .select('client_id')
            .in('client_id', clientIds)
            .eq('is_active', true);

          const { data: assessments } = await supabase
            .from('client_assessments')
            .select('client_id, status')
            .in('client_id', clientIds);

          const enrichedClients: Client[] = (clientsData || []).map(client => {
            const clientAssessments = assessments?.filter(a => a.client_id === client.id) || [];
            const completedCount = clientAssessments.filter(a => a.status === 'completed').length;
            const hasRoadmap = roadmaps?.some(r => r.client_id === client.id) || false;
            return {
              id: client.id,
              name: client.name,
              email: client.email,
              company: client.client_company,
              service_line: serviceLineCode,
              status: client.program_status || 'active',
              progress: completedCount * 33,
              lastActivity: client.last_portal_login,
              hasRoadmap
            };
          });
          setClients(enrichedClients);
        } else {
          setClients([]);
        }
        setLoading(false);
        return;
      }

      // Fetch clients enrolled in this specific service line
      const { data: enrollments, error } = await supabase
        .from('client_service_lines')
        .select(`
          client_id,
          status,
          onboarding_completed_at,
          practice_members!client_service_lines_client_id_fkey (
            id,
            name,
            email,
            client_company,
            program_status,
            last_portal_login
          )
        `)
        .eq('practice_id', practiceId)
        .eq('service_line_id', serviceLineData.id);

      if (error) throw error;

      // Get client IDs for additional queries
      const clientIds = enrollments?.map(e => e.client_id) || [];

      // Fetch assessments and roadmaps
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('client_id, status')
        .in('client_id', clientIds);

      const { data: roadmaps } = await supabase
        .from('client_roadmaps')
        .select('client_id')
        .in('client_id', clientIds)
        .eq('is_active', true);

      // Also fetch service-specific assessments
      const { data: serviceAssessments } = await supabase
        .from('service_line_assessments')
        .select('client_id, completion_percentage, completed_at')
        .in('client_id', clientIds)
        .eq('service_line_code', serviceLineCode);

      // Map to client objects
      const enrichedClients: Client[] = (enrollments || [])
        .filter(e => e.practice_members)
        .map(enrollment => {
          const client = enrollment.practice_members as any;
          const clientAssessments = assessments?.filter(a => a.client_id === client.id) || [];
          const completedCount = clientAssessments.filter(a => a.status === 'completed').length;
          const hasRoadmap = roadmaps?.some(r => r.client_id === client.id) || false;
          const serviceAssessment = serviceAssessments?.find(sa => sa.client_id === client.id);

          // For 365, use standard assessments; for others, use service-specific
          let progress = 0;
          if (serviceLineCode === '365_method') {
            progress = completedCount * 33;
          } else {
            progress = serviceAssessment?.completion_percentage || 0;
          }

          return {
            id: client.id,
            name: client.name,
            email: client.email,
            company: client.client_company,
            service_line: serviceLineCode,
            status: enrollment.status || client.program_status || 'active',
            progress,
            lastActivity: client.last_portal_login,
            hasRoadmap: serviceLineCode === '365_method' ? hasRoadmap : !!enrollment.onboarding_completed_at
          };
        });

      setClients(enrichedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'paused': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Services</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage clients across all service lines
              </p>
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Invite Client
            </button>
          </div>
        </div>
        <Navigation currentPage={currentPage} onNavigate={onNavigate} />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedServiceLine ? (
          // Service Lines Grid
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Select Service Line</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SERVICE_LINES.map((service) => {
                const Icon = service.icon;
                const clientCount = service.id === '365-alignment' ? clients.length : 0;
                
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceLine(service.id)}
                    className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-${service.color}-100 flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 text-${service.color}-600`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">{service.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        {service.id === '365-alignment' ? 'Active clients' : 'Coming soon'}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {service.id === '365-alignment' ? clientCount : '–'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Client List for Selected Service Line
          <div className="space-y-6">
            {/* Back button and header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedServiceLine(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Service Lines
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900">
                {SERVICE_LINES.find(s => s.id === selectedServiceLine)?.name}
              </h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                    <p className="text-sm text-gray-500">Total Clients</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {clients.filter(c => c.hasRoadmap).length}
                    </p>
                    <p className="text-sm text-gray-500">With Roadmap</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {clients.filter(c => !c.hasRoadmap && c.progress > 0).length}
                    </p>
                    <p className="text-sm text-gray-500">In Progress</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {clients.filter(c => c.progress === 0).length}
                    </p>
                    <p className="text-sm text-gray-500">Not Started</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            {/* Client List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                  <p className="text-gray-500 mt-4">Loading clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No clients found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Client</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Progress</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Last Activity</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.email}</p>
                            {client.company && (
                              <p className="text-sm text-gray-400">{client.company}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full transition-all"
                                style={{ width: `${client.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{client.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {client.hasRoadmap ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                Roadmap Active
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
                                {client.status === 'active' ? 'In Progress' : client.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {client.lastActivity 
                              ? new Date(client.lastActivity).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`/clients/${client.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedClient(client.id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                          >
                            View
                            <ChevronRight className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Client Detail Modal - will be expanded */}
        {selectedClient && (
          <ClientDetailModal 
            clientId={selectedClient} 
            onClose={() => setSelectedClient(null)} 
          />
        )}

        {/* Invite Client Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Invite Client</h2>
                  <p className="text-sm text-gray-500">Create their portal account and start their journey</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Invite Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How should they start?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setInviteForm({ ...inviteForm, inviteType: 'discovery' })}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        inviteForm.inviteType === 'discovery'
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          inviteForm.inviteType === 'discovery' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Destination Discovery</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Start with a questionnaire to understand their goals, then recommend services
                          </p>
                        </div>
                      </div>
                      {inviteForm.inviteType === 'discovery' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteForm({ ...inviteForm, inviteType: 'direct' })}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        inviteForm.inviteType === 'direct'
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          inviteForm.inviteType === 'direct' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Send className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Direct Enrollment</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Skip discovery and enroll directly in specific services
                          </p>
                        </div>
                      </div>
                      {inviteForm.inviteType === 'direct' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Client Details */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="client@example.com"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      placeholder="John Smith"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={inviteForm.company}
                    onChange={(e) => setInviteForm({ ...inviteForm, company: e.target.value })}
                    placeholder="Acme Ltd"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Service Lines - Only show for Direct enrollment, or optionally for Discovery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {inviteForm.inviteType === 'discovery' 
                      ? 'Pre-select services (optional - let discovery guide them)'
                      : 'Enroll in Services *'
                    }
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {SERVICE_LINES.filter(s => s.status === 'ready').map((service) => {
                      const Icon = service.icon;
                      const isSelected = inviteForm.services.includes(service.code);
                      return (
                        <label
                          key={service.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInviteForm({ ...inviteForm, services: [...inviteForm.services, service.code] });
                              } else {
                                setInviteForm({ ...inviteForm, services: inviteForm.services.filter(s => s !== service.code) });
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{service.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {inviteForm.inviteType === 'discovery' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Tip: Leave blank to let Discovery recommend the best services based on their goals
                    </p>
                  )}
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (optional)
                  </label>
                  <textarea
                    value={inviteForm.customMessage}
                    onChange={(e) => setInviteForm({ ...inviteForm, customMessage: e.target.value })}
                    placeholder="Looking forward to helping you reach your goals..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Preview what client will see */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">What they will experience:</p>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                      <div className="w-px h-4 bg-slate-300" />
                    </div>
                    <p>Receive email invitation</p>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                      <div className="w-px h-4 bg-slate-300" />
                    </div>
                    <p>Create their portal account (set password)</p>
                  </div>
                  {inviteForm.inviteType === 'discovery' ? (
                    <>
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                          <div className="w-px h-4 bg-slate-300" />
                        </div>
                        <p>Complete Destination Discovery (~15 mins)</p>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">4</div>
                        </div>
                        <p>Receive personalized service recommendations</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                      </div>
                      <p>Start onboarding for {inviteForm.services.length > 0 ? inviteForm.services.length : 'selected'} service(s)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteForm({ email: '', name: '', company: '', services: [], customMessage: '', inviteType: 'discovery' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={sendingInvite || !inviteForm.email || (inviteForm.inviteType === 'direct' && inviteForm.services.length === 0)}
                  className={`inline-flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    inviteForm.inviteType === 'discovery'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {sendingInvite ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {inviteForm.inviteType === 'discovery' ? 'Send Discovery Invite' : 'Send Direct Invite'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Enhanced Client Detail Modal with full functionality
function ClientDetailModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'context' | 'sprint'>('overview');
  
  // Context form state
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContext, setNewContext] = useState({ 
    type: 'note', 
    content: '', 
    priority: 'normal',
    appliesTo: ['sprint'] as string[], // Which roadmap parts this applies to
    files: [] as File[], // Support multiple files
    isShared: false, // Is this a shared document (e.g., joint meeting transcript)?
    dataSourceType: 'general' as 'accounts' | 'transcript' | 'meeting_notes' | 'general'
  });
  const [addingContext, setAddingContext] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number, fileName: string}>({ current: 0, total: 0, fileName: '' });
  const [processingDocuments, setProcessingDocuments] = useState(false);
  
  // Analysis generation state
  const [generatingValueAnalysis, setGeneratingValueAnalysis] = useState(false);
  const [regenerateOptions, setRegenerateOptions] = useState({
    fiveYear: false,
    sixMonth: false,
    sprint: true
  });
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
  
  // Sprint editing state
  const [editingTask, setEditingTask] = useState<{weekNumber: number, taskId: string, original: any} | null>(null);
  const [editedTask, setEditedTask] = useState<{title: string, description: string}>({ title: '', description: '' });
  const [savingTask, setSavingTask] = useState(false);
  
  // Regeneration state
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchClientDetail();
  }, [clientId]);

  const fetchClientDetail = async () => {
    setLoading(true);
    try {
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('*')
        .eq('id', clientId)
        .single();

      const { data: roadmap } = await supabase
        .from('client_roadmaps')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      const { data: context } = await supabase
        .from('client_context')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      setClient({
        ...clientData,
        roadmap,
        context: context || []
      });
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // MULTI-FILE UPLOAD & DOCUMENT PROCESSING
  // ================================================================
  
  interface UploadedDocument {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }

  const handleMultiFileUpload = async (files: File[]): Promise<UploadedDocument[]> => {
    if (!client?.practice_id || files.length === 0) return [];
    
    setUploadingFiles(true);
    const uploadedDocs: UploadedDocument[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length, fileName: file.name });
        
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${client.practice_id}/${clientId}/${timestamp}_${safeFileName}`;
        
        const { error } = await supabase.storage
          .from('client-documents')
          .upload(storagePath, file);
        
        if (error) {
          console.error(`Error uploading ${file.name}:`, error);
          continue;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('client-documents')
          .getPublicUrl(storagePath);
        
        uploadedDocs.push({
          fileName: file.name,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          fileType: file.type || fileExt || 'unknown'
        });
      }
      
      return uploadedDocs;
    } catch (error) {
      console.error('Error in multi-file upload:', error);
      return uploadedDocs;
    } finally {
      setUploadingFiles(false);
      setUploadProgress({ current: 0, total: 0, fileName: '' });
    }
  };

  // Process documents for vectorization
  const processDocumentsForVectorization = async (
    documents: UploadedDocument[], 
    contextId: string
  ): Promise<void> => {
    if (documents.length === 0) return;
    
    setProcessingDocuments(true);
    try {
      // Call Edge Function to process and vectorize documents
      const response = await supabase.functions.invoke('process-documents', {
        body: {
          clientId,
          practiceId: client?.practice_id,
          contextId,
          documents,
          appliesTo: newContext.appliesTo,
          isShared: newContext.isShared,
          dataSourceType: newContext.dataSourceType
        }
      });

      if (response.error) {
        console.error('Document processing error:', response.error);
        // Don't throw - documents are uploaded, just not vectorized yet
      } else {
        console.log('Documents processed:', response.data);
      }
    } catch (error) {
      console.error('Error processing documents:', error);
    } finally {
      setProcessingDocuments(false);
    }
  };

  // ================================================================
  // ADD CONTEXT FUNCTIONALITY (with multi-file support)
  // ================================================================
  const handleAddContext = async () => {
    if ((!newContext.content.trim() && newContext.files.length === 0) || !client?.practice_id) return;
    
    setAddingContext(true);
    try {
      // Get current member's practice_member ID for added_by
      const { data: memberData } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', currentMember?.id)
        .eq('member_type', 'team')
        .single();

      // Upload files if present
      let uploadedDocs: UploadedDocument[] = [];
      if (newContext.files.length > 0) {
        uploadedDocs = await handleMultiFileUpload(newContext.files);
      }

      // Create content summary
      let contentSummary = newContext.content;
      if (uploadedDocs.length > 0) {
        const fileList = uploadedDocs.map(d => `• ${d.fileName} (${(d.fileSize / 1024).toFixed(1)} KB)`).join('\n');
        contentSummary = newContext.content 
          ? `${newContext.content}\n\n📎 Attached files:\n${fileList}`
          : `📎 Uploaded ${uploadedDocs.length} document(s):\n${fileList}`;
      }

      // Insert context record
      const { data: contextRecord, error } = await supabase
        .from('client_context')
        .insert({
          practice_id: client.practice_id,
          client_id: clientId,
          context_type: uploadedDocs.length > 0 ? 'document' : newContext.type,
          content: contentSummary,
          source_file_url: uploadedDocs.length > 0 ? JSON.stringify(uploadedDocs) : null,
          priority_level: newContext.priority,
          applies_to: newContext.appliesTo,
          added_by: memberData?.id,
          processed: false
        })
        .select()
        .single();

      if (error) throw error;

      // Process documents for vectorization (async - don't block UI)
      if (uploadedDocs.length > 0 && contextRecord) {
        processDocumentsForVectorization(uploadedDocs, contextRecord.id);
      }

      // Refresh client data
      await fetchClientDetail();
      setNewContext({ type: 'note', content: '', priority: 'normal', appliesTo: ['sprint'], files: [], isShared: false, dataSourceType: 'general' });
      setShowAddContext(false);
      
      if (uploadedDocs.length > 0) {
        alert(`${uploadedDocs.length} document(s) uploaded successfully! They will be processed and vectorized for roadmap context.`);
      }
    } catch (error) {
      console.error('Error adding context:', error);
      alert('Failed to add context. Please try again.');
    } finally {
      setAddingContext(false);
    }
  };

  // ================================================================
  // GENERATE VALUE ANALYSIS (SEPARATE FROM ROADMAP)
  // ================================================================
  const handleGenerateValueAnalysis = async () => {
    if (!client?.practice_id) return;
    
    setGeneratingValueAnalysis(true);
    try {
      // First, fetch Part 3 responses for this client
      const { data: part3Assessment } = await supabase
        .from('client_assessments')
        .select('responses')
        .eq('client_id', clientId)
        .eq('assessment_type', 'part3')
        .single();
      
      const part3Responses = part3Assessment?.responses || {};
      
      console.log('Generating value analysis with part3 responses:', Object.keys(part3Responses).length, 'fields');
      
      const response = await supabase.functions.invoke('generate-value-analysis', {
        body: {
          action: 'generate-analysis',
          clientId,
          practiceId: client.practice_id,
          part3Responses
        }
      });

      if (response.error) throw response.error;

      await fetchClientDetail();
      alert('Value analysis generated successfully!');
    } catch (error) {
      console.error('Error generating value analysis:', error);
      alert('Failed to generate value analysis. Please try again.');
    } finally {
      setGeneratingValueAnalysis(false);
    }
  };

  // ================================================================
  // SPRINT EDITING FUNCTIONALITY
  // ================================================================
  const handleEditTask = (weekNumber: number, task: any) => {
    setEditingTask({ weekNumber, taskId: task.id, original: task });
    setEditedTask({ title: task.title, description: task.description });
  };

  const handleSaveTask = async () => {
    if (!editingTask || !client?.roadmap) return;
    
    setSavingTask(true);
    try {
      // Get current roadmap data
      const roadmapData = { ...client.roadmap.roadmap_data };
      
      // Find and update the task
      const weekIndex = roadmapData.sprint.weeks.findIndex(
        (w: any) => w.weekNumber === editingTask.weekNumber
      );
      
      if (weekIndex !== -1) {
        const taskIndex = roadmapData.sprint.weeks[weekIndex].tasks.findIndex(
          (t: any) => t.id === editingTask.taskId
        );
        
        if (taskIndex !== -1) {
          // Store original for knowledge logging
          const originalTask = roadmapData.sprint.weeks[weekIndex].tasks[taskIndex];
          
          // Update task
          roadmapData.sprint.weeks[weekIndex].tasks[taskIndex] = {
            ...originalTask,
            title: editedTask.title,
            description: editedTask.description
          };

          // Update roadmap in database
          const { error: updateError } = await supabase
            .from('client_roadmaps')
            .update({ roadmap_data: roadmapData })
            .eq('id', client.roadmap.id);

          if (updateError) throw updateError;

          // Log correction to knowledge base
          try {
            await supabase.from('ai_corrections').insert({
              practice_id: client.practice_id,
              source_type: 'roadmap_task',
              source_id: client.roadmap.id,
              original_output: JSON.stringify({
                title: originalTask.title,
                description: originalTask.description
              }),
              corrected_output: JSON.stringify({
                title: editedTask.title,
                description: editedTask.description
              }),
              correction_reason: `Manual task edit for Week ${editingTask.weekNumber}`,
              correction_type: 'incomplete',
              apply_globally: false
            });
          } catch (kbError) {
            console.log('Knowledge base logging failed (table may not exist):', kbError);
          }

          // Refresh client data
          await fetchClientDetail();
        }
      }

      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setSavingTask(false);
    }
  };

  // ================================================================
  // REGENERATE ROADMAP FUNCTIONALITY (with selective options)
  // ================================================================
  const handleRegenerate = async (sections?: { fiveYear?: boolean, sixMonth?: boolean, sprint?: boolean }) => {
    if (!client?.practice_id) return;
    
    const opts = sections || regenerateOptions;
    const selectedSections = [];
    if (opts.fiveYear) selectedSections.push('5-Year Vision');
    if (opts.sixMonth) selectedSections.push('6-Month Shift');
    if (opts.sprint) selectedSections.push('12-Week Sprint');
    
    if (selectedSections.length === 0) {
      alert('Please select at least one section to regenerate.');
      return;
    }
    
    const unprocessedContext = client.context?.filter((c: any) => !c.processed) || [];
    const contextMsg = unprocessedContext.length > 0 
      ? `\n${unprocessedContext.length} new context item(s) will be incorporated.` 
      : '';
    
    if (!confirm(`Regenerate ${selectedSections.join(', ')}?${contextMsg}`)) return;
    
    setRegenerating(true);
    setShowRegenerateOptions(false);
    try {
      const response = await supabase.functions.invoke('generate-roadmap', {
        body: {
          clientId,
          practiceId: client.practice_id,
          regenerate: true,
          sections: {
            fiveYear: opts.fiveYear,
            sixMonth: opts.sixMonth,
            sprint: opts.sprint
          }
        }
      });

      if (response.error) throw response.error;

      // Refresh client data
      await fetchClientDetail();
      alert(`${selectedSections.join(', ')} regenerated successfully!`);
    } catch (error) {
      console.error('Error regenerating roadmap:', error);
      alert('Failed to regenerate roadmap. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            {loading ? (
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900">{client?.name}</h2>
                <p className="text-sm text-gray-500">{client?.client_company || client?.email}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Value Analysis Button */}
            <button
              onClick={handleGenerateValueAnalysis}
              disabled={generatingValueAnalysis}
              className="inline-flex items-center gap-2 px-3 py-2 border border-purple-300 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:bg-purple-50 disabled:opacity-50 text-sm font-medium"
            >
              {generatingValueAnalysis ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Value Analysis
                </>
              )}
            </button>

            {/* Regenerate Dropdown */}
            {client?.roadmap && (
              <div className="relative">
                <button
                  onClick={() => setShowRegenerateOptions(!showRegenerateOptions)}
                  disabled={regenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 text-sm font-medium"
                >
                  {regenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Regenerate
                      <ChevronRight className={`w-4 h-4 transition-transform ${showRegenerateOptions ? 'rotate-90' : ''}`} />
                    </>
                  )}
                </button>
                
                {showRegenerateOptions && !regenerating && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4">
                    <p className="text-sm font-medium text-gray-900 mb-3">Select sections to regenerate:</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regenerateOptions.fiveYear}
                          onChange={(e) => setRegenerateOptions({ ...regenerateOptions, fiveYear: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">5-Year Vision</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regenerateOptions.sixMonth}
                          onChange={(e) => setRegenerateOptions({ ...regenerateOptions, sixMonth: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">6-Month Shift</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regenerateOptions.sprint}
                          onChange={(e) => setRegenerateOptions({ ...regenerateOptions, sprint: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">12-Week Sprint</span>
                      </label>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => handleRegenerate({ sprint: true })}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Sprint Only
                      </button>
                      <button
                        onClick={() => handleRegenerate()}
                        className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {['overview', 'roadmap', 'context', 'sprint'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'context' && client?.context?.filter((c: any) => !c.processed).length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                  {client.context.filter((c: any) => !c.processed).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {client?.roadmap?.roadmap_data?.fiveYearVision?.northStar && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                      <p className="text-sm opacity-80 mb-2">North Star</p>
                      <p className="text-lg font-medium">
                        {client.roadmap.roadmap_data.fiveYearVision.northStar}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-5">
                      <p className="text-sm text-gray-500">Assessment</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {client?.roadmap ? '✓' : 'Pending'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5">
                      <p className="text-sm text-gray-500">Context Notes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {client?.context?.length || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5">
                      <p className="text-sm text-gray-500">Version</p>
                      <p className="text-2xl font-bold text-gray-900">
                        v{client?.roadmap?.version || 1}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5">
                      <p className="text-sm text-gray-500">Unprocessed</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {client?.context?.filter((c: any) => !c.processed).length || 0}
                      </p>
                    </div>
                  </div>

                  {client?.roadmap?.roadmap_data?.summary && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
                      <p className="text-gray-700">{client.roadmap.roadmap_data.summary.headline}</p>
                      {client.roadmap.roadmap_data.summary.keyInsight && (
                        <p className="text-gray-500 mt-2 text-sm">{client.roadmap.roadmap_data.summary.keyInsight}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ROADMAP TAB */}
              {activeTab === 'roadmap' && (
                <div className="space-y-6">
                  {client?.roadmap ? (
                    <>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                        <h3 className="font-semibold text-indigo-900 mb-3">5-Year Vision</h3>
                        <p className="text-indigo-800 text-lg">
                          {client.roadmap.roadmap_data?.fiveYearVision?.tagline || 'Vision not generated'}
                        </p>
                        {client.roadmap.roadmap_data?.fiveYearVision?.transformationStory?.currentReality && (
                          <div className="mt-4 pt-4 border-t border-indigo-200">
                            <p className="text-sm text-indigo-700">
                              {client.roadmap.roadmap_data.fiveYearVision.transformationStory.currentReality.narrative}
                            </p>
                          </div>
                        )}
                      </div>

                      {client.roadmap.roadmap_data?.sixMonthShift && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                          <h3 className="font-semibold text-amber-900 mb-3">6-Month Shift</h3>
                          <p className="text-amber-800">
                            {client.roadmap.roadmap_data.sixMonthShift.shiftOverview || client.roadmap.roadmap_data.sixMonthShift.overview}
                          </p>
                        </div>
                      )}

                      {client.roadmap.roadmap_data?.sprint?.weeks && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">12-Week Sprint Overview</h3>
                          <div className="grid grid-cols-4 gap-3">
                            {client.roadmap.roadmap_data.sprint.weeks.map((week: any) => (
                              <div key={week.weekNumber} className="border border-gray-200 rounded-lg p-3 text-center">
                                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 inline-flex items-center justify-center font-medium text-sm mb-2">
                                  {week.weekNumber}
                                </span>
                                <p className="text-xs text-gray-600 line-clamp-2">{week.theme}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No roadmap generated yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* CONTEXT TAB - WITH ADD FORM */}
              {activeTab === 'context' && (
                <div className="space-y-6">
                  {/* Add Context Section */}
                  {!showAddContext ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">
                          Add meeting notes, emails, or priorities to inform the next sprint regeneration
                        </p>
                        {client?.context?.filter((c: any) => !c.processed).length > 0 && (
                          <p className="text-sm text-purple-600 mt-1">
                            {client.context.filter((c: any) => !c.processed).length} item(s) will be incorporated on next regeneration
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => setShowAddContext(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Context
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">Add New Context</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={newContext.type}
                              onChange={(e) => setNewContext({ ...newContext, type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="note">Note</option>
                              <option value="transcript">Call Transcript</option>
                              <option value="email">Email Thread</option>
                              <option value="priority">Priority / Action Item</option>
                              <option value="document">Document Upload</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                              value={newContext.priority}
                              onChange={(e) => setNewContext({ ...newContext, priority: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                        </div>

                        {/* Applies To - Which roadmap sections should consider this */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Consider for:</label>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { id: 'fiveYear', label: '5-Year Vision' },
                              { id: 'sixMonth', label: '6-Month Shift' },
                              { id: 'sprint', label: '12-Week Sprint' },
                              { id: 'valueAnalysis', label: 'Value Analysis' }
                            ].map(({ id, label }) => (
                              <label key={id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newContext.appliesTo.includes(id)}
                                  onChange={(e) => {
                                    const updated = e.target.checked
                                      ? [...newContext.appliesTo, id]
                                      : newContext.appliesTo.filter(a => a !== id);
                                    setNewContext({ ...newContext, appliesTo: updated });
                                  }}
                                  className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{label}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Select which roadmap sections should incorporate this context</p>
                        </div>

                        {/* Document Type & Shared Options */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                            <select
                              value={newContext.dataSourceType}
                              onChange={(e) => setNewContext({ ...newContext, dataSourceType: e.target.value as any })}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="general">General Notes</option>
                              <option value="accounts">Official Accounts (£ figures)</option>
                              <option value="transcript">Meeting Transcript</option>
                              <option value="meeting_notes">Meeting Notes</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Accounts data takes priority for financial figures
                            </p>
                          </div>
                          
                          <div>
                            <label className="flex items-center gap-2 cursor-pointer mt-6">
                              <input
                                type="checkbox"
                                checked={newContext.isShared}
                                onChange={(e) => setNewContext({ ...newContext, isShared: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded"
                              />
                              <span className="text-sm text-gray-700">Shared Document</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-6">
                              For joint meetings - extracts relevant info per client
                            </p>
                          </div>
                        </div>

                        {/* Multi-File Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Documents (optional - multiple files supported)
                          </label>
                          <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('multi-file-input')?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50'); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');
                              const droppedFiles = Array.from(e.dataTransfer.files);
                              setNewContext({ ...newContext, files: [...newContext.files, ...droppedFiles], type: 'document' });
                            }}
                          >
                            <input
                              id="multi-file-input"
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.md"
                              onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files || []);
                                if (selectedFiles.length > 0) {
                                  setNewContext({ ...newContext, files: [...newContext.files, ...selectedFiles], type: 'document' });
                                }
                                e.target.value = ''; // Reset input to allow re-selecting same files
                              }}
                              className="hidden"
                            />
                            <div className="text-gray-500">
                              <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm font-medium">Drop files here or click to browse</p>
                              <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint, Text files</p>
                            </div>
                          </div>
                          
                          {/* File list */}
                          {newContext.files.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-700">{newContext.files.length} file(s) selected</p>
                                <button
                                  onClick={() => setNewContext({ ...newContext, files: [] })}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Remove all
                                </button>
                              </div>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {newContext.files.map((file, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs font-medium">
                                        {file.name.split('.').pop()?.toUpperCase().substring(0, 3)}
                                      </span>
                                      <span className="truncate text-gray-700">{file.name}</span>
                                      <span className="flex-shrink-0 text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                    </div>
                                    <button
                                      onClick={() => setNewContext({ 
                                        ...newContext, 
                                        files: newContext.files.filter((_, i) => i !== idx) 
                                      })}
                                      className="text-red-500 hover:text-red-700 ml-2"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-indigo-600">
                                📊 Files will be vectorized and used to enrich roadmap context
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Text Content */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {newContext.files.length > 0 ? 'Additional Notes (optional)' : 'Content'}
                          </label>
                          <textarea
                            value={newContext.content}
                            onChange={(e) => setNewContext({ ...newContext, content: e.target.value })}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder={newContext.files.length > 0
                              ? "Add any additional context about these documents..." 
                              : "Paste meeting transcript, email content, or notes here..."
                            }
                          />
                        </div>

                        {/* Upload progress */}
                        {uploadingFiles && (
                          <div className="bg-indigo-50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-indigo-900">
                                  Uploading {uploadProgress.current} of {uploadProgress.total}...
                                </p>
                                <p className="text-xs text-indigo-700">{uploadProgress.fileName}</p>
                              </div>
                            </div>
                            <div className="mt-2 h-2 bg-indigo-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 transition-all"
                                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Processing indicator */}
                        {processingDocuments && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                              <div>
                                <p className="text-sm font-medium text-purple-900">Processing documents...</p>
                                <p className="text-xs text-purple-700">Extracting text and creating embeddings</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => {
                              setShowAddContext(false);
                              setNewContext({ type: 'note', content: '', priority: 'normal', appliesTo: ['sprint'], files: [], isShared: false, dataSourceType: 'general' });
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddContext}
                            disabled={addingContext || uploadingFiles || (!newContext.content.trim() && newContext.files.length === 0)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                          >
                            {(addingContext || uploadingFiles) && (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            {uploadingFiles ? 'Uploading...' : newContext.files.length > 0 ? `Upload ${newContext.files.length} File(s)` : 'Save Context'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Context List */}
                  {client?.context?.length > 0 ? (
                    <div className="space-y-3">
                      {client.context.map((ctx: any) => (
                        <div key={ctx.id} className={`border rounded-lg p-4 ${!ctx.processed ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'}`}>
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              ctx.context_type === 'priority' ? 'bg-red-100 text-red-700' :
                              ctx.context_type === 'transcript' ? 'bg-blue-100 text-blue-700' :
                              ctx.context_type === 'email' ? 'bg-amber-100 text-amber-700' :
                              ctx.context_type === 'document' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {ctx.context_type}
                            </span>
                            {ctx.priority_level !== 'normal' && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                ctx.priority_level === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {ctx.priority_level}
                              </span>
                            )}
                            {ctx.applies_to && ctx.applies_to.length > 0 && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                                → {ctx.applies_to.map((a: string) => 
                                  a === 'fiveYear' ? '5Y' : a === 'sixMonth' ? '6M' : '12W'
                                ).join(', ')}
                              </span>
                            )}
                            {!ctx.processed && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                New
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(ctx.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{ctx.content}</p>
                          {ctx.source_file_url && (
                            <a 
                              href={ctx.source_file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              <Briefcase className="w-4 h-4" />
                              View Document
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No context added yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add meeting notes, documents, or emails to inform roadmap generation</p>
                    </div>
                  )}
                </div>
              )}

              {/* SPRINT TAB - WITH EDITING */}
              {activeTab === 'sprint' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 text-sm font-medium">Sprint Refinement</p>
                      <p className="text-amber-700 text-sm mt-1">
                        Click on any task to edit it. Changes are automatically logged to the knowledge base for future reference.
                      </p>
                    </div>
                  </div>

                  {client?.roadmap?.roadmap_data?.sprint?.weeks ? (
                    <div className="space-y-4">
                      {client.roadmap.roadmap_data.sprint.weeks.map((week: any) => (
                        <div key={week.weekNumber} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                {week.weekNumber}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{week.theme}</p>
                                <p className="text-sm text-gray-500">{week.phase} • {week.tasks?.length || 0} tasks</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
                            {week.tasks?.map((task: any) => (
                              <div key={task.id}>
                                {editingTask?.weekNumber === week.weekNumber && editingTask?.taskId === task.id ? (
                                  // Edit Mode
                                  <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                                      <input
                                        type="text"
                                        value={editedTask.title}
                                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                      <textarea
                                        value={editedTask.description}
                                        onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setEditingTask(null)}
                                        className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleSaveTask}
                                        disabled={savingTask}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 text-sm"
                                      >
                                        {savingTask && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        Save & Log
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // View Mode
                                  <div 
                                    onClick={() => handleEditTask(week.weekNumber, task)}
                                    className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                                  >
                                    <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-gray-900 font-medium">{task.title}</p>
                                        <span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                          Click to edit
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                      {(task.boardOwner || task.tool) && (
                                        <div className="flex items-center gap-2 mt-2 text-xs">
                                          {task.boardOwner && (
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{task.boardOwner}</span>
                                          )}
                                          {task.tool && (
                                            <span className="px-2 py-0.5 bg-blue-50 rounded text-blue-600">{task.tool}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No sprint data available</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-500">
            {client?.roadmap && (
              <span>Last generated: {new Date(client.roadmap.created_at).toLocaleDateString()}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

