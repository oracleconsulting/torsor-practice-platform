'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Save,
  TrendingUp,
  TrendingDown,
  UserPlus,
  ShoppingCart,
  Building2,
  Loader2,
  Sparkles,
  Calculator
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { MAScenario } from '../../../types/bi-dashboard';

interface ScenarioEditorProps {
  engagementId: string;
  periodId: string;
  scenario?: MAScenario | null;
  onSave: (scenario: MAScenario) => void;
  onClose: () => void;
  currentCash: number;
  monthlyBurn: number;
}

type ScenarioType = 'hire' | 'revenue_change' | 'cost_change' | 'investment' | 'custom';

const SCENARIO_TEMPLATES: Record<ScenarioType, {
  label: string;
  icon: React.ReactNode;
  description: string;
  defaultAssumptions: Record<string, any>;
}> = {
  hire: {
    label: 'New Hire',
    icon: <UserPlus className="w-5 h-5" />,
    description: 'Model the impact of hiring new team members',
    defaultAssumptions: {
      salary: 45000,
      startMonth: 1,
      onboardingCost: 5000,
      expectedUtilization: 75,
      chargeOutRate: 100,
    },
  },
  revenue_change: {
    label: 'Revenue Change',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Model revenue increases or decreases',
    defaultAssumptions: {
      changePercent: 10,
      startMonth: 1,
      rampMonths: 3,
      isIncrease: true,
    },
  },
  cost_change: {
    label: 'Cost Change',
    icon: <TrendingDown className="w-5 h-5" />,
    description: 'Model cost savings or new expenses',
    defaultAssumptions: {
      monthlyAmount: 5000,
      startMonth: 1,
      isRecurring: true,
      isIncrease: true,
    },
  },
  investment: {
    label: 'Investment',
    icon: <ShoppingCart className="w-5 h-5" />,
    description: 'Model one-time investments with ROI',
    defaultAssumptions: {
      amount: 50000,
      paybackMonths: 12,
      expectedROI: 25,
    },
  },
  custom: {
    label: 'Custom',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Create a fully custom scenario',
    defaultAssumptions: {},
  },
};

const SCENARIO_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
];

export function ScenarioEditor({
  engagementId,
  periodId,
  scenario,
  onSave,
  onClose,
  currentCash,
  monthlyBurn,
}: ScenarioEditorProps) {
  const [saving, setSaving] = useState(false);
  const [scenarioType, setScenarioType] = useState<ScenarioType>(
    (scenario?.scenario_type as ScenarioType) || 'hire'
  );
  const [name, setName] = useState(scenario?.name || '');
  const [description, setDescription] = useState(scenario?.description || '');
  const [shortLabel, setShortLabel] = useState(scenario?.short_label || '');
  const [color, setColor] = useState(scenario?.scenario_color || '#3b82f6');
  const [isFeatured, setIsFeatured] = useState(scenario?.is_featured ?? true);
  const [assumptions, setAssumptions] = useState<Record<string, any>>(
    scenario?.assumptions || (SCENARIO_TEMPLATES[scenarioType] || SCENARIO_TEMPLATES.custom).defaultAssumptions
  );

  // Calculated impacts
  const [calculatedImpact, setCalculatedImpact] = useState<{
    cashImpact: number;
    runwayImpact: number;
    breakeven?: string;
  } | null>(null);

  // Update assumptions when scenario type changes
  useEffect(() => {
    if (!scenario) {
      const template = SCENARIO_TEMPLATES[scenarioType] || SCENARIO_TEMPLATES.custom;
      setAssumptions(template.defaultAssumptions);
      setName(template.label);
    }
  }, [scenarioType, scenario]);

  // Calculate impact whenever assumptions change
  useEffect(() => {
    calculateImpact();
  }, [assumptions, scenarioType, currentCash, monthlyBurn]);

  const calculateImpact = () => {
    let cashImpact = 0;
    let monthlyImpact = 0;

    switch (scenarioType) {
      case 'hire':
        const monthlySalary = (assumptions.salary || 0) / 12;
        const totalCost = monthlySalary + (assumptions.onboardingCost || 0);
        const expectedRevenue = ((assumptions.expectedUtilization || 75) / 100) * 
          (assumptions.chargeOutRate || 100) * 160; // 160 hours/month
        monthlyImpact = expectedRevenue - monthlySalary;
        cashImpact = -totalCost; // Initial impact
        break;

      case 'revenue_change':
        const revenueChange = (monthlyBurn * (assumptions.changePercent || 10)) / 100;
        monthlyImpact = assumptions.isIncrease ? revenueChange : -revenueChange;
        cashImpact = monthlyImpact * 12;
        break;

      case 'cost_change':
        const costChange = assumptions.monthlyAmount || 0;
        monthlyImpact = assumptions.isIncrease ? -costChange : costChange;
        cashImpact = assumptions.isRecurring ? monthlyImpact * 12 : -costChange;
        break;

      case 'investment':
        cashImpact = -(assumptions.amount || 0);
        const roi = (assumptions.amount || 0) * ((assumptions.expectedROI || 0) / 100);
        monthlyImpact = roi / 12;
        break;

      default:
        cashImpact = 0;
        monthlyImpact = 0;
    }

    const newBurn = monthlyBurn - monthlyImpact;
    const currentRunway = monthlyBurn > 0 ? currentCash / monthlyBurn : 0;
    const newRunway = newBurn > 0 ? (currentCash + cashImpact) / newBurn : 0;
    const runwayImpact = newRunway - currentRunway;

    setCalculatedImpact({
      cashImpact,
      runwayImpact,
      breakeven: monthlyImpact > 0 && cashImpact < 0 
        ? `Month ${Math.ceil(Math.abs(cashImpact) / monthlyImpact)}`
        : undefined,
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const scenarioData = {
        engagement_id: engagementId,
        period_id: periodId,
        name: name.trim(),
        description: description.trim() || null,
        scenario_type: scenarioType,
        short_label: shortLabel.trim() || name.trim().slice(0, 10),
        scenario_color: color,
        is_featured: isFeatured,
        assumptions,
        impact_on_cash: calculatedImpact?.cashImpact || 0,
        impact_on_runway: calculatedImpact?.runwayImpact || 0,
        impact_summary: getImpactSummary(),
      };

      let result;
      if (scenario?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('ma_scenarios')
          .update(scenarioData)
          .eq('id', scenario.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('ma_scenarios')
          .insert(scenarioData)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      onSave(result);
    } catch (err) {
      console.error('[ScenarioEditor] Error saving:', err);
      alert('Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const getImpactSummary = (): string => {
    if (!calculatedImpact) return '';
    
    const parts: string[] = [];
    if (calculatedImpact.cashImpact !== 0) {
      parts.push(`${calculatedImpact.cashImpact >= 0 ? '+' : ''}£${Math.abs(calculatedImpact.cashImpact).toLocaleString()} cash impact`);
    }
    if (calculatedImpact.runwayImpact !== 0) {
      parts.push(`${calculatedImpact.runwayImpact >= 0 ? '+' : ''}${calculatedImpact.runwayImpact.toFixed(1)} months runway`);
    }
    if (calculatedImpact.breakeven) {
      parts.push(`Breakeven: ${calculatedImpact.breakeven}`);
    }
    return parts.join(' | ');
  };

  const formatCurrency = (value: number): string => {
    return `£${Math.abs(value).toLocaleString()}`;
  };

  const updateAssumption = (key: string, value: any) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              {scenario ? 'Edit Scenario' : 'Create Scenario'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scenario Type Selection */}
          {!scenario && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Scenario Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(SCENARIO_TEMPLATES) as ScenarioType[]).map(type => {
                  const template = SCENARIO_TEMPLATES[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setScenarioType(type)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        scenarioType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`mb-2 ${scenarioType === type ? 'text-blue-600' : 'text-slate-500'}`}>
                        {template.icon}
                      </div>
                      <p className="font-medium text-slate-800 text-sm">{template.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scenario Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Hire Senior Developer"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this scenario..."
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Short Label
                </label>
                <input
                  type="text"
                  value={shortLabel}
                  onChange={(e) => setShortLabel(e.target.value)}
                  placeholder="e.g., +Dev"
                  maxLength={10}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  {SCENARIO_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c.value ? 'border-slate-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Type-Specific Assumptions */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <h3 className="font-medium text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Assumptions
            </h3>

            {scenarioType === 'hire' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Annual Salary</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                    <input
                      type="number"
                      value={assumptions.salary || ''}
                      onChange={(e) => updateAssumption('salary', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Onboarding Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                    <input
                      type="number"
                      value={assumptions.onboardingCost || ''}
                      onChange={(e) => updateAssumption('onboardingCost', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Expected Utilization %</label>
                  <input
                    type="number"
                    value={assumptions.expectedUtilization || ''}
                    onChange={(e) => updateAssumption('expectedUtilization', parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Charge-out Rate (£/hr)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                    <input
                      type="number"
                      value={assumptions.chargeOutRate || ''}
                      onChange={(e) => updateAssumption('chargeOutRate', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {scenarioType === 'revenue_change' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={assumptions.isIncrease}
                      onChange={() => updateAssumption('isIncrease', true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">Increase</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!assumptions.isIncrease}
                      onChange={() => updateAssumption('isIncrease', false)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">Decrease</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Change %</label>
                    <input
                      type="number"
                      value={assumptions.changePercent || ''}
                      onChange={(e) => updateAssumption('changePercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Ramp-up Months</label>
                    <input
                      type="number"
                      value={assumptions.rampMonths || ''}
                      onChange={(e) => updateAssumption('rampMonths', parseInt(e.target.value) || 0)}
                      min={0}
                      max={12}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {scenarioType === 'cost_change' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={assumptions.isIncrease}
                      onChange={() => updateAssumption('isIncrease', true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">New Cost</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!assumptions.isIncrease}
                      onChange={() => updateAssumption('isIncrease', false)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">Cost Saving</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Monthly Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                      <input
                        type="number"
                        value={assumptions.monthlyAmount || ''}
                        onChange={(e) => updateAssumption('monthlyAmount', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assumptions.isRecurring}
                        onChange={(e) => updateAssumption('isRecurring', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700">Recurring monthly</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {scenarioType === 'investment' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Investment Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                    <input
                      type="number"
                      value={assumptions.amount || ''}
                      onChange={(e) => updateAssumption('amount', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Expected ROI %</label>
                  <input
                    type="number"
                    value={assumptions.expectedROI || ''}
                    onChange={(e) => updateAssumption('expectedROI', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Payback Period (months)</label>
                  <input
                    type="number"
                    value={assumptions.paybackMonths || ''}
                    onChange={(e) => updateAssumption('paybackMonths', parseInt(e.target.value) || 0)}
                    min={1}
                    max={60}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Calculated Impact */}
          {calculatedImpact && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Calculated Impact
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Cash Impact</p>
                  <p className={`text-xl font-bold ${
                    calculatedImpact.cashImpact >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {calculatedImpact.cashImpact >= 0 ? '+' : '-'}{formatCurrency(calculatedImpact.cashImpact)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Runway Impact</p>
                  <p className={`text-xl font-bold ${
                    calculatedImpact.runwayImpact >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {calculatedImpact.runwayImpact >= 0 ? '+' : ''}{calculatedImpact.runwayImpact.toFixed(1)} months
                  </p>
                </div>
                {calculatedImpact.breakeven && (
                  <div>
                    <p className="text-sm text-slate-400">Breakeven</p>
                    <p className="text-xl font-bold text-blue-400">{calculatedImpact.breakeven}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Featured Toggle */}
          <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
            <div>
              <p className="font-medium text-slate-800">Show in Dashboard</p>
              <p className="text-sm text-slate-500">Display as a scenario toggle on the client dashboard</p>
            </div>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {scenario ? 'Update Scenario' : 'Create Scenario'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

