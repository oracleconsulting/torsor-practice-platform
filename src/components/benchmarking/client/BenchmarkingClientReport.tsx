import { useMemo } from 'react';
import { HeroSection } from './HeroSection';
import { MetricComparisonCard } from './MetricComparisonCard';
import { NarrativeSection } from './NarrativeSection';
import { RecommendationsSection } from './RecommendationsSection';
import { ScenarioExplorer } from './ScenarioExplorer';
import { AlertTriangle, Gem, Shield, CheckCircle } from 'lucide-react';
import type { BaselineMetrics } from '../../../lib/scenario-calculator';

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
  };
  // HVA fields for competitive moat
  hva_data?: {
    competitive_moat?: string[];
    unique_methods?: string;
    reputation_build_time?: string;
  };
}

interface BenchmarkingClientReportProps {
  data: BenchmarkAnalysis;
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

export function BenchmarkingClientReport({ data }: BenchmarkingClientReportProps) {
  const metrics = safeJsonParse(data.metrics_comparison, []);
  const recommendations = safeJsonParse(data.recommendations, []);
  
  // Helper to get metric value from metrics array
  const getMetricValue = (code: string): number | undefined => {
    const metric = metrics.find((m: any) => {
      const metricCode = (m.metricCode || m.metric_code || '').toLowerCase();
      return metricCode === code.toLowerCase() || metricCode.includes(code.toLowerCase());
    });
    return metric?.clientValue ?? metric?.client_value;
  };
  
  // Helper to get benchmark data for a metric
  const getBenchmarkForMetric = (code: string): { p25: number; p50: number; p75: number } | undefined => {
    const metric = metrics.find((m: any) => {
      const metricCode = (m.metricCode || m.metric_code || '').toLowerCase();
      return metricCode === code.toLowerCase() || metricCode.includes(code.toLowerCase());
    });
    if (!metric || metric.p50 == null) return undefined;
    return { p25: metric.p25, p50: metric.p50, p75: metric.p75 };
  };
  
  // Build baseline metrics for scenario calculations
  const baselineMetrics = useMemo((): BaselineMetrics | null => {
    // Try to get revenue from multiple sources
    const revenue = data.revenue || 
                    data.pass1_data?._enriched_revenue || 
                    getMetricValue('revenue') || 
                    0;
    
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
    
    // Get employee count
    const employeeCount = data.employee_count || 
                          data.pass1_data?._enriched_employee_count || 
                          1;
    
    // Get revenue per employee
    const revenuePerEmployee = data.pass1_data?.revenue_per_employee || 
                               getMetricValue('revenue_per_employee') || 
                               (revenue / employeeCount);
    
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
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Benchmarking Report</p>
              <p className="text-xs text-slate-400">
                Generated {data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : 'Recently'}
              </p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Download PDF
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
          />
          <NarrativeSection
            type="strengths"
            title="Your Strengths"
            content={data.strength_narrative}
          />
          <NarrativeSection
            type="gaps"
            title="Performance Gaps"
            content={data.gap_narrative}
            highlights={[`${data.gap_count || 0} gaps identified`]}
          />
          <NarrativeSection
            type="opportunity"
            title="The Opportunity"
            content={data.opportunity_narrative}
            highlights={[`£${parseFloat(data.total_annual_opportunity || '0').toLocaleString()} potential`]}
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
        
        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Ready to capture this opportunity?
          </h2>
          <p className="text-blue-100 mb-6">
            Let's discuss how to turn these insights into action.
          </p>
          <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            Schedule a Discussion
          </button>
        </div>
        
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

