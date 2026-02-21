// ============================================================================
// CPD TRACKER PAGE
// ============================================================================
// Track Continuing Professional Development for team members
// ============================================================================

import { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { StatCard, StatusBadge } from '../../components/ui';
import {
  Award, Plus, Calendar, Clock, CheckCircle,
  BookOpen, Video, Users, Filter, Target, AlertCircle
} from 'lucide-react';
import { SKILL_CATEGORIES, type CPDRecord } from '../../lib/types';
import { useCPDRecords, useCPDTargets, useCPDMutations } from '../../hooks/useCPDRecords';
import { useTeamMembers } from '../../hooks/useTeamMembers';

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Advisory & Consulting': { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
  'Client Management & Development': { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-600' },
  'Communication & Presentation': { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600' },
  'Financial Analysis & Reporting': { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
  'Financial Planning': { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
  'Leadership & Management': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600' },
  'Personal Effectiveness': { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
  'Software & Technical': { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-600' },
  'Tax & Compliance': { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600' },
  'Working Capital & Business Finance': { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600' },
};

const ACTIVITY_TYPES = [
  { id: 'course', name: 'Online Course', icon: Video },
  { id: 'webinar', name: 'Webinar', icon: Users },
  { id: 'reading', name: 'Reading/Research', icon: BookOpen },
  { id: 'conference', name: 'Conference', icon: Calendar },
  { id: 'mentoring', name: 'Mentoring (Given)', icon: Users },
  { id: 'workshop', name: 'Workshop', icon: Users },
  { id: 'on_the_job', name: 'On the Job', icon: Award },
  { id: 'shadowing', name: 'Shadowing', icon: Users },
];

export function CPDTrackerPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);

  const practiceId = currentMember?.practice_id ?? null;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: records = [], isLoading: recordsLoading } = useCPDRecords(practiceId, selectedYear);
  const { data: targets = [], isLoading: targetsLoading } = useCPDTargets(practiceId, selectedYear);
  const { data: teamMembers = [] } = useTeamMembers(practiceId);
  const { addRecord, verifyRecord } = useCPDMutations();

  const isLoading = recordsLoading || targetsLoading;

  const memberSummaries = teamMembers.map((member) => {
    const memberRecords = records.filter((r) => r.member_id === member.id);
    const target = targets.find((t) => t.member_id === member.id);
    const totalHours = memberRecords.reduce((sum, r) => sum + r.hours, 0);
    const categories: Record<string, number> = {};
    memberRecords.forEach((r) => {
      categories[r.skill_category] = (categories[r.skill_category] || 0) + r.hours;
    });
    return {
      member_id: member.id,
      member_name: member.name,
      total_hours: totalHours,
      target_hours: target?.target_hours ?? 40,
      categories,
    };
  });

  const getProgressColor = (current: number, target: number) => {
    const pct = target > 0 ? (current / target) * 100 : 0;
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const categoryTotals = SKILL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = records
      .filter((r) => r.skill_category === cat)
      .reduce((sum, r) => sum + r.hours, 0);
    return acc;
  }, {} as Record<string, number>);

  const filteredRecords = filterCategory
    ? records.filter((r) => r.skill_category === filterCategory)
    : records;

  return (
    <AdminLayout
      title="CPD Tracker"
      subtitle="Track continuing professional development"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Award className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            >
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Plus className="w-4 h-4" />
              Log CPD
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-gray-500 py-8">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Hours Logged" value={memberSummaries.reduce((sum, s) => sum + s.total_hours, 0)} accent="blue" icon={<Clock className="w-5 h-5" />} />
              <StatCard label="Team Target" value={memberSummaries.reduce((sum, s) => sum + s.target_hours, 0)} accent="blue" icon={<Target className="w-5 h-5" />} />
              <StatCard label="On Track" value={memberSummaries.filter((s) => s.total_hours >= s.target_hours * 0.75).length} accent="teal" icon={<CheckCircle className="w-5 h-5" />} />
              <StatCard label="Behind Target" value={memberSummaries.filter((s) => s.total_hours < s.target_hours * 0.5).length} accent="red" icon={<AlertCircle className="w-5 h-5" />} />
            </div>

            <div className="card mb-6">
              <div className="card-header">
                <h2 className="section-heading">Team Progress</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {memberSummaries.map((summary) => (
                    <div key={summary.member_id} className="flex items-center gap-4">
                      <div className="w-40 font-medium text-gray-900">{summary.member_name}</div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(summary.total_hours, summary.target_hours)} transition-all`}
                            style={{ width: `${Math.min(100, summary.target_hours > 0 ? (summary.total_hours / summary.target_hours) * 100 : 0)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24 text-right">
                        <span className="font-bold text-gray-900">{summary.total_hours}</span>
                        <span className="text-gray-400">/{summary.target_hours} hrs</span>
                      </div>
                      <StatusBadge
                        status={summary.total_hours >= summary.target_hours ? 'completed' : summary.total_hours >= summary.target_hours * 0.75 ? 'in_progress' : 'overdue'}
                        label={`${summary.target_hours > 0 ? Math.round((summary.total_hours / summary.target_hours) * 100) : 0}%`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <div className="card-header">
                <h2 className="section-heading">By Category</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {SKILL_CATEGORIES.map((cat) => {
                    const total = categoryTotals[cat] ?? 0;
                    const style = CATEGORY_COLORS[cat] ?? { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-600' };
                    return (
                      <div key={cat} className={`p-4 rounded-xl ${style.bg} border ${style.border}`}>
                        <div className={`text-2xl font-bold ${style.text}`}>{total}</div>
                        <div className="text-sm text-gray-700">{cat}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="section-heading">Recent Activity</h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterCategory || ''}
                    onChange={(e) => setFilterCategory(e.target.value || null)}
                    className="text-sm border-none focus:ring-0"
                  >
                    <option value="">All Categories</option>
                    {SKILL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="card-body">
                {records.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No CPD records yet. Click &quot;Log CPD&quot; to start tracking.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRecords.map((record) => {
                      const ActivityIcon = ACTIVITY_TYPES.find((t) => t.id === record.activity_type)?.icon ?? BookOpen;
                      const style = CATEGORY_COLORS[record.skill_category] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
                      const memberName = teamMembers.find((m) => m.id === record.member_id)?.name ?? 'Unknown';
                      return (
                        <div key={record.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <ActivityIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{record.title}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {memberName} • {record.provider || '—'}
                              {record.notes?.includes('Auto-logged') && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                  From training
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
                            {record.skill_category}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{record.hours} hrs</div>
                            <div className="text-xs text-gray-500">
                              {new Date(record.date_completed).toLocaleDateString()}
                            </div>
                          </div>
                          {record.verified ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : currentMember?.role && ['admin', 'owner'].includes(currentMember.role) ? (
                            <button
                              type="button"
                              onClick={() => verifyRecord.mutate({ id: record.id, verifiedBy: currentMember.id })}
                              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                            >
                              Verify
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log CPD Modal */}
      {showAddModal && currentMember?.practice_id && (
        <CPDAddModal
          practiceId={currentMember.practice_id}
          currentMemberId={currentMember.id}
          teamMembers={teamMembers}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
          }}
          addRecord={addRecord}
        />
      )}
    </AdminLayout>
  );
}

interface CPDAddModalProps {
  practiceId: string;
  currentMemberId: string;
  teamMembers: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
  addRecord: ReturnType<typeof useCPDMutations>['addRecord'];
}

function CPDAddModal({ practiceId, teamMembers, onClose, onSuccess, addRecord }: CPDAddModalProps) {
  const [memberId, setMemberId] = useState('');
  const [activityType, setActivityType] = useState('course');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [hours, setHours] = useState('1');
  const [dateCompleted, setDateCompleted] = useState(new Date().toISOString().split('T')[0]);
  const [skillCategory, setSkillCategory] = useState<string>(SKILL_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const member = memberId || teamMembers[0]?.id;
    if (!member) {
      setError('Select a team member');
      return;
    }
    setSubmitting(true);
    try {
      await addRecord.mutateAsync({
        practice_id: practiceId,
        member_id: member,
        activity_type: activityType as CPDRecord['activity_type'],
        title: title.trim(),
        provider: provider.trim() || undefined,
        hours: parseFloat(hours) || 0.5,
        date_completed: dateCompleted,
        skill_category: skillCategory,
        skill_ids: [],
        notes: notes.trim() || undefined,
        verified: false,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Log CPD</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                required
              >
                <option value="">Select member</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="e.g. Advanced Tax Planning"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="e.g. ICAEW"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date completed</label>
              <input
                type="date"
                value={dateCompleted}
                onChange={(e) => setDateCompleted(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill category</label>
              <select
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                rows={2}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CPDTrackerPage;
