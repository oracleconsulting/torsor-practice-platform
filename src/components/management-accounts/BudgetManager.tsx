/**
 * Budget Manager Component
 * Full budget management for BI engagements
 * Allows annual budget entry with monthly breakdown
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Save,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface MonthlyBudget {
  month: number;
  revenue: number;
  cost_of_sales: number;
  overheads: number;
  notes?: string;
}

interface BudgetData {
  id?: string;
  engagement_id: string;
  financial_year: string;
  annual_revenue: number;
  annual_cost_of_sales: number;
  annual_overheads: number;
  monthly_breakdown: MonthlyBudget[];
  created_at?: string;
  updated_at?: string;
}

interface BudgetManagerProps {
  engagementId: string;
  financialYear?: string;
  clientName?: string;
  onSave?: (budget: BudgetData) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DEFAULT_YEAR = new Date().getFullYear().toString();

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

const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

const calculateAnnualFromMonthly = (monthly: MonthlyBudget[], field: keyof MonthlyBudget): number => {
  return monthly.reduce((sum, m) => sum + (Number(m[field]) || 0), 0);
};

const distributeAnnualToMonthly = (annual: number): number[] => {
  const monthlyAmount = Math.floor(annual / 12);
  const remainder = annual - (monthlyAmount * 12);
  
  return MONTHS.map((_, idx) => {
    // Distribute remainder across first few months
    return idx < remainder ? monthlyAmount + 1 : monthlyAmount;
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BudgetManager({ 
  engagementId, 
  financialYear = DEFAULT_YEAR,
  clientName,
  onSave 
}: BudgetManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState(financialYear);
  const [distributionMode, setDistributionMode] = useState<'annual' | 'monthly'>('annual');
  
  // Annual totals (when in annual mode, these drive the distribution)
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [annualCostOfSales, setAnnualCostOfSales] = useState(0);
  const [annualOverheads, setAnnualOverheads] = useState(0);
  
  // Monthly breakdown
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>(() => 
    MONTHS.map((_, idx) => ({
      month: idx + 1,
      revenue: 0,
      cost_of_sales: 0,
      overheads: 0
    }))
  );
  
  // Fetch existing budget
  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('bi_budgets')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('financial_year', selectedYear)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (data) {
        setAnnualRevenue(data.annual_revenue || 0);
        setAnnualCostOfSales(data.annual_cost_of_sales || 0);
        setAnnualOverheads(data.annual_overheads || 0);
        
        if (data.monthly_breakdown && Array.isArray(data.monthly_breakdown)) {
          setMonthlyBudgets(data.monthly_breakdown);
          setDistributionMode('monthly');
        } else {
          // Distribute annual to monthly
          const revDist = distributeAnnualToMonthly(data.annual_revenue || 0);
          const cosDist = distributeAnnualToMonthly(data.annual_cost_of_sales || 0);
          const ovhDist = distributeAnnualToMonthly(data.annual_overheads || 0);
          
          setMonthlyBudgets(MONTHS.map((_, idx) => ({
            month: idx + 1,
            revenue: revDist[idx],
            cost_of_sales: cosDist[idx],
            overheads: ovhDist[idx]
          })));
        }
      }
    } catch (err) {
      console.error('[BudgetManager] Error fetching budget:', err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [engagementId, selectedYear, supabase]);
  
  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);
  
  // Update monthly budgets when annual values change (in annual mode)
  useEffect(() => {
    if (distributionMode === 'annual') {
      const revDist = distributeAnnualToMonthly(annualRevenue);
      const cosDist = distributeAnnualToMonthly(annualCostOfSales);
      const ovhDist = distributeAnnualToMonthly(annualOverheads);
      
      setMonthlyBudgets(prev => prev.map((m, idx) => ({
        ...m,
        revenue: revDist[idx],
        cost_of_sales: cosDist[idx],
        overheads: ovhDist[idx]
      })));
    }
  }, [annualRevenue, annualCostOfSales, annualOverheads, distributionMode]);
  
  // Handle monthly value change
  const handleMonthlyChange = (monthIndex: number, field: keyof MonthlyBudget, value: number) => {
    setMonthlyBudgets(prev => {
      const updated = [...prev];
      updated[monthIndex] = { ...updated[monthIndex], [field]: value };
      return updated;
    });
    setDistributionMode('monthly');
  };
  
  // Calculate derived values
  const calculatedAnnualRevenue = calculateAnnualFromMonthly(monthlyBudgets, 'revenue');
  const calculatedAnnualCOS = calculateAnnualFromMonthly(monthlyBudgets, 'cost_of_sales');
  const calculatedAnnualOverheads = calculateAnnualFromMonthly(monthlyBudgets, 'overheads');
  const calculatedGrossProfit = calculatedAnnualRevenue - calculatedAnnualCOS;
  const calculatedNetProfit = calculatedGrossProfit - calculatedAnnualOverheads;
  const grossMargin = calculatedAnnualRevenue > 0 ? (calculatedGrossProfit / calculatedAnnualRevenue * 100) : 0;
  const netMargin = calculatedAnnualRevenue > 0 ? (calculatedNetProfit / calculatedAnnualRevenue * 100) : 0;
  
  // Save budget
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const budgetData: BudgetData = {
        engagement_id: engagementId,
        financial_year: selectedYear,
        annual_revenue: calculatedAnnualRevenue,
        annual_cost_of_sales: calculatedAnnualCOS,
        annual_overheads: calculatedAnnualOverheads,
        monthly_breakdown: monthlyBudgets
      };
      
      const { error: saveError } = await supabase
        .from('bi_budgets')
        .upsert(budgetData, {
          onConflict: 'engagement_id,financial_year'
        });
      
      if (saveError) throw saveError;
      
      setSuccess(true);
      onSave?.(budgetData);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('[BudgetManager] Error saving budget:', err);
      setError('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };
  
  // Copy from previous year
  const copyFromPreviousYear = async () => {
    const prevYear = (parseInt(selectedYear) - 1).toString();
    setLoading(true);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('bi_budgets')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('financial_year', prevYear)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        // Apply growth factor (e.g., 5%)
        const growthFactor = 1.05;
        setAnnualRevenue(Math.round((data.annual_revenue || 0) * growthFactor));
        setAnnualCostOfSales(Math.round((data.annual_cost_of_sales || 0) * growthFactor));
        setAnnualOverheads(Math.round((data.annual_overheads || 0) * growthFactor));
        setDistributionMode('annual');
      } else {
        setError(`No budget found for ${prevYear}`);
      }
    } catch (err) {
      console.error('[BudgetManager] Error copying budget:', err);
      setError('Failed to copy from previous year');
    } finally {
      setLoading(false);
    }
  };
  
  // Year options
  const yearOptions = [
    (parseInt(DEFAULT_YEAR) - 1).toString(),
    DEFAULT_YEAR,
    (parseInt(DEFAULT_YEAR) + 1).toString()
  ];
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Annual Budget
            </h2>
            {clientName && (
              <p className="text-sm text-slate-500 mt-0.5">{clientName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>FY {year}</option>
              ))}
            </select>
            <button
              onClick={copyFromPreviousYear}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
            >
              <Copy className="h-4 w-4" />
              Copy from {parseInt(selectedYear) - 1}
            </button>
          </div>
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Budget saved successfully!</span>
        </div>
      )}
      
      {/* Annual Summary */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-6 gap-4">
          {/* Annual Revenue */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Annual Revenue
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
              <input
                type="text"
                value={distributionMode === 'annual' ? annualRevenue.toLocaleString() : calculatedAnnualRevenue.toLocaleString()}
                onChange={(e) => {
                  setAnnualRevenue(parseCurrency(e.target.value));
                  setDistributionMode('annual');
                }}
                className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg text-lg font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Annual Cost of Sales */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Annual Cost of Sales
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
              <input
                type="text"
                value={distributionMode === 'annual' ? annualCostOfSales.toLocaleString() : calculatedAnnualCOS.toLocaleString()}
                onChange={(e) => {
                  setAnnualCostOfSales(parseCurrency(e.target.value));
                  setDistributionMode('annual');
                }}
                className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg text-lg font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Annual Overheads */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Annual Overheads
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
              <input
                type="text"
                value={distributionMode === 'annual' ? annualOverheads.toLocaleString() : calculatedAnnualOverheads.toLocaleString()}
                onChange={(e) => {
                  setAnnualOverheads(parseCurrency(e.target.value));
                  setDistributionMode('annual');
                }}
                className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg text-lg font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Calculated Metrics */}
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-500">Gross Profit</div>
            <div className={`text-xl font-bold ${calculatedGrossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(calculatedGrossProfit)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500">Gross Margin</div>
            <div className={`text-xl font-bold ${grossMargin >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {grossMargin.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500">Net Profit</div>
            <div className={`text-xl font-bold ${calculatedNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(calculatedNetProfit)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-500">Net Margin</div>
            <div className={`text-xl font-bold ${netMargin >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {netMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Monthly Breakdown */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Breakdown
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-1 rounded ${distributionMode === 'annual' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {distributionMode === 'annual' ? 'Auto-distributed' : 'Custom monthly'}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-3 w-28">Month</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-3">Revenue</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-3">Cost of Sales</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-3">Gross Profit</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-3">Overheads</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 px-3">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyBudgets.map((month, idx) => {
                const gross = month.revenue - month.cost_of_sales;
                const net = gross - month.overheads;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-sm font-medium text-slate-700">{MONTHS[idx]}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={month.revenue || ''}
                        onChange={(e) => handleMonthlyChange(idx, 'revenue', parseFloat(e.target.value) || 0)}
                        className="w-full text-right text-sm px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={month.cost_of_sales || ''}
                        onChange={(e) => handleMonthlyChange(idx, 'cost_of_sales', parseFloat(e.target.value) || 0)}
                        className="w-full text-right text-sm px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className={`py-2 px-3 text-right text-sm font-medium ${gross >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(gross)}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={month.overheads || ''}
                        onChange={(e) => handleMonthlyChange(idx, 'overheads', parseFloat(e.target.value) || 0)}
                        className="w-full text-right text-sm px-2 py-1 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className={`py-2 px-3 text-right text-sm font-medium ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50">
              <tr>
                <td className="py-3 px-3 text-sm font-bold text-slate-800">Annual Total</td>
                <td className="py-3 px-3 text-right text-sm font-bold text-slate-800">{formatCurrency(calculatedAnnualRevenue)}</td>
                <td className="py-3 px-3 text-right text-sm font-bold text-slate-800">{formatCurrency(calculatedAnnualCOS)}</td>
                <td className={`py-3 px-3 text-right text-sm font-bold ${calculatedGrossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(calculatedGrossProfit)}
                </td>
                <td className="py-3 px-3 text-right text-sm font-bold text-slate-800">{formatCurrency(calculatedAnnualOverheads)}</td>
                <td className={`py-3 px-3 text-right text-sm font-bold ${calculatedNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(calculatedNetProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          <FileSpreadsheet className="h-4 w-4 inline mr-1" />
          Budgets are used for variance analysis in P&L reports
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Budget
        </button>
      </div>
    </div>
  );
}

export default BudgetManager;

