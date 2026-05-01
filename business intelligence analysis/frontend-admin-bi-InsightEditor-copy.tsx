'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  Info, 
  AlertCircle,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MAInsight, MAInsightType, TierType } from '../../types/business-intelligence';

interface InsightEditorProps {
  periodId: string;
  engagementTier: TierType;
  insight?: MAInsight; // If editing existing
  onSave: (insight: MAInsight) => void;
  onCancel: () => void;
}

const INSIGHT_TYPES: { value: MAInsightType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'observation', 
    label: 'Observation', 
    icon: <Info className="h-4 w-4" />,
    description: 'A neutral finding or note'
  },
  { 
    value: 'warning', 
    label: 'Warning', 
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Something concerning to monitor'
  },
  { 
    value: 'opportunity', 
    label: 'Opportunity', 
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'A positive finding or growth potential'
  },
  { 
    value: 'recommendation', 
    label: 'Recommendation', 
    icon: <Lightbulb className="h-4 w-4" />,
    description: 'Specific advice (Foresight+ only)'
  },
  { 
    value: 'action_required', 
    label: 'Action Required', 
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Urgent action needed from client'
  },
];

const CATEGORIES = [
  'Cash & Liquidity',
  'Profitability',
  'Revenue & Growth',
  'Working Capital',
  'Clients & Debtors',
  'Costs & Overheads',
  'Team & Capacity',
  'Compliance',
  'General',
];

export function InsightEditor({
  periodId,
  engagementTier,
  insight,
  onSave,
  onCancel
}: InsightEditorProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<MAInsight>>({
    insight_type: 'observation',
    category: 'General',
    title: '',
    description: '',
    recommendation: '',
    recommendation_priority: 'medium',
    recommendation_timing: '',
    min_tier: 'clarity',
    show_to_client: true,
    ...insight
  });

  const isEditing = !!insight;
  const canAddRecommendation = engagementTier !== 'clarity';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        const { data, error } = await supabase
          .from('ma_insights')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', insight.id)
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      } else {
        const { data, error } = await supabase
          .from('ma_insights')
          .insert({
            period_id: periodId,
            ...formData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        onSave(data);
      }
    } catch (error) {
      console.error('Error saving insight:', error);
      alert('Failed to save insight');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof MAInsight>(field: K, value: MAInsight[K]) => {
    setFormData((prev: Partial<MAInsight>) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? 'Edit Insight' : 'Add New Insight'}
            </h2>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Insight Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Insight Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INSIGHT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateField('insight_type', type.value)}
                  className={`
                    p-3 rounded-lg border text-left transition-all
                    ${formData.insight_type === type.value 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={formData.insight_type === type.value ? 'text-blue-600' : 'text-slate-500'}>
                      {type.icon}
                    </span>
                    <span className="font-medium text-sm text-slate-800">{type.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={formData.category || ''}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Brief, clear headline for this insight"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Explain the insight in detail. What did you find? Why does it matter?"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              rows={4}
              required
            />
          </div>

          {/* Metric Display (optional) */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Metric Value
              </label>
              <input
                type="number"
                value={formData.metric_value ?? ''}
                onChange={(e) => updateField('metric_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g. 45"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target/Comparison
              </label>
              <input
                type="number"
                value={formData.metric_comparison ?? ''}
                onChange={(e) => updateField('metric_comparison', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g. 30"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit
              </label>
              <select
                value={formData.metric_unit || ''}
                onChange={(e) => updateField('metric_unit', e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              >
                <option value="">None</option>
                <option value="currency">Currency (£)</option>
                <option value="percentage">Percentage (%)</option>
                <option value="number">Number</option>
              </select>
            </div>
          </div>

          {/* Recommendation (Foresight+ only) */}
          {canAddRecommendation && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
              <h4 className="font-medium text-blue-800 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recommendation (Foresight+ Feature)
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  What should the client do?
                </label>
                <textarea
                  value={formData.recommendation || ''}
                  onChange={(e) => updateField('recommendation', e.target.value)}
                  placeholder="Specific, actionable advice..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.recommendation_priority || 'medium'}
                    onChange={(e) => updateField('recommendation_priority', e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Timing
                  </label>
                  <input
                    type="text"
                    value={formData.recommendation_timing || ''}
                    onChange={(e) => updateField('recommendation_timing', e.target.value)}
                    placeholder="e.g. This week, Before month-end"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Visibility Settings */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.show_to_client ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-slate-400" />
              )}
              <div>
                <p className="font-medium text-sm text-slate-800">Client Visibility</p>
                <p className="text-xs text-slate-500">
                  {formData.show_to_client 
                    ? 'This insight will be shown to the client' 
                    : 'This insight is for internal use only'
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateField('show_to_client', !formData.show_to_client)}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                border-2 border-transparent transition-colors duration-200 ease-in-out
                ${formData.show_to_client ? 'bg-green-500' : 'bg-slate-300'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full 
                  bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${formData.show_to_client ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={saving || !formData.title || !formData.description}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : isEditing ? 'Update Insight' : 'Add Insight'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InsightEditor;

