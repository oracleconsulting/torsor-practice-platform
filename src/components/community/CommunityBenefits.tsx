
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommunityBenefitsProps {
  userTier: 'explorer' | 'starter' | 'growth' | 'enterprise';
}

interface Benefit {
  text: string;
  tier: 'explorer' | 'starter' | 'growth' | 'enterprise';
}

export function CommunityBenefits({ userTier }: CommunityBenefitsProps) {
  const tierOrder = { explorer: 0, starter: 1, growth: 2, enterprise: 3 };
  const currentTierLevel = tierOrder[userTier];

  const benefits: Benefit[] = [
    // Explorer benefits
    { text: 'Access to #general community discussion', tier: 'explorer' },
    { text: 'Monthly newsletter with founder insights', tier: 'explorer' },
    { text: 'Public coffee chat sessions', tier: 'explorer' },
    
    // Starter benefits
    { text: 'Private Slack workspace access', tier: 'starter' },
    { text: 'Bi-weekly founder group sessions', tier: 'starter' },
    { text: 'Automation templates library', tier: 'starter' },
    { text: 'Founder wellness toolkit', tier: 'starter' },
    
    // Growth benefits
    { text: 'Premium Slack channels (#growth-vip)', tier: 'growth' },
    { text: '1:1 peer matching system', tier: 'growth' },
    { text: 'Weekly office hours with James', tier: 'growth' },
    { text: 'WhatsApp founder group', tier: 'growth' },
    { text: 'Beta feature early access', tier: 'growth' },
    
    // Enterprise benefits
    { text: 'Private team channels', tier: 'enterprise' },
    { text: 'White-label community access', tier: 'enterprise' },
    { text: 'Dedicated community manager', tier: 'enterprise' }
  ];

  const currentBenefits = benefits.filter(benefit => 
    tierOrder[benefit.tier] <= currentTierLevel
  );

  const nextTierBenefits = benefits.filter(benefit => 
    tierOrder[benefit.tier] === currentTierLevel + 1
  );

  const getNextTier = () => {
    const tiers = ['explorer', 'starter', 'growth', 'enterprise'];
    return tiers[currentTierLevel + 1];
  };

  const getNextTierPrice = () => {
    const prices = { starter: '£99', growth: '£299', enterprise: 'Custom' };
    const nextTier = getNextTier();
    return nextTier ? prices[nextTier as keyof typeof prices] : null;
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Your Community Access
          <span className="text-sm font-normal text-gray-400">
            ({userTier.charAt(0).toUpperCase() + userTier.slice(1)} tier)
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current benefits */}
        <div>
          <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Active Benefits ({currentBenefits.length})
          </h4>
          <div className="space-y-2">
            {currentBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                {benefit.text}
              </div>
            ))}
          </div>
        </div>

        {/* Next tier benefits */}
        {nextTierBenefits.length > 0 && userTier !== 'enterprise' && (
          <div className="border-t border-gray-700 pt-6">
            <h4 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Unlock with {getNextTier()?.charAt(0).toUpperCase() + getNextTier()?.slice(1)} ({getNextTierPrice()})
            </h4>
            <div className="space-y-2 mb-4">
              {nextTierBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-400">
                  <Lock className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  {benefit.text}
                </div>
              ))}
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              asChild
            >
              <Link to="/pricing">
                Upgrade to {getNextTier()?.charAt(0).toUpperCase() + getNextTier()?.slice(1)}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}

        {userTier === 'enterprise' && (
          <div className="text-center py-4">
            <div className="text-purple-400 font-medium mb-2">🎉 You have full access!</div>
            <p className="text-sm text-gray-400">
              Enjoying all community benefits as an Enterprise member
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
