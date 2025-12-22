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
}

interface BenchmarkingClientReportProps {
  data: BenchmarkAnalysis;
}

export function BenchmarkingClientReport({ data }: BenchmarkingClientReportProps) {
  const metrics = data.metrics_comparison ? JSON.parse(data.metrics_comparison) : [];
  const recommendations = data.recommendations ? JSON.parse(data.recommendations) : [];
  
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
              {metrics.map((metric: any, i: number) => (
                <MetricComparisonCard
                  key={i}
                  metricName={metric.metricName || metric.metric}
                  clientValue={metric.clientValue}
                  medianValue={metric.p50}
                  p25={metric.p25}
                  p75={metric.p75}
                  percentile={metric.percentile}
                  format={metric.metricCode?.includes('margin') || metric.metricCode?.includes('rate') ? 'percent' : 'currency'}
                  higherIsBetter={!metric.metricCode?.includes('days') && !metric.metricCode?.includes('concentration')}
                  annualImpact={metric.annualImpact}
                />
              ))}
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
      </div>
    </div>
  );
}

