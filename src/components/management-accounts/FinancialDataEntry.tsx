'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  Calculator, 
  PoundSterling, 
  TrendingUp, 
  Building2,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MAFinancialData, TrueCashCalculation } from '../../types/ma';

interface FinancialDataEntryProps {
  periodId: string;
  engagementId: string;
  existingData: MAFinancialData | null;
  onSave: () => void;
  onContinue: () => void;
}

interface FormData {
  // Core P&L
  revenue: string;
  cost_of_sales: string;
  gross_profit: string;
  overheads: string;
  operating_profit: string;
  net_profit: string;
  
  // Cash Position
  cash_at_bank: string;
  vat_liability: string;
  paye_liability: string;
  corporation_tax_liability: string;
  trade_creditors: string;
  trade_debtors: string;
  
  // Operating
  monthly_operating_costs: string;
  payroll_costs: string;
  
  // True Cash components
  committed_payments: string;
  confirmed_receivables: string;
}

const INITIAL_FORM: FormData = {
  revenue: '',
  cost_of_sales: '',
  gross_profit: '',
  overheads: '',
  operating_profit: '',
  net_profit: '',
  cash_at_bank: '',
  vat_liability: '',
  paye_liability: '',
  corporation_tax_liability: '',
  trade_creditors: '',
  trade_debtors: '',
  monthly_operating_costs: '',
  payroll_costs: '',
  committed_payments: '',
  confirmed_receivables: '',
};

export function FinancialDataEntry({
  periodId,
  engagementId,
  existingData,
  onSave,
  onContinue,
}: FinancialDataEntryProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pnl: true,
    cash: true,
    operating: true,
  });

  // Load existing data
  useEffect(() => {
    if (existingData) {
      setFormData({
        revenue: existingData.revenue?.toString() || '',
        cost_of_sales: existingData.cost_of_sales?.toString() || '',
        gross_profit: existingData.gross_profit?.toString() || '',
        overheads: existingData.overheads?.toString() || '',
        operating_profit: existingData.operating_profit?.toString() || '',
        net_profit: existingData.net_profit?.toString() || '',
        cash_at_bank: existingData.cash_at_bank?.toString() || '',
        vat_liability: existingData.vat_liability?.toString() || '',
        paye_liability: existingData.paye_liability?.toString() || '',
        corporation_tax_liability: existingData.corporation_tax_liability?.toString() || '',
        trade_creditors: existingData.trade_creditors?.toString() || '',
        trade_debtors: existingData.trade_debtors?.toString() || '',
        monthly_operating_costs: existingData.monthly_operating_costs?.toString() || '',
        payroll_costs: existingData.payroll_costs?.toString() || '',
        committed_payments: existingData.true_cash_calculation?.committed_payments?.toString() || '',
        confirmed_receivables: existingData.true_cash_calculation?.confirmed_receivables?.toString() || '',
      });
    }
  }, [existingData]);

  const parseNumber = (val: string): number | null => {
    if (!val || val.trim() === '') return null;
    const num = parseFloat(val.replace(/,/g, ''));
    return isNaN(num) ? null : num;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    // Allow only numbers, decimal points, and minus sign
    const cleaned = value.replace(/[^0-9.-]/g, '');
    setFormData(prev => ({ ...prev, [field]: cleaned }));
    setSaved(false);
  };

  // Calculate True Cash in real-time
  const trueCashCalculation = (): TrueCashCalculation | null => {
    const bankBalance = parseNumber(formData.cash_at_bank);
    if (bankBalance === null) return null;

    const vat = parseNumber(formData.vat_liability) || 0;
    const paye = parseNumber(formData.paye_liability) || 0;
    const corpTax = parseNumber(formData.corporation_tax_liability) || 0;
    const committed = parseNumber(formData.committed_payments) || 0;
    const receivables = parseNumber(formData.confirmed_receivables) || 0;

    return {
      bank_balance: bankBalance,
      vat_provision: vat,
      paye_ni: paye,
      corporation_tax: corpTax,
      committed_payments: committed,
      confirmed_receivables: receivables,
      true_cash: bankBalance - vat - paye - corpTax - committed + receivables,
    };
  };

  const trueCash = trueCashCalculation();

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        period_id: periodId,
        engagement_id: engagementId,
        revenue: parseNumber(formData.revenue),
        cost_of_sales: parseNumber(formData.cost_of_sales),
        gross_profit: parseNumber(formData.gross_profit),
        overheads: parseNumber(formData.overheads),
        operating_profit: parseNumber(formData.operating_profit),
        net_profit: parseNumber(formData.net_profit),
        cash_at_bank: parseNumber(formData.cash_at_bank),
        vat_liability: parseNumber(formData.vat_liability),
        paye_liability: parseNumber(formData.paye_liability),
        corporation_tax_liability: parseNumber(formData.corporation_tax_liability),
        trade_creditors: parseNumber(formData.trade_creditors),
        trade_debtors: parseNumber(formData.trade_debtors),
        monthly_operating_costs: parseNumber(formData.monthly_operating_costs),
        payroll_costs: parseNumber(formData.payroll_costs),
        true_cash: trueCash?.true_cash || null,
        true_cash_calculation: trueCash,
        true_cash_runway_months: trueCash && parseNumber(formData.monthly_operating_costs) 
          ? Math.round((trueCash.true_cash / parseNumber(formData.monthly_operating_costs)!) * 10) / 10
          : null,
      };

      if (existingData?.id) {
        // Update existing
        const { error } = await supabase
          .from('ma_financial_data')
          .update(dataToSave)
          .eq('id', existingData.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('ma_financial_data')
          .insert(dataToSave);
        
        if (error) throw error;
      }

      setSaved(true);
      onSave();
    } catch (error: any) {
      console.error('[FinancialDataEntry] Error saving:', error);
      alert('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(value);

  const InputField = ({ 
    label, 
    field, 
    placeholder = '0',
    prefix = '£'
  }: { 
    label: string; 
    field: keyof FormData; 
    placeholder?: string;
    prefix?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{prefix}</span>
        )}
        <input
          type="text"
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-8' : 'pl-3'} pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* True Cash Preview Card */}
      {trueCash && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">True Cash Position</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(trueCash.true_cash)}</p>
              <p className="text-emerald-100 text-sm mt-2">
                Bank balance {formatCurrency(trueCash.bank_balance)} minus liabilities
              </p>
            </div>
            <Calculator className="h-10 w-10 text-emerald-200" />
          </div>
          
          {/* True Cash Breakdown */}
          <div className="mt-4 pt-4 border-t border-emerald-500/30 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-emerald-200">VAT Owed</p>
              <p className="font-semibold">-{formatCurrency(trueCash.vat_provision)}</p>
            </div>
            <div>
              <p className="text-emerald-200">PAYE/NI Due</p>
              <p className="font-semibold">-{formatCurrency(trueCash.paye_ni)}</p>
            </div>
            <div>
              <p className="text-emerald-200">Corp Tax</p>
              <p className="font-semibold">-{formatCurrency(trueCash.corporation_tax)}</p>
            </div>
            <div>
              <p className="text-emerald-200">Committed</p>
              <p className="font-semibold">-{formatCurrency(trueCash.committed_payments)}</p>
            </div>
            <div>
              <p className="text-emerald-200">Receivables</p>
              <p className="font-semibold text-emerald-300">+{formatCurrency(trueCash.confirmed_receivables)}</p>
            </div>
            {parseNumber(formData.monthly_operating_costs) && (
              <div>
                <p className="text-emerald-200">Runway</p>
                <p className="font-semibold">
                  {Math.round((trueCash.true_cash / parseNumber(formData.monthly_operating_costs)!) * 10) / 10} months
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* P&L Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('pnl')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">Profit & Loss</h3>
              <p className="text-sm text-slate-500">Revenue, costs, and profitability</p>
            </div>
          </div>
          {expandedSections.pnl ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>
        
        {expandedSections.pnl && (
          <div className="px-6 pb-6 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <InputField label="Revenue" field="revenue" />
              <InputField label="Cost of Sales" field="cost_of_sales" />
              <InputField label="Gross Profit" field="gross_profit" />
              <InputField label="Overheads" field="overheads" />
              <InputField label="Operating Profit" field="operating_profit" />
              <InputField label="Net Profit" field="net_profit" />
            </div>
          </div>
        )}
      </div>

      {/* Cash Position Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('cash')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <PoundSterling className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">Cash Position & Liabilities</h3>
              <p className="text-sm text-slate-500">Bank balance, VAT, PAYE, and tax provisions</p>
            </div>
          </div>
          {expandedSections.cash ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>
        
        {expandedSections.cash && (
          <div className="px-6 pb-6 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-2 lg:col-span-3">
                <InputField label="Cash at Bank" field="cash_at_bank" />
              </div>
              <InputField label="VAT Liability" field="vat_liability" />
              <InputField label="PAYE/NI Liability" field="paye_liability" />
              <InputField label="Corporation Tax Provision" field="corporation_tax_liability" />
              <InputField label="Trade Creditors" field="trade_creditors" />
              <InputField label="Trade Debtors" field="trade_debtors" />
              <InputField label="Committed Payments (7 days)" field="committed_payments" />
              <InputField label="Confirmed Receivables (7 days)" field="confirmed_receivables" />
            </div>
          </div>
        )}
      </div>

      {/* Operating Costs Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('operating')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">Operating Costs</h3>
              <p className="text-sm text-slate-500">Monthly burn rate and payroll</p>
            </div>
          </div>
          {expandedSections.operating ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>
        
        {expandedSections.operating && (
          <div className="px-6 pb-6 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <InputField label="Monthly Operating Costs (Burn Rate)" field="monthly_operating_costs" />
              <InputField label="Monthly Payroll Costs" field="payroll_costs" />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
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
              Save Financial Data
            </>
          )}
        </button>

        <button
          onClick={onContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Continue to KPIs →
        </button>
      </div>
    </div>
  );
}

export default FinancialDataEntry;

