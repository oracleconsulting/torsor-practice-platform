'use client';

import { useState } from 'react';
import { Check, Target, TrendingUp, DollarSign, Users, Clock, Lock, ChevronUp, Sparkles } from 'lucide-react';
import { getPriceRange } from '../../types/ma';
import type { TierType } from '../../types/ma';

interface KPIRecommendation {
  kpi_code: string;
  name: string;
  category: string;
  description: string;
  rationale?: string;
  priority?: number;
}

interface KPIPreviewProps {
  tier: TierType;
  recommendations?: KPIRecommendation[];
  onUpgrade?: (tier: string) => void;
}

// All available KPIs organized by category
const ALL_KPIS: KPIRecommendation[] = [
  // Cash & Working Capital
  { kpi_code: 'true_cash', name: 'True Cash Position', category: 'Cash & Working Capital', description: 'Actual available cash after all commitments' },
  { kpi_code: 'debtor_days', name: 'Debtor Days', category: 'Cash & Working Capital', description: 'Average time to collect payment' },
  { kpi_code: 'creditor_days', name: 'Creditor Days', category: 'Cash & Working Capital', description: 'Supplier payment timing' },
  { kpi_code: 'cash_conversion_cycle', name: 'Cash Conversion Cycle', category: 'Cash & Working Capital', description: 'Working capital efficiency' },
  { kpi_code: 'working_capital_ratio', name: 'Working Capital Ratio', category: 'Cash & Working Capital', description: 'Current assets vs liabilities' },
  
  // Revenue & Growth
  { kpi_code: 'monthly_revenue', name: 'Monthly Revenue', category: 'Revenue & Growth', description: 'Total monthly turnover' },
  { kpi_code: 'yoy_revenue_growth', name: 'Year-on-Year Growth', category: 'Revenue & Growth', description: 'Growth trajectory vs last year' },
  { kpi_code: 'revenue_per_employee', name: 'Revenue per Employee', category: 'Revenue & Growth', description: 'Productivity measure' },
  { kpi_code: 'avg_project_value', name: 'Average Project Value', category: 'Revenue & Growth', description: 'Average client engagement size' },
  { kpi_code: 'recurring_revenue_pct', name: 'Recurring Revenue %', category: 'Revenue & Growth', description: 'Predictable income ratio' },
  
  // Profitability
  { kpi_code: 'gross_margin', name: 'Gross Margin', category: 'Profitability', description: 'Core service profitability' },
  { kpi_code: 'operating_margin', name: 'Operating Margin', category: 'Profitability', description: 'Profitability from operations' },
  { kpi_code: 'net_margin', name: 'Net Margin', category: 'Profitability', description: 'Bottom line profitability' },
  { kpi_code: 'revenue_per_salary', name: 'Revenue per £ Salary', category: 'Profitability', description: 'Return on people investment' },
  { kpi_code: 'overhead_pct', name: 'Overhead %', category: 'Profitability', description: 'Non-direct cost burden' },
  
  // Utilisation & Efficiency
  { kpi_code: 'billable_utilisation', name: 'Billable Utilisation', category: 'Utilisation & Efficiency', description: 'Team productivity' },
  { kpi_code: 'effective_hourly_rate', name: 'Effective Hourly Rate', category: 'Utilisation & Efficiency', description: 'Actual rate realised' },
  { kpi_code: 'wip_value', name: 'Work in Progress', category: 'Utilisation & Efficiency', description: 'Unbilled work value' },
  { kpi_code: 'project_margin', name: 'Project Margin', category: 'Utilisation & Efficiency', description: 'Profitability by project' },
  
  // Client Health
  { kpi_code: 'client_concentration', name: 'Client Concentration', category: 'Client Health', description: 'Dependency on key clients' },
  { kpi_code: 'client_retention', name: 'Client Retention', category: 'Client Health', description: 'Year-on-year client loyalty' },
  { kpi_code: 'client_lifetime_value', name: 'Client Lifetime Value', category: 'Client Health', description: 'Total expected value' },
  { kpi_code: 'new_client_revenue_pct', name: 'New Client Revenue %', category: 'Client Health', description: 'Business development balance' },
];

// Which KPIs are available at each tier
const TIER_KPIS: Record<TierType, string[]> = {
  clarity: ['true_cash', 'debtor_days', 'gross_margin', 'operating_margin', 'monthly_revenue'],
  foresight: ['true_cash', 'debtor_days', 'cash_conversion_cycle', 'gross_margin', 'operating_margin', 'monthly_revenue', 'revenue_per_employee', 'client_concentration'],
  strategic: ALL_KPIS.map(k => k.kpi_code), // All KPIs
};

const TIER_INFO: Record<TierType, { name: string; limit: number; color: string; priceRange: string }> = {
  clarity: { name: 'Clarity', limit: 5, color: 'blue', priceRange: getPriceRange('clarity') },
  foresight: { name: 'Foresight', limit: 8, color: 'indigo', priceRange: getPriceRange('foresight') },
  strategic: { name: 'Strategic', limit: 999, color: 'purple', priceRange: getPriceRange('strategic') },
};

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Cash & Working Capital': <DollarSign className="h-4 w-4" />,
  'Revenue & Growth': <TrendingUp className="h-4 w-4" />,
  'Profitability': <Target className="h-4 w-4" />,
  'Utilisation & Efficiency': <Clock className="h-4 w-4" />,
  'Client Health': <Users className="h-4 w-4" />,
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Cash & Working Capital': 'bg-blue-100 text-blue-700 border-blue-200',
  'Revenue & Growth': 'bg-green-100 text-green-700 border-green-200',
  'Profitability': 'bg-purple-100 text-purple-700 border-purple-200',
  'Utilisation & Efficiency': 'bg-amber-100 text-amber-700 border-amber-200',
  'Client Health': 'bg-pink-100 text-pink-700 border-pink-200',
};

// Map legacy tier names to new tier names
const LEGACY_TIER_MAP: Record<string, TierType> = {
  'bronze': 'clarity',
  'silver': 'foresight', 
  'gold': 'strategic',
  'platinum': 'strategic',
  // New tiers map to themselves
  'clarity': 'clarity',
  'foresight': 'foresight',
  'strategic': 'strategic',
};

export function KPIPreview({ tier, recommendations: _recommendations, onUpgrade }: KPIPreviewProps) {
  // Note: _recommendations can be used in future to override default KPIs with AI-suggested ones
  // Map legacy tier names to new names
  const mappedTier = LEGACY_TIER_MAP[tier] || 'clarity';
  const [selectedTier, setSelectedTier] = useState<TierType>(mappedTier);
  const [showAllKPIs, setShowAllKPIs] = useState(false);
  
  const tierOrder: TierType[] = ['clarity', 'foresight', 'strategic'];
  const currentTierIndex = tierOrder.indexOf(mappedTier);
  
  // Get KPIs available at the selected tier (with fallback)
  const availableKpis = TIER_KPIS[selectedTier] || TIER_KPIS['clarity'];
  const selectedTierInfo = TIER_INFO[selectedTier] || TIER_INFO['clarity'];
  
  // Get KPIs for display (either available ones or all with locked state)
  const displayKpis = showAllKPIs 
    ? ALL_KPIS 
    : ALL_KPIS.filter(k => availableKpis.includes(k.kpi_code));
  
  // Group KPIs by category
  const kpisByCategory = displayKpis.reduce((acc, kpi) => {
    if (!acc[kpi.category]) acc[kpi.category] = [];
    acc[kpi.category].push(kpi);
    return acc;
  }, {} as Record<string, KPIRecommendation[]>);
  
  // Get additional KPIs available in next tier
  const nextTierIndex = tierOrder.indexOf(selectedTier) + 1;
  const nextTier = tierOrder[nextTierIndex];
  const additionalKpisInNextTier = nextTier 
    ? TIER_KPIS[nextTier].filter(k => !availableKpis.includes(k))
    : [];
  
  return (
    <div className="space-y-6">
      {/* Tier selector tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {tierOrder.map((t, i) => {
          const info = TIER_INFO[t];
          const isLocked = i > currentTierIndex;
          const isSelected = t === selectedTier;
          
          return (
            <button
              key={t}
              onClick={() => !isLocked && setSelectedTier(t)}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium transition-all relative
                ${isSelected 
                  ? `bg-${info.color}-600 text-white shadow-md` 
                  : isLocked 
                    ? 'bg-white/50 text-slate-400 cursor-not-allowed' 
                    : 'bg-white text-slate-700 hover:shadow'
                }
              `}
            >
              {isLocked && (
                <Lock className="absolute top-2 right-2 h-3 w-3 text-slate-400" />
              )}
              <p className="font-semibold">{info.name}</p>
              <p className="text-xs mt-0.5 opacity-80">
                {t === 'strategic' ? 'Unlimited' : `${info.limit} KPIs`}
              </p>
            </button>
          );
        })}
      </div>
      
      {/* Tier info bar */}
      <div className={`
        flex items-center justify-between p-4 rounded-xl border
        ${selectedTier === 'clarity' ? 'bg-blue-50 border-blue-200' : 
          selectedTier === 'foresight' ? 'bg-indigo-50 border-indigo-200' : 
          'bg-purple-50 border-purple-200'}
      `}>
        <div>
          <p className={`font-semibold ${
            selectedTier === 'clarity' ? 'text-blue-800' : 
            selectedTier === 'foresight' ? 'text-indigo-800' : 
            'text-purple-800'
          }`}>
            {selectedTierInfo.name} Tier
          </p>
          <p className={`text-sm ${
            selectedTier === 'clarity' ? 'text-blue-600' : 
            selectedTier === 'foresight' ? 'text-indigo-600' : 
            'text-purple-600'
          }`}>
            {selectedTierInfo.priceRange}
          </p>
        </div>
        {selectedTier !== 'strategic' && (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-sm">{availableKpis.length} of {ALL_KPIS.length} KPIs</span>
          </div>
        )}
      </div>
      
      {/* KPI categories */}
      <div className="space-y-4">
        {Object.entries(kpisByCategory).map(([category, kpis]) => (
          <div key={category} className="space-y-2">
            <div className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border
              ${CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-700 border-slate-200'}
            `}>
              {CATEGORY_ICONS[category]}
              <span className="font-medium text-sm">{category}</span>
              <span className="ml-auto text-xs opacity-75">{kpis.length} KPIs</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-2">
              {kpis.map(kpi => {
                const isAvailable = availableKpis.includes(kpi.kpi_code);
                
                return (
                  <div
                    key={kpi.kpi_code}
                    className={`
                      p-3 rounded-lg border transition-all
                      ${isAvailable 
                        ? 'bg-white border-slate-200 hover:border-slate-300' 
                        : 'bg-slate-50 border-slate-100 opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      {isAvailable ? (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isAvailable ? 'text-slate-800' : 'text-slate-500'}`}>
                          {kpi.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {kpi.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Show all KPIs toggle */}
      <button
        onClick={() => setShowAllKPIs(!showAllKPIs)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
      >
        {showAllKPIs ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Show only available KPIs
          </>
        ) : (
          <>
            Show all {ALL_KPIS.length} KPIs
            <ChevronUp className="h-4 w-4 rotate-180" />
          </>
        )}
      </button>

      {/* Upgrade prompt - only show if not at strategic and viewing recommended tier */}
      {tier !== 'strategic' && selectedTier === tier && additionalKpisInNextTier.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">
                Unlock {additionalKpisInNextTier.length} more KPIs with {TIER_INFO[nextTier].name}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Including {ALL_KPIS.find(k => k.kpi_code === additionalKpisInNextTier[0])?.name}
                {additionalKpisInNextTier.length > 1 && ` and ${additionalKpisInNextTier.length - 1} more`}
              </p>
              {onUpgrade && (
                <button
                  onClick={() => onUpgrade(nextTier)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Learn about {TIER_INFO[nextTier].name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KPIPreview;
