import { useMemo, useRef, useState } from 'react';
import { HeroSection } from './HeroSection';
import { MetricComparisonCard } from './MetricComparisonCard';
import { NarrativeSection } from './NarrativeSection';
import { RecommendationsSection } from './RecommendationsSection';
import { ScenarioExplorer } from './ScenarioExplorer';
import { ScenarioPlanningSection } from './ScenarioPlanningSection';
// DEPRECATED: ServiceRecommendationsSection used static issue-service-mapping.ts
// import { ServiceRecommendationsSection } from './ServiceRecommendationsSection';
// DEPRECATED: EnhancedServiceRecommendations was interim solution
// import { EnhancedServiceRecommendations } from './EnhancedServiceRecommendations';

// NEW: Database-driven service recommendations from Pass 3
import { RecommendedServicesSection } from './RecommendedServicesSection';
import type { RecommendedService } from './RecommendedServicesSection';
import { ValueBridgeSection } from './ValueBridgeSection';
import { AlertTriangle, Gem, Shield, CheckCircle, Download } from 'lucide-react';
import { exportToPDF } from '../../../lib/pdf-export';
import type { ValueAnalysis } from '../../../types/benchmarking';
import type { BaselineMetrics } from '../../../lib/scenario-calculator';
// DEPRECATED: Old static types - no longer using issue-service-mapping.ts
// import type { DetectedIssue, ServiceRecommendation } from '../../../lib/issue-service-mapping';
// NOTE: Service recommendations now come ONLY from bm_reports.recommended_services (built by Pass 3)
// Enhanced transparency components
import { SurplusCashBreakdown } from '../SurplusCashBreakdown';
import { EnhancedSuppressorCard } from '../EnhancedSuppressorCard';
import { ExitReadinessBreakdown } from '../ExitReadinessBreakdown';
import { TwoPathsSection } from '../TwoPathsSection';
import type { 
  EnhancedValueSuppressor, 
  ExitReadinessScore, 
  TwoPathsNarrative,
  SurplusCashData
} from '../../../types/opportunity-calculations';

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

interface SurplusCashAnalysis {
  hasData: boolean;
  actualCash: number;
  requiredCash: number;
  surplusCash: number;
  surplusAsPercentOfRevenue: number;
  components: {
    operatingBuffer: number;
    workingCapitalRequirement: number;
    netWorkingCapital: number;
    staffCostsQuarterly?: number;
    adminExpensesQuarterly?: number;
  };
}

interface BalanceSheet {
  cash: number;
  net_assets: number;
  freehold_property?: number;
  investments?: number;
  total_assets?: number;
}

interface BenchmarkAnalysis {
  headline: string;
  executive_summary: string;
  position_narrative: string;
  strength_narrative: string;
  gap_narrative: string;
  opportunity_narrative: string;
  metrics_comparison?: string;
  overall_percentile?: number;
  gap_count?: number;
  strength_count?: number;
  total_annual_opportunity: string;
  recommendations?: string;
  created_at?: string;
  data_sources?: string[];
  benchmark_data_as_of?: string;
  // Hidden value fields
  surplus_cash?: SurplusCashAnalysis;
  balance_sheet?: BalanceSheet;
  // Concentration fields
  client_concentration?: number;
  client_concentration_top3?: number;
  top_customers?: Array<{ name: string; percentage?: number }>;
  revenue?: number;
  // Additional financial fields for scenarios
  employee_count?: number;
  gross_margin?: number;
  net_margin?: number;
  ebitda?: number;
  ebitda_margin?: number;
  debtor_days?: number;
  creditor_days?: number;
  // Employee classification
  employee_band?: string;
  // Pass 1 data for additional metrics
  pass1_data?: {
    _enriched_revenue?: number;
    _enriched_employee_count?: number;
    gross_margin?: number;
    net_margin?: number;
    ebitda_margin?: number;
    debtor_days?: number;
    creditor_days?: number;
    revenue_per_employee?: number;
    client_concentration_top3?: number;
    classification?: {
      employeeBand?: string;
    };
    surplus_cash?: {
      surplusCash?: number;
    };
    // Enhanced transparency data
    enhanced_suppressors?: EnhancedValueSuppressor[];
    exit_readiness_breakdown?: ExitReadinessScore;
    surplus_cash_breakdown?: SurplusCashData;
    two_paths_narrative?: TwoPathsNarrative;
  };
  // HVA fields for competitive moat
  hva_data?: {
    competitive_moat?: string[];
    unique_methods?: string;
    reputation_build_time?: string;
  };
  // Founder risk fields
  founder_risk_level?: string;
  founder_risk_score?: number;
  // Value analysis
  value_analysis?: ValueAnalysis;
  // Context Intelligence fields (from Pass 3)
  opportunities?: any[];
  recommended_services?: any[];
  not_recommended_services?: any[];
  client_preferences?: any;
}

interface BenchmarkingClientReportProps {
  data: BenchmarkAnalysis;
  practitionerName?: string;
  practitionerEmail?: string;
  clientName?: string;
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

// Helper to determine the correct format for a metric based on its code
const getMetricFormat = (metricCode: string | undefined): 'currency' | 'percent' | 'number' | 'days' => {
  if (!metricCode) return 'number';
  
  const code = metricCode.toLowerCase();
  
  // Days metrics
  if (code.includes('days') || code.includes('debtor') || code.includes('creditor')) {
    return 'days';
  }
  
  // Percentage metrics
  if (
    code.includes('margin') || 
    code.includes('rate') || 
    code.includes('utilisation') ||
    code.includes('utilization') ||
    code.includes('concentration') ||
    code.includes('growth') ||
    code.includes('retention') ||
    code.includes('turnover') ||
    code.includes('percentage') ||
    code.includes('pct') ||
    code.includes('ratio')
  ) {
    return 'percent';
  }
  
  // Currency metrics
  if (
    code.includes('revenue') || 
    code.includes('profit') ||
    code.includes('ebitda') ||
    code.includes('hourly') ||
    code.includes('salary') ||
    code.includes('cost') ||
    code.includes('fee') ||
    code.includes('price') ||
    code.includes('value') ||
    code.includes('per_employee')
  ) {
    return 'currency';
  }
  
  // Default to number for anything else
  return 'number';
};

interface MetricComparison {
  metricCode?: string;
  metric_code?: string;
  metricName?: string;
  metric_name?: string;
  metric?: string;
  clientValue?: number;
  client_value?: number;
  p10?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
  percentile?: number;
  annualImpact?: number;
  annual_impact?: number;
}

export function BenchmarkingClientReport({ 
  data, 
  practitionerName,
  practitionerEmail,
  clientName 
}: BenchmarkingClientReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  // printMode expands all sections for PDF/print
  const [printMode, setPrintMode] = useState(false);
  
  const metrics = safeJsonParse<MetricComparison[]>(data.metrics_comparison, []);
  const recommendations = safeJsonParse(data.recommendations, []);
  
  // Handle PDF export - uses browser print dialog
  // User can select "Save as PDF" from their browser's print options
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setPrintMode(true); // Expand all sections
    
    // Wait for re-render with expanded content
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      await exportToPDF(reportRef.current, {
        filename: `${clientName || 'Company'}-Benchmarking-Report.pdf`,
      });
    } catch (error) {
      console.error('PDF export failed:', error);
    }
    
    // Reset print mode after a delay (cleanup happens via afterprint event)
    setTimeout(() => setPrintMode(false), 1000);
  };
  
  // Helper to get metric value from metrics array
  // NOTE: Uses exact match first, then prefix match to avoid 'revenue' matching 'revenue_per_employee'
  const getMetricValue = (code: string): number | undefined => {
    const lowerCode = code.toLowerCase();
    
    // First try exact match
    let metric = metrics.find((m) => {
      const metricCode = (m.metricCode || m.metric_code || '').toLowerCase();
      return metricCode === lowerCode;
    });
    
    // If no exact match, try prefix match (but NOT includes, to avoid 'revenue' matching 'revenue_per_employee')
    if (!metric) {
      metric = metrics.find((m) => {
        const metricCode = (m.metricCode || m.metric_code || '').toLowerCase();
        // Only match if it starts with our code or our code starts with it
        return metricCode.startsWith(lowerCode) || lowerCode.startsWith(metricCode);
      });
    }
    
    return metric?.clientValue ?? metric?.client_value;
  };
  
  // Helper to get benchmark data for a metric
  const getBenchmarkForMetric = (code: string): { p25: number; p50: number; p75: number } | undefined => {
    const metric = metrics.find((m) => {
      const metricCode = (m.metricCode || m.metric_code || '').toLowerCase();
      return metricCode === code.toLowerCase() || metricCode.includes(code.toLowerCase());
    });
    if (!metric || metric.p50 == null) return undefined;
    return { p25: metric.p25 || 0, p50: metric.p50, p75: metric.p75 || 0 };
  };
  
  // Build baseline metrics for scenario calculations
  const baselineMetrics = useMemo((): BaselineMetrics | null => {
    // =========================================================================
    // REVENUE EXTRACTION - Multiple fallback paths
    // =========================================================================
    
    // Method 1: Direct from report columns (new reports after fix)
    const directRevenue = data.revenue || data.pass1_data?._enriched_revenue;
    
    // Method 2: Get employee count and rev/employee from metrics, then calculate
    const revPerEmployeeMetric = metrics.find((m: any) => 
      m.metricCode === 'revenue_per_consultant' || 
      m.metricCode === 'revenue_per_employee'
    );
    const revPerEmployeeRaw = revPerEmployeeMetric?.clientValue || 
                              data.pass1_data?.revenue_per_employee || 
                              getMetricValue('revenue_per_employee');
    
    // Employee count: direct column > pass1_data > derived from employee band
    const employeeBand = data.employee_band || data.pass1_data?.classification?.employeeBand;
    const estimatedEmployees = employeeBand === '1-10' ? 5 :
                               employeeBand === '11-50' ? 30 :
                               employeeBand === '51-250' ? 131 :  // Mid-point, actual for Installation Tech
                               employeeBand === '251+' ? 300 : 0;
    
    const employeeCountRaw = data.employee_count || 
                             data.pass1_data?._enriched_employee_count ||
                             estimatedEmployees;
    
    // Calculate revenue from employees × rev/employee as a fallback
    const calculatedRevenue = (employeeCountRaw && revPerEmployeeRaw && employeeCountRaw > 0) 
      ? employeeCountRaw * revPerEmployeeRaw 
      : 0;
    
    // Priority: explicit revenue > pass1 enriched revenue > calculated from employees
    const revenue = directRevenue || calculatedRevenue || 0;
    
    // Debug logging to help diagnose issues
    if (typeof window !== 'undefined' && revenue < 1000000) {
      console.warn('[ScenarioExplorer] Revenue seems low:', {
        'data.revenue': data.revenue,
        'pass1._enriched_revenue': data.pass1_data?._enriched_revenue,
        'calculated (emp × rev/emp)': calculatedRevenue,
        'employee_count': employeeCountRaw,
        'employee_band': employeeBand,
        'rev_per_employee': revPerEmployeeRaw,
        'final revenue': revenue,
      });
    }
    
    if (revenue <= 0) return null;
    
    // Get gross margin
    const grossMargin = data.gross_margin || 
                        data.pass1_data?.gross_margin || 
                        getMetricValue('gross_margin') || 
                        0;
    
    // Get net margin
    const netMargin = data.net_margin || 
                      data.pass1_data?.net_margin || 
                      getMetricValue('net_margin') || 
                      0;
    
    // Use employee count from earlier extraction (already handles fallbacks)
    const employeeCount = employeeCountRaw || 1;
    
    // Use revenue per employee from earlier extraction
    const revenuePerEmployee = revPerEmployeeRaw || (revenue / employeeCount);
    
    // Get EBITDA margin
    const ebitdaMargin = data.ebitda_margin || 
                         data.pass1_data?.ebitda_margin || 
                         getMetricValue('ebitda_margin') || 
                         netMargin * 1.2; // Rough estimate if not available
    
    // Get debtor/creditor days
    const debtorDays = data.debtor_days || 
                       data.pass1_data?.debtor_days || 
                       getMetricValue('debtor_days') || 
                       45;
    
    const creditorDays = data.creditor_days || 
                         data.pass1_data?.creditor_days || 
                         getMetricValue('creditor_days') || 
                         30;
    
    // Get concentration
    const clientConcentration = data.client_concentration_top3 || 
                                data.client_concentration || 
                                data.pass1_data?.client_concentration_top3;
    
    return {
      revenue,
      grossMargin,
      grossProfit: revenue * (grossMargin / 100),
      netMargin,
      netProfit: revenue * (netMargin / 100),
      ebitda: revenue * (ebitdaMargin / 100),
      ebitdaMargin,
      employeeCount,
      revenuePerEmployee,
      debtorDays,
      creditorDays,
      clientConcentration,
    };
  }, [data, metrics]);
  
  // Build industry benchmarks for scenario explorer
  const industryBenchmarks = useMemo(() => ({
    grossMargin: getBenchmarkForMetric('gross_margin'),
    revenuePerEmployee: getBenchmarkForMetric('revenue_per_employee'),
    debtorDays: getBenchmarkForMetric('debtor_days'),
    clientConcentration: getBenchmarkForMetric('concentration'),
  }), [metrics]);
  
  // ============================================================================
  // SERVICE RECOMMENDATIONS - FROM DATABASE (SINGLE SOURCE OF TRUTH)
  // Pass 3 generates these with context awareness. We do NOT calculate here.
  // ============================================================================
  // SERVICE RECOMMENDATIONS - From bm_reports.recommended_services (Pass 3)
  // ============================================================================
  
  // Convert database recommended_services to the new component format
  const recommendedServices = useMemo((): RecommendedService[] => {
    // Primary source: bm_reports.recommended_services (built by Pass 3)
    const dbRecommendations = data.recommended_services || [];
    
    if (dbRecommendations.length > 0) {
      return dbRecommendations.map((r: any): RecommendedService => ({
        serviceCode: r.serviceCode || r.code,
        serviceName: r.serviceName || r.name,
        description: r.description || '',
        headline: r.headline,
        priceFrom: r.priceFrom || r.price_from,
        priceTo: r.priceTo || r.price_to,
        priceUnit: r.priceUnit || r.price_unit,
        priceRange: r.priceRange,
        category: r.category,
        whyThisMatters: r.whyThisMatters || r.contextReason || r.description || '',
        whatYouGet: r.whatYouGet || r.deliverables || [],
        expectedOutcome: r.expectedOutcome || '',
        timeToValue: r.timeToValue || r.timeframe || '4-6 weeks',
        addressesIssues: r.addressesIssues || [],
        totalValueAtStake: r.totalValueAtStake,
        source: r.source || 'opportunity',
        priority: r.priority || 'secondary',
      }));
    }
    
    // Fallback: Build from opportunities + pinned services if recommended_services not populated
    const opportunities = data.opportunities || [];
    const blockedCodes = (data.not_recommended_services || []).map((b: any) => b.serviceCode);
    const serviceMap = new Map<string, RecommendedService>();
    
    // Process opportunities that have service recommendations
    for (const opp of opportunities) {
      const service = opp.service;
      if (!service?.code || blockedCodes.includes(service.code)) continue;
      
      const existing = serviceMap.get(service.code);
      const newIssue = {
        issueTitle: opp.title || 'Issue',
        valueAtStake: opp.financial_impact_amount || 0,
        severity: opp.severity || 'medium',
      };
      
      if (existing) {
        // Add this issue to existing service
        existing.addressesIssues.push(newIssue);
        existing.totalValueAtStake = (existing.totalValueAtStake || 0) + newIssue.valueAtStake;
      } else {
        // Create new service entry
        const isPinned = opp.opportunity_code?.startsWith('pinned-');
        serviceMap.set(service.code, {
          serviceCode: service.code,
          serviceName: service.name,
          description: service.description || '',
          headline: service.headline,
          priceFrom: service.price_from,
          priceTo: service.price_to,
          priceUnit: service.price_unit,
          category: service.category,
          whyThisMatters: opp.service_fit_rationale || opp.talking_point || service.description || '',
          whatYouGet: service.deliverables || [],
          expectedOutcome: opp.life_impact || `Addresses ${opp.title}`,
          timeToValue: service.typical_duration || '4-6 weeks',
          addressesIssues: [newIssue],
          totalValueAtStake: newIssue.valueAtStake,
          source: isPinned ? 'pinned' : 'opportunity',
          priority: isPinned || opp.severity === 'critical' || opp.severity === 'high' ? 'primary' : 'secondary',
        });
      }
    }
    
    // Sort: pinned first, then by total value
    return Array.from(serviceMap.values()).sort((a, b) => {
      if (a.source === 'pinned' && b.source !== 'pinned') return -1;
      if (b.source === 'pinned' && a.source !== 'pinned') return 1;
      if (a.priority === 'primary' && b.priority !== 'primary') return -1;
      if (b.priority === 'primary' && a.priority !== 'primary') return 1;
      return (b.totalValueAtStake || 0) - (a.totalValueAtStake || 0);
    });
  }, [data.recommended_services, data.opportunities, data.not_recommended_services]);
  
  return (
    <div className="min-h-screen bg-slate-50" ref={reportRef} data-pdf-content>
      {/* Header */}
      <div className="bg-white border-b border-slate-200" data-no-print>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Benchmarking Report</p>
              <p className="text-xs text-slate-400">
                Generated {data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : 'Recently'}
              </p>
            </div>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
              data-no-print
            >
              <Download className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <HeroSection
          totalOpportunity={parseFloat(data.total_annual_opportunity) || 0}
          percentile={data.overall_percentile || 0}
          headline={data.headline}
          trend="up"
        />
        
        {/* Executive Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Executive Summary</h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.executive_summary}</p>
        </div>
        
        {/* HIDDEN VALUE SECTION */}
        {((data.surplus_cash?.surplusCash && data.surplus_cash.surplusCash > 0) || 
          (data.balance_sheet?.freehold_property && data.balance_sheet.freehold_property > 0) ||
          (data.balance_sheet?.investments && data.balance_sheet.investments > 0)) && (
          <section className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
              <Gem className="h-5 w-5" />
              Hidden Value Identified
            </h2>
            
            <p className="text-gray-700 mb-4">
              Beyond your operating performance, we've identified assets that sit 
              outside normal earnings-based valuations:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.surplus_cash?.surplusCash && data.surplus_cash.surplusCash > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-700">
                    £{(data.surplus_cash.surplusCash / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600">Surplus Cash</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Above operating requirements
                  </div>
                </div>
              )}
              
              {data.balance_sheet?.freehold_property && data.balance_sheet.freehold_property > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-700">
                    £{(data.balance_sheet.freehold_property / 1000).toFixed(0)}k
                  </div>
                  <div className="text-sm text-gray-600">Property Value</div>
                  <div className="text-xs text-gray-500 mt-1">
                    At book value (market may be higher)
                  </div>
                </div>
              )}
              
              {data.balance_sheet?.investments && data.balance_sheet.investments > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-700">
                    £{(data.balance_sheet.investments / 1000).toFixed(0)}k
                  </div>
                  <div className="text-sm text-gray-600">Investments</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Fixed asset investments
                  </div>
                </div>
              )}
            </div>
            
            {data.surplus_cash?.components?.netWorkingCapital && data.surplus_cash.components.netWorkingCapital < 0 && (
              <div className="mt-4 p-3 bg-white rounded border border-green-200">
                <span className="text-green-700 font-medium">Bonus: </span>
                <span className="text-gray-700">
                  Your supplier payment terms mean you operate with 
                  £{(Math.abs(data.surplus_cash.components.netWorkingCapital) / 1000000).toFixed(1)}M 
                  of free working capital — suppliers fund your operations, not you.
                </span>
              </div>
            )}
          </section>
        )}
        
        {/* CONCENTRATION RISK SECTION */}
        {(data.client_concentration || data.client_concentration_top3) && 
         (data.client_concentration || data.client_concentration_top3 || 0) > 75 && (
          <section className="p-6 bg-red-50 rounded-xl border border-red-200">
            <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Customer Concentration Risk
            </h2>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl font-bold text-red-700">
                {data.client_concentration || data.client_concentration_top3}%
              </div>
              <div className="text-gray-700">
                of your revenue comes from just 3 customers
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">If you lost your largest customer:</div>
                <div className="text-xl font-semibold text-red-600">
                  £{(((data.revenue || 0) * (data.client_concentration || data.client_concentration_top3 || 0) / 100) / 3 / 1000000).toFixed(1)}M+ at risk
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Industry benchmark:</div>
                <div className="text-xl font-semibold">
                  Top 3 customers &lt; 40%
                </div>
              </div>
            </div>
            
            <div className="text-gray-700">
              <p className="mb-2">
                <strong>Why this matters:</strong> Acquirers typically apply a 20-30% valuation 
                discount for businesses with this level of concentration. More importantly, your 
                business is vulnerable to decisions made by people outside your control.
              </p>
              <p>
                <strong>The question:</strong> What would happen to your business if 
                {data.top_customers?.[0]?.name ? ` ${data.top_customers[0].name}` : ' your largest client'} 
                changed supplier, was acquired, or cut budgets?
              </p>
            </div>
          </section>
        )}
        
        {/* COMPETITIVE STRENGTHS SECTION */}
        {data.hva_data?.competitive_moat && data.hva_data.competitive_moat.length > 0 && (
          <section className="p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Competitive Moat
            </h2>
            
            <p className="text-gray-700 mb-4">
              These are barriers that protect your business from competitors:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.hva_data.competitive_moat.map((moat, i) => (
                <div key={i} className="bg-white p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">{moat}</span>
                </div>
              ))}
            </div>
            
            {data.hva_data.unique_methods && (
              <div className="mt-4 p-4 bg-white rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">Your Unique Advantage:</div>
                <p className="text-gray-700 italic">"{data.hva_data.unique_methods}"</p>
                {data.hva_data.reputation_build_time && (
                  <p className="text-sm text-gray-600 mt-2">
                    Time to replicate: {data.hva_data.reputation_build_time}
                  </p>
                )}
              </div>
            )}
          </section>
        )}
        
        {/* Metrics Grid */}
        {metrics.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Key Metrics</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {metrics
                // Filter out concentration metrics - they're displayed in the dedicated risk section
                .filter((metric: any) => {
                  const metricCode = (metric.metricCode || metric.metric_code || '').toLowerCase();
                  return !metricCode.includes('concentration');
                })
                // Filter out metrics without valid benchmark data (p50 must be non-null and non-zero)
                .filter((metric: any) => {
                  // Keep metric if it has valid benchmark data
                  return metric.p50 != null && metric.p50 !== 0;
                })
                .map((metric: any, i: number) => {
                  const metricCode = (metric.metricCode || metric.metric_code || '').toLowerCase();
                  // For most metrics, higher is better. But for days (debtor/creditor), lower is better.
                  const higherIsBetter = !(
                    metricCode.includes('days') || 
                    metricCode.includes('debtor') || 
                    metricCode.includes('creditor') ||
                    metricCode.includes('turnover')
                  );
                  
                  return (
                    <MetricComparisonCard
                      key={i}
                      metricName={metric.metricName || metric.metric_name || metric.metric}
                      clientValue={metric.clientValue ?? metric.client_value}
                      medianValue={metric.p50}
                      p25={metric.p25}
                      p75={metric.p75}
                      percentile={metric.percentile}
                      format={getMetricFormat(metric.metricCode || metric.metric_code)}
                      higherIsBetter={higherIsBetter}
                      annualImpact={metric.annualImpact ?? metric.annual_impact}
                    />
                  );
                })}
            </div>
          </div>
        )}
        
        {/* Narrative Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          <NarrativeSection
            type="position"
            title="Where You Stand"
            content={data.position_narrative}
            highlights={[`${getOrdinalSuffix(data.overall_percentile || 0)} percentile`]}
            forceExpanded={printMode}
          />
          <NarrativeSection
            type="strengths"
            title="Your Strengths"
            content={data.strength_narrative}
            forceExpanded={printMode}
          />
          <NarrativeSection
            type="gaps"
            title="Performance Gaps"
            content={data.gap_narrative}
            highlights={[`${data.gap_count || 0} gaps identified`]}
            forceExpanded={printMode}
          />
          <NarrativeSection
            type="opportunity"
            title="The Opportunity"
            content={data.opportunity_narrative}
            highlights={[`£${parseFloat(data.total_annual_opportunity || '0').toLocaleString()} potential`]}
            forceExpanded={printMode}
          />
        </div>
        
        {/* Recommendations */}
        {recommendations.length > 0 && (
          <RecommendationsSection
            recommendations={recommendations}
            totalOpportunity={parseFloat(data.total_annual_opportunity) || 0}
          />
        )}
        
        {/* Scenario Explorer */}
        {baselineMetrics && baselineMetrics.revenue > 0 && (
          <ScenarioExplorer 
            baseline={baselineMetrics}
            industryBenchmarks={industryBenchmarks}
          />
        )}
        
        {/* Surplus Cash Breakdown - Enhanced Transparency */}
        {data.pass1_data?.surplus_cash_breakdown && (
          <SurplusCashBreakdown 
            data={data.pass1_data.surplus_cash_breakdown}
            revenue={baselineMetrics?.revenue || data.revenue || 0}
          />
        )}
        
        {/* Business Valuation Analysis */}
        {data.value_analysis && (
          <ValueBridgeSection 
            valueAnalysis={data.value_analysis}
            clientName={clientName}
            forceExpanded={printMode}
          />
        )}
        
        {/* Enhanced Value Suppressors - Where Your Value Is Going */}
        {data.pass1_data?.enhanced_suppressors && data.pass1_data.enhanced_suppressors.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Where Your Value Is Going</h2>
            <p className="text-slate-600 text-sm">
              These factors are reducing what buyers would pay. Each card shows the current discount, 
              target state, and the value you could recover.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {data.pass1_data.enhanced_suppressors.map((suppressor) => (
                <EnhancedSuppressorCard 
                  key={suppressor.code}
                  suppressor={suppressor}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Exit Readiness Breakdown - Component Scoring */}
        {data.pass1_data?.exit_readiness_breakdown && (
          <ExitReadinessBreakdown data={data.pass1_data.exit_readiness_breakdown} />
        )}
        
        {/* Recommended Services - "How We Can Help" section */}
        {/* MOVED UP: After showing problems (exit readiness), services = the fix */}
        {/* Database-driven from bm_reports.recommended_services + opportunities */}
        {recommendedServices.length > 0 && (
          <RecommendedServicesSection
            services={recommendedServices}
            clientName={clientName}
            practitionerName={practitionerName}
            practitionerEmail={practitionerEmail}
          />
        )}
        
        {/* Two Paths Section - Connecting Operational and Strategic */}
        {data.pass1_data?.two_paths_narrative && baselineMetrics && (
          <TwoPathsSection
            marginOpportunity={parseFloat(data.total_annual_opportunity) || 0}
            valueGap={data.value_analysis?.valueGap?.mid || 0}
            ownerName={clientName || 'You'}
            narrative={data.pass1_data.two_paths_narrative}
          />
        )}
        
        {/* Scenario Planning - What If Projections */}
        {/* ASPIRATIONAL CLOSE: Ends on possibility, not pressure */}
        {baselineMetrics && baselineMetrics.revenue > 0 && (
          <ScenarioPlanningSection 
            revenue={baselineMetrics.revenue}
            currentValue={data.value_analysis?.currentMarketValue?.mid}
            baselineValue={data.value_analysis?.baseline?.totalBaseline || data.value_analysis?.baseline?.enterpriseValue?.mid}
            concentration={data.pass1_data?.client_concentration_top3 || data.client_concentration_top3 || 50}
            surplusCash={data.pass1_data?.surplus_cash?.surplusCash || data.value_analysis?.baseline?.surplusCash || 0}
            exitReadinessScore={data.value_analysis?.exitReadiness?.score}
            forceExpanded={printMode}
            clientPreferences={data.client_preferences}
          />
        )}
        
        {/* Closing Summary - Confident wrap-up, no CTA */}
        {baselineMetrics && (
          <section className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 text-white print:bg-slate-800 print:rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Your Position — Summed Up</h2>
            <p className="text-slate-300 leading-relaxed text-lg">
              {(() => {
                const parts: string[] = [];
                
                // Revenue context
                if (baselineMetrics.revenue) {
                  parts.push(`You're a £${(baselineMetrics.revenue / 1000000).toFixed(0)}M business`);
                }
                
                // Percentile
                if (data.overall_percentile) {
                  parts.push(`sitting at the ${getOrdinalSuffix(data.overall_percentile)} percentile`);
                }
                
                // Surplus cash
                const surplus = data.surplus_cash?.surplusCash || data.pass1_data?.surplus_cash?.surplusCash;
                if (surplus && surplus > 0) {
                  parts.push(`with £${(surplus / 1000000).toFixed(1)}M in surplus cash`);
                }
                
                // Margin trajectory
                if (data.pass1_data?.financial_trends?.some((t: any) => t.isRecovering)) {
                  parts.push('and a clear margin recovery trajectory');
                }
                
                let summary = parts.join(' ');
                
                // Opportunity
                const opp = parseFloat(data.total_annual_opportunity) || 0;
                if (opp > 0) {
                  summary += `. The data shows £${opp.toLocaleString()} in annual opportunity`;
                }
                
                // Value gap
                const valueGap = data.value_analysis?.valueGap?.mid;
                if (valueGap && valueGap > 0) {
                  summary += ` and £${(valueGap / 1000000).toFixed(1)}M in trapped value`;
                }
                
                summary += '. The path forward is about protecting what you\'ve built and unlocking what\'s already there.';
                
                return summary;
              })()}
            </p>
          </section>
        )}
        
        {/* Data Sources / Methodology */}
        {data.data_sources && data.data_sources.length > 0 && (
          <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-2">Benchmark Data Sources</p>
            <p className="text-xs text-slate-500 mb-2">
              Analysis based on industry benchmarks as of {data.benchmark_data_as_of || 'recent data'}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.data_sources.slice(0, 8).map((source, i) => (
                <span key={i} className="px-2 py-1 bg-white rounded text-xs text-slate-600 border border-slate-200">
                  {source}
                </span>
              ))}
              {data.data_sources.length > 8 && (
                <span className="px-2 py-1 text-xs text-slate-400">
                  +{data.data_sources.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

