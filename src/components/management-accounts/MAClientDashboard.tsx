'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  Download, 
  TrendingUp,
  AlertTriangle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TrueCashCard } from './TrueCashCard';
import { TuesdayQuestionDisplay } from './TuesdayQuestionDisplay';
import { InsightCard } from './InsightCard';
import { formatTrueCashForDisplay, calculateTrueCash } from '../../services/ma/true-cash';
import type { 
  MAEngagement, 
  MAPeriod, 
  MAFinancialData, 
  MAInsight, 
  MAKPIValue
} from '../../types/ma';

interface MAClientDashboardProps {
  engagementId: string;
  periodId?: string; // Optional - defaults to current period
}

export function MAClientDashboard({ engagementId, periodId }: MAClientDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<MAEngagement | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<MAPeriod | null>(null);
  const [financialData, setFinancialData] = useState<MAFinancialData | null>(null);
  const [insights, setInsights] = useState<MAInsight[]>([]);
  const [kpis, setKpis] = useState<MAKPIValue[]>([]);
  const [periods, setPeriods] = useState<MAPeriod[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [engagementId, periodId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load engagement
      const { data: eng } = await supabase
        .from('ma_engagements')
        .select('*')
        .eq('id', engagementId)
        .single();

      if (eng) setEngagement(eng);

      // Load periods
      const { data: allPeriods } = await supabase
        .from('ma_periods')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('period_end', { ascending: false });

      if (allPeriods) {
        setPeriods(allPeriods);
        
        // Find current period (either specified or most recent delivered)
        const period = periodId 
          ? allPeriods.find((p: MAPeriod) => p.id === periodId)
          : allPeriods.find((p: MAPeriod) => p.status === 'delivered') || allPeriods[0];
        
        if (period) {
          setCurrentPeriod(period);
          
          // Load financial data for period
          const { data: finData } = await supabase
            .from('ma_financial_data')
            .select('*')
            .eq('period_id', period.id)
            .single();

          if (finData) setFinancialData(finData);

          // Load insights for period
          const { data: insightData } = await supabase
            .from('ma_insights')
            .select('*')
            .eq('period_id', period.id)
            .eq('show_to_client', true)
            .order('display_order', { ascending: true });

          if (insightData) setInsights(insightData);

          // Load KPIs
          const { data: kpiData } = await supabase
            .from('ma_kpi_tracking')
            .select('*')
            .eq('engagement_id', engagementId)
            .eq('period_end', period.period_end);

          if (kpiData) setKpis(kpiData);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeInsight = async (insightId: string) => {
    await supabase
      .from('ma_insights')
      .update({ client_acknowledged_at: new Date().toISOString() })
      .eq('id', insightId);
    
    setInsights(prev => 
      prev.map(i => 
        i.id === insightId 
          ? { ...i, client_acknowledged_at: new Date().toISOString() } 
          : i
      )
    );
  };

  const handleActionTaken = async (insightId: string, action: string) => {
    await supabase
      .from('ma_insights')
      .update({ 
        action_taken: action,
        action_completed_at: new Date().toISOString()
      })
      .eq('id', insightId);
    
    setInsights(prev => 
      prev.map(i => 
        i.id === insightId 
          ? { ...i, action_taken: action, action_completed_at: new Date().toISOString() } 
          : i
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!engagement || !currentPeriod) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No report available yet</p>
      </div>
    );
  }

  const tier = engagement.tier;
  const showRecommendations = tier !== 'clarity';

  // Build True Cash display data
  const trueCashDisplay = financialData?.cash_at_bank 
    ? formatTrueCashForDisplay(calculateTrueCash({
        bankBalance: financialData.cash_at_bank,
        vatLiability: financialData.vat_liability || 0,
        payeLiability: financialData.paye_liability || 0,
        corporationTaxLiability: financialData.corporation_tax_liability || 0,
        monthlyOperatingCosts: financialData.monthly_operating_costs || financialData.overheads || 0,
      }))
    : null;

  // Filter insights by type
  const actionRequired = insights.filter(i => i.insight_type === 'action_required');
  const warnings = insights.filter(i => i.insight_type === 'warning');
  const opportunities = insights.filter(i => i.insight_type === 'opportunity');
  const observations = insights.filter(i => i.insight_type === 'observation');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-slate-600">{currentPeriod.period_label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              tier === 'strategic' ? 'bg-purple-100 text-purple-700' :
              tier === 'foresight' ? 'bg-indigo-100 text-indigo-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Period selector */}
          {periods.length > 1 && (
            <select
              value={currentPeriod.id}
              onChange={(e) => {
                const p = periods.find(p => p.id === e.target.value);
                if (p) setCurrentPeriod(p);
              }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {periods.filter(p => p.status === 'delivered').map(p => (
                <option key={p.id} value={p.id}>{p.period_label}</option>
              ))}
            </select>
          )}
          
          {/* Download button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* Tuesday Question */}
      {currentPeriod.tuesday_question && (
        <TuesdayQuestionDisplay
          question={currentPeriod.tuesday_question}
          answer={currentPeriod.tuesday_answer || undefined}
          answerFormat={currentPeriod.tuesday_answer_format as any}
        />
      )}

      {/* Action Required - Always shown prominently */}
      {actionRequired.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Action Required
          </h2>
          {actionRequired.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              showRecommendation={showRecommendations}
              onAcknowledge={handleAcknowledgeInsight}
              onActionTaken={handleActionTaken}
            />
          ))}
        </div>
      )}

      {/* True Cash - Always prominent */}
      {trueCashDisplay && (
        <TrueCashCard data={trueCashDisplay} />
      )}

      {/* KPI Summary */}
      {kpis.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Your KPIs ({kpis.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.slice(0, 6).map(kpi => (
              <div 
                key={kpi.kpi_code}
                className={`p-4 rounded-lg border ${
                  kpi.rag_status === 'green' ? 'border-green-200 bg-green-50' :
                  kpi.rag_status === 'amber' ? 'border-amber-200 bg-amber-50' :
                  kpi.rag_status === 'red' ? 'border-red-200 bg-red-50' :
                  'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-sm text-slate-500 mb-1">{kpi.kpi_name || kpi.kpi_code}</div>
                <div className="text-2xl font-bold text-slate-800">
                  {kpi.value?.toLocaleString() ?? '-'}
                </div>
                {kpi.auto_commentary && (
                  <p className="text-xs text-slate-500 mt-2">{kpi.auto_commentary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Watch Out
          </h2>
          {warnings.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              showRecommendation={showRecommendations}
              compact
            />
          ))}
        </div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-green-700 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Opportunities
          </h2>
          {opportunities.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              showRecommendation={showRecommendations}
              compact
            />
          ))}
        </div>
      )}

      {/* Other Observations */}
      {observations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            Key Insights
          </h2>
          {observations.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              showRecommendation={showRecommendations}
              compact
            />
          ))}
        </div>
      )}

      {/* Review Call Scheduling (if not done) */}
      {tier !== 'clarity' && !currentPeriod.review_call_completed_at && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <Clock className="h-6 w-6 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Schedule Your Review Call</h3>
              <p className="text-sm text-blue-700 mt-1">
                Let's discuss this month's numbers and answer any questions you have.
              </p>
              <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Book a Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Reports */}
      {periods.filter(p => p.status === 'delivered' && p.id !== currentPeriod.id).length > 0 && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Previous Reports</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {periods
              .filter(p => p.status === 'delivered' && p.id !== currentPeriod.id)
              .slice(0, 6)
              .map(period => (
                <button
                  key={period.id}
                  onClick={() => setCurrentPeriod(period)}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-slate-800">{period.period_label}</p>
                    <p className="text-xs text-slate-500">
                      Delivered {period.delivered_at ? new Date(period.delivered_at).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MAClientDashboard;

