import { useState } from 'react';
import { Users, BookOpen, ClipboardList, Search } from 'lucide-react';
import { useSkills } from '../../hooks/useSkills';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { useSkillAssessments } from '../../hooks/useSkillAssessments';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useAuth } from '../../hooks/useAuth';
import { SkillsHeatmapGrid } from '../../components/SkillsHeatmapGrid';
import { AdminLayout } from '../../components/AdminLayout';
import { PageSkeleton, StatCard, EmptyState } from '../../components/ui';
import { SKILL_CATEGORIES } from '../../lib/types';

export function SkillsHeatmapPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { data: skills, isLoading: skillsLoading } = useSkills();
  const { data: members, isLoading: membersLoading } = useTeamMembers(currentMember?.practice_id ?? null);
  const memberIds = members?.map((m) => m.id) ?? [];
  const { data: assessments, isLoading: assessmentsLoading } = useSkillAssessments(memberIds);

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'below_target' | 'at_or_above'>('all');

  const isLoading = skillsLoading || membersLoading || assessmentsLoading;

  const skillsBelowTargetCount = skills?.filter((s) => {
    const skillAssessments = assessments?.filter((a) => a.skill_id === s.id) ?? [];
    const avg =
      skillAssessments.length > 0
        ? skillAssessments.reduce((sum, a) => sum + a.current_level, 0) / skillAssessments.length
        : 0;
    return avg < s.required_level;
  }).length ?? 0;

  const categoryAverages =
    skills && assessments
      ? SKILL_CATEGORIES.map((cat) => {
          const catSkills = skills.filter((s) => s.category === cat);
          const catAssessments = assessments.filter((a) => catSkills.some((s) => s.id === a.skill_id));
          const avg =
            catAssessments.length > 0
              ? catAssessments.reduce((sum, a) => sum + a.current_level, 0) / catAssessments.length
              : 0;
          return { category: cat, avg };
        }).filter((c) => skills.some((s) => s.category === c.category))
      : [];
  const strongest = categoryAverages.length
    ? categoryAverages.reduce((a, b) => (a.avg >= b.avg ? a : b))
    : null;
  const weakest = categoryAverages.length
    ? categoryAverages.reduce((a, b) => (a.avg <= b.avg ? a : b))
    : null;

  return (
    <AdminLayout
      title="Skills Heatmap"
      subtitle={currentMember ? `${currentMember.name} • ${currentMember.role}` : undefined}
    >
      {isLoading ? (
        <PageSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Team Members"
              value={members?.length ?? 0}
              accent="blue"
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              label="Active Skills"
              value={skills?.length ?? 0}
              accent="teal"
              icon={<BookOpen className="w-5 h-5" />}
            />
            <StatCard
              label="Total Assessments"
              value={assessments?.length ?? 0}
              accent="blue"
              icon={<ClipboardList className="w-5 h-5" />}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-lg shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <select
              value={categoryFilter ?? ''}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as 'all' | 'below_target' | 'at_or_above')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Levels</option>
              <option value="below_target">Below Target</option>
              <option value="at_or_above">At or Above Target</option>
            </select>
          </div>

          {/* Summary insights */}
          {assessments && skills && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <span className="font-semibold text-amber-800">{skillsBelowTargetCount}</span>
                <span className="text-amber-700"> skills below target across team</span>
              </div>
              {strongest && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                  <span className="font-semibold text-emerald-800">Strongest: </span>
                  <span className="text-emerald-700">{strongest.category}</span>
                  <span className="text-emerald-600"> (avg {strongest.avg.toFixed(1)})</span>
                </div>
              )}
              {weakest && weakest.category !== strongest?.category && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm">
                  <span className="font-semibold text-rose-800">Weakest: </span>
                  <span className="text-rose-700">{weakest.category}</span>
                  <span className="text-rose-600"> (avg {weakest.avg.toFixed(1)})</span>
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="card mb-6">
            <div className="card-body">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 font-display">Skill Levels</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-semibold">-</div>
                  <span className="text-sm text-gray-600">Not Assessed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-red-100 text-red-800 flex items-center justify-center text-sm font-semibold">1</div>
                  <span className="text-sm text-gray-600">Awareness</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-orange-100 text-orange-800 flex items-center justify-center text-sm font-semibold">2</div>
                  <span className="text-sm text-gray-600">Basic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-yellow-100 text-yellow-800 flex items-center justify-center text-sm font-semibold">3</div>
                  <span className="text-sm text-gray-600">Competent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-semibold">4</div>
                  <span className="text-sm text-gray-600">Proficient</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-green-100 text-green-800 flex items-center justify-center text-sm font-semibold">5</div>
                  <span className="text-sm text-gray-600">Expert</span>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          {skills && members && assessments && (skills.length > 0 || members.length > 0) ? (
            <SkillsHeatmapGrid
              skills={skills}
              members={members}
              assessments={assessments}
              categoryFilter={categoryFilter}
              searchQuery={searchQuery}
              levelFilter={levelFilter}
            />
          ) : (
            <EmptyState
              title="No heatmap data"
              description="Add team members and skills to see the heatmap."
            />
          )}
        </>
      )}
    </AdminLayout>
  );
}
