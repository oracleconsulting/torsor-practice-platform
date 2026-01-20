'use client';

import { useState } from 'react';
import { 
  User, 
  DollarSign, 
  UserMinus,
  Building,
  Calculator,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Play,
  Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MAScenario, TierType } from '../../types/ma';
import { TIER_FEATURES } from '../../types/ma';

interface ScenarioBuilderProps {
  engagementId: string;
  tier: TierType;
  baseData?: {
    monthlyBurnRate: number;
    currentCash: number;
    currentRevenue: number;
  };
  onSave?: (scenario: MAScenario) => void;
  existingScenario?: MAScenario;
}

type ScenarioType = 'hire' | 'pricing' | 'client_loss' | 'investment' | 'custom';

interface HireInputs {
  role: string;
  salary: number;
  startDate: string;
  rampMonths: number;
  expectedUtilisation: number;
  chargeRate: number;
}

interface PricingInputs {
  changeType: 'increase' | 'decrease';
  percentageChange: number;
  affectedRevenue: number;
  expectedChurnRate: number;
}

interface ClientLossInputs {
  clientName: string;
  annualRevenue: number;
  associatedCosts: number;
  noticeMonths: number;
}

interface InvestmentInputs {
  description: string;
  amount: number;
  paymentType: 'upfront' | 'monthly' | 'quarterly';
  monthlyPayment?: number;
  expectedReturn: number;
  returnTimeframe: number;
}

const SCENARIO_TYPES: { type: ScenarioType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'hire', label: 'New Hire', icon: <User className="h-5 w-5" />, description: 'Model hiring a new employee' },
  { type: 'pricing', label: 'Pricing Change', icon: <DollarSign className="h-5 w-5" />, description: 'Model a price increase/decrease' },
  { type: 'client_loss', label: 'Client Loss', icon: <UserMinus className="h-5 w-5" />, description: 'What if you lost a client?' },
  { type: 'investment', label: 'Investment', icon: <Building className="h-5 w-5" />, description: 'Model capital investment' },
];

const RECOMMENDATION_STYLES = {
  proceed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle },
  caution: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
  dont_proceed: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: XCircle },
  needs_more_info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: HelpCircle },
};

export function ScenarioBuilder({
  engagementId,
  tier,
  baseData,
  onSave,
  existingScenario
}: ScenarioBuilderProps) {
  const [scenarioType, setScenarioType] = useState<ScenarioType>(existingScenario?.scenario_type || 'hire');
  const [name, setName] = useState(existingScenario?.name || '');
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<MAScenario['outputs'] | null>(existingScenario?.outputs || null);
  const [recommendation, setRecommendation] = useState<MAScenario['recommendation'] | null>(
    existingScenario?.recommendation || null
  );
  const [summaryAnswer, setSummaryAnswer] = useState(existingScenario?.summary_answer || '');

  // Form states for each scenario type
  const [hireInputs, setHireInputs] = useState<HireInputs>({
    role: '',
    salary: 45000,
    startDate: '',
    rampMonths: 3,
    expectedUtilisation: 70,
    chargeRate: 100,
  });

  const [pricingInputs, setPricingInputs] = useState<PricingInputs>({
    changeType: 'increase',
    percentageChange: 10,
    affectedRevenue: baseData?.currentRevenue || 100000,
    expectedChurnRate: 5,
  });

  const [clientLossInputs, setClientLossInputs] = useState<ClientLossInputs>({
    clientName: '',
    annualRevenue: 50000,
    associatedCosts: 10000,
    noticeMonths: 1,
  });

  const [investmentInputs, setInvestmentInputs] = useState<InvestmentInputs>({
    description: '',
    amount: 25000,
    paymentType: 'upfront',
    expectedReturn: 50000,
    returnTimeframe: 12,
  });

  const tierConfig = TIER_FEATURES[tier];
  const maxScenarios = tierConfig.scenarioLimit;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(value);

  // Run scenario calculations
  const runScenario = async () => {
    setRunning(true);
    let outputs: MAScenario['outputs'] = {};
    let rec: MAScenario['recommendation'] = 'needs_more_info';
    let summary = '';

    try {
      if (scenarioType === 'hire') {
        // Calculate hire scenario
        const employerNI = hireInputs.salary * 0.138; // Approx employer NI
        const pension = hireInputs.salary * 0.03;
        const totalAnnualCost = hireInputs.salary + employerNI + pension;
        const monthlyCost = totalAnnualCost / 12;
        
        const workingDays = 220;
        const utilisedDays = workingDays * (hireInputs.expectedUtilisation / 100);
        const annualRevenue = utilisedDays * hireInputs.chargeRate * 8;
        const breakEvenMonth = Math.ceil(totalAnnualCost / (annualRevenue / 12 - monthlyCost));
        const firstYearContribution = annualRevenue - totalAnnualCost;
        
        // Monthly cash impact
        const cashImpact: number[] = [];
        let runningTotal = 0;
        for (let i = 0; i < 12; i++) {
          const rampFactor = i < hireInputs.rampMonths 
            ? (i + 1) / hireInputs.rampMonths 
            : 1;
          const monthlyRevenue = (annualRevenue / 12) * rampFactor;
          const netImpact = monthlyRevenue - monthlyCost;
          runningTotal += netImpact;
          cashImpact.push(runningTotal);
        }

        outputs = {
          totalAnnualCost,
          monthlyCost,
          expectedAnnualRevenue: annualRevenue,
          breakEvenMonth,
          firstYearContribution,
          cashImpactByMonth: cashImpact,
        };

        // Determine recommendation
        if (firstYearContribution > 0 && breakEvenMonth <= 6) {
          rec = 'proceed';
          summary = `Yes, hire if ${hireInputs.expectedUtilisation}% utilisation is achievable within ${hireInputs.rampMonths} months. Expected contribution: ${formatCurrency(firstYearContribution)} in year 1.`;
        } else if (firstYearContribution > 0) {
          rec = 'caution';
          summary = `Proceed with caution. Break-even at month ${breakEvenMonth}. Ensure sufficient cash runway and demand pipeline.`;
        } else {
          rec = 'dont_proceed';
          summary = `This hire shows a loss of ${formatCurrency(Math.abs(firstYearContribution))} in year 1 at ${hireInputs.expectedUtilisation}% utilisation. Review charge rates or utilisation assumptions.`;
        }

      } else if (scenarioType === 'pricing') {
        const direction = pricingInputs.changeType === 'increase' ? 1 : -1;
        const priceMultiplier = 1 + (direction * pricingInputs.percentageChange / 100);
        const newRevenue = pricingInputs.affectedRevenue * priceMultiplier;
        const churnImpact = pricingInputs.affectedRevenue * (pricingInputs.expectedChurnRate / 100);
        const netRevenueChange = newRevenue - pricingInputs.affectedRevenue - churnImpact;
        
        outputs = {
          currentRevenue: pricingInputs.affectedRevenue,
          newRevenue,
          priceChange: pricingInputs.percentageChange,
          churnImpact,
          netRevenueChange,
          netRevenueChangePercent: (netRevenueChange / pricingInputs.affectedRevenue) * 100,
        };

        if (netRevenueChange > 0) {
          rec = 'proceed';
          summary = `${pricingInputs.percentageChange}% price ${pricingInputs.changeType} yields net ${formatCurrency(netRevenueChange)} additional revenue (${((netRevenueChange / pricingInputs.affectedRevenue) * 100).toFixed(1)}% uplift) after accounting for ${pricingInputs.expectedChurnRate}% churn.`;
        } else {
          rec = 'dont_proceed';
          summary = `Price ${pricingInputs.changeType} would result in ${formatCurrency(Math.abs(netRevenueChange))} revenue loss after churn. Consider lower change or better churn management.`;
        }

      } else if (scenarioType === 'client_loss') {
        const monthlyRevenueImpact = clientLossInputs.annualRevenue / 12;
        const monthlyCostSavings = clientLossInputs.associatedCosts / 12;
        const netMonthlyImpact = monthlyRevenueImpact - monthlyCostSavings;
        const runwayImpact = baseData?.monthlyBurnRate 
          ? (baseData.currentCash / (baseData.monthlyBurnRate + netMonthlyImpact)) - (baseData.currentCash / baseData.monthlyBurnRate)
          : 0;

        outputs = {
          annualRevenueImpact: clientLossInputs.annualRevenue,
          annualCostSavings: clientLossInputs.associatedCosts,
          netAnnualImpact: clientLossInputs.annualRevenue - clientLossInputs.associatedCosts,
          monthlyImpact: netMonthlyImpact,
          runwayImpactMonths: runwayImpact,
          bufferRequired: netMonthlyImpact * 3, // 3 months buffer
        };

        rec = 'caution';
        summary = `Losing ${clientLossInputs.clientName} would reduce annual profit by ${formatCurrency(clientLossInputs.annualRevenue - clientLossInputs.associatedCosts)}. Ensure ${formatCurrency(netMonthlyImpact * 3)} buffer and pipeline to replace within ${clientLossInputs.noticeMonths} months.`;

      } else if (scenarioType === 'investment') {
        const roi = ((investmentInputs.expectedReturn - investmentInputs.amount) / investmentInputs.amount) * 100;
        const monthlyROI = roi / investmentInputs.returnTimeframe;
        const paybackMonths = investmentInputs.expectedReturn > 0 
          ? Math.ceil(investmentInputs.amount / (investmentInputs.expectedReturn / investmentInputs.returnTimeframe))
          : 0;

        outputs = {
          investmentAmount: investmentInputs.amount,
          expectedReturn: investmentInputs.expectedReturn,
          netReturn: investmentInputs.expectedReturn - investmentInputs.amount,
          roi,
          monthlyROI,
          paybackMonths,
        };

        if (roi > 50 && paybackMonths <= 6) {
          rec = 'proceed';
          summary = `Strong ROI of ${roi.toFixed(0)}% with ${paybackMonths}-month payback. Proceed if cash allows.`;
        } else if (roi > 20) {
          rec = 'caution';
          summary = `Moderate ROI of ${roi.toFixed(0)}% over ${investmentInputs.returnTimeframe} months. Consider opportunity cost.`;
        } else {
          rec = 'dont_proceed';
          summary = `Low ROI of ${roi.toFixed(0)}%. Capital may be better deployed elsewhere.`;
        }
      }

      setResults(outputs);
      setRecommendation(rec);
      setSummaryAnswer(summary);

    } catch (error) {
      console.error('Error running scenario:', error);
    } finally {
      setRunning(false);
    }
  };

  // Save scenario
  const handleSave = async () => {
    setSaving(true);
    try {
      const inputs = 
        scenarioType === 'hire' ? hireInputs :
        scenarioType === 'pricing' ? pricingInputs :
        scenarioType === 'client_loss' ? clientLossInputs :
        investmentInputs;

      const scenarioData = {
        engagement_id: engagementId,
        scenario_type: scenarioType,
        name: name || `${scenarioType} scenario`,
        inputs,
        outputs: results,
        recommendation,
        summary_answer: summaryAnswer,
        last_run_at: new Date().toISOString(),
      };

      if (existingScenario) {
        const { data, error } = await supabase
          .from('ma_scenarios')
          .update(scenarioData)
          .eq('id', existingScenario.id)
          .select()
          .single();

        if (error) throw error;
        onSave?.(data);
      } else {
        const { data, error } = await supabase
          .from('ma_scenarios')
          .insert(scenarioData)
          .select()
          .single();

        if (error) throw error;
        onSave?.(data);
      }
    } catch (error) {
      console.error('Error saving scenario:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-500" />
          Scenario Builder
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Scenario Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">What do you want to model?</label>
          <div className="grid grid-cols-2 gap-3">
            {SCENARIO_TYPES.map(type => (
              <button
                key={type.type}
                onClick={() => {
                  setScenarioType(type.type);
                  setResults(null);
                  setRecommendation(null);
                }}
                className={`
                  p-4 rounded-lg border text-left transition-all
                  ${scenarioType === type.type
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={scenarioType === type.type ? 'text-blue-600' : 'text-slate-400'}>
                    {type.icon}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{type.label}</p>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Scenario Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. ${scenarioType === 'hire' ? 'Senior Developer Hire' : scenarioType === 'pricing' ? '10% Price Increase' : scenarioType === 'client_loss' ? 'What if we lose Acme Corp?' : 'New Equipment Purchase'}`}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
          />
        </div>

        {/* Input Forms by Type */}
        {scenarioType === 'hire' && (
          <HireForm inputs={hireInputs} setInputs={setHireInputs} />
        )}
        {scenarioType === 'pricing' && (
          <PricingForm inputs={pricingInputs} setInputs={setPricingInputs} />
        )}
        {scenarioType === 'client_loss' && (
          <ClientLossForm inputs={clientLossInputs} setInputs={setClientLossInputs} />
        )}
        {scenarioType === 'investment' && (
          <InvestmentForm inputs={investmentInputs} setInputs={setInvestmentInputs} />
        )}

        {/* Run Button */}
        <button
          onClick={runScenario}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {running ? 'Calculating...' : 'Run Scenario'}
        </button>

        {/* Results */}
        {results && recommendation && (
          <div className="space-y-4">
            {/* Recommendation Banner */}
            <div className={`p-4 rounded-lg border ${RECOMMENDATION_STYLES[recommendation].bg} ${RECOMMENDATION_STYLES[recommendation].border}`}>
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon = RECOMMENDATION_STYLES[recommendation].icon;
                  return <Icon className={`h-5 w-5 flex-shrink-0 ${RECOMMENDATION_STYLES[recommendation].text}`} />;
                })()}
                <div>
                  <p className={`font-semibold ${RECOMMENDATION_STYLES[recommendation].text}`}>
                    {recommendation === 'proceed' ? 'Recommended to Proceed' :
                     recommendation === 'caution' ? 'Proceed with Caution' :
                     recommendation === 'dont_proceed' ? 'Not Recommended' :
                     'More Information Needed'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{summaryAnswer}</p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(results)
                .filter(([key]) => !key.includes('ByMonth') && typeof results[key] === 'number')
                .map(([key, value]) => (
                  <div key={key} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className="font-semibold text-slate-800">
                      {key.toLowerCase().includes('percent') || key.toLowerCase().includes('roi')
                        ? `${(value as number).toFixed(1)}%`
                        : key.toLowerCase().includes('month')
                          ? `${Math.round(value as number)} months`
                          : formatCurrency(value as number)
                      }
                    </p>
                  </div>
                ))}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Scenario'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Form Components
function HireForm({ inputs, setInputs }: { inputs: HireInputs; setInputs: (i: HireInputs) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
        <input
          type="text"
          value={inputs.role}
          onChange={(e) => setInputs({ ...inputs, role: e.target.value })}
          placeholder="e.g. Senior Consultant"
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Annual Salary (£)</label>
        <input
          type="number"
          value={inputs.salary}
          onChange={(e) => setInputs({ ...inputs, salary: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
        <input
          type="date"
          value={inputs.startDate}
          onChange={(e) => setInputs({ ...inputs, startDate: e.target.value })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Ramp-up Period (months)</label>
        <input
          type="number"
          value={inputs.rampMonths}
          onChange={(e) => setInputs({ ...inputs, rampMonths: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Expected Utilisation (%)</label>
        <input
          type="number"
          value={inputs.expectedUtilisation}
          onChange={(e) => setInputs({ ...inputs, expectedUtilisation: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Charge Rate (£/hour)</label>
        <input
          type="number"
          value={inputs.chargeRate}
          onChange={(e) => setInputs({ ...inputs, chargeRate: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
    </div>
  );
}

function PricingForm({ inputs, setInputs }: { inputs: PricingInputs; setInputs: (i: PricingInputs) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Change Type</label>
        <select
          value={inputs.changeType}
          onChange={(e) => setInputs({ ...inputs, changeType: e.target.value as 'increase' | 'decrease' })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        >
          <option value="increase">Price Increase</option>
          <option value="decrease">Price Decrease</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Change (%)</label>
        <input
          type="number"
          value={inputs.percentageChange}
          onChange={(e) => setInputs({ ...inputs, percentageChange: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Affected Revenue (£)</label>
        <input
          type="number"
          value={inputs.affectedRevenue}
          onChange={(e) => setInputs({ ...inputs, affectedRevenue: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Expected Churn (%)</label>
        <input
          type="number"
          value={inputs.expectedChurnRate}
          onChange={(e) => setInputs({ ...inputs, expectedChurnRate: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
    </div>
  );
}

function ClientLossForm({ inputs, setInputs }: { inputs: ClientLossInputs; setInputs: (i: ClientLossInputs) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
        <input
          type="text"
          value={inputs.clientName}
          onChange={(e) => setInputs({ ...inputs, clientName: e.target.value })}
          placeholder="e.g. Acme Corporation"
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Annual Revenue (£)</label>
        <input
          type="number"
          value={inputs.annualRevenue}
          onChange={(e) => setInputs({ ...inputs, annualRevenue: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Associated Costs (£)</label>
        <input
          type="number"
          value={inputs.associatedCosts}
          onChange={(e) => setInputs({ ...inputs, associatedCosts: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period (months)</label>
        <input
          type="number"
          value={inputs.noticeMonths}
          onChange={(e) => setInputs({ ...inputs, noticeMonths: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
    </div>
  );
}

function InvestmentForm({ inputs, setInputs }: { inputs: InvestmentInputs; setInputs: (i: InvestmentInputs) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <input
          type="text"
          value={inputs.description}
          onChange={(e) => setInputs({ ...inputs, description: e.target.value })}
          placeholder="e.g. New CRM System"
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Investment Amount (£)</label>
        <input
          type="number"
          value={inputs.amount}
          onChange={(e) => setInputs({ ...inputs, amount: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
        <select
          value={inputs.paymentType}
          onChange={(e) => setInputs({ ...inputs, paymentType: e.target.value as 'upfront' | 'monthly' | 'quarterly' })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        >
          <option value="upfront">Upfront</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Expected Return (£)</label>
        <input
          type="number"
          value={inputs.expectedReturn}
          onChange={(e) => setInputs({ ...inputs, expectedReturn: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Timeframe (months)</label>
        <input
          type="number"
          value={inputs.returnTimeframe}
          onChange={(e) => setInputs({ ...inputs, returnTimeframe: parseInt(e.target.value) || 0 })}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
        />
      </div>
    </div>
  );
}

export default ScenarioBuilder;

