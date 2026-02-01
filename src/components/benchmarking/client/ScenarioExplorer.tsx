import { useState, useMemo } from 'react';
import { 
  Sliders, 
  TrendingUp, 
  ArrowRight, 
  Info, 
  DollarSign, 
  Users,
  Target,
  Sparkles
} from 'lucide-react';
import { 
  calculateMarginScenario, 
  calculatePricingScenario,
  calculateCashScenario,
  calculateEfficiencyScenario,
  calculateDiversificationScenario,
  formatCurrency,
  formatValue,
  type BaselineMetrics,
  type ScenarioResult,
  type ScenarioType,
} from '../../../lib/scenario-calculator';

interface IndustryBenchmarks {
  grossMargin?: { p25: number; p50: number; p75: number };
  revenuePerEmployee?: { p25: number; p50: number; p75: number };
  debtorDays?: { p25: number; p50: number; p75: number };
  clientConcentration?: { p25: number; p50: number; p75: number };
}

interface ScenarioExplorerProps {
  baseline: BaselineMetrics;
  industryBenchmarks?: IndustryBenchmarks;
}

interface ScenarioConfig {
  label: string;
  icon: typeof TrendingUp;
  question: string;
  color: string;
  description: string;
}

const SCENARIO_CONFIGS: Record<ScenarioType, ScenarioConfig> = {
  margin: {
    label: 'Margin',
    icon: TrendingUp,
    question: 'What if you improved gross margin?',
    color: 'emerald',
    description: 'See the impact of margin improvements',
  },
  pricing: {
    label: 'Pricing',
    icon: DollarSign,
    question: 'What if you increased rates?',
    color: 'amber',
    description: 'Rate increases flow straight to profit',
  },
  cash: {
    label: 'Cash Flow',
    icon: ArrowRight,
    question: 'What if you reduced debtor days?',
    color: 'blue',
    description: 'Release working capital from debtors',
  },
  efficiency: {
    label: 'Efficiency',
    icon: Users,
    question: 'What if you improved productivity?',
    color: 'purple',
    description: 'More revenue per employee',
  },
  diversification: {
    label: 'Diversification',
    icon: Target,
    question: 'What if you reduced customer concentration?',
    color: 'rose',
    description: 'Reduce risk and increase value',
  },
  exit: {
    label: 'Exit Value',
    icon: Sparkles,
    question: 'What could your business be worth?',
    color: 'indigo',
    description: 'Estimate business valuation',
  },
};

// Only show relevant scenarios
const ACTIVE_SCENARIOS: ScenarioType[] = ['margin', 'pricing', 'cash', 'efficiency', 'diversification'];

export function ScenarioExplorer({ baseline, industryBenchmarks }: ScenarioExplorerProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('margin');
  
  // Scenario-specific state with sensible defaults
  const [targetGrossMargin, setTargetGrossMargin] = useState(() => {
    const current = baseline.grossMargin || 20;
    const median = industryBenchmarks?.grossMargin?.p50 || current + 5;
    return Math.min(current + 5, median);
  });
  
  const [rateIncrease, setRateIncrease] = useState(5);
  const [volumeRetention, setVolumeRetention] = useState(95);
  
  const [targetDebtorDays, setTargetDebtorDays] = useState(() => {
    const current = baseline.debtorDays || 45;
    return Math.max(14, current - 15);
  });
  
  const [targetRPE, setTargetRPE] = useState(() => {
    const current = baseline.revenuePerEmployee || 100000;
    return Math.round(current * 1.15);
  });
  
  const [targetConcentration, setTargetConcentration] = useState(() => {
    const current = baseline.clientConcentration || 50;
    return Math.max(30, current - 20);
  });
  
  // Calculate result based on active scenario
  const result: ScenarioResult | null = useMemo(() => {
    if (!baseline.revenue || baseline.revenue <= 0) return null;
    
    try {
      switch (activeScenario) {
        case 'margin':
          return calculateMarginScenario(baseline, targetGrossMargin);
        case 'pricing':
          return calculatePricingScenario(baseline, rateIncrease, volumeRetention);
        case 'cash':
          return calculateCashScenario(baseline, targetDebtorDays);
        case 'efficiency':
          return calculateEfficiencyScenario(baseline, targetRPE);
        case 'diversification':
          return calculateDiversificationScenario(baseline, targetConcentration);
        default:
          return null;
      }
    } catch (e) {
      console.error('[ScenarioExplorer] Calculation error:', e);
      return null;
    }
  }, [
    activeScenario, 
    baseline, 
    targetGrossMargin, 
    rateIncrease, 
    volumeRetention, 
    targetDebtorDays, 
    targetRPE,
    targetConcentration
  ]);
  
  const config = SCENARIO_CONFIGS[activeScenario];
  const Icon = config.icon;
  
  // Check if we have enough data to show this section
  if (!baseline.revenue || baseline.revenue <= 0) {
    return null;
  }
  
  return (
    <section className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Sliders className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Explore Improvement Scenarios</h2>
            <p className="text-sm text-slate-600">
              Use your actual data to see the impact of potential improvements
            </p>
          </div>
        </div>
      </div>
      
      {/* Scenario Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {ACTIVE_SCENARIOS.map((key) => {
            const scenarioConfig = SCENARIO_CONFIGS[key];
            const ScenarioIcon = scenarioConfig.icon;
            const isActive = activeScenario === key;
            
            return (
              <button
                key={key}
                onClick={() => setActiveScenario(key)}
                className={`
                  px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap
                  ${isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <ScenarioIcon className="w-4 h-4 inline mr-2" />
                {scenarioConfig.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`p-4 bg-gradient-to-r from-${config.color}-50 to-${config.color}-100/50 border-b border-${config.color}-200`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 text-${config.color}-600`} />
                <h3 className="font-semibold text-slate-900">
                  {config.question}
                </h3>
              </div>
              <p className="text-sm text-slate-600 mt-1">{config.description}</p>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Margin Scenario Inputs */}
              {activeScenario === 'margin' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Target Gross Margin
                      </label>
                      <span className="text-lg font-bold text-emerald-600">
                        {targetGrossMargin.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={baseline.grossMargin}
                      max={Math.min(baseline.grossMargin + 25, 70)}
                      step={0.5}
                      value={targetGrossMargin}
                      onChange={(e) => setTargetGrossMargin(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>Current: {baseline.grossMargin.toFixed(1)}%</span>
                      {industryBenchmarks?.grossMargin && (
                        <span className="text-emerald-600">
                          Industry median: {industryBenchmarks.grossMargin.p50}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Pricing Scenario Inputs */}
              {activeScenario === 'pricing' && (
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Rate Increase
                      </label>
                      <span className="text-lg font-bold text-amber-600">
                        +{rateIncrease}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={25}
                      step={1}
                      value={rateIncrease}
                      onChange={(e) => setRateIncrease(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-amber-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Expected Client Retention
                      </label>
                      <span className="text-lg font-bold text-amber-600">
                        {volumeRetention}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={70}
                      max={100}
                      step={1}
                      value={volumeRetention}
                      onChange={(e) => setVolumeRetention(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-amber-600"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Most clients won't leave over a 5-10% rate increase
                    </p>
                  </div>
                </div>
              )}
              
              {/* Cash Scenario Inputs */}
              {activeScenario === 'cash' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Target Debtor Days
                      </label>
                      <span className="text-lg font-bold text-blue-600">
                        {targetDebtorDays} days
                      </span>
                    </div>
                    <input
                      type="range"
                      min={7}
                      max={baseline.debtorDays || 60}
                      step={1}
                      value={targetDebtorDays}
                      onChange={(e) => setTargetDebtorDays(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>Current: {baseline.debtorDays} days</span>
                      <span className="text-blue-600">Best practice: 30 days</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Efficiency Scenario Inputs */}
              {activeScenario === 'efficiency' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Target Revenue per Employee
                      </label>
                      <span className="text-lg font-bold text-purple-600">
                        £{formatCurrency(targetRPE)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={baseline.revenuePerEmployee}
                      max={baseline.revenuePerEmployee * 1.5}
                      step={5000}
                      value={targetRPE}
                      onChange={(e) => setTargetRPE(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>Current: £{formatCurrency(baseline.revenuePerEmployee)}</span>
                      {industryBenchmarks?.revenuePerEmployee && (
                        <span className="text-purple-600">
                          Industry P75: £{formatCurrency(industryBenchmarks.revenuePerEmployee.p75)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Diversification Scenario Inputs */}
              {activeScenario === 'diversification' && baseline.clientConcentration && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Target Top 3 Concentration
                      </label>
                      <span className="text-lg font-bold text-rose-600">
                        {targetConcentration}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={baseline.clientConcentration || 80}
                      step={5}
                      value={targetConcentration}
                      onChange={(e) => setTargetConcentration(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>Current: {baseline.clientConcentration}%</span>
                      <span className="text-rose-600">Healthy: &lt;40%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Baseline Reference */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Calculations based on your actual financial data
                </p>
              </div>
            </div>
          </div>
          
          {/* Results Panel */}
          {result && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200">
                <h3 className="font-semibold text-emerald-900">Projected Impact</h3>
              </div>
              
              <div className="p-5 space-y-5">
                {/* Primary Metric - Hero */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg shadow-emerald-500/20">
                  <div className="text-emerald-100 text-sm mb-1">
                    {result.primaryMetric.label}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {result.primaryMetric.format === 'currency' && '£'}
                      {formatCurrency(Math.abs(result.primaryMetric.delta))}
                      {result.primaryMetric.format === 'percent' && '%'}
                    </span>
                    <span className="text-emerald-200 text-sm">
                      {result.primaryMetric.delta >= 0 ? 'additional' : 'impact'} annually
                    </span>
                  </div>
                </div>
                
                {/* Secondary Metrics */}
                <div className="space-y-3">
                  {result.secondaryMetrics.map((metric, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          {metric.label}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {metric.description}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatValue(metric.impact, metric.format)}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {result.summary}
                  </p>
                </div>
                
                {/* How to Achieve */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    How to achieve this
                  </h4>
                  <ul className="space-y-2">
                    {result.howToAchieve.slice(0, 4).map((step, i) => (
                      <li 
                        key={i} 
                        className="text-sm text-slate-600 flex items-start gap-2"
                      >
                        <span className="text-blue-500 mt-0.5 font-bold">→</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Fallback if no result */}
          {!result && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center">
              <p className="text-slate-400 text-sm">
                Adjust the inputs to see projected impact
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ScenarioExplorer;

