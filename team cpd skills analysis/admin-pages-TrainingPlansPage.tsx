// ============================================================================
// TRAINING PLANS PAGE
// ============================================================================
// Create and manage skill development training plans for team members
// ============================================================================

import { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { StatCard, StatusBadge } from '../../components/ui';
import { Plus, User, ChevronRight, CheckCircle, Calendar } from 'lucide-react';
import { type TrainingPlan, type TrainingModule, SKILL_CATEGORIES } from '../../lib/types';
import { useTrainingPlans, useTrainingPlanMutations } from '../../hooks/useTrainingPlans';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { useSkills } from '../../hooks/useSkills';
import { ADVISORY_SERVICES } from '../../lib/advisory-services';

const MODULE_TYPES: { id: TrainingModule['module_type']; name: string }[] = [
  { id: 'video', name: 'Video' },
  { id: 'reading', name: 'Reading' },
  { id: 'exercise', name: 'Exercise' },
  { id: 'assessment', name: 'Assessment' },
  { id: 'workshop', name: 'Workshop' },
  { id: 'on_the_job', name: 'On the Job' },
  { id: 'shadowing', name: 'Shadowing' },
  { id: 'mentoring', name: 'Mentoring' },
  { id: 'client_delivery', name: 'Client Delivery' },
];

export function TrainingPlansPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);

  const practiceId = currentMember?.practice_id ?? null;
  const { data: plans = [], isLoading } = useTrainingPlans(practiceId, undefined);
  const { data: teamMembers = [] } = useTeamMembers(practiceId);
  const { data: skills = [] } = useSkills();
  const { createPlan, addModule, completeModule } = useTrainingPlanMutations();

  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addingModuleForPlanId, setAddingModuleForPlanId] = useState<string | null>(null);

  const filteredPlans = filterStatus === 'all'
    ? plans
    : plans.filter((p) => p.status === filterStatus);

  const handleCompleteModule = (plan: TrainingPlan, module: TrainingModule) => {
    completeModule.mutate(
      { moduleId: module.id, trainingPlanId: plan.id },
      { onSettled: () => setSelectedPlan((prev) => (prev?.id === plan.id ? { ...plan, modules: plan.modules?.map((m) => (m.id === module.id ? { ...m, completed: true } : m)) ?? [] } : prev)) }
    );
  };

  return (
    <AdminLayout
      title="Training Plans"
      subtitle="Develop team skills with structured learning"
      headerActions={
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Plans" value={plans.length} accent="blue" />
          <StatCard label="In Progress" value={plans.filter((p) => p.status === 'in_progress').length} accent="blue" />
          <StatCard label="Completed" value={plans.filter((p) => p.status === 'completed').length} accent="teal" />
          <StatCard label="Avg Progress" value={plans.length ? `${Math.round(plans.reduce((sum, p) => sum + p.current_progress, 0) / plans.length)}%` : '0%'} accent="orange" />
        </div>

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
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-gray-500 py-8">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-gray-500 mb-4">No training plans yet. Create one to start developing your team&apos;s skills.</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map((plan) => {
              const planModules = plan.modules ?? [];
              const completedModules = planModules.filter((m) => m.completed).length;
              const planSkillNames = plan.skill_ids
                .map((id) => skills.find((s) => s.id === id)?.name)
                .filter(Boolean) as string[];
              const memberName = teamMembers.find((m) => m.id === plan.member_id)?.name ?? 'Unknown';

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
                          <p className="text-sm text-gray-500">{memberName}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {planSkillNames.map((name, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                                {name}
                              </span>
                            ))}
                            {planSkillNames.length === 0 && (
                              <span className="text-xs text-gray-400">No skills selected</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {plan.target_date && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              Due {new Date(plan.target_date).toLocaleDateString()}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 mt-1">
                            {completedModules}/{planModules.length} modules
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
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

                        <ChevronRight
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            selectedPlan?.id === plan.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {selectedPlan?.id === plan.id && (
                      <div className="mt-6 pt-6 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <h4 className="font-medium text-gray-900 mb-4">Modules</h4>
                        <div className="space-y-3">
                          {planModules.map((module, idx) => (
                            <div key={module.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                              {module.completed ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteModule(plan, module);
                                  }}
                                  className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors"
                                  title="Mark complete"
                                >
                                  {idx + 1}
                                </button>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">{module.title}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                                  {module.module_type} • {module.duration_hours} hours
                                  {module.completed && module.cpd_record_id && (
                                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                      {module.duration_hours}hrs CPD logged
                                    </span>
                                  )}
                                </div>
                              </div>
                              {module.completed_at && (
                                <div className="text-sm text-gray-500 shrink-0">
                                  Completed {new Date(module.completed_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {addingModuleForPlanId === plan.id ? (
                          <AddModuleForm
                            planId={plan.id}
                            nextSortOrder={planModules.length}
                            onCancel={() => setAddingModuleForPlanId(null)}
                            onSuccess={() => {
                              setAddingModuleForPlanId(null);
                              setSelectedPlan((prev) => (prev?.id === plan.id ? { ...prev } : prev));
                            }}
                            addModule={addModule}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddingModuleForPlanId(plan.id)}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            + Add Module
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && currentMember?.practice_id && (
        <CreatePlanModal
          practiceId={currentMember.practice_id}
          currentMemberId={currentMember.id}
          teamMembers={teamMembers}
          skills={skills}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
          createPlan={createPlan}
        />
      )}
    </AdminLayout>
  );
}

interface CreatePlanModalProps {
  practiceId: string;
  currentMemberId: string;
  teamMembers: { id: string; name: string }[];
  skills: { id: string; name: string; category: string }[];
  onClose: () => void;
  onSuccess: () => void;
  createPlan: ReturnType<typeof useTrainingPlanMutations>['createPlan'];
}

function CreatePlanModal({ practiceId, currentMemberId, teamMembers, skills, onClose, onSuccess, createPlan }: CreatePlanModalProps) {
  const [memberId, setMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [serviceLineId, setServiceLineId] = useState('');
  const [targetLevel, setTargetLevel] = useState(4);
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const member = memberId || teamMembers[0]?.id;
    if (!member) {
      setError('Select a team member');
      return;
    }
    setSubmitting(true);
    try {
      await createPlan.mutateAsync({
        practice_id: practiceId,
        member_id: member,
        title: title.trim(),
        description: description.trim() || undefined,
        skill_ids: selectedSkillIds,
        service_line_id: serviceLineId || undefined,
        target_level: targetLevel,
        status: 'not_started',
        current_progress: 0,
        start_date: startDate || undefined,
        target_date: targetDate || undefined,
        created_by: currentMemberId,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  const skillsByCategory = SKILL_CATEGORIES.map((cat) => ({
    category: cat,
    skills: skills.filter((s) => s.category === cat),
  })).filter((g) => g.skills.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Training Plan</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                required
              >
                <option value="">Select member</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="e.g. Advisory Skills Development"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target skills</label>
              <div className="border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-2">
                {skillsByCategory.map((g) => (
                  <div key={g.category}>
                    <div className="text-xs font-medium text-gray-500 mb-1">{g.category}</div>
                    <div className="flex flex-wrap gap-1">
                      {g.skills.map((s) => (
                        <label key={s.id} className="inline-flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedSkillIds.includes(s.id)}
                            onChange={() => toggleSkill(s.id)}
                            className="rounded border-gray-300"
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service line</label>
              <select
                value={serviceLineId}
                onChange={(e) => setServiceLineId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">None</option>
                {ADVISORY_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target level (1-5)</label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface AddModuleFormProps {
  planId: string;
  nextSortOrder: number;
  onCancel: () => void;
  onSuccess: () => void;
  addModule: ReturnType<typeof useTrainingPlanMutations>['addModule'];
}

function AddModuleForm({ planId, nextSortOrder, onCancel, onSuccess, addModule }: AddModuleFormProps) {
  const [title, setTitle] = useState('');
  const [moduleType, setModuleType] = useState<TrainingModule['module_type']>('video');
  const [durationHours, setDurationHours] = useState('1');
  const [resourceUrl, setResourceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await addModule.mutateAsync({
        training_plan_id: planId,
        title: title.trim(),
        module_type: moduleType,
        duration_hours: parseFloat(durationHours) || 1,
        sort_order: nextSortOrder,
        completed: false,
        resource_url: resourceUrl.trim() || undefined,
      });
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h5 className="font-medium text-gray-900 mb-3">Add Module</h5>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Module title"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          required
        />
        <select
          value={moduleType}
          onChange={(e) => setModuleType(e.target.value as TrainingModule['module_type'])}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          {MODULE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input
          type="number"
          step="0.5"
          min="0.5"
          value={durationHours}
          onChange={(e) => setDurationHours(e.target.value)}
          placeholder="Duration (hours)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
        <input
          type="url"
          value={resourceUrl}
          onChange={(e) => setResourceUrl(e.target.value)}
          placeholder="Resource URL (optional)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TrainingPlansPage;
