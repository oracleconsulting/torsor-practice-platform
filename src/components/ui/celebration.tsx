import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationProps {
  show: boolean;
  type: 'achievement' | 'milestone' | 'level-up';
  title: string;
  message: string;
  icon?: string;
  onClose: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({
  show,
  type,
  title,
  message,
  icon = '🎉',
  onClose
}) => {
  useEffect(() => {
    if (show) {
      // Trigger confetti
      const count = type === 'level-up' ? 200 : 100;
      const spread = type === 'achievement' ? 60 : 90;
      
      confetti({
        particleCount: count,
        spread: spread,
        origin: { y: 0.6 }
      });

      // Auto-close after 5 seconds
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, type, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-2xl shadow-2xl max-w-md text-center"
          >
            <div className="text-6xl mb-4">{icon}</div>
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-white/90 text-lg">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Celebration;

