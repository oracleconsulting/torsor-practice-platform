
import React from 'react';
import { GlassCard } from './ui/GlassCard';

interface PricingSectionProps {
  selected: string;
  onSelect: (tier: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ selected, onSelect }) => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '£99',
      description: 'Perfect for solo practitioners',
      features: [
        'Practice Health Assessment',
        'Basic Templates Library',
        'Email Support',
        '1 User Account',
        'Monthly Health Reports'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '£199',
      description: 'Most popular for growing practices',
      features: [
        'Everything in Starter',
        'AI Advisory Coach',
        'Client Rescue Center',
        'CPD Tracker',
        'Up to 5 Users',
        'Priority Support',
        'Advanced Templates'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '£399',
      description: 'For established firms',
      features: [
        'Everything in Professional',
        'Custom Branding',
        'Unlimited Users',
        'API Access',
        'Dedicated Account Manager',
        'Custom Integrations',
        'Advanced Analytics'
      ]
    }
  ];

  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
      <p className="text-xl text-gray-300 mb-12">Start transforming your practice today</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <GlassCard 
            key={plan.id}
            className={`relative ${plan.popular ? 'ring-2 ring-gold-400' : ''} ${
              selected === plan.id ? 'bg-white/10' : ''
            }`}
            onClick={() => onSelect(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gold-400 text-black px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-300 flex items-center">
                    <span className="text-gold-400 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                plan.popular 
                  ? 'bg-gold-400 text-black hover:bg-gold-500' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
                Get Started
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
