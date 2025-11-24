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
          <div className="bg-gray-800 text-white px-4 py-3">
            <h3 className="text-lg font-semibold">{category}</h3>
            <p className="text-sm text-gray-300">{categorySkills.length} skills</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">
                    Team Member
                  </th>
                  {categorySkills.map((skill) => (
                    <th
                      key={skill.id}
                      className="px-2 py-3 text-center text-xs font-medium text-gray-700 min-w-[80px]"
                    >
                      <div className="transform -rotate-45 origin-left whitespace-nowrap">
                        {skill.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900">
                      <div>
                        <div>{member.name}</div>
                        <div className="text-xs text-gray-500">{member.role}</div>
                      </div>
                    </td>
                    {categorySkills.map((skill) => {
                      const assessment = getAssessment(member.id, skill.id);
                      const level = assessment?.current_level ?? 0;
                      const colorClass = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS];

                      return (
                        <td key={skill.id} className="px-2 py-3 text-center">
                          <div
                            className={`inline-flex items-center justify-center w-10 h-10 rounded font-semibold ${colorClass}`}
                            title={`${member.name} - ${skill.name}: Level ${level}`}
                          >
                            {level || '-'}
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
      ))}
    </div>
  );
}

