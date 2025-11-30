import { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics' | 'clients';

interface ClientServicesPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
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

export function ClientServicesPage({ currentPage, onNavigate }: ClientServicesPageProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
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

// Enhanced Client Detail Modal with full functionality
function ClientDetailModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'context' | 'sprint'>('overview');
  
  // Context form state
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContext, setNewContext] = useState({ type: 'note', content: '', priority: 'normal' });
  const [addingContext, setAddingContext] = useState(false);
  
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
  // ADD CONTEXT FUNCTIONALITY
  // ================================================================
  const handleAddContext = async () => {
    if (!newContext.content.trim() || !client?.practice_id) return;
    
    setAddingContext(true);
    try {
      // Get current member's practice_member ID for added_by
      const { data: memberData } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', currentMember?.id)
        .eq('member_type', 'team')
        .single();

      const { error } = await supabase
        .from('client_context')
        .insert({
          practice_id: client.practice_id,
          client_id: clientId,
          context_type: newContext.type,
          content: newContext.content,
          priority_level: newContext.priority,
          added_by: memberData?.id,
          processed: false
        });

      if (error) throw error;

      // Refresh client data
      await fetchClientDetail();
      setNewContext({ type: 'note', content: '', priority: 'normal' });
      setShowAddContext(false);
    } catch (error) {
      console.error('Error adding context:', error);
      alert('Failed to add context. Please try again.');
    } finally {
      setAddingContext(false);
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
  // REGENERATE ROADMAP FUNCTIONALITY
  // ================================================================
  const handleRegenerate = async () => {
    if (!client?.practice_id) return;
    
    const unprocessedContext = client.context?.filter((c: any) => !c.processed) || [];
    const confirmMessage = unprocessedContext.length > 0
      ? `Regenerate roadmap? ${unprocessedContext.length} new context item(s) will be incorporated.`
      : 'Regenerate roadmap? This will create a new version based on current assessments.';
    
    if (!confirm(confirmMessage)) return;
    
    setRegenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-roadmap', {
        body: {
          clientId,
          practiceId: client.practice_id,
          regenerate: true
        }
      });

      if (response.error) throw response.error;

      // Refresh client data
      await fetchClientDetail();
      alert('Roadmap regenerated successfully!');
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
          <div className="flex items-center gap-3">
            {client?.roadmap && (
              <button
                onClick={handleRegenerate}
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
                  </>
                )}
              </button>
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                          <textarea
                            value={newContext.content}
                            onChange={(e) => setNewContext({ ...newContext, content: e.target.value })}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Paste meeting transcript, email content, or notes here..."
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setShowAddContext(false);
                              setNewContext({ type: 'note', content: '', priority: 'normal' });
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddContext}
                            disabled={addingContext || !newContext.content.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                          >
                            {addingContext && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Save Context
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
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              ctx.context_type === 'priority' ? 'bg-red-100 text-red-700' :
                              ctx.context_type === 'transcript' ? 'bg-blue-100 text-blue-700' :
                              ctx.context_type === 'email' ? 'bg-amber-100 text-amber-700' :
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
                            {!ctx.processed && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                New - will be processed
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(ctx.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{ctx.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No context added yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add meeting notes or emails to inform roadmap generation</p>
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

