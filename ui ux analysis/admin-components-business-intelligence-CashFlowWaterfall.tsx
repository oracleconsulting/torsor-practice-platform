/**
 * Cash Flow Waterfall Component
 * Visual waterfall chart showing cash movements
 */

'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Building2,
  CreditCard,
  Banknote,
  Info,
  ChevronDown
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface CashFlowItem {
  id: string;
  label: string;
  amount: number;
  type: 'start' | 'inflow' | 'outflow' | 'end';
  category?: 'operating' | 'investing' | 'financing';
  description?: string;
  subItems?: { label: string; amount: number }[];
}

interface CashFlowWaterfallProps {
  items: CashFlowItem[];
  title?: string;
  periodLabel?: string;
  showDetails?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (value: number): string => {
  const absValue = Math.abs(value);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: absValue >= 1000000 ? 'compact' : 'standard'
  }).format(value);
};

const getItemIcon = (type: CashFlowItem['type'], category?: CashFlowItem['category']) => {
  if (type === 'start' || type === 'end') return <Wallet className="w-4 h-4" />;
  if (category === 'operating') return <Building2 className="w-4 h-4" />;
  if (category === 'investing') return <CreditCard className="w-4 h-4" />;
  if (category === 'financing') return <Banknote className="w-4 h-4" />;
  return type === 'inflow' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
};

const getItemColor = (type: CashFlowItem['type'], amount: number) => {
  if (type === 'start') return 'bg-blue-500';
  if (type === 'end') return amount >= 0 ? 'bg-blue-600' : 'bg-red-600';
  return type === 'inflow' || amount > 0 ? 'bg-emerald-500' : 'bg-red-500';
};

const getItemTextColor = (type: CashFlowItem['type'], amount: number) => {
  if (type === 'start') return 'text-blue-600';
  if (type === 'end') return amount >= 0 ? 'text-blue-600' : 'text-red-600';
  return type === 'inflow' || amount > 0 ? 'text-emerald-600' : 'text-red-600';
};

// ============================================================================
// WATERFALL BAR
// ============================================================================

function WaterfallBar({ 
  item, 
  maxValue, 
  runningTotal,
  prevRunningTotal,
  isExpanded,
  onToggle 
}: { 
  item: CashFlowItem; 
  maxValue: number;
  runningTotal: number;
  prevRunningTotal: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const scale = 100 / maxValue;
  const hasSubItems = item.subItems && item.subItems.length > 0;
  
  // Calculate bar position
  const barStart = item.type === 'start' || item.type === 'end' 
    ? 0 
    : Math.min(prevRunningTotal, runningTotal) * scale;
  const barWidth = item.type === 'start' || item.type === 'end'
    ? Math.abs(item.amount) * scale
    : Math.abs(item.amount) * scale;
  
  return (
    <div className="group">
      <div 
        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${hasSubItems ? 'cursor-pointer hover:bg-slate-50' : ''}`}
        onClick={hasSubItems ? onToggle : undefined}
      >
        {/* Label */}
        <div className="w-40 flex items-center gap-2">
          <span className={getItemTextColor(item.type, item.amount)}>
            {getItemIcon(item.type, item.category)}
          </span>
          <span className="text-sm font-medium text-slate-700 truncate">{item.label}</span>
          {hasSubItems && (
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          )}
        </div>
        
        {/* Waterfall Bar */}
        <div className="flex-1 relative h-8">
          {/* Background track */}
          <div className="absolute inset-0 bg-slate-100 rounded-full" />
          
          {/* Connector line for flow items */}
          {(item.type === 'inflow' || item.type === 'outflow') && (
            <div 
              className="absolute top-1/2 h-px bg-slate-300"
              style={{
                left: 0,
                width: `${barStart}%`,
                transform: 'translateY(-50%)'
              }}
            />
          )}
          
          {/* Value bar */}
          <div 
            className={`absolute top-0 h-full rounded-full transition-all ${getItemColor(item.type, item.amount)} shadow-sm`}
            style={{
              left: item.type === 'start' || item.type === 'end' ? 0 : `${barStart}%`,
              width: `${Math.max(barWidth, 2)}%`
            }}
          />
          
          {/* Running total marker */}
          {(item.type === 'inflow' || item.type === 'outflow') && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
              style={{ left: `${runningTotal * scale}%` }}
            />
          )}
        </div>
        
        {/* Amount */}
        <div className={`w-28 text-right font-semibold ${getItemTextColor(item.type, item.amount)}`}>
          {item.type === 'inflow' && '+'}
          {item.type === 'outflow' && '−'}
          {formatCurrency(Math.abs(item.amount))}
        </div>
        
        {/* Running Total */}
        <div className="w-28 text-right text-sm text-slate-500">
          {item.type !== 'start' && (
            <span>{formatCurrency(runningTotal)}</span>
          )}
        </div>
      </div>
      
      {/* Expanded Sub-items */}
      {hasSubItems && isExpanded && (
        <div className="ml-12 pl-4 border-l-2 border-slate-200 space-y-1 py-2">
          {item.subItems!.map((sub, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-600">{sub.label}</span>
              <span className={sub.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {sub.amount >= 0 ? '+' : '−'}{formatCurrency(Math.abs(sub.amount))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CashFlowWaterfall({ 
  items, 
  title = "Cash Flow Waterfall",
  periodLabel,
  showDetails = true 
}: CashFlowWaterfallProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Calculate max value for scaling
  const maxValue = Math.max(
    ...items.map(i => Math.abs(i.amount)),
    items.reduce((sum, i) => i.type === 'inflow' ? sum + i.amount : sum, 0)
  );
  
  // Calculate running totals
  let runningTotal = 0;
  const itemsWithTotals = items.map(item => {
    const prevTotal = runningTotal;
    if (item.type === 'start') {
      runningTotal = item.amount;
    } else if (item.type === 'end') {
      // End is the final balance
    } else {
      runningTotal += item.amount;
    }
    return { item, runningTotal, prevRunningTotal: prevTotal };
  });
  
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  // Calculate summary metrics
  const totalInflows = items
    .filter(i => i.type === 'inflow')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalOutflows = items
    .filter(i => i.type === 'outflow')
    .reduce((sum, i) => sum + Math.abs(i.amount), 0);
  const netChange = totalInflows - totalOutflows;
  const startBalance = items.find(i => i.type === 'start')?.amount || 0;
  const endBalance = items.find(i => i.type === 'end')?.amount || startBalance + netChange;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {periodLabel && (
              <p className="text-sm text-slate-500 mt-0.5">{periodLabel}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-500">Inflows</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-500">Outflows</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Metrics */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Opening Balance</div>
            <div className="text-xl font-bold text-blue-600">{formatCurrency(startBalance)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Total Inflows</div>
            <div className="text-xl font-bold text-emerald-600">+{formatCurrency(totalInflows)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Total Outflows</div>
            <div className="text-xl font-bold text-red-600">−{formatCurrency(totalOutflows)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Closing Balance</div>
            <div className={`text-xl font-bold ${endBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(endBalance)}
            </div>
          </div>
        </div>
        
        {/* Net Change Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 w-20">Net Change</span>
            <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden relative">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400" />
              {/* Change bar */}
              <div 
                className={`absolute top-0 bottom-0 ${netChange >= 0 ? 'bg-emerald-500 left-1/2' : 'bg-red-500 right-1/2'}`}
                style={{ 
                  width: `${Math.min(Math.abs(netChange) / maxValue * 50, 50)}%`
                }}
              />
            </div>
            <span className={`text-sm font-bold w-24 text-right ${netChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Column Headers */}
      <div className="px-6 py-2 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="w-40">Category</div>
          <div className="flex-1">Flow</div>
          <div className="w-28 text-right">Amount</div>
          <div className="w-28 text-right">Running Total</div>
        </div>
      </div>
      
      {/* Waterfall Bars */}
      <div className="p-4 space-y-1">
        {itemsWithTotals.map(({ item, runningTotal: rt, prevRunningTotal: prt }) => (
          <WaterfallBar
            key={item.id}
            item={item}
            maxValue={maxValue}
            runningTotal={rt}
            prevRunningTotal={prt}
            isExpanded={expandedItems.has(item.id)}
            onToggle={() => toggleExpanded(item.id)}
          />
        ))}
      </div>
      
      {/* Footer Info */}
      {showDetails && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4" />
          Click items with sub-categories to expand details
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SIMPLE WATERFALL FOR EMBEDDING
// ============================================================================

export function CashFlowWaterfallSimple({ 
  openingBalance,
  closingBalance,
  inflows,
  outflows
}: {
  openingBalance: number;
  closingBalance: number;
  inflows: { label: string; amount: number }[];
  outflows: { label: string; amount: number }[];
}) {
  const items: CashFlowItem[] = [
    { id: 'start', label: 'Opening Balance', amount: openingBalance, type: 'start' },
    ...inflows.map((i, idx) => ({
      id: `in-${idx}`,
      label: i.label,
      amount: i.amount,
      type: 'inflow' as const
    })),
    ...outflows.map((o, idx) => ({
      id: `out-${idx}`,
      label: o.label,
      amount: -Math.abs(o.amount),
      type: 'outflow' as const
    })),
    { id: 'end', label: 'Closing Balance', amount: closingBalance, type: 'end' }
  ];
  
  return <CashFlowWaterfall items={items} showDetails={false} />;
}

export default CashFlowWaterfall;

