import { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  DoorOpen,
  Check,
  X,
  ChevronRight,
  Clock
} from 'lucide-react';

interface ScenarioOutcome {
  metric: string;
  current: string;
  projected: string;
  change: string;
  isPositive: boolean;
}

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  timeframe: string;
  outcomes: ScenarioOutcome[];
  requirements: string[];
  risks: string[];
}

interface ScenarioPlanningProps {
  scenarios?: Scenario[];
  // Fallback data from pass1_data to generate scenarios dynamically
  revenue?: number;
  currentValue?: number;
  baselineValue?: number;
  concentration?: number;
  surplusCash?: number;
  exitReadinessScore?: number;
  forceExpanded?: boolean; // For PDF export - shows all scenarios
}

// Generate default scenarios if none provided
function generateDefaultScenarios(props: ScenarioPlanningProps): Scenario[] {
  const revenue = props.revenue || 63000000;
  const currentValue = props.currentValue || 14000000;
  const baselineValue = props.baselineValue || 28600000;
  const concentration = props.concentration || 99;
  const surplusCash = props.surplusCash || 7700000;
  const exitReadiness = props.exitReadinessScore || 28;
  
  return [
    // SCENARIO 1: DO NOTHING
    {
      id: 'do_nothing',
      title: 'If You Do Nothing',
      subtitle: 'Continue current operations without structural changes',
      timeframe: '24 months',
      outcomes: [
        {
          metric: 'Client Concentration',
          current: `${concentration}%`,
          projected: `${concentration}%`,
          change: 'Unchanged - risk remains',
          isPositive: false,
        },
        {
          metric: 'Business Value',
          current: `£${(currentValue / 1000000).toFixed(1)}M`,
          projected: `£${(currentValue / 1000000).toFixed(1)}M`,
          change: 'No improvement - discount persists',
          isPositive: false,
        },
        {
          metric: 'Owner Freedom',
          current: 'Trapped',
          projected: 'Still trapped',
          change: 'Cannot step back without successor',
          isPositive: false,
        },
        {
          metric: 'Risk Exposure',
          current: 'Critical',
          projected: 'Critical',
          change: 'One client loss = existential',
          isPositive: false,
        },
      ],
      requirements: [],
      risks: [
        'Loss of any major client is existential crisis',
        'Owner health issue = business crisis',
        'Market downturn hits concentrated revenue hard',
        'Business remains unsellable at fair value',
      ],
    },
    
    // SCENARIO 2: ACTIVELY DIVERSIFY
    {
      id: 'diversify',
      title: 'If You Actively Diversify',
      subtitle: 'Use surplus cash to build broader client base',
      timeframe: '24-36 months',
      outcomes: [
        {
          metric: 'Client Concentration',
          current: `${concentration}%`,
          projected: '60-70%',
          change: 'Reduced by 30+ points',
          isPositive: true,
        },
        {
          metric: 'Revenue',
          current: `£${(revenue / 1000000).toFixed(1)}M`,
          projected: `£${((revenue * 1.15) / 1000000).toFixed(1)}M`,
          change: '+15% from new clients',
          isPositive: true,
        },
        {
          metric: 'Business Value',
          current: `£${(currentValue / 1000000).toFixed(1)}M`,
          projected: `£${((baselineValue * 0.8) / 1000000).toFixed(1)}M`,
          change: `+£${(((baselineValue * 0.8) - currentValue) / 1000000).toFixed(1)}M unlocked`,
          isPositive: true,
        },
        {
          metric: 'Risk Profile',
          current: 'Existential',
          projected: 'Manageable',
          change: "Losing one client hurts but doesn't kill",
          isPositive: true,
        },
      ],
      requirements: [
        `Deploy £2-3M of the £${(surplusCash / 1000000).toFixed(1)}M surplus into BD or acquisition`,
        'Hire dedicated business development resource',
        'Target adjacent sectors (new frameworks, new industries)',
        'Accept lower margins on new clients initially',
      ],
      risks: [
        'New client acquisition takes 12-18 months to show results',
        'Requires management attention alongside existing delivery',
        'New clients may have different margin profiles',
      ],
    },
    
    // SCENARIO 3: PREPARE FOR EXIT
    {
      id: 'exit_prep',
      title: 'If You Prepare for Exit',
      subtitle: 'Make the business sellable within 3 years',
      timeframe: '24-36 months',
      outcomes: [
        {
          metric: 'Documentation',
          current: 'In heads',
          projected: 'Fully documented',
          change: 'IP becomes transferable asset',
          isPositive: true,
        },
        {
          metric: 'Owner Dependency',
          current: '70-80%',
          projected: '<40%',
          change: 'Successor in place and trained',
          isPositive: true,
        },
        {
          metric: 'Exit Readiness',
          current: `${exitReadiness}/100`,
          projected: '70+/100',
          change: 'Attractive to trade buyers or PE',
          isPositive: true,
        },
        {
          metric: 'Business Value',
          current: `£${(currentValue / 1000000).toFixed(1)}M`,
          projected: `£${((baselineValue * 0.75) / 1000000).toFixed(1)}M`,
          change: `+£${(((baselineValue * 0.75) - currentValue) / 1000000).toFixed(1)}M exit premium`,
          isPositive: true,
        },
      ],
      requirements: [
        'Document core methodology and IP',
        'Hire and develop MD/COO successor (2-3 year runway)',
        'Build client relationships beyond founder',
        'Formalise contract terms with all majors',
      ],
      risks: [
        'Concentration still impacts valuation even with other fixes',
        'Successor recruitment in specialist sectors is challenging',
        'Requires 2-3 years minimum commitment',
      ],
    },
  ];
}

const SCENARIO_ICONS: Record<string, typeof AlertTriangle> = {
  do_nothing: AlertTriangle,
  diversify: TrendingUp,
  exit_prep: DoorOpen,
};

const SCENARIO_COLORS: Record<string, string> = {
  do_nothing: 'red',
  diversify: 'emerald',
  exit_prep: 'blue',
};

// Render a single scenario content block (reusable for tabs and expanded mode)
function ScenarioContent({ scenario }: { scenario: Scenario }) {
  const Icon = SCENARIO_ICONS[scenario.id] || TrendingUp;
  const color = SCENARIO_COLORS[scenario.id] || 'blue';
  
  return (
    <div className="p-6">
      {/* Scenario Header */}
      <div className={`rounded-lg p-4 mb-6 ${
        color === 'red' ? 'bg-red-50 border border-red-200' : 
        color === 'emerald' ? 'bg-emerald-50 border border-emerald-200' : 
        'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 mt-0.5 ${
            color === 'red' ? 'text-red-500' : 
            color === 'emerald' ? 'text-emerald-500' : 
            'text-blue-500'
          }`} />
          <div>
            <p className={`font-semibold text-lg ${
              color === 'red' ? 'text-red-800' : 
              color === 'emerald' ? 'text-emerald-800' : 
              'text-blue-800'
            }`}>
              {scenario.title}
            </p>
            <p className={`font-medium ${
              color === 'red' ? 'text-red-700' : 
              color === 'emerald' ? 'text-emerald-700' : 
              'text-blue-700'
            }`}>
              {scenario.subtitle}
            </p>
            <p className={`text-sm mt-1 ${
              color === 'red' ? 'text-red-600' : 
              color === 'emerald' ? 'text-emerald-600' : 
              'text-blue-600'
            }`}>
              Timeframe: {scenario.timeframe}
            </p>
          </div>
        </div>
      </div>
      
      {/* Outcomes Table */}
      <div className="border rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Metric</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Today</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                <ChevronRight className="w-4 h-4 inline mr-1" />
                Projected
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {scenario.outcomes.map((outcome, i) => (
              <tr key={i} className={outcome.isPositive ? '' : 'bg-red-50/30'}>
                <td className="px-4 py-3 font-medium text-gray-900">{outcome.metric}</td>
                <td className="px-4 py-3 text-gray-600">{outcome.current}</td>
                <td className="px-4 py-3 text-gray-900">{outcome.projected}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm flex items-center gap-1 ${
                    outcome.isPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {outcome.isPositive ? (
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    {outcome.change}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Requirements (if any) */}
        {scenario.requirements.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              What This Requires
            </h3>
            <ul className="space-y-2">
              {scenario.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Risks */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            {scenario.id === 'do_nothing' ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-500" />
                What You Risk
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Considerations
              </>
            )}
          </h3>
          <ul className="space-y-2">
            {scenario.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                <span className={`mt-0.5 flex-shrink-0 ${
                  scenario.id === 'do_nothing' ? 'text-red-500' : 'text-amber-500'
                }`}>
                  {scenario.id === 'do_nothing' ? '⚠' : '•'}
                </span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ScenarioPlanningSection(props: ScenarioPlanningProps) {
  const { forceExpanded = false } = props;
  const scenarios = props.scenarios && props.scenarios.length > 0 
    ? props.scenarios 
    : generateDefaultScenarios(props);
  
  const [activeId, setActiveId] = useState(scenarios[1]?.id || 'diversify');
  
  if (!scenarios?.length) return null;
  
  const active = scenarios.find(s => s.id === activeId) || scenarios[0];
  const Icon = SCENARIO_ICONS[active.id] || TrendingUp;
  const color = SCENARIO_COLORS[active.id] || 'blue';
  
  // If forceExpanded (PDF mode), render all scenarios
  if (forceExpanded) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-300" />
            Scenario Planning
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            What happens depending on the path you choose
          </p>
        </div>
        
        {/* All Scenarios (for PDF) */}
        <div className="divide-y">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="avoid-break">
              <ScenarioContent scenario={scenario} />
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-300" />
          Scenario Planning
        </h2>
        <p className="text-slate-300 text-sm mt-1">
          What happens depending on the path you choose
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b bg-slate-50">
        {scenarios.map(scenario => {
          const TabIcon = SCENARIO_ICONS[scenario.id] || TrendingUp;
          const tabColor = SCENARIO_COLORS[scenario.id] || 'blue';
          const isActive = activeId === scenario.id;
          
          return (
            <button
              key={scenario.id}
              onClick={() => setActiveId(scenario.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? `bg-white border-b-2 ${tabColor === 'red' ? 'border-red-500 text-red-700' : tabColor === 'emerald' ? 'border-emerald-500 text-emerald-700' : 'border-blue-500 text-blue-700'}`
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${
                isActive 
                  ? tabColor === 'red' ? 'text-red-500' : tabColor === 'emerald' ? 'text-emerald-500' : 'text-blue-500'
                  : ''
              }`} />
              <span className="hidden sm:inline">{scenario.title}</span>
              <span className="sm:hidden">{scenario.title.split(' ').slice(1, 3).join(' ')}</span>
            </button>
          );
        })}
      </div>
      
      {/* Active Scenario Content */}
      <div className="p-6">
        {/* Scenario Header */}
        <div className={`rounded-lg p-4 mb-6 ${
          color === 'red' ? 'bg-red-50 border border-red-200' : 
          color === 'emerald' ? 'bg-emerald-50 border border-emerald-200' : 
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <Icon className={`w-6 h-6 mt-0.5 ${
              color === 'red' ? 'text-red-500' : 
              color === 'emerald' ? 'text-emerald-500' : 
              'text-blue-500'
            }`} />
            <div>
              <p className={`font-medium ${
                color === 'red' ? 'text-red-800' : 
                color === 'emerald' ? 'text-emerald-800' : 
                'text-blue-800'
              }`}>
                {active.subtitle}
              </p>
              <p className={`text-sm mt-1 ${
                color === 'red' ? 'text-red-600' : 
                color === 'emerald' ? 'text-emerald-600' : 
                'text-blue-600'
              }`}>
                Timeframe: {active.timeframe}
              </p>
            </div>
          </div>
        </div>
        
        {/* Outcomes Table */}
        <div className="border rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Metric</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Today</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">
                  <ChevronRight className="w-4 h-4 inline mr-1" />
                  Projected
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {active.outcomes.map((outcome, i) => (
                <tr key={i} className={outcome.isPositive ? '' : 'bg-red-50/30'}>
                  <td className="px-4 py-3 font-medium text-gray-900">{outcome.metric}</td>
                  <td className="px-4 py-3 text-gray-600">{outcome.current}</td>
                  <td className="px-4 py-3 text-gray-900 hidden sm:table-cell">{outcome.projected}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm flex items-center gap-1 ${
                      outcome.isPositive ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {outcome.isPositive ? (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      {outcome.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Requirements (if any) */}
          {active.requirements.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                What This Requires
              </h3>
              <ul className="space-y-2">
                {active.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Risks */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              {active.id === 'do_nothing' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  What You Risk
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Considerations
                </>
              )}
            </h3>
            <ul className="space-y-2">
              {active.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className={`mt-0.5 flex-shrink-0 ${
                    active.id === 'do_nothing' ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {active.id === 'do_nothing' ? '⚠' : '•'}
                  </span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

