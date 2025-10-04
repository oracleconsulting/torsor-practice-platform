import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, MessageSquare, TrendingUp, Award, Sparkles, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user_name: string;
  user_avatar: string;
}

interface CommunityActivityProps {
  activities?: Activity[];
}

export function CommunityActivity({ activities = [] }: CommunityActivityProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!activities.length) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [activities.length]);

  const validActivities = activities.filter(item => item.user_name);

  if (!activities.length) {
    return (
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center justify-center h-full p-6">
        <AlertCircle className="w-10 h-10 text-teal-400 mb-2 animate-bounce" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Be the first to share your journey</h3>
        <p className="text-gray-500 mb-4 text-center">Post your first update or question to inspire the community.</p>
        <button className="px-4 py-2 rounded-lg bg-teal-500 text-white font-medium shadow hover:bg-teal-600 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Share Now
        </button>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-white font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-500" />
          Community
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-auto"
          >
            <Sparkles className="w-3 h-3 text-yellow-400" />
          </motion.div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-3">
          <AnimatePresence mode="wait">
            {validActivities.map((item, i) => {
              if (i !== activeIndex) return null;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300">
                      {item.user_avatar ? (
                        <img src={item.user_avatar} alt={item.user_name || 'User'} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        item.user_name ? item.user_name[0] : <span>?</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">{item.user_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  <motion.p 
                    className="text-sm text-gray-800 dark:text-white"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {item.message}
                  </motion.p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center gap-1 mb-3">
          {activities.map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
              animate={{
                backgroundColor: i === activeIndex ? '#14B8A6' : '',
                scale: i === activeIndex ? 1.5 : 1
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
        <Button
          variant="outline"
          className="w-full mt-3 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
        >
          Join Discussion
        </Button>
      </CardContent>
    </Card>
  );
} 