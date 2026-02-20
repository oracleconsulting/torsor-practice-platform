'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import type { TrueCashDisplay } from '../../services/ma/true-cash';

interface TrueCashCardProps {
  data: TrueCashDisplay;
  previousTrueCash?: number;
  showBreakdownByDefault?: boolean;
}

export function TrueCashCard({ 
  data, 
  previousTrueCash,
  showBreakdownByDefault = false 
}: TrueCashCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(showBreakdownByDefault);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const change = previousTrueCash !== undefined 
    ? data.trueCash - previousTrueCash 
    : null;

  const ragStyles = {
    green: 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50',
    amber: 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50',
    red: 'border-red-400 bg-gradient-to-br from-red-50 to-rose-50',
    grey: 'border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50',
  };

  const ragDotStyles = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    grey: 'bg-slate-400',
  };

  const ragTextStyles = {
    green: 'text-green-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    grey: 'text-slate-600',
  };

  return (
    <div className={`border-2 rounded-xl overflow-hidden ${ragStyles[data.ragStatus]}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800">True Cash Position</h3>
            <button 
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="True Cash = Bank Balance minus known commitments (VAT, PAYE, etc.) plus confirmed receivables"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${ragDotStyles[data.ragStatus]}`} />
            <span className={`text-sm font-medium ${ragTextStyles[data.ragStatus]}`}>
              {data.runwayMonths.toFixed(1)} months runway
            </span>
          </div>
        </div>
      </div>

      {/* Main Value */}
      <div className="px-6 py-6">
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-4xl font-bold text-slate-900">
            {formatCurrency(data.trueCash)}
          </span>
          {change !== null && (
            <span className={`text-lg font-medium flex items-center gap-1 ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {formatCurrency(Math.abs(change))}
            </span>
          )}
        </div>

        {/* Bank Balance Comparison */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-4">
          <span className="text-slate-500">Bank balance:</span>
          <span className="font-semibold text-slate-700">{formatCurrency(data.bankBalance)}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">Committed:</span>
          <span className="font-semibold text-red-600">{formatCurrency(data.difference)}</span>
        </div>

        {/* Visual Bar */}
        <div className="mb-4">
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden relative">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                data.ragStatus === 'green' ? 'bg-green-500' :
                data.ragStatus === 'amber' ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, data.percentageAvailable))}%` }}
            />
            {/* Marker for bank balance */}
            <div className="absolute right-0 top-0 h-full w-0.5 bg-slate-400" />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>True Cash ({data.percentageAvailable}%)</span>
            <span>Committed ({100 - data.percentageAvailable}%)</span>
          </div>
        </div>

        {/* Warnings */}
        {data.warnings.length > 0 && (
          <div className="mb-4 space-y-2">
            {data.warnings.map((warning, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 p-3 bg-red-100/50 border border-red-200 rounded-lg text-sm"
              >
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-700">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Breakdown Toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showBreakdown ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showBreakdown ? 'Hide' : 'Show'} calculation breakdown
        </button>

        {/* Breakdown */}
        {showBreakdown && (
          <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Bank Balance</span>
              <span className="font-semibold text-slate-800">{formatCurrency(data.bankBalance)}</span>
            </div>
            
            {data.deductions.map((item, idx) => (
              <div key={`ded-${idx}`} className="flex justify-between text-red-600">
                <span>Less: {item.label}</span>
                <span>({formatCurrency(Math.abs(item.amount))})</span>
              </div>
            ))}
            
            {data.additions.map((item, idx) => (
              <div key={`add-${idx}`} className="flex justify-between text-green-600">
                <span>Plus: {item.label}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            
            <div className="flex justify-between font-bold pt-2 border-t border-slate-200/50">
              <span className="text-slate-800">True Cash</span>
              <span className={ragTextStyles[data.ragStatus]}>{formatCurrency(data.trueCash)}</span>
            </div>
          </div>
        )}

        {/* Commentary */}
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          {data.commentary}
        </p>
      </div>
    </div>
  );
}

export default TrueCashCard;

