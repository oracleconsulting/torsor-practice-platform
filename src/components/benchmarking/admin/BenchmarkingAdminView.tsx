import { useState, useEffect, useMemo } from 'react';
import { QuickStatsBar } from './QuickStatsBar';
import { ConversationScript } from './ConversationScript';
import { RiskFlagsPanel } from './RiskFlagsPanel';
import { NextStepsPanel } from './NextStepsPanel';
import { ClientDataReference } from './ClientDataReference';
import { DataCollectionPanel } from './DataCollectionPanel';
import { BenchmarkSourcesPanel } from './BenchmarkSourcesPanel';
import { AccountsUploadPanel } from './AccountsUploadPanel';
import { FinancialDataReviewModal } from './FinancialDataReviewModal';
import { ServicePathwayPanel } from './ServicePathwayPanel';
import { OpportunityPanel } from './OpportunityPanel';
import { ValueAnalysisPanel } from './ValueAnalysisPanel';
import { ExportAnalysisButton } from './ExportAnalysisButton';
import { FileText, MessageSquare, AlertTriangle, ListTodo, ClipboardList, Database, Upload, Target, Sparkles, DollarSign, Share2, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { ValueAnalysis } from '../../../types/benchmarking';
import type { DetectedIssue, ServiceRecommendation } from '../../../lib/issue-service-mapping';
// NOTE: detectIssues/getPriorityServices DEPRECATED - use database-sourced recommendations

// Utility to get correct ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
const getOrdinalSuffix = (n: number): string => {
  const num = Math.round(n);
  if (num % 100 >= 11 && num % 100 <= 13) {
    return num + 'th';
  }
  switch (num % 10) {
    case 1: return num + 'st';
    case 2: return num + 'nd';
    case 3: return num + 'rd';
    default: return num + 'th';
  }
};

interface BenchmarkAnalysis {
  headline: string;
  executive_summary: string;
  total_annual_opportunity: string;
  overall_percentile?: number;
  gap_count?: number;
  strength_count?: number;
  admin_opening_statement?: string;
  admin_talking_points?: string;
  admin_questions_to_ask?: string;
  admin_data_collection_script?: string;
  admin_next_steps?: string;
  admin_tasks?: string;
  admin_risk_flags?: string;
  admin_closing_script?: string;
  recommendations?: string;
  pass1_data?: string;
  industry_code?: string;
  metrics_comparison?: string;
  created_at?: string;
  data_sources?: string[];
  benchmark_data_as_of?: string;
  benchmark_sources_detail?: {
    metricSources?: Record<string, any>;
    uniqueSources?: any[];
    totalMetrics?: number;
    liveSearchCount?: number;
    manualDataCount?: number;
    overallConfidence?: number;
    dataQualityNotes?: string;
    marketContext?: string;
    lastRefreshed?: string;
  };
  // Balance sheet and trend analysis data
  balance_sheet?: {
    cash?: number | null;
    net_assets?: number | null;
    freehold_property?: number | null;
  } | null;
  financial_trends?: Array<{
    metric: string;
    direction: 'improving' | 'stable' | 'declining' | 'volatile';
    isRecovering: boolean;
    narrative: string;
  }> | null;
  investment_signals?: {
    likelyInvestmentYear: boolean;
    confidence: 'high' | 'medium' | 'low';
    indicators: string[];
  } | null;
  historical_financials?: Array<{
    fiscal_year: number;
    revenue?: number | null;
    gross_margin?: number | null;
    net_margin?: number | null;
  }> | null;
  current_ratio?: number | null;
  quick_ratio?: number | null;
  cash_months?: number | null;
  creditor_days?: number | null;
  surplus_cash?: {
    hasData: boolean;
    actualCash: number | null;
    requiredCash: number | null;
    surplusCash: number | null;
    surplusAsPercentOfRevenue: number | null;
    components: {
      operatingBuffer: number | null;
      workingCapitalRequirement: number | null;
      netWorkingCapital: number | null;
    };
    methodology: string;
    narrative: string;
    confidence: 'high' | 'medium' | 'low';
  } | null;
  // Business valuation analysis
  value_analysis?: ValueAnalysis | null;
  // Context Intelligence fields (from Pass 3)
  opportunities?: any[];
  recommended_services?: any[];
  not_recommended_services?: any[];
  client_preferences?: any;
}

interface BenchmarkingAdminViewProps {
  data: BenchmarkAnalysis;
  clientData: {
    revenue: number;
    employees: number;
    revenuePerEmployee: number;
    grossMargin?: number;
    netMargin?: number;
    ebitdaMargin?: number;
    debtorDays?: number;
    creditorDays?: number;
    clientConcentration?: number;
  };
  hvaData?: {
    responses?: Record<string, any>;
    [key: string]: any;
  };
  founderRisk?: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    valuationImpact: string;
  } | null;
  industryMapping?: {
    code: string;
    name: string;
    confidence: number;
  };
  clientId?: string;
  clientName?: string;
  practiceId?: string;
  engagementId?: string;
  supplementaryData?: Record<string, number | string>;
  onSwitchToClient?: () => void;
  onRegenerate?: () => Promise<void>;
  onSaveSupplementaryData?: (data: Record<string, number | string>) => Promise<void>;
  isRegenerating?: boolean;
  // Share with client functionality
  isSharedWithClient?: boolean;
  onToggleShare?: (newStatus: boolean) => Promise<void>;
  isTogglingShare?: boolean;
}

interface AccountUpload {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'extracted' | 'confirmed' | 'failed';
  fiscal_year?: number;
  extraction_confidence?: number;
  error_message?: string;
  created_at: string;
}

interface FinancialData {
  id: string;
  fiscal_year: number;
  revenue?: number;
  gross_margin_pct?: number;
  ebitda_margin_pct?: number;
  net_margin_pct?: number;
  debtor_days?: number;
  employee_count?: number;
  revenue_per_employee?: number;
  confidence_score?: number;
  confirmed_at?: string;
  notes?: string;
}

// Helper to safely parse JSON (handles both string and already-parsed objects)
const safeJsonParse = <T,>(value: string | T | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

interface Pass1Data {
  founderRiskLevel?: string;
  founderRiskScore?: number;
  valuationImpact?: string;
  dataGaps?: Array<{ metric: string }>;
  classification?: {
    industryName?: string;
    industryConfidence?: number;
  };
}

export function BenchmarkingAdminView({ 
  data, 
  clientData, 
  hvaData,
  founderRisk, 
  industryMapping, 
  clientId,
  clientName,
  practiceId,
  engagementId,
  supplementaryData = {},
  onSwitchToClient,
  onRegenerate,
  onSaveSupplementaryData,
  isRegenerating = false,
  // Share with client functionality
  isSharedWithClient = false,
  onToggleShare,
  isTogglingShare = false
}: BenchmarkingAdminViewProps) {
  const [activeTab, setActiveTab] = useState<'script' | 'risks' | 'services' | 'opportunities' | 'valuation' | 'actions' | 'collect' | 'accounts' | 'sources' | 'raw'>('script');
  
  // Accounts upload state
  const [accountUploads, setAccountUploads] = useState<AccountUpload[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [reviewingData, setReviewingData] = useState<FinancialData | null>(null);
  
  // Load accounts data
  const loadAccountsData = async () => {
    if (!clientId) return;
    
    try {
      // Load uploads
      const { data: uploads } = await supabase
        .from('client_accounts_uploads')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (uploads) setAccountUploads(uploads as AccountUpload[]);
      
      // Load financial data
      const { data: financial } = await supabase
        .from('client_financial_data')
        .select('*')
        .eq('client_id', clientId)
        .order('fiscal_year', { ascending: false });
      
      if (financial) setFinancialData(financial as FinancialData[]);
    } catch (err) {
      console.log('Could not load accounts data (table may not exist yet)');
    }
  };
  
  useEffect(() => {
    if (clientId) {
      loadAccountsData();
    }
  }, [clientId]);
  
  const talkingPoints = safeJsonParse(data.admin_talking_points, []);
  const questionsToAsk = safeJsonParse(data.admin_questions_to_ask, []);
  const dataCollectionScript = safeJsonParse(data.admin_data_collection_script, []);
  const nextSteps = safeJsonParse(data.admin_next_steps, []);
  const tasks = safeJsonParse(data.admin_tasks, []);
  const riskFlags = safeJsonParse(data.admin_risk_flags, []);
  const pass1Data = safeJsonParse<Pass1Data>(data.pass1_data, {});
  const closingScript = data.admin_closing_script || '';
  
  // Get revenue per employee from metrics comparison (where it was calculated) or fallback to clientData
  const metrics = safeJsonParse<Array<{ metricCode?: string; clientValue?: number; p50?: number }>>(data.metrics_comparison, []);
  
  // ============================================================================
  // SERVICE RECOMMENDATIONS - FROM DATABASE (SINGLE SOURCE OF TRUTH)
  // Pass 3 generates these with context awareness. We do NOT calculate here.
  // ============================================================================
  
  // Issues come from opportunities in database
  const detectedIssues = useMemo((): DetectedIssue[] => {
    const opportunities = data.opportunities || [];
    return opportunities
      .filter((o: any) => o.severity === 'critical' || o.severity === 'high' || o.severity === 'medium')
      .slice(0, 6)
      .map((o: any): DetectedIssue => ({
        code: o.code || o.id,
        headline: o.title || 'Issue Identified',
        description: o.description || o.dataEvidence || '',
        dataPoint: o.dataEvidence || o.benchmarkComparison || '',
        severity: o.severity || 'medium',
        category: o.category,
        serviceMapping: o.serviceMapping?.existingService?.code || null,
      }));
  }, [data.opportunities]);
  
  // Service recommendations come ONLY from database (context-aware, Pass 3 authoritative)
  const priorityServices = useMemo((): ServiceRecommendation[] => {
    const dbRecommendations = data.recommended_services || [];
    
    if (dbRecommendations.length > 0) {
      return dbRecommendations.map((r: any): ServiceRecommendation => ({
        serviceCode: r.code,
        serviceName: r.name,
        description: r.headline || r.howItHelps,
        priceRange: r.priceRange,
        priority: r.priority,
        howItHelps: r.howItHelps,
        expectedOutcome: r.expectedOutcome,
        timeToValue: r.timeToValue || r.timeframe,
        contextReason: r.contextReason,
        alternativeTo: r.alternativeTo,
      }));
    }
    
    // Fallback: derive from opportunities
    const opportunities = data.opportunities || [];
    const seenCodes = new Set<string>();
    const blockedCodes = (data.not_recommended_services || []).map((b: any) => b.serviceCode);
    
    return opportunities
      .filter((o: any) => {
        const code = o.serviceMapping?.existingService?.code;
        if (!code || seenCodes.has(code) || blockedCodes.includes(code)) return false;
        seenCodes.add(code);
        return true;
      })
      .slice(0, 3)
      .map((o: any): ServiceRecommendation => ({
        serviceCode: o.serviceMapping.existingService.code,
        serviceName: o.serviceMapping.existingService.name || o.title,
        description: o.description || '',
        priceRange: 'Contact for pricing',
        priority: o.priority === 'must_address_now' ? 'immediate' : 
                  o.priority === 'next_12_months' ? 'short-term' : 'medium-term',
        howItHelps: o.adviserTools?.talkingPoint || o.description,
        expectedOutcome: o.financialImpact?.amount 
          ? `Up to £${o.financialImpact.amount.toLocaleString()} potential impact`
          : 'Improved operational efficiency',
        timeToValue: '1-3 months',
      }));
  }, [data.recommended_services, data.opportunities, data.not_recommended_services]);
  const revPerEmployeeMetric = metrics.find((m) => m.metricCode === 'revenue_per_consultant' || m.metricCode === 'revenue_per_employee');
  const revPerEmployee = revPerEmployeeMetric?.clientValue || clientData.revenuePerEmployee || 0;
  
  // Use admin opening statement from data if available, otherwise generate a default
  const defaultOpeningStatement = `Based on our benchmarking analysis, we've identified a £${parseFloat(data.total_annual_opportunity || '0').toLocaleString()} annual opportunity. Your revenue per employee of £${revPerEmployee.toLocaleString()} places you at the ${getOrdinalSuffix(data.overall_percentile || 0)} percentile - meaning ${100 - (data.overall_percentile || 0)}% of comparable firms are generating more revenue per head. Let me walk you through what we've found and what it means for your business.`;
  const openingStatement = data.admin_opening_statement || defaultOpeningStatement;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Benchmarking Analysis - Admin View
              </h1>
              <p className="text-sm text-slate-500">
                Conversation guide and action tracker
              </p>
            </div>
            <div className="flex items-center gap-3">
              {engagementId && clientId && (
                <ExportAnalysisButton
                  engagementId={engagementId}
                  clientId={clientId}
                  clientName={clientName || 'Client'}
                  reportData={data}
                  clientData={clientData}
                  founderRisk={founderRisk}
                  industryMapping={industryMapping}
                  hvaData={hvaData}
                  supplementaryData={supplementaryData}
                />
              )}
              
              {/* Share with Client Portal button */}
              {onToggleShare && (
                <button 
                  onClick={() => onToggleShare(!isSharedWithClient)}
                  disabled={isTogglingShare}
                  className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
                    isSharedWithClient 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isSharedWithClient ? 'Click to unshare from client portal' : 'Click to share with client portal'}
                >
                  {isTogglingShare ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSharedWithClient ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  {isSharedWithClient ? 'Unshare from Portal' : 'Share with Client'}
                </button>
              )}
              
              {onSwitchToClient && (
                <button 
                  onClick={onSwitchToClient}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Switch to Client View
                </button>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-3">
            <QuickStatsBar
              totalOpportunity={parseFloat(data.total_annual_opportunity || '0')}
              percentile={data.overall_percentile || 0}
              gapCount={data.gap_count || 0}
              strengthCount={data.strength_count || 0}
              riskLevel={(founderRisk?.level as 'low' | 'medium' | 'high' | 'critical') || (pass1Data?.founderRiskLevel as 'low' | 'medium' | 'high' | 'critical') || 'medium'}
            />
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('script')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'script'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Script
                </button>
                <button
                  onClick={() => setActiveTab('risks')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'risks'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Risks
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === 'services'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Services
                  {detectedIssues.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center">
                      {detectedIssues.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === 'opportunities'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Opps
                </button>
                <button
                  onClick={() => setActiveTab('valuation')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === 'valuation'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Value
                  {data.value_analysis && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'actions'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  Actions
                </button>
                <button
                  onClick={() => setActiveTab('collect')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === 'collect'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Collect
                  {(pass1Data?.dataGaps?.length || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pass1Data?.dataGaps?.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === 'accounts'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Accounts
                  {financialData.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                      {financialData.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('sources')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'sources'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Sources
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'raw'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Raw
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'script' && (
                  <ConversationScript
                    openingStatement={openingStatement}
                    talkingPoints={talkingPoints}
                    questionsToAsk={questionsToAsk}
                    dataCollectionScript={dataCollectionScript}
                    nextSteps={nextSteps}
                    tasks={tasks}
                    closingScript={closingScript}
                  />
                )}
                
                {activeTab === 'risks' && (
                  <RiskFlagsPanel flags={riskFlags} />
                )}
                
                {activeTab === 'services' && (
                  <ServicePathwayPanel
                    issues={detectedIssues}
                    priorityServices={priorityServices}
                    clientName={clientName}
                  />
                )}
                
                {activeTab === 'opportunities' && engagementId && (
                  <OpportunityPanel 
                    engagementId={engagementId}
                    clientId={clientId}
                    practiceId={practiceId}
                  />
                )}
                
                {activeTab === 'opportunities' && !engagementId && (
                  <div className="text-center py-8 text-slate-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Engagement context not available</p>
                    <p className="text-sm mt-1">Cannot load opportunities without engagement information</p>
                  </div>
                )}
                
                {activeTab === 'valuation' && data.value_analysis && (
                  <ValueAnalysisPanel 
                    valueAnalysis={data.value_analysis}
                    clientName={clientName}
                  />
                )}
                
                {activeTab === 'valuation' && !data.value_analysis && (
                  <div className="text-center py-12 text-slate-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Valuation Analysis Not Available</p>
                    <p className="text-sm mt-2">
                      The value analysis requires:
                    </p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Financial data (revenue, profit)</li>
                      <li>• Hidden Value Assessment (Part 3) responses</li>
                      <li>• Report regeneration with the latest code</li>
                    </ul>
                    <p className="text-xs mt-4 text-slate-400">
                      Try regenerating the report to calculate valuation
                    </p>
                  </div>
                )}
                
                {activeTab === 'actions' && (
                  <NextStepsPanel nextSteps={nextSteps} tasks={tasks} />
                )}
                
                {activeTab === 'collect' && (
                  <DataCollectionPanel
                    missingData={pass1Data?.dataGaps?.map((g: any) => g.metric) || []}
                    engagementId={engagementId || ''}
                    existingValues={supplementaryData}
                    industryCode={industryMapping?.code || data.industry_code}
                    llmScripts={dataCollectionScript}
                    onSave={onSaveSupplementaryData}
                    onRegenerate={onRegenerate}
                    isLoading={isRegenerating}
                  />
                )}
                
                {activeTab === 'accounts' && clientId && practiceId && (
                  <AccountsUploadPanel
                    clientId={clientId}
                    practiceId={practiceId}
                    existingUploads={accountUploads}
                    existingFinancialData={financialData}
                    onUploadComplete={loadAccountsData}
                    onReviewData={(data) => setReviewingData(data)}
                  />
                )}
                
                {activeTab === 'accounts' && (!clientId || !practiceId) && (
                  <div className="text-center py-8 text-slate-500">
                    <Upload className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Client context not available</p>
                    <p className="text-sm mt-1">Cannot upload accounts without client information</p>
                  </div>
                )}
                
                {activeTab === 'sources' && (
                  <BenchmarkSourcesPanel
                    metrics={metrics.map((m: any) => ({
                      metricCode: m.metricCode,
                      metricName: m.metricName,
                      p25: m.p25,
                      p50: m.p50,
                      p75: m.p75,
                      source: m.source,
                      sourceUrl: m.sourceUrl,
                      confidence: m.confidence
                    }))}
                    sources={data.data_sources || []}
                    detailedSources={data.benchmark_sources_detail}
                    industryName={industryMapping?.name || 'Unknown Industry'}
                    industryCode={industryMapping?.code || data.industry_code || ''}
                    dataAsOf={data.benchmark_data_as_of}
                  />
                )}
                
                {activeTab === 'raw' && (
                  <pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-auto max-h-[600px]">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            <ClientDataReference
              revenue={clientData.revenue}
              employees={clientData.employees}
              revenuePerEmployee={clientData.revenuePerEmployee}
              percentile={data.overall_percentile || 0}
              industryCode={industryMapping?.code || data.industry_code || ''}
              industryName={industryMapping?.name || pass1Data?.classification?.industryName || data.industry_code}
              industryConfidence={industryMapping?.confidence || pass1Data?.classification?.industryConfidence || 95}
              founderRiskScore={founderRisk?.score || pass1Data?.founderRiskScore}
              founderRiskLevel={founderRisk?.level || pass1Data?.founderRiskLevel}
              valuationImpact={founderRisk?.valuationImpact || pass1Data?.valuationImpact}
              dataGaps={pass1Data?.dataGaps?.map((g: any) => g.metric) || []}
              balanceSheet={data.balance_sheet}
              financialTrends={data.financial_trends}
              investmentSignals={data.investment_signals}
              cashMonths={data.cash_months}
              surplusCash={data.surplus_cash}
            />
            
            {/* Recommendations Summary */}
            {data.recommendations && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Recommended Services
                </h3>
                <div className="space-y-2">
                  {safeJsonParse(data.recommendations, []).slice(0, 3).map((rec: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{rec.linkedService || rec.title}</span>
                      <span className="font-semibold text-emerald-600">
                        £{rec.annualValue?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Financial Data Review Modal */}
      {reviewingData && (
        <FinancialDataReviewModal
          data={reviewingData}
          previousYearData={financialData.find(f => f.fiscal_year === reviewingData.fiscal_year - 1)}
          onClose={() => setReviewingData(null)}
          onConfirm={() => {
            setReviewingData(null);
            loadAccountsData();
          }}
        />
      )}
    </div>
  );
}

