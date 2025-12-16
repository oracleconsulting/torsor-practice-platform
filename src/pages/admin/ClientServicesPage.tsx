import { useState, useEffect } from 'react';
import type { Page } from '../../types/navigation';
import { Navigation } from '../../components/Navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import { RPGCC_LOGO_LIGHT, RPGCC_LOGO_DARK, RPGCC_COLORS } from '../../constants/brandAssets';
import { TransformationJourney } from '../../components/discovery';
import { 
  Users, 
  CheckCircle,
  Check,
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
  Settings,
  Compass,
  FileText,
  Upload,
  Download,
  MessageSquare,
  Sparkles,
  Share2,
  Trash2,
  Printer
} from 'lucide-react';


interface ClientServicesPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

// All Service Lines - BSG Complete Offering
const SERVICE_LINES = [
  // Discovery First!
  { 
    id: 'discovery', 
    code: 'discovery',
    name: 'Destination Discovery',
    description: 'Initial discovery assessment to understand client goals and recommend services',
    icon: Compass,
    color: 'cyan',
    monthlyRevenue: 0,
    status: 'ready'
  },
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
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string; email: string } | null>(null);

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
      console.log('🚀 Starting invitation process...', {
        email: inviteForm.email,
        name: inviteForm.name,
        services: inviteForm.services,
        practiceId: currentMember.practice_id
      });

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

      console.log('📦 Full response from Edge Function:', response);
      console.log('📦 Response error:', response.error);
      console.log('📦 Response data:', response.data);

      if (response.error) {
        console.error('❌ Response has error:', response.error);
        throw new Error(response.error.message || 'Failed to send invitation');
      }

      // Check if the response indicates success
      if (response.data && !response.data.success) {
        console.error('❌ Response indicates failure:', response.data);
        const errorMsg = response.data.error || 'Failed to send invitation';
        alert(`Error: ${errorMsg}${response.data.invitationUrl ? `\n\nInvitation URL (you can share this manually):\n${response.data.invitationUrl}` : ''}`);
        
        // If invitation was created but email failed, still close modal and refresh
        if (response.data.invitationId) {
          setShowInviteModal(false);
          setInviteForm({ email: '', name: '', company: '', services: [], customMessage: '', inviteType: 'discovery' });
          if (selectedServiceLine) {
            fetchClients();
          }
        }
        return;
      }

      console.log('✅ Invitation sent successfully:', response.data);
      alert(response.data?.message || 'Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', company: '', services: [], customMessage: '', inviteType: 'discovery' });
      
      // Refresh clients list
      if (selectedServiceLine) {
        fetchClients();
      }
    } catch (error: any) {
      console.error('❌ Exception caught:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        error: error?.error,
        stack: error?.stack,
        fullError: error
      });
      const errorMessage = error?.message || error?.error?.message || 'Failed to send invitation. Please try again.';
      alert(`Error: ${errorMessage}\n\nPlease check:\n1. RESEND_API_KEY is configured in Supabase Edge Function secrets\n2. The email address is valid\n3. Check the browser console for more details`);
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

      // Special handling for Discovery clients
      if (serviceLineCode === 'discovery') {
        // First, get all clients who have a destination_discovery record
        const { data: discoveries } = await supabase
          .from('destination_discovery')
          .select('client_id, completed_at, practice_id')
          .eq('practice_id', practiceId);

        const discoveryClientIds = discoveries?.map(d => d.client_id) || [];

        // Get clients with discovery status OR clients who have a discovery record
        const { data: discoveryClients } = await supabase
          .from('practice_members')
          .select(`
            id,
            name,
            email,
            client_company,
            program_status,
            last_portal_login,
            created_at
          `)
          .eq('practice_id', practiceId)
          .eq('member_type', 'client')
          .or(`program_status.in.(discovery,discovery_complete,discovery_in_progress),id.in.(${discoveryClientIds.join(',')})`)
          .order('created_at', { ascending: false });

        // Create a map of discoveries for quick lookup
        const discoveryMap = new Map(
          discoveries?.map(d => [d.client_id, d]) || []
        );

        const enrichedClients: Client[] = (discoveryClients || []).map(client => {
          const discovery = discoveryMap.get(client.id);
          const isComplete = discovery?.completed_at || client.program_status === 'discovery_complete';
          return {
            id: client.id,
            name: client.name,
            email: client.email,
            company: client.client_company,
            service_line: 'discovery',
            status: isComplete ? 'completed' : 'active',
            progress: isComplete ? 100 : 50,
            lastActivity: client.last_portal_login,
            hasRoadmap: isComplete
          };
        });
        
        setClients(enrichedClients);
        setLoading(false);
        return;
      }

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
        .select('client_id, status')
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

  // Delete client permanently
  const handleDeleteClient = async (clientId: string, clientName: string, clientEmail: string) => {
    setClientToDelete({ id: clientId, name: clientName, email: clientEmail });
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete || !currentMember?.practice_id) return;

    setDeletingClient(clientToDelete.id);
    try {
      console.log('🗑️ Deleting client:', clientToDelete);

      // Delete from client_service_lines first (foreign key constraint)
      const { error: serviceLineError } = await supabase
        .from('client_service_lines')
        .delete()
        .eq('client_id', clientToDelete.id)
        .eq('practice_id', currentMember.practice_id);

      if (serviceLineError) {
        console.error('Error deleting client service lines:', serviceLineError);
        throw serviceLineError;
      }

      // Delete from client_invitations
      const { error: invitationError } = await supabase
        .from('client_invitations')
        .delete()
        .eq('email', clientToDelete.email.toLowerCase())
        .eq('practice_id', currentMember.practice_id);

      if (invitationError) {
        console.error('Error deleting client invitations:', invitationError);
        // Don't throw - invitations might not exist
      }

      // Delete from client_assessments
      const { error: assessmentError } = await supabase
        .from('client_assessments')
        .delete()
        .eq('client_id', clientToDelete.id);

      if (assessmentError) {
        console.error('Error deleting client assessments:', assessmentError);
        // Don't throw - assessments might not exist
      }

      // Delete from client_roadmaps
      const { error: roadmapError } = await supabase
        .from('client_roadmaps')
        .delete()
        .eq('client_id', clientToDelete.id);

      if (roadmapError) {
        console.error('Error deleting client roadmaps:', roadmapError);
        // Don't throw - roadmaps might not exist
      }

      // Delete from service_line_assessments
      const { error: serviceAssessmentError } = await supabase
        .from('service_line_assessments')
        .delete()
        .eq('client_id', clientToDelete.id);

      if (serviceAssessmentError) {
        console.error('Error deleting service line assessments:', serviceAssessmentError);
        // Don't throw - assessments might not exist
      }

      // Delete from destination_discovery
      const { error: discoveryError } = await supabase
        .from('destination_discovery')
        .delete()
        .eq('client_id', clientToDelete.id);

      if (discoveryError) {
        console.error('Error deleting destination discovery:', discoveryError);
        // Don't throw - discovery might not exist
      }

      // Finally, delete the practice_member (client)
      const { error: memberError } = await supabase
        .from('practice_members')
        .delete()
        .eq('id', clientToDelete.id)
        .eq('practice_id', currentMember.practice_id)
        .eq('member_type', 'client');

      if (memberError) {
        console.error('Error deleting practice member:', memberError);
        throw memberError;
      }

      console.log('✅ Client deleted successfully');
      alert(`Client ${clientToDelete.name} has been permanently deleted.`);
      
      // Refresh the client list
      if (selectedServiceLine) {
        fetchClients();
      }
      
      setClientToDelete(null);
    } catch (error: any) {
      console.error('❌ Error deleting client:', error);
      alert(`Failed to delete client: ${error.message || 'Unknown error'}`);
    } finally {
      setDeletingClient(null);
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
                          <div className="flex items-center gap-2">
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
                            <button
                              onClick={() => handleDeleteClient(client.id, client.name, client.email)}
                              disabled={deletingClient === client.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete client permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Client Detail Modal - show Discovery modal for discovery clients */}
        {selectedClient && selectedServiceLine === 'discovery' && (
          <DiscoveryClientModal 
            clientId={selectedClient} 
            onClose={() => setSelectedClient(null)}
            onRefresh={fetchClients}
          />
        )}
        
        {/* Regular Client Detail Modal for other service lines */}
        {selectedClient && selectedServiceLine && selectedServiceLine !== 'discovery' && (
          <ClientDetailModal 
            clientId={selectedClient} 
            serviceLineCode={selectedServiceLine}
            onClose={() => setSelectedClient(null)} 
          />
        )}

        {/* Delete Client Confirmation Modal */}
        {clientToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Client</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to permanently delete <strong>{clientToDelete.name}</strong> ({clientToDelete.email})?
              </p>
              
              <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
                ⚠️ This action cannot be undone. This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Client profile and account</li>
                  <li>All service enrollments</li>
                  <li>All assessments and progress data</li>
                  <li>All roadmaps and plans</li>
                  <li>All related records</li>
                </ul>
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setClientToDelete(null)}
                  disabled={deletingClient === clientToDelete.id}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteClient}
                  disabled={deletingClient === clientToDelete.id}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingClient === clientToDelete.id ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
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

// ============================================================================
// DISCOVERY CLIENT MODAL - View responses, upload docs, assign services
// ============================================================================
function DiscoveryClientModal({ 
  clientId, 
  onClose,
  onRefresh
}: { 
  clientId: string; 
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [client, setClient] = useState<any>(null);
  const [discovery, setDiscovery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'responses' | 'documents' | 'context' | 'analysis' | 'services'>('responses');
  
  // Document upload state
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // Analysis state
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [isReportShared, setIsReportShared] = useState(false);
  const [sharingReport, setSharingReport] = useState(false);
  
  // Service assignment state
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [assigningServices, setAssigningServices] = useState(false);
  
  // Context notes state
  const [contextNotes, setContextNotes] = useState<any[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    note_type: 'general' as string,
    title: '',
    content: '',
    event_date: '',
    is_future_event: false,
    importance: 'medium' as string
  });

  useEffect(() => {
    fetchClientDetail();
    fetchContextNotes();
  }, [clientId]);
  
  const fetchContextNotes = async () => {
    const { data, error } = await supabase
      .from('client_context_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('event_date', { ascending: false, nullsFirst: false });
    
    if (error) {
      console.error('Error fetching context notes:', error);
    } else {
      setContextNotes(data || []);
    }
  };
  
  const handleSaveNote = async () => {
    if (!newNote.title || !newNote.content) return;
    
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('client_context_notes')
        .insert({
          client_id: clientId,
          practice_id: currentMember?.practice_id,
          note_type: newNote.note_type,
          title: newNote.title,
          content: newNote.content,
          event_date: newNote.event_date || null,
          is_future_event: newNote.is_future_event,
          importance: newNote.importance,
          created_by: user?.id
        });
      
      if (error) throw error;
      
      // Reset form and refresh
      setNewNote({
        note_type: 'general',
        title: '',
        content: '',
        event_date: '',
        is_future_event: false,
        importance: 'medium'
      });
      setShowAddNote(false);
      fetchContextNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSavingNote(false);
    }
  };
  
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    
    const { error } = await supabase
      .from('client_context_notes')
      .delete()
      .eq('id', noteId);
    
    if (!error) {
      fetchContextNotes();
    }
  };

  const fetchClientDetail = async () => {
    setLoading(true);
    try {
      // Fetch client
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('*')
        .eq('id', clientId)
        .single();

      // Fetch discovery responses
      // First try by client_id, but also check by email in case of ID mismatch
      let discoveryData = null;
      const { data: discoveryByClientId } = await supabase
        .from('destination_discovery')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (discoveryByClientId) {
        discoveryData = discoveryByClientId;
      } else {
        // Fallback: Try to find discovery by matching practice_id and checking if client email matches
        // This handles cases where client_id in discovery doesn't match practice_members.id
        const { data: clientInfo } = await supabase
          .from('practice_members')
          .select('email, practice_id')
          .eq('id', clientId)
          .single();
        
        if (clientInfo) {
          // Find discovery assessments in the same practice and check if they might belong to this client
          const { data: allDiscoveries } = await supabase
            .from('destination_discovery')
            .select('*, practice_members!inner(email)')
            .eq('practice_id', clientInfo.practice_id)
            .order('created_at', { ascending: false });
          
          // Find discovery that matches this client's email
          const matchingDiscovery = allDiscoveries?.find((d: any) => 
            d.practice_members?.email === clientInfo.email
          );
          
          if (matchingDiscovery) {
            console.warn(`⚠️ Found discovery assessment with mismatched client_id. Expected: ${clientId}, Found: ${matchingDiscovery.client_id}`);
            discoveryData = matchingDiscovery;
          }
        }
      }

      // Fetch uploaded documents
      // Note: Using simple query to avoid PostgREST relationship ambiguity
      // We'll validate client_id separately
      const { data: docsData, error: docsError } = await supabase
        .from('client_context')
        .select('*')
        .eq('client_id', clientId)
        .eq('context_type', 'document')
        .order('created_at', { ascending: false });
      
      if (docsError) {
        console.error('Error fetching documents:', docsError);
      }
      
      const validDocs = (docsData || []).filter((doc: any) => {
        // Documents are already filtered by client_id in the query
        // Just verify the storage path matches if present
        if (doc.source_file_url) {
          const pathMatch = doc.source_file_url.match(/\/([a-f0-9-]{36})\/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)/i);
          if (pathMatch && pathMatch[1]) {
            const storagePathClientId = pathMatch[1];
            if (storagePathClientId !== clientId) {
              console.warn(`⚠️ Document ${doc.id} has mismatched client_id in storage path. Database: ${clientId}, Storage: ${storagePathClientId}`);
              return false; // Exclude documents where storage path doesn't match current client_id
            }
          }
        }
        // Document is valid - client_id filter already applied by query
        return true;
      });
      
      // Log warning if we filtered out any documents
      if (validDocs.length !== (docsData || []).length) {
        console.warn(`⚠️ Filtered out ${(docsData || []).length - validDocs.length} documents with mismatched client_id for client ${clientId}`);
      }

      // Fetch currently assigned services
      const { data: assignedServices } = await supabase
        .from('client_service_lines')
        .select('service_line_id, service_lines(code, name)')
        .eq('client_id', clientId);

      // Fetch existing report if any
      const { data: existingReport } = await supabase
        .from('client_reports')
        .select('*')
        .eq('client_id', clientId)
        .eq('report_type', 'discovery_analysis')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setClient(clientData);
      setDiscovery(discoveryData);
      // Use validated documents (filtered by email match)
      setDocuments(validDocs || []);
      setAnalysisNotes(discoveryData?.analysis_notes || '');
      setSelectedServices(assignedServices?.map((s: any) => s.service_lines?.code).filter(Boolean) || []);
      
      if (existingReport) {
        // Normalize the loaded report to match the generated format
        // DB stores: { id, report_data: { analysis, discoveryScores, ... } }
        // Generated returns: { id, analysis, discoveryScores, ... }
        const normalizedReport = {
          id: existingReport.id,
          generatedAt: existingReport.report_data?.generatedAt || existingReport.created_at,
          client: existingReport.report_data?.client || { id: clientId, name: clientData?.name },
          practice: existingReport.report_data?.practice,
          discoveryScores: existingReport.report_data?.discoveryScores,
          affordability: existingReport.report_data?.affordability,
          transformationSignals: existingReport.report_data?.transformationSignals,
          financialProjections: existingReport.report_data?.financialProjections,
          analysis: existingReport.report_data?.analysis,
          // Keep raw DB fields for reference
          _dbRecord: {
            created_at: existingReport.created_at,
            is_shared_with_client: existingReport.is_shared_with_client
          }
        };
        console.log('[Report] Loaded existing report:', normalizedReport.id);
        setGeneratedReport(normalizedReport);
        setIsReportShared(existingReport.is_shared_with_client || false);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle document upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !client?.practice_id) return;

    console.log('📤 Starting file upload:', {
      clientId,
      practiceId: client.practice_id,
      clientEmail: client.email,
      fileCount: files.length
    });

    setUploading(true);
    try {
      for (const file of files) {
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${client.practice_id}/${clientId}/${timestamp}_${safeFileName}`;
        
        console.log('📤 Uploading file:', file.name, 'to path:', storagePath);
        
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(storagePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('client-documents')
          .getPublicUrl(storagePath);
        
        // Save to client_context
        // CRITICAL: Validate client_id before inserting document
        console.log('📤 Verifying client_id before insert:', clientId);
        const { data: clientVerify, error: verifyError } = await supabase
          .from('practice_members')
          .select('id, email, user_id')
          .eq('id', clientId)
          .single();
        
        console.log('📤 Client verification result:', clientVerify, verifyError);
        
        if (!clientVerify) {
          console.error('❌ Client verification FAILED for clientId:', clientId);
          throw new Error(`Invalid client_id: ${clientId}. Cannot upload document.`);
        }
        
        console.log('✅ Client verified:', clientVerify.email);
        
        // CRITICAL: Verify storage path matches client_id
        // Storage path format: practice_id/client_id/filename
        const expectedPathPrefix = `${client.practice_id}/${clientId}/`;
        if (!storagePath.startsWith(expectedPathPrefix)) {
          console.error(`CRITICAL: Storage path ${storagePath} does not match expected prefix ${expectedPathPrefix}`);
          throw new Error(`Storage path validation failed. Expected client_id ${clientId} in path.`);
        }
        
        await supabase.from('client_context').insert({
          practice_id: client.practice_id,
          client_id: clientId, // Verified above
          context_type: 'document',
          content: `Uploaded: ${file.name}`,
          source_file_url: urlData.publicUrl,
          applies_to: ['discovery'],
          processed: false
        });
      }
      
      await fetchClientDetail();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Save analysis notes
  const handleSaveNotes = async () => {
    if (!discovery) return;
    setSavingNotes(true);
    try {
      await supabase
        .from('destination_discovery')
        .update({ 
          analysis_notes: analysisNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', discovery.id);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  // Generate discovery report (2-stage process for reliability)
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session for report:', session ? 'Found' : 'Missing', session?.access_token?.substring(0, 20) + '...');
      
      if (!session?.access_token) {
        throw new Error('No active session - please log in again');
      }
      
      const baseUrl = 'https://mvdejlkiqslwrbarwxkw.supabase.co/functions/v1';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZGVqbGtpcXNsd3JiYXJ3eGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTg0NDEsImV4cCI6MjA3OTQ3NDQ0MX0.NaiSmZOPExJiBBksL4R1swW4jrJg9JtNK8ktB17rXiM'
      };
      
      // ================================================================
      // STAGE 1: Prepare data (fast - gathers all client info)
      // ================================================================
      console.log('Stage 1: Preparing discovery data...');
      const prepareResponse = await fetch(`${baseUrl}/prepare-discovery-data`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientId,
          practiceId: client?.practice_id,
          discoveryId: discovery?.id
        })
      });
      
      if (!prepareResponse.ok) {
        const prepError = await prepareResponse.json();
        throw new Error(prepError?.error || 'Failed to prepare data');
      }
      
      const prepareResult = await prepareResponse.json();
      console.log('Stage 1 complete:', prepareResult.metadata);
      
      if (!prepareResult.success || !prepareResult.preparedData) {
        throw new Error(prepareResult.error || 'Failed to prepare discovery data');
      }
      
      // ================================================================
      // STAGE 2: Advisory Deep Dive (service matching & insights)
      // ================================================================
      console.log('Stage 2: Running advisory deep dive...');
      console.log('Stage 2 URL:', `${baseUrl}/advisory-deep-dive`);
      console.log('Stage 2 preparedData client:', prepareResult.preparedData?.client?.name);
      
      let advisoryInsights = null;
      
      try {
        const advisoryResponse = await fetch(`${baseUrl}/advisory-deep-dive`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            preparedData: prepareResult.preparedData
          })
        });
        
        console.log('Stage 2 response status:', advisoryResponse.status, advisoryResponse.statusText);
        
        if (!advisoryResponse.ok) {
          const errorText = await advisoryResponse.text();
          console.error('Stage 2 failed with status:', advisoryResponse.status);
          console.error('Stage 2 error response:', errorText);
          
          try {
            const advisoryError = JSON.parse(errorText);
            console.warn('Stage 2 error details:', advisoryError);
          } catch (e) {
            console.warn('Stage 2 error (non-JSON):', errorText);
          }
          
          console.warn('Continuing to Stage 3 without advisory insights');
        } else {
          const advisoryResult = await advisoryResponse.json();
          console.log('Stage 2 complete:', advisoryResult.metadata);
          
          if (advisoryResult.success && advisoryResult.advisoryInsights) {
            advisoryInsights = advisoryResult.advisoryInsights;
            console.log('✅ Stage 2 insights received:', {
              phase1Services: advisoryInsights.serviceRecommendations?.phase1?.services,
              phase2Services: advisoryInsights.serviceRecommendations?.phase2?.services,
              phase3Services: advisoryInsights.serviceRecommendations?.phase3?.services
            });
          } else {
            console.warn('⚠️ Stage 2 returned but no insights:', advisoryResult);
          }
        }
      } catch (error) {
        console.error('❌ Stage 2 exception:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        console.warn('Continuing to Stage 3 without advisory insights');
      }
      
      // ================================================================
      // STAGE 3: Generate analysis (uses Claude Opus 4.5)
      // ================================================================
      console.log('Stage 3: Generating analysis with Claude Opus 4.5...');
      const analysisResponse = await fetch(`${baseUrl}/generate-discovery-analysis`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          preparedData: prepareResult.preparedData,
          advisoryInsights: advisoryInsights
        })
      });
      
      if (!analysisResponse.ok) {
        const analysisError = await analysisResponse.json();
        throw new Error(analysisError?.error || 'Failed to generate analysis');
      }
      
      const analysisResult = await analysisResponse.json();
      console.log('Stage 3 complete:', analysisResult.metadata);
      
      // Debug: Log the full report structure
      console.log('[Debug] Full analysis result:', analysisResult);
      console.log('[Debug] Report object:', analysisResult?.report);
      console.log('[Debug] Analysis object:', analysisResult?.report?.analysis);
      console.log('[Debug] Recommended investments:', analysisResult?.report?.analysis?.recommendedInvestments);
      console.log('[Debug] Investment summary:', analysisResult?.report?.analysis?.investmentSummary);
      
      if (analysisResult?.success && analysisResult?.report) {
        setGeneratedReport(analysisResult.report);
        setActiveTab('analysis'); // Switch to analysis tab to show report
      } else {
        throw new Error(analysisResult?.error || 'Failed to generate report');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error generating report:', errorMessage, error);
      alert(`Failed to generate report: ${errorMessage}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Share/unshare report with client
  const handleShareReport = async () => {
    if (!generatedReport?.id) {
      alert('No report to share. Please generate a report first.');
      return;
    }
    
    setSharingReport(true);
    try {
      const newSharedStatus = !isReportShared;
      
      console.log('[Share] Updating report:', {
        reportId: generatedReport.id,
        clientId: generatedReport.client?.id || client?.id,
        newSharedStatus
      });
      
      const { data, error } = await supabase
        .from('client_reports')
        .update({ 
          is_shared_with_client: newSharedStatus,
          shared_at: newSharedStatus ? new Date().toISOString() : null
        })
        .eq('id', generatedReport.id)
        .select();
      
      if (error) {
        console.error('[Share] Error updating report:', error);
        alert(`Failed to update sharing status: ${error.message}`);
        return;
      }
      
      console.log('[Share] Report updated successfully:', data);
      
      setIsReportShared(newSharedStatus);
      
      if (newSharedStatus) {
        alert('Report shared! The client can now view it in their portal.');
      } else {
        alert('Report unshared. The client can no longer see it.');
      }
    } catch (error: any) {
      console.error('[Share] Error sharing report:', error);
      alert(`Failed to update sharing status: ${error?.message || 'Unknown error'}`);
    } finally {
      setSharingReport(false);
    }
  };

  // Export report as PDF (opens print dialog) - RPGCC Branded Version
  const handleExportPDF = () => {
    if (!generatedReport?.analysis) return;

    const analysis = generatedReport.analysis;
    const clarityScore = generatedReport.discoveryScores?.clarityScore || 0;
    const gapScore = generatedReport.discoveryScores?.gapScore || 0;
    const clientName = generatedReport.client?.name || client?.name || 'Client';
    const companyName = generatedReport.client?.company || client?.client_company || '';
    const generatedDate = generatedReport.generatedAt 
      ? new Date(generatedReport.generatedAt).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      : new Date().toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });

    // Check if we have the new Transformation Journey data
    const hasTransformationJourney = analysis.transformationJourney?.phases?.length > 0;
    const destination = analysis.transformationJourney?.destination || '';
    const totalInvestment = analysis.transformationJourney?.totalInvestment || analysis.investmentSummary?.totalFirstYearInvestment || '';

    // Gap Analysis HTML - Improved with visual severity indicators
    const gapsHtml = (analysis.gapAnalysis?.primaryGaps || []).map((gap: any) => {
      const severityIcon = gap.severity === 'critical' ? '🔴' : gap.severity === 'high' ? '🟠' : '🟡';
      return `
      <div class="gap-card severity-${gap.severity || 'medium'}">
        <div class="gap-header">
          <span class="severity-indicator">${severityIcon}</span>
          <span class="severity-text severity-${gap.severity || 'medium'}">${(gap.severity || 'medium').toUpperCase()}</span>
          <span class="gap-divider">|</span>
          <span class="gap-category">${gap.category || 'General'}</span>
        </div>
        <h3 class="gap-title">${gap.gap || 'Gap identified'}</h3>
        <blockquote class="gap-evidence">"${gap.evidence || ''}"</blockquote>
        <div class="gap-impacts">
          ${gap.currentImpact?.financialImpact ? `<span class="impact-item">• ${gap.currentImpact.financialImpact}</span>` : ''}
          ${gap.currentImpact?.timeImpact ? `<span class="impact-item">• ${gap.currentImpact.timeImpact}</span>` : ''}
        </div>
      </div>
    `}).join('');

    // Investment Recommendations HTML (Legacy fallback)
    const investmentsHtml = (analysis.recommendedInvestments || []).map((inv: any) => {
      const outcomes = (inv.keyOutcomes || inv.expectedOutcomes || []).map((o: any) => 
        `<div class="outcome-item">${typeof o === 'string' ? o : o.outcome}</div>`
      ).join('');

      return `
        <div class="investment-card">
          <div class="investment-priority">
            <span class="priority-number">${inv.priority || 1}</span>
            <span class="priority-label">Priority</span>
          </div>
          <div class="investment-content">
            <div class="investment-header">
              <div class="investment-info">
                <h3 class="service-name">${inv.service || inv.serviceName || 'Service'}</h3>
                <span class="service-tier">${inv.recommendedTier || ''}</span>
              </div>
              <div class="investment-price">
                <span class="price-amount">${inv.investment || inv.price || ''}</span>
                <span class="price-frequency">${inv.investmentFrequency || inv.frequency || 'per month'}</span>
              </div>
            </div>
            <p class="investment-rationale">${inv.whyThisTier || ''}</p>
            ${inv.expectedROI ? `
              <div class="investment-roi">
                <span class="roi-label">Expected ROI:</span>
                <span class="roi-value">${inv.expectedROI.multiplier || ''}</span>
                <span class="roi-timeframe">in ${inv.expectedROI.timeframe || '12 months'}</span>
              </div>
            ` : ''}
            <div class="outcomes-list">${outcomes}</div>
          </div>
        </div>
      `;
    }).join('');

    // Closing Message - Elevated as hero section
    const closingMessage = analysis.closingMessage;
    const personalNote = typeof closingMessage === 'string' ? closingMessage : closingMessage?.personalNote || '';
    const callToAction = typeof closingMessage === 'string' ? 'Let\'s talk this week.' : closingMessage?.callToAction || 'Let\'s talk this week.';

    // Journey Phases HTML - Improved timeline visualization
    const journeyPhasesHtml = hasTransformationJourney ? analysis.transformationJourney.phases.map((phase: any) => `
      <div class="journey-phase">
        <div class="phase-header">
          <div class="phase-badge">${phase.phase}</div>
          <div class="phase-meta">
            <span class="phase-timeframe">${phase.timeframe}</span>
            <h3 class="phase-title">${phase.title}</h3>
          </div>
        </div>
        <div class="phase-body">
          <div class="phase-postcard">
            <p class="postcard-label">You'll have</p>
            <p class="postcard-content">${phase.youWillHave}</p>
          </div>
          <p class="phase-shift">"${phase.whatChanges}"</p>
        </div>
        <div class="phase-footer">
          <span class="enabled-by">Enabled by: <strong>${phase.enabledBy}</strong></span>
          <span class="phase-investment">${phase.investment}</span>
        </div>
      </div>
    `).join('') : '';

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discovery Analysis - ${clientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          :root {
            --brand-navy-dark: ${RPGCC_COLORS.navyDark};
            --brand-navy: ${RPGCC_COLORS.navy};
            --brand-blue-light: ${RPGCC_COLORS.blueLight};
            --brand-teal: ${RPGCC_COLORS.teal};
            --brand-orange: ${RPGCC_COLORS.orange};
            --brand-red: ${RPGCC_COLORS.red};
            --text-primary: ${RPGCC_COLORS.textPrimary};
            --text-secondary: ${RPGCC_COLORS.textSecondary};
            --text-muted: ${RPGCC_COLORS.textMuted};
            --bg-light: ${RPGCC_COLORS.bgLight};
          }
          
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: white;
          }
          
          /* ==================== PAGE 1: COVER ==================== */
          .cover-page {
            page-break-after: always;
            background: linear-gradient(180deg, var(--brand-navy-dark) 0%, var(--brand-navy) 100%);
            min-height: 100vh;
            padding: 50px;
            display: flex;
            flex-direction: column;
            color: white;
          }
          .cover-header {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .cover-logo { height: 40px; }
          .tagline {
            color: var(--brand-blue-light);
            font-size: 13px;
            letter-spacing: 0.5px;
          }
          .cover-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
            padding: 60px 0;
          }
          .cover-title {
            font-size: 48px;
            font-weight: 300;
            margin: 0 0 32px 0;
            letter-spacing: -1px;
          }
          .cover-client {
            font-size: 26px;
            font-weight: 600;
            margin: 0 0 8px 0;
          }
          .cover-company {
            font-size: 18px;
            color: var(--brand-blue-light);
            margin: 0 0 40px 0;
          }
          .cover-destination-preview {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 24px 32px;
            max-width: 600px;
            margin: 0 auto;
          }
          .destination-intro {
            font-size: 14px;
            color: var(--brand-blue-light);
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .destination-preview-text {
            font-size: 20px;
            font-weight: 500;
            font-style: italic;
            line-height: 1.5;
            margin: 0;
          }
          .cover-footer {
            text-align: center;
            font-size: 12px;
            color: rgba(255,255,255,0.6);
          }
          .cover-footer p { margin: 4px 0; }
          
          /* ==================== CONTENT PAGES ==================== */
          .content-page {
            padding: 40px 50px;
            max-width: 900px;
            margin: 0 auto;
            page-break-after: always;
          }
          .content-page:last-child {
            page-break-after: auto;
          }
          
          /* Scores Row - Compact */
          .scores-row {
            display: flex;
            gap: 16px;
            margin: 0 0 24px 0;
          }
          .score-card {
            flex: 1;
            background: var(--brand-navy);
            color: white;
            padding: 16px 20px;
            text-align: center;
            border-radius: 8px;
          }
          .score-value {
            font-size: 36px;
            font-weight: 700;
          }
          .score-max {
            font-size: 16px;
            font-weight: 400;
            opacity: 0.6;
          }
          .score-label {
            font-size: 11px;
            margin-top: 4px;
            color: var(--brand-blue-light);
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          /* Executive Summary - Condensed */
          .executive-summary {
            border-left: 4px solid var(--brand-navy);
            padding: 20px 24px;
            margin: 0 0 24px 0;
            background: #f8fafc;
          }
          .summary-badge {
            display: inline-block;
            background: var(--brand-navy);
            color: white;
            padding: 4px 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-radius: 2px;
            margin-bottom: 12px;
          }
          .headline {
            font-size: 20px;
            font-weight: 600;
            color: var(--brand-navy);
            margin: 0 0 12px 0;
            line-height: 1.4;
          }
          .situation-quote {
            font-style: italic;
            color: var(--text-secondary);
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            padding-left: 16px;
            border-left: 2px solid var(--brand-blue-light);
          }
          
          /* Section Headers - Compact */
          .section-header {
            margin: 32px 0 16px 0;
            padding-bottom: 12px;
            border-bottom: 2px solid #e5e7eb;
          }
          .section-title {
            font-size: 22px;
            font-weight: 600;
            color: var(--brand-navy);
          }
          .section-subtitle {
            font-size: 13px;
            color: var(--text-muted);
            margin-top: 4px;
          }
          
          /* Gap Cards - Improved with visual severity */
          .gap-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 12px 0;
            page-break-inside: avoid;
          }
          .gap-card.severity-critical { border-left: 4px solid var(--brand-red); background: #fef7f7; }
          .gap-card.severity-high { border-left: 4px solid var(--brand-orange); background: #fffcf5; }
          .gap-card.severity-medium { border-left: 4px solid var(--brand-blue-light); }
          .gap-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }
          .severity-indicator { font-size: 14px; }
          .severity-text {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .severity-text.severity-critical { color: #dc2626; }
          .severity-text.severity-high { color: #d97706; }
          .severity-text.severity-medium { color: #0369a1; }
          .gap-divider {
            color: #d1d5db;
            font-size: 12px;
          }
          .gap-category {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            font-weight: 500;
          }
          .gap-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 8px 0;
          }
          .gap-evidence {
            font-style: italic;
            color: var(--text-secondary);
            background: rgba(0,0,0,0.03);
            padding: 10px 14px;
            border-radius: 4px;
            margin: 0 0 8px 0;
            font-size: 13px;
            border: none;
          }
          .gap-impacts {
            font-size: 12px;
            color: var(--text-muted);
          }
          .impact-item {
            display: inline-block;
            margin-right: 12px;
          }
          
          /* Cost of Inaction - Footer banner style */
          .cost-of-inaction {
            background: linear-gradient(135deg, var(--brand-navy-dark), var(--brand-navy));
            color: white;
            padding: 24px 32px;
            border-radius: 12px;
            margin: 24px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .coi-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .coi-icon { font-size: 28px; }
          .coi-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--brand-blue-light);
            margin-bottom: 4px;
          }
          .coi-amount {
            font-size: 24px;
            font-weight: 700;
            color: #fca5a5;
          }
          .coi-personal {
            font-size: 14px;
            color: rgba(255,255,255,0.85);
            max-width: 400px;
            line-height: 1.5;
          }
          
          /* ==================== DESTINATION PAGE ==================== */
          .destination-hero {
            background: linear-gradient(135deg, var(--brand-teal), #0f766e);
            color: white;
            padding: 48px 40px;
            border-radius: 16px;
            text-align: center;
            margin-bottom: 32px;
            page-break-inside: avoid;
          }
          .destination-intro-text {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 20px;
          }
          .destination-quote-box {
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 12px;
            padding: 28px 36px;
            margin: 0 auto 24px;
            max-width: 600px;
          }
          .destination-quote {
            font-size: 24px;
            font-weight: 600;
            font-style: italic;
            line-height: 1.4;
            margin: 0;
          }
          .destination-investment-line {
            font-size: 15px;
            opacity: 0.9;
          }
          
          /* Timeline Preview */
          .timeline-preview {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0;
            margin: 24px 0 8px;
            padding: 0 20px;
          }
          .timeline-dot {
            width: 12px;
            height: 12px;
            background: var(--brand-teal);
            border-radius: 50%;
            border: 2px solid white;
          }
          .timeline-line {
            flex: 1;
            max-width: 100px;
            height: 2px;
            background: linear-gradient(90deg, var(--brand-teal), #99f6e4);
          }
          .timeline-labels {
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            font-size: 11px;
            color: var(--text-muted);
            max-width: 500px;
            margin: 0 auto;
          }
          
          /* ==================== JOURNEY PHASES ==================== */
          .journey-phase {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .phase-header {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 16px;
          }
          .phase-badge {
            width: 40px;
            height: 40px;
            background: var(--brand-teal);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 700;
            flex-shrink: 0;
          }
          .phase-meta { flex: 1; }
          .phase-timeframe {
            display: inline-block;
            background: #f0fdfa;
            color: #0d9488;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .phase-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--brand-navy);
            margin: 0;
          }
          .phase-body {
            margin-bottom: 12px;
          }
          .phase-postcard {
            background: #f8fafc;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 10px;
          }
          .postcard-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            margin-bottom: 6px;
          }
          .postcard-content {
            font-size: 14px;
            color: var(--text-primary);
            line-height: 1.6;
          }
          .phase-shift {
            font-style: italic;
            color: var(--brand-teal);
            font-size: 13px;
          }
          .phase-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: var(--text-muted);
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
          }
          .enabled-by strong { color: var(--text-secondary); }
          .phase-investment {
            font-weight: 600;
            color: var(--brand-teal);
          }
          
          /* ==================== INVESTMENT & CLOSING PAGE ==================== */
          .investment-summary {
            background: linear-gradient(135deg, var(--brand-teal), #0f766e);
            color: white;
            padding: 32px 40px;
            border-radius: 16px;
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          .summary-title {
            text-align: center;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.85;
            margin-bottom: 24px;
          }
          .summary-grid {
            display: flex;
            justify-content: space-around;
            text-align: center;
          }
          .summary-stat { padding: 0 20px; }
          .summary-stat:not(:last-child) {
            border-right: 1px solid rgba(255,255,255,0.2);
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
          }
          .summary-stat.highlight .stat-value { color: #fef3c7; }
          .summary-context {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.2);
            font-size: 13px;
            opacity: 0.9;
          }
          
          /* Closing Message - Hero Treatment */
          .closing-hero {
            background: var(--brand-navy-dark);
            color: white;
            padding: 36px 40px;
            border-radius: 16px;
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          .closing-quote {
            font-size: 16px;
            line-height: 1.8;
            font-style: italic;
            margin: 0 0 24px 0;
            padding: 24px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
          }
          .cta-button {
            display: block;
            background: var(--brand-teal);
            color: white;
            text-align: center;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 17px;
            font-weight: 600;
            text-decoration: none;
            max-width: 280px;
            margin: 0 auto;
          }
          
          /* Footer - Inline with content */
          .document-footer {
            text-align: center;
            padding: 24px 0;
            border-top: 1px solid #e5e7eb;
          }
          .footer-logo { height: 28px; margin-bottom: 10px; }
          .footer-text {
            font-size: 11px;
            color: var(--text-muted);
            margin: 3px 0;
          }
          
          /* Legacy Investment Cards */
          .investment-card {
            display: flex;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            margin: 16px 0;
            page-break-inside: avoid;
          }
          .investment-priority {
            background: var(--brand-teal);
            color: white;
            padding: 20px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 70px;
          }
          .priority-number { font-size: 28px; font-weight: 700; }
          .priority-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
          .investment-content { flex: 1; padding: 20px; }
          .investment-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .service-name { font-size: 17px; font-weight: 600; color: var(--brand-navy); margin: 0; }
          .service-tier { font-size: 12px; color: var(--text-muted); }
          .investment-price { text-align: right; }
          .price-amount { font-size: 22px; font-weight: 700; color: var(--brand-teal); }
          .price-frequency { font-size: 11px; color: var(--text-muted); }
          .investment-rationale { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 12px 0; }
          .investment-roi {
            background: #f0fdfa;
            border: 1px solid #99f6e4;
            padding: 8px 12px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 12px;
            font-size: 12px;
          }
          .roi-label { color: var(--text-muted); }
          .roi-value { font-weight: 700; color: var(--brand-teal); margin: 0 4px; }
          .roi-timeframe { color: var(--text-muted); }
          .outcomes-list { display: grid; gap: 4px; }
          .outcome-item { font-size: 12px; color: #374151; }
          .outcome-item::before { content: '✓'; color: var(--brand-teal); font-weight: 600; margin-right: 6px; }
          
          /* Print Styles */
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .cover-page, .content-page { page-break-after: always; }
            .content-page:last-child { page-break-after: auto; }
            .gap-card, .journey-phase, .investment-summary, .closing-hero, .cost-of-inaction { page-break-inside: avoid; }
          }
          
          @page { size: A4; margin: 12mm; }
        </style>
      </head>
      <body>
        <!-- PAGE 1: COVER -->
        <div class="cover-page">
          <div class="cover-header">
            <img src="${RPGCC_LOGO_LIGHT}" alt="RPGCC" class="cover-logo" />
            <div class="tagline">Chartered Accountants, Auditors, Tax & Business Advisers</div>
          </div>
          <div class="cover-content">
            <h1 class="cover-title">Discovery Analysis</h1>
            <p class="cover-client">${clientName}</p>
            ${companyName ? `<p class="cover-company">${companyName}</p>` : ''}
            ${hasTransformationJourney && destination ? `
              <div class="cover-destination-preview">
                <p class="destination-intro">Your path to</p>
                <p class="destination-preview-text">"${destination}"</p>
              </div>
            ` : ''}
          </div>
          <div class="cover-footer">
            <p>${generatedDate}</p>
            <p>Registered to carry on audit work in the UK by ICAEW</p>
          </div>
        </div>
        
        <!-- PAGE 2: EXECUTIVE SUMMARY + GAPS -->
        <div class="content-page">
          <div class="scores-row">
            <div class="score-card">
              <div class="score-value">${clarityScore}<span class="score-max">/10</span></div>
              <div class="score-label">Clarity</div>
            </div>
            <div class="score-card">
              <div class="score-value">${gapScore}<span class="score-max">/10</span></div>
              <div class="score-label">Gap Score</div>
            </div>
          </div>
          
          <div class="executive-summary">
            <span class="summary-badge">Executive Summary</span>
            <h2 class="headline">${analysis.executiveSummary?.headline || ''}</h2>
            ${analysis.executiveSummary?.situationInTheirWords ? `
              <blockquote class="situation-quote">"${analysis.executiveSummary.situationInTheirWords}"</blockquote>
            ` : ''}
          </div>
          
          <div class="section-header">
            <h2 class="section-title">Gap Analysis</h2>
            <p class="section-subtitle">What's currently holding you back</p>
          </div>
          
          ${gapsHtml}
          
          ${analysis.gapAnalysis?.costOfInaction ? `
            <div class="cost-of-inaction">
              <div class="coi-left">
                <span class="coi-icon">⚠️</span>
                <div>
                  <p class="coi-label">Cost of Not Acting</p>
                  <p class="coi-amount">${analysis.gapAnalysis.costOfInaction.annualFinancialCost || ''}</p>
                </div>
              </div>
              <p class="coi-personal">${analysis.gapAnalysis.costOfInaction.personalCost || ''}</p>
            </div>
          ` : ''}
        </div>
        
        ${hasTransformationJourney ? `
        <!-- PAGE 3: THE DESTINATION -->
        <div class="content-page">
          <div class="destination-hero">
            <p class="destination-intro-text">In 12 months, you could be...</p>
            <div class="destination-quote-box">
              <p class="destination-quote">${destination}</p>
            </div>
            <p class="destination-investment-line">This is what ${totalInvestment} and 12 months builds.</p>
          </div>
          
          <div class="timeline-preview">
            <div class="timeline-dot"></div>
            <div class="timeline-line"></div>
            <div class="timeline-dot"></div>
            <div class="timeline-line"></div>
            <div class="timeline-dot"></div>
            <div class="timeline-line"></div>
            <div class="timeline-dot"></div>
          </div>
          <div class="timeline-labels">
            <span>Now</span>
            <span>Month 3</span>
            <span>Month 6</span>
            <span>Month 12</span>
          </div>
          
          <div class="section-header">
            <h2 class="section-title">Your Journey</h2>
            <p class="section-subtitle">The path from here to your destination</p>
          </div>
          
          ${journeyPhasesHtml}
        </div>
        ` : `
        <!-- LEGACY: Recommended Investments -->
        <div class="content-page">
          <div class="section-header">
            <h2 class="section-title">Recommended Investments</h2>
            <p class="section-subtitle">Your path forward</p>
          </div>
          ${investmentsHtml}
        </div>
        `}
        
        <!-- FINAL PAGE: INVESTMENT & CLOSING -->
        <div class="content-page">
          ${analysis.investmentSummary ? `
            <div class="investment-summary">
              <p class="summary-title">Your Investment</p>
              <div class="summary-grid">
                <div class="summary-stat">
                  <p class="stat-value">${analysis.investmentSummary.totalFirstYearInvestment || ''}</p>
                  <p class="stat-label">First Year</p>
                </div>
                <div class="summary-stat highlight">
                  <p class="stat-value">${analysis.investmentSummary.projectedFirstYearReturn || ''}</p>
                  <p class="stat-label">Projected Return</p>
                </div>
                <div class="summary-stat">
                  <p class="stat-value">${analysis.investmentSummary.paybackPeriod || ''}</p>
                  <p class="stat-label">Payback</p>
                </div>
              </div>
              ${generatedReport.financialProjections?.grossMargin ? `
                <p class="summary-context">At your ${Math.round(generatedReport.financialProjections.grossMargin * 100)}% gross margins, efficiency gains go straight to profit.</p>
              ` : ''}
            </div>
          ` : ''}
          
          ${personalNote ? `
            <div class="closing-hero">
              <blockquote class="closing-quote">${personalNote}</blockquote>
              <div class="cta-button">${callToAction}</div>
            </div>
          ` : ''}
          
          <div class="document-footer">
            <img src="${RPGCC_LOGO_DARK}" alt="RPGCC" class="footer-logo" />
            <p class="footer-text">Discovery Analysis Report • Confidential</p>
            <p class="footer-text">Prepared for ${clientName} by Oracle Consulting</p>
            <p class="footer-text">RPG Crouch Chapman LLP • Registered to carry on audit work by ICAEW</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  // Assign services to client
  const handleAssignServices = async () => {
    if (selectedServices.length === 0 || !client?.practice_id) return;
    
    setAssigningServices(true);
    try {
      console.log('🔧 Assigning services:', {
        selectedServices,
        clientId,
        clientName: client?.name,
        clientEmail: client?.email,
        practiceId: client.practice_id
      });

      // CRITICAL: Verify client exists before proceeding
      const { data: clientVerify, error: verifyError } = await supabase
        .from('practice_members')
        .select('id, name, email, practice_id')
        .eq('id', clientId)
        .single();

      if (verifyError || !clientVerify) {
        console.error('❌ Client verification failed:', verifyError);
        alert(`Error: Client not found. Cannot assign services.`);
        return;
      }

      console.log('✅ Client verified:', clientVerify);

      // Get service line IDs
      const { data: serviceLines, error: serviceLinesError } = await supabase
        .from('service_lines')
        .select('id, code, name')
        .in('code', selectedServices);

      if (serviceLinesError) {
        console.error('❌ Error fetching service lines:', serviceLinesError);
        throw serviceLinesError;
      }

      console.log('📋 Found service lines:', serviceLines);

      if (!serviceLines || serviceLines.length === 0) {
        alert(`No service lines found for codes: ${selectedServices.join(', ')}. Please check the service codes.`);
        return;
      }

      if (serviceLines.length !== selectedServices.length) {
        const foundCodes = serviceLines.map(sl => sl.code);
        const missingCodes = selectedServices.filter(code => !foundCodes.includes(code));
        console.warn('⚠️ Some service codes not found:', missingCodes);
        alert(`Warning: Some services not found in database: ${missingCodes.join(', ')}. Only found services will be assigned.`);
      }

      // CRITICAL: Use a transaction-like approach - insert new ones first, then delete old ones
      // This prevents data loss if inserts fail
      const insertResults = [];
      for (const sl of serviceLines) {
        const { data, error: insertError } = await supabase
          .from('client_service_lines')
          .insert({
            practice_id: client.practice_id,
            client_id: clientId,
            service_line_id: sl.id,
            status: 'pending_onboarding'
            // Note: created_by column doesn't exist in client_service_lines table
          })
          .select();

        if (insertError) {
          console.error(`❌ Error inserting service ${sl.code}:`, insertError);
          insertResults.push({ code: sl.code, success: false, error: insertError });
        } else {
          console.log(`✅ Successfully assigned service: ${sl.code} (${sl.name})`);
          insertResults.push({ code: sl.code, success: true, data });
        }
      }

      const failedInserts = insertResults.filter(r => !r.success);
      const successfulInserts = insertResults.filter(r => r.success);

      // Only delete old assignments if we successfully inserted at least one
      if (successfulInserts.length > 0) {
        // Get IDs of services we just inserted
        const newServiceLineIds = successfulInserts.map(r => r.data?.[0]?.service_line_id).filter(Boolean);
        
        // Delete old assignments that aren't in our new list
        const { error: deleteError } = await supabase
          .from('client_service_lines')
          .delete()
          .eq('client_id', clientId)
          .not('service_line_id', 'in', `(${newServiceLineIds.join(',')})`);

        if (deleteError) {
          console.error('❌ Error cleaning up old assignments:', deleteError);
          // Don't throw - new assignments are already in place
        } else {
          console.log('✅ Cleaned up old assignments');
        }
      } else {
        console.error('❌ No services were successfully inserted. Not deleting old assignments to prevent data loss.');
        alert(`Error: Failed to assign any services. Old assignments preserved. Check console for details.`);
        return;
      }

      if (failedInserts.length > 0) {
        console.error('❌ Failed to assign some services:', failedInserts);
        alert(`Warning: Failed to assign some services: ${failedInserts.map(f => f.code).join(', ')}. Check console for details.`);
      }

      // Update client status (only if we have successful assignments)
      if (successfulInserts.length > 0) {
        const { error: updateError } = await supabase
          .from('practice_members')
          .update({ program_status: 'enrolled' })
          .eq('id', clientId);

        if (updateError) {
          console.error('❌ Error updating client status:', updateError);
          // Don't throw - service assignment succeeded
        }
      }

      console.log('✅ Service assignment complete:', {
        totalSelected: selectedServices.length,
        foundInDB: serviceLines.length,
        successfullyAssigned: successfulInserts.length,
        failed: failedInserts.length
      });

      alert(`Services assigned successfully! ${successfulInserts.length} of ${serviceLines.length} services assigned.`);
      onRefresh();
    } catch (error) {
      console.error('❌ Error assigning services:', error);
      alert(`Failed to assign services: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    } finally {
      setAssigningServices(false);
    }
  };

  // Parse discovery responses for display
  const getDiscoveryResponses = () => {
    if (!discovery?.responses) return [];
    
    const responses = discovery.responses;
    const grouped: Record<string, any[]> = {};
    
    Object.entries(responses).forEach(([key, value]) => {
      // Extract section from question ID (e.g., dd_dream_1 -> The Dream)
      let section = 'Other';
      if (key.includes('dream')) section = 'The Dream';
      else if (key.includes('gap')) section = 'The Gap';
      else if (key.includes('tuesday')) section = 'Tuesday Reality';
      else if (key.includes('real')) section = 'The Real Question';
      else if (key.includes('financial')) section = 'Financial Clarity';
      else if (key.includes('operational')) section = 'Operational Freedom';
      else if (key.includes('strategic')) section = 'Strategic Direction';
      else if (key.includes('growth')) section = 'Growth Readiness';
      else if (key.includes('exit')) section = 'Exit & Protection';
      
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push({ key, value });
    });
    
    return grouped;
  };

  const responseGroups = getDiscoveryResponses();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              {loading ? (
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900">{client?.name}</h2>
                  <p className="text-sm text-gray-500">
                    {client?.client_company || client?.email} • Discovery {discovery?.completed_at ? 'Complete' : 'In Progress'}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport || !discovery?.completed_at}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {generatingReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {generatedReport ? 'Regenerate' : 'Generate Report'}
                </>
              )}
            </button>
            {generatedReport && (
              <>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={handleShareReport}
                  disabled={sharingReport}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isReportShared 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sharingReport ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isReportShared ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Shared with Client
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share with Client
                    </>
                  )}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'responses', label: 'Responses', icon: MessageSquare },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'context', label: 'Context Notes', icon: Calendar },
            { id: 'analysis', label: 'Analysis', icon: Sparkles },
            { id: 'services', label: 'Assign Services', icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
            </div>
          ) : (
            <>
              {/* RESPONSES TAB */}
              {activeTab === 'responses' && (
                <div className="space-y-6">
                  {!discovery ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Discovery not started yet</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary cards */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-cyan-50 rounded-xl p-4">
                          <p className="text-sm text-cyan-600 font-medium">Destination Clarity</p>
                          <p className="text-2xl font-bold text-cyan-900">
                            {discovery.destination_clarity_score || '—'}/10
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4">
                          <p className="text-sm text-amber-600 font-medium">Gap Score</p>
                          <p className="text-2xl font-bold text-amber-900">
                            {discovery.gap_score || '—'}/10
                          </p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4">
                          <p className="text-sm text-emerald-600 font-medium">Completion</p>
                          <p className="text-2xl font-bold text-emerald-900">
                            {discovery.completed_at ? 'Complete' : 'In Progress'}
                          </p>
                        </div>
                      </div>

                      {/* Emotional anchors */}
                      {discovery.extracted_anchors && Object.keys(discovery.extracted_anchors).length > 0 && (
                        <div className="bg-purple-50 rounded-xl p-4">
                          <h4 className="font-medium text-purple-900 mb-2">Extracted Emotional Anchors</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.values(discovery.extracted_anchors).flat().map((anchor: any, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                "{anchor}"
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response sections */}
                      {Object.entries(responseGroups).map(([section, items]) => (
                        <div key={section} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 p-4">
                            <h4 className="font-semibold text-gray-900">{section}</h4>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {items.map(({ key, value }) => (
                              <div key={key} className="p-4">
                                <p className="text-xs text-gray-400 mb-1">{key}</p>
                                <p className="text-gray-900">
                                  {Array.isArray(value) ? value.join(', ') : value || '—'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Recommended services from discovery */}
                      {discovery.recommended_services && (
                        <div className="bg-indigo-50 rounded-xl p-4">
                          <h4 className="font-medium text-indigo-900 mb-3">AI-Recommended Services</h4>
                          <div className="space-y-2">
                            {discovery.recommended_services.map((rec: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{rec.service?.name || rec.code}</p>
                                  <p className="text-sm text-gray-500">{rec.valueProposition?.headline}</p>
                                </div>
                                <span className="text-indigo-600 font-bold">{rec.score}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Uploaded Documents</h4>
                      <p className="text-sm text-gray-500">Financial data, contracts, and supporting information</p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 cursor-pointer text-sm font-medium">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload Files'}
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.filter((doc: any) => {
                        // CRITICAL: Ensure document belongs to this client
                        if (doc.client_id !== clientId) return false;
                        
                        // CRITICAL: Also check storage path matches client_id
                        if (doc.source_file_url) {
                          const pathMatch = doc.source_file_url.match(/\/([a-f0-9-]{36})\/[^/]+\.(pdf|doc|docx|xls|xlsx|csv|txt)/i);
                          if (pathMatch && pathMatch[1] && pathMatch[1] !== clientId) {
                            return false; // Storage path doesn't match current client_id
                          }
                        }
                        
                        return true;
                      }).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-cyan-500" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.content}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <a
                            href={doc.source_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No documents uploaded yet</p>
                      <p className="text-sm text-gray-400 mt-1">Upload financials, contracts, or other relevant files</p>
                    </div>
                  )}
                </div>
              )}

              {/* CONTEXT NOTES TAB */}
              {activeTab === 'context' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Context Notes Timeline</h4>
                      <p className="text-sm text-gray-500">Add dated context that the assessment doesn't capture (funding, launches, key milestones)</p>
                    </div>
                    <button
                      onClick={() => setShowAddNote(!showAddNote)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Note
                    </button>
                  </div>
                  
                  {/* Add Note Form */}
                  {showAddNote && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
                          <select
                            value={newNote.note_type}
                            onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          >
                            <option value="funding">💰 Funding/Investment</option>
                            <option value="milestone">🚀 Product/Business Milestone</option>
                            <option value="customer">🤝 Customer Win/Pilot</option>
                            <option value="team">👥 Team Change</option>
                            <option value="financial">📊 Financial Update</option>
                            <option value="personal">💭 Personal/Founder</option>
                            <option value="strategic">🎯 Strategic Decision</option>
                            <option value="general">📝 General Note</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Importance</label>
                          <select
                            value={newNote.importance}
                            onChange={(e) => setNewNote({ ...newNote, importance: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          >
                            <option value="critical">🔴 Critical - Must include in analysis</option>
                            <option value="high">🟠 High - Important context</option>
                            <option value="medium">🟡 Medium - Good to know</option>
                            <option value="low">🟢 Low - Background info</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                          <input
                            type="date"
                            value={newNote.event_date}
                            onChange={(e) => setNewNote({ ...newNote, event_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 cursor-pointer mt-6">
                            <input
                              type="checkbox"
                              checked={newNote.is_future_event}
                              onChange={(e) => setNewNote({ ...newNote, is_future_event: e.target.checked })}
                              className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                            />
                            <span className="text-sm text-gray-700">This is a future/planned event</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={newNote.title}
                          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                          placeholder="e.g., Closed seed round, Product launching"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                        <textarea
                          value={newNote.content}
                          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                          placeholder="Add context the LLM should know when analyzing this client..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddNote(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNote || !newNote.title || !newNote.content}
                          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Notes Timeline */}
                  {contextNotes.length > 0 ? (
                    <div className="space-y-4">
                      {contextNotes.map((note) => {
                        const typeIcons: Record<string, string> = {
                          funding: '💰',
                          milestone: '🚀',
                          customer: '🤝',
                          team: '👥',
                          financial: '📊',
                          personal: '💭',
                          strategic: '🎯',
                          general: '📝'
                        };
                        const importanceColors: Record<string, string> = {
                          critical: 'border-l-red-500 bg-red-50',
                          high: 'border-l-orange-500 bg-orange-50',
                          medium: 'border-l-yellow-500 bg-yellow-50',
                          low: 'border-l-green-500 bg-green-50'
                        };
                        
                        return (
                          <div 
                            key={note.id} 
                            className={`border-l-4 rounded-lg p-4 ${importanceColors[note.importance] || 'border-l-gray-300 bg-gray-50'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">{typeIcons[note.note_type] || '📝'}</span>
                                  <span className="font-medium text-gray-900">{note.title}</span>
                                  {note.is_future_event && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                      Planned
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-700 text-sm">{note.content}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  {note.event_date && (
                                    <span>
                                      {note.is_future_event ? 'Planned: ' : 'Date: '}
                                      {new Date(note.event_date).toLocaleDateString('en-GB', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  )}
                                  <span>Added: {new Date(note.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                                title="Delete note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No context notes yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add funding updates, milestones, or other context that affects the analysis</p>
                    </div>
                  )}
                </div>
              )}

              {/* ANALYSIS TAB */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {/* Generated Report Section */}
                  {generatedReport && (
                    <div className="space-y-6">
                      {/* Executive Summary */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                        <h3 className="text-lg font-bold mb-2">
                          {generatedReport.analysis?.executiveSummary?.headline || 'Discovery Analysis'}
                        </h3>
                        <p className="text-indigo-100 mb-4">
                          {generatedReport.analysis?.executiveSummary?.keyInsight}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-indigo-200 text-xs">Destination Clarity</p>
                            <p className="text-xl font-bold">{generatedReport.discoveryScores?.clarityScore}/10</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-indigo-200 text-xs">Gap Score</p>
                            <p className="text-xl font-bold">{generatedReport.discoveryScores?.gapScore}/10</p>
                          </div>
                        </div>
                      </div>

                      {/* Gap Analysis */}
                      {generatedReport.analysis?.gapAnalysis && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                          <h4 className="font-semibold text-amber-900 mb-4">Gap Analysis</h4>
                          <div className="space-y-3">
                            {generatedReport.analysis.gapAnalysis.primaryGaps?.map((gap: any, idx: number) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-amber-100">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {gap.category && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                          {gap.category}
                                        </span>
                                      )}
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        gap.urgency === 'high' || gap.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                        gap.urgency === 'medium' || gap.severity === 'high' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {gap.urgency || gap.severity} priority
                                      </span>
                                    </div>
                                    <p className="font-medium text-gray-900">{gap.gap}</p>
                                  </div>
                                </div>
                                
                                {/* Evidence quote */}
                                {gap.evidence && (
                                  <p className="text-sm italic text-indigo-600 bg-indigo-50 p-2 rounded mb-2">
                                    "{gap.evidence}"
                                  </p>
                                )}
                                
                                {/* Impact - handle both old and new formats */}
                                {gap.currentImpact ? (
                                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                    {gap.currentImpact.timeImpact && (
                                      <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">Time Impact</p>
                                        <p className="font-medium">{gap.currentImpact.timeImpact}</p>
                                      </div>
                                    )}
                                    {gap.currentImpact.financialImpact && (
                                      <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">Financial Impact</p>
                                        <p className="font-medium text-red-600">{gap.currentImpact.financialImpact}</p>
                                      </div>
                                    )}
                                    {gap.currentImpact.emotionalImpact && (
                                      <div className="bg-gray-50 p-2 rounded">
                                        <p className="text-xs text-gray-500">Emotional Impact</p>
                                        <p className="font-medium">{gap.currentImpact.emotionalImpact}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : gap.impact && (
                                  <p className="text-sm text-gray-600 mb-2">{gap.impact}</p>
                                )}
                                
                                {gap.rootCause && (
                                  <p className="text-sm text-gray-500 italic">Root cause: {gap.rootCause}</p>
                                )}
                                
                                {gap.ifUnaddressed && (
                                  <p className="text-sm text-red-600 mt-2">
                                    <strong>If not addressed:</strong> {gap.ifUnaddressed}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Cost of Inaction */}
                          {generatedReport.analysis.gapAnalysis.costOfInaction && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <p className="font-medium text-red-800">Cost of Not Acting</p>
                              <p className="text-2xl font-bold text-red-900">
                                {generatedReport.analysis.gapAnalysis.costOfInaction.annualFinancialCost || 
                                 generatedReport.analysis.gapAnalysis.costOfInaction.annual}
                              </p>
                              <p className="text-sm text-red-700">
                                {generatedReport.analysis.gapAnalysis.costOfInaction.description}
                              </p>
                              {generatedReport.analysis.gapAnalysis.costOfInaction.opportunityCost && (
                                <p className="text-sm text-red-600 mt-2">
                                  <strong>Opportunity cost:</strong> {generatedReport.analysis.gapAnalysis.costOfInaction.opportunityCost}
                                </p>
                              )}
                              {generatedReport.analysis.gapAnalysis.costOfInaction.personalCost && (
                                <p className="text-sm text-red-600">
                                  <strong>Personal cost:</strong> {generatedReport.analysis.gapAnalysis.costOfInaction.personalCost}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Transformation Journey (new "travel agent" view) */}
                      {generatedReport.analysis?.transformationJourney?.phases?.length > 0 && (
                        <TransformationJourney 
                          journey={generatedReport.analysis.transformationJourney}
                          investmentSummary={generatedReport.analysis.investmentSummary || {
                            totalFirstYearInvestment: generatedReport.analysis.transformationJourney.totalInvestment,
                            projectedFirstYearReturn: '',
                            paybackPeriod: ''
                          }}
                        />
                      )}

                      {/* Recommended Investments (legacy view - shown if no transformationJourney) */}
                      {!generatedReport.analysis?.transformationJourney?.phases?.length && generatedReport.analysis?.recommendedInvestments && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                          <h4 className="font-semibold text-emerald-900 mb-4">Recommended Investments</h4>
                          {/* Debug: Log what we're trying to render */}
                          {console.log('[UI Debug] Rendering investments:', generatedReport.analysis.recommendedInvestments)}
                          <div className="space-y-4">
                            {generatedReport.analysis.recommendedInvestments.map((inv: any, idx: number) => {
                              console.log(`[UI Debug] Investment ${idx}:`, inv);
                              return (
                              <div key={idx} className="bg-white rounded-xl p-5 border border-emerald-100">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium mb-2">
                                      Priority {inv.priority}
                                    </span>
                                    <h5 className="font-semibold text-lg text-gray-900">{inv.service}</h5>
                                    {inv.recommendedTier && (
                                      <p className="text-sm text-gray-500">{inv.recommendedTier}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    {inv.annualInvestment ? (
                                      <>
                                        <p className="text-xl font-bold text-emerald-600">{inv.annualInvestment}</p>
                                        <p className="text-xs text-gray-500">
                                          {inv.monthlyInvestment ? `(${inv.monthlyInvestment}/month)` : 'per year'}
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-xl font-bold text-emerald-600">{inv.investment || inv.monthlyInvestment}</p>
                                        <p className="text-xs text-gray-500">
                                          {inv.investmentFrequency || 'per month'}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-gray-700 mb-3">{inv.whyThisService}</p>
                                
                                {/* Problems solved with their words */}
                                {inv.problemsSolved && inv.problemsSolved.length > 0 && (
                                  <div className="mb-3 space-y-2">
                                    {inv.problemsSolved.slice(0, 2).map((problem: any, pIdx: number) => (
                                      <div key={pIdx} className="text-sm bg-indigo-50 p-3 rounded">
                                        <p className="font-medium text-indigo-900">{typeof problem === 'string' ? problem : problem.problem}</p>
                                        {problem.theirWords && (
                                          <p className="text-indigo-600 italic mt-1">"{problem.theirWords}"</p>
                                        )}
                                        {problem.expectedResult && (
                                          <p className="text-gray-600 mt-1">→ {problem.expectedResult}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Fallback for old format */}
                                {inv.theirWordsConnection && !inv.problemsSolved && (
                                  <p className="text-sm italic text-indigo-600 bg-indigo-50 p-2 rounded mb-3">
                                    "{inv.theirWordsConnection}"
                                  </p>
                                )}

                                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500">Expected ROI</p>
                                    <p className="font-bold text-emerald-600">{inv.expectedROI?.multiplier} in {inv.expectedROI?.timeframe}</p>
                                    {inv.expectedROI?.calculation && (
                                      <p className="text-xs text-gray-500 mt-1">{inv.expectedROI.calculation}</p>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500">Key Outcomes</p>
                                    {(inv.keyOutcomes || inv.expectedOutcomes) && (
                                      <ul className="text-sm text-gray-700">
                                        {(inv.keyOutcomes || inv.expectedOutcomes).slice(0, 3).map((outcome: any, oIdx: number) => (
                                          <li key={oIdx} className="flex items-start gap-1">
                                            <span className="text-emerald-500">✓</span>
                                            <span>{typeof outcome === 'string' ? outcome : outcome.outcome}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Implementation Plan Preview */}
                                {inv.implementationPlan && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-2">Implementation Plan</p>
                                    <div className="flex gap-2 text-xs">
                                      {inv.implementationPlan.phase1 && (
                                        <span className="bg-gray-100 px-2 py-1 rounded">
                                          Weeks {inv.implementationPlan.phase1.weeks}: {inv.implementationPlan.phase1.focus}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                            })}
                          </div>

                          {/* Investment Summary */}
                          {generatedReport.analysis.investmentSummary && (
                            <div className="mt-6 p-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white">
                              <h5 className="font-semibold mb-3">Investment Summary</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-emerald-100 text-sm">Total First Year Investment</p>
                                  <p className="text-2xl font-bold">
                                    {generatedReport.analysis.investmentSummary.totalFirstYearInvestment || 
                                     generatedReport.analysis.investmentSummary.totalMonthlyInvestment}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-emerald-100 text-sm">Projected First Year Return</p>
                                  <p className="text-2xl font-bold">
                                    {generatedReport.analysis.investmentSummary.projectedFirstYearReturn ||
                                     generatedReport.analysis.investmentSummary.projectedAnnualReturn}
                                  </p>
                                </div>
                              </div>
                              {generatedReport.analysis.investmentSummary.netBenefitYear1 && (
                                <div className="mt-3 p-3 bg-white/10 rounded">
                                  <p className="text-sm">
                                    <strong>Net Benefit Year 1:</strong> {generatedReport.analysis.investmentSummary.netBenefitYear1}
                                  </p>
                                </div>
                              )}
                              <div className="mt-4 pt-3 border-t border-white/20">
                                <p className="text-sm text-emerald-100">
                                  <strong>Payback Period:</strong> {generatedReport.analysis.investmentSummary.paybackPeriod}
                                </p>
                                {generatedReport.analysis.investmentSummary.roiCalculation && (
                                  <p className="text-xs text-emerald-200 mt-2">
                                    {generatedReport.analysis.investmentSummary.roiCalculation}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Next Steps */}
                      {generatedReport.analysis?.recommendedNextSteps && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Recommended Next Steps</h4>
                          <div className="space-y-3">
                            {generatedReport.analysis.recommendedNextSteps.map((step: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  {step.step}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{step.action}</p>
                                  <p className="text-sm text-gray-500">{step.timing} • {step.owner}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Closing Message */}
                      {generatedReport.analysis?.closingMessage && (
                        <div className="bg-slate-800 rounded-xl p-6 text-white">
                          {typeof generatedReport.analysis.closingMessage === 'string' ? (
                            <p className="text-lg text-center">{generatedReport.analysis.closingMessage}</p>
                          ) : (
                            <div className="space-y-4">
                              {generatedReport.analysis.closingMessage.personalNote && (
                                <p className="text-lg text-center italic">
                                  "{generatedReport.analysis.closingMessage.personalNote}"
                                </p>
                              )}
                              {generatedReport.analysis.closingMessage.callToAction && (
                                <p className="text-center font-semibold text-emerald-300">
                                  {generatedReport.analysis.closingMessage.callToAction}
                                </p>
                              )}
                              {generatedReport.analysis.closingMessage.urgencyReminder && (
                                <p className="text-sm text-center text-gray-300">
                                  {generatedReport.analysis.closingMessage.urgencyReminder}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => setGeneratedReport(null)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Hide Report
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notes Section (show when no report or always show below) */}
                  {!generatedReport && (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Internal Analysis Notes</h4>
                        <p className="text-sm text-gray-500 mb-4">
                          Record your observations and analysis of this client's discovery responses
                        </p>
                        <textarea
                          value={analysisNotes}
                          onChange={(e) => setAnalysisNotes(e.target.value)}
                          rows={10}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                          placeholder="Key observations, pain points identified, recommended approach..."
                        />
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={handleSaveNotes}
                            disabled={savingNotes}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 text-sm font-medium"
                          >
                            {savingNotes ? 'Saving...' : 'Save Notes'}
                          </button>
                        </div>
                      </div>

                      {/* Value propositions from discovery */}
                      {discovery?.value_propositions && (
                        <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 rounded-xl p-6">
                          <h4 className="font-medium text-gray-900 mb-4">Generated Value Propositions</h4>
                          <div className="space-y-4">
                            {Object.entries(discovery.value_propositions).map(([service, vp]: [string, any]) => (
                              <div key={service} className="bg-white rounded-lg p-4">
                                <p className="font-semibold text-gray-900 mb-2">{service}</p>
                                <p className="text-gray-700 text-sm italic">"{vp.headline}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* SERVICES TAB */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assign Service Lines</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Select the services this client should be enrolled in based on their discovery
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {SERVICE_LINES.filter(s => s.code !== 'discovery' && s.status === 'ready').map((service) => {
                      const Icon = service.icon;
                      const isSelected = selectedServices.includes(service.code);
                      const isRecommended = discovery?.recommended_services?.some(
                        (r: any) => r.code === service.code || r.service?.code === service.code
                      );
                      
                      return (
                        <button
                          key={service.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServices(prev => prev.filter(s => s !== service.code));
                            } else {
                              setSelectedServices(prev => [...prev, service.code]);
                            }
                          }}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {isRecommended && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded-full">
                              AI Recommended
                            </span>
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{service.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                              {service.monthlyRevenue > 0 && (
                                <p className="text-xs text-gray-400 mt-1">
                                  ~£{service.monthlyRevenue.toLocaleString()}/month
                                </p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-cyan-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedServices.length > 0 && (
                    <div className="bg-cyan-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-cyan-900">
                          {selectedServices.length} service(s) selected
                        </p>
                        <p className="text-sm text-cyan-700">
                          Client will be notified and onboarding will begin
                        </p>
                      </div>
                      <button
                        onClick={handleAssignServices}
                        disabled={assigningServices}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-medium"
                      >
                        {assigningServices ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Assign Services
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Client Detail Modal with full functionality
function ClientDetailModal({ clientId, serviceLineCode, onClose }: { clientId: string; serviceLineCode: string; onClose: () => void }) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Service-line specific tabs
  const isManagementAccounts = serviceLineCode === 'management_accounts';
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'context' | 'sprint' | 'assessments' | 'documents' | 'analysis'>(
    isManagementAccounts ? 'assessments' : 'overview'
  );
  
  // MA-specific state
  const [generatingMAInsights, setGeneratingMAInsights] = useState(false);
  const [maInsights, setMAInsights] = useState<any>(null);
  
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
  // Regenerate state (no longer using selective options - regenerates all stages)
  const [regenerating, setRegenerating] = useState(false);
  
  // Sprint editing state
  const [editingTask, setEditingTask] = useState<{weekNumber: number, taskId: string, original: any} | null>(null);
  const [editedTask, setEditedTask] = useState<{title: string, description: string}>({ title: '', description: '' });
  const [savingTask, setSavingTask] = useState(false);

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

      // First, try to fetch from new staged architecture (roadmap_stages)
      const { data: stagesData, error: stagesError } = await supabase
        .from('roadmap_stages')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['published', 'approved', 'generated'])
        .order('created_at', { ascending: true });

      console.log('[fetchClientDetail] roadmap_stages result:', { 
        count: stagesData?.length || 0, 
        error: stagesError,
        stageTypes: stagesData?.map(s => `${s.stage_type}:${s.status}`) || []
      });

      let roadmap: any = null;
      let roadmapNeedsRegeneration = false;

      // If we have staged data, build roadmap from it
      if (stagesData && stagesData.length > 0) {
        const stagesMap: Record<string, any> = {};
        stagesData.forEach(stage => {
          const content = stage.approved_content || stage.generated_content;
          if (content) {
            stagesMap[stage.stage_type] = content;
          }
        });

        // Build roadmap data structure from stages
        const roadmapData: any = {};
        
        if (stagesMap['fit_assessment']) {
          roadmapData.fitProfile = stagesMap['fit_assessment'];
        }
        if (stagesMap['five_year_vision']) {
          roadmapData.fiveYearVision = stagesMap['five_year_vision'];
        }
        if (stagesMap['six_month_shift']) {
          roadmapData.sixMonthShift = stagesMap['six_month_shift'];
        }
        // Handle both old sprint_plan and new split sprint_plan_part1/part2
        if (stagesMap['sprint_plan']) {
          roadmapData.sprint = stagesMap['sprint_plan'];
        } else if (stagesMap['sprint_plan_part2']) {
          roadmapData.sprint = stagesMap['sprint_plan_part2'];
        } else if (stagesMap['sprint_plan_part1']) {
          roadmapData.sprint = stagesMap['sprint_plan_part1'];
        }

        const valueAnalysis = stagesMap['value_analysis'] || null;

        console.log('[fetchClientDetail] Built roadmap from stages:', {
          hasVision: !!roadmapData.fiveYearVision,
          hasShift: !!roadmapData.sixMonthShift,
          hasSprint: !!roadmapData.sprint,
          hasValueAnalysis: !!valueAnalysis
        });

        roadmap = {
          id: stagesData[0].id,
          roadmap_data: roadmapData,
          value_analysis: valueAnalysis,
          created_at: stagesData[0].created_at,
          status: 'generated' // Staged data is generated
        };
      } else {
        // Fallback to old client_roadmaps table
        console.log('[fetchClientDetail] No staged data, falling back to client_roadmaps');
        const { data: legacyRoadmap } = await supabase
          .from('client_roadmaps')
          .select('id, roadmap_data, value_analysis, created_at, status')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (legacyRoadmap) {
          roadmap = legacyRoadmap;
        }
      }
      
      // Check if roadmap contains data that doesn't match client (e.g., fitness data for non-fitness client)
      if (roadmap && roadmap.roadmap_data && clientData) {
        const roadmapText = JSON.stringify(roadmap.roadmap_data).toLowerCase();
        const clientEmail = (clientData.email || '').toLowerCase();
        const clientName = (clientData.name || '').toLowerCase();
        
        // Check for fitness/rowing keywords
        const hasFitnessData = roadmapText.includes('fitness equipment') || 
                               roadmapText.includes('rowing') || 
                               roadmapText.includes('rowgear');
        
        // Check if client is NOT in fitness industry
        const isFitnessClient = clientEmail.includes('rowgear') || 
                                clientEmail.includes('fitness') || 
                                clientName.includes('tom');
        
        if (hasFitnessData && !isFitnessClient) {
          roadmapNeedsRegeneration = true;
          console.warn(`⚠️ Roadmap for ${clientData.email} contains fitness/rowing data but client is not in fitness industry. Roadmap needs regeneration.`);
        }
      }

      // Fetch assessment responses (discovery assessments)
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('assessment_type, responses, status, completed_at')
        .eq('client_id', clientId)
        .in('assessment_type', ['part1', 'part2', 'part3']);

      // Fetch service line assessments (management_accounts, 365_method, etc.)
      const { data: serviceAssessments } = await supabase
        .from('service_line_assessments')
        .select('id, service_line_code, responses, completion_percentage, completed_at, extracted_insights, started_at, updated_at')
        .eq('client_id', clientId);

      // Convert service line assessments to same format as discovery assessments
      const formattedServiceAssessments = (serviceAssessments || []).map((sa: any) => ({
        assessment_type: sa.service_line_code,
        responses: sa.responses,
        status: sa.completed_at ? 'completed' : (sa.completion_percentage > 0 ? 'in_progress' : 'not_started'),
        completed_at: sa.completed_at,
        extracted_insights: sa.extracted_insights,
        completion_percentage: sa.completion_percentage,
        is_service_line: true // Flag to distinguish in UI
      }));

      // Combine all assessments
      const allAssessments = [...(assessments || []), ...formattedServiceAssessments];

      const { data: context } = await supabase
        .from('client_context')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      // Fetch client tasks with completion feedback
      const { data: clientTasks } = await supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('week_number', { ascending: true })
        .order('sort_order', { ascending: true });

      // Filter context for documents
      const documents = (context || []).filter((c: any) => c.context_type === 'document');
      
      setClient({
        ...clientData,
        roadmap: roadmap ? {
          id: roadmap.id,
          roadmap_data: roadmap.roadmap_data,
          value_analysis: roadmap.value_analysis,
          created_at: roadmap.created_at,
          status: roadmap.status || 'pending_review',
          needsRegeneration: roadmapNeedsRegeneration
        } : null,
        assessments: allAssessments,
        context: context || [],
        documents: documents,
        tasks: clientTasks || []
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

  // Handle adding task feedback to context
  const handleAddFeedbackToContext = async (task: any, feedback: any, weekNumber: number) => {
    try {
      const contextContent = `TASK COMPLETION FEEDBACK - Week ${weekNumber}
Task: ${task.title}

✅ What went well:
${feedback.whatWentWell || 'No comment'}

⚠️ What didn't work:
${feedback.whatDidntWork || 'No comment'}

📝 Additional notes:
${feedback.additionalNotes || 'No additional notes'}

Submitted: ${feedback.submittedAt ? new Date(feedback.submittedAt).toLocaleDateString() : 'Unknown date'}`;

      const { error } = await supabase
        .from('client_context')
        .insert({
          client_id: clientId,
          practice_id: currentMember?.practice_id,
          context_type: 'task_feedback',
          content: contextContent,
          source_type: 'client_feedback',
          priority: feedback.whatDidntWork ? 'high' : 'normal',
          created_by: user?.id
        });

      if (error) throw error;

      // Mark feedback as reviewed
      const dbTask = client?.tasks?.find((t: any) => t.title === task.title && t.week_number === weekNumber);
      if (dbTask) {
        await supabase
          .from('client_tasks')
          .update({ 
            feedback_reviewed: true,
            feedback_reviewed_by: user?.id
          })
          .eq('id', dbTask.id);
      }

      await fetchClientDetail();
      alert('Feedback added to context for future generations');
    } catch (error) {
      console.error('Error adding feedback to context:', error);
      alert('Failed to add feedback to context');
    }
  };

  // ================================================================
  // ROADMAP PIPELINE CONTROLS (staged architecture)
  // ================================================================
  
  // State for pipeline controls
  const [resuming, setResuming] = useState(false);

  // Check pipeline status
  const handleCheckPipelineStatus = async () => {
    if (!clientId) return;
    
    try {
      const response = await supabase.functions.invoke('roadmap-orchestrator', {
        body: { action: 'status', clientId }
      });
      
      if (response.error) {
        console.error('Status check error:', response.error);
        alert('Failed to check status: ' + response.error.message);
        return;
      }
      
      console.log('Pipeline status:', response.data);

      // Show cleaner status
      const data = response.data;
      const completedCount = data.completed?.length || 0;
      const inProgress = data.inProgress?.length > 0 ? `\n🔄 In Progress: ${data.inProgress.join(', ')}` : '';
      const missing = data.missing?.length > 0 ? `\n⏳ Remaining: ${data.missing.join(', ')}` : '';
      
      alert(`Pipeline Status: ${completedCount}/6 stages\n\n${data.summary}${inProgress}${missing}`);
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  // Resume from last successful stage
  const handleResumePipeline = async () => {
    if (!clientId || !client?.practice_id) return;
    
    if (!confirm('This will resume the roadmap generation from the last successful stage. Continue?')) return;
    
    setResuming(true);
    
    try {
      const response = await supabase.functions.invoke('roadmap-orchestrator', {
        body: { action: 'resume', clientId, practiceId: client.practice_id }
      });
      
      if (response.error) {
        console.error('Resume error:', response.error);
        alert('Failed to resume: ' + response.error.message);
        return;
      }
      
      console.log('Resume response:', response.data);
      
      if (response.data.message === 'Pipeline already complete') {
        alert('Pipeline is already complete! All stages have been generated.');
        return;
      }
      
      // Now call orchestrator to process
      await supabase.functions.invoke('roadmap-orchestrator', {
        body: { action: 'process' }
      });
      
      alert(`Resumed! ${response.data.message}\n\nThe pipeline is now processing. Refresh in a moment to see progress.`);
      
      // Refresh client data
      await fetchClientDetail();
    } catch (error) {
      console.error('Resume error:', error);
      alert('Failed to resume: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setResuming(false);
    }
  };

  // Full regenerate from scratch
  const handleRegenerate = async () => {
    if (!client?.practice_id || !clientId) return;
    
    const unprocessedContext = client.context?.filter((c: any) => !c.processed) || [];
    const contextMsg = unprocessedContext.length > 0 
      ? `\n${unprocessedContext.length} new context item(s) will be incorporated.` 
      : '';
    
    if (!confirm(`This will regenerate all roadmap stages (Fit Assessment, 5-Year Vision, 6-Month Shift, 12-Week Sprint, and Value Analysis). The process will start immediately and run through all stages automatically. This may take 2-3 minutes.${contextMsg}\n\nContinue?`)) return;
    
    setRegenerating(true);
    
    try {
      console.log('=== REGENERATE ROADMAP CALLED ===');
      console.log('clientId:', clientId);
      console.log('practiceId:', client.practice_id);

      // Clear any existing pending items for this client
      await supabase
        .from('generation_queue')
        .delete()
        .eq('client_id', clientId)
        .eq('status', 'pending');

      // Queue only the first stage - the rest will be auto-queued by database triggers
      const { error: queueError } = await supabase
        .from('generation_queue')
        .insert({
          practice_id: client.practice_id,
          client_id: clientId,
          stage_type: 'fit_assessment', // Start with the first stage
          priority: 10 // High priority for manual regeneration
        })
        .select()
        .single();

      if (queueError) {
        console.error('Error queueing first stage:', queueError);
        throw new Error(`Failed to queue regeneration: ${queueError.message}`);
      }

      console.log('✓ Queued fit_assessment successfully');

      // Small delay to ensure the queue item is committed and visible
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call orchestrator to process the queue
      // The orchestrator will process fit_assessment first, which triggers the next stage via database trigger
      // Then it continues processing the rest of the chain automatically
      try {
        console.log('🚀 Triggering orchestrator to start processing...');
        
        const orchestratorResponse = await supabase.functions.invoke(
          'roadmap-orchestrator',
          {
            body: {}
          }
        );

        console.log('Orchestrator response:', orchestratorResponse);

        if (orchestratorResponse.error) {
          console.warn('⚠️ Orchestrator returned error (non-fatal):', orchestratorResponse.error);
          // Queue is set up, so this is non-fatal - stages will be processed
        } else {
          console.log('✅ Orchestrator started successfully:', orchestratorResponse.data);
          if (orchestratorResponse.data?.processed?.length === 0) {
            console.log('ℹ️ No items processed yet - the queue item may be processing or there may be a dependency issue');
          }
        }
      } catch (invokeError: any) {
        // FunctionsFetchError or other errors - log but don't fail
        console.error('❌ Orchestrator invocation error (queue is set up, this is OK):', invokeError);
        console.error('Error details:', {
          message: invokeError?.message,
          name: invokeError?.name,
          type: typeof invokeError
        });
        // Don't throw - queue is set up and will be processed
      }

      // Refresh client data
      await fetchClientDetail();
      
      alert('Roadmap regeneration started! The process is running through all stages automatically. This may take 2-3 minutes. You can refresh the page in a few moments to see progress.');
    } catch (error) {
      console.error('Error regenerating roadmap:', error);
      alert(`Failed to start roadmap regeneration: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
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

            {/* Pipeline Control Buttons */}
            {client?.roadmap && (
              <>
                {/* Check Status Button */}
                <button
                  onClick={handleCheckPipelineStatus}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 text-sm font-medium"
                  title="Check pipeline status"
                >
                  <Clock className="w-4 h-4" />
                  Status
                </button>

                {/* Resume Button */}
                <button
                  onClick={handleResumePipeline}
                  disabled={resuming || regenerating}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-emerald-300 text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:bg-emerald-50 disabled:opacity-50 text-sm font-medium"
                  title="Resume from last successful stage"
                >
                  {resuming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      Resume
                    </>
                  )}
                </button>

                {/* Full Regenerate Button */}
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating || resuming}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 text-sm font-medium"
                  title="Regenerate entire roadmap from scratch"
                >
                  {regenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Regenerate All
                    </>
                  )}
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs - different for Management Accounts vs other service lines */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {(isManagementAccounts 
            ? ['assessments', 'documents', 'analysis'] 
            : ['overview', 'roadmap', 'assessments', 'context', 'sprint']
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
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
              {tab === 'documents' && client?.documents?.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {client.documents.length}
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

              {/* ASSESSMENTS TAB */}
              {activeTab === 'assessments' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Data Source:</strong> This is the raw assessment data used to generate the roadmap. 
                      The system extracts information from these responses to build the transformation plan.
                    </p>
                  </div>
                  
                  {client?.assessments && client.assessments.length > 0 ? (
                    client.assessments.map((assessment: any) => {
                      // Format title based on assessment type
                      const isServiceLine = assessment.is_service_line;
                      const title = isServiceLine 
                        ? assessment.assessment_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) + ' Assessment'
                        : `Part ${assessment.assessment_type.replace('part', '')} Assessment`;
                      
                      return (
                        <div key={assessment.assessment_type} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <div className={`px-6 py-4 border-b border-gray-200 ${isServiceLine ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {title}
                                </h3>
                                {isServiceLine && (
                                  <span className="text-xs text-indigo-600 font-medium">Service Line Assessment</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {assessment.completion_percentage !== undefined && assessment.status !== 'completed' && (
                                  <span className="text-sm text-gray-500">
                                    {assessment.completion_percentage}% complete
                                  </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  assessment.status === 'completed' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : assessment.status === 'in_progress'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {assessment.status || 'in_progress'}
                                </span>
                              </div>
                            </div>
                            {assessment.completed_at && (
                              <p className="text-sm text-gray-500 mt-1">
                                Completed: {new Date(assessment.completed_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="p-6">
                            {assessment.extracted_insights && Object.keys(assessment.extracted_insights).length > 0 && (
                              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <h4 className="text-sm font-semibold text-emerald-800 mb-2">Extracted Insights</h4>
                                <pre className="text-sm text-emerald-700 whitespace-pre-wrap">
                                  {JSON.stringify(assessment.extracted_insights, null, 2)}
                                </pre>
                              </div>
                            )}
                            <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm text-gray-700 max-h-96 overflow-y-auto">
                              {JSON.stringify(assessment.responses, null, 2)}
                            </pre>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No assessment data found</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Assessment responses will appear here once the client completes their assessments.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTS TAB (Management Accounts) */}
              {activeTab === 'documents' && isManagementAccounts && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Document Upload:</strong> Upload management accounts, financial statements, or other documents. 
                      The system will extract key metrics to inform the AI analysis.
                    </p>
                  </div>

                  {/* Upload Section */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                      <input
                        type="file"
                        id="ma-document-upload"
                        multiple
                        accept=".pdf,.xlsx,.xls,.csv"
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          await handleMultiFileUpload(files);
                        }}
                      />
                      <label htmlFor="ma-document-upload" className="cursor-pointer">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Drop files here or click to upload</p>
                        <p className="text-sm text-gray-400">PDF, Excel, or CSV files</p>
                      </label>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
                    </div>
                    <div className="p-6">
                      {client?.documents && client.documents.length > 0 ? (
                        <div className="space-y-3">
                          {client.documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{doc.content?.split('/').pop() || 'Document'}</p>
                                  <p className="text-sm text-gray-500">
                                    Uploaded {new Date(doc.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                doc.processed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {doc.processed ? 'Processed' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No documents uploaded yet</p>
                          <p className="text-sm text-gray-400 mt-2">Upload management accounts to enable AI analysis</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ANALYSIS TAB (Management Accounts) */}
              {activeTab === 'analysis' && isManagementAccounts && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <p className="text-sm text-indigo-800">
                      <strong>AI Analysis:</strong> Generate narrative insights from the client's assessment and uploaded documents.
                      The analysis connects financial data to the client's goals and concerns.
                    </p>
                  </div>

                  {/* Generate Analysis Button */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Generate Insights</h3>
                        <p className="text-sm text-gray-500">
                          Create AI-powered narrative analysis based on assessment and documents
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          setGeneratingMAInsights(true);
                          try {
                            const { data, error } = await supabase.functions.invoke('generate-ma-insights', {
                              body: {
                                clientId: clientId,
                                practiceId: client?.practice_id
                              }
                            });
                            if (error) throw error;
                            setMAInsights(data);
                            alert('MA insights generated successfully!');
                            await fetchClientDetail();
                          } catch (error: any) {
                            console.error('Error generating MA insights:', error);
                            alert('Failed to generate insights: ' + error.message);
                          } finally {
                            setGeneratingMAInsights(false);
                          }
                        }}
                        disabled={generatingMAInsights}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
                      >
                        {generatingMAInsights ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            Generate Analysis
                          </>
                        )}
                      </button>
                    </div>

                    {/* Prerequisites Check */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div className={`p-3 rounded-lg ${client?.assessments?.some((a: any) => a.assessment_type === 'management_accounts' && a.status === 'completed') ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-sm font-medium">Assessment</p>
                        <p className={`text-xs ${client?.assessments?.some((a: any) => a.assessment_type === 'management_accounts' && a.status === 'completed') ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {client?.assessments?.some((a: any) => a.assessment_type === 'management_accounts' && a.status === 'completed') ? '✓ Completed' : '○ Pending'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${client?.documents?.length > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-sm font-medium">Documents</p>
                        <p className={`text-xs ${client?.documents?.length > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {client?.documents?.length > 0 ? `✓ ${client.documents.length} uploaded` : '○ None uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Existing Insights */}
                  {maInsights && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                        <h3 className="text-lg font-semibold text-white">Latest Insights</h3>
                      </div>
                      <div className="p-6">
                        <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm text-gray-700 max-h-96 overflow-y-auto whitespace-pre-wrap">
                          {JSON.stringify(maInsights, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ROADMAP TAB */}
              {activeTab === 'roadmap' && (
                <div className="space-y-6">
                  {client?.roadmap ? (
                    <>
                      {/* Warning if roadmap needs regeneration */}
                      {client.roadmap.needsRegeneration && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 text-amber-600 mt-0.5">⚠️</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-900 mb-1">
                                Roadmap Data Integrity Issue Detected
                              </p>
                              <p className="text-sm text-amber-700 mb-3">
                                This roadmap appears to contain data that doesn't match this client (e.g., fitness/rowing industry data for a non-fitness client). 
                                This likely occurred because the roadmap was generated before assessment data was corrected.
                              </p>
                              <button
                                onClick={() => {
                                  if (confirm('Regenerate this roadmap with the correct assessment data? This will replace the current roadmap.')) {
                                    handleRegenerate();
                                  }
                                }}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                              >
                                Regenerate Roadmap Now
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Roadmap Status and Actions */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Roadmap Status</p>
                          <p className="text-lg font-semibold text-gray-900 capitalize">
                            {client.roadmap.status || 'pending_review'}
                          </p>
                        </div>
                        {client.roadmap.status !== 'published' && (
                          <button
                            onClick={async () => {
                              if (!confirm('Mark this roadmap as ready and send email notification to client?')) return;
                              
                              try {
                                // Update roadmap status to published
                                const { error: updateError } = await supabase
                                  .from('client_roadmaps')
                                  .update({ status: 'published' })
                                  .eq('id', client.roadmap.id);
                                
                                if (updateError) throw updateError;
                                
                                // Send email notification
                                const { error: emailError } = await supabase.functions.invoke('notify-roadmap-ready', {
                                  body: {
                                    roadmapId: client.roadmap.id,
                                    clientId: clientId
                                  }
                                });
                                
                                if (emailError) {
                                  console.error('Email error:', emailError);
                                  alert('Roadmap marked as ready, but email failed to send. Please check logs.');
                                } else {
                                  alert('Roadmap marked as ready and email sent to client!');
                                }
                                
                                // Refresh client data
                                await fetchClientDetail();
                              } catch (error) {
                                console.error('Error marking roadmap as ready:', error);
                                alert('Failed to mark roadmap as ready. Please try again.');
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                          >
                            Mark as Ready & Send Email
                          </button>
                        )}
                        {client.roadmap.status === 'published' && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                            ✓ Published
                          </span>
                        )}
                      </div>
                      
                      {/* Fit Profile (North Star) */}
                      {client.roadmap.roadmap_data?.fitProfile && (
                        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
                          <h3 className="font-semibold text-cyan-900 mb-3 flex items-center gap-2">
                            <Compass className="w-5 h-5" />
                            Their North Star
                          </h3>
                          <p className="text-cyan-900 text-lg font-medium italic mb-4">
                            "{client.roadmap.roadmap_data.fitProfile.northStar || 'Not yet defined'}"
                          </p>
                          {client.roadmap.roadmap_data.fitProfile.tagline && (
                            <p className="text-sm text-cyan-700 mb-4 font-medium">
                              {client.roadmap.roadmap_data.fitProfile.tagline}
                            </p>
                          )}
                          {client.roadmap.roadmap_data.fitProfile.openingReflection && (
                            <div className="mt-4 pt-4 border-t border-cyan-200">
                              <h4 className="text-sm font-medium text-cyan-800 mb-2">Opening Reflection</h4>
                              <p className="text-sm text-cyan-700 whitespace-pre-line leading-relaxed">
                                {client.roadmap.roadmap_data.fitProfile.openingReflection}
                              </p>
                            </div>
                          )}
                          {client.roadmap.roadmap_data.fitProfile.archetype && (
                            <div className="mt-4 flex items-center gap-2">
                              <span className="px-3 py-1 bg-cyan-200 text-cyan-800 rounded-full text-xs font-medium capitalize">
                                {client.roadmap.roadmap_data.fitProfile.archetype.replace('_', ' ')}
                              </span>
                              {client.roadmap.roadmap_data.fitProfile.archetypeExplanation && (
                                <span className="text-xs text-cyan-600">
                                  {client.roadmap.roadmap_data.fitProfile.archetypeExplanation}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5-Year Vision with Transformation Narrative */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                        <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          5-Year Vision
                        </h3>
                        <p className="text-indigo-800 text-lg font-medium mb-4">
                          {client.roadmap.roadmap_data?.fiveYearVision?.tagline || 'Vision not generated'}
                        </p>
                        
                        {/* Transformation Narrative */}
                        {client.roadmap.roadmap_data?.fiveYearVision?.transformationNarrative && (
                          <div className="space-y-4 mt-4 pt-4 border-t border-indigo-200">
                            {client.roadmap.roadmap_data.fiveYearVision.transformationNarrative.currentReality && (
                              <div>
                                <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Current Reality</h4>
                                <p className="text-sm text-indigo-800 leading-relaxed">
                                  {client.roadmap.roadmap_data.fiveYearVision.transformationNarrative.currentReality}
                                </p>
                              </div>
                            )}
                            {client.roadmap.roadmap_data.fiveYearVision.transformationNarrative.turningPoint && (
                              <div>
                                <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">The Turning Point</h4>
                                <p className="text-sm text-indigo-800 leading-relaxed">
                                  {client.roadmap.roadmap_data.fiveYearVision.transformationNarrative.turningPoint}
                                </p>
                              </div>
                            )}
                            {client.roadmap.roadmap_data.fiveYearVision.transformationNarrative.achievedVision && (
                              <div>
                                <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">The Achieved Vision</h4>
                                <p className="text-sm text-indigo-800 leading-relaxed">
                                  {client.roadmap.roadmap_data.fiveYearVision.transformationNarrative.achievedVision}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Year Milestones */}
                        {client.roadmap.roadmap_data?.fiveYearVision?.yearMilestones && (
                          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-indigo-200">
                            {['year1', 'year3', 'year5'].map((year) => {
                              const milestone = client.roadmap.roadmap_data.fiveYearVision.yearMilestones[year];
                              if (!milestone) return null;
                              return (
                                <div key={year} className="text-center">
                                  <p className="text-xs text-indigo-500 uppercase">Year {year.replace('year', '')}</p>
                                  <p className="text-sm font-medium text-indigo-900">{milestone.headline || milestone.story?.substring(0, 50)}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Legacy format support */}
                        {client.roadmap.roadmap_data?.fiveYearVision?.transformationStory?.currentReality && !client.roadmap.roadmap_data?.fiveYearVision?.transformationNarrative && (
                          <div className="mt-4 pt-4 border-t border-indigo-200">
                            <p className="text-sm text-indigo-700">
                              {client.roadmap.roadmap_data.fiveYearVision.transformationStory.currentReality.narrative}
                            </p>
                          </div>
                        )}
                      </div>

                      {client.roadmap.roadmap_data?.sixMonthShift && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            6-Month Shift
                          </h3>
                          <p className="text-amber-800 font-medium mb-4 text-lg">
                            {client.roadmap.roadmap_data.sixMonthShift.shiftStatement || client.roadmap.roadmap_data.sixMonthShift.shiftOverview || client.roadmap.roadmap_data.sixMonthShift.overview || 'Shift plan generated'}
                          </p>
                          
                          {/* Key Milestones */}
                          {client.roadmap.roadmap_data.sixMonthShift.keyMilestones && (
                            <div className="space-y-3 mb-4">
                              {client.roadmap.roadmap_data.sixMonthShift.keyMilestones.map((milestone: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 bg-amber-100/50 rounded-lg p-3">
                                  <span className="bg-amber-300 text-amber-900 px-2 py-0.5 rounded text-xs font-bold flex-shrink-0">
                                    M{milestone.targetMonth}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-amber-900 font-medium">{milestone.milestone}</p>
                                    {milestone.measurable && (
                                      <p className="text-xs text-amber-700 mt-1">Target: {milestone.measurable}</p>
                                    )}
                                    {milestone.whyItMatters && (
                                      <p className="text-xs text-amber-600 mt-1 italic">{milestone.whyItMatters}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tuesday Evolution */}
                          {client.roadmap.roadmap_data.sixMonthShift.tuesdayEvolution && (
                            <div className="mt-4 pt-4 border-t border-amber-200">
                              <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Tuesday Evolution</h4>
                              <div className="space-y-2 text-sm">
                                {Object.entries(client.roadmap.roadmap_data.sixMonthShift.tuesdayEvolution).map(([month, desc]: [string, any]) => (
                                  <div key={month} className="flex items-center gap-2">
                                    <span className="text-amber-500 text-xs font-medium w-16">{month}</span>
                                    <span className="text-amber-800">{desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Wins */}
                          {client.roadmap.roadmap_data.sixMonthShift.quickWins && client.roadmap.roadmap_data.sixMonthShift.quickWins.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-amber-200">
                              <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Quick Wins</h4>
                              <div className="space-y-2">
                                {client.roadmap.roadmap_data.sixMonthShift.quickWins.slice(0, 3).map((qw: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-amber-800">{qw.win || qw}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Value Analysis Summary */}
                      {client.roadmap.value_analysis && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                          <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Value Analysis
                          </h3>

                          {/* The Uncomfortable Truth - Narrative Summary */}
                          {client.roadmap.value_analysis.narrativeSummary && (
                            <div className="bg-purple-100 rounded-lg p-4 mb-4 border-l-4 border-purple-600">
                              <h4 className="text-sm font-bold text-purple-900 mb-2">The Uncomfortable Truth</h4>
                              <p className="text-purple-800 font-medium mb-2">
                                {client.roadmap.value_analysis.narrativeSummary.uncomfortableTruth}
                              </p>
                              {client.roadmap.value_analysis.narrativeSummary.whatThisReallyMeans && (
                                <p className="text-sm text-purple-700 mb-2">
                                  {client.roadmap.value_analysis.narrativeSummary.whatThisReallyMeans}
                                </p>
                              )}
                              {client.roadmap.value_analysis.narrativeSummary.beforeYouDoAnythingElse && (
                                <div className="mt-3 pt-3 border-t border-purple-200">
                                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Before anything else</p>
                                  <p className="text-sm text-purple-900 font-medium">
                                    {client.roadmap.value_analysis.narrativeSummary.beforeYouDoAnythingElse}
                                  </p>
                                </div>
                              )}
                              {client.roadmap.value_analysis.narrativeSummary.theGoodNews && (
                                <div className="mt-3 pt-3 border-t border-purple-200">
                                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">The Good News</p>
                                  <p className="text-sm text-purple-800">
                                    {client.roadmap.value_analysis.narrativeSummary.theGoodNews}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Key Metrics Grid */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center bg-white rounded-lg p-3">
                              <p className="text-3xl font-bold text-purple-600">
                                {client.roadmap.value_analysis.overallScore || '—'}/100
                              </p>
                              <p className="text-xs text-purple-700">Business Score</p>
                            </div>
                            <div className="text-center bg-white rounded-lg p-3">
                              <p className="text-3xl font-bold text-green-600">
                                £{(client.roadmap.value_analysis.totalOpportunity || client.roadmap.value_analysis.businessValuation?.currentValue || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-purple-700">
                                {client.roadmap.value_analysis.totalOpportunity ? 'Opportunity' : 'Current Value'}
                              </p>
                            </div>
                            <div className="text-center bg-white rounded-lg p-3">
                              <p className="text-3xl font-bold text-red-500">
                                {client.roadmap.value_analysis.riskRegister?.filter((r: any) => r.severity === 'Critical').length || 0}
                              </p>
                              <p className="text-xs text-purple-700">Critical Risks</p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-purple-800">
                            {client.roadmap.value_analysis.scoreInterpretation || 'Analysis complete'}
                          </p>

                          {/* Business Valuation Snapshot */}
                          {client.roadmap.value_analysis.businessValuation && (
                            <div className="mt-4 pt-4 border-t border-purple-200">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-purple-600 text-xs uppercase tracking-wide">Current Valuation</p>
                                  <p className="text-purple-900 font-semibold">
                                    £{(client.roadmap.value_analysis.businessValuation.currentValue || 0).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-purple-600 text-xs uppercase tracking-wide">Potential Valuation</p>
                                  <p className="text-green-700 font-semibold">
                                    £{(client.roadmap.value_analysis.businessValuation.potentialValue || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
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
                                  // View Mode - with task status from database
                                  (() => {
                                    const dbTask = client?.tasks?.find((t: any) => t.title === task.title && t.week_number === week.weekNumber);
                                    const status = dbTask?.status || 'pending';
                                    const feedback = dbTask?.completion_feedback;
                                    
                                    return (
                                      <div className={`p-3 rounded-lg border transition-colors ${
                                        status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
                                        status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                                        'bg-white border-gray-100'
                                      }`}>
                                        <div 
                                          onClick={() => handleEditTask(week.weekNumber, task)}
                                          className="flex items-start gap-3 cursor-pointer hover:opacity-80 group"
                                        >
                                          <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center ${
                                            status === 'completed' ? 'bg-emerald-500 text-white' :
                                            status === 'in_progress' ? 'bg-blue-500 text-white' :
                                            'border-2 border-gray-300'
                                          }`}>
                                            {status === 'completed' && <Check className="w-3 h-3" />}
                                            {status === 'in_progress' && <Clock className="w-3 h-3" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                              <p className={`font-medium ${status === 'completed' ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
                                                {task.title}
                                              </p>
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
                                        
                                        {/* Client Feedback Section */}
                                        {feedback && (feedback.whatWentWell || feedback.whatDidntWork) && (
                                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Client Feedback</p>
                                            {feedback.whatWentWell && (
                                              <div className="bg-emerald-100 rounded p-2">
                                                <p className="text-xs font-medium text-emerald-700">✅ What went well:</p>
                                                <p className="text-sm text-emerald-800 mt-0.5">{feedback.whatWentWell}</p>
                                              </div>
                                            )}
                                            {feedback.whatDidntWork && (
                                              <div className="bg-amber-100 rounded p-2">
                                                <p className="text-xs font-medium text-amber-700">⚠️ What didn't work:</p>
                                                <p className="text-sm text-amber-800 mt-0.5">{feedback.whatDidntWork}</p>
                                              </div>
                                            )}
                                            {feedback.additionalNotes && (
                                              <div className="bg-gray-100 rounded p-2">
                                                <p className="text-xs font-medium text-gray-600">📝 Additional notes:</p>
                                                <p className="text-sm text-gray-700 mt-0.5">{feedback.additionalNotes}</p>
                                              </div>
                                            )}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddFeedbackToContext(task, feedback, week.weekNumber);
                                              }}
                                              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                                            >
                                              <Plus className="w-3 h-3" />
                                              Add to Context
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()
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

