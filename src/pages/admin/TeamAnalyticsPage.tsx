import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useTeamAnalytics } from '../../hooks/useTeamAnalytics';
import { Navigation } from '../../components/Navigation';
import { Brain, TrendingUp, AlertTriangle, Award, Users, Target } from 'lucide-react';

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics' | 'clients' | 'assessments' | 'delivery' | 'config' | 'cpd' | 'training' | 'knowledge';

interface TeamAnalyticsPageProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

export function TeamAnalyticsPage({ onNavigate, currentPage }: TeamAnalyticsPageProps) {
  const { user, signOut } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { data: analytics, isLoading } = useTeamAnalytics(currentMember?.practice_id ?? null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating team analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate aggregate statistics
  const highRetentionRisk = analytics?.filter(a => a.retentionRisk?.riskLevel === 'high').length || 0;
  const highBurnoutRisk = analytics?.filter(a => a.burnoutRisk?.riskLevel === 'high').length || 0;
  const promotionReady = analytics?.filter(a => a.promotionReadiness?.successProbability === 'high').length || 0;
  const roleAlignmentIssues = analytics?.filter(a => 
    a.belbinMotivation?.alignmentScore && a.belbinMotivation.alignmentScore < 60
  ).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Analytics & Insights</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Advanced predictive analytics and cross-assessment correlations
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <Navigation currentPage={currentPage} onNavigate={onNavigate} />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">High Retention Risk</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{highRetentionRisk}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Brain className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Burnout Risk</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{highBurnoutRisk}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Promotion Ready</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{promotionReady}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Role Misalignment</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{roleAlignmentIssues}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Team Member Cards */}
        <div className="space-y-6">
          {analytics?.map((memberAnalytics) => (
            <div
              key={memberAnalytics.member.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              {/* Member Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {memberAnalytics.member.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {memberAnalytics.member.role} • {memberAnalytics.member.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  {memberAnalytics.retentionRisk?.riskLevel === 'high' && (
                    <span className="px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                      🚨 Retention Risk
                    </span>
                  )}
                  {memberAnalytics.burnoutRisk?.riskLevel === 'high' && (
                    <span className="px-3 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                      ⚠️ Burnout Risk
                    </span>
                  )}
                  {memberAnalytics.promotionReadiness?.successProbability === 'high' && (
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      ✅ Promotion Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Correlation */}
                {memberAnalytics.personalityPerformance && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Performance Prediction
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Predicted Performance:</span>
                        <span className={`font-medium ${
                          memberAnalytics.personalityPerformance.performancePrediction === 'high' ? 'text-green-600' :
                          memberAnalytics.personalityPerformance.performancePrediction === 'medium' ? 'text-yellow-600' :
                          'text-orange-600'
                        }`}>
                          {memberAnalytics.personalityPerformance.performancePrediction.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Avg Skill Level:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {memberAnalytics.personalityPerformance.averageSkillLevel.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Skill Acquisition Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {(memberAnalytics.personalityPerformance.skillAcquisitionRate * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Learning Effectiveness */}
                {memberAnalytics.learningEffectiveness && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Learning Optimization
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Learning Style:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {memberAnalytics.learningEffectiveness.learningStyle}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Optimal Methods:</span>
                        <div className="flex flex-wrap gap-1">
                          {memberAnalytics.learningEffectiveness.optimalTrainingMethods.slice(0, 3).map((method, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* EQ & Conflict Synergy */}
                {memberAnalytics.eqConflictSynergy && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Dynamics
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Conflict Style:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {memberAnalytics.eqConflictSynergy.conflictStyle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Mediation Potential:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {memberAnalytics.eqConflictSynergy.mediationPotential}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Ideal Roles:</span>
                        <div className="flex flex-wrap gap-1">
                          {memberAnalytics.eqConflictSynergy.idealTeamRoles.slice(0, 2).map((role, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Belbin-Motivation Alignment */}
                {memberAnalytics.belbinMotivation && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Role-Motivation Fit
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Belbin Role:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {memberAnalytics.belbinMotivation.primaryBelbinRole}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Primary Motivator:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {memberAnalytics.belbinMotivation.primaryMotivator}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Alignment Score:</span>
                        <span className={`font-medium ${
                          memberAnalytics.belbinMotivation.alignmentScore >= 70 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {memberAnalytics.belbinMotivation.alignmentScore}%
                        </span>
                      </div>
                      {memberAnalytics.belbinMotivation.flaggedMisalignment && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-300">
                          ⚠️ {memberAnalytics.belbinMotivation.flaggedMisalignment}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Predictive Analytics Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Predictive Insights</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Retention Risk */}
                  {memberAnalytics.retentionRisk && (
                    <div className={`border rounded-lg p-4 ${
                      memberAnalytics.retentionRisk.riskLevel === 'high' ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' :
                      memberAnalytics.retentionRisk.riskLevel === 'medium' ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10' :
                      'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                    }`}>
                      <div className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                        Retention Risk: {memberAnalytics.retentionRisk.riskLevel.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {memberAnalytics.retentionRisk.recommendations.slice(0, 2).map((rec, idx) => (
                          <div key={idx}>• {rec}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Burnout Risk */}
                  {memberAnalytics.burnoutRisk && (
                    <div className={`border rounded-lg p-4 ${
                      memberAnalytics.burnoutRisk.riskLevel === 'high' ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' :
                      memberAnalytics.burnoutRisk.riskLevel === 'medium' ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10' :
                      'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                    }`}>
                      <div className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                        Burnout Risk: {memberAnalytics.burnoutRisk.riskLevel.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {memberAnalytics.burnoutRisk.interventions.slice(0, 2).map((int, idx) => (
                          <div key={idx}>• {int}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Promotion Readiness */}
                  {memberAnalytics.promotionReadiness && (
                    <div className={`border rounded-lg p-4 ${
                      memberAnalytics.promotionReadiness.successProbability === 'high' ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10' :
                      memberAnalytics.promotionReadiness.successProbability === 'medium' ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10' :
                      'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <div className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                        Promotion to {memberAnalytics.promotionReadiness.targetRole}: {memberAnalytics.promotionReadiness.timeToReady}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div>Readiness: {Math.round(memberAnalytics.promotionReadiness.readinessScore)}%</div>
                        {memberAnalytics.promotionReadiness.gaps.length > 0 && (
                          <div className="mt-1">
                            Gap: {memberAnalytics.promotionReadiness.gaps[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

