import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trophy, Calendar, Users, Lock, Heart, Eye, ExternalLink } from 'lucide-react';
import { UpgradePrompt } from '@/components/monetization/UpgradePrompt';

interface CommunityFeedProps {
  userTier: 'explorer' | 'starter' | 'growth' | 'enterprise';
  isAuthenticated: boolean;
}

interface ActivityItem {
  id: string;
  type: 'discussion' | 'win' | 'event' | 'milestone';
  title: string;
  content: string;
  author: string;
  timestamp: string;
  minTier: 'explorer' | 'starter' | 'growth' | 'enterprise';
  engagement?: {
    likes: number;
    comments: number;
    views: number;
  };
  url?: string;
}

export function CommunityFeed({ userTier, isAuthenticated }: CommunityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Mock data - in production this would come from your API
  useEffect(() => {
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'win',
        title: 'First £10k Month! 🎉',
        content: 'Just hit my first £10k month after 18 months of grinding. The Oracle Method roadmap was crucial - especially the focus on systems over hustle.',
        author: 'Sarah M.',
        timestamp: '2 hours ago',
        minTier: 'explorer',
        engagement: { likes: 24, comments: 8, views: 156 }
      },
      {
        id: '2',
        type: 'discussion',
        title: 'Balancing Family Time During Growth Phase',
        content: 'How do other founders manage family time when the business is demanding 60+ hours? My 5-year-old is starting to notice...',
        author: 'James K.',
        timestamp: '4 hours ago',
        minTier: 'starter',
        engagement: { likes: 12, comments: 15, views: 89 }
      },
      {
        id: '3',
        type: 'event',
        title: 'Office Hours with James - Today 2pm GMT',
        content: 'Bringing your burning questions about scaling, team building, and maintaining founder wellness. Growth members only.',
        author: 'James (Founder)',
        timestamp: '6 hours ago',
        minTier: 'growth',
        engagement: { likes: 18, comments: 5, views: 67 }
      },
      {
        id: '4',
        type: 'milestone',
        title: 'Community Milestone: 75 Active Members!',
        content: 'We\'ve reached 75 active founders in our community. Welcome to all our new Starter and Growth members this month!',
        author: 'Oracle Team',
        timestamp: '1 day ago',
        minTier: 'explorer',
        engagement: { likes: 45, comments: 12, views: 234 }
      },
      {
        id: '5',
        type: 'discussion',
        title: 'Automation Stack That Freed Up 20 Hours/Week',
        content: 'Sharing the exact automation setup that gave me back 20 hours weekly. Includes Zapier workflows, AI tools, and delegation frameworks.',
        author: 'Mike R.',
        timestamp: '2 days ago',
        minTier: 'starter',
        engagement: { likes: 31, comments: 22, views: 198 }
      }
    ];
    
    setActivities(mockActivities);
  }, []);

  const tierOrder = { explorer: 0, starter: 1, growth: 2, enterprise: 3 };
  const currentTierLevel = isAuthenticated ? tierOrder[userTier] : -1;

  const handleLockedContentClick = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setShowUpgradePrompt(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'discussion': return <MessageSquare className="h-5 w-5" />;
      case 'win': return <Trophy className="h-5 w-5" />;
      case 'event': return <Calendar className="h-5 w-5" />;
      case 'milestone': return <Users className="h-5 w-5" />;
      default: return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discussion': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      case 'win': return 'bg-green-600/20 text-green-400 border-green-500/30';
      case 'event': return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
      case 'milestone': return 'bg-orange-600/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'starter': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      case 'growth': return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
      case 'enterprise': return 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          What's Happening in the Community
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Real conversations, wins, and insights from founders building sustainable businesses
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {activities.map((activity) => {
          const isLocked = tierOrder[activity.minTier] > currentTierLevel;
          const isAccessible = !isLocked;

          return (
            <Card 
              key={activity.id} 
              className={`bg-gray-900/50 border-gray-700 transition-all relative overflow-hidden ${
                isAccessible ? 'hover:border-gray-600 hover:bg-gray-900/70' : 'opacity-75'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={`${getTypeColor(activity.type)} text-xs flex items-center gap-1`}>
                      {getIcon(activity.type)}
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Badge>
                    {activity.minTier !== 'explorer' && (
                      <Badge variant="outline" className={`${getTierColor(activity.minTier)} text-xs`}>
                        {activity.minTier.charAt(0).toUpperCase() + activity.minTier.slice(1)}+ Only
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{activity.timestamp}</span>
                </div>
                
                <CardTitle className="text-lg text-white leading-tight">
                  {activity.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className={`relative ${isLocked ? 'blur-sm pointer-events-none' : ''}`}>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {activity.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">by {activity.author}</span>
                    
                    {activity.engagement && isAccessible && (
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {activity.engagement.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {activity.engagement.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {activity.engagement.views}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Locked Content Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                    <div className="text-center p-6">
                      <Lock className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                      <h4 className="text-white font-medium mb-2">
                        {activity.minTier.charAt(0).toUpperCase() + activity.minTier.slice(1)}+ Members Only
                      </h4>
                      <p className="text-gray-400 text-sm mb-4">
                        Unlock this content and join the conversation
                      </p>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => handleLockedContentClick(activity)}
                      >
                        {isAuthenticated ? 'Upgrade Now' : 'Join Community'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show engagement statistics */}
      <div className="text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Badge variant="outline" className="border-green-500 text-green-400 px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            75+ Active Members
          </Badge>
          <Badge variant="outline" className="border-blue-500 text-blue-400 px-4 py-2">
            <MessageSquare className="h-4 w-4 mr-2" />
            Daily Discussions
          </Badge>
          <Badge variant="outline" className="border-purple-500 text-purple-400 px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            Weekly Events
          </Badge>
        </div>
      </div>

      {/* Upgrade Prompt Modal - Fix tier mapping */}
      {showUpgradePrompt && selectedActivity && (
        <UpgradePrompt
          tier={userTier === 'explorer' ? 'free' : userTier === 'enterprise' ? 'growth' : userTier}
          feature={`${selectedActivity.minTier.charAt(0).toUpperCase() + selectedActivity.minTier.slice(1)} Discussions`}
          description={`Join the conversation and access exclusive ${selectedActivity.minTier}+ member content, including detailed discussions and networking opportunities.`}
          targetTier={selectedActivity.minTier.charAt(0).toUpperCase() + selectedActivity.minTier.slice(1)}
          targetPrice={selectedActivity.minTier === 'starter' ? '£99' : '£299'}
          onClose={() => setShowUpgradePrompt(false)}
          position="modal"
        />
      )}
    </div>
  );
}
