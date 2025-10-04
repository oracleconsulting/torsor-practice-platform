
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hash, Lock, Crown, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChannelPreviewProps {
  userTier: 'explorer' | 'starter' | 'growth' | 'enterprise';
}

interface Channel {
  name: string;
  description: string;
  memberCount?: number;
  tier: 'explorer' | 'starter' | 'growth' | 'enterprise';
}

export function ChannelPreview({ userTier }: ChannelPreviewProps) {
  const channels: Channel[] = [
    { name: 'general', description: 'Community announcements and general chat', memberCount: 75, tier: 'explorer' },
    { name: 'introductions', description: 'Introduce yourself to the community', memberCount: 68, tier: 'explorer' },
    { name: 'wins', description: 'Share your business victories', memberCount: 54, tier: 'explorer' },
    { name: 'starter-founders', description: 'Private discussions for Starter members', memberCount: 42, tier: 'starter' },
    { name: 'resources', description: 'Templates, tools, and guides', memberCount: 38, tier: 'starter' },
    { name: 'growth-vip', description: 'Exclusive Growth member discussions', memberCount: 28, tier: 'growth' },
    { name: 'office-hours', description: 'Weekly sessions with James', memberCount: 25, tier: 'growth' },
    { name: 'beta-features', description: 'Early access to new features', memberCount: 22, tier: 'growth' },
  ];

  const tierOrder = { explorer: 0, starter: 1, growth: 2, enterprise: 3 };
  const currentTierLevel = tierOrder[userTier];

  const accessibleChannels = channels.filter(channel => tierOrder[channel.tier] <= currentTierLevel);
  const lockedChannels = channels.filter(channel => tierOrder[channel.tier] > currentTierLevel);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'explorer': return <Star className="h-4 w-4 text-gray-400" />;
      case 'starter': return <Zap className="h-4 w-4 text-blue-400" />;
      case 'growth': return <Crown className="h-4 w-4 text-purple-400" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getNextTier = () => {
    const tiers = ['explorer', 'starter', 'growth', 'enterprise'];
    return tiers[currentTierLevel + 1];
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Channel Access Preview
          {getTierIcon(userTier)}
          <span className="text-sm font-normal text-gray-400">
            ({userTier.charAt(0).toUpperCase() + userTier.slice(1)})
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Accessible Channels */}
        <div>
          <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Your Channels ({accessibleChannels.length})
          </h4>
          <div className="space-y-3">
            {accessibleChannels.map((channel) => (
              <div key={channel.name} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Hash className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">#{channel.name}</span>
                    {channel.memberCount && (
                      <span className="text-xs text-gray-500">({channel.memberCount})</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{channel.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Access for Growth */}
        {userTier === 'growth' && (
          <div className="border-t border-gray-700 pt-6">
            <h4 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              VIP Access
            </h4>
            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-purple-300">WhatsApp Founder Group</span>
                <span className="text-xs text-purple-400">(42 members)</span>
              </div>
              <p className="text-xs text-gray-400">Direct access for quick questions and real-time support</p>
            </div>
          </div>
        )}

        {/* Locked Channels */}
        {lockedChannels.length > 0 && userTier !== 'enterprise' && (
          <div className="border-t border-gray-700 pt-6">
            <h4 className="font-medium text-orange-400 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Unlock with {getNextTier()?.charAt(0).toUpperCase() + getNextTier()?.slice(1)}
            </h4>
            <div className="space-y-3 mb-4">
              {lockedChannels.slice(0, 3).map((channel) => (
                <div key={channel.name} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg opacity-60">
                  <Lock className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-400">#{channel.name}</span>
                      {channel.memberCount && (
                        <span className="text-xs text-gray-600">({channel.memberCount})</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{channel.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              asChild
            >
              <Link to="/pricing">
                Upgrade to {getNextTier()?.charAt(0).toUpperCase() + getNextTier()?.slice(1)}
              </Link>
            </Button>
          </div>
        )}

        {userTier === 'enterprise' && (
          <div className="text-center py-4">
            <div className="text-purple-400 font-medium mb-2">🎉 Full Channel Access!</div>
            <p className="text-sm text-gray-400">
              You have access to all community channels as an Enterprise member
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
