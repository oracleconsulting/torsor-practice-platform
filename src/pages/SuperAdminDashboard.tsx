import React, { useEffect, useState } from 'react';
import { RoleGuard } from '../components/auth/RoleGuard';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Users, Activity, RefreshCw, Eye, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Settings, Brain, FileText, Target, Search, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { toast } from 'sonner';
import { AdminClientView } from '../components/admin/AdminClientView';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { InitializeAdminService } from '../services/initializeAdminService';
import { KnowledgeBasePage } from './admin/KnowledgeBasePage';
import '../utils/runMigration'; // Import migration utility for console access

interface ClientData {
  id: string;
  email: string;
  status: string;
  part1Complete: boolean;
  part1CompletedAt: string | null;
  part2Complete: boolean;
  part2CompletedAt: string | null;
  validationComplete: boolean;
  validationCompletedAt: string | null;
  roadmapGenerated: boolean;
  boardGenerated: boolean;
  lastActive: string;
  currentWeek: number;
  totalTasks: number;
  completedTasks: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  completedAssessments: number;
  generatedRoadmaps: number;
  averageCompletion: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'clients' | 'knowledge'>('clients');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedAssessments: 0,
    generatedRoadmaps: 0,
    averageCompletion: 0
  });
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const determineStatus = (client: any, part2: any, config: any): string => {
    // Check if user has started anything
    const hasResponses = client.responses && Object.keys(client.responses).length > 0;
    const hasPart2 = part2?.completed || part2?.roadmap_generated || part2?.group_id;
    const hasConfig = config?.roadmap || config?.board || config?.group_id;
    
    if (!hasResponses && !hasPart2 && !hasConfig) return 'Not Started';
    if (hasResponses && !hasPart2) return 'Part 1 Complete';
    if (hasPart2 && !hasConfig) return 'Part 2 Complete';
    if (hasConfig && !config?.board) return 'Roadmap Generated';
    if (config?.board && config?.roadmap) return 'Active';
    if (config?.board) return 'Board Generated';
    return 'In Progress';
  };

  useEffect(() => {
    // Initialize admin access for the current user
    if (user?.email) {
      InitializeAdminService.ensureAdminUser(user.email);
    }
    
    fetchClients();
    const interval = setInterval(fetchClients, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user?.email]);

  const fetchClients = async () => {
    try {
      // Fetch client intake data
      const { data: intakeData, error: intakeError } = await supabase
        .from('client_intake')
        .select(`
          id,
          email,
          group_id,
          created_at,
          fit_message,
          responses
        `);

      if (intakeError) {
        console.error('[SuperAdmin] Error fetching intake data:', intakeError);
        throw intakeError;
      }
      
      console.log('[SuperAdmin] Found intake data:', intakeData?.length || 0, 'clients');

      // Fetch client_intake_part2 data
      const { data: part2Data, error: part2Error } = await supabase
        .from('client_intake_part2')
        .select(`
          group_id,
          completed,
          roadmap_generated,
          submitted_at,
          validation_completed,
          validation_responses
        `);

      if (part2Error && part2Error.code !== 'PGRST116') {
        console.error('[SuperAdmin] Error fetching part2 data:', part2Error);
        throw part2Error;
      }
      
      console.log('[SuperAdmin] Found part2 data:', part2Data?.length || 0, 'records');

      // Fetch client config data
      const { data: configData, error: configError } = await supabase
        .from('client_config')
        .select(`
          group_id,
          board,
          roadmap
        `);

      if (configError && configError.code !== 'PGRST116') {
        console.error('[SuperAdmin] Error fetching config data:', configError);
        throw configError;
      }
      
      console.log('[SuperAdmin] Found config data:', configData?.length || 0, 'records');

      // Fetch task progress - Commented out as table doesn't exist yet
      // const { data: taskData, error: taskError } = await supabase
      //   .from('task_progress')
      //   .select(`
      //     user_id,
      //     completed
      //   `);

      // if (taskError && taskError.code !== 'PGRST116') throw taskError;
      const taskData = null; // Temporary fix until task_progress table is created

      // Process and combine data
      const formattedClients: ClientData[] = (intakeData || []).map(client => {
        // Use either group_id or id as the identifier
        const clientGroupId = client.group_id || client.id;
        const part2 = part2Data?.find(p => p.group_id === clientGroupId);
        const config = configData?.find(c => c.group_id === clientGroupId);
        const userTasks = taskData?.filter(t => t.user_id === client.id || t.user_id === clientGroupId) || [];
        const completedTasks = userTasks.filter(t => t.completed).length;
        
        // Debug logging for each client
        console.log(`[SuperAdmin] Processing client ${client.email}:`, {
          clientGroupId,
          hasResponses: !!client.responses,
          hasPart2: !!part2,
          hasConfig: !!config,
          hasValidation: !!part2?.validation_completed,
          responses: client.responses
        });

        return {
          id: clientGroupId, // Use group_id or id as the primary identifier
          email: client.email,
          status: determineStatus(client, part2, config),
          part1Complete: !!client.responses && Object.keys(client.responses).length > 0,
          part1CompletedAt: client.created_at,
          part2Complete: !!part2?.completed || !!part2?.roadmap_generated,
          part2CompletedAt: part2?.submitted_at || null,
          validationComplete: !!part2?.validation_completed,
          validationCompletedAt: part2?.validation_completed ? part2?.submitted_at : null,
          roadmapGenerated: !!part2?.roadmap_generated || !!config?.roadmap,
          boardGenerated: !!config?.board,
          lastActive: client.created_at,
          currentWeek: 0, // TODO: Add current_week column to database
          totalTasks: userTasks.length,
          completedTasks
        };
      });

      setClients(formattedClients);
      console.log('[SuperAdmin] Formatted clients:', formattedClients.length);
      
      // Log sample client data for debugging
      if (formattedClients.length > 0) {
        console.log('[SuperAdmin] Sample client:', formattedClients[0]);
      }

      // Calculate stats
      const activeUsers = formattedClients.filter(c => {
        const lastActive = new Date(c.lastActive);
        const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive < 7;
      }).length;

      setStats({
        totalUsers: formattedClients.length,
        activeUsers,
        completedAssessments: formattedClients.filter(c => c.part1Complete && c.part2Complete).length,
        generatedRoadmaps: formattedClients.filter(c => c.roadmapGenerated).length,
        averageCompletion: formattedClients.length > 0 
          ? formattedClients.reduce((acc, c) => acc + (c.totalTasks > 0 ? (c.completedTasks / c.totalTasks) * 100 : 0), 0) / formattedClients.length
          : 0
      });

    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch client data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDashboard = (client: ClientData) => {
    setSelectedClient(client);
  };

  const handleRegenerateRoadmap = async (client: ClientData) => {
    if (!confirm(`This will regenerate the roadmap for ${client.email}. All existing progress will be preserved. Continue?`)) {
      return;
    }

    setRegenerating(client.id);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://oracle-api-server-production.up.railway.app'}/api/admin/regenerate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          group_id: client.id,
          preserve_progress: true,
          admin_email: user?.email
        })
      });

      if (!response.ok) throw new Error('Failed to regenerate roadmap');

      toast.success(`Roadmap regeneration started for ${client.email}`);
      setTimeout(fetchClients, 5000); // Refresh after 5 seconds
    } catch (error) {
      console.error('Error regenerating roadmap:', error);
      toast.error('Failed to regenerate roadmap');
    } finally {
      setRegenerating(null);
    }
  };

  const handleRegenerateBoard = async (client: ClientData) => {
    if (!confirm(`This will regenerate the board recommendation for ${client.email}. Continue?`)) {
      return;
    }

    setRegenerating(client.id);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://oracle-api-server-production.up.railway.app'}/api/admin/regenerate-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          group_id: client.id,
          admin_email: user?.email
        })
      });

      if (!response.ok) throw new Error('Failed to regenerate board');

      toast.success(`Board regeneration started for ${client.email}`);
      setTimeout(fetchClients, 5000);
    } catch (error) {
      console.error('Error regenerating board:', error);
      toast.error('Failed to regenerate board');
    } finally {
      setRegenerating(null);
    }
  };

  const handleResetClient = async (client: ClientData) => {
    if (!confirm(`WARNING: This will completely reset all data for ${client.email}. This action cannot be undone. Are you absolutely sure?`)) {
      return;
    }

    if (!confirm(`Please confirm again: Reset ALL data for ${client.email}?`)) {
      return;
    }

    try {
      // Delete from client_intake_part2 (use group_id)
      const { error: part2Error } = await supabase
        .from('client_intake_part2')
        .delete()
        .eq('group_id', client.id);
      
      if (part2Error && part2Error.code !== 'PGRST116') {
        console.error('Error deleting from client_intake_part2:', part2Error);
      }

      // Delete from client_config (use group_id)
      const { error: configError } = await supabase
        .from('client_config')
        .delete()
        .eq('group_id', client.id);
      
      if (configError && configError.code !== 'PGRST116') {
        console.error('Error deleting from client_config:', configError);
      }

      // Delete from weekly_reflections (use group_id)
      const { error: reflectionsError } = await supabase
        .from('weekly_reflections')
        .delete()
        .eq('group_id', client.id);
      
      if (reflectionsError && reflectionsError.code !== 'PGRST116') {
        console.error('Error deleting from weekly_reflections:', reflectionsError);
      }

      // Reset responses in client_intake
      const { error: intakeError } = await supabase
        .from('client_intake')
        .update({
          responses: null,
          fit_message: null
        })
        .eq('group_id', client.id);

      if (intakeError) {
        console.error('Error resetting client_intake:', intakeError);
        throw intakeError;
      }

      toast.success(`Client data reset for ${client.email}`);
      fetchClients();
    } catch (error) {
      console.error('Error resetting client:', error);
      toast.error('Failed to reset client data');
    }
  };

  const handleEditSprint = async (client: ClientData) => {
    // This would open a modal or navigate to a sprint editor
    toast.info('Sprint editor coming soon');
  };

  const filteredClients = clients.filter(client => 
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (selectedClient) {
    return (
      <AdminClientView
        clientEmail={selectedClient.email}
        groupId={selectedClient.id} // This is now the group_id from the database
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return (
    <RoleGuard requiredRoles={['super_admin']} fallbackPath="/dashboard">
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-950 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveView('clients')}
                  variant={activeView === 'clients' ? 'default' : 'outline'}
                  className={activeView === 'clients' ? '' : 'text-gray-400 hover:text-white'}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Clients
                </Button>
                <Button
                  onClick={() => setActiveView('knowledge')}
                  variant={activeView === 'knowledge' ? 'default' : 'outline'}
                  className={activeView === 'knowledge' ? '' : 'text-gray-400 hover:text-white'}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Knowledge Base
                </Button>
                {activeView === 'clients' && (
                  <Button
                    onClick={fetchClients}
                    variant="outline"
                    className="text-gray-400 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeView === 'knowledge' ? (
          <KnowledgeBasePage />
        ) : (
          <>
            {/* Stats Overview */}
            <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-gray-950 border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-gray-300 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gray-950 border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-gray-300 text-sm">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gray-950 border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-gray-300 text-sm">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedAssessments}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gray-950 border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-gray-300 text-sm">Roadmaps</p>
                  <p className="text-2xl font-bold">{stats.generatedRoadmaps}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gray-950 border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-gray-300 text-sm">Avg Progress</p>
                  <p className="text-2xl font-bold">{stats.averageCompletion.toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by email or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-950 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Clients Table */}
          <Card className="bg-gray-950 border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Progress</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Week</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Last Active</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-white">{client.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          client.status === 'Active' ? 'default' :
                          client.status === 'Not Started' ? 'secondary' :
                          client.status === 'In Progress' ? 'outline' :
                          client.status === 'Part 1 Complete' ? 'outline' :
                          client.status === 'Part 2 Complete' ? 'outline' :
                          'default'
                        } className="text-xs">
                          {client.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={client.part1Complete ? 'text-green-400' : 'text-gray-400'}>P1</span>
                          <span className={client.part2Complete ? 'text-green-400' : 'text-gray-400'}>P2</span>
                          <span className={client.validationComplete ? 'text-green-400' : 'text-gray-400'}>VQ</span>
                          <span className={client.roadmapGenerated ? 'text-green-400' : 'text-gray-400'}>RM</span>
                          <span className={client.boardGenerated ? 'text-green-400' : 'text-gray-400'}>BD</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">
                        {client.currentWeek > 0 && `Week ${client.currentWeek}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {new Date(client.lastActive).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDashboard(client)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {client.part2Complete && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRegenerateRoadmap(client)}
                                disabled={regenerating === client.id}
                                className="text-purple-400 hover:text-purple-300"
                              >
                                {regenerating === client.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Brain className="w-4 h-4" />
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRegenerateBoard(client)}
                                disabled={regenerating === client.id}
                                className="text-green-400 hover:text-green-300"
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditSprint(client)}
                                className="text-orange-400 hover:text-orange-300"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetClient(client)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
};

export default SuperAdminDashboard;
