import { AlertTriangle, Shield, AlertCircle, Info } from 'lucide-react';

interface RiskFlag {
  flag: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitigation: string;
}

interface RiskFlagsPanelProps {
  flags: RiskFlag[];
}

export function RiskFlagsPanel({ flags }: RiskFlagsPanelProps) {
  const severityConfig = {
    critical: { 
      icon: AlertTriangle, 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      iconColor: 'text-red-600',
      badge: 'bg-red-600 text-white'
    },
    high: { 
      icon: AlertCircle, 
      bg: 'bg-amber-50', 
      border: 'border-amber-200',
      iconColor: 'text-amber-600',
      badge: 'bg-amber-500 text-white'
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
    }
  };
  
  // Sort by severity
  const sortedFlags = [...flags].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Risk Flags ({flags.length})
      </h3>
      
      <div className="space-y-2">
        {sortedFlags.map((flag, i) => {
          const config = severityConfig[flag.severity];
          const Icon = config.icon;
          
          return (
            <div 
              key={i}
              className={`${config.bg} ${config.border} border rounded-lg p-3`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${config.badge}`}>
                      {flag.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{flag.flag}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    <strong>Mitigation:</strong> {flag.mitigation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



