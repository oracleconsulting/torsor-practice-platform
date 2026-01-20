'use client';

import { Check, Target, TrendingUp, DollarSign, Users, Clock } from 'lucide-react';

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
}

// Default KPI recommendations by tier if none provided
const DEFAULT_KPIS: Record<string, KPIRecommendation[]> = {
  bronze: [
    { kpi_code: 'true_cash', name: 'True Cash Position', category: 'Cash & Working Capital', description: 'Actual available cash after all commitments' },
    { kpi_code: 'debtor_days', name: 'Debtor Days', category: 'Cash & Working Capital', description: 'Average time to collect payment' },
    { kpi_code: 'operating_margin', name: 'Operating Margin', category: 'Profitability', description: 'Profitability from operations' },
  ],
  silver: [
    { kpi_code: 'true_cash', name: 'True Cash Position', category: 'Cash & Working Capital', description: 'Actual available cash after all commitments' },
    { kpi_code: 'debtor_days', name: 'Debtor Days', category: 'Cash & Working Capital', description: 'Average time to collect payment' },
    { kpi_code: 'operating_margin', name: 'Operating Margin', category: 'Profitability', description: 'Profitability from operations' },
    { kpi_code: 'revenue_per_employee', name: 'Revenue per Employee', category: 'Revenue & Growth', description: 'Productivity measure' },
    { kpi_code: 'client_concentration', name: 'Client Concentration', category: 'Client Health', description: 'Dependency on key clients' },
  ],
  gold: [
    { kpi_code: 'true_cash', name: 'True Cash Position', category: 'Cash & Working Capital', description: 'Actual available cash after all commitments' },
    { kpi_code: 'debtor_days', name: 'Debtor Days', category: 'Cash & Working Capital', description: 'Average time to collect payment' },
    { kpi_code: 'cash_conversion_cycle', name: 'Cash Conversion Cycle', category: 'Cash & Working Capital', description: 'Working capital efficiency' },
    { kpi_code: 'operating_margin', name: 'Operating Margin', category: 'Profitability', description: 'Profitability from operations' },
    { kpi_code: 'gross_margin', name: 'Gross Margin', category: 'Profitability', description: 'Core service profitability' },
    { kpi_code: 'revenue_per_employee', name: 'Revenue per Employee', category: 'Revenue & Growth', description: 'Productivity measure' },
    { kpi_code: 'client_concentration', name: 'Client Concentration', category: 'Client Health', description: 'Dependency on key clients' },
    { kpi_code: 'billable_utilisation', name: 'Billable Utilisation', category: 'Utilisation & Efficiency', description: 'Team productivity' },
  ],
  platinum: [
    { kpi_code: 'true_cash', name: 'True Cash Position', category: 'Cash & Working Capital', description: 'Actual available cash after all commitments' },
    { kpi_code: 'debtor_days', name: 'Debtor Days', category: 'Cash & Working Capital', description: 'Average time to collect payment' },
    { kpi_code: 'creditor_days', name: 'Creditor Days', category: 'Cash & Working Capital', description: 'Supplier payment timing' },
    { kpi_code: 'cash_conversion_cycle', name: 'Cash Conversion Cycle', category: 'Cash & Working Capital', description: 'Working capital efficiency' },
    { kpi_code: 'operating_margin', name: 'Operating Margin', category: 'Profitability', description: 'Profitability from operations' },
    { kpi_code: 'gross_margin', name: 'Gross Margin', category: 'Profitability', description: 'Core service profitability' },
    { kpi_code: 'revenue_per_employee', name: 'Revenue per Employee', category: 'Revenue & Growth', description: 'Productivity measure' },
    { kpi_code: 'yoy_revenue_growth', name: 'Year-on-Year Growth', category: 'Revenue & Growth', description: 'Growth trajectory' },
    { kpi_code: 'client_concentration', name: 'Client Concentration', category: 'Client Health', description: 'Dependency on key clients' },
    { kpi_code: 'billable_utilisation', name: 'Billable Utilisation', category: 'Utilisation & Efficiency', description: 'Team productivity' },
  ],
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

export function KPIPreview({ tier, recommendations }: KPIPreviewProps) {
  // Use provided recommendations or defaults
  const kpis = recommendations && recommendations.length > 0 
    ? recommendations 
    : DEFAULT_KPIS[tier] || DEFAULT_KPIS.gold;

  // Group by category
  const byCategory: Record<string, KPIRecommendation[]> = {};
  kpis.forEach(kpi => {
    if (!byCategory[kpi.category]) {
      byCategory[kpi.category] = [];
    }
    byCategory[kpi.category].push(kpi);
  });

  const tierLimits: Record<string, number> = {
    bronze: 3,
    silver: 5,
    gold: 8,
    platinum: 999,
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
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
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600">{kpis.length}</span>
            <span className="text-slate-500 text-sm ml-1">
              / {tierLimits[tier] === 999 ? '∞' : tierLimits[tier]} KPIs
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* KPI Grid */}
        <div className="grid gap-3">
          {Object.entries(byCategory).map(([category, categoryKpis]) => (
            <div key={category}>
              {/* Category header */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border mb-2 ${CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-700'}`}>
                {CATEGORY_ICONS[category]}
                {category}
              </div>
              
              {/* KPIs in category */}
              <div className="grid sm:grid-cols-2 gap-2 ml-2">
                {categoryKpis.map((kpi, idx) => (
                  <div 
                    key={kpi.kpi_code || idx}
                    className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg"
                  >
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-slate-800">{kpi.name}</p>
                      <p className="text-xs text-slate-500">{kpi.description}</p>
                      {kpi.rationale && (
                        <p className="text-xs text-blue-600 mt-1 italic">{kpi.rationale}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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

        {/* Customization note */}
        <p className="mt-4 text-xs text-slate-500 text-center">
          You can customize which KPIs you track during onboarding
        </p>
      </div>
    </div>
  );
}

export default KPIPreview;

