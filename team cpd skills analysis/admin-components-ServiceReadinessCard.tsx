import type { ServiceReadiness } from '../lib/service-calculations';

interface Props {
  readiness: ServiceReadiness;
}

export function ServiceReadinessCard({ readiness }: Props) {
  const {
    service,
    readinessPercent,
    canDeliverNow,
    skillsReady,
    totalSkills,
    criticalSkillsMet,
    totalCriticalSkills,
    // skillReadiness, // not used
    teamMembersCapable,
    gaps,
    recommendations,
  } = readiness;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {service.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {service.description}
          </p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
            <span>💰 {service.priceRange}</span>
            <span>⏱️ {service.deliveryTime}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(readinessPercent)}%
          </div>
          <div className={`text-sm font-medium ${canDeliverNow ? 'text-green-600' : 'text-orange-600'}`}>
            {canDeliverNow ? '✅ Ready' : '⚠️ In Development'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            readinessPercent >= 80
              ? 'bg-green-500'
              : readinessPercent >= 50
              ? 'bg-yellow-500'
              : 'bg-orange-500'
          }`}
          style={{ width: `${readinessPercent}%` }}
        />
      </div>

      {/* Skills Summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Skills Coverage:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {skillsReady}/{totalSkills}
          </span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Critical Skills:</span>
          <span className={`ml-2 font-medium ${criticalSkillsMet === totalCriticalSkills ? 'text-green-600' : 'text-orange-600'}`}>
            {criticalSkillsMet}/{totalCriticalSkills}
          </span>
        </div>
      </div>

      {/* Team Members Capable */}
      {teamMembersCapable.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Top Contributors ({teamMembersCapable.length} team members)
          </h4>
          <div className="space-y-2">
            {teamMembersCapable.slice(0, 5).map((member) => (
              <div
                key={member.memberId}
                className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 rounded px-3 py-2"
              >
                <span className="text-gray-900 dark:text-white">{member.memberName}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {member.skillsCovered}/{totalSkills} skills
                </span>
              </div>
            ))}
            {teamMembersCapable.length > 5 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                +{teamMembersCapable.length - 5} more team member(s)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {gaps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Development Needs ({gaps.length})
          </h4>
          <div className="space-y-2">
            {gaps.slice(0, 5).map((gap) => (
              <div
                key={gap.skillName}
                className={`text-sm rounded px-3 py-2 ${
                  gap.isCritical
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {gap.isCritical && '🚨 '}
                    {gap.skillName}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Need Lvl {gap.required}+
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Current: {gap.membersMeetingMinimum} member(s) qualified • Gap: {gap.gap} more needed
                  {gap.membersWithSkill.length > 0 && (
                    <span className="ml-2">
                      (Avg: {gap.averageLevel.toFixed(1)})
                    </span>
                  )}
                </div>
              </div>
            ))}
            {gaps.length > 5 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                +{gaps.length - 5} more skill gap(s)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Recommendations
        </h4>
        <ul className="space-y-1">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
