import { useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Target,
  Clock
} from 'lucide-react';
import type { ValueAnalysis, ValueSuppressor, ValueEnhancer } from '../../../types/benchmarking';

interface Props {
  valueAnalysis: ValueAnalysis;
  clientName?: string;
}

export function ValueAnalysisPanel({ valueAnalysis, clientName: _clientName = 'the client' }: Props) {
  const [expandedSuppressor, setExpandedSuppressor] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const { baseline, suppressors, currentMarketValue, valueGap, exitReadiness, pathToValue, enhancers } = valueAnalysis;

  const severityColors = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500 text-white' },
    high: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500 text-white' },
    medium: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-500 text-white' },
    low: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-400 text-white' },
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-6 text-white">
        <h2 className="text-lg font-bold mb-4">Value Analysis Summary</h2>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-400 uppercase">Baseline</div>
            <div className="text-xl font-bold text-blue-400">{formatCurrency(baseline.enterpriseValue.mid)}</div>
            <div className="text-xs text-slate-400">{baseline.multipleRange.mid}x EBITDA</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Discounts</div>
            <div className="text-xl font-bold text-red-400">-{valueAnalysis.aggregateDiscount.percentRange.mid}%</div>
            <div className="text-xs text-slate-400">{suppressors.length} issues</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Current Value</div>
            <div className="text-xl font-bold text-amber-400">{formatCurrency(currentMarketValue.mid)}</div>
            <div className="text-xs text-slate-400">Today's price</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase">Value Gap</div>
            <div className="text-xl font-bold text-emerald-400">{formatCurrency(valueGap.mid)}</div>
            <div className="text-xs text-slate-400">{valueAnalysis.valueGapPercent.toFixed(0)}% trapped</div>
          </div>
        </div>
        
        {/* Exit Readiness Badge */}
        <div className="mt-4 pt-4 border-t border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">Exit Readiness:</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
            exitReadiness.verdict === 'ready' ? 'bg-green-500' :
            exitReadiness.verdict === 'needs_work' ? 'bg-amber-500' : 'bg-red-500'
          }`}>
            {exitReadiness.score}/100 — {exitReadiness.verdict === 'ready' ? 'Ready' : exitReadiness.verdict === 'needs_work' ? 'Needs Work' : 'Not Ready'}
          </div>
        </div>
      </div>

      {/* Quick Opening Script */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Opening Script
          </h3>
          <button
            onClick={() => copyText('opening', `Based on your financials and the Hidden Value assessment, your business has a baseline value of around ${formatCurrency(baseline.enterpriseValue.mid)} — that's ${baseline.multipleRange.mid}x EBITDA plus ${formatCurrency(baseline.surplusCash)} surplus cash. But there are some structural issues we've identified that would likely see a buyer discount that by ${valueAnalysis.aggregateDiscount.percentRange.mid}% or so. That puts your current market value closer to ${formatCurrency(currentMarketValue.mid)}. The good news? About ${formatCurrency(pathToValue.recoverableValue.mid)} of that gap is addressable over 18-24 months.`)}
            className="text-blue-600 hover:text-blue-700"
          >
            {copiedId === 'opening' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-sm text-blue-800 italic">
          "Based on your financials and the Hidden Value assessment, your business has a baseline value of around {formatCurrency(baseline.enterpriseValue.mid)} — that's {baseline.multipleRange.mid}x EBITDA plus {formatCurrency(baseline.surplusCash)} surplus cash. 
          <br /><br />
          But there are some structural issues we've identified that would likely see a buyer discount that by {valueAnalysis.aggregateDiscount.percentRange.mid}% or so. That puts your current market value closer to {formatCurrency(currentMarketValue.mid)}.
          <br /><br />
          The good news? About {formatCurrency(pathToValue.recoverableValue.mid)} of that gap is addressable over 18-24 months."
        </p>
      </div>

      {/* Value Suppressors with Talk Tracks */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-500" />
          Value Suppressors ({suppressors.length})
        </h3>
        
        <div className="space-y-3">
          {suppressors.map((suppressor: ValueSuppressor) => {
            const colors = severityColors[suppressor.severity as keyof typeof severityColors];
            const isExpanded = expandedSuppressor === suppressor.id;
            const avgImpact = (suppressor.impactAmount.low + suppressor.impactAmount.high) / 2;
            
            return (
              <div 
                key={suppressor.id}
                className={`rounded-lg border overflow-hidden ${colors.border} ${colors.bg}`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedSuppressor(isExpanded ? null : suppressor.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                    ) : (
                      <ChevronRight className={`w-5 h-5 ${colors.text}`} />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${colors.text}`}>{suppressor.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.badge}`}>
                          {suppressor.severity.toUpperCase()}
                        </span>
                        {suppressor.remediable && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            FIXABLE
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">{suppressor.evidence}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${colors.text}`}>-{formatCurrency(avgImpact)}</div>
                    <div className="text-xs opacity-70">{suppressor.discountPercent.low}-{suppressor.discountPercent.high}%</div>
                  </div>
                </button>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-white/30">
                    {/* HVA Source */}
                    <div className="mt-3 bg-white/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Data Source</div>
                      <div className="text-sm">
                        <span className="font-mono text-xs bg-slate-200 px-1 rounded">{suppressor.hvaField}</span>
                        {' = '}
                        <span className="font-semibold">{suppressor.hvaValue}</span>
                      </div>
                    </div>
                    
                    {/* Talking Point */}
                    {suppressor.talkingPoint && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wide">
                            <MessageSquare className="w-3 h-3" />
                            Say This
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyText(suppressor.id, suppressor.talkingPoint!);
                            }}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {copiedId === suppressor.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 italic">"{suppressor.talkingPoint}"</p>
                      </div>
                    )}
                    
                    {/* Question to Ask */}
                    {suppressor.questionToAsk && (
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <div className="flex items-center gap-2 text-xs text-amber-700 uppercase tracking-wide mb-2">
                          <HelpCircle className="w-3 h-3" />
                          Ask This
                        </div>
                        <p className="text-sm text-amber-800">"{suppressor.questionToAsk}"</p>
                      </div>
                    )}
                    
                    {/* Remediation */}
                    {suppressor.remediable && suppressor.remediationService && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-2 text-xs text-green-700 uppercase tracking-wide mb-2">
                          <Sparkles className="w-3 h-3" />
                          How We Can Help
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-800 font-medium">{suppressor.remediationService}</span>
                          {suppressor.remediationTimeMonths && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ~{suppressor.remediationTimeMonths} months
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Value Enhancers */}
      {enhancers.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Value Protectors ({enhancers.length})
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {enhancers.map((e: ValueEnhancer) => (
              <div key={e.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">{e.name}</span>
                </div>
                <p className="text-xs text-green-600">{e.evidence}</p>
                {e.value && (
                  <div className="mt-2 text-sm font-semibold text-green-700">
                    +{formatCurrency(e.value)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Path to Value */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <ArrowRight className="w-5 h-5" />
          Path to Full Value
        </h3>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Recoverable Value</div>
              <div className="text-xs text-slate-500">Over {pathToValue.timeframeMonths} months</div>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(pathToValue.recoverableValue.mid)}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-xs text-blue-700 uppercase tracking-wide mb-2">Key Actions</div>
          {pathToValue.keyActions.map((action: string, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded px-3 py-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <span className="text-sm text-blue-800">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exit Readiness Details */}
      <div className="grid grid-cols-2 gap-4">
        {exitReadiness.blockers.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Exit Blockers
            </h4>
            <ul className="space-y-2">
              {exitReadiness.blockers.map((blocker: string, i: number) => (
                <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {blocker}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {exitReadiness.strengths.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Exit Strengths
            </h4>
            <ul className="space-y-2">
              {exitReadiness.strengths.map((strength: string, i: number) => (
                <li key={i} className="text-sm text-green-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ValueAnalysisPanel;

