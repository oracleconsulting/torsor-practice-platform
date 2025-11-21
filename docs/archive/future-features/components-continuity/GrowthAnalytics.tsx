import React, { useState } from 'react';
import { TrendingUp, BarChart3, Target, Users } from 'lucide-react';

export const GrowthAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1y' | '3y' | '5y'>('3y');

  const mockProjections = [
    { year: 1, value: 1250000, assumptions: '12.5% base growth' },
    { year: 2, value: 1406250, assumptions: '12.5% growth + operations manual' },
    { year: 3, value: 1582031, assumptions: '12.5% growth + client diversification' },
    { year: 4, value: 1779785, assumptions: '12.5% growth + systems documentation' },
    { year: 5, value: 2002258, assumptions: '12.5% growth + full readiness' }
  ];

  const mockBenchmarks = {
    industry: 'Accounting Practice',
    size: 'SME (10-50 staff)',
    averageValue: 980000,
    topQuartile: 1500000,
    bottomQuartile: 650000,
    growthRate: 8.5
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 10) return 'text-green-400';
    if (growth > 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Growth Analytics</h3>
        <div className="flex gap-2">
          {['1y', '3y', '5y'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeframe === period
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Current Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {formatValue(1250000)}
          </div>
          <div className="text-sm text-gray-400">Current Value</div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            +12.5%
          </div>
          <div className="text-sm text-gray-400">Growth Rate</div>
        </div>
        
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {formatValue(2002258)}
          </div>
          <div className="text-sm text-gray-400">5-Year Target</div>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            +60%
          </div>
          <div className="text-sm text-gray-400">Potential Growth</div>
        </div>
      </div>

      {/* Value Projections */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
          Value Projections
        </h4>
        
        <div className="space-y-3">
          {mockProjections.slice(0, timeframe === '1y' ? 1 : timeframe === '3y' ? 3 : 5).map((projection) => (
            <div key={projection.year} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                  {projection.year}
                </div>
                <div>
                  <div className="text-white font-medium">Year {projection.year}</div>
                  <div className="text-sm text-gray-400">{projection.assumptions}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">
                  {formatValue(projection.value)}
                </div>
                <div className="text-sm text-gray-400">
                  +{((projection.value / 1250000 - 1) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmarking */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          Industry Benchmarking
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-gray-300 font-medium mb-3">Your Practice vs Industry</h5>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Your Value:</span>
                <span className="text-white font-medium">{formatValue(1250000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Industry Average:</span>
                <span className="text-gray-300">{formatValue(mockBenchmarks.averageValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Top Quartile:</span>
                <span className="text-green-400">{formatValue(mockBenchmarks.topQuartile)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bottom Quartile:</span>
                <span className="text-red-400">{formatValue(mockBenchmarks.bottomQuartile)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-gray-300 font-medium mb-3">Growth Comparison</h5>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Your Growth:</span>
                <span className="text-green-400 font-medium">+12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Industry Average:</span>
                <span className="text-gray-300">+{mockBenchmarks.growthRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Performance:</span>
                <span className="text-green-400 font-medium">+47% above average</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Opportunities */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h4 className="text-blue-400 font-semibold mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Improvement Opportunities
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h5 className="text-white font-medium mb-2">Operations Manual</h5>
            <div className="text-sm text-gray-400 mb-2">Create comprehensive operations documentation</div>
            <div className="text-green-400 font-medium">+15% value impact</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h5 className="text-white font-medium mb-2">Client Diversification</h5>
            <div className="text-sm text-gray-400 mb-2">Reduce concentration risk</div>
            <div className="text-green-400 font-medium">+10% value impact</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h5 className="text-white font-medium mb-2">Systems Documentation</h5>
            <div className="text-sm text-gray-400 mb-2">Document all processes and procedures</div>
            <div className="text-green-400 font-medium">+8% value impact</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h5 className="text-white font-medium mb-2">Succession Planning</h5>
            <div className="text-sm text-gray-400 mb-2">Complete succession agreements</div>
            <div className="text-green-400 font-medium">+12% value impact</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
          <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-purple-400">425</div>
          <div className="text-sm text-gray-400">Active Clients</div>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-green-400">85%</div>
          <div className="text-sm text-gray-400">Recurring Revenue</div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
          <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-blue-400">1.2x</div>
          <div className="text-sm text-gray-400">Valuation Multiple</div>
        </div>
      </div>
    </div>
  );
}; 