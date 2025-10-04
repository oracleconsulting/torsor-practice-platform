import React from 'react';
import { motion } from 'framer-motion';
import { Users, Cpu, Brain, Building2, ArrowRight, Zap, Package } from 'lucide-react';
import type { SixMonthShift, ShiftItem } from '../types/oracle';

interface Props {
  shifts: SixMonthShift;
}

export const SixMonthShiftDisplay: React.FC<Props> = ({ shifts }) => {
  const getIcon = (area: string) => {
    switch (area) {
      case 'People': return Users;
      case 'Systems': return Cpu;
      case 'Mindset': return Brain;
      case 'Structure': return Building2;
      default: return Package;
    }
  };

  const getColor = (area: string) => {
    switch (area) {
      case 'People': return 'from-blue-400 to-purple-400';
      case 'Systems': return 'from-green-400 to-blue-400';
      case 'Mindset': return 'from-purple-400 to-pink-400';
      case 'Structure': return 'from-orange-400 to-red-400';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Shift Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-3">Your 6-Month Transformation</h3>
        <p className="text-gray-600">{shifts.shift_narrative}</p>
      </motion.div>

      {/* Shifts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {shifts.shifts.map((shift: ShiftItem, index: number) => {
          const Icon = getIcon(shift.area);
          const gradientColor = getColor(shift.area);
          
          return (
            <motion.div
              key={shift.area}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${gradientColor} p-4`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-white" />
                  <span className="font-bold text-white">{shift.area}</span>
                </div>
              </div>

              {/* Transformation */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">From</p>
                    <p className="text-sm font-medium text-red-600">{shift.from}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">To</p>
                    <p className="text-sm font-medium text-green-600">{shift.to}</p>
                  </div>
                </div>

                {/* Why Critical */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Why This Matters</p>
                  <p className="text-xs text-gray-600">{shift.why_critical}</p>
                </div>

                {/* Success Metric */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <p className="text-xs text-gray-600">{shift.success_metric}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Biggest Unlock */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <Zap className="w-8 h-8 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-lg mb-2">Your Biggest Unlock</h4>
            <p className="text-white/90">{shifts.biggest_unlock}</p>
          </div>
        </div>
      </motion.div>

      {/* Resources Needed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm"
      >
        <h5 className="font-semibold text-gray-800 mb-3">Resources You'll Need</h5>
        <div className="flex flex-wrap gap-2">
          {shifts.resources_needed.map((resource: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
            >
              {resource}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}; 