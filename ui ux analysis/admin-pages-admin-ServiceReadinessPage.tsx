import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useServiceReadiness } from '../../hooks/useServiceReadiness';
import { useTrainingPlanMutations } from '../../hooks/useTrainingPlans';
import { useSkills } from '../../hooks/useSkills';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { AdminLayout } from '../../components/AdminLayout';
import { PageSkeleton, StatCard } from '../../components/ui';
import { CheckCircle, BarChart3, Users, AlertTriangle } from 'lucide-react';
import type { SkillReadiness } from '../../lib/service-calculations';
import type { ServiceLine } from '../../lib/advisory-services';

export function ServiceReadinessPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { data: readiness, isLoading } = useServiceReadiness(currentMember?.practice_id ?? null);
  const { createPlan } = useTrainingPlanMutations();
  const { data: allSkills = [] } = useSkills();
  const { data: teamMembers = [] } = useTeamMembers(currentMember?.practice_id ?? null);
  const [creatingPlan, setCreatingPlan] = useState<{ gap: SkillReadiness; service: ServiceLine } | null>(null);

  if (isLoading) {
    return (
      <AdminLayout title="Service Readiness">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  const servicesReady = readiness?.filter(r => r.canDeliverNow).length || 0;
  const servicesTotal = readiness?.length || 0;
  const averageReadiness = (readiness?.reduce((sum, r) => sum + r.readinessPercent, 0) || 0) / (servicesTotal || 1);
  const totalGaps = readiness?.reduce((sum, r) => sum + r.gaps.length, 0) || 0;
  const totalCapableMembers = new Set(readiness?.flatMap(r => r.teamMembersCapable?.map(m => m.memberId) || [])).size || 0;

  return (
    <AdminLayout
      title={`Service Launch Readiness: ${Math.round(averageReadiness)}% Average`}
      subtitle="Capability matrix for advisory services go-to-market decisions"
    >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Ready to Deliver" value={`${servicesReady} / ${servicesTotal}`} accent="teal" icon={<CheckCircle className="w-5 h-5" />} />
          <StatCard label="Avg Readiness" value={`${Math.round(averageReadiness)}%`} accent="blue" icon={<BarChart3 className="w-5 h-5" />} />
          <StatCard label="Contributors" value={totalCapableMembers} accent="blue" icon={<Users className="w-5 h-5" />} />
          <StatCard label="Skills Gaps" value={totalGaps} accent="orange" icon={<AlertTriangle className="w-5 h-5" />} />
        </div>

        <div className="card overflow-hidden mb-6">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 font-display">Service Launch Readiness Matrix</h2>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
              Green = Ready to deliver | Yellow = Close (70%+) | Orange = Needs development | Red = Significant gaps
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-full">
              <thead>
                <tr>
                  <th>
                    SERVICE
                  </th>
                  <th>READINESS</th>
                  <th>STATUS</th>
                  <th>SKILLS COVERAGE</th>
                  <th>TEAM CAPACITY</th>
                  <th>CRITICAL GAPS</th>
                </tr>
              </thead>
              <tbody>
                {readiness?.map((r) => {
                  const criticalGapsCount = r.gaps.filter(g => g.isCritical).length;
                  const statusColor = 
                    r.readinessPercent >= 80 ? 'text-green-600' :
                    r.readinessPercent >= 70 ? 'text-yellow-600' :
                    r.readinessPercent >= 50 ? 'text-orange-600' : 'text-red-600';
                  
                  return (
                    <tr key={r.service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {r.service.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {r.service.priceRange} • {r.service.deliveryTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-2xl font-bold ${statusColor}`}>
                          {Math.round(r.readinessPercent)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {r.canDeliverNow ? (
                          <div className="text-sm">
                            <div className="text-xl">✓</div>
                            <div className="text-xs text-gray-600">Ready</div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="text-xl">⊗</div>
                            <div className="text-xs text-gray-600">Significant Gaps</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {r.skillsReady}/{r.totalSkills} skills
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.criticalSkillsMet}/{r.totalCriticalSkills} critical
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg">👥</span>
                          <span className="text-sm font-medium text-gray-900">
                            {r.teamMembersCapable.length} members
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {criticalGapsCount} critical
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.gaps.length} total gaps
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {readiness?.map((r) => {
            return (
              <div key={r.service.id} className="card overflow-hidden">
                <div className="card-header flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 font-display">{r.service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 font-body">{r.service.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900 font-display">{Math.round(r.readinessPercent)}%</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                      {r.canDeliverNow ? 'Ready to Launch' : 'In Development'}
                    </div>
                    <div className="w-24 h-2 mt-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-teal transition-all duration-500"
                        style={{ width: `${r.readinessPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Contributors */}
                  {r.teamMembersCapable.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Top Contributors ({r.teamMembersCapable.length} team members)
                      </h4>
                      <div className="space-y-2">
                        {r.teamMembersCapable.slice(0, 5).map((member) => (
                          <div
                            key={member.memberId}
                            className={`flex items-center justify-between rounded px-3 py-2 ${
                              member.hasHighInterest 
                                ? 'bg-green-50 border border-green-300' 
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {member.hasHighInterest && <span className="text-green-600 font-bold">⭐</span>}
                              <span className="text-sm font-medium text-gray-900">{member.memberName}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">
                                {member.skillsCovered}/{r.totalSkills} skills
                              </div>
                              {member.interestRank && (
                                <div className="text-xs text-gray-500">
                                  Rank #{member.interestRank} • {member.desiredInvolvement}% involvement • Exp Lvl {member.experienceLevel}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Development Needs */}
                  {r.gaps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Development Needs ({r.gaps.length})
                      </h4>
                      <div className="space-y-2">
                        {r.gaps.slice(0, 5).map((gap) => (
                          <div
                            key={gap.skillName}
                            className={`rounded border px-3 py-2 ${
                              gap.isCritical
                                ? 'bg-red-50 border-red-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">
                                  {gap.isCritical && '🚨 '}
                                  {gap.skillName}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Current: {gap.membersMeetingMinimum} member(s) qualified • Gap: {gap.gap} more needed
                                  {gap.membersWithSkill.length > 0 && ` (Avg: ${gap.averageLevel.toFixed(1)})`}
                                </div>
                              </div>
                              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                Need Lvl {gap.required}+
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCreatingPlan({ gap, service: r.service });
                                }}
                                className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
                              >
                                📋 Create Plan
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {r.recommendations.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Recommendations</h4>
                    <ul className="space-y-1">
                      {r.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {creatingPlan && currentMember?.practice_id && (
          <CreatePlanFromGapModal
            gap={creatingPlan.gap}
            service={creatingPlan.service}
            practiceId={currentMember.practice_id}
            currentMemberId={currentMember.id}
            teamMembers={teamMembers}
            allSkills={allSkills}
            createPlan={createPlan}
            onClose={() => setCreatingPlan(null)}
            onSuccess={() => setCreatingPlan(null)}
          />
        )}
    </AdminLayout>
  );
}

interface CreatePlanFromGapModalProps {
  gap: SkillReadiness;
  service: ServiceLine;
  practiceId: string;
  currentMemberId: string;
  teamMembers: { id: string; name: string }[];
  allSkills: { id: string; name: string; category: string }[];
  createPlan: ReturnType<typeof useTrainingPlanMutations>['createPlan'];
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePlanFromGapModal({
  gap,
  service,
  practiceId,
  currentMemberId,
  teamMembers,
  allSkills,
  createPlan,
  onClose,
  onSuccess,
}: CreatePlanFromGapModalProps) {
  const matchedSkill = allSkills.find((s) => s.name.toLowerCase() === gap.skillName.toLowerCase());
  const candidateMembers = gap.membersWithSkill.filter((m) => m.currentLevel < gap.required);
  const memberOptions = candidateMembers.length > 0
    ? candidateMembers.map((m) => ({ id: m.memberId, name: m.memberName }))
    : teamMembers;
  const [memberId, setMemberId] = useState(memberOptions[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = `Develop ${gap.skillName} for ${service.name}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const member = memberId || memberOptions[0]?.id;
    if (!member) {
      setError('Select a team member');
      return;
    }
    setSubmitting(true);
    try {
      await createPlan.mutateAsync({
        practice_id: practiceId,
        member_id: member,
        title,
        skill_ids: matchedSkill ? [matchedSkill.id] : [],
        service_line_id: service.id,
        target_level: gap.required,
        status: 'not_started',
        current_progress: 0,
        created_by: currentMemberId,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Training Plan</h3>
        <p className="text-sm text-gray-600 mb-4">{title}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              required
            >
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
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
  );
}
