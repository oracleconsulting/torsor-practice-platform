import { Users, BookOpen, ClipboardList } from 'lucide-react';
import { useSkills } from '../../hooks/useSkills';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { useSkillAssessments } from '../../hooks/useSkillAssessments';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useAuth } from '../../hooks/useAuth';
import { SkillsHeatmapGrid } from '../../components/SkillsHeatmapGrid';
import { AdminLayout } from '../../components/AdminLayout';
import { PageSkeleton, StatCard, EmptyState } from '../../components/ui';

export function SkillsHeatmapPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { data: skills, isLoading: skillsLoading } = useSkills();
  const { data: members, isLoading: membersLoading } = useTeamMembers(currentMember?.practice_id ?? null);
  const memberIds = members?.map((m) => m.id) ?? [];
  const { data: assessments, isLoading: assessmentsLoading } = useSkillAssessments(memberIds);

  const isLoading = skillsLoading || membersLoading || assessmentsLoading;

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
