import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Target, Info } from 'lucide-react';
import type { ROIImpact } from '../types/oracle';

interface Props {
  roi: ROIImpact;
}

interface GrowthAcceleratorValue {
  value: string;
  roi_multiple?: string;
}

export const ROIImpactWidget: React.FC<Props> = ({ roi }) => {
  const confidenceColor = {
    high: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-red-600 bg-red-100'
  } as const;

  type ConfidenceLevel = keyof typeof confidenceColor;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">ROI Impact Analysis</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceColor[roi.confidence as ConfidenceLevel]}`}>
          {roi.confidence.toUpperCase()} CONFIDENCE
        </span>
      </div>

      {/* Total Opportunity */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white mb-6 shadow-lg"
      >
        <DollarSign className="w-8 h-8 mb-2" />
        <p className="text-sm opacity-90 mb-1">Total Opportunity Value</p>
        <p className="text-3xl font-bold">{roi.total_opportunity_value}</p>
        <p className="text-sm opacity-80 mt-2">{roi.opportunity_type.replace('_', ' ').toUpperCase()}</p>
      </motion.div>

      {/* Revenue Breakdown */}
      {roi.revenue_opportunities?.revenue_potential && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Revenue Opportunities
          </h4>
          
          <motion.div
            whileHover={{ x: 2 }}
            className="bg-gray-50 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-800">{roi.revenue_opportunities.revenue_potential.value}</p>
                <p className="text-sm text-gray-600">{roi.revenue_opportunities.revenue_potential.description}</p>
              </div>
              <button className="group">
                <Info className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
            {roi.revenue_opportunities.revenue_potential.calculation && (
              <p className="text-xs text-gray-500 italic">
                Calculation: {roi.revenue_opportunities.revenue_potential.calculation}
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* Growth Accelerators */}
      {roi.growth_accelerators && Object.keys(roi.growth_accelerators).length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Growth Accelerators
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(roi.growth_accelerators as Record<string, GrowthAcceleratorValue>).map(([key, value]) => (
              <div key={key} className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs font-medium text-purple-700 mb-1">
                  {key.replace(/_/g, ' ').toUpperCase()}
                </p>
                <p className="text-sm font-bold text-purple-900">{value.value}</p>
                {value.roi_multiple && (
                  <p className="text-xs text-purple-600 mt-1">{value.roi_multiple} ROI</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}; 