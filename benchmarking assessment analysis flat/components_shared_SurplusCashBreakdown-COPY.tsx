import { useState } from 'react';
import { Wallet, ChevronDown, ChevronUp, Info, TrendingUp } from 'lucide-react';
import type { SurplusCashData } from '../../types/opportunity-calculations';

interface SurplusCashBreakdownProps {
  data: SurplusCashData;
  revenue: number;
}

export function SurplusCashBreakdown({ data, revenue: _revenue }: SurplusCashBreakdownProps) {
  const [expanded, setExpanded] = useState(false);
  
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000000) return `${sign}£${(absValue / 1000000).toFixed(2)}M`;
    if (absValue >= 1000) return `${sign}£${(absValue / 1000).toFixed(1)}k`;
    return `${sign}£${absValue.toFixed(0)}`;
  };

  const hasNegativeWorkingCapital = data.components.netWorkingCapital < 0;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Surplus Cash Identified</h3>
            <p className="text-sm text-slate-500">Cash above operating requirements</p>
          </div>
        </div>
        
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-emerald-600">
            {formatCurrency(data.surplusCash)}
          </span>
          <span className="text-sm text-slate-500">
            ({data.surplusAsPercentOfRevenue?.toFixed(1)}% of revenue)
          </span>
        </div>
        
        {hasNegativeWorkingCapital && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2">
            <TrendingUp className="w-4 h-4" />
            <span>
              <strong>Bonus:</strong> Suppliers fund {formatCurrency(Math.abs(data.components.netWorkingCapital))} of your working capital
            </span>
          </div>
        )}
      </div>
      
      {/* Expandable breakdown */}
      <div className="border-t border-emerald-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
        >
          <span>See full breakdown</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expanded && (
          <div className="px-6 pb-6">
            {/* Main calculation table */}
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-emerald-200">
                  <td className="py-2 text-slate-600">Cash at bank</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(data.actualCash)}</td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <td className="py-2 text-slate-600">Less: 3-month operating buffer</td>
                  <td className="py-2 text-right font-medium text-red-600">
                    ({formatCurrency(data.components.operatingBuffer)})
                  </td>
                </tr>
                <tr className="border-b border-emerald-200">
                  <td className="py-2 text-slate-600">Less: Working capital requirement</td>
                  <td className="py-2 text-right font-medium text-red-600">
                    ({formatCurrency(Math.max(0, data.components.workingCapitalRequirement))})
                  </td>
                </tr>
                <tr className="font-semibold bg-emerald-100">
                  <td className="py-3 px-2 rounded-l">Surplus available</td>
                  <td className="py-3 px-2 text-right text-emerald-700 rounded-r">
                    {formatCurrency(data.surplusCash)}
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* Operating buffer breakdown */}
            <div className="mt-4 p-3 bg-white rounded-lg">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Operating Buffer Components
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff costs (quarterly)</span>
                  <span>{formatCurrency(data.components.staffCostsQuarterly)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin expenses (quarterly)</span>
                  <span>{formatCurrency(data.components.adminExpensesQuarterly)}</span>
                </div>
              </div>
            </div>
            
            {/* Working capital breakdown */}
            <div className="mt-3 p-3 bg-white rounded-lg">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Working Capital Components
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Debtors (cash owed to you)</span>
                  <span className="text-emerald-600">+{formatCurrency(data.components.debtors)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stock</span>
                  <span className="text-emerald-600">+{formatCurrency(data.components.stock)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Creditors (you owe them)</span>
                  <span className="text-red-600">-{formatCurrency(Math.abs(data.components.creditors))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Net working capital</span>
                  <span className={data.components.netWorkingCapital < 0 ? 'text-emerald-600' : ''}>
                    {formatCurrency(data.components.netWorkingCapital)}
                  </span>
                </div>
              </div>
              
              {hasNegativeWorkingCapital && (
                <div className="mt-2 p-2 bg-emerald-50 rounded text-xs text-emerald-700">
                  <strong>Why negative is good:</strong> Your creditors (suppliers) are funding your operations. 
                  You collect from customers faster than you pay suppliers. This is free working capital.
                </div>
              )}
            </div>
            
            {/* Methodology note */}
            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Methodology:</strong> {data.methodology}
                <br />
                <strong>Confidence:</strong> {data.confidence}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
