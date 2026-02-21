import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useSkillsByCategory } from '../../hooks/useSkillsByCategory';
import { SkillCategoryCard } from '../../components/SkillCategoryCard';
import { AdminLayout } from '../../components/AdminLayout';
import { Plus, Download, Search } from 'lucide-react';
import { SKILL_CATEGORIES, type SkillCategory } from '../../lib/types';
import { supabase } from '../../lib/supabase';

export function SkillsManagementPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const { categories, isLoading } = useSkillsByCategory(currentMember?.practice_id ?? null);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);

  const filteredCategories = searchQuery
    ? categories.map((cat) => ({
        ...cat,
        skills: cat.skills.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
        skillsCount: 0,
      }))
        .map((cat) => ({ ...cat, skillsCount: cat.skills.length }))
        .filter((cat) => cat.skills.length > 0)
    : categories;

  if (isLoading) {
    return (
      <AdminLayout title="Skills Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading skills data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const totalSkills = categories.reduce((sum, cat) => sum + cat.skillsCount, 0);
  const totalAssessed = categories.reduce((sum, cat) => sum + cat.assessedCount, 0);
  const overallAverage = categories.reduce((sum, cat) => sum + cat.averageLevel, 0) / (categories.length || 1);
  const skillsShown = filteredCategories.reduce((sum, c) => sum + c.skillsCount, 0);

  const handleExport = () => {
    const rows = filteredCategories.flatMap((cat) =>
      cat.skills.map((s) => `"${s.name.replace(/"/g, '""')}","${s.category}",${s.required_level}`)
    );
    const csv = 'Name,Category,Required Level\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skills-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout
      title="Skills Management"
      subtitle="Comprehensive view of all skills across your firm"
      headerActions={
        <>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddSkill(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Skill
          </button>
        </>
      }
    >
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

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="text-sm text-gray-500">
          {skillsShown} skills shown
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Skills Management</h3>
        <p className="text-gray-600">Comprehensive view of all skills across your firm</p>
      </div>

      <div className="space-y-4">
        {filteredCategories.map((category) => (
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

      {showAddSkill && (
        <AddSkillModal
          onClose={() => setShowAddSkill(false)}
          onSuccess={() => {
            setShowAddSkill(false);
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            queryClient.invalidateQueries({ queryKey: ['all-assessments'] });
          }}
        />
      )}
    </AdminLayout>
  );
}

function AddSkillModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [skillName, setSkillName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>(SKILL_CATEGORIES[0]);
  const [requiredLevel, setRequiredLevel] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!skillName.trim()) {
      setError('Skill name is required');
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from('skills').insert({
        name: skillName.trim(),
        category: selectedCategory,
        required_level: requiredLevel,
        is_active: true,
      });
      if (err) throw err;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add skill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Skill</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill name</label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="e.g. Xero Complete Mastery"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as SkillCategory)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {SKILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required level (1-5)</label>
            <select
              value={requiredLevel}
              onChange={(e) => setRequiredLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

