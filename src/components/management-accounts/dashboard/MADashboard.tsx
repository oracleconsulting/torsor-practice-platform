'use client';

import { useState } from 'react';
import { 
  Edit3, 
  Eye, 
  Save, 
  X,
  ChevronDown,
  Loader2,
  Building2,
  Calendar,
  Crown,
  LayoutDashboard
} from 'lucide-react';
import { useMADashboard } from '../../../hooks/useMADashboard';
import { useEditMode } from '../../../hooks/useEditMode';
import { TrueCashWaterfall } from './TrueCashWaterfall';
import { CashForecastSection } from './CashForecastSection';
import { DashboardInsightCard } from './DashboardInsightCard';
import { SectionVisibilityPanel } from './SectionVisibilityPanel';
import type { TierType } from '../../../types/ma';

interface MADashboardProps {
  engagementId: string;
  periodId: string;
  isAdmin?: boolean;
}

const TIER_CONFIG: Record<TierType, { label: string; color: string; showForecast: boolean; showProfitability: boolean }> = {
  clarity: { label: 'Clarity', color: 'bg-blue-600', showForecast: false, showProfitability: false },
  foresight: { label: 'Foresight', color: 'bg-indigo-600', showForecast: true, showProfitability: true },
  strategic: { label: 'Strategic', color: 'bg-purple-600', showForecast: true, showProfitability: true },
};

// Map legacy tier names to new structure
const LEGACY_TIER_MAP: Record<string, TierType> = {
  bronze: 'clarity',
  silver: 'foresight',
  gold: 'foresight',
  platinum: 'strategic',
  clarity: 'clarity',
  foresight: 'foresight',
  strategic: 'strategic',
};

function getTierConfig(tier: string | undefined | null) {
  if (!tier) return TIER_CONFIG.clarity;
  const mappedTier = LEGACY_TIER_MAP[tier.toLowerCase()] || 'clarity';
  return TIER_CONFIG[mappedTier];
}

export function MADashboard({ engagementId, periodId, isAdmin = false }: MADashboardProps) {
  const { 
    engagement, 
    period, 
    reportConfig, 
    chartData,
    insights,
    scenarios,
    financialData,
    kpis,
    loading,
    error,
    refetch 
  } = useMADashboard(engagementId, periodId);
  
  const { 
    editMode, 
    setEditMode,
    sectionOrder,
    sectionsVisible,
    toggleSectionVisibility,
    reorderSection,
    hasChanges,
    saving,
    saveConfig 
  } = useEditMode(periodId, reportConfig);

  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [showVisibilityPanel, setShowVisibilityPanel] = useState(false);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Failed to load dashboard</h2>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!engagement || !period) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Report not found</p>
      </div>
    );
  }

  const tier = engagement.tier || 'clarity';
  const tierConfig = getTierConfig(tier);

  // Toggle insight expansion
  const toggleInsightExpanded = (insightId: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      if (next.has(insightId)) next.delete(insightId);
      else next.add(insightId);
      return next;
    });
  };

  // Calculate true cash data from financial data
  const trueCashData = financialData ? {
    bankBalance: financialData.cash_at_bank || 0,
    trueCash: financialData.true_cash || 0,
    breakdown: {
      vatLiability: financialData.vat_liability || 0,
      payeLiability: financialData.paye_liability || 0,
      corporationTax: financialData.corporation_tax_liability || 0,
      committedPayments: 0,
      confirmedReceivables: 0,
    },
    runwayMonths: financialData.true_cash_runway_months || 0,
    monthlyBurn: financialData.monthly_operating_costs || 0,
  } : null;

  // Generate forecast data (simplified - would come from chart_data in production)
  const forecastData = chartData.cash_forecast?.data_points || generateSimpleForecast(
    financialData?.true_cash || 0,
    financialData?.monthly_operating_costs || 0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Visibility Panel */}
      {showVisibilityPanel && (
        <SectionVisibilityPanel
          sections={sectionOrder}
          visibility={sectionsVisible}
          onToggle={toggleSectionVisibility}
          onReorder={reorderSection}
          onClose={() => setShowVisibilityPanel(false)}
          tier={tier}
        />
      )}

      {/* Edit Toolbar - Fixed at top when editing */}
      {isAdmin && editMode && (
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Edit3 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-slate-700">Edit Mode</span>
              {hasChanges && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVisibilityPanel(true)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Sections
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={saveConfig}
                disabled={saving || !hasChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <Calendar className="w-4 h-4" />
                {period.period_label || 'Current Period'}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Management Report</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-4 h-4" />
                  {engagement.client?.name || 'Client'}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${tierConfig.color}`}>
                  <Crown className="w-3 h-3 inline mr-1" />
                  {tierConfig.label}
                </span>
              </div>
            </div>
            
            {isAdmin && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Report
              </button>
            )}
          </div>
        </div>

        {/* Tuesday Question Banner */}
        {sectionsVisible.tuesday_question && period.tuesday_question && (
          <TuesdayQuestionBanner
            question={period.tuesday_question}
            answerShort={period.tuesday_answer_short}
            answerDetail={period.tuesday_answer_detail}
            editMode={editMode}
          />
        )}

        {/* Main Content Grid */}
        <div className="space-y-6 mt-6">
          {/* True Cash Section */}
          {sectionsVisible.true_cash && trueCashData && (
            <TrueCashWaterfall
              bankBalance={trueCashData.bankBalance}
              trueCash={trueCashData.trueCash}
              breakdown={trueCashData.breakdown}
              runwayMonths={trueCashData.runwayMonths}
              monthlyBurn={trueCashData.monthlyBurn}
              editMode={editMode}
            />
          )}

          {/* Cash Forecast (Gold/Platinum only) */}
          {sectionsVisible.cash_forecast && tierConfig.showForecast && (
            <CashForecastSection
              forecastData={forecastData}
              scenarios={scenarios}
              activeScenario={activeScenario}
              onScenarioChange={setActiveScenario}
              monthlyBurn={financialData?.monthly_operating_costs || 0}
              currentCash={financialData?.true_cash || 0}
              editMode={editMode}
            />
          )}

          {/* Insights Section */}
          {sectionsVisible.insights && insights.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Insights & Recommendations</h3>
                  <p className="text-sm text-slate-500">{insights.length} insights this period</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {insights.map(insight => (
                  <DashboardInsightCard
                    key={insight.id}
                    insight={insight}
                    isExpanded={expandedInsights.has(insight.id)}
                    onToggle={() => toggleInsightExpanded(insight.id)}
                    onScenarioClick={setActiveScenario}
                    editMode={editMode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* KPIs Section */}
          {sectionsVisible.kpis && kpis.length > 0 && (
            <KPIGrid kpis={kpis} editMode={editMode} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TUESDAY QUESTION BANNER
// ============================================

function TuesdayQuestionBanner({ 
  question, 
  answerShort, 
  answerDetail,
  editMode 
}: { 
  question: string; 
  answerShort?: string; 
  answerDetail?: string;
  editMode?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-purple-200 text-sm font-medium mb-2">Your Question This Month</div>
          <h2 className="text-xl font-semibold mb-3">"{question}"</h2>
          
          {answerShort && (
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="font-medium">{answerShort}</p>
              
              {answerDetail && (
                <>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-purple-200 text-sm mt-2 hover:text-white flex items-center gap-1"
                  >
                    {expanded ? 'Show less' : 'Read more'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {expanded && (
                    <p className="text-purple-100 text-sm mt-3 whitespace-pre-wrap">{answerDetail}</p>
                  )}
                </>
              )}
            </div>
          )}
          
          {!answerShort && (
            <div className="text-purple-200 text-sm italic">Answer pending...</div>
          )}
        </div>
        
        {editMode && (
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// KPI GRID
// ============================================

function KPIGrid({ kpis, editMode: _editMode }: { kpis: any[]; editMode?: boolean }) {
  const formatValue = (kpi: any) => {
    const value = kpi.value;
    // Add formatting based on kpi type
    return value?.toLocaleString() || '—';
  };

  const getRAGColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'green': return 'border-emerald-400 bg-emerald-50';
      case 'amber': return 'border-amber-400 bg-amber-50';
      case 'red': return 'border-red-400 bg-red-50';
      default: return 'border-slate-200 bg-white';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Key Performance Indicators</h3>
          <p className="text-sm text-slate-500">{kpis.length} KPIs tracked</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div 
            key={kpi.id || kpi.kpi_code}
            className={`p-4 rounded-lg border-2 ${getRAGColor(kpi.rag_status)}`}
          >
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              {kpi.kpi_code?.replace(/_/g, ' ')}
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {formatValue(kpi)}
            </div>
            {kpi.target_value && (
              <div className="text-xs text-slate-500 mt-1">
                Target: {kpi.target_value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// SKELETON LOADER
// ============================================

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-12 bg-slate-200 rounded-lg animate-pulse w-1/3" />
        <div className="h-6 bg-slate-200 rounded animate-pulse w-1/4" />
        <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER: Generate simple forecast data
// ============================================

function generateSimpleForecast(currentCash: number, monthlyBurn: number): any[] {
  const data = [];
  let cash = currentCash;
  const today = new Date();
  
  for (let i = 0; i < 13; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + (i * 7)); // Weekly
    data.push({
      period: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      date: date.toISOString(),
      baseline: Math.max(0, cash),
    });
    cash -= monthlyBurn / 4; // Weekly burn
  }
  
  return data;
}

