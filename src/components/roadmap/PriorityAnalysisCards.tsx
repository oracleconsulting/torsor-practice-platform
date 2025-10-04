
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Zap, 
  Building, 
  Battery,
  CheckCircle,
  TrendingUp,
  Target,
  Minus
} from 'lucide-react';

interface PriorityAnalysisProps {
  priorityAnalysis: {
    immediate_relief_needed?: string[];
    quick_wins_available?: string[];
    strategic_foundations?: string[];
    energy_drains?: string[];
  };
}

export const PriorityAnalysisCards: React.FC<PriorityAnalysisProps> = ({ priorityAnalysis }) => {
  if (!priorityAnalysis || Object.keys(priorityAnalysis).length === 0) {
    return null;
  }

  const cards = [
    {
      title: 'Immediate Relief Needed',
      items: priorityAnalysis.immediate_relief_needed || [],
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-600 to-red-700',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-300'
    },
    {
      title: 'Quick Wins Available',
      items: priorityAnalysis.quick_wins_available || [],
      icon: Zap,
      color: 'green',
      gradient: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-300'
    },
    {
      title: 'Strategic Foundations',
      items: priorityAnalysis.strategic_foundations || [],
      icon: Building,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-300'
    },
    {
      title: 'Energy Drains',
      items: priorityAnalysis.energy_drains || [],
      icon: Battery,
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-300'
    }
  ];

  const visibleCards = cards.filter(card => card.items.length > 0);

  if (visibleCards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Priority Analysis</h3>
        <p className="text-gray-400">We've identified these key areas for your transformation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${card.bgColor} backdrop-blur-sm ${card.borderColor} h-full`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 bg-gradient-to-br ${card.gradient} rounded-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{card.title}</h4>
                    <Badge className={`${card.bgColor} ${card.textColor} border-none text-xs`}>
                      {card.items.length} items
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {card.items.slice(0, 3).map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index * 0.1) + (idx * 0.05) }}
                      className="flex items-start gap-2"
                    >
                      <div className="mt-1.5">
                        {card.color === 'red' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                        {card.color === 'green' && <CheckCircle className="w-3 h-3 text-green-400" />}
                        {card.color === 'blue' && <Target className="w-3 h-3 text-blue-400" />}
                        {card.color === 'purple' && <Minus className="w-3 h-3 text-purple-400" />}
                      </div>
                      <p className="text-gray-200 text-xs leading-relaxed">{item}</p>
                    </motion.div>
                  ))}
                  
                  {card.items.length > 3 && (
                    <p className={`text-xs ${card.textColor} mt-2`}>
                      +{card.items.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
