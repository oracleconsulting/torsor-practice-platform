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
  Info,
  Globe,
  Building2,
  FileText,
  TrendingUp,
  Calendar,
  Shield
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

interface DetailedSource {
  name: string;
  url?: string | null;
  type?: string;
  relevance?: number;
  metrics?: string[];
}

interface DetailedSourceData {
  metricSources?: Record<string, {
    metricCode: string;
    metricName: string;
    p25: number;
    p50: number;
    p75: number;
    source: string;
    sources: string[];
    confidence: number;
    fetchedVia: string;
    lastUpdated: string;
    region: string;
  }>;
  uniqueSources?: DetailedSource[];
  totalMetrics?: number;
  liveSearchCount?: number;
  manualDataCount?: number;
  overallConfidence?: number;
  dataQualityNotes?: string;
  marketContext?: string;
  lastRefreshed?: string;
}

interface BenchmarkSourcesPanelProps {
  metrics: BenchmarkMetric[];
  sources: DetailedSource[] | string[];
  detailedSources?: DetailedSourceData;
  industryName: string;
  industryCode: string;
  dataAsOf?: string;
  onRefreshBenchmarks?: () => void;
  isRefreshing?: boolean;
}

export function BenchmarkSourcesPanel({
  metrics,
  sources,
  detailedSources,
  industryName,
  industryCode,
  dataAsOf,
  onRefreshBenchmarks,
  isRefreshing = false
}: BenchmarkSourcesPanelProps) {
  const [expandedSection, setExpandedSection] = useState<'metrics' | 'sources' | 'methodology' | null>('metrics');
  
  // Use detailed sources if available, otherwise normalize simple sources
  const richSources: DetailedSource[] = detailedSources?.uniqueSources || 
    sources.map(s => typeof s === 'string' ? { name: s } : s);
  
  const metricSources = detailedSources?.metricSources || {};
  
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
      
      {/* Data Quality Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-slate-800">{metrics.length}</div>
          <div className="text-xs text-slate-500">Metrics</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{richSources.length}</div>
          <div className="text-xs text-slate-500">Sources</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-700">
            {detailedSources?.liveSearchCount || 0}
          </div>
          <div className="text-xs text-slate-500">Live Data</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">
            {detailedSources?.overallConfidence 
              ? `${Math.round(detailedSources.overallConfidence * 100)}%`
              : 'N/A'}
          </div>
          <div className="text-xs text-slate-500">Confidence</div>
        </div>
      </div>
      
      {/* Data freshness indicator */}
      {dataAsOf && (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Benchmark data as of: <span className="font-medium">{dataAsOf}</span></span>
          {detailedSources?.lastRefreshed && (
            <span className="text-slate-400">
              · Last refreshed: {new Date(detailedSources.lastRefreshed).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
      
      {/* Market Context (if available) */}
      {detailedSources?.marketContext && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Market Context</p>
              <p className="text-sm text-blue-700 mt-1">{detailedSources.marketContext}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Metrics Section with Source Attribution */}
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
            {expandedSection === 'metrics' ? 'Click to collapse' : 'Click to expand'}
          </span>
        </button>
        
        {expandedSection === 'metrics' && (
          <div className="divide-y divide-slate-100">
            {metrics.length > 0 ? (
              metrics.map((metric, i) => {
                const detailedMetric = metricSources[metric.metricCode];
                return (
                  <div key={i} className="px-4 py-3 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{metric.metricName}</p>
                        <div className="mt-1 space-y-1">
                          {(metric.source || detailedMetric?.source) && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Source: {metric.source || detailedMetric?.source}
                              {(metric.sourceUrl || (detailedMetric?.sources?.[0]?.startsWith('http') && detailedMetric.sources[0])) && (
                                <a 
                                  href={metric.sourceUrl || detailedMetric?.sources?.[0]} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-500 hover:text-blue-600 ml-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </p>
                          )}
                          {detailedMetric?.fetchedVia && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              {detailedMetric.fetchedVia === 'live_search' ? (
                                <>
                                  <Globe className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600">Live search data</span>
                                </>
                              ) : (
                                <>
                                  <Database className="w-3 h-3" />
                                  <span>Research data</span>
                                </>
                              )}
                              {detailedMetric.region && <span>· {detailedMetric.region}</span>}
                            </p>
                          )}
                        </div>
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
                        {(metric.confidence || detailedMetric?.confidence) && (
                          <div className="mt-1 flex items-center gap-1 text-xs justify-end">
                            {(metric.confidence || detailedMetric?.confidence || 0) >= 0.8 ? (
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                            )}
                            <span className={(metric.confidence || detailedMetric?.confidence || 0) >= 0.8 ? 'text-emerald-600' : 'text-amber-600'}>
                              {Math.round((metric.confidence || detailedMetric?.confidence || 0) * 100)}% confidence
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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
      
      {/* Sources Section - Detailed */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'sources' ? null : 'sources')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100"
        >
          <span className="font-medium text-slate-700 flex items-center gap-2">
            {expandedSection === 'sources' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Data Sources ({richSources.length})
          </span>
        </button>
        
        {expandedSection === 'sources' && (
          <div className="p-4 space-y-3">
            {richSources.length > 0 ? (
              <>
                {richSources.map((source, i) => {
                  const sourceType = getSourceTypeInfo(source.type || classifySource(source.name));
                  const isUrl = source.name.startsWith('http');
                  const displayName = isUrl 
                    ? extractDomain(source.name) 
                    : source.name;
                  
                  return (
                    <div key={i} className="p-3 bg-white border border-slate-100 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${sourceType.color}`}>
                              {sourceType.icon} {sourceType.label}
                            </span>
                            <span className="font-medium text-slate-800">{displayName}</span>
                            {source.relevance && (
                              <span className="text-xs text-slate-400">
                                ({Math.round(source.relevance * 100)}% relevant)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{sourceType.description}</p>
                          {source.metrics && source.metrics.length > 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                              Used for: {source.metrics.slice(0, 3).join(', ')}
                              {source.metrics.length > 3 && ` +${source.metrics.length - 3} more`}
                            </p>
                          )}
                        </div>
                        {source.url && (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex-shrink-0"
                          >
                            Visit <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No source information available
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Methodology Section */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'methodology' ? null : 'methodology')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100"
        >
          <span className="font-medium text-slate-700 flex items-center gap-2">
            {expandedSection === 'methodology' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Methodology & Data Quality
          </span>
        </button>
        
        {expandedSection === 'methodology' && (
          <div className="p-4 space-y-4">
            {/* How we source data */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                How We Source Data
              </h4>
              <p className="text-sm text-slate-600">
                We combine multiple authoritative sources to provide accurate industry benchmarks:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Government data</strong> - ONS, Companies House, HMRC statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Industry reports</strong> - SPI Research, Deltek Clarity, IBISWorld</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Live research</strong> - Real-time data via Perplexity AI search</span>
                </li>
              </ul>
            </div>
            
            {/* Data quality notes if available */}
            {detailedSources?.dataQualityNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-amber-800 mb-1">Data Quality Notes</h4>
                <p className="text-sm text-amber-700">{detailedSources.dataQualityNotes}</p>
              </div>
            )}
            
            {/* Confidence explanation */}
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Confidence Scoring</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span><strong>80%+</strong> High confidence</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span><strong>50-79%</strong> Moderate</span>
                </div>
                <div className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400" />
                  <span><strong>&lt;50%</strong> Indicative</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Confidence reflects data recency, source authority, and sample size relevance.
              </p>
            </div>
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

function getSourceTypeInfo(type: string): { label: string; color: string; description: string; icon: string } {
  switch (type) {
    case 'government':
      return {
        label: 'Government',
        color: 'bg-slate-100 text-slate-700',
        description: 'Official UK government statistics and reports',
        icon: '🏛️'
      };
    case 'trade_association':
      return {
        label: 'Trade Body',
        color: 'bg-emerald-100 text-emerald-700',
        description: 'Industry association benchmark reports',
        icon: '📊'
      };
    case 'research':
      return {
        label: 'Research',
        color: 'bg-purple-100 text-purple-700',
        description: 'Market research and analysis',
        icon: '🔬'
      };
    case 'company_data':
      return {
        label: 'Company Data',
        color: 'bg-blue-100 text-blue-700',
        description: 'Financial data from company filings',
        icon: '📁'
      };
    case 'aggregator':
      return {
        label: 'Data Aggregator',
        color: 'bg-amber-100 text-amber-700',
        description: 'Aggregated business intelligence',
        icon: '📈'
      };
    default:
      return {
        label: 'Source',
        color: 'bg-slate-100 text-slate-700',
        description: 'Industry research and analysis',
        icon: '📄'
      };
  }
}

function classifySource(sourceName: string): string {
  const name = sourceName.toLowerCase();
  
  if (name.includes('ons') || name.includes('gov.uk') || name.includes('hmrc') || name.includes('statistics')) {
    return 'government';
  }
  if (name.includes('spi') || name.includes('deltek') || name.includes('benchbee') || name.includes('association')) {
    return 'trade_association';
  }
  if (name.includes('ibis') || name.includes('statista') || name.includes('euromonitor')) {
    return 'research';
  }
  if (name.includes('companies house') || name.includes('annual report')) {
    return 'company_data';
  }
  if (name.includes('crunchbase') || name.includes('linkedin') || name.includes('glassdoor')) {
    return 'aggregator';
  }
  
  return 'research';
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
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
