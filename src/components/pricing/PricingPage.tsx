import React, { useState } from 'react';
import { Check, X, Sparkles, Shield, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { subscriptionService } from '@/services/accountancy/subscriptionService';
import { useAccountancyContext } from '@/contexts/AccountancyContext';

interface PricingTier {
  name: string;
  displayName: string;
  price: number;
  priceId: string;
  description: string;
  features: string[];
  limitations?: string[];
  highlighted?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'free',
    displayName: 'Core',
    price: 0,
    priceId: '',
    description: 'Essential tools to get started',
    icon: Sparkles,
    features: [
      'Practice Health Score',
      'Compliance Calendar',
      'Basic KPI Dashboard (3 metrics)',
      '1 User Account',
      'Email Support',
      'Resource Library'
    ],
    limitations: [
      'Limited to core features',
      'No team collaboration',
      'No partner modules'
    ]
  },
  {
    name: 'professional',
    displayName: 'Professional',
    price: 297,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL!,
    description: 'Transform your practice with advanced features',
    icon: Shield,
    highlighted: true,
    features: [
      'Everything in Core',
      'Up to 5 users',
      'Alternate Auditor Register',
      'MTD Capacity Cockpit',
      'KPI Manager (5 categories)',
      'Partner Module Access',
      'ESG Lite Reporting',
      'API Access (limited)',
      'Priority Support'
    ]
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 597,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!,
    description: 'Complete transformation suite for growing firms',
    icon: Crown,
    features: [
      'Everything in Professional',
      'Unlimited users',
      'All KPI Categories',
      'Team Wellness Hub',
      'Continuity Scorecard',
      'White-label options',
      'Custom integrations',
      'Dedicated success manager',
      'Advanced analytics',
      'Full API Access'
    ]
  }
];

export const PricingPage: React.FC = () => {
  const context = useAccountancyContext();
  const [loading, setLoading] = useState<string | null>(null);
  const currentTier = context?.subscriptionTier || 'free';

  const handleSubscribe = async (tier: PricingTier) => {
    if (tier.name === 'free' || tier.name === currentTier) return;
    
    setLoading(tier.name);
    try {
      await subscriptionService.createCheckoutSession(tier.name, tier.priceId);
    } catch (error) {
      console.error('Error starting subscription:', error);
      // Show error toast
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Transform Your Practice with PRAXIS
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your firm's transformation journey. 
            Upgrade anytime as your needs grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => {
            const isCurrentTier = tier.name === currentTier;
            const Icon = tier.icon;

            return (
              <div
                key={tier.name}
                className={`
                  relative rounded-2xl p-8 
                  ${tier.highlighted 
                    ? 'bg-gradient-to-b from-purple-900/30 to-purple-900/10 border-2 border-purple-500' 
                    : 'bg-white/5 border border-white/10'
                  }
                  ${isCurrentTier ? 'ring-2 ring-green-500' : ''}
                `}
              >
                {tier.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500">
                    Most Popular
                  </Badge>
                )}
                
                {isCurrentTier && (
                  <Badge className="absolute -top-3 right-4 bg-green-500">
                    Current Plan
                  </Badge>
                )}

                {/* Tier Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${tier.highlighted 
                        ? 'bg-purple-500' 
                        : 'bg-white/10'
                      }
                    `}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {tier.displayName}
                    </h3>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-white">
                      £{tier.price}
                    </span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  
                  <p className="text-gray-300">
                    {tier.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">
                        {feature}
                      </span>
                    </div>
                  ))}
                  
                  {tier.limitations?.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400 text-sm">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  className={`
                    w-full
                    ${tier.highlighted 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-white/10 hover:bg-white/20'
                    }
                  `}
                  size="lg"
                  disabled={isCurrentTier || loading === tier.name}
                  onClick={() => handleSubscribe(tier)}
                >
                  {isCurrentTier ? 'Current Plan' : 
                   tier.name === 'free' ? 'Downgrade' :
                   loading === tier.name ? 'Processing...' : 
                   'Upgrade Now'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Partner Modules */}
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">
            Boost Your Practice with Partner Modules
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Cyber Security Assessment',
                price: '£99/month',
                description: 'Professional security audits and compliance',
                available: ['professional', 'enterprise']
              },
              {
                name: 'Marketing Audit & Strategy',
                price: '£149/month',
                description: 'Grow your practice with expert marketing',
                available: ['professional', 'enterprise']
              },
              {
                name: 'Team Wellness Program',
                price: '£199/month',
                description: 'Prevent burnout and boost team performance',
                available: ['enterprise']
              }
            ].map((module, index) => (
              <div key={index} className="p-6 bg-white/5 rounded-lg">
                <h3 className="font-semibold text-white mb-2">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  {module.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-semibold">
                    {module.price}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {module.available.includes('professional') ? 'Pro+' : 'Enterprise'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ or additional info */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            All plans include SSL encryption, GDPR compliance, and regular backups
          </p>
          <p className="text-gray-400">
            Questions? <a href="/accountancy/contact" className="text-purple-400 hover:text-purple-300">
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}; 