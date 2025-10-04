import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  users: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <div className="flex items-center gap-1">
        {/* Animated dots */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{
              y: [0, -3, 0],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
      <span>
        {users.length === 1
          ? 'Someone is typing...'
          : `${users.length} people are typing...`}
      </span>
    </div>
  );
}; 