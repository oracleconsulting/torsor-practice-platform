import { useSkills } from '../../hooks/useSkills';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { useSkillAssessments } from '../../hooks/useSkillAssessments';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useAuth } from '../../hooks/useAuth';
import { SkillsHeatmapGrid } from '../../components/SkillsHeatmapGrid';
import { Navigation } from '../../components/Navigation';

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics' | 'clients' | 'assessments' | 'delivery' | 'config';

interface SkillsHeatmapPageProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

export function SkillsHeatmapPage({ onNavigate, currentPage }: SkillsHeatmapPageProps) {
  const { user, signOut } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { data: skills, isLoading: skillsLoading } = useSkills();
  const { data: members, isLoading: membersLoading } = useTeamMembers(currentMember?.practice_id ?? null);
  const memberIds = members?.map((m) => m.id) ?? [];
  const { data: assessments, isLoading: assessmentsLoading } = useSkillAssessments(memberIds);

  const isLoading = skillsLoading || membersLoading || assessmentsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skills Heatmap</h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentMember?.name} • {currentMember?.role}
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading skills data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Team Members</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{members?.length ?? 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Active Skills</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{skills?.length ?? 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600">Total Assessments</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{assessments?.length ?? 0}</div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Skill Levels</h3>
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

            {/* Heatmap */}
            {skills && members && assessments ? (
              <SkillsHeatmapGrid
                skills={skills}
                members={members}
                assessments={assessments}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No data available</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

