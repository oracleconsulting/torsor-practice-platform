import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  icon: LucideIcon;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, icon: Icon, description }) => {
  return (
    <div className="h-[calc(100vh-200px)] flex items-center justify-center">
      <Card className="text-center max-w-md mx-auto">
        <CardContent className="pt-6">
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4"
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <Icon className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {description || 'This magical section is being crafted with care'}
          </p>
          <motion.div
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            Coming Soon
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}; 