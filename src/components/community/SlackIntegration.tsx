import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slack, CheckCircle, ExternalLink, Users, MessageSquare, Lock, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface SlackConnection {
  user_id: string;
  slack_user_id?: string;
  slack_email?: string;
  connected_at: string;
  channels: string[];
  tier: string;
}

interface SlackIntegrationProps {
  userTier: 'explorer' | 'starter' | 'growth' | 'enterprise';
}

// Helper function to safely convert Json to string array
const safeJsonToStringArray = (json: any): string[] => {
  if (Array.isArray(json)) {
    return json.filter(item => typeof item === 'string');
  }
  if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
};

export function SlackIntegration({ userTier }: SlackIntegrationProps) {
  const { user } = useAuth();
  const [slackConnection, setSlackConnection] = useState<SlackConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      checkSlackConnection();
    }
  }, [user]);

  const checkSlackConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('slack_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const typedConnection: SlackConnection = {
          user_id: data.user_id,
          slack_user_id: data.slack_user_id || undefined,
          slack_email: data.slack_email || undefined,
          connected_at: data.connected_at,
          channels: safeJsonToStringArray(data.channels),
          tier: data.tier || 'explorer'
        };
        setSlackConnection(typedConnection);
      }
    } catch (error) {
      console.error('Error checking Slack connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllChannelsByTier = (tier: string) => {
    const tierChannels = {
      explorer: {
        accessible: ['#general'],
        locked: ['#starter-founders', '#growth-vip', '#peer-matching', '#beta-features', '#enterprise-private']
      },
      starter: {
        accessible: ['#general', '#starter-founders', '#starter-resources'],
        locked: ['#growth-vip', '#peer-matching', '#beta-features', '#enterprise-private']
      },
      growth: {
        accessible: ['#general', '#starter-founders', '#growth-vip', '#peer-matching', '#beta-features', '#office-hours'],
        locked: ['#enterprise-private']
      },
      enterprise: {
        accessible: ['#general', '#starter-founders', '#growth-vip', '#peer-matching', '#beta-features', '#office-hours', '#enterprise-private'],
        locked: []
      }
    };
    
    return tierChannels[tier as keyof typeof tierChannels] || tierChannels.explorer;
  };

  const handleSlackInvite = async () => {
    if (!user) {
      toast.error('Please sign in to join Slack');
      return;
    }

    setConnecting(true);

    try {
      const channels = getAllChannelsByTier(userTier);
      
      const { error } = await supabase
        .from('slack_connections')
        .upsert({
          user_id: user.id,
          tier: userTier,
          channels: channels.accessible,
          slack_email: user.email,
          connected_at: new Date().toISOString()
        });

      if (error) throw error;

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSlackConnection({
        user_id: user.id,
        tier: userTier,
        channels: channels.accessible,
        slack_email: user.email || '',
        connected_at: new Date().toISOString()
      });

      toast.success('Slack invite sent! Check your email for the invitation link.');
    } catch (error) {
      console.error('Error sending Slack invite:', error);
      toast.error('Failed to send Slack invite. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const openSlackWorkspace = () => {
    window.open('https://oracle-method.slack.com', '_blank');
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Slack className="h-5 w-5 text-purple-400" />
            <CardTitle>Slack Community</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Slack className="h-5 w-5 text-purple-400" />
            <CardTitle>Slack Community</CardTitle>
          </div>
          <CardDescription>
            Connect with fellow founders in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-4">
            Sign in to join our private Slack workspace and connect with founders at your tier level.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Sign In Required
          </Button>
        </CardContent>
      </Card>
    );
  }

  const channels = getAllChannelsByTier(userTier);

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Slack className="h-5 w-5 text-purple-400" />
            <CardTitle>Slack Community</CardTitle>
          </div>
          {slackConnection && (
            <Badge className="bg-green-600 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          {slackConnection 
            ? 'You\'re connected to our Slack workspace'
            : 'Join our private founder community on Slack'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {slackConnection ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                Your Access Level: {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
                {userTier === 'growth' && <Crown className="h-4 w-4 text-purple-400" />}
              </h4>
              
              {/* Accessible channels */}
              <div className="mb-4">
                <p className="text-sm text-green-400 mb-2">✓ Your Channels:</p>
                <div className="grid grid-cols-1 gap-2">
                  {channels.accessible.map((channel) => (
                    <div key={channel} className="flex items-center gap-2 text-sm text-gray-300">
                      <MessageSquare className="h-3 w-3 text-green-500" />
                      {channel}
                    </div>
                  ))}
                </div>
              </div>

              {/* Locked channels */}
              {channels.locked.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">🔒 Upgrade to unlock:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {channels.locked.map((channel) => (
                      <div key={channel} className="flex items-center gap-2 text-sm text-gray-500">
                        <Lock className="h-3 w-3" />
                        {channel}
                      </div>
                    ))}
                  </div>
                  {userTier !== 'enterprise' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2 border-purple-500 text-purple-400 hover:bg-purple-900/20"
                      asChild
                    >
                      <Link to="/pricing">Upgrade for More Access</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 pt-4">
              <Button 
                onClick={openSlackWorkspace}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Slack Workspace
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-800/50 p-3 rounded">
              <strong>Getting Started Tips:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Introduce yourself in #general</li>
                <li>• Set your status to show your current focus</li>
                <li>• Use threads to keep conversations organized</li>
                <li>• Share wins and challenges openly</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                {userTier === 'explorer' ? 'Limited Access' : 'Full Access'} - {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Tier
                {userTier === 'growth' && <Crown className="h-4 w-4 text-purple-400" />}
              </h4>
              
              {/* Show accessible channels */}
              <div className="mb-4">
                <p className="text-sm text-green-400 mb-2">✓ You'll get access to:</p>
                <div className="grid grid-cols-1 gap-2">
                  {channels.accessible.map((channel) => (
                    <div key={channel} className="flex items-center gap-2 text-sm text-gray-300">
                      <MessageSquare className="h-3 w-3 text-green-500" />
                      {channel}
                    </div>
                  ))}
                </div>
              </div>

              {/* Show locked channels with upgrade prompt */}
              {channels.locked.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">🔒 Upgrade to unlock:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {channels.locked.slice(0, 3).map((channel) => (
                      <div key={channel} className="flex items-center gap-2 text-sm text-gray-500">
                        <Lock className="h-3 w-3" />
                        {channel}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {userTier === 'explorer' && (
              <div className="bg-amber-900/20 border border-amber-700 p-3 rounded text-sm">
                <p className="text-amber-400">
                  <strong>Explorer Access:</strong> Join general discussions. 
                  <Link to="/pricing" className="underline ml-1">Upgrade</Link> for access to tier-specific channels.
                </p>
              </div>
            )}

            <Button 
              onClick={handleSlackInvite}
              disabled={connecting}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Slack className="h-4 w-4 mr-2" />
              {connecting ? 'Sending Invite...' : 'Join Slack Community'}
            </Button>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                75+ Members
              </div>
              <div>12 Countries</div>
              <div>24/7 Active</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
