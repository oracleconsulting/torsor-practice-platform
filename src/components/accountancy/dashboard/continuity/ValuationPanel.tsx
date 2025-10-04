import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { PracticeValuation } from '../../../types/accountancy';
import { continuityAPI } from '../../../services/accountancy/accountancyApiService';

export const ValuationPanel: React.FC = () => {
  const [methodology, setMethodology] = useState<'GRF' | 'EBITDA' | 'HYBRID'>('GRF');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);

  const mockValuation: PracticeValuation = {
    id: '1',
    practiceId: 'practice-1',
    valuationDate: new Date(),
    methodology: 'GRF',
    grf: {
      annualRecurringRevenue: 850000,
      multiple: 1.2,
      adjustments: {
        clientConcentration: -0.1,
        growthRate: 0.15,
        profitability: 0.05
      }
    },
    ebitda: {
      earnings: 250000,
      multiple: 4.5,
      addBacks: {
        ownerCompensation: 120000,
        personalExpenses: 15000,
        oneOffCosts: 5000
      }
    },
    perClient: {
      clientCount: 425,
      avgValuePerClient: 1200,
      qualityAdjustment: 0.95
    },
    calculatedValue: 1250000,
    previousValue: 1100000,
    growthRate: 12.5
  };

  const calculateValue = async () => {
    setIsCalculating(true);
    try {
      // Mock calculation - in real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCalculatedValue(mockValuation.calculatedValue);
    } catch (error) {
      console.error('Valuation calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Practice Valuation</h3>
        <div className="text-sm text-gray-400">
          Last updated: {mockValuation.valuationDate.toLocaleDateString()}
        </div>
      </div>

      {/* Methodology Selection */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
        <h4 className="text-purple-400 font-semibold mb-4">Valuation Methodology</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setMethodology('GRF')}
            className={`p-3 rounded-lg border transition-colors ${
              methodology === 'GRF'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Gross Recurring Fees</div>
              <div className="text-xs opacity-75">0.8-1.5x multiple</div>
            </div>
          </button>
          
          <button
            onClick={() => setMethodology('EBITDA')}
            className={`p-3 rounded-lg border transition-colors ${
              methodology === 'EBITDA'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="text-center">
              <Calculator className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">EBITDA</div>
              <div className="text-xs opacity-75">3-6x multiple</div>
            </div>
          </button>
          
          <button
            onClick={() => setMethodology('HYBRID')}
            className={`p-3 rounded-lg border transition-colors ${
              methodology === 'HYBRID'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Hybrid</div>
              <div className="text-xs opacity-75">Weighted average</div>
            </div>
          </button>
        </div>
      </div>

      {/* Current Value Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {formatValue(mockValuation.calculatedValue)}
          </div>
          <div className="text-sm text-gray-400">Current Value</div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {formatValue(mockValuation.previousValue)}
          </div>
          <div className="text-sm text-gray-400">Previous Value</div>
        </div>
        
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            +{mockValuation.growthRate}%
          </div>
          <div className="text-sm text-gray-400">Growth Rate</div>
        </div>
      </div>

      {/* Valuation Details */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-4">Valuation Details</h4>
        
        {methodology === 'GRF' && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Annual Recurring Revenue:</span>
              <span className="text-white">£{mockValuation.grf.annualRecurringRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Multiple:</span>
              <span className="text-white">{mockValuation.grf.multiple}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Client Concentration Adjustment:</span>
              <span className="text-red-400">{mockValuation.grf.adjustments.clientConcentration * 100}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Growth Rate Adjustment:</span>
              <span className="text-green-400">+{mockValuation.grf.adjustments.growthRate * 100}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Profitability Adjustment:</span>
              <span className="text-green-400">+{mockValuation.grf.adjustments.profitability * 100}%</span>
            </div>
          </div>
        )}
        
        {methodology === 'EBITDA' && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">EBITDA:</span>
              <span className="text-white">£{mockValuation.ebitda.earnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Multiple:</span>
              <span className="text-white">{mockValuation.ebitda.multiple}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Owner Compensation Add-back:</span>
              <span className="text-white">£{mockValuation.ebitda.addBacks.ownerCompensation.toLocaleString()}</span>
            </div>
          </div>
        )}
        
        {methodology === 'HYBRID' && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">GRF Value:</span>
              <span className="text-white">£{(mockValuation.grf.annualRecurringRevenue * mockValuation.grf.multiple).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">EBITDA Value:</span>
              <span className="text-white">£{(mockValuation.ebitda.earnings * mockValuation.ebitda.multiple).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Weighted Average:</span>
              <span className="text-white">£{mockValuation.calculatedValue.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center">
        <button
          onClick={calculateValue}
          disabled={isCalculating}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isCalculating ? 'Calculating...' : 'Calculate Value'}
        </button>
      </div>
    </div>
  );
}; 