import { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface ScenarioPreviewProps {
  type: 'hire' | 'price' | 'client_loss' | 'investment';
  // Optional custom values
  defaultSalary?: number;
  defaultUtilisation?: number;
  dayRate?: number;
}

export function ScenarioPreview({ 
  type, 
  defaultSalary = 55000,
  defaultUtilisation = 75,
  dayRate = 650
}: ScenarioPreviewProps) {
  const [salary, setSalary] = useState(defaultSalary);
  const [utilisation, setUtilisation] = useState(defaultUtilisation);
  const [priceIncrease, setPriceIncrease] = useState(10);
  const [clientRevenue, setClientRevenue] = useState(200000);

  if (type === 'hire') {
    // Basic hire calculation
    const workingDays = 220; // per year
    const billableDays = Math.round(workingDays * (utilisation / 100));
    const yearlyRevenue = billableDays * dayRate;
    const yearlyCost = salary * 1.15; // with oncosts
    const yearlyProfit = yearlyRevenue - yearlyCost;
    const monthlyProfit = yearlyProfit / 12;
    const breakeven = monthlyProfit > 0 ? Math.ceil(yearlyCost / yearlyProfit * 12) : null;
    const isViable = yearlyProfit > 0;

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-lg mb-4 text-gray-900">
          What If: You Hired Another Consultant?
        </h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Salary</label>
              <div className="flex items-center gap-4 mt-1">
                <input 
                  type="range"
                  value={salary}
                  min={35000}
                  max={80000}
                  step={5000}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="font-medium w-20 text-right text-gray-900">
                  £{salary.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">
                Target Utilisation
              </label>
              <div className="flex items-center gap-4 mt-1">
                <input 
                  type="range"
                  value={utilisation}
                  min={50}
                  max={90}
                  step={5}
                  onChange={(e) => setUtilisation(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="font-medium w-16 text-right text-gray-900">{utilisation}%</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-2">
              Day rate: £{dayRate} • Working days: {workingDays}/year
            </div>
          </div>
          
          {/* Outputs */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-3 text-gray-900">Year 1 Impact</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue potential:</span>
                <span className="text-green-600 font-medium">
                  +£{yearlyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cost (salary + oncosts):</span>
                <span className="text-red-600 font-medium">
                  -£{Math.round(yearlyCost).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-900 font-medium">Net contribution:</span>
                <span className={`font-bold ${yearlyProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {yearlyProfit > 0 ? '+' : ''}£{Math.round(yearlyProfit).toLocaleString()}
                </span>
              </div>
              {breakeven && breakeven <= 12 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Breakeven month:</span>
                  <span className="font-medium text-gray-900">Month {breakeven}</span>
                </div>
              )}
            </div>
            
            <div className={`mt-4 px-3 py-2 rounded-lg flex items-center gap-2 ${
              isViable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isViable ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    YES IF they achieve {utilisation}%+ utilisation
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Needs higher utilisation to be viable
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-4 text-center italic">
          Adjust the sliders to explore different scenarios...
        </p>
      </div>
    );
  }

  if (type === 'price') {
    const currentRevenue = 500000; // example
    const newRevenue = currentRevenue * (1 + priceIncrease / 100);
    const churnRate = priceIncrease > 15 ? 15 : priceIncrease > 10 ? 10 : 5; // estimated churn
    const adjustedRevenue = newRevenue * (1 - churnRate / 100);
    const netChange = adjustedRevenue - currentRevenue;

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-lg mb-4 text-gray-900">
          What If: You Raised Prices {priceIncrease}%?
        </h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Price Increase</label>
              <div className="flex items-center gap-4 mt-1">
                <input 
                  type="range"
                  value={priceIncrease}
                  min={5}
                  max={25}
                  step={5}
                  onChange={(e) => setPriceIncrease(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="font-medium w-16 text-right text-gray-900">{priceIncrease}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Estimated client churn at this level: {churnRate}%
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-3 text-gray-900">Revenue Impact</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current revenue:</span>
                <span className="text-gray-900">£{currentRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">After price increase:</span>
                <span className="text-green-600">£{Math.round(newRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Less churn ({churnRate}%):</span>
                <span className="text-red-600">-£{Math.round(newRevenue - adjustedRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-900 font-medium">Net change:</span>
                <span className={`font-bold ${netChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netChange > 0 ? '+' : ''}£{Math.round(netChange).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'client_loss') {
    const totalRevenue = 2000000; // example
    const percentOfRevenue = (clientRevenue / totalRevenue) * 100;
    const variableCostRatio = 0.3;
    const lostProfit = clientRevenue * (1 - variableCostRatio);
    const monthsToRecover = Math.ceil(lostProfit / (totalRevenue * 0.1 / 12)); // assume 10% margin

    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-lg mb-4 text-gray-900">
          What If: You Lost Your Biggest Client?
        </h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Client Revenue</label>
              <div className="flex items-center gap-4 mt-1">
                <input 
                  type="range"
                  value={clientRevenue}
                  min={50000}
                  max={500000}
                  step={25000}
                  onChange={(e) => setClientRevenue(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="font-medium w-24 text-right text-gray-900">
                  £{clientRevenue.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              This represents {percentOfRevenue.toFixed(1)}% of total revenue
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-3 text-gray-900">Impact Analysis</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Lost revenue:</span>
                <span className="text-red-600">-£{clientRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lost profit contribution:</span>
                <span className="text-red-600">-£{Math.round(lostProfit).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-600">Months to recover:</span>
                <span className="font-bold text-amber-600">{monthsToRecover} months</span>
              </div>
            </div>
            
            {percentOfRevenue > 15 && (
              <div className="mt-3 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                High concentration risk - client represents {percentOfRevenue.toFixed(0)}% of revenue
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default/investment scenario
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h4 className="font-semibold text-lg mb-4 text-gray-900">
        Scenario Modeling
      </h4>
      <p className="text-gray-600">
        Interactive scenario modeling would appear here, allowing you to explore 
        different business decisions and see their financial impact.
      </p>
    </div>
  );
}

export default ScenarioPreview;

