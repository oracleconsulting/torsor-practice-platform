import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Skill {
  id: string;
  name: string;
  required_level: number;
}

interface SkillCategoryCardProps {
  category: string;
  skills: Skill[];
  averageLevel: number;
  skillsCount: number;
  assessedCount: number;
  belowTargetCount: number;
}

export function SkillCategoryCard({
  category,
  skills,
  averageLevel,
  skillsCount,
  assessedCount,
  belowTargetCount,
}: SkillCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const progress = skillsCount > 0 ? (assessedCount / skillsCount) * 100 : 0;
  
  // Determine color based on average level
  const getColorClass = () => {
    if (averageLevel === 0) return 'bg-red-500';
    if (averageLevel < 2) return 'bg-red-400';
    if (averageLevel < 3) return 'bg-orange-400';
    if (averageLevel < 4) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
          <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
            <span>
              <span className="font-bold text-2xl text-gray-900">
                {averageLevel.toFixed(1)}
              </span>
              <span className="ml-1">Average Level</span>
            </span>
            <span>{skillsCount} Skills</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {belowTargetCount > 0 && (
            <div className="text-right">
              <div className="text-sm text-red-600 font-medium">
                {belowTargetCount} below target
              </div>
              <div className="text-xs text-gray-500">Need development</div>
            </div>
          )}
          
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-6 pb-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${getColorClass()} transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{assessedCount} assessed</span>
          <span>{skillsCount - assessedCount} not assessed</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="space-y-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-gray-700">{skill.name}</span>
                <span className="text-gray-500">
                  Target: Level {skill.required_level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

