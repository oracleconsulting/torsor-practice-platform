'use client';

import { useState, useMemo } from 'react';
import { Check, Plus, X, Info, Lock, ChevronDown, ChevronUp, Search } from 'lucide-react';

// KPI Definition type matching database schema
interface KPIDefinition {
  code: string;
  name: string;
  category: string;
  description: string;
  calculation_notes: string;
  good_for: string;
  unit: 'currency' | 'percentage' | 'days' | 'ratio' | 'number';
  decimal_places: number;
  higher_is_better: boolean | null;
  default_target: number | null;
  industry_benchmarks: Record<string, number>;
  is_mandatory: boolean;
  display_order: number;
}

interface KPISelection {
  kpi_code: string;
  display_order: number;
  custom_target: number | null;
  is_mandatory: boolean;
}

interface KPISelectorProps {
  availableKPIs: KPIDefinition[];
  selectedKPIs: KPISelection[];
  maxKPIs: number;
  tier: 'clarity' | 'foresight' | 'strategic';
  industryType?: string;
  onSelectionChange: (selections: KPISelection[]) => void;
  onUpgradeClick?: () => void;
}

const CATEGORY_ORDER = [
  'Cash & Working Capital',
  'Revenue & Growth',
  'Profitability',
  'Utilisation & Efficiency',
  'Client Health',
];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function KPISelector({
  availableKPIs,
  selectedKPIs,
  maxKPIs,
  tier,
  industryType,
  onSelectionChange,
  onUpgradeClick,
}: KPISelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfo, setShowInfo] = useState<string | null>(null);

  // Group KPIs by category
  const kpisByCategory = useMemo(() => {
    const grouped: Record<string, KPIDefinition[]> = {};
    
    availableKPIs.forEach(kpi => {
      if (!grouped[kpi.category]) {
        grouped[kpi.category] = [];
      }
      grouped[kpi.category].push(kpi);
    });
    
    // Sort each category by display_order
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => a.display_order - b.display_order);
    });
    
    return grouped;
  }, [availableKPIs]);

  // Filter KPIs based on search
  const filteredKPIs = useMemo(() => {
    if (!searchQuery.trim()) return kpisByCategory;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, KPIDefinition[]> = {};
    
    Object.entries(kpisByCategory).forEach(([category, kpis]) => {
      const matching = kpis.filter(kpi => 
        kpi.name.toLowerCase().includes(query) ||
        kpi.description.toLowerCase().includes(query) ||
        kpi.good_for.toLowerCase().includes(query)
      );
      if (matching.length > 0) {
        filtered[category] = matching;
      }
    });
    
    return filtered;
  }, [kpisByCategory, searchQuery]);

  // Count selections
  const selectedCount = selectedKPIs.length;
  const remainingSlots = maxKPIs - selectedCount;
  const canAddMore = remainingSlots > 0 || maxKPIs === 999; // 999 = unlimited (platinum)

  // Check if a KPI is selected
  const isSelected = (code: string) => selectedKPIs.some(s => s.kpi_code === code);
  
  // Check if a KPI is mandatory
  const isMandatory = (code: string) => {
    const kpi = availableKPIs.find(k => k.code === code);
    return kpi?.is_mandatory || false;
  };

  // Handle adding a KPI
  const handleAdd = (kpi: KPIDefinition) => {
    if (!canAddMore && !isMandatory(kpi.code)) return;
    
    const newSelection: KPISelection = {
      kpi_code: kpi.code,
      display_order: selectedKPIs.length + 1,
      custom_target: null,
      is_mandatory: kpi.is_mandatory,
    };
    
    onSelectionChange([...selectedKPIs, newSelection]);
  };

  // Handle removing a KPI
  const handleRemove = (code: string) => {
    if (isMandatory(code)) return; // Can't remove mandatory KPIs
    
    const updated = selectedKPIs
      .filter(s => s.kpi_code !== code)
      .map((s, i) => ({ ...s, display_order: i + 1 }));
    
    onSelectionChange(updated);
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Format benchmark value for display
  const formatBenchmark = (kpi: KPIDefinition) => {
    if (!industryType || !kpi.industry_benchmarks[industryType]) return null;
    const value = kpi.industry_benchmarks[industryType];
    
    switch (kpi.unit) {
      case 'currency':
        return `£${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'days':
        return `${value} days`;
      case 'ratio':
        return `${value}:1`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Your KPI Dashboard</h2>
            <p className="text-slate-600 mt-1">
              You can track up to <span className="font-semibold">{maxKPIs === 999 ? 'unlimited' : maxKPIs}</span> KPIs on your {tier.charAt(0).toUpperCase() + tier.slice(1)} package.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {selectedCount} / {maxKPIs === 999 ? '∞' : maxKPIs}
            </div>
            <p className="text-sm text-slate-500">KPIs selected</p>
          </div>
        </div>

        {/* Selected KPIs */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Your Current KPIs ({selectedCount} of {maxKPIs === 999 ? '∞' : maxKPIs} selected)
          </h3>
          
          <div className="space-y-2">
            {selectedKPIs.map((selection) => {
              const kpi = availableKPIs.find(k => k.code === selection.kpi_code);
              if (!kpi) return null;
              
              return (
                <div 
                  key={selection.kpi_code}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    selection.is_mandatory ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      selection.is_mandatory ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                    )}>
                      {selection.display_order}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{kpi.name}</p>
                      <p className="text-xs text-slate-500">{kpi.category}</p>
                    </div>
                  </div>
                  
                  {selection.is_mandatory ? (
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Mandatory
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRemove(selection.kpi_code)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              );
            })}
            
            {selectedCount === 0 && (
              <p className="text-slate-500 text-center py-4">
                No KPIs selected yet. Choose from the options below.
              </p>
            )}
          </div>
        </div>

        {/* Upgrade prompt if at limit */}
        {!canAddMore && maxKPIs !== 999 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-800">Want to track more KPIs?</p>
              <p className="text-sm text-amber-700">
                Upgrade to {tier === 'clarity' ? 'Foresight (8 KPIs)' : 'Strategic (unlimited)'} for more insights.
              </p>
            </div>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Upgrade
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search KPIs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Available KPIs by Category */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-700">Available KPIs</h3>
        
        {CATEGORY_ORDER.map(category => {
          const kpis = filteredKPIs[category];
          if (!kpis || kpis.length === 0) return null;
          
          const isExpanded = expandedCategories.has(category);
          const selectedInCategory = kpis.filter(k => isSelected(k.code)).length;
          
          return (
            <div key={category} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">{category}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {selectedInCategory}/{kpis.length} selected
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              
              {/* Category KPIs */}
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {kpis.map(kpi => {
                    const selected = isSelected(kpi.code);
                    const mandatory = isMandatory(kpi.code);
                    const benchmark = formatBenchmark(kpi);
                    const showingInfo = showInfo === kpi.code;
                    
                    return (
                      <div 
                        key={kpi.code}
                        className={cn(
                          "p-4",
                          selected && "bg-green-50",
                          mandatory && selected && "bg-blue-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-800">{kpi.name}</h4>
                              {mandatory && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Mandatory
                                </span>
                              )}
                              {benchmark && tier !== 'clarity' && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  Benchmark: {benchmark}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{kpi.description}</p>
                            
                            {/* Good for */}
                            <p className="text-xs text-slate-500 mt-2">
                              <span className="font-medium">Good for:</span> {kpi.good_for}
                            </p>
                            
                            {/* Expanded info */}
                            {showingInfo && (
                              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
                                <p className="font-medium text-slate-700 mb-1">How it's calculated:</p>
                                <p className="text-slate-600">{kpi.calculation_notes}</p>
                                {kpi.default_target && (
                                  <p className="mt-2">
                                    <span className="font-medium">Default target:</span>{' '}
                                    {kpi.unit === 'percentage' ? `${kpi.default_target}%` : 
                                     kpi.unit === 'currency' ? `£${kpi.default_target.toLocaleString()}` :
                                     kpi.unit === 'days' ? `${kpi.default_target} days` :
                                     kpi.default_target}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowInfo(showingInfo ? null : kpi.code)}
                              className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                            >
                              <Info className="h-5 w-5" />
                            </button>
                            
                            {selected ? (
                              mandatory ? (
                                <span className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                  <Lock className="h-4 w-4" />
                                  Included
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRemove(kpi.code)}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                >
                                  Remove
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleAdd(kpi)}
                                disabled={!canAddMore}
                                className={cn(
                                  "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors",
                                  canAddMore
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                )}
                              >
                                <Plus className="h-4 w-4" />
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-sm text-slate-500">
        Changes take effect from your next report. You can adjust your KPIs quarterly.
      </p>
    </div>
  );
}

export default KPISelector;

