import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Edit2,
  Save,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface FinancialData {
  id: string;
  fiscal_year: number;
  fiscal_year_end?: string;
  revenue?: number;
  cost_of_sales?: number;
  gross_profit?: number;
  gross_margin_pct?: number;
  operating_expenses?: number;
  ebitda?: number;
  ebitda_margin_pct?: number;
  depreciation?: number;
  amortisation?: number;
  interest_paid?: number;
  tax?: number;
  net_profit?: number;
  net_margin_pct?: number;
  debtors?: number;
  creditors?: number;
  cash?: number;
  debtor_days?: number;
  creditor_days?: number;
  employee_count?: number;
  revenue_per_employee?: number;
  confidence_score?: number;
  confirmed_at?: string;
  notes?: string;
}

interface FinancialDataReviewModalProps {
  data: FinancialData;
  previousYearData?: FinancialData;
  onClose: () => void;
  onConfirm: () => void;
}

type MetricKey = keyof FinancialData;

interface MetricConfig {
  label: string;
  format: 'currency' | 'percentage' | 'number' | 'days';
  key: MetricKey;
}

const METRIC_SECTIONS: { title: string; metrics: MetricConfig[] }[] = [
  {
    title: 'Profit & Loss',
    metrics: [
      { label: 'Revenue / Turnover', format: 'currency', key: 'revenue' },
      { label: 'Cost of Sales', format: 'currency', key: 'cost_of_sales' },
      { label: 'Gross Profit', format: 'currency', key: 'gross_profit' },
      { label: 'Gross Margin', format: 'percentage', key: 'gross_margin_pct' },
      { label: 'Operating Expenses', format: 'currency', key: 'operating_expenses' },
      { label: 'EBITDA', format: 'currency', key: 'ebitda' },
      { label: 'EBITDA Margin', format: 'percentage', key: 'ebitda_margin_pct' },
      { label: 'Depreciation', format: 'currency', key: 'depreciation' },
      { label: 'Amortisation', format: 'currency', key: 'amortisation' },
      { label: 'Interest Paid', format: 'currency', key: 'interest_paid' },
      { label: 'Tax', format: 'currency', key: 'tax' },
      { label: 'Net Profit', format: 'currency', key: 'net_profit' },
      { label: 'Net Margin', format: 'percentage', key: 'net_margin_pct' },
    ]
  },
  {
    title: 'Working Capital',
    metrics: [
      { label: 'Trade Debtors', format: 'currency', key: 'debtors' },
      { label: 'Trade Creditors', format: 'currency', key: 'creditors' },
      { label: 'Cash', format: 'currency', key: 'cash' },
      { label: 'Debtor Days', format: 'days', key: 'debtor_days' },
      { label: 'Creditor Days', format: 'days', key: 'creditor_days' },
    ]
  },
  {
    title: 'Operational',
    metrics: [
      { label: 'Employee Count', format: 'number', key: 'employee_count' },
      { label: 'Revenue per Employee', format: 'currency', key: 'revenue_per_employee' },
    ]
  }
];

export const FinancialDataReviewModal: React.FC<FinancialDataReviewModalProps> = ({
  data,
  previousYearData,
  onClose,
  onConfirm
}) => {
  const [editedData, setEditedData] = useState<Partial<FinancialData>>({});
  const [editingField, setEditingField] = useState<MetricKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Merge edited data with original
  const currentData = { ...data, ...editedData };

  const formatValue = (value: number | undefined, format: MetricConfig['format']): string => {
    if (value === undefined || value === null) return '—';
    
    switch (format) {
      case 'currency':
        return `£${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'days':
        return `${value} days`;
      case 'number':
        return value.toLocaleString();
      default:
        return String(value);
    }
  };

  const getYoYChange = (current: number | undefined, previous: number | undefined): { value: number; direction: 'up' | 'down' | 'flat' } | null => {
    if (current === undefined || previous === undefined || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 1 ? 'up' : change < -1 ? 'down' : 'flat'
    };
  };

  const handleEdit = (key: MetricKey, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setEditedData(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const recalculateDerived = () => {
    const updated = { ...editedData };
    
    // Recalculate gross profit
    if (currentData.revenue && currentData.cost_of_sales) {
      updated.gross_profit = currentData.revenue - currentData.cost_of_sales;
      updated.gross_margin_pct = Number(((updated.gross_profit / currentData.revenue) * 100).toFixed(1));
    }
    
    // Recalculate EBITDA margin
    if (currentData.revenue && currentData.ebitda) {
      updated.ebitda_margin_pct = Number(((currentData.ebitda / currentData.revenue) * 100).toFixed(1));
    }
    
    // Recalculate net margin
    if (currentData.revenue && currentData.net_profit) {
      updated.net_margin_pct = Number(((currentData.net_profit / currentData.revenue) * 100).toFixed(1));
    }
    
    // Recalculate revenue per employee
    if (currentData.revenue && currentData.employee_count && currentData.employee_count > 0) {
      updated.revenue_per_employee = Math.round(currentData.revenue / currentData.employee_count);
    }
    
    // Recalculate debtor days
    if (currentData.revenue && currentData.debtors) {
      updated.debtor_days = Math.round((currentData.debtors / currentData.revenue) * 365);
    }
    
    setEditedData(updated);
  };

  useEffect(() => {
    if (Object.keys(editedData).length > 0) {
      recalculateDerived();
    }
  }, [editedData.revenue, editedData.cost_of_sales, editedData.ebitda, editedData.net_profit, editedData.employee_count, editedData.debtors]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update financial data
      const { error: updateError } = await supabase
        .from('client_financial_data')
        .update({
          ...editedData,
          manually_adjusted: Object.keys(editedData).length > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      // Log changes to audit table
      if (Object.keys(editedData).length > 0) {
        const auditRecords = Object.entries(editedData).map(([field, newValue]) => ({
          financial_data_id: data.id,
          field_name: field,
          old_value: String(data[field as MetricKey] ?? ''),
          new_value: String(newValue ?? ''),
          reason: 'Manual review correction'
        }));

        await supabase.from('client_financial_data_audit').insert(auditRecords);
      }

      onConfirm();
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);

    try {
      const { error: confirmError } = await supabase
        .from('client_financial_data')
        .update({
          ...editedData,
          manually_adjusted: Object.keys(editedData).length > 0,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (confirmError) throw confirmError;
      onConfirm();
    } catch (err) {
      console.error('Confirm error:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm data');
    } finally {
      setSaving(false);
    }
  };

  const confidenceColor = (score?: number) => {
    if (!score) return 'text-slate-400';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Review Financial Data - FY{data.fiscal_year}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review and confirm the extracted data before using in analysis
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Confidence Score */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Extraction Confidence</p>
              <p className={`text-2xl font-bold ${confidenceColor(data.confidence_score)}`}>
                {data.confidence_score ? `${Math.round(data.confidence_score * 100)}%` : 'Unknown'}
              </p>
            </div>
            {data.notes && (
              <div className="flex-1 ml-6">
                <p className="text-sm text-slate-600 mb-1">Notes:</p>
                <p className="text-sm text-slate-700">{data.notes}</p>
              </div>
            )}
          </div>

          {/* Metric Sections */}
          {METRIC_SECTIONS.map(section => (
            <div key={section.title} className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">{section.title}</h3>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-sm">
                      <th className="text-left py-2 px-4 font-medium text-slate-600">Metric</th>
                      <th className="text-right py-2 px-4 font-medium text-slate-600">Value</th>
                      {previousYearData && (
                        <>
                          <th className="text-right py-2 px-4 font-medium text-slate-600">
                            FY{previousYearData.fiscal_year}
                          </th>
                          <th className="text-center py-2 px-4 font-medium text-slate-600">YoY</th>
                        </>
                      )}
                      <th className="text-center py-2 px-4 font-medium text-slate-600 w-20">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.metrics.map(metric => {
                      const value = currentData[metric.key] as number | undefined;
                      const prevValue = previousYearData?.[metric.key] as number | undefined;
                      const yoyChange = getYoYChange(value, prevValue);
                      const isEditing = editingField === metric.key;
                      const hasBeenEdited = metric.key in editedData;

                      return (
                        <tr key={metric.key} className="border-t border-slate-100">
                          <td className="py-2 px-4 text-slate-700">{metric.label}</td>
                          <td className="py-2 px-4 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step={metric.format === 'percentage' ? '0.1' : '1'}
                                value={value ?? ''}
                                onChange={(e) => handleEdit(metric.key, e.target.value)}
                                onBlur={() => setEditingField(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                                autoFocus
                                className="w-32 px-2 py-1 border border-blue-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <span className={`font-medium ${hasBeenEdited ? 'text-blue-600' : 'text-slate-800'}`}>
                                {formatValue(value, metric.format)}
                                {hasBeenEdited && <span className="ml-1 text-xs">✎</span>}
                              </span>
                            )}
                          </td>
                          {previousYearData && (
                            <>
                              <td className="py-2 px-4 text-right text-slate-500">
                                {formatValue(prevValue, metric.format)}
                              </td>
                              <td className="py-2 px-4 text-center">
                                {yoyChange && (
                                  <span className={`inline-flex items-center gap-1 text-sm ${
                                    yoyChange.direction === 'up' ? 'text-green-600' :
                                    yoyChange.direction === 'down' ? 'text-red-600' :
                                    'text-slate-400'
                                  }`}>
                                    {yoyChange.direction === 'up' && <TrendingUp className="w-4 h-4" />}
                                    {yoyChange.direction === 'down' && <TrendingDown className="w-4 h-4" />}
                                    {yoyChange.direction === 'flat' && <Minus className="w-4 h-4" />}
                                    {yoyChange.value.toFixed(1)}%
                                  </span>
                                )}
                              </td>
                            </>
                          )}
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => setEditingField(metric.key)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {Object.keys(editedData).length > 0 ? (
              <span className="text-blue-600">
                {Object.keys(editedData).length} field(s) modified
              </span>
            ) : (
              <span>Click values to edit if needed</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            {Object.keys(editedData).length > 0 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            )}
            
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


