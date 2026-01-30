import { 
  Building2, 
  Users, 
  TrendingUp, 
  Target,
  AlertTriangle,
  FileText,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  PiggyBank
} from 'lucide-react';

interface BalanceSheet {
  cash?: number | null;
  net_assets?: number | null;
  freehold_property?: number | null;
}

interface TrendAnalysis {
  metric: string;
  direction: 'improving' | 'stable' | 'declining' | 'volatile';
  isRecovering: boolean;
  narrative: string;
}

interface InvestmentSignals {
  likelyInvestmentYear: boolean;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

interface SurplusCashAnalysis {
  hasData: boolean;
  actualCash: number | null;
  requiredCash: number | null;
  surplusCash: number | null;
  surplusAsPercentOfRevenue: number | null;
  components: {
    operatingBuffer: number | null;
    workingCapitalRequirement: number | null;
    netWorkingCapital: number | null;
  };
  methodology: string;
  narrative: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ClientDataReferenceProps {
  revenue: number;
  employees: number;
  revenuePerEmployee: number;
  percentile: number;
  industryCode: string;
  industryName?: string;
  industryConfidence?: number;
  founderRiskScore?: number;
  founderRiskLevel?: string;
  valuationImpact?: string;
  dataGaps?: string[];
  // New balance sheet & trend props
  balanceSheet?: BalanceSheet | null;
  financialTrends?: TrendAnalysis[] | null;
  investmentSignals?: InvestmentSignals | null;
  cashMonths?: number | null;
  surplusCash?: SurplusCashAnalysis | null;
}

export function ClientDataReference({
  revenue,
  employees,
  revenuePerEmployee,
  percentile,
  industryCode,
  industryName,
  industryConfidence,
  founderRiskScore,
  founderRiskLevel,
  valuationImpact,
  dataGaps,
  balanceSheet,
  financialTrends,
  investmentSignals,
  cashMonths,
  surplusCash
}: ClientDataReferenceProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
        Quick Reference
      </h3>
      
      {/* Company Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Revenue
          </span>
          <span className="font-semibold text-slate-800">
            £{revenue.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Employees
          </span>
          <span className="font-semibold text-slate-800">{employees}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Rev/Employee
          </span>
          <span className="font-semibold text-slate-800">
            £{revenuePerEmployee.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Percentile
          </span>
          <span className={`font-semibold ${
            percentile >= 50 ? 'text-emerald-600' : 
            percentile >= 25 ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {percentile}th
          </span>
        </div>
      </div>
      
      {/* Industry */}
      <div className="pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Industry</p>
        <p className="text-sm font-medium text-slate-800">{industryName || industryCode}</p>
        {industryConfidence && (
          <p className="text-xs text-slate-500">
            {industryCode} · {industryConfidence}% confidence
          </p>
        )}
      </div>
      
      {/* Balance Sheet */}
      {balanceSheet && (balanceSheet.cash || balanceSheet.net_assets) && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            Balance Sheet
          </p>
          <div className="space-y-1.5">
            {balanceSheet.cash && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5" />
                  Cash
                </span>
                <span className="font-semibold text-emerald-600">
                  £{(balanceSheet.cash / 1000000).toFixed(2)}M
                </span>
              </div>
            )}
            {balanceSheet.net_assets && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Net Assets</span>
                <span className="font-semibold text-slate-800">
                  £{(balanceSheet.net_assets / 1000000).toFixed(2)}M
                </span>
              </div>
            )}
            {/* Show Surplus Cash if available, otherwise Cash Runway */}
            {surplusCash?.hasData && surplusCash.surplusCash && surplusCash.surplusCash > 100000 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Surplus Cash</span>
                <span className="font-semibold text-emerald-600">
                  £{(surplusCash.surplusCash / 1000000).toFixed(1)}M
                </span>
              </div>
            ) : cashMonths ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Cash Runway</span>
                <span className={`font-semibold ${
                  cashMonths >= 3 ? 'text-emerald-600' : 
                  cashMonths >= 1 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {cashMonths.toFixed(1)} months
                </span>
              </div>
            ) : null}
            {balanceSheet.freehold_property && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Property</span>
                <span className="font-semibold text-blue-600">
                  £{(balanceSheet.freehold_property / 1000).toFixed(0)}k
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Surplus Cash Analysis */}
      {surplusCash?.hasData && surplusCash.surplusCash && surplusCash.surplusCash > 100000 && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <PiggyBank className="w-3 h-3" />
            Surplus Cash
          </p>
          <div className={`p-2 rounded text-xs ${
            surplusCash.surplusAsPercentOfRevenue && surplusCash.surplusAsPercentOfRevenue > 5 
              ? 'bg-emerald-50 border border-emerald-200' 
              : 'bg-slate-50 border border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600">Surplus</span>
              <span className="font-bold text-emerald-600">
                £{(surplusCash.surplusCash / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>vs Required</span>
              <span>£{surplusCash.requiredCash ? (surplusCash.requiredCash / 1000000).toFixed(1) : '?'}M</span>
            </div>
            {surplusCash.surplusAsPercentOfRevenue && (
              <div className="mt-1 pt-1 border-t border-slate-200 text-slate-600">
                {surplusCash.surplusAsPercentOfRevenue.toFixed(1)}% of revenue
              </div>
            )}
            {surplusCash.components.netWorkingCapital && surplusCash.components.netWorkingCapital < 0 && (
              <div className="mt-1 pt-1 border-t border-slate-200 text-blue-600">
                📊 Suppliers fund £{(Math.abs(surplusCash.components.netWorkingCapital) / 1000000).toFixed(1)}M WC
              </div>
            )}
            <div className="mt-1 text-slate-400">
              Confidence: {surplusCash.confidence}
            </div>
          </div>
        </div>
      )}

      {/* Financial Trends */}
      {financialTrends && financialTrends.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Trends
          </p>
          <div className="space-y-1.5">
            {financialTrends.slice(0, 2).map((trend, i) => (
              <div 
                key={i}
                className={`text-xs px-2 py-1.5 rounded flex items-center gap-1.5 ${
                  trend.isRecovering ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  trend.direction === 'improving' ? 'bg-green-50 text-green-700' :
                  trend.direction === 'declining' ? 'bg-rose-50 text-rose-700' :
                  'bg-slate-100 text-slate-600'
                }`}
              >
                {trend.isRecovering ? (
                  <RefreshCcw className="w-3 h-3" />
                ) : trend.direction === 'improving' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : trend.direction === 'declining' ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : null}
                <span className="capitalize">{trend.metric.replace('_', ' ')}</span>
                {trend.isRecovering && <span className="font-semibold">Recovering</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Investment Pattern Alert */}
      {investmentSignals?.likelyInvestmentYear && (
        <div className="pt-3 border-t border-slate-200">
          <div className={`p-2 rounded text-xs ${
            investmentSignals.confidence === 'high' ? 'bg-blue-50 border border-blue-200' :
            'bg-slate-50 border border-slate-200'
          }`}>
            <p className="font-semibold text-blue-700 mb-1">
              ⚠️ Investment Pattern Detected
            </p>
            <p className="text-slate-600">
              {investmentSignals.indicators[0]}
            </p>
          </div>
        </div>
      )}
      
      {/* Founder Risk */}
      {founderRiskScore !== undefined && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Founder Risk</p>
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              founderRiskLevel === 'critical' ? 'bg-red-100 text-red-700' :
              founderRiskLevel === 'high' ? 'bg-rose-100 text-rose-700' :
              founderRiskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {founderRiskLevel?.toUpperCase() || 'MEDIUM'}
            </span>
            <span className="text-sm font-medium text-slate-800">
              {founderRiskScore}/100
            </span>
          </div>
          {valuationImpact && (
            <p className="text-xs text-rose-600 mt-1">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {valuationImpact}
            </p>
          )}
        </div>
      )}
      
      {/* Data Gaps */}
      {dataGaps && dataGaps.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Missing Data
          </p>
          <div className="flex flex-wrap gap-1">
            {dataGaps.map((gap, i) => (
              <span 
                key={i}
                className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded"
              >
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

