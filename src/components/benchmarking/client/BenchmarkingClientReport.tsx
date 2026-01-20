import { HeroSection } from './HeroSection';
import { MetricComparisonCard } from './MetricComparisonCard';
import { NarrativeSection } from './NarrativeSection';
import { RecommendationsSection } from './RecommendationsSection';

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
        
        {/* Metrics Grid */}
        {metrics.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Key Metrics</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {metrics.map((metric: any, i: number) => {
                const metricCode = metric.metricCode?.toLowerCase() || '';
                // For most metrics, higher is better. But for days (debtor/creditor) and concentration, lower is better.
                const higherIsBetter = !(
                  metricCode.includes('days') || 
                  metricCode.includes('debtor') || 
                  metricCode.includes('creditor') ||
                  metricCode.includes('concentration')
                );
                
                return (
                  <MetricComparisonCard
                    key={i}
                    metricName={metric.metricName || metric.metric}
                    clientValue={metric.clientValue}
                    medianValue={metric.p50}
                    p25={metric.p25}
                    p75={metric.p75}
                    percentile={metric.percentile}
                    format={getMetricFormat(metric.metricCode)}
                    higherIsBetter={higherIsBetter}
                    annualImpact={metric.annualImpact}
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
            highlights={[`${data.overall_percentile || 0}th percentile`]}
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

