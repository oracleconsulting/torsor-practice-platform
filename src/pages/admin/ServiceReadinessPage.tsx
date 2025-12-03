import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useServiceReadiness } from '../../hooks/useServiceReadiness';
import { Navigation } from '../../components/Navigation';

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics' | 'clients' | 'assessments' | 'delivery' | 'config' | 'cpd' | 'training' | 'knowledge';

interface ServiceReadinessPageProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

export function ServiceReadinessPage({ onNavigate, currentPage }: ServiceReadinessPageProps) {
  const { user, signOut } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { data: readiness, isLoading } = useServiceReadiness(currentMember?.practice_id ?? null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service readiness...</p>
        </div>
      </div>
    );
  }

  const servicesReady = readiness?.filter(r => r.canDeliverNow).length || 0;
  const servicesTotal = readiness?.length || 0;
  const averageReadiness = (readiness?.reduce((sum, r) => sum + r.readinessPercent, 0) || 0) / (servicesTotal || 1);
  const totalGaps = readiness?.reduce((sum, r) => sum + r.gaps.length, 0) || 0;
  const totalCapableMembers = new Set(readiness?.flatMap(r => r.teamMembersCapable?.map(m => m.memberId) || [])).size || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🎯 Service Launch Readiness: {Math.round(averageReadiness)}% Average
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Capability matrix for advisory services go-to-market decisions
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
        {/* Summary Stats */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="text-lg">✓</span>
                <span>Ready to Deliver</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{servicesReady} / {servicesTotal}</div>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="text-lg">📊</span>
                <span>Avg Readiness</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{Math.round(averageReadiness)}%</div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="text-lg">👥</span>
                <span>Contributors</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalCapableMembers}</div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="text-lg">⚠</span>
                <span>Skills Gaps</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalGaps}</div>
            </div>
          </div>
        </div>

        {/* Service Launch Readiness Matrix */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Service Launch Readiness Matrix</h2>
            <p className="text-sm text-gray-600 mt-1">
              Green = Ready to deliver | Yellow = Close (70%+) | Orange = Needs development | Red = Significant gaps
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SERVICE
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    READINESS
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKILLS<br/>COVERAGE
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TEAM<br/>CAPACITY
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CRITICAL<br/>GAPS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
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
                            {r.teamMembersCapable.length}members
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

        {/* Detailed Service Breakdown */}
        <div className="mt-8 space-y-6">
          {readiness?.map((r) => {
            // const criticalGaps = r.gaps.filter(g => g.isCritical); // not used
            
            return (
              <div key={r.service.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Service Header */}
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{r.service.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{r.service.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold text-gray-900">{Math.round(r.readinessPercent)}%</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {r.canDeliverNow ? '✅ Ready to Launch' : '⚠️ In Development'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {gap.isCritical && '🚨 '}
                                  {gap.skillName}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Current: {gap.membersMeetingMinimum} member(s) qualified • Gap: {gap.gap} more needed
                                  {gap.membersWithSkill.length > 0 && ` (Avg: ${gap.averageLevel.toFixed(1)})`}
                                </div>
                              </div>
                              <span className="ml-2 text-xs font-medium text-gray-500 whitespace-nowrap">
                                Need Lvl {gap.required}+
                              </span>
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
      </main>
    </div>
  );
}
