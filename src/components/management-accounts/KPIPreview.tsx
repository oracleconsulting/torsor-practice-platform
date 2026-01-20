'use client';

import { useState } from 'react';
import { Check, Target, TrendingUp, DollarSign, Users, Clock, Lock, ChevronUp, Sparkles } from 'lucide-react';

interface KPIRecommendation {
  kpi_code: string;
  name: string;
  category: string;
  description: string;
  rationale?: string;
  priority?: number;
}

interface KPIPreviewProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
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
const TIER_KPIS: Record<string, string[]> = {
  bronze: ['true_cash', 'debtor_days', 'operating_margin'],
  silver: ['true_cash', 'debtor_days', 'operating_margin', 'revenue_per_employee', 'client_concentration'],
  gold: ['true_cash', 'debtor_days', 'cash_conversion_cycle', 'operating_margin', 'gross_margin', 'revenue_per_employee', 'client_concentration', 'billable_utilisation'],
  platinum: ALL_KPIS.map(k => k.kpi_code), // All KPIs
};

const TIER_INFO: Record<string, { name: string; limit: number; color: string; price: string }> = {
  bronze: { name: 'Bronze', limit: 3, color: 'amber', price: '£750' },
  silver: { name: 'Silver', limit: 5, color: 'slate', price: '£1,500' },
  gold: { name: 'Gold', limit: 8, color: 'yellow', price: '£3,000' },
  platinum: { name: 'Platinum', limit: 999, color: 'violet', price: '£5,000' },
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

type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

export function KPIPreview({ tier, recommendations: _recommendations, onUpgrade }: KPIPreviewProps) {
  // Note: _recommendations can be used in future to override default KPIs with AI-suggested ones
  const [selectedTier, setSelectedTier] = useState<TierKey>(tier);
  const [showAllKPIs, setShowAllKPIs] = useState(false);
  
  const tierOrder: TierKey[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentTierIndex = tierOrder.indexOf(tier);
  
  // Get KPIs available at the selected tier
  const availableKpiCodes = new Set(TIER_KPIS[selectedTier] || []);
  
  // Get KPIs available at the recommended tier
  const recommendedKpiCodes = new Set(TIER_KPIS[tier] || []);
  
  // Group all KPIs by category
  const kpisByCategory: Record<string, KPIRecommendation[]> = {};
  ALL_KPIS.forEach(kpi => {
    if (!kpisByCategory[kpi.category]) {
      kpisByCategory[kpi.category] = [];
    }
    kpisByCategory[kpi.category].push(kpi);
  });

  // Calculate unlocked counts
  const unlockedCount = ALL_KPIS.filter(k => availableKpiCodes.has(k.kpi_code)).length;
  const totalCount = ALL_KPIS.length;
  
  // Next tier info
  const nextTierIndex = Math.min(currentTierIndex + 1, tierOrder.length - 1);
  const nextTier = tierOrder[nextTierIndex];
  const nextTierInfo = TIER_INFO[nextTier];
  const nextTierKpis = new Set(TIER_KPIS[nextTier] || []);
  const additionalKpisInNextTier = [...nextTierKpis].filter(code => !recommendedKpiCodes.has(code));

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Your KPI Dashboard
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              The metrics we'll track to answer your questions
            </p>
          </div>
        </div>
      </div>

      {/* Tier Selector */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Compare KPI access by tier
        </p>
        <div className="grid grid-cols-4 gap-2">
          {tierOrder.map((t) => {
            const info = TIER_INFO[t];
            const isSelected = selectedTier === t;
            const isRecommended = t === tier;
            
            return (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded-full whitespace-nowrap">
                    Recommended
                  </span>
                )}
                <p className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                  {info.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t === 'platinum' ? 'Unlimited' : `${info.limit} KPIs`}
                </p>
                <p className={`text-sm font-bold mt-1 ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>
                  {info.price}<span className="text-xs font-normal">/mo</span>
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Count Summary */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-slate-800">{unlockedCount} KPIs included</span>
          </div>
          {selectedTier !== 'platinum' && (
            <div className="flex items-center gap-2 text-slate-400">
              <Lock className="h-4 w-4" />
              <span className="text-sm">{totalCount - unlockedCount} more available with upgrade</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAllKPIs(!showAllKPIs)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {showAllKPIs ? 'Show included only' : 'Show all KPIs'}
          <ChevronUp className={`h-4 w-4 transition-transform ${showAllKPIs ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <div className="p-6">
        {/* KPI Grid */}
        <div className="space-y-4">
          {Object.entries(kpisByCategory).map(([category, categoryKpis]) => {
            const includedKpis = categoryKpis.filter(k => availableKpiCodes.has(k.kpi_code));
            const lockedKpis = categoryKpis.filter(k => !availableKpiCodes.has(k.kpi_code));
            
            // Skip categories with no included KPIs if not showing all
            if (!showAllKPIs && includedKpis.length === 0) return null;
            
            return (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-700'}`}>
                    {CATEGORY_ICONS[category]}
                    {category}
                  </div>
                  <span className="text-xs text-slate-400">
                    {includedKpis.length} of {categoryKpis.length} included
                  </span>
                </div>
                
                {/* KPIs in category */}
                <div className="grid sm:grid-cols-2 gap-2 ml-2">
                  {/* Included KPIs */}
                  {includedKpis.map((kpi) => (
                    <div 
                      key={kpi.kpi_code}
                      className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-slate-800">{kpi.name}</p>
                        <p className="text-xs text-slate-500">{kpi.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Locked KPIs - only show if showAllKPIs is true */}
                  {showAllKPIs && lockedKpis.map((kpi) => {
                    // Find which tier unlocks this KPI
                    const unlockTier = tierOrder.find(t => TIER_KPIS[t].includes(kpi.kpi_code));
                    
                    return (
                      <div 
                        key={kpi.kpi_code}
                        className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg opacity-60"
                      >
                        <Lock className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-slate-500">{kpi.name}</p>
                          <p className="text-xs text-slate-400">{kpi.description}</p>
                          {unlockTier && (
                            <p className="text-xs text-blue-500 mt-1">
                              Unlocks with {TIER_INFO[unlockTier].name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* What you'll see */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-3">What you'll see each month:</p>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600">Green = On track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-600">Amber = Needs attention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600">Red = Action required</span>
            </div>
          </div>
        </div>

        {/* Upgrade prompt - only show if not at platinum and viewing recommended tier */}
        {tier !== 'platinum' && selectedTier === tier && additionalKpisInNextTier.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">
                  Unlock {additionalKpisInNextTier.length} more KPIs with {nextTierInfo.name}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Including: {ALL_KPIS.filter(k => additionalKpisInNextTier.includes(k.kpi_code)).map(k => k.name).slice(0, 3).join(', ')}
                  {additionalKpisInNextTier.length > 3 && ` and ${additionalKpisInNextTier.length - 3} more`}
                </p>
                {onUpgrade && (
                  <button 
                    onClick={() => onUpgrade(nextTier)}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Explore {nextTierInfo.name} ({nextTierInfo.price}/mo)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customization note */}
        <p className="mt-4 text-xs text-slate-500 text-center">
          You can customize which KPIs you track during onboarding
        </p>
      </div>
    </div>
  );
}

export default KPIPreview;
