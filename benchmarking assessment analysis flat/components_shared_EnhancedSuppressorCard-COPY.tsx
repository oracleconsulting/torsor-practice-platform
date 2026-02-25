import { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Target,
  Lightbulb,
  PoundSterling
} from 'lucide-react';
import type { EnhancedValueSuppressor } from '../../types/opportunity-calculations';

interface EnhancedSuppressorCardProps {
  suppressor: EnhancedValueSuppressor;
}

export function EnhancedSuppressorCard({ suppressor }: EnhancedSuppressorCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };
  
  const severityColors = {
    CRITICAL: 'border-red-300 bg-red-50',
    HIGH: 'border-orange-300 bg-orange-50',
    MEDIUM: 'border-yellow-300 bg-yellow-50',
    LOW: 'border-slate-300 bg-slate-50'
  };
  
  const severityBadgeColors = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-slate-500 text-white'
  };

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${severityColors[suppressor.severity]}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${
              suppressor.severity === 'CRITICAL' ? 'text-red-600' :
              suppressor.severity === 'HIGH' ? 'text-orange-500' :
              suppressor.severity === 'MEDIUM' ? 'text-yellow-500' :
              'text-slate-500'
            }`} />
            <div>
              <h4 className="font-semibold text-slate-900">{suppressor.name}</h4>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${severityBadgeColors[suppressor.severity]}`}>
                {suppressor.severity}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">
              -{suppressor.current.discountPercent}%
            </div>
            <div className="text-sm text-slate-500">
              -{formatCurrency(suppressor.current.discountValue)}
            </div>
          </div>
        </div>
        
        {/* Current vs Target */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg">
            <div className="text-xs text-slate-500 uppercase font-medium">Current</div>
            <div className="text-lg font-semibold text-slate-900">
              {suppressor.current.value}
            </div>
            <div className="text-xs text-slate-500">{suppressor.current.metric}</div>
          </div>
          <div className="p-3 bg-white rounded-lg border-2 border-emerald-200">
            <div className="text-xs text-emerald-600 uppercase font-medium">Target</div>
            <div className="text-lg font-semibold text-emerald-700">
              {suppressor.target.value}
            </div>
            <div className="text-xs text-emerald-600">{suppressor.target.metric}</div>
          </div>
        </div>
        
        {/* Value Recoverable */}
        <div className="mt-4 p-3 bg-emerald-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-emerald-800">Value Recoverable</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-emerald-700">
              {formatCurrency(suppressor.recovery.valueRecoverable)}
            </span>
            <div className="text-xs text-emerald-600 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              {suppressor.recovery.timeframe}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable section */}
      <div className="border-t">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white/50 transition"
        >
          <span>Why this discount & how to fix</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Evidence */}
            <div>
              <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Evidence</h5>
              <p className="text-sm text-slate-700">{suppressor.evidence}</p>
            </div>
            
            {/* Why this discount */}
            <div className="p-3 bg-white rounded-lg">
              <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Why this discount?
              </h5>
              <p className="text-sm text-slate-700">{suppressor.whyThisDiscount}</p>
              <p className="text-xs text-slate-500 mt-2 italic">{suppressor.industryContext}</p>
            </div>
            
            {/* Path to fix */}
            <div className="p-3 bg-emerald-50 rounded-lg">
              <h5 className="text-xs font-semibold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Path to fix
              </h5>
              <p className="text-sm font-medium text-emerald-800 mb-2">
                {suppressor.pathToFix.summary}
              </p>
              <ol className="text-sm text-emerald-700 space-y-1 ml-4">
                {suppressor.pathToFix.steps.map((step, i) => (
                  <li key={i} className="list-decimal">{step}</li>
                ))}
              </ol>
              
              <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-emerald-600">
                  <PoundSterling className="w-4 h-4" />
                  Investment: {formatCurrency(suppressor.pathToFix.investment)}
                </div>
                <div className="text-emerald-600">
                  ROI: {Math.round(suppressor.recovery.valueRecoverable / suppressor.pathToFix.investment)}x
                </div>
              </div>
            </div>
            
            {/* Dependencies */}
            {suppressor.pathToFix.dependencies.length > 0 && (
              <div className="text-xs text-slate-500">
                <strong>Dependencies:</strong> {suppressor.pathToFix.dependencies.join(', ')}
              </div>
            )}

            {/* Methodology & Sources */}
            {suppressor.methodology && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Methodology & Sources
                </h4>
                <p className="text-sm text-gray-600 mb-2">{suppressor.methodology.calibrationNote}</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  {suppressor.methodology.sources.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
                <p className="text-xs text-gray-400 mt-2 italic">{suppressor.methodology.limitationsNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
