import { Check, X, Star, Zap, Building2 } from 'lucide-react';

interface TierConfig {
  code: string;
  name: string;
  price: number;
  priceType: 'one_off' | 'monthly';
  commitmentMonths?: number;
  features: Record<string, boolean | number | string>;
  idealFor: string[];
  icon: typeof Star;
  accentColor: string;
}

const TIERS: TierConfig[] = [
  {
    code: 'tier1',
    name: 'Benchmark Report',
    price: 2000,
    priceType: 'one_off',
    icon: Star,
    accentColor: 'blue',
    features: {
      'Key metrics comparison': '6 metrics',
      'Percentile position': 'Overall',
      'Value bridge (basic)': true,
      'Top opportunities': '2 items',
      'Delivery call': '30 minutes',
      'What-if scenarios': false,
      'Conversation scripts': false,
      '90-day action plan': false,
      'Quarterly updates': false,
    },
    idealFor: [
      'Annual health check',
      'Curious about market position',
      'Budget-conscious',
      'No exit plans in near term',
    ],
  },
  {
    code: 'tier2',
    name: 'Value Analysis',
    price: 4500,
    priceType: 'one_off',
    icon: Zap,
    accentColor: 'emerald',
    features: {
      'Key metrics comparison': '12+ metrics',
      'Percentile position': 'By category',
      'Full value suppressors': true,
      'All opportunities': '7+ items',
      'Strategy session': '60 minutes',
      'What-if scenarios': '3 projections',
      'Conversation scripts': true,
      '90-day action plan': true,
      'Quarterly updates': false,
    },
    idealFor: [
      'Exit in 2-5 years',
      'Preparing for investment',
      'Strategic planning input',
      'Post-acquisition integration',
    ],
  },
  {
    code: 'tier3',
    name: 'Advisory Programme',
    price: 1500,
    priceType: 'monthly',
    commitmentMonths: 12,
    icon: Building2,
    accentColor: 'purple',
    features: {
      'Key metrics comparison': '20+ metrics',
      'Percentile position': 'With trends',
      'Full value tracking': true,
      'All opportunities': 'Unlimited',
      'Monthly sessions': true,
      'What-if scenarios': 'With probabilities',
      'Conversation scripts': '+ objection handling',
      'Rolling action plan': '12-month',
      'Quarterly re-benchmark': true,
    },
    idealFor: [
      'Exit within 3 years',
      'PE portfolio company',
      'Succession in progress',
      'Want accountability partner',
    ],
  },
];

interface TierSelectorProps {
  selectedTier: string;
  onSelect: (tier: string) => void;
  disabled?: boolean;
}

export function TierSelector({ selectedTier, onSelect, disabled }: TierSelectorProps) {
  const colorMap: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      badge: 'bg-blue-600',
    },
    emerald: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      badge: 'bg-emerald-600',
    },
    purple: {
      border: 'border-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      badge: 'bg-purple-600',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TIERS.map((tier) => {
        const colors = colorMap[tier.accentColor] || colorMap.blue;
        const isSelected = selectedTier === tier.code;
        const Icon = tier.icon;

        return (
          <div
            key={tier.code}
            onClick={() => !disabled && onSelect(tier.code)}
            className={`relative rounded-xl border-2 transition-all ${
              disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            } ${
              isSelected
                ? `${colors.border} shadow-lg scale-[1.02]`
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Recommended badge for tier2 */}
            {tier.code === 'tier2' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </div>
            )}

            {/* Header */}
            <div className={`p-6 border-b ${isSelected ? colors.bg : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? colors.text : 'text-gray-500'}`} />
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">
                  £{tier.price.toLocaleString()}
                </span>
                <span className="text-gray-500 ml-1">
                  {tier.priceType === 'monthly' ? '/month' : ''}
                </span>
                {tier.priceType === 'one_off' && (
                  <span className="text-gray-500 text-sm ml-1">+ VAT</span>
                )}
              </div>
              {tier.commitmentMonths && (
                <div className="text-sm text-gray-500 mt-1">
                  {tier.commitmentMonths}-month commitment (£{(tier.price * tier.commitmentMonths).toLocaleString()} total)
                </div>
              )}
            </div>

            {/* Features */}
            <div className="p-6">
              <ul className="space-y-3">
                {Object.entries(tier.features).map(([feature, value]) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    {value === false ? (
                      <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    ) : (
                      <Check className={`w-4 h-4 flex-shrink-0 ${isSelected ? colors.text : 'text-green-500'}`} />
                    )}
                    <span className={value === false ? 'text-gray-400' : 'text-gray-700'}>
                      {feature}
                      {typeof value === 'string' && value !== 'true' && (
                        <span className="font-medium ml-1">({value})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ideal For */}
            <div className="px-6 pb-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Ideal For
              </div>
              <ul className="space-y-1">
                {tier.idealFor.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Select Button */}
            <div className="p-6 pt-0">
              <button
                disabled={disabled}
                className={`w-full py-2.5 rounded-lg font-medium transition ${
                  isSelected
                    ? `${colors.badge} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${disabled ? 'cursor-not-allowed' : ''}`}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Export types for use in other components
export type { TierConfig };
export { TIERS };

