import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Battery, Coffee, Clock } from 'lucide-react';

interface EnergyMeterProps {
  energy?: number;
  nextBreak: number;
}

export function EnergyMeter({ energy = 72, nextBreak }: EnergyMeterProps) {
  const [pulseColor, setPulseColor] = useState('yellow');
  
  useEffect(() => {
    if (energy < 30) setPulseColor('red');
    else if (energy < 60) setPulseColor('yellow');
    else setPulseColor('green');
  }, [energy]);
  
  const getEnergyStatus = () => {
    if (energy >= 80) return { text: 'Peak Performance', icon: Zap };
    if (energy >= 60) return { text: 'Good Energy', icon: Battery };
    if (energy >= 30) return { text: 'Need a Break Soon', icon: Coffee };
    return { text: 'Rest Required', icon: Coffee };
  };
  
  const status = getEnergyStatus();
  const StatusIcon = status.icon;
  
  if (energy === 0) {
    return (
      <motion.div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50 dark:border-gray-700/50 h-full flex flex-col items-center justify-center">
        <span className="text-lg font-semibold text-gray-800 dark:text-white mb-1">How are you feeling today?</span>
        <span className="text-gray-500 mb-4 text-center">Set your energy level to start tracking your wellbeing.</span>
        <button className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-medium shadow hover:bg-yellow-600 transition">Set Energy</button>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50 dark:border-gray-700/50"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Energy Flow</span>
        </div>
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <StatusIcon className="w-4 h-4 text-yellow-500" />
        </motion.div>
      </div>
      
      {/* Energy percentage */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <motion.span 
            className="text-2xl font-bold text-gray-800 dark:text-white"
            key={energy}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {energy}%
          </motion.span>
          <span className="text-xs text-gray-500">{status.text}</span>
        </div>
      </div>
      
      {/* Energy bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-400"
          initial={{ width: 0 }}
          animate={{ width: `${energy}%` }}
          transition={{ duration: 1, type: "spring" }}
        />
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-y-0 bg-white/30"
          animate={{ 
            x: ['-100%', '200%'],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ width: '50%' }}
        />
      </div>
      
      {/* Next break reminder */}
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Clock className="w-3 h-3" />
        <span>Break in {nextBreak} mins</span>
      </div>
      
      {/* Pulsing indicator */}
      {energy < 30 && (
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity
          }}
        />
      )}
    </motion.div>
  );
} 