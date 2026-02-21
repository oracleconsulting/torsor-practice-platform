// ============================================================================
// TRAINING PLANS PAGE
// ============================================================================
// Create and manage skill development training plans for team members
// ============================================================================

import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { StatCard, StatusBadge } from '../../components/ui';
import { Plus, User, ChevronRight, CheckCircle, Calendar } from 'lucide-react';


interface TrainingPlan {
  id: string;
  member_id: string;
  member_name: string;
  title: string;
  skill_focus: string[];
  target_level: number;
  current_progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  start_date: string;
  target_date: string;
  modules: TrainingModule[];
}

interface TrainingModule {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'exercise' | 'assessment';
  duration_hours: number;
  completed: boolean;
  completed_date?: string;
}

export function TrainingPlansPage() {
  const { user } = useAuth();
  const { data: _currentMember } = useCurrentMember(user?.id);
  
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Silence unused warnings
  void _currentMember;
  void _loading;

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    // Sample training plans
    const samplePlans: TrainingPlan[] = [
      {
        id: '1',
        member_id: '1',
        member_name: 'James Howard',
        title: 'Advisory Skills Development',
        skill_focus: ['Client Advisory', 'Strategic Planning', 'Business Development'],
        target_level: 5,
        current_progress: 65,
        status: 'in_progress',
        start_date: '2024-10-01',
        target_date: '2025-03-31',
        modules: [
          { id: '1', title: 'Client Discovery Techniques', type: 'video', duration_hours: 2, completed: true, completed_date: '2024-10-15' },
          { id: '2', title: 'Value Proposition Building', type: 'reading', duration_hours: 3, completed: true, completed_date: '2024-11-01' },
          { id: '3', title: 'Strategic Planning Frameworks', type: 'video', duration_hours: 4, completed: true, completed_date: '2024-11-20' },
          { id: '4', title: 'Mock Advisory Sessions', type: 'exercise', duration_hours: 6, completed: false },
          { id: '5', title: 'Final Assessment', type: 'assessment', duration_hours: 2, completed: false },
        ]
      },
      {
        id: '2',
        member_id: '2',
        member_name: 'Wes Thompson',
        title: 'Cloud Accounting Mastery',
        skill_focus: ['Xero', 'QuickBooks', 'Dext', 'Automation'],
        target_level: 5,
        current_progress: 40,
        status: 'in_progress',
        start_date: '2024-11-01',
        target_date: '2025-02-28',
        modules: [
          { id: '1', title: 'Advanced Xero Features', type: 'video', duration_hours: 3, completed: true },
          { id: '2', title: 'QuickBooks Migration', type: 'reading', duration_hours: 2, completed: true },
          { id: '3', title: 'Dext Automation Setup', type: 'exercise', duration_hours: 4, completed: false },
          { id: '4', title: 'Integration Best Practices', type: 'video', duration_hours: 3, completed: false },
        ]
      },
      {
        id: '3',
        member_id: '3',
        member_name: 'Laura Smith',
        title: 'Leadership Development',
        skill_focus: ['Team Management', 'Mentoring', 'Conflict Resolution'],
        target_level: 4,
        current_progress: 100,
        status: 'completed',
        start_date: '2024-06-01',
        target_date: '2024-11-30',
        modules: [
          { id: '1', title: 'Leadership Fundamentals', type: 'video', duration_hours: 4, completed: true },
          { id: '2', title: 'Effective Feedback', type: 'exercise', duration_hours: 3, completed: true },
          { id: '3', title: 'Team Dynamics', type: 'reading', duration_hours: 2, completed: true },
          { id: '4', title: 'Leadership Assessment', type: 'assessment', duration_hours: 1, completed: true },
        ]
      },
    ];

    setPlans(samplePlans);
    setLoading(false);
  };

  const filteredPlans = filterStatus === 'all' 
    ? plans 
    : plans.filter(p => p.status === filterStatus);

  return (
    <AdminLayout
      title="Training Plans"
      subtitle="Develop team skills with structured learning"
      headerActions={
        <button type="button" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Plans" value={plans.length} accent="blue" />
          <StatCard label="In Progress" value={plans.filter(p => p.status === 'in_progress').length} accent="blue" />
          <StatCard label="Completed" value={plans.filter(p => p.status === 'completed').length} accent="teal" />
          <StatCard label="Avg Progress" value={plans.length ? `${Math.round(plans.reduce((sum, p) => sum + p.current_progress, 0) / plans.length)}%` : '0%'} accent="orange" />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          {['all', 'in_progress', 'completed', 'not_started', 'paused'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Plans List */}
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const completedModules = plan.modules.filter(m => m.completed).length;
            
            return (
              <div 
                key={plan.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
              >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 font-display">{plan.title}</h3>
                      <p className="text-sm text-gray-500">{plan.member_name}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {plan.skill_focus.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        Due {new Date(plan.target_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {completedModules}/{plan.modules.length} modules
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                          <circle 
                            cx="32" cy="32" r="28" 
                            stroke={plan.status === 'completed' ? '#10b981' : '#3b82f6'}
                            strokeWidth="4" 
                            fill="none"
                            strokeDasharray={`${plan.current_progress * 1.76} 176`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{plan.current_progress}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <StatusBadge status={plan.status} />
                    
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedPlan?.id === plan.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                </div>
                
                {/* Expanded Modules */}
                {selectedPlan?.id === plan.id && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-4">Modules</h4>
                    <div className="space-y-3">
                      {plan.modules.map((module, idx) => (
                        <div key={module.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            module.completed ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {module.completed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{module.title}</div>
                            <div className="text-sm text-gray-500">
                              {module.type} • {module.duration_hours} hours
                            </div>
                          </div>
                          {module.completed_date && (
                            <div className="text-sm text-gray-500">
                              Completed {new Date(module.completed_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

export default TrainingPlansPage;

