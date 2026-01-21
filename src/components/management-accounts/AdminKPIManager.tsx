'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  BarChart3, 
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MAFinancialData, MAKPIValue, TierType } from '../../types/ma';

interface AdminKPIManagerProps {
  engagementId: string;
  periodId: string;
  tier: TierType;
  financialData: MAFinancialData | null;
  existingKpis: MAKPIValue[];
  onSave: (kpis: MAKPIValue[]) => void;
  onContinue: () => void;
}

interface KPIDefinition {
  code: string;
  name: string;
  category: string;
  description: string;
  unit: 'currency' | 'percentage' | 'number' | 'days' | 'ratio' | 'months';
  calculation_hint?: string;
  higher_is_better: boolean;
  tier_availability: string[];
}

// Core KPIs that admins can select from
// KPI codes must exactly match ma_kpi_definitions.code in the database
const AVAILABLE_KPIS: KPIDefinition[] = [
  // Cash & Working Capital
  { code: 'true_cash', name: 'True Cash', category: 'Cash & Working Capital', description: 'Actual available cash after liabilities', unit: 'currency', higher_is_better: true, tier_availability: ['bronze', 'silver', 'gold', 'platinum'] },
  { code: 'burn_rate', name: 'Monthly Burn Rate', category: 'Cash & Working Capital', description: 'Net monthly cash outflow', unit: 'currency', higher_is_better: false, tier_availability: ['bronze', 'silver', 'gold', 'platinum'] },
  { code: 'cash_runway', name: 'Cash Runway', category: 'Cash & Working Capital', description: 'Months of operation at current burn', unit: 'months', higher_is_better: true, tier_availability: ['bronze', 'silver', 'gold', 'platinum'] },
  { code: 'debtor_days', name: 'Debtor Days', category: 'Cash & Working Capital', description: 'Average days to collect receivables', unit: 'days', higher_is_better: false, tier_availability: ['silver', 'gold', 'platinum'] },
  { code: 'creditor_days', name: 'Creditor Days', category: 'Cash & Working Capital', description: 'Average days to pay suppliers', unit: 'days', higher_is_better: true, tier_availability: ['silver', 'gold', 'platinum'] },
  { code: 'working_capital_ratio', name: 'Working Capital Ratio', category: 'Cash & Working Capital', description: 'Current assets / current liabilities', unit: 'ratio', higher_is_better: true, tier_availability: ['silver', 'gold', 'platinum'] },
  { code: 'cash_conversion_cycle', name: 'Cash Conversion Cycle', category: 'Cash & Working Capital', description: 'Days between paying suppliers and collecting', unit: 'days', higher_is_better: false, tier_availability: ['gold', 'platinum'] },
  
  // Revenue & Growth
  { code: 'monthly_revenue', name: 'Monthly Revenue', category: 'Revenue & Growth', description: 'Total invoiced revenue for the period', unit: 'currency', higher_is_better: true, tier_availability: ['bronze', 'silver', 'gold', 'platinum'] },
  { code: 'yoy_revenue_growth', name: 'YoY Revenue Growth %', category: 'Revenue & Growth', description: 'Year-on-year revenue growth', unit: 'percentage', higher_is_better: true, tier_availability: ['silver', 'gold', 'platinum'] },
  { code: 'avg_project_value', name: 'Avg Project Value', category: 'Revenue & Growth', description: 'Average value per project', unit: 'currency', higher_is_better: true, tier_availability: ['gold', 'platinum'] },
  { code: 'revenue_per_employee', name: 'Revenue per Employee', category: 'Revenue & Growth', description: 'Revenue divided by headcount', unit: 'currency', higher_is_better: true, tier_availability: ['gold', 'platinum'] },
  { code: 'recurring_revenue_pct', name: 'Recurring Revenue %', category: 'Revenue & Growth', description: 'Recurring vs project revenue split', unit: 'percentage', higher_is_better: true, tier_availability: ['silver', 'gold', 'platinum'] },
  
  // Profitability
  { code: 'gross_margin', name: 'Gross Margin %', category: 'Profitability', description: 'Gross profit as % of revenue', unit: 'percentage', higher_is_better: true, tier_availability: ['bronze', 'silver', 'gold', 'platinum'] },
  { code: 'net_margin', name: 'Net Margin %', category: 'Profitability', description: 'Net profit as % of revenue', unit: 'percentage', higher_is_better: true, tier_availability: ['silver', 'gold', 'platinum'] },
  { code: 'operating_margin', name: 'Operating Margin %', category: 'Profitability', description: 'Operating profit as % of revenue', unit: 'percentage', higher_is_better: true, tier_availability: ['silver', 'gold', 'platinum'] },
  { code: 'overhead_pct', name: 'Overhead %', category: 'Profitability', description: 'Overhead as % of revenue', unit: 'percentage', higher_is_better: false, tier_availability: ['gold', 'platinum'] },
  { code: 'revenue_per_salary', name: 'Revenue per £1 Salary', category: 'Profitability', description: 'Revenue efficiency vs salary spend', unit: 'ratio', higher_is_better: true, tier_availability: ['gold', 'platinum'] },
  
  // Efficiency
  { code: 'billable_utilisation', name: 'Billable Utilisation %', category: 'Efficiency', description: 'Percentage of time on billable work', unit: 'percentage', higher_is_better: true, tier_availability: ['silver', 'gold', 'platinum'] },
  { code: 'effective_hourly_rate', name: 'Effective Hourly Rate', category: 'Efficiency', description: 'Actual rate achieved', unit: 'currency', higher_is_better: true, tier_availability: ['gold', 'platinum'] },
  { code: 'project_margin', name: 'Project Margin %', category: 'Efficiency', description: 'Profitability by client/project', unit: 'percentage', higher_is_better: true, tier_availability: ['gold', 'platinum'] },
  
  // Client Health
  { code: 'client_concentration', name: 'Client Concentration %', category: 'Client Health', description: 'Revenue from top 3 clients', unit: 'percentage', higher_is_better: false, tier_availability: ['gold', 'platinum'] },
  { code: 'client_retention', name: 'Client Retention %', category: 'Client Health', description: 'Clients retained year-on-year', unit: 'percentage', higher_is_better: true, tier_availability: ['gold', 'platinum'] },
  { code: 'client_lifetime_value', name: 'Client Lifetime Value', category: 'Client Health', description: 'Expected total revenue per client', unit: 'currency', higher_is_better: true, tier_availability: ['platinum'] },
  { code: 'new_client_revenue_pct', name: 'New Client Revenue %', category: 'Client Health', description: 'Revenue from new vs repeat clients', unit: 'percentage', higher_is_better: true, tier_availability: ['gold', 'platinum'] },
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Cash & Working Capital': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  'Revenue & Growth': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  'Profitability': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  'Efficiency': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  'Client Health': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
};

export function AdminKPIManager({
  engagementId,
  periodId: _periodId,
  tier,
  financialData,
  existingKpis,
  onSave,
  onContinue,
}: AdminKPIManagerProps) {
  // _periodId reserved for future period-specific KPI features
  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);
  const [kpiValues, setKpiValues] = useState<Record<string, { value: string; target: string; commentary: string }>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Cash & Working Capital': true,
    'Revenue & Growth': true,
    'Profitability': false,
    'Efficiency': false,
    'Client Health': false,
  });

  // Initialize from existing KPIs
  useEffect(() => {
    if (existingKpis.length > 0) {
      const codes = existingKpis.map(k => k.kpi_code);
      setSelectedKpis(codes);
      
      const values: Record<string, { value: string; target: string; commentary: string }> = {};
      existingKpis.forEach(k => {
        values[k.kpi_code] = {
          value: k.value?.toString() || '',
          target: k.target_value?.toString() || '',
          commentary: k.auto_commentary || '',
        };
      });
      setKpiValues(values);
    }
  }, [existingKpis]);

  // Auto-calculate some KPIs from financial data
  useEffect(() => {
    if (financialData) {
      const autoCalc: Record<string, number> = {};
      
      if (financialData.true_cash !== undefined) {
        autoCalc['TRUE_CASH'] = financialData.true_cash;
      }
      if (financialData.true_cash_runway_months !== undefined) {
        autoCalc['CASH_RUNWAY'] = financialData.true_cash_runway_months;
      }
      if (financialData.monthly_operating_costs) {
        autoCalc['BURN_RATE'] = financialData.monthly_operating_costs;
      }
      if (financialData.revenue && financialData.gross_profit) {
        autoCalc['GROSS_MARGIN'] = Math.round((financialData.gross_profit / financialData.revenue) * 100);
      }
      if (financialData.revenue && financialData.net_profit) {
        autoCalc['NET_MARGIN'] = Math.round((financialData.net_profit / financialData.revenue) * 100);
      }
      
      // Update values for auto-calculated KPIs
      setKpiValues(prev => {
        const updated = { ...prev };
        Object.entries(autoCalc).forEach(([code, val]) => {
          if (selectedKpis.includes(code) && !updated[code]?.value) {
            updated[code] = {
              ...updated[code],
              value: val.toString(),
              target: updated[code]?.target || '',
              commentary: updated[code]?.commentary || '',
            };
          }
        });
        return updated;
      });
    }
  }, [financialData, selectedKpis]);

  const availableForTier = AVAILABLE_KPIS.filter(kpi => 
    kpi.tier_availability.includes(tier)
  );

  const toggleKPI = (code: string) => {
    if (selectedKpis.includes(code)) {
      setSelectedKpis(selectedKpis.filter(c => c !== code));
    } else {
      setSelectedKpis([...selectedKpis, code]);
      if (!kpiValues[code]) {
        setKpiValues(prev => ({
          ...prev,
          [code]: { value: '', target: '', commentary: '' },
        }));
      }
    }
    setSaved(false);
  };

  const updateKPIValue = (code: string, field: 'value' | 'target' | 'commentary', val: string) => {
    setKpiValues(prev => ({
      ...prev,
      [code]: { ...prev[code], [field]: val },
    }));
    setSaved(false);
  };

  const calculateRAG = (code: string, value: number, target: number): 'green' | 'amber' | 'red' | 'grey' => {
    if (!target) return 'grey';
    const kpi = AVAILABLE_KPIS.find(k => k.code === code);
    if (!kpi) return 'grey';
    
    const ratio = value / target;
    if (kpi.higher_is_better) {
      if (ratio >= 1) return 'green';
      if (ratio >= 0.8) return 'amber';
      return 'red';
    } else {
      if (ratio <= 1) return 'green';
      if (ratio <= 1.2) return 'amber';
      return 'red';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Calculate period dates
      const periodEndDate = new Date().toISOString().split('T')[0];
      const periodStartDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
      
      // Delete existing KPIs for this engagement/period (we'll re-insert the selected ones)
      // Note: ma_kpi_tracking doesn't have period_id, it uses period_start/period_end
      await supabase
        .from('ma_kpi_tracking')
        .delete()
        .eq('engagement_id', engagementId)
        .eq('period_end', periodEndDate);

      // Insert new KPIs - only include columns that exist in ma_kpi_tracking table
      
      const kpisToInsert = selectedKpis.map(code => {
        const vals = kpiValues[code] || { value: '', target: '', commentary: '' };
        const numValue = parseFloat(vals.value) || null;
        const numTarget = parseFloat(vals.target) || null;
        
        return {
          engagement_id: engagementId,
          kpi_code: code, // Must match ma_kpi_definitions.code exactly
          period_start: periodStartDate,
          period_end: periodEndDate,
          value: numValue,
          target_value: numTarget,
          rag_status: numValue !== null ? calculateRAG(code, numValue, numTarget || 0) : null,
        };
      });

      if (kpisToInsert.length > 0) {
        const { error } = await supabase
          .from('ma_kpi_tracking')
          .insert(kpisToInsert);
        
        if (error) throw error;
      }

      // Refresh KPIs
      const { data: updatedKpis } = await supabase
        .from('ma_kpi_tracking')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('period_end', periodEndDate);

      onSave(updatedKpis || []);
      setSaved(true);
    } catch (error: any) {
      console.error('[AdminKPIManager] Error saving:', error);
      alert('Failed to save KPIs: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (code: string, value: string): string => {
    const kpi = AVAILABLE_KPIS.find(k => k.code === code);
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    switch (kpi?.unit) {
      case 'currency':
        return `£${num.toLocaleString()}`;
      case 'percentage':
        return `${num}%`;
      case 'days':
        return `${num} days`;
      case 'months':
        return `${num} months`;
      case 'ratio':
        return num.toFixed(2);
      default:
        return num.toLocaleString();
    }
  };

  const groupedKpis = selectedKpis.reduce((acc, code) => {
    const kpi = AVAILABLE_KPIS.find(k => k.code === code);
    if (kpi) {
      if (!acc[kpi.category]) acc[kpi.category] = [];
      acc[kpi.category].push(kpi);
    }
    return acc;
  }, {} as Record<string, KPIDefinition[]>);

  return (
    <div className="space-y-6">
      {/* Header with Add KPI button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">KPI Configuration</h2>
          <p className="text-sm text-slate-500 mt-1">
            Select and configure KPIs to track for this client
          </p>
        </div>
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add KPIs
        </button>
      </div>

      {/* KPI Selector Panel */}
      {showSelector && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-800">Available KPIs for {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</h3>
            <button onClick={() => setShowSelector(false)} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {Object.entries(
            availableForTier.reduce((acc, kpi) => {
              if (!acc[kpi.category]) acc[kpi.category] = [];
              acc[kpi.category].push(kpi);
              return acc;
            }, {} as Record<string, KPIDefinition[]>)
          ).map(([category, kpis]) => (
            <div key={category} className="mb-4">
              <button
                onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                className="flex items-center gap-2 w-full text-left py-2"
              >
                {expandedCategories[category] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className={`font-medium ${CATEGORY_COLORS[category]?.text || 'text-slate-700'}`}>
                  {category}
                </span>
                <span className="text-xs text-slate-400">({kpis.length})</span>
              </button>
              
              {expandedCategories[category] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6 mt-2">
                  {kpis.map(kpi => (
                    <label
                      key={kpi.code}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedKpis.includes(kpi.code)
                          ? `${CATEGORY_COLORS[category]?.bg} ${CATEGORY_COLORS[category]?.border}`
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKpis.includes(kpi.code)}
                        onChange={() => toggleKPI(kpi.code)}
                        className="mt-1 rounded border-slate-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 text-sm">{kpi.name}</div>
                        <div className="text-xs text-slate-500">{kpi.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected KPIs with Value Entry */}
      {selectedKpis.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedKpis).map(([category, kpis]) => (
            <div key={category} className={`rounded-xl border p-4 ${CATEGORY_COLORS[category]?.bg} ${CATEGORY_COLORS[category]?.border}`}>
              <h3 className={`font-medium mb-4 ${CATEGORY_COLORS[category]?.text}`}>{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kpis.map(kpi => {
                  const vals = kpiValues[kpi.code] || { value: '', target: '', commentary: '' };
                  const numVal = parseFloat(vals.value);
                  const numTarget = parseFloat(vals.target);
                  const rag = !isNaN(numVal) ? calculateRAG(kpi.code, numVal, numTarget) : 'grey';
                  
                  return (
                    <div key={kpi.code} className="bg-white rounded-lg p-4 border border-white/50 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-slate-800">{kpi.name}</div>
                          <div className="text-xs text-slate-500">{kpi.description}</div>
                        </div>
                        <button
                          onClick={() => toggleKPI(kpi.code)}
                          className="p-1 text-slate-400 hover:text-red-500"
                          title="Remove KPI"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Current Value
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={vals.value}
                              onChange={(e) => updateKPIValue(kpi.code, 'value', e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {vals.value && (
                              <div className={`absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                                rag === 'green' ? 'bg-green-500' :
                                rag === 'amber' ? 'bg-amber-500' :
                                rag === 'red' ? 'bg-red-500' :
                                'bg-slate-300'
                              }`} />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Target
                          </label>
                          <input
                            type="text"
                            value={vals.target}
                            onChange={(e) => updateKPIValue(kpi.code, 'target', e.target.value)}
                            placeholder="Target"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      {/* Display formatted value if entered */}
                      {vals.value && (
                        <div className="mt-2 text-lg font-bold text-slate-800">
                          {formatValue(kpi.code, vals.value)}
                          {vals.target && (
                            <span className="text-sm font-normal text-slate-500 ml-2">
                              / target: {formatValue(kpi.code, vals.target)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No KPIs selected yet</p>
          <button
            onClick={() => setShowSelector(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Select KPIs to Track
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          onClick={handleSave}
          disabled={saving || selectedKpis.length === 0}
          className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save KPIs
            </>
          )}
        </button>

        <button
          onClick={onContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Continue to Insights →
        </button>
      </div>
    </div>
  );
}

export default AdminKPIManager;

