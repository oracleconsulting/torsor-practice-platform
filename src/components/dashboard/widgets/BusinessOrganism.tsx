import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, Shield, Zap, Activity, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

interface VitalData {
  icon: React.ElementType;
  color: string;
  label: string;
  value: number;
  angle: number;
  status: 'healthy' | 'warning' | 'critical';
  description: string;
}

interface BusinessOrganismWidgetProps {
  metrics: {
    business_health?: number;
    security?: number;
    energy_level?: number;
    revenue?: number;
  } | null;
}

export const BusinessOrganismWidget: React.FC<BusinessOrganismWidgetProps> = ({ metrics }) => {
  const [pulse, setPulse] = useState(0);
  const [hoveredVital, setHoveredVital] = useState<string | null>(null);

  // Use real data or show empty state
  const hasData = metrics && (metrics.business_health !== undefined || metrics.security !== undefined || metrics.energy_level !== undefined);

  // Continuous rotation for orbiting elements
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (!hasData) {
    return (
      <motion.div className="h-full flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden">
        <AlertCircle className="w-10 h-10 text-yellow-400 mb-2 animate-bounce" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Set up your business health metrics</h3>
        <p className="text-gray-500 mb-4 text-center">Track your business health, security, and energy to unlock insights and recommendations.</p>
        <button className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium shadow hover:bg-purple-600 transition">Start Onboarding</button>
      </motion.div>
    );
  }

  // Business vitals data from metrics
  const vitals: VitalData[] = [
    {
      icon: Heart,
      color: '#EC4899',
      label: 'Health',
      value: metrics?.business_health ?? 0,
      angle: 0,
      status: (metrics?.business_health ?? 0) >= 90 ? 'healthy' : (metrics?.business_health ?? 0) >= 70 ? 'warning' : 'critical',
      description: 'Business health score'
    },
    {
      icon: Shield,
      color: '#8B5CF6',
      label: 'Security',
      value: metrics?.security ?? 0,
      angle: 120,
      status: (metrics?.security ?? 0) >= 90 ? 'healthy' : (metrics?.security ?? 0) >= 70 ? 'warning' : 'critical',
      description: 'Security score'
    },
    {
      icon: Zap,
      color: '#F59E0B',
      label: 'Energy',
      value: metrics?.energy_level ?? 0,
      angle: 240,
      status: (metrics?.energy_level ?? 0) >= 90 ? 'healthy' : (metrics?.energy_level ?? 0) >= 70 ? 'warning' : 'critical',
      description: 'Team energy level'
    }
  ];

  // Calculate overall health
  const overallHealth = Math.round((
    (metrics.business_health ?? 0) +
    (metrics.security ?? 0) +
    (metrics.energy_level ?? 0)
  ) / 3);

  const getOverallStatus = () => {
    if (overallHealth >= 90) return { text: 'Thriving', color: 'text-green-500' };
    if (overallHealth >= 70) return { text: 'Healthy', color: 'text-blue-500' };
    if (overallHealth >= 50) return { text: 'Needs Attention', color: 'text-yellow-500' };
    return { text: 'Critical', color: 'text-red-500' };
  };

  const overallStatus = getOverallStatus();

  return (
    <motion.div 
      className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden"
      whileHover={{ y: -2, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, #8B5CF6 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, #EC4899 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, #F59E0B 0%, transparent 50%)`
        }} />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-gray-800 dark:text-white font-semibold text-lg">Business Organism</h3>
          <p className={`text-sm ${overallStatus.color} flex items-center gap-1 mt-1`}>
            <Activity className="w-3 h-3" />
            {overallStatus.text} - {overallHealth}% Overall Health
          </p>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </motion.div>
      </div>
      
      {/* Central Organism */}
      <div className="relative h-[300px] flex items-center justify-center">
        {/* Soft Energy Rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full"
            style={{
              width: `${120 + ring * 50}px`,
              height: `${120 + ring * 50}px`,
              border: '1px solid',
              borderColor: `rgba(168, 85, 247, ${0.15 - ring * 0.03})`,
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.15, 0.08, 0.15]
            }}
            transition={{
              duration: 3 + ring,
              repeat: Infinity,
              delay: ring * 0.5
            }}
          />
        ))}
        
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {vitals.map((vital, index) => {
            const radians = (vital.angle + pulse) * Math.PI / 180;
            const x = Math.cos(radians) * 100 + 150;
            const y = Math.sin(radians) * 100 + 150;
            
            return (
              <motion.line
                key={vital.label}
                x1="150"
                y1="150"
                x2={x}
                y2={y}
                stroke={vital.color}
                strokeWidth="1"
                opacity={hoveredVital === vital.label ? 0.6 : 0.2}
                animate={{
                  opacity: hoveredVital === vital.label ? [0.6, 0.8, 0.6] : 0.2
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            );
          })}
        </svg>
        
        {/* Central Core */}
        <motion.div
          className="relative z-10 w-28 h-28 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-xl"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 0 30px rgba(168, 85, 247, 0.4)",
              "0 0 50px rgba(168, 85, 247, 0.6)",
              "0 0 30px rgba(168, 85, 247, 0.4)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        >
          <Brain className="w-14 h-14 text-white" />
        </motion.div>
        
        {/* Orbiting Vitals */}
        {vitals.map((vital, index) => {
          const Icon = vital.icon;
          const radians = (vital.angle + pulse) * Math.PI / 180;
          const x = Math.cos(radians) * 100;
          const y = Math.sin(radians) * 100;
          
          return (
            <motion.div
              key={vital.label}
              className="absolute"
              style={{
                transform: `translate(${x}px, ${y}px)`,
                left: '50%',
                top: '50%',
                marginLeft: '-24px',
                marginTop: '-24px'
              }}
              onMouseEnter={() => setHoveredVital(vital.label)}
              onMouseLeave={() => setHoveredVital(null)}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                  style={{ 
                    backgroundColor: vital.color,
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                {/* Value indicator */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap font-medium">
                  {vital.value}%
                </div>
                
                {/* Hover tooltip */}
                <AnimatePresence>
                  {hoveredVital === vital.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-20"
                    >
                      <div className="font-semibold mb-1">{vital.label}</div>
                      <div className="text-gray-300">{vital.description}</div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div className="border-4 border-transparent border-t-gray-900" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {/* Pulsing effect for critical items */}
              {vital.status === 'warning' && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: vital.color }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              )}
            </motion.div>
          );
        })}
        
        {/* Data particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos(i * 45 * Math.PI / 180) * 150],
              y: [0, Math.sin(i * 45 * Math.PI / 180) * 150],
              opacity: [1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
      
      {/* Insights Panel */}
      {metrics ? (
        <motion.div 
          className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                AI Insight
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-0.5">
                {metrics.revenue && metrics.business_health ?
                  `Your business health is ${metrics.business_health}%. Revenue this month: £${metrics.revenue.toLocaleString()}.` :
                  'Add your business metrics to unlock personalized insights.'}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-2 animate-bounce" />
          <p className="text-sm text-purple-800 dark:text-purple-200 font-medium mb-1">Complete setup for personalized insights</p>
          <button className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium shadow hover:bg-purple-600 transition">Complete Setup</button>
        </motion.div>
      )}
    </motion.div>
  );
}; 