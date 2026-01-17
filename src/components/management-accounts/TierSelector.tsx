import { Check } from 'lucide-react';

interface TierSelectorProps {
  recommendedTier: string;
  selectedTier?: string;
  onSelect?: (tier: string) => void;
  showPrices?: boolean;
}

const tiers = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: '£750',
    subtitle: 'Essentials',
    features: [
      'Monthly P&L & Balance Sheet',
      'True Cash calculation',
      'Tuesday question answered',
      '3 key insights',
      'Watch list (3 metrics)',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '£1,500',
    subtitle: 'Full Picture',
    features: [
      'Everything in Bronze',
      '6-month trend analysis',
      '5 key insights',
      'Watch list (5 metrics)',
      'Optimisation suggestions',
      'Quarterly advisory call',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '£3,000',
    subtitle: 'Decision-Ready',
    features: [
      'Everything in Silver',
      '13-week cash forecast',
      'Scenario dashboard',
      '3 pre-built scenarios',
      'Monthly advisory call',
      'Budget vs actual tracking',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '£5,000',
    subtitle: 'Board-Level',
    features: [
      'Everything in Gold',
      'Weekly flash reports',
      'Unlimited scenarios',
      'Custom KPI dashboard',
      'Fortnightly calls',
      'Benchmarking included',
      'Board pack preparation',
    ],
  },
];

export function TierSelector({ 
  recommendedTier, 
  selectedTier,
  onSelect,
  showPrices = true 
}: TierSelectorProps) {
  const activeTier = selectedTier || recommendedTier;

  return (
    <div className="py-8">
      <h3 className="text-2xl font-bold text-center mb-2 text-gray-900">Choose Your Level</h3>
      <p className="text-center text-gray-600 mb-8">
        Based on your answers, we recommend{' '}
        <span className="font-semibold text-blue-600">{recommendedTier.toUpperCase()}</span>
      </p>
      
      <div className="grid md:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const isRecommended = tier.id === recommendedTier;
          const isSelected = tier.id === activeTier;
          
          return (
            <div
              key={tier.id}
              className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                  : isRecommended
                  ? 'border-blue-300 bg-blue-50/50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow'
              }`}
              onClick={() => onSelect?.(tier.id)}
            >
              {isRecommended && (
                <div className="text-xs font-semibold text-blue-600 uppercase mb-2 tracking-wide">
                  Recommended
                </div>
              )}
              <h4 className="text-xl font-bold text-gray-900">{tier.name}</h4>
              {showPrices && (
                <>
                  <p className="text-2xl font-bold text-blue-600">{tier.price}</p>
                  <p className="text-sm text-gray-500 mb-4">/month</p>
                </>
              )}
              <p className="text-sm font-medium text-gray-700 mb-4">{tier.subtitle}</p>
              <ul className="space-y-2">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      isSelected ? 'text-blue-600' : 'text-green-500'
                    }`} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
                    <Check className="h-5 w-5" />
                    Selected
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TierSelector;

