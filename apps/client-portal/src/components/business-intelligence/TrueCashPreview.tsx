import { useState } from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface TrueCashPreviewProps {
  bankBalance: number;
  trueCash: number;
  deductions: Array<{
    label: string;
    amount: number;
    category?: 'tax' | 'payroll' | 'creditors' | 'receivables' | 'other';
  }>;
  narrative?: string;
}

export function TrueCashPreview({ bankBalance, trueCash, deductions, narrative }: TrueCashPreviewProps) {
  const [showDetails, setShowDetails] = useState(true);
  
  const formatCurrency = (amount: number) => {
    const prefix = amount >= 0 ? '' : '-';
    return `${prefix}£${Math.abs(amount).toLocaleString()}`;
  };
  
  const difference = bankBalance - trueCash;
  const percentageDifference = ((difference / bankBalance) * 100).toFixed(0);
  const isHealthy = trueCash > 0 && (trueCash / bankBalance) > 0.3;
  
  // Group deductions by category
  const categoryColors: Record<string, string> = {
    tax: 'bg-red-500',
    payroll: 'bg-orange-500',
    creditors: 'bg-amber-500',
    receivables: 'bg-emerald-500',
    other: 'bg-slate-400'
  };

  // Calculate percentage for visual bar
  const maxAmount = bankBalance;
  
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          True Cash vs Bank Balance
          <span className="text-xs bg-slate-700 px-2 py-1 rounded-full font-normal">
            The reality check
          </span>
        </h3>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      
      {/* Visual Comparison Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Your bank says</span>
          <span className="text-green-400 font-bold text-xl">{formatCurrency(bankBalance)}</span>
        </div>
        
        {/* Bank Balance Bar */}
        <div className="h-8 bg-green-500/20 rounded-lg overflow-hidden mb-3 relative">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-lg transition-all duration-500"
            style={{ width: '100%' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
            Bank Balance
          </span>
        </div>
        
        {/* True Cash Bar */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">You can actually spend</span>
          <span className={`font-bold text-xl ${trueCash >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {formatCurrency(trueCash)}
          </span>
        </div>
        <div className="h-8 bg-blue-500/20 rounded-lg overflow-hidden relative">
          <div 
            className={`h-full rounded-lg transition-all duration-500 ${
              trueCash >= 0 ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gradient-to-r from-red-600 to-red-400'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (trueCash / bankBalance) * 100))}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
            True Cash
          </span>
        </div>
      </div>
      
      {/* The Difference Callout */}
      <div className={`rounded-xl p-4 mb-6 ${
        difference > bankBalance * 0.3 
          ? 'bg-amber-500/20 border border-amber-500/50' 
          : 'bg-slate-700/50 border border-slate-600'
      }`}>
        <div className="flex items-center gap-3">
          {difference > bankBalance * 0.3 ? (
            <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
          ) : (
            <TrendingDown className="h-6 w-6 text-slate-400 flex-shrink-0" />
          )}
          <div>
            <p className="font-semibold text-lg">
              {formatCurrency(difference)} is money you can see but can't touch
            </p>
            <p className="text-sm text-slate-400">
              That's {percentageDifference}% of your bank balance already committed
            </p>
          </div>
        </div>
      </div>
      
      {/* Deductions Breakdown */}
      {showDetails && (
        <div className="space-y-3 border-t border-slate-700 pt-4">
          <p className="text-sm text-slate-400 font-medium">Where it's committed:</p>
          {deductions.map((item, i) => {
            const barWidth = Math.abs(item.amount) / maxAmount * 100;
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span className={item.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.amount >= 0 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${Math.min(barWidth, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Narrative */}
      {narrative && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-300 italic">{narrative}</p>
        </div>
      )}
      
      {/* Health Indicator */}
      <div className={`mt-4 flex items-center gap-2 text-sm ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
        {isHealthy ? (
          <>
            <TrendingUp className="h-4 w-4" />
            <span>Your true cash position gives you room to operate</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            <span>Your true cash position needs attention</span>
          </>
        )}
      </div>
    </div>
  );
}

export default TrueCashPreview;



