'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Star,
  StarOff,
  TrendingUp,
  TrendingDown,
  Calculator,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ScenarioEditor } from './ScenarioEditor';
import type { MAScenario } from '../../../types/ma-dashboard';

interface ScenarioManagerProps {
  engagementId: string;
  periodId: string;
  currentCash: number;
  monthlyBurn: number;
  onScenariosChange?: (scenarios: MAScenario[]) => void;
}

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1000) {
    return `£${(value / 1000).toFixed(0)}k`;
  }
  return `£${value.toLocaleString()}`;
};

export function ScenarioManager({
  engagementId,
  periodId,
  currentCash,
  monthlyBurn,
  onScenariosChange,
}: ScenarioManagerProps) {
  const [scenarios, setScenarios] = useState<MAScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScenario, setEditingScenario] = useState<MAScenario | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  useEffect(() => {
    loadScenarios();
  }, [engagementId, periodId]);

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('ma_scenarios')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScenarios(data || []);
      onScenariosChange?.(data || []);
    } catch (err) {
      console.error('[ScenarioManager] Error loading scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScenario = (scenario: MAScenario) => {
    setScenarios(prev => {
      const existing = prev.findIndex(s => s.id === scenario.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = scenario;
        onScenariosChange?.(updated);
        return updated;
      }
      const updated = [scenario, ...prev];
      onScenariosChange?.(updated);
      return updated;
    });
    setShowEditor(false);
    setEditingScenario(null);
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from('ma_scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setScenarios(prev => {
        const updated = prev.filter(s => s.id !== id);
        onScenariosChange?.(updated);
        return updated;
      });
    } catch (err) {
      console.error('[ScenarioManager] Error deleting scenario:', err);
      alert('Failed to delete scenario');
    } finally {
      setDeleting(null);
    }
  };

  const toggleFeatured = async (scenario: MAScenario) => {
    try {
      const { error } = await supabase
        .from('ma_scenarios')
        .update({ is_featured: !scenario.is_featured })
        .eq('id', scenario.id);

      if (error) throw error;
      setScenarios(prev => {
        const updated = prev.map(s =>
          s.id === scenario.id ? { ...s, is_featured: !s.is_featured } : s
        );
        onScenariosChange?.(updated);
        return updated;
      });
    } catch (err) {
      console.error('[ScenarioManager] Error toggling featured:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-slate-500">Loading scenarios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Scenario Modeling</h3>
          <p className="text-sm text-slate-500">Create "what if" scenarios to model business decisions</p>
        </div>
        <button
          onClick={() => {
            setEditingScenario(null);
            setShowEditor(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Scenario
        </button>
      </div>

      {/* Scenarios List */}
      {scenarios.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
          <Calculator className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h4 className="font-semibold text-slate-700 mb-2">No Scenarios Yet</h4>
          <p className="text-slate-500 mb-4">
            Create scenarios to model hiring decisions, revenue changes, or investments.
          </p>
          <button
            onClick={() => {
              setEditingScenario(null);
              setShowEditor(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Scenario
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => {
            const isExpanded = expandedScenario === scenario.id;
            const hasPositiveImpact = (scenario.impact_on_cash || 0) >= 0;
            
            return (
              <div
                key={scenario.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                {/* Scenario Header */}
                <div className="p-4 flex items-start gap-4">
                  {/* Color Badge */}
                  <div
                    className="w-4 h-full min-h-[60px] rounded-l-lg -ml-4 -my-4 mr-0"
                    style={{ backgroundColor: scenario.scenario_color }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800">{scenario.name}</h4>
                      {scenario.is_featured && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                          Featured
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                        {scenario.scenario_type}
                      </span>
                    </div>
                    {scenario.description && (
                      <p className="text-sm text-slate-500 line-clamp-1">{scenario.description}</p>
                    )}
                    
                    {/* Impact Summary */}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        {hasPositiveImpact ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          hasPositiveImpact ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {hasPositiveImpact ? '+' : ''}{formatCurrency(scenario.impact_on_cash || 0)} cash
                        </span>
                      </div>
                      {scenario.impact_on_runway !== undefined && (
                        <span className={`text-sm ${
                          (scenario.impact_on_runway || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {(scenario.impact_on_runway || 0) >= 0 ? '+' : ''}
                          {(scenario.impact_on_runway || 0).toFixed(1)} months runway
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFeatured(scenario)}
                      className={`p-2 rounded-lg transition-colors ${
                        scenario.is_featured
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={scenario.is_featured ? 'Remove from dashboard' : 'Show on dashboard'}
                    >
                      {scenario.is_featured ? (
                        <Star className="w-5 h-5 fill-current" />
                      ) : (
                        <StarOff className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingScenario(scenario);
                        setShowEditor(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit scenario"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(scenario.id)}
                      disabled={deleting === scenario.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete scenario"
                    >
                      {deleting === scenario.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setExpandedScenario(isExpanded ? null : scenario.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-slate-700 mb-3">Assumptions</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(scenario.assumptions || {}).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-slate-500 mb-0.5">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                            </p>
                            <p className="font-medium text-slate-800">
                              {typeof value === 'boolean' 
                                ? (value ? 'Yes' : 'No')
                                : typeof value === 'number' && key.toLowerCase().includes('salary') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('rate')
                                  ? `£${value.toLocaleString()}`
                                  : typeof value === 'number' && key.toLowerCase().includes('percent')
                                    ? `${value}%`
                                    : String(value)
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      {scenario.impact_summary && (
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <p className="text-sm text-slate-600">{scenario.impact_summary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <ScenarioEditor
          engagementId={engagementId}
          periodId={periodId}
          scenario={editingScenario}
          onSave={handleSaveScenario}
          onClose={() => {
            setShowEditor(false);
            setEditingScenario(null);
          }}
          currentCash={currentCash}
          monthlyBurn={monthlyBurn}
        />
      )}
    </div>
  );
}

