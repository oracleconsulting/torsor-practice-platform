/**
 * Balance Sheet Summary Component
 * Displays a condensed balance sheet view with key metrics
 */

import { 
  Building2,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Scale,
  ArrowRight
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface BalanceSheetData {
  current_assets?: {
    cash?: number;
    debtors?: number;
    stock?: number;
    prepayments?: number;
    other?: number;
  };
  fixed_assets?: {
    tangible?: number;
    intangible?: number;
    investments?: number;
  };
  current_liabilities?: {
    creditors?: number;
    tax?: number;
    accruals?: number;
    overdraft?: number;
    other?: number;
  };
  long_term_liabilities?: {
    loans?: number;
    director_loans?: number;
    other?: number;
  };
  equity?: {
    share_capital?: number;
    retained_earnings?: number;
    current_year_profit?: number;
  };
}

interface BalanceSheetSummaryProps {
  data: BalanceSheetData | null;
  periodLabel?: string;
  showDetails?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const sumValues = (obj: Record<string, number | undefined> | undefined): number => {
  if (!obj) return 0;
  return Object.values(obj).reduce<number>((sum, val) => sum + (val || 0), 0);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BalanceSheetSummary({ 
  data, 
  periodLabel,
  showDetails = true 
}: BalanceSheetSummaryProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Balance sheet data not available</p>
        <p className="text-sm text-slate-400 mt-1">Upload your accounts to see the balance sheet</p>
      </div>
    );
  }

  // Calculate totals
  const totalCurrentAssets = sumValues(data.current_assets);
  const totalFixedAssets = sumValues(data.fixed_assets);
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  
  const totalCurrentLiabilities = sumValues(data.current_liabilities);
  const totalLongTermLiabilities = sumValues(data.long_term_liabilities);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
  
  const totalEquity = sumValues(data.equity);
  
  const netAssets = totalAssets - totalLiabilities;
  const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
  const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Balance Sheet Summary</h3>
            {periodLabel && <p className="text-sm text-slate-500 mt-0.5">{periodLabel}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
              netAssets >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {netAssets >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              Net Assets: {formatCurrency(netAssets)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Working Capital</div>
            <div className={`text-2xl font-bold ${workingCapital >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(workingCapital)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Current Assets - Current Liabilities</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Ratio</div>
            <div className={`text-2xl font-bold ${
              currentRatio >= 2 ? 'text-emerald-600' : currentRatio >= 1 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {currentRatio.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {currentRatio >= 2 ? 'Healthy' : currentRatio >= 1 ? 'Adequate' : 'Needs attention'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Debt to Equity</div>
            <div className={`text-2xl font-bold ${
              totalEquity > 0 && totalLiabilities / totalEquity <= 1 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {totalEquity > 0 ? (totalLiabilities / totalEquity).toFixed(2) : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {totalEquity > 0 && totalLiabilities / totalEquity <= 1 ? 'Conservative' : 'Leveraged'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Balance Sheet Layout */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-8">
          {/* Assets Column */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              Assets
            </h4>
            
            {/* Fixed Assets */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span className="font-medium">Fixed Assets</span>
                <span className="font-semibold text-slate-800">{formatCurrency(totalFixedAssets)}</span>
              </div>
              {showDetails && (
                <div className="pl-4 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Tangible</span>
                    <span>{formatCurrency(data.fixed_assets?.tangible)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Intangible</span>
                    <span>{formatCurrency(data.fixed_assets?.intangible)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Investments</span>
                    <span>{formatCurrency(data.fixed_assets?.investments)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Current Assets */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span className="font-medium">Current Assets</span>
                <span className="font-semibold text-slate-800">{formatCurrency(totalCurrentAssets)}</span>
              </div>
              {showDetails && (
                <div className="pl-4 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Cash at Bank</span>
                    <span>{formatCurrency(data.current_assets?.cash)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Trade Debtors</span>
                    <span>{formatCurrency(data.current_assets?.debtors)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Stock</span>
                    <span>{formatCurrency(data.current_assets?.stock)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Prepayments</span>
                    <span>{formatCurrency(data.current_assets?.prepayments)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Total Assets */}
            <div className="pt-4 border-t-2 border-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Total Assets</span>
                <span className="text-xl font-bold text-slate-900">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </div>
          
          {/* Liabilities & Equity Column */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-red-600" />
              Liabilities & Equity
            </h4>
            
            {/* Current Liabilities */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span className="font-medium">Current Liabilities</span>
                <span className="font-semibold text-red-600">{formatCurrency(totalCurrentLiabilities)}</span>
              </div>
              {showDetails && (
                <div className="pl-4 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Trade Creditors</span>
                    <span>{formatCurrency(data.current_liabilities?.creditors)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax Liabilities</span>
                    <span>{formatCurrency(data.current_liabilities?.tax)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Accruals</span>
                    <span>{formatCurrency(data.current_liabilities?.accruals)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Long Term Liabilities */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span className="font-medium">Long Term Liabilities</span>
                <span className="font-semibold text-red-600">{formatCurrency(totalLongTermLiabilities)}</span>
              </div>
              {showDetails && (
                <div className="pl-4 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Bank Loans</span>
                    <span>{formatCurrency(data.long_term_liabilities?.loans)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Director Loans</span>
                    <span>{formatCurrency(data.long_term_liabilities?.director_loans)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Equity */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span className="font-medium flex items-center gap-1">
                  <PiggyBank className="h-3 w-3" />
                  Shareholders' Equity
                </span>
                <span className="font-semibold text-emerald-600">{formatCurrency(totalEquity)}</span>
              </div>
              {showDetails && (
                <div className="pl-4 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Share Capital</span>
                    <span>{formatCurrency(data.equity?.share_capital)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Retained Earnings</span>
                    <span>{formatCurrency(data.equity?.retained_earnings)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Current Year Profit</span>
                    <span>{formatCurrency(data.equity?.current_year_profit)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Total Liabilities & Equity */}
            <div className="pt-4 border-t-2 border-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Total Liabilities & Equity</span>
                <span className="text-xl font-bold text-slate-900">{formatCurrency(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Balance Check */}
        {Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 1 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Note:</strong> Assets ({formatCurrency(totalAssets)}) and Liabilities + Equity ({formatCurrency(totalLiabilities + totalEquity)}) don't balance. 
              Difference: {formatCurrency(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}
            </p>
          </div>
        )}
      </div>
      
      {/* Footer with insights */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              <strong className="text-slate-800">{formatCurrency(data.current_assets?.debtors || 0)}</strong> owed to you
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300" />
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              <strong className="text-slate-800">{formatCurrency(data.current_liabilities?.creditors || 0)}</strong> you owe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BalanceSheetSummary;

