/**
 * Business Intelligence Dashboard
 * Main container component for the BI service
 * 
 * "Sell the destination, not the plane"
 * Three tiers: Clarity / Foresight / Strategic
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  RefreshCw, 
  Settings, 
  Download, 
  Calendar,
  AlertCircle,
  Send,
  CheckCircle2
} from 'lucide-react';

import { TuesdayQuestionBanner } from './TuesdayQuestionBanner';
import { TrueCashWaterfall } from './TrueCashWaterfall';
import { InsightList } from './InsightList';
import { KPIGrid } from './KPIGrid';
import { CashForecastSection } from './CashForecastSection';
import { ClientProfitabilitySection } from './ClientProfitabilitySection';

import { BIKpiCalculator, getKPIsForTier } from '../../services/business-intelligence/kpi-calculator';
import type { 
  BIEngagement, 
  BIPeriod, 
  BIFinancialData, 
  BIInsight, 
  BIKPIValue,
  BIScenario,
  BIClientProfitability,
  BITier
} from '../../types/business-intelligence';

interface BIDashboardProps {
  periodId: string;
  engagementId: string;
  isTeamView?: boolean;
  onNavigateToWorkflow?: (tab: string) => void;
}

export function BIDashboard({
  periodId,
  engagementId,
  isTeamView = false,
  onNavigateToWorkflow
}: BIDashboardProps) {
  
  // Data state
  const [engagement, setEngagement] = useState<BIEngagement | null>(null);
  const [period, setPeriod] = useState<BIPeriod | null>(null);
  const [financialData, setFinancialData] = useState<BIFinancialData | null>(null);
  const [insights, setInsights] = useState<BIInsight[]>([]);
  const [kpiValues, setKpiValues] = useState<BIKPIValue[]>([]);
  const [scenarios, setScenarios] = useState<BIScenario[]>([]);
  const [clientProfitability, setClientProfitability] = useState<BIClientProfitability[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [delivering, setDelivering] = useState(false);
  
  // Get tier from engagement
  const tier: BITier = engagement?.tier || 'clarity';
  
  // Feature flags based on tier
  const features = {
    showForecast: tier !== 'clarity',
    showScenarios: tier !== 'clarity',
    showRecommendations: tier !== 'clarity',
    showClientProfitability: tier !== 'clarity',
    kpiCount: tier === 'clarity' ? 5 : tier === 'foresight' ? 8 : -1
  };
  
  // Load all data
  useEffect(() => {
    loadDashboardData();
  }, [periodId, engagementId]);
  
  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    
    try {
      // Load engagement
      const { data: engData, error: engError } = await supabase
        .from('bi_engagements')
        .select('*, client:clients(id, name, company_name)')
        .eq('id', engagementId)
        .single();
      
      if (engError) throw engError;
      setEngagement(engData);
      
      // Load period
      const { data: periodData, error: periodError } = await supabase
        .from('bi_periods')
        .select('*')
        .eq('id', periodId)
        .single();
      
      if (periodError) throw periodError;
      setPeriod(periodData);
      
      // Load financial data
      const { data: finData } = await supabase
        .from('bi_financial_data')
        .select('*')
        .eq('period_id', periodId)
        .single();
      
      setFinancialData(finData || null);
      
      // Load insights
      const { data: insightData } = await supabase
        .from('bi_insights')
        .select('*')
        .eq('period_id', periodId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      setInsights(insightData || []);
      
      // Load KPI values with definitions
      const { data: kpiData } = await supabase
        .from('bi_kpi_values')
        .select('*, definition:bi_kpi_definitions(*)')
        .eq('period_id', periodId)
        .order('display_order', { ascending: true });
      
      setKpiValues(kpiData || []);
      
      // Load scenarios (Foresight+ only)
      if (engData.tier !== 'clarity') {
        const { data: scenarioData } = await supabase
          .from('bi_scenarios')
          .select('*')
          .eq('engagement_id', engagementId)
          .eq('is_active', true);
        
        setScenarios(scenarioData || []);
        
        // Load client profitability
        const { data: profitData } = await supabase
          .from('bi_client_profitability')
          .select('*')
          .eq('period_id', periodId)
          .order('revenue', { ascending: false });
        
        setClientProfitability(profitData || []);
      }
      
    } catch (err) {
      console.error('[BIDashboard] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }
  
  // Deliver report to client
  async function deliverToClient() {
    if (!period) return;
    
    setDelivering(true);
    try {
      const { error } = await supabase
        .from('bi_periods')
        .update({ status: 'delivered' })
        .eq('id', periodId);
      
      if (error) throw error;
      
      // Update local state
      setPeriod({ ...period, status: 'delivered' });
      
    } catch (err) {
      console.error('[BIDashboard] Delivery error:', err);
      setError('Failed to deliver report');
    } finally {
      setDelivering(false);
    }
  }
  
  // Regenerate insights
  async function regenerateInsights() {
    if (!financialData || !period) return;
    
    setRegenerating(true);
    try {
      // Calculate KPIs for the prompt
      const selectedKpis = getKPIsForTier(tier);
      const kpiResults = BIKpiCalculator.calculateAll(financialData, selectedKpis);
      
      const { data, error } = await supabase.functions.invoke('generate-bi-insights', {
        body: {
          periodId,
          engagementId,
          tier,
          clientName: engagement?.client?.company_name || engagement?.client?.name || 'Client',
          tuesdayQuestion: period.tuesday_question || '',
          discoveryData: engagement?.discovery_data,
          financialData,
          kpiResults: kpiResults.map(kpi => ({
            code: kpi.kpi_code,
            name: kpi.kpi_code.replace(/_/g, ' '),
            value: kpi.value,
            formatted_value: kpi.formatted_value,
            rag_status: kpi.rag_status
          }))
        }
      });
      
      if (error) throw error;
      
      if (data?.insights) {
        setInsights(data.insights);
      }
      
    } catch (err) {
      console.error('[BIDashboard] Regenerate error:', err);
      setError('Failed to regenerate insights');
    } finally {
      setRegenerating(false);
    }
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Client name
  const clientName = engagement?.client?.company_name || engagement?.client?.name || 'Client';
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{clientName}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {period?.period_label || 'Current Period'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              tier === 'strategic' ? 'bg-purple-100 text-purple-700' :
              tier === 'foresight' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </span>
          </div>
        </div>
        
        {/* Team Controls */}
        {isTeamView && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                editMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4 inline-block mr-1" />
              {editMode ? 'Exit Edit' : 'Edit'}
            </button>
            <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
              <Download className="w-4 h-4 inline-block mr-1" />
              Export PDF
            </button>
          </div>
        )}
      </div>
      
      {/* Tuesday Question - Always First */}
      <TuesdayQuestionBanner
        question={period?.tuesday_question || null}
        answerShort={period?.tuesday_answer_short || null}
        answerDetail={period?.tuesday_answer_detail || null}
        linkedScenarioId={period?.tuesday_linked_scenario_id || null}
        onRunScenario={setActiveScenario}
        editable={editMode}
        onEdit={() => onNavigateToWorkflow?.('tuesday_question')}
      />
      
      {/* Two Column Layout for main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Cash Position */}
        <div className="lg:col-span-1 space-y-6">
          <TrueCashWaterfall
            financialData={financialData}
            editable={editMode}
            onEdit={() => onNavigateToWorkflow?.('financial_data')}
          />
          
          {/* Cash Forecast - Foresight+ only */}
          {features.showForecast && (
            <CashForecastSection
              periodId={periodId}
              scenarios={scenarios}
              activeScenario={activeScenario}
              onScenarioChange={setActiveScenario}
              editable={editMode}
            />
          )}
        </div>
        
        {/* Right Column - Insights & KPIs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Insights */}
          <InsightList
            insights={insights}
            showRecommendations={features.showRecommendations}
            onRunScenario={setActiveScenario}
            editable={editMode}
            onRegenerate={regenerateInsights}
            isRegenerating={regenerating}
          />
          
          {/* KPIs */}
          <KPIGrid
            kpiValues={kpiValues}
            editable={editMode}
          />
        </div>
      </div>
      
      {/* Client Profitability - Foresight+ only, full width */}
      {features.showClientProfitability && clientProfitability.length > 0 && (
        <ClientProfitabilitySection
          data={clientProfitability}
          editable={editMode}
        />
      )}
      
      {/* Period Status Footer */}
      {isTeamView && period && (
        <div className="flex justify-between items-center py-4 border-t text-sm">
          <div className="flex items-center gap-4 text-gray-500">
            <span>Status: <strong className={`${
              period.status === 'delivered' ? 'text-green-600' : 'text-gray-700'
            }`}>{formatStatus(period.status)}</strong></span>
            {period.reviewed_by && (
              <span>Reviewed: <strong className="text-gray-700">{new Date(period.reviewed_at!).toLocaleDateString()}</strong></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {period.status === 'insights_generated' && (
              <button 
                onClick={() => onNavigateToWorkflow?.('review')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Begin Review
              </button>
            )}
            
            {/* Deliver to Client Button - shows when there are insights and not yet delivered */}
            {period.status !== 'delivered' && insights.length > 0 && (
              <button 
                onClick={deliverToClient}
                disabled={delivering}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {delivering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Delivering...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Deliver to Client
                  </>
                )}
              </button>
            )}
            
            {/* Delivered confirmation */}
            {period.status === 'delivered' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Delivered to Client
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Status formatting
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    documents_uploaded: 'Documents Uploaded',
    data_extracted: 'Data Extracted',
    insights_generated: 'Insights Ready',
    team_review: 'Under Review',
    ready_for_call: 'Ready for Call',
    call_complete: 'Call Complete',
    delivered: 'Delivered'
  };
  return statusMap[status] || status;
}

