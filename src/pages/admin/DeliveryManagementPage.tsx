// ============================================================================
import type { Page } from '../../types/navigation';
// DELIVERY MANAGEMENT PAGE
// ============================================================================
// Manage service delivery teams, capacity, and client assignments
// ============================================================================

import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, Plus, ChevronRight, ChevronDown,
  Target, TrendingUp, Settings, LineChart, Briefcase,
  Users2, Clock, User, Activity, BarChart3, Shield,
  UserPlus, Trash2, Workflow, FileSearch
} from 'lucide-react';


interface DeliveryManagementPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface ServiceLine {
  code: string;
  name: string;
  icon: any;
  color: string;
}

interface DeliveryTeam {
  id: string;
  name: string;
  service_line_code: string;
  max_clients: number;
  current_client_count: number;
  status: string;
  members: TeamMember[];
}

interface TeamMember {
  id: string;
  member_id: string;
  member_name: string;
  role_name: string;
  is_team_lead: boolean;
  allocated_hours_per_week: number;
}

interface ServiceRole {
  id: string;
  code: string;
  name: string;
  is_lead: boolean;
  required_skill_level: string;
}

interface PracticeMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface WorkflowPhase {
  id: string;
  phase_code: string;
  phase_name: string;
  description: string;
  typical_duration: string;
  display_order: number;
  color: string;
}

interface PhaseFit {
  member_id: string;
  member_name: string;
  role: string;
  fit_score: number;
}

const SERVICE_LINES: ServiceLine[] = [
  { code: '365_method', name: 'Goal Alignment', icon: Target, color: 'indigo' },
  { code: 'discovery', name: 'Discovery Assessment', icon: FileSearch, color: 'slate' },
  { code: 'management_accounts', name: 'Business Intelligence', icon: LineChart, color: 'emerald' },
  { code: 'fractional_cfo', name: 'Fractional CFO', icon: TrendingUp, color: 'blue' },
  { code: 'fractional_coo', name: 'Fractional COO', icon: Briefcase, color: 'violet' },
  { code: 'systems_audit', name: 'Systems Audit', icon: Settings, color: 'amber' },
  { code: 'business_advisory', name: 'Business Advisory', icon: Shield, color: 'rose' },
  { code: 'benchmarking', name: 'Benchmarking', icon: BarChart3, color: 'teal' },
];

export function DeliveryManagementPage({ currentPage, onNavigate }: DeliveryManagementPageProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [teams, setTeams] = useState<DeliveryTeam[]>([]);
  const [roles, setRoles] = useState<ServiceRole[]>([]);
  const [practiceMembers, setPracticeMembers] = useState<PracticeMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  
  // Phase fit data
  const [phases, setPhases] = useState<WorkflowPhase[]>([]);
  const [phaseFits, setPhaseFits] = useState<Record<string, PhaseFit[]>>({});
  const [loadingPhases, setLoadingPhases] = useState(false);
  
  // Modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamMaxClients, setNewTeamMaxClients] = useState(5);

  // Load data when service is selected
  useEffect(() => {
    if (selectedService && currentMember?.practice_id) {
      loadTeams();
      loadRoles();
      loadPracticeMembers();
      loadPhasesWithFit();
    }
  }, [selectedService, currentMember?.practice_id]);

  // Load workflow phases and calculate team fit for each
  const loadPhasesWithFit = async () => {
    if (!currentMember?.practice_id || !selectedService) return;
    
    setLoadingPhases(true);
    
    try {
      // Get phases for this service
      const { data: phasesData } = await supabase
        .from('service_workflow_phases')
        .select('*')
        .or(`practice_id.is.null,practice_id.eq.${currentMember.practice_id}`)
        .eq('service_line_code', selectedService)
        .order('display_order');

      if (!phasesData || phasesData.length === 0) {
        setPhases([]);
        setPhaseFits({});
        return;
      }

      setPhases(phasesData);

      // Get activities for phases
      const phaseIds = phasesData.map(p => p.id);
      const { data: activitiesData } = await supabase
        .from('phase_activities')
        .select('*')
        .in('phase_id', phaseIds);

      // Get skill mappings for activities
      const activityIds = (activitiesData || []).map(a => a.id);
      const { data: mappingsData } = await supabase
        .from('activity_skill_mappings')
        .select('*')
        .in('activity_id', activityIds);

      // Get team members and their skill assessments
      const { data: members } = await supabase
        .from('practice_members')
        .select('id, name, role')
        .eq('practice_id', currentMember.practice_id)
        .eq('member_type', 'team');

      const { data: skills } = await supabase
        .from('skills')
        .select('id, name');

      const memberIds = (members || []).map(m => m.id);
      const { data: assessments } = await supabase
        .from('skill_assessments')
        .select('member_id, skill_id, current_level')
        .in('member_id', memberIds);

      // Build skill name to ID map
      const skillNameToId = new Map((skills || []).map(s => [s.name.toLowerCase(), s.id]));

      // Calculate fit for each phase
      const fits: Record<string, PhaseFit[]> = {};

      for (const phase of phasesData) {
        // Get activities for this phase
        const phaseActivities = (activitiesData || []).filter(a => a.phase_id === phase.id);
        
        // Collect required skills for this phase
        const phaseSkills: { name: string; minLevel: number }[] = [];
        for (const activity of phaseActivities) {
          const activityMappings = (mappingsData || []).filter(m => m.activity_id === activity.id);
          for (const mapping of activityMappings) {
            if (!phaseSkills.find(s => s.name === mapping.skill_name)) {
              phaseSkills.push({ name: mapping.skill_name, minLevel: mapping.minimum_level || 3 });
            }
          }
        }

        // Calculate fit for each member
        const memberFits: PhaseFit[] = (members || []).map(member => {
          const memberAssessments = (assessments || []).filter(a => a.member_id === member.id);
          
          let totalScore = 0;
          let maxScore = 0;

          for (const reqSkill of phaseSkills) {
            const skillId = skillNameToId.get(reqSkill.name.toLowerCase());
            const assessment = memberAssessments.find(a => a.skill_id === skillId);
            const level = assessment?.current_level || 0;
            const meets = level >= reqSkill.minLevel;
            
            totalScore += meets ? level : 0;
            maxScore += 5;
          }

          return {
            member_id: member.id,
            member_name: member.name,
            role: member.role,
            fit_score: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
          };
        }).sort((a, b) => b.fit_score - a.fit_score).slice(0, 5);

        fits[phase.id] = memberFits;
      }

      setPhaseFits(fits);
    } catch (err) {
      console.error('Error loading phases:', err);
    } finally {
      setLoadingPhases(false);
    }
  };

  const loadTeams = async () => {
    if (!currentMember?.practice_id || !selectedService) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_teams')
        .select(`
          *,
          team_member_assignments (
            id,
            member_id,
            role_name,
            is_team_lead,
            allocated_hours_per_week,
            status
          )
        `)
        .eq('practice_id', currentMember.practice_id)
        .eq('service_line_code', selectedService);

      if (error) throw error;

      // Enrich with member names
      const enrichedTeams = await Promise.all((data || []).map(async (team) => {
        const memberIds = team.team_member_assignments?.map((a: any) => a.member_id) || [];
        
        if (memberIds.length > 0) {
          const { data: members } = await supabase
            .from('practice_members')
            .select('id, name')
            .in('id', memberIds);
          
          const memberMap = new Map((members || []).map(m => [m.id, m.name]));
          
          return {
            ...team,
            members: (team.team_member_assignments || []).map((a: any) => ({
              ...a,
              member_name: memberMap.get(a.member_id) || 'Unknown'
            }))
          };
        }
        
        return { ...team, members: [] };
      }));

      setTeams(enrichedTeams);
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    if (!selectedService) return;
    
    const { data } = await supabase
      .from('service_roles')
      .select('*')
      .eq('service_line_code', selectedService)
      .order('display_order');
    
    setRoles(data || []);
  };

  const loadPracticeMembers = async () => {
    if (!currentMember?.practice_id) return;
    
    const { data } = await supabase
      .from('practice_members')
      .select('id, name, email, role')
      .eq('practice_id', currentMember.practice_id)
      .eq('member_type', 'team');
    
    setPracticeMembers(data || []);
  };

  const createTeam = async () => {
    if (!currentMember?.practice_id || !selectedService || !newTeamName) return;
    
    try {
      const { error } = await supabase
        .from('delivery_teams')
        .insert({
          practice_id: currentMember.practice_id,
          service_line_code: selectedService,
          name: newTeamName,
          max_clients: newTeamMaxClients,
          status: 'active'
        });

      if (error) throw error;
      
      setShowCreateTeam(false);
      setNewTeamName('');
      setNewTeamMaxClients(5);
      loadTeams();
    } catch (err) {
      console.error('Error creating team:', err);
    }
  };

  const addMemberToTeam = async (teamId: string, memberId: string, roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    
    try {
      const { error } = await supabase
        .from('team_member_assignments')
        .insert({
          team_id: teamId,
          member_id: memberId,
          service_role_id: roleId,
          role_name: role.name,
          is_team_lead: role.is_lead,
          allocated_hours_per_week: 8,
          status: 'active'
        });

      if (error) throw error;
      
      setShowAddMember(null);
      loadTeams();
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  const removeMemberFromTeam = async (assignmentId: string) => {
    try {
      await supabase
        .from('team_member_assignments')
        .delete()
        .eq('id', assignmentId);
      
      loadTeams();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const serviceInfo = SERVICE_LINES.find(s => s.code === selectedService);

  // Service selection view
  if (!selectedService) {
    return (
      <AdminLayout
        title="Delivery Management"
        subtitle="Create delivery teams, assign team members, and manage capacity"
        currentPage={currentPage}
        onNavigate={onNavigate}
        headerActions={
          <button
            onClick={() => onNavigate('clients')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        }
      >
        <div>

          {/* Service Line Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_LINES.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.code}
                  onClick={() => setSelectedService(service.code)}
                  className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-${service.color}-100`}>
                      <Icon className={`w-6 h-6 text-${service.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Manage teams
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Capacity Overview */}
          <div className="mt-8 grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Users2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-500">Active Teams</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{practiceMembers.length || 0}</p>
                  <p className="text-sm text-gray-500">Team Members</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                  <p className="text-sm text-gray-500">Utilization</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100">
                  <Activity className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-500">Active Engagements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Team management view
  return (
    <AdminLayout
      title={serviceInfo?.name ?? 'Delivery'}
      subtitle="Delivery Teams"
      currentPage={currentPage}
      onNavigate={onNavigate}
      headerActions={
        <>
          <button
            onClick={() => setSelectedService(null)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </>
      }
    >
      <div className="mb-8">

        {/* Roles Reference */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Available Roles</h3>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span 
                key={role.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  role.is_lead 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {role.name}
                {role.is_lead && ' ★'}
              </span>
            ))}
          </div>
        </div>

        {/* Delivery Phases - Who's Best Fit */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Delivery Phases</h3>
            </div>
            <button
              onClick={() => onNavigate('config')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Configure phases →
            </button>
          </div>

          {loadingPhases ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : phases.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No workflow phases configured. <button onClick={() => onNavigate('config')} className="text-indigo-600 hover:underline">Set up phases</button>
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {phases.map((phase) => {
                const fits = phaseFits[phase.id] || [];
                return (
                  <div key={phase.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-6 h-6 rounded-full bg-${phase.color}-100 text-${phase.color}-600 flex items-center justify-center text-sm font-bold`}>
                        {phase.display_order}
                      </span>
                      <h4 className="font-medium text-gray-900">{phase.phase_name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{phase.typical_duration}</p>
                    
                    {fits.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No skill data</p>
                    ) : (
                      <div className="space-y-1.5">
                        {fits.slice(0, 3).map((fit, idx) => (
                          <div key={fit.member_id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${
                                idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-gray-700 truncate text-xs">{fit.member_name.split(' ')[0]}</span>
                            </div>
                            <span className={`text-xs font-medium ${
                              fit.fit_score >= 70 ? 'text-emerald-600' :
                              fit.fit_score >= 40 ? 'text-amber-600' :
                              'text-gray-400'
                            }`}>
                              {fit.fit_score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Teams List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-500 mb-6">Create your first delivery team for {serviceInfo?.name}</p>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Create Team
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => {
              const isExpanded = expandedTeam === team.id;
              const utilization = team.max_clients > 0 
                ? Math.round((team.current_client_count / team.max_clients) * 100) 
                : 0;
              
              return (
                <div key={team.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Team Header */}
                  <button
                    onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Users2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-500">
                          {team.members?.length || 0} members • {team.current_client_count}/{team.max_clients} clients
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Capacity bar */}
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Capacity</span>
                          <span className={`font-medium ${
                            utilization >= 90 ? 'text-red-600' :
                            utilization >= 70 ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>{utilization}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              utilization >= 90 ? 'bg-red-500' :
                              utilization >= 70 ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        team.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        team.status === 'at_capacity' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {team.status}
                      </span>
                      
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>
                  
                  {/* Team Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-6 py-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Team Members</h4>
                        <button
                          onClick={() => setShowAddMember(team.id)}
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add Member
                        </button>
                      </div>
                      
                      {team.members?.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4 text-center">
                          No team members assigned yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {team.members?.map((member) => (
                            <div 
                              key={member.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {member.member_name}
                                    {member.is_team_lead && (
                                      <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                        Lead
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-500">{member.role_name}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">
                                  {member.allocated_hours_per_week}h/week
                                </span>
                                <button
                                  onClick={() => removeMemberFromTeam(member.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Create Delivery Team</h2>
                <p className="text-sm text-gray-500">For {serviceInfo?.name}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder={`${serviceInfo?.name} Team A`}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Clients
                  </label>
                  <input
                    type="number"
                    value={newTeamMaxClients}
                    onChange={(e) => setNewTeamMaxClients(parseInt(e.target.value) || 1)}
                    min={1}
                    max={50}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of clients this team can handle
                  </p>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={createTeam}
                  disabled={!newTeamName}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  Create Team
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && (
          <AddMemberModal
            teamId={showAddMember}
            roles={roles}
            practiceMembers={practiceMembers}
            existingMembers={teams.find(t => t.id === showAddMember)?.members?.map(m => m.member_id) || []}
            onAdd={addMemberToTeam}
            onClose={() => setShowAddMember(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Add Member Modal Component
function AddMemberModal({
  teamId,
  roles,
  practiceMembers,
  existingMembers,
  onAdd,
  onClose
}: {
  teamId: string;
  roles: ServiceRole[];
  practiceMembers: PracticeMember[];
  existingMembers: string[];
  onAdd: (teamId: string, memberId: string, roleId: string) => void;
  onClose: () => void;
}) {
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  const availableMembers = practiceMembers.filter(m => !existingMembers.includes(m.id));
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add Team Member</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Member
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a team member...</option>
              {availableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} {role.is_lead && '(Lead)'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedMember && selectedRole) {
                onAdd(teamId, selectedMember, selectedRole);
              }
            }}
            disabled={!selectedMember || !selectedRole}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            Add to Team
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryManagementPage;

