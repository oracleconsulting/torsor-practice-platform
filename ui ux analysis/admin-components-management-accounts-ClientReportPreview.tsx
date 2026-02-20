'use client';

import { useState } from 'react';
import { 
  Eye,
  Edit3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  DollarSign,
  BarChart3,
  MessageSquare,
  Calendar,
  Building2,
  ArrowRight
} from 'lucide-react';
import type { MAFinancialData, MAInsight, MAKPIValue, TierType } from '../../types/ma';

interface ClientReportPreviewProps {
  clientName: string;
  periodLabel: string;
  tier: TierType;
  financialData: MAFinancialData | null;
  kpis: MAKPIValue[];
  insights: MAInsight[];
  tuesdayQuestion?: string;
  tuesdayAnswer?: string;
  onEditSection?: (section: 'financial' | 'kpis' | 'insights' | 'tuesday') => void;
}

export function ClientReportPreview({
  clientName,
  periodLabel,
  tier,
  financialData,
  kpis,
  insights,
  tuesdayQuestion,
  tuesdayAnswer,
  onEditSection
}: ClientReportPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Filter to only show approved insights that are visible to client
  const clientVisibleInsights = insights.filter(
    i => i.status === 'approved' && i.show_to_client
  );

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRAGColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: string | undefined) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getInsightIcon = (type: string | undefined) => {
    switch (type) {
      case 'action_required': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default: return <CheckCircle2 className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-white" />
          <div>
            <h2 className="text-white font-semibold">Client Portal Preview</h2>
            <p className="text-slate-300 text-sm">This is exactly what {clientName} will see</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              previewMode === 'desktop' 
                ? 'bg-white text-slate-800' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              previewMode === 'mobile' 
                ? 'bg-white text-slate-800' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className={`bg-slate-200 rounded-xl p-4 ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Client Portal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
              <Calendar className="h-4 w-4" />
              {periodLabel}
            </div>
            <h1 className="text-2xl font-bold mb-1">Management Report</h1>
            <div className="flex items-center gap-2 text-blue-100">
              <Building2 className="h-4 w-4" />
              {clientName}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            
            {/* Tuesday Question Section */}
            {tuesdayQuestion && (
              <section className="relative">
                {onEditSection && (
                  <button 
                    onClick={() => onEditSection('tuesday')}
                    className="absolute -top-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-10"
                    title="Edit Tuesday Question"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900 mb-1">Your Question This Month</h3>
                      <p className="text-purple-700 italic mb-3">"{tuesdayQuestion}"</p>
                      {tuesdayAnswer ? (
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <p className="text-slate-700 whitespace-pre-wrap">{tuesdayAnswer}</p>
                        </div>
                      ) : (
                        <p className="text-purple-400 text-sm">Answer pending...</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Key Metrics Summary */}
            <section className="relative">
              {onEditSection && (
                <button 
                  onClick={() => onEditSection('financial')}
                  className="absolute -top-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-10"
                  title="Edit Financial Data"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-slate-400" />
                Financial Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                  label="Revenue" 
                  value={formatCurrency(financialData?.revenue)}
                  trend={financialData?.revenue && financialData.revenue > 0 ? 'up' : undefined}
                />
                <MetricCard 
                  label="Gross Profit" 
                  value={formatCurrency(financialData?.gross_profit)}
                  subValue={financialData?.revenue && financialData?.gross_profit 
                    ? `${((financialData.gross_profit / financialData.revenue) * 100).toFixed(1)}% margin`
                    : undefined
                  }
                />
                <MetricCard 
                  label="True Cash" 
                  value={formatCurrency(financialData?.true_cash)}
                  highlight={financialData?.true_cash && financialData.true_cash < 50000 ? 'warning' : undefined}
                />
                <MetricCard 
                  label="Cash Runway" 
                  value={financialData?.true_cash_runway_months 
                    ? `${financialData.true_cash_runway_months.toFixed(1)} months`
                    : '—'
                  }
                  highlight={financialData?.true_cash_runway_months && financialData.true_cash_runway_months < 3 ? 'danger' : undefined}
                />
              </div>
            </section>

            {/* KPIs */}
            {kpis.length > 0 && (
              <section className="relative">
                {onEditSection && (
                  <button 
                    onClick={() => onEditSection('kpis')}
                    className="absolute -top-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-10"
                    title="Edit KPIs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                  Key Performance Indicators
                </h2>
                <div className="space-y-3">
                  {kpis.map((kpi) => (
                    <div 
                      key={kpi.id || kpi.kpi_code}
                      className={`flex items-center justify-between p-4 rounded-lg border ${getRAGColor(kpi.rag_status)}`}
                    >
                      <div>
                        <div className="font-medium">{kpi.kpi_code?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                        {kpi.manual_commentary && (
                          <div className="text-sm mt-1 opacity-80">{kpi.manual_commentary}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{kpi.value}</div>
                        {kpi.target_value && (
                          <div className="text-xs opacity-70">Target: {kpi.target_value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Insights */}
            <section className="relative">
              {onEditSection && (
                <button 
                  onClick={() => onEditSection('insights')}
                  className="absolute -top-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-10"
                  title="Edit Insights"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-slate-400" />
                Insights & Recommendations
                <span className="text-sm font-normal text-slate-500">
                  ({clientVisibleInsights.length} insights)
                </span>
              </h2>
              
              {clientVisibleInsights.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No approved insights to display</p>
                  <p className="text-sm">Approve insights in the review panel to show them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientVisibleInsights.map((insight) => (
                    <div 
                      key={insight.id}
                      className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.insight_type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-semibold text-slate-800">{insight.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(insight.priority)}`}>
                              {insight.priority}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm mb-3">{insight.description}</p>
                          
                          {insight.data_points && insight.data_points.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {insight.data_points.map((dp, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                                  {dp}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {insight.recommendation && (
                            <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-sm">
                              <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-blue-700">Recommended: </span>
                                <span className="text-blue-600">{insight.recommendation}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 text-center text-sm text-slate-400">
              <p>Prepared by your accounts team • {tier.charAt(0).toUpperCase() + tier.slice(1)} Service</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Stats */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-500">Approved Insights:</span>
            <span className="ml-2 font-semibold text-slate-700">{clientVisibleInsights.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Hidden from Client:</span>
            <span className="ml-2 font-semibold text-slate-700">
              {insights.filter(i => !i.show_to_client || i.status !== 'approved').length}
            </span>
          </div>
          <div>
            <span className="text-slate-500">KPIs:</span>
            <span className="ml-2 font-semibold text-slate-700">{kpis.length}</span>
          </div>
        </div>
        {clientVisibleInsights.length === 0 && (
          <span className="text-amber-600 font-medium">⚠️ No insights will be visible to client</span>
        )}
      </div>
    </div>
  );
}

// Helper component for metric cards
function MetricCard({ 
  label, 
  value, 
  subValue, 
  trend, 
  highlight 
}: { 
  label: string; 
  value: string; 
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: 'warning' | 'danger';
}) {
  const highlightClass = highlight === 'danger' 
    ? 'border-red-200 bg-red-50' 
    : highlight === 'warning' 
      ? 'border-amber-200 bg-amber-50' 
      : 'border-slate-200 bg-white';

  return (
    <div className={`p-4 rounded-lg border ${highlightClass}`}>
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-slate-800">{value}</span>
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        {trend === 'neutral' && <Minus className="h-4 w-4 text-slate-400" />}
      </div>
      {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
    </div>
  );
}

