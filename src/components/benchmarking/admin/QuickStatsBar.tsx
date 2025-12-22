import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Shield
} from 'lucide-react';

interface QuickStatsBarProps {
  totalOpportunity: number;
  percentile: number;
  gapCount: number;
  strengthCount: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export function QuickStatsBar({
  totalOpportunity,
  percentile,
  gapCount,
  strengthCount,
  riskLevel = 'medium'
}: QuickStatsBarProps) {
  
  const riskConfig = {
    low: { label: 'LOW', color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    medium: { label: 'MEDIUM', color: 'amber', bg: 'bg-amber-100', text: 'text-amber-700' },
    high: { label: 'HIGH', color: 'rose', bg: 'bg-rose-100', text: 'text-rose-700' },
    critical: { label: 'CRITICAL', color: 'red', bg: 'bg-red-100', text: 'text-red-700' }
  };
  
  const risk = riskConfig[riskLevel];

  return (
    <div className="bg-slate-800 text-white px-4 py-3 rounded-lg">
      <div className="flex items-center justify-between gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Opportunity:</span>
          <span className="font-bold text-emerald-400">£{totalOpportunity.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" />
          <span className="text-slate-400">Percentile:</span>
          <span className="font-bold">{percentile}th</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span className="text-slate-400">Gaps:</span>
          <span className="font-bold text-rose-400">{gapCount}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Strengths:</span>
          <span className="font-bold text-emerald-400">{strengthCount}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="text-slate-400">Founder Risk:</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${risk.bg} ${risk.text}`}>
            {risk.label}
          </span>
        </div>
      </div>
    </div>
  );
}

