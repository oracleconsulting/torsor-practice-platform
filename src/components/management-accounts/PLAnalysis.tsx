/**
 * P&L Analysis Component
 * Displays profit & loss data with comparisons to budget, prior month, and prior year
 */

import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  Target,
  History
} from 'lucide-react';
import type { PLComparison, FinancialComparison, VarianceResult } from '../../services/business-intelligence';

// ============================================================================
// TYPES
// ============================================================================

interface PLAnalysisProps {
  comparison: PLComparison;
  showBudget?: boolean;
  showPriorMonth?: boolean;
  showPriorYear?: boolean;
  periodLabel: string;
  priorMonthLabel?: string | null;
  priorYearLabel?: string | null;
  hasBudget?: boolean;
  compact?: boolean;
}

interface RowConfig {
  label: string;
  data: FinancialComparison;
  isExpense?: boolean;
  isPercent?: boolean;
  bold?: boolean;
  indent?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (value: number | null): string => {
  if (value === null) return '-';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number | null): string => {
  if (value === null) return '-';
  return `${value.toFixed(1)}%`;
};

const formatVariance = (
  variance: VarianceResult | null, 
  isExpense: boolean = false
): { display: string; status: 'positive' | 'negative' | 'neutral' } => {
  if (!variance) return { display: '-', status: 'neutral' };
  
  const { amount, pct } = variance;
  // For expenses, negative variance is good (under budget/lower costs)
  // For revenue/profit, positive variance is good (over budget/higher profit)
  const isPositive = isExpense ? amount < 0 : amount > 0;
  const isSignificant = Math.abs(pct) >= 2;
  
  const amountStr = amount >= 0 ? `+${formatCurrency(amount)}` : formatCurrency(amount);
  const pctStr = pct >= 0 ? `+${pct}%` : `${pct}%`;
  
  return {
    display: `${amountStr} (${pctStr})`,
    status: !isSignificant ? 'neutral' : isPositive ? 'positive' : 'negative'
  };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const VarianceCell: React.FC<{ 
  variance: VarianceResult | null; 
  isExpense?: boolean;
  compact?: boolean;
}> = ({ variance, isExpense = false, compact = false }) => {
  const { display, status } = formatVariance(variance, isExpense);
  
  const colorClasses = {
    positive: 'text-emerald-600 bg-emerald-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-slate-500 bg-slate-50'
  };
  
  const iconMap = {
    positive: <TrendingUp className="h-3 w-3" />,
    negative: <TrendingDown className="h-3 w-3" />,
    neutral: <Minus className="h-3 w-3" />
  };
  
  if (compact) {
    return (
      <td className={`px-2 py-2 text-right text-xs ${colorClasses[status]} rounded`}>
        {display}
      </td>
    );
  }
  
  return (
    <td className={`px-3 py-2.5 text-right`}>
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colorClasses[status]}`}>
        {iconMap[status]}
        {display}
      </span>
    </td>
  );
};

const ValueCell: React.FC<{
  value: number | null;
  isPercent?: boolean;
  bold?: boolean;
  muted?: boolean;
}> = ({ value, isPercent = false, bold = false, muted = false }) => {
  const formatted = isPercent ? formatPercent(value) : formatCurrency(value);
  
  return (
    <td className={`px-3 py-2.5 text-right text-sm ${
      bold ? 'font-semibold text-slate-900' : muted ? 'text-slate-400' : 'text-slate-600'
    }`}>
      {formatted}
    </td>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PLAnalysis({ 
  comparison, 
  showBudget = true, 
  showPriorMonth = true, 
  showPriorYear = false,
  periodLabel,
  priorMonthLabel,
  priorYearLabel,
  hasBudget = true,
  compact = false
}: PLAnalysisProps) {
  // Build row configuration
  const rows: RowConfig[] = [
    { label: 'Revenue', data: comparison.revenue, isExpense: false, bold: true },
    { label: 'Cost of Sales', data: comparison.costOfSales, isExpense: true, indent: true },
    { label: 'Gross Profit', data: comparison.grossProfit, isExpense: false, bold: true, className: 'border-t border-slate-200' },
    { label: 'Gross Margin %', data: comparison.grossMarginPct, isPercent: true, indent: true },
    { label: 'Overheads', data: comparison.overheads, isExpense: true, indent: true },
    { label: 'Operating Profit', data: comparison.operatingProfit, isExpense: false, bold: true, className: 'border-t border-slate-200' },
    { label: 'Operating Margin %', data: comparison.operatingMarginPct, isPercent: true, indent: true },
    { label: 'Net Profit', data: comparison.netProfit, isExpense: false, bold: true, className: 'border-t-2 border-slate-300 bg-slate-50' },
    { label: 'Net Margin %', data: comparison.netMarginPct, isPercent: true, indent: true, className: 'bg-slate-50' }
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Profit & Loss Analysis</h3>
            <p className="text-sm text-slate-500 mt-0.5">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {showBudget && hasBudget && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Target className="h-3 w-3" />
                Budget
              </span>
            )}
            {showPriorMonth && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <Calendar className="h-3 w-3" />
                Prior Month
              </span>
            )}
            {showPriorYear && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <History className="h-3 w-3" />
                Prior Year
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">
                Line Item
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actual
              </th>
              {showBudget && hasBudget && (
                <>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50/50">
                    Budget
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50/50">
                    vs Budget
                  </th>
                </>
              )}
              {showPriorMonth && (
                <>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {priorMonthLabel || 'Prior Month'}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    vs PM
                  </th>
                </>
              )}
              {showPriorYear && (
                <>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50/50">
                    {priorYearLabel || 'Prior Year'}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50/50">
                    vs PY
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={idx} className={`${row.className || ''} ${row.bold ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                <td className={`px-4 py-2.5 text-sm ${row.bold ? 'font-semibold text-slate-900' : 'text-slate-700'} ${row.indent ? 'pl-8' : ''}`}>
                  {row.label}
                </td>
                <ValueCell 
                  value={row.data.actual} 
                  isPercent={row.isPercent} 
                  bold={row.bold} 
                />
                {showBudget && hasBudget && (
                  <>
                    <ValueCell 
                      value={row.data.budget} 
                      isPercent={row.isPercent}
                      muted={true}
                    />
                    <VarianceCell 
                      variance={row.data.variances?.vsBudget} 
                      isExpense={row.isExpense}
                      compact={compact}
                    />
                  </>
                )}
                {showPriorMonth && (
                  <>
                    <ValueCell 
                      value={row.data.priorMonth} 
                      isPercent={row.isPercent}
                      muted={true}
                    />
                    <VarianceCell 
                      variance={row.data.variances?.vsPriorMonth} 
                      isExpense={row.isExpense}
                      compact={compact}
                    />
                  </>
                )}
                {showPriorYear && (
                  <>
                    <ValueCell 
                      value={row.data.priorYear} 
                      isPercent={row.isPercent}
                      muted={true}
                    />
                    <VarianceCell 
                      variance={row.data.variances?.vsPriorYear} 
                      isExpense={row.isExpense}
                      compact={compact}
                    />
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary Cards */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              comparison.grossMarginPct.actual >= 50 ? 'text-emerald-600' : 
              comparison.grossMarginPct.actual >= 30 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {formatPercent(comparison.grossMarginPct.actual)}
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Gross Margin</div>
            {comparison.grossMarginPct.variances?.vsBudget && (
              <div className={`text-xs mt-1 ${
                comparison.grossMarginPct.variances.vsBudget.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {comparison.grossMarginPct.variances.vsBudget.amount >= 0 ? '+' : ''}
                {comparison.grossMarginPct.variances.vsBudget.amount.toFixed(1)}pp vs budget
              </div>
            )}
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              comparison.operatingMarginPct.actual >= 15 ? 'text-emerald-600' : 
              comparison.operatingMarginPct.actual >= 5 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {formatPercent(comparison.operatingMarginPct.actual)}
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Operating Margin</div>
            {comparison.operatingMarginPct.variances?.vsBudget && (
              <div className={`text-xs mt-1 ${
                comparison.operatingMarginPct.variances.vsBudget.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {comparison.operatingMarginPct.variances.vsBudget.amount >= 0 ? '+' : ''}
                {comparison.operatingMarginPct.variances.vsBudget.amount.toFixed(1)}pp vs budget
              </div>
            )}
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              comparison.netMarginPct.actual >= 10 ? 'text-emerald-600' : 
              comparison.netMarginPct.actual >= 3 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {formatPercent(comparison.netMarginPct.actual)}
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Net Margin</div>
            {comparison.netMarginPct.variances?.vsBudget && (
              <div className={`text-xs mt-1 ${
                comparison.netMarginPct.variances.vsBudget.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {comparison.netMarginPct.variances.vsBudget.amount >= 0 ? '+' : ''}
                {comparison.netMarginPct.variances.vsBudget.amount.toFixed(1)}pp vs budget
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Budget vs Actual Headline */}
      {showBudget && hasBudget && comparison.revenue.variances?.vsBudget && (
        <div className={`px-6 py-3 border-t ${
          comparison.netProfit.variances?.vsBudget && comparison.netProfit.variances.vsBudget.amount >= 0 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${
              comparison.netProfit.variances?.vsBudget && comparison.netProfit.variances.vsBudget.amount >= 0 
                ? 'text-emerald-700' 
                : 'text-red-700'
            }`}>
              {comparison.netProfit.variances?.vsBudget && comparison.netProfit.variances.vsBudget.amount >= 0 
                ? '✓ Net Profit ahead of budget' 
                : '⚠ Net Profit below budget'
              }
            </span>
            <span className={`font-semibold ${
              comparison.netProfit.variances?.vsBudget && comparison.netProfit.variances.vsBudget.amount >= 0 
                ? 'text-emerald-700' 
                : 'text-red-700'
            }`}>
              {comparison.netProfit.variances?.vsBudget && (
                <>
                  {comparison.netProfit.variances.vsBudget.amount >= 0 ? '+' : ''}
                  {formatCurrency(comparison.netProfit.variances.vsBudget.amount)}
                  {' '}
                  ({comparison.netProfit.variances.vsBudget.amount >= 0 ? '+' : ''}
                  {comparison.netProfit.variances.vsBudget.pct}%)
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PLAnalysis;

