import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAssessmentProgress } from '../../hooks/useAssessmentProgress';
import { useOracleData } from '../../hooks/useOracleData';
import { 
  DollarSign, TrendingUp, Shield, AlertTriangle, Gem,
  Target, CheckCircle, XCircle, Info, ChevronRight,
  Building2, Users, Zap, Brain, BarChart3, ArrowUpRight
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface AssetValue {
  name: string;
  currentValue: number;
  potentialValue: number;
  description: string;
}

interface Risk {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  mitigation: string;
}

export const Part3Review = () => {
  const { progress } = useAssessmentProgress();
  const { data } = useOracleData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Extract Part 3 responses
  const part3Answers = progress?.part3Answers || {};
  
  // Calculate business valuation based on answers
  const calculateBusinessValue = () => {
    const revenue = parseFloat(part3Answers.current_revenue || '0');
    const multiplier = part3Answers.business_model === 'SaaS' ? 4 : 
                      part3Answers.business_model === 'Service' ? 2 : 3;
    const currentValue = revenue * multiplier;
    const potentialValue = currentValue * 2.5; // Potential with optimization
    
    return {
      current: currentValue,
      potential: potentialValue,
      increase: ((potentialValue - currentValue) / currentValue) * 100
    };
  };

  const businessValue = calculateBusinessValue();

  // Identify hidden assets from answers
  const identifyHiddenAssets = (): AssetValue[] => {
    const assets: AssetValue[] = [];
    
    if (part3Answers.intellectual_property === 'yes') {
      assets.push({
        name: 'Intellectual Property',
        currentValue: businessValue.current * 0.1,
        potentialValue: businessValue.current * 0.25,
        description: 'Patents, trademarks, and proprietary processes'
      });
    }
    
    if (part3Answers.customer_database === 'yes') {
      assets.push({
        name: 'Customer Database',
        currentValue: businessValue.current * 0.15,
        potentialValue: businessValue.current * 0.3,
        description: 'Customer relationships and data insights'
      });
    }
    
    if (part3Answers.brand_recognition === 'strong') {
      assets.push({
        name: 'Brand Value',
        currentValue: businessValue.current * 0.2,
        potentialValue: businessValue.current * 0.4,
        description: 'Market reputation and brand equity'
      });
    }
    
    return assets;
  };

  const hiddenAssets = identifyHiddenAssets();

  // Identify risks from answers
  const identifyRisks = (): Risk[] => {
    const risks: Risk[] = [];
    
    if (part3Answers.key_person_dependency === 'high') {
      risks.push({
        name: 'Key Person Dependency',
        severity: 'high',
        impact: 'Business operations heavily dependent on founder',
        mitigation: 'Document processes and delegate responsibilities'
      });
    }
    
    if (part3Answers.customer_concentration === 'high') {
      risks.push({
        name: 'Customer Concentration',
        severity: 'medium',
        impact: 'Over-reliance on few major clients',
        mitigation: 'Diversify customer base and revenue streams'
      });
    }
    
    if (part3Answers.tech_debt === 'significant') {
      risks.push({
        name: 'Technical Debt',
        severity: 'medium',
        impact: 'Outdated systems limiting growth',
        mitigation: 'Gradual system modernization plan'
      });
    }
    
    return risks;
  };

  const risks = identifyRisks();

  const tabs = [
    { id: 'overview', label: 'Value Overview', icon: BarChart3 },
    { id: 'assets', label: 'Hidden Assets', icon: Gem },
    { id: 'risks', label: 'Risk Analysis', icon: Shield },
    { id: 'recommendations', label: 'Action Plan', icon: Target }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Hidden Value Analysis</h1>
        <p className="text-white/80 text-lg">
          Your business value assessment and growth opportunities
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h3 className="font-semibold text-gray-800">Current Value</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            £{(businessValue.current / 1000000).toFixed(1)}M
          </p>
          <p className="text-sm text-gray-600 mt-1">Based on current metrics</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Potential Value</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            £{(businessValue.potential / 1000000).toFixed(1)}M
          </p>
          <p className="text-sm text-gray-600 mt-1">With optimization</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpRight className="w-8 h-8 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Growth Potential</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {businessValue.increase.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-600 mt-1">Value increase possible</p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && <ValueOverviewTab businessValue={businessValue} assets={hiddenAssets} risks={risks} />}
        {activeTab === 'assets' && <HiddenAssetsTab assets={hiddenAssets} totalValue={businessValue} />}
        {activeTab === 'risks' && <RiskAnalysisTab risks={risks} />}
        {activeTab === 'recommendations' && <RecommendationsTab assets={hiddenAssets} risks={risks} />}
      </motion.div>

      {/* Action Buttons */}
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Ready to unlock your hidden value?</h3>
            <p className="text-sm text-gray-600">
              Your AI board can help you implement these recommendations
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/board')}
            >
              Consult AI Board
              <Brain className="w-4 h-4 ml-2" />
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-red-500"
              onClick={() => navigate('/dashboard/roadmap')}
            >
              View Action Plan
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Value Overview Tab
const ValueOverviewTab = ({ businessValue, assets, risks }: any) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Executive Summary</h3>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed">
            Your business currently has a valuation of <span className="font-semibold">£{(businessValue.current / 1000000).toFixed(1)}M</span>, 
            but our analysis reveals significant untapped potential. With strategic optimization of your hidden assets 
            and mitigation of key risks, we project a potential value of <span className="font-semibold">£{(businessValue.potential / 1000000).toFixed(1)}M</span> - 
            representing a <span className="font-semibold">{businessValue.increase.toFixed(0)}% increase</span>.
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Gem className="w-5 h-5 text-purple-500" />
                Key Hidden Assets
              </h4>
              <ul className="space-y-2">
                {assets.slice(0, 3).map((asset: AssetValue, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {asset.name}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Primary Risks
              </h4>
              <ul className="space-y-2">
                {risks.slice(0, 3).map((risk: Risk, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <XCircle className="w-4 h-4 text-red-500" />
                    {risk.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Value Bridge Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Value Bridge Analysis</h3>
        <div className="space-y-4">
          {/* Current Value Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Current Business Value</span>
              <span className="text-sm font-bold text-gray-800">£{(businessValue.current / 1000000).toFixed(1)}M</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 h-8 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>

          {/* Value Additions */}
          {assets.map((asset: AssetValue, idx: number) => {
            const increasePercent = ((asset.potentialValue - asset.currentValue) / businessValue.potential) * 100;
            return (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">+ {asset.name}</span>
                  <span className="text-sm font-bold text-green-600">
                    +£{((asset.potentialValue - asset.currentValue) / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="w-full bg-green-100 rounded-full h-6">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-6 rounded-full" 
                    style={{ width: `${increasePercent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}

          {/* Potential Value Bar */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Potential Business Value</span>
              <span className="text-sm font-bold text-purple-600">£{(businessValue.potential / 1000000).toFixed(1)}M</span>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-8">
              <div className="bg-gradient-to-r from-purple-400 to-purple-500 h-8 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Hidden Assets Tab
const HiddenAssetsTab = ({ assets, totalValue }: any) => {
  return (
    <div className="space-y-4">
      {assets.length > 0 ? (
        assets.map((asset: AssetValue, idx: number) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <Gem className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{asset.name}</h3>
                </div>
                
                <p className="text-gray-600 mb-4">{asset.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Value</p>
                    <p className="text-xl font-bold text-gray-800">
                      £{(asset.currentValue / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Potential Value</p>
                    <p className="text-xl font-bold text-purple-600">
                      £{(asset.potentialValue / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Value Realization</span>
                    <span className="text-sm font-medium text-purple-600">
                      +{(((asset.potentialValue - asset.currentValue) / asset.currentValue) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full"
                      style={{ width: `${(asset.currentValue / asset.potentialValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Card className="p-8 text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No significant hidden assets identified in your assessment.</p>
        </Card>
      )}
    </div>
  );
};

// Risk Analysis Tab
const RiskAnalysisTab = ({ risks }: any) => {
  const severityColors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    critical: 'red'
  };

  return (
    <div className="space-y-4">
      {risks.length > 0 ? (
        risks.map((risk: Risk, idx: number) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 bg-${severityColors[risk.severity]}-100 text-${severityColors[risk.severity]}-600 rounded-full flex items-center justify-center`}>
                <Shield className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{risk.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${severityColors[risk.severity]}-100 text-${severityColors[risk.severity]}-700`}>
                    {risk.severity.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Impact</p>
                    <p className="text-gray-700">{risk.impact}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Mitigation Strategy</p>
                    <p className="text-gray-700">{risk.mitigation}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Card className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No significant risks identified. Your business is well-positioned!</p>
        </Card>
      )}
    </div>
  );
};

// Recommendations Tab
const RecommendationsTab = ({ assets, risks }: any) => {
  const recommendations = [
    {
      priority: 'high',
      title: 'Maximize Hidden Asset Value',
      description: 'Focus on extracting value from identified hidden assets',
      timeline: '0-3 months',
      impact: 'High',
      steps: [
        'Document and protect intellectual property',
        'Leverage customer data for insights',
        'Strengthen brand positioning'
      ]
    },
    {
      priority: 'medium',
      title: 'Mitigate Key Risks',
      description: 'Address critical vulnerabilities to protect value',
      timeline: '3-6 months',
      impact: 'Medium',
      steps: [
        'Reduce key person dependencies',
        'Diversify revenue streams',
        'Address technical debt systematically'
      ]
    },
    {
      priority: 'low',
      title: 'Scale and Optimize',
      description: 'Build systems for sustainable growth',
      timeline: '6-12 months',
      impact: 'Long-term',
      steps: [
        'Implement scalable processes',
        'Build strategic partnerships',
        'Explore new market opportunities'
      ]
    }
  ];

  const priorityColors = {
    high: 'red',
    medium: 'yellow',
    low: 'green'
  };

  return (
    <div className="space-y-4">
      {recommendations.map((rec, idx) => (
        <Card key={idx} className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 bg-${priorityColors[rec.priority]}-100 text-${priorityColors[rec.priority]}-600 rounded-full flex items-center justify-center`}>
              <Target className="w-5 h-5" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{rec.title}</h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${priorityColors[rec.priority]}-100 text-${priorityColors[rec.priority]}-700`}>
                  {rec.priority.toUpperCase()} PRIORITY
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{rec.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Timeline</p>
                  <p className="font-medium text-gray-800">{rec.timeline}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected Impact</p>
                  <p className="font-medium text-gray-800">{rec.impact}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Action Steps:</p>
                <ul className="space-y-1">
                  {rec.steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}; 