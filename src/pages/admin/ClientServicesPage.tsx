import { useState, useEffect } from 'react';
import { Navigation } from '../../components/Navigation';
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
  Plus
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: any) => void;
}

// Service Lines - these are your client-facing programs
const SERVICE_LINES = [
  { 
    id: '365-alignment', 
    name: '365 Alignment Program',
    description: 'Life-first business transformation with 5-year vision, 6-month shift, and 12-week sprints',
    icon: Target,
    color: 'indigo'
  },
  { 
    id: 'growth-advisory', 
    name: 'Growth Advisory',
    description: 'Strategic growth planning and execution support',
    icon: TrendingUp,
    color: 'emerald'
  },
  { 
    id: 'exit-planning', 
    name: 'Exit Planning',
    description: 'Business value optimization and succession planning',
    icon: Briefcase,
    color: 'amber'
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

export function ClientServicesPage({ currentPage, onNavigate }: NavigationProps) {
  const { currentMember } = useCurrentMember();
  const [selectedServiceLine, setSelectedServiceLine] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Fetch clients when service line is selected
  useEffect(() => {
    if (selectedServiceLine) {
      fetchClients();
    }
  }, [selectedServiceLine]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Get practice_id from current member
      const { data: memberData } = await supabase
        .from('team_members')
        .select('practice_id')
        .eq('auth_user_id', currentMember?.id)
        .single();

      if (!memberData?.practice_id) {
        console.log('No practice found');
        setLoading(false);
        return;
      }

      // Fetch clients from practice_members
      const { data: clientsData, error } = await supabase
        .from('practice_members')
        .select(`
          id,
          name,
          email,
          client_company,
          program_status,
          last_portal_login
        `)
        .eq('practice_id', memberData.practice_id)
        .eq('member_type', 'client')
        .order('name');

      if (error) throw error;

      // Fetch assessments and roadmaps for these clients
      const clientIds = clientsData?.map(c => c.id) || [];
      
      const { data: assessments } = await supabase
        .from('client_assessments')
        .select('client_id, status')
        .in('client_id', clientIds);

      const { data: roadmaps } = await supabase
        .from('client_roadmaps')
        .select('client_id')
        .in('client_id', clientIds)
        .eq('is_active', true);

      // Map to client objects
      const enrichedClients: Client[] = (clientsData || []).map(client => {
        const clientAssessments = assessments?.filter(a => a.client_id === client.id) || [];
        const completedCount = clientAssessments.filter(a => a.status === 'completed').length;
        const hasRoadmap = roadmaps?.some(r => r.client_id === client.id) || false;

        return {
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.client_company,
          service_line: '365-alignment', // For now, all are 365
          status: client.program_status || 'active',
          progress: completedCount * 33, // 3 parts = 33% each
          lastActivity: client.last_portal_login,
          hasRoadmap
        };
      });

      setClients(enrichedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
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
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add Client
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
      </main>
    </div>
  );
}

// Simple modal for now - can be expanded
function ClientDetailModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'context' | 'sprint'>('overview');

  useEffect(() => {
    fetchClientDetail();
  }, [clientId]);

  const fetchClientDetail = async () => {
    setLoading(true);
    try {
      // Fetch client data
      const { data: clientData } = await supabase
        .from('practice_members')
        .select('*')
        .eq('id', clientId)
        .single();

      // Fetch roadmap
      const { data: roadmap } = await supabase
        .from('client_roadmaps')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      // Fetch context
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
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
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* North Star */}
                  {client?.roadmap?.roadmap_data?.fiveYearVision?.northStar && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                      <p className="text-sm opacity-80 mb-2">North Star</p>
                      <p className="text-lg font-medium">
                        {client.roadmap.roadmap_data.fiveYearVision.northStar}
                      </p>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-5">
                      <p className="text-sm text-gray-500">Assessment Progress</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {client?.roadmap ? '100%' : '0%'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5">
                      <p className="text-sm text-gray-500">Context Notes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {client?.context?.length || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5">
                      <p className="text-sm text-gray-500">Roadmap Version</p>
                      <p className="text-2xl font-bold text-gray-900">
                        v{client?.roadmap?.version || 1}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'roadmap' && (
                <div className="space-y-6">
                  {client?.roadmap ? (
                    <>
                      {/* Vision */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                        <h3 className="font-semibold text-indigo-900 mb-3">5-Year Vision</h3>
                        <p className="text-indigo-800">
                          {client.roadmap.roadmap_data?.fiveYearVision?.tagline || 'Vision not generated'}
                        </p>
                      </div>

                      {/* 12-Week Sprint Summary */}
                      {client.roadmap.roadmap_data?.sprint?.weeks && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">12-Week Sprint</h3>
                          <div className="space-y-2">
                            {client.roadmap.roadmap_data.sprint.weeks.slice(0, 4).map((week: any) => (
                              <div key={week.weekNumber} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium text-sm">
                                    {week.weekNumber}
                                  </span>
                                  <div>
                                    <p className="font-medium text-gray-900">{week.theme}</p>
                                    <p className="text-sm text-gray-500">{week.tasks?.length || 0} tasks</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-2 text-center">
                            + {(client.roadmap.roadmap_data.sprint.weeks.length - 4)} more weeks
                          </p>
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

              {activeTab === 'context' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Add meeting notes, emails, or priorities to inform the next sprint regeneration
                    </p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                      <Plus className="w-4 h-4" />
                      Add Context
                    </button>
                  </div>

                  {client?.context?.length > 0 ? (
                    <div className="space-y-3">
                      {client.context.map((ctx: any) => (
                        <div key={ctx.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              ctx.context_type === 'priority' ? 'bg-red-100 text-red-700' :
                              ctx.context_type === 'transcript' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {ctx.context_type}
                            </span>
                            {!ctx.processed && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                New
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(ctx.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{ctx.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No context added yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sprint' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">
                      <strong>Sprint Refinement:</strong> Make changes to the 12-week sprint here. 
                      All changes will be logged in the knowledge base for future reference.
                    </p>
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
                                <p className="text-sm text-gray-500">{week.phase}</p>
                              </div>
                            </div>
                            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                              Edit Tasks
                            </button>
                          </div>
                          <div className="p-4 space-y-2">
                            {week.tasks?.map((task: any) => (
                              <div key={task.id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg">
                                <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 font-medium">{task.title}</p>
                                  <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                                </div>
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
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          {client?.roadmap && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Regenerate Roadmap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

