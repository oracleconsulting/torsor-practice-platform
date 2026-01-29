import { useState, useEffect } from 'react';
import type { Page } from '../../types/navigation';
import { Navigation } from '../../components/Navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import { RPGCC_LOGO_LIGHT, RPGCC_LOGO_DARK, RPGCC_COLORS } from '../../constants/brandAssets';
import { 
  TransformationJourney,
  SectionCommentBox,
  useAnalysisComments
} from '../../components/discovery';
import { EnabledByLink } from '../../components/ServiceDetailPopup';
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
  Printer,
  AlertTriangle,
  Award,
  Loader2,
  RefreshCw,
  Save,
  BarChart3,
  Quote,
  Phone
} from 'lucide-react';
import { SAAdminReportView } from '../../components/systems-audit/SAAdminReportView';
import { SAClientReportView } from '../../components/systems-audit/SAClientReportView';
import { BenchmarkingClientReport } from '../../components/benchmarking/client/BenchmarkingClientReport';
import { BenchmarkingAdminView } from '../../components/benchmarking/admin/BenchmarkingAdminView';
import { calculateFounderRisk } from '../../lib/services/benchmarking/founder-risk-calculator';
import { resolveIndustryCode } from '../../lib/services/benchmarking/industry-mapper';

// Management Accounts Report Components (Two-Pass Architecture)
import { MAAdminReportView, MAClientReportView } from '../../components/management-accounts';

// Test Client Panel for testing workflows
import { TestClientPanel } from '../../components/admin/TestClientPanel';

// Accounts Upload for Benchmarking
import { AccountsUploadPanel } from '../../components/benchmarking/admin/AccountsUploadPanel';
import { FinancialDataReviewModal } from '../../components/benchmarking/admin/FinancialDataReviewModal';


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
    name: 'Goal Alignment Programme',
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
    id: 'business_intelligence', 
    code: 'business_intelligence',
    name: 'Business Intelligence',
    description: 'Financial clarity with True Cash position, KPIs, insights, forecasts and scenario modelling',
    icon: LineChart,
    color: 'emerald',
    monthlyRevenue: 650,
    status: 'ready'
  },
  { 
    id: 'hidden_value_audit', 
    code: 'hidden_value_audit',
    name: 'Hidden Value Audit',
    description: 'Identify hidden assets, risks, and opportunities to maximize business value',
    icon: Award,
    color: 'amber',
    monthlyRevenue: 0,
    status: 'ready'
  },
  { 
    id: 'benchmarking', 
    code: 'benchmarking',
    name: 'Benchmarking',
    description: 'Compare your business performance to industry leaders and identify improvement opportunities',
    icon: BarChart3,
    color: 'teal',
    monthlyRevenue: 0,
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
  client_owner_id?: string | null;
  owner?: { id: string; name: string } | null;
  is_test_client?: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
}

export function ClientServicesPage({ currentPage, onNavigate }: ClientServicesPageProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [selectedServiceLine, setSelectedServiceLine] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [assigningOwner, setAssigningOwner] = useState<string | null>(null);
  
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
  
  // Bulk import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportData, setBulkImportData] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportResults, setBulkImportResults] = useState<any>(null);
  const [bulkSendEmails, setBulkSendEmails] = useState(false); // Default: NO auto emails
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string; email: string } | null>(null);

  // Fetch clients when service line is selected
  useEffect(() => {
    if (selectedServiceLine) {
      fetchClients();
    }
  }, [selectedServiceLine]);

  // Fetch staff members for owner assignment dropdown
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!currentMember?.practice_id) return;
      
      const { data } = await supabase
        .from('practice_members')
        .select('id, name, email')
        .eq('practice_id', currentMember.practice_id)
        .neq('member_type', 'client')
        .order('name');
      
      setStaffMembers(data || []);
    };
    
    fetchStaffMembers();
  }, [currentMember?.practice_id]);

  // Handle assigning a client to a staff owner
  const handleAssignOwner = async (clientId: string, ownerId: string | null) => {
    setAssigningOwner(clientId);
    try {
      const { error } = await supabase
        .from('practice_members')
        .update({ client_owner_id: ownerId })
        .eq('id', clientId);
      
      if (error) throw error;
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === clientId 
          ? { 
              ...c, 
              client_owner_id: ownerId,
              owner: ownerId ? staffMembers.find(s => s.id === ownerId) || null : null
            }
          : c
      ));
    } catch (error) {
      console.error('Error assigning owner:', error);
      alert('Failed to assign owner');
    } finally {
      setAssigningOwner(null);
    }
  };

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

  // Bulk import clients from CSV/pasted data
  const handleBulkImport = async () => {
    if (!bulkImportData.trim() || !currentMember?.practice_id) {
      alert('Please paste client data');
      return;
    }

    setBulkImporting(true);
    setBulkImportResults(null);

    try {
      // Parse the pasted data - expecting: Name, Email, Company (optional), Password
      const lines = bulkImportData.trim().split('\n').filter(line => line.trim());
      const clients: Array<{ name: string; email: string; company?: string; password: string }> = [];
      
      for (const line of lines) {
        // Skip header row if present
        if (line.toLowerCase().includes('name') && line.toLowerCase().includes('email')) continue;
        
        // Split by tab or comma
        const parts = line.includes('\t') 
          ? line.split('\t').map(p => p.trim())
          : line.split(',').map(p => p.trim());
        
        if (parts.length >= 2) {
          // Try to detect column order - look for email pattern
          let name = '', email = '', company = '', password = '';
          
          for (const part of parts) {
            if (part.includes('@')) {
              email = part.toLowerCase();
            } else if (!name) {
              name = part;
            } else if (!company && part.length > 0 && !part.match(/^[A-Za-z0-9!@#$%]{8,}$/)) {
              company = part;
            } else if (part.match(/^[A-Za-z0-9!@#$%]{6,}$/)) {
              password = part;
            }
          }
          
          // If no password provided, generate one
          if (!password) {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
            for (let i = 0; i < 10; i++) {
              password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
          }
          
          if (name && email) {
            clients.push({ name, email, company: company || undefined, password });
          }
        }
      }

      if (clients.length === 0) {
        alert('Could not parse any valid clients from the data. Please ensure each line has at least Name and Email.');
        setBulkImporting(false);
        return;
      }

      console.log(`[Bulk Import] Parsed ${clients.length} clients:`, clients);

      const response = await supabase.functions.invoke('bulk-import-clients', {
        body: {
          practiceId: currentMember.practice_id,
          clients,
          sendEmails: bulkSendEmails, // User controls whether to send emails
          portalUrl: 'https://torsor.co.uk/client',
          invitedByName: currentMember.name || 'Your Advisor'
        }
      });

      console.log('[Bulk Import] Response:', response);

      if (response.error) {
        throw response.error;
      }

      setBulkImportResults(response.data);
      
      // Refresh client list
      if (selectedServiceLine) {
        fetchClients();
      }

    } catch (error: any) {
      console.error('[Bulk Import] Error:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setBulkImporting(false);
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
            created_at,
            client_owner_id,
            owner:practice_members!client_owner_id(id, name)
          `)
          .eq('practice_id', practiceId)
          .eq('member_type', 'client')
          .or(`program_status.in.(discovery,discovery_complete,discovery_in_progress),id.in.(${discoveryClientIds.join(',')})`)
          .order('created_at', { ascending: false });

        // Create a map of discoveries for quick lookup
        const discoveryMap = new Map(
          discoveries?.map(d => [d.client_id, d]) || []
        );

        const enrichedClients: Client[] = (discoveryClients || []).map((client: any) => {
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
            hasRoadmap: isComplete,
            client_owner_id: client.client_owner_id,
            owner: client.owner
          };
        });
        
        setClients(enrichedClients);
        setLoading(false);
        return;
      }

      // First, get the service_line_id from the database
      // Handle business_intelligence -> management_accounts fallback during transition
      let lookupCode = serviceLineCode;
      let { data: serviceLineData } = await supabase
        .from('service_lines')
        .select('id')
        .eq('code', lookupCode)
        .single();

      // Fallback: if business_intelligence not found, try management_accounts (legacy)
      if (!serviceLineData && serviceLineCode === 'business_intelligence') {
        console.log('Trying legacy code management_accounts...');
        const { data: legacyData } = await supabase
          .from('service_lines')
          .select('id')
          .eq('code', 'management_accounts')
          .single();
        serviceLineData = legacyData;
        if (legacyData) lookupCode = 'management_accounts';
      }

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

      // For benchmarking, also fetch engagement status
      let benchmarkingEngagements: any[] = [];
      if (serviceLineCode === 'benchmarking') {
        const { data: engagements } = await supabase
          .from('bm_engagements')
          .select('client_id, status')
          .in('client_id', clientIds);
        benchmarkingEngagements = engagements || [];
      }

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
          } else if (serviceLineCode === 'benchmarking') {
            // For benchmarking, check engagement status
            const engagement = benchmarkingEngagements.find(e => e.client_id === client.id);
            if (engagement) {
              // Calculate progress based on engagement status
              if (engagement.status === 'generated' || engagement.status === 'approved' || engagement.status === 'published') {
                progress = 100; // Report generated = 100%
              } else if (engagement.status === 'pass1_complete') {
                progress = 75; // Pass 1 complete = 75%
              } else if (engagement.status === 'assessment_complete') {
                progress = 50; // Assessment complete = 50%
              } else {
                progress = 25; // Engagement started = 25%
              }
            } else if (serviceAssessment?.completed_at) {
              // Assessment complete but no engagement yet
              progress = 50;
            } else {
              progress = serviceAssessment?.completion_percentage || 0;
            }
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

      // Delete from client_reports FIRST (references client_id)
      const { error: clientReportsError } = await supabase
        .from('client_reports')
        .delete()
        .eq('client_id', clientToDelete.id);

      if (clientReportsError) {
        console.error('Error deleting client reports:', clientReportsError);
        // Don't throw - might not exist
      }

      // Delete from client_context (documents, notes, etc.)
      const { error: clientContextError } = await supabase
        .from('client_context')
        .delete()
        .eq('client_id', clientToDelete.id);

      if (clientContextError) {
        console.error('Error deleting client context:', clientContextError);
        // Don't throw - might not exist
      }

      // Delete from audit_advisory_insights (references both destination_discovery and practice_members)
      const { error: auditInsightsError } = await supabase
        .from('audit_advisory_insights')
        .delete()
        .eq('client_id', clientToDelete.id);

      if (auditInsightsError) {
        console.error('Error deleting audit advisory insights:', auditInsightsError);
        // Don't throw - might not exist
      }

      // Delete from discovery_patterns (references destination_discovery)
      const { error: discoveryPatternsError } = await supabase
        .from('discovery_patterns')
        .delete()
        .eq('client_id', clientToDelete.id);

      if (discoveryPatternsError) {
        console.error('Error deleting discovery patterns:', discoveryPatternsError);
        // Don't throw - might not exist
      }

      // Delete from discovery_reports (via discovery_engagements)
      const { data: discoveryEngagementForDelete } = await supabase
        .from('discovery_engagements')
        .select('id')
        .eq('client_id', clientToDelete.id)
        .maybeSingle();
      
      if (discoveryEngagementForDelete) {
        const { error: discoveryReportsError } = await supabase
          .from('discovery_reports')
          .delete()
          .eq('engagement_id', discoveryEngagementForDelete.id);
        
        if (discoveryReportsError) {
          console.error('Error deleting discovery reports:', discoveryReportsError);
        }
        
        const { error: discoveryEngError } = await supabase
          .from('discovery_engagements')
          .delete()
          .eq('id', discoveryEngagementForDelete.id);
        
        if (discoveryEngError) {
          console.error('Error deleting discovery engagement:', discoveryEngError);
        }
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
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowBulkImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Invite Client
            </button>
            </div>
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
              {SERVICE_LINES.filter((service, index, self) => 
                // Remove duplicates by id
                index === self.findIndex(s => s.id === service.id)
              ).map((service) => {
                const Icon = service.icon;
                // Client count will be calculated when service is selected
                const clientCount = 0;
                
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
                      <span className={`text-sm font-medium ${
                        service.status === 'ready' 
                          ? 'text-green-600' 
                          : 'text-gray-500'
                      }`}>
                        {service.status === 'ready' ? '✓ Live' : 'Coming soon'}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {service.status === 'ready' ? clientCount : '–'}
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

            {/* Test Mode Panel */}
            {currentMember?.practice_id && selectedServiceLine && (
              <TestClientPanel
                practiceId={currentMember.practice_id}
                serviceLineCode={selectedServiceLine}
                serviceLineName={SERVICE_LINES.find(s => s.id === selectedServiceLine)?.name || selectedServiceLine}
                onTestClientCreated={(clientId) => {
                  console.log('Test client created:', clientId);
                  fetchClients();
                }}
                onTestClientReset={() => {
                  console.log('Test client reset');
                  fetchClients();
                }}
              />
            )}

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
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Owner</th>
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
                          <div className="flex items-start gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.email}</p>
                            {client.company && (
                              <p className="text-sm text-gray-400">{client.company}</p>
                              )}
                            </div>
                            {client.is_test_client && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                TEST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={client.client_owner_id || ''}
                            onChange={(e) => handleAssignOwner(client.id, e.target.value || null)}
                            disabled={assigningOwner === client.id}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 min-w-[140px]"
                          >
                            <option value="">Unassigned</option>
                            {staffMembers.map(staff => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name}
                              </option>
                            ))}
                          </select>
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
        
        {/* Systems Audit Modal - show Systems Audit view for systems_audit service line */}
        {selectedClient && selectedServiceLine === 'systems_audit' && (
          <SystemsAuditClientModal 
            clientId={selectedClient} 
            onClose={() => setSelectedClient(null)}
          />
        )}
        
        {/* Benchmarking Modal - show Benchmarking view for benchmarking service line */}
        {selectedClient && selectedServiceLine === 'benchmarking' && (
          <BenchmarkingClientModal 
            clientId={selectedClient} 
            onClose={() => setSelectedClient(null)}
          />
        )}
        
        {/* Regular Client Detail Modal for other service lines */}
        {selectedClient && selectedServiceLine && selectedServiceLine !== 'discovery' && selectedServiceLine !== 'systems_audit' && selectedServiceLine !== 'benchmarking' && (
          <ClientDetailModal 
            clientId={selectedClient} 
            serviceLineCode={selectedServiceLine}
            onClose={() => setSelectedClient(null)} 
            onNavigate={onNavigate}
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
                    {SERVICE_LINES.filter((service, index, self) => 
                      // Remove duplicates by id and only show ready services
                      service.status === 'ready' && index === self.findIndex(s => s.id === service.id)
                    ).map((service) => {
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

        {/* Bulk Import Modal */}
        {showBulkImportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bulk Import Clients</h2>
                  <p className="text-sm text-gray-500">Import multiple clients at once for Destination Discovery</p>
                </div>
                <button
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setBulkImportData('');
                    setBulkImportResults(null);
                    setBulkSendEmails(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {!bulkImportResults ? (
                  <>
                    {/* Instructions */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <h3 className="font-medium text-blue-900 mb-2">How to format your data</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Paste data from Excel/Sheets with columns: <strong>Name</strong>, <strong>Email</strong>, and optionally <strong>Company</strong>
                      </p>
                      <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-600 border border-blue-200">
                        <div>Yonas Ackholm	yackholm@hotmail.com	Ackholm Holdings</div>
                        <div>Jeremy Baron	jeremy@baronsec.com	Baron Securities</div>
                        <div>Claude Partridge	claudepartridge@me.com	CEP Developments</div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        ✓ Tab-separated (Excel copy) or comma-separated (CSV)<br />
                        ✓ Passwords will be auto-generated if not provided<br />
                        ✓ Each client will receive a welcome email with their credentials
                      </p>
                    </div>

                    {/* Data Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paste your client data here
                      </label>
                      <textarea
                        value={bulkImportData}
                        onChange={(e) => setBulkImportData(e.target.value)}
                        placeholder="Name	Email	Company (optional)
Yonas Ackholm	yackholm@hotmail.com	Ackholm Holdings
Jeremy Baron	jeremy@baronsec.com	Baron Securities"
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                      />
                    </div>

                    {/* Preview */}
                    {bulkImportData.trim() && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Preview: {bulkImportData.trim().split('\n').filter(l => l.trim() && !l.toLowerCase().includes('name')).length} clients detected
                        </p>
                      </div>
                    )}

                    {/* Email Option */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <h3 className="font-medium text-gray-900">Send welcome emails automatically?</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {bulkSendEmails 
                              ? 'Clients will receive an email with their login credentials'
                              : 'No emails sent - you will share credentials personally'
                            }
                          </p>
                        </div>
                        <div 
                          onClick={() => setBulkSendEmails(!bulkSendEmails)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${bulkSendEmails ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${bulkSendEmails ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </div>
                      </label>
                    </div>

                    {/* What happens */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <h3 className="font-medium text-amber-900 mb-2">What happens when you import</h3>
                      <div className="space-y-2 text-sm text-amber-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-600" />
                          <span>Portal accounts created with auto-generated passwords</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-600" />
                          <span>Credentials shown after import so you can share them</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-600" />
                          <span>Clients enrolled in <strong>Destination Discovery</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-600" />
                          <span>When they log in, Discovery assessment appears immediately</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Results View */
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className={`rounded-xl p-6 ${bulkImportResults.summary?.succeeded === bulkImportResults.summary?.total ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <h3 className="text-lg font-semibold mb-3">
                        {bulkImportResults.summary?.succeeded === bulkImportResults.summary?.total 
                          ? '✅ All clients imported successfully!'
                          : `⚠️ ${bulkImportResults.summary?.succeeded} of ${bulkImportResults.summary?.total} clients imported`
                        }
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-2xl font-bold text-emerald-600">{bulkImportResults.summary?.succeeded || 0}</div>
                          <div className="text-xs text-gray-500">Succeeded</div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-2xl font-bold text-red-600">{bulkImportResults.summary?.failed || 0}</div>
                          <div className="text-xs text-gray-500">Failed</div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-600">{bulkImportResults.summary?.emailsSent || 0}</div>
                          <div className="text-xs text-gray-500">Emails Sent</div>
                        </div>
                      </div>
                    </div>

                    {/* Credentials Table - Copyable */}
                    {bulkImportResults.results?.some((r: any) => r.success) && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                          <h4 className="font-medium text-emerald-900">📋 Client Credentials</h4>
                          <button
                            onClick={() => {
                              const successResults = bulkImportResults.results.filter((r: any) => r.success);
                              const text = successResults.map((r: any) => 
                                `${r.name}\t${r.email}\t${r.password}`
                              ).join('\n');
                              navigator.clipboard.writeText(`Name\tEmail\tPassword\n${text}`);
                              alert('Credentials copied to clipboard!');
                            }}
                            className="text-xs px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                          >
                            Copy All
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email (Username)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {bulkImportResults.results?.filter((r: any) => r.success).map((result: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 font-medium text-gray-900">{result.name}</td>
                                  <td className="px-4 py-2 text-gray-600">{result.email}</td>
                                  <td className="px-4 py-2">
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{result.password}</code>
                                  </td>
                                  <td className="px-4 py-2 text-gray-500">{result.company || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 text-xs text-blue-700">
                          <strong>Portal URL:</strong> https://torsor.co.uk/client
                        </div>
                      </div>
                    )}

                    {/* Failed Imports */}
                    {bulkImportResults.results?.some((r: any) => !r.success) && (
                      <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
                        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                          <h4 className="font-medium text-red-900">⚠️ Failed Imports</h4>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          {bulkImportResults.results?.filter((r: any) => !r.success).map((result: any, idx: number) => (
                            <div key={idx} className="px-4 py-2 border-b border-red-100 flex items-center justify-between">
                              <span className="text-sm text-gray-900">{result.name || result.email}</span>
                              <span className="text-xs text-red-600">{result.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                {!bulkImportResults ? (
                  <>
                    <button
                      onClick={() => {
                        setShowBulkImportModal(false);
                        setBulkImportData('');
                        setBulkSendEmails(false);
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={bulkImporting || !bulkImportData.trim()}
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                        bulkImporting || !bulkImportData.trim()
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {bulkImporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import Clients
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowBulkImportModal(false);
                      setBulkImportData('');
                      setBulkImportResults(null);
                      setBulkSendEmails(false);
                    }}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Done
                  </button>
                )}
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
  const [viewMode, setViewMode] = useState<'admin' | 'client'>('admin');
  const [exportingResponsesPDF, setExportingResponsesPDF] = useState(false);
  
  // NEW: Destination-focused report from discovery_reports table
  const [destinationReport, setDestinationReport] = useState<any>(null);
  const [discoveryEngagement, setDiscoveryEngagement] = useState<any>(null);
  
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

  // Analysis comments (for learning system feedback boxes)
  const { 
    comments: analysisComments, 
    refetch: refetchComments 
  } = useAnalysisComments(discoveryEngagement?.id, destinationReport?.id);

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

      // Fetch uploaded documents (both old and new format)
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
      
      // Fetch MA uploaded documents (v2 format)
      const { data: maEngagement } = await supabase
        .from('ma_engagements')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();
      
      let maDocuments: any[] = [];
      if (maEngagement) {
        const { data: maDocsData, error: maDocsError } = await supabase
          .from('ma_uploaded_documents')
          .select('*')
          .eq('engagement_id', maEngagement.id)
          .order('created_at', { ascending: false });
        
        if (maDocsError) {
          console.error('Error fetching MA documents:', maDocsError);
        } else {
          maDocuments = maDocsData || [];
          console.log(`[MA] Found ${maDocuments.length} MA documents for engagement ${maEngagement.id}`);
        }
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

      // Fetch existing report if any (legacy)
      const { data: existingReport } = await supabase
        .from('client_reports')
        .select('*')
        .eq('client_id', clientId)
        .eq('report_type', 'discovery_analysis')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // NEW: Fetch destination-focused report from discovery_reports
      const { data: discoveryEngagementData } = await supabase
        .from('discovery_engagements')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (discoveryEngagementData) {
        setDiscoveryEngagement(discoveryEngagementData);
        
        // Fetch the destination report
        const { data: destReportData } = await supabase
          .from('discovery_reports')
          .select('*')
          .eq('engagement_id', discoveryEngagementData.id)
          .maybeSingle();
        
        // Set destinationReport if any Pass 1/2 data exists (new fields OR legacy destination_report)
        if (destReportData && (
          destReportData.destination_report ||
          destReportData.destination_clarity ||
          destReportData.page2_gaps ||
          destReportData.comprehensive_analysis ||
          destReportData.page1_destination
        )) {
          console.log('[Report] Found destination-focused report:', destReportData.id, {
            hasDestinationReport: !!destReportData.destination_report,
            hasDestinationClarity: !!destReportData.destination_clarity,
            hasPage2Gaps: !!destReportData.page2_gaps,
            hasComprehensiveAnalysis: !!destReportData.comprehensive_analysis
          });
          setDestinationReport(destReportData);
        }
      }

      // Add maDocuments to client data for display
      const clientWithMADocs = {
        ...clientData,
        maDocuments: maDocuments,
        documents: validDocs || []
      };
      
      setClient(clientWithMADocs);
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
        
        // Insert document record with placeholder content
        const { data: contextRecord, error: insertError } = await supabase.from('client_context').insert({
          practice_id: client.practice_id,
          client_id: clientId, // Verified above
          context_type: 'document',
          content: `Uploaded: ${file.name}`, // Placeholder - will be updated by process-documents
          source_file_url: urlData.publicUrl,
          applies_to: ['discovery'],
          data_source_type: 'accounts',
          processed: false
        }).select('id').single();
        
        if (insertError) {
          console.error('Error inserting document record:', insertError);
          continue;
        }
        
        // CRITICAL: Call process-documents to extract PDF text
        // NOTE: For large scanned PDFs, this can take 2-3 minutes
        // We fire-and-forget so the UI doesn't block
        console.log('📄 Processing document for text extraction:', file.name);
        
        // Fire and forget - don't await, let it process in background
        supabase.functions.invoke('process-documents', {
          body: {
            clientId,
            practiceId: client.practice_id,
            contextId: contextRecord?.id,
            documents: [{
              fileName: file.name,
              fileUrl: urlData.publicUrl,
              fileType: file.type || 'application/pdf',
              fileSize: file.size
            }],
            appliesTo: ['discovery'],
            isShared: false,
            dataSourceType: 'accounts'
          }
        }).then(({ data, error }) => {
          if (error) {
            console.log('Document processing still running or completed with note:', error.message);
          } else {
            console.log('✅ Document processed successfully:', data);
          }
        }).catch(() => {
          // Expected for long-running processing - function may still complete server-side
          console.log('Document processing running in background (may take 2-3 minutes for large PDFs)');
        });
        
        console.log('📄 Document upload complete - text extraction running in background');
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
        
        // ================================================================
        // STAGE 4: Generate DESTINATION-FOCUSED report (Client View)
        // ================================================================
        console.log('Stage 4: Generating destination-focused client view...');
        
        try {
          // Check if discovery_engagement exists, if not create one
          let engagementId = discoveryEngagement?.id;
          
          if (!engagementId) {
            // Check for existing engagement
            const { data: existingEng } = await supabase
              .from('discovery_engagements')
              .select('id')
              .eq('client_id', clientId)
              .maybeSingle();
            
            if (existingEng) {
              engagementId = existingEng.id;
            } else {
              // Create new engagement
              const { data: newEng, error: engError } = await supabase
                .from('discovery_engagements')
                .insert({
                  client_id: clientId,
                  discovery_id: discovery?.id,
                  practice_id: client?.practice_id,
                  status: 'responses_complete'
                })
                .select('id')
                .single();
              
              if (engError) {
                console.warn('Stage 4: Could not create engagement:', engError.message);
              } else {
                engagementId = newEng?.id;
                setDiscoveryEngagement(newEng);
              }
            }
          }
          
          if (engagementId) {
            // Run Pass 1 (extraction & scoring)
            console.log('Stage 4a: Running Pass 1 (extraction)...');
            const { data: pass1Data, error: pass1Error } = await supabase.functions.invoke('generate-discovery-report-pass1', {
              body: { engagementId }
            });
            
            if (pass1Error) {
              console.warn('Stage 4a: Pass 1 error:', pass1Error.message);
            } else {
              console.log('Stage 4a: Pass 1 complete:', pass1Data);
              
              // Run Pass 2 (destination-focused narrative)
              console.log('Stage 4b: Running Pass 2 (narrative)...');
              const { data: pass2Data, error: pass2Error } = await supabase.functions.invoke('generate-discovery-report-pass2', {
                body: { engagementId }
              });
              
              if (pass2Error) {
                console.warn('Stage 4b: Pass 2 error:', pass2Error.message);
              } else {
                console.log('Stage 4b: Pass 2 complete:', pass2Data);
                
                // Fetch the updated destination report
                const { data: destReport } = await supabase
                  .from('discovery_reports')
                  .select('*')
                  .eq('engagement_id', engagementId)
                  .maybeSingle();
                
                // Set state if any Pass 1/2 data exists
                if (destReport && (
                  destReport.destination_report ||
                  destReport.destination_clarity ||
                  destReport.page2_gaps ||
                  destReport.comprehensive_analysis
                )) {
                  setDestinationReport(destReport);
                  console.log('✅ Destination-focused client view ready!', {
                    hasDestinationClarity: !!destReport.destination_clarity,
                    hasPage2Gaps: !!destReport.page2_gaps,
                    hasComprehensiveAnalysis: !!destReport.comprehensive_analysis
                  });
                }
              }
            }
          }
        } catch (stage4Error) {
          console.warn('Stage 4: Destination-focused generation skipped:', stage4Error);
          // Don't fail the whole process - admin view is still available
        }
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
    if (!generatedReport?.analysis && !destinationReport) return;

    const analysis = generatedReport?.analysis;
    
    // Use destinationReport data (Pass 1/2) as primary source, fallback to generatedReport (Stage 3)
    const clarityScore = destinationReport?.destination_clarity?.score ||
                         destinationReport?.page1_destination?.clarityScore ||
                         destinationReport?.page1_destination?.destinationClarityScore ||
                         generatedReport?.discoveryScores?.clarityScore || 0;
    const gapScore = destinationReport?.page2_gaps?.gapScore ||
                     (destinationReport?.page2_gaps?.gaps?.length || 0) ||
                     generatedReport?.discoveryScores?.gapScore || 0;
    const clientName = generatedReport?.client?.name || client?.name || 'Client';
    const companyName = generatedReport?.client?.company || client?.client_company || '';
    const generatedDate = generatedReport?.generatedAt 
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

    // Check if we have journey data - prefer Pass 2 page3_journey
    const hasTransformationJourney = destinationReport?.page3_journey?.phases?.length > 0 || 
                                     analysis?.transformationJourney?.phases?.length > 0;
    const destination = destinationReport?.page3_journey?.headerLine || 
                       analysis?.transformationJourney?.destination || '';
    const totalInvestment = destinationReport?.page4_numbers?.totalYear1 || 
                           analysis?.transformationJourney?.totalInvestment || 
                           analysis?.investmentSummary?.totalFirstYearInvestment || '';

    // Gap Analysis HTML - Use destinationReport.page2_gaps as primary, fallback to analysis.gapAnalysis
    const page2Gaps = destinationReport?.page2_gaps?.gaps || [];
    const legacyGaps = analysis?.gapAnalysis?.primaryGaps || [];
    const gapsToRender = page2Gaps.length > 0 ? page2Gaps : legacyGaps;
    
    // Cost of Inaction - Use Pass 1 comprehensive_analysis as primary source
    const costOfInactionData = destinationReport?.comprehensive_analysis?.costOfInaction ||
                               destinationReport?.page4_numbers?.costOfInaction ||
                               analysis?.gapAnalysis?.costOfInaction;
    
    const gapsHtml = gapsToRender.map((gap: any) => {
      // Handle both new (page2_gaps) and legacy (gapAnalysis) formats
      const severity = gap.priority || gap.severity || 'medium';
      const severityIcon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
      const gapTitle = gap.title || gap.gap || 'Gap identified';
      const gapEvidence = gap.pattern || gap.evidence || '';
      // financialImpact is directly on gap in new format, nested in currentImpact in legacy
      const financialImpact = gap.financialImpact || gap.currentImpact?.financialImpact || '';
      const timeImpact = gap.timeImpact || gap.currentImpact?.timeImpact || '';
      
      return `
      <div class="gap-card severity-${severity}">
        <div class="gap-header">
          <span class="severity-indicator">${severityIcon}</span>
          <span class="severity-text severity-${severity}">${severity.toUpperCase()}</span>
          <span class="gap-divider">|</span>
          <span class="gap-category">${gap.category || 'General'}</span>
        </div>
        <h3 class="gap-title">${gapTitle}</h3>
        ${gapEvidence ? `<blockquote class="gap-evidence">"${gapEvidence}"</blockquote>` : ''}
        <div class="gap-impacts">
          ${financialImpact ? `<span class="impact-item">• ${financialImpact}</span>` : ''}
          ${timeImpact ? `<span class="impact-item">• ${timeImpact}</span>` : ''}
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

    // Closing Message - Prefer Pass 2 page5_next_steps over Stage 3 closingMessage
    const page5NextSteps = destinationReport?.page5_next_steps || destinationReport?.page5_nextSteps;
    const legacyClosing = analysis?.closingMessage;
    const personalNote = page5NextSteps?.theAsk || (typeof legacyClosing === 'string' ? legacyClosing : legacyClosing?.personalNote || '');
    const callToAction = page5NextSteps?.closingLine || (typeof legacyClosing === 'string' ? 'Let\'s talk this week.' : legacyClosing?.callToAction || 'Let\'s talk this week.');

    // Journey Phases - Prefer Pass 2 page3_journey over Stage 3 transformationJourney
    const page3Journey = destinationReport?.page3_journey;
    const legacyJourney = analysis?.transformationJourney;
    
    // Map page3_journey to Phase format if available
    let journeyPhasesToRender = legacyJourney?.phases || [];
    if (page3Journey?.phases?.length > 0) {
      journeyPhasesToRender = page3Journey.phases.map((phase: any, idx: number) => ({
        phase: idx + 1,
        timeframe: phase.timeframe || `Month ${(idx * 3) + 1}-${(idx + 1) * 3}`,
        title: phase.headline || phase.title || `Phase ${idx + 1}`,
        youWillHave: phase.outcome || (Array.isArray(phase.whatChanges) ? phase.whatChanges.join('. ') : phase.whatChanges) || '',
        whatChanges: phase.feelsLike || '',
        enabledBy: phase.enabledBy || '',
        investment: phase.price || ''
      }));
    }
    
    const hasJourneyPhases = journeyPhasesToRender.length > 0;

    // Journey Phases HTML - Improved timeline visualization
    const journeyPhasesHtml = hasJourneyPhases ? journeyPhasesToRender.map((phase: any) => `
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
          
          ${costOfInactionData ? `
            <div class="cost-of-inaction">
              <div class="coi-left">
                <span class="coi-icon">⚠️</span>
                <div>
                  <p class="coi-label">Cost of Not Acting</p>
                  <p class="coi-amount">${costOfInactionData.totalOverHorizon 
                    ? `£${Math.round(costOfInactionData.totalOverHorizon / 1000)}k+ over ${costOfInactionData.timeHorizon || 3} years`
                    : costOfInactionData.annualFinancialCost || ''}</p>
                </div>
              </div>
              <p class="coi-personal">${costOfInactionData.narrative || costOfInactionData.personalCost || ''}</p>
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
            <p class="footer-text">Prepared for ${clientName}</p>
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

  // Export Discovery Responses as separate PDF
  const handleExportResponsesPDF = async () => {
    if (!clientId || !discovery) return;
    
    setExportingResponsesPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-discovery-responses-pdf', {
        body: { 
          clientId,
          engagementId: discoveryEngagement?.id 
        }
      });
      
      if (error) throw error;
      
      if (data?.html) {
        // Open in new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      }
    } catch (err) {
      console.error('Error exporting responses PDF:', err);
      alert('Failed to export responses PDF. Please try again.');
    } finally {
      setExportingResponsesPDF(false);
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

      // CRITICAL: Fetch existing assignments first to avoid duplicates and preserve existing services
      const { data: existingAssignments, error: fetchError } = await supabase
        .from('client_service_lines')
        .select('service_line_id')
        .eq('client_id', clientId);

      if (fetchError) {
        console.error('❌ Error fetching existing assignments:', fetchError);
        throw fetchError;
      }

      const existingServiceLineIds = new Set(
        (existingAssignments || []).map(a => a.service_line_id)
      );
      const selectedServiceLineIds = new Set(serviceLines.map(sl => sl.id));

      // Determine which services need to be added (in selected but not existing)
      const servicesToAdd = serviceLines.filter(sl => !existingServiceLineIds.has(sl.id));
      
      // Determine which services need to be removed (in existing but not selected)
      const servicesToRemove = Array.from(existingServiceLineIds).filter(
        id => !selectedServiceLineIds.has(id)
      );

      console.log('📊 Service assignment plan:', {
        existing: existingServiceLineIds.size,
        selected: selectedServiceLineIds.size,
        toAdd: servicesToAdd.length,
        toRemove: servicesToRemove.length
      });

      // Insert only new services
      const insertResults = [];
      for (const sl of servicesToAdd) {
        const { data, error: insertError } = await supabase
          .from('client_service_lines')
          .insert({
            practice_id: client.practice_id,
            client_id: clientId,
            service_line_id: sl.id,
            status: 'pending_onboarding'
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

      // Delete services that are no longer selected (only if we have services to remove)
      if (servicesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('client_service_lines')
          .delete()
          .eq('client_id', clientId)
          .in('service_line_id', servicesToRemove);

        if (deleteError) {
          console.error('❌ Error removing unselected services:', deleteError);
          // Don't throw - new assignments are already in place
        } else {
          console.log(`✅ Removed ${servicesToRemove.length} unselected service(s)`);
        }
      }

      // Report results
      if (failedInserts.length > 0) {
        console.error('❌ Failed to assign some services:', failedInserts);
        alert(`Warning: Failed to assign some services: ${failedInserts.map(f => f.code).join(', ')}. Check console for details.`);
      }

      // Check if any changes were made
      if (servicesToAdd.length === 0 && servicesToRemove.length === 0) {
        alert('No changes needed - all selected services are already assigned.');
        onRefresh();
        return;
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
        added: successfulInserts.length,
        removed: servicesToRemove.length,
        failed: failedInserts.length
      });

      const actionSummary = [];
      if (successfulInserts.length > 0) {
        actionSummary.push(`Added ${successfulInserts.length} service(s)`);
      }
      if (servicesToRemove.length > 0) {
        actionSummary.push(`Removed ${servicesToRemove.length} service(s)`);
      }
      if (actionSummary.length === 0) {
        actionSummary.push('No changes needed');
      }

      alert(`Services updated successfully! ${actionSummary.join(', ')}.`);
      onRefresh();
    } catch (error) {
      console.error('❌ Error assigning services:', error);
      alert(`Failed to assign services: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    } finally {
      setAssigningServices(false);
    }
  };

  // Discovery Questions Mapping - ALL questions with proper labels
  const DISCOVERY_QUESTIONS = {
    destination: {
      title: 'Part 1: The Destination',
      subtitle: 'Understanding where you want to go',
      questions: [
        { key: 'dd_five_year_vision', question: 'Picture it: Five years from now, it\'s a random Tuesday morning. What does your ideal day look like?', label: 'Tuesday Test (5-Year Vision)' },
        { key: 'dd_success_definition', question: 'When you think about the next 3-5 years, how would you define success for yourself personally?', label: 'Success Definition' },
        { key: 'dd_non_negotiables', question: 'What are the non-negotiables in your vision?', label: 'Non-Negotiables' },
        { key: 'dd_magic_fix', question: 'If we could fix just ONE thing in the next 90 days that would make the biggest difference to your day-to-day, what would it be?', label: 'Magic Fix (90 Days)' },
      ]
    },
    reality: {
      title: 'Part 2: The Reality',
      subtitle: 'Understanding where you are now',
      questions: [
        { key: 'dd_weekly_hours', question: 'Roughly how many hours per week do you currently work?', label: 'Weekly Hours' },
        { key: 'dd_owner_hours', question: 'Roughly how many hours per week do you currently work?', label: 'Owner Hours' },
        { key: 'dd_time_allocation', question: 'How would you describe the split of your time between firefighting vs strategic work?', label: 'Time Allocation' },
        { key: 'dd_core_frustration', question: 'What\'s the biggest frustration in your business right now?', label: 'Core Frustration' },
        { key: 'dd_emergency_log', question: 'Think about the last month. What emergencies or unexpected issues pulled you away from what you should have been doing?', label: 'Emergency Log' },
        { key: 'dd_relationship_mirror', question: 'If your relationship with your business was a relationship with a person, what kind would it be?', label: 'Business Relationship' },
        { key: 'dd_external_view', question: 'How do people outside the business perceive it?', label: 'External View' },
        { key: 'dd_sacrifice_list', question: 'What have you sacrificed or put on hold because of the business?', label: 'What You\'ve Sacrificed' },
        { key: 'dd_last_real_break', question: 'When did you last have a proper break (a week or more) without checking in?', label: 'Last Real Break' },
        { key: 'dd_sleep_thief', question: 'What keeps you awake at night about the business?', label: 'Sleep Thief' },
      ]
    },
    truth: {
      title: 'Part 3: The Hard Truth',
      subtitle: 'The conversations that matter',
      questions: [
        { key: 'dd_avoided_conversation', question: 'Is there a conversation you\'ve been avoiding? Someone you need to talk to but haven\'t?', label: 'Avoided Conversation' },
        { key: 'dd_hard_truth', question: 'What\'s the hard truth about your business that you suspect but haven\'t confirmed?', label: 'Hard Truth' },
        { key: 'dd_if_i_knew', question: 'If you could know one thing with certainty about your business, what would it be?', label: 'If I Knew...' },
        { key: 'dd_suspected_truth', question: 'If you had to guess - what do you think your numbers would tell you that you don\'t currently know?', label: 'Suspected Truth' },
        { key: 'dd_team_secret', question: 'What does your team not know about how you\'re feeling?', label: 'Team Secret' },
        { key: 'dd_scaling_constraint', question: 'What\'s the main constraint stopping you from growing right now?', label: 'Scaling Constraint' },
        { key: 'dd_change_readiness', question: 'How ready are you to make significant changes to how things work?', label: 'Change Readiness' },
      ]
    },
    systems: {
      title: 'Part 4: Systems & Operations',
      subtitle: 'How the business runs',
      questions: [
        { key: 'sd_financial_confidence', question: 'How confident are you that your financial data is accurate and up to date?', label: 'Financial Confidence' },
        { key: 'sd_founder_dependency', question: 'If you disappeared for 2 weeks, what would happen to the business?', label: 'Founder Dependency' },
        { key: 'sd_manual_tasks', question: 'Which of these tasks are still largely manual in your business?', label: 'Manual Tasks' },
        { key: 'sd_manual_work', question: 'How much of your team\'s effort is manual vs automated?', label: 'Manual Work' },
        { key: 'sd_plan_clarity', question: 'Do you have a clear business plan?', label: 'Plan Clarity' },
        { key: 'sd_numbers_action_frequency', question: 'How often do you make decisions based on your financial data?', label: 'Data-Driven Decisions' },
        { key: 'sd_documentation_readiness', question: 'If someone needed to understand how your business works, is it documented?', label: 'Documentation Ready' },
        { key: 'sd_operational_frustration', question: 'What processes or systems frustrate you most?', label: 'Operational Frustration' },
        { key: 'sd_growth_blocker', question: 'What\'s blocking your growth right now?', label: 'Growth Blocker' },
        { key: 'sd_competitive_position', question: 'How would you describe your market position?', label: 'Market Position' },
        { key: 'sd_exit_timeline', question: 'Are you thinking about an exit? If so, what\'s your timeline?', label: 'Exit Timeline' },
      ]
    },
    other: {
      title: 'Additional Responses',
      subtitle: 'Other captured information',
      questions: [
        { key: 'dd_final_message', question: 'Is there anything else you\'d like us to know?', label: 'Final Message' },
      ]
    }
  };

  // Get discovery responses in structured format
  const getStructuredResponses = () => {
    const responses = discovery?.responses || discovery || {};
    return responses;
  };

  const discoveryResponses = getStructuredResponses();

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
              disabled={generatingReport || (!discovery?.completed_at && !discovery?.responses)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              title={!discovery?.completed_at && discovery?.responses ? 'Generate from partial responses' : undefined}
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
                      {/* Header with Export Button */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Discovery Responses</h3>
                        <button
                          onClick={handleExportResponsesPDF}
                          disabled={exportingResponsesPDF}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                          {exportingResponsesPDF ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Export Responses to PDF
                            </>
                          )}
                        </button>
                      </div>

                      {/* Summary cards - Use destinationReport (Pass 1/2) as primary source */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-cyan-50 rounded-xl p-4">
                          <p className="text-sm text-cyan-600 font-medium">Destination Clarity</p>
                          <p className="text-2xl font-bold text-cyan-900">
                            {destinationReport?.destination_clarity?.score ||
                             destinationReport?.page1_destination?.destinationClarityScore ||
                             destinationReport?.page1_destination?.clarityScore ||
                             discovery.destination_clarity_score || '—'}/10
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4">
                          <p className="text-sm text-amber-600 font-medium">Gap Score</p>
                          <p className="text-2xl font-bold text-amber-900">
                            {destinationReport?.page2_gaps?.gapScore ||
                             (destinationReport?.page2_gaps?.gaps?.length) ||
                             discovery.gap_score || '—'}/10
                          </p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4">
                          <p className="text-sm text-emerald-600 font-medium">Completion</p>
                          <p className="text-2xl font-bold text-emerald-900">
                            {discovery.completed_at ? 'Complete' : 'In Progress'}
                          </p>
                        </div>
                      </div>

                      {/* Business Insights from Pass 1 Analysis - Valuation, Hidden Assets, Gross Margin */}
                      {destinationReport?.comprehensive_analysis && (() => {
                        // Debug: Log what we have in comprehensive_analysis
                        const ca = destinationReport.comprehensive_analysis;
                        console.log('[Business Insights] comprehensive_analysis:', {
                          hasValuation: !!ca?.valuation,
                          valuationData: ca?.valuation,
                          hasHiddenAssets: !!ca?.hiddenAssets,
                          hiddenAssetsData: ca?.hiddenAssets,
                          hasGrossMargin: !!ca?.grossMargin,
                          grossMarginData: ca?.grossMargin,
                          hasExitReadiness: !!ca?.exitReadiness,
                          page4Numbers: destinationReport.page4_numbers
                        });
                        
                        // Extract values with multiple fallback paths
                        const valuation = ca?.valuation;
                        const hasValuation = valuation && (
                          valuation.enterpriseValueLow || valuation.enterpriseValueHigh ||
                          valuation.conservativeValue || valuation.optimisticValue
                        );
                        
                        const hiddenAssets = ca?.hiddenAssets;
                        const hiddenAssetsTotal = hiddenAssets?.totalHiddenAssets || 0;
                        const hasHiddenAssets = hiddenAssetsTotal > 50000;
                        
                        const grossMargin = ca?.grossMargin;
                        const hasGrossMargin = grossMargin?.grossMarginPct && grossMargin.grossMarginPct > 0;
                        
                        return (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                          <h4 className="text-sm font-semibold text-blue-800 mb-4 flex items-center gap-2">
                            <span>📊</span> Business Insights (Pass 1 Analysis)
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Indicative Valuation */}
                            {(destinationReport.page4_numbers?.indicativeValuation || hasValuation) && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-blue-600 font-medium">💰 Indicative Value</p>
                                <p className="text-lg font-bold text-blue-900">
                                  {destinationReport.page4_numbers?.indicativeValuation || (() => {
                                    // Try enterpriseValue first (includes hidden assets), then conservativeValue
                                    const low = valuation?.enterpriseValueLow || valuation?.conservativeValue;
                                    const high = valuation?.enterpriseValueHigh || valuation?.optimisticValue;
                                    if (low && high) {
                                      return `£${(low / 1000000).toFixed(1)}M - £${(high / 1000000).toFixed(1)}M`;
                                    }
                                    return '—';
                                  })()}
                                </p>
                              </div>
                            )}
                            
                            {/* Hidden Assets */}
                            {(destinationReport.page4_numbers?.hiddenAssets?.total || hasHiddenAssets) && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-purple-600 font-medium">💎 Hidden Assets</p>
                                <p className="text-lg font-bold text-purple-900">
                                  {destinationReport.page4_numbers?.hiddenAssets?.total || 
                                   `£${Math.round(hiddenAssetsTotal / 1000)}k`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {destinationReport.page4_numbers?.hiddenAssets?.breakdown || (() => {
                                    const parts = [];
                                    if (hiddenAssets?.freeholdProperty) parts.push('Freehold');
                                    if (hiddenAssets?.excessCash) parts.push('Excess Cash');
                                    return parts.join(' + ') || 'Outside earnings valuation';
                                  })()}
                                </p>
                              </div>
                            )}
                            
                            {/* Gross Margin */}
                            {(destinationReport.page4_numbers?.grossMarginStrength || hasGrossMargin) && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-emerald-600 font-medium">📈 Gross Margin</p>
                                <p className="text-lg font-bold text-emerald-900">
                                  {destinationReport.page4_numbers?.grossMarginStrength || (() => {
                                    const pct = grossMargin?.grossMarginPct;
                                    if (pct) {
                                      return `${typeof pct === 'number' ? pct.toFixed(1) : pct}%`;
                                    }
                                    return '—';
                                  })()}
                                </p>
                                {grossMargin?.assessment && (
                                  <p className="text-xs text-gray-500 mt-1 capitalize">
                                    {grossMargin.assessment} for industry
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Exit Readiness */}
                            {ca?.exitReadiness?.score && (
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-orange-600 font-medium">🚪 Exit Readiness</p>
                                <p className="text-lg font-bold text-orange-900">
                                  {Math.round((ca.exitReadiness.score / 
                                              ca.exitReadiness.maxScore) * 100)}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {ca.exitReadiness.readiness === 'ready' ? 'Ready to sell' :
                                   ca.exitReadiness.readiness === 'nearly' ? 'Nearly ready' : 'Work needed'}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Data Quality Indicator */}
                          <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 text-xs text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${
                              ca?.dataQuality === 'comprehensive' ? 'bg-green-500' :
                              ca?.dataQuality === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></span>
                            Data quality: {ca?.dataQuality || 'unknown'}
                            {ca?.availableMetrics?.length > 0 && (
                              <span className="ml-2">
                                ({ca.availableMetrics.length} metrics available)
                              </span>
                            )}
                          </div>
                        </div>
                        );
                      })()}

                      {/* Full Questions & Answers by Section */}
                      {Object.entries(DISCOVERY_QUESTIONS).map(([sectionKey, section]) => {
                        // Check if section has any answered questions
                        const hasAnswers = section.questions.some(q => {
                          const val = discoveryResponses[q.key];
                          return val && (Array.isArray(val) ? val.length > 0 : val.toString().trim().length > 0);
                        });
                        
                        if (!hasAnswers) return null;
                        
                        return (
                          <div key={sectionKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                              <h3 className="text-lg font-semibold text-indigo-900">{section.title}</h3>
                              <p className="text-sm text-indigo-600">{section.subtitle}</p>
                            </div>
                            
                            {/* Questions */}
                            <div className="divide-y divide-gray-100">
                              {section.questions.map((q) => {
                                let answer = discoveryResponses[q.key];
                                if (Array.isArray(answer)) answer = answer.join(', ');
                                if (!answer || (typeof answer === 'string' && answer.trim() === '')) return null;
                                
                                return (
                                  <div key={q.key} className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-emerald-500" />
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
                                          {q.label}
                                        </p>
                                        <p className="text-sm text-gray-500 italic mb-2">"{q.question}"</p>
                                        <div className="p-3 rounded-lg bg-gray-50 border-l-3 border-indigo-500">
                                          <p className="text-gray-900 whitespace-pre-wrap">{answer}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

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
                  {/* View Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('admin')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          viewMode === 'admin'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Admin View
                      </button>
                      <button
                        onClick={() => setViewMode('client')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          viewMode === 'client'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Client View
                      </button>
                    </div>
                    {isReportShared && (
                      <span className="flex items-center gap-1 text-sm text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        Shared with client
                      </span>
                    )}
                  </div>

                  {/* CLIENT VIEW - Destination-Focused Report (NEW 5-Page Structure) */}
                  {viewMode === 'client' && (destinationReport?.destination_report || generatedReport) && (
                    <div className="bg-gray-50 rounded-xl p-6 space-y-8">
                      {/* Check for new destination-focused structure first */}
                      {(() => {
                        const dest = destinationReport?.destination_report;
                        const page1 = dest?.page1_destination || destinationReport?.page1_destination;
                        const page2 = dest?.page2_gaps || destinationReport?.page2_gaps;
                        const page3 = dest?.page3_journey || destinationReport?.page3_journey;
                        const page4 = dest?.page4_numbers || destinationReport?.page4_numbers;
                        const page5 = dest?.page5_nextSteps || dest?.page5_next_steps || destinationReport?.page5_next_steps;
                        
                        // DEBUG: Show ACTUAL structure of data
                        console.log('[Client View] 🔍 ACTUAL page1 object:', page1);
                        console.log('[Client View] 🔍 page1 keys:', page1 ? Object.keys(page1) : 'NULL');
                        console.log('[Client View] 🔍 ACTUAL page2 object:', page2);
                        console.log('[Client View] 🔍 page2 keys:', page2 ? Object.keys(page2) : 'NULL');
                        console.log('[Client View] 🔍 ACTUAL page5 object:', page5);
                        console.log('[Client View] 🔍 page5 keys:', page5 ? Object.keys(page5) : 'NULL');
                        
                        // Also check destination_report structure
                        console.log('[Client View] 🔍 destination_report keys:', dest ? Object.keys(dest) : 'NULL');
                        console.log('[Client View] 🔍 destinationReport top-level keys:', destinationReport ? Object.keys(destinationReport) : 'NULL');
                        
                        // If we have destination-focused data, render new structure
                        if (page1 || page2 || page3 || page4 || page5) {
                          return (
                            <>
                              {/* ============================================= */}
                              {/* PAGE 1: THE DESTINATION YOU DESCRIBED */}
                              {/* ============================================= */}
                              {page1 && (
                                <section className="bg-white rounded-xl shadow-sm overflow-hidden">
                                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-100">
                                    <span className="text-xs font-medium text-amber-600 uppercase tracking-widest">
                                      Page 1 — Your Vision
                                    </span>
                                    <h2 className="text-2xl font-serif text-slate-800 mt-2">
                                      {page1.headerLine || "The Tuesday You're Building Towards"}
                                    </h2>
                                  </div>
                                  <div className="p-6">
                                    <div className="bg-slate-50 rounded-lg p-6 border-l-4 border-amber-400">
                                      <Quote className="w-6 h-6 text-amber-400 mb-3" />
                                      <blockquote className="text-lg text-slate-700 italic whitespace-pre-wrap leading-relaxed">
                                        {page1.visionVerbatim}
                                      </blockquote>
                                    </div>
                                    {page1.destinationClarityScore && (
                                      <div className="mt-6 flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all"
                                            style={{ width: `${(page1.destinationClarityScore / 10) * 100}%` }}
                                          />
                                        </div>
                                        <div className="text-sm">
                                          <span className="font-bold text-emerald-600 text-lg">{page1.destinationClarityScore}/10</span>
                                          <span className="text-gray-500 ml-2">Destination Clarity</span>
                                        </div>
                                      </div>
                                    )}
                                    {page1.clarityExplanation && (
                                      <p className="mt-2 text-sm text-gray-500">{page1.clarityExplanation}</p>
                                    )}
                                    
                                    {/* Feedback Box for Page 1 */}
                                    {discoveryEngagement?.id && currentMember?.practice_id && (
                                      <SectionCommentBox
                                        engagementId={discoveryEngagement.id}
                                        reportId={destinationReport?.id}
                                        practiceId={currentMember.practice_id}
                                        sectionType="page1_destination"
                                        originalContent={page1}
                                        existingComments={analysisComments}
                                        onCommentAdded={refetchComments}
                                      />
                                    )}
                                  </div>
                                </section>
                              )}

                              {/* ============================================= */}
                              {/* PAGE 2: WHAT'S IN THE WAY */}
                              {/* ============================================= */}
                              {page2 && (
                                <section className="bg-white rounded-xl shadow-sm overflow-hidden">
                                  <div className="bg-gradient-to-r from-rose-50 to-red-50 p-6 border-b border-rose-100">
                                    <span className="text-xs font-medium text-rose-600 uppercase tracking-widest">
                                      Page 2 — The Reality
                                    </span>
                                    <h2 className="text-2xl font-serif text-slate-800 mt-2">
                                      {page2.headerLine || "The Gap Between Here and There"}
                                    </h2>
                                    {page2.openingLine && (
                                      <p className="mt-2 text-rose-700 italic">{page2.openingLine}</p>
                                    )}
                                  </div>
                                  <div className="p-6 space-y-4">
                                    {page2.gaps?.map((gap: any, idx: number) => (
                                      <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                                          <h3 className="font-semibold text-gray-900">{gap.title}</h3>
                                        </div>
                                        <div className="p-4 space-y-3">
                                          <div className="bg-slate-50 rounded-lg p-3 border-l-4 border-slate-300">
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">The pattern:</p>
                                            <p className="text-slate-700 italic">"{gap.pattern}"</p>
                                          </div>
                                          {gap.costs && (
                                            <div>
                                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">What this costs you:</p>
                                              <ul className="space-y-1">
                                                {gap.costs.map((cost: string, cIdx: number) => (
                                                  <li key={cIdx} className="flex items-start gap-2 text-gray-600">
                                                    <span className="text-rose-400 mt-0.5">•</span>
                                                    <span>{cost}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          <div className="bg-emerald-50 rounded-lg p-3">
                                            <p className="text-xs font-medium text-emerald-700 uppercase mb-1">The shift required:</p>
                                            <p className="text-emerald-800">{gap.shiftRequired}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Feedback Box for Page 2 */}
                                    {discoveryEngagement?.id && currentMember?.practice_id && (
                                      <SectionCommentBox
                                        engagementId={discoveryEngagement.id}
                                        reportId={destinationReport?.id}
                                        practiceId={currentMember.practice_id}
                                        sectionType="page2_gaps"
                                        originalContent={page2}
                                        existingComments={analysisComments}
                                        onCommentAdded={refetchComments}
                                      />
                                    )}
                                  </div>
                                </section>
                              )}

                              {/* ============================================= */}
                              {/* PAGE 3: THE JOURNEY */}
                              {/* ============================================= */}
                              {page3 && (
                                <section className="bg-white rounded-xl shadow-sm overflow-hidden">
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100">
                                    <span className="text-xs font-medium text-blue-600 uppercase tracking-widest">
                                      Page 3 — The Path Forward
                                    </span>
                                    <h2 className="text-2xl font-serif text-slate-800 mt-2">
                                      {page3.headerLine || "From Here to the 4pm Pickup"}
                                    </h2>
                                  </div>
                                  
                                  {/* Timeline Visual */}
                                  {page3.timelineLabel && (
                                    <div className="px-6 py-4 bg-slate-50 border-b border-gray-100">
                                      <div className="flex items-center justify-between text-sm relative">
                                        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gray-300 -translate-y-1/2" />
                                        {['now', 'month3', 'month6', 'month12'].map((key, idx) => (
                                          <div key={key} className="relative flex flex-col items-center z-10">
                                            <div className={`w-4 h-4 rounded-full border-2 ${
                                              idx === 3 ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-400'
                                            }`} />
                                            <span className={`mt-1 text-xs ${idx === 3 ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>
                                              {page3.timelineLabel[key]}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="p-6 space-y-4">
                                    {page3.phases?.map((phase: any, idx: number) => (
                                      <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-blue-50 px-4 py-3">
                                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-1">
                                            {phase.timeframe}
                                          </span>
                                          <h3 className="font-semibold text-gray-900 text-lg">{phase.headline}</h3>
                                        </div>
                                        <div className="p-4 space-y-3">
                                          {phase.whatChanges && (
                                            <ul className="space-y-1">
                                              {phase.whatChanges.map((change: string, cIdx: number) => (
                                                <li key={cIdx} className="flex items-start gap-2 text-gray-700">
                                                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                  <span>{change}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                          {phase.feelsLike && (
                                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                              <p className="text-xs font-medium text-amber-700 uppercase mb-1">What this feels like:</p>
                                              <p className="text-amber-800 italic">{phase.feelsLike}</p>
                                            </div>
                                          )}
                                          {phase.outcome && (
                                            <p className="text-gray-700"><strong>The outcome:</strong> {phase.outcome}</p>
                                          )}
                                          <div className="pt-2 border-t border-gray-100">
                                            <EnabledByLink
                                              serviceCode={(() => {
                                                const name = (phase.enabledBy || '').toLowerCase();
                                                if (name.includes('365') || name.includes('goal alignment')) return '365_method';
                                                if (name.includes('systems audit')) return 'systems_audit';
                                                if (name.includes('management account')) return 'management_accounts';
                                                if (name.includes('fractional cfo')) return 'fractional_cfo';
                                                if (name.includes('benchmark')) return 'benchmarking';
                                                if (name.includes('automation')) return 'automation';
                                                return phase.enabledByCode || 'discovery';
                                              })()}
                                              serviceName={phase.enabledBy?.includes('365') ? 'Goal Alignment Programme' : phase.enabledBy}
                                              price={phase.price}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Feedback Box for Page 3 */}
                                    {discoveryEngagement?.id && currentMember?.practice_id && (
                                      <SectionCommentBox
                                        engagementId={discoveryEngagement.id}
                                        reportId={destinationReport?.id}
                                        practiceId={currentMember.practice_id}
                                        sectionType="page3_journey"
                                        originalContent={page3}
                                        existingComments={analysisComments}
                                        onCommentAdded={refetchComments}
                                      />
                                    )}
                                  </div>
                                </section>
                              )}

                              {/* ============================================= */}
                              {/* PAGE 4: THE NUMBERS */}
                              {/* ============================================= */}
                              {page4 && (
                                <section className="bg-white rounded-xl shadow-sm overflow-hidden">
                                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-200">
                                    <span className="text-xs font-medium text-slate-600 uppercase tracking-widest">
                                      Page 4 — The Investment
                                    </span>
                                    <h2 className="text-2xl font-serif text-slate-800 mt-2">
                                      {page4.headerLine || "The Investment in Your Tuesday"}
                                    </h2>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    {/* Cost of Staying */}
                                    {page4.costOfStaying && (
                                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-rose-800 mb-3 flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4" />
                                          What Staying Here Costs
                                        </h3>
                                        <div className="space-y-2 text-rose-700">
                                          {page4.costOfStaying.labourInefficiency && (
                                            <div className="flex justify-between">
                                              <span>Labour inefficiency</span>
                                              <span className="font-medium">{page4.costOfStaying.labourInefficiency}</span>
                                            </div>
                                          )}
                                          {page4.costOfStaying.marginLeakage && (
                                            <div className="flex justify-between">
                                              <span>Margin leakage</span>
                                              <span className="font-medium">{page4.costOfStaying.marginLeakage}</span>
                                            </div>
                                          )}
                                          {page4.costOfStaying.yourTimeWasted && (
                                            <div className="flex justify-between">
                                              <span>Your time on work below pay grade</span>
                                              <span className="font-medium">{page4.costOfStaying.yourTimeWasted}</span>
                                            </div>
                                          )}
                                        </div>
                                        {page4.personalCost && (
                                          <p className="mt-3 pt-3 border-t border-rose-200 text-rose-800 font-medium">
                                            {page4.personalCost}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Investment */}
                                    {page4.investment && (
                                      <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-800 mb-3">What Moving Forward Costs</h3>
                                        <div className="space-y-2">
                                          {page4.investment.map((inv: any, idx: number) => (
                                            <div key={idx} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                              <span className="text-gray-700">{inv.phase} — {inv.whatYouGet}</span>
                                              <span className="font-semibold">{inv.amount}</span>
                                            </div>
                                          ))}
                                        </div>
                                        {page4.totalYear1 && (
                                          <div className="mt-3 pt-3 border-t-2 border-emerald-200 bg-emerald-50 -mx-4 -mb-4 p-4 rounded-b-lg flex justify-between">
                                            <span className="font-medium text-emerald-800">Total Year 1</span>
                                            <span className="font-bold text-emerald-800">{page4.totalYear1}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Returns */}
                                    {page4.returns && (
                                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                          <TrendingUp className="w-4 h-4" />
                                          The Return
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                          <div className="bg-white rounded p-3">
                                            <p className="text-xs text-gray-500 mb-1">Conservative</p>
                                            <p className="text-xl font-bold text-emerald-600">{page4.returns.conservative?.total}</p>
                                          </div>
                                          <div className="bg-white rounded p-3">
                                            <p className="text-xs text-emerald-600 mb-1">Realistic</p>
                                            <p className="text-xl font-bold text-emerald-600">{page4.returns.realistic?.total}</p>
                                          </div>
                                        </div>
                                        {page4.paybackPeriod && (
                                          <p className="text-emerald-700">Payback period: <strong>{page4.paybackPeriod}</strong></p>
                                        )}
                                        {page4.realReturn && (
                                          <p className="mt-3 pt-3 border-t border-emerald-200 text-emerald-800 italic">
                                            But the real return? {page4.realReturn}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Business Value Insights - from Pass 1 comprehensive_analysis */}
                                    {(page4.indicativeValuation || page4.hiddenAssets || page4.grossMarginStrength ||
                                      destinationReport?.comprehensive_analysis?.valuation?.conservativeValue ||
                                      destinationReport?.comprehensive_analysis?.hiddenAssets?.totalHiddenAssets > 50000 ||
                                      destinationReport?.comprehensive_analysis?.grossMargin?.grossMarginPct) && (
                                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                          💎 Business Value Insights
                                        </h3>
                                        <div className="space-y-3">
                                          {/* Indicative Valuation */}
                                          {(page4.indicativeValuation || 
                                            (destinationReport?.comprehensive_analysis?.valuation?.conservativeValue && 
                                             destinationReport?.comprehensive_analysis?.valuation?.optimisticValue)) && (
                                            <div className="flex items-start gap-3">
                                              <span className="text-lg">💰</span>
                                              <div>
                                                <p className="text-xs text-blue-600 font-medium">Indicative Business Value</p>
                                                <p className="text-lg font-bold text-blue-900">
                                                  {page4.indicativeValuation || (() => {
                                                    const v = destinationReport?.comprehensive_analysis?.valuation;
                                                    const h = destinationReport?.comprehensive_analysis?.hiddenAssets?.totalHiddenAssets || 0;
                                                    if (v?.conservativeValue && v?.optimisticValue) {
                                                      const low = ((v.conservativeValue + h) / 1000000).toFixed(1);
                                                      const high = ((v.optimisticValue + h) / 1000000).toFixed(1);
                                                      return `£${low}M - £${high}M`;
                                                    }
                                                    return '—';
                                                  })()}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Hidden Assets */}
                                          {(page4.hiddenAssets?.total || 
                                            (destinationReport?.comprehensive_analysis?.hiddenAssets?.totalHiddenAssets && 
                                             destinationReport?.comprehensive_analysis?.hiddenAssets?.totalHiddenAssets > 50000)) && (
                                            <div className="flex items-start gap-3">
                                              <span className="text-lg">💎</span>
                                              <div>
                                                <p className="text-xs text-purple-600 font-medium">Hidden Assets (Outside Earnings Valuation)</p>
                                                <p className="text-lg font-bold text-purple-900">
                                                  {page4.hiddenAssets?.total || 
                                                   `£${Math.round(destinationReport?.comprehensive_analysis?.hiddenAssets?.totalHiddenAssets / 1000)}k`}
                                                </p>
                                                <p className="text-xs text-purple-700 mt-1">
                                                  {page4.hiddenAssets?.breakdown || (() => {
                                                    const h = destinationReport?.comprehensive_analysis?.hiddenAssets;
                                                    const parts = [];
                                                    if (h?.freeholdProperty) parts.push(`£${Math.round(h.freeholdProperty/1000)}k freehold`);
                                                    if (h?.excessCash) parts.push(`£${Math.round(h.excessCash/1000)}k excess cash`);
                                                    return parts.join(' + ') || 'Transfer to buyer on sale';
                                                  })()}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Gross Margin Strength */}
                                          {(page4.grossMarginStrength || 
                                            (destinationReport?.comprehensive_analysis?.grossMargin?.grossMarginPct && 
                                             (destinationReport?.comprehensive_analysis?.grossMargin?.assessment === 'excellent' ||
                                              destinationReport?.comprehensive_analysis?.grossMargin?.assessment === 'healthy'))) && (
                                            <div className="flex items-start gap-3">
                                              <span className="text-lg">✅</span>
                                              <div>
                                                <p className="text-xs text-emerald-600 font-medium">Margin Strength</p>
                                                <p className="text-base font-semibold text-emerald-800">
                                                  {page4.grossMarginStrength || (() => {
                                                    const gm = destinationReport?.comprehensive_analysis?.grossMargin;
                                                    if (gm?.grossMarginPct) {
                                                      const pct = typeof gm.grossMarginPct === 'number' ? gm.grossMarginPct.toFixed(1) : gm.grossMarginPct;
                                                      return `${pct}% gross margin - ${gm.assessment} for the industry`;
                                                    }
                                                    return '';
                                                  })()}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Exit Readiness */}
                                          {destinationReport?.comprehensive_analysis?.exitReadiness?.score && (
                                            <div className="flex items-start gap-3">
                                              <span className="text-lg">🚪</span>
                                              <div>
                                                <p className="text-xs text-orange-600 font-medium">Exit Readiness</p>
                                                <p className="text-lg font-bold text-orange-900">
                                                  {Math.round((destinationReport.comprehensive_analysis.exitReadiness.score / 
                                                    destinationReport.comprehensive_analysis.exitReadiness.maxScore) * 100)}%
                                                </p>
                                                <p className="text-xs text-orange-700 mt-1">
                                                  {destinationReport.comprehensive_analysis.exitReadiness.readiness === 'ready' ? 'Ready to sell' :
                                                   destinationReport.comprehensive_analysis.exitReadiness.readiness === 'nearly' ? 'Nearly ready' : 'Work needed'}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Payroll Excess */}
                                          {destinationReport?.comprehensive_analysis?.payroll?.annualExcess > 10000 && (
                                            <div className="flex items-start gap-3">
                                              <span className="text-lg">👥</span>
                                              <div>
                                                <p className="text-xs text-rose-600 font-medium">Payroll Excess</p>
                                                <p className="text-lg font-bold text-rose-900">
                                                  £{Math.round(destinationReport.comprehensive_analysis.payroll.annualExcess / 1000)}k/year
                                                </p>
                                                <p className="text-xs text-rose-700 mt-1">
                                                  {destinationReport.comprehensive_analysis.payroll.payrollPct?.toFixed(1)}% vs {destinationReport.comprehensive_analysis.payroll.benchmarkPct?.toFixed(1)}% benchmark
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Revenue Trajectory */}
                                          {destinationReport?.comprehensive_analysis?.trajectory?.hasData && (
                                            <div className="flex items-start gap-3">
                                              <span className="text-lg">
                                                {destinationReport.comprehensive_analysis.trajectory.trend === 'growing' ? '📈' :
                                                 destinationReport.comprehensive_analysis.trajectory.trend === 'stable' ? '➡️' : '📉'}
                                              </span>
                                              <div>
                                                <p className="text-xs text-indigo-600 font-medium">Revenue Trend</p>
                                                <p className="text-lg font-bold text-indigo-900">
                                                  {destinationReport.comprehensive_analysis.trajectory.trend?.charAt(0).toUpperCase() + 
                                                   destinationReport.comprehensive_analysis.trajectory.trend?.slice(1)}
                                                </p>
                                                {destinationReport.comprehensive_analysis.trajectory.changePercent && (
                                                  <p className="text-xs text-indigo-700 mt-1">
                                                    {destinationReport.comprehensive_analysis.trajectory.changePercent > 0 ? '+' : ''}
                                                    {destinationReport.comprehensive_analysis.trajectory.changePercent.toFixed(1)}% YoY
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Productivity - Revenue per Head */}
                                          {destinationReport?.comprehensive_analysis?.productivity?.hasData && (
                                            <div className="flex items-start gap-3">
                                              <span className="text-lg">⚡</span>
                                              <div>
                                                <p className="text-xs text-cyan-600 font-medium">Revenue per Head</p>
                                                <p className="text-lg font-bold text-cyan-900">
                                                  £{Math.round(destinationReport.comprehensive_analysis.productivity.revenuePerHead / 1000)}k
                                                </p>
                                                {destinationReport.comprehensive_analysis.productivity.benchmarkRPH && (
                                                  <p className="text-xs text-cyan-700 mt-1">
                                                    vs £{Math.round(destinationReport.comprehensive_analysis.productivity.benchmarkRPH / 1000)}k benchmark
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Cost of Inaction */}
                                          {destinationReport?.comprehensive_analysis?.costOfInaction?.totalOverHorizon > 50000 && (
                                            <div className="flex items-start gap-3">
                                              <span className="text-lg">⏱️</span>
                                              <div>
                                                <p className="text-xs text-red-600 font-medium">Cost of Delay</p>
                                                <p className="text-lg font-bold text-red-900">
                                                  £{Math.round(destinationReport.comprehensive_analysis.costOfInaction.totalOverHorizon / 1000)}k+
                                                </p>
                                                <p className="text-xs text-red-700 mt-1">
                                                  Over {destinationReport.comprehensive_analysis.costOfInaction.timeHorizon || 2} years
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Data Quality Indicator */}
                                        {destinationReport?.comprehensive_analysis?.dataQuality && (
                                          <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 text-xs text-gray-500">
                                            <span className={`w-2 h-2 rounded-full ${
                                              destinationReport.comprehensive_analysis.dataQuality === 'comprehensive' ? 'bg-green-500' :
                                              destinationReport.comprehensive_analysis.dataQuality === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}></span>
                                            Data quality: {destinationReport.comprehensive_analysis.dataQuality}
                                            {destinationReport.comprehensive_analysis.availableMetrics?.length > 0 && (
                                              <span className="ml-1">• {destinationReport.comprehensive_analysis.availableMetrics.length} dimensions</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Feedback Box for Page 4 */}
                                    {discoveryEngagement?.id && currentMember?.practice_id && (
                                      <SectionCommentBox
                                        engagementId={discoveryEngagement.id}
                                        reportId={destinationReport?.id}
                                        practiceId={currentMember.practice_id}
                                        sectionType="page4_investment"
                                        originalContent={page4}
                                        existingComments={analysisComments}
                                        onCommentAdded={refetchComments}
                                      />
                                    )}
                                  </div>
                                </section>
                              )}

                              {/* ============================================= */}
                              {/* PAGE 5: WHAT HAPPENS NEXT */}
                              {/* ============================================= */}
                              {page5 && (
                                <section className="bg-white rounded-xl shadow-sm overflow-hidden">
                                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100">
                                    <span className="text-xs font-medium text-emerald-600 uppercase tracking-widest">
                                      Page 5 — Next Steps
                                    </span>
                                    <h2 className="text-2xl font-serif text-slate-800 mt-2">
                                      {page5.headerLine || "Starting The Journey"}
                                    </h2>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    {page5.thisWeek && (
                                      <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                          <Clock className="w-4 h-4 text-gray-600" />
                                          This Week
                                        </h3>
                                        <p className="text-xl text-gray-700">{page5.thisWeek.action}</p>
                                        <p className="text-gray-500 mt-1">{page5.thisWeek.tone}</p>
                                      </div>
                                    )}
                                    
                                    {page5.firstStep && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                          <Target className="w-4 h-4" />
                                          Your First Step
                                        </h3>
                                        <p className="text-xl text-amber-900 mb-2">{page5.firstStep.recommendation}</p>
                                        <p className="text-amber-800">{page5.firstStep.why}</p>
                                        {page5.firstStep.theirWordsEcho && (
                                          <div className="mt-3 p-3 bg-white/70 rounded border-l-4 border-amber-400">
                                            <p className="text-amber-800 italic">"{page5.firstStep.theirWordsEcho}"</p>
                                            <p className="text-amber-600 text-sm mt-1">Let's fix that first.</p>
                                          </div>
                                        )}
                                        {page5.firstStep.simpleCta && (
                                          <p className="mt-3 text-lg font-semibold text-amber-900">{page5.firstStep.simpleCta}</p>
                                        )}
                                      </div>
                                    )}
                                    
                                    {page5.theAsk && (
                                      <div className="bg-slate-800 rounded-lg p-6 text-center">
                                        <p className="text-slate-300 text-lg mb-4">{page5.theAsk}</p>
                                        <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors">
                                          <Phone className="w-5 h-5" />
                                          Book a Conversation
                                        </button>
                                        {page5.closingLine && (
                                          <p className="mt-4 text-amber-400 font-medium">{page5.closingLine}</p>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Feedback Box for Page 5 */}
                                    {discoveryEngagement?.id && currentMember?.practice_id && (
                                      <SectionCommentBox
                                        engagementId={discoveryEngagement.id}
                                        reportId={destinationReport?.id}
                                        practiceId={currentMember.practice_id}
                                        sectionType="page5_next_steps"
                                        originalContent={page5}
                                        existingComments={analysisComments}
                                        onCommentAdded={refetchComments}
                                      />
                                    )}
                                  </div>
                                </section>
                              )}
                            </>
                          );
                        }
                        
                        // Fallback to legacy format if no destination report
                        return (
                          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Legacy Client Report Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                              <p className="text-indigo-200 text-sm mb-2">Discovery Report</p>
                              <h2 className="text-2xl font-bold mb-2">
                                {generatedReport?.analysis?.executiveSummary?.headline || 'Your Path Forward'}
                              </h2>
                              <p className="text-indigo-100">
                                {generatedReport?.analysis?.executiveSummary?.keyInsight}
                              </p>
                            </div>
                            
                            <div className="p-6 space-y-6">
                              {/* What We Heard */}
                              {generatedReport?.analysis?.executiveSummary?.whatWeHeard && (
                                <div className="bg-indigo-50 rounded-lg p-6">
                                  <h3 className="text-lg font-semibold text-indigo-900 mb-3">What We Heard</h3>
                                  <p className="text-indigo-800 whitespace-pre-wrap">
                                    {generatedReport.analysis.executiveSummary.whatWeHeard}
                                  </p>
                                </div>
                              )}

                              {/* Your Vision */}
                              {generatedReport?.analysis?.destinationAnalysis?.visionNarrative && (
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Vision</h3>
                                  <p className="text-gray-700 whitespace-pre-wrap">
                                    {generatedReport.analysis.destinationAnalysis.visionNarrative}
                                  </p>
                                </div>
                              )}

                              {/* The Gap */}
                              {generatedReport?.analysis?.gapAnalysis?.primaryGaps?.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Standing In Your Way</h3>
                                  <div className="space-y-4">
                                    {generatedReport.analysis.gapAnalysis.primaryGaps.slice(0, 3).map((gap: any, idx: number) => (
                                      <div key={idx} className="border-l-4 border-amber-500 pl-4">
                                        <p className="font-medium text-gray-900">{gap.gap}</p>
                                        {gap.evidence && (
                                          <p className="text-gray-600 italic mt-1">"{gap.evidence}"</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recommended Path */}
                              {generatedReport?.analysis?.recommendedInvestments?.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Recommendations</h3>
                                  <div className="space-y-4">
                                    {generatedReport.analysis.recommendedInvestments.slice(0, 3).map((inv: any, idx: number) => (
                                      <div key={idx} className="bg-emerald-50 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <h4 className="font-semibold text-emerald-900">{inv.service}</h4>
                                          <span className="text-emerald-600 font-bold">
                                            {inv.monthlyInvestment || inv.annualInvestment}
                                          </span>
                                        </div>
                                        <p className="text-emerald-800">{inv.whyThisService}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Cost of Not Acting - Use Pass 1 data as primary source */}
                              {(() => {
                                const coi = destinationReport?.comprehensive_analysis?.costOfInaction ||
                                           destinationReport?.page4_numbers?.costOfInaction ||
                                           generatedReport?.analysis?.gapAnalysis?.costOfInaction;
                                if (!coi) return null;
                                return (
                                  <div className="bg-red-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-red-900 mb-2">The Cost of Waiting</h3>
                                    <p className="text-2xl font-bold text-red-700 mb-2">
                                      {coi.totalOverHorizon 
                                        ? `£${Math.round(coi.totalOverHorizon / 1000)}k+ over ${coi.timeHorizon || 3} years`
                                        : coi.annualFinancialCost || coi.annual}
                                    </p>
                                    <p className="text-red-800">
                                      {coi.narrative || coi.description}
                                    </p>
                                  </div>
                                );
                              })()}

                              {/* Next Steps */}
                              {generatedReport?.analysis?.nextSteps && (
                                <div className="bg-gray-50 rounded-lg p-6">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
                                  <p className="text-gray-700 whitespace-pre-wrap">
                                    {typeof generatedReport.analysis.nextSteps === 'string' 
                                      ? generatedReport.analysis.nextSteps
                                      : generatedReport.analysis.nextSteps.join('\n')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {viewMode === 'client' && !generatedReport && !destinationReport && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Generate the analysis first to preview the client view</p>
                    </div>
                  )}

                  {/* ADMIN VIEW - Detailed Analysis (existing content) */}
                  {viewMode === 'admin' && generatedReport && (
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
                            <p className="text-xl font-bold">{
                              destinationReport?.destination_clarity?.score ||
                              destinationReport?.page1_destination?.clarityScore ||
                              destinationReport?.page1_destination?.destinationClarityScore ||
                              generatedReport.discoveryScores?.clarityScore || 0
                            }/10</p>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-indigo-200 text-xs">Gap Score</p>
                            <p className="text-xl font-bold">{
                              destinationReport?.page2_gaps?.gapScore ||
                              (destinationReport?.page2_gaps?.gaps?.length || 0) ||
                              generatedReport.discoveryScores?.gapScore || 0
                            }/10</p>
                          </div>
                        </div>
                      </div>

                      {/* Gap Analysis - Use destinationReport (Pass 1/2) as primary source */}
                      {(() => {
                        // Prefer destinationReport.page2_gaps, fallback to generatedReport.analysis.gapAnalysis
                        const page2Gaps = destinationReport?.page2_gaps?.gaps || [];
                        const legacyGaps = generatedReport?.analysis?.gapAnalysis?.primaryGaps || [];
                        const gapsToDisplay = page2Gaps.length > 0 ? page2Gaps : legacyGaps;
                        const costOfInaction = destinationReport?.comprehensive_analysis?.costOfInaction || 
                                               generatedReport?.analysis?.gapAnalysis?.costOfInaction;
                        
                        if (gapsToDisplay.length === 0 && !costOfInaction) return null;
                        
                        return (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                            <h4 className="font-semibold text-amber-900 mb-4">Gap Analysis</h4>
                            <div className="space-y-3">
                              {gapsToDisplay.map((gap: any, idx: number) => {
                                // Handle both new (page2_gaps) and legacy (gapAnalysis) formats
                                const severity = gap.priority || gap.severity || gap.urgency || 'medium';
                                const gapTitle = gap.title || gap.gap || 'Gap identified';
                                const gapEvidence = gap.pattern || gap.evidence || '';
                                const financialImpact = gap.financialImpact || gap.currentImpact?.financialImpact || '';
                                const timeImpact = gap.timeImpact || gap.currentImpact?.timeImpact || '';
                                const emotionalImpact = gap.emotionalImpact || gap.currentImpact?.emotionalImpact || '';
                                
                                return (
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
                                            severity === 'high' || severity === 'critical' ? 'bg-red-100 text-red-700' :
                                            severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-600'
                                          }`}>
                                            {severity} priority
                                          </span>
                                        </div>
                                        <p className="font-medium text-gray-900">{gapTitle}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Evidence/Pattern quote */}
                                    {gapEvidence && (
                                      <p className="text-sm italic text-indigo-600 bg-indigo-50 p-2 rounded mb-2">
                                        "{gapEvidence}"
                                      </p>
                                    )}
                                    
                                    {/* Impact grid */}
                                    {(timeImpact || financialImpact || emotionalImpact) && (
                                      <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                        {timeImpact && (
                                          <div className="bg-gray-50 p-2 rounded">
                                            <p className="text-xs text-gray-500">Time Impact</p>
                                            <p className="font-medium">{timeImpact}</p>
                                          </div>
                                        )}
                                        {financialImpact && (
                                          <div className="bg-gray-50 p-2 rounded">
                                            <p className="text-xs text-gray-500">Financial Impact</p>
                                            <p className="font-medium text-red-600">{financialImpact}</p>
                                          </div>
                                        )}
                                        {emotionalImpact && (
                                          <div className="bg-gray-50 p-2 rounded">
                                            <p className="text-xs text-gray-500">Emotional Impact</p>
                                            <p className="font-medium">{emotionalImpact}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {gap.shiftRequired && (
                                      <p className="text-sm text-emerald-600 mt-2">
                                        <strong>Shift required:</strong> {gap.shiftRequired}
                                      </p>
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
                                );
                              })}
                            </div>
                            
                            {/* Cost of Inaction - Use comprehensive_analysis as primary source */}
                            {costOfInaction && (
                              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="font-medium text-red-800">Cost of Not Acting</p>
                                <p className="text-2xl font-bold text-red-900">
                                  {costOfInaction.totalOverHorizon 
                                    ? `£${Math.round(costOfInaction.totalOverHorizon / 1000)}k+ over ${costOfInaction.timeHorizon || 3} years`
                                    : costOfInaction.annualFinancialCost || costOfInaction.annual}
                                </p>
                                {costOfInaction.narrative && (
                                  <p className="text-sm text-red-700">{costOfInaction.narrative}</p>
                                )}
                                {costOfInaction.description && (
                                  <p className="text-sm text-red-700">{costOfInaction.description}</p>
                                )}
                                {costOfInaction.opportunityCost && (
                                  <p className="text-sm text-red-600 mt-2">
                                    <strong>Opportunity cost:</strong> {costOfInaction.opportunityCost}
                                  </p>
                                )}
                                {costOfInaction.personalCost && (
                                  <p className="text-sm text-red-600">
                                    <strong>Personal cost:</strong> {costOfInaction.personalCost}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Transformation Journey (new "travel agent" view) - Prefer Pass 1/2 data */}
                      {(() => {
                        // Prefer destinationReport.page3_journey (Pass 2) over transformationJourney (Stage 3)
                        const page3Journey = destinationReport?.page3_journey;
                        const legacyJourney = generatedReport?.analysis?.transformationJourney;
                        
                        // Map page3_journey to TransformationJourneyData format if available
                        let journeyData = legacyJourney;
                        if (page3Journey?.phases?.length > 0) {
                          journeyData = {
                            destination: page3Journey.headerLine || legacyJourney?.destination || '',
                            totalInvestment: destinationReport?.page4_numbers?.totalYear1 || legacyJourney?.totalInvestment || '',
                            totalTimeframe: '12 months',
                            phases: page3Journey.phases.map((phase: any, idx: number) => ({
                              phase: idx + 1,
                              timeframe: phase.timeframe || `Month ${(idx * 3) + 1}-${(idx + 1) * 3}`,
                              title: phase.headline || phase.title || `Phase ${idx + 1}`,
                              youWillHave: phase.outcome || (Array.isArray(phase.whatChanges) ? phase.whatChanges.join('. ') : phase.whatChanges) || '',
                              whatChanges: phase.feelsLike || '',
                              enabledBy: phase.enabledBy || '',
                              enabledByCode: phase.serviceCode || '',
                              investment: phase.price || ''
                            }))
                          };
                        }
                        
                        if (!journeyData?.phases?.length) return null;
                        
                        return (
                          <TransformationJourney 
                            journey={journeyData}
                            investmentSummary={generatedReport?.analysis?.investmentSummary || {
                              totalFirstYearInvestment: journeyData.totalInvestment,
                              projectedFirstYearReturn: destinationReport?.page4_numbers?.returns?.realistic?.total || '',
                              paybackPeriod: destinationReport?.page4_numbers?.paybackPeriod || ''
                            }}
                          />
                        );
                      })()}

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

                      {/* Closing Message - Prefer Pass 2 page5_next_steps over Stage 3 closingMessage */}
                      {(() => {
                        const page5 = destinationReport?.page5_next_steps || destinationReport?.page5_nextSteps;
                        const legacyClosing = generatedReport?.analysis?.closingMessage;
                        
                        // Map Pass 2 fields to display format
                        const theAsk = page5?.theAsk || (typeof legacyClosing === 'string' ? legacyClosing : legacyClosing?.personalNote);
                        const closingLine = page5?.closingLine || (typeof legacyClosing === 'string' ? 'Let\'s talk this week.' : legacyClosing?.callToAction);
                        const urgencyAnchor = page5?.urgencyAnchor || (typeof legacyClosing === 'object' ? legacyClosing?.urgencyReminder : null);
                        
                        if (!theAsk && !closingLine) return null;
                        
                        return (
                          <div className="bg-slate-800 rounded-xl p-6 text-white">
                            <div className="space-y-4">
                              {theAsk && (
                                <p className="text-lg text-center italic">
                                  "{theAsk}"
                                </p>
                              )}
                              {closingLine && (
                                <p className="text-center font-semibold text-emerald-300">
                                  {closingLine}
                                </p>
                              )}
                              {urgencyAnchor && (
                                <p className="text-sm text-center text-gray-300">
                                  {urgencyAnchor}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()}

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

                  {/* Notes Section (show when no report in admin view) */}
                  {viewMode === 'admin' && !generatedReport && (
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
function ClientDetailModal({ clientId, serviceLineCode, onClose, onNavigate }: { clientId: string; serviceLineCode: string; onClose: () => void; onNavigate: (page: Page) => void }) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Service-line specific tabs
  const isManagementAccounts = serviceLineCode === 'management_accounts' || serviceLineCode === 'business_intelligence';
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'context' | 'sprint' | 'assessments' | 'documents' | 'analysis'>(
    isManagementAccounts ? 'assessments' : 'overview'
  );
  
  // MA-specific state
  const [generatingMAInsights, setGeneratingMAInsights] = useState(false);
  const [maInsights, setMAInsights] = useState<any>(null);
  const [maInsightContextId, setMAInsightContextId] = useState<string | null>(null);
  const [maInsightV2Id, setMAInsightV2Id] = useState<string | null>(null); // For v2 insights from ma_monthly_insights
  const [isMAInsightShared, setIsMAInsightShared] = useState(false);
  const [maViewMode, setMAViewMode] = useState<'admin' | 'client'>('admin');
  
  // MA Two-Pass Report state (new architecture)
  const [maAssessmentReport, setMAAssessmentReport] = useState<any>(null);
  const [generatingMAReport, setGeneratingMAReport] = useState(false);
  const [regeneratingMAReport, setRegeneratingMAReport] = useState(false);
  const [maReportStatus, setMAReportStatus] = useState<string | null>(null);
  const [isMAReportShared, setIsMAReportShared] = useState(false);
  const [maEngagementId, setMAEngagementId] = useState<string | null>(null);
  
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

      // Fetch assessments based on service line context
      // For service-specific views (like management_accounts), only show relevant assessments
      let allAssessments: any[] = [];
      
      if (serviceLineCode === 'management_accounts' || serviceLineCode === 'business_intelligence') {
        // For Business Intelligence (formerly Management Accounts), only show BI assessment
        const { data: maAssessment } = await supabase
          .from('service_line_assessments')
          .select('id, service_line_code, responses, completion_percentage, completed_at, extracted_insights, started_at, updated_at')
          .eq('client_id', clientId)
          .in('service_line_code', ['management_accounts', 'business_intelligence'])
          .maybeSingle();
        
        if (maAssessment) {
          allAssessments = [{
            assessment_type: maAssessment.service_line_code,
            responses: maAssessment.responses,
            status: maAssessment.completed_at ? 'completed' : (maAssessment.completion_percentage > 0 ? 'in_progress' : 'not_started'),
            completed_at: maAssessment.completed_at,
            extracted_insights: maAssessment.extracted_insights,
            completion_percentage: maAssessment.completion_percentage,
            is_service_line: true
          }];
        }
      } else {
        // For other service lines or general views, fetch all assessments
        // Fetch discovery assessments (Part 1, 2, 3)
        const { data: assessments } = await supabase
          .from('client_assessments')
          .select('assessment_type, responses, status, completed_at')
          .eq('client_id', clientId)
          .in('assessment_type', ['part1', 'part2', 'part3']);

        // Fetch service line assessments for the specific service line
        const { data: serviceAssessments } = await supabase
          .from('service_line_assessments')
          .select('id, service_line_code, responses, completion_percentage, completed_at, extracted_insights, started_at, updated_at')
          .eq('client_id', clientId)
          .eq('service_line_code', serviceLineCode);

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

        // Combine - only include discovery assessments for non-MA service lines that need them
        allAssessments = [...(assessments || []), ...formattedServiceAssessments];
      }

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
      
      // Load most recent MA insight if available
      // First check ma_monthly_insights (v2) for this client's engagement
      let maInsightV2 = null;
      let monthlyInsightsData: any = null; // Store monthlyInsights for later use
      const { data: engagement } = await supabase
        .from('ma_engagements')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (engagement) {
        const { data: monthlyInsights } = await supabase
          .from('ma_monthly_insights')
          .select('*')
          .eq('engagement_id', engagement.id)
          .is('snapshot_id', null) // v2 insights only
          .order('period_end_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (monthlyInsights) {
          monthlyInsightsData = monthlyInsights; // Store for later use
          
          // Fetch true cash calculation if available
          let trueCashData = null;
          if (monthlyInsights.true_cash_calculation_id) {
            const { data: trueCash } = await supabase
              .from('ma_true_cash_calculations')
              .select('*')
              .eq('id', monthlyInsights.true_cash_calculation_id)
              .maybeSingle();
            
            if (trueCash) {
              trueCashData = {
                isHealthy: trueCash.is_positive || (trueCash.true_cash_available >= 0),
                implication: trueCash.true_cash_available < 0 
                  ? 'Your true cash position is negative. Immediate action may be needed.'
                  : trueCash.days_runway && trueCash.days_runway < 30
                  ? `You have ${trueCash.days_runway} days of runway remaining.`
                  : 'Your true cash position is healthy.'
              };
            }
          }
          
          // Convert v2 format to expected format
          maInsightV2 = {
            headline: {
              text: monthlyInsights.headline_text,
              sentiment: monthlyInsights.headline_sentiment
            },
            keyInsights: monthlyInsights.insights || [],
            decisionsEnabled: monthlyInsights.decisions_enabled || [],
            watchList: monthlyInsights.watch_list || [],
            trueCashSection: monthlyInsights.true_cash_narrative ? {
              narrative: monthlyInsights.true_cash_narrative,
              ...(trueCashData || {})
            } : null,
            tuesdayQuestionAnswer: monthlyInsights.tuesday_question_original ? {
              originalQuestion: monthlyInsights.tuesday_question_original,
              answer: monthlyInsights.tuesday_question_answer,
              supportingData: monthlyInsights.tuesday_question_supporting_data?.supportingData || [],
              verdict: monthlyInsights.tuesday_question_supporting_data?.verdict
            } : null,
            clientQuotesUsed: monthlyInsights.client_quotes_used || []
          };
        }
      }
      
      // Fallback to old client_context format if v2 not found
      // IMPORTANT: Must filter by data_source_type to avoid showing unrelated notes
      const maInsightContext = !maInsightV2 ? (context || []).find((c: any) => 
        c.context_type === 'note' && 
        c.processed === true && 
        (c.data_source_type === 'management_accounts_analysis' || c.data_source_type === 'business_intelligence_analysis') &&
        c.content && 
        typeof c.content === 'string' &&
        (c.content.includes('"headline"') || c.content.includes('"keyInsights"'))
      ) : null;
      
      if (maInsightV2 && monthlyInsightsData) {
        // Use v2 insight from ma_monthly_insights
        setMAInsights({ insight: maInsightV2, success: true });
        setMAInsightContextId(null); // v2 insights don't use client_context
        setMAInsightV2Id(monthlyInsightsData.id); // Store v2 insight ID
        setIsMAInsightShared(monthlyInsightsData.shared_with_client || false);
      } else if (maInsightContext) {
        // Use old format from client_context
        try {
          const parsed = typeof maInsightContext.content === 'string' 
            ? JSON.parse(maInsightContext.content) 
            : maInsightContext.content;
          setMAInsights({ insight: parsed, success: true });
          setMAInsightContextId(maInsightContext.id);
          setIsMAInsightShared(maInsightContext.is_shared || false);
        } catch (e) {
          console.error('Error parsing MA insight:', e);
        }
      } else {
        setMAInsights(null);
        setMAInsightContextId(null);
        setMAInsightV2Id(null);
        setIsMAInsightShared(false);
      }
      
      // Load MA Assessment Report (Two-Pass Architecture)
      // Reports can exist without engagement (pre-sales analysis to secure the engagement)
      console.log('[MA Report] Checking for two-pass report, engagement:', engagement?.id || 'None', 'client:', clientId);
      
      // Set engagementId if we have one (optional for two-pass system)
      setMAEngagementId(engagement?.id || null);
      
      // Try to find report by engagement_id first, then by client_id
      let assessmentReport = null;
      
      if (engagement) {
        const { data } = await supabase
          .from('ma_assessment_reports')
          .select('*')
          .eq('engagement_id', engagement.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        assessmentReport = data;
      }
      
      // If no report found via engagement, check by client_id
      if (!assessmentReport) {
        const { data } = await supabase
          .from('ma_assessment_reports')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        assessmentReport = data;
      }
      
      if (assessmentReport) {
        setMAAssessmentReport(assessmentReport);
        setMAReportStatus(assessmentReport.status);
        setIsMAReportShared(assessmentReport.shared_with_client || false);
        console.log('[MA Report] Loaded assessment report:', assessmentReport.id, 'Status:', assessmentReport.status);
      } else {
        setMAAssessmentReport(null);
        setMAReportStatus(null);
        setIsMAReportShared(false);
      }
      
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
        <div className="flex border-b border-gray-200">
          {(isManagementAccounts 
            ? ['assessments', 'documents', 'analysis'] 
            : ['overview', 'roadmap', 'assessments', 'context', 'sprint']
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors text-center ${
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
                          
                          try {
                            // Find or create engagement for this client
                            let { data: engagement, error: engError } = await supabase
                              .from('ma_engagements')
                              .select('id')
                              .eq('client_id', clientId)
                              .eq('status', 'active')
                              .maybeSingle();
                            
                            if (engError || !engagement) {
                              // Create engagement if it doesn't exist
                              const { data: newEngagement, error: createError } = await supabase
                                .from('ma_engagements')
                                .insert({
                                  client_id: clientId,
                                  practice_id: client?.practice_id,
                                  tier: 'foresight',
                                  frequency: 'monthly',
                                  status: 'active'
                                })
                                .select('id')
                                .single();
                              
                              if (createError) {
                                throw new Error(`Failed to create engagement: ${createError.message}`);
                              }
                              engagement = newEngagement;
                            }
                            
                            // Upload files to ma-documents bucket specifically
                            const uploadedDocs: UploadedDocument[] = [];
                            setUploadingFiles(true);
                            
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i];
                              setUploadProgress({ current: i + 1, total: files.length, fileName: file.name });
                              
                              const timestamp = Date.now();
                              const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                              const storagePath = `${engagement.id}/${timestamp}_${safeFileName}`;
                              
                              // Upload to ma-documents bucket
                              console.log(`[MA Upload] Uploading to ma-documents/${storagePath}`);
                              const { data: uploadData, error: uploadError } = await supabase.storage
                                .from('ma-documents')
                                .upload(storagePath, file, {
                                  cacheControl: '3600',
                                  upsert: false
                                });
                              
                              if (uploadError) {
                                console.error(`[MA Upload] Storage upload error for ${file.name}:`, uploadError);
                                console.error(`[MA Upload] Error details:`, {
                                  message: uploadError.message,
                                  name: uploadError.name
                                });
                                
                                // If RLS error, provide helpful message
                                if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
                                  alert(`Upload failed: Storage bucket RLS policy error. Please check Supabase storage policies for 'ma-documents' bucket. Error: ${uploadError.message}`);
                                } else {
                                  alert(`Failed to upload ${file.name}: ${uploadError.message}`);
                                }
                                continue;
                              }
                              
                              console.log(`[MA Upload] File uploaded successfully:`, uploadData);
                              
                              uploadedDocs.push({
                                fileName: file.name,
                                fileUrl: storagePath, // Store path, not full URL
                                fileSize: file.size,
                                fileType: file.type || file.name.split('.').pop() || 'application/pdf'
                              });
                            }
                            
                            setUploadingFiles(false);
                            
                            if (uploadedDocs.length === 0) {
                              alert('Failed to upload files');
                              return;
                            }
                            
                            // Create ma_uploaded_documents records and trigger extraction
                            for (const doc of uploadedDocs) {
                              // Use the storage path directly
                              const filePath = doc.fileUrl;
                              
                              // Create ma_uploaded_documents record
                              const { data: maDocument, error: docError } = await supabase
                                .from('ma_uploaded_documents')
                                .insert({
                                  engagement_id: engagement.id,
                                  filename: doc.fileName,
                                  file_path: filePath,
                                  file_type: doc.fileType || 'application/pdf',
                                  file_size_bytes: doc.fileSize,
                                  extraction_status: 'pending'
                                })
                                .select('id')
                                .single();
                              
                              if (docError) {
                                console.error('Error creating MA document record:', docError);
                                continue;
                              }
                              
                              // Also create client_context record for backward compatibility
                              await supabase
                                .from('client_context')
                                .insert({
                                  practice_id: client?.practice_id,
                                  client_id: clientId,
                                  context_type: 'document',
                                  content: doc.fileUrl,
                                  source_file_url: doc.fileUrl,
                                  data_source_type: 'accounts',
                                  added_by: currentMember?.id,
                                  processed: false
                                });
                              
                              // Call extract-ma-financials edge function
                              console.log(`[MA Upload] Calling extract-ma-financials for document ${maDocument.id}`, {
                                documentId: maDocument.id,
                                engagementId: engagement.id,
                                filePath: filePath
                              });
                              
                              try {
                                const { data: extractResult, error: extractError } = await supabase.functions.invoke('extract-ma-financials', {
                                  body: {
                                    documentId: maDocument.id,
                                    engagementId: engagement.id
                                  }
                                });
                                
                                if (extractError) {
                                  console.error('[MA Upload] Extract function error:', extractError);
                                  // Update document status to failed
                                  await supabase
                                    .from('ma_uploaded_documents')
                                    .update({
                                      extraction_status: 'failed',
                                      extraction_error: extractError.message || JSON.stringify(extractError)
                                    })
                                    .eq('id', maDocument.id);
                                  alert(`Document uploaded but extraction failed: ${extractError.message || 'Unknown error'}`);
                                } else {
                                  console.log('[MA Upload] Extraction started successfully:', extractResult);
                                }
                              } catch (invokeError: any) {
                                console.error('[MA Upload] Failed to invoke extract-ma-financials:', invokeError);
                                await supabase
                                  .from('ma_uploaded_documents')
                                  .update({
                                    extraction_status: 'failed',
                                    extraction_error: invokeError.message || 'Failed to invoke extraction function'
                                  })
                                  .eq('id', maDocument.id);
                                alert(`Document uploaded but failed to start extraction: ${invokeError.message || 'Check console for details'}`);
                              }
                            }
                            
                            // Refresh client data
                            await fetchClientDetail();
                            alert(`Successfully uploaded ${uploadedDocs.length} document(s). Extraction started.`);
                            
                            // Clear the input
                            e.target.value = '';
                          } catch (error: any) {
                            console.error('Error uploading MA documents:', error);
                            alert('Failed to upload documents: ' + (error.message || 'Unknown error'));
                          }
                        }}
                      />
                      <label htmlFor="ma-document-upload" className="cursor-pointer">
                        {uploadingFiles ? (
                          <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
                            <p className="text-indigo-600 mb-2">Uploading {uploadProgress.fileName}...</p>
                            <p className="text-sm text-gray-400">{uploadProgress.current} of {uploadProgress.total}</p>
                          </>
                        ) : (
                          <>
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">Drop files here or click to upload</p>
                            <p className="text-sm text-gray-400">PDF, Excel, or CSV files</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
                      {client?.maDocuments && client.maDocuments.length > 0 && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete ALL ${client.maDocuments.length} documents? This cannot be undone.`)) {
                              return;
                            }
                            
                            try {
                              console.log('[MA] Deleting all documents');
                              const docs = client.maDocuments as any[];
                              
                              for (const doc of docs) {
                                // Delete extracted financials first
                                const { data: extractedFinancials } = await supabase
                                  .from('ma_extracted_financials')
                                  .select('id')
                                  .eq('document_id', doc.id);
                                
                                if (extractedFinancials && extractedFinancials.length > 0) {
                                  const extractedIds = extractedFinancials.map((f: any) => f.id);
                                  
                                  // Delete true cash calculations
                                  await supabase
                                    .from('ma_true_cash_calculations')
                                    .delete()
                                    .in('extracted_financials_id', extractedIds);
                                  
                                  // Delete period comparisons
                                  await supabase
                                    .from('ma_period_comparisons')
                                    .delete()
                                    .in('current_period_id', extractedIds);
                                  
                                  await supabase
                                    .from('ma_period_comparisons')
                                    .delete()
                                    .in('prior_period_id', extractedIds);
                                  
                                  // Delete extracted financials
                                  await supabase
                                    .from('ma_extracted_financials')
                                    .delete()
                                    .eq('document_id', doc.id);
                                }
                                
                                // Delete file from storage
                                if (doc.file_path) {
                                  await supabase.storage
                                    .from('ma-documents')
                                    .remove([doc.file_path]);
                                }
                                
                                // Delete document record
                                await supabase
                                  .from('ma_uploaded_documents')
                                  .delete()
                                  .eq('id', doc.id);
                                
                                // Delete from client_context
                                await supabase
                                  .from('client_context')
                                  .delete()
                                  .eq('source_file_url', doc.file_path)
                                  .eq('client_id', clientId)
                                  .eq('context_type', 'document');
                              }
                              
                              console.log('[MA] All documents deleted successfully');
                              alert(`Successfully deleted ${docs.length} documents`);
                              await fetchClientDetail();
                            } catch (err: any) {
                              console.error('[MA] Delete all error:', err);
                              alert('Failed to delete all documents: ' + err.message);
                            }
                          }}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete All
                        </button>
                      )}
                    </div>
                    <div className="p-6">
                      {/* Show MA documents (v2) if available, otherwise fallback to old format */}
                      {(() => {
                        const maDocs = client?.maDocuments || [];
                        const oldDocs = client?.documents || [];
                        
                        if (maDocs.length > 0) {
                          return (
                            <div className="space-y-3">
                              {maDocs.map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <p className="font-medium text-gray-900">{doc.filename}</p>
                                      <p className="text-sm text-gray-500">
                                        Uploaded {new Date(doc.created_at).toLocaleDateString()}
                                        {doc.extraction_status === 'completed' && doc.extracted_at && (
                                          <> • Extracted {new Date(doc.extracted_at).toLocaleDateString()}</>
                                        )}
                                      </p>
                                      {doc.extraction_error && (
                                        <p className="text-sm text-red-600 mt-1">Error: {doc.extraction_error}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      doc.extraction_status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                      doc.extraction_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                      doc.extraction_status === 'failed' ? 'bg-red-100 text-red-700' :
                                      'bg-amber-100 text-amber-700'
                                    }`}>
                                      {doc.extraction_status === 'completed' ? 'Extracted' :
                                       doc.extraction_status === 'processing' ? 'Processing...' :
                                       doc.extraction_status === 'failed' ? 'Failed' :
                                       'Pending'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {doc.extraction_status === 'pending' && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              const { data: engagement } = await supabase
                                                .from('ma_engagements')
                                                .select('id')
                                                .eq('client_id', clientId)
                                                .maybeSingle();
                                              
                                              if (!engagement) {
                                                alert('No engagement found. Please upload a document first.');
                                                return;
                                              }
                                              
                                              console.log('[MA] Manually triggering extraction for document:', doc.id);
                                              const { data, error } = await supabase.functions.invoke('extract-ma-financials', {
                                                body: {
                                                  documentId: doc.id,
                                                  engagementId: engagement.id
                                                }
                                              });
                                              
                                              if (error) {
                                                console.error('[MA] Extraction error:', error);
                                                alert('Failed to extract: ' + error.message);
                                              } else {
                                                console.log('[MA] Extraction started:', data);
                                                alert('Extraction started. Check logs for progress.');
                                                await fetchClientDetail();
                                              }
                                            } catch (err: any) {
                                              console.error('[MA] Error:', err);
                                              alert('Error: ' + err.message);
                                            }
                                          }}
                                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                        >
                                          Extract
                                        </button>
                                      )}
                                      <button
                                          onClick={async () => {
                                            if (!confirm(`Are you sure you want to delete "${doc.filename}"? This will also remove any extracted financial data.`)) {
                                              return;
                                            }
                                            
                                            try {
                                              console.log('[MA] Deleting document:', doc.id);
                                              
                                              // Delete extracted financials first (cascade should handle this, but being explicit)
                                              const { data: extractedFinancials } = await supabase
                                                .from('ma_extracted_financials')
                                                .select('id')
                                                .eq('document_id', doc.id);
                                              
                                              if (extractedFinancials && extractedFinancials.length > 0) {
                                                const extractedIds = extractedFinancials.map((f: any) => f.id);
                                                
                                                // Delete true cash calculations
                                                await supabase
                                                  .from('ma_true_cash_calculations')
                                                  .delete()
                                                  .in('extracted_financials_id', extractedIds);
                                                
                                                // Delete period comparisons
                                                await supabase
                                                  .from('ma_period_comparisons')
                                                  .delete()
                                                  .in('current_period_id', extractedIds);
                                                
                                                await supabase
                                                  .from('ma_period_comparisons')
                                                  .delete()
                                                  .in('prior_period_id', extractedIds);
                                                
                                                // Delete extracted financials
                                                await supabase
                                                  .from('ma_extracted_financials')
                                                  .delete()
                                                  .eq('document_id', doc.id);
                                              }
                                              
                                              // Delete file from storage
                                              const { error: storageError } = await supabase.storage
                                                .from('ma-documents')
                                                .remove([doc.file_path]);
                                              
                                              if (storageError) {
                                                console.error('[MA] Storage delete error:', storageError);
                                                // Continue with DB deletion even if storage fails
                                              }
                                              
                                              // Delete document record
                                              const { error: deleteError } = await supabase
                                                .from('ma_uploaded_documents')
                                                .delete()
                                                .eq('id', doc.id);
                                              
                                              if (deleteError) {
                                                throw new Error(`Failed to delete document record: ${deleteError.message}`);
                                              }
                                              
                                              // Also delete from client_context if it exists
                                              await supabase
                                                .from('client_context')
                                                .delete()
                                                .eq('source_file_url', doc.file_path)
                                                .eq('client_id', clientId)
                                                .eq('context_type', 'document');
                                              
                                              console.log('[MA] Document deleted successfully');
                                              alert('Document deleted successfully');
                                              await fetchClientDetail();
                                            } catch (err: any) {
                                              console.error('[MA] Delete error:', err);
                                              alert('Failed to delete document: ' + err.message);
                                            }
                                          }}
                                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Delete
                                        </button>
                                      </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        // Fallback to old format
                        if (oldDocs.length > 0) {
                          return (
                            <div className="space-y-3">
                              {oldDocs.map((doc: any) => (
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
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      doc.processed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {doc.processed ? 'Processed' : 'Pending'}
                                    </span>
                                    <button
                                      onClick={async () => {
                                        if (!confirm(`Are you sure you want to delete this document?`)) {
                                          return;
                                        }
                                        
                                        try {
                                          // Extract file path from source_file_url or content
                                          const filePath = doc.source_file_url || doc.content;
                                          
                                          // Try to determine bucket from path
                                          let bucket = 'client-documents';
                                          let storagePath = filePath;
                                          
                                          if (filePath.includes('/storage/v1/object/public/')) {
                                            // Extract bucket and path from public URL
                                            const parts = filePath.split('/storage/v1/object/public/');
                                            if (parts[1]) {
                                              const pathParts = parts[1].split('/');
                                              bucket = pathParts[0];
                                              storagePath = pathParts.slice(1).join('/');
                                            }
                                          } else if (filePath.includes('ma-documents/')) {
                                            bucket = 'ma-documents';
                                            storagePath = filePath.replace(/^.*ma-documents\//, '');
                                          } else if (filePath.includes('client-documents/')) {
                                            bucket = 'client-documents';
                                            storagePath = filePath.replace(/^.*client-documents\//, '');
                                          }
                                          
                                          // Delete from storage
                                          if (storagePath) {
                                            const { error: storageError } = await supabase.storage
                                              .from(bucket)
                                              .remove([storagePath]);
                                            
                                            if (storageError) {
                                              console.error('[MA] Storage delete error:', storageError);
                                              // Continue with DB deletion even if storage fails
                                            }
                                          }
                                          
                                          // Delete from client_context
                                          const { error: deleteError } = await supabase
                                            .from('client_context')
                                            .delete()
                                            .eq('id', doc.id);
                                          
                                          if (deleteError) {
                                            throw new Error(`Failed to delete document: ${deleteError.message}`);
                                          }
                                          
                                          console.log('[MA] Document deleted successfully');
                                          alert('Document deleted successfully');
                                          await fetchClientDetail();
                                        } catch (err: any) {
                                          console.error('[MA] Delete error:', err);
                                          alert('Failed to delete document: ' + err.message);
                                        }
                                      }}
                                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        return (
                          <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No documents uploaded yet</p>
                            <p className="text-sm text-gray-400 mt-2">Upload management accounts to enable AI analysis</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* ANALYSIS TAB (Management Accounts) */}
              {activeTab === 'analysis' && isManagementAccounts && (
                <div className="space-y-6">
                  {/* View Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMAViewMode('admin')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          maViewMode === 'admin'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Admin View
                      </button>
                      <button
                        onClick={() => setMAViewMode('client')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          maViewMode === 'client'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Client View
                      </button>
                    </div>
                    {(isMAInsightShared || isMAReportShared) && (
                      <span className="flex items-center gap-1 text-sm text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        {isMAReportShared ? 'Report shared with client' : 'Insights shared with client'}
                      </span>
                    )}
                  </div>

                  {/* ADMIN VIEW */}
                  {maViewMode === 'admin' && (
                  <>
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
                            // Try to find an engagement for v2 mode, otherwise use v1 mode
                            let requestBody: any = {
                              clientId: clientId,
                              practiceId: client?.practice_id
                            };
                            
                            // Check if there's an engagement (v2 mode)
                            const { data: engagement } = await supabase
                              .from('ma_engagements')
                              .select('id')
                              .eq('client_id', clientId)
                              .eq('status', 'active')
                              .maybeSingle();
                            
                            if (engagement) {
                              // Use v2 mode with engagementId
                              requestBody = {
                                engagementId: engagement.id,
                                regenerate: true // Always regenerate when button is clicked
                              };
                              console.log('[MA Insights] Using v2 mode with engagementId:', engagement.id);
                              console.log('[MA Insights] Request body (v2):', requestBody);
                              console.log('[MA Insights] Regenerate flag in requestBody:', requestBody.regenerate);
                            } else {
                              // Use v1 mode with clientId
                              requestBody = {
                                ...requestBody,
                                regenerate: true // Always regenerate when button is clicked
                              };
                              console.log('[MA Insights] Using v1 mode with clientId:', clientId);
                              console.log('[MA Insights] Request body (v1):', requestBody);
                              console.log('[MA Insights] Regenerate flag in requestBody:', requestBody.regenerate);
                            }
                            
                            console.log('[MA Insights] Final request body being sent:', JSON.stringify(requestBody, null, 2));
                            console.log('[MA Insights] Regenerate value:', requestBody.regenerate, typeof requestBody.regenerate);
                            
                            const { data, error } = await supabase.functions.invoke('generate-ma-insights', {
                              body: requestBody
                            });
                            
                            console.log('[MA Insights] Response received:', { data, error });
                            
                            if (error) throw error;
                            setMAInsights(data);
                            // Refresh to load the stored insight
                            await fetchClientDetail();
                          } catch (error: any) {
                            console.error('Error generating MA insights:', error);
                            alert('Failed to generate insights: ' + (error.message || 'Unknown error. Check console for details.'));
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
                      <div className={`p-3 rounded-lg ${client?.assessments?.some((a: any) => (a.assessment_type === 'management_accounts' || a.assessment_type === 'business_intelligence') && a.status === 'completed') ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-sm font-medium">Assessment</p>
                        <p className={`text-xs ${client?.assessments?.some((a: any) => (a.assessment_type === 'management_accounts' || a.assessment_type === 'business_intelligence') && a.status === 'completed') ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {client?.assessments?.some((a: any) => (a.assessment_type === 'management_accounts' || a.assessment_type === 'business_intelligence') && a.status === 'completed') ? '✓ Completed' : '○ Pending'}
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

                  {/* NEW: Two-Pass Report Generation (Assessment-Focused) */}
                  {/* Works with clientId directly - no engagement required for pre-sales analysis */}
                  <div className="rounded-xl p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          Two-Pass Assessment Report
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Generate comprehensive admin guidance and client presentation from the assessment to help secure the engagement
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {maReportStatus && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            maReportStatus === 'generated' ? 'bg-emerald-100 text-emerald-700' :
                            maReportStatus === 'error' ? 'bg-red-100 text-red-700' :
                            maReportStatus?.includes('running') ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {maReportStatus === 'generated' ? '✓ Report Ready' :
                             maReportStatus === 'error' ? '✗ Error' :
                             maReportStatus === 'pass1_running' ? 'Pass 1 Running...' :
                             maReportStatus === 'pass2_running' ? 'Pass 2 Running...' :
                             maReportStatus === 'pass1_complete' ? 'Pass 1 Complete' :
                             'Pending'}
                          </span>
                        )}
                        <button
                          onClick={async () => {
                              setGeneratingMAReport(true);
                              setMAReportStatus('pass1_running');
                              
                              try {
                                console.log('[MA Report] Starting two-pass generation for client:', clientId);
                                
                                // Call Pass 1 - uses clientId directly, no engagement required
                                const { data, error } = await supabase.functions.invoke('generate-ma-report-pass1', {
                                  body: { 
                                    clientId: clientId,
                                    practiceId: client?.practice_id,
                                    engagementId: maEngagementId || null // optional - include if exists
                                  }
                                });
                                
                                if (error) throw error;
                                
                                console.log('[MA Report] Pass 1 response:', data);
                                const reportId = data?.reportId;
                                
                                // Poll for completion (Pass 2 is triggered automatically by Pass 1)
                                let attempts = 0;
                                const maxAttempts = 90; // 180 seconds max (3 minutes for AI processing both passes)
                                
                                const pollForCompletion = async () => {
                                  // Query by reportId if available, otherwise by client_id
                                  const query = reportId 
                                    ? supabase.from('ma_assessment_reports').select('*').eq('id', reportId).single()
                                    : supabase.from('ma_assessment_reports').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single();
                                  
                                  const { data: report } = await query;
                                  
                                  if (report) {
                                    setMAReportStatus(report.status);
                                    
                                    // Also update the report in state if pass1 is complete (so admin view is available)
                                    if (report.status === 'pass1_complete' || report.status === 'pass2_running') {
                                      setMAAssessmentReport(report);
                                      console.log('[MA Report] Pass 1 complete, admin view available');
                                    }
                                    
                                    if (report.status === 'generated') {
                                      setMAAssessmentReport(report);
                                      setIsMAReportShared(report.shared_with_client || false);
                                      console.log('[MA Report] Generation complete!');
                                      return true;
                                    } else if (report.status === 'error') {
                                      throw new Error(report.error_message || 'Report generation failed');
                                    }
                                  }
                                  
                                  return false;
                                };
                                
                                // Initial check
                                let complete = await pollForCompletion();
                                
                                // Poll every 2 seconds if not complete
                                while (!complete && attempts < maxAttempts) {
                                  await new Promise(resolve => setTimeout(resolve, 2000));
                                  complete = await pollForCompletion();
                                  attempts++;
                                }
                                
                                if (!complete) {
                                  console.log('[MA Report] Polling timeout - check status manually');
                                  // Final refresh to get latest state
                                  await fetchClientDetail();
                                  // Show a more helpful message
                                  alert('Report generation is taking longer than expected. The admin view should be available. Refresh the page in a minute to see the client view.');
                                }
                                
                              } catch (error: any) {
                                console.error('[MA Report] Error:', error);
                                setMAReportStatus('error');
                                alert('Failed to generate report: ' + (error.message || 'Unknown error'));
                              } finally {
                                setGeneratingMAReport(false);
                              }
                            }}
                            disabled={generatingMAReport}
                            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2 font-medium"
                          >
                            {generatingMAReport ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                {maAssessmentReport ? 'Regenerate Report' : 'Generate Report'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* What the two-pass approach generates */}
                      {maEngagementId && (
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-purple-200">
                          <div className="bg-white/70 rounded-lg p-3">
                            <p className="text-sm font-medium text-purple-900">Pass 1: Admin Guidance</p>
                            <p className="text-xs text-purple-700 mt-1">
                              Extracts quotes, identifies gaps, generates call scripts, objection handling, and scenarios to build
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-lg p-3">
                            <p className="text-sm font-medium text-purple-900">Pass 2: Client Presentation</p>
                            <p className="text-xs text-purple-700 mt-1">
                              Creates the "wow" - visual previews, emotional connection, tier recommendations
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Show Two-Pass Report if available (also show during regeneration to preserve tabs) */}
                  {maAssessmentReport && (maAssessmentReport.status === 'generated' || maAssessmentReport.status === 'pass2_running' || regeneratingMAReport) && maAssessmentReport.pass1_data && (
                    <div className="space-y-6">
                      {/* Regenerating Banner */}
                      {(maAssessmentReport.status === 'pass2_running' || regeneratingMAReport) && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                          <div>
                            <p className="font-medium text-purple-800">Regenerating client view...</p>
                            <p className="text-sm text-purple-600">Using your call notes, transcript, and any additional context</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Report Header with Share Status and Portal Link */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            Assessment Analysis Report
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {isMAReportShared ? (
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Shared with client
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                Not shared with client
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Create Engagement or Go to MA Portal Button */}
                          {maEngagementId ? (
                            <button
                              onClick={() => onNavigate('ma-portal')}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            >
                              <TrendingUp className="w-4 h-4" />
                              Go to MA Portal
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                // Get recommended tier from report
                                const recommendedTier = maAssessmentReport?.pass2_data?.recommendedApproach?.tier || 'foresight';
                                
                                try {
                                  const { data: newEng, error } = await supabase
                                    .from('ma_engagements')
                                    .insert({
                                      client_id: clientId,
                                      practice_id: client?.practice_id,
                                      tier: recommendedTier,
                                      frequency: 'monthly',
                                      monthly_fee: recommendedTier === 'clarity' ? 2500 : recommendedTier === 'foresight' ? 4000 : 6500,
                                      status: 'active',
                                      start_date: new Date().toISOString().split('T')[0]
                                    })
                                    .select('id')
                                    .single();
                                  
                                  if (error) throw error;
                                  setMAEngagementId(newEng.id);
                                  alert(`${recommendedTier.charAt(0).toUpperCase() + recommendedTier.slice(1)} engagement created! Click "Go to MA Portal" to start delivering.`);
                                } catch (error: any) {
                                  console.error('[MA] Error creating engagement:', error);
                                  alert('Failed to create engagement: ' + error.message);
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Create Engagement
                            </button>
                          )}
                        <button
                          onClick={async () => {
                            const newSharedStatus = !isMAReportShared;
                            
                            try {
                              const { error } = await supabase
                                .from('ma_assessment_reports')
                                .update({ 
                                  shared_with_client: newSharedStatus,
                                  shared_at: newSharedStatus ? new Date().toISOString() : null,
                                  shared_by: newSharedStatus ? currentMember?.id : null
                                })
                                .eq('id', maAssessmentReport.id);
                              
                              if (error) throw error;
                              
                              setIsMAReportShared(newSharedStatus);
                              
                              if (newSharedStatus) {
                                alert('Report shared with client');
                              } else {
                                alert('Report removed from client view');
                              }
                            } catch (error: any) {
                              console.error('Error updating share status:', error);
                              alert('Failed to update share status: ' + error.message);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            isMAReportShared
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {isMAReportShared ? (
                            <>
                              <X className="w-4 h-4" />
                              Remove from Client View
                            </>
                          ) : (
                            <>
                              <Share2 className="w-4 h-4" />
                              Share with Client
                            </>
                          )}
                        </button>
                        </div>
                      </div>
                      
                      {/* Render the appropriate view component */}
                      <MAAdminReportView 
                        report={{
                          pass1_data: maAssessmentReport.pass1_data,
                          pass2_data: maAssessmentReport.pass2_data,
                          admin_view: maAssessmentReport.admin_view
                        }}
                        engagement={client}
                        clientName={client?.name || client?.client_company}
                        initialContext={maAssessmentReport.call_context || undefined}
                        onSaveContext={async (context) => {
                          try {
                            const { error } = await supabase
                              .from('ma_assessment_reports')
                              .update({ call_context: context })
                              .eq('id', maAssessmentReport.id);
                            
                            if (error) {
                              console.error('[MA Context] Failed to save:', error);
                              throw error;
                            }
                            console.log('[MA Context] Saved successfully');
                          } catch (err) {
                            console.error('[MA Context] Save error:', err);
                            throw err;
                          }
                        }}
                        isRegenerating={regeneratingMAReport}
                        onRegenerateClientView={async (context) => {
                          if (!maAssessmentReport?.id) {
                            alert('No report to regenerate');
                            return;
                          }
                          
                          setRegeneratingMAReport(true);
                          try {
                            console.log('[MA Regenerate] Starting regeneration with context:', context);
                            
                            // Call Pass 2 again with additional context (Client View)
                            const { data, error } = await supabase.functions.invoke('generate-ma-report-pass2', {
                              body: { 
                                reportId: maAssessmentReport.id,
                                clientId: clientId,
                                additionalContext: context
                              }
                            });
                            
                            if (error) throw error;
                            
                            console.log('[MA Regenerate] Client view regeneration complete:', data);
                            
                            // Also regenerate Admin View (scenarios, findings) with the call context
                            console.log('[MA Regenerate] Now regenerating admin view...');
                            const { data: adminData, error: adminError } = await supabase.functions.invoke('regenerate-ma-admin-view', {
                              body: { 
                                reportId: maAssessmentReport.id,
                                clientId: clientId
                              }
                            });
                            
                            if (adminError) {
                              console.warn('[MA Regenerate] Admin view regeneration failed (non-fatal):', adminError);
                            } else {
                              console.log('[MA Regenerate] Admin view regeneration complete:', adminData);
                            }
                            
                            // Refresh the report
                            await fetchClientDetail();
                            alert('Report regenerated successfully with call context!');
                          } catch (err: any) {
                            console.error('[MA Regenerate] Error:', err);
                            alert('Failed to regenerate: ' + (err.message || 'Unknown error'));
                          } finally {
                            setRegeneratingMAReport(false);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Divider if both old insights and new report exist */}
                  {maAssessmentReport && (maAssessmentReport.status === 'generated' || maAssessmentReport.status === 'pass2_running') && maAssessmentReport.pass1_data && maInsights && (
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-gray-50 px-3 text-sm text-gray-500">Legacy Insights (below)</span>
                      </div>
                    </div>
                  )}

                  {/* Existing Insights */}
                  {maInsights && (() => {
                    const insight = maInsights.insight || maInsights;
                    const sentimentColors: Record<string, string> = {
                      positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      neutral: 'bg-blue-100 text-blue-700 border-blue-200',
                      warning: 'bg-amber-100 text-amber-700 border-amber-200',
                      critical: 'bg-red-100 text-red-700 border-red-200'
                    };
                    
                    return (
                      <div className="space-y-6">
                        {/* Analysis Header with Share Status */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Analysis Report</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {isMAInsightShared ? (
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                  Available to client
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                  Not shared with client
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              const newSharedStatus = !isMAInsightShared;
                              
                              try {
                                // Handle v2 insights (ma_monthly_insights)
                                if (maInsightV2Id) {
                                  const { error } = await supabase
                                    .from('ma_monthly_insights')
                                    .update({ 
                                      shared_with_client: newSharedStatus,
                                      shared_at: newSharedStatus ? new Date().toISOString() : null,
                                      shared_by: newSharedStatus ? currentMember?.id : null
                                    })
                                    .eq('id', maInsightV2Id);
                                  
                                  if (error) throw error;
                                  
                                  setIsMAInsightShared(newSharedStatus);
                                  await fetchClientDetail();
                                  
                                  if (newSharedStatus) {
                                    alert('Analysis marked as available to client');
                                  } else {
                                    alert('Analysis removed from client view');
                                  }
                                  return;
                                }
                                
                                // Handle old format (client_context)
                                if (maInsightContextId) {
                                  const { error } = await supabase
                                    .from('client_context')
                                    .update({ is_shared: newSharedStatus })
                                    .eq('id', maInsightContextId);
                                  
                                  if (error) throw error;
                                  
                                  setIsMAInsightShared(newSharedStatus);
                                  await fetchClientDetail();
                                  
                                  if (newSharedStatus) {
                                    alert('Analysis marked as available to client');
                                  } else {
                                    alert('Analysis removed from client view');
                                  }
                                  return;
                                }
                                
                                alert('No insight found to share');
                              } catch (error: any) {
                                console.error('Error updating share status:', error);
                                alert('Failed to update share status: ' + error.message);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                              isMAInsightShared
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {isMAInsightShared ? (
                              <>
                                <X className="w-4 h-4" />
                                Remove from Client View
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4" />
                                Make Available to Client
                              </>
                            )}
                          </button>
                        </div>

                        {/* Headline */}
                        {insight.headline && (
                          <div className={`border-2 rounded-xl p-6 ${sentimentColors[insight.headline.sentiment] || sentimentColors.neutral}`}>
                            <div className="flex items-start justify-between mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${sentimentColors[insight.headline.sentiment] || sentimentColors.neutral}`}>
                                {insight.headline.sentiment}
                              </span>
                            </div>
                            <p className="text-lg font-semibold leading-relaxed">{insight.headline.text}</p>
                          </div>
                        )}

                        {/* Key Insights */}
                        {insight.keyInsights && insight.keyInsights.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                              <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
                            </div>
                            <div className="p-6 space-y-6">
                              {insight.keyInsights.map((ki: any, idx: number) => (
                                <div key={idx} className="border-l-4 border-indigo-500 pl-4 space-y-3">
                                  <div>
                                    <p className="font-semibold text-gray-900 mb-2">Finding</p>
                                    <p className="text-gray-700">{ki.finding}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 mb-2">Implication</p>
                                    <p className="text-gray-700">{ki.implication}</p>
                                  </div>
                                  {ki.action && (
                                    <div className="bg-indigo-50 rounded-lg p-3">
                                      <p className="font-semibold text-indigo-900 mb-1 text-sm">Recommended Action</p>
                                      <p className="text-indigo-800 text-sm">{ki.action}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Wins */}
                        {insight.quickWins && insight.quickWins.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                              <h3 className="text-lg font-semibold text-white">Quick Wins</h3>
                            </div>
                            <div className="p-6 space-y-4">
                              {insight.quickWins.map((qw: any, idx: number) => (
                                <div key={idx} className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="font-semibold text-emerald-900">{qw.action}</p>
                                    {qw.timeframe && (
                                      <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-xs font-medium rounded whitespace-nowrap ml-3">
                                        {qw.timeframe}
                                      </span>
                                    )}
                                  </div>
                                  {qw.impact && (
                                    <p className="text-emerald-800 text-sm mt-2">{qw.impact}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Approach */}
                        {insight.recommendedApproach && (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-indigo-50 px-6 py-4 border-b border-gray-200">
                              <h3 className="text-lg font-semibold text-gray-900">Recommended Approach</h3>
                            </div>
                            <div className="p-6 space-y-4">
                              {insight.recommendedApproach.summary && (
                                <p className="text-gray-700 leading-relaxed">{insight.recommendedApproach.summary}</p>
                              )}
                              {insight.recommendedApproach.frequency && (
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <p className="text-sm font-semibold text-blue-900 mb-1">Frequency</p>
                                  <p className="text-blue-800 text-sm">{insight.recommendedApproach.frequency}</p>
                                </div>
                              )}
                              {insight.recommendedApproach.focusAreas && insight.recommendedApproach.focusAreas.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 mb-2">Focus Areas</p>
                                  <ul className="space-y-2">
                                    {insight.recommendedApproach.focusAreas.map((area: string, idx: number) => (
                                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                                        <span className="text-indigo-600 mt-1">•</span>
                                        <span>{area}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* True Cash Section (v2) */}
                        {insight.trueCashSection?.narrative && (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                              <h3 className="text-lg font-semibold text-white">True Cash Position</h3>
                            </div>
                            <div className="p-6">
                              <p className="text-gray-700 leading-relaxed">{insight.trueCashSection.narrative}</p>
                              {insight.trueCashSection.isHealthy !== undefined && (
                                <div className={`mt-4 p-3 rounded-lg ${insight.trueCashSection.isHealthy ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                                  <p className={`text-sm font-semibold ${insight.trueCashSection.isHealthy ? 'text-emerald-900' : 'text-amber-900'}`}>
                                    {insight.trueCashSection.isHealthy ? '✓ Healthy Cash Position' : '⚠️ Cash Position Needs Attention'}
                                  </p>
                                  {insight.trueCashSection.implication && (
                                    <p className={`text-sm mt-1 ${insight.trueCashSection.isHealthy ? 'text-emerald-800' : 'text-amber-800'}`}>
                                      {insight.trueCashSection.implication}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tuesday Question Answer (v2) */}
                        {insight.tuesdayQuestionAnswer?.answer && (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-indigo-50 px-6 py-4 border-b border-gray-200">
                              <h3 className="text-lg font-semibold text-gray-900">Answering Your Tuesday Question</h3>
                            </div>
                            <div className="p-6 space-y-4">
                              {insight.tuesdayQuestionAnswer.originalQuestion && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <p className="text-sm font-semibold text-blue-900 mb-2">Your Question:</p>
                                  <p className="text-blue-800 italic">"{insight.tuesdayQuestionAnswer.originalQuestion}"</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-2">Answer:</p>
                                <p className="text-gray-700 leading-relaxed">{insight.tuesdayQuestionAnswer.answer}</p>
                              </div>
                              {insight.tuesdayQuestionAnswer.supportingData && insight.tuesdayQuestionAnswer.supportingData.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <p className="text-sm font-semibold text-gray-900 mb-2">Supporting Data:</p>
                                  <ul className="space-y-2">
                                    {insight.tuesdayQuestionAnswer.supportingData.map((data: string, idx: number) => (
                                      <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                                        <span className="text-indigo-600 mt-1">•</span>
                                        <span>{data}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {insight.tuesdayQuestionAnswer.verdict && (
                                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                  <p className="text-sm font-semibold text-indigo-900 mb-1">Summary</p>
                                  <p className="text-indigo-800 text-sm">{insight.tuesdayQuestionAnswer.verdict}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Decisions Enabled (v2) */}
                        {insight.decisionsEnabled && insight.decisionsEnabled.length > 0 && (() => {
                          // Verdict configuration
                          const VERDICT_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
                            YES: { icon: Check, color: 'bg-green-100 text-green-800 border-green-300', label: 'Yes' },
                            NO: { icon: X, color: 'bg-red-100 text-red-800 border-red-300', label: 'No' },
                            WAIT: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Wait' },
                            YES_IF: { icon: Check, color: 'bg-green-50 text-green-700 border-green-200', label: 'Yes, if...' },
                            NO_UNLESS: { icon: X, color: 'bg-red-50 text-red-700 border-red-200', label: 'No, unless...' },
                          };
                          
                          // Helper to get verdict display (handles both old and new format)
                          const getVerdictDisplay = (decision: any) => {
                            if (decision.verdict && decision.verdictSummary) {
                              // New format
                              return { 
                                verdict: decision.verdict, 
                                summary: decision.verdictSummary,
                                config: VERDICT_CONFIG[decision.verdict] || VERDICT_CONFIG.WAIT
                              };
                            }
                            // Old format - parse recommendation
                            const rec = decision.recommendation?.toLowerCase() || '';
                            if (rec.includes("don't") || rec.includes('no')) {
                              return { verdict: 'NO', summary: decision.recommendation, config: VERDICT_CONFIG.NO };
                            }
                            if (rec.includes('wait')) {
                              return { verdict: 'WAIT', summary: decision.recommendation, config: VERDICT_CONFIG.WAIT };
                            }
                            if (rec.includes('yes') || rec.includes('do it')) {
                              return { verdict: 'YES', summary: decision.recommendation, config: VERDICT_CONFIG.YES };
                            }
                            return { verdict: 'WAIT', summary: decision.recommendation || 'Review needed', config: VERDICT_CONFIG.WAIT };
                          };
                          
                          return (
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                                <h3 className="text-lg font-semibold text-white">Decisions Enabled</h3>
                              </div>
                              <div className="p-6 space-y-4">
                                {insight.decisionsEnabled.map((decision: any, idx: number) => {
                                  const verdictDisplay = getVerdictDisplay(decision);
                                  const VerdictIcon = verdictDisplay.config.icon;
                                  
                                  return (
                                    <div key={idx} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                                      {/* Decision Name and Verdict Badge */}
                                      <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-semibold text-lg text-purple-900">{decision.decisionName || decision.decision}</h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-3 border flex items-center gap-1 ${verdictDisplay.config.color}`}>
                                          <VerdictIcon className="h-3 w-3" />
                                          {verdictDisplay.config.label}
                                        </span>
                                      </div>
                                      
                                      {/* Verdict Summary - THE MAIN ANSWER */}
                                      <div className={`p-4 rounded-lg mb-3 border ${
                                        verdictDisplay.verdict?.startsWith('YES') ? 'bg-green-50 border-green-200' :
                                        verdictDisplay.verdict?.startsWith('NO') ? 'bg-red-50 border-red-200' : 
                                        'bg-yellow-50 border-yellow-200'
                                      }`}>
                                        <p className="font-semibold text-lg text-gray-900">{verdictDisplay.summary}</p>
                                        {decision.conditions && (
                                          <p className="text-sm mt-2 text-gray-700">
                                            <span className="font-medium">Condition:</span> {decision.conditions}
                                          </p>
                                        )}
                                      </div>
                                      
                                      {/* Fallback */}
                                      {decision.fallback && (
                                        <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                          <span className="text-sm text-gray-700"><strong>Otherwise:</strong> {decision.fallback}</span>
                                        </div>
                                      )}
                                      
                                      {/* Supporting Data */}
                                      {decision.supportingData && decision.supportingData.length > 0 && (
                                        <div className="mb-3">
                                          <p className="text-sm font-semibold text-gray-900 mb-2">Supporting Data:</p>
                                          <div className="flex flex-wrap gap-2">
                                            {decision.supportingData.map((data: string, dataIdx: number) => (
                                              <span key={dataIdx} className="px-2 py-1 bg-white border border-purple-200 text-purple-800 text-xs rounded">
                                                {data}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Risk if Ignored */}
                                      {decision.riskIfIgnored && (
                                        <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                          <p className="text-sm text-red-800">
                                            <strong>Risk if wrong:</strong> {decision.riskIfIgnored}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {/* Client Quote */}
                                      {decision.clientQuoteReferenced && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600 mt-3 pt-3 border-t border-purple-200">
                                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                          <span className="italic">"{decision.clientQuoteReferenced}"</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Watch List (v2) */}
                        {insight.watchList && insight.watchList.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-amber-50 px-6 py-4 border-b border-gray-200">
                              <h3 className="text-lg font-semibold text-gray-900">Watch List</h3>
                              <p className="text-sm text-gray-600 mt-1">Metrics to monitor closely</p>
                            </div>
                            <div className="p-6">
                              <div className="grid gap-4">
                                {insight.watchList.map((item: any, idx: number) => (
                                  <div key={idx} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-gray-900">{item.metric}</h4>
                                      {item.priority && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                          item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {item.priority.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <p className="text-gray-600 mb-1">Current Value</p>
                                        <p className="font-semibold text-gray-900">{item.currentValue}</p>
                                      </div>
                                      {item.alertThreshold && (
                                        <div>
                                          <p className="text-gray-600 mb-1">Alert Threshold</p>
                                          <p className="font-semibold text-gray-900">{item.alertThreshold}</p>
                                        </div>
                                      )}
                                    </div>
                                    {item.direction && item.checkFrequency && (
                                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                                        <span>Direction: <strong>{item.direction}</strong></span>
                                        <span>Check: <strong>{item.checkFrequency}</strong></span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Goals Connection */}
                        {insight.goalsConnection && (
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                              <h3 className="text-lg font-semibold text-white">Connection to Client Goals</h3>
                            </div>
                            <div className="p-6 space-y-4">
                              {insight.goalsConnection.narrative && (
                                <p className="text-gray-800 leading-relaxed">{insight.goalsConnection.narrative}</p>
                              )}
                              {insight.goalsConnection.theirWords && insight.goalsConnection.theirWords.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-purple-200">
                                  <p className="text-sm font-semibold text-purple-900 mb-3">Client's Own Words</p>
                                  <div className="flex flex-wrap gap-2">
                                    {insight.goalsConnection.theirWords.map((word: string, idx: number) => (
                                      <span key={idx} className="px-3 py-1 bg-white border border-purple-200 text-purple-800 text-sm rounded-full">
                                        "{word}"
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  </>
                  )}

                  {/* CLIENT VIEW - Show Two-Pass Report if available, otherwise legacy insights */}
                  {maViewMode === 'client' && (
                    <>
                      {/* Regenerating state for client view */}
                      {maAssessmentReport && (maAssessmentReport.status === 'pass2_running' || regeneratingMAReport) && (
                        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-xl">
                          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Regenerating Client Report...</h3>
                          <p className="text-gray-500 text-center max-w-md">
                            Using your call notes, transcript, and additional context to create an enhanced client presentation.
                          </p>
                          <p className="text-sm text-gray-400 mt-4">This may take 30-60 seconds</p>
                        </div>
                      )}
                      
                      {/* NEW: Two-Pass Client Report View */}
                      {maAssessmentReport && maAssessmentReport.status === 'generated' && maAssessmentReport.pass2_data && !regeneratingMAReport && (
                        <MAClientReportView 
                          report={{
                            pass1_data: maAssessmentReport.pass1_data,
                            pass2_data: maAssessmentReport.pass2_data,
                            client_view: maAssessmentReport.client_view,
                            call_context: maAssessmentReport.call_context // Pass call context for real financial data
                          }}
                          engagement={client}
                          onTierSelect={async (tier) => {
                            console.log('[MA Report] Client selected tier:', tier);
                            // Parse tier - might be "foresight_monthly" or just "foresight"
                            const [tierName, frequency] = tier.includes('_') ? tier.split('_') : [tier, 'monthly'];
                            
                            try {
                              // Check if engagement exists
                              const { data: existing } = await supabase
                                .from('ma_engagements')
                                .select('id, tier')
                                .eq('client_id', clientId)
                                .maybeSingle();
                              
                              if (existing) {
                                // Update existing engagement tier
                                const { error: updateError } = await supabase
                                  .from('ma_engagements')
                                  .update({ 
                                    tier: tierName,
                                    frequency: frequency as 'monthly' | 'quarterly',
                                    monthly_fee: tierName === 'clarity' ? 2500 : tierName === 'foresight' ? 4000 : 6500
                                  })
                                  .eq('id', existing.id);
                                
                                if (updateError) throw updateError;
                                setMAEngagementId(existing.id);
                                alert(`Engagement updated to ${tierName.charAt(0).toUpperCase() + tierName.slice(1)} tier! Go to MA Portal to manage deliverables.`);
                              } else {
                                // Create new engagement
                                const { data: newEng, error: createError } = await supabase
                                  .from('ma_engagements')
                                  .insert({
                                    client_id: clientId,
                                    practice_id: client?.practice_id,
                                    tier: tierName,
                                    frequency: frequency as 'monthly' | 'quarterly',
                                    monthly_fee: tierName === 'clarity' ? 2500 : tierName === 'foresight' ? 4000 : 6500,
                                    status: 'active',
                                    start_date: new Date().toISOString().split('T')[0]
                                  })
                                  .select('id')
                                  .single();
                                
                                if (createError) throw createError;
                                setMAEngagementId(newEng.id);
                                alert(`${tierName.charAt(0).toUpperCase() + tierName.slice(1)} engagement created! Go to MA Portal to start delivering.`);
                              }
                            } catch (error) {
                              console.error('[MA Report] Error creating/updating engagement:', error);
                              alert('Failed to create engagement. Please try again.');
                            }
                          }}
                        />
                      )}
                      
                      {/* Show message if pass1 exists but pass2 doesn't (and not regenerating) */}
                      {maAssessmentReport && maAssessmentReport.pass1_data && !maAssessmentReport.pass2_data && 
                       maAssessmentReport.status !== 'pass2_running' && !regeneratingMAReport && (
                        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Report Not Yet Generated</h3>
                          <p className="text-gray-500 mb-4">Pass 1 analysis is complete. Use the Admin View to generate the client presentation.</p>
                          <button
                            onClick={() => setMAViewMode('admin')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Switch to Admin View
                          </button>
                        </div>
                      )}

                      {/* Legacy Insights View - only show if no two-pass report */}
                      {!maAssessmentReport?.pass2_data && !maAssessmentReport?.pass1_data && maInsights && (() => {
                        const insight = maInsights.insight || maInsights;
                        return (
                          <div className="space-y-6">
                            {/* Client-facing header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                              <h2 className="text-xl font-semibold mb-2">Your Financial Analysis</h2>
                              <p className="text-blue-100">Insights from your assessment and documents</p>
                            </div>

                            {/* Headline */}
                            {insight.headline && (
                              <div className={`rounded-xl p-6 ${
                                insight.headline.sentiment === 'warning' ? 'bg-amber-50 border-2 border-amber-200' :
                                insight.headline.sentiment === 'critical' ? 'bg-red-50 border-2 border-red-200' :
                                insight.headline.sentiment === 'positive' ? 'bg-emerald-50 border-2 border-emerald-200' :
                                'bg-blue-50 border-2 border-blue-200'
                              }`}>
                                <p className="text-lg font-semibold text-gray-900 leading-relaxed">{insight.headline.text}</p>
                              </div>
                            )}

                            {/* Key Findings - Simplified */}
                            {insight.keyInsights && insight.keyInsights.length > 0 && (
                              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                  <h3 className="text-lg font-semibold text-gray-900">Key Findings</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                  {insight.keyInsights.map((ki: any, idx: number) => (
                                    <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2">
                                      <p className="font-medium text-gray-900">{ki.finding}</p>
                                      {ki.action && (
                                        <p className="text-sm text-indigo-600 mt-2">→ {ki.action}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quick Wins */}
                            {insight.quickWins && insight.quickWins.length > 0 && (
                              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
                                  <h3 className="text-lg font-semibold text-emerald-900">Quick Wins</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                  {insight.quickWins.map((qw: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                                      <span className="text-emerald-600 text-xl">✓</span>
                                      <div>
                                        <p className="font-medium text-emerald-900">{qw.action}</p>
                                        {qw.timeframe && (
                                          <p className="text-sm text-emerald-700 mt-1">{qw.timeframe}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recommended Approach Summary */}
                            {insight.recommendedApproach?.summary && (
                              <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Approach</h3>
                                <p className="text-gray-700 leading-relaxed">{insight.recommendedApproach.summary}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* No insights message for client view */}
                  {maViewMode === 'client' && !maInsights && !maAssessmentReport?.pass2_data && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <p className="text-gray-500">No analysis available yet</p>
                      <p className="text-sm text-gray-400 mt-2">Your advisor will share insights once they're ready</p>
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

// ============================================================================
// SYSTEMS AUDIT CLIENT MODAL - View assessments, documents, and analysis
// ============================================================================
// ============================================================================
// BENCHMARKING CLIENT MODAL
// ============================================================================
function BenchmarkingClientModal({ 
  clientId, 
  onClose
}: { 
  clientId: string; 
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [activeTab, setActiveTab] = useState<'assessment' | 'hva' | 'context' | 'analysis'>('assessment');
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<any>(null);
  const [assessmentResponses, setAssessmentResponses] = useState<any>(null);
  const [hvaStatus, setHvaStatus] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [clientName, setClientName] = useState<string>('');
  const [viewMode, setViewMode] = useState<'admin' | 'client'>('admin');
  
  // Accounts upload state
  const [accountUploads, setAccountUploads] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [reviewingFinancialData, setReviewingFinancialData] = useState<any>(null);

  useEffect(() => {
    if (currentMember?.practice_id) {
      fetchData();
    }
  }, [clientId, currentMember?.practice_id]);

  const fetchData = async () => {
    if (!currentMember?.practice_id) {
      console.error('[Benchmarking Modal] No practice_id available');
      return;
    }

    setLoading(true);
    try {
      // Verify client
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('id, practice_id, name, client_company, company')
        .eq('id', clientId)
        .eq('practice_id', currentMember.practice_id)
        .maybeSingle();
      
      if (clientData) {
        setClientName(clientData.client_company || clientData.company || clientData.name || '');
      }

      // Fetch engagement - use maybeSingle() to avoid errors if none exists
      const { data: engagementData, error: engagementError } = await supabase
        .from('bm_engagements')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (engagementError && engagementError.code !== 'PGRST116') {
        console.error('[Benchmarking Modal] Error fetching engagement:', engagementError);
      }

      console.log('[Benchmarking Modal] Engagement query result:', {
        found: !!engagementData,
        engagement_id: engagementData?.id,
        status: engagementData?.status,
        client_id: engagementData?.client_id
      });

      // Also try to find report directly by client_id (in case engagement doesn't exist or doesn't match)
      // This is a fallback to ensure we find the report even if engagement lookup fails
      let directReportData = null;
      if (!engagementData) {
        console.log('[Benchmarking Modal] No engagement found, trying to find report directly...');
        const { data: reportsForClient } = await supabase
          .from('bm_reports')
          .select(`
            *,
            bm_engagements!inner (
              id,
              client_id,
              status
            )
          `)
          .eq('bm_engagements.client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (reportsForClient) {
          directReportData = reportsForClient;
          // Create a mock engagement from the report's engagement data
          if (reportsForClient.bm_engagements) {
            setEngagement(reportsForClient.bm_engagements);
          }
          console.log('[Benchmarking Modal] Found report directly (no engagement):', {
            report_id: directReportData.id,
            status: directReportData.status
          });
        }
      }

      if (engagementData) {
        setEngagement(engagementData);

        // Fetch assessment responses
        const { data: responsesData } = await supabase
          .from('bm_assessment_responses')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .maybeSingle();
        
        // Also check service_line_assessments as fallback (for responses JSONB)
        if (!responsesData) {
          const { data: slaData } = await supabase
            .from('service_line_assessments')
            .select('responses, completed_at')
            .eq('client_id', clientId)
            .eq('service_line_code', 'benchmarking')
            .maybeSingle();
          
          if (slaData) {
            setAssessmentResponses({ responses: slaData.responses, completed_at: slaData.completed_at });
          }
        } else {
          setAssessmentResponses(responsesData);
        }

        // Fetch report by engagement_id
        console.log('[Benchmarking Modal] Fetching report for engagement_id:', engagementData.id, 'client_id:', clientId);
        
        // Query report - engagement_id is the PRIMARY KEY so there should be exactly 0 or 1
        // Try multiple query strategies to work around potential RLS or query issues
        console.log('[Benchmarking Modal] Attempting to query report with engagement_id:', engagementData.id);
        
        // Strategy 1: Direct query
        let reportData = null;
        let reportError = null;
        
        const { data: directReport, error: directError } = await supabase
          .from('bm_reports')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .maybeSingle();
        
        reportData = directReport;
        reportError = directError;
        
        // Strategy 2: If not found, try without maybeSingle to see if there's a data issue
        if (!reportData && !reportError) {
          console.log('[Benchmarking Modal] Direct query returned null, trying without maybeSingle...');
          const { data: allReports, error: allError } = await supabase
            .from('bm_reports')
            .select('*')
            .eq('engagement_id', engagementData.id);
          
          console.log('[Benchmarking Modal] Query without maybeSingle:', {
            count: allReports?.length || 0,
            error: allError?.message,
            reports: allReports
          });
          
          if (allReports && allReports.length > 0) {
            reportData = allReports[0];
            console.log('[Benchmarking Modal] Found report via non-maybeSingle query!');
          }
        }
        
        // Strategy 3: Try querying by the exact UUID string format
        if (!reportData && !reportError) {
          console.log('[Benchmarking Modal] Trying exact UUID string match...');
          const engagementIdStr = String(engagementData.id);
          const { data: strMatchReport } = await supabase
            .from('bm_reports')
            .select('*')
            .eq('engagement_id', engagementIdStr)
            .maybeSingle();
          
          if (strMatchReport) {
            reportData = strMatchReport;
            console.log('[Benchmarking Modal] Found report via string UUID match!');
          }
        }
        
        console.log('[Benchmarking Modal] Direct report query result:', {
          found: !!reportData,
          error: reportError?.message,
          errorCode: reportError?.code,
          errorDetails: reportError,
          engagement_id_queried: engagementData.id,
          report_id: reportData?.id,
          report_status: reportData?.status,
          report_engagement_id: reportData?.engagement_id
        });
        
        // DEBUG: Also try querying without maybeSingle to see if there are multiple
        if (!reportData && !reportError) {
          const { data: allReportsForEngagement, count } = await supabase
            .from('bm_reports')
            .select('*', { count: 'exact' })
            .eq('engagement_id', engagementData.id);
          
          console.log('[Benchmarking Modal] DEBUG - All reports for engagement (without maybeSingle):', {
            count: count || allReportsForEngagement?.length || 0,
            reports: allReportsForEngagement
          });
        }
        
        // If not found, try a broader search (in case there's a mismatch)
        let finalReportData = reportData;
        if (!reportData && !reportError) {
          console.log('[Benchmarking Modal] Report not found by engagement_id, trying broader search...');
          
          // Strategy 1: Get all engagements for this client, then find reports
          const { data: allEngagements } = await supabase
            .from('bm_engagements')
            .select('id')
            .eq('client_id', clientId);
          
          console.log('[Benchmarking Modal] Found engagements for client:', allEngagements?.length || 0);
          
          if (allEngagements && allEngagements.length > 0) {
            const engagementIds = allEngagements.map(e => e.id);
            console.log('[Benchmarking Modal] Searching reports for engagement IDs:', engagementIds);
            
            const { data: reportsByEngagements } = await supabase
              .from('bm_reports')
              .select('*')
              .in('engagement_id', engagementIds)
              .order('created_at', { ascending: false })
              .limit(5);
            
            console.log('[Benchmarking Modal] Found reports via engagement IDs:', reportsByEngagements?.length || 0);
            
            if (reportsByEngagements && reportsByEngagements.length > 0) {
              // Prefer the one matching current engagement, otherwise use most recent
              finalReportData = reportsByEngagements.find((r: any) => r.engagement_id === engagementData.id) || reportsByEngagements[0];
              console.log('[Benchmarking Modal] Using report from engagement search:', {
                report_id: finalReportData.id,
                engagement_id: finalReportData.engagement_id,
                status: finalReportData.status
              });
            }
          }
          
          // Strategy 2: If still not found, try the join query
          if (!finalReportData) {
            console.log('[Benchmarking Modal] Trying join query as last resort...');
            const { data: reportsViaJoin } = await supabase
              .from('bm_reports')
              .select(`
                *,
                bm_engagements!inner (
                  id,
                  client_id
                )
              `)
              .eq('bm_engagements.client_id', clientId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (reportsViaJoin) {
              finalReportData = reportsViaJoin;
              console.log('[Benchmarking Modal] Found report via join query:', {
                report_id: finalReportData.id,
                engagement_id: finalReportData.engagement_id
              });
            }
          }
        }
        
        if (reportError && reportError.code !== 'PGRST116') {
          console.error('[Benchmarking Modal] Error fetching report:', reportError);
        } else {
          console.log('[Benchmarking Modal] Report query result:', {
            found: !!finalReportData,
            status: finalReportData?.status,
            hasHeadline: !!finalReportData?.headline,
            hasExecutiveSummary: !!finalReportData?.executive_summary,
            engagement_id: finalReportData?.engagement_id,
            engagement_id_queried: engagementData.id,
            report_id: finalReportData?.id
          });
        }
        
        // Set report if found (use finalReportData which may come from fallback)
        // Also check directReportData if engagement wasn't found
        const reportToUse = finalReportData || directReportData;
        
        console.log('[Benchmarking Modal] Final report decision:', {
          finalReportData: !!finalReportData,
          directReportData: !!directReportData,
          reportToUse: !!reportToUse,
          reportStatus: reportToUse?.status,
          reportId: reportToUse?.id
        });
        
        if (reportToUse) {
          console.log('[Benchmarking Modal] Setting report in state:', {
            id: reportToUse.id,
            status: reportToUse.status,
            hasHeadline: !!reportToUse.headline,
            hasExecutiveSummary: !!reportToUse.executive_summary
          });
          setReport(reportToUse);
          
          // If report exists with status 'generated', switch to analysis tab
          if (reportToUse.status === 'generated' || reportToUse.status === 'approved' || reportToUse.status === 'published') {
            console.log('[Benchmarking Modal] Switching to analysis tab (report is generated)');
            setActiveTab('analysis');
          }
        } else {
          console.warn('[Benchmarking Modal] No report found after all queries.', {
            engagement_id: engagementData?.id,
            client_id: clientId,
            engagement_found: !!engagementData
          });
        }

        // Fetch HVA status (Part 3 assessment)
        const { data: hvaData, error: hvaError } = await supabase
          .from('client_assessments')
          .select('*') // Select all fields to see what we're actually getting
          .eq('client_id', clientId)
          .eq('assessment_type', 'part3')
          .maybeSingle();
        
        if (hvaError) {
          console.error('[Benchmarking Modal] Error fetching HVA:', hvaError);
        } else {
          console.log('[Benchmarking Modal] HVA data:', hvaData);
        }
        
        setHvaStatus(hvaData);
      }
      
      // Load uploaded accounts data
      await loadAccountsData();
    } catch (error) {
      console.error('[Benchmarking Modal] Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load uploaded accounts and financial data
  const loadAccountsData = async () => {
    try {
      // Load uploads
      const { data: uploads } = await supabase
        .from('client_accounts_uploads')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (uploads) setAccountUploads(uploads);
      
      // Load financial data
      const { data: financial } = await supabase
        .from('client_financial_data')
        .select('*')
        .eq('client_id', clientId)
        .order('fiscal_year', { ascending: false });
      
      if (financial) setFinancialData(financial);
    } catch (err) {
      console.log('[Benchmarking Modal] Could not load accounts data (table may not exist yet)');
    }
  };

  const pollForReport = async (engagementId: string, attempts: number = 0, maxAttempts: number = 60) => {
    const pollInterval = 2000; // 2 seconds
    
    try {
      // Check report status
      const { data: report } = await supabase
        .from('bm_reports')
        .select('status, headline, created_at')
        .eq('engagement_id', engagementId)
        .maybeSingle();
      
      if (report) {
        if (report.status === 'generated') {
          // Report fully complete - refresh data
          console.log('[BM Report] Report completed! Refreshing data...');
          await fetchData();
          setGenerating(false);
          return;
        } else if (report.status === 'pass2_failed') {
          // Pass 2 failed - show error but keep Pass 1 data visible
          console.error('[BM Report] Pass 2 failed');
          alert('Report extraction completed, but narrative generation failed. You can retry Pass 2 or view the extracted data.');
          await fetchData();
          setGenerating(false);
          return;
        } else if (report.status === 'pass1_complete') {
          // Pass 1 complete, waiting for Pass 2
          console.log(`[BM Report] Pass 1 complete, waiting for Pass 2... (attempt ${attempts + 1}/${maxAttempts})`);
          // Continue polling
          if (attempts < maxAttempts) {
            setTimeout(() => pollForReport(engagementId, attempts + 1, maxAttempts), pollInterval);
          } else {
            console.error('[BM Report] Polling timeout - Pass 2 taking too long');
            alert('Report generation is taking longer than expected. Please refresh the page to check status.');
            await fetchData();
            setGenerating(false);
          }
          return;
        }
      }
      
      // No report yet, continue polling if we haven't exceeded max attempts
      if (attempts < maxAttempts) {
        setTimeout(() => pollForReport(engagementId, attempts + 1, maxAttempts), pollInterval);
      } else {
        console.error('[BM Report] Polling timeout - no report found');
        alert('Report generation is taking longer than expected. Please refresh the page to check status.');
        setGenerating(false);
      }
    } catch (error) {
      console.error('[BM Report] Error polling for report:', error);
      setGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!engagement) return;
    
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-bm-report-pass1', {
        body: { engagementId: engagement.id }
      });

      if (error) throw error;
      
      // Start polling for report completion
      pollForReport(engagement.id, 0);
    } catch (error: any) {
      console.error('[Benchmarking] Error generating report:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
      setGenerating(false);
    }
  };

  // Handle saving supplementary data from the Data Collection panel
  const handleSaveSupplementaryData = async (data: Record<string, number | string>) => {
    if (!engagement) {
      throw new Error('No engagement found');
    }
    
    console.log('[Benchmarking] Saving supplementary data:', data);
    
    const { data: result, error } = await supabase.functions.invoke('save-bm-supplementary-data', {
      body: {
        engagementId: engagement.id,
        data,
        collectedBy: currentMember?.name || 'Admin'
      }
    });
    
    if (error) {
      console.error('[Benchmarking] Error saving supplementary data:', error);
      throw new Error(error.message || 'Failed to save data');
    }
    
    console.log('[Benchmarking] Supplementary data saved:', result);
    
    // Refresh assessment data
    const { data: updatedResponses } = await supabase
      .from('bm_assessment_responses')
      .select('*')
      .eq('engagement_id', engagement.id)
      .maybeSingle();
    
    if (updatedResponses) {
      setAssessmentResponses(updatedResponses);
    }
  };

  // Handle regenerating the report with updated data
  const handleRegenerateWithNewData = async () => {
    if (!engagement) return;
    
    setGenerating(true);
    try {
      // Use the regenerate function which forces benchmark refresh
      const { data: result, error } = await supabase.functions.invoke('regenerate-bm-report', {
        body: {
          engagementId: engagement.id,
          forceRefreshBenchmarks: true,
          reason: 'Regeneration with supplementary data collected'
        }
      });
      
      if (error) throw error;
      
      console.log('[Benchmarking] Regeneration result:', result);
      
      // Refresh the data
      await fetchData();
    } catch (error: any) {
      console.error('[Benchmarking] Error regenerating report:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWithClient = async () => {
    if (!engagement) return;
    
    if (!confirm('Make this report available to the client?')) return;
    
    try {
      const { error } = await supabase
        .from('bm_engagements')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: currentMember?.id || null
        })
        .eq('id', engagement.id);
      
      if (error) throw error;
      
      alert('Report is now available to the client!');
      await fetchData();
    } catch (error: any) {
      console.error('[Benchmarking] Error sharing report:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    }
  };

  const canGenerate = engagement?.status === 'assessment_complete' || engagement?.status === 'pass1_complete';
  // Report exists if we have report data OR if engagement status indicates a report was generated
  const hasReport = !!report || engagement?.status === 'pass1_complete' || engagement?.status === 'generated' || engagement?.status === 'approved';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Benchmarking</h2>
            <p className="text-sm text-gray-500">{clientName || `Client ID: ${clientId}`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'assessment', label: 'Assessment', icon: FileText },
            { id: 'hva', label: 'HVA Assessment', icon: Award },
            { id: 'context', label: 'Context / Documents', icon: Upload },
            { id: 'analysis', label: 'Analysis', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
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
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <>
              {/* ASSESSMENT TAB */}
              {activeTab === 'assessment' && (
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-teal-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Benchmarking Assessment</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {engagement?.assessment_completed_at ? `Completed ${new Date(engagement.assessment_completed_at).toLocaleDateString()}` : 'Not started'}
                      </p>
                    </div>
                    <div className="p-6">
                      {assessmentResponses ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {(() => {
                              // Handle both JSONB responses field and individual columns
                              const fields = assessmentResponses.responses 
                                ? Object.entries(assessmentResponses.responses)
                                : Object.entries(assessmentResponses).filter(([key]) => 
                                    !['engagement_id', 'client_id', 'created_at', 'updated_at', 'completed_at'].includes(key)
                                  );
                              
                              return fields.map(([key, value]: [string, any]) => (
                                <div key={key} className="border border-gray-200 rounded-lg p-4">
                                  <div className="text-sm font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</div>
                                  <div className="mt-1 text-gray-900">
                                    {Array.isArray(value) ? value.join(', ') : String(value || 'N/A')}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Assessment not yet completed by client
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* HVA ASSESSMENT TAB */}
              {activeTab === 'hva' && (
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-amber-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Hidden Value Audit (Part 3)</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {(() => {
                          const isCompleted = hvaStatus && (
                            hvaStatus.completed_at || 
                            hvaStatus.completion_percentage === 100 || 
                            hvaStatus.status === 'completed' ||
                            (hvaStatus.responses && Object.keys(hvaStatus.responses).length > 0)
                          );
                          return isCompleted
                            ? `Completed ${hvaStatus.completed_at ? new Date(hvaStatus.completed_at).toLocaleDateString() : ''}`
                            : 'Not completed';
                        })()}
                      </p>
                    </div>
                    <div className="p-6">
                      {/* Check if HVA is completed - check completed_at, completion_percentage, status, or responses */}
                      {hvaStatus && (hvaStatus.completed_at || hvaStatus.completion_percentage === 100 || hvaStatus.status === 'completed' || (hvaStatus.responses && Object.keys(hvaStatus.responses).length > 0)) ? (
                        <div className="space-y-4">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-emerald-800">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">HVA Completed</span>
                            </div>
                            <p className="text-sm text-emerald-700 mt-2">
                              {hvaStatus.completed_at 
                                ? `Completed on ${new Date(hvaStatus.completed_at).toLocaleDateString()}`
                                : 'Assessment completed'}
                            </p>
                            <p className="text-sm text-emerald-700 mt-2">
                              Value analysis data is available and will be included in the benchmarking report.
                            </p>
                            {hvaStatus.value_analysis_data && (
                              <div className="mt-4 text-sm text-emerald-900">
                                <div className="font-medium mb-2">Summary:</div>
                                <div className="pl-4 space-y-1">
                                  {hvaStatus.value_analysis_data.business_stage && (
                                    <div>Business Stage: <strong>{hvaStatus.value_analysis_data.business_stage}</strong></div>
                                  )}
                                  {hvaStatus.value_analysis_data.total_value && (
                                    <div>Total Value Opportunity: <strong>£{Number(hvaStatus.value_analysis_data.total_value).toLocaleString()}</strong></div>
                                  )}
                                </div>
                              </div>
                            )}
                            {/* Show response data if available */}
                            {hvaStatus.responses && (
                              <div className="mt-4 pt-4 border-t border-emerald-200">
                                <div className="text-sm font-medium text-emerald-900 mb-3">
                                  Assessment Responses ({Object.keys(hvaStatus.responses).length} fields):
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {Object.entries(hvaStatus.responses).map(([key, value]: [string, any]) => (
                                    <div key={key} className="border border-emerald-100 rounded-lg p-3 bg-white">
                                      <div className="text-emerald-700 font-medium capitalize mb-1">{key.replace(/_/g, ' ')}:</div>
                                      <div className="text-emerald-900 break-words">
                                        {Array.isArray(value) 
                                          ? value.join(', ') 
                                          : typeof value === 'object' && value !== null
                                            ? JSON.stringify(value, null, 2)
                                            : String(value || 'N/A')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Client has not completed the Hidden Value Audit yet. 
                          <div className="mt-2 text-sm">HVA data will be included in the benchmarking analysis once completed.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTEXT / DOCUMENTS TAB */}
              {activeTab === 'context' && (
                <div className="space-y-6">
                  {/* Accounts Upload Section */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-emerald-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Client Accounts</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Upload 2-3 years of accounts for more accurate benchmarking analysis
                      </p>
                    </div>
                    <div className="p-6">
                      {currentMember?.practice_id ? (
                        <AccountsUploadPanel
                          clientId={clientId}
                          practiceId={currentMember.practice_id}
                          existingUploads={accountUploads}
                          existingFinancialData={financialData}
                          onUploadComplete={loadAccountsData}
                          onReviewData={(data) => setReviewingFinancialData(data)}
                        />
                      ) : (
                      <div className="text-center py-8 text-gray-500">
                          Loading...
                      </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Context Notes Section (placeholder for future) */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Context Notes</h3>
                      <p className="text-sm text-gray-600 mt-1">Additional notes about this client</p>
                    </div>
                    <div className="p-6">
                      <div className="text-center py-8 text-gray-400">
                        Context notes coming soon
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Financial Data Review Modal */}
              {reviewingFinancialData && (
                <FinancialDataReviewModal
                  data={reviewingFinancialData}
                  previousYearData={financialData.find(f => f.fiscal_year === reviewingFinancialData.fiscal_year - 1)}
                  onClose={() => setReviewingFinancialData(null)}
                  onConfirm={() => {
                    setReviewingFinancialData(null);
                    loadAccountsData();
                  }}
                />
              )}

              {/* ANALYSIS TAB */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {!hasReport ? (
                    <div className="border border-gray-200 rounded-xl p-8 text-center">
                      <Sparkles className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Generated</h3>
                      <p className="text-gray-600 mb-6">
                        {canGenerate 
                          ? 'Generate the benchmarking report to view analysis and recommendations.'
                          : 'Complete the assessment first before generating the report.'}
                      </p>
                      {canGenerate && (
                        <button
                          onClick={handleGenerateReport}
                          disabled={generating}
                          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg flex items-center gap-2 mx-auto"
                        >
                          {generating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Generate Report</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (report && (report.status === 'generated' || report.status === 'approved' || report.status === 'published')) || (engagement?.status === 'generated' || engagement?.status === 'approved') ? (
                    <div className="space-y-4">
                      {/* View Toggle and Regenerate Button */}
                      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => setViewMode('admin')}
                              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                viewMode === 'admin'
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Admin View
                            </button>
                            <button
                              onClick={() => setViewMode('client')}
                              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                                viewMode === 'client'
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Client View
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={handleGenerateReport}
                          disabled={generating}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg flex items-center gap-2"
                        >
                          {generating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Regenerating...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>Regenerate Analysis</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Report Content - New Components */}
                      {viewMode === 'client' ? (
                        <BenchmarkingClientReport 
                          data={{
                            ...report,
                            created_at: report?.created_at
                          }}
                        />
                      ) : (
                        (() => {
                          // Helper to safely parse JSON
                          const safeJsonParse = <T,>(value: string | T | null | undefined, fallback: T): T => {
                            if (!value) return fallback;
                            if (typeof value === 'string') {
                              try {
                                return JSON.parse(value) as T;
                              } catch {
                                return fallback;
                              }
                            }
                            return value as T;
                          };

                          // Extract assessment data - try multiple field name variations
                          const responses = assessmentResponses?.responses || assessmentResponses || {};
                          const revenue = responses.bm_revenue_exact || responses.bm_revenue || 0;
                          const employees = responses.bm_employee_count || responses.bm_employee_count_exact || 0;
                          
                          // Get revenue per employee from metrics_comparison (where it was calculated) or calculate it
                          const metrics = safeJsonParse(report?.metrics_comparison, []);
                          const revPerEmployeeMetric = metrics.find((m: any) => 
                            m.metricCode === 'revenue_per_consultant' || 
                            m.metricCode === 'revenue_per_employee'
                          );
                          const revenuePerEmployee = revPerEmployeeMetric?.clientValue || 
                            (revenue && employees ? Math.round(revenue / employees) : 0);
                          
                          // Calculate founder risk from HVA data
                          const founderRisk = hvaStatus ? calculateFounderRisk(hvaStatus) : null;
                          
                          // Use industry code from report (set by backend) - only fallback to SIC mapping if report has no industry_code
                          // The backend performs sophisticated industry detection including business description analysis
                          const sicCode = responses.bm_sic_code || responses.sic_code;
                          const subSector = responses.bm_sub_sector || responses.sub_sector;
                          const fallbackMapping = resolveIndustryCode(sicCode, subSector);
                          
                          // Prefer report's industry_code (from backend's intelligent detection) over frontend SIC mapping
                          const industryMapping = report.industry_code 
                            ? { 
                                code: report.industry_code, 
                                name: report.pass1_data?.classification?.industryName || report.industry_code,
                                confidence: report.pass1_data?.classification?.industryConfidence || 95
                              }
                            : fallbackMapping;
                          
                          // Extract ALL supplementary data from responses (saved via Data Collection panel)
                          // Dynamically extracts any key with bm_supp_ prefix
                          const supplementaryData: Record<string, number | string> = {};
                          for (const [key, value] of Object.entries(responses)) {
                            if (key.startsWith('bm_supp_') && value !== undefined && value !== null && value !== '') {
                              // Remove the bm_supp_ prefix to get the original metric name
                              const metricName = key.replace('bm_supp_', '');
                              // Handle different value types
                              if (typeof value === 'number') {
                                supplementaryData[metricName] = value;
                              } else if (typeof value === 'string') {
                                const numVal = parseFloat(value);
                                supplementaryData[metricName] = isNaN(numVal) ? value : numVal;
                              } else {
                                supplementaryData[metricName] = String(value);
                              }
                            }
                          }
                          
                          return (
                            <BenchmarkingAdminView
                              data={report}
                              clientData={{
                                revenue: revenue,
                                employees: employees,
                                revenuePerEmployee: revenuePerEmployee
                              }}
                              hvaData={hvaStatus}
                              founderRisk={founderRisk}
                              industryMapping={industryMapping}
                              clientId={clientId}
                              practiceId={currentMember?.practice_id}
                              engagementId={engagement?.id}
                              supplementaryData={supplementaryData}
                              onSwitchToClient={() => setViewMode('client')}
                              onSaveSupplementaryData={handleSaveSupplementaryData}
                              onRegenerate={handleRegenerateWithNewData}
                              isRegenerating={generating}
                            />
                          );
                        })()
                      )}
                    </div>
                  ) : report && report.status === 'pass1_complete' ? (
                    <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
                      <div className="flex items-center gap-3 mb-4">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <h3 className="text-lg font-semibold text-blue-900">Report Generation in Progress</h3>
                      </div>
                      <p className="text-blue-800 mb-4">
                        Pass 1 (data extraction) is complete. Narrative generation (Pass 2) is in progress...
                      </p>
                      <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh Status</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Report Actions */}
                      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Benchmarking Report</h3>
                          <p className="text-sm text-gray-500">
                            {report.status === 'pass1_complete' ? 'Extraction complete, generating narrative...' : 
                             report.created_at ? `Generated ${new Date(report.created_at).toLocaleDateString()}` : 'Recently'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={fetchData}
                            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                          </button>
                          <button
                            onClick={handleGenerateReport}
                            disabled={generating}
                            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2"
                          >
                            {generating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Regenerating...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Regenerate</span>
                              </>
                            )}
                          </button>
                          {engagement?.status !== 'approved' && (
                            <button
                              onClick={handleShareWithClient}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2"
                            >
                              <Share2 className="w-4 h-4" />
                              <span>Share with Client</span>
                            </button>
                          )}
                          {engagement?.status === 'approved' && (
                            <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>Shared with Client</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Report Content */}
                      <div className="space-y-6">
                        {report.headline && (
                          <div className="border border-gray-200 rounded-xl p-6">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">{report.headline}</h4>
                            {report.executive_summary && (
                              <p className="text-gray-700">{report.executive_summary}</p>
                            )}
                          </div>
                        )}

                        {report.position_narrative && (
                          <div className="border border-gray-200 rounded-xl p-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Your Position</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.position_narrative}</p>
                          </div>
                        )}

                        {report.top_strengths && Array.isArray(report.top_strengths) && report.top_strengths.length > 0 && (
                          <div className="border border-emerald-200 rounded-xl p-6 bg-emerald-50">
                            <h4 className="font-semibold text-emerald-900 mb-3">Top Strengths</h4>
                            <ul className="space-y-2">
                              {report.top_strengths.map((strength: any, idx: number) => (
                                <li key={idx} className="text-emerald-800">• {strength.description || strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {report.top_gaps && Array.isArray(report.top_gaps) && report.top_gaps.length > 0 && (
                          <div className="border border-amber-200 rounded-xl p-6 bg-amber-50">
                            <h4 className="font-semibold text-amber-900 mb-3">Improvement Opportunities</h4>
                            <ul className="space-y-2">
                              {report.top_gaps.map((gap: any, idx: number) => (
                                <li key={idx} className="text-amber-800">• {gap.description || gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {report.opportunity_narrative && (
                          <div className="border border-gray-200 rounded-xl p-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Opportunity</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.opportunity_narrative}</p>
                            {report.total_annual_opportunity && (
                              <div className="mt-4 text-lg font-bold text-teal-600">
                                Total Annual Opportunity: £{Number(report.total_annual_opportunity).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}

                        {report.admin_talking_points && Array.isArray(report.admin_talking_points) && report.admin_talking_points.length > 0 && (
                          <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
                            <h4 className="font-semibold text-blue-900 mb-3">Talking Points</h4>
                            <ul className="space-y-2">
                              {report.admin_talking_points.map((point: any, idx: number) => (
                                <li key={idx} className="text-blue-800">• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
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

function SystemsAuditClientModal({ 
  clientId, 
  onClose
}: { 
  clientId: string; 
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [activeTab, setActiveTab] = useState<'assessments' | 'documents' | 'analysis'>('assessments');
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<any>(null);
  const [stage1Responses, setStage1Responses] = useState<any[]>([]);
  const [stage2Inventory, setStage2Inventory] = useState<any[]>([]);
  const [stage3DeepDives, setStage3DeepDives] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'client'>('admin');
  const [findings, setFindings] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNarratives, setEditedNarratives] = useState({
    headline: '',
    executive_summary: '',
    cost_of_chaos_narrative: '',
    time_freedom_narrative: '',
    client_executive_brief: '',
  });
  const [savingEdits, setSavingEdits] = useState(false);
  const [makingAvailable, setMakingAvailable] = useState(false);
  
  // Document & Context state
  const [documents, setDocuments] = useState<any[]>([]);
  const [contextNotes, setContextNotes] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContext, setNewContext] = useState({
    note_type: 'followup_answer' as 'followup_answer' | 'call_transcript' | 'meeting_notes' | 'observation' | 'general',
    title: '',
    content: '',
    related_question: '',
    source: '',
    participants: [] as string[],
    include_in_analysis: true
  });
  const [savingContext, setSavingContext] = useState(false);

  useEffect(() => {
    if (currentMember?.practice_id) {
      fetchData();
    }
  }, [clientId, currentMember?.practice_id]);

  // Initialize edited narratives when report changes
  useEffect(() => {
    if (report && !isEditing) {
      setEditedNarratives({
        headline: report.headline || '',
        executive_summary: report.executive_summary || '',
        cost_of_chaos_narrative: report.cost_of_chaos_narrative || '',
        time_freedom_narrative: report.time_freedom_narrative || '',
        client_executive_brief: report.client_executive_brief || '',
      });
    }
  }, [report, isEditing]);

  const fetchData = async () => {
    if (!currentMember?.practice_id) {
      console.error('[Systems Audit Modal] No practice_id available');
      return;
    }

    setLoading(true);
    try {
      console.log('[Systems Audit Modal] Fetching data for clientId:', clientId, 'practiceId:', currentMember.practice_id);
      
      // First, verify the client belongs to this practice
      const { data: clientData, error: clientError } = await supabase
        .from('practice_members')
        .select('id, practice_id')
        .eq('id', clientId)
        .eq('practice_id', currentMember.practice_id)
        .maybeSingle();
      
      console.log('[Systems Audit Modal] Client verification:', { clientData, clientError });
      
      if (!clientData) {
        console.error('[Systems Audit Modal] Client not found or doesn\'t belong to practice');
        alert('Client not found or access denied');
        return;
      }
      
      // Fetch engagement - RLS should allow if client belongs to practice
      // The RLS policy checks: practice_id = current_setting('app.practice_id') OR client_id matches
      // Since we verified the client belongs to the practice, we can query without practice_id filter
      // and let RLS handle it, OR we can try with practice_id filter
      const { data: engagementData, error: engagementError } = await supabase
        .from('sa_engagements')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      console.log('[Systems Audit Modal] Engagement query result:', { engagementData, engagementError });

      if (engagementError) {
        console.error('[Systems Audit Modal] Error fetching engagement:', engagementError);
        alert(`Error loading engagement: ${engagementError.message}`);
        return;
      }

      if (engagementData) {
        console.log('[Systems Audit Modal] Found engagement:', engagementData.id, 'Status:', engagementData.status);
        setEngagement(engagementData);

        // Fetch Stage 1 responses - single row per engagement (UNIQUE constraint)
        const { data: stage1Data, error: stage1Error } = await supabase
          .from('sa_discovery_responses')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .maybeSingle();

        console.log('[Systems Audit Modal] Stage 1 responses:', { 
          data: stage1Data, 
          error: stage1Error,
          hasData: !!stage1Data,
          dataKeys: stage1Data ? Object.keys(stage1Data) : [],
          rawResponses: stage1Data?.raw_responses ? 'present' : 'missing'
        });
        if (stage1Error) {
          console.error('[Systems Audit Modal] Error fetching Stage 1:', stage1Error);
        } else if (stage1Data) {
          // Check if data is actually meaningful (not just empty object with id/timestamps)
          const hasContent = stage1Data.raw_responses || 
            Object.keys(stage1Data).some(key => 
              !['id', 'engagement_id', 'client_id', 'created_at', 'updated_at', 'completed_at'].includes(key) &&
              stage1Data[key] !== null && stage1Data[key] !== undefined && stage1Data[key] !== ''
            );
          
          if (hasContent) {
            setStage1Responses([stage1Data]);
          } else {
            console.warn('[Systems Audit Modal] Stage 1 data exists but appears empty');
            setStage1Responses([]);
          }
        } else {
          setStage1Responses([]);
        }

        // Fetch Stage 2 inventory
        const { data: stage2Data, error: stage2Error } = await supabase
          .from('sa_system_inventory')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('created_at');

        console.log('[Systems Audit Modal] Stage 2 inventory:', { count: stage2Data?.length || 0, error: stage2Error });
        if (stage2Error) {
          console.error('[Systems Audit Modal] Error fetching Stage 2:', stage2Error);
        } else {
          setStage2Inventory(stage2Data || []);
        }

        // Fetch Stage 3 deep dives
        const { data: stage3Data, error: stage3Error } = await supabase
          .from('sa_process_deep_dives')
          .select('*')
          .eq('engagement_id', engagementData.id);

        console.log('[Systems Audit Modal] Stage 3 deep dives:', { count: stage3Data?.length || 0, error: stage3Error });
        if (stage3Error) {
          console.error('[Systems Audit Modal] Error fetching Stage 3:', stage3Error);
        } else {
          setStage3DeepDives(stage3Data || []);
        }

        // Fetch report
        const { data: reportData, error: reportError } = await supabase
          .from('sa_audit_reports')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('[Systems Audit Modal] Report:', { reportData, error: reportError });
        if (reportError) {
          console.error('[Systems Audit Modal] Error fetching report:', reportError);
        } else {
          setReport(reportData);
        }

        // Fetch findings - order by severity: critical, high, medium, low
        const { data: findingsData, error: findingsError } = await supabase
          .from('sa_findings')
          .select('*')
          .eq('engagement_id', engagementData.id);
        
        // Sort findings by severity order (critical first)
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const sortedFindings = (findingsData || []).sort((a, b) => {
          const aOrder = severityOrder[a.severity as keyof typeof severityOrder] ?? 99;
          const bOrder = severityOrder[b.severity as keyof typeof severityOrder] ?? 99;
          return aOrder - bOrder;
        });

        if (findingsError) {
          console.error('[Systems Audit Modal] Error fetching findings:', findingsError);
          setFindings([]);
        } else {
          setFindings(sortedFindings);
          console.log('[Systems Audit Modal] Findings loaded:', sortedFindings.length);
        }

        // Fetch recommendations
        const { data: recsData, error: recsError } = await supabase
          .from('sa_recommendations')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('priority_rank');

        if (recsError) {
          console.error('[Systems Audit Modal] Error fetching recommendations:', recsError);
        } else {
          setRecommendations(recsData || []);
        }

        // Fetch uploaded documents
        const { data: docsData, error: docsError } = await supabase
          .from('sa_uploaded_documents')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('created_at', { ascending: false });
        
        if (docsError) {
          console.error('[Systems Audit Modal] Error fetching documents:', docsError);
        } else {
          setDocuments(docsData || []);
        }

        // Fetch context notes
        const { data: contextData, error: contextError } = await supabase
          .from('sa_context_notes')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .order('created_at', { ascending: false });
        
        if (contextError) {
          console.error('[Systems Audit Modal] Error fetching context notes:', contextError);
        } else {
          setContextNotes(contextData || []);
        }

        // Fetch client name
        if (engagementData.client_id) {
          const { data: clientData } = await supabase
            .from('practice_members')
            .select('client_company, company, name')
            .eq('id', engagementData.client_id)
            .maybeSingle();
          
          if (clientData) {
            setClientName(clientData.client_company || clientData.company || clientData.name || '');
          }
        }
      } else {
        console.log('[Systems Audit Modal] No engagement found for clientId:', clientId);
      }
    } catch (error) {
      console.error('[Systems Audit Modal] Unexpected error:', error);
      alert(`Error loading Systems Audit data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!engagement) return;
    
    setGenerating(true);
    
    try {
      // Call Pass 1 (which triggers Pass 2 automatically)
      console.log('[SA Report] Calling Pass 1...', { engagementId: engagement.id });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minute timeout
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-sa-report-pass1', {
          body: { engagementId: engagement.id },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (error) {
          console.error('[SA Report] Pass 1 error:', error);
          // Check if it's a timeout/connection error
          if (error.message?.includes('timeout') || 
              error.message?.includes('connection closed') ||
              error.message?.includes('aborted') ||
              error.message?.includes('Failed to send')) {
            // Pass 1 might still be running - start polling
            console.log('[SA Report] Pass 1 request timed out or failed to connect, but may still be processing. Polling...');
            pollForReport(engagement.id, 0);
            return;
          }
          throw error;
        }

        // Pass 1 completed - check if Pass 2 was triggered
        if (data?.pass2Triggered) {
          console.log('[SA Report] Pass 1 complete, Pass 2 triggered. Polling for completion...');
          // Start polling for Pass 2 completion
          pollForReport(engagement.id, 0);
        } else {
          // Pass 1 completed but Pass 2 not triggered - refresh to show Pass 1 data
          await fetchData();
          setGenerating(false);
        }
      } catch (invokeError: any) {
        clearTimeout(timeoutId);
        // If invoke itself fails, check if it's a connection error
        if (invokeError.name === 'AbortError' || 
            invokeError.message?.includes('timeout') || 
            invokeError.message?.includes('connection closed') ||
            invokeError.message?.includes('aborted') ||
            invokeError.message?.includes('Failed to send')) {
          console.log('[SA Report] Function invoke failed, but may still be processing. Polling...');
          pollForReport(engagement.id, 0);
          return;
        }
        throw invokeError;
      }
    } catch (error: any) {
      // Check if it's a timeout/abort error
      if (error.name === 'AbortError' || 
          error.message?.includes('timeout') || 
          error.message?.includes('connection closed') ||
          error.message?.includes('aborted')) {
        // Function is likely still processing - poll for completion
        console.log('[SA Report] Connection timed out, but generation may still be in progress. Polling...');
        pollForReport(engagement.id, 0);
        return;
      }
      
      console.error('[SA Report] Error generating report:', error);
      // Check if it's a "Failed to send" error - this might mean the function is still starting
      if (error.message?.includes('Failed to send') || error.message?.includes('Edge Function')) {
        console.log('[SA Report] Edge Function connection failed, but it may still be processing. Starting polling...');
        pollForReport(engagement.id, 0);
        return;
      }
      alert(`Error generating report: ${error.message || 'Unknown error'}`);
      setGenerating(false);
    }
  };

  // Poll for report completion (checks for 'generated' or 'pass2_failed' status)
  const pollForReport = async (engagementId: string, attempts: number) => {
    const maxAttempts = 30; // Poll for up to 7.5 minutes (15s * 30 = 7.5 min) to allow for both passes
    const pollInterval = 15000; // 15 seconds
    
    if (attempts >= maxAttempts) {
      alert('Report generation is taking longer than expected. Please refresh the page in a few minutes to check if it completed.');
      setGenerating(false);
      return;
    }
    
    try {
      // Check report status
      const { data: report } = await supabase
        .from('sa_audit_reports')
        .select('id, status, generated_at, headline')
        .eq('engagement_id', engagementId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (report) {
        if (report.status === 'generated') {
          // Report fully complete - refresh data
          console.log('[SA Report] Report completed! Refreshing data...');
          await fetchData();
          setGenerating(false);
          return;
        } else if (report.status === 'pass2_failed') {
          // Pass 2 failed - show error but keep Pass 1 data visible
          console.error('[SA Report] Pass 2 failed');
          alert('Report extraction completed, but narrative generation failed. You can retry Pass 2 or view the extracted data.');
          await fetchData();
          setGenerating(false);
          return;
        } else if (report.status === 'pass1_complete') {
          // Pass 1 complete, waiting for Pass 2
          console.log(`[SA Report] Pass 1 complete, waiting for Pass 2... (attempt ${attempts + 1}/${maxAttempts})`);
          // Continue polling
          setTimeout(() => pollForReport(engagementId, attempts + 1), pollInterval);
          return;
        }
      }
      
      // Report not ready yet - poll again
      console.log(`[SA Report] Polling attempt ${attempts + 1}/${maxAttempts}...`);
      setTimeout(() => pollForReport(engagementId, attempts + 1), pollInterval);
    } catch (error: any) {
      console.error('[SA Report] Error polling for report:', error);
      // Continue polling despite errors
      setTimeout(() => pollForReport(engagementId, attempts + 1), pollInterval);
    }
  };

  // Save edited narratives
  const handleSaveEdits = async () => {
    if (!report || !engagement) return;
    
    setSavingEdits(true);
    try {
      const { error } = await supabase
        .from('sa_audit_reports')
        .update({
          headline: editedNarratives.headline,
          executive_summary: editedNarratives.executive_summary,
          cost_of_chaos_narrative: editedNarratives.cost_of_chaos_narrative,
          time_freedom_narrative: editedNarratives.time_freedom_narrative,
          client_executive_brief: editedNarratives.client_executive_brief,
        })
        .eq('id', report.id);
      
      if (error) throw error;
      
      alert('Changes saved successfully!');
      setIsEditing(false);
      await fetchData(); // Refresh to show updated data
    } catch (error: any) {
      console.error('Error saving edits:', error);
      alert(`Error saving changes: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingEdits(false);
    }
  };

  // Make report available to client
  const handleMakeAvailableToClient = async () => {
    if (!report || !engagement) return;
    
    if (!confirm('Are you sure you want to make this report available to the client? They will be able to view it in their portal.')) {
      return;
    }
    
    setMakingAvailable(true);
    try {
      console.log('[SA Report] Making available to client:', {
        reportId: report.id,
        engagementId: engagement.id,
        currentStatus: report.status
      });
      
      // First, get the current user's practice_member ID for approved_by
      let approvedByMemberId = null;
      if (user?.id && currentMember?.id) {
        approvedByMemberId = currentMember.id;
      } else if (user?.id) {
        // Fallback: try to get practice member ID
        const { data: memberData } = await supabase
          .from('practice_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        approvedByMemberId = memberData?.id || null;
      }
      
      const { data: updatedReport, error } = await supabase
        .from('sa_audit_reports')
        .update({
          status: 'approved', // Set status to 'approved' to make it visible to client
          approved_at: new Date().toISOString(),
          approved_by: approvedByMemberId
        })
        .eq('id', report.id)
        .select()
        .single();
      
      if (error) {
        console.error('[SA Report] Error updating status:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          reportId: report.id,
          currentStatus: report.status
        });
        
        // If it's an RLS error, provide more helpful message
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          alert(`Permission denied: Unable to update report status. This may be an RLS policy issue. Error: ${error.message}`);
        } else {
          throw error;
        }
        return;
      }
      
      if (!updatedReport) {
        console.error('[SA Report] Update returned no data');
        alert('Update completed but no data returned. Please refresh and check the report status.');
        return;
      }
      
      console.log('[SA Report] Status updated successfully:', {
        reportId: updatedReport.id,
        newStatus: updatedReport.status,
        approvedAt: updatedReport.approved_at,
        approvedBy: updatedReport.approved_by
      });
      
      alert('Report is now available to the client!');
      await fetchData(); // Refresh to show updated status
    } catch (error: any) {
      console.error('[SA Report] Error making report available:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setMakingAvailable(false);
    }
  };

  // Document upload handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !engagement?.id || !currentMember?.practice_id) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const filePath = `${currentMember.practice_id}/${clientId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        // Create document record
        const { error: dbError } = await supabase
          .from('sa_uploaded_documents')
          .insert({
            engagement_id: engagement.id,
            filename: file.name,
            file_path: filePath,
            file_type: file.type || 'application/octet-stream',
            file_size_bytes: file.size,
            document_type: 'general',
            created_by: user?.id
          });
        
        if (dbError) {
          console.error('DB error:', dbError);
          throw dbError;
        }
      }
      
      // Refresh documents list
      const { data: docsData } = await supabase
        .from('sa_uploaded_documents')
        .select('*')
        .eq('engagement_id', engagement.id)
        .order('created_at', { ascending: false });
      
      setDocuments(docsData || []);
      alert(`${files.length} document(s) uploaded successfully!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (doc: any) => {
    if (!confirm('Delete this document?')) return;
    
    try {
      // Delete from storage
      await supabase.storage
        .from('client-documents')
        .remove([doc.file_path]);
      
      // Delete from database
      await supabase
        .from('sa_uploaded_documents')
        .delete()
        .eq('id', doc.id);
      
      // Refresh list
      setDocuments(documents.filter(d => d.id !== doc.id));
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Delete failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Add context note handler
  const handleAddContextNote = async () => {
    if (!engagement?.id || !newContext.content.trim()) {
      alert('Please enter some content');
      return;
    }

    setSavingContext(true);
    try {
      const { error } = await supabase
        .from('sa_context_notes')
        .insert({
          engagement_id: engagement.id,
          note_type: newContext.note_type,
          title: newContext.title || null,
          content: newContext.content,
          related_question: newContext.related_question || null,
          source: newContext.source || null,
          participants: newContext.participants.length > 0 ? newContext.participants : null,
          include_in_analysis: newContext.include_in_analysis,
          created_by: user?.id
        });
      
      if (error) throw error;
      
      // Refresh context notes
      const { data: contextData } = await supabase
        .from('sa_context_notes')
        .select('*')
        .eq('engagement_id', engagement.id)
        .order('created_at', { ascending: false });
      
      setContextNotes(contextData || []);
      
      // Reset form
      setNewContext({
        note_type: 'followup_answer',
        title: '',
        content: '',
        related_question: '',
        source: '',
        participants: [],
        include_in_analysis: true
      });
      setShowAddContext(false);
      alert('Context note added successfully!');
    } catch (error: any) {
      console.error('Error adding context:', error);
      alert(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingContext(false);
    }
  };

  // Delete context note handler
  const handleDeleteContextNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    
    try {
      await supabase
        .from('sa_context_notes')
        .delete()
        .eq('id', noteId);
      
      setContextNotes(contextNotes.filter(n => n.id !== noteId));
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Delete failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Allow regeneration if all stages are complete OR if a report already exists
  const allStagesComplete = engagement?.status === 'stage_3_complete' || 
                            engagement?.status === 'analysis_complete' || 
                            engagement?.status === 'report_delivered' ||
                            engagement?.status === 'completed';
  const canGenerateOrRegenerate = allStagesComplete || !!report;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Systems Audit</h2>
            <p className="text-sm text-gray-500">Client ID: {clientId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'assessments', label: 'Assessments', icon: FileText },
            { id: 'documents', label: 'Documents / Context', icon: Upload },
            { id: 'analysis', label: 'Analysis', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
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
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : (
            <>
              {/* ASSESSMENTS TAB */}
              {activeTab === 'assessments' && (
                <div className="space-y-6">
                  {/* Stage 1 */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-amber-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Stage 1: Discovery Assessment</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {engagement?.stage_1_completed_at ? 'Completed' : 'Not started'}
                      </p>
                    </div>
                    <div className="p-6">
                      {stage1Responses.length > 0 && stage1Responses[0] ? (
                        <div className="space-y-4">
                          {(() => {
                            const response = stage1Responses[0];
                            const rawResponses = response.raw_responses || {};
                            
                            // Helper to get value from either individual column or raw_responses
                            const getValue = (dbKey: string, rawKey?: string): any => {
                              // First try individual column
                              if (response[dbKey] !== null && response[dbKey] !== undefined && response[dbKey] !== '') {
                                return response[dbKey];
                              }
                              // Fallback to raw_responses if provided
                              if (rawKey && rawResponses[rawKey] !== null && rawResponses[rawKey] !== undefined && rawResponses[rawKey] !== '') {
                                return rawResponses[rawKey];
                              }
                              return null;
                            };
                            
                            // All possible fields from sa_discovery_responses table
                            // Format: { key: 'db_column_name', rawKey: 'raw_responses_key', label: '...', section: '...' }
                            const fields = [
                              // Section 1: Current Pain
                              { key: 'systems_breaking_point', rawKey: 'sa_breaking_point', label: 'What broke – or is about to break – that made you think about systems?', section: 'Current Pain' },
                              { key: 'operations_self_diagnosis', rawKey: 'sa_operations_diagnosis', label: 'How would you describe your current operations?', section: 'Current Pain' },
                              { key: 'month_end_shame', rawKey: 'sa_month_end_shame', label: 'What would embarrass you if a potential investor saw it?', section: 'Current Pain' },
                              
                              // Section 2: Impact Quantification
                              { key: 'manual_hours_monthly', rawKey: 'sa_manual_hours', label: 'How many hours per month are spent on manual data entry or transfer?', section: 'Impact Quantification' },
                              { key: 'month_end_close_duration', rawKey: 'sa_month_end_duration', label: 'How long does your month-end close take?', section: 'Impact Quantification' },
                              { key: 'data_error_frequency', rawKey: 'sa_data_error_frequency', label: 'How often do you discover data errors or inconsistencies?', section: 'Impact Quantification' },
                              { key: 'expensive_systems_mistake', rawKey: 'sa_expensive_mistake', label: 'What\'s the most expensive mistake your systems have caused?', section: 'Impact Quantification' },
                              { key: 'information_access_frequency', rawKey: 'sa_information_access', label: 'How often can\'t you get the information you need within 5 minutes?', section: 'Impact Quantification' },
                              
                              // Section 3: Tech Stack
                              { key: 'software_tools_used', rawKey: 'sa_tech_stack', label: 'What software tools do you currently use?', section: 'Tech Stack' },
                              { key: 'integration_rating', rawKey: 'sa_integration_health', label: 'How well do your systems integrate with each other?', section: 'Tech Stack' },
                              { key: 'critical_spreadsheets', rawKey: 'sa_spreadsheet_count', label: 'How many critical spreadsheets do you rely on?', section: 'Tech Stack' },
                              
                              // Section 4: Focus Areas
                              { key: 'broken_areas', rawKey: 'sa_priority_areas', label: 'Which areas of your business feel most broken?', section: 'Focus Areas' },
                              { key: 'magic_process_fix', rawKey: 'sa_magic_fix', label: 'If you could fix one process by magic, what would it be?', section: 'Focus Areas' },
                              
                              // Section 5: Readiness
                              { key: 'change_appetite', rawKey: 'sa_change_appetite', label: 'What\'s your appetite for change right now?', section: 'Readiness' },
                              { key: 'systems_fears', rawKey: 'sa_fears', label: 'What are your biggest fears about changing systems?', section: 'Readiness' },
                              { key: 'internal_champion', rawKey: 'sa_champion', label: 'Who would champion systems improvements internally?', section: 'Readiness' },
                              
                              // Section 6: Context
                              { key: 'team_size', rawKey: 'sa_team_size', label: 'Current team size', section: 'Context' },
                              { key: 'expected_team_size_12mo', rawKey: 'sa_expected_team_size', label: 'Expected team size in 12 months', section: 'Context' },
                              { key: 'revenue_band', rawKey: 'sa_revenue_band', label: 'Annual revenue band', section: 'Context' },
                              { key: 'industry_sector', rawKey: 'sa_industry_sector', label: 'Industry sector', section: 'Context' },
                            ];
                            
                            // Group by section
                            const sections: Record<string, typeof fields> = {};
                            fields.forEach((field) => {
                              if (!sections[field.section]) sections[field.section] = [];
                              sections[field.section].push(field);
                            });
                            
                            return Object.entries(sections).map(([sectionName, sectionFields]: [string, typeof fields]) => {
                              const sectionData = sectionFields
                                .map((field) => {
                                  let value = getValue(field.key, field.rawKey);
                                  if (value === null || value === undefined || value === '') {
                                    return null;
                                  }
                                  if (Array.isArray(value)) {
                                    value = value.join(', ');
                                  } else if (typeof value === 'string' && value.includes('_') && !value.includes(' ')) {
                                    // Format enum values: 'controlled_chaos' -> 'Controlled Chaos'
                                    value = value.split('_').map((word: string) => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ');
                                  }
                                  return { field, value };
                                })
                                .filter((item): item is { field: typeof fields[0], value: any } => item !== null);
                              
                              if (sectionData.length === 0) return null;
                              
                              return (
                                <div key={sectionName} className="mb-6">
                                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{sectionName}</h5>
                                  <div className="space-y-3">
                                    {sectionData.map(({ field, value }) => (
                                      <div key={field.key} className="border-l-4 border-amber-500 pl-4">
                                        <p className="font-medium text-gray-900">{field.label}</p>
                                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{String(value)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }).filter(Boolean);
                          })()}
                        </div>
                      ) : (
                        <p className="text-gray-500">No responses yet</p>
                      )}
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-amber-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Stage 2: System Inventory</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {engagement?.stage_2_completed_at ? 'Completed' : 'Not started'}
                      </p>
                    </div>
                    <div className="p-6">
                      {stage2Inventory.length > 0 ? (
                        <div className="space-y-6">
                          {stage2Inventory.map((system) => (
                            <div key={system.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">{system.system_name}</h4>
                                  <p className="text-sm text-gray-600">{system.category_code} {system.sub_category && `• ${system.sub_category}`}</p>
                                  {system.vendor && <p className="text-xs text-gray-500 mt-1">Vendor: {system.vendor}</p>}
                                </div>
                                {system.criticality && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    system.criticality === 'critical' ? 'bg-red-100 text-red-700' :
                                    system.criticality === 'important' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {system.criticality.charAt(0).toUpperCase() + system.criticality.slice(1)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                {/* Usage */}
                                {(system.primary_users?.length > 0 || system.number_of_users || system.usage_frequency) && (
                                  <div className="border-l-2 border-blue-200 pl-3">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Usage</p>
                                    {system.primary_users?.length > 0 && (
                                      <p className="text-sm text-gray-700">Users: {system.primary_users.join(', ')}</p>
                                    )}
                                    {system.number_of_users && (
                                      <p className="text-sm text-gray-700">Count: {system.number_of_users}</p>
                                    )}
                                    {system.usage_frequency && (
                                      <p className="text-sm text-gray-700">Frequency: {system.usage_frequency.charAt(0).toUpperCase() + system.usage_frequency.slice(1)}</p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Cost */}
                                {(system.pricing_model || system.monthly_cost || system.annual_cost) && (
                                  <div className="border-l-2 border-green-200 pl-3">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Cost</p>
                                    {system.pricing_model && (
                                      <p className="text-sm text-gray-700">Model: {system.pricing_model.charAt(0).toUpperCase() + system.pricing_model.slice(1).replace('_', ' ')}</p>
                                    )}
                                    {system.monthly_cost && (
                                      <p className="text-sm text-gray-700">Monthly: £{system.monthly_cost}</p>
                                    )}
                                    {system.annual_cost && (
                                      <p className="text-sm text-gray-700">Annual: £{system.annual_cost}</p>
                                    )}
                                    {system.cost_trend && (
                                      <p className="text-sm text-gray-700">Trend: {system.cost_trend.charAt(0).toUpperCase() + system.cost_trend.slice(1)}</p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Integration */}
                                {(system.integration_method || system.integrates_with_names?.length > 0 || system.manual_transfer_required) && (
                                  <div className="border-l-2 border-purple-200 pl-3">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Integration</p>
                                    {system.integration_method && (
                                      <p className="text-sm text-gray-700">Method: {system.integration_method.charAt(0).toUpperCase() + system.integration_method.slice(1).replace('_', ' ')}</p>
                                    )}
                                    {system.integrates_with_names?.length > 0 && (
                                      <p className="text-sm text-gray-700">Integrates with: {system.integrates_with_names.join(', ')}</p>
                                    )}
                                    {system.manual_transfer_required && (
                                      <p className="text-sm text-amber-600">⚠️ Manual transfer required</p>
                                    )}
                                    {system.manual_hours_monthly && (
                                      <p className="text-sm text-gray-700">Manual hours/month: {system.manual_hours_monthly}</p>
                                    )}
                                    {system.manual_process_description && (
                                      <p className="text-xs text-gray-600 mt-1 italic">{system.manual_process_description}</p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Data Quality & Satisfaction */}
                                {(system.data_quality_score || system.data_entry_method || system.user_satisfaction || system.fit_for_purpose) && (
                                  <div className="border-l-2 border-indigo-200 pl-3">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Quality & Satisfaction</p>
                                    {system.data_quality_score && (
                                      <p className="text-sm text-gray-700">Data Quality: {system.data_quality_score}/5</p>
                                    )}
                                    {system.data_entry_method && (
                                      <p className="text-sm text-gray-700">Entry: {system.data_entry_method.charAt(0).toUpperCase() + system.data_entry_method.slice(1).replace('_', ' ')}</p>
                                    )}
                                    {system.user_satisfaction && (
                                      <p className="text-sm text-gray-700">Satisfaction: {system.user_satisfaction}/5</p>
                                    )}
                                    {system.fit_for_purpose && (
                                      <p className="text-sm text-gray-700">Fit: {system.fit_for_purpose}/5</p>
                                    )}
                                    {system.would_recommend && (
                                      <p className="text-sm text-gray-700">Recommend: {system.would_recommend.charAt(0).toUpperCase() + system.would_recommend.slice(1)}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Pain Points */}
                              {(system.known_issues || system.workarounds_in_use || system.change_one_thing) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Pain Points</p>
                                  {system.known_issues && (
                                    <p className="text-sm text-gray-700 mb-2"><strong>Known Issues:</strong> {system.known_issues}</p>
                                  )}
                                  {system.workarounds_in_use && (
                                    <p className="text-sm text-gray-700 mb-2"><strong>Workarounds:</strong> {system.workarounds_in_use}</p>
                                  )}
                                  {system.change_one_thing && (
                                    <p className="text-sm text-gray-700"><strong>Change One Thing:</strong> {system.change_one_thing}</p>
                                  )}
                                </div>
                              )}
                              
                              {/* Future Plans */}
                              {(system.future_plan || system.replacement_candidate || system.contract_end_date) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Future Plans</p>
                                  {system.future_plan && (
                                    <p className="text-sm text-gray-700">Plan: {system.future_plan.charAt(0).toUpperCase() + system.future_plan.slice(1)}</p>
                                  )}
                                  {system.replacement_candidate && (
                                    <p className="text-sm text-gray-700">Replacement: {system.replacement_candidate}</p>
                                  )}
                                  {system.contract_end_date && (
                                    <p className="text-sm text-gray-700">Contract ends: {new Date(system.contract_end_date).toLocaleDateString()}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No systems added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-amber-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Stage 3: Process Deep Dives</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {engagement?.stage_3_completed_at ? 'Completed' : 'Not started'}
                      </p>
                    </div>
                    <div className="p-6">
                      {stage3DeepDives.length > 0 ? (
                        <div className="space-y-6">
                          {stage3DeepDives.map((dive) => {
                            const responses = dive.responses || {};
                            const chainName = dive.chain_code 
                              ? dive.chain_code.split('_').map((word: string) => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join('-')
                              : 'Unknown Chain';
                            
                            return (
                              <div key={dive.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                                <div className="flex items-start justify-between mb-4">
                                  <h4 className="text-lg font-semibold text-gray-900">{chainName}</h4>
                                  {dive.completed_at && (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                      Completed {new Date(dive.completed_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Key Pain Points */}
                                {dive.key_pain_points && dive.key_pain_points.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Key Pain Points</p>
                                    <div className="space-y-2">
                                      {dive.key_pain_points.map((point: string, idx: number) => (
                                        <div key={idx} className="border-l-4 border-amber-500 pl-4">
                                          <p className="text-sm text-gray-700">{point}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Hours Identified */}
                                {dive.hours_identified && (
                                  <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Hours Wasted Identified</p>
                                    <p className="text-lg font-semibold text-red-600">{dive.hours_identified} hours/week</p>
                                  </div>
                                )}
                                
                                {/* All Responses (JSONB) */}
                                {Object.keys(responses).length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-3">Full Responses</p>
                                    <div className="space-y-3">
                                      {Object.entries(responses).map(([key, value]: [string, any]) => {
                                        // Format the key for display
                                        const displayKey = key.split('_').map((word: string) => 
                                          word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ');
                                        
                                        let displayValue = value;
                                        if (Array.isArray(value)) {
                                          displayValue = value.join(', ');
                                        } else if (typeof value === 'object' && value !== null) {
                                          displayValue = JSON.stringify(value, null, 2);
                                        }
                                        
                                        return (
                                          <div key={key} className="bg-gray-50 rounded p-3">
                                            <p className="text-xs font-medium text-gray-600 mb-1">{displayKey}</p>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(displayValue)}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Notes */}
                                {dive.notes && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Notes</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{dive.notes}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500">No deep dives completed yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  {/* Document Upload Section */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Uploaded Documents</h4>
                        <p className="text-sm text-gray-500">Process maps, system screenshots, contracts, etc.</p>
                      </div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer text-sm font-medium">
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Upload Files'}
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"
                          onChange={handleDocumentUpload}
                          className="hidden"
                          disabled={uploading || !engagement}
                        />
                      </label>
                    </div>

                    {documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-amber-600" />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{doc.filename}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteDocument(doc)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No documents uploaded yet</p>
                        <p className="text-sm">Upload process maps, screenshots, or other supporting docs</p>
                      </div>
                    )}
                  </div>

                  {/* Context Notes Section */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Follow-up Answers & Context</h4>
                        <p className="text-sm text-gray-500">Call transcripts, meeting notes, additional insights</p>
                      </div>
                      <button
                        onClick={() => setShowAddContext(true)}
                        disabled={!engagement}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                        Add Context
                      </button>
                    </div>

                    {contextNotes.length > 0 ? (
                      <div className="space-y-3">
                        {contextNotes.map((note) => (
                          <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    note.note_type === 'call_transcript' ? 'bg-purple-100 text-purple-700' :
                                    note.note_type === 'followup_answer' ? 'bg-blue-100 text-blue-700' :
                                    note.note_type === 'meeting_notes' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {note.note_type === 'call_transcript' ? 'Call Transcript' :
                                     note.note_type === 'followup_answer' ? 'Follow-up Answer' :
                                     note.note_type === 'meeting_notes' ? 'Meeting Notes' :
                                     note.note_type === 'observation' ? 'Observation' : 'General'}
                                  </span>
                                  {note.title && <span className="font-medium text-gray-900">{note.title}</span>}
                                </div>
                                {note.related_question && (
                                  <p className="text-sm text-gray-500 italic mb-1">Re: {note.related_question}</p>
                                )}
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content.substring(0, 300)}{note.content.length > 300 ? '...' : ''}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {note.source && `Source: ${note.source} • `}
                                  {new Date(note.created_at).toLocaleDateString()}
                                  {note.include_in_analysis && ' • Will be included in analysis'}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteContextNote(note.id)}
                                className="p-1 text-gray-400 hover:text-red-600 ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No context notes yet</p>
                        <p className="text-sm">Add follow-up answers, call transcripts, or meeting notes</p>
                      </div>
                    )}
                  </div>

                  {/* Add Context Modal */}
                  {showAddContext && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Add Context Note</h3>
                        </div>
                        <div className="p-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={newContext.note_type}
                              onChange={(e) => setNewContext({ ...newContext, note_type: e.target.value as any })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              <option value="followup_answer">Follow-up Answer</option>
                              <option value="call_transcript">Call Transcript</option>
                              <option value="meeting_notes">Meeting Notes</option>
                              <option value="observation">Observation</option>
                              <option value="general">General Note</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                            <input
                              type="text"
                              value={newContext.title}
                              onChange={(e) => setNewContext({ ...newContext, title: e.target.value })}
                              placeholder="e.g., Discovery call with MD"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>

                          {newContext.note_type === 'followup_answer' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Related Question</label>
                              <input
                                type="text"
                                value={newContext.related_question}
                                onChange={(e) => setNewContext({ ...newContext, related_question: e.target.value })}
                                placeholder="What question is this answering?"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                            <textarea
                              value={newContext.content}
                              onChange={(e) => setNewContext({ ...newContext, content: e.target.value })}
                              placeholder={
                                newContext.note_type === 'call_transcript' 
                                  ? 'Paste the call transcript here...' 
                                  : newContext.note_type === 'followup_answer'
                                  ? 'Enter the client\'s answer or clarification...'
                                  : 'Enter notes or observations...'
                              }
                              rows={8}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Source (optional)</label>
                            <input
                              type="text"
                              value={newContext.source}
                              onChange={(e) => setNewContext({ ...newContext, source: e.target.value })}
                              placeholder="e.g., Call with John Smith 14/01/2026"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="includeInAnalysis"
                              checked={newContext.include_in_analysis}
                              onChange={(e) => setNewContext({ ...newContext, include_in_analysis: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor="includeInAnalysis" className="text-sm text-gray-700">
                              Include in AI analysis (this context will inform report generation)
                            </label>
                          </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                          <button
                            onClick={() => setShowAddContext(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddContextNote}
                            disabled={savingContext || !newContext.content.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
                          >
                            {savingContext ? 'Saving...' : 'Add Note'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ANALYSIS TAB */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {!report ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No report generated yet</p>
                      <button
                        onClick={handleGenerateReport}
                        disabled={generating || !canGenerateOrRegenerate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        {generating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {generating ? 'Generating Analysis...' : 'Generate Analysis'}
                      </button>
                      {!canGenerateOrRegenerate && (
                        <p className="text-sm text-gray-500 mt-2">Complete all 3 stages first</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* View Mode Toggle & Regenerate Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                          <button
                            onClick={() => setViewMode('admin')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              viewMode === 'admin' 
                                ? 'bg-white shadow text-gray-900' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <Users className="w-4 h-4 inline mr-2" />
                            Team View
                          </button>
                          <button
                            onClick={() => setViewMode('client')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              viewMode === 'client' 
                                ? 'bg-white shadow text-gray-900' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <FileText className="w-4 h-4 inline mr-2" />
                            Client View
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">Generated Analysis</p>
                            <p className="text-xs text-gray-500">
                              {report.generated_at && new Date(report.generated_at).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={handleGenerateReport}
                            disabled={generating || !canGenerateOrRegenerate}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            {generating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Regenerating...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Regenerate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Status Messages */}
                      {report.status === 'pass1_complete' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-800">
                            <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                            <strong>Pass 1 Complete:</strong> Data extraction finished. Narrative generation (Pass 2) is in progress...
                          </p>
                        </div>
                      )}
                      
                      {report.status === 'pass2_failed' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                          <p className="text-sm text-red-800">
                            <strong>Pass 2 Failed:</strong> Narrative generation encountered an error.
                          </p>
                          <button
                            onClick={async () => {
                              if (!engagement) return;
                              setGenerating(true);
                              try {
                                await supabase.functions.invoke('generate-sa-report-pass2', {
                                  body: { engagementId: engagement.id }
                                });
                                pollForReport(engagement.id, 0);
                              } catch (error: any) {
                                alert(`Error retrying: ${error.message}`);
                                setGenerating(false);
                              }
                            }}
                            disabled={generating}
                            className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Make Available to Client Button & Edit Toggle */}
                      {viewMode === 'client' && report && (
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            {report.status === 'approved' || report.status === 'published' || report.status === 'delivered' ? (
                              <div className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Report is available to client</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-700">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">Report not yet available to client</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsEditing(!isEditing)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                            >
                              {isEditing ? 'Cancel Edit' : 'Edit Client View'}
                            </button>
                            {!isEditing && (report.status === 'generated' || report.status === 'approved') && (
                              <button
                                onClick={handleMakeAvailableToClient}
                                disabled={makingAvailable}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                              >
                                {makingAvailable ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Making Available...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Make Available to Client</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conditional View */}
                      {viewMode === 'admin' ? (
                        <SAAdminReportView 
                          report={report} 
                          engagement={engagement}
                          findings={findings}
                          recommendations={recommendations}
                        />
                      ) : isEditing ? (
                        <div className="space-y-6">
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Client-Facing Narratives</h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Headline
                                </label>
                                <input
                                  type="text"
                                  value={editedNarratives.headline}
                                  onChange={(e) => setEditedNarratives(prev => ({ ...prev, headline: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  placeholder="Enter headline..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Executive Summary
                                </label>
                                <textarea
                                  value={editedNarratives.executive_summary}
                                  onChange={(e) => setEditedNarratives(prev => ({ ...prev, executive_summary: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  rows={6}
                                  placeholder="Enter executive summary..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Cost of Chaos Narrative
                                </label>
                                <textarea
                                  value={editedNarratives.cost_of_chaos_narrative}
                                  onChange={(e) => setEditedNarratives(prev => ({ ...prev, cost_of_chaos_narrative: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  rows={4}
                                  placeholder="Enter cost of chaos narrative..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Time Freedom Narrative
                                </label>
                                <textarea
                                  value={editedNarratives.time_freedom_narrative}
                                  onChange={(e) => setEditedNarratives(prev => ({ ...prev, time_freedom_narrative: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  rows={4}
                                  placeholder="Enter time freedom narrative..."
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Client Executive Brief
                                </label>
                                <textarea
                                  value={editedNarratives.client_executive_brief}
                                  onChange={(e) => setEditedNarratives(prev => ({ ...prev, client_executive_brief: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  rows={4}
                                  placeholder="Enter client executive brief..."
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                              <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveEdits}
                                disabled={savingEdits}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg flex items-center gap-2"
                              >
                                {savingEdits ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Changes</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <SAClientReportView 
                          report={report}
                          companyName={clientName}
                        />
                      )}
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

