import { Check, Star } from 'lucide-react';
import { TIER_FEATURES, getPriceRange } from '../../types/ma';
import type { TierType } from '../../types/ma';

// Map legacy tier names to new tier names
const LEGACY_TIER_MAP: Record<string, TierType> = {
  'bronze': 'clarity',
  'silver': 'foresight', 
  'gold': 'strategic',
  'platinum': 'strategic',
  'clarity': 'clarity',
  'foresight': 'foresight',
  'strategic': 'strategic',
};

interface TierSelectorProps {
  recommendedTier: TierType;
  selectedTier?: TierType;
  onSelect?: (tier: TierType) => void;
  showPrices?: boolean;
}

const tiers: Array<{
  id: TierType;
  name: string;
  tagline: string;
  priceRange: string;
  features: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    id: 'clarity',
    name: 'Clarity',
    tagline: 'See where you are',
    priceRange: getPriceRange('clarity'),
    features: [
      'Business Intelligence Portal',
      'True Cash Position',
      'Core KPIs (5)',
      'AI-generated insights',
      'Tuesday Question answered',
      '30-min review call',
    ],
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  {
    id: 'foresight',
    name: 'Foresight',
    tagline: 'See where you could be',
    priceRange: getPriceRange('foresight'),
    features: [
      'Everything in Clarity',
      'Extended KPIs (8)',
      'Actionable recommendations',
      '13-week cash forecast',
      '3 pre-built scenarios',
      'Client profitability analysis',
      '45-min review call',
    ],
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-500',
  },
  {
    id: 'strategic',
    name: 'Strategic',
    tagline: 'Your financial partner',
    priceRange: getPriceRange('strategic'),
    features: [
      'Everything in Foresight',
      'Custom KPIs (unlimited)',
      'Unlimited scenarios',
      'Weekly cash flash',
      'Board pack generation',
      'Industry benchmarking',
      '60-min review call',
    ],
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
  },
];

export function TierSelector({ 
  recommendedTier, 
  selectedTier,
  onSelect,
  showPrices = true 
}: TierSelectorProps) {
  // Map legacy tier names to new names
  const mappedRecommended = LEGACY_TIER_MAP[recommendedTier] || 'clarity';
  const mappedSelected = selectedTier ? (LEGACY_TIER_MAP[selectedTier] || 'clarity') : undefined;
  const activeTier = mappedSelected || mappedRecommended;

  return (
    <div className="py-8">
      <h3 className="text-2xl font-bold text-center mb-2 text-gray-900">Choose Your Tier</h3>
      <p className="text-center text-gray-600 mb-8">
        Based on your needs, we recommend{' '}
        <span className="font-semibold text-blue-600">{TIER_FEATURES[mappedRecommended]?.label || 'Clarity'}</span>
      </p>
      
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isRecommended = tier.id === mappedRecommended;
          const isSelected = tier.id === activeTier;
          
          return (
            <div
              key={tier.id}
              className={`rounded-xl border-2 p-6 cursor-pointer transition-all relative ${
                isSelected
                  ? `${tier.borderColor} ${tier.bgColor} shadow-lg scale-[1.02]`
                  : isRecommended
                  ? `${tier.borderColor}/50 ${tier.bgColor}/50`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow'
              }`}
              onClick={() => onSelect?.(tier.id)}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    tier.id === 'clarity' ? 'bg-blue-500' :
                    tier.id === 'foresight' ? 'bg-indigo-500' :
                    'bg-purple-500'
                  }`}>
                    <Star className="h-3 w-3" />
                    Recommended
                  </div>
                </div>
              )}
              
              <h4 className="text-xl font-bold text-gray-900 mt-2">{tier.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{tier.tagline}</p>
              
              {showPrices && (
                <div className="mb-4">
                  <p className={`text-lg font-bold ${
                    tier.id === 'clarity' ? 'text-blue-600' :
                    tier.id === 'foresight' ? 'text-indigo-600' :
                    'text-purple-600'
                  }`}>{tier.priceRange}</p>
                  <p className="text-xs text-gray-500">Based on annual turnover</p>
                </div>
              )}
              
              <ul className="space-y-2">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      tier.id === 'clarity' ? 'text-blue-500' :
                      tier.id === 'foresight' ? 'text-indigo-500' :
                      'text-purple-500'
                    }`} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {isSelected && (
                <div className={`mt-4 pt-4 border-t ${
                  tier.id === 'clarity' ? 'border-blue-200' :
                  tier.id === 'foresight' ? 'border-indigo-200' :
                  'border-purple-200'
                }`}>
                  <div className={`flex items-center justify-center gap-2 font-medium ${
                    tier.id === 'clarity' ? 'text-blue-600' :
                    tier.id === 'foresight' ? 'text-indigo-600' :
                    'text-purple-600'
                  }`}>
                    <Check className="h-5 w-5" />
                    Selected
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <p className="text-center text-sm text-gray-500 mt-6">
        Strategic tier is monthly only. Clarity and Foresight available monthly or quarterly.
      </p>
    </div>
  );
}

export default TierSelector;
