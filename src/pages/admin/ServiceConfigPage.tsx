// ============================================================================
import type { Page } from '../../types/navigation';
// SERVICE CONFIGURATION PAGE
// ============================================================================
// Define workflow phases with activities, match to skills, find best fit people
// ============================================================================

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/Navigation';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, Plus, ChevronRight, ChevronDown,
  Target, TrendingUp, Settings, LineChart, Briefcase,
  BarChart3, Shield, Trash2, Users, Check, X
} from 'lucide-react';


interface ServiceConfigPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface WorkflowPhase {
  id: string;
  phase_code: string;
  phase_name: string;
  description: string;
  typical_duration: string;
  display_order: number;
  color: string;
  activities?: Activity[];
}

interface Activity {
  id: string;
  activity_name: string;
  description: string;
  display_order: number;
  estimated_hours: number;
  matched_skills?: MatchedSkill[];
}

interface MatchedSkill {
  skill_id: string;
  skill_name: string;
  importance: string;
  minimum_level: number;
}

interface PhaseFit {
  member_id: string;
  member_name: string;
  role: string;
  fit_score: number;
  skill_matches: { skill: string; level: number; meets: boolean }[];
}

const SERVICE_LINES = [
  { code: '365_method', name: '365 Alignment', icon: Target, color: 'indigo' },
  { code: 'management_accounts', name: 'Management Accounts', icon: LineChart, color: 'emerald' },
  { code: 'fractional_cfo', name: 'Fractional CFO', icon: TrendingUp, color: 'blue' },
  { code: 'fractional_coo', name: 'Fractional COO', icon: Briefcase, color: 'violet' },
  { code: 'systems_audit', name: 'Systems Audit', icon: Settings, color: 'amber' },
  { code: 'business_advisory', name: 'Business Advisory', icon: Shield, color: 'rose' },
  { code: 'benchmarking', name: 'Benchmarking', icon: BarChart3, color: 'teal' },
];

export function ServiceConfigPage({ currentPage, onNavigate }: ServiceConfigPageProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phases, setPhases] = useState<WorkflowPhase[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [phaseFits, setPhaseFits] = useState<Record<string, PhaseFit[]>>({});
  
  // Activity editing
  const [newActivity, setNewActivity] = useState('');
  const [addingToPhase, setAddingToPhase] = useState<string | null>(null);

  useEffect(() => {
    if (selectedService && currentMember?.practice_id) {
      loadPhasesWithActivities();
    }
  }, [selectedService, currentMember?.practice_id]);

  const loadPhasesWithActivities = async () => {
    if (!selectedService) return;
    setLoading(true);
    
    try {
      // Get phases
      const { data: phasesData } = await supabase
        .from('service_workflow_phases')
        .select('*')
        .or(`practice_id.is.null,practice_id.eq.${currentMember?.practice_id}`)
        .eq('service_line_code', selectedService)
        .order('display_order');

      // Get activities for these phases
      const phaseIds = (phasesData || []).map(p => p.id);
      const { data: activitiesData } = await supabase
        .from('phase_activities')
        .select('*')
        .in('phase_id', phaseIds)
        .order('display_order');

      // Get skill mappings for activities
      const activityIds = (activitiesData || []).map(a => a.id);
      const { data: mappingsData } = await supabase
        .from('activity_skill_mappings')
        .select('*')
        .in('activity_id', activityIds);

      // Combine into structured data
      const enrichedPhases = (phasesData || []).map(phase => ({
        ...phase,
        activities: (activitiesData || [])
          .filter(a => a.phase_id === phase.id)
          .map(activity => ({
            ...activity,
            matched_skills: (mappingsData || []).filter(m => m.activity_id === activity.id)
          }))
      }));

      setPhases(enrichedPhases);
      
      // Calculate phase fits if we have activities
      if (enrichedPhases.length > 0) {
        await calculatePhaseFits(enrichedPhases);
      }
    } catch (err) {
      console.error('Error loading phases:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePhaseFits = async (phasesWithActivities: WorkflowPhase[]) => {
    if (!currentMember?.practice_id) return;

    try {
      // Get team members
      const { data: members } = await supabase
        .from('practice_members')
        .select('id, name, role')
        .eq('practice_id', currentMember.practice_id)
        .eq('member_type', 'team');

      // Get all skills
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name');

      // Get all assessments
      const memberIds = (members || []).map(m => m.id);
      const { data: assessments } = await supabase
        .from('skill_assessments')
        .select('member_id, skill_id, current_level')
        .in('member_id', memberIds);

      const skillNameToId = new Map((skills || []).map(s => [s.name.toLowerCase(), s.id]));
      const fits: Record<string, PhaseFit[]> = {};

      for (const phase of phasesWithActivities) {
        // Collect all required skills for this phase
        const phaseSkills: { name: string; minLevel: number }[] = [];
        for (const activity of phase.activities || []) {
          for (const skill of activity.matched_skills || []) {
            if (!phaseSkills.find(s => s.name === skill.skill_name)) {
              phaseSkills.push({ name: skill.skill_name, minLevel: skill.minimum_level });
            }
          }
        }

        // Calculate fit for each member
        const memberFits: PhaseFit[] = (members || []).map(member => {
          const memberAssessments = (assessments || []).filter(a => a.member_id === member.id);
          
          let totalScore = 0;
          let maxScore = 0;
          const skillMatches: { skill: string; level: number; meets: boolean }[] = [];

          for (const reqSkill of phaseSkills) {
            const skillId = skillNameToId.get(reqSkill.name.toLowerCase());
            const assessment = memberAssessments.find(a => a.skill_id === skillId);
            const level = assessment?.current_level || 0;
            const meets = level >= reqSkill.minLevel;
            
            skillMatches.push({ skill: reqSkill.name, level, meets });
            totalScore += meets ? level : 0;
            maxScore += 5; // Max level is 5
          }

          return {
            member_id: member.id,
            member_name: member.name,
            role: member.role,
            fit_score: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
            skill_matches: skillMatches
          };
        }).sort((a, b) => b.fit_score - a.fit_score);

        fits[phase.id] = memberFits;
      }

      setPhaseFits(fits);
    } catch (err) {
      console.error('Error calculating fits:', err);
    }
  };

  const addActivity = async (phaseId: string) => {
    if (!newActivity.trim()) return;

    try {
      const phase = phases.find(p => p.id === phaseId);
      const order = (phase?.activities?.length || 0) + 1;

      await supabase
        .from('phase_activities')
        .insert({
          phase_id: phaseId,
          activity_name: newActivity.trim(),
          display_order: order
        });

      setNewActivity('');
      setAddingToPhase(null);
      loadPhasesWithActivities();
    } catch (err) {
      console.error('Error adding activity:', err);
    }
  };

  const deleteActivity = async (activityId: string) => {
    try {
      await supabase
        .from('phase_activities')
        .delete()
        .eq('id', activityId);
      
      loadPhasesWithActivities();
    } catch (err) {
      console.error('Error deleting activity:', err);
    }
  };

  const serviceInfo = SERVICE_LINES.find(s => s.code === selectedService);

  // Service selection view
  if (!selectedService) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage={currentPage} onNavigate={onNavigate} />
        
        <main className="ml-64 p-8">
          <button
            onClick={() => onNavigate('delivery')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Delivery Teams</span>
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Service Configuration</h1>
            <p className="text-gray-600 mt-1">
              Define workflow phases, activities, and find best-fit team members
            </p>
          </div>

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
                      <p className="text-sm text-gray-500 mt-1">Configure workflow</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  const Icon = serviceInfo?.icon || Target;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={onNavigate} />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setSelectedService(null)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-${serviceInfo?.color}-100`}>
              <Icon className={`w-6 h-6 text-${serviceInfo?.color}-600`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{serviceInfo?.name}</h1>
              <p className="text-sm text-gray-500">Workflow Configuration</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase) => {
              const isExpanded = expandedPhase === phase.id;
              const fits = phaseFits[phase.id] || [];
              const topFits = fits.slice(0, 5);
              
              return (
                <div key={phase.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Phase Header */}
                  <button
                    onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-${phase.color}-100 flex items-center justify-center`}>
                        <span className={`font-bold text-${phase.color}-600`}>{phase.display_order}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{phase.phase_name}</h3>
                        <p className="text-sm text-gray-500">{phase.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">{phase.typical_duration}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {phase.activities?.length || 0} activities
                      </span>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <div className="grid grid-cols-2 divide-x divide-gray-100">
                        {/* Activities Column */}
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">Activities in this phase</h4>
                            <button
                              onClick={() => setAddingToPhase(phase.id)}
                              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          </div>

                          <div className="space-y-2">
                            {phase.activities?.map((activity, idx) => (
                              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900">{activity.activity_name}</p>
                                  {activity.description && (
                                    <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
                                  )}
                                  {/* Matched Skills */}
                                  {activity.matched_skills && activity.matched_skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {activity.matched_skills.map((skill) => (
                                        <span key={skill.skill_name} className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                                          {skill.skill_name} L{skill.minimum_level}+
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteActivity(activity.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            {/* Add Activity Input */}
                            {addingToPhase === phase.id && (
                              <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                                <input
                                  type="text"
                                  value={newActivity}
                                  onChange={(e) => setNewActivity(e.target.value)}
                                  placeholder="New activity name..."
                                  className="flex-1 px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                  onKeyDown={(e) => e.key === 'Enter' && addActivity(phase.id)}
                                  autoFocus
                                />
                                <button
                                  onClick={() => addActivity(phase.id)}
                                  className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setAddingToPhase(null); setNewActivity(''); }}
                                  className="p-1.5 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {(!phase.activities || phase.activities.length === 0) && addingToPhase !== phase.id && (
                              <p className="text-sm text-gray-400 italic py-4 text-center">
                                No activities defined yet
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Team Fit Column */}
                        <div className="p-6 bg-gray-50/50">
                          <div className="flex items-center gap-2 mb-4">
                            <Users className="w-4 h-4 text-gray-500" />
                            <h4 className="font-medium text-gray-900">Best fit for this phase</h4>
                          </div>

                          {topFits.length === 0 || !phase.activities?.some(a => a.matched_skills?.length) ? (
                            <p className="text-sm text-gray-400 italic py-4 text-center">
                              Add activities with skills to see team fit
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {topFits.map((fit, idx) => (
                                <div key={fit.member_id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                    idx === 0 ? 'bg-amber-100 text-amber-600' :
                                    idx === 1 ? 'bg-gray-200 text-gray-600' :
                                    idx === 2 ? 'bg-orange-100 text-orange-600' :
                                    'bg-gray-100 text-gray-500'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{fit.member_name}</p>
                                    <p className="text-xs text-gray-500">{fit.role}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-lg font-bold ${
                                      fit.fit_score >= 80 ? 'text-emerald-600' :
                                      fit.fit_score >= 50 ? 'text-amber-600' :
                                      'text-red-600'
                                    }`}>
                                      {fit.fit_score}%
                                    </span>
                                    <p className="text-xs text-gray-400">fit score</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ServiceConfigPage;
