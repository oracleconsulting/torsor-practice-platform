
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Calendar, TrendingUp, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CommunityWidgetProps {
  userTier: 'explorer' | 'starter' | 'growth' | 'enterprise';
}

interface CommunityStats {
  membersOnline: number;
  newDiscussions: number;
  upcomingEvents: number;
  weeklyGrowth: number;
}

export function CommunityWidget({ userTier }: CommunityWidgetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<CommunityStats>({
    membersOnline: 12,
    newDiscussions: 5,
    upcomingEvents: 2,
    weeklyGrowth: 8
  });

  // In production, fetch real-time stats
  useEffect(() => {
    // fetchCommunityStats().then(setStats);
  }, []);

  const getUpgradeMessage = () => {
    switch (userTier) {
      case 'explorer':
        return {
          message: 'Unlock Slack access with Starter',
          buttonText: 'Upgrade to Starter'
        };
      case 'starter':
        return {
          message: 'Join VIP channels with Growth',
          buttonText: 'Upgrade to Growth'
        };
      default:
        return null;
    }
  };

  const upgradeInfo = getUpgradeMessage();

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          Community Hub
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">{stats.membersOnline} online</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">{stats.newDiscussions} new posts</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">{stats.upcomingEvents} events</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">+{stats.weeklyGrowth} this week</span>
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Latest Activity</h4>
          <div className="space-y-2">
            <div className="text-xs text-gray-400 p-2 bg-gray-800/30 rounded">
              <span className="text-green-400">Sarah M.</span> shared a win: "First £10k month! 🎉"
            </div>
            <div className="text-xs text-gray-400 p-2 bg-gray-800/30 rounded">
              <span className="text-blue-400">James K.</span> started a discussion about work-life balance
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/community')}
            className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-900/20"
          >
            Visit Community Hub
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          {/* Tier-specific features */}
          {userTier === 'growth' && (
            <Button 
              size="sm"
              onClick={() => window.open('https://oracleconsultingai.slack.com')}
              className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300"
            >
              Open Slack Workspace
            </Button>
          )}
        </div>

        {/* Upgrade Prompt */}
        {upgradeInfo && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300 mb-2">{upgradeInfo.message}</p>
            <Button 
              size="sm" 
              onClick={() => navigate('/pricing')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {upgradeInfo.buttonText}
            </Button>
          </div>
        )}

        {/* Tier Badge */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Your Access Level</span>
            <Badge className={`text-xs ${
              userTier === 'explorer' ? 'bg-gray-600' :
              userTier === 'starter' ? 'bg-blue-600' :
              userTier === 'growth' ? 'bg-purple-600' :
              'bg-gradient-to-r from-purple-600 to-pink-600'
            }`}>
              {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
