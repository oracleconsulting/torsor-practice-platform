/**
 * Year-to-Date Comparison Component
 * Displays YTD performance vs budget and prior year
 */

import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Target,
  History,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { YTDComparison as YTDComparisonData, VarianceResult } from '../../services/business-intelligence';

// ============================================================================
// TYPES
// ============================================================================

interface YTDComparisonProps {
  ytd: {
    revenue: YTDComparisonData;
    costOfSales: YTDComparisonData;
    grossProfit: YTDComparisonData;
    overheads: YTDComparisonData;
    operatingProfit: YTDComparisonData;
    netProfit: YTDComparisonData;
  };
  showBudget?: boolean;
  showPriorYear?: boolean;
  periodLabel?: string;
  financialYearLabel?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (value: number | null): string => {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatVariance = (variance: VarianceResult | null, isExpense: boolean = false): {
  display: string;
  status: 'positive' | 'negative' | 'neutral';
  icon: typeof TrendingUp;
} => {
  if (!variance) return { display: '—', status: 'neutral', icon: Minus };
  
  const { amount, pct } = variance;
  const isPositive = isExpense ? amount < 0 : amount > 0;
  const isSignificant = Math.abs(pct) >= 2;
  
  return {
    display: `${amount >= 0 ? '+' : ''}${formatCurrency(amount)} (${pct >= 0 ? '+' : ''}${pct}%)`,
    status: !isSignificant ? 'neutral' : isPositive ? 'positive' : 'negative',
    icon: isPositive ? ArrowUpRight : ArrowDownRight
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function YTDComparison({ 
  ytd, 
  showBudget = true,
  showPriorYear = true,
  periodLabel,
  financialYearLabel 
}: YTDComparisonProps) {
  // Calculate margins
  const grossMarginPct = ytd.revenue.actual > 0 
    ? (ytd.grossProfit.actual / ytd.revenue.actual * 100).toFixed(1) 
    : '0.0';
  const netMarginPct = ytd.revenue.actual > 0 
    ? (ytd.netProfit.actual / ytd.revenue.actual * 100).toFixed(1) 
    : '0.0';
  
  // Budget achievement %
  const revenueAchievement = ytd.revenue.budget && ytd.revenue.budget > 0
    ? (ytd.revenue.actual / ytd.revenue.budget * 100)
    : null;
  const profitAchievement = ytd.netProfit.budget && ytd.netProfit.budget > 0
    ? (ytd.netProfit.actual / ytd.netProfit.budget * 100)
    : null;
  
  const rows = [
    { label: 'Revenue', data: ytd.revenue, isExpense: false, bold: true },
    { label: 'Cost of Sales', data: ytd.costOfSales, isExpense: true },
    { label: 'Gross Profit', data: ytd.grossProfit, isExpense: false, bold: true },
    { label: 'Overheads', data: ytd.overheads, isExpense: true },
    { label: 'Operating Profit', data: ytd.operatingProfit, isExpense: false, bold: true },
    { label: 'Net Profit', data: ytd.netProfit, isExpense: false, bold: true, highlight: true }
  ];
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Year-to-Date Performance</h3>
            <div className="flex items-center gap-3 mt-1">
              {periodLabel && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Through {periodLabel}
                </span>
              )}
              {financialYearLabel && (
                <span className="text-sm text-indigo-600 font-medium">
                  {financialYearLabel}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showBudget && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Target className="h-3 w-3" />
                vs Budget
              </span>
            )}
            {showPriorYear && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <History className="h-3 w-3" />
                vs Prior Year
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Achievement Meters */}
      {(revenueAchievement !== null || profitAchievement !== null) && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-6">
            {/* Revenue Achievement */}
            {revenueAchievement !== null && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Revenue vs Budget</span>
                  <span className={`text-sm font-bold ${revenueAchievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {revenueAchievement.toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      revenueAchievement >= 100 ? 'bg-emerald-500' : 
                      revenueAchievement >= 90 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(revenueAchievement, 120)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                  <span>Actual: {formatCurrency(ytd.revenue.actual)}</span>
                  <span>Budget: {formatCurrency(ytd.revenue.budget)}</span>
                </div>
              </div>
            )}
            
            {/* Profit Achievement */}
            {profitAchievement !== null && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Net Profit vs Budget</span>
                  <span className={`text-sm font-bold ${profitAchievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {profitAchievement.toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      profitAchievement >= 100 ? 'bg-emerald-500' : 
                      profitAchievement >= 90 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(profitAchievement, 0), 120)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                  <span>Actual: {formatCurrency(ytd.netProfit.actual)}</span>
                  <span>Budget: {formatCurrency(ytd.netProfit.budget)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* YTD Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-40">
                Line Item
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                YTD Actual
              </th>
              {showBudget && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50/50">
                    YTD Budget
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50/50">
                    Variance
                  </th>
                </>
              )}
              {showPriorYear && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50/50">
                    YTD Prior Year
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50/50">
                    Variance
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const budgetVariance = formatVariance(row.data.variances?.vsBudget || null, row.isExpense);
              const pyVariance = formatVariance(row.data.variances?.vsPriorYear || null, row.isExpense);
              
              return (
                <tr key={idx} className={`${row.highlight ? 'bg-indigo-50' : row.bold ? 'bg-slate-50/50' : ''}`}>
                  <td className={`px-4 py-3 text-sm ${row.bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                    {row.label}
                  </td>
                  <td className={`px-4 py-3 text-right text-sm ${row.bold ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                    {formatCurrency(row.data.actual)}
                  </td>
                  {showBudget && (
                    <>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">
                        {formatCurrency(row.data.budget)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                          budgetVariance.status === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                          budgetVariance.status === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {budgetVariance.status !== 'neutral' && (
                            budgetVariance.status === 'positive' 
                              ? <TrendingUp className="h-3 w-3" /> 
                              : <TrendingDown className="h-3 w-3" />
                          )}
                          {budgetVariance.display}
                        </span>
                      </td>
                    </>
                  )}
                  {showPriorYear && (
                    <>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">
                        {formatCurrency(row.data.priorYear)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                          pyVariance.status === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                          pyVariance.status === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {pyVariance.status !== 'neutral' && (
                            pyVariance.status === 'positive' 
                              ? <TrendingUp className="h-3 w-3" /> 
                              : <TrendingDown className="h-3 w-3" />
                          )}
                          {pyVariance.display}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(ytd.revenue.actual)}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">YTD Revenue</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${parseFloat(grossMarginPct) >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {grossMarginPct}%
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Gross Margin</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${ytd.netProfit.actual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(ytd.netProfit.actual)}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">YTD Net Profit</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${parseFloat(netMarginPct) >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {netMarginPct}%
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Net Margin</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YTDComparison;


