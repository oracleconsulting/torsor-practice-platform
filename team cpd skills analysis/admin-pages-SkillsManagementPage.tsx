import { useAuth } from '../../hooks/useAuth';
import type { Page } from '../../types/navigation';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useSkillsByCategory } from '../../hooks/useSkillsByCategory';
import { SkillCategoryCard } from '../../components/SkillCategoryCard';
import { Navigation } from '../../components/Navigation';
import { Plus, Download } from 'lucide-react';


interface SkillsManagementPageProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

export function SkillsManagementPage({ onNavigate, currentPage }: SkillsManagementPageProps) {
  const { user, signOut } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { categories, isLoading } = useSkillsByCategory(currentMember?.practice_id ?? null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skills data...</p>
        </div>
      </div>
    );
  }

  const totalSkills = categories.reduce((sum, cat) => sum + cat.skillsCount, 0);
  const totalAssessed = categories.reduce((sum, cat) => sum + cat.assessedCount, 0);
  const overallAverage = categories.reduce((sum, cat) => sum + cat.averageLevel, 0) / (categories.length || 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skills Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive view of all skills across your firm
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Skill
              </button>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <Navigation currentPage={currentPage} onNavigate={onNavigate} />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview Section */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg shadow p-6 mb-8 border border-orange-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
              📊
            </span>
            SKILLS & DEVELOPMENT
          </h2>
          <p className="text-gray-700 mb-4">
            Advisory skills matrix, training plans, mentoring programs, and CPD tracking
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-600">Total Skills</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{totalSkills}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-600">Assessed</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{totalAssessed}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-600">Overall Average</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{overallAverage.toFixed(1)}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-600">Categories</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{categories.length}</div>
            </div>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="flex gap-4 mb-6">
          <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm flex items-center gap-2">
            📊 Skills Management
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
            🎓 Training
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
            👥 Mentoring
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
            📝 CPD Tracker
          </button>
        </div>

        {/* Skills Management Header */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Skills Management</h3>
          <p className="text-gray-600">Comprehensive view of all skills across your firm</p>
        </div>

        {/* Category Cards */}
        <div className="space-y-4">
          {categories.map((category) => (
            <SkillCategoryCard
              key={category.category}
              category={category.category}
              skills={category.skills}
              averageLevel={category.averageLevel}
              skillsCount={category.skillsCount}
              assessedCount={category.assessedCount}
              belowTargetCount={category.belowTargetCount}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

