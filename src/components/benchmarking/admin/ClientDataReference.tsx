import { 
  Building2, 
  Users, 
  TrendingUp, 
  Target,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface ClientDataReferenceProps {
  companyName?: string;
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
}

export function ClientDataReference({
  companyName,
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
  dataGaps
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

