/**
 * Historical Data Uploader Component
 * Allows users to create past periods and upload historical accounts data
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, 
  Plus, 
  Check, 
  AlertCircle, 
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  X
} from 'lucide-react';

interface HistoricalPeriod {
  year: number;
  month: number;
  label: string;
  periodStart: string;
  periodEnd: string;
  hasData: boolean;
  periodId?: string;
}

interface HistoricalDataUploaderProps {
  engagementId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export function HistoricalDataUploader({ 
  engagementId, 
  onComplete,
  onClose 
}: HistoricalDataUploaderProps) {
  const [step, setStep] = useState<'select' | 'upload' | 'data'>('select');
  const [selectedPeriods, setSelectedPeriods] = useState<HistoricalPeriod[]>([]);
  const [existingPeriods, setExistingPeriods] = useState<string[]>([]);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  
  // Financial data state for manual entry
  const [financialData, setFinancialData] = useState<Record<string, Record<string, number>>>({});

  // Generate last 24 months of periods
  const generatePeriodOptions = useCallback((): HistoricalPeriod[] => {
    const periods: HistoricalPeriod[] = [];
    const now = new Date();
    
    for (let i = 1; i <= 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthLabel = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const periodStart = date.toISOString().split('T')[0];
      const periodEnd = endDate.toISOString().split('T')[0];
      
      periods.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: monthLabel,
        periodStart,
        periodEnd,
        hasData: existingPeriods.includes(periodStart)
      });
    }
    
    return periods;
  }, [existingPeriods]);

  // Fetch existing periods for this engagement (check both bi_ and ma_ tables)
  const fetchExistingPeriods = useCallback(async () => {
    const existingDates: string[] = [];
    
    // Check bi_periods
    const { data: biData } = await supabase
      .from('bi_periods')
      .select('period_start')
      .eq('engagement_id', engagementId);
    
    if (biData) {
      existingDates.push(...biData.map(p => p.period_start));
    }
    
    // Also check ma_periods for compatibility
    const { data: maData } = await supabase
      .from('ma_periods')
      .select('period_start')
      .eq('engagement_id', engagementId);
    
    if (maData) {
      existingDates.push(...maData.map(p => p.period_start));
    }
    
    // Dedupe
    setExistingPeriods([...new Set(existingDates)]);
  }, [engagementId]);

  // Initialize on mount
  useState(() => {
    fetchExistingPeriods();
  });

  const periodOptions = generatePeriodOptions();

  const togglePeriodSelection = (period: HistoricalPeriod) => {
    if (period.hasData) return; // Can't select periods that already have data
    
    setSelectedPeriods(prev => {
      const isSelected = prev.some(p => p.periodStart === period.periodStart);
      if (isSelected) {
        return prev.filter(p => p.periodStart !== period.periodStart);
      } else {
        return [...prev, period].sort((a, b) => 
          new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
        );
      }
    });
  };

  const handleCreatePeriods = async () => {
    if (selectedPeriods.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create all selected periods
      // Try bi_periods first, fallback to ma_periods for compatibility
      const periodPromises = selectedPeriods.map(async (period) => {
        // Try bi_periods first
        let result = await supabase
          .from('bi_periods')
          .insert({
            engagement_id: engagementId,
            period_type: 'monthly',
            period_start: period.periodStart,
            period_end: period.periodEnd,
            period_label: period.label,
            status: 'pending'
          })
          .select()
          .single();
        
        // Fallback to ma_periods if bi_periods fails
        if (result.error) {
          result = await supabase
            .from('ma_periods')
            .insert({
              engagement_id: engagementId,
              period_type: 'monthly',
              period_start: period.periodStart,
              period_end: period.periodEnd,
              period_label: period.label,
              status: 'pending',
              due_date: new Date(new Date(period.periodEnd).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
            .select()
            .single();
        }
        
        if (result.error) throw result.error;
        return { ...period, periodId: result.data.id };
      });
      
      const createdPeriods = await Promise.all(periodPromises);
      setSelectedPeriods(createdPeriods);
      setStep('data');
      setCurrentPeriodIndex(0);
    } catch (err) {
      console.error('Failed to create periods:', err);
      setError('Failed to create historical periods');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinancialData = async () => {
    const currentPeriod = selectedPeriods[currentPeriodIndex];
    const data = financialData[currentPeriod.periodStart];
    
    if (!data || !currentPeriod.periodId) {
      // Skip if no data entered
      handleNextPeriod();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate derived values
      const grossProfit = (data.revenue || 0) - (data.cost_of_sales || 0);
      const operatingProfit = grossProfit - (data.overheads || 0);
      
      // Calculate True Cash components
      const trueCash = (data.cash_at_bank || 0) - 
        (data.vat_liability || 0) - 
        (data.paye_liability || 0) - 
        (data.corporation_tax_liability || 0);
      
      const monthlyBurn = data.overheads || (data.cost_of_sales || 0) / 2;
      const runway = monthlyBurn > 0 ? trueCash / monthlyBurn : 0;
      
      // Try bi_financial_data first, fallback to ma_financial_data
      const financialPayload = {
        period_id: currentPeriod.periodId,
        // P&L
        revenue: data.revenue || 0,
        cost_of_sales: data.cost_of_sales || 0,
        gross_profit: grossProfit,
        overheads: data.overheads || 0,
        operating_profit: operatingProfit,
        net_profit: data.net_profit || operatingProfit,
        // Balance Sheet
        cash_at_bank: data.cash_at_bank || 0,
        trade_debtors: data.trade_debtors || 0,
        trade_creditors: data.trade_creditors || 0,
        // Tax Liabilities
        vat_liability: data.vat_liability || 0,
        paye_liability: data.paye_liability || 0,
        corporation_tax_liability: data.corporation_tax_liability || 0,
        // Calculated
        true_cash: trueCash,
        monthly_operating_costs: monthlyBurn,
        true_cash_runway_months: runway,
        // Costs breakdown
        payroll_costs: data.payroll_costs || 0
      };
      
      let result = await supabase
        .from('bi_financial_data')
        .upsert(financialPayload, { onConflict: 'period_id' });
      
      // Fallback to ma_financial_data if bi fails
      if (result.error) {
        result = await supabase
          .from('ma_financial_data')
          .upsert(financialPayload, { onConflict: 'period_id' });
      }
      
      if (result.error) throw result.error;
      
      // Mark period as having data - try both tables
      await Promise.all([
        supabase.from('bi_periods').update({ status: 'data_extracted' }).eq('id', currentPeriod.periodId),
        supabase.from('ma_periods').update({ status: 'data_received' }).eq('id', currentPeriod.periodId)
      ]);
      
      handleNextPeriod();
    } catch (err) {
      console.error('Failed to save financial data:', err);
      setError('Failed to save financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPeriod = () => {
    if (currentPeriodIndex < selectedPeriods.length - 1) {
      setCurrentPeriodIndex(prev => prev + 1);
    } else {
      // All periods done
      onComplete?.();
    }
  };

  const handleSkipPeriod = () => {
    handleNextPeriod();
  };

  const updateFinancialField = (field: string, value: number) => {
    const currentPeriod = selectedPeriods[currentPeriodIndex];
    setFinancialData(prev => ({
      ...prev,
      [currentPeriod.periodStart]: {
        ...prev[currentPeriod.periodStart],
        [field]: value
      }
    }));
  };

  const getCurrentData = () => {
    const currentPeriod = selectedPeriods[currentPeriodIndex];
    return financialData[currentPeriod?.periodStart] || {};
  };

  // Group periods by year
  const periodsByYear = periodOptions.reduce((acc, period) => {
    const year = period.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(period);
    return acc;
  }, {} as Record<number, HistoricalPeriod[]>);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div 
        className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Upload Historical Data</h3>
            <p className="text-sm text-slate-500">
              Add previous months' accounts for trend analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1 hover:bg-slate-200 rounded"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Step 1: Select Periods */}
          {step === 'select' && (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Select the historical months you want to add data for. We'll create periods for each selection.
              </p>
              
              {Object.entries(periodsByYear)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, periods]) => (
                <div key={year} className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">{year}</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {periods.map(period => {
                      const isSelected = selectedPeriods.some(p => p.periodStart === period.periodStart);
                      const hasData = period.hasData;
                      
                      return (
                        <button
                          key={period.periodStart}
                          onClick={() => togglePeriodSelection(period)}
                          disabled={hasData}
                          className={`
                            p-2 rounded-lg text-sm transition-all
                            ${hasData 
                              ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-blue-600 text-white border border-blue-600'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                            }
                          `}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {hasData && <Check className="w-3 h-3" />}
                            {period.label.split(' ')[0].slice(0, 3)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {selectedPeriods.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      {selectedPeriods.length} period{selectedPeriods.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={handleCreatePeriods}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create Periods
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Enter Financial Data */}
          {step === 'data' && selectedPeriods[currentPeriodIndex] && (
            <div>
              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">
                    {selectedPeriods[currentPeriodIndex].label}
                  </span>
                  <span className="text-slate-500">
                    Period {currentPeriodIndex + 1} of {selectedPeriods.length}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${((currentPeriodIndex + 1) / selectedPeriods.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Financial Data Entry Form */}
              <div className="space-y-6">
                {/* P&L Section */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Profit & Loss
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Revenue</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().revenue || ''}
                          onChange={(e) => updateFinancialField('revenue', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Cost of Sales</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().cost_of_sales || ''}
                          onChange={(e) => updateFinancialField('cost_of_sales', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Overheads</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().overheads || ''}
                          onChange={(e) => updateFinancialField('overheads', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Payroll Costs</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().payroll_costs || ''}
                          onChange={(e) => updateFinancialField('payroll_costs', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Sheet Section */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Balance Sheet
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Cash at Bank</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().cash_at_bank || ''}
                          onChange={(e) => updateFinancialField('cash_at_bank', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Trade Debtors</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().trade_debtors || ''}
                          onChange={(e) => updateFinancialField('trade_debtors', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Trade Creditors</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().trade_creditors || ''}
                          onChange={(e) => updateFinancialField('trade_creditors', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Liabilities */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Tax Liabilities (for True Cash)
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">VAT Liability</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().vat_liability || ''}
                          onChange={(e) => updateFinancialField('vat_liability', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">PAYE/NI</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().paye_liability || ''}
                          onChange={(e) => updateFinancialField('paye_liability', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Corporation Tax</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                        <input
                          type="number"
                          value={getCurrentData().corporation_tax_liability || ''}
                          onChange={(e) => updateFinancialField('corporation_tax_liability', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSkipPeriod}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 flex items-center gap-2"
                >
                  Skip this month
                </button>
                <div className="flex items-center gap-3">
                  {currentPeriodIndex > 0 && (
                    <button
                      onClick={() => setCurrentPeriodIndex(prev => prev - 1)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800"
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={handleSaveFinancialData}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Saving...
                      </>
                    ) : currentPeriodIndex === selectedPeriods.length - 1 ? (
                      <>
                        <Check className="w-4 h-4" />
                        Finish
                      </>
                    ) : (
                      <>
                        Save & Next
                        <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HistoricalDataUploader;

