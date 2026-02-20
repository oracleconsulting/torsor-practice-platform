// ============================================================================
import type { Page } from '../../types/navigation';
// CPD TRACKER PAGE
// ============================================================================
// Track Continuing Professional Development for team members
// ============================================================================

import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { 
  Award, Plus, Calendar, Clock, CheckCircle, 
  BookOpen, Video, Users, Filter, Target, AlertCircle
} from 'lucide-react';


interface CPDTrackerPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface CPDRecord {
  id: string;
  member_id: string;
  member_name: string;
  activity_type: string;
  title: string;
  provider: string;
  hours: number;
  date_completed: string;
  category: string;
  verified: boolean;
  certificate_url?: string;
}

interface MemberCPDSummary {
  member_id: string;
  member_name: string;
  total_hours: number;
  target_hours: number;
  categories: Record<string, number>;
}

const CPD_CATEGORIES = [
  { id: 'technical', name: 'Technical', color: 'blue' },
  { id: 'ethics', name: 'Ethics & Compliance', color: 'purple' },
  { id: 'business', name: 'Business Skills', color: 'emerald' },
  { id: 'leadership', name: 'Leadership', color: 'amber' },
  { id: 'industry', name: 'Industry Knowledge', color: 'rose' },
];

const ACTIVITY_TYPES = [
  { id: 'course', name: 'Online Course', icon: Video },
  { id: 'webinar', name: 'Webinar', icon: Users },
  { id: 'reading', name: 'Reading/Research', icon: BookOpen },
  { id: 'conference', name: 'Conference', icon: Calendar },
  { id: 'mentoring', name: 'Mentoring (Given)', icon: Users },
];

export function CPDTrackerPage({ currentPage, onNavigate }: CPDTrackerPageProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  
  const [records, setRecords] = useState<CPDRecord[]>([]);
  const [summaries, setSummaries] = useState<MemberCPDSummary[]>([]);
  const [_loading, setLoading] = useState(true);
  const [_showAddModal, setShowAddModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  // Silence unused warnings for now
  void _loading;
  void _showAddModal;

  useEffect(() => {
    if (currentMember?.practice_id) {
      loadCPDData();
    }
  }, [currentMember?.practice_id, selectedYear]);

  const loadCPDData = async () => {
    setLoading(true);
    
    // For now, generate sample data since CPD table may not exist
    const sampleRecords: CPDRecord[] = [
      {
        id: '1',
        member_id: '1',
        member_name: 'James Howard',
        activity_type: 'course',
        title: 'Advanced Tax Planning 2024',
        provider: 'ICAEW',
        hours: 8,
        date_completed: '2024-11-15',
        category: 'technical',
        verified: true
      },
      {
        id: '2',
        member_id: '1',
        member_name: 'James Howard',
        activity_type: 'webinar',
        title: 'Ethics in Practice',
        provider: 'ACCA',
        hours: 2,
        date_completed: '2024-10-20',
        category: 'ethics',
        verified: true
      },
      {
        id: '3',
        member_id: '2',
        member_name: 'Wes Thompson',
        activity_type: 'conference',
        title: 'AccountingWEB Live',
        provider: 'AccountingWEB',
        hours: 6,
        date_completed: '2024-09-10',
        category: 'industry',
        verified: false
      },
    ];

    const sampleSummaries: MemberCPDSummary[] = [
      {
        member_id: '1',
        member_name: 'James Howard',
        total_hours: 32,
        target_hours: 40,
        categories: { technical: 18, ethics: 6, business: 4, leadership: 4 }
      },
      {
        member_id: '2',
        member_name: 'Wes Thompson',
        total_hours: 28,
        target_hours: 40,
        categories: { technical: 12, ethics: 4, business: 8, industry: 4 }
      },
      {
        member_id: '3',
        member_name: 'Laura Smith',
        total_hours: 45,
        target_hours: 40,
        categories: { technical: 20, ethics: 8, leadership: 10, business: 7 }
      },
    ];

    setRecords(sampleRecords);
    setSummaries(sampleSummaries);
    setLoading(false);
  };

  const getProgressColor = (current: number, target: number) => {
    const pct = (current / target) * 100;
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <AdminLayout
      title="CPD Tracker"
      subtitle="Track continuing professional development"
      currentPage={currentPage}
      onNavigate={onNavigate}
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
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Total Hours Logged</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summaries.reduce((sum, s) => sum + s.total_hours, 0)}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Team Target</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {summaries.reduce((sum, s) => sum + s.target_hours, 0)}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-gray-500">On Track</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {summaries.filter(s => s.total_hours >= s.target_hours * 0.75).length}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-500">Behind Target</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {summaries.filter(s => s.total_hours < s.target_hours * 0.5).length}
            </div>
          </div>
        </div>

        {/* Team Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Team Progress</h2>
          
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div key={summary.member_id} className="flex items-center gap-4">
                <div className="w-40 font-medium text-gray-900">{summary.member_name}</div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(summary.total_hours, summary.target_hours)} transition-all`}
                      style={{ width: `${Math.min(100, (summary.total_hours / summary.target_hours) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="font-bold text-gray-900">{summary.total_hours}</span>
                  <span className="text-gray-400">/{summary.target_hours} hrs</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  summary.total_hours >= summary.target_hours 
                    ? 'bg-emerald-100 text-emerald-700'
                    : summary.total_hours >= summary.target_hours * 0.75
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {Math.round((summary.total_hours / summary.target_hours) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">By Category</h2>
          
          <div className="grid grid-cols-5 gap-4">
            {CPD_CATEGORIES.map((cat) => {
              const total = summaries.reduce((sum, s) => sum + (s.categories[cat.id] || 0), 0);
              return (
                <div key={cat.id} className={`p-4 rounded-xl bg-${cat.color}-50 border border-${cat.color}-100`}>
                  <div className={`text-2xl font-bold text-${cat.color}-600`}>{total}</div>
                  <div className={`text-sm text-${cat.color}-700`}>{cat.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="text-sm border-none focus:ring-0"
              >
                <option value="">All Categories</option>
                {CPD_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {records
              .filter(r => !filterCategory || r.category === filterCategory)
              .map((record) => {
                const ActivityIcon = ACTIVITY_TYPES.find(t => t.id === record.activity_type)?.icon || BookOpen;
                const category = CPD_CATEGORIES.find(c => c.id === record.category);
                
                return (
                  <div key={record.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <ActivityIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{record.title}</div>
                      <div className="text-sm text-gray-500">
                        {record.member_name} • {record.provider}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs bg-${category?.color}-100 text-${category?.color}-700`}>
                      {category?.name}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{record.hours} hrs</div>
                      <div className="text-xs text-gray-500">
                        {new Date(record.date_completed).toLocaleDateString()}
                      </div>
                    </div>
                    {record.verified && (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default CPDTrackerPage;

