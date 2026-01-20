import { 
  ArrowRight, 
  Clock, 
  Zap, 
  Target
} from 'lucide-react';

interface Recommendation {
  title: string;
  description: string;
  annualValue: number;
  timeframe: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: number;
  linkedService?: string;
  implementationSteps?: string[];
  quickWins?: string[];
  whatWeCanHelp?: string;
}

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  totalOpportunity: number;
}

const difficultyConfig = {
  easy: { label: 'Quick Win', color: 'emerald', icon: Zap },
  medium: { label: 'Medium Effort', color: 'amber', icon: Target },
  hard: { label: 'Strategic', color: 'blue', icon: Clock }
};

export function RecommendationsSection({ 
  recommendations, 
  totalOpportunity 
}: RecommendationsSectionProps) {
  
  // Sort by priority
  const sorted = [...recommendations].sort((a, b) => a.priority - b.priority);
  
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recommendations</h2>
          <p className="text-slate-500 mt-1">
            Prioritized actions to capture the opportunity
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Total Opportunity</p>
          <p className="text-3xl font-bold text-emerald-600">
            £{totalOpportunity.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Opportunity Waterfall */}
      <div className="bg-slate-50 rounded-xl p-6">
        <div className="flex items-end gap-2 h-32">
          {sorted.map((rec, i) => {
            const heightPercent = (rec.annualValue / totalOpportunity) * 100;
            const config = difficultyConfig[rec.difficulty];
            
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-lg bg-${config.color}-500 relative group cursor-pointer transition-all duration-500`}
                style={{ height: `${heightPercent}%` }}
                title={`${rec.title}: £${rec.annualValue.toLocaleString()}`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {rec.title}: £{rec.annualValue.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          {Object.entries(difficultyConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded bg-${config.color}-500`} />
              <span className="text-slate-600">{config.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recommendation Cards */}
      <div className="space-y-4">
        {sorted.map((rec, i) => {
          const config = difficultyConfig[rec.difficulty];
          const Icon = config.icon;
          
          return (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Priority Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-600">{rec.priority}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{rec.title}</h3>
                      <p className="text-slate-600 mt-1">{rec.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-emerald-600">
                        £{rec.annualValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">annual value</p>
                    </div>
                  </div>
                  
                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-${config.color}-50 text-${config.color}-700`}>
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {rec.timeframe}
                    </div>
                    {rec.linkedService && (
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <ArrowRight className="w-3.5 h-3.5" />
                        {rec.linkedService}
                      </div>
                    )}
                  </div>
                  
                  {/* Implementation Steps */}
                  {rec.implementationSteps && rec.implementationSteps.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-700 mb-2">How to implement:</p>
                      <ol className="space-y-1.5">
                        {rec.implementationSteps.map((step, si) => (
                          <li key={si} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-slate-400 font-medium min-w-[1.25rem]">{si + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  {/* Quick Wins */}
                  {rec.quickWins && rec.quickWins.length > 0 && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                        ⚡ Start this week
                      </p>
                      <ul className="space-y-1">
                        {rec.quickWins.map((win, wi) => (
                          <li key={wi} className="text-sm text-emerald-800 flex items-start gap-1.5">
                            <span className="text-emerald-500">→</span>
                            {win}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* What We Can Help With */}
                  {rec.whatWeCanHelp && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                      <span className="font-medium text-blue-700">How we can help: </span>
                      <span className="text-blue-800">{rec.whatWeCanHelp}</span>
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


