'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Plus,
  Search,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Upload,
  Edit,
  BarChart3,
  Lightbulb,
  HelpCircle,
  Send,
  Calculator
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  DocumentUploader,
  InsightCard,
  InsightEditor,
  PeriodDeliveryChecklist,
  TrueCashCard,
  WatchListPanel
} from '../../components/management-accounts';
import { calculateTrueCash, formatTrueCashForDisplay } from '../../services/ma/true-cash';
import type { 
  MAPeriod, 
  MADocument,
  MAFinancialData, 
  MAInsight,
  MAKPIValue,
  TierType 
} from '../../types/ma';
import type { NavigationProps } from '../../types/navigation';

// ============================================================================
// TYPES
// ============================================================================

type PortalView = 'list' | 'engagement' | 'period';

interface EngagementWithClient {
  id: string;
  client_id: string;
  tier: TierType;
  frequency: string;
  monthly_fee: number;
  status: 'pending' | 'active' | 'paused' | 'cancelled';
  start_date: string;
  created_at: string;
  client?: {
    name: string;
    email?: string;
    client_company?: string; // practice_members uses client_company instead of company_name
  };
  currentPeriod?: MAPeriod;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_COLORS: Record<TierType, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  silver: { bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-300' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  platinum: { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-100' },
  active: { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-amber-600', bg: 'bg-amber-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' },
};

const PERIOD_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-100', icon: <Clock className="h-3 w-3" /> },
  data_received: { label: 'Data Received', color: 'text-blue-600', bg: 'bg-blue-100', icon: <FileText className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-100', icon: <Edit className="h-3 w-3" /> },
  review: { label: 'Ready for Review', color: 'text-purple-600', bg: 'bg-purple-100', icon: <Eye className="h-3 w-3" /> },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle2 className="h-3 w-3" /> },
  delivered: { label: 'Delivered', color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle2 className="h-3 w-3" /> },
  client_reviewed: { label: 'Client Viewed', color: 'text-green-700', bg: 'bg-green-200', icon: <Eye className="h-3 w-3" /> },
};

type WorkflowTab = 'upload' | 'data' | 'kpis' | 'insights' | 'tuesday' | 'deliver';

const WORKFLOW_STEPS: { tab: WorkflowTab; label: string; icon: React.ReactNode }[] = [
  { tab: 'upload', label: 'Upload Docs', icon: <Upload className="h-4 w-4" /> },
  { tab: 'data', label: 'Financial Data', icon: <Calculator className="h-4 w-4" /> },
  { tab: 'kpis', label: 'KPIs', icon: <BarChart3 className="h-4 w-4" /> },
  { tab: 'insights', label: 'Insights', icon: <Lightbulb className="h-4 w-4" /> },
  { tab: 'tuesday', label: 'Tuesday Q', icon: <HelpCircle className="h-4 w-4" /> },
  { tab: 'deliver', label: 'Deliver', icon: <Send className="h-4 w-4" /> },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MAPortalPage({ onNavigate, currentPage: _currentPage }: NavigationProps) {
  // Navigation state
  const [view, setView] = useState<PortalView>('list');
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  
  // Data state
  const [engagements, setEngagements] = useState<EngagementWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<TierType | 'all'>('all');
  
  // Engagement detail state
  const [engagement, setEngagement] = useState<EngagementWithClient | null>(null);
  const [periods, setPeriods] = useState<MAPeriod[]>([]);
  const [latestFinancials, setLatestFinancials] = useState<MAFinancialData | null>(null);
  const [engagementTab, setEngagementTab] = useState<'periods' | 'kpis' | 'watchlist'>('periods');
  
  // Period detail state
  const [period, setPeriod] = useState<MAPeriod | null>(null);
  const [_documents, setDocuments] = useState<MADocument[]>([]);
  // _documents loaded for period - displayed in upload step
  const [_financialData, setFinancialData] = useState<MAFinancialData | null>(null);
  // _financialData loaded for period detail - used for KPI calculations
  const [insights, setInsights] = useState<MAInsight[]>([]);
  const [kpis, setKpis] = useState<MAKPIValue[]>([]);
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>('upload');
  const [showInsightEditor, setShowInsightEditor] = useState(false);
  const [editingInsight, setEditingInsight] = useState<MAInsight | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (view === 'list') {
      loadEngagements();
    }
  }, [view]);

  useEffect(() => {
    if (view === 'engagement' && selectedEngagementId) {
      loadEngagementDetail(selectedEngagementId);
    }
  }, [view, selectedEngagementId]);

  useEffect(() => {
    if (view === 'period' && selectedPeriodId && selectedEngagementId) {
      loadPeriodDetail(selectedEngagementId, selectedPeriodId);
    }
  }, [view, selectedEngagementId, selectedPeriodId]);

  const loadEngagements = async () => {
    setLoading(true);
    try {
      // First, let's see ALL engagements without the join to debug
      const { data: rawEngData, error: rawError } = await supabase
        .from('ma_engagements')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('[MA Portal] Raw engagements (no join):', rawEngData?.length || 0, rawEngData);
      if (rawError) {
        console.error('[MA Portal] Raw query error:', rawError);
      }
      
      // Now try with the join - use !client_id to specify which FK to use
      const { data: engData, error: engError } = await supabase
        .from('ma_engagements')
        .select(`
          *,
          client:practice_members!client_id(name, email, client_company)
        `)
        .order('created_at', { ascending: false });
      
      if (engError) {
        console.error('[MA Portal] Error loading engagements with join:', engError);
      }
      console.log('[MA Portal] Engagements with join:', engData?.length || 0, engData);

      if (engData) {
        // Fetch current periods for each engagement
        const engagementsWithPeriods = await Promise.all(
          engData.map(async (eng: EngagementWithClient) => {
            const { data: periodsData } = await supabase
              .from('ma_periods')
              .select('*')
              .eq('engagement_id', eng.id)
              .order('period_end', { ascending: false })
              .limit(1);

            return {
              ...eng,
              currentPeriod: periodsData?.[0] || null,
            };
          })
        );

        setEngagements(engagementsWithPeriods);
      }
    } catch (error) {
      console.error('Error loading engagements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEngagementDetail = async (engId: string) => {
    setLoading(true);
    try {
      // Load engagement
      const { data: engData } = await supabase
        .from('ma_engagements')
        .select(`*, client:practice_members!client_id(name, email, client_company)`)
        .eq('id', engId)
        .single();

      if (engData) {
        setEngagement(engData);

        // Load periods
        const { data: periodsData } = await supabase
          .from('ma_periods')
          .select('*')
          .eq('engagement_id', engId)
          .order('period_end', { ascending: false });

        setPeriods(periodsData || []);

        // Load latest financial data
        if (periodsData && periodsData.length > 0) {
          const { data: finData } = await supabase
            .from('ma_financial_data')
            .select('*')
            .eq('period_id', periodsData[0].id)
            .single();

          setLatestFinancials(finData);
        }
      }
    } catch (error) {
      console.error('Error loading engagement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodDetail = async (engId: string, perId: string) => {
    setLoading(true);
    try {
      // Load engagement
      const { data: engData } = await supabase
        .from('ma_engagements')
        .select(`*, client:practice_members!client_id(name, email, client_company)`)
        .eq('id', engId)
        .single();

      if (engData) setEngagement(engData);

      // Load period
      const { data: periodData } = await supabase
        .from('ma_periods')
        .select('*')
        .eq('id', perId)
        .single();

      if (periodData) setPeriod(periodData);

      // Load documents
      const { data: docsData } = await supabase
        .from('ma_documents')
        .select('*')
        .eq('period_id', perId);

      setDocuments(docsData || []);

      // Load financial data
      const { data: finData } = await supabase
        .from('ma_financial_data')
        .select('*')
        .eq('period_id', perId)
        .single();

      setFinancialData(finData);

      // Load insights
      const { data: insightsData } = await supabase
        .from('ma_insights')
        .select('*')
        .eq('period_id', perId)
        .order('display_order');

      setInsights(insightsData || []);

      // Load KPIs
      const { data: kpisData } = await supabase
        .from('ma_kpi_tracking')
        .select('*')
        .eq('engagement_id', engId)
        .order('period_end', { ascending: false });

      setKpis(kpisData || []);
    } catch (error) {
      console.error('Error loading period:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const navigateToEngagement = (engId: string) => {
    setSelectedEngagementId(engId);
    setView('engagement');
  };

  const navigateToPeriod = (engId: string, perId: string) => {
    setSelectedEngagementId(engId);
    setSelectedPeriodId(perId);
    setView('period');
  };

  const navigateBack = () => {
    if (view === 'period') {
      setSelectedPeriodId(null);
      setView('engagement');
    } else if (view === 'engagement') {
      setSelectedEngagementId(null);
      setView('list');
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const filteredEngagements = engagements.filter(eng => {
    const matchesSearch = !searchQuery || 
      (eng.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       eng.client?.client_company?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = filterTier === 'all' || eng.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const trueCashDisplay = latestFinancials?.true_cash !== undefined && latestFinancials?.cash_at_bank !== undefined
    ? formatTrueCashForDisplay(calculateTrueCash({
        bankBalance: latestFinancials.cash_at_bank,
        vatLiability: latestFinancials.vat_liability || 0,
        payeLiability: latestFinancials.paye_liability || 0,
        corporationTaxLiability: latestFinancials.corporation_tax_liability || 0,
        monthlyOperatingCosts: latestFinancials.monthly_operating_costs || latestFinancials.overheads || 0,
      }))
    : null;

  const tier = engagement?.tier as TierType || 'bronze';

  // ============================================================================
  // RENDER: LOADING
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: ENGAGEMENT LIST
  // ============================================================================

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Management Accounts Portal</h1>
                <p className="text-slate-500 mt-1">Manage client engagements and deliverables</p>
              </div>
              <button
                onClick={() => onNavigate('clients')}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Clients
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as TierType | 'all')}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{engagements.length}</p>
                  <p className="text-sm text-slate-500">Total Engagements</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {engagements.filter(e => e.status === 'active').length}
                  </p>
                  <p className="text-sm text-slate-500">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {engagements.filter(e => e.currentPeriod?.status === 'pending' || e.currentPeriod?.status === 'in_progress').length}
                  </p>
                  <p className="text-sm text-slate-500">Periods Due</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatCurrency(engagements.reduce((sum, e) => sum + (e.monthly_fee || 0), 0))}
                  </p>
                  <p className="text-sm text-slate-500">Monthly Revenue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Engagements List */}
          {filteredEngagements.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No engagements found</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Start by creating an engagement from the Client Services page'}
              </p>
              <button
                onClick={() => onNavigate('clients')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Client Services
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Tier</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Current Period</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Fee</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEngagements.map((eng) => (
                    <tr 
                      key={eng.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigateToEngagement(eng.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {eng.client?.client_company || eng.client?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[eng.tier].bg} ${TIER_COLORS[eng.tier].text}`}>
                          {eng.tier.charAt(0).toUpperCase() + eng.tier.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[eng.status].bg} ${STATUS_CONFIG[eng.status].color}`}>
                          {STATUS_CONFIG[eng.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {eng.currentPeriod ? (
                          <div className="flex items-center gap-2">
                            {PERIOD_STATUS_CONFIG[eng.currentPeriod.status]?.icon}
                            <span>{eng.currentPeriod.period_label}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No periods</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {formatCurrency(eng.monthly_fee || 0)}/mo
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToEngagement(eng.id);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: ENGAGEMENT DETAIL
  // ============================================================================

  if (view === 'engagement' && engagement) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={navigateBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-800">
                    {engagement.client?.client_company || engagement.client?.name}
                  </h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[engagement.tier].bg} ${TIER_COLORS[engagement.tier].text}`}>
                    {engagement.tier.charAt(0).toUpperCase() + engagement.tier.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {engagement.frequency} • {formatCurrency(engagement.monthly_fee || 0)}/month
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mt-4 border-b border-slate-200 -mb-px">
              {(['periods', 'kpis', 'watchlist'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setEngagementTab(tab)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    engagementTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'periods' && 'Periods'}
                  {tab === 'kpis' && 'KPIs'}
                  {tab === 'watchlist' && 'Watch List'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* True Cash Card */}
          {trueCashDisplay && (
            <div className="mb-6">
              <TrueCashCard data={trueCashDisplay} />
            </div>
          )}

          {/* Periods Tab */}
          {engagementTab === 'periods' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Reporting Periods</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Period
                </button>
              </div>

              {periods.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No periods created yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {periods.map(p => (
                    <div
                      key={p.id}
                      onClick={() => navigateToPeriod(engagement.id, p.id)}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{p.period_label}</div>
                            <div className="text-sm text-slate-500">
                              {formatDate(p.period_start)} - {formatDate(p.period_end)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${PERIOD_STATUS_CONFIG[p.status]?.bg} ${PERIOD_STATUS_CONFIG[p.status]?.color}`}>
                            {PERIOD_STATUS_CONFIG[p.status]?.icon}
                            {PERIOD_STATUS_CONFIG[p.status]?.label}
                          </span>
                          <Eye className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KPIs Tab */}
          {engagementTab === 'kpis' && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">KPI Configuration</h3>
              <p className="text-slate-500">
                KPIs are configured and tracked within each reporting period.
              </p>
            </div>
          )}

          {/* Watch List Tab */}
          {engagementTab === 'watchlist' && (
            <WatchListPanel
              engagementId={engagement.id}
              tier={tier}
              showAddButton
            />
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: PERIOD DETAIL
  // ============================================================================

  if (view === 'period' && period && engagement) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={navigateBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <span>{engagement.client?.client_company || engagement.client?.name}</span>
                  <span>→</span>
                  <span>{period.period_label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-800">{period.period_label}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${PERIOD_STATUS_CONFIG[period.status]?.bg} ${PERIOD_STATUS_CONFIG[period.status]?.color}`}>
                    {PERIOD_STATUS_CONFIG[period.status]?.icon}
                    {PERIOD_STATUS_CONFIG[period.status]?.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {WORKFLOW_STEPS.map((step, idx) => (
                <button
                  key={step.tab}
                  onClick={() => setWorkflowTab(step.tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    workflowTab === step.tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs">
                    {idx + 1}
                  </span>
                  {step.icon}
                  {step.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Upload Tab */}
          {workflowTab === 'upload' && (
            <div className="space-y-6">
              <DocumentUploader
                periodId={period.id}
                engagementId={engagement.id}
                onUploadComplete={() => {
                  // Reload documents after upload
                  loadPeriodDetail(engagement.id, period.id);
                }}
              />
              <button
                onClick={() => setWorkflowTab('data')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue to Financial Data →
              </button>
            </div>
          )}

          {/* Data Tab */}
          {workflowTab === 'data' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Financial Data Entry</h2>
              <p className="text-slate-500 mb-4">
                Financial data entry form coming soon. Data will be extracted from uploaded documents or entered manually.
              </p>
              <button
                onClick={() => setWorkflowTab('kpis')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue to KPIs →
              </button>
            </div>
          )}

          {/* KPIs Tab */}
          {workflowTab === 'kpis' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">KPI Calculations</h2>
                {kpis.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kpis.map(kpi => (
                      <div 
                        key={kpi.id || kpi.kpi_code}
                        className={`p-4 rounded-lg border ${
                          kpi.rag_status === 'green' ? 'border-green-200 bg-green-50' :
                          kpi.rag_status === 'amber' ? 'border-amber-200 bg-amber-50' :
                          kpi.rag_status === 'red' ? 'border-red-200 bg-red-50' :
                          'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="text-sm text-slate-500 mb-1">{kpi.kpi_code}</div>
                        <div className="text-2xl font-bold text-slate-800">
                          {kpi.value?.toLocaleString() ?? '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No KPIs calculated yet</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setWorkflowTab('insights')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue to Insights →
              </button>
            </div>
          )}

          {/* Insights Tab */}
          {workflowTab === 'insights' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Insights</h2>
                <button 
                  onClick={() => {
                    setEditingInsight(null);
                    setShowInsightEditor(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Insight
                </button>
              </div>

              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map(insight => (
                    <div key={insight.id} className="relative">
                      <InsightCard
                        insight={insight}
                        showRecommendation
                      />
                      <button
                        onClick={() => {
                          setEditingInsight(insight);
                          setShowInsightEditor(true);
                        }}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <Lightbulb className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No insights added yet</p>
                </div>
              )}

              {showInsightEditor && (
                <InsightEditor
                  periodId={period.id}
                  engagementTier={tier}
                  insight={editingInsight ?? undefined}
                  onSave={(newInsight) => {
                    if (editingInsight) {
                      setInsights(insights.map(i => i.id === newInsight.id ? newInsight : i));
                    } else {
                      setInsights([...insights, newInsight]);
                    }
                    setShowInsightEditor(false);
                    setEditingInsight(null);
                  }}
                  onCancel={() => {
                    setShowInsightEditor(false);
                    setEditingInsight(null);
                  }}
                />
              )}

              <button
                onClick={() => setWorkflowTab('tuesday')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue to Tuesday Question →
              </button>
            </div>
          )}

          {/* Tuesday Question Tab */}
          {workflowTab === 'tuesday' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Tuesday Question</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    This Period's Tuesday Question
                  </label>
                  <input
                    type="text"
                    value={period.tuesday_question || ''}
                    readOnly
                    placeholder="e.g., What's our cash runway if we lose our biggest client?"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Answer
                  </label>
                  <textarea
                    value={period.tuesday_answer || ''}
                    readOnly
                    placeholder="The answer will be prepared based on the financial data..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
              </div>
              <button
                onClick={() => setWorkflowTab('deliver')}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue to Delivery →
              </button>
            </div>
          )}

          {/* Deliver Tab */}
          {workflowTab === 'deliver' && (
            <PeriodDeliveryChecklist
              periodId={period.id}
              tier={tier}
              periodLabel={period.period_label || 'Current Period'}
              onComplete={() => {
                // Refresh period data
                loadPeriodDetail(engagement.id, period.id);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-slate-600">Something went wrong. Please try again.</p>
        <button
          onClick={() => setView('list')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Engagements
        </button>
      </div>
    </div>
  );
}

export default MAPortalPage;

