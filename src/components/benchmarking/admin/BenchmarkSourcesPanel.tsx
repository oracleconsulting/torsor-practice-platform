import { useState } from 'react';
import { 
  Database, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Info
} from 'lucide-react';

interface BenchmarkMetric {
  metricCode: string;
  metricName: string;
  p25: number;
  p50: number;
  p75: number;
  source?: string;
  sourceUrl?: string;
  confidence?: number;
  lastUpdated?: string;
}

interface BenchmarkSource {
  name: string;
  url?: string;
  metrics?: string[];
  lastFetched?: string;
}

interface BenchmarkSourcesPanelProps {
  metrics: BenchmarkMetric[];
  sources: BenchmarkSource[] | string[];
  industryName: string;
  industryCode: string;
  dataAsOf?: string;
  onRefreshBenchmarks?: () => void;
  isRefreshing?: boolean;
}

export function BenchmarkSourcesPanel({
  metrics,
  sources,
  industryName,
  industryCode,
  dataAsOf,
  onRefreshBenchmarks,
  isRefreshing = false
}: BenchmarkSourcesPanelProps) {
  const [expandedSection, setExpandedSection] = useState<'metrics' | 'sources' | null>('metrics');
  
  // Normalize sources to array of objects
  const normalizedSources: BenchmarkSource[] = sources.map(s => 
    typeof s === 'string' ? { name: s } : s
  );
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Benchmark Data Sources
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Data for <span className="font-medium">{industryName}</span> ({industryCode})
          </p>
        </div>
        {onRefreshBenchmarks && (
          <button
            onClick={onRefreshBenchmarks}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        )}
      </div>
      
      {/* Data freshness indicator */}
      {dataAsOf && (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
          <Info className="w-4 h-4 text-slate-400" />
          Benchmark data as of: <span className="font-medium">{dataAsOf}</span>
        </div>
      )}
      
      {/* Metrics Section */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'metrics' ? null : 'metrics')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100"
        >
          <span className="font-medium text-slate-700 flex items-center gap-2">
            {expandedSection === 'metrics' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Industry Benchmarks ({metrics.length} metrics)
          </span>
          <span className="text-xs text-slate-500">
            Click to {expandedSection === 'metrics' ? 'collapse' : 'expand'}
          </span>
        </button>
        
        {expandedSection === 'metrics' && (
          <div className="divide-y divide-slate-100">
            {metrics.length > 0 ? (
              metrics.map((metric, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">{metric.metricName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {metric.source && (
                        <span className="inline-flex items-center gap-1">
                          Source: {metric.source}
                          {metric.sourceUrl && (
                            <a href={metric.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-slate-500">
                        <span className="text-xs uppercase tracking-wide">P25</span>
                        <p className="font-medium">{formatValue(metric.p25, metric.metricCode)}</p>
                      </div>
                      <div className="text-slate-700 bg-blue-50 px-2 py-1 rounded">
                        <span className="text-xs uppercase tracking-wide text-blue-600">Median</span>
                        <p className="font-bold">{formatValue(metric.p50, metric.metricCode)}</p>
                      </div>
                      <div className="text-slate-500">
                        <span className="text-xs uppercase tracking-wide">P75</span>
                        <p className="font-medium">{formatValue(metric.p75, metric.metricCode)}</p>
                      </div>
                    </div>
                    {metric.confidence && (
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        {metric.confidence >= 0.8 ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        )}
                        <span className={metric.confidence >= 0.8 ? 'text-emerald-600' : 'text-amber-600'}>
                          {Math.round(metric.confidence * 100)}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No benchmark metrics loaded yet</p>
                <p className="text-xs mt-1">Benchmarks will appear after analysis generation</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Sources Section */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'sources' ? null : 'sources')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100"
        >
          <span className="font-medium text-slate-700 flex items-center gap-2">
            {expandedSection === 'sources' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Data Sources ({normalizedSources.length})
          </span>
        </button>
        
        {expandedSection === 'sources' && (
          <div className="p-4 space-y-3">
            {normalizedSources.length > 0 ? (
              <>
                {normalizedSources.map((source, i) => {
                  // Check if this looks like a URL
                  const isUrl = source.name.startsWith('http');
                  const displayName = isUrl 
                    ? new URL(source.name).hostname.replace('www.', '') 
                    : source.name;
                  const url = source.url || (isUrl ? source.name : null);
                  
                  // Identify source type
                  const sourceType = getSourceType(source.name);
                  
                  return (
                    <div key={i} className="p-3 bg-white border border-slate-100 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${sourceType.color}`}>
                              {sourceType.label}
                            </span>
                            <span className="font-medium text-slate-800">{displayName}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{sourceType.description}</p>
                        </div>
                        {url && (
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Source methodology note */}
                <div className="text-xs text-slate-500 mt-3 p-2 bg-slate-50 rounded">
                  <strong>How we source data:</strong> We combine published industry reports 
                  (SPI Research, Deltek Clarity, IBISWorld) with real-time research via 
                  Perplexity AI to provide the most current and relevant benchmarks for your industry.
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No source information available
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Trust indicator */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
        <p className="text-amber-800">
          <strong>Note:</strong> Benchmark data is sourced from industry reports and research. 
          Values represent typical ranges for UK businesses in this sector. 
          Individual circumstances may vary.
        </p>
      </div>
    </div>
  );
}

function getSourceType(sourceName: string): { label: string; color: string; description: string } {
  const name = sourceName.toLowerCase();
  
  if (name.includes('spi research') || name.includes('spi ')) {
    return {
      label: 'Industry Report',
      color: 'bg-emerald-100 text-emerald-700',
      description: 'Professional services industry benchmark study'
    };
  }
  if (name.includes('deltek') || name.includes('clarity')) {
    return {
      label: 'Industry Report',
      color: 'bg-emerald-100 text-emerald-700',
      description: 'Architecture & engineering benchmark report'
    };
  }
  if (name.includes('benchbee') || name.includes('bench')) {
    return {
      label: 'Benchmark Tool',
      color: 'bg-blue-100 text-blue-700',
      description: 'Agency benchmarking platform'
    };
  }
  if (name.includes('ibis') || name.includes('ibisworld')) {
    return {
      label: 'Market Research',
      color: 'bg-purple-100 text-purple-700',
      description: 'Industry market analysis'
    };
  }
  if (name.includes('ons') || name.includes('gov.uk') || name.includes('statistics')) {
    return {
      label: 'Government Data',
      color: 'bg-slate-100 text-slate-700',
      description: 'Official UK statistics'
    };
  }
  if (name.startsWith('http')) {
    return {
      label: 'Web Source',
      color: 'bg-amber-100 text-amber-700',
      description: 'Online research source'
    };
  }
  
  return {
    label: 'Research',
    color: 'bg-slate-100 text-slate-700',
    description: 'Industry research and analysis'
  };
}

function formatValue(value: number, metricCode: string): string {
  if (!value && value !== 0) return 'N/A';
  
  if (metricCode?.includes('margin') || metricCode?.includes('rate') || metricCode?.includes('utilisation') || metricCode?.includes('concentration') || metricCode?.includes('growth')) {
    return `${value}%`;
  }
  if (metricCode?.includes('days')) {
    return `${value} days`;
  }
  if (metricCode?.includes('revenue') || metricCode?.includes('hourly')) {
    return `£${value.toLocaleString()}`;
  }
  return String(value);
}

