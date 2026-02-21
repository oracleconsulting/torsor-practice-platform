import type { Skill, PracticeMember, SkillAssessment } from '../lib/types';

interface SkillsHeatmapGridProps {
  skills: Skill[];
  members: PracticeMember[];
  assessments: SkillAssessment[];
  categoryFilter?: string | null;
  searchQuery?: string;
  levelFilter?: 'all' | 'below_target' | 'at_or_above';
}

const LEVEL_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-400',
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-blue-100 text-blue-800',
  5: 'bg-green-100 text-green-800',
};

export function SkillsHeatmapGrid({
  skills,
  members,
  assessments,
  categoryFilter = null,
  searchQuery = '',
  levelFilter = 'all',
}: SkillsHeatmapGridProps) {
  let filteredSkills = skills;
  if (categoryFilter) {
    filteredSkills = filteredSkills.filter((s) => s.category === categoryFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredSkills = filteredSkills.filter((s) => s.name.toLowerCase().includes(q));
  }

  const skillsByCategory = filteredSkills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

  const getAssessment = (memberId: string, skillId: string) =>
    assessments.find((a) => a.member_id === memberId && a.skill_id === skillId);

  return (
    <div className="space-y-8">
      {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
        <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-800 text-white px-6 py-4">
            <h3 className="text-lg font-semibold font-display">{category}</h3>
            <p className="text-sm text-gray-300 mt-1">{categorySkills.length} skills</p>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="sticky left-0 z-10 bg-gray-50 px-6 py-4 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 min-w-[220px]">
                      Team Member
                    </th>
                    {categorySkills.map((skill) => (
                      <th
                        key={skill.id}
                        className="px-4 py-4 text-left text-xs font-medium text-gray-700 border-r border-gray-200 whitespace-nowrap min-w-[180px]"
                      >
                        {skill.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member, idx) => (
                    <tr
                      key={member.id}
                      className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-6 py-4 text-sm border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {member.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 truncate block">{member.name}</span>
                            <span className="text-xs text-gray-500">{member.role}</span>
                          </div>
                        </div>
                      </td>
                      {categorySkills.map((skill) => {
                        const assessment = getAssessment(member.id, skill.id);
                        const level = assessment?.current_level ?? 0;
                        const interest = assessment?.interest_level ?? 0;
                        const colorClass = LEVEL_COLORS[level] ?? LEVEL_COLORS[0];

                        const belowTarget = level < skill.required_level;
                        const matchesLevelFilter =
                          levelFilter === 'all' ||
                          (levelFilter === 'below_target' && belowTarget) ||
                          (levelFilter === 'at_or_above' && !belowTarget);
                        const dimClass = matchesLevelFilter ? '' : 'opacity-20';

                        return (
                          <td
                            key={skill.id}
                            className="relative group px-2 py-2 text-center border-r border-gray-100 align-top"
                          >
                            <div
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold transition-all ${colorClass} ${dimClass} group-hover:ring-2 group-hover:ring-blue-200 relative`}
                            >
                              {level || '—'}
                              {interest >= 4 && (
                                <span className="absolute -top-0.5 -right-0.5 text-[10px]" aria-hidden>⭐</span>
                              )}
                              {interest === 3 && interest < 4 && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full" aria-hidden />
                              )}
                            </div>
                            {/* Tooltip */}
                            <div className="hidden group-hover:block absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none">
                              <div className="font-semibold mb-1">{skill.name}</div>
                              <div>Level: {level}/5</div>
                              <div>Interest: {interest}/5</div>
                              <div>Target: {skill.required_level}/5</div>
                              {assessment?.assessed_at && (
                                <div className="text-gray-400 mt-1">
                                  Assessed: {new Date(assessment.assessed_at).toLocaleDateString()}
                                </div>
                              )}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
