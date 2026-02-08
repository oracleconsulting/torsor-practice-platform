import { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, Info, AlertCircle } from 'lucide-react';
import type { OpportunityCalculation } from '../../types/opportunity-calculations';

interface CalculationBreakdownProps {
  calculation: OpportunityCalculation;
  showByDefault?: boolean;
}

export function CalculationBreakdown({ calculation, showByDefault = false }: CalculationBreakdownProps) {
  const [expanded, setExpanded] = useState(showByDefault);
  
  const formatValue = (value: number, unit: string) => {
    if (unit === '£') {
      if (value >= 1000000) return `£${(value / 1000000).toFixed(2)}M`;
      if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
      return `£${value.toFixed(0)}`;
    }
    if (unit === '%' || unit === 'percentage points') {
      return `${value.toFixed(1)}${unit === '%' ? '%' : ' pp'}`;
    }
    return value.toString();
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header - Always visible */}
      <button 
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Calculator className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-slate-700">How we calculated this</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>
      
      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-6">
          {/* Calculation Steps */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Calculation Steps</h4>
            <div className="space-y-3">
              {calculation.calculation.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-600">{step.description}</div>
                    <div className="font-mono text-xs text-slate-400 mt-0.5">{step.formula}</div>
                    <div className="font-semibold text-slate-900 mt-1">
                      {formatValue(step.result, step.unit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Assumptions */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Assumptions
            </h4>
            <div className="space-y-2">
              {calculation.calculation.assumptions.map((assumption, index) => (
                <div key={index} className="bg-blue-50 rounded p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-blue-900">{assumption.name}</span>
                    <span className="text-sm font-semibold text-blue-700">{assumption.value}</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">{assumption.rationale}</p>
                  <span className="text-xs text-blue-500 mt-1 inline-block">
                    Source: {assumption.source.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Interpretation */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">What This Means</h4>
            <p className="text-sm text-slate-600">{calculation.interpretation.whatThisMeans}</p>
            <p className="text-sm text-slate-600 mt-2">{calculation.interpretation.whyThisMatters}</p>
            
            {calculation.interpretation.caveat && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{calculation.interpretation.caveat}</p>
              </div>
            )}
          </div>
          
          {/* Path to Capture */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">How to Capture This</h4>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                <div className="text-xs text-emerald-600 uppercase font-medium mb-1">Realistic Target</div>
                <p className="text-emerald-800">{calculation.pathToCapture.realisticCapture}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <div className="text-xs text-slate-500 uppercase font-medium mb-1">Quick Win</div>
                <p className="text-slate-700">{calculation.pathToCapture.quickWin}</p>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Timeframe: {calculation.pathToCapture.timeframe}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
