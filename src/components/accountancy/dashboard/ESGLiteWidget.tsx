import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, Users, Calendar } from 'lucide-react';
import { useAccountancy } from '../../../hooks/useAccountancy';
import { ESGSummary } from '../../types/accountancy';
import { ESGDashboard } from './ESGDashboard';

interface ESGLiteWidgetProps {
  className?: string;
}

export const ESGLiteWidget: React.FC<ESGLiteWidgetProps> = ({ className = '' }) => {
  const { esgData, loadingESG } = useAccountancy();
  const [showDashboard, setShowDashboard] = useState(false);
  
  const getStatusColor = (count: number) => {
    if (count === 0) return 'text-gray-400';
    if (count < 5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const mockESGData: ESGSummary = {
    inScopeClients: 12,
    activeReports: 8,
    revenueOpportunity: 45000,
    upcomingDeadlines: [
      { clientName: 'TechStart Ltd', daysRemaining: 15 },
      { clientName: 'GreenBuild Co', daysRemaining: 23 },
      { clientName: 'EcoRetail Ltd', daysRemaining: 31 }
    ],
    averageScore: 72,
    carbonReduction: 15.3
  };

  const data = esgData || mockESGData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Leaf className="w-5 h-5 mr-2 text-green-400" />
          ESG Reporting
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            New Revenue Stream
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getStatusColor(data.inScopeClients)}`}>
            {data.inScopeClients}
          </div>
          <div className="text-xs text-gray-400">In Scope</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {data.activeReports}
          </div>
          <div className="text-xs text-gray-400">Active Reports</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            £{(data.revenueOpportunity / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-gray-400">Revenue Opp.</div>
        </div>
      </div>

      {/* ESG Score Ring */}
      <div className="flex justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg className="transform -rotate-90 w-20 h-20">
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-700"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={201}
              strokeDashoffset={201 - (data.averageScore / 100) * 201}
              className="text-green-400 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{data.averageScore}</span>
          </div>
        </div>
      </div>

      {/* Mini Progress Indicators */}
      <div className="space-y-2 mb-4">
        {data.upcomingDeadlines.slice(0, 3).map((deadline, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-300 truncate">{deadline.clientName}</span>
            <span className="text-gray-500">{deadline.daysRemaining}d</span>
          </div>
        ))}
      </div>

      {/* Carbon Reduction Indicator */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-sm text-green-400">Carbon Reduction</span>
          </div>
          <span className="text-lg font-bold text-green-400">
            {data.carbonReduction}%
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowDashboard(true)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          Start ESG Check
        </button>
        <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm font-medium transition-colors">
          View Reports
        </button>
      </div>

      {/* Dashboard Modal */}
      {showDashboard && (
        <ESGDashboard onClose={() => setShowDashboard(false)} />
      )}
    </motion.div>
  );
}; 