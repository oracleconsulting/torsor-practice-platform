'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, Edit3 } from 'lucide-react';
import type { WaterfallItem } from '../../../types/ma-dashboard';

interface TrueCashWaterfallProps {
  bankBalance: number;
  trueCash: number;
  breakdown: {
    vatLiability: number;
    payeLiability: number;
    corporationTax: number;
    committedPayments?: number;
    confirmedReceivables?: number;
  };
  runwayMonths: number;
  monthlyBurn: number;
  editMode?: boolean;
  onEdit?: () => void;
}

export function TrueCashWaterfall({
  bankBalance,
  trueCash,
  breakdown,
  runwayMonths,
  monthlyBurn,
  editMode,
  onEdit,
}: TrueCashWaterfallProps) {
  const [showDetail, setShowDetail] = useState(true);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Determine RAG status based on runway
  const ragStatus = runwayMonths < 2 ? 'red' : runwayMonths < 4 ? 'amber' : 'green';

  // Build waterfall items
  const items: WaterfallItem[] = [
    { label: 'Bank Balance', value: bankBalance, type: 'start' },
  ];

  if (breakdown.vatLiability > 0) {
    items.push({ label: 'VAT Liability', value: breakdown.vatLiability, type: 'subtract', tooltip: 'Due to HMRC' });
  }
  if (breakdown.payeLiability > 0) {
    items.push({ label: 'PAYE/NI', value: breakdown.payeLiability, type: 'subtract', tooltip: 'Payroll taxes due' });
  }
  if (breakdown.corporationTax > 0) {
    items.push({ label: 'Corporation Tax', value: breakdown.corporationTax, type: 'subtract', tooltip: 'Provision for year' });
  }
  if (breakdown.committedPayments && breakdown.committedPayments > 0) {
    items.push({ label: 'Committed Payments', value: breakdown.committedPayments, type: 'subtract', tooltip: 'Due within 7 days' });
  }
  if (breakdown.confirmedReceivables && breakdown.confirmedReceivables > 0) {
    items.push({ label: 'Confirmed Receivables', value: breakdown.confirmedReceivables, type: 'add', tooltip: 'Due within 7 days' });
  }
  
  items.push({ label: 'True Cash', value: trueCash, type: 'total' });

  // Calculate cumulative positions for waterfall bars
  const maxValue = bankBalance * 1.1; // Add 10% padding
  let cumulative = bankBalance;
  
  const positions = items.map((item) => {
    if (item.type === 'start') {
      return { start: 0, width: (item.value / maxValue) * 100, cumulative: item.value };
    } else if (item.type === 'subtract') {
      const newCumulative = cumulative - item.value;
      const pos = { 
        start: (newCumulative / maxValue) * 100, 
        width: (item.value / maxValue) * 100,
        cumulative: newCumulative
      };
      cumulative = newCumulative;
      return pos;
    } else if (item.type === 'add') {
      const pos = { 
        start: (cumulative / maxValue) * 100, 
        width: (item.value / maxValue) * 100,
        cumulative: cumulative + item.value
      };
      cumulative += item.value;
      return pos;
    } else {
      return { start: 0, width: (item.value / maxValue) * 100, cumulative: item.value };
    }
  });

  const runwayColors = {
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  const runwayIcons = {
    green: <CheckCircle className="w-4 h-4" />,
    amber: <AlertTriangle className="w-4 h-4" />,
    red: <AlertTriangle className="w-4 h-4" />,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">True Cash Position</h3>
          <p className="text-sm text-slate-500">Your real cash after all obligations</p>
        </div>
        {editMode && onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Display */}
      <div className="flex items-center gap-6 mb-6">
        <div>
          <div className={`text-4xl font-bold ${
            ragStatus === 'red' ? 'text-red-600' :
            ragStatus === 'amber' ? 'text-amber-600' :
            'text-emerald-600'
          }`}>
            {formatCurrency(trueCash)}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            vs {formatCurrency(bankBalance)} in the bank
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${runwayColors[ragStatus]}`}>
          {runwayIcons[ragStatus]}
          {runwayMonths.toFixed(1)} months runway
        </div>
      </div>

      {/* Toggle Detail */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        {showDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showDetail ? 'Hide breakdown' : 'Show breakdown'}
      </button>

      {/* Waterfall Visualization */}
      {showDetail && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.label} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-40 flex items-center gap-1">
                <span className={`text-sm ${
                  item.type === 'total' ? 'font-semibold text-slate-900' : 'text-slate-600'
                }`}>
                  {item.label}
                </span>
                {item.tooltip && (
                  <div className="group relative">
                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                      {item.tooltip}
                    </div>
                  </div>
                )}
              </div>

              {/* Bar */}
              <div className="flex-1 h-8 relative bg-slate-100 rounded overflow-hidden">
                {item.type === 'start' && (
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500 rounded transition-all duration-300"
                    style={{ width: `${positions[index].width}%` }}
                  />
                )}
                {item.type === 'subtract' && (
                  <>
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-200 rounded transition-all duration-300"
                      style={{ width: `${positions[index].start + positions[index].width}%` }}
                    />
                    <div
                      className="absolute inset-y-0 bg-red-400 rounded-r transition-all duration-300"
                      style={{ 
                        left: `${positions[index].start}%`,
                        width: `${positions[index].width}%`
                      }}
                    />
                  </>
                )}
                {item.type === 'add' && (
                  <>
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-200 rounded transition-all duration-300"
                      style={{ width: `${positions[index].start}%` }}
                    />
                    <div
                      className="absolute inset-y-0 bg-emerald-400 rounded-r transition-all duration-300"
                      style={{ 
                        left: `${positions[index].start}%`,
                        width: `${positions[index].width}%`
                      }}
                    />
                  </>
                )}
                {item.type === 'total' && (
                  <div
                    className={`absolute inset-y-0 left-0 rounded transition-all duration-300 ${
                      ragStatus === 'red' ? 'bg-red-500' :
                      ragStatus === 'amber' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${positions[index].width}%` }}
                  />
                )}
              </div>

              {/* Value */}
              <div className={`w-24 text-right text-sm font-medium ${
                item.type === 'subtract' ? 'text-red-600' :
                item.type === 'add' ? 'text-emerald-600' :
                item.type === 'total' ? 'font-bold text-slate-900' :
                'text-slate-700'
              }`}>
                {item.type === 'subtract' && '-'}
                {item.type === 'add' && '+'}
                {formatCurrency(item.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Banner if low runway */}
      {ragStatus === 'red' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900">Critical Cash Warning</h4>
            <p className="text-sm text-red-700 mt-1">
              At your current burn rate of {formatCurrency(monthlyBurn)}/month, you have less than 
              2 months of runway. Immediate action is required.
            </p>
          </div>
        </div>
      )}

      {ragStatus === 'amber' && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Cash Caution</h4>
            <p className="text-sm text-amber-700 mt-1">
              Runway is below the recommended 6-month safety threshold. Consider reviewing 
              upcoming costs and collection efforts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


