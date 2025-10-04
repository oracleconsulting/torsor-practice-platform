import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface BoardMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'thinking' | 'offline';
  current_task: string;
}

interface BoardPulseProps {
  members: BoardMember[];
}

export function BoardPulse({ members }: BoardPulseProps) {
  const getRoleEmoji = (role: string) => {
    const emojis: Record<string, string> = {
      'CFO': '💰',
      'CMO': '📈',
      'COO': '⚙️',
      'CTO': '💻',
      'CEO': '👔',
      'CSO': '🎯',
      'CPO': '🛡️',
      'CDO': '📊'
    };
    return emojis[role] || '👤';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-400';
      case 'thinking':
        return 'bg-yellow-400';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">
          🧠 Board Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">
              No board members assigned. Complete your assessment to get recommendations.
            </p>
          ) : (
            members.slice(0, 3).map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl">{getRoleEmoji(member.role)}</div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.current_task}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`} />
                  <span className="text-xs text-gray-500">{member.status}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 