
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, MessageSquare, Trophy, Calendar, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TieredActivityItemProps {
  id: string;
  type: 'discussion' | 'win' | 'event' | 'milestone';
  title: string;
  preview?: string;
  url?: string;
  author_name?: string;
  created_at: string;
  featured: boolean;
  minTier: 'explorer' | 'starter' | 'growth' | 'enterprise';
  userTier: 'explorer' | 'starter' | 'growth' | 'enterprise';
  onClick?: () => void;
}

export function TieredActivityItem({
  type,
  title,
  preview,
  url,
  author_name,
  created_at,
  featured,
  minTier,
  userTier,
  onClick
}: TieredActivityItemProps) {
  const tierOrder = { explorer: 0, starter: 1, growth: 2, enterprise: 3 };
  const isLocked = tierOrder[userTier] < tierOrder[minTier];

  const getIcon = (type: string) => {
    switch (type) {
      case 'discussion': return <MessageSquare className="h-4 w-4" />;
      case 'win': return <Trophy className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'milestone': return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discussion': return 'bg-blue-600';
      case 'win': return 'bg-green-600';
      case 'event': return 'bg-purple-600';
      case 'milestone': return 'bg-orange-600';
      default: return 'bg-gray-600';
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

  const getTierUpgradeMessage = (minTier: string) => {
    const messages = {
      starter: 'Starter+ members only',
      growth: 'Growth members only',
      enterprise: 'Enterprise members only'
    };
    return messages[minTier as keyof typeof messages] || 'Premium members only';
  };

  if (isLocked) {
    return (
      <Card className="bg-gray-900/50 border-gray-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-gray-800/90 z-10" />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center p-6">
            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300 font-medium mb-2">{getTierUpgradeMessage(minTier)}</p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/pricing">Upgrade to {minTier.charAt(0).toUpperCase() + minTier.slice(1)}</Link>
            </Button>
          </div>
        </div>
        
        {/* Blurred content behind */}
        <div className="filter blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <Badge className={`${getTypeColor(type)} text-white text-xs`}>
                <span className="flex items-center gap-1">
                  {getIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </Badge>
              {featured && (
                <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                  Featured
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg text-white leading-tight">
              {title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            {preview && (
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {preview}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              {author_name && <span>by {author_name}</span>}
              <span>{formatTimeAgo(created_at)}</span>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors ${
        url || onClick ? 'cursor-pointer hover:bg-gray-900/70' : ''
      } ${featured ? 'ring-1 ring-purple-500/30' : ''}`}
      onClick={() => {
        if (onClick) onClick();
        if (url) window.open(url, '_blank');
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge className={`${getTypeColor(type)} text-white text-xs`}>
            <span className="flex items-center gap-1">
              {getIcon(type)}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </Badge>
          {featured && (
            <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
              Featured
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg text-white leading-tight">
          {title}
          {url && <ExternalLink className="h-4 w-4 inline-block ml-2 opacity-60" />}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {preview && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {preview}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          {author_name && <span>by {author_name}</span>}
          <span>{formatTimeAgo(created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
