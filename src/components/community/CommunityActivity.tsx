import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trophy, Calendar, Users, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface CommunityActivityItem {
  id: string;
  type: 'discussion' | 'win' | 'event' | 'milestone';
  title: string;
  preview?: string;
  url?: string;
  author_name?: string;
  created_at: string;
  featured: boolean;
}

export function CommunityActivity() {
  const [activities, setActivities] = useState<CommunityActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityActivity();
  }, []);

  const fetchCommunityActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('community_activity')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      // Type-safe conversion with validation
      const typedActivities: CommunityActivityItem[] = (data || []).map(item => ({
        id: item.id,
        type: ['discussion', 'win', 'event', 'milestone'].includes(item.type) 
          ? item.type as 'discussion' | 'win' | 'event' | 'milestone'
          : 'discussion', // fallback to discussion if type is invalid
        title: item.title,
        preview: item.preview || undefined,
        url: item.url || undefined,
        author_name: item.author_name || undefined,
        created_at: item.created_at,
        featured: Boolean(item.featured)
      }));
      
      setActivities(typedActivities);
    } catch (error) {
      console.error('Error fetching community activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'discussion':
        return <MessageSquare className="h-4 w-4" />;
      case 'win':
        return <Trophy className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'milestone':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discussion':
        return 'bg-blue-600';
      case 'win':
        return 'bg-green-600';
      case 'event':
        return 'bg-purple-600';
      case 'milestone':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Community Activity
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-gray-900/50 border-gray-700 animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What's Happening in the Community
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join the conversation with fellow founders sharing wins, challenges, and insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card 
              key={activity.id} 
              className={`bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors ${
                activity.url ? 'cursor-pointer hover:bg-gray-900/70' : ''
              } ${activity.featured ? 'ring-1 ring-purple-500/30' : ''}`}
              onClick={() => activity.url && window.open(activity.url, '_blank')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge className={`${getTypeColor(activity.type)} text-white text-xs`}>
                    <span className="flex items-center gap-1">
                      {getIcon(activity.type)}
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </span>
                  </Badge>
                  {activity.featured && (
                    <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg text-white leading-tight">
                  {activity.title}
                  {activity.url && <ExternalLink className="h-4 w-4 inline-block ml-2 opacity-60" />}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                {activity.preview && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {activity.preview}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {activity.author_name && (
                    <span>by {activity.author_name}</span>
                  )}
                  <span>{formatTimeAgo(activity.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Ready to join the conversation?
          </p>
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
      </div>
    </section>
  );
}
