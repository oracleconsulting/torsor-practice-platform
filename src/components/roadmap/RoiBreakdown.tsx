
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  PoundSterling, 
  TrendingUp, 
  Users, 
  Target, 
  Zap,
  Clock,
  Timer,
  ChevronDown, 
  ChevronUp
} from 'lucide-react';

interface RoiBreakdownProps {
  roiProjection: {
    annual_value_potential?: number;
    immediate_savings?: {
      category?: string;
      amount?: string;
      description?: string;
    }[];
    growth_opportunities?: {
      category?: string;
      potential?: string;
      timeline?: string;
    }[];
    traditional_consulting_comparison?: {
      typical_cost?: string;
      our_approach?: string;
      savings?: string;
    };
  };
}

export const RoiBreakdown: React.FC<RoiBreakdownProps> = ({ roiProjection }) => {
  const [expanded, setExpanded] = useState(false);

  if (!roiProjection || Object.keys(roiProjection).length === 0) {
    return null;
  }

  const annualValue = roiProjection.annual_value_potential || 0;
  const formatCurrency = (amount: number) => `£${(amount / 1000).toFixed(0)}k`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-teal-900/30 backdrop-blur-sm border-green-500/30">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl">
                <PoundSterling className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">ROI Projection</h3>
            </div>

            {/* Hero Number */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                {formatCurrency(annualValue)}
              </div>
              <p className="text-gray-300">Annual Value Potential</p>
            </motion.div>

            <Button
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="text-green-300 hover:text-green-200"
            >
              {expanded ? (
                <>Hide Breakdown <ChevronUp className="w-4 h-4 ml-1" /></>
              ) : (
                <>View Detailed Breakdown <ChevronDown className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >
                {/* Immediate Savings */}
                {roiProjection.immediate_savings && roiProjection.immediate_savings.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Immediate Savings
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {roiProjection.immediate_savings.map((saving, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-green-900/20 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-white">{saving.category}</h5>
                            <span className="text-green-400 font-bold">{saving.amount}</span>
                          </div>
                          <p className="text-gray-300 text-sm">{saving.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Growth Opportunities */}
                {roiProjection.growth_opportunities && roiProjection.growth_opportunities.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Growth Opportunities
                    </h4>
                    <div className="space-y-3">
                      {roiProjection.growth_opportunities.map((opportunity, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-blue-900/20 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-white">{opportunity.category}</h5>
                            <div className="text-right">
                              <div className="text-blue-400 font-bold">{opportunity.potential}</div>
                              <div className="text-gray-400 text-xs">{opportunity.timeline}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Traditional Consulting Comparison */}
                {roiProjection.traditional_consulting_comparison && (
                  <div>
                    <h4 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Vs. Traditional Consulting
                    </h4>
                    <div className="bg-purple-900/20 rounded-lg p-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400 mb-1">
                            {roiProjection.traditional_consulting_comparison.typical_cost}
                          </div>
                          <p className="text-gray-400 text-sm">Traditional Cost</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            {roiProjection.traditional_consulting_comparison.our_approach}
                          </div>
                          <p className="text-gray-400 text-sm">Oracle Method</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400 mb-1">
                            {roiProjection.traditional_consulting_comparison.savings}
                          </div>
                          <p className="text-gray-400 text-sm">Your Savings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};
