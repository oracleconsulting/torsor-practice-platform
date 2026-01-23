'use client';

import { useState } from 'react';
import { 
  ChevronRight, 
  Users, 
  TrendingDown, 
  Percent,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Scenario {
  id: string;
  type: 'hire' | 'client_loss' | 'price_change' | 'custom';
  name: string;
  description: string;
  cashImpact: number;
  runwayImpact: number;
  newRunway: number;
  verdict: 'recommended' | 'viable' | 'caution' | 'high_risk';
  recommendation: string;
  conditions?: string[];
}

interface ScenarioExplorerProps {
  scenarios: Scenario[];
  currentTrueCash: number;
  currentRunway: number;
  monthlyBurn: number;
  onSelectScenario?: (id: string) => void;
}

const scenarioIcons = {
  hire: Users,
  client_loss: TrendingDown,
  price_change: Percent,
  custom: DollarSign
};

const verdictConfig = {
  recommended: {
    icon: CheckCircle,
    label: 'RECOMMENDED',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200'
  },
  viable: {
    icon: CheckCircle,
    label: 'VIABLE',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200'
  },
  caution: {
    icon: Clock,
    label: 'CAUTION',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200'
  },
  high_risk: {
    icon: AlertTriangle,
    label: 'HIGH RISK',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-200'
  }
};

export function ScenarioExplorer({
  scenarios,
  currentTrueCash,
  currentRunway,
  monthlyBurn,
  onSelectScenario
}: ScenarioExplorerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  if (scenarios.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Scenarios & Decisions
        </h3>
        <p className="text-sm text-gray-500">
          No scenarios configured yet. Ask your advisor about "what if" modelling.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Scenarios & Decisions
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Explore impacts before you decide
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Runway</p>
          <p className="text-xl font-bold text-gray-900">
            {currentRunway.toFixed(1)} months
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {scenarios.map(scenario => {
          const IconComponent = scenarioIcons[scenario.type] || DollarSign;
          const verdict = verdictConfig[scenario.verdict] || verdictConfig.caution;
          const VerdictIcon = verdict.icon;
          const isExpanded = expandedId === scenario.id;
          
          return (
            <div
              key={scenario.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isExpanded ? verdict.borderClass : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${verdict.bgClass}`}>
                  <IconComponent className={`w-5 h-5 ${verdict.textClass}`} />
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-900 truncate">{scenario.name}</p>
                  <p className="text-sm text-gray-500 truncate">{scenario.description}</p>
                </div>
                
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${verdict.bgClass} ${verdict.textClass}`}>
                  <VerdictIcon className="w-3.5 h-3.5" />
                  {verdict.label}
                </div>
                
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                  isExpanded ? 'rotate-90' : ''
                }`} />
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                  {/* Mobile verdict badge */}
                  <div className={`sm:hidden mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${verdict.bgClass} ${verdict.textClass}`}>
                    <VerdictIcon className="w-3.5 h-3.5" />
                    {verdict.label}
                  </div>
                  
                  {/* Impact Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Cash Impact</p>
                      <p className={`text-lg font-bold ${
                        scenario.cashImpact >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {scenario.cashImpact >= 0 ? '+' : ''}
                        £{Math.abs(scenario.cashImpact).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Runway Impact</p>
                      <p className={`text-lg font-bold ${
                        scenario.runwayImpact >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {scenario.runwayImpact >= 0 ? '+' : ''}
                        {scenario.runwayImpact.toFixed(1)} mo
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">New Runway</p>
                      <p className={`text-lg font-bold ${
                        scenario.newRunway < 2 ? 'text-red-600' : 
                        scenario.newRunway < 3 ? 'text-amber-600' : 'text-gray-900'
                      }`}>
                        {scenario.newRunway.toFixed(1)} mo
                      </p>
                    </div>
                  </div>
                  
                  {/* Recommendation */}
                  <div className={`p-3 rounded-lg ${verdict.bgClass} mb-4`}>
                    <p className={`text-sm ${verdict.textClass}`}>
                      <strong>Recommendation:</strong> {scenario.recommendation}
                    </p>
                  </div>
                  
                  {/* Conditions if applicable */}
                  {scenario.conditions && scenario.conditions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Wait until:
                      </p>
                      <ul className="space-y-1">
                        {scenario.conditions.map((condition, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Action button */}
                  {onSelectScenario && (
                    <button
                      onClick={() => onSelectScenario(scenario.id)}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      See this in forecast →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScenarioExplorer;

