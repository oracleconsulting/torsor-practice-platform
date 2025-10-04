import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const RiskScorePanel: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const mockSecurityScore = {
    overall: 72,
    lastUpdated: new Date(),
    categories: {
      technical: {
        score: 78,
        factors: {
          patchingStatus: 85,
          endpointProtection: 90,
          firewallConfig: 75,
          emailSecurity: 70
        }
      },
      human: {
        score: 65,
        factors: {
          mfaAdoption: 85,
          trainingCompletion: 60,
          phishingResistance: 70,
          passwordStrength: 45
        }
      },
      process: {
        score: 73,
        factors: {
          backupVerification: 80,
          incidentResponse: 70,
          accessControl: 75,
          dataClassification: 65
        }
      }
    },
    trends: {
      daily: [70, 72, 71, 73, 72, 74, 72],
      weekly: [68, 70, 72, 71, 73, 72, 72],
      monthly: [65, 68, 70, 72, 71, 72, 72]
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const currentTrend = mockSecurityScore.trends[timeframe];
  const trendDirection = currentTrend[currentTrend.length - 1] > currentTrend[0] ? 'up' : 'down';
  const trendChange = Math.abs(currentTrend[currentTrend.length - 1] - currentTrend[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Security Risk Assessment</h3>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeframe === period
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Score */}
      <div className={`${getScoreBg(mockSecurityScore.overall)} border rounded-lg p-6 text-center`}>
        <div className="text-4xl font-bold mb-2">
          <span className={getScoreColor(mockSecurityScore.overall)}>
            {mockSecurityScore.overall}/100
          </span>
        </div>
        <div className="text-gray-300 mb-4">Overall Security Score</div>
        <div className="flex items-center justify-center gap-2 mb-4">
          {trendDirection === 'up' ? (
            <TrendingUp className="w-5 h-5 text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400" />
          )}
          <span className={`text-sm ${
            trendDirection === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trendDirection === 'up' ? '+' : '-'}{trendChange} points
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div 
            className={`h-full rounded-full transition-all duration-1000 ${
              mockSecurityScore.overall >= 80 ? 'bg-green-500' :
              mockSecurityScore.overall >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${mockSecurityScore.overall}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(mockSecurityScore.categories).map(([category, data]) => (
          <div key={category} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold capitalize">{category}</h4>
              {getScoreIcon(data.score)}
            </div>
            
            <div className="text-2xl font-bold mb-2">
              <span className={getScoreColor(data.score)}>{data.score}/100</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  data.score >= 80 ? 'bg-green-500' :
                  data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${data.score}%` }}
              />
            </div>

            <div className="space-y-2">
              {Object.entries(data.factors).map(([factor, score]) => (
                <div key={factor} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 capitalize">
                    {factor.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className={getScoreColor(score)}>{score}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4">Score Trend</h4>
        <div className="flex items-end justify-between h-32">
          {currentTrend.map((score, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`w-8 rounded-t transition-all duration-500 ${
                  score >= 80 ? 'bg-green-500' :
                  score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ height: `${(score / 100) * 80}px` }}
              />
              <span className="text-xs text-gray-400 mt-2">
                {timeframe === 'daily' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] :
                 timeframe === 'weekly' ? `W${index + 1}` : `M${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h4 className="text-blue-400 font-semibold mb-4">Recommendations</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Improve Password Strength</div>
              <div className="text-gray-400 text-sm">Current score: 45%. Implement password policies and training.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Enhance Training Completion</div>
              <div className="text-gray-400 text-sm">Current score: 60%. Schedule mandatory security training sessions.</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Improve Data Classification</div>
              <div className="text-gray-400 text-sm">Current score: 65%. Implement data classification policies.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 