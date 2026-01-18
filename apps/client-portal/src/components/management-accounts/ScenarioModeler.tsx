import { useState, useMemo } from 'react';
import { Check, AlertTriangle, Users, TrendingUp, PoundSterling, MinusCircle, Calculator, ChevronDown, ChevronUp } from 'lucide-react';

type ScenarioType = 'hire' | 'price' | 'client_loss' | 'investment';

interface ScenarioModelerProps {
  type: ScenarioType;
  tuesdayQuestion?: string;
  // Optional custom defaults
  defaultSalary?: number;
  defaultUtilisation?: number;
  dayRate?: number;
  currentRevenue?: number;
  clientRevenue?: number;
  // Pre-calculated results from AI
  aiAnalysis?: {
    verdict: 'yes' | 'no' | 'conditional';
    summary: string;
    breakeven?: string;
    risks?: string[];
    recommendation?: string;
  };
}

export function ScenarioModeler({ 
  type, 
  tuesdayQuestion,
  defaultSalary = 55000,
  defaultUtilisation = 75,
  dayRate = 650,
  currentRevenue = 500000,
  clientRevenue: initialClientRevenue = 200000,
  aiAnalysis
}: ScenarioModelerProps) {
  const [expanded, setExpanded] = useState(true);
  const [salary, setSalary] = useState(defaultSalary);
  const [utilisation, setUtilisation] = useState(defaultUtilisation);
  const [priceIncrease, setPriceIncrease] = useState(10);
  const [clientRevenue, setClientRevenue] = useState(initialClientRevenue);

  const scenarioConfig = {
    hire: { icon: Users, title: 'What If: You Hired Sarah?', color: 'blue' },
    price: { icon: TrendingUp, title: 'What If: You Raised Prices?', color: 'emerald' },
    client_loss: { icon: MinusCircle, title: 'What If: You Lost Your Biggest Client?', color: 'amber' },
    investment: { icon: PoundSterling, title: 'What If: You Made This Investment?', color: 'purple' }
  };
  
  const config = scenarioConfig[type];
  const Icon = config.icon;

  // HIRE SCENARIO CALCULATIONS
  const hireCalcs = useMemo(() => {
    const workingDays = 220;
    const billableDays = Math.round(workingDays * (utilisation / 100));
    const yearlyRevenue = billableDays * dayRate;
    const yearlyCost = salary * 1.15; // with oncosts
    const yearlyProfit = yearlyRevenue - yearlyCost;
    const monthlyProfit = yearlyProfit / 12;
    const breakevenMonths = monthlyProfit > 0 ? Math.ceil(yearlyCost / yearlyProfit * 12) : null;
    const isViable = yearlyProfit > 0;
    const minimumUtilisation = Math.ceil((yearlyCost / (dayRate * workingDays)) * 100);
    
    return { 
      workingDays, 
      billableDays, 
      yearlyRevenue, 
      yearlyCost, 
      yearlyProfit, 
      breakevenMonths, 
      isViable,
      minimumUtilisation
    };
  }, [salary, utilisation, dayRate]);

  // PRICE SCENARIO CALCULATIONS
  const priceCalcs = useMemo(() => {
    const newRevenue = currentRevenue * (1 + priceIncrease / 100);
    // Estimated churn based on price increase
    const churnRate = priceIncrease > 15 ? 15 : priceIncrease > 10 ? 10 : priceIncrease > 5 ? 5 : 2;
    const adjustedRevenue = newRevenue * (1 - churnRate / 100);
    const netChange = adjustedRevenue - currentRevenue;
    const isPositive = netChange > 0;
    
    return { newRevenue, churnRate, adjustedRevenue, netChange, isPositive };
  }, [priceIncrease, currentRevenue]);

  // CLIENT LOSS CALCULATIONS
  const lossCalcs = useMemo(() => {
    const percentOfRevenue = (clientRevenue / currentRevenue) * 100;
    const variableCostRatio = 0.3;
    const lostProfit = clientRevenue * (1 - variableCostRatio);
    const monthsToRecover = Math.ceil(lostProfit / (currentRevenue * 0.1 / 12));
    const isHighRisk = percentOfRevenue > 15;
    
    return { percentOfRevenue, lostProfit, monthsToRecover, isHighRisk };
  }, [clientRevenue, currentRevenue]);

  const formatCurrency = (amount: number) => `£${Math.round(amount).toLocaleString()}`;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r ${
          config.color === 'blue' ? 'from-blue-600 to-indigo-600' :
          config.color === 'emerald' ? 'from-emerald-600 to-teal-600' :
          config.color === 'amber' ? 'from-amber-500 to-orange-500' :
          'from-purple-600 to-indigo-600'
        } text-white`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div className="text-left">
            <h3 className="font-semibold">{config.title}</h3>
            {tuesdayQuestion && (
              <p className="text-sm opacity-90 mt-0.5">Your question: "{tuesdayQuestion}"</p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      
      {expanded && (
        <div className="p-6">
          {/* AI Analysis Summary (if provided) */}
          {aiAnalysis && (
            <div className={`mb-6 p-4 rounded-xl border ${
              aiAnalysis.verdict === 'yes' ? 'bg-green-50 border-green-200' :
              aiAnalysis.verdict === 'no' ? 'bg-red-50 border-red-200' :
              'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {aiAnalysis.verdict === 'yes' ? (
                  <Check className="h-6 w-6 text-green-600 mt-0.5" />
                ) : aiAnalysis.verdict === 'no' ? (
                  <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                ) : (
                  <Calculator className="h-6 w-6 text-amber-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${
                    aiAnalysis.verdict === 'yes' ? 'text-green-800' :
                    aiAnalysis.verdict === 'no' ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    {aiAnalysis.summary}
                  </p>
                  {aiAnalysis.recommendation && (
                    <p className="text-sm mt-2 text-slate-700">{aiAnalysis.recommendation}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* HIRE SCENARIO */}
          {type === 'hire' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Annual Salary
                  </label>
                  <div className="space-y-2">
                    <input 
                      type="range"
                      value={salary}
                      min={35000}
                      max={80000}
                      step={2500}
                      onChange={(e) => setSalary(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">£35k</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(salary)}</span>
                      <span className="text-xs text-slate-500">£80k</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Target Utilisation
                    <span className="font-normal text-slate-500 ml-2">
                      (min needed: {hireCalcs.minimumUtilisation}%)
                    </span>
                  </label>
                  <div className="space-y-2">
                    <input 
                      type="range"
                      value={utilisation}
                      min={50}
                      max={90}
                      step={5}
                      onChange={(e) => setUtilisation(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">50%</span>
                      <span className="text-lg font-bold text-blue-600">{utilisation}%</span>
                      <span className="text-xs text-slate-500">90%</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
                  <p>Day rate: {formatCurrency(dayRate)} • {hireCalcs.workingDays} working days/year</p>
                  <p>Billable days at {utilisation}%: {hireCalcs.billableDays} days</p>
                </div>
              </div>
              
              {/* Results */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Year 1 Impact
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Revenue potential</span>
                    <span className="text-emerald-600 font-semibold text-lg">
                      +{formatCurrency(hireCalcs.yearlyRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Cost (salary + oncosts)</span>
                    <span className="text-red-600 font-semibold text-lg">
                      -{formatCurrency(hireCalcs.yearlyCost)}
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-3 flex justify-between items-center">
                    <span className="text-slate-800 font-semibold">Net contribution</span>
                    <span className={`font-bold text-xl ${
                      hireCalcs.yearlyProfit > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {hireCalcs.yearlyProfit > 0 ? '+' : ''}{formatCurrency(hireCalcs.yearlyProfit)}
                    </span>
                  </div>
                </div>
                
                {/* Verdict */}
                <div className={`mt-5 p-4 rounded-lg flex items-center gap-3 ${
                  hireCalcs.isViable 
                    ? 'bg-emerald-100 border border-emerald-200' 
                    : 'bg-red-100 border border-red-200'
                }`}>
                  {hireCalcs.isViable ? (
                    <>
                      <Check className="h-6 w-6 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-800">
                          YES — if they achieve {utilisation}%+ utilisation
                        </p>
                        {hireCalcs.breakevenMonths && (
                          <p className="text-sm text-emerald-700">
                            Breakeven: Month {hireCalcs.breakevenMonths}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-800">
                          NOT VIABLE at this utilisation
                        </p>
                        <p className="text-sm text-red-700">
                          Need {hireCalcs.minimumUtilisation}%+ utilisation to break even
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* PRICE INCREASE SCENARIO */}
          {type === 'price' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Price Increase
                  </label>
                  <div className="space-y-2">
                    <input 
                      type="range"
                      value={priceIncrease}
                      min={5}
                      max={25}
                      step={5}
                      onChange={(e) => setPriceIncrease(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">5%</span>
                      <span className="text-lg font-bold text-emerald-600">{priceIncrease}%</span>
                      <span className="text-xs text-slate-500">25%</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="font-medium text-amber-800">Estimated client churn at this level:</p>
                  <p className="text-amber-700">{priceCalcs.churnRate}% of clients may leave</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5">
                <h4 className="font-semibold text-slate-800 mb-4">Revenue Impact</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current revenue</span>
                    <span className="text-slate-800">{formatCurrency(currentRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">After price increase</span>
                    <span className="text-emerald-600">{formatCurrency(priceCalcs.newRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Less churn ({priceCalcs.churnRate}%)</span>
                    <span className="text-red-600">
                      -{formatCurrency(priceCalcs.newRevenue - priceCalcs.adjustedRevenue)}
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-3 flex justify-between">
                    <span className="font-semibold text-slate-800">Net change</span>
                    <span className={`font-bold text-xl ${
                      priceCalcs.isPositive ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {priceCalcs.netChange > 0 ? '+' : ''}{formatCurrency(priceCalcs.netChange)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* CLIENT LOSS SCENARIO */}
          {type === 'client_loss' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Client Revenue
                  </label>
                  <div className="space-y-2">
                    <input 
                      type="range"
                      value={clientRevenue}
                      min={50000}
                      max={500000}
                      step={25000}
                      onChange={(e) => setClientRevenue(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">£50k</span>
                      <span className="text-lg font-bold text-amber-600">{formatCurrency(clientRevenue)}</span>
                      <span className="text-xs text-slate-500">£500k</span>
                    </div>
                  </div>
                </div>
                <div className={`text-sm rounded-lg p-3 border ${
                  lossCalcs.isHighRisk 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <p className="font-medium">
                    This represents {lossCalcs.percentOfRevenue.toFixed(1)}% of total revenue
                  </p>
                  {lossCalcs.isHighRisk && (
                    <p className="mt-1">⚠️ High concentration risk</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5">
                <h4 className="font-semibold text-slate-800 mb-4">Impact Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Lost revenue</span>
                    <span className="text-red-600">-{formatCurrency(clientRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Lost profit contribution</span>
                    <span className="text-red-600">-{formatCurrency(lossCalcs.lostProfit)}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-3 flex justify-between">
                    <span className="font-semibold text-slate-800">Recovery time</span>
                    <span className="font-bold text-xl text-amber-600">
                      {lossCalcs.monthsToRecover} months
                    </span>
                  </div>
                </div>
                
                {lossCalcs.isHighRisk && (
                  <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Concentration risk: This client is {lossCalcs.percentOfRevenue.toFixed(0)}% of revenue
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Help text */}
          <p className="text-sm text-slate-500 text-center mt-6 italic">
            Adjust the sliders to explore different scenarios and see the numbers change in real-time
          </p>
        </div>
      )}
    </div>
  );
}

export default ScenarioModeler;

