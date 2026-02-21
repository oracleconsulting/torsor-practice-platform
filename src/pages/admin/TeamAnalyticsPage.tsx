import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useTeamAnalytics, type TeamMemberAnalytics } from '../../hooks/useTeamAnalytics';
import { AdminLayout } from '../../components/AdminLayout';
import { PageSkeleton, StatCard } from '../../components/ui';
import { Brain, TrendingUp, AlertTriangle, Award, Users, Target, ChevronDown, BarChart3, Rocket } from 'lucide-react';

type DetailTab = 'skill' | 'service' | 'insights';

export function TeamAnalyticsPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { data: analytics, isLoading } = useTeamAnalytics(currentMember?.practice_id ?? null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('skill');

  if (isLoading) {
    return (
      <AdminLayout title="Team Analytics">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  const highRetentionRisk = analytics?.filter(a => a.retentionRisk?.riskLevel === 'high').length ?? 0;
  const highBurnoutRisk = analytics?.filter(a => a.burnoutRisk?.riskLevel === 'high').length ?? 0;
  const promotionReady = analytics?.filter(a => a.promotionReadiness?.successProbability === 'high').length ?? 0;
  const roleAlignmentIssues = analytics?.filter(a =>
    a.belbinMotivation?.alignmentScore != null && a.belbinMotivation.alignmentScore < 60
  ).length ?? 0;
  const avgTeamSkillLevel = analytics?.length
    ? analytics.reduce((sum, a) => sum + (a.skillProfile?.averageLevel ?? 0), 0) / analytics.length
    : 0;
  const totalServicesDeliverable = new Set(
    analytics?.flatMap(a => a.serviceCapability?.services.filter(s => s.canDeliver).map(s => s.serviceId) ?? []) ?? []
  ).size;

  const hasPsychometric = (m: TeamMemberAnalytics) =>
    m.personalityPerformance ?? m.learningEffectiveness ?? m.eqConflictSynergy ?? m.belbinMotivation;

  return (
    <AdminLayout
      title="Team Analytics & Insights"
      subtitle="Skill profiles, service capability, and predictive analytics"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="High Retention Risk" value={highRetentionRisk} accent="red" icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard label="Burnout Risk" value={highBurnoutRisk} accent="orange" icon={<Brain className="w-5 h-5" />} />
        <StatCard label="Promotion Ready" value={promotionReady} accent="teal" icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Role Misalignment" value={roleAlignmentIssues} accent="orange" icon={<Target className="w-5 h-5" />} />
        <StatCard label="Avg Skill Level" value={avgTeamSkillLevel.toFixed(1)} accent="blue" icon={<BarChart3 className="w-5 h-5" />} />
        <StatCard label="Services Deliverable" value={`${totalServicesDeliverable}/10`} accent="teal" icon={<Rocket className="w-5 h-5" />} />
      </div>

      <div className="space-y-3">
        {analytics?.map((m) => (
          <div key={m.member.id} className="card overflow-hidden">
            {/* Collapsed card row */}
            <div
              className="card-body flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-4"
              onClick={() => setExpandedMember(expandedMember === m.member.id ? null : m.member.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                  {m.member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{m.member.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{m.member.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {m.skillProfile?.averageLevel != null ? m.skillProfile.averageLevel.toFixed(1) : '—'}
                  </div>
                  <div className="text-xs text-gray-500">Avg Level</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {m.serviceCapability?.servicesCanDeliver ?? 0}/10
                  </div>
                  <div className="text-xs text-gray-500">Services</div>
                </div>
                {m.developmentPriorities?.[0] && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      m.developmentPriorities[0].priority === 'critical'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : m.developmentPriorities[0].priority === 'high'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    Focus: {m.developmentPriorities[0].skillName}
                  </div>
                )}
                {m.retentionRisk?.riskLevel === 'high' && (
                  <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                    Retention
                  </span>
                )}
                {m.burnoutRisk?.riskLevel === 'high' && (
                  <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                    Burnout
                  </span>
                )}
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${expandedMember === m.member.id ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Expanded detail */}
            {expandedMember === m.member.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  {(['skill', 'service', 'insights'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailTab(tab);
                      }}
                      className={`px-4 py-3 text-sm font-medium capitalize ${
                        detailTab === tab
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      {tab === 'skill' && 'Skill Profile'}
                      {tab === 'service' && 'Service Fit'}
                      {tab === 'insights' && 'Insights'}
                    </button>
                  ))}
                </div>
                <div className="p-6" onClick={(e) => e.stopPropagation()}>
                  {detailTab === 'skill' && <SkillProfileTab m={m} />}
                  {detailTab === 'service' && <ServiceFitTab m={m} />}
                  {detailTab === 'insights' && <InsightsTab m={m} hasPsychometric={!!hasPsychometric(m)} />}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

function SkillProfileTab({ m }: { m: TeamMemberAnalytics }) {
  const profile = m.skillProfile;
  if (!profile) {
    return <p className="text-sm text-gray-500">No skill assessment data yet.</p>;
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500">Skills assessed</div>
          <div className="text-lg font-semibold">{profile.totalSkillsAssessed}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Strongest</div>
          <div className="text-sm font-medium">{profile.strongestCategory.name}</div>
          <div className="text-xs text-gray-500">avg {profile.strongestCategory.avgLevel.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Weakest</div>
          <div className="text-sm font-medium">{profile.weakestCategory.name}</div>
          <div className="text-xs text-gray-500">avg {profile.weakestCategory.avgLevel.toFixed(1)}</div>
        </div>
      </div>
      {profile.categoryBreakdown.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">By category</h5>
          <div className="space-y-2">
            {profile.categoryBreakdown.slice(0, 10).map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-700 dark:text-gray-300 truncate">{cat.category}</div>
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-600"
                    style={{ width: `${(cat.avgLevel / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8">{cat.avgLevel.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {profile.topSkills.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Top 5 skills</h5>
          <div className="flex flex-wrap gap-2">
            {profile.topSkills.map((s) => (
              <span
                key={s.name}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs"
              >
                {s.name} ({s.level}/5)
              </span>
            ))}
          </div>
        </div>
      )}
      {profile.developmentInterests.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Wants to develop</h5>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {profile.developmentInterests.map((d) => (
              <li key={d.name}>
                {d.name} — interest {d.interestLevel}/5, current {d.currentLevel}/5
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ServiceFitTab({ m }: { m: TeamMemberAnalytics }) {
  const cap = m.serviceCapability;
  if (!cap) {
    return <p className="text-sm text-gray-500">No service capability data yet.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Primary fit: <strong className="text-gray-900 dark:text-white">{cap.primaryServiceFit}</strong> · Can deliver {cap.servicesCanDeliver} services · Interested in {cap.servicesInterestedIn}
      </div>
      <div className="grid gap-2">
        {cap.services.map((s) => (
          <div
            key={s.serviceId}
            className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">{s.serviceName}</div>
              <div className="text-xs text-gray-500">
                {s.skillsCovered}/{s.totalRequired} skills · {s.coveragePercent.toFixed(0)}%
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {s.canDeliver && <span className="text-green-600 dark:text-green-400">✅</span>}
              {s.capabilityVsInterest === 'aligned' && (
                <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">Aligned</span>
              )}
              {s.capabilityVsInterest === 'interested_not_ready' && (
                <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">Develop</span>
              )}
              {s.capabilityVsInterest === 'capable_not_interested' && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">Capable</span>
              )}
              {s.capabilityVsInterest === 'neither' && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">—</span>
              )}
              {s.interestRank != null && (
                <span className="text-xs text-gray-500">Rank #{s.interestRank}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsTab({
  m,
  hasPsychometric
}: { m: TeamMemberAnalytics; hasPsychometric: boolean }) {
  if (!hasPsychometric) {
    return (
      <p className="text-sm text-gray-500">No psychometric assessment data available. Skill and service data are in the other tabs.</p>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {m.personalityPerformance && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Performance Prediction
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Predicted:</span>
                <span className="font-medium capitalize">{m.personalityPerformance.performancePrediction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Skill Level:</span>
                <span className="font-medium">{m.personalityPerformance.averageSkillLevel.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Skill acquisition:</span>
                <span className="font-medium">{(m.personalityPerformance.skillAcquisitionRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}
        {m.learningEffectiveness && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Learning Optimization
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Style:</span>
                <span className="font-medium capitalize">{m.learningEffectiveness.learningStyle}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {m.learningEffectiveness.optimalTrainingMethods.slice(0, 3).map((method, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                    {method}
                  </span>
                ))}
              </div>
              {m.learningEffectiveness.cpdEffectiveness != null && (
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600 dark:text-gray-400">CPD effectiveness:</span>
                  <span className="font-medium">{m.learningEffectiveness.cpdEffectiveness}%</span>
                </div>
              )}
            </div>
          </div>
        )}
        {m.eqConflictSynergy && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Dynamics
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Conflict style:</span>
                <span className="font-medium capitalize">{m.eqConflictSynergy.conflictStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mediation potential:</span>
                <span className="font-medium">{m.eqConflictSynergy.mediationPotential}%</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {m.eqConflictSynergy.idealTeamRoles.slice(0, 2).map((role, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {m.belbinMotivation && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Role-Motivation Fit
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Belbin:</span>
                <span className="font-medium">{m.belbinMotivation.primaryBelbinRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Motivator:</span>
                <span className="font-medium capitalize">{m.belbinMotivation.primaryMotivator}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Alignment:</span>
                <span className={m.belbinMotivation.alignmentScore >= 70 ? 'text-green-600' : 'text-yellow-600'}>
                  {m.belbinMotivation.alignmentScore}%
                </span>
              </div>
              {m.belbinMotivation.flaggedMisalignment && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                  ⚠️ {m.belbinMotivation.flaggedMisalignment}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Predictive Insights</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {m.retentionRisk && (
            <div
              className={`rounded-lg p-4 ${
                m.retentionRisk.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800' :
                m.retentionRisk.riskLevel === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' :
                'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
              }`}
            >
              <div className="text-sm font-medium mb-2">Retention: {m.retentionRisk.riskLevel}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {m.retentionRisk.recommendations.slice(0, 2).map((rec, idx) => (
                  <div key={idx}>• {rec}</div>
                ))}
              </div>
            </div>
          )}
          {m.burnoutRisk && (
            <div
              className={`rounded-lg p-4 ${
                m.burnoutRisk.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800' :
                m.burnoutRisk.riskLevel === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' :
                'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
              }`}
            >
              <div className="text-sm font-medium mb-2">Burnout: {m.burnoutRisk.riskLevel}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {m.burnoutRisk.interventions.slice(0, 2).map((int, idx) => (
                  <div key={idx}>• {int}</div>
                ))}
              </div>
            </div>
          )}
          {m.promotionReadiness && (
            <div
              className={`rounded-lg p-4 ${
                m.promotionReadiness.successProbability === 'high' ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' :
                m.promotionReadiness.successProbability === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' :
                'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-sm font-medium mb-2">
                → {m.promotionReadiness.targetRole}: {m.promotionReadiness.timeToReady}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Readiness {Math.round(m.promotionReadiness.readinessScore)}%
                {m.promotionReadiness.gaps[0] && ` · ${m.promotionReadiness.gaps[0]}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
