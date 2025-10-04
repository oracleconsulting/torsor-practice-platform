import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Lightbulb, BarChart3, Award } from 'lucide-react';
import { Benchmark } from '../../../types/accountancy';

export const InsightsPanel: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('technology');

  const mockBenchmarks: Benchmark[] = [
    {
      industry: 'technology',
      companySize: 'medium',
      averages: {
        carbonIntensity: 0.8,
        genderPayGap: 12.5,
        boardDiversity: 35
      }
    },
    {
      industry: 'manufacturing',
      companySize: 'medium',
      averages: {
        carbonIntensity: 1.2,
        genderPayGap: 15.2,
        boardDiversity: 28
      }
    }
  ];

  const improvementSuggestions = [
    {
      category: 'Environmental',
      priority: 'high',
      suggestion: 'Implement renewable energy procurement strategy',
      impact: 'Reduce Scope 2 emissions by 40%',
      effort: 'medium',
      cost: '£15,000'
    },
    {
      category: 'Social',
      priority: 'medium',
      suggestion: 'Establish diversity and inclusion training program',
      impact: 'Improve gender pay gap by 5%',
      effort: 'low',
      cost: '£5,000'
    },
    {
      category: 'Governance',
      priority: 'low',
      suggestion: 'Enhance whistleblowing policy',
      impact: 'Strengthen compliance framework',
      effort: 'low',
      cost: '£2,000'
    }
  ];

  const costSavings = [
    { area: 'Energy Efficiency', potential: 25000, timeframe: '12 months' },
    { area: 'Waste Reduction', potential: 8000, timeframe: '6 months' },
    { area: 'Process Optimization', potential: 15000, timeframe: '9 months' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">ESG Insights & Analytics</h3>
        <div className="text-sm text-gray-400">
          AI-powered recommendations
        </div>
      </div>

      {/* Benchmarking */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h4 className="text-blue-400 font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Industry Benchmarking
        </h4>
        
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Select Industry</label>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value="technology">Technology</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="retail">Retail</option>
            <option value="finance">Finance</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {mockBenchmarks.find(b => b.industry === selectedIndustry)?.averages.carbonIntensity || 0.8}
            </div>
            <div className="text-sm text-gray-400">Avg Carbon Intensity (tCO2e/employee)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {mockBenchmarks.find(b => b.industry === selectedIndustry)?.averages.genderPayGap || 12.5}%
            </div>
            <div className="text-sm text-gray-400">Avg Gender Pay Gap</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {mockBenchmarks.find(b => b.industry === selectedIndustry)?.averages.boardDiversity || 35}%
            </div>
            <div className="text-sm text-gray-400">Avg Board Diversity</div>
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
        <h4 className="text-green-400 font-semibold mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2" />
          AI Improvement Suggestions
        </h4>
        
        <div className="space-y-4">
          {improvementSuggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    suggestion.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {suggestion.priority} priority
                  </span>
                  <span className="ml-2 text-sm text-gray-400">{suggestion.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-400">{suggestion.cost}</div>
                  <div className="text-xs text-gray-500">{suggestion.effort} effort</div>
                </div>
              </div>
              
              <h5 className="text-white font-medium mb-2">{suggestion.suggestion}</h5>
              <p className="text-sm text-gray-300">{suggestion.impact}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cost Savings Opportunities */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
        <h4 className="text-purple-400 font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Cost Savings Opportunities
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {costSavings.map((saving, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                £{(saving.potential / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-gray-400">{saving.area}</div>
              <div className="text-xs text-gray-500">{saving.timeframe}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ESG Score Trends */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
        <h4 className="text-yellow-400 font-semibold mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2" />
          ESG Score Trends
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">+8</div>
            <div className="text-sm text-gray-400">Environmental</div>
            <div className="text-xs text-green-400">↑ 12% YoY</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">+5</div>
            <div className="text-sm text-gray-400">Social</div>
            <div className="text-xs text-blue-400">↑ 8% YoY</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">+12</div>
            <div className="text-sm text-gray-400">Governance</div>
            <div className="text-xs text-purple-400">↑ 17% YoY</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">+8</div>
            <div className="text-sm text-gray-400">Overall</div>
            <div className="text-xs text-yellow-400">↑ 12% YoY</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 