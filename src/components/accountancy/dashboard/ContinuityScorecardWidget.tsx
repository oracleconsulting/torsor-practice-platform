import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, TrendingDown, AlertTriangle, Shield } from 'lucide-react';
import { useAccountancy } from '../../../hooks/useAccountancy';
import { ContinuitySummary } from '../../../types/accountancy';
import { ContinuityDashboard } from './ContinuityDashboard';

interface ContinuityScorecardWidgetProps {
  className?: string;
}

export const ContinuityScorecardWidget: React.FC<ContinuityScorecardWidgetProps> = ({ className = '' }) => {
  const { continuityData, loadingContinuity } = useAccountancy();
  const [showDashboard, setShowDashboard] = useState(false);
  
  const formatValue = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  // Mock fallback
  const mockContinuityData: ContinuitySummary = {
    currentValue: 1250000,
    growthRate: 12.5,
    readinessScore: 68,
    criticalGaps: [
      'No operations manual documented',
      'Key person dependency risk',
      'Missing succession agreement'
    ],
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    executorCount: 2,
    credentialCount: 15
  };

  const data = continuityData || mockContinuityData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#1a2b4a] flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-purple-400" />
          Practice Continuity
        </h3>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-600">
            Updated {formatDistanceToNow(data.lastUpdated)} ago
          </span>
        </div>
      </div>

      {/* Practice Value Display */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-bold text-[#1a2b4a]">
              {formatValue(data.currentValue)}
            </div>
            <div className="text-sm text-gray-600">Practice Value</div>
          </div>
          {data.growthRate && (
            <div className={`flex items-center ${
              data.growthRate > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {data.growthRate > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(data.growthRate)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Readiness Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Succession Readiness</span>
          <span className={`text-sm font-bold ${getScoreColor(data.readinessScore)}`}>
            {data.readinessScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${data.readinessScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Executor & Credential Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">{data.executorCount}</div>
          <div className="text-xs text-gray-400">Executors</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{data.credentialCount}</div>
          <div className="text-xs text-gray-400">Credentials</div>
        </div>
      </div>

      {/* Critical Gaps */}
      {data.criticalGaps && data.criticalGaps.length > 0 && (
        <div className="mb-4 bg-red-900/20 border border-red-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {data.criticalGaps.length} Critical Gaps
            </span>
          </div>
          <ul className="text-xs text-gray-400 space-y-1">
            {data.criticalGaps.slice(0, 3).map((gap, index) => (
              <li key={index} className="truncate">• {gap}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Assessment */}
      <div className="mb-4 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-400">Next Assessment</span>
          <span className="text-sm text-gray-300">
            {new Date(data.nextAssessment).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowDashboard(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          View Details
        </button>
        <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm font-medium transition-colors">
          Update Plan
        </button>
      </div>

      {/* Dashboard Modal */}
      {showDashboard && (
        <ContinuityDashboard onClose={() => setShowDashboard(false)} />
      )}
    </motion.div>
  );
}; 