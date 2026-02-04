import { useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Clock
} from 'lucide-react';
import type { ValueAnalysis, ValueSuppressor, ValueEnhancer } from '../../../types/benchmarking';

interface Props {
  valueAnalysis: ValueAnalysis;
  clientName?: string;
  forceExpanded?: boolean; // For PDF export - shows all details
}

export function ValueBridgeSection({ valueAnalysis, clientName = 'Your Business', forceExpanded = false }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  
  // If forceExpanded (for PDF), always show details
  const isShowingDetails = forceExpanded || showDetails;
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };

  const { baseline, suppressors, currentMarketValue, valueGap, exitReadiness, pathToValue, enhancers } = valueAnalysis;

  const severityColors = {
    critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-500' },
    high: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', badge: 'bg-amber-500' },
    medium: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', badge: 'bg-blue-500' },
    low: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', badge: 'bg-slate-400' },
  };

  const exitVerdictConfig = {
    ready: { bg: 'bg-green-100', text: 'text-green-800', label: 'Exit Ready' },
    needs_work: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Needs Work' },
    not_ready: { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Exit Ready' },
  };

  return (
    <div className="space-y-8">
      {/* Hero Value Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white">
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />
        
        <div className="relative">
          <h2 className="text-2xl font-bold mb-2">Business Valuation Analysis</h2>
          <p className="text-slate-300 text-sm mb-6">
            What {clientName} could be worth, and what's holding back the value
          </p>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Baseline Value</div>
              <div className="text-3xl font-bold text-blue-400">
                {formatCurrency(baseline.enterpriseValue.mid)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {baseline.multipleRange.mid}x EBITDA
              </div>
            </div>
            
            <div className="text-center border-x border-slate-700 px-4">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Current Value</div>
              <div className="text-3xl font-bold text-amber-400">
                {formatCurrency(currentMarketValue.mid)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                After structural discounts
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Value Gap</div>
              <div className="text-3xl font-bold text-red-400">
                {formatCurrency(valueGap.mid)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {valueAnalysis.valueGapPercent.toFixed(0)}% trapped
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Bridge Visualization */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Where Your Value Is Going</h3>
          {!forceExpanded && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              data-no-print
            >
              {isShowingDetails ? 'Hide' : 'Show'} details
              {isShowingDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {/* Starting point */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-medium text-blue-900">Baseline Enterprise Value</span>
                <p className="text-xs text-blue-700">{baseline.multipleJustification}</p>
              </div>
            </div>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(baseline.enterpriseValue.mid)}
            </span>
          </div>
          
          {/* Surplus cash add-back */}
          {baseline.surplusCash > 100000 && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 ml-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-green-800">Including surplus cash</span>
              </div>
              <span className="font-semibold text-green-600">
                +{formatCurrency(baseline.surplusCash)}
              </span>
            </div>
          )}
          
          {/* Suppressors */}
          {suppressors.map((s: ValueSuppressor) => {
            const colors = severityColors[s.severity as keyof typeof severityColors];
            const avgImpact = (s.impactAmount.low + s.impactAmount.high) / 2;
            
            return (
              <div 
                key={s.id} 
                className={`p-4 rounded-lg border ml-4 ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingDown className={`w-5 h-5 ${colors.text}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${colors.text}`}>{s.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${colors.badge}`}>
                          {s.severity.toUpperCase()}
                        </span>
                      </div>
                      {isShowingDetails && (
                        <p className="text-xs mt-1 opacity-80">{s.evidence}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${colors.text}`}>
                    -{formatCurrency(avgImpact)}
                  </span>
                </div>
                {isShowingDetails && s.remediable && (
                  <div className="mt-2 pt-2 border-t border-dashed border-current/20 text-xs flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Fixable in ~{s.remediationTimeMonths}mo via {s.remediationService}</span>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Result */}
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border-2 border-amber-400 ml-0 mt-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-amber-700" />
              <div>
                <span className="font-bold text-amber-900">Current Market Value</span>
                <p className="text-xs text-amber-700">What a buyer would likely pay today</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-amber-700">
              {formatCurrency(currentMarketValue.mid)}
            </span>
          </div>
        </div>
      </div>

      {/* Exit Readiness Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Exit Readiness</h3>
          <div className={`px-4 py-2 rounded-full font-bold ${exitVerdictConfig[exitReadiness.verdict as keyof typeof exitVerdictConfig].bg} ${exitVerdictConfig[exitReadiness.verdict as keyof typeof exitVerdictConfig].text}`}>
            {exitReadiness.score}/100 — {exitVerdictConfig[exitReadiness.verdict as keyof typeof exitVerdictConfig].label}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full transition-all duration-500 ${
              exitReadiness.score >= 70 ? 'bg-green-500' :
              exitReadiness.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${exitReadiness.score}%` }}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Blockers */}
          {exitReadiness.blockers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Exit Blockers
              </h4>
              <ul className="space-y-2">
                {exitReadiness.blockers.map((blocker: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    {blocker}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Strengths */}
          {exitReadiness.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                Value Protectors
              </h4>
              <ul className="space-y-2">
                {exitReadiness.strengths.map((strength: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Value Enhancers */}
      {enhancers.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Value Protectors
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {enhancers.map((e: ValueEnhancer) => (
              <div key={e.id} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="font-medium text-green-800">{e.name}</div>
                <div className="text-sm text-green-600 mt-1">{e.evidence}</div>
                {e.value && (
                  <div className="text-xs text-green-700 mt-2 font-semibold">
                    +{formatCurrency(e.value)} to value
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Path to Value */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Path to Full Value</h3>
        <p className="text-blue-700 mb-6">
          Over the next {pathToValue.timeframeMonths} months, addressing these structural issues could unlock{' '}
          <span className="font-bold text-blue-800">
            {formatCurrency(pathToValue.recoverableValue.mid)}
          </span>{' '}
          in hidden value.
        </p>
        
        <div className="space-y-3">
          {pathToValue.keyActions.map((action: string, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-white/70 rounded-lg p-3 border border-blue-200">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <span className="text-blue-800">{action}</span>
              <ArrowRight className="w-4 h-4 text-blue-400 ml-auto" />
            </div>
          ))}
        </div>
        
        {/* Potential value */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600">Potential Future Value</div>
              <div className="text-xs text-blue-500">After addressing key issues</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(valueAnalysis.potentialValue.mid)}
              </div>
              <div className="text-xs text-green-600">
                +{formatCurrency(valueAnalysis.potentialValue.mid - currentMarketValue.mid)} uplift
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ValueBridgeSection;

