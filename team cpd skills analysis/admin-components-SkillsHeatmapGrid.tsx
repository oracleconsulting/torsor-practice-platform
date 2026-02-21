import type { Skill, PracticeMember, SkillAssessment } from '../lib/types';

interface SkillsHeatmapGridProps {
  skills: Skill[];
  members: PracticeMember[];
  assessments: SkillAssessment[];
}

const LEVEL_COLORS = {
  0: 'bg-gray-100 text-gray-400',
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-blue-100 text-blue-800',
  5: 'bg-green-100 text-green-800',
};

export function SkillsHeatmapGrid({ skills, members, assessments }: SkillsHeatmapGridProps) {
  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getAssessment = (memberId: string, skillId: string) => {
    return assessments.find(
      (a) => a.member_id === memberId && a.skill_id === skillId
    );
  };

  return (
    <div className="space-y-8">
      {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
        <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-800 text-white px-6 py-4">
            <h3 className="text-lg font-semibold font-display">{category}</h3>
            <p className="text-sm text-gray-300 mt-1">{categorySkills.length} skills</p>
          </div>

          {/* Horizontal scrolling container */}
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
                        const score = assessment?.current_level ?? 0;
                        const colorClass = LEVEL_COLORS[score as keyof typeof LEVEL_COLORS];

                        return (
                          <td
                            key={skill.id}
                            className="relative group px-4 py-4 text-center border-r border-gray-200"
                            title={`${skill.name}: ${score}/5`}
                          >
                            <div
                              className={`w-full min-h-[3rem] flex items-center justify-center text-sm font-medium rounded transition-all ${colorClass} group-hover:ring-2 group-hover:ring-brand-blue/30`}
                            >
                              {score || '-'}
                            </div>
                            <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                              <p className="font-semibold">{skill.name}</p>
                              <p className="text-gray-300">Score: {score}/5</p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
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

