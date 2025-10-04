import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';

export const ReadinessCenter: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'documentation' | 'financial' | 'operational' | 'legal'>('documentation');

  const mockReadinessData = {
    score: 68,
    lastAssessed: new Date(),
    categories: {
      documentation: {
        score: 60,
        gaps: ['Missing operations manual', 'No documented client procedures'],
        items: {
          operationsManual: false,
          clientProcedures: false,
          successionAgreement: true,
          shareholderAgreement: true
        }
      },
      financial: {
        score: 75,
        gaps: ['Client concentration risk'],
        items: {
          cleanAccounts: true,
          recurringRevenue: 85,
          profitability: true,
          debtorsControl: true
        }
      },
      operational: {
        score: 55,
        gaps: ['Key person dependency', 'Systems not documented'],
        items: {
          keyPersonDependency: false,
          systemsDocumented: false,
          clientRelationships: true,
          staffRetention: true
        }
      },
      legal: {
        score: 80,
        gaps: [],
        items: {
          clientContracts: true,
          employmentContracts: true,
          intellectualProperty: true,
          regulatoryCompliance: true
        }
      }
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

  const categories = [
    { id: 'documentation', label: 'Documentation', icon: '📋' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'operational', label: 'Operational', icon: '⚙️' },
    { id: 'legal', label: 'Legal', icon: '⚖️' }
  ];

  const currentCategory = mockReadinessData.categories[activeCategory];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Succession Readiness Assessment</h3>
        <div className="text-sm text-gray-400">
          Last assessed: {mockReadinessData.lastAssessed.toLocaleDateString()}
        </div>
      </div>

      {/* Overall Score */}
      <div className={`${getScoreBg(mockReadinessData.score)} border rounded-lg p-6 text-center`}>
        <div className="text-4xl font-bold mb-2">
          <span className={getScoreColor(mockReadinessData.score)}>
            {mockReadinessData.score}/100
          </span>
        </div>
        <div className="text-gray-300 mb-4">Overall Readiness Score</div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              mockReadinessData.score >= 80 ? 'bg-green-500' :
              mockReadinessData.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${mockReadinessData.score}%` }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id as any)}
            className={`p-3 rounded-lg border transition-colors ${
              activeCategory === category.id
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="text-center">
              <div className="text-lg mb-1">{category.icon}</div>
              <div className="text-sm font-medium">{category.label}</div>
              <div className={`text-xs mt-1 ${
                getScoreColor(mockReadinessData.categories[category.id as keyof typeof mockReadinessData.categories].score)
              }`}>
                {mockReadinessData.categories[category.id as keyof typeof mockReadinessData.categories].score}%
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Category Details */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-semibold text-white">
            {categories.find(c => c.id === activeCategory)?.label} Readiness
          </h4>
          <div className={`text-2xl font-bold ${getScoreColor(currentCategory.score)}`}>
            {currentCategory.score}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              currentCategory.score >= 80 ? 'bg-green-500' :
              currentCategory.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${currentCategory.score}%` }}
          />
        </div>

        {/* Assessment Items */}
        <div className="space-y-4">
          {Object.entries(currentCategory.items).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center">
                {typeof value === 'boolean' ? (
                  value ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mr-3" />
                  )
                ) : (
                  <TrendingUp className="w-5 h-5 text-blue-400 mr-3" />
                )}
                <span className="text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <div className="text-right">
                {typeof value === 'boolean' ? (
                  <span className={value ? 'text-green-400' : 'text-red-400'}>
                    {value ? 'Complete' : 'Incomplete'}
                  </span>
                ) : (
                  <span className="text-blue-400">{value}%</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Gaps */}
        {currentCategory.gaps.length > 0 && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h5 className="text-red-400 font-semibold">Critical Gaps</h5>
            </div>
            <ul className="space-y-2">
              {currentCategory.gaps.map((gap, index) => (
                <li key={index} className="text-gray-300 flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Plan */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-3">Recommended Actions</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">Create operations manual</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">Document client procedures</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">Reduce key person dependency</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">Diversify client base</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 