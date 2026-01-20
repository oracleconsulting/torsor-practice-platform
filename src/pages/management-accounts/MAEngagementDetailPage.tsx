'use client';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  FileText,
  TrendingUp,
  Settings,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Upload,
  Edit,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  WatchListPanel, 
  TrueCashCard 
} from '../../components/management-accounts';
import { formatTrueCashForDisplay, calculateTrueCash } from '../../services/ma/true-cash';
import type { MAEngagement, MAPeriod, MAFinancialData } from '../../types/ma';

const PERIOD_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-100', icon: <Clock className="h-3 w-3" /> },
  data_received: { label: 'Data Received', color: 'text-blue-600', bg: 'bg-blue-100', icon: <FileText className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-100', icon: <Edit className="h-3 w-3" /> },
  review: { label: 'Ready for Review', color: 'text-purple-600', bg: 'bg-purple-100', icon: <Eye className="h-3 w-3" /> },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle2 className="h-3 w-3" /> },
  delivered: { label: 'Delivered', color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle2 className="h-3 w-3" /> },
  client_reviewed: { label: 'Client Viewed', color: 'text-green-700', bg: 'bg-green-200', icon: <Eye className="h-3 w-3" /> },
};

export function MAEngagementDetailPage() {
  const { engagementId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<MAEngagement & { client?: { name: string; company_name?: string } } | null>(null);
  const [periods, setPeriods] = useState<MAPeriod[]>([]);
  const [latestFinancials, setLatestFinancials] = useState<MAFinancialData | null>(null);
  const [activeTab, setActiveTab] = useState<'periods' | 'kpis' | 'watchlist'>('periods');
  const [_showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  // Note: Modal UI to be implemented - state tracks when period creation form is open

  useEffect(() => {
    if (engagementId) {
      loadEngagement();
    }
  }, [engagementId]);

  const loadEngagement = async () => {
    setLoading(true);
    try {
      // Load engagement
      const { data: engData } = await supabase
        .from('ma_engagements')
        .select('*, client:clients(name, company_name)')
        .eq('id', engagementId)
        .single();

      if (engData) {
        setEngagement(engData);

        // Load periods
        const { data: periodsData } = await supabase
          .from('ma_periods')
          .select('*')
          .eq('engagement_id', engagementId)
          .order('period_end', { ascending: false });

        if (periodsData) {
          setPeriods(periodsData);

          // Load latest financials
          if (periodsData[0]) {
            const { data: finData } = await supabase
              .from('ma_financial_data')
              .select('*')
              .eq('period_id', periodsData[0].id)
              .single();

            if (finData) setLatestFinancials(finData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading engagement:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewPeriod = async () => {
    if (!engagement) return;

    const lastPeriod = periods[0];
    let newPeriodStart: Date;
    let newPeriodEnd: Date;

    if (lastPeriod) {
      newPeriodStart = new Date(lastPeriod.period_end);
      newPeriodStart.setDate(newPeriodStart.getDate() + 1);
    } else {
      newPeriodStart = new Date(engagement.start_date);
    }

    newPeriodEnd = new Date(newPeriodStart);
    if (engagement.frequency === 'monthly') {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      newPeriodEnd.setDate(0); // Last day of month
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 3);
      newPeriodEnd.setDate(0);
    }

    const periodLabel = engagement.frequency === 'monthly'
      ? newPeriodEnd.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : `Q${Math.ceil((newPeriodEnd.getMonth() + 1) / 3)} ${newPeriodEnd.getFullYear()}`;

    const { data, error } = await supabase
      .from('ma_periods')
      .insert({
        engagement_id: engagement.id,
        period_type: engagement.frequency,
        period_start: newPeriodStart.toISOString().split('T')[0],
        period_end: newPeriodEnd.toISOString().split('T')[0],
        period_label: periodLabel,
        status: 'pending',
        due_date: new Date(newPeriodEnd.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days
      })
      .select()
      .single();

    if (!error && data) {
      setPeriods([data, ...periods]);
      setShowNewPeriodModal(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Engagement not found</p>
      </div>
    );
  }

  const tier = engagement.tier;
  const trueCashData = latestFinancials?.cash_at_bank
    ? formatTrueCashForDisplay(calculateTrueCash({
        bankBalance: latestFinancials.cash_at_bank,
        vatLiability: latestFinancials.vat_liability || 0,
        payeLiability: latestFinancials.paye_liability || 0,
        corporationTaxLiability: latestFinancials.corporation_tax_liability || 0,
        monthlyOperatingCosts: latestFinancials.overheads || 0,
      }))
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/ma/engagements')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Engagements
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {engagement.client?.company_name || engagement.client?.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              tier === 'platinum' ? 'bg-violet-100 text-violet-700' :
              tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
              tier === 'silver' ? 'bg-slate-200 text-slate-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)} • {formatCurrency(engagement.monthly_fee)}/mo
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              engagement.status === 'active' ? 'bg-green-100 text-green-700' :
              engagement.status === 'paused' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {engagement.status.charAt(0).toUpperCase() + engagement.status.slice(1)}
            </span>
            <span className="text-sm text-slate-500">
              Since {new Date(engagement.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/ma/engagements/${engagement.id}/settings`)}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => window.open(`/client/ma/${engagement.id}`, '_blank')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Client View
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Periods</p>
              <p className="text-xl font-bold text-slate-800">{periods.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Delivered</p>
              <p className="text-xl font-bold text-slate-800">
                {periods.filter(p => p.status === 'delivered' || p.status === 'client_reviewed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">In Progress</p>
              <p className="text-xl font-bold text-slate-800">
                {periods.filter(p => ['pending', 'data_received', 'in_progress', 'review'].includes(p.status)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">True Cash</p>
              <p className="text-xl font-bold text-slate-800">
                {trueCashData ? formatCurrency(trueCashData.trueCash) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('periods')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'periods'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Reporting Periods
            </span>
          </button>
          <button
            onClick={() => setActiveTab('kpis')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'kpis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              KPIs
            </span>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'watchlist'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Watch List
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'periods' && (
        <div className="space-y-4">
          {/* Create Period Button */}
          <div className="flex justify-end">
            <button
              onClick={createNewPeriod}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Period
            </button>
          </div>

          {/* Periods List */}
          {periods.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No reporting periods yet</p>
              <p className="text-slate-500 text-sm mt-1">Create the first period to start delivering reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {periods.map(period => {
                const statusConfig = PERIOD_STATUS_CONFIG[period.status];
                const isOverdue = period.due_date && new Date(period.due_date) < new Date() && 
                  !['delivered', 'client_reviewed'].includes(period.status);

                return (
                  <div
                    key={period.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/admin/ma/engagements/${engagement.id}/periods/${period.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center w-16">
                          <p className="text-2xl font-bold text-slate-800">
                            {new Date(period.period_end).getDate()}
                          </p>
                          <p className="text-xs text-slate-500 uppercase">
                            {new Date(period.period_end).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{period.period_label}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <AlertTriangle className="h-3 w-3" />
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {period.tuesday_question && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Tuesday Question</p>
                            <p className="text-sm text-slate-600 max-w-[200px] truncate">{period.tuesday_question}</p>
                          </div>
                        )}
                        {period.due_date && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Due Date</p>
                            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                              {new Date(period.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/ma/engagements/${engagement.id}/periods/${period.id}/upload`);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Upload Documents"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/ma/engagements/${engagement.id}/periods/${period.id}`);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'kpis' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">KPI Configuration</h3>
          <p className="text-slate-500 mb-4">
            Configure which KPIs to track for this engagement.
          </p>
          <p className="text-sm text-slate-400">
            KPI selection is managed during period setup.
          </p>
        </div>
      )}

      {activeTab === 'watchlist' && (
        <WatchListPanel
          engagementId={engagement.id}
          tier={tier}
          showAddButton
        />
      )}

      {/* Latest True Cash Card (sidebar) */}
      {trueCashData && activeTab === 'periods' && (
        <div className="fixed right-6 top-32 w-80">
          <TrueCashCard data={trueCashData} />
        </div>
      )}
    </div>
  );
}

export default MAEngagementDetailPage;

