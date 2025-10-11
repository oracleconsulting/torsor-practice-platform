/**
 * LeaderboardWidget Component
 * PROMPT 9: Gamification & Engagement Features
 * 
 * Compact leaderboard widget for dashboard display
 */

import React from 'react';
import { Trophy, TrendingUp, Medal, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
  rank: number;
  member_name: string;
  total_points: number;
  achievements_count: number;
  trend?: 'up' | 'down' | 'same';
}

interface LeaderboardWidgetProps {
  entries: LeaderboardEntry[];
  title?: string;
  type?: 'points' | 'improvement' | 'mentoring';
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  entries,
  title = 'Top Performers',
  type = 'points'
}) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                entry.rank <= 3 
                  ? 'bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/20' 
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex-shrink-0 w-8 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              <Avatar className="h-10 w-10 bg-primary">
                <AvatarFallback className="text-white text-sm font-semibold">
                  {getInitials(entry.member_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{entry.member_name}</div>
                <div className="text-sm text-muted-foreground">
                  {entry.achievements_count} achievements
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {entry.total_points.toLocaleString()}
                </div>
                {entry.trend && (
                  <Badge variant="secondary" className="text-xs">
                    {entry.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {entry.trend}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
