/**
 * Budget Entry Component
 * Allows entry and editing of annual budget data by month
 */

import { useState, useMemo } from 'react';
import { 
  Save, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Calculator,
  Calendar,
  Check,
  AlertCircle,
  Loader2,
  TrendingUp
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface FinancialData {
  revenue: number;
  cost_of_sales: number;
  gross_profit: number;
  overheads: number;
  operating_profit: number;
  net_profit: number;
}

interface BudgetEntryProps {
  engagementId: string;
  financialYearStart: Date;
  financialYearEnd?: Date;
  existingBudget?: Record<string, FinancialData>;
  onSave: (budget: Record<string, FinancialData>) => Promise<void>;
  isLoading?: boolean;
}

interface FieldConfig {
  key: keyof FinancialData;
  label: string;
  calculated: boolean;
  isExpense?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BUDGET_FIELDS: FieldConfig[] = [
  { key: 'revenue', label: 'Revenue', calculated: false },
  { key: 'cost_of_sales', label: 'Cost of Sales', calculated: false, isExpense: true },
  { key: 'gross_profit', label: 'Gross Profit', calculated: true },
  { key: 'overheads', label: 'Overheads', calculated: false, isExpense: true },
  { key: 'operating_profit', label: 'Operating Profit', calculated: true },
  { key: 'net_profit', label: 'Net Profit', calculated: true }
];

const EMPTY_MONTH: FinancialData = {
  revenue: 0,
  cost_of_sales: 0,
  gross_profit: 0,
  overheads: 0,
  operating_profit: 0,
  net_profit: 0
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatCurrencyCompact = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  }
  return `£${value.toLocaleString()}`;
};

const calculateDerived = (data: Partial<FinancialData>): FinancialData => {
  const revenue = data.revenue || 0;
  const cost_of_sales = data.cost_of_sales || 0;
  const overheads = data.overheads || 0;
  
  const gross_profit = revenue - cost_of_sales;
  const operating_profit = gross_profit - overheads;
  const net_profit = operating_profit; // Simplified - could add interest/tax
  
  return {
    revenue,
    cost_of_sales,
    gross_profit,
    overheads,
    operating_profit,
    net_profit
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BudgetEntry({ 
  financialYearStart, 
  existingBudget,
  onSave,
  isLoading = false
}: BudgetEntryProps) {
  const [budget, setBudget] = useState<Record<string, FinancialData>>(existingBudget || {});
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  
  // Generate month keys for the financial year
  const monthKeys = useMemo(() => {
    const keys: string[] = [];
    const start = new Date(financialYearStart);
    for (let i = 0; i < 12; i++) {
      const date = new Date(start);
      date.setMonth(start.getMonth() + i);
      keys.push(date.toISOString().slice(0, 7)); // "2026-01"
    }
    return keys;
  }, [financialYearStart]);
  
  // Calculate annual totals
  const annualTotals = useMemo(() => {
    return monthKeys.reduce((acc, key) => {
      const monthData = budget[key] || EMPTY_MONTH;
      return {
        revenue: acc.revenue + (monthData.revenue || 0),
        cost_of_sales: acc.cost_of_sales + (monthData.cost_of_sales || 0),
        gross_profit: acc.gross_profit + (monthData.gross_profit || 0),
        overheads: acc.overheads + (monthData.overheads || 0),
        operating_profit: acc.operating_profit + (monthData.operating_profit || 0),
        net_profit: acc.net_profit + (monthData.net_profit || 0)
      };
    }, { ...EMPTY_MONTH });
  }, [budget, monthKeys]);
  
  // Update a field for a specific month
  const updateField = (monthKey: string, field: keyof FinancialData, value: number) => {
    setBudget(prev => {
      const monthData = { ...(prev[monthKey] || EMPTY_MONTH) };
      monthData[field] = value;
      
      // Auto-calculate derived fields
      const calculated = calculateDerived(monthData);
      
      return { ...prev, [monthKey]: calculated };
    });
    setHasChanges(true);
  };
  
  // Copy to next month
  const copyToNextMonth = (fromMonthKey: string) => {
    const fromIndex = monthKeys.indexOf(fromMonthKey);
    if (fromIndex < monthKeys.length - 1) {
      const toMonthKey = monthKeys[fromIndex + 1];
      setBudget(prev => ({
        ...prev,
        [toMonthKey]: { ...(prev[fromMonthKey] || EMPTY_MONTH) }
      }));
      setHasChanges(true);
    }
  };
  
  // Copy to all remaining months
  const copyToAllMonths = (fromMonthKey: string) => {
    const fromData = budget[fromMonthKey] || EMPTY_MONTH;
    const newBudget = { ...budget };
    monthKeys.forEach(key => {
      newBudget[key] = { ...fromData };
    });
    setBudget(newBudget);
    setHasChanges(true);
  };
  
  // Copy prior month values
  const copyFromPriorMonth = (toMonthKey: string) => {
    const toIndex = monthKeys.indexOf(toMonthKey);
    if (toIndex > 0) {
      const fromMonthKey = monthKeys[toIndex - 1];
      setBudget(prev => ({
        ...prev,
        [toMonthKey]: { ...(prev[fromMonthKey] || EMPTY_MONTH) }
      }));
      setHasChanges(true);
    }
  };
  
  // Format month label
  const formatMonthLabel = (monthKey: string) => {
    const date = new Date(monthKey + '-01');
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };
  
  const formatMonthShort = (monthKey: string) => {
    const date = new Date(monthKey + '-01');
    return date.toLocaleDateString('en-GB', { month: 'short' });
  };
  
  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(budget);
      setHasChanges(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      console.error('Failed to save budget:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Calculate gross margin percentage
  const calculateGrossMargin = (data: FinancialData) => {
    if (!data.revenue) return 0;
    return (data.gross_profit / data.revenue) * 100;
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Annual Budget</h3>
              <p className="text-sm text-slate-500">
                {formatMonthLabel(monthKeys[0])} - {formatMonthLabel(monthKeys[11])}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {savedMessage && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                Saved
              </span>
            )}
            {hasChanges && (
              <span className="flex items-center gap-1 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Budget
            </button>
          </div>
        </div>
      </div>
      
      {/* Annual Summary */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Annual Totals</h4>
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Revenue</div>
            <div className="text-lg font-bold text-slate-900">
              {formatCurrencyCompact(annualTotals.revenue)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Cost of Sales</div>
            <div className="text-lg font-bold text-slate-900">
              {formatCurrencyCompact(annualTotals.cost_of_sales)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Gross Profit</div>
            <div className="text-lg font-bold text-emerald-600">
              {formatCurrencyCompact(annualTotals.gross_profit)}
            </div>
            <div className="text-xs text-slate-400">
              {annualTotals.revenue > 0 ? ((annualTotals.gross_profit / annualTotals.revenue) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Overheads</div>
            <div className="text-lg font-bold text-slate-900">
              {formatCurrencyCompact(annualTotals.overheads)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Operating Profit</div>
            <div className={`text-lg font-bold ${annualTotals.operating_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrencyCompact(annualTotals.operating_profit)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200 bg-blue-50">
            <div className="text-xs text-blue-600">Net Profit</div>
            <div className={`text-lg font-bold ${annualTotals.net_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrencyCompact(annualTotals.net_profit)}
            </div>
            <div className="text-xs text-blue-400">
              {annualTotals.revenue > 0 ? ((annualTotals.net_profit / annualTotals.revenue) * 100).toFixed(1) : 0}% margin
            </div>
          </div>
        </div>
      </div>
      
      {/* Mini Bar Chart Preview */}
      <div className="px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Monthly Revenue</span>
        </div>
        <div className="flex items-end gap-1 mt-2 h-12">
          {monthKeys.map((monthKey) => {
            const monthRevenue = budget[monthKey]?.revenue || 0;
            const maxRevenue = Math.max(...monthKeys.map(k => budget[k]?.revenue || 0), 1);
            const height = (monthRevenue / maxRevenue) * 100;
            
            return (
              <div
                key={monthKey}
                className="flex-1 flex flex-col items-center"
                title={`${formatMonthShort(monthKey)}: ${formatCurrency(monthRevenue)}`}
              >
                <div 
                  className={`w-full rounded-t transition-all ${
                    expandedMonth === monthKey ? 'bg-blue-500' : 'bg-blue-200 hover:bg-blue-300'
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <span className="text-[10px] text-slate-400 mt-1">{formatMonthShort(monthKey).slice(0, 1)}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Monthly Breakdown */}
      <div className="divide-y divide-slate-100">
        {monthKeys.map((monthKey, idx) => {
          const monthData = budget[monthKey] || EMPTY_MONTH;
          const isExpanded = expandedMonth === monthKey;
          const hasData = monthData.revenue > 0 || monthData.overheads > 0;
          
          return (
            <div key={monthKey}>
              {/* Month Header */}
              <button
                onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                className={`w-full px-6 py-3 flex justify-between items-center transition-colors ${
                  isExpanded ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className={`h-4 w-4 ${isExpanded ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${isExpanded ? 'text-blue-900' : 'text-slate-900'}`}>
                    {formatMonthLabel(monthKey)}
                  </span>
                  {!hasData && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      No data
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-sm text-slate-500">Revenue: </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(monthData.revenue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-slate-500">Net: </span>
                    <span className={`font-semibold ${monthData.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(monthData.net_profit)}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>
              
              {/* Expanded Month Form */}
              {isExpanded && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {BUDGET_FIELDS.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          {field.label}
                          {field.calculated && (
                            <span className="ml-1 text-slate-400">(auto)</span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            £
                          </span>
                          <input
                            type="number"
                            value={monthData[field.key] || ''}
                            onChange={(e) => updateField(monthKey, field.key, parseFloat(e.target.value) || 0)}
                            disabled={field.calculated}
                            placeholder="0"
                            className={`w-full pl-8 pr-4 py-2.5 border rounded-lg text-right ${
                              field.calculated 
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' 
                                : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {field.key === 'gross_profit' && monthData.revenue > 0 && (
                          <div className="text-xs text-slate-400 mt-1 text-right">
                            {calculateGrossMargin(monthData).toFixed(1)}% margin
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Copy actions */}
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500">Quick actions:</span>
                    {idx > 0 && (
                      <button
                        onClick={() => copyFromPriorMonth(monthKey)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                      >
                        <Copy className="w-3 h-3" />
                        Copy from prior month
                      </button>
                    )}
                    {idx < monthKeys.length - 1 && (
                      <button
                        onClick={() => copyToNextMonth(monthKey)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                      >
                        <Copy className="w-3 h-3" />
                        Copy to next month
                      </button>
                    )}
                    <button
                      onClick={() => copyToAllMonths(monthKey)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      <Copy className="w-3 h-3" />
                      Copy to all months
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BudgetEntry;

