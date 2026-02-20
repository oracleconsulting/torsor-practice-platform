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
  Calculator,
  X,
  Loader2,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  AdminKPIManager,
  ClientReportPreview,
  DocumentUploader,
  FinancialDataEntry,
  InsightsReviewPanel,
  PeriodDeliveryChecklist,
  TrueCashCard,
  WatchListPanel
} from '../../components/management-accounts';
import { MADashboard } from '../../components/management-accounts/dashboard';
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
  clarity: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  foresight: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  strategic: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
};

// Map legacy tier names to new tier names
const LEGACY_TIER_MAP: Record<string, TierType> = {
  'bronze': 'clarity',
  'silver': 'foresight', 
  'gold': 'strategic',
  'platinum': 'strategic',
  'clarity': 'clarity',
  'foresight': 'foresight',
  'strategic': 'strategic',
};

// Safe tier color getter that handles legacy tier names (v2 - fixes undefined access)
function getTierColors(tier: string | undefined | null) {
  if (!tier) return TIER_COLORS.clarity;
  const mappedTier = LEGACY_TIER_MAP[tier] || 'clarity';
  return TIER_COLORS[mappedTier];
}

// Safe tier display name getter (v2 - handles null/undefined)
function getTierDisplayName(tier: string | undefined | null) {
  if (!tier) return 'Clarity';
  const mappedTier = LEGACY_TIER_MAP[tier] || 'clarity';
  return mappedTier.charAt(0).toUpperCase() + mappedTier.slice(1);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-100' },
  active: { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-amber-600', bg: 'bg-amber-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' },
};

// Safe accessor for status config with fallback (v2 - handles null/undefined)
function getStatusConfig(status: string | undefined | null) {
  if (!status) return STATUS_CONFIG.pending;
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

const PERIOD_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-100', icon: <Clock className="h-3 w-3" /> },
  data_received: { label: 'Data Received', color: 'text-blue-600', bg: 'bg-blue-100', icon: <FileText className="h-3 w-3" /> },
  processing: { label: 'Processing', color: 'text-amber-600', bg: 'bg-amber-100', icon: <Edit className="h-3 w-3" /> },
  review: { label: 'Ready for Review', color: 'text-purple-600', bg: 'bg-purple-100', icon: <Eye className="h-3 w-3" /> },
  published: { label: 'Published', color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle2 className="h-3 w-3" /> },
  superseded: { label: 'Superseded', color: 'text-slate-400', bg: 'bg-slate-50', icon: <Clock className="h-3 w-3" /> },
};

type WorkflowTab = 'upload' | 'data' | 'kpis' | 'insights' | 'tuesday' | 'preview' | 'deliver';

const WORKFLOW_STEPS: { tab: WorkflowTab; label: string; icon: React.ReactNode }[] = [
  { tab: 'upload', label: 'Upload Docs', icon: <Upload className="h-4 w-4" /> },
  { tab: 'data', label: 'Financial Data', icon: <Calculator className="h-4 w-4" /> },
  { tab: 'kpis', label: 'KPIs', icon: <BarChart3 className="h-4 w-4" /> },
  { tab: 'insights', label: 'Insights', icon: <Lightbulb className="h-4 w-4" /> },
  { tab: 'tuesday', label: 'Tuesday Q', icon: <HelpCircle className="h-4 w-4" /> },
  { tab: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" /> },
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
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const [changingTier, setChangingTier] = useState(false);
  
  // Period detail state
  const [period, setPeriod] = useState<MAPeriod | null>(null);
  const [_periodDocuments, setPeriodDocuments] = useState<MADocument[]>([]);
  const [periodFinancialData, setPeriodFinancialData] = useState<MAFinancialData | null>(null);
  const [insights, setInsights] = useState<MAInsight[]>([]);
  const [kpis, setKpis] = useState<MAKPIValue[]>([]);
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>('upload');
  const [previewMode, setPreviewMode] = useState<'simple' | 'dashboard'>('simple');
  
  // New Period Modal state
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [newPeriodForm, setNewPeriodForm] = useState({
    periodStart: '',
    periodEnd: '',
    periodLabel: '',
  });
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  
  // Tuesday Question state
  const [tuesdayQuestion, setTuesdayQuestion] = useState('');
  const [tuesdayAnswer, setTuesdayAnswer] = useState('');
  const [savingTuesday, setSavingTuesday] = useState(false);

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

  // Sync Tuesday Question state with period
  useEffect(() => {
    if (period) {
      setTuesdayQuestion(period.tuesday_question || '');
      setTuesdayAnswer(period.tuesday_answer || '');
    }
  }, [period]);

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

      setPeriodDocuments(docsData || []);

      // Load financial data
      const { data: finData } = await supabase
        .from('ma_financial_data')
        .select('*')
        .eq('period_id', perId)
        .single();

      setPeriodFinancialData(finData);

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
  // PERIOD CREATION
  // ============================================================================

  const createPeriod = async () => {
    if (!engagement || !newPeriodForm.periodStart || !newPeriodForm.periodEnd) {
      alert('Please fill in all required fields');
      return;
    }

    setCreatingPeriod(true);
    try {
      // Generate a label if not provided (use end date as periods are named by end month)
      const endDate = new Date(newPeriodForm.periodEnd);
      const label = newPeriodForm.periodLabel || 
        `${endDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

      const { data: newPeriod, error } = await supabase
        .from('ma_periods')
        .insert({
          engagement_id: engagement.id,
          period_start: newPeriodForm.periodStart,
          period_end: newPeriodForm.periodEnd,
          period_label: label,
          period_type: engagement.frequency === 'quarterly' ? 'quarter' : 'month',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Add to periods list
      setPeriods(prev => [newPeriod, ...prev]);
      
      // Reset form and close modal
      setNewPeriodForm({ periodStart: '', periodEnd: '', periodLabel: '' });
      setShowNewPeriodModal(false);
      
      // Navigate to the new period
      navigateToPeriod(engagement.id, newPeriod.id);
    } catch (error: any) {
      console.error('[MA Portal] Error creating period:', error);
      alert('Failed to create period: ' + error.message);
    } finally {
      setCreatingPeriod(false);
    }
  };

  const getDefaultPeriodDates = () => {
    // Default to previous month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
      start: lastMonth.toISOString().split('T')[0],
      end: lastDayOfLastMonth.toISOString().split('T')[0],
    };
  };

  const openNewPeriodModal = () => {
    const defaults = getDefaultPeriodDates();
    setNewPeriodForm({
      periodStart: defaults.start,
      periodEnd: defaults.end,
      periodLabel: '',
    });
    setShowNewPeriodModal(true);
  };

  // ============================================================================
  // TUESDAY QUESTION
  // ============================================================================

  const saveTuesdayQuestion = async () => {
    if (!period) return;
    
    setSavingTuesday(true);
    try {
      const { error } = await supabase
        .from('ma_periods')
        .update({
          tuesday_question: tuesdayQuestion,
          tuesday_answer: tuesdayAnswer,
        })
        .eq('id', period.id);

      if (error) throw error;

      // Update local period state
      setPeriod(prev => prev ? { ...prev, tuesday_question: tuesdayQuestion, tuesday_answer: tuesdayAnswer } : null);
    } catch (error: any) {
      console.error('[MA Portal] Error saving Tuesday Question:', error);
      alert('Failed to save: ' + error.message);
    } finally {
      setSavingTuesday(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Change engagement tier
  const changeTier = async (newTier: TierType) => {
    if (!engagement || changingTier) return;
    
    setChangingTier(true);
    try {
      // Try bi_engagements first, then ma_engagements
      let result = await supabase
        .from('bi_engagements')
        .update({ tier: newTier })
        .eq('id', engagement.id);
      
      if (result.error) {
        result = await supabase
          .from('ma_engagements')
          .update({ tier: newTier })
          .eq('id', engagement.id);
      }
      
      if (result.error) throw result.error;
      
      // Update local state
      setEngagement({ ...engagement, tier: newTier });
      
      // Also update in the engagements list
      setEngagements(prev => prev.map(e => 
        e.id === engagement.id ? { ...e, tier: newTier } : e
      ));
      
      setShowTierDropdown(false);
    } catch (err) {
      console.error('Failed to change tier:', err);
      alert('Failed to change tier. Please try again.');
    } finally {
      setChangingTier(false);
    }
  };

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

  const tier = engagement?.tier as TierType || 'clarity';

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
                <h1 className="text-2xl font-bold text-slate-800">Business Intelligence Portal</h1>
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
              <option value="clarity">Clarity</option>
              <option value="foresight">Foresight</option>
              <option value="strategic">Strategic</option>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColors(eng.tier).bg} ${getTierColors(eng.tier).text}`}>
                          {getTierDisplayName(eng.tier)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(eng.status).bg} ${getStatusConfig(eng.status).color}`}>
                          {getStatusConfig(eng.status).label}
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
                  
                  {/* Tier Selector Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTierDropdown(!showTierDropdown)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getTierColors(engagement.tier).bg} ${getTierColors(engagement.tier).text} hover:opacity-80 transition-opacity cursor-pointer`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {getTierDisplayName(engagement.tier)}
                      <ChevronDown className={`w-3 h-3 transition-transform ${showTierDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showTierDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowTierDropdown(false)} 
                        />
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
                          <div className="p-2 border-b border-slate-100 bg-slate-50">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                              Change Service Tier
                            </p>
                          </div>
                          <div className="p-1">
                            {(['clarity', 'foresight', 'strategic'] as const).map((tier) => {
                              const isCurrentTier = (LEGACY_TIER_MAP[engagement.tier] || engagement.tier) === tier;
                              return (
                                <button
                                  key={tier}
                                  onClick={() => !isCurrentTier && changeTier(tier)}
                                  disabled={changingTier || isCurrentTier}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                                    isCurrentTier 
                                      ? 'bg-blue-50 cursor-default' 
                                      : 'hover:bg-slate-50 cursor-pointer'
                                  }`}
                                >
                                  <span className={`w-2.5 h-2.5 rounded-full ${
                                    tier === 'clarity' ? 'bg-blue-500' :
                                    tier === 'foresight' ? 'bg-indigo-500' :
                                    'bg-purple-500'
                                  }`} />
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${isCurrentTier ? 'text-blue-700' : 'text-slate-700'}`}>
                                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {tier === 'clarity' && 'Essential financial clarity'}
                                      {tier === 'foresight' && 'Forecasting & scenarios'}
                                      {tier === 'strategic' && 'Full advisory support'}
                                    </p>
                                  </div>
                                  {isCurrentTier && (
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {changingTier && (
                            <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-xs text-slate-600">Updating...</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
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
                <button 
                  onClick={openNewPeriodModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
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

        {/* New Period Modal */}
        {showNewPeriodModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Create New Period</h2>
                <button
                  onClick={() => setShowNewPeriodModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Period Start *
                    </label>
                    <input
                      type="date"
                      value={newPeriodForm.periodStart}
                      onChange={(e) => setNewPeriodForm(prev => ({ ...prev, periodStart: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Period End *
                    </label>
                    <input
                      type="date"
                      value={newPeriodForm.periodEnd}
                      onChange={(e) => setNewPeriodForm(prev => ({ ...prev, periodEnd: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Period Label <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newPeriodForm.periodLabel}
                    onChange={(e) => setNewPeriodForm(prev => ({ ...prev, periodLabel: e.target.value }))}
                    placeholder="e.g., December 2025"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Leave blank to auto-generate from end date
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewPeriodModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={createPeriod}
                  disabled={creatingPeriod || !newPeriodForm.periodStart || !newPeriodForm.periodEnd}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creatingPeriod ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Period
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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
            <FinancialDataEntry
              periodId={period.id}
              engagementId={engagement.id}
              existingData={periodFinancialData}
              onSave={() => {
                loadPeriodDetail(engagement.id, period.id);
              }}
              onContinue={() => setWorkflowTab('kpis')}
            />
          )}

          {/* KPIs Tab */}
          {workflowTab === 'kpis' && (
            <AdminKPIManager
              engagementId={engagement.id}
              periodId={period.id}
              tier={tier}
              financialData={periodFinancialData}
              existingKpis={kpis}
              onSave={(updatedKpis) => setKpis(updatedKpis)}
              onContinue={() => setWorkflowTab('insights')}
            />
          )}

          {/* Insights Tab */}
          {workflowTab === 'insights' && (
            <InsightsReviewPanel
              periodId={period.id}
              engagementId={engagement.id}
              tier={tier}
              clientName={engagement.client?.name || 'Client'}
              financialData={periodFinancialData}
              kpis={kpis}
              tuesdayQuestion={tuesdayQuestion}
              insights={insights}
              onInsightsUpdate={setInsights}
              onContinue={() => setWorkflowTab('tuesday')}
            />
          )}

          {/* Tuesday Question Tab */}
          {workflowTab === 'tuesday' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Tuesday Question</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      The one question the client needs answered this period
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      The Question
                    </label>
                    <input
                      type="text"
                      value={tuesdayQuestion}
                      onChange={(e) => setTuesdayQuestion(e.target.value)}
                      placeholder="e.g., What's our cash runway if we lose our biggest client?"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Based on client's Tuesday Question from assessment: "{period.tuesday_question || 'Not specified'}"
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      The Answer
                    </label>
                    <textarea
                      value={tuesdayAnswer}
                      onChange={(e) => setTuesdayAnswer(e.target.value)}
                      placeholder="Based on this period's financial data..."
                      rows={6}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={saveTuesdayQuestion}
                    disabled={savingTuesday}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingTuesday ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Save Tuesday Q
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setWorkflowTab('preview')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Continue to Preview →
                  </button>
                </div>
              </div>

              {/* Suggestions based on KPIs */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <h3 className="font-medium text-purple-800 mb-2">Question Suggestions</h3>
                <ul className="space-y-2 text-sm text-purple-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    What's our true cash position vs bank balance?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    How many months runway do we have at current burn rate?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Can we afford to hire the new role we're planning?
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    What happens to cash flow if our biggest client delays payment?
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {workflowTab === 'preview' && (
            <div className="space-y-6">
              {/* Preview Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setPreviewMode('simple')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      previewMode === 'simple'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Simple Preview
                  </button>
                  <button
                    onClick={() => setPreviewMode('dashboard')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      previewMode === 'dashboard'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Enhanced Dashboard
                  </button>
                </div>
                <span className="text-sm text-slate-500">
                  {previewMode === 'simple' 
                    ? 'Basic report layout' 
                    : 'Interactive dashboard with visualizations'}
                </span>
              </div>

              {/* Simple Preview */}
              {previewMode === 'simple' && (
                <ClientReportPreview
                  clientName={engagement.client?.name || 'Client'}
                  periodLabel={period.period_label || 'Current Period'}
                  tier={tier}
                  financialData={periodFinancialData}
                  kpis={kpis}
                  insights={insights}
                  tuesdayQuestion={tuesdayQuestion}
                  tuesdayAnswer={tuesdayAnswer}
                  onEditSection={(section) => {
                    switch (section) {
                      case 'financial':
                        setWorkflowTab('data');
                        break;
                      case 'kpis':
                        setWorkflowTab('kpis');
                        break;
                      case 'insights':
                        setWorkflowTab('insights');
                        break;
                      case 'tuesday':
                        setWorkflowTab('tuesday');
                        break;
                    }
                  }}
                />
              )}

              {/* Enhanced Dashboard Preview */}
              {previewMode === 'dashboard' && (
                <div className="bg-slate-100 rounded-xl overflow-hidden -mx-8 px-8 py-6">
                  <MADashboard
                    engagementId={engagement.id}
                    periodId={period.id}
                    isAdmin={true}
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setWorkflowTab('deliver')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Continue to Delivery →
                </button>
              </div>
            </div>
          )}

          {/* Deliver Tab */}
          {workflowTab === 'deliver' && (
            <PeriodDeliveryChecklist
              periodId={period.id}
              engagementId={engagement.id}
              tier={tier}
              periodLabel={period.period_label || 'Current Period'}
              financialData={periodFinancialData}
              kpis={kpis}
              insights={insights}
              tuesdayQuestion={tuesdayQuestion}
              onComplete={() => {
                // Refresh period data and show success
                loadPeriodDetail(engagement.id, period.id);
                alert('Report delivered successfully! The client can now view it.');
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

