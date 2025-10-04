
import React, { useEffect, useState } from 'react';
import { Users, Globe, MessageSquare, TrendingUp } from 'lucide-react';

interface CommunityStatsData {
  totalMembers: number;
  countries: number;
  aiSessions: number;
  revenueGenerated: string;
}

export function CommunityStats() {
  const [stats, setStats] = useState<CommunityStatsData>({
    totalMembers: 75,
    countries: 12,
    aiSessions: 150,
    revenueGenerated: '£2M+'
  });

  // In production, this would fetch from your API
  useEffect(() => {
    // fetchCommunityStats().then(setStats);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-purple-400 flex items-center justify-center gap-1">
          <Users className="h-6 w-6" />
          {stats.totalMembers}+
        </div>
        <div className="text-sm text-gray-400">Active Members</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-pink-400 flex items-center justify-center gap-1">
          <Globe className="h-6 w-6" />
          {stats.countries}
        </div>
        <div className="text-sm text-gray-400">Countries</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-blue-400 flex items-center justify-center gap-1">
          <MessageSquare className="h-6 w-6" />
          {stats.aiSessions}+
        </div>
        <div className="text-sm text-gray-400">AI Sessions</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-green-400 flex items-center justify-center gap-1">
          <TrendingUp className="h-6 w-6" />
          {stats.revenueGenerated}
        </div>
        <div className="text-sm text-gray-400">Revenue Generated</div>
      </div>
    </div>
  );
}
