import { AlertTriangle, Shield, AlertCircle, Info, CheckCircle, TrendingDown } from 'lucide-react';

interface RiskFlag {
  flag: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'strength';
  mitigation?: string;
  warningSignsInConversation?: string;
  annualRiskValue?: number;
  valuationImpact?: string;
  details?: string;
  category?: string;
  dataSource?: string;
}

interface RiskFlagsPanelProps {
  flags: RiskFlag[];
}

export function RiskFlagsPanel({ flags }: RiskFlagsPanelProps) {
  const severityConfig: Record<string, { icon: any; bg: string; border: string; iconColor: string; badge: string }> = {
    critical: { 
      icon: AlertTriangle, 
      bg: 'bg-red-50', 
      border: 'border-red-300',
      iconColor: 'text-red-600',
      badge: 'bg-red-600 text-white'
    },
    high: { 
      icon: AlertCircle, 
      bg: 'bg-orange-50', 
      border: 'border-orange-200',
      iconColor: 'text-orange-600',
      badge: 'bg-orange-500 text-white'
    },
    medium: { 
      icon: Shield, 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      badge: 'bg-yellow-500 text-white'
    },
    low: { 
      icon: Info, 
      bg: 'bg-blue-50', 
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-500 text-white'
    },
    strength: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      badge: 'bg-green-600 text-white'
    }
  };
  
  // Sort by severity (critical first, strength last)
  const sortedFlags = [...flags].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, strength: 4 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });
  
  // Count by severity for summary
  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const highCount = flags.filter(f => f.severity === 'high').length;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Risk Flags ({flags.length})
        {criticalCount > 0 && (
          <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">{criticalCount} CRITICAL</span>
        )}
        {highCount > 0 && (
          <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">{highCount} HIGH</span>
        )}
      </h3>
      
      <div className="space-y-3">
        {sortedFlags.map((flag, i) => {
          const config = severityConfig[flag.severity] || severityConfig.medium;
          const Icon = config.icon;
          
          return (
            <div 
              key={i}
              className={`${config.bg} ${config.border} border rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.badge}`}>
                      {flag.severity.toUpperCase()}
                    </span>
                    {flag.category && (
                      <span className="text-xs text-slate-500 uppercase">{flag.category}</span>
                    )}
                  </div>
                  
                  <p className="text-slate-800 font-medium">{flag.flag}</p>
                  
                  {flag.details && (
                    <p className="text-sm text-slate-700 mt-1">{flag.details}</p>
                  )}
                  
                  {flag.mitigation && (
                    <p className="text-sm text-slate-600 mt-2">
                      <strong>Mitigation:</strong> {flag.mitigation}
                    </p>
                  )}
                  
                  {flag.warningSignsInConversation && (
                    <p className="text-sm text-slate-500 mt-1 italic">
                      <strong>Watch for:</strong> {flag.warningSignsInConversation}
                    </p>
                  )}
                  
                  {/* Financial impact section */}
                  {(flag.annualRiskValue || flag.valuationImpact) && (
                    <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-slate-200">
                      {flag.annualRiskValue && flag.annualRiskValue > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          <span className="text-red-600 font-semibold">
                            £{(flag.annualRiskValue / 1000000).toFixed(1)}M at risk
                          </span>
                        </div>
                      )}
                      {flag.valuationImpact && (
                        <div className="text-sm text-orange-600">
                          <strong>Valuation:</strong> {flag.valuationImpact}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



