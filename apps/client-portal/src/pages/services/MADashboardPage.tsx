'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Target,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Logo } from '@/components/Logo';

// ============================================================================
// CLIENT MA DASHBOARD - ELEVATED VISUAL EXPERIENCE
// ============================================================================
// Interactive dashboard with waterfall charts, forecasts, and insights
// ============================================================================

interface MAEngagement {
  id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  client_id: string;
}

interface MAPeriod {
  id: string;
  period_start: string;
  period_end: string;
  period_label: string;
  status: string;
  tuesday_question?: string;
  tuesday_answer?: string;
}

interface MAFinancialData {
  cash_at_bank: number;
  vat_liability: number;
  paye_liability: number;
  corporation_tax_liability: number;
  true_cash: number;
  true_cash_runway_months: number;
  monthly_operating_costs: number;
  revenue: number;
  gross_profit: number;
  net_profit: number;
}

interface MAInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
  data_points?: string[];
  implications?: string;
  show_to_client: boolean;
}

interface MAKPIValue {
  kpi_code: string;
  value: number;
  formatted_value: string;
  rag_status: 'red' | 'amber' | 'green';
  trend?: 'up' | 'down' | 'stable';
  kpi_definition?: {
    name: string;
    description: string;
    unit: string;
  };
}

interface MAScenario {
  id: string;
  name: string;
  description?: string;
  scenario_type: string;
  scenario_color: string;
  is_featured: boolean;
  impact_summary?: string;
  impact_on_cash?: number;
  impact_on_runway?: number;
}

const TIER_BADGES = {
  bronze: { label: 'Bronze', color: 'bg-amber-600', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
  silver: { label: 'Silver', color: 'bg-slate-400', textColor: 'text-slate-600', bgLight: 'bg-slate-50' },
  gold: { label: 'Gold', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50' },
  platinum: { label: 'Platinum', color: 'bg-slate-700', textColor: 'text-slate-700', bgLight: 'bg-slate-100' },
};

const PRIORITY_STYLES = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  high: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  medium: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  low: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-800' },
};

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  }
  return `£${value.toLocaleString()}`;
};

export default function MADashboardPage() {
  const { clientSession } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<MAEngagement | null>(null);
  const [period, setPeriod] = useState<MAPeriod | null>(null);
  const [financialData, setFinancialData] = useState<MAFinancialData | null>(null);
  const [insights, setInsights] = useState<MAInsight[]>([]);
  const [kpis, setKpis] = useState<MAKPIValue[]>([]);
  const [scenarios, setScenarios] = useState<MAScenario[]>([]);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [clientSession]);

  const loadDashboardData = async () => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }

    try {
      console.log('[MADashboard] Loading for client:', clientSession.clientId);
      
      // 1. Get engagement - check BOTH ma_engagements and bi_engagements
      let engagementData = null;
      let engagementSource = '';
      
      // Try ma_engagements first
      const { data: maEngagement } = await supabase
        .from('ma_engagements')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (maEngagement) {
        engagementData = maEngagement;
        engagementSource = 'ma_engagements';
      } else {
        // Try bi_engagements (renamed service)
        const { data: biEngagement } = await supabase
          .from('bi_engagements')
          .select('*')
          .eq('client_id', clientSession.clientId)
          .eq('status', 'active')
          .maybeSingle();
        
        if (biEngagement) {
          engagementData = biEngagement;
          engagementSource = 'bi_engagements';
        }
      }
      
      console.log('[MADashboard] Engagement found:', { engagementData, source: engagementSource });

      if (!engagementData) {
        console.log('[MADashboard] No active engagement found');
        setLoading(false);
        return;
      }
      setEngagement(engagementData);

      // 2. Get latest delivered period - check BOTH ma_periods and bi_periods
      let periodData = null;
      let periodSource = '';
      
      // Try ma_periods first
      const { data: maPeriod } = await supabase
        .from('ma_periods')
        .select('*')
        .eq('engagement_id', engagementData.id)
        .eq('status', 'delivered')
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (maPeriod) {
        periodData = maPeriod;
        periodSource = 'ma_periods';
      } else {
        // Try bi_periods (renamed service)
        const { data: biPeriod } = await supabase
          .from('bi_periods')
          .select('*')
          .eq('engagement_id', engagementData.id)
          .eq('status', 'delivered')
          .order('period_end', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (biPeriod) {
          periodData = biPeriod;
          periodSource = 'bi_periods';
        }
      }
      
      console.log('[MADashboard] Period found:', { periodData, source: periodSource });

      if (!periodData) {
        console.log('[MADashboard] No delivered period found');
        setLoading(false);
        return;
      }
      setPeriod(periodData);

      // 3. Fetch all data in parallel - check both MA and BI tables
      const useBI = periodSource === 'bi_periods';
      const financialTable = useBI ? 'bi_financial_data' : 'ma_financial_data';
      const insightsTable = useBI ? 'bi_insights' : 'ma_insights';
      const kpisTable = useBI ? 'bi_kpi_values' : 'ma_kpi_values';
      const kpiDefTable = useBI ? 'bi_kpi_definitions' : 'ma_kpi_definitions';
      const scenariosTable = useBI ? 'bi_scenarios' : 'ma_scenarios';
      
      console.log('[MADashboard] Fetching data from:', { financialTable, insightsTable, kpisTable, scenariosTable });
      
      const [financialRes, insightsRes, kpisRes, scenariosRes] = await Promise.all([
        supabase
          .from(financialTable)
          .select('*')
          .eq('period_id', periodData.id)
          .maybeSingle(),
        supabase
          .from(insightsTable)
          .select('*')
          .eq('period_id', periodData.id)
          .eq('status', 'approved')
          .eq('show_to_client', true)
          .order('display_order', { ascending: true }),
        supabase
          .from(kpisTable)
          .select(`
            *,
            kpi_definition:${kpiDefTable}(*)
          `)
          .eq('period_id', periodData.id),
        supabase
          .from(scenariosTable)
          .select('*')
          .eq('engagement_id', engagementData.id)
          .eq('is_featured', true)
      ]);

      console.log('[MADashboard] Data loaded:', {
        financial: !!financialRes.data,
        insights: insightsRes.data?.length || 0,
        kpis: kpisRes.data?.length || 0,
        scenarios: scenariosRes.data?.length || 0
      });

      if (financialRes.data) setFinancialData(financialRes.data);
      if (insightsRes.data) setInsights(insightsRes.data);
      if (kpisRes.data) setKpis(kpisRes.data);
      if (scenariosRes.data) setScenarios(scenariosRes.data);

    } catch (err) {
      console.error('[MADashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInsight = (id: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!engagement || !period) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">No Report Available</h1>
            <p className="text-slate-600">Your management accounts dashboard is being prepared.</p>
          </div>
        </div>
      </div>
    );
  }

  const tier = engagement.tier || 'bronze';
  const tierBadge = TIER_BADGES[tier];
  const showForecasting = tier === 'gold' || tier === 'platinum';

  // Build waterfall data
  const waterfallItems = financialData ? [
    { label: 'Bank Balance', value: financialData.cash_at_bank, type: 'start' as const },
    { label: 'VAT Liability', value: -financialData.vat_liability, type: 'subtract' as const },
    { label: 'PAYE/NI', value: -financialData.paye_liability, type: 'subtract' as const },
    { label: 'Corp Tax', value: -financialData.corporation_tax_liability, type: 'subtract' as const },
    { label: 'True Cash', value: financialData.true_cash, type: 'total' as const },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-slate-900">Financial Dashboard</h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${tierBadge.color}`}>
                    {tierBadge.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{period.period_label}</p>
              </div>
            </div>
            <Logo />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Tuesday Question Section */}
        {period.tuesday_question && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl overflow-hidden shadow-xl text-white">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
              <HelpCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Your Question This Month</h2>
            </div>
            <div className="p-6">
              <p className="text-xl font-medium mb-4 italic">"{period.tuesday_question}"</p>
              {period.tuesday_answer && (
                <div className="bg-white/10 rounded-xl p-4 border-l-4 border-white/50">
                  <p className="text-blue-100 text-sm mb-1">Our Analysis:</p>
                  <p className="text-lg leading-relaxed">{period.tuesday_answer}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* True Cash Waterfall */}
        {financialData && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">True Cash Position</h2>
                  <p className="text-sm text-slate-500">What you can actually spend</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Runway</p>
                <p className={`text-lg font-bold ${
                  financialData.true_cash_runway_months < 2 ? 'text-red-600' :
                  financialData.true_cash_runway_months < 4 ? 'text-amber-600' :
                  'text-emerald-600'
                }`}>
                  {financialData.true_cash_runway_months.toFixed(1)} months
                </p>
              </div>
            </div>
            
            <div className="p-6">
              {/* Waterfall Chart */}
              <div className="flex items-end justify-between gap-2 h-48 mb-6">
                {waterfallItems.map((item, index) => {
                  const maxValue = Math.max(...waterfallItems.map(i => Math.abs(i.value)));
                  const height = Math.abs(item.value) / maxValue * 100;
                  const isNegative = item.value < 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full h-40 flex flex-col justify-end relative">
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            item.type === 'start' ? 'bg-slate-600' :
                            item.type === 'total' ? (item.value >= 0 ? 'bg-emerald-500' : 'bg-red-500') :
                            isNegative ? 'bg-red-400' : 'bg-emerald-400'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                        <div className={`absolute -top-6 w-full text-center text-sm font-semibold ${
                          item.type === 'total' ? (item.value >= 0 ? 'text-emerald-600' : 'text-red-600') :
                          isNegative ? 'text-red-600' : 'text-slate-700'
                        }`}>
                          {formatCurrency(item.value)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-center">{item.label}</p>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Bank Shows</p>
                  <p className="text-xl font-bold text-slate-700">{formatCurrency(financialData.cash_at_bank)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500">Obligations</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(-(financialData.vat_liability + financialData.paye_liability + financialData.corporation_tax_liability))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500">Spendable</p>
                  <p className={`text-xl font-bold ${financialData.true_cash >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(financialData.true_cash)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Forecast (Gold/Platinum only) */}
        {showForecasting && financialData && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Cash Forecast</h2>
                  <p className="text-sm text-slate-500">13-week projection</p>
                </div>
              </div>
              {scenarios.length > 0 && (
                <div className="flex items-center gap-2">
                  {scenarios.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveScenario(activeScenario === s.id ? null : s.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeScenario === s.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6">
              {/* Simplified forecast visualization */}
              <div className="h-48 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">Interactive forecast chart</p>
                  <p className="text-sm text-slate-400">Coming soon in enhanced view</p>
                </div>
              </div>
              
              {/* Scenario Impact Cards */}
              {activeScenario && scenarios.find(s => s.id === activeScenario) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        {scenarios.find(s => s.id === activeScenario)?.name}
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {scenarios.find(s => s.id === activeScenario)?.impact_summary}
                      </p>
                    </div>
                    <div className="text-right">
                      {scenarios.find(s => s.id === activeScenario)?.impact_on_cash && (
                        <p className={`text-lg font-bold ${
                          (scenarios.find(s => s.id === activeScenario)?.impact_on_cash || 0) >= 0 
                            ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(scenarios.find(s => s.id === activeScenario)?.impact_on_cash || 0)}
                        </p>
                      )}
                      {scenarios.find(s => s.id === activeScenario)?.impact_on_runway && (
                        <p className="text-sm text-blue-600">
                          {(scenarios.find(s => s.id === activeScenario)?.impact_on_runway || 0) >= 0 ? '+' : ''}
                          {scenarios.find(s => s.id === activeScenario)?.impact_on_runway} months runway
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Insights */}
        {insights.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Key Insights</h2>
            </div>
            
            <div className="space-y-3">
              {insights.map((insight) => {
                const style = PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.medium;
                const isExpanded = expandedInsights.has(insight.id);
                
                return (
                  <div
                    key={insight.id}
                    className={`${style.bg} border ${style.border} rounded-xl overflow-hidden`}
                  >
                    <button
                      onClick={() => toggleInsight(insight.id)}
                      className="w-full px-5 py-4 flex items-start justify-between text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${style.badge}`}>
                            {insight.priority.toUpperCase()}
                          </span>
                          <span className="text-sm text-slate-500">{insight.category}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{insight.description}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-200/50 pt-4">
                        {insight.implications && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Implications</p>
                            <p className="text-slate-600">{insight.implications}</p>
                          </div>
                        )}
                        {insight.data_points && insight.data_points.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Supporting Data</p>
                            <ul className="space-y-1">
                              {insight.data_points.map((dp, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {dp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insight.recommendation && (
                          <div className="bg-white/50 rounded-lg p-4 border border-slate-200">
                            <p className="text-sm font-medium text-slate-700 mb-1">Recommendation</p>
                            <p className="text-slate-800">{insight.recommendation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* KPIs Grid */}
        {kpis.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Key Performance Indicators</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => {
                  const ragColors = {
                    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
                    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
                    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                  };
                  const colors = ragColors[kpi.rag_status] || ragColors.green;
                  
                  return (
                    <div
                      key={kpi.kpi_code}
                      className={`${colors.bg} border ${colors.border} rounded-xl p-4`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-600 font-medium">
                          {kpi.kpi_definition?.name || kpi.kpi_code}
                        </p>
                        <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                      </div>
                      <div className="flex items-end justify-between">
                        <p className={`text-2xl font-bold ${colors.text}`}>
                          {kpi.formatted_value}
                        </p>
                        {kpi.trend && (
                          <div className="flex items-center gap-1 text-sm">
                            {kpi.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                            {kpi.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                            {kpi.trend === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white text-center">
          <h3 className="text-xl font-semibold mb-2">Questions about your report?</h3>
          <p className="text-slate-300 mb-6">Schedule a call to discuss your results and next steps.</p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
              Schedule a Call
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-white/30 rounded-xl font-medium hover:bg-white/10 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

